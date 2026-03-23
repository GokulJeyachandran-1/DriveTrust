import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Truck, ShieldAlert, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { styles } from '../../utils/styles';
import { useAuth } from '../../../auth/auth';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import OverviewTab from './OverviewTab';
import UsersTab from './UsersTab';
import TripsTab from './TripsTab';
import SosTab from './SosTab';
import PaymentsTab from './PaymentsTab';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users & KYC', icon: Users },
  { id: 'trips', label: 'Trips', icon: Truck },
  { id: 'sos', label: 'SOS Alerts', icon: ShieldAlert },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const width = useWindowWidth();
  const isDesktop = width >= 1200;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'trips': return <TripsTab />;
      case 'sos': return <SosTab />;
      case 'payments': return <PaymentsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: styles.colors.background, fontFamily: styles.typography.fontFamily }}>

      {/* Mobile Overlay */}
      {sidebarOpen && !isDesktop && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 199 }} />}

      {/* Sidebar */}
      <aside style={{
        width: isDesktop ? '260px' : '280px',
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 200,
        transition: 'transform 0.3s ease',
        transform: !isDesktop && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)'
      }}>
        <div style={{ padding: '28px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>DriveTrust</h1>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>ADMIN PANEL</span>
          </div>
          {!isDesktop && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><X size={20} /></button>}
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? '#818CF8' : 'rgba(255,255,255,0.5)',
                  fontWeight: isActive ? 700 : 500, fontSize: '14px',
                  fontFamily: styles.typography.fontFamily,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444',
              fontWeight: 600, fontSize: '14px', width: '100%',
              fontFamily: styles.typography.fontFamily
            }}
          >
            <LogOut size={18} /> Sign Out
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: isDesktop ? '260px' : 0, minHeight: '100vh', overflowX: 'hidden', minWidth: 0 }}>
        {/* Top bar for mobile */}
        {!isDesktop && (
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${styles.colors.border}`, backgroundColor: styles.colors.surface, position: 'sticky', top: 0, zIndex: 100 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: styles.colors.textMain }}>DriveTrust Admin</h2>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.textMain, padding: '8px' }}>
              <Menu size={24} />
            </button>
          </div>
        )}

        <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
