import React, { useState } from 'react';
import { styles } from '../../utils/styles';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogIn, ArrowRight, MapPin, Loader2 } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'CUSTOMER'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await api.post(endpoint, formData);
      onLogin(res.data.user, res.data.access_token);
    } catch (error) {
      alert(error.response?.data?.error || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', 
      backgroundColor: styles.colors.background,
      fontFamily: styles.typography.fontFamily
    }}>
      {/* Left Branding Panel */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '20px' }}>DriveTrust</h1>
          <p style={{ fontSize: '18px', lineHeight: 1.6, opacity: 0.9, maxWidth: '450px' }}>
            The next generation of Digital Freight Matching. Secured by Escrow, powered by real-time logistics.
          </p>
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <div style={{ fontWeight: 700 }}>Secure Payments</div>
                   <div style={{ fontSize: '14px', opacity: 0.8 }}>Funds locked in Escrow until delivery.</div>
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <MapPin size={24} />
                </div>
                <div>
                   <div style={{ fontWeight: 700 }}>Live Tracking</div>
                   <div style={{ fontSize: '14px', opacity: 0.8 }}>Real-time GPS visibility for every shipment.</div>
                </div>
             </div>
          </div>
        </div>
        {/* Abstract background circles */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Right Auth Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: styles.colors.textMain }}>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
            <p style={{ color: styles.colors.textMuted, marginTop: '10px', fontSize: '14px' }}>{isLogin ? 'Enter your credentials to access your dashboard.' : 'Join the network of verified and trusted shippers & drivers.'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key={isLogin ? 'login' : 'signup'}>
                {!isLogin && (
                  <>
                    <label style={styles.common.label}>Business Representative Name</label>
                    <input type="text" style={styles.common.input} placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </>
                )}

                <label style={styles.common.label}>Email Address</label>
                <input type="email" style={styles.common.input} placeholder="john@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />

                <label style={styles.common.label}>Password</label>
                <input type="password" style={styles.common.input} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />

                {!isLogin && (
                  <>
                    <label style={styles.common.label}>I am joining as a...</label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      {['CUSTOMER', 'DRIVER'].map(role => (
                        <div 
                          key={role}
                          onClick={() => setFormData({...formData, role})}
                          style={{
                            flex: 1, padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                            border: `2px solid ${formData.role === role ? styles.colors.primary : styles.colors.border}`,
                            backgroundColor: formData.role === role ? `${styles.colors.primary}08` : 'white',
                            color: formData.role === role ? styles.colors.primary : styles.colors.textMuted,
                            transition: 'all 0.2s'
                          }}
                        >
                          {role === 'CUSTOMER' ? 'Customer' : 'Driver'}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <button type="submit" disabled={loading} style={{ ...styles.common.buttonPrimary, width: '100%', height: '48px', marginTop: '12px', justifyContent: 'center', fontSize: '15px' }}>
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <span style={{ color: styles.colors.textMuted, fontSize: '15px' }}>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
            <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>{isLogin ? 'Create one now' : 'Sign in here'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
