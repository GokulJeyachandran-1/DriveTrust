import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../../styles/styles';
import { login as apiLogin } from '../../../api/authService';
import { useAuth } from '../../../auth/auth';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, Loader2, ShieldCheck, MapPin } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();

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
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: styles.colors.background }}>
            {/* Left Panel */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '20px' }}>DriveTrust</h1>
                    <p style={{ fontSize: '18px', lineHeight: 1.6, opacity: 0.9, maxWidth: '450px' }}>Secure Digital Freight Matching. Real-time logistics, verified drivers.</p>
                </div>
            </div>

            {/* Right Panel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>Welcome Back</h2>
                    <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
                        <label style={styles.common.label}>Email address</label>
                        <input type="email" style={styles.common.input} placeholder="john@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        
                        <label style={styles.common.label}>Password</label>
                        <input type="password" style={styles.common.input} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />

                        <button type="submit" disabled={loading} style={{ ...styles.common.buttonPrimary, width: '100%', marginTop: '12px' }}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '24px' }}>
                        Don't have an account? <Link to="/signup" style={{ color: styles.colors.primary, fontWeight: 700 }}>Signup</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
