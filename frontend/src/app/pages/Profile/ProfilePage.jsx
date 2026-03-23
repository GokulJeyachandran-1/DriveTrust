import React, { useState, useEffect } from 'react';
import { User, Star, Shield, Edit2, Save, Lock, ArrowLeft, Loader2, Package, Truck, MessageSquare, LogOut } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getMyProfile, updateMyProfile } from '../../../api/userService';
import { useToast } from '../../hooks/useToast';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../auth/auth';

const ProfilePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setName(data.name);
    } catch (e) { toast('Failed to load profile', 'error'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = { name };
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }
      const result = await updateMyProfile(updateData);
      toast(result.message, 'success');
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      fetchProfile();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  const avgRating = profile?.reviewsReceived?.length > 0
    ? (profile.reviewsReceived.reduce((a, b) => a + b.rating, 0) / profile.reviewsReceived.length).toFixed(1)
    : null;

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {/* Back Button */}
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: styles.colors.primary, fontWeight: 600, fontSize: '15px', cursor: 'pointer', padding: 0 }}>
        <ArrowLeft size={20} /> Back
      </motion.button>

      {/* Profile Card */}
      <div style={{ ...styles.common.card, padding: isMobile ? '24px' : '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${styles.colors.primary}, ${styles.colors.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '32px' }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>

        {!editing ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>{profile.name}</h2>
              <p style={{ margin: '4px 0', color: styles.colors.secondary, fontSize: '14px' }}>{profile.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '100px', backgroundColor: `${styles.colors.primary}15`, color: styles.colors.primary, fontSize: '12px', fontWeight: 700 }}>{profile.role}</span>
                {profile.isKycVerified && (
                  <span style={{ padding: '4px 12px', borderRadius: '100px', backgroundColor: `${styles.colors.success}15`, color: styles.colors.success, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> KYC Verified
                  </span>
                )}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setEditing(true)} style={{ ...styles.common.buttonPrimary, gap: '8px', backgroundColor: styles.colors.primary }}>
              <Edit2 size={16} /> Edit Profile
            </motion.button>
          </>
        ) : (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.common.label}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={styles.common.input} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.common.label}>Current Password (for password change)</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={styles.common.input} placeholder="Leave blank to skip" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.common.label}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={styles.common.input} placeholder="Min 6 characters" />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} style={{ ...styles.common.buttonPrimary, flex: 1, gap: '8px' }}>
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save</>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setEditing(false); setName(profile.name); setCurrentPassword(''); setNewPassword(''); }} style={{ ...styles.common.buttonPrimary, flex: 1, backgroundColor: styles.colors.secondary }}>
                Cancel
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Rating', value: avgRating || 'N/A', icon: <Star size={20} color="#F59E0B" />, bg: '#FEF3C7' },
          { label: 'Reviews', value: profile.reviewsReceived?.length || 0, icon: <MessageSquare size={20} color={styles.colors.primary} />, bg: `${styles.colors.primary}15` },
          { label: profile.role === 'CUSTOMER' ? 'Loads' : 'Bids', value: profile.role === 'CUSTOMER' ? profile._count?.loadPosts : profile._count?.bids, icon: <Package size={20} color={styles.colors.success} />, bg: `${styles.colors.success}15` },
          { label: 'Trips', value: profile._count?.trips || 0, icon: <Truck size={20} color={styles.colors.primary} />, bg: `${styles.colors.primary}15` },
        ].map((stat, i) => (
          <div key={i} style={{ ...styles.common.card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: stat.bg, padding: '8px', borderRadius: '10px' }}>{stat.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: styles.colors.textMain }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: styles.colors.secondary }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      {profile.reviewsReceived?.length > 0 && (
        <div style={{ ...styles.common.card, padding: isMobile ? '20px' : '28px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Reviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.reviewsReceived.map((review, i) => (
              <div key={i} style={{ padding: '16px', backgroundColor: styles.colors.background, borderRadius: '12px', border: `1px solid ${styles.colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={review.rating >= s ? '#F59E0B' : 'transparent'} color={review.rating >= s ? '#F59E0B' : styles.colors.border} />)}
                  </div>
                  <span style={{ fontSize: '12px', color: styles.colors.secondary }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.comment && <p style={{ margin: 0, fontSize: '14px', color: styles.colors.textMain, lineHeight: 1.5 }}>{review.comment}</p>}
                {(review.speedScore || review.handlingScore) && (
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    {review.speedScore && <span style={{ fontSize: '12px', color: styles.colors.secondary }}>Speed: {review.speedScore}/5</span>}
                    {review.handlingScore && <span style={{ fontSize: '12px', color: styles.colors.secondary }}>Care: {review.handlingScore}/5</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Since & Logout */}
      <div style={{ textAlign: 'center', padding: '16px', color: styles.colors.secondary, fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div>Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</div>
        
        {isMobile && (
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={logout} 
            style={{ ...styles.common.buttonPrimary, backgroundColor: '#FEF2F2', color: styles.colors.danger, display: 'flex', gap: '8px', border: `1px solid #FCA5A5`, marginTop: '16px' }}
          >
            <LogOut size={16} /> Sign Out
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
