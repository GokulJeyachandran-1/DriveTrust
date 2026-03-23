import React, { useState, useEffect, useRef } from 'react';
import { Truck, Navigation, Loader2, AlertTriangle, ShieldAlert, Star, X, MapPin, CheckCircle, IndianRupee, AlertCircle } from 'lucide-react';
import { styles } from '../../utils/styles';
import { getTrips, submitReview, triggerSOS, confirmDelivery, submitDamageDeduction } from '../../../api/tripService';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../auth/auth';
import { useToast } from '../../hooks/useToast';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 14); }, [position, map]);
  return null;
};

const OSRMRoute = ({ origin, destination }) => {
  const [route, setRoute] = useState([]);
  
  // Cache to prevent duplicate Nominatim requests and suppress 429 logs
  if (!window.__geocodeCache) window.__geocodeCache = new Map();
  if (!window.__geocodeFailed) window.__geocodeFailed = false;

  const smartFetchGeocode = async (query) => {
    if (window.__geocodeFailed) throw new Error('Geocoding rate limited');
    if (window.__geocodeCache.has(query)) return window.__geocodeCache.get(query);
    try {
      const g = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`).then(r => {
        if (!r.ok) { window.__geocodeFailed = true; throw new Error('Rate limit'); }
        return r.json();
      });
      window.__geocodeCache.set(query, g);
      return g;
    } catch(e) { window.__geocodeFailed = true; throw e; }
  };
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        if (window.__geocodeFailed) return;
        const g1 = await smartFetchGeocode(origin);
        const g2 = await smartFetchGeocode(destination);
        if (g1[0] && g2[0]) {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${g1[0].lon},${g1[0].lat};${g2[0].lon},${g2[0].lat}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl).then(r => r.json());
          if (res.routes?.[0]) setRoute(res.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
        }
      } catch (e) { /* Silently fail — route is optional */ }
    };
    fetchRoute();
  }, [origin, destination]);
  return route.length > 0 ? <Polyline positions={route} color={styles.colors.primary} weight={5} opacity={0.6} dashArray="10, 10" /> : null;
};

const TripDetailsModal = ({ trip, onClose, socket, user }) => {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const toast = useToast();
  
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState('Locating...');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isSosActive, setIsSosActive] = useState(false);
  const [confirmSos, setConfirmSos] = useState(false);

  // Damage deduction state
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageAmount, setDamageAmount] = useState('');
  const [damageReason, setDamageReason] = useState('');
  const [submittingDamage, setSubmittingDamage] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  
  // Rating State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [speedScore, setSpeedScore] = useState(5);
  const [handlingScore, setHandlingScore] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reverse Geocoding
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
      if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const data = await res.json();
      if (data?.display_name) return data.display_name.split(',').slice(0, 3).join(',');
    } catch (e) { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
    return "Unknown Location";
  };

  useEffect(() => {
    const initLocation = async () => {
      const locationName = trip.currentLocation || trip.post.origin;
      try {
        const data = await smartFetchGeocode(locationName);
        if (data?.[0]) {
          const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setCoords(newCoords);
          setAddress(await reverseGeocode(newCoords[0], newCoords[1]));
        } else {
          setCoords([13.0827, 80.2707]);
        }
      } catch (e) {
        setCoords([13.0827, 80.2707]);
      }
    };
    initLocation();

    if (socket && !trip.completedAt) {
      const handleUpdate = async (data) => {
        setCoords([data.lat, data.lng]);
        setAddress(await reverseGeocode(data.lat, data.lng));
        setLastUpdate(Date.now());
      };
      socket.on('locationUpdate', handleUpdate);
      return () => socket.off('locationUpdate', handleUpdate);
    }
  }, [trip, socket]);

  const handleSOS = async () => {
    if (confirmSos) {
      setIsSosActive(true);
      setConfirmSos(false);
      try {
        await triggerSOS(trip.id);
        toast('🚨 SOS Alert Dispatched! Admin tracking initiated.', 'success');
      } catch (e) {
        toast('Failed to trigger SOS', 'error');
        setIsSosActive(false);
      }
    } else {
      setConfirmSos(true);
      toast('Tap SOS again to confirm Emergency Alert', 'info');
      setTimeout(() => setConfirmSos(false), 4000);
    }
  };

  const handleReview = async () => {
    setSubmittingReview(true);
    try {
      await submitReview({
        tripId: trip.id,
        revieweeId: user.role === 'CUSTOMER' ? trip.driverId : trip.post.customerId,
        rating,
        comment,
        speedScore: user.role === 'CUSTOMER' ? speedScore : null,
        handlingScore: user.role === 'CUSTOMER' ? handlingScore : null
      });
      toast('Review submitted successfully!', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to submit review', 'error');
    } finally { setSubmittingReview(false); }
  };

  const isSignalLost = !trip.completedAt && (Date.now() - lastUpdate > 60000);

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 5000, 
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', 
      backgroundColor: isMobile ? 'rgba(0,0,0,0.4)' : 'rgba(15,23,42,0.85)', 
      backdropFilter: 'blur(8px)', 
      padding: isMobile ? '10px' : '24px',
      paddingBottom: isMobile ? '85px' : '24px' // Protect the 70px + safe area nav bar
    }}>
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: '100%', opacity: 0 }}
        style={{ 
          width: '100%', maxWidth: '1000px', 
          height: isMobile ? 'auto' : '85vh',
          maxHeight: '100%',
          backgroundColor: styles.colors.surface, 
          borderRadius: isMobile ? '24px' : '24px', 
          display: 'flex', flexDirection: 'column', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${styles.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Trip Details</h2>
            <p style={{ margin: '4px 0 0', color: styles.colors.secondary, fontSize: '13px' }}>ID: {trip.id.split('-')[0].toUpperCase()}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.colors.secondary }}><X size={24} /></button>
        </div>

        {/* Content Split */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden' }}>
          
          {/* Info Panel */}
          <div style={{ flex: 1, order: isMobile ? 2 : 1, padding: isMobile ? '20px' : '24px', paddingBottom: isMobile ? '100px' : '24px', overflowY: 'auto', borderRight: isMobile ? 'none' : `1px solid ${styles.colors.border}`, minHeight: 0 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><span style={styles.common.label}>Partner</span><div style={{ fontWeight: 700, fontSize: '16px', color: styles.colors.textMain }}>{user.role === 'CUSTOMER' ? trip.driver.name : trip.post.customer.name}</div></div>
              <div style={{ textAlign: 'right' }}><span style={styles.common.label}>Status</span><div style={{ fontWeight: 700, fontSize: '14px', color: trip.post.status === 'DELIVERED' ? styles.colors.success : trip.post.status === 'ARRIVED' ? '#B45309' : styles.colors.primary }}>{trip.post.status}</div></div>
            </div>

            {/* Payment & Delivery Status Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(() => {
                const payment = trip.post?.bids?.[0]?.payment;
                return (
                  <div style={{ padding: '6px 14px', borderRadius: '100px', backgroundColor: payment?.status === 'COLLECTED' || payment?.status === 'RELEASED' ? `${styles.colors.success}15` : '#FEF3C7', color: payment?.status === 'COLLECTED' || payment?.status === 'RELEASED' ? styles.colors.success : '#92400E', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IndianRupee size={12} /> {payment?.status === 'COLLECTED' ? 'Paid ✓' : payment?.status === 'RELEASED' ? 'Released ✓' : 'Payment Pending'}
                  </div>
                );
              })()}
              <div style={{ padding: '6px 14px', borderRadius: '100px', backgroundColor: trip.post.status === 'DELIVERED' ? `${styles.colors.success}15` : trip.post.status === 'ARRIVED' ? '#FEF3C7' : `${styles.colors.primary}15`, color: trip.post.status === 'DELIVERED' ? styles.colors.success : trip.post.status === 'ARRIVED' ? '#92400E' : styles.colors.primary, fontSize: '12px', fontWeight: 700 }}>
                {trip.post.status === 'DELIVERED' ? 'Delivered ✓' : trip.post.status === 'ARRIVED' ? 'Driver Arrived' : trip.post.status === 'IN_TRANSIT' ? 'In Transit' : 'Booked'}
              </div>
            </div>

            <div style={{ backgroundColor: styles.colors.background, padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <MapPin size={20} color={styles.colors.primary} />
                <div><span style={styles.common.label}>Origin</span><div style={{ fontWeight: 600, color: styles.colors.textMain }}>{trip.post.origin}</div></div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Navigation size={20} color={styles.colors.success} />
                <div><span style={styles.common.label}>Destination</span><div style={{ fontWeight: 600, color: styles.colors.textMain }}>{trip.post.destination}</div></div>
              </div>
            </div>

            {!trip.completedAt && (
              <div style={{ marginBottom: '32px' }}>
                <div style={styles.common.label}>Live Tracking</div>
                <div style={{ padding: '16px', backgroundColor: isSignalLost ? '#FEF2F2' : `${styles.colors.success}10`, border: `1px solid ${isSignalLost ? '#FCA5A5' : styles.colors.success}50`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isSignalLost ? <AlertTriangle color="#EF4444" size={24} /> : <div style={{ width: '12px', height: '12px', backgroundColor: styles.colors.success, borderRadius: '50%', boxShadow: `0 0 10px ${styles.colors.success}` }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: isSignalLost ? '#991B1B' : styles.colors.success }}>{isSignalLost ? 'GPS Signal Lost' : 'Live Connected'}</div>
                    <div style={{ fontSize: '13px', color: isSignalLost ? '#B91C1C' : styles.colors.textMain, marginTop: '2px' }}>{address}</div>
                  </div>
                </div>
              </div>
            )}

            {!trip.completedAt && trip.post.status !== 'ARRIVED' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSOS} style={{ ...styles.common.buttonPrimary, backgroundColor: isSosActive ? '#991B1B' : styles.colors.danger, width: '100%', height: '54px', gap: '8px', fontSize: '16px' }}>
                <ShieldAlert size={20} /> {isSosActive ? "SOS PROTOCOL ACTIVE" : "EMERGENCY SOS"}
              </motion.button>
            )}

            {/* Customer: Confirm Delivery + Report Damages (only when ARRIVED) */}
            {user.role === 'CUSTOMER' && trip.post.status === 'ARRIVED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '12px', color: '#92400E', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} /> Driver has arrived. Inspect goods before confirming.
                </div>

                {/* Damage Form */}
                {!showDamageForm && !trip.deduction && (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDamageForm(true)} style={{ ...styles.common.buttonPrimary, backgroundColor: '#F59E0B', width: '100%', gap: '8px' }}>
                    <AlertTriangle size={18} /> Report Damages (Optional)
                  </motion.button>
                )}

                {showDamageForm && (
                  <div style={{ padding: '16px', backgroundColor: styles.colors.background, borderRadius: '12px', border: `1px solid ${styles.colors.border}` }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: styles.colors.textMain }}>Damage Deduction</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={styles.common.label}>Deduction Amount (₹)</label>
                      <input type="number" min="1" value={damageAmount} onChange={e => setDamageAmount(e.target.value)} style={{ ...styles.common.input, fontWeight: 700 }} placeholder="e.g. 500" />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={styles.common.label}>Reason for Deduction</label>
                      <textarea value={damageReason} onChange={e => setDamageReason(e.target.value)} style={{ ...styles.common.input, minHeight: '60px' }} placeholder="Describe the damage..." />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button whileTap={{ scale: 0.98 }} disabled={submittingDamage} onClick={async () => {
                        setSubmittingDamage(true);
                        try {
                          await submitDamageDeduction(trip.id, { amount: parseFloat(damageAmount), reason: damageReason });
                          toast('Damage report submitted. Admin will review.', 'success');
                          setShowDamageForm(false);
                          onClose();
                        } catch (e) { toast(e.response?.data?.error || 'Failed to submit', 'error'); }
                        finally { setSubmittingDamage(false); }
                      }} style={{ ...styles.common.buttonPrimary, flex: 1, backgroundColor: '#F59E0B' }}>
                        {submittingDamage ? <Loader2 className="animate-spin" /> : 'Submit Report'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDamageForm(false)} style={{ ...styles.common.buttonPrimary, flex: 1, backgroundColor: styles.colors.secondary }}>
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                )}

                {trip.deduction && (
                  <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: `${styles.colors.primary}10`, color: styles.colors.primary, fontSize: '13px', fontWeight: 600 }}>
                    Damage reported: ₹{trip.deduction.amount} — Status: {trip.deduction.status}
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={confirmingDelivery} onClick={async () => {
                  setConfirmingDelivery(true);
                  try {
                    await confirmDelivery(trip.id);
                    toast('Delivery confirmed! You can now rate the driver.', 'success');
                    onClose();
                  } catch (e) { toast(e.response?.data?.error || 'Failed to confirm', 'error'); }
                  finally { setConfirmingDelivery(false); }
                }} style={{ ...styles.common.buttonPrimary, backgroundColor: styles.colors.success, width: '100%', height: '54px', gap: '8px', fontSize: '16px' }}>
                  <CheckCircle size={20} /> {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery'}
                </motion.button>
              </div>
            )}

            {trip.completedAt && (
              <div style={{ backgroundColor: styles.colors.background, padding: '24px', borderRadius: '16px', border: `1px solid ${styles.colors.border}`, marginTop: '16px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: styles.colors.textMain }}>Rate & Feedback</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {[1,2,3,4,5].map(s => (
                    <motion.div key={s} whileHover={{ scale: 1.2 }} onClick={() => setRating(s)} style={{ cursor: 'pointer' }}>
                      <Star size={28} fill={rating >= s ? '#F59E0B' : 'transparent'} color={rating >= s ? '#F59E0B' : styles.colors.secondary} />
                    </motion.div>
                  ))}
                </div>
                {user.role === 'CUSTOMER' && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}><span style={{ fontSize: '12px', color: styles.colors.secondary }}>Speed</span><input type="range" min="1" max="5" value={speedScore} onChange={e => setSpeedScore(e.target.value)} style={{ width: '100%', accentColor: styles.colors.primary }} /></div>
                    <div style={{ flex: 1 }}><span style={{ fontSize: '12px', color: styles.colors.secondary }}>Care</span><input type="range" min="1" max="5" value={handlingScore} onChange={e => setHandlingScore(e.target.value)} style={{ width: '100%', accentColor: styles.colors.primary }} /></div>
                  </div>
                )}
                <textarea placeholder="Leave a review comment..." value={comment} onChange={e=>setComment(e.target.value)} style={{ ...styles.common.input, minHeight: '80px', marginBottom: '16px' }} />
                <motion.button onClick={handleReview} disabled={submittingReview} whileTap={{ scale: 0.98 }} style={{ ...styles.common.buttonPrimary, width: '100%' }}>
                  {submittingReview ? <Loader2 className="animate-spin" /> : 'Submit Feedback'}
                </motion.button>
              </div>
            )}
          </div>

          {/* Map Panel */}
          <div style={{ 
            flex: 'none', 
            order: isMobile ? 1 : 2, 
            position: 'relative', 
            backgroundColor: '#e2e8f0', 
            height: isMobile ? '160px' : 'auto', 
            minHeight: isMobile ? '160px' : 'auto', 
            width: isMobile ? '100%' : '60%',
            zIndex: 1 // Ensure markers don't bleed out
          }}>
            {coords ? (
              <MapContainer center={coords} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                <OSRMRoute origin={trip.post.origin} destination={trip.post.destination} />
                <Marker position={coords} />
                <RecenterMap position={coords} />
              </MapContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color={styles.colors.primary} size={32} /></div>}
          </div>

        </div>
      </motion.div>
    </div>
  );
};

const TripCard = ({ trip, onClick }) => {
  const width = useWindowWidth();
  const isMobile = width < 768;

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
      onClick={() => onClick(trip)}
      style={{ ...styles.common.card, padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', border: `1px solid ${styles.colors.border}`, position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '6px 12px', borderRadius: '100px', backgroundColor: trip.post.status === 'DELIVERED' ? `${styles.colors.success}15` : trip.post.status === 'ARRIVED' ? '#FEF3C7' : `${styles.colors.primary}15`, color: trip.post.status === 'DELIVERED' ? styles.colors.success : trip.post.status === 'ARRIVED' ? '#92400E' : styles.colors.primary, fontSize: '11px', fontWeight: 700 }}>
          {trip.post.status === 'DELIVERED' ? 'DELIVERED' : trip.post.status === 'ARRIVED' ? 'ARRIVED' : 'ACTIVE'}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {(() => {
            const payment = trip.post?.bids?.[0]?.payment;
            return payment ? (
              <div style={{ padding: '4px 10px', borderRadius: '100px', backgroundColor: payment.status === 'COLLECTED' || payment.status === 'RELEASED' ? `${styles.colors.success}15` : '#FEF3C7', color: payment.status === 'COLLECTED' || payment.status === 'RELEASED' ? styles.colors.success : '#92400E', fontSize: '10px', fontWeight: 700 }}>
                {payment.status === 'COLLECTED' ? '₹ Paid' : payment.status === 'RELEASED' ? '₹ Released' : '₹ Pending'}
              </div>
            ) : null;
          })()}
          <span style={{ fontSize: '13px', color: styles.colors.secondary, fontWeight: 500 }}>ID: {trip.id.split('-')[0].toUpperCase()}</span>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: styles.colors.primary }} />
          <span style={{ fontWeight: 600, fontSize: '15px', color: styles.colors.textMain }}>{trip.post.origin.split(',')[0]}</span>
        </div>
        <div style={{ marginLeft: '3px', borderLeft: `2px dashed ${styles.colors.border}`, height: '16px', paddingLeft: '20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: styles.colors.success }} />
          <span style={{ fontWeight: 600, fontSize: '15px', color: styles.colors.textMain }}>{trip.post.destination.split(',')[0]}</span>
        </div>
      </div>
      <div style={{ paddingTop: '16px', borderTop: `1px solid ${styles.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: styles.colors.secondary }}>Partner: {trip.driver.name}</span>
        <button style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>View Details &rarr;</button>
      </div>
    </motion.div>
  );
};

const TripsDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const width = useWindowWidth();
  const isMobile = width < 768;
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { withCredentials: true });
    fetchTrips();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const fetchTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const activeTrips = trips.filter(t => !t.completedAt);
  const historyTrips = trips.filter(t => t.completedAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '32px' : '48px', width: '100%' }}>
      
      {/* Active Trips */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: `${styles.colors.primary}15`, padding: '8px', borderRadius: '12px' }}><Truck size={24} color={styles.colors.primary} /></div>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: styles.typography.titleWeight, margin: 0, color: styles.colors.textMain }}>Active Shipments</h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
        ) : activeTrips.length === 0 ? (
          <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px', backgroundColor: styles.colors.surface }}>
            <Navigation size={48} color={styles.colors.border} style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: 0, fontSize: '18px', color: styles.colors.textMain }}>No active trips</h3>
            <p style={{ color: styles.colors.secondary, marginTop: '8px' }}>Tracking will appear here during transit</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} onClick={setSelectedTrip} />)}
          </div>
        )}
      </section>

      {/* Trip History */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: `${styles.colors.success}15`, padding: '8px', borderRadius: '12px' }}><CheckCircle size={24} color={styles.colors.success} /></div>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: styles.typography.titleWeight, margin: 0, color: styles.colors.textMain }}>Completed</h2>
        </div>
        
        {historyTrips.length === 0 ? (
           <div style={{ padding: '24px', border: `1px dashed ${styles.colors.border}`, borderRadius: '16px', textAlign: 'center', color: styles.colors.secondary }}>No completed trips yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {historyTrips.map(trip => <TripCard key={trip.id} trip={trip} onClick={setSelectedTrip} />)}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedTrip && (
          <TripDetailsModal 
            trip={selectedTrip} 
            onClose={() => setSelectedTrip(null)} 
            socket={selectedTrip.completedAt ? null : socketRef.current} 
            user={user} 
          />
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default TripsDashboard;
