import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2, ShieldCheck } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getUserProfile } from '../../../api/userService';

const PublicProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  if (!userId) return null;

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={rating >= s ? '#F59E0B' : 'transparent'} color={rating >= s ? '#F59E0B' : styles.colors.border} />)}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: '500px', backgroundColor: styles.colors.surface, borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '24px', position: 'relative', borderBottom: `1px solid ${styles.colors.border}` }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.secondary }}><X size={20} /></button>
          
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" color={styles.colors.primary} /></div>
          ) : profile ? (
             <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${styles.colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: styles.colors.primary, margin: '0 auto 16px' }}>
                    {profile.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: styles.colors.textMain }}>{profile.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: styles.colors.secondary, fontSize: '14px', marginBottom: '16px' }}>
                   <span>{profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}</span>
                   {profile.isKycVerified && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: styles.colors.success }}><ShieldCheck size={16} /> Verified</span>}
                </div>
                
                {profile.reviewsReceived.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: styles.colors.background, borderRadius: '12px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: styles.colors.textMain }}>
                      {(profile.reviewsReceived.reduce((a, b) => a + b.rating, 0) / profile.reviewsReceived.length).toFixed(1)}
                    </div>
                    {renderStars(Math.round(profile.reviewsReceived.reduce((a, b) => a + b.rating, 0) / profile.reviewsReceived.length))}
                    <div style={{ fontSize: '13px', color: styles.colors.secondary, marginTop: '4px' }}>Based on {profile.reviewsReceived.length} reviews</div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: styles.colors.background, borderRadius: '12px', color: styles.colors.secondary }}>No reviews yet</div>
                )}
             </div>
          ) : (
             <div style={{ textAlign: 'center', color: styles.colors.danger }}>Failed to load profile</div>
          )}
        </div>
        
        {!loading && profile && (
          <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#F8FAFC', flex: 1 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: styles.colors.textMain }}>Recent Feedback</h3>
            {profile.reviewsReceived.length === 0 ? (
               <p style={{ color: styles.colors.secondary, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>This user has not received any feedback.</p>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {profile.reviewsReceived.map((r, i) => (
                    <div key={i} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: `1px solid ${styles.colors.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain }}>Anonymous {profile.role === 'DRIVER' ? 'Customer' : 'Driver'}</span>
                         <span style={{ fontSize: '12px', color: styles.colors.secondary }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                       </div>
                       {renderStars(r.rating)}
                       {r.comment && <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>"{r.comment}"</p>}
                    </div>
                 ))}
               </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PublicProfileModal;
