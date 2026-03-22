import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Loader2, Navigation, MapPin, Package, Star } from 'lucide-react';
import PublicProfileModal from '../../components/Profile/PublicProfileModal';
import { styles } from '../../utils/styles';
import { getMyLoads, createLoad } from '../../../api/customerService';
import api from '../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useWindowWidth } from '../../hooks/useWindowWidth';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (points && points.length === 1) {
      map.setView(points[0], 12);
    }
  }, [points, map]);
  return null;
};

const TRUCK_TYPES = [
  'Tata Ace', 'Mahindra Bolero', 'Ashok Leyland Dost', 
  'Tata 407', 'Eicher 14ft', 'Container 20ft', 'Container 32ft'
];

const CustomerDashboard = () => {
  const toast = useToast();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    requiredVehicle: 'Tata Ace',
    estimatedWeightKg: ''
  });

  const [mapPoints, setMapPoints] = useState([]);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    setLoading(true);
    try {
      const data = await getMyLoads();
      setLoads(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const geocode = async (address) => {
    if (!address || address.length < 3) return null;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data && data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch (e) { console.error(e); }
    return null;
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const p1 = await geocode(formData.origin);
      const p2 = await geocode(formData.destination);
      const points = [];
      if (p1) points.push(p1);
      if (p2) points.push(p2);
      setMapPoints(points);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.origin, formData.destination]);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const data = await createLoad(formData);
      setLoads([data, ...loads]);
      setShowModal(false);
      setFormData({ origin: '', destination: '', requiredVehicle: 'Tata Ace', estimatedWeightKg: '' });
      setMapPoints([]);
      toast('Load posted successfully!', 'success');
    } catch (e) {
      // Global error handler will automatically display error toast
      console.error(e);
    }
  };

  const viewBids = async (loadId) => {
    setSelectedLoadId(loadId === selectedLoadId ? null : loadId);
    if (loadId !== selectedLoadId) {
      setBidsLoading(true);
      try {
        const res = await api.get(`/customer/loads/${loadId}/bids`);
        setBids(res.data);
      } catch (e) { console.error(e); } finally { setBidsLoading(false); }
    }
  };

  const acceptBid = async (bidId) => {
    try {
      await api.post(`/customer/loads/${selectedLoadId}/book`, { bidId });
      toast('Success! Shipment Booked.', 'success');
      fetchLoads();
      setSelectedLoadId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '32px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: styles.typography.titleWeight, margin: 0, color: styles.colors.textMain }}>Dashboard</h2>
          <p style={{ color: styles.colors.secondary, marginTop: '4px', fontSize: '14px' }}>Track and manage your shipments</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)} 
          style={styles.common.buttonPrimary}
        >
          <Plus size={20} style={{ marginRight: isMobile ? 0 : '8px' }} /> 
          {!isMobile && <span>Post</span>}
        </motion.button>
      </div>

      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: (!isMobile && selectedLoadId) ? '1.5fr 1fr' : '1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Leads List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
               <Loader2 className="animate-spin" size={32} color={styles.colors.primary} />
            </div>
          ) : loads.length === 0 ? (
            <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px 20px' }}>
               <Package size={48} color={styles.colors.border} style={{ marginBottom: '16px' }} />
               <h3 style={{ margin: 0, fontSize: '18px', color: styles.colors.textMain }}>No active shipments</h3>
               <p style={{ color: styles.colors.secondary, marginTop: '8px' }}>Post a load to get started</p>
            </div>
          ) : (
            loads.map(load => (
              <motion.div 
                layout 
                onClick={() => viewBids(load.id)} 
                key={load.id}
                whileHover={{ y: -2 }}
                style={{ 
                  ...styles.common.card, 
                  cursor: 'pointer', 
                  border: selectedLoadId === load.id ? `2px solid ${styles.colors.primary}` : `1px solid ${styles.colors.border}`, 
                  padding: isMobile ? '16px' : '20px',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '6px 14px', borderRadius: '100px', 
                    backgroundColor: load.status === 'OPEN' ? `${styles.colors.primary}15` : `${styles.colors.success}15`, 
                    color: load.status === 'OPEN' ? styles.colors.primary : styles.colors.success, 
                    fontSize: '12px', fontWeight: 700 
                  }}>
                    {load.status}
                  </div>
                  <span style={{ fontSize: '13px', color: styles.colors.secondary, fontWeight: 500 }}>
                    {new Date(load.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                     <div style={styles.common.label}>Origin</div>
                     <div style={{ fontWeight: 700, fontSize: isMobile ? '15px' : '18px', color: styles.colors.textMain }}>{load.origin.split(',')[0]}</div>
                  </div>
                  <ArrowRight size={20} color={styles.colors.border} />
                  <div style={{ flex: 1 }}>
                     <div style={styles.common.label}>Destination</div>
                     <div style={{ fontWeight: 700, fontSize: isMobile ? '15px' : '18px', color: styles.colors.textMain }}>{load.destination.split(',')[0]}</div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${styles.colors.border}`, display: 'flex', gap: '24px' }}>
                   <div>
                     <span style={{ fontSize: '12px', color: styles.colors.secondary, display: 'block', marginBottom: '4px' }}>Vehicle</span>
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

        {/* Quotes Panel */}
        <AnimatePresence>
          {selectedLoadId && (
            <motion.div 
              initial={isMobile ? { y: 300, opacity: 0 } : { opacity: 0, x: 20 }} 
              animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, x: 0 }} 
              exit={isMobile ? { y: 300, opacity: 0 } : { opacity: 0, x: 20 }} 
              style={isMobile ? { 
                position: 'fixed', bottom: 84, left: 16, right: 16, 
                backgroundColor: styles.colors.surface, borderRadius: '24px', 
                padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', 
                zIndex: 1002, border: `1px solid ${styles.colors.border}`, 
                maxHeight: '60vh', overflowY: 'auto' 
              } : { 
                ...styles.common.card, position: 'sticky', top: '100px' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Quotes</h3>
                <button 
                  onClick={() => setSelectedLoadId(null)} 
                  style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>

              {bidsLoading ? (
                 <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" color={styles.colors.primary} /></div>
              ) : bids.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: styles.colors.secondary, fontSize: '14px', backgroundColor: styles.colors.background, borderRadius: '12px' }}>
                   No quotes received yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bids.map(bid => (
                    <div key={bid.id} style={{ padding: '20px', borderRadius: '16px', backgroundColor: styles.colors.background, border: `1px solid ${styles.colors.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <motion.div 
                           onClick={(e) => { e.stopPropagation(); setProfileUserId(bid.driver.id); }}
                           whileHover={{ backgroundColor: `${styles.colors.primary}08` }}
                           style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', margin: '-6px -10px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: styles.colors.primaryDark, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                             {bid.driver.name.charAt(0).toUpperCase()}
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontWeight: 700, color: styles.colors.textMain, fontSize: '14px', lineHeight: 1 }}>{bid.driver.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: styles.colors.secondary, marginTop: '4px' }}>
                                 <Star size={12} fill="#F59E0B" color="#F59E0B" />
                                 <span style={{ fontWeight: 600 }}>{bid.driver.reviewsReceived?.length > 0 ? (bid.driver.reviewsReceived.reduce((a, b) => a + b.rating, 0) / bid.driver.reviewsReceived.length).toFixed(1) : 'New'}</span>
                              </div>
                           </div>
                        </motion.div>
                        <span style={{ fontWeight: 800, fontSize: '18px', color: styles.colors.primary }}>₹{bid.amount}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: styles.colors.secondary, margin: '8px 0 16px', lineHeight: 1.5 }}>"{bid.message}"</p>
                      {loads.find(l => l.id === selectedLoadId)?.status === 'OPEN' && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => acceptBid(bid.id)} 
                          style={{ ...styles.common.buttonPrimary, width: '100%', height: '44px' }}
                        >
                          Accept Offer
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Load Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', 
            zIndex: 1005 
          }}>
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }} 
              style={{ 
                backgroundColor: styles.colors.surface, 
                width: '100%', 
                maxWidth: '900px', 
                padding: isMobile ? '24px' : '40px', 
                borderRadius: isMobile ? '24px 24px 0 0' : '24px', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: '32px', 
                maxHeight: isMobile ? '90vh' : '85vh', 
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: styles.typography.titleWeight, color: styles.colors.textMain }}>Post Load</h3>
                  <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '28px', color: styles.colors.secondary, cursor: 'pointer' }}>&times;</button>
                </div>
                
                <form onSubmit={handlePost}>
                   <div style={{ marginBottom: '20px' }}>
                     <label style={styles.common.label}>Pickup Location</label>
                     <div style={{ position: 'relative' }}>
                        <MapPin size={18} color={styles.colors.secondary} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input style={{ ...styles.common.input, paddingLeft: '44px' }} placeholder="e.g. Mumbai, Maharashtra" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} required />
                     </div>
                   </div>

                   <div style={{ marginBottom: '24px' }}>
                     <label style={styles.common.label}>Dropoff Location</label>
                     <div style={{ position: 'relative' }}>
                        <Navigation size={18} color={styles.colors.secondary} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input style={{ ...styles.common.input, paddingLeft: '44px' }} placeholder="e.g. Delhi" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                     </div>
                   </div>

                   <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={styles.common.label}>Vehicle</label>
                        <select style={{ ...styles.common.input, cursor: 'pointer' }} value={formData.requiredVehicle} onChange={e => setFormData({...formData, requiredVehicle: e.target.value})}>
                          {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={styles.common.label}>Weight (kg)</label>
                        <input type="number" style={styles.common.input} placeholder="1500" value={formData.estimatedWeightKg} onChange={e => setFormData({...formData, estimatedWeightKg: e.target.value})} required min="1" />
                      </div>
                   </div>

                   <motion.button 
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     type="submit" 
                     style={{ ...styles.common.buttonPrimary, width: '100%', height: '52px', fontSize: '16px' }}
                   >
                     Post Active Load
                   </motion.button>
                </form>
              </div>

              {!isMobile && (
                <div style={{ flex: 1.2, height: '500px', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${styles.colors.border}`, backgroundColor: styles.colors.background }}>
                  <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                    {mapPoints.map((p, i) => <Marker key={i} position={p} />)}
                    {mapPoints.length === 2 && <Polyline positions={mapPoints} color={styles.colors.primary} weight={4} dashArray="8, 8" />}
                    <RecenterMap points={mapPoints} />
                  </MapContainer>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileUserId && <PublicProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      </AnimatePresence>

    </div>
  );
};

export default CustomerDashboard;
