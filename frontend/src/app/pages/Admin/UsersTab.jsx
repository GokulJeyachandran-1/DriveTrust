import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldX, Clock, Loader2, X, FileText, CheckCircle, XCircle } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getAdminUsers, getUserKyc, updateKycStatus } from '../../../api/adminService';
import { useToast } from '../../hooks/useToast';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const KycReviewModal = ({ userId, onClose, onUpdate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getUserKyc(userId).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  const handleAction = async (status) => {
    try {
      const res = await updateKycStatus(userId, status);
      toast(res.message || `KYC ${status.toLowerCase()} successfully`, 'success');
      onUpdate();
      onClose();
    } catch (e) { toast('Action failed', 'error'); }
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', backgroundColor: styles.colors.surface, borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${styles.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: styles.colors.textMain }}>KYC Review</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.secondary }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" color={styles.colors.primary} /></div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${styles.colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: styles.colors.primary }}>{data.name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: styles.colors.textMain }}>{data.name}</div>
                  <div style={{ fontSize: '13px', color: styles.colors.secondary }}>{data.email} · {data.role}</div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: `1px solid ${styles.colors.border}` }}>
                <div style={{ fontSize: '12px', color: styles.colors.secondary, fontWeight: 600, marginBottom: '8px' }}>AADHAAR NUMBER</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: styles.colors.textMain, letterSpacing: '0.1em' }}>{data.aadhaarNumber || 'Not provided'}</div>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain, marginBottom: '12px' }}>Uploaded Documents</div>
                {data.kycDocuments?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.kycDocuments.map(doc => (
                      <div key={doc.id} style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${styles.colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={20} color={styles.colors.primary} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain }}>{doc.documentType === 'AADHAAR' ? 'Aadhaar Card' : 'Driving License'}</div>
                          <div style={{ fontSize: '12px', color: styles.colors.secondary }}>{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                        </div>
                        <a href={`${apiBase}${doc.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: styles.colors.primary, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>View</a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: styles.colors.secondary, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>No documents uploaded</div>
                )}
              </div>

              {data.kycStatus === 'PENDING' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleAction('APPROVED')} style={{ ...styles.common.buttonPrimary, flex: 1, backgroundColor: styles.colors.success, gap: '8px' }}><CheckCircle size={18} /> Approve</motion.button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleAction('REJECTED')} style={{ ...styles.common.buttonPrimary, flex: 1, backgroundColor: '#EF4444', gap: '8px' }}><XCircle size={18} /> Reject</motion.button>
                </div>
              )}

              {data.kycStatus !== 'PENDING' && (
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: data.kycStatus === 'APPROVED' ? '#ECFDF5' : '#FEF2F2', color: data.kycStatus === 'APPROVED' ? '#065F46' : '#991B1B', fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>
                  KYC Status: {data.kycStatus}
                </div>
              )}
            </div>
          ) : <div style={{ textAlign: 'center', color: styles.colors.danger }}>Failed to load</div>}
        </div>
      </motion.div>
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [kycUserId, setKycUserId] = useState(null);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const fetchUsers = async () => {
    setLoading(true);
    try { const data = await getAdminUsers(filter); setUsers(data); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const kycBadge = (status) => {
    const map = { PENDING: { bg: '#FFF7ED', color: '#EA580C', icon: Clock }, APPROVED: { bg: '#ECFDF5', color: '#059669', icon: ShieldCheck }, REJECTED: { bg: '#FEF2F2', color: '#DC2626', icon: ShieldX } };
    const s = map[status] || map.PENDING;
    const Icon = s.icon;
    return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', backgroundColor: s.bg, color: s.color, fontSize: '12px', fontWeight: 600 }}><Icon size={14} />{status}</span>);
  };

  // Mobile card layout for each user
  const UserCard = ({ user }) => (
    <motion.div whileHover={{ y: -2 }} style={{ ...styles.common.card, padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: styles.colors.textMain }}>{user.name}</div>
          <div style={{ fontSize: '12px', color: styles.colors.secondary, marginTop: '2px' }}>{user.email}</div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: '100px', backgroundColor: user.role === 'CUSTOMER' ? '#EEF2FF' : '#F0F9FF', color: user.role === 'CUSTOMER' ? '#4F46E5' : '#0284C7', fontSize: '11px', fontWeight: 600 }}>{user.role}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {kycBadge(user.kycStatus)}
        <button onClick={() => setKycUserId(user.id)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: styles.typography.fontFamily }}>Review</button>
      </div>
    </motion.div>
  );

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: styles.colors.textMain, margin: '0 0 8px' }}>Users & KYC</h1>
        <p style={{ color: styles.colors.secondary, margin: 0, fontSize: '14px' }}>Manage user verification and profiles</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: styles.colors.secondary }} />
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...styles.common.input, paddingLeft: '40px', marginBottom: 0 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', 'CUSTOMER', 'DRIVER'].map(r => (
          <button key={r} onClick={() => setFilter(prev => ({ ...prev, role: r || undefined }))} style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${filter.role === (r || undefined) ? styles.colors.primary : styles.colors.border}`, backgroundColor: filter.role === (r || undefined) ? `${styles.colors.primary}10` : 'white', color: filter.role === (r || undefined) ? styles.colors.primary : styles.colors.secondary, fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: styles.typography.fontFamily }}>
            {r || 'All'}
          </button>
        ))}
        {['', 'PENDING', 'APPROVED'].map(s => (
          <button key={`k-${s}`} onClick={() => setFilter(prev => ({ ...prev, kycStatus: s || undefined }))} style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${filter.kycStatus === (s || undefined) ? '#F59E0B' : styles.colors.border}`, backgroundColor: filter.kycStatus === (s || undefined) ? '#FFFBEB' : 'white', color: filter.kycStatus === (s || undefined) ? '#D97706' : styles.colors.secondary, fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: styles.typography.fontFamily }}>
            {s || 'All KYC'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
      ) : isMobile ? (
        /* Mobile: card layout */
        <div>
          {filtered.length === 0 ? (
            <div style={{ ...styles.common.card, textAlign: 'center', padding: '40px', color: styles.colors.secondary }}>No users found</div>
          ) : filtered.map(user => <UserCard key={user.id} user={user} />)}
        </div>
      ) : (
        /* Desktop: table layout */
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${styles.colors.border}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                  {['Name', 'Email', 'Role', 'KYC', 'Loads/Bids', 'Trips', 'Joined', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: styles.colors.secondary, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain, whiteSpace: 'nowrap' }}>{user.name}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary, whiteSpace: 'nowrap' }}>{user.email}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '4px 10px', borderRadius: '100px', backgroundColor: user.role === 'CUSTOMER' ? '#EEF2FF' : '#F0F9FF', color: user.role === 'CUSTOMER' ? '#4F46E5' : '#0284C7', fontSize: '12px', fontWeight: 600 }}>{user.role}</span></td>
                    <td style={{ padding: '14px 16px' }}>{kycBadge(user.kycStatus)}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary }}>{user._count.loadPosts || user._count.bids}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary }}>{user._count.trips}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary, fontSize: '13px', whiteSpace: 'nowrap' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setKycUserId(user.id)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: styles.typography.fontFamily }}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>{kycUserId && <KycReviewModal userId={kycUserId} onClose={() => setKycUserId(null)} onUpdate={fetchUsers} />}</AnimatePresence>
    </div>
  );
};

export default UsersTab;
