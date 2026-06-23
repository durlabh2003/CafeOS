import { useState, useEffect, useRef } from 'react';
import { useCafe } from '../../context/CafeContext';
import { printKOT } from '../../utils/printerSupport';

const KDSTicketCard = ({ order, onNextStatus, menu, stationFilter }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const diffMs = Date.now() - new Date(order.timestamp).getTime();
      setElapsed(Math.max(0, Math.floor(diffMs / 1000)));
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.timestamp]);

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = elapsed / 60;
  let borderColor = 'var(--color-border)';
  let badgeColor = 'badge-success';
  let pulseClass = '';

  if (elapsedMinutes >= 15) {
    borderColor = 'var(--color-danger)';
    badgeColor = 'badge-danger';
    pulseClass = 'animate-pulse';
  } else if (elapsedMinutes >= 5) {
    borderColor = 'var(--color-warning)';
    badgeColor = 'badge-warning';
  }

  return (
    <div className={`premium-card animate-scale-in ${pulseClass}`} style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${borderColor}`, overflow: 'hidden', height: '340px' }}>
      <div style={{ padding: '16px 20px', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Table {order.tableId.slice(-2)}</h4>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>ID: {order.orderNumber} | {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <span className={`badge ${badgeColor}`} style={{ fontSize: '12px', padding: '4px 10px', fontWeight: '800' }}>⏱️ {formatElapsed(elapsed)}</span>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {order.items
          .filter(item => {
            if (stationFilter === 'All') return true;
            const menuItem = menu.find(m => m.id === item.id);
            if (!menuItem) return true;
            if (stationFilter === 'Beverages' && menuItem.category === 'Beverages') return true;
            if (stationFilter === 'Food' && menuItem.category !== 'Beverages') return true;
            return false;
          })
          .map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px dashed var(--color-border)', paddingBottom: '12px' }}>
            <div className="flex-between">
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-primary)' }}><span style={{ color: 'var(--color-kds)' }}>{item.qty}x</span> {item.name}</span>
              {item.variant && <span className="badge" style={{ fontSize: '11px', background: 'var(--color-owner)', color: '#fff', fontWeight: '800' }}>{item.variant}</span>}
            </div>
            {item.addOns?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {item.addOns.map((add, i) => (
                  <span key={i} style={{ fontSize: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#db2777', padding: '4px 8px', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(236, 72, 153, 0.2)' }}>+ {add}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {order.notes && <div style={{ marginTop: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#d97706', fontWeight: '800' }}>💡 Notes: {order.notes}</div>}
      </div>

      <div style={{ padding: '16px 20px', background: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: (order.status === 'New' || order.status === 'Preparing') ? '12px' : '0' }}>
          <button className="btn-secondary" onClick={async () => {
            const res = await printKOT(order, `Table ${order.tableId.slice(-2)}`);
            if (!res.success) alert(res.message);
          }} style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }}>
            🖨️ Print Ticket
          </button>
        </div>
        {order.status === 'New' && (
          <button className="btn-primary" onClick={() => onNextStatus(order.id, 'Preparing')} style={{ width: '100%', justifyContent: 'center', background: 'var(--color-warning)', padding: '12px' }}>👨‍🍳 Start Preparing</button>
        )}
        {order.status === 'Preparing' && (
          <button className="btn-primary" onClick={() => onNextStatus(order.id, 'Ready')} style={{ width: '100%', justifyContent: 'center', background: 'var(--color-success)', padding: '12px' }}>🔔 Order Ready</button>
        )}
      </div>
    </div>
  );
};

export default function ChefDashboard() {
  const { currentStaff, logoutStaff, orders, updateOrderStatus, menu } = useCafe();
  const [stationFilter, setStationFilter] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const prevOrdersCountRef = useRef(orders.filter(o => o.status === 'New').length);

  useEffect(() => {
    const currentNewOrders = orders.filter(o => o.status === 'New').length;
    if (soundEnabled && currentNewOrders > prevOrdersCountRef.current) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio autoplay blocked by browser', e));
      } catch (err) {
        console.log('Audio play failed', err);
      }
    }
    prevOrdersCountRef.current = currentNewOrders;
  }, [orders, soundEnabled]);

  const activeKdsOrders = orders.filter(o => o.status === 'New' || o.status === 'Preparing');
  const historyKdsOrders = orders.filter(o => o.status === 'Ready' || o.status === 'Served');

  // Filter out orders that have NO items for the selected station
  const filteredActiveOrders = activeKdsOrders.filter(order => {
    if (stationFilter === 'All') return true;
    const hasItemsForStation = order.items.some(item => {
      const menuItem = menu.find(m => m.id === item.id);
      if (!menuItem) return true;
      if (stationFilter === 'Beverages' && menuItem.category === 'Beverages') return true;
      if (stationFilter === 'Food' && menuItem.category !== 'Beverages') return true;
      return false;
    });
    return hasItemsForStation;
  });

  return (
    <div className="theme-kds app-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', background: 'var(--color-bg-input)', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#ffffff', borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', zIndex: 10 }}>
        <div>
          <h2 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>🍳 Kitchen KDS Display</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Live preparation queue. Connected via WebSocket simulation.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '4px', border: '1px solid var(--color-border)', marginRight: '16px' }}>
            {['All', 'Food', 'Beverages'].map(f => (
              <button
                key={f}
                onClick={() => setStationFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                  background: stationFilter === f ? 'var(--color-kds)' : 'transparent',
                  color: stationFilter === f ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none', transition: 'all 0.2s'
                }}
              >
                {f} Station
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginRight: '8px' }}>
            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '700' }}>👨‍🍳 {currentStaff?.name}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>Chef</span>
          </div>

          <button className="btn-secondary" onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: '10px 14px' }}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button className="btn-secondary" onClick={() => setShowHistory(!showHistory)} style={{ padding: '10px 20px' }}>
            📜 History ({historyKdsOrders.length})
          </button>

          <button className="btn-danger" onClick={logoutStaff}>
            Exit KDS
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', position: 'relative' }}>
        {filteredActiveOrders.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredActiveOrders.map(order => (
              <KDSTicketCard key={order.id} order={order} onNextStatus={updateOrderStatus} menu={menu} stationFilter={stationFilter} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: '96px', display: 'block', marginBottom: '24px', opacity: 0.8 }}>🍳</span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>All Clear! No Active Tickets</h3>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>The queue is empty. Waiting for new orders to arrive.</p>
          </div>
        )}

      </div>

      {showHistory && (
        <div className="premium-card" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '400px', borderRadius: '0', borderRight: 'none', borderTop: 'none', borderBottom: 'none', boxShadow: '-8px 0 24px rgba(0,0,0,0.1)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 100, background: '#fff' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Ticket History</h3>
            <button className="btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
            {historyKdsOrders.slice(0, 50).map(order => (
              <div key={order.id} className="premium-card" style={{ padding: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>Table {order.tableId.slice(-2)} ({order.orderNumber})</strong>
                  <span className="badge badge-success">Completed</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>{order.items.map(it => `${it.qty}x ${it.name}`).join(', ')}</div>
                <button className="btn-secondary" onClick={() => updateOrderStatus(order.id, 'Preparing')} style={{ fontSize: '11px', padding: '6px 12px', marginTop: '12px' }}>Recall Ticket</button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
