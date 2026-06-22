import { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { generateSingleQRPdf, generateBulkQRZip, generateQRDataUrl, buildQRUrl } from '../../utils/qrGenerator';
import { exportOrdersCSV, exportPaymentsCSV, exportCrmCSV } from '../../utils/csvExporter';

// --- Inline QR Component to fetch async QR image ---
function QRCodeImage({ table, cafeProfile }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    const fetchQR = async () => {
      const url = buildQRUrl(table, cafeProfile);
      const dataUrl = await generateQRDataUrl(url);
      setQrDataUrl(dataUrl);
    };
    fetchQR();
  }, [table, cafeProfile]);

  if (!qrDataUrl) return <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌛</div>;
  return <img src={qrDataUrl} alt={`QR for ${table.name}`} style={{ width: '100px', height: '100px', borderRadius: '8px' }} />;
}

export default function OwnerDashboard() {
  const {
    currentStaff,
    logoutStaff,
    cafeProfile,
    setCafeProfile,
    menu,
    tables,
    crm,
    payments,
    orders,
    staff,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addNewTable,
    regenerateTableQR,
    addStaff,
    updateCafeProfile,
    getShiftHistory,
    availableBranches,
    activeBranch,
    switchBranch
  } = useCafe();

  const [activeTab, setActiveTab] = useState('analytics');

  // Menu management state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Day');
  const [editingItem, setEditingItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Beverages',
    description: '',
    price: '',
    image: '',
    status: 'Active',
    variants: [],
    addOns: []
  });

  // Calculate dynamic analytics
  const getFilteredPayments = () => {
    const now = new Date();
    return payments.filter(p => {
      const pDate = new Date(p.timestamp);
      if (analyticsTimeframe === 'Day') {
        return pDate.toDateString() === now.toDateString();
      }
      if (analyticsTimeframe === 'Week') {
        const diffTime = Math.abs(now - pDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 7;
      }
      if (analyticsTimeframe === 'Month') {
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredPayments = getFilteredPayments();
  const totalSales = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalOrders = filteredPayments.length;
  const aov = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  
  // Payment modes
  const paymentModes = filteredPayments.reduce((acc, p) => {
    acc[p.mode] = (acc[p.mode] || 0) + p.amount;
    return acc;
  }, {});

  const categories = ['All', ...new Set(menu.map(item => item.category))];

  // CSV Exporter for CRM
  const handleExportCRM = () => {
    exportCrmCSV(crm);
  };

  const [shiftLogs, setShiftLogs] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'system') {
      getShiftHistory().then(res => {
        if (res.success && res.data) {
          setShiftLogs(res.data);
        }
      });
    }
  }, [activeTab, getShiftHistory]);

  // Staff creation state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Counter Operator'
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    addStaff(staffForm);
    setShowStaffModal(false);
    setStaffForm({ name: '', role: 'Counter Operator' });
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) return;

    const data = {
      ...itemForm,
      price: parseFloat(itemForm.price),
      image: itemForm.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80'
    };

    if (editingItem) {
      updateMenuItem(data);
    } else {
      addMenuItem(data);
    }
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleEditItemClick = (item) => {
    setEditingItem(item);
    setItemForm(item);
    setShowItemModal(true);
  };

  const handleAddItemClick = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      category: 'Beverages',
      description: '',
      price: '',
      image: '',
      status: 'Active',
      upsellItemId: '',
      variants: [],
      addOns: []
    });
    setShowItemModal(true);
  };

  return (
    <div className="theme-owner app-container animate-fade-in" style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 72px)' }}>
      
      {/* Sidebar Menu */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-sidebar)', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: '32px', zIndex: 10, overflowY: 'auto' }}>
        
        {/* BRANCH SELECTOR */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Current Branch</div>
          <select 
            value={activeBranch.id} 
            onChange={(e) => {
              const branch = availableBranches.find(b => b.id === e.target.value);
              if (branch) switchBranch(branch);
            }}
            style={{ width: '100%', padding: '8px', fontSize: '14px', fontWeight: '800', border: 'none', background: 'var(--color-bg-base)', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-owner)' }}
          >
            {availableBranches.map(b => (
              <option key={b.id} value={b.id}>{b.logo} {b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Dashboard</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Overview</button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Operations</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📝 Orders</button>
            <button className={`tab-button ${activeTab === 'kitchen' ? 'active' : ''}`} onClick={() => setActiveTab('kitchen')}>🍳 Kitchen</button>
            <button className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>🧾 Billing</button>
            <button className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>💳 Payments</button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Management</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>📜 Menu</button>
            <button className={`tab-button ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>🔲 QR Codes</button>
            <button className={`tab-button ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}>👥 Customers</button>
            <button className={`tab-button ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => setActiveTab('loyalty')}>🎁 Loyalty</button>
            <button className={`tab-button ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>👔 Staff</button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Business Setup</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>🏢 Café Profile & Branding</button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>System & Subscriptions</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')}>⭐ Current Plan</button>
            <button className={`tab-button ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>⚙️ Settings & Export</button>
          </nav>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px' }}>
            <span style={{ fontSize: '28px', background: 'var(--color-bg-base)', padding: '8px', borderRadius: '12px' }}>{cafeProfile.logo}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{currentStaff?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>{currentStaff?.role}</div>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            onClick={logoutStaff} 
            style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)' }}
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        
        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Executive Analytics</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Real-time business performance metrics for {cafeProfile.name}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                {['Day', 'Week', 'Month'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setAnalyticsTimeframe(tf)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: analyticsTimeframe === tf ? '#ffffff' : 'transparent',
                      color: analyticsTimeframe === tf ? 'var(--color-owner)' : 'var(--color-text-secondary)',
                      boxShadow: analyticsTimeframe === tf ? 'var(--shadow-sm)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid-cols-4">
              <div className="premium-card" style={{ padding: '24px', borderTop: '4px solid var(--color-owner)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Total Sales</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)' }}>₹{totalSales.toLocaleString('en-IN')}</div>
                <div style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>▲ 12.8% vs last week</div>
              </div>

              <div className="premium-card" style={{ padding: '24px', borderTop: '4px solid var(--color-pos)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Average Order Value</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)' }}>₹{aov}</div>
                <div style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>▲ 4.2% higher item count</div>
              </div>

              <div className="premium-card" style={{ padding: '24px', borderTop: '4px solid var(--color-kds)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Orders Processed</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{totalOrders}</div>
                <div style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>▲ 8% order conversion</div>
              </div>

              <div className="premium-card" style={{ padding: '24px', borderTop: '4px solid var(--color-customer)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Loyalty Enroll Rate</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)' }}>63%</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>Target: {`>`} 30% in MVP</div>
              </div>
            </div>

            {/* SVG Charts */}
            <div className="grid-cols-2">
              <div className="premium-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-text-primary)', marginBottom: '32px' }}>Sales Distribution ({analyticsTimeframe})</h3>
                <div style={{ display: 'flex', height: '220px', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
                  {filteredPayments.slice(-7).map((p, idx) => {
                    const heightPercent = Math.min(100, (p.amount / 1250) * 100);
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: '700' }}>₹{p.amount}</div>
                        <div style={{
                          width: '32px',
                          height: `${heightPercent}px`,
                          background: 'var(--color-owner)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}></div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>T0{idx + 1}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-text-primary)', marginBottom: '32px' }}>Revenue by Mode</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', flex: 1 }}>
                  {Object.entries(paymentModes).map(([mode, amt]) => {
                    const percent = Math.round((amt / totalSales) * 100);
                    return (
                      <div key={mode}>
                        <div className="flex-between" style={{ fontSize: '14px', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>{mode}</span>
                          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>₹{amt.toLocaleString('en-IN')} ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'var(--color-bg-base)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: mode === 'UPI' ? 'var(--color-success)' : mode === 'Cash' ? 'var(--color-warning)' : 'var(--color-owner)',
                            borderRadius: '99px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MENU MANAGEMENT TAB --- */}
        {activeTab === 'menu' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Menu & Offerings</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Create and configure categories, variants, and pricing rules.</p>
              </div>
              <button className="btn-primary" onClick={handleAddItemClick}>
                ➕ Add Menu Item
              </button>
            </div>

            {/* Search and Categories */}
            <div className="flex-between" style={{ gap: '16px', flexWrap: 'wrap' }}>
              {/* Pills */}
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', flex: 1 }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '99px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: selectedCategory === cat ? 'var(--color-owner)' : '#ffffff',
                      color: selectedCategory === cat ? '#ffffff' : 'var(--color-text-secondary)',
                      border: `1px solid ${selectedCategory === cat ? 'var(--color-owner)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s',
                      boxShadow: selectedCategory === cat ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="🔍 Search menu items..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '280px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: '14px' }}
              />
            </div>

            {/* Menu Grid */}
            <div className="grid-cols-3">
              {menu
                .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
                .filter(item => (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <div key={item.id} className="premium-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', border: item.status === 'Inactive' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }}>
                    <div style={{ height: '180px', background: `url(${item.image}) center/cover no-repeat`, position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '6px 12px',
                        borderRadius: '99px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        backdropFilter: 'blur(4px)'
                      }}>{item.category}</span>
                      <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ position: 'absolute', top: '16px', right: '16px', background: '#fff' }}>
                        {item.status}
                      </span>
                    </div>

                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="flex-between">
                        <h3 style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>{item.name}</h3>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-owner)' }}>₹{item.price}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', flex: 1 }}>{item.description}</p>
                      
                      <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '12px' }}>
                        <button className="btn-secondary" onClick={() => handleEditItemClick(item)} style={{ flex: 1, justifyContent: 'center' }}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger" onClick={() => deleteMenuItem(item.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* --- QR CODE MANAGEMENT TAB --- */}
        {activeTab === 'qr' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>QR Management System</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Generate and print scannable QR cards linked to physical tables.</p>
              </div>
              <button className="btn-secondary" onClick={async () => { await generateBulkQRZip(tables, cafeProfile); }} style={{ marginRight: '8px' }}>
                📦 Download All QR Pack
              </button>
              <button className="btn-primary" onClick={addNewTable}>
                ➕ Add Table & Auto-QR
              </button>
            </div>

            <div className="grid-cols-4">
              {tables.map(table => (
                <div key={table.id} className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  <span className={`badge ${table.status === 'Available' ? 'badge-success' : table.status === 'Billing Pending' ? 'badge-warning' : 'badge-info'}`} style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    {table.status}
                  </span>

                  <div style={{ background: '#ffffff', color: '#18181b', padding: '20px', borderRadius: 'var(--radius-md)', width: '180px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px', marginTop: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-customer)', letterSpacing: '0.05em' }}>{cafeProfile.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '12px', marginTop: '2px' }}>Scan to Order Dine-In</div>
                    
                    <div style={{ width: '120px', height: '120px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <QRCodeImage table={table} cafeProfile={cafeProfile} />
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '700', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>{table.name}</div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={async () => { await generateSingleQRPdf(table, cafeProfile); }} style={{ flex: 1, fontSize: '12px', padding: '8px', justifyContent: 'center' }}>
                      💾 PDF
                    </button>
                    <button className="btn-danger" onClick={() => {
                        if (confirm(`Regenerating QR will invalidate table sessions. Proceed?`)) {
                          regenerateTableQR(table.id);
                        }
                      }} style={{ fontSize: '12px', padding: '8px 12px' }}>
                      🔄
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CUSTOMER CRM TAB --- */}
        {activeTab === 'crm' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Customer CRM</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Consolidated view of customer profiles, frequency, spend patterns and points balance.</p>
              </div>
              <button className="btn-primary" style={{ background: 'var(--color-success)' }} onClick={handleExportCRM}>
                📥 Export CSV List
              </button>
            </div>

            <div className="premium-card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Mobile</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Visits</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Total Spend</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Loyalty Points</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(crm).map((customer) => {
                    const aov = customer.visits > 0 ? Math.round(customer.totalSpend / customer.visits) : 0;
                    return (
                      <tr key={customer.mobile} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{customer.name}</td>
                        <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{customer.mobile}</td>
                        <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{customer.visits}</td>
                        <td style={{ padding: '20px 24px', color: 'var(--color-success)', fontWeight: '600' }}>₹{customer.totalSpend} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '400' }}>(AOV: ₹{aov})</span></td>
                        <td style={{ padding: '20px 24px', color: 'var(--color-warning)', fontWeight: '600' }}>⭐ {customer.points}</td>
                        <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{customer.lastVisit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- LOYALTY SETTINGS TAB --- */}
        {activeTab === 'loyalty' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Loyalty Configurations</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Define rules for points accumulation and reward redemptions.</p>
            </div>

            <div className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Earning Multiplier (Points per ₹100 spent)</label>
                <input
                  type="number"
                  value={cafeProfile.loyaltyEarnRate}
                  onChange={(e) => setCafeProfile({ ...cafeProfile, loyaltyEarnRate: parseInt(e.target.value) || 0 })}
                  style={{ width: '120px', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Redemption Conversion (₹ discount per Point)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cafeProfile.loyaltyRedeemRate}
                  onChange={(e) => setCafeProfile({ ...cafeProfile, loyaltyRedeemRate: parseFloat(e.target.value) || 0 })}
                  style={{ width: '120px', fontSize: '16px' }}
                />
              </div>

              <button className="btn-primary" onClick={() => {
                updateCafeProfile(cafeProfile);
                alert('Loyalty program thresholds updated successfully!');
              }} style={{ marginTop: '16px', justifyContent: 'center' }}>
                💾 Update Configurations
              </button>
            </div>
          </div>
        )}

        {/* --- STAFF ACCOUNTS TAB --- */}
        {activeTab === 'staff' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Staff Roles & Shifts</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Assign credentials, roles, and review login session logs.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowStaffModal(true)}>
                👔 Add Staff Account
              </button>
            </div>

            <div className="premium-card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Staff ID</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Assigned Role</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Shift Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((st) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{st.id}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-primary)' }}>{st.name}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{
                          padding: '6px 12px',
                          background: st.role === 'Manager' ? 'rgba(37,99,235,0.08)' : st.role === 'Kitchen Staff' ? 'rgba(5,150,105,0.08)' : 'rgba(79,70,229,0.08)',
                          color: st.role === 'Manager' ? '#2563eb' : st.role === 'Kitchen Staff' ? '#059669' : '#4f46e5',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '6px',
                          border: `1px solid ${st.role === 'Manager' ? 'rgba(37,99,235,0.15)' : st.role === 'Kitchen Staff' ? 'rgba(5,150,105,0.15)' : 'rgba(79,70,229,0.15)'}`
                        }}>{st.role}</span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span className="badge badge-success">{st.status}</span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ color: st.attendance === 'LoggedIn' ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '13px', fontWeight: '500' }}>
                          ● {st.attendance === 'LoggedIn' ? 'Active Shift' : 'Off Duty'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Active Orders</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Monitor and manage live orders across the floor.</p>
            </div>
            <div className="premium-card" style={{ padding: '24px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px' }}>Order ID</th>
                    <th style={{ padding: '12px' }}>Table / Source</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>No active orders</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px' }}>{tables.find(t => t.id === o.tableId)?.name || o.tableId}</td>
                      <td style={{ padding: '12px' }}><span className="badge badge-info">{o.status}</span></td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{o.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- KITCHEN TAB --- */}
        {activeTab === 'kitchen' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Kitchen Display System (KDS) Tracker</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Live pipeline of food preparation.</p>
            </div>
            <div className="grid-cols-3">
              {['New', 'Preparing', 'Ready'].map(status => (
                <div key={status} className="premium-card" style={{ padding: '16px', background: 'var(--color-bg-base)' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>{status}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.filter(o => o.status === status).map(o => (
                      <div key={o.id} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>{o.orderNumber}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{tables.find(t => t.id === o.tableId)?.name || 'Takeaway'}</span>
                        </div>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px' }}>
                          {o.items.map((it, idx) => <li key={idx}>{it.qty}x {it.name}</li>)}
                        </ul>
                      </div>
                    ))}
                    {orders.filter(o => o.status === status).length === 0 && <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>No tickets</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- BILLING TAB --- */}
        {activeTab === 'billing' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Billing Management</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>View recently generated bills and handle discounts.</p>
            </div>
            <div className="premium-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p>Bills are automatically aggregated. Access POS terminal to process live billing overrides.</p>
            </div>
          </div>
        )}

        {/* --- PAYMENTS TAB --- */}
        {activeTab === 'payments' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Payment Ledger</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Real-time transaction logging and reconciliation.</p>
              </div>
              <input 
                type="text" 
                placeholder="🔍 Search by customer or table..." 
                value={paymentSearchQuery}
                onChange={e => setPaymentSearchQuery(e.target.value)}
                style={{ width: '280px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: '14px' }}
              />
            </div>
            <div className="premium-card" style={{ padding: '24px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px' }}>Customer</th>
                    <th style={{ padding: '12px' }}>Table Number</th>
                    <th style={{ padding: '12px' }}>Mode</th>
                    <th style={{ padding: '12px' }}>Amount</th>
                    <th style={{ padding: '12px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {payments
                    .filter(p => (p.customerName || '').toLowerCase().includes(paymentSearchQuery.toLowerCase()) || (p.tableName || '').toLowerCase().includes(paymentSearchQuery.toLowerCase()))
                    .map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold' }}>{p.customerName}</td>
                      <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{p.tableName}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: p.mode === 'UPI' ? 'var(--color-success)' : p.mode === 'Cash' ? 'var(--color-warning)' : 'var(--color-owner)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{p.mode}</span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{p.amount}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-muted)' }}>{new Date(p.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Café Profile & Branding</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Manage your core business identity and tax settings.</p>
            </div>
            <div className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Business Name</label>
                  <input type="text" value={cafeProfile.name} onChange={e => setCafeProfile({...cafeProfile, name: e.target.value})} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>GSTIN Number</label>
                  <input type="text" value={cafeProfile.gstNumber} onChange={e => setCafeProfile({...cafeProfile, gstNumber: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Contact Phone</label>
                  <input type="text" value={cafeProfile.phone} onChange={e => setCafeProfile({...cafeProfile, phone: e.target.value})} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Tax Percentage (%)</label>
                  <input type="number" value={cafeProfile.gstPercentage} onChange={e => setCafeProfile({...cafeProfile, gstPercentage: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Full Address</label>
                <textarea rows="2" value={cafeProfile.address} onChange={e => setCafeProfile({...cafeProfile, address: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Default Billing Mode</label>
                <select 
                  value={cafeProfile.defaultBillingMode || 'Pay After Service'} 
                  onChange={e => setCafeProfile({...cafeProfile, defaultBillingMode: e.target.value})}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  <option value="Pay After Service">Pay After Service (Standard)</option>
                  <option value="Prepaid">Prepaid (Takeaway/QSR)</option>
                </select>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Determines how bills are generated for new tables.</span>
              </div>
              <button className="btn-primary" onClick={() => {
                updateCafeProfile(cafeProfile);
                alert('Business profile updated successfully!');
              }} style={{ marginTop: '16px', alignSelf: 'flex-start' }}>
                💾 Save Business Profile
              </button>
            </div>
          </div>
        )}

        {/* --- SUBSCRIPTION TAB --- */}
        {activeTab === 'subscription' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>SaaS Subscription</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Manage your CafeOS billing and plans.</p>
            </div>
            <div className="premium-card" style={{ padding: '40px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Growth Plan</h2>
                  <p style={{ color: '#94a3b8' }}>₹1,999 / month • Renews in 14 days</p>
                </div>
                <button style={{ background: 'var(--color-owner)', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Upgrade to Enterprise</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SYSTEM TAB --- */}
        {activeTab === 'system' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>System Administration</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Data export and audit logs.</p>
            </div>
            <div className="premium-card" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Data Exports</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" onClick={() => exportOrdersCSV(orders, tables)}>📥 Export Orders</button>
                <button className="btn-secondary" onClick={() => exportPaymentsCSV(payments)}>📥 Export Payments</button>
              </div>
            </div>

            <div className="premium-card" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Shift Audits</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Staff Name</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Transactions</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Expected (₹)</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Actual (₹)</th>
                      <th style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftLogs.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No shift logs found.</td></tr>
                    ) : shiftLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{log.staff_name}</td>
                        <td style={{ padding: '12px 16px' }}>{log.total_transactions}</td>
                        <td style={{ padding: '12px 16px' }}>₹{log.expected_cash}</td>
                        <td style={{ padding: '12px 16px' }}>₹{log.actual_cash}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: log.variance < 0 ? 'var(--color-danger)' : log.variance > 0 ? 'var(--color-success)' : 'inherit' }}>
                          {log.variance > 0 ? '+' : ''}₹{log.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- ADD/EDIT MENU ITEM MODAL --- */}
      {showItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '500px', padding: '40px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '24px' }}>{editingItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}</h2>
            
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Item Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Classic Hot Cocoa"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Price (₹)</label>
                  <input
                    type="number"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="180"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Describe ingredients, tastes, etc..."
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Image URL</label>
                <input
                  type="url"
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  placeholder="Paste Unsplash image URL..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Upsell Pairing (Optional)</label>
                <select
                  value={itemForm.upsellItemId || ''}
                  onChange={(e) => setItemForm({ ...itemForm, upsellItemId: e.target.value || null })}
                >
                  <option value="">-- None --</option>
                  {menu.filter(m => m.id !== itemForm.id && m.status === 'Active').map(m => (
                    <option key={m.id} value={m.id}>{m.name} (+₹{m.price})</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Suggests this item when added to cart</span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD STAFF MODAL --- */}
      {showStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '420px', padding: '40px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '24px' }}>👔 Create Staff Account</h2>
            
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Staff Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Vikas Sharma"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Role Assignment</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                >
                  <option value="Counter Operator">Counter Operator / Cashier</option>
                  <option value="Kitchen Staff">Kitchen Staff / Chef</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowStaffModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
