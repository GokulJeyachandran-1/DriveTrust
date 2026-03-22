import React, { useState, useEffect, useRef } from 'react';
import { Search, Navigation, Package, PlayCircle, StopCircle, CheckCircle2, ArrowRight, Loader2, IndianRupee, MapPin, ShieldAlert, Star } from 'lucide-react';
import PublicProfileModal from '../../components/Profile/PublicProfileModal';
import { styles } from '../../utils/styles';
import { getOpenLoads, submitBid } from '../../../api/driverService';
import { getTrips, updateTripStatus, triggerSOS } from '../../../api/tripService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { io } from 'socket.io-client';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const DriverDashboard = () => {
  const toast = useToast();
  const [loads, setLoads] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSosActive, setIsSosActive] = useState({});
  const [profileUserId, setProfileUserId] = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  const width = useWindowWidth();
  const isMobile = width < 768;
  
  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // We are no longer using localStorage for token in normal flow, but let's safely try to get it from memory or skip if missing since interceptor handles it. 
    // Actually, socket.io needs token. 
    // Let's rely on an api call to get me, or let socket connect and fail if unauthenticated.
    // Wait, the backend io checks token, we'll try to get it from cookies. The backend has to be configured for cookie auth on socket.io. 
    // For now, removing token passed here since driver dashboard is protected and cookies are sent via withCredentials.
    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
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
      toast("Geolocation is not supported by your browser", "error");
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
        if (error.code === 3) {
           toast("Weak GPS signal. Retrying...", "error");
        } else if (error.code === 1) {
           toast("Please allow Location permissions", "error");
           stopTracking();
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingId(null);
  };

  const handleSOS = async (tripId) => {
    if (window.confirm("Are you sure you want to trigger an Emergency SOS?")) {
      setIsSosActive(prev => ({...prev, [tripId]: true}));
      try {
        await triggerSOS(tripId);
        toast('🚨 SOS Alert Dispatched! Admin is tracking you.', 'success');
      } catch (e) {
        setIsSosActive(prev => ({...prev, [tripId]: false}));
      }
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitBid(selectedLoad.id, {
        amount: bidAmount,
        message: bidMessage
      });
      toast('Offer submitted successfully!', 'success');
      setSelectedLoad(null);
      setBidAmount('');
      setBidMessage('');
      fetchData();
    } catch (e) {
      console.error(e); // Global interceptor handles API error toasts
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '40px', width: '100%' }}>
      {/* Active Trips Section */}
      {activeTrips.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: `${styles.colors.success}15`, padding: '8px', borderRadius: '12px' }}>
               <Navigation size={20} color={styles.colors.success} />
            </div>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: styles.typography.titleWeight, margin: 0, color: styles.colors.textMain }}>Active Jobs</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {activeTrips.map(trip => (
              <motion.div 
                key={trip.id} 
                whileHover={{ y: -2 }}
                style={{ 
                  ...styles.common.card, 
                  borderTop: `4px solid ${trackingId === trip.id ? styles.colors.primary : styles.colors.success}`,
                  display: 'flex', flexDirection: 'column', gap: '20px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: styles.colors.secondary, fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
                    TRIP #{trip.id.slice(0,8).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ fontWeight: 700, fontSize: '18px', color: styles.colors.textMain }}>{trip.post.origin.split(',')[0]}</div>
                     <ArrowRight size={16} color={styles.colors.secondary} />
                     <div style={{ fontWeight: 700, fontSize: '18px', color: styles.colors.textMain }}>{trip.post.destination.split(',')[0]}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => trackingId === trip.id ? stopTracking() : startLiveTracking(trip)} 
                    style={{ 
                       ...styles.common.buttonPrimary, 
                       flex: 1, 
                       backgroundColor: trackingId === trip.id ? styles.colors.danger : styles.colors.primary,
                       gap: '8px'
                    }}
                  >
                    {trackingId === trip.id ? <StopCircle size={18} /> : <PlayCircle size={18} />}
                    {trackingId === trip.id ? 'Stop' : 'Track'}
                  </motion.button>
                  
                  <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSOS(trip.id)}
                      style={{ 
                         ...styles.common.buttonPrimary, flex: 1, 
                         backgroundColor: isSosActive[trip.id] ? '#991B1B' : styles.colors.danger,
                         gap: '8px'
                      }}
                    >
                      <ShieldAlert size={18} /> {isSosActive[trip.id] ? "ACTIVE" : "SOS"}
                  </motion.button>

                  {trip.status !== 'DELIVERED' && (
                    <motion.button 
                      whileTap={{ scale: 0.96 }}
                      onClick={async () => {
                        if (confirm('Mark this trip as delivered?')) {
                          await updateTripStatus(trip.id, 'DELIVERED');
                          fetchData();
                        }
                      }}
                      style={{ 
                         ...styles.common.buttonPrimary, 
                         flex: 1, 
                         backgroundColor: styles.colors.success,
                         gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={18} /> Deliver
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Marketplace Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: styles.typography.titleWeight, margin: 0, color: styles.colors.textMain }}>Marketplace</h2>
            <p style={{ color: styles.colors.secondary, marginTop: '4px', fontSize: '14px' }}>Find profitable routes</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (!isMobile && selectedLoad) ? '1.5fr 1fr' : '1fr', 
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Load List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
               <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
            ) : loads.length === 0 ? (
              <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px 20px' }}>
                 <Search size={48} color={styles.colors.border} style={{ marginBottom: '16px' }} />
                 <h3 style={{ margin: 0, fontSize: '18px', color: styles.colors.textMain }}>No active loads</h3>
                 <p style={{ color: styles.colors.secondary, marginTop: '8px' }}>Check back later</p>
              </div>
            ) : (
              loads.map(load => (
                <motion.div 
                  key={load.id} 
                  layout 
                  onClick={() => setSelectedLoad(load)} 
                  whileHover={{ y: -2 }}
                  style={{ 
                    ...styles.common.card, 
                    cursor: 'pointer', 
                    border: selectedLoad?.id === load.id ? `2px solid ${styles.colors.primary}` : `1px solid ${styles.colors.border}`,
                    padding: isMobile ? '16px' : '20px',
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <motion.div 
                        onClick={(e) => { e.stopPropagation(); setProfileUserId(load.customer.id); }}
                        whileHover={{ backgroundColor: `${styles.colors.primary}08` }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', margin: '-6px -10px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                       <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: styles.colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: styles.colors.primaryDark }}>
                          {load.customer.name.charAt(0).toUpperCase()}
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, color: styles.colors.textMain, fontSize: '14px', lineHeight: 1 }}>{load.customer.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: styles.colors.secondary, marginTop: '4px' }}>
                             <Star size={12} fill="#F59E0B" color="#F59E0B" />
                             <span style={{ fontWeight: 600 }}>{load.customer.reviewsReceived?.length > 0 ? (load.customer.reviewsReceived.reduce((a, b) => a + b.rating, 0) / load.customer.reviewsReceived.length).toFixed(1) : 'New'}</span>
                          </div>
                       </div>
                    </motion.div>
                    <span style={{ fontSize: '13px', color: styles.colors.secondary, fontWeight: 500 }}>{new Date(load.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                       <div style={styles.common.label}>Origin</div>
                       <div style={{ fontWeight: 700, fontSize: isMobile ? '16px' : '18px', color: styles.colors.textMain }}>{load.origin.split(',')[0]}</div>
                    </div>
                    <ArrowRight size={20} color={styles.colors.border} />
                    <div style={{ flex: 1 }}>
                       <div style={styles.common.label}>Destination</div>
                       <div style={{ fontWeight: 700, fontSize: isMobile ? '16px' : '18px', color: styles.colors.textMain }}>{load.destination.split(',')[0]}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', paddingTop: '16px', borderTop: `1px solid ${styles.colors.border}` }}>
                     <div>
                       <span style={{ fontSize: '12px', color: styles.colors.secondary, display: 'block', marginBottom: '4px' }}>Vehicle Required</span>
                       <span style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain }}>{load.requiredVehicle}</span>
                     </div>
                     <div>
                       <span style={{ fontSize: '12px', color: styles.colors.secondary, display: 'block', marginBottom: '4px' }}>Weight</span>
                       <span style={{ fontSize: '14px', fontWeight: 600, color: styles.colors.textMain }}>{load.estimatedWeightKg} kg</span>
                     </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Bid Panel */}
          <AnimatePresence>
            {selectedLoad && (
              <motion.div 
                initial={isMobile ? { y: 300, opacity: 0 } : { opacity: 0, x: 20 }} 
                animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, x: 0 }} 
                exit={isMobile ? { y: 300, opacity: 0 } : { opacity: 0, x: 20 }} 
                style={isMobile ? { 
                  position: 'fixed', bottom: 84, left: 16, right: 16, 
                  backgroundColor: styles.colors.surface, borderRadius: '24px', 
                  padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', 
                  zIndex: 1002, border: `1px solid ${styles.colors.border}`, 
                  maxHeight: '70vh', overflowY: 'auto' 
                } : { 
                  ...styles.common.card, position: 'sticky', top: '100px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Quote</h3>
                  <button onClick={() => setSelectedLoad(null)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                </div>

                <div style={{ backgroundColor: styles.colors.background, padding: '16px', borderRadius: '12px', border: `1px solid ${styles.colors.border}`, marginBottom: '24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: styles.colors.textMain, fontWeight: 700, fontSize: '15px' }}>
                      <MapPin size={16} /> 
                      {selectedLoad.origin.split(',')[0]} &rarr; {selectedLoad.destination.split(',')[0]}
                   </div>
                </div>

                <form onSubmit={handleSubmitBid}>
                   <div style={{ marginBottom: '20px' }}>
                     <label style={styles.common.label}>Amount (₹)</label>
                     <div style={{ position: 'relative' }}>
                        <IndianRupee size={20} color={styles.colors.secondary} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="number" 
                          style={{ ...styles.common.input, fontSize: '24px', fontWeight: 700, paddingLeft: '48px', height: '60px' }} 
                          placeholder="0.00" 
                          value={bidAmount} 
                          onChange={e => setBidAmount(e.target.value)} 
                          required 
                          min="1"
                        />
                     </div>
                   </div>

                   <div style={{ marginBottom: '24px' }}>
                     <label style={styles.common.label}>Note to Customer</label>
                     <textarea 
                       style={{ ...styles.common.input, minHeight: '100px', resize: 'vertical' }} 
                       placeholder="e.g. Can load tomorrow morning" 
                       value={bidMessage} 
                       onChange={e => setBidMessage(e.target.value)} 
                       required
                     />
                   </div>

                   <motion.button 
                     whileTap={{ scale: 0.98 }}
                     type="submit" 
                     disabled={submitting} 
                     style={{ ...styles.common.buttonPrimary, width: '100%', height: '52px', fontSize: '16px' }}
                   >
                     {submitting ? <Loader2 className="animate-spin" /> : 'Confirm'}
                   </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      {/* Public Profile Modal Container Overlay */}
      <AnimatePresence>
        {profileUserId && <PublicProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      </AnimatePresence>

    </div>
  );
};

export default DriverDashboard;
