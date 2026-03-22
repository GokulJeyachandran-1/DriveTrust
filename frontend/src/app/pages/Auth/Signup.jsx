import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../utils/styles';
import { signup as apiSignup } from '../../../api/authService';
import { useAuth } from '../../../auth/auth';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Building, Truck } from 'lucide-react';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiSignup(formData);
            login(data.user, data.access_token);
            if (data.user.role === 'CUSTOMER') navigate('/customer');
            else navigate('/driver');
        } catch (error) {
            alert(error.response?.data?.error || 'Signup failed');
        } finally { setLoading(false); }
    };

    const RoleCard = ({ type, title, desc, icon: Icon }) => {
        const isSelected = formData.role === type;
        return (
            <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setFormData({...formData, role: type})}
                style={{
                    flex: 1, 
                    padding: '16px', 
                    cursor: 'pointer', 
                    border: `2px solid ${isSelected ? styles.colors.primary : styles.colors.border}`, 
                    borderRadius: '12px',
                    backgroundColor: isSelected ? `${styles.colors.primary}08` : styles.colors.surface,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', 
                    backgroundColor: isSelected ? styles.colors.primary : styles.colors.background,
                    color: isSelected ? styles.colors.surface : styles.colors.textMain,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: styles.colors.textMain }}>{title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: styles.colors.secondary }}>{desc}</p>
                </div>
            </motion.div>
        );
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
                    Join the most secure logistics network today.
                </p>
            </div>

            {/* Auth Panel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 20px' : '40px' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%', maxWidth: '480px', ...styles.common.card }}
                >
                    <h2 style={{ fontSize: '28px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Create Account</h2>
                    <p style={{ color: styles.colors.secondary, margin: '0 0 32px 0', fontSize: '15px' }}>Start moving freight safely</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <RoleCard type="CUSTOMER" title="Customer" desc="Post loads & track" icon={Building} />
                            <RoleCard type="DRIVER" title="Driver" desc="Find loads & earn" icon={Truck} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.common.label}>Full Name</label>
                            <input type="text" style={styles.common.input} placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.common.label}>Email Address</label>
                            <input type="email" style={styles.common.input} placeholder="john@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        </div>
                        
                        <div style={{ marginBottom: '32px' }}>
                            <label style={styles.common.label}>Password</label>
                            <input type="password" style={styles.common.input} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={loading} 
                            style={{ ...styles.common.buttonPrimary, width: '100%', height: '48px', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </motion.button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '32px', color: styles.colors.secondary, fontSize: '14px' }}>
                        Already have an account? <Link to="/login" style={{ color: styles.colors.primary, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
