import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, CircleDollarSign, Loader2, ShieldCheck, Tag, ArrowRight, Package, Navigation, PlayCircle, StopCircle, CheckCircle2 } from 'lucide-react';
import { styles } from '../../../styles/styles';
import { getOpenLoads, submitBid } from '../../../api/driverService';
import { getTrips, updateTripStatus } from '../../../api/tripService';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const DriverDashboard = () => {
  const [loads, setLoads] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const { isMobile } = useWindowWidth();
  
  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        auth: { token },
        withCredentials: true
    });

    fetchData();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loadsData, tripsData] = await Promise.all([
        getOpenLoads(),
        getTrips()
      ]);
      setLoads(loadsData);
      setActiveTrips(tripsData.filter(t => !t.completedAt));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startLiveTracking = (trip) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setTrackingId(trip.id);
    socketRef.current.emit('joinTrip', trip.id);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketRef.current.emit('updateLocation', { tripId: trip.id, lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("GPS Error:", error);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingId(null);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitBid(selectedLoad.id, {
        amount: bidAmount,
        message: bidMessage
      });
      alert('Offer submitted successfully!');
      setSelectedLoad(null);
      setBidAmount('');
      setBidMessage('');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit quote');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '40px' }}>
      {activeTrips.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: `${styles.colors.success}10`, padding: '6px', borderRadius: '10px' }}><Navigation size={20} color={styles.colors.success} /></div>
            <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, margin: 0 }}>Active Jobs</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {activeTrips.map(trip => (
              <div key={trip.id} style={{ ...styles.common.card, borderTop: `4px solid ${trackingId === trip.id ? styles.colors.primary : styles.colors.success}` }}>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{trip.post.origin.split(',')[0]} &rarr; {trip.post.destination.split(',')[0]}</div>
                <div style={{ fontSize: '12px', color: styles.colors.textMuted, marginBottom: '20px' }}>ID: {trip.id.slice(0,8)}</div>
                <button onClick={() => trackingId === trip.id ? stopTracking() : startLiveTracking(trip)} style={{ ...styles.common.buttonPrimary, backgroundColor: trackingId === trip.id ? styles.colors.danger : styles.colors.success, width: '100%' }}>
                  {trackingId === trip.id ? <StopCircle size={18} /> : <PlayCircle size={18} />}
                  {trackingId === trip.id ? 'Stop Tracking' : 'Start Live GPS'}
                </button>
                {trip.status !== 'DELIVERED' && (
                  <button 
                    onClick={async () => {
                      if (confirm('Mark this trip as delivered?')) {
                        await updateTripStatus(trip.id, 'DELIVERED');
                        fetchData();
                      }
                    }}
                    style={{ ...styles.common.buttonPrimary, backgroundColor: styles.colors.success, width: '100%', marginTop: '10px' }}
                  >
                    <CheckCircle2 size={18} /> Mark as Delivered
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0 }}>Marketplace</h2>
          <p style={{ color: styles.colors.textMuted, marginTop: '4px', fontSize: '13px' }}>Find profitable routes.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: (selectedLoad && !isMobile) ? '1.4fr 1.1fr' : '1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
             <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
          ) : loads.length === 0 ? (
            <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px' }}>
               <Package size={32} color={styles.colors.border} style={{ marginBottom: '16px' }} />
               <p style={{ color: styles.colors.textMuted }}>No shipments available.</p>
            </div>
          ) : (
            loads.map(load => (
              <motion.div key={load.id} layout onClick={() => setSelectedLoad(load)} style={{ ...styles.common.card, cursor: 'pointer', border: selectedLoad?.id === load.id ? `2px solid ${styles.colors.primary}` : '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, color: styles.colors.primary, fontSize: '11px', textTransform: 'uppercase' }}>{load.customer.name}</div>
                  <span style={{ fontSize: '12px', color: styles.colors.textMuted }}>{new Date(load.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '10px', color: styles.colors.textMuted }}>ORIGIN</div>
                     <div style={{ fontWeight: 700, fontSize: '14px' }}>{load.origin.split(',')[0]}</div>
                  </div>
                  <ArrowRight size={16} color={styles.colors.border} />
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '10px', color: styles.colors.textMuted }}>DESTINATION</div>
                     <div style={{ fontWeight: 700, fontSize: '14px' }}>{load.destination.split(',')[0]}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {selectedLoad && (
            <motion.div initial={isMobile ? { y: 300 } : { opacity: 0, x: 20 }} animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }} exit={isMobile ? { y: 300 } : { opacity: 0, x: 20 }} style={isMobile ? { position: 'fixed', bottom: 84, left: 16, right: 16, backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', zIndex: 1002, border: `1px solid ${styles.colors.border}`, maxHeight: '60vh', overflowY: 'auto' } : { ...styles.common.card, alignSelf: 'start', position: 'sticky', top: '96px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Place Offer</h3>
                 <button onClick={() => setSelectedLoad(null)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600 }}>Close</button>
               </div>
               <div style={{ backgroundColor: styles.colors.background, padding: '12px', borderRadius: '12px', border: `1px solid ${styles.colors.border}`, marginBottom: '20px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedLoad.origin.split(',')[0]} &rarr; {selectedLoad.destination.split(',')[0]}</div>
               </div>
               <form onSubmit={handleSubmitBid}>
                  <label style={styles.common.label}>Price ($)</label>
                  <input type="number" style={{ ...styles.common.input, fontSize: '20px', fontWeight: 700 }} placeholder="0.00" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required />
                  <label style={{ ...styles.common.label, marginTop: '16px' }}>Message</label>
                  <textarea style={{ ...styles.common.input, minHeight: '80px', resize: 'none' }} placeholder="Why you?" value={bidMessage} onChange={e => setBidMessage(e.target.value)} />
                  <button type="submit" disabled={submitting} style={{ ...styles.common.buttonPrimary, width: '100%', height: '48px', marginTop: '16px' }}>
                    {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Offer'}
                  </button>
               </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverDashboard;
