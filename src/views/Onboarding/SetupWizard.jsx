import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';

export default function SetupWizard({ onComplete }) {
  const { cafeProfile, setCafeProfile } = useCafe();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: cafeProfile.name || '',
    phone: cafeProfile.phone || '',
    address: cafeProfile.address || '',
    gstNumber: cafeProfile.gstNumber || '',
    currency: '₹',
    tablesCount: 6
  });

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleComplete = async (e) => {
    e.preventDefault();
    setCafeProfile({ ...cafeProfile, ...formData });
    // In a real app, we would update supabase cafe_profile here and generate tables.
    localStorage.setItem('cafeos_setup_complete', 'true');
    onComplete();
  };

  return (
    <div className="app-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg-sidebar)' }}>
      <div className="premium-card" style={{ width: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '32px 40px', background: 'var(--color-owner)', color: '#fff' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>CaféOS Setup Wizard</h1>
          <p style={{ opacity: 0.9 }}>Let's get your business ready for operations.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', height: '4px', background: 'rgba(0,0,0,0.05)' }}>
          <div style={{ width: `${(step / 3) * 100}%`, background: 'var(--color-success)', transition: 'width 0.3s' }}></div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '40px', flex: 1 }}>
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>1. Basic Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Café Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. The Velvet Bean" style={{ fontSize: '15px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Contact Phone</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +91 9876543210" style={{ fontSize: '15px' }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>2. Legal & Location</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>GSTIN Number</label>
                <input type="text" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} placeholder="Required for Tax Invoices" style={{ fontSize: '15px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Physical Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="3" placeholder="Full address" style={{ fontSize: '15px' }} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>3. Floor Layout</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>How many tables do you have? We will auto-generate them and create your QR codes instantly.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Number of Tables</label>
                <input type="number" min="1" value={formData.tablesCount} onChange={e => setFormData({...formData, tablesCount: parseInt(e.target.value) || 1})} style={{ fontSize: '16px', width: '120px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '24px 40px', background: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <button className="btn-secondary" onClick={handlePrev}>Back</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext} disabled={!formData.name}>Next Step</button>
          ) : (
            <button className="btn-primary" onClick={handleComplete} style={{ background: 'var(--color-success)' }}>🚀 Finish & Launch</button>
          )}
        </div>
      </div>
    </div>
  );
}
