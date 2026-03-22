import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle, MapPin, Loader2, Navigation, Clock } from 'lucide-react';
import { styles } from '../../../styles/styles';
import { getTrips } from '../../../api/tripService';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { useWindowWidth } from '../../hooks/useWindowWidth';

// Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position, map]);
  return null;
};

const OSRMRoute = ({ origin, destination }) => {
  const [route, setRoute] = useState([]);
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const g1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origin)}&limit=1`).then(r => r.json());
        const g2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`).then(r => r.json());
        if (g1[0] && g2[0]) {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${g1[0].lon},${g1[0].lat};${g2[0].lon},${g2[0].lat}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl).then(r => r.json());
          if (res.routes?.[0]) {
            const coords = res.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
          }
        }
      } catch (e) { console.error("Routing error:", e); }
    };
    fetchRoute();
  }, [origin, destination]);
  return route.length > 0 ? <Polyline positions={route} color={styles.colors.primary} weight={4} opacity={0.6} /> : null;
};

const TripCard = ({ trip, socket }) => {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('Loading address...');
  const { isMobile } = useWindowWidth();

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(',');
      }
    } catch (e) { console.error(e); }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  useEffect(() => {
    const initLocation = async () => {
      const locationName = trip.currentLocation || trip.post.origin;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
        const data = await res.json();
        if (data?.[0]) {
          const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setCoords(newCoords);
          const addr = await reverseGeocode(newCoords[0], newCoords[1]);
          setAddress(addr);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initLocation();

    if (socket) {
        socket.emit('joinTrip', trip.id);
        const handleUpdate = async (data) => {
          setCoords([data.lat, data.lng]);
          const addr = await reverseGeocode(data.lat, data.lng);
          setAddress(addr);
        };
        socket.on('locationUpdate', handleUpdate);
        return () => socket.off('locationUpdate', handleUpdate);
    }
  }, [trip, socket]);

  return (
    <div style={{ ...styles.common.card, padding: 0, overflow: 'hidden' }}>
      <div style={{ height: isMobile ? '200px' : '240px', width: '100%', position: 'relative' }}>
        {loading || !coords ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
                <Loader2 className="animate-spin" color={styles.colors.primary} />
             </div>
        ) : (
          <MapContainer center={coords} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
            <OSRMRoute origin={trip.post.origin} destination={trip.post.destination} />
            <Marker position={coords} />
            <RecenterMap position={coords} />
          </MapContainer>
        )}
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: styles.colors.textMuted, fontWeight: 700 }}>DRIVER</div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{trip.driver.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: styles.colors.textMuted, fontWeight: 700 }}>ROUTE</div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{trip.post.origin.split(',')[0]} &rarr; {trip.post.destination.split(',')[0]}</div>
          </div>
        </div>
        <div style={{ backgroundColor: styles.colors.background, padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${styles.colors.border}` }}>
           <Navigation size={14} color={styles.colors.primary} />
           <span style={{ fontSize: '12px', fontWeight: 600 }}>{address}</span>
        </div>
      </div>
    </div>
  );
};

const TripsDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useWindowWidth();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        auth: { token },
        withCredentials: true
    });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: `${styles.colors.primary}15`, padding: '6px', borderRadius: '10px' }}><Truck size={20} color={styles.colors.primary} /></div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Active Monitoring</h2>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color={styles.colors.primary} /></div>
        ) : activeTrips.length === 0 ? (
          <div style={{ ...styles.common.card, textAlign: 'center', padding: '60px', borderStyle: 'dashed' }}>
            <p style={{ color: styles.colors.textMuted, fontSize: '14px' }}>No shipments in transit.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} socket={socketRef.current} />)}
          </div>
        )}
      </section>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: `${styles.colors.success}10`, padding: '6px', borderRadius: '10px' }}><CheckCircle size={20} color={styles.colors.success} /></div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Completed</h2>
        </div>
        <div style={{ ...styles.common.card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '600px' : 'auto' }}>
            <thead style={{ backgroundColor: '#F8FAFC' }}>
              <tr>
                <th style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, color: styles.colors.textMuted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, color: styles.colors.textMuted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Route</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, color: styles.colors.textMuted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Driver</th>
                <th style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, color: styles.colors.textMuted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
                {historyTrips.map(trip => (
                  <tr key={trip.id}>
                    <td style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, fontWeight: 700 }}>#{trip.id.slice(0,8)}</td>
                    <td style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, fontWeight: 600 }}>{trip.post.origin.split(',')[0]} &rarr; {trip.post.destination.split(',')[0]}</td>
                    <td style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}` }}>{trip.driver.name}</td>
                    <td style={{ padding: '16px', borderBottom: `1px solid ${styles.colors.border}`, color: styles.colors.textMuted }}>{new Date(trip.completedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TripsDashboard;
