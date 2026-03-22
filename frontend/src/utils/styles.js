export const styles = {
  colors: {
    primary: '#4F46E5',
    primaryLight: '#818CF8',
    primaryDark: '#4338CA',
    secondary: '#64748B',
    success: '#10B981',
    danger: '#EF4444',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    border: '#E2E8F0',
    textMain: '#1E293B',
    textMuted: '#64748B',
    glass: 'rgba(255, 255, 255, 0.7)',
    cardShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    premiumShadow: '0 12px 20px -5px rgba(0,0,0,0.1), 0 8px 8px -5px rgba(0,0,0,0.04)', // refined shadow
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    baseSize: '14.5px',       // balanced from 15px
    headerSize: '22px',       // balanced from 24px
    titleWeight: 700,         
    mediumWeight: 600,
    regularWeight: 400,
  },
  common: {
    pageContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F8FAFC',
      fontSize: '14.5px',
      minHeight: '100vh',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '14px',    
      padding: '20px',         // balanced from 24px
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      border: '1px solid #F1F5F9',
    },
    buttonPrimary: {
      backgroundColor: '#4F46E5',
      color: '#FFFFFF',
      fontWeight: 600,
      padding: '10px 20px',    
      borderRadius: '10px',    
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',        
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',    
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      fontSize: '14.5px',
      backgroundColor: '#FFFFFF',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    label: {
      display: 'block',
      fontWeight: 600,
      fontSize: '13.5px',
      marginBottom: '6px',
      color: '#475569',
    },
    navBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #F1F5F9',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '64px',          
      display: 'flex',
      alignItems: 'center',
      padding: '0 4%',
    }
  }
};
