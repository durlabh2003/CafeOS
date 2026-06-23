import { useState } from 'react';
import { useCafe } from '../../context/CafeContext';

export default function Login({ onSimulateCustomerQR }) {
  const { loginStaff, tables } = useCafe();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDemoAccount, setSelectedDemoAccount] = useState(null);
  const [pinInput, setPinInput] = useState('');

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
    setSelectedDemoAccount(demo);
    setPinInput('');
    setErrorMsg('');
  };

  const handlePinEntry = (digit) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === '1234') {
          const res = loginStaff(selectedDemoAccount.email, selectedDemoAccount.pass);
          if (!res.success) {
            setErrorMsg(res.message);
            setPinInput('');
          }
        } else {
          setErrorMsg('Invalid PIN. Please try 1234 for the MVP demo.');
          setPinInput('');
        }
      }
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
      color: '#0f172a'
    }}>
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
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#ea580c' }}>Customer Dine-In Portal</h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '32px' }}>
            Simulate scanning a table QR code. Choose your table number to load the mobile dine-in ordering flow.
          </p>

          <div className="grid-cols-4" style={{ gap: '10px' }}>
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => onSimulateCustomerQR(t.id)}
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
            Simulator simulates QR scan redirection to table specific links.
          </div>
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

          {selectedDemoAccount ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedDemoAccount.label} PIN</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Enter 4-digit MVP PIN (1234)</div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: i < pinInput.length ? '#4f46e5' : '#e2e8f0',
                    transition: 'all 0.2s'
                  }} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '240px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handlePinEntry(num.toString())} style={{ padding: '16px', fontSize: '20px', fontWeight: '800', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>{num}</button>
                ))}
                <button onClick={() => { setSelectedDemoAccount(null); setPinInput(''); }} style={{ padding: '16px', fontSize: '14px', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>Cancel</button>
                <button onClick={() => handlePinEntry('0')} style={{ padding: '16px', fontSize: '20px', fontWeight: '800', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>0</button>
                <button onClick={() => setPinInput(p => p.slice(0, -1))} style={{ padding: '16px', fontSize: '16px', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>Del</button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

        </div>

      </div>
    </div>
  );
}
