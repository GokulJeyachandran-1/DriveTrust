import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Truck, 
  LogOut as LogOutIcon, 
  User,
  Search,
  X,
  MapPin,
  Settings
} from 'lucide-react';
import { styles } from '../../utils/styles';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const role = user?.role;
  const [showProfile, setShowProfile] = useState(false);

  const getNavLinks = () => {
    if (role === 'CUSTOMER') {
      return [
        { label: 'Market', path: '/customer', icon: <Home size={24} /> },
        { label: 'Trips', path: '/customer/trips', icon: <Package size={24} /> }
      ];
    } else if (role === 'DRIVER') {
      return [
        { label: 'Loads', path: '/driver', icon: <Search size={24} /> },
        { label: 'My Trips', path: '/driver/trips', icon: <Truck size={24} /> }
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  const ProfileModal = () => (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowProfile(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 1000
        }}
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        style={{
          position: 'fixed', 
          bottom: isMobile ? 80 : 'auto', 
          top: isMobile ? 'auto' : 80, 
          right: isMobile ? 16 : 32, 
          left: isMobile ? 16 : 'auto',
          backgroundColor: styles.colors.surface, 
          padding: '24px', 
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
          zIndex: 1001,
          border: `1px solid ${styles.colors.border}`, 
          width: isMobile ? 'auto' : '300px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Account</h3>
          <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.secondary }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
           <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: styles.colors.primary, color: styles.colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
              {user?.name?.charAt(0) || 'U'}
           </div>
           <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: styles.colors.textMain }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '13px', color: styles.colors.secondary, fontWeight: 500 }}>{user?.role === 'CUSTOMER' ? 'Customer' : 'Driver'}</div>
           </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setShowProfile(false); navigate(role === 'CUSTOMER' ? '/customer/profile' : '/driver/profile'); }}
          style={{ ...styles.common.buttonPrimary, width: '100%', gap: '10px', marginBottom: '10px' }}
        >
          <Settings size={18} /> View Profile
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{ ...styles.common.buttonPrimary, backgroundColor: styles.colors.danger, width: '100%', gap: '10px' }}
        >
          <LogOutIcon size={18} /> Sign Out
        </motion.button>
      </motion.div>
    </>
  );

  return (
    <div style={{ 
      ...styles.common.pageContainer, 
      paddingBottom: isMobile ? '70px' : 0 
    }}>
      {/* Top Navbar (Desktop Only) */}
      {!isMobile && (
        <nav style={{
          backgroundColor: styles.colors.surface,
          borderBottom: `1px solid ${styles.colors.border}`,
          padding: '12px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxSizing: 'border-box'
        }}>
          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(role === 'DRIVER' ? '/driver' : '/customer')}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: styles.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.colors.surface }}>
                  <MapPin size={20} strokeWidth={2.5} />
                </div>
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: styles.typography.titleWeight, 
                  color: styles.colors.textMain,
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  DriveTrust
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {navLinks.map(link => (
                  <motion.button
                    whileHover={{ backgroundColor: `${styles.colors.primary}10` }}
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: location.pathname === link.path ? `${styles.colors.primary}15` : 'rgba(0,0,0,0)',
                      color: location.pathname === link.path ? styles.colors.primary : styles.colors.secondary,
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {React.cloneElement(link.icon, { size: 18 })}
                    {link.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div 
              whileHover={{ backgroundColor: styles.colors.background }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 16px', borderRadius: '30px', border: `1px solid ${styles.colors.border}` }}
              onClick={() => setShowProfile(true)}
            >
               <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: styles.colors.primary, color: styles.colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  {user?.name?.charAt(0) || 'U'}
               </div>
               <div style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain }}>{user?.name || 'User'}</div>
            </motion.div>
          </div>
        </nav>
      )}

      {/* Mobile Top Header */}
      {isMobile && (
        <div style={{ 
          padding: '16px 20px', 
          backgroundColor: styles.colors.surface, 
          borderBottom: `1px solid ${styles.colors.border}`, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxSizing: 'border-box'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: styles.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.colors.surface }}>
                <MapPin size={18} strokeWidth={2.5} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain, margin: 0, letterSpacing: '-0.02em' }}>DriveTrust</h1>
           </div>
        </div>
      )}

      <AnimatePresence>
        {showProfile && <ProfileModal />}
      </AnimatePresence>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '16px' : '24px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) - Icons Only */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
          backgroundColor: styles.colors.surface, borderTop: `1px solid ${styles.colors.border}`,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 10001,
          boxSizing: 'border-box',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          {navLinks.map(link => (
            <motion.button
              whileTap={{ scale: 0.9 }}
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: location.pathname === link.path ? styles.colors.primary : styles.colors.secondary,
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: location.pathname === link.path ? `${styles.colors.primary}15` : 'rgba(0,0,0,0)',
              }}
            >
              {link.icon}
            </motion.button>
          ))}
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowProfile(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: showProfile ? styles.colors.primary : styles.colors.secondary,
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: showProfile ? `${styles.colors.primary}15` : 'rgba(0,0,0,0)',
              }}
            >
              <User size={24} />
          </motion.button>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
