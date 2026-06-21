import React from 'react';
import { useCafe } from '../context/CafeContext';

export const PersonaSwitcher = ({ currentPersona, setCurrentPersona }) => {
  const { tables, orders, otpNotifications } = useCafe();

  const occupiedTables = tables.filter(t => t.status === 'Occupied' || t.status === 'Billing Pending').length;
  const activeKdsTickets = orders.filter(o => o.status !== 'Completed' && o.status !== 'Served' && o.status !== 'Cancelled').length;

  const personas = [
    {
      id: 'owner',
      name: 'Owner Portal',
      icon: '👑',
      desc: 'Analytics & Config',
      theme: 'owner'
    },
    {
      id: 'pos',
      name: 'POS Terminal',
      icon: '🖥️',
      desc: 'Billing & Cashier',
      theme: 'pos',
      badge: occupiedTables > 0 ? `${occupiedTables} Active` : null
    },
    {
      id: 'kds',
      name: 'Kitchen Display',
      icon: '🍳',
      desc: 'Chefs & Tickets',
      theme: 'kds',
      badge: activeKdsTickets > 0 ? `${activeKdsTickets} Tickets` : null
    },
    {
      id: 'customer',
      name: 'Customer Dine-In',
      icon: '📱',
      desc: 'Self-Order (QR)',
      theme: 'customer'
    }
  ];

  return (
    <>
      <header className="persona-switcher-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 100,
        height: '72px',
        position: 'sticky',
        top: 0,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Logo and App Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>☕</span>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CaféOS</h1>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>SaaS Simulator</p>
          </div>
        </div>

        {/* Persona Navigation Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          {personas.map((p) => {
            const isActive = currentPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setCurrentPersona(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: isActive ? `var(--color-bg-base)` : 'transparent',
                  border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '18px' }}>{p.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: isActive ? `var(--color-${p.id})` : 'var(--color-text-secondary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{p.desc}</div>
                </div>

                {p.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: p.id === 'pos' ? 'var(--color-pos)' : 'var(--color-kds)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '99px',
                    border: '2px solid var(--color-bg-base)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Status Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: '500' }}>Active Session</div>
            <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulseBorder 2s infinite' }}></span>
              Connected
            </div>
          </div>
        </div>
      </header>

      {/* SMS OTP Simulated Alert Toast (Floating in Bottom-Right for Testing) */}
      {otpNotifications.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '320px',
          animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {otpNotifications.map((notif) => (
            <div className="glass-panel" style={{
              padding: '16px',
              borderLeft: '4px solid var(--color-customer)',
              boxShadow: 'var(--shadow-xl)',
              background: 'var(--color-bg-card)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-customer)' }}>💬 Simulated SMS Gateway</span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Just Now</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                Your CafeOS verification code is <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>{notif.code}</strong>. Valid for 5 minutes.
              </p>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '6px', textAlign: 'right' }}>
                Sent to {notif.mobile}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
