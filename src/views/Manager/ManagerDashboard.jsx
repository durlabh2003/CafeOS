import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';

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
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
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
      <aside style={{ width: '280px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-sidebar)', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', zIndex: 10 }}>
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

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    
                    <div style={{ width: '120px', height: '120px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justify: 'center', background: 'var(--color-bg-base)', position: 'relative' }}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <path d="M0 0h30v30H0zm40 0h30v10H40zm0 20h10v10H40zm30-20h30v30H70zm0 40h10v30H70zm20 10h10v20H90zm-90 20h30v30H0zm50 20h10v10H50z" fill="#0f172a" />
                        <path d="M10 10h10v10H10zm70 0h10v10H80zM10 80h10v10H10z" fill="var(--color-customer)" />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: '11px', fontWeight: '800', background: '#fff', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>{table.id}</span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '700', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>{table.name}</div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => alert(`Downloading Print PDF package for ${table.name}`)} style={{ flex: 1, fontSize: '12px', padding: '8px', justifyContent: 'center' }}>
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
              <button className="btn-primary" onClick={() => alert('Add Staff modal would open here')}>
                ➕ Add Staff Member
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {staff.map(s => (
                <div key={s.id} className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>{s.name}</span>
                    <span className={`badge ${s.role === 'Owner' ? 'badge-danger' : s.role === 'Manager' ? 'badge-warning' : 'badge-info'}`}>
                      {s.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Email: {s.email}</div>
                  
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: 'auto' }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>✏️ Edit</button>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>🔑 Reset Pwd</button>
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
    </div>
  );
}
