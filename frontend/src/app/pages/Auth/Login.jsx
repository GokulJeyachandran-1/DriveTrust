import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../utils/styles';
import { login as apiLogin } from '../../../api/authService';
import { useAuth } from '../../../auth/auth';
import { motion } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiLogin(formData.email, formData.password);
            login(data.user, data.access_token);
            if (data.user.role === 'CUSTOMER') navigate('/customer');
            else navigate('/driver');
        } catch (error) {
            alert(error.response?.data?.error || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: styles.colors.background }}>
            {/* Brand Panel */}
            <div style={{ 
              flex: isMobile ? 'none' : 1.2, 
              background: `linear-gradient(135deg, ${styles.colors.primaryDark} 0%, ${styles.colors.primary} 100%)`, 
              padding: isMobile ? '40px 24px' : '60px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              color: 'white', 
              position: 'relative', 
              overflow: 'hidden' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <MapPin size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: styles.typography.titleWeight, margin: 0, letterSpacing: '-0.02em' }}>DriveTrust</h1>
                </div>
                <p style={{ fontSize: isMobile ? '16px' : '20px', lineHeight: 1.5, opacity: 0.9, maxWidth: '450px', margin: 0 }}>
                    Secure Digital Freight Matching. Real-time logistics, verified drivers.
                </p>
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
            </div>

            {/* Auth Panel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 20px' : '40px' }}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', maxWidth: '420px', ...styles.common.card }}
                >
                    <h2 style={{ fontSize: '28px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Welcome Back</h2>
                    <p style={{ color: styles.colors.secondary, margin: '0 0 32px 0', fontSize: '15px' }}>Sign in to continue to DriveTrust</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.common.label}>Email Address</label>
                            <input 
                                type="email" 
                                style={{
                                    ...styles.common.input,
                                    borderColor: formData.email ? styles.colors.primary : styles.colors.border,
                                    transition: 'all 0.2s'
                                }} 
                                placeholder="name@company.com" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                required 
                            />
                        </div>
                        
                        <div style={{ marginBottom: '28px' }}>
                            <label style={styles.common.label}>Password</label>
                            <input 
                                type="password" 
                                style={{
                                    ...styles.common.input,
                                    borderColor: formData.password ? styles.colors.primary : styles.colors.border,
                                    transition: 'all 0.2s'
                                }} 
                                placeholder="••••••••" 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                                required 
                            />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={loading} 
                            style={{ ...styles.common.buttonPrimary, width: '100%', height: '48px', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </motion.button>
                    </form>
                    
                    <p style={{ textAlign: 'center', marginTop: '32px', color: styles.colors.secondary, fontSize: '14px' }}>
                        Don't have an account? <Link to="/signup" style={{ color: styles.colors.primary, fontWeight: 700, textDecoration: 'none' }}>Sign up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
