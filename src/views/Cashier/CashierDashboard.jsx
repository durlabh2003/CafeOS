import { useState, useEffect, useRef, useCallback } from 'react';
import { useCafe } from '../../context/CafeContext';
import { printKOT } from '../../utils/printerSupport';

export default function CashierDashboard() {
  const {
    currentStaff,
    logoutStaff,
    menu,
    tables,
    orders,
    crm,
    payments,
    placeOrder,
    updateOrderStatus,
    getConsolidatedBill,
    checkoutSession,
    verifyOtp,
    processTakeaway,
    closeShift,
    updateTableStatus,
    cafeProfile,
    transferTable,
    simulateDeliveryOrder
  } = useCafe();

  const [activeTab, setActiveTab] = useState('pos');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus Search: Alt+S or Ctrl/Cmd+K
      if ((e.altKey || e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'k')) {
        e.preventDefault();
        document.getElementById('pos-search')?.focus();
      }

      // Add First Item: Enter (when search is focused)
      if (e.key === 'Enter' && document.activeElement?.id === 'pos-search') {
        e.preventDefault();
        const filteredMenu = menu
          .filter(item => item.status === 'Active')
          .filter(item => orderCategory === 'All' || item.category === orderCategory)
          .filter(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()));
          
        if (filteredMenu.length > 0) {
          handleAddToPosCart(filteredMenu[0]);
          setOrderSearch('');
        }
      }

      // Confirm Order: Ctrl/Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (posCart.length > 0) handleConfirmPOSOrder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menu, orderCategory, orderSearch, posCart, selectedTableId]);

  const [checkInForm, setCheckInForm] = useState({ name: '', mobile: '' });
  const [posCart, setPosCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderCategory, setOrderCategory] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Order Edit Window
  const [pendingCart, setPendingCart] = useState(null);
  const [pendingNotes, setPendingNotes] = useState('');
  const [editTimer, setEditTimer] = useState(0);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [paymentSplit, setPaymentSplit] = useState([
    { mode: 'UPI', amount: 0 },
    { mode: 'Cash', amount: 0 },
    { mode: 'Card', amount: 0 }
  ]);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');

  // Waitlist State
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', mobile: '', pax: 2, time: '' });

  const [orderFilter, setOrderFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [actualCash, setActualCash] = useState(0);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationOrders = orders.filter(o => 
    o.status === 'Ready' || 
    (o.status === 'New' && (o.source === 'Zomato' || o.source === 'Swiggy'))
  );

  const handleNotificationAction = (order) => {
    if (order.status === 'New') {
      // Accept delivery order
      updateOrderStatus(order.id, 'Preparing');
    } else {
      // Dismiss ready order
      if (order.source === 'Zomato' || order.source === 'Swiggy') {
        updateOrderStatus(order.id, 'Completed');
      } else {
        updateOrderStatus(order.id, 'Served');
      }
    }
  };

  // Shift Calculations (Based on today's payments for this staff member)
  const today = new Date().toDateString();
  const shiftPayments = payments.filter(p => new Date(p.timestamp).toDateString() === today);
  const shiftCash = shiftPayments.filter(p => p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0);
  const shiftUPI = shiftPayments.filter(p => p.mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);
  const shiftCard = shiftPayments.filter(p => p.mode === 'Card').reduce((sum, p) => sum + p.amount, 0);
  const shiftVariance = actualCash - shiftCash;

  // Kitchen Notifications
  const prevOrdersRef = useRef(orders);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const newlyReady = orders.filter(o => 
      o.status === 'Ready' && 
      !prevOrdersRef.current.find(prev => prev.id === o.id && prev.status === 'Ready')
    );

    if (newlyReady.length > 0) {
      const newToasts = newlyReady.map(o => ({
        id: o.id + '-' + Date.now(),
        message: `Order ${o.orderNumber} is Ready for ${tables.find(t => t.id === o.tableId)?.name || 'Takeaway'}`
      }));
      setToasts(prev => [...prev, ...newToasts]);
      
      // Auto-remove after 10s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => !newToasts.find(nt => nt.id === t.id)));
      }, 10000);
    }
    prevOrdersRef.current = orders;
  }, [orders, tables]);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const executePlaceOrder = useCallback(() => {
    const sessionMobile = tables.find(t => t.id === selectedTableId)?.currentSession?.mobile || '+91 99999 99999';
    placeOrder(selectedTableId, sessionMobile, pendingCart, pendingNotes, 'Counter');
    setPendingCart(null);
    setPendingNotes('');
  }, [tables, selectedTableId, pendingCart, pendingNotes, placeOrder]);

  // Timer effect for Order Edit Window
  useEffect(() => {
    let interval;
    if (editTimer > 0) {
      interval = setInterval(() => {
        setEditTimer(prev => prev - 1);
      }, 1000);
    } else if (editTimer === 0 && pendingCart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      executePlaceOrder();
    }
    return () => clearInterval(interval);
  }, [editTimer, pendingCart, executePlaceOrder]);

  // If table selection changes, auto-confirm any pending order
  useEffect(() => {
    if (pendingCart && editTimer > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      executePlaceOrder();
      setEditTimer(0);
    }
  }, [selectedTableId, pendingCart, editTimer, executePlaceOrder]);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeTableOrders = selectedTableId
    ? orders.filter(o => o.tableId === selectedTableId && o.status !== 'Completed' && o.status !== 'Cancelled')
    : [];

  const activeBill = selectedTableId ? getConsolidatedBill(selectedTableId) : null;
  const activeCustomer = selectedTable?.currentSession ? crm[selectedTable.currentSession.mobile] : null;

  const handleCheckIn = (e) => {
    e.preventDefault();
    if (!checkInForm.mobile) return;
    let mob = checkInForm.mobile;
    if (!mob.startsWith('+91')) mob = '+91 ' + mob;
    verifyOtp(selectedTableId, mob, checkInForm.name || 'Walk-In Guest');
    setCheckInForm({ name: '', mobile: '' });
  };

  const handleAddToPosCart = (item, selectedVariant = null, selectedAddOns = []) => {
    let itemPrice = item.price;
    let variantName = '';
    if (selectedVariant) {
      itemPrice += selectedVariant.priceOffset;
      variantName = selectedVariant.name;
    }
    const addOnTotal = selectedAddOns.reduce((sum, add) => sum + add.price, 0);
    const addOnNames = selectedAddOns.map(a => a.name);
    const finalPrice = itemPrice + addOnTotal;
    const cartKey = `${item.id}-${variantName}-${addOnNames.join(',')}`;

    setPosCart(prev => {
      const existing = prev.find(it => it.cartKey === cartKey);
      if (existing) {
        return prev.map(it => it.cartKey === cartKey ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...prev, {
        cartKey,
        id: item.id,
        name: item.name,
        variant: variantName,
        addOns: addOnNames,
        price: finalPrice,
        qty: 1
      }];
    });
  };

  const handleConfirmPOSOrder = () => {
    if (posCart.length === 0) return;
    
    if (selectedTableId === 'TAKEAWAY') {
      // Takeaway logic: go to billing immediately
      setPaymentSplit([
        { mode: 'UPI', amount: posCart.reduce((sum, it) => sum + (it.price * it.qty), 0) * (1 + cafeProfile.gstPercentage / 100) },
        { mode: 'Cash', amount: 0 },
        { mode: 'Card', amount: 0 }
      ]);
      setDiscountPercent(0);
      setRedeemedPoints(0);
      setShowBillingModal(true);
      return;
    }

    // Start 30-second edit window
    setPendingCart([...posCart]);
    setPendingNotes(orderNotes);
    setPosCart([]);
    setOrderNotes('');
    setEditTimer(30);
  };

  const handleCancelPending = () => {
    setPosCart(pendingCart);
    setOrderNotes(pendingNotes);
    setPendingCart(null);
    setPendingNotes('');
    setEditTimer(0);
  };

  const handleConfirmPendingNow = () => {
    executePlaceOrder();
    setEditTimer(0);
  };

  const handleOpenBilling = () => {
    const bill = getConsolidatedBill(selectedTableId);
    setPaymentSplit([
      { mode: 'UPI', amount: bill.grandTotal },
      { mode: 'Cash', amount: 0 },
      { mode: 'Card', amount: 0 }
    ]);
    setDiscountPercent(0);
    setRedeemedPoints(0);
    setShowBillingModal(true);
  };

  const calculateBillTotals = () => {
    let sub;
    let gstAmount;
    let grand;
    
    if (selectedTableId === 'TAKEAWAY' && posCart.length > 0) {
      sub = posCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      gstAmount = Math.round((sub * cafeProfile.gstPercentage) / 100);
      grand = sub + gstAmount;
    } else if (activeBill) {
      sub = activeBill.subtotal;
      gstAmount = activeBill.gstAmount;
      grand = activeBill.grandTotal;
    } else {
      return { subtotal: 0, gst: 0, grand: 0, discount: 0, pointsVal: 0, net: 0 };
    }

    const discountVal = Math.round((sub * discountPercent) / 100);
    const loyaltyVal = Math.round(redeemedPoints * (activeCustomer?.points >= redeemedPoints ? 0.1 : 0));
    const netGrand = Math.max(0, grand - discountVal - loyaltyVal);
    
    return {
      subtotal: sub,
      gst: gstAmount,
      grand: grand,
      discount: discountVal,
      pointsVal: loyaltyVal,
      net: netGrand
    };
  };

  const billTotals = calculateBillTotals();

  const handleSettlement = async () => {
    const totalCollected = paymentSplit.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    if (Math.round(totalCollected) !== Math.round(billTotals.net)) {
      setToasts(prev => [...prev, { id: 'pay-err-' + Date.now(), message: `❌ Payment mismatched! Collected: ₹${totalCollected}, Required: ₹${billTotals.net}` }]);
      setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('pay-err-'))), 6000);
      return;
    }

    if (selectedTableId === 'TAKEAWAY') {
      const mob = checkInForm.mobile || '+91 00000 00000';
      await processTakeaway(mob, posCart, orderNotes, paymentSplit, totalCollected, billTotals.discount + billTotals.pointsVal, redeemedPoints);
      setPosCart([]);
      setOrderNotes('');
      setCheckInForm({ name: '', mobile: '' });
      setIsOrdering(false);
    } else {
      await checkoutSession(selectedTableId, paymentSplit, totalCollected, billTotals.discount + billTotals.pointsVal, redeemedPoints);
    }

    setShowBillingModal(false);
    setSelectedTableId(null);
    setToasts(prev => [...prev, { id: 'settle-' + Date.now(), message: '✅ Bill settled successfully!' }]);
    setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('settle-'))), 5000);
  };

  const getTableStatusClass = (status) => {
    switch (status) {
      case 'Available': return 'var(--color-bg-base)';
      case 'Occupied': return 'rgba(79, 70, 229, 0.04)';
      case 'Billing Pending': return 'rgba(245, 158, 11, 0.04)';
      default: return 'var(--color-bg-base)';
    }
  };

  const getTableBorderColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--color-border)';
      case 'Occupied': return 'var(--color-pos)';
      case 'Billing Pending': return 'var(--color-warning)';
      default: return 'var(--color-border)';
    }
  };

  return (
    <div className="theme-pos app-container animate-fade-in" style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ width: '260px', background: '#ffffff', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 10, overflowY: 'auto' }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-owner)', letterSpacing: '-0.5px' }}>CaféOS</h2>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-pos)', letterSpacing: '1px', marginTop: '4px' }}>Counter Operations</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Dashboard</div>
          {[
            { id: 'pos', icon: '🖥️', label: 'POS & Tables' },
            { id: 'orders', icon: '📋', label: 'Active Orders' },
            { id: 'delivery', icon: '🛵', label: 'Delivery Apps' },
            { id: 'customers', icon: '👥', label: 'Customers' },
            { id: 'reservations', icon: '📅', label: 'Reservations' },
            { id: 'shift', icon: '💰', label: 'Shift & Cash' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
                fontSize: '15px', fontWeight: '600', transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--color-pos)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', marginTop: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--color-pos)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              {currentStaff?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{currentStaff?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{currentStaff?.role}</div>
            </div>
          </div>
          <button 
            className="btn-danger" 
            onClick={logoutStaff}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            🚪 Log Out POS
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Global Notifications Bell */}
        <div style={{ position: 'absolute', top: '16px', right: '24px', zIndex: 100 }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '20px' }}>🔔</span>
              {notificationOrders.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '99px',
                  border: '2px solid #ffffff'
                }}>
                  {notificationOrders.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '56px',
                right: '0',
                width: '380px',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '450px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: '800', fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  Notifications ({notificationOrders.length})
                </div>
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notificationOrders.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No new notifications
                    </div>
                  ) : (
                    notificationOrders.map(order => {
                      const isNewDelivery = order.status === 'New' && (order.source === 'Zomato' || order.source === 'Swiggy');
                      
                      return (
                        <div key={order.id} className="premium-card animate-fade-in" style={{ 
                          padding: '14px', 
                          background: isNewDelivery ? 'var(--color-warning)' : 'var(--color-success)', 
                          color: isNewDelivery ? 'var(--color-text-primary)' : '#ffffff', 
                          border: 'none', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          boxShadow: isNewDelivery ? '0 4px 12px rgba(245, 158, 11, 0.2)' : '0 4px 12px rgba(16, 185, 129, 0.2)' 
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', lineHeight: '1.4' }}>
                            {isNewDelivery ? (
                              <>🔥 New {order.source} Order #{order.orderNumber}</>
                            ) : (
                              <>🔔 Order #{order.orderNumber} is Ready for {tables.find(t => t.id === order.tableId)?.name || 'Takeaway'}</>
                            )}
                          </div>
                          <button 
                            onClick={() => handleNotificationAction(order)}
                            style={{ 
                              background: isNewDelivery ? 'var(--color-pos)' : 'rgba(255,255,255,0.25)', 
                              border: 'none', 
                              color: '#fff', 
                              borderRadius: isNewDelivery ? '6px' : '50%', 
                              width: isNewDelivery ? 'auto' : '28px', 
                              height: '28px', 
                              padding: isNewDelivery ? '0 12px' : '0',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              cursor: 'pointer', 
                              flexShrink: 0, 
                              marginLeft: '12px', 
                              fontSize: isNewDelivery ? '12px' : '16px',
                              fontWeight: isNewDelivery ? '700' : 'normal'
                            }}
                          >
                            {isNewDelivery ? 'Accept' : '×'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- POS TAB --- */}
        {activeTab === 'pos' && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
        
        {/* Table Grid (Left) */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', borderRight: '1px solid var(--color-border)' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Floor Layout & Tables</h2>
            <button className="btn-primary" onClick={() => { setSelectedTableId('TAKEAWAY'); setIsOrdering(true); }} style={{ background: 'var(--color-owner)' }}>
              🛍️ New Takeaway Order
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {tables.map(table => {
              const isSelected = selectedTableId === table.id;
              const tableOrders = orders.filter(o => o.tableId === table.id && o.status !== 'Completed' && o.status !== 'Cancelled');
              const totalItemsCount = tableOrders.reduce((sum, o) => sum + (o.items?.reduce((s, it) => s + it.qty, 0) || 0), 0);
              const totalValue = tableOrders.reduce((sum, o) => sum + o.amount, 0);

              let displayStatus = table.status;
              if (table.status === 'Occupied') {
                const hasReadyToServe = tableOrders.some(o => o.status === 'Ready');
                if (hasReadyToServe) displayStatus = 'Billing Pending';
              }

              return (
                <div
                  key={table.id}
                  onClick={() => { setSelectedTableId(table.id); setIsOrdering(false); }}
                  className="premium-card-interactive"
                  style={{
                    background: isSelected ? '#ffffff' : getTableStatusClass(displayStatus),
                    borderColor: isSelected ? 'var(--color-pos)' : getTableBorderColor(displayStatus),
                    borderWidth: isSelected ? '2px' : '1px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex-between">
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{table.name}</span>
                    <span className={`badge ${displayStatus === 'Available' ? 'badge-neutral' : displayStatus === 'Billing Pending' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                      {displayStatus}
                    </span>
                  </div>

                  {table.currentSession ? (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>👤 {crm[table.currentSession.mobile]?.name || 'Guest'}</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>📱 {table.currentSession.mobile}</div>
                      {totalItemsCount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', marginTop: '6px' }}>
                          <span style={{ fontWeight: '500' }}>🍔 {totalItemsCount} items</span>
                          <span style={{ fontWeight: '800', color: 'var(--color-text-primary)' }}>₹{totalValue}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 'auto 0 0', fontWeight: '500' }}>Tap to Manage Table</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Table Tray */}
        <div style={{ width: '480px', background: '#ffffff', padding: '32px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.02)', zIndex: 5 }}>
          {selectedTableId === 'TAKEAWAY' ? (
            <>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Takeaway Queue</h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Pre-paid order creation</span>
                </div>
                <button className="btn-secondary" onClick={() => { setSelectedTableId(null); setIsOrdering(false); }}>Close</button>
              </div>
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                <div className="premium-card" style={{ padding: '16px' }}>
                  <input type="tel" placeholder="Customer Mobile (Optional)" value={checkInForm.mobile} onChange={e => setCheckInForm({...checkInForm, mobile: e.target.value})} style={{ width: '100%', fontSize: '14px' }} />
                </div>
              </div>
            </>
          ) : selectedTable ? (
            <>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', color: 'var(--color-text-primary)', fontWeight: '800' }}>{selectedTable.name}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Status: <strong style={{ color: 'var(--color-text-primary)' }}>{selectedTable.status}</strong></span>
                </div>
                <button className="btn-secondary" onClick={() => setSelectedTableId(null)}>
                  Close
                </button>
              </div>

              {pendingCart && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                  <div style={{ background: '#eff6ff', padding: '16px 24px', border: '1px solid #bfdbfe', borderRadius: '16px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>⏳ Pending confirmation...</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>{editTimer}s</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '16px' }}>Holding order to allow edits. It will auto-send to the kitchen in {editTimer}s.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
                      {pendingCart.map((it, idx) => (
                        <div key={idx} className="flex-between" style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '500' }}>
                          <span>{it.name} <span style={{ opacity: 0.6 }}>x{it.qty}</span></span>
                          <span style={{ fontWeight: '700' }}>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleCancelPending} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#ffffff', color: '#2563eb', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Edit Items</button>
                      <button onClick={handleConfirmPendingNow} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Send Now</button>
                    </div>
                  </div>
                </div>
              )}

              {!pendingCart && ['Available', 'Reserved', 'Cleaning'].includes(selectedTable.status) && !isOrdering && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div style={{ display: 'flex', gap: '8px', padding: '16px', background: 'var(--color-bg-base)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    {selectedTable.status === 'Available' && (
                      <>
                        <button className="btn-secondary" onClick={() => updateTableStatus(selectedTable.id, 'Reserved')} style={{ flex: 1, fontSize: '12px', padding: '8px' }}>📅 Mark Reserved</button>
                        <button className="btn-secondary" onClick={() => updateTableStatus(selectedTable.id, 'Cleaning')} style={{ flex: 1, fontSize: '12px', padding: '8px' }}>🧹 Mark Cleaning</button>
                      </>
                    )}
                    {selectedTable.status === 'Reserved' && (
                      <button className="btn-secondary" onClick={() => updateTableStatus(selectedTable.id, 'Available')} style={{ flex: 1, fontSize: '12px', padding: '8px' }}>❌ Cancel Reservation</button>
                    )}
                    {selectedTable.status === 'Cleaning' && (
                      <button className="btn-secondary" onClick={() => updateTableStatus(selectedTable.id, 'Available')} style={{ flex: 1, fontSize: '12px', padding: '8px', background: 'var(--color-success)', color: '#fff', border: 'none' }}>✨ Cleaned (Make Available)</button>
                    )}
                  </div>

                  {['Available', 'Reserved'].includes(selectedTable.status) && (
                    <>
                      <div className="premium-card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '16px', color: 'var(--color-text-primary)', marginBottom: '16px' }}>👤 Check-In Customer</h4>
                        <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Customer Name</span>
                            <input
                              type="text"
                              value={checkInForm.name}
                              onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
                              placeholder="e.g. Ramesh Patel"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Mobile Number *</span>
                            <input
                              type="tel"
                              value={checkInForm.mobile}
                              onChange={(e) => setCheckInForm({ ...checkInForm, mobile: e.target.value })}
                              placeholder="e.g. 9876543210"
                              required
                            />
                          </div>
                          <button type="submit" className="btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
                            {selectedTable.status === 'Reserved' ? 'Confirm Arrival & Assign Table' : 'Assign Table'}
                          </button>
                        </form>
                      </div>
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: '500' }}>OR</div>
                      <button className="btn-secondary" onClick={() => setIsOrdering(true)} style={{ justifyContent: 'center', padding: '16px', fontWeight: '600' }}>
                        🍔 Direct Order (Walk-In)
                      </button>
                    </>
                  )}
                </div>
              )}

              {!pendingCart && isOrdering && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
                  <div className="flex-between" style={{ flexShrink: 0 }}>
                    <h4 style={{ fontSize: '18px', color: 'var(--color-text-primary)', fontWeight: '800' }}>🍔 Add Items</h4>
                    <button onClick={() => { setIsOrdering(false); setPosCart([]); }} style={{ color: 'var(--color-danger)', fontSize: '14px', fontWeight: '600' }}>Cancel</button>
                  </div>
                  
                  <input
                    id="pos-search"
                    type="text"
                    placeholder="Search Menu (Alt+S)..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ fontSize: '14px', padding: '12px 16px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', flexShrink: 0 }}>
                    {['All', ...new Set(menu.filter(i => i.status === 'Active').map(item => item.category))].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setOrderCategory(cat)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '99px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: orderCategory === cat ? 'var(--color-pos)' : '#fff',
                          color: orderCategory === cat ? '#fff' : 'var(--color-text-secondary)',
                          border: `1px solid ${orderCategory === cat ? 'var(--color-pos)' : 'var(--color-border)'}`,
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px', minHeight: 0 }}>
                    {menu
                      .filter(item => item.status === 'Active')
                      .filter(item => orderCategory === 'All' || item.category === orderCategory)
                      .filter(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()))
                      .map(item => {
                        // Find if item exists in posCart (ignoring variants for basic UI simplicity)
                        const cartItem = posCart.find(c => c.id === item.id);
                        return (
                          <div key={item.id} className="premium-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{item.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>₹{item.price}</div>
                            </div>
                            
                            {cartItem ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-input)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--color-pos)' }}>
                                <button onClick={() => {
                                  setPosCart(prev => prev.map(c => c.cartKey === cartItem.cartKey ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
                                }} style={{ color: 'var(--color-text-primary)', fontWeight: '800', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '0 4px' }}>-</button>
                                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '700', width: '20px', textAlign: 'center' }}>{cartItem.qty}</span>
                                <button onClick={() => handleAddToPosCart(item)} style={{ color: 'var(--color-text-primary)', fontWeight: '800', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '0 4px' }}>+</button>
                              </div>
                            ) : (
                              <button className="btn-secondary" onClick={() => handleAddToPosCart(item)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                + Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {posCart.length > 0 && (
                    <div className="premium-card" style={{ padding: '20px', marginTop: 'auto' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '12px' }}>Cart Items ({posCart.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '16px' }}>
                        {posCart.map((it, idx) => (
                          <div key={idx} className="flex-between" style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                            <span>{it.name} <span style={{ opacity: 0.6, marginLeft: '4px' }}>x{it.qty}</span></span>
                            <span style={{ color: 'var(--color-text-primary)' }}>₹{it.price * it.qty}</span>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Kitchen instructions (optional)..."
                        rows="2"
                        style={{ width: '100%', marginBottom: '16px' }}
                      />
                      <button className="btn-primary" onClick={handleConfirmPOSOrder} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}>
                        {selectedTableId === 'TAKEAWAY' ? '💳 Pay & Send Order (Ctrl+P)' : '🔥 Send Order to KDS (Ctrl+P)'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!pendingCart && selectedTable.status === 'Occupied' && !isOrdering && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                  <div className="premium-card" style={{ padding: '20px', background: 'var(--color-bg-base)', borderColor: 'var(--color-border)' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '15px' }}>👤 {activeCustomer?.name || 'Walk-In Guest'}</span>
                      <span style={{ color: 'var(--color-warning)', fontWeight: '800', fontSize: '13px' }}>⭐ {activeCustomer?.points || 0} pts</span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Mobile: {selectedTable.currentSession?.mobile}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div className="flex-between">
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Orders History</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeTableOrders.map(order => (
                        <div key={order.id} className="premium-card" style={{ padding: '16px' }}>
                          <div className="flex-between" style={{ marginBottom: '12px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-text-secondary)' }}>ID: {order.orderNumber}</span>
                            <span className={`badge ${order.status === 'New' ? 'badge-danger' : order.status === 'Preparing' ? 'badge-warning' : 'badge-success'}`}>{order.status}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {order.items?.map((it, idx) => (
                              <div key={idx} className="flex-between" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                <span>{it.name} <span style={{ opacity: 0.6 }}>x{it.qty}</span></span>
                                <span style={{ fontWeight: '600' }}>₹{it.price * it.qty}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button className="btn-secondary" onClick={async () => {
                              const res = await printKOT(order, selectedTable.name);
                              if (!res.success) alert(res.message);
                            }} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                              🖨️ Print KOT
                            </button>
                            {order.status === 'Ready' && (
                              <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'Served')} style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)', padding: '8px', fontSize: '13px' }}>
                                ✓ Served
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => setShowTransferModal(true)} style={{ flex: '1 1 40%', justifyContent: 'center', padding: '12px' }}>
                      🔀 Transfer
                    </button>
                    <button className="btn-secondary" onClick={() => setIsOrdering(true)} style={{ flex: '1 1 40%', justifyContent: 'center', padding: '12px' }}>
                      ➕ Add Items
                    </button>
                    <button className="btn-primary" onClick={handleOpenBilling} disabled={activeTableOrders.length === 0} style={{ flex: '1 1 100%', justifyContent: 'center', padding: '12px' }}>
                      💳 Checkout & Bill
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: 'auto 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '24px', opacity: 0.8 }}>🖥️</span>
              <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '12px', fontWeight: '800' }}>No Table Selected</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>Select a table on the floor layout to manage orders, check out, or start billing.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* --- ACTIVE ORDERS TAB --- */}
      {activeTab === 'orders' && (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Active Orders</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Live view of all pending and ready orders.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: '#fff', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              {['All', 'New', 'Preparing', 'Ready'].map(f => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  style={{
                    padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                    background: orderFilter === f ? 'var(--color-pos)' : 'transparent',
                    color: orderFilter === f ? '#fff' : 'var(--color-text-secondary)',
                    border: 'none'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {orders
              .filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Served')
              .filter(o => orderFilter === 'All' || o.status === orderFilter)
              .map(order => (
                <div key={order.id} className="premium-card" style={{ padding: '16px' }}>
                  <div className="flex-between" style={{ marginBottom: '12px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>ID: {order.orderNumber}</span>
                    <span className={`badge ${order.status === 'Ready' ? 'badge-success' : 'badge-warning'}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Table: <strong>{tables.find(t => t.id === order.tableId)?.name || 'Takeaway'}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex-between" style={{ fontSize: '13px' }}>
                        <span>{it.name} <span style={{ opacity: 0.6 }}>x{it.qty}</span></span>
                      </div>
                    ))}
                  </div>
                  {order.status === 'Ready' && (
                    <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'Served')} style={{ width: '100%', marginTop: '16px', justifyContent: 'center', background: 'var(--color-success)' }}>
                      ✓ Mark as Served
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- DELIVERY APPS TAB --- */}
      {activeTab === 'delivery' && (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Delivery Aggregators</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Manage incoming online orders from Zomato and Swiggy.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => simulateDeliveryOrder('Zomato')} style={{ borderColor: '#e23744', color: '#e23744', fontWeight: '700' }}>
                + Mock Zomato Order
              </button>
              <button className="btn-secondary" onClick={() => simulateDeliveryOrder('Swiggy')} style={{ borderColor: '#fc8019', color: '#fc8019', fontWeight: '700' }}>
                + Mock Swiggy Order
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {orders
              .filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Served')
              .filter(o => o.source === 'Zomato' || o.source === 'Swiggy')
              .map(order => (
                <div key={order.id} className="premium-card" style={{ padding: '16px', borderTop: `4px solid ${order.source === 'Zomato' ? '#e23744' : '#fc8019'}` }}>
                  <div className="flex-between" style={{ marginBottom: '12px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{order.source} #{order.orderNumber}</span>
                    <span className={`badge ${order.status === 'Ready' ? 'badge-success' : 'badge-warning'}`}>{order.status}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex-between" style={{ fontSize: '13px' }}>
                        <span>{it.name} <span style={{ opacity: 0.6 }}>x{it.qty}</span></span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '16px' }}>
                     <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Bill Amount</span>
                     <span style={{ fontSize: '14px', fontWeight: '800' }}>₹{order.amount} (Prepaid)</span>
                  </div>
                  
                  {order.status === 'New' && (
                    <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'Preparing')} style={{ width: '100%', justifyContent: 'center' }}>
                      Accept Order
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'Ready')} style={{ width: '100%', justifyContent: 'center', background: 'var(--color-pos)' }}>
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'Ready' && (
                    <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'Completed')} style={{ width: '100%', justifyContent: 'center', background: 'var(--color-success)' }}>
                      ✓ Handover to Rider
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- CUSTOMERS TAB --- */}
      {activeTab === 'customers' && (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Customer Lookup</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Search customers by mobile number to view loyalty and history.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by Mobile (e.g., 9876543210)" 
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            style={{ width: '400px', padding: '12px', fontSize: '14px', marginBottom: '24px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.values(crm)
              .filter(c => c.mobile.includes(customerSearch))
              .map(customer => (
                <div key={customer.id} className="premium-card" style={{ padding: '20px' }}>
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{customer.name}</h3>
                    <span style={{ color: 'var(--color-warning)', fontWeight: '800', fontSize: '14px' }}>⭐ {customer.points} pts</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Mobile: {customer.mobile}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Spend: <strong>₹{customer.totalSpend}</strong></div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Last Visit: {new Date(customer.lastVisit).toLocaleDateString()}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- SHIFT TAB --- */}
      {activeTab === 'shift' && (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Shift Closure & Reconciliation</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Verify cash collection and close the current operational shift.</p>
            
            <div className="premium-card" style={{ padding: '24px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Today's Collections (System)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div className="flex-between"><span>UPI:</span> <strong>₹{shiftUPI.toLocaleString('en-IN')}</strong></div>
                <div className="flex-between"><span>Card:</span> <strong>₹{shiftCard.toLocaleString('en-IN')}</strong></div>
                <div className="flex-between" style={{ fontSize: '16px', color: 'var(--color-owner)' }}><span>Expected Cash Drawer:</span> <strong>₹{shiftCash.toLocaleString('en-IN')}</strong></div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Physical Reconciliation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Actual Cash Counted</span>
                <input 
                  type="number" 
                  value={actualCash || ''}
                  onChange={e => setActualCash(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  style={{ fontSize: '16px', padding: '12px' }}
                />
              </div>

              <div className="flex-between" style={{ padding: '16px', background: 'var(--color-bg-base)', borderRadius: '8px', marginBottom: '24px' }}>
                <span style={{ fontWeight: '600' }}>Variance</span>
                <strong style={{ color: shiftVariance < 0 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '18px' }}>
                  {shiftVariance > 0 ? '+' : ''}₹{shiftVariance.toFixed(2)}
                </strong>
              </div>

              <button className="btn-primary" onClick={async () => {
                if (window.confirm(`Are you sure you want to close this shift with a variance of ₹${shiftVariance.toFixed(2)}?`)) {
                  const shiftData = {
                    staffName: currentStaff.name,
                    expectedCash: shiftCash,
                    actualCash: actualCash,
                    variance: shiftVariance,
                    totalUPI: shiftUPI,
                    totalCard: shiftCard,
                    totalTransactions: shiftPayments.length
                  };
                  const res = await closeShift(shiftData);
                  if (res.success) {
                    alert(`Shift Closed! Variance recorded: ₹${shiftVariance.toFixed(2)}`);
                    logoutStaff();
                  } else {
                    alert(`Failed to close shift: ${res.message}`);
                  }
                }
              }} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px', background: 'var(--color-owner)' }}>
                Close Shift & Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showBillingModal && activeBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '900px', display: 'flex', padding: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1.4, padding: '40px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Checkout Settlement</h3>
              
              <div style={{ background: 'var(--color-bg-base)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>🎁 Loyalty & Discounts</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 5, 10, 20].map(pct => (
                    <button key={pct} onClick={() => setDiscountPercent(pct)} style={{ flex: 1, fontSize: '13px', fontWeight: '600', padding: '8px', background: discountPercent === pct ? 'var(--color-pos)' : '#fff', color: discountPercent === pct ? '#fff' : 'var(--color-text-primary)', borderRadius: '6px', border: '1px solid var(--color-border)', transition: 'all 0.2s' }}>{pct}%</button>
                  ))}
                </div>
                {activeCustomer && activeCustomer.points >= 100 && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                    <input type="number" min="0" max={activeCustomer.points} step="100" value={redeemedPoints} onChange={(e) => setRedeemedPoints(Math.min(activeCustomer.points, Math.max(0, parseInt(e.target.value) || 0)))} style={{ width: '100px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Redeem points (Value: <strong style={{ color: 'var(--color-warning)' }}>₹{redeemedPoints * 0.1}</strong>)</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex-between">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>💳 Split Payments</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3].map(parts => (
                      <button key={parts} onClick={() => {
                        const amountPerPart = +(billTotals.net / parts).toFixed(2);
                        setPaymentSplit([
                          { mode: 'UPI', amount: amountPerPart },
                          { mode: 'Cash', amount: parts > 1 ? amountPerPart : 0 },
                          { mode: 'Card', amount: parts > 2 ? amountPerPart : 0 }
                        ]);
                      }} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: '#f8fafc', fontWeight: '700' }}>
                        {parts === 1 ? 'Full' : `1/${parts} Split`}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentSplit.map((pay, idx) => (
                  <div key={idx} className="flex-between">
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>{pay.mode}</span>
                    <input type="number" value={pay.amount || ''} placeholder="0.00" onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPaymentSplit(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item));
                    }} style={{ width: '200px', textAlign: 'right', fontWeight: '700' }} />
                  </div>
                ))}
              </div>

              <div className="flex-between" style={{ fontSize: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: 'auto' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Collected: <strong style={{ color: 'var(--color-text-primary)' }}>₹{paymentSplit.reduce((s, i) => s + parseFloat(i.amount || 0), 0)}</strong></span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: '800', fontSize: '20px' }}>Net: ₹{billTotals.net}</span>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" onClick={() => setShowBillingModal(false)} style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>Cancel</button>
                <button className="btn-primary" onClick={handleSettlement} style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '16px', background: 'var(--color-success)' }}>Confirm & Settle</button>
              </div>
            </div>

            <div style={{ flex: 1, background: 'var(--color-bg-base)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', color: '#1f2937', padding: '32px', width: '320px', fontFamily: 'monospace', fontSize: '13px', boxShadow: 'var(--shadow-md)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>{cafeProfile.name.toUpperCase()}</h4>
                  <p style={{ color: '#64748b' }}>Tax Invoice</p>
                </div>
                <div style={{ borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTableId === 'TAKEAWAY' 
                    ? posCart.map((it, idx) => (
                        <div key={idx} className="flex-between">
                          <span>{it.name.slice(0, 18)} <span style={{ opacity: 0.5 }}>x{it.qty}</span></span>
                          <span>₹{it.price * it.qty}.00</span>
                        </div>
                      ))
                    : activeBill.ordersList.flatMap(o => o.items || []).map((it, idx) => (
                        <div key={idx} className="flex-between">
                          <span>{it.name.slice(0, 18)} <span style={{ opacity: 0.5 }}>x{it.qty}</span></span>
                          <span>₹{it.price * it.qty}.00</span>
                        </div>
                      ))
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
                  <div className="flex-between"><span style={{ color: '#64748b' }}>Subtotal:</span><span>₹{billTotals.subtotal}.00</span></div>
                  <div className="flex-between"><span style={{ color: '#64748b' }}>GST (5%):</span><span>₹{billTotals.gst}.00</span></div>
                  {billTotals.discount > 0 && <div className="flex-between"><span style={{ color: '#64748b' }}>Discount:</span><span style={{ color: '#10b981' }}>-₹{billTotals.discount}.00</span></div>}
                  {billTotals.pointsVal > 0 && <div className="flex-between"><span style={{ color: '#64748b' }}>Points Redeemed:</span><span style={{ color: '#f59e0b' }}>-₹{billTotals.pointsVal}.00</span></div>}
                  <div className="flex-between" style={{ fontWeight: '800', fontSize: '16px', borderTop: '2px solid #1f2937', paddingTop: '12px', marginTop: '4px' }}><span>Net Total:</span><span>₹{billTotals.net}.00</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '400px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '16px' }}>🔀 Transfer Table</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Select an available table to transfer the current session to.</p>
            
            <select value={transferTargetId} onChange={e => setTransferTargetId(e.target.value)} style={{ width: '100%', marginBottom: '24px' }}>
              <option value="">Select Table...</option>
              {tables.filter(t => t.status === 'Available').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowTransferModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                if (!transferTargetId) return;
                const result = await transferTable(selectedTableId, transferTargetId);
                setShowTransferModal(false);
                if (result.success) {
                  setSelectedTableId(transferTargetId);
                  const destName = tables.find(t => t.id === transferTargetId)?.name || transferTargetId;
                  setToasts(prev => [...prev, { id: 'transfer-' + Date.now(), message: `✅ Transferred ${result.movedOrders} order(s) to ${destName}` }]);
                  setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('transfer-'))), 5000);
                } else {
                  setToasts(prev => [...prev, { id: 'transfer-err-' + Date.now(), message: `❌ Transfer failed: ${result.message}` }]);
                  setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('transfer-err-'))), 5000);
                }
              }} style={{ flex: 1, justifyContent: 'center' }}>Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

        {/* --- RESERVATIONS TAB --- */}
        {activeTab === 'reservations' && (
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)' }}>📅 Waitlist & Reservations</h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Manage walk-in waitlists and future bookings.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div className="premium-card" style={{ flex: 1, padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add to Waitlist</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!waitlistForm.name || !waitlistForm.mobile) return;
                  setWaitlist([...waitlist, { ...waitlistForm, id: Date.now(), status: 'Waiting', createdAt: new Date().toISOString() }]);
                  setWaitlistForm({ name: '', mobile: '', pax: 2, time: '' });
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Guest Name</label>
                    <input type="text" value={waitlistForm.name} onChange={e => setWaitlistForm({...waitlistForm, name: e.target.value})} placeholder="John Doe" required style={{ width: '100%', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile</label>
                    <input type="tel" value={waitlistForm.mobile} onChange={e => setWaitlistForm({...waitlistForm, mobile: e.target.value})} placeholder="9876543210" required style={{ width: '100%', marginTop: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600' }}>Pax (Guests)</label>
                      <input type="number" min="1" value={waitlistForm.pax} onChange={e => setWaitlistForm({...waitlistForm, pax: parseInt(e.target.value) || 1})} style={{ width: '100%', marginTop: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600' }}>Time (Optional)</label>
                      <input type="time" value={waitlistForm.time} onChange={e => setWaitlistForm({...waitlistForm, time: e.target.value})} style={{ width: '100%', marginTop: '4px' }} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>Add to List</button>
                </form>
              </div>

              <div className="premium-card" style={{ flex: 2, padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Current Queue</h3>
                {waitlist.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No guests on the waitlist.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {waitlist.map(w => (
                      <div key={w.id} className="flex-between" style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', background: w.status === 'Seated' ? '#f8fafc' : '#ffffff', opacity: w.status === 'Seated' ? 0.6 : 1 }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>{w.name} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>• {w.pax} Pax</span></div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📱 {w.mobile} {w.time && `• 🕒 ${w.time}`}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {w.status === 'Waiting' && (
                            <button className="btn-primary" onClick={() => {
                              setWaitlist(waitlist.map(item => item.id === w.id ? { ...item, status: 'Seated' } : item));
                            }} style={{ fontSize: '12px', padding: '6px 12px' }}>Mark Seated</button>
                          )}
                          <button className="btn-secondary" onClick={() => {
                            setWaitlist(waitlist.filter(item => item.id !== w.id));
                          }} style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--color-danger)' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Toast Notifications Container */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className="premium-card animate-fade-in" style={{ padding: '16px 24px', background: 'var(--color-success)', color: '#fff', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}>
            <span style={{ fontSize: '20px' }}>🔔</span>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>{t.message}</div>
            <button onClick={() => removeToast(t.id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px', marginLeft: 'auto' }}>×</button>
          </div>
        ))}
      </div>

      </main>
    </div>
  );
}
