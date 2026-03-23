import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../utils/styles';
import { signup as apiSignup } from '../../../api/authService';
import { useAuth } from '../../../auth/auth';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Building, Truck, Upload, FileText, X } from 'lucide-react';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { useToast } from '../../hooks/useToast';

const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER', aadhaarNumber: '' });
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [dlFile, setDlFile] = useState(null);
    const aadhaarRef = useRef(null);
    const dlRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanAadhaar = formData.aadhaarNumber.replace(/\s/g, '');
        if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) { toast('Aadhaar number must be exactly 12 digits', 'error'); return; }
        if (!aadhaarFile) { toast('Aadhaar card upload is mandatory', 'error'); return; }
        if (formData.role === 'DRIVER' && !dlFile) { toast('Driving License upload is mandatory for drivers', 'error'); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('email', formData.email);
            fd.append('password', formData.password);
            fd.append('role', formData.role);
            fd.append('aadhaarNumber', cleanAadhaar);
            if (aadhaarFile) fd.append('aadhaarDoc', aadhaarFile);
            if (dlFile) fd.append('drivingLicenseDoc', dlFile);

            await apiSignup(fd);
            toast('Account created! Your KYC documents are under review. You can login once an admin approves your verification.', 'success');
            navigate('/login');
        } catch (error) {
            toast(error.response?.data?.error || 'Signup failed', 'error');
        } finally { setLoading(false); }
    };

    const FileUploadField = ({ label, file, setFile, inputRef }) => (
      <div style={{ marginBottom: '20px' }}>
        <label style={styles.common.label}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
        <input type="file" ref={inputRef} accept=".jpg,.jpeg" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${styles.colors.success}`, backgroundColor: `${styles.colors.success}08` }}>
            <FileText size={18} color={styles.colors.success} />
            <span style={{ flex: 1, fontSize: '14px', color: styles.colors.textMain, fontWeight: 500 }}>{file.name}</span>
            <button onClick={(e) => { e.preventDefault(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.secondary }}><X size={16} /></button>
          </div>
        ) : (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              border: `2px dashed ${styles.colors.border}`,
              backgroundColor: '#FAFBFC', color: styles.colors.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              fontFamily: styles.typography.fontFamily
            }}
          >
            <Upload size={18} /> Click to upload
          </motion.button>
        )}
      </div>
    );

    const RoleCard = ({ type, title, desc, icon: Icon }) => {
        const isSelected = formData.role === type;
        return (
            <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => { setFormData({...formData, role: type}); setDlFile(null); }}
                style={{
                    flex: 1, padding: '16px', cursor: 'pointer', 
                    border: `2px solid ${isSelected ? styles.colors.primary : styles.colors.border}`, 
                    borderRadius: '12px',
                    backgroundColor: isSelected ? `${styles.colors.primary}08` : styles.colors.surface,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
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
              display: 'flex', flexDirection: 'column', justifyContent: 'center', 
              color: 'white', position: 'relative', overflow: 'hidden' 
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 20px' : '40px', overflowY: 'auto' }}>
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
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.common.label}>Password</label>
                            <input type="password" style={styles.common.input} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        </div>

                        {/* KYC Section */}
                        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: `1px solid ${styles.colors.border}`, marginBottom: '24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: styles.colors.textMain, marginBottom: '4px' }}>KYC Verification <span style={{ color: '#EF4444' }}>(Required)</span></div>
                          <p style={{ fontSize: '12px', color: styles.colors.secondary, margin: '0 0 16px' }}>Upload documents for admin verification. Only JPG/JPEG files accepted.</p>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={styles.common.label}>Aadhaar Number <span style={{ color: '#EF4444' }}>*</span></label>
                            <input type="text" style={styles.common.input} placeholder="XXXX XXXX XXXX" maxLength={14} value={formData.aadhaarNumber} onChange={e => setFormData({...formData, aadhaarNumber: e.target.value})} required />
                          </div>

                          <FileUploadField label="Aadhaar Card (Image or PDF)" file={aadhaarFile} setFile={setAadhaarFile} inputRef={aadhaarRef} />

                          {formData.role === 'DRIVER' && (
                            <FileUploadField label="Driving License (Image or PDF)" file={dlFile} setFile={setDlFile} inputRef={dlRef} />
                          )}
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
