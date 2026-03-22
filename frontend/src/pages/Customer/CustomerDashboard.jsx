import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Package, Shield, Loader2, Navigation, Search, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import { styles } from '../../utils/styles';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useWindowWidth } from '../../hooks/useWindowWidth';

// Leaflet Icon Fix
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

const CustomerDashboard = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const { isMobile } = useWindowWidth();

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    requiredVehicle: 'Dry Van',
    estimatedWeightKg: ''
  });

  const [mapPoints, setMapPoints] = useState([]);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/loads');
      setLoads(res.data);
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
      setGeocoding(true);
      const p1 = await geocode(formData.origin);
      const p2 = await geocode(formData.destination);
      const points = [];
      if (p1) points.push(p1);
      if (p2) points.push(p2);
      setMapPoints(points);
      setGeocoding(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [formData.origin, formData.destination]);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customer/loads', formData);
      setLoads([res.data, ...loads]);
      setShowModal(false);
      setFormData({ origin: '', destination: '', requiredVehicle: 'Dry Van', estimatedWeightKg: '' });
      setMapPoints([]);
    } catch (e) { console.error(e); }
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
      alert('Success! Shipment Booked.');
      fetchLoads();
      setSelectedLoadId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0 }}>Dashboard</h2>
          <p style={{ color: styles.colors.textMuted, marginTop: '6px', fontSize: isMobile ? '12px' : '14px' }}>Analyze and track your shipments.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={styles.common.buttonPrimary}>
          <Plus size={isMobile ? 18 : 20} /> <span style={{ display: isMobile ? 'none' : 'block' }}>Post New Load</span>
          {isMobile && "Post"}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: (selectedLoadId && !isMobile) ? '1.4fr 1.1fr' : '1fr', 
        gap: '24px' 
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={styles.colors.primary} /></div>
          ) : (
            loads.map(load => (
              <motion.div 
                key={load.id} 
                layout
                onClick={() => viewBids(load.id)}
                style={{ 
                  ...styles.common.card, 
                  cursor: 'pointer',
                  border: selectedLoadId === load.id ? `2px solid ${styles.colors.primary}` : '1px solid #F1F5F9',
                  padding: isMobile ? '20px' : '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ 
                    padding: '4px 12px', borderRadius: '100px', 
                    backgroundColor: load.status === 'OPEN' ? `${styles.colors.primary}10` : `${styles.colors.success}10`,
                    color: load.status === 'OPEN' ? styles.colors.primary : styles.colors.success,
                    fontSize: '11px', fontWeight: 700
                  }}>
                    {load.status}
                  </div>
                  <span style={{ fontSize: '12px', color: styles.colors.textMuted }}>{new Date(load.createdAt).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '10px', color: styles.colors.textMuted, fontWeight: 700 }}>FROM</div>
                     <div style={{ fontWeight: 700, fontSize: isMobile ? '14px' : '16px' }}>{load.origin.split(',')[0]}</div>
                  </div>
                  <ArrowRight size={16} color={styles.colors.border} />
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '10px', color: styles.colors.textMuted, fontWeight: 700 }}>TO</div>
                     <div style={{ fontWeight: 700, fontSize: isMobile ? '14px' : '16px' }}>{load.destination.split(',')[0]}</div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${styles.colors.border}`, display: 'flex', gap: '20px' }}>
                   <div style={{ fontSize: '12px', color: styles.colors.textMuted }}>{load.requiredVehicle}</div>
                   <div style={{ fontSize: '12px', color: styles.colors.textMuted }}>{load.estimatedWeightKg} kg</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {selectedLoadId && (
            <motion.div 
              initial={isMobile ? { y: 300 } : { opacity: 0, x: 20 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
              exit={isMobile ? { y: 300 } : { opacity: 0, x: 20 }}
              style={isMobile ? {
                position: 'fixed', bottom: 84, left: 16, right: 16, backgroundColor: 'white', 
                borderRadius: '24px', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', 
                zIndex: 1002, border: `1px solid ${styles.colors.border}`, maxHeight: '60vh', overflowY: 'auto'
              } : { ...styles.common.card, position: 'sticky', top: '96px', alignSelf: 'start' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Carrier Quotes</h3>
                <button onClick={() => setSelectedLoadId(null)} style={{ background: 'none', border: 'none', color: styles.colors.primary, fontWeight: 600 }}>Close</button>
              </div>

              {bidsLoading ? (
                 <div style={{ textAlign: 'center', padding: '30px' }}><Loader2 className="animate-spin" color={styles.colors.primary} /></div>
              ) : bids.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: styles.colors.textMuted, fontSize: '14px' }}>No offers yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bids.map(bid => (
                    <div key={bid.id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{bid.driver.name}</span>
                        <span style={{ fontWeight: 800, color: styles.colors.primary }}>${bid.amount}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: styles.colors.textMuted, margin: '8px 0 16px' }}>{bid.message}</p>
                      <button onClick={() => acceptBid(bid.id)} style={{ ...styles.common.buttonPrimary, width: '100%', height: '40px' }}>Accept Offer</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1005
          }}>
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 100, opacity: 0 }}
               style={{ 
                 backgroundColor: 'white', width: '100%', maxWidth: '900px', 
                 padding: isMobile ? '24px' : '32px', borderRadius: isMobile ? '24px 24px 0 0' : '24px',
                 display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px',
                 maxHeight: '90vh', overflowY: 'auto'
               }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>New Shipment</h3>
                  <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px' }}>&times;</button>
                </div>
                <form onSubmit={handlePost}>
                   <label style={styles.common.label}>Pickup</label>
                   <input style={{ ...styles.common.input, marginBottom: '16px' }} value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} required />
                   <label style={styles.common.label}>Dropoff</label>
                   <input style={{ ...styles.common.input, marginBottom: '16px' }} value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                   <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={styles.common.label}>Vehicle</label>
                        <select style={styles.common.input} value={formData.requiredVehicle} onChange={e => setFormData({...formData, requiredVehicle: e.target.value})}>
                          <option>Dry Van</option><option>Reefer</option><option>Flatbed</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={styles.common.label}>Weight (kg)</label>
                        <input type="number" style={styles.common.input} value={formData.estimatedWeightKg} onChange={e => setFormData({...formData, estimatedWeightKg: e.target.value})} required />
                      </div>
                   </div>
                   <button type="submit" style={{ ...styles.common.buttonPrimary, width: '100%', height: '48px' }}>Broadcast Load</button>
                </form>
              </div>
              
              {!isMobile && (
                <div style={{ flex: 1.2, height: '400px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${styles.colors.border}` }}>
                  <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                    {mapPoints.map((p, i) => <Marker key={i} position={p} />)}
                    {mapPoints.length === 2 && <Polyline positions={mapPoints} color={styles.colors.primary} weight={3} dashArray="5, 10" />}
                    <RecenterMap points={mapPoints} />
                  </MapContainer>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
