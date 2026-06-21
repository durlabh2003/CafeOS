import React, { useState, useEffect } from 'react';
import { CafeProvider, useCafe } from './context/CafeContext';
import Login from './views/Login/Login';
import OwnerDashboard from './views/Owner/OwnerDashboard';
import ManagerDashboard from './views/Manager/ManagerDashboard';
import CashierDashboard from './views/Cashier/CashierDashboard';
import ChefDashboard from './views/Chef/ChefDashboard';
import CustomerDashboard from './views/Customer/CustomerDashboard';
import SetupWizard from './views/Onboarding/SetupWizard';

function AppContent() {
  const { currentStaff } = useCafe();
  const [simulatedCustomerTableId, setSimulatedCustomerTableId] = useState(null);
  const [setupComplete, setSetupComplete] = useState(() => localStorage.getItem('cafeos_setup_complete') === 'true');

  // Update URL to match current screen
  useEffect(() => {
    let path = '/login';
    if (simulatedCustomerTableId) {
      path = `/customer/table/${simulatedCustomerTableId}`;
    } else if (currentStaff) {
      if (currentStaff.role === 'Owner') path = setupComplete ? '/owner' : '/setup';
      else if (currentStaff.role === 'Manager') path = '/manager';
      else if (currentStaff.role === 'Counter Operator') path = '/cashier';
      else if (currentStaff.role === 'Kitchen Staff') path = '/chef';
    }
    
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [currentStaff, simulatedCustomerTableId, setupComplete]);

  // Simulated Customer Dine-In Interface via QR Click
  if (simulatedCustomerTableId) {
    return (
      <div className="app-container theme-customer">
        <div style={{ position: 'fixed', bottom: '16px', left: '16px', zIndex: 9999 }}>
          <button
            onClick={() => setSimulatedCustomerTableId(null)}
            style={{
              background: '#ea580c',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            🔌 Exit Customer Simulator
          </button>
        </div>
        <CustomerDashboard
          initialTableId={simulatedCustomerTableId}
          onExit={() => setSimulatedCustomerTableId(null)}
        />
      </div>
    );
  }

  // Enforce Sign-In screen if no session active
  if (!currentStaff) {
    return (
      <Login onSimulateCustomerQR={(tableId) => setSimulatedCustomerTableId(tableId)} />
    );
  }

  // Enforce RBAC Portal layouts
  switch (currentStaff.role) {
    case 'Owner':
      if (!setupComplete) {
        return <SetupWizard onComplete={() => setSetupComplete(true)} />;
      }
      return <OwnerDashboard />;
    case 'Manager':
      return <ManagerDashboard />;
    case 'Counter Operator':
      return <CashierDashboard />;
    case 'Kitchen Staff':
      return <ChefDashboard />;
    default:
      return (
        <Login onSimulateCustomerQR={(tableId) => setSimulatedCustomerTableId(tableId)} />
      );
  }
}

function AppWrapper() {
  const { otpNotifications } = useCafe();
  return (
    <>
      <AppContent />
      {/* SMS OTP Simulated Alert Toast */}
      {otpNotifications && otpNotifications.length > 0 && (
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
            <div key={notif.id} className="glass-panel" style={{
              padding: '16px',
              borderLeft: '4px solid var(--color-customer)',
              boxShadow: 'var(--shadow-xl)',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-customer)' }}>💬 Simulated SMS Gateway</span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Just Now</span>
              </div>
              <p style={{ fontSize: '13px', color: '#0f172a', lineHeight: '1.4' }}>
                Your CafeOS verification code is <strong style={{ color: '#0f172a', fontSize: '15px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.08)' }}>{notif.code}</strong>. Valid for 5 minutes.
              </p>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                Sent to {notif.mobile}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <CafeProvider>
      <AppWrapper />
    </CafeProvider>
  );
}

