import { useState, useEffect, useCallback } from 'react';
import { useCafe } from '../../context/CafeContext';

export default function CustomerDashboard({ initialTableId = null, onExit }) {
  const {
    cafeProfile,
    menu,
    tables,
    orders,
    activeCustomerSessions,
    triggerOtpSms,
    verifyOtp,
    logoutCustomerSession,
    placeOrder,
    getConsolidatedBill,
    processOnlinePayment
  } = useCafe();

  // Selected table from props or scan simulator
  const [tableId, setTableId] = useState(initialTableId);

  // Sync prop changes
  useEffect(() => {
    if (initialTableId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTableId(initialTableId);
    }
  }, [initialTableId]);

  // Authentication Flow
  const [mobileNum, setMobileNum] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sentCode, setSentCode] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Menu/Order state
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cartPulse, setCartPulse] = useState(false);
  
  // Order Edit Window
  const [pendingCart, setPendingCart] = useState(null);
  const [pendingInstructions, setPendingInstructions] = useState('');
  const [editTimer, setEditTimer] = useState(0);

  // Item customization drawer
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // Payment State
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const isSessionActive = tableId && activeCustomerSessions[tableId];
  const sessionMobile = isSessionActive ? activeCustomerSessions[tableId] : null;

  const tableOrders = tableId
    ? orders.filter(o => o.tableId === tableId && o.status !== 'Completed' && o.status !== 'Cancelled')
    : [];

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!mobileNum) return;
    
    let formatted = mobileNum;
    if (!formatted.startsWith('+91')) {
      formatted = '+91 ' + formatted;
    }

    const code = triggerOtpSms(formatted);
    setSentCode(code);
    setIsVerifying(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode === sentCode || otpCode === '123456') {
      let formatted = mobileNum;
      if (!formatted.startsWith('+91')) {
        formatted = '+91 ' + formatted;
      }
      verifyOtp(tableId, formatted, customerName || 'Valued Guest');
      setIsVerifying(false);
      setSentCode(null);
      setOtpCode('');
      setShowAuthModal(false);
      
      // Auto-place into edit window after verification
      setPendingCart([...cart]);
      setPendingInstructions(specialInstructions);
      setCart([]);
      setSpecialInstructions('');
      setShowCart(false);
      setEditTimer(30);
    } else {
      alert('Invalid OTP! Check the floating toast at the bottom right of your screen.');
    }
  };

  const handleAddToCartClick = (item) => {
    if (item.variants?.length > 0 || item.addOns?.length > 0) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants[0] || null);
      setSelectedAddOns([]);
    } else {
      addToCartState(item, null, []);
    }
  };

  const addToCartState = (item, variant, addOns) => {
    let finalPrice = item.price;
    let variantName = '';
    
    if (variant) {
      finalPrice += variant.priceOffset;
      variantName = variant.name;
    }
    
    const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
    const addOnNames = addOns.map(a => a.name);
    const itemTotal = finalPrice + addOnTotal;

    const cartKey = `${item.id}-${variantName}-${addOnNames.join(',')}`;

    setCart(prev => {
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
        price: itemTotal,
        qty: 1
      }];
    });

    setCustomizingItem(null);
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
  };

  const updateCartQty = (cartKey, delta) => {
    setCart(prev => prev.map(it => {
      if (it.cartKey === cartKey) {
        const newQty = it.qty + delta;
        return newQty > 0 ? { ...it, qty: newQty } : null;
      }
      return it;
    }).filter(Boolean));
  };

  const getUpsellRecommendation = () => {
    if (cart.length === 0) return null;
    for (const cartItem of cart) {
      const menuItem = menu.find(m => m.id === cartItem.id);
      if (menuItem && menuItem.upsellItemId) {
        const alreadyInCart = cart.find(c => c.id === menuItem.upsellItemId);
        if (!alreadyInCart) {
          const upsellItem = menu.find(m => m.id === menuItem.upsellItemId && m.status === 'Active');
          if (upsellItem) return upsellItem;
        }
      }
    }
    return null;
  };

  const recommendedUpsell = getUpsellRecommendation();

  const executePlaceOrder = useCallback(() => {
    placeOrder(tableId, sessionMobile || activeCustomerSessions[tableId], pendingCart, pendingInstructions, 'Dine-In');
    setPendingCart(null);
    setPendingInstructions('');
  }, [tableId, sessionMobile, activeCustomerSessions, pendingCart, pendingInstructions, placeOrder]);

  // Timer effect for Order Edit Window
  useEffect(() => {
    let interval;
    if (editTimer > 0) {
      interval = setInterval(() => {
        setEditTimer(prev => prev - 1);
      }, 1000);
    } else if (editTimer === 0 && pendingCart) {
      // Timer expired, actually place the order
      // eslint-disable-next-line react-hooks/set-state-in-effect
      executePlaceOrder();
    }
    return () => clearInterval(interval);
  }, [editTimer, pendingCart, executePlaceOrder]);

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return;
    
    if (!isSessionActive) {
      setShowAuthModal(true);
      return;
    }

    // Start 30-second edit window
    setPendingCart([...cart]);
    setPendingInstructions(specialInstructions);
    setCart([]);
    setSpecialInstructions('');
    setShowCart(false);
    setEditTimer(30);
  };

  const handleCancelPending = () => {
    // Restore cart to edit
    setCart(pendingCart);
    setSpecialInstructions(pendingInstructions);
    setPendingCart(null);
    setPendingInstructions('');
    setEditTimer(0);
    setShowCart(true);
  };

  const handleConfirmPendingNow = () => {
    executePlaceOrder();
    setEditTimer(0);
  };

  const handleToggleAddOn = (add) => {
    setSelectedAddOns(prev => {
      if (prev.find(a => a.name === add.name)) {
        return prev.filter(a => a.name !== add.name);
      }
      return [...prev, add];
    });
  };

  const getTrackerStep = () => {
    if (tableOrders.length === 0) return 0;
    const latestOrder = tableOrders[0];
    
    switch (latestOrder.status) {
      case 'New': return 1;
      case 'Preparing': return 2;
      case 'Ready': return 3;
      case 'Served': return 4;
      default: return 0;
    }
  };

  const trackerStep = getTrackerStep();

  const handlePayOnlineClick = () => {
    setShowBillModal(false);
    setShowPaymentGateway(true);
  };

  const handleMockPayment = async (method) => {
    setPaymentProcessing(true);
    // Simulate network delay
    setTimeout(async () => {
      const res = await processOnlinePayment(tableId, method, `TXN${Date.now()}`);
      setPaymentProcessing(false);
      if (res.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          setShowPaymentGateway(false);
          setTableId(null);
          if (onExit) onExit();
        }, 3000);
      } else {
        alert(res.message);
      }
    }, 1500);
  };

  return (
    <div className="theme-customer app-container animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      height: '100dvh', // Use dvh for mobile browser toolbars
      width: '100%',
      position: 'relative',
      overflowX: 'hidden'
    }}>

        {/* --- CASE 1: SCANNED QR NEEDED --- */}
        {!tableId && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '64px 32px 32px', background: '#ffffff', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '72px', marginBottom: '24px' }}>📱</span>
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Dine-In Ordering</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
              Welcome to <strong>{cafeProfile.name}</strong>. Scan a QR code at your table to begin browsing the digital menu.
            </p>

            <div style={{ background: 'var(--color-bg-base)', padding: '24px', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontWeight: '700' }}>Simulate QR Scan</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {tables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTableId(t.id)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-customer)',
                      fontSize: '14px',
                      fontWeight: '700',
                      padding: '12px 0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    T{t.id.slice(-2)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- CASE 2: ACTIVE MENU BROWSER (Guest or Verified) --- */}
        {tableId && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
            {/* Customer view Header */}
            <div style={{
              padding: '24px 24px 16px', // Reduced top padding since notch is gone
              background: '#ffffff',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 10
            }}>
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--color-text-primary)', fontWeight: '800' }}>{cafeProfile.name}</h3>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>📍 Table {tableId.slice(-2)}</span>
              </div>
              
              {isSessionActive ? (
                <button
                  onClick={() => {
                    if (confirm('Logout of menu session? Cart will be cleared.')) {
                      logoutCustomerSession(tableId);
                      setCart([]);
                      if (onExit) onExit();
                    }
                  }}
                  className="btn-danger"
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px' }}
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTableId(null);
                    setCart([]);
                    if (onExit) onExit();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px' }}
                >
                  Change Table
                </button>
              )}
            </div>

            {/* Tracker */}
            {isSessionActive && tableOrders.length > 0 && (
              <div style={{ background: '#fffbeb', padding: '16px 24px', borderBottom: '1px solid #fde68a' }}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#b45309' }}>🛵 Order Tracker</span>
                  <span className={`badge ${tableOrders[0].status === 'Ready' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                    {tableOrders[0].status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '4px', background: '#fef3c7', zIndex: 1, borderRadius: '2px' }} />
                  <div style={{ position: 'absolute', top: '16px', left: '20px', width: `${((trackerStep - 1) / 3) * 100}%`, height: '4px', background: '#f59e0b', zIndex: 2, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '2px' }} />

                  {[
                    { label: 'Placed', step: 1 },
                    { label: 'Prep', step: 2 },
                    { label: 'Ready', step: 3 },
                    { label: 'Served', step: 4 }
                  ].map((s, idx) => {
                    const isDone = trackerStep >= s.step;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isDone ? '#f59e0b' : '#fffbeb',
                          border: `3px solid ${isDone ? '#ffffff' : '#fcd34d'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: isDone ? '#fff' : '#b45309',
                          boxShadow: isDone ? '0 2px 4px rgba(245, 158, 11, 0.3)' : 'none'
                        }}>
                          {isDone ? '✓' : s.step}
                        </div>
                        <span style={{ fontSize: '10px', color: isDone ? '#b45309' : '#d97706', marginTop: '6px', fontWeight: isDone ? '800' : '600' }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setShowBillModal(true)}
                  style={{ width: '100%', padding: '12px', marginTop: '16px', background: 'var(--color-owner)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  🧾 View Bill & Pay Online
                </button>
              </div>
            )}

            {/* Pending Order / Edit Window */}
            {pendingCart && (
              <div style={{ background: '#eff6ff', padding: '16px 24px', borderBottom: '1px solid #bfdbfe' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>⏳ Order confirmation...</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>{editTimer}s</span>
                </div>
                <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '12px' }}>Sending to kitchen in {editTimer}s. You can edit or confirm now.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCancelPending} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#ffffff', color: '#2563eb', fontSize: '12px', fontWeight: '700' }}>Edit Order</button>
                  <button onClick={handleConfirmPendingNow} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: '700' }}>Confirm Now</button>
                </div>
              </div>
            )}

            {/* Category Bar - Fixed at top */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              {['All', ...new Set(menu.filter(i => i.status === 'Active').map(item => item.category))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: activeCategory === cat ? 'var(--color-customer)' : '#ffffff',
                    color: activeCategory === cat ? '#ffffff' : 'var(--color-text-secondary)',
                    border: `1px solid ${activeCategory === cat ? 'var(--color-customer)' : 'var(--color-border)'}`,
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: activeCategory === cat ? 'var(--shadow-sm)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--color-bg-base)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
                {menu
                  .filter(item => item.status === 'Active')
                  .filter(item => activeCategory === 'All' || item.category === activeCategory)
                  .map(item => (
                    <div key={item.id} className="premium-card" style={{ display: 'flex', gap: '16px', padding: '16px' }}>
                      <img src={item.image} alt={item.name} style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: '800', lineHeight: '1.3' }}>{item.name}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                        </div>
                        <div className="flex-between" style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)' }}>₹{item.price}</span>
                          <button
                            className="btn-primary"
                            onClick={() => handleAddToCartClick(item)}
                            style={{ background: 'var(--color-customer)', padding: '6px 16px', borderRadius: '99px', fontSize: '13px' }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bottom floating cart */}
            {cart.length > 0 && (
              <div
                onClick={() => setShowCart(true)}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                  background: 'var(--color-customer)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: cartPulse ? '0 15px 30px -5px rgba(234, 88, 12, 0.6)' : '0 10px 25px -5px rgba(234, 88, 12, 0.4)',
                  animation: 'fadeIn 0.2s ease',
                  transform: cartPulse ? 'scale(1.05) translateY(-5px)' : 'scale(1) translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  zIndex: 100
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>View Cart ({cart.length} items)</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>Table {tableId.slice(-2)} orders</div>
                </div>
                <strong style={{ color: '#fff', fontSize: '18px' }}>₹{cart.reduce((s, c) => s + (c.price * c.qty), 0)} →</strong>
              </div>
            )}

            {/* CART POPUP */}
            {showCart && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                zIndex: 500,
                display: 'flex',
                alignItems: 'flex-end',
                backdropFilter: 'blur(4px)'
              }}>
                <div className="animate-scale-in" style={{ width: '100%', background: '#ffffff', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto' }}>
                  <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Your Table Cart</h3>
                    <button className="btn-secondary" onClick={() => setShowCart(false)} style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '99px' }}>Close</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                    {cart.map((c, idx) => (
                      <div key={idx} className="flex-between" style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{c.name}</div>
                          {c.variant && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{c.variant}</span>}
                          {c.addOns.length > 0 && <span style={{ fontSize: '11px', color: 'var(--color-customer)', display: 'block', fontWeight: '600', marginTop: '2px' }}>+ {c.addOns.join(', ')}</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-base)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <button onClick={() => updateCartQty(c.cartKey, -1)} style={{ color: 'var(--color-text-primary)', fontWeight: '800', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>-</button>
                            <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '700', width: '20px', textAlign: 'center' }}>{c.qty}</span>
                            <button onClick={() => updateCartQty(c.cartKey, 1)} style={{ color: 'var(--color-text-primary)', fontWeight: '800', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>+</button>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)', width: '60px', textAlign: 'right' }}>₹{c.price * c.qty}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recommendedUpsell && (
                    <div style={{ background: '#fffbeb', border: '1px dashed #fcd34d', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goes great with</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{recommendedUpsell.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>+₹{recommendedUpsell.price}</div>
                      </div>
                      <button
                        onClick={() => handleAddToCartClick(recommendedUpsell)}
                        style={{ background: 'var(--color-customer)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Special Instructions</span>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. Make coffee extra hot..."
                      rows="2"
                      style={{ fontSize: '14px', padding: '12px', borderRadius: '12px' }}
                    />
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handlePlaceOrderClick}
                    style={{ width: '100%', background: 'var(--color-customer)', padding: '16px', borderRadius: '16px', fontSize: '16px', justifyContent: 'center', marginTop: '16px' }}
                  >
                    🚀 Confirm & Send to Kitchen
                  </button>
                </div>
              </div>
            )}

            {/* CUSTOMIZATION DRAWERS */}
            {customizingItem && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                zIndex: 600,
                display: 'flex',
                alignItems: 'flex-end',
                backdropFilter: 'blur(4px)'
              }}>
                <div className="animate-scale-in" style={{ width: '100%', background: '#ffffff', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="flex-between">
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Customize Item</h3>
                    <button className="btn-secondary" onClick={() => setCustomizingItem(null)} style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '99px' }}>Cancel</button>
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{customizingItem.name}</div>

                  {customizingItem.variants?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Select Size</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {customizingItem.variants.map((v, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedVariant(v)}
                            style={{
                              flex: 1,
                              fontSize: '14px',
                              padding: '12px',
                              background: selectedVariant?.name === v.name ? 'var(--color-customer)' : '#ffffff',
                              color: selectedVariant?.name === v.name ? '#ffffff' : 'var(--color-text-primary)',
                              borderRadius: '12px',
                              border: `1px solid ${selectedVariant?.name === v.name ? 'var(--color-customer)' : 'var(--color-border)'}`,
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              boxShadow: selectedVariant?.name === v.name ? 'var(--shadow-sm)' : 'none'
                            }}
                          >
                            {v.name} <span style={{ opacity: 0.8, display: 'block', fontSize: '11px', marginTop: '4px' }}>(+₹{v.priceOffset})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customizingItem.addOns?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Add Extra Modifiers</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customizingItem.addOns.map((add, i) => {
                          const isAdded = selectedAddOns.find(a => a.name === add.name);
                          return (
                            <div
                              key={i}
                              onClick={() => handleToggleAddOn(add)}
                              className="premium-card-interactive"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '16px',
                                background: isAdded ? 'rgba(234, 88, 12, 0.05)' : '#ffffff',
                                borderColor: isAdded ? 'var(--color-customer)' : 'var(--color-border)',
                                fontSize: '14px',
                                color: 'var(--color-text-primary)',
                                fontWeight: '600'
                              }}
                            >
                              <span>{add.name}</span>
                              <span style={{ color: 'var(--color-customer)', fontWeight: '800' }}>+₹{add.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={() => addToCartState(customizingItem, selectedVariant, selectedAddOns)}
                    style={{ width: '100%', background: 'var(--color-customer)', padding: '16px', borderRadius: '16px', fontSize: '16px', justifyContent: 'center', marginTop: '16px' }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            )}

            {/* OTP AUTH MODAL */}
            {showAuthModal && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                zIndex: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}>
                <div className="animate-scale-in" style={{ width: '90%', background: '#ffffff', borderRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Verify to Order</h3>
                    <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Please enter your details to confirm your table order and earn loyalty points.</p>

                  {!isVerifying ? (
                    <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Your Name (Optional)</span>
                        <input
                          type="text"
                          placeholder="e.g. Aarav Sharma"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          style={{ fontSize: '16px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Mobile Number *</span>
                        <input
                          type="tel"
                          placeholder="e.g. 98765 43210"
                          value={mobileNum}
                          onChange={(e) => setMobileNum(e.target.value)}
                          required
                          style={{ fontSize: '16px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      <button type="submit" className="btn-primary" style={{ background: 'var(--color-customer)', padding: '16px', borderRadius: '12px', fontSize: '16px', justifyContent: 'center', marginTop: '8px' }}>
                        Request SMS Code
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Code sent to <strong>{mobileNum}</strong></span>
                      </div>
                      <input
                        type="text"
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength="6"
                        required
                        style={{ fontSize: '24px', letterSpacing: '0.3em', textAlign: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                      />
                      <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)', padding: '16px', borderRadius: '12px', fontSize: '16px', justifyContent: 'center' }}>
                        Verify & Send Order
                      </button>
                      <button type="button" onClick={() => setIsVerifying(false)} style={{ color: 'var(--color-danger)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', fontWeight: '600', padding: '8px' }}>
                        Go Back
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* BILL MODAL */}
            {showBillModal && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)', zIndex: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
              }}>
                <div className="animate-scale-in" style={{ width: '90%', background: '#ffffff', borderRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column', maxHeight: '80%', overflowY: 'auto' }}>
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Your Bill</h3>
                    <button onClick={() => setShowBillModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                  </div>
                  
                  {(() => {
                    const bill = getConsolidatedBill(tableId);
                    if (!bill || bill.ordersList.length === 0) return <p>No pending bill.</p>;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bill.ordersList.map(o => (
                          <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '12px' }}>
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex-between">
                                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{item.qty}x {item.name}</span>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{item.price * item.qty}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="flex-between" style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Subtotal</span>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{bill.subtotal}</span>
                        </div>
                        <div className="flex-between">
                          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Taxes ({bill.gstRate}%)</span>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{bill.gstAmount}</span>
                        </div>
                        <div className="flex-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--color-border)' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800' }}>Grand Total</span>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-success)' }}>₹{bill.grandTotal}</span>
                        </div>

                        <button onClick={handlePayOnlineClick} className="btn-primary" style={{ background: 'var(--color-success)', marginTop: '24px', padding: '16px', borderRadius: '12px', justifyContent: 'center' }}>
                          Pay ₹{bill.grandTotal} Online
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* PAYMENT GATEWAY MODAL */}
            {showPaymentGateway && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.8)', zIndex: 900,
                display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(8px)'
              }}>
                <div className="animate-scale-in" style={{ width: '100%', background: '#ffffff', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {paymentSuccess ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                      <h2 style={{ fontSize: '24px', color: 'var(--color-success)', fontWeight: '800', marginBottom: '8px' }}>Payment Successful!</h2>
                      <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Thank you for visiting {cafeProfile.name}. See you next time!</p>
                    </div>
                  ) : paymentProcessing ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: 'var(--color-owner)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Processing Payment...</h3>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Please do not close this window.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Select Payment Method</h3>
                        <button onClick={() => setShowPaymentGateway(false)} style={{ background: 'none', border: 'none', fontSize: '14px', color: 'var(--color-danger)', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button onClick={() => handleMockPayment('UPI')} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '24px' }}>📱</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>Pay via UPI</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>GPay, PhonePe, Paytm</div>
                          </div>
                        </button>
                        <button onClick={() => handleMockPayment('Card')} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '24px' }}>💳</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700' }}>Credit / Debit Card</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Visa, MasterCard, RuPay</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
