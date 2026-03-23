import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getAdminSos, resolveSos } from '../../../api/adminService';
import { useToast } from '../../hooks/useToast';

const SosTab = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAlerts = async () => {
    try { const data = await getAdminSos(); setAlerts(data); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleResolve = async (id) => {
    try {
      await resolveSos(id);
      toast('SOS Alert resolved', 'success');
      fetchAlerts();
    } catch (e) { toast('Failed to resolve', 'error'); }
  };

  const openAlerts = alerts.filter(a => a.status === 'OPEN');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: styles.colors.textMain, margin: '0 0 8px' }}>SOS Alerts</h1>
        <p style={{ color: styles.colors.secondary, margin: 0, fontSize: '14px' }}>Emergency dispatch management</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Open Alerts */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} /> Active ({openAlerts.length})</h2>
            {openAlerts.length === 0 ? (
              <div style={{ ...styles.common.card, textAlign: 'center', padding: '40px', color: styles.colors.secondary }}>No active SOS alerts. All clear!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {openAlerts.map(alert => (
                  <motion.div key={alert.id} style={{ ...styles.common.card, borderLeft: '4px solid #EF4444', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontWeight: 700, color: styles.colors.textMain, marginBottom: '8px' }}>
                        Trip #{alert.trip.id.split('-')[0].toUpperCase()}
                      </div>
                      <div style={{ fontSize: '13px', color: styles.colors.secondary, marginBottom: '4px' }}>
                        Raised by: <strong>{alert.raisedBy.name}</strong> ({alert.raisedBy.role})
                      </div>
                      <div style={{ fontSize: '13px', color: styles.colors.secondary }}>
                        Route: {alert.trip.post.origin.split(',')[0]} → {alert.trip.post.destination.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '12px', color: styles.colors.secondary, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleResolve(alert.id)} style={{ ...styles.common.buttonPrimary, backgroundColor: styles.colors.success, gap: '8px', height: '44px' }}>
                      <CheckCircle size={18} /> Resolve
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Alerts */}
          {resolvedAlerts.length > 0 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: styles.colors.secondary, margin: '0 0 16px' }}>Resolved ({resolvedAlerts.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resolvedAlerts.map(alert => (
                  <div key={alert.id} style={{ ...styles.common.card, padding: '16px', opacity: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: styles.colors.textMain }}>Trip #{alert.trip.id.split('-')[0].toUpperCase()}</span>
                      <span style={{ marginLeft: '12px', fontSize: '13px', color: styles.colors.secondary }}>by {alert.raisedBy.name}</span>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', backgroundColor: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: 600 }}>Resolved</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SosTab;
