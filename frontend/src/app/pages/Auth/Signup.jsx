import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../../styles/styles';
import { signup as apiSignup } from '../../../api/authService';
import { useAuth } from '../../../auth/auth';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, Loader2 } from 'lucide-react';

const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const { login } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: styles.colors.background }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>Create Account</h2>
                    <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
                        <label style={styles.common.label}>Full Name</label>
                        <input type="text" style={styles.common.input} placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        
                        <label style={styles.common.label}>Email address</label>
                        <input type="email" style={styles.common.input} placeholder="john@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        
                        <label style={styles.common.label}>Password</label>
                        <input type="password" style={styles.common.input} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />

                        <label style={styles.common.label}>I am a...</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {['CUSTOMER', 'DRIVER'].map(r => (
                                <div key={r} onClick={() => setFormData({...formData, role: r})} style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${formData.role === r ? styles.colors.primary : styles.colors.border}`, borderRadius: '10px', fontWeight: 700 }}>
                                    {r}
                                </div>
                            ))}
                        </div>

                        <button type="submit" disabled={loading} style={{ ...styles.common.buttonPrimary, width: '100%' }}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '24px' }}>
                        Already have an account? <Link to="/login" style={{ color: styles.colors.primary, fontWeight: 700 }}>Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
