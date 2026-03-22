import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Truck, 
  LogOut, 
  User,
  Search,
  Plus,
  Navigation,
  LogOut as LogOutIcon,
  X
} from 'lucide-react';
import { styles } from '../../utils/styles';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useWindowWidth();
  const role = user?.role;
  const [showProfile, setShowProfile] = useState(false);

  const getNavLinks = () => {
    if (role === 'CUSTOMER') {
      return [
        { label: 'Market', path: '/customer', icon: <Home size={20} /> },
        { label: 'Trips', path: '/customer/trips', icon: <Package size={20} /> }
      ];
    } else if (role === 'DRIVER') {
      return [
        { label: 'Loads', path: '/driver', icon: <Search size={20} /> },
        { label: 'My Trips', path: '/driver/trips', icon: <Truck size={20} /> }
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  const ProfileModal = () => (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      style={{
        position: 'fixed', bottom: isMobile ? 80 : 'auto', top: isMobile ? 'auto' : 80, 
        right: isMobile ? 16 : '4%', left: isMobile ? 16 : 'auto',
        backgroundColor: 'white', padding: '24px', borderRadius: '20px',
        boxShadow: styles.colors.premiumShadow, zIndex: 1001,
        border: `1px solid ${styles.colors.border}`, width: isMobile ? 'auto' : '300px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Account</h3>
        <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
         <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: styles.colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
            {user?.name.charAt(0)}
         </div>
         <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: styles.colors.textMuted }}>{user?.role}</div>
         </div>
      </div>
      <button 
        onClick={onLogout}
        style={{ ...styles.common.buttonPrimary, backgroundColor: styles.colors.danger, width: '100%', gap: '10px' }}
      >
        <LogOutIcon size={18} /> Sign Out
      </button>
    </motion.div>
  );

  return (
    <div style={{ ...styles.common.pageContainer, paddingBottom: isMobile ? '80px' : 0 }}>
      {/* Top Navbar (Hidden on Mobile) */}
      {!isMobile && (
        <nav style={styles.common.navBar}>
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <h1 style={{ 
                fontSize: '22px', 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                cursor: 'pointer'
              }} onClick={() => navigate('/')}>
                DriveTrust
              </h1>

              <div style={{ display: 'flex', gap: '4px' }}>
                {navLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: location.pathname === link.path ? `${styles.colors.primary}10` : 'transparent',
                      color: location.pathname === link.path ? styles.colors.primary : styles.colors.textMuted,
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {link.icon}
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 12px', borderRadius: '30px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
              onClick={() => setShowProfile(!showProfile)}
            >
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: styles.colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  {user?.name.charAt(0)}
               </div>
               <div style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name}</div>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Top Header */}
      {isMobile && (
        <div style={{ padding: '16px 20px', backgroundColor: 'white', borderBottom: `1px solid ${styles.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h1 style={{ fontSize: '18px', fontWeight: 800, color: styles.colors.primary, margin: 0 }}>DriveTrust</h1>
           <div 
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: styles.colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}
            onClick={() => setShowProfile(!showProfile)}
           >
              {user?.name.charAt(0)}
           </div>
        </div>
      )}

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && <ProfileModal />}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '20px' : '32px 5%',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
          backgroundColor: 'white', borderTop: `1px solid ${styles.colors.border}`,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 1000,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: location.pathname === link.path ? styles.colors.primary : styles.colors.textMuted,
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                padding: '6px 16px', borderRadius: '16px', 
                backgroundColor: location.pathname === link.path ? `${styles.colors.primary}15` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {link.icon}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>{link.label}</span>
            </button>
          ))}
          <button
              onClick={() => setShowProfile(!showProfile)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: showProfile ? styles.colors.primary : styles.colors.textMuted,
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                padding: '6px 16px', borderRadius: '16px', 
                backgroundColor: showProfile ? `${styles.colors.primary}15` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Profile</span>
            </button>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
