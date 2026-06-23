import { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { generateSingleQRPdf, generateQRDataUrl, buildQRUrl } from '../../utils/qrGenerator';

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

export default function ManagerDashboard() {
  const {
    currentStaff,
    logoutStaff,
    cafeProfile,
    menu,
    tables,
    crm,
    staff,
    addStaff,
    updateStaff,
    deactivateStaff,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    inventoryItems,
    vendors,
    addInventoryItem,
    updateInventoryItem,
    addVendor,
    updateVendor
  } = useCafe();

  const [activeTab, setActiveTab] = useState('menu');

  // Menu management state
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const categories = ['All', ...new Set(menu.map(item => item.category))];

  // Staff management state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState('add');
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Counter Operator', email: '', phone: '' });

  // Inventory management state
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState('add');
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [inventoryForm, setInventoryForm] = useState({ name: '', unit: '', current_stock: '', low_stock_threshold: '', unit_cost: '' });

  // Vendor management state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorModalMode, setVendorModalMode] = useState('add');
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorForm, setVendorForm] = useState({ name: '', contact: '', email: '', status: 'Active' });

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    if (staffModalMode === 'edit' && editingStaffId) {
      await updateStaff(editingStaffId, staffForm);
    } else {
      await addStaff(staffForm);
    }
    setShowStaffModal(false);
    setStaffForm({ name: '', role: 'Counter Operator', email: '', phone: '' });
    setEditingStaffId(null);
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: inventoryForm.name,
      unit: inventoryForm.unit,
      current_stock: parseFloat(inventoryForm.current_stock) || 0,
      low_stock_threshold: parseFloat(inventoryForm.low_stock_threshold) || 0,
      unit_cost: parseFloat(inventoryForm.unit_cost) || 0,
    };
    if (inventoryModalMode === 'edit') {
      await updateInventoryItem(editingInventoryId, data);
    } else {
      await addInventoryItem(data);
    }
    setShowInventoryModal(false);
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    if (vendorModalMode === 'edit') {
      await updateVendor(editingVendorId, vendorForm);
    } else {
      await addVendor(vendorForm);
    }
    setShowVendorModal(false);
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
      variants: [],
      addOns: []
    });
    setShowItemModal(true);
  };

  return (
    <div className="theme-owner app-container animate-fade-in" style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 72px)' }}>
      
      {/* Sidebar Menu */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-sidebar)', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', zIndex: 10, overflowY: 'auto' }}>
        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Operations</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
              📜 Menu Management
            </button>
            <button className={`tab-button ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
              🔲 QR Codes (View)
            </button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Inventory & Supply</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
              📦 Stock Levels
            </button>
            <button className={`tab-button ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => setActiveTab('vendors')}>
              🚚 Vendors
            </button>
          </nav>
        </div>

        <div>
          <h2 style={{ fontSize: '13px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '12px', marginBottom: '16px', fontWeight: '700' }}>Customers & Staff</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`tab-button ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}>
              👥 CRM Directory
            </button>
            <button className={`tab-button ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => setActiveTab('loyalty')}>
              🎁 Loyalty Rates
            </button>
            <button className={`tab-button ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
              👨‍🍳 Staff Accounts
            </button>
            <button className={`tab-button ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => setActiveTab('discounts')}>
              🏷️ Discount Approvals
            </button>
          </nav>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '24px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px' }}>
            <span style={{ fontSize: '28px', background: 'var(--color-bg-base)', padding: '8px', borderRadius: '12px' }}>☕</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{currentStaff?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>Manager</div>
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

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
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

            {/* Menu Grid */}
            <div className="grid-cols-3">
              {menu
                .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
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
                      
                      <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => handleEditItemClick(item)} style={{ flex: '1 1 40%', justifyContent: 'center' }}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger" onClick={() => deleteMenuItem(item.id)} style={{ flex: '0 0 auto' }}>
                          🗑️
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => updateMenuItem({ ...item, status: item.status === 'Out of Stock' ? 'Active' : 'Out of Stock' })} 
                          style={{ flex: '1 1 100%', justifyContent: 'center', background: item.status === 'Out of Stock' ? 'var(--color-success)' : 'var(--color-warning)', color: '#fff', border: 'none' }}
                        >
                          {item.status === 'Out of Stock' ? '✅ Mark Active' : '🚫 Mark Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* --- QR CODE MANAGEMENT TAB (View Only) --- */}
        {activeTab === 'qr' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>QR Management System</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>View generated table QR cards. Adding tables or invalidations requires Owner credentials.</p>
            </div>

            <div className="grid-cols-4">
              {tables.map(table => (
                <div key={table.id} className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  <span className={`badge ${table.status === 'Available' ? 'badge-success' : 'badge-warning'}`} style={{ position: 'absolute', top: '16px', right: '16px' }}>
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
                    <button className="btn-secondary" disabled style={{ fontSize: '12px', padding: '8px 12px', opacity: 0.5, cursor: 'not-allowed' }} title="Invalidation requires Owner role permissions">
                      🔒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CRM TAB (View Only) --- */}
        {activeTab === 'crm' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Customer Directory</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>View verified customer records and segments. CSV Export is restricted.</p>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: '500' }}>🔒 Export (Owner Only)</span>
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
                      <tr key={customer.mobile} style={{ borderBottom: '1px solid var(--color-border)' }}>
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

        {/* --- LOYALTY TAB (View Only) --- */}
        {activeTab === 'loyalty' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Loyalty Multipliers</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Current active point values. Updating metrics is restricted to Owner.</p>
            </div>

            <div className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Earning Multiplier (Points per ₹100 spent)</span>
                <input
                  type="number"
                  disabled
                  value={cafeProfile.loyaltyEarnRate}
                  style={{ width: '120px', fontSize: '16px', color: 'var(--color-text-muted)', background: 'var(--color-bg-base)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Redemption Conversion (₹ discount per Point)</span>
                <input
                  type="number"
                  disabled
                  step="0.01"
                  value={cafeProfile.loyaltyRedeemRate}
                  style={{ width: '120px', fontSize: '16px', color: 'var(--color-text-muted)', background: 'var(--color-bg-base)' }}
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '24px', fontWeight: '500' }}>
                🔒 Read Only (Owner Role Required)
              </div>
            </div>
          </div>
        )}

        {/* --- STAFF ACCOUNTS TAB --- */}
        {activeTab === 'staff' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Staff Accounts</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Manage employee roles, access, and passwords.</p>
              </div>
              <button className="btn-primary" onClick={() => { setStaffModalMode('add'); setStaffForm({ name: '', role: 'Counter Operator', email: '', phone: '' }); setShowStaffModal(true); }}>
                ➕ Add Staff Member
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {staff.map(s => (
                <div key={s.id} className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: s.status === 'Inactive' ? 0.5 : 1 }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>{s.name}</span>
                    <span className={`badge ${s.status === 'Inactive' ? 'badge-danger' : s.role === 'Owner' ? 'badge-danger' : s.role === 'Manager' ? 'badge-warning' : 'badge-info'}`}>
                      {s.status === 'Inactive' ? 'Inactive' : s.role}
                    </span>
                  </div>
                  {s.email && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Email: {s.email}</div>}
                  {s.phone && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Phone: {s.phone}</div>}
                  
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: 'auto' }}>
                    <button className="btn-secondary" onClick={() => { setStaffModalMode('edit'); setEditingStaffId(s.id); setStaffForm({ name: s.name, role: s.role, email: s.email || '', phone: s.phone || '' }); setShowStaffModal(true); }} style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>✏️ Edit</button>
                    {s.status !== 'Inactive' && (
                      <button className="btn-danger" onClick={() => { if (confirm(`Deactivate ${s.name}? They won't be able to log in.`)) deactivateStaff(s.id); }} style={{ fontSize: '12px' }}>🚫</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DISCOUNT APPROVALS TAB --- */}
        {activeTab === 'discounts' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div>
              <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Discount Approvals</h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Approve or reject high-value discount requests from Cashiers (&gt;20%).</p>
            </div>

            <div className="premium-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🏷️</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Pending Requests</h3>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>All discount overrides have been handled.</p>
            </div>
          </div>
        )}

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Inventory Management</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Track raw materials and set low stock alerts.</p>
              </div>
              <button className="btn-primary" onClick={() => { setInventoryModalMode('add'); setInventoryForm({ name: '', unit: '', current_stock: '', low_stock_threshold: '', unit_cost: '' }); setShowInventoryModal(true); }}>
                ➕ Add Item
              </button>
            </div>

            <div className="premium-card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Item Name</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Unit</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Current Stock</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Low Alert</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Cost (₹)</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{item.name}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{item.unit}</td>
                      <td style={{ padding: '20px 24px', color: item.current_stock <= item.low_stock_threshold ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: '600' }}>{item.current_stock}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{item.low_stock_threshold}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>₹{item.unit_cost}</td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button className="btn-secondary" onClick={() => { setInventoryModalMode('edit'); setEditingInventoryId(item.id); setInventoryForm({ name: item.name, unit: item.unit, current_stock: item.current_stock, low_stock_threshold: item.low_stock_threshold, unit_cost: item.unit_cost }); setShowInventoryModal(true); }} style={{ fontSize: '12px', padding: '6px 12px' }}>✏️ Edit</button>
                      </td>
                    </tr>
                  ))}
                  {(!inventoryItems || inventoryItems.length === 0) && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No inventory items found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VENDORS TAB --- */}
        {activeTab === 'vendors' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Vendors</h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Manage supplier contacts and purchase orders.</p>
              </div>
              <button className="btn-primary" onClick={() => { setVendorModalMode('add'); setVendorForm({ name: '', contact: '', email: '', status: 'Active' }); setShowVendorModal(true); }}>
                ➕ Add Vendor
              </button>
            </div>

            <div className="premium-card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Vendor Name</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Contact</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors?.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{v.name}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{v.contact}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--color-text-secondary)' }}>{v.email}</td>
                      <td style={{ padding: '20px 24px' }}><span className={`badge ${v.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{v.status}</span></td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button className="btn-secondary" onClick={() => { setVendorModalMode('edit'); setEditingVendorId(v.id); setVendorForm({ name: v.name, contact: v.contact, email: v.email, status: v.status }); setShowVendorModal(true); }} style={{ fontSize: '12px', padding: '6px 12px' }}>✏️ Edit</button>
                      </td>
                    </tr>
                  ))}
                  {(!vendors || vendors.length === 0) && (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No vendors found.</td></tr>
                  )}
                </tbody>
              </table>
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
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
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

      {/* --- ADD/EDIT STAFF MODAL --- */}
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
            <h2 style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '24px' }}>
              {staffModalMode === 'edit' ? '✏️ Edit Staff Account' : '👔 Create Staff Account'}
            </h2>
            
            <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Email (Optional)</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. vikas@cafeos.com"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Phone (Optional)</label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowStaffModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {staffModalMode === 'edit' ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT INVENTORY MODAL --- */}
      {showInventoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '500px', padding: '40px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '24px' }}>
              {inventoryModalMode === 'edit' ? '✏️ Edit Inventory Item' : '➕ Add Inventory Item'}
            </h2>
            
            <form onSubmit={handleInventorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Item Name</label>
                <input
                  type="text"
                  value={inventoryForm.name}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                  placeholder="e.g. Coffee Beans (Arabica)"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Unit</label>
                  <input
                    type="text"
                    value={inventoryForm.unit}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                    placeholder="e.g. kg, L, pcs"
                    required
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryForm.unit_cost}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, unit_cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Current Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryForm.current_stock}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, current_stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Low Stock Alert</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryForm.low_stock_threshold}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, low_stock_threshold: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowInventoryModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT VENDOR MODAL --- */}
      {showVendorModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div className="premium-card animate-scale-in" style={{ width: '420px', padding: '40px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '24px' }}>
              {vendorModalMode === 'edit' ? '✏️ Edit Vendor' : '➕ Add Vendor'}
            </h2>
            
            <form onSubmit={handleVendorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Vendor Name</label>
                <input
                  type="text"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Best Suppliers Co."
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Contact Number</label>
                <input
                  type="tel"
                  value={vendorForm.contact}
                  onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Email</label>
                <input
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="e.g. sales@vendor.com"
                />
              </div>

              {vendorModalMode === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Status</label>
                  <select
                    value={vendorForm.status}
                    onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowVendorModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
