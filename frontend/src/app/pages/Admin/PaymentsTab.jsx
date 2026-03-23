import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, ArrowRight, CheckCircle, AlertTriangle, XCircle, Check } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getAdminPayments, releasePayment, getAdminDeductions, reviewDeduction } from '../../../api/adminService';
import { useToast } from '../../hooks/useToast';

const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'deductions'
  const toast = useToast();

  const fetchData = async () => {
    try { 
      const [pData, dData] = await Promise.all([getAdminPayments(), getAdminDeductions()]);
      setPayments(pData); 
      setDeductions(dData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRelease = async (id) => {
    if (!window.confirm('Release this payment to the driver?')) return;
    try {
      const res = await releasePayment(id);
      toast(res.message, 'success');
      fetchData();
    } catch (e) { toast('Release failed', 'error'); }
  };

  const handleReviewDeduction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this deduction?`)) return;
    try {
      await reviewDeduction(id, status);
      toast(`Deduction ${status.toLowerCase()}`, 'success');
      fetchData();
    } catch (e) { toast('Failed to update deduction', 'error'); }
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter.toUpperCase());

  const statusBadge = (status) => {
    const map = { PENDING: { bg: '#FFF7ED', color: '#EA580C' }, COLLECTED: { bg: '#EEF2FF', color: '#4F46E5' }, RELEASED: { bg: '#ECFDF5', color: '#059669' }, DISPUTED: { bg: '#FEF2F2', color: '#DC2626' } };
    const s = map[status] || map.PENDING;
    return <span style={{ padding: '4px 12px', borderRadius: '100px', backgroundColor: s.bg, color: s.color, fontSize: '12px', fontWeight: 600 }}>{status}</span>;
  };

  // Compute summary stats
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = payments.reduce((sum, p) => sum + p.platformFee, 0);
  const totalReleased = payments.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + p.driverPayout, 0);
  const pendingRelease = payments.filter(p => p.status === 'COLLECTED').reduce((sum, p) => sum + p.driverPayout, 0);
  const pendingDeductions = deductions.filter(d => d.status === 'PENDING').length;

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: styles.colors.textMain, margin: '0 0 8px' }}>Payments & Deductions</h1>
          <p style={{ color: styles.colors.secondary, margin: 0, fontSize: '14px' }}>Escrow collection, deductions, and payouts</p>
        </div>
        
        {/* Top Toggle Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('payments')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'payments' ? 'white' : 'transparent', color: activeTab === 'payments' ? styles.colors.primary : styles.colors.secondary, fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: activeTab === 'payments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={16} /> Payments
          </button>
          <button onClick={() => setActiveTab('deductions')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'deductions' ? 'white' : 'transparent', color: activeTab === 'deductions' ? '#DC2626' : styles.colors.secondary, fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: activeTab === 'deductions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Deductions {pendingDeductions > 0 && <span style={{ backgroundColor: '#DC2626', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '100px' }}>{pendingDeductions}</span>}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, color: '#4F46E5' },
          { label: 'Platform Fees', value: `₹${totalFees.toLocaleString()}`, color: '#059669' },
          { label: 'Released to Drivers', value: `₹${totalReleased.toLocaleString()}`, color: '#10B981' },
          { label: 'Awaiting Release', value: `₹${pendingRelease.toLocaleString()}`, color: '#F59E0B' }
        ].map((s, i) => (
          <div key={i} style={{ ...styles.common.card, padding: '20px' }}>
            <div style={{ fontSize: '12px', color: styles.colors.secondary, fontWeight: 600, marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
      ) : activeTab === 'payments' ? (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            {['all', 'collected', 'released', 'disputed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${filter === f ? styles.colors.primary : styles.colors.border}`, backgroundColor: filter === f ? `${styles.colors.primary}10` : 'white', color: filter === f ? styles.colors.primary : styles.colors.secondary, fontWeight: 600, fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize', fontFamily: styles.typography.fontFamily }}>{f}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px', color: styles.colors.secondary }}>No payments found</div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${styles.colors.border}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                      {['Route', 'Driver', 'Amount', 'Platform Fee', 'Driver Payout', 'Refund', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: styles.colors.secondary, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                        <td style={{ padding: '14px 16px', color: styles.colors.textMain }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            {p.bid.post?.origin?.split(',')[0] || '—'} <ArrowRight size={12} /> {p.bid.post?.destination?.split(',')[0] || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain }}>{p.bid.driver?.name || '—'}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: styles.colors.primary }}>₹{p.amount.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', color: '#059669', fontWeight: 600 }}>₹{p.platformFee.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain }}>₹{(p.driverPayout - (p.refundAmount || 0)).toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', color: '#DC2626', fontWeight: 600 }}>{p.refundAmount ? `₹${p.refundAmount.toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '14px 16px' }}>{statusBadge(p.status)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.status === 'COLLECTED' ? (
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleRelease(p.id)} style={{ ...styles.common.buttonPrimary, height: '36px', fontSize: '13px', gap: '6px', padding: '0 16px' }}>
                              <CheckCircle size={14} /> Release
                            </motion.button>
                          ) : <span style={{ color: styles.colors.secondary, fontSize: '13px' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {deductions.length === 0 ? (
            <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px', color: styles.colors.secondary }}>No damage deductions reported</div>
          ) : (
             <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${styles.colors.border}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                      {['Customer', 'Driver', 'Reason', 'Requested Refund', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: styles.colors.secondary, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map(d => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain }}>{d.trip?.post?.customer?.name || '—'}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain }}>{d.trip?.driver?.name || '—'}</td>
                        <td style={{ padding: '14px 16px', color: styles.colors.secondary, maxWidth: '200px' }}>{d.reason}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#DC2626' }}>₹{d.amount.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, backgroundColor: d.status === 'PENDING' ? '#FEF3C7' : d.status === 'APPROVED' ? '#ECFDF5' : '#FEF2F2', color: d.status === 'PENDING' ? '#D97706' : d.status === 'APPROVED' ? '#059669' : '#DC2626' }}>{d.status}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {d.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReviewDeduction(d.id, 'APPROVED')} style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#059669', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={16} /></motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReviewDeduction(d.id, 'REJECTED')} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#DC2626', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><XCircle size={16} /></motion.button>
                            </div>
                          ) : <span style={{ color: styles.colors.secondary, fontSize: '13px' }}>Reviewed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentsTab;
