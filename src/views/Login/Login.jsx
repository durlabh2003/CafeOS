import { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import QRCode from 'qrcode';

export default function Login({ onSimulateCustomerQR }) {
  const { loginStaff, tables } = useCafe();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTableQR, setSelectedTableQR] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (selectedTableQR) {
      const url = `${window.location.origin}/order?t=${selectedTableQR.id}`;
      QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#ea580c', light: '#ffffff' } })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [selectedTableQR]);

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginStaff(email, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const demoAccounts = [
    { label: '👑 Owner Account', email: 'owner@cafeos.com', pass: 'owner123', role: 'Owner' },
    { label: '💼 Manager Account', email: 'manager@cafeos.com', pass: 'manager123', role: 'Manager' },
    { label: '🖥️ POS Cashier', email: 'cashier@cafeos.com', pass: 'cashier123', role: 'Counter Operator' },
    { label: '🍳 Kitchen Chef', email: 'chef@cafeos.com', pass: 'chef123', role: 'Kitchen Staff' }
  ];

  const handleQuickLogin = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    const res = loginStaff(demo.email, demo.pass);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: '#0f172a',
      position: 'relative'
    }}>
      
      {/* MVP Role & Functionality Guide Modal */}
      {showGuide && (
        <div 
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(4px)', animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '700px',
              maxHeight: '90vh', overflowY: 'auto', padding: '40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Welcome to CaféOS MVP 🚀</h2>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>Here is a quick guide to the different roles and their functionalities in this system.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c', marginBottom: '4px' }}>👑 Owner</div>
                <div style={{ fontSize: '13px', color: '#475569' }}><strong>Flow:</strong> Logs in to oversee the entire business. <br/><strong>Functionality:</strong> Access to sales analytics, menu management, employee management, and full POS capabilities.</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>💼 Manager</div>
                <div style={{ fontSize: '13px', color: '#475569' }}><strong>Flow:</strong> Logs in for daily operational control. <br/><strong>Functionality:</strong> Inventory tracking, active order supervision, and generating daily business reports.</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>🖥️ POS Cashier</div>
                <div style={{ fontSize: '13px', color: '#475569' }}><strong>Flow:</strong> Handles walk-in customers and dine-in billing. <br/><strong>Functionality:</strong> Creates orders via POS, processes cash/card payments, clears tables, and issues receipts.</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>🍳 Kitchen Chef</div>
                <div style={{ fontSize: '13px', color: '#475569' }}><strong>Flow:</strong> Operates the Kitchen Display System (KDS). <br/><strong>Functionality:</strong> Receives incoming orders in real-time, updates status (Preparing ➔ Ready), automatically notifying the front-of-house.</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>📱 Customer (Dine-In)</div>
                <div style={{ fontSize: '13px', color: '#475569' }}><strong>Flow:</strong> Scans table QR code ➔ Browses Menu ➔ Orders ➔ Requests Bill. <br/><strong>Functionality:</strong> Contactless mobile ordering directly to the kitchen, real-time cart, and status tracking.</div>
              </div>
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              style={{
                marginTop: '32px', width: '100%', padding: '14px', background: '#0f172a', color: '#fff',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#1e293b'}
              onMouseLeave={(e) => e.target.style.background = '#0f172a'}
            >
              Got it, let's start!
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel responsive-flex-col responsive-full-width" style={{
        width: '1000px',
        maxWidth: '100%',
        background: 'rgba(255,255,255,0.85)',
        display: 'flex',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
        minHeight: '580px'
      }}>
        
        {/* Customer Self-Order Simulator (Left Panel) */}
        <div style={{
          flex: 1,
          padding: '48px',
          background: 'rgba(234, 88, 12, 0.03)',
          borderRight: '1px solid rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {selectedTableQR ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              <button 
                onClick={() => setSelectedTableQR(null)}
                style={{ position: 'absolute', top: '24px', left: '24px', background: 'rgba(15, 23, 42, 0.05)', border: 'none', padding: '8px 12px', borderRadius: '8px', color: '#0f172a', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.05)'}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px', color: '#ea580c', marginTop: '20px' }}>Table {selectedTableQR.id.slice(-2)}</h2>
              
              {qrCodeDataUrl ? (
                <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '24px' }}>
                  <img src={qrCodeDataUrl} alt="Table QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '252px', height: '252px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '16px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>Loading...</div>
              )}
              
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Scan to order now</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', maxWidth: '280px', lineHeight: '1.5' }}>Point your mobile camera at this QR code to open the ordering menu.</p>
              
              <button
                onClick={() => onSimulateCustomerQR(selectedTableQR.id)}
                style={{
                  background: 'transparent', border: '1px solid #ea580c', color: '#ea580c', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#ea580c'; e.target.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ea580c'; }}
              >
                Or Simulate on Desktop
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#ea580c' }}>Customer Dine-In Portal</h2>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '32px' }}>
                Select a table to display its QR code for ordering.
              </p>

              <div className="grid-cols-4" style={{ gap: '10px' }}>
                {tables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTableQR(t)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(234, 88, 12, 0.15)',
                      borderRadius: '12px',
                      padding: '16px 0',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ea580c',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.background = 'rgba(234, 88, 12, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.background = '#ffffff';
                    }}
                  >
                    Table {t.id.slice(-2)}
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                QR codes are generated dynamically for each table.
              </div>
            </>
          )}
        </div>

        {/* Staff/Owner Login (Right Panel) */}
        <div style={{
          flex: 1.2,
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>CaféOS Staff Portal</h2>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>Log in using your staff email credentials to access your workspace.</p>
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#b91c1c',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Email Address</label>
              <input
                type="email"
                placeholder="staff@cafeos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ fontSize: '14px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ fontSize: '14px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#4f46e5',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              Sign In to Workspace
            </button>
          </form>

          {/* Quick Login Cheat Sheet */}
          <div style={{
            borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
              🔑 Quick Login Cheat Sheet
            </span>
            <div className="grid-cols-2" style={{ gap: '8px' }}>
              {demoAccounts.map(demo => (
                <div
                  key={demo.email}
                  onClick={() => handleQuickLogin(demo)}
                  style={{
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{demo.label}</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Click to auto login</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
