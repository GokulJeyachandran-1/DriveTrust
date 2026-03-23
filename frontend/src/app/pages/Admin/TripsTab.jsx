import React, { useState, useEffect } from 'react';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getAdminTrips } from '../../../api/adminService';

const TripsTab = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try { const data = await getAdminTrips(); setTrips(data); } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? trips : filter === 'active' ? trips.filter(t => !t.completedAt) : trips.filter(t => t.completedAt);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: styles.colors.textMain, margin: '0 0 8px' }}>Trips</h1>
        <p style={{ color: styles.colors.secondary, margin: 0, fontSize: '14px' }}>Monitor all platform shipments</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${filter === key ? styles.colors.primary : styles.colors.border}`, backgroundColor: filter === key ? `${styles.colors.primary}10` : 'white', color: filter === key ? styles.colors.primary : styles.colors.secondary, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: styles.typography.fontFamily }}>{label} ({key === 'all' ? trips.length : key === 'active' ? trips.filter(t => !t.completedAt).length : trips.filter(t => t.completedAt).length})</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px', color: styles.colors.secondary }}>No trips found</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${styles.colors.border}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '900px', width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                  {['ID', 'Driver', 'Customer', 'Origin', 'Destination', 'Location', 'Status', 'Started'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: styles.colors.secondary, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(trip => (
                  <tr key={trip.id} style={{ borderBottom: `1px solid ${styles.colors.border}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain, fontFamily: 'monospace', fontSize: '12px' }}>{trip.id.split('-')[0].toUpperCase()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: styles.colors.textMain }}>{trip.driver.name}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary }}>{trip.post.customer?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color={styles.colors.primary} />{trip.post.origin.split(',')[0]}</div></td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Navigation size={14} color={styles.colors.success} />{trip.post.destination.split(',')[0]}</div></td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary, fontSize: '12px' }}>{trip.currentLocation || '—'}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '4px 10px', borderRadius: '100px', backgroundColor: trip.completedAt ? '#ECFDF5' : '#FFFBEB', color: trip.completedAt ? '#059669' : '#D97706', fontSize: '12px', fontWeight: 600 }}>{trip.completedAt ? 'DELIVERED' : 'IN TRANSIT'}</span></td>
                    <td style={{ padding: '14px 16px', color: styles.colors.secondary, fontSize: '13px' }}>{new Date(trip.startedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;
