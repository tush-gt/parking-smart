import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Zap, Car } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-screen">
      <nav className="landing-nav">
        <div className="landing-logo">
          <Car size={28} color="#2563eb" /> Smart Parking
        </div>
      </nav>
      
      <main className="landing-hero">
        <h1>Enterprise Parking Management Platform</h1>
        <p>
          Real-time slot monitoring, dynamic booking tracking, and comprehensive revenue analytics for mall operators and parking facility managers.
        </p>
        <div className="landing-actions">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Admin Login
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>
            Super Admin Login
          </button>
        </div>

        <div style={{ display: 'flex', gap: '48px', marginTop: '80px' }}>
          <div style={{ textAlign: 'center' }}>
            <Activity size={32} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Real-time Tracking</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '200px' }}>Monitor live slots and active bookings instantly.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Zap size={32} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Dynamic Control</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '200px' }}>Open, close, or manually adjust capacity on the fly.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ShieldCheck size={32} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Secure Roles</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '200px' }}>Strict access control for operators and super admins.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
