import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    Navigation,
    Search,
    Clock,
    TrendingUp,
    Truck as TruckIcon,
    ChevronRight,
    ShieldCheck,
    Star as StarIcon,
    PhoneCall,
    X,
    Loader2
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getRouteData, geocode } from '../../services/routeService';
import './CustomerDashboard.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapMover = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 14);
    }, [coords]);
    return null;
};

const RouteFitter = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coords, map]);
    return null;
};

// Sub-component: Find Drivers
const FindDrivers = ({ user }) => {
    const [location, setLocation] = useState([12.9716, 77.5946]);
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);
    const [estimating, setEstimating] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.log(err)
            );
        }

        // Fetch online drivers
        const q = query(collection(db, 'users'), where('role', '==', 'Driver'), where('isOnline', '==', true));
        const unsub = onSnapshot(q, (snapshot) => {
            const driversData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.location) {
                    driversData.push({ id: doc.id, ...data });
                }
            });
            setDrivers(driversData);
        });

        return () => unsub();
    }, []);

    const handleEstimate = async () => {
        if (!pickup || !destination) return;
        setEstimating(true);
        try {
            const pickCoords = await geocode(pickup);
            const destCoords = await geocode(destination);
            if (pickCoords && destCoords) {
                const data = await getRouteData(pickCoords, destCoords);
                setRouteInfo(data);
            } else {
                throw new Error("Could not geocode locations");
            }
        } catch (err) {
            console.error("Geocoding/Routing failed.", err);
            window.alert("Could not calculate route. Please check the location names or try again.");
        } finally {
            setEstimating(false);
        }
    };

    const handleBookingRequest = async () => {
        if (!selectedDriver) {
            window.alert("Please select a driver first!");
            return;
        }

        let finalRouteInfo = routeInfo;
        // If they skipped 'Estimate Route', force them to do so or block booking
        if (!finalRouteInfo) {
            window.alert("Please predict the route before requesting a booking!");
            return;
        }

        setIsBooking(true);
        try {
            const tripId = `trip_${Date.now()}`;
            await setDoc(doc(db, 'bookings', tripId), {
                tripId,
                customerId: user.uid,
                customerName: user.name || "Customer",
                driverId: selectedDriver.id,
                driverName: selectedDriver.name,
                driverPhone: selectedDriver.phone,
                pickup,
                destination,
                distance: finalRouteInfo.distance,
                duration: finalRouteInfo.duration,
                status: 'Requested',
                paymentStatus: 'Pending',
                createdAt: new Date().toISOString()
            });
            window.alert("Booking Requested successfully! The driver has been notified.");
            setSelectedDriver(null);
            setPickup('');
            setDestination('');
            setRouteInfo(null);
        } catch (error) {
            console.error(error);
            window.alert("Failed to request booking.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="dashboard-grid">
            <div className="dashboard-left">
                <div className="card trip-estimator animate-slide-up">
                    <div className="card-header">
                        <TrendingUp size={20} className="text-primary" />
                        <h3 className="card-title">Trip Estimator</h3>
                    </div>

                    <div className="estimator-inputs">
                        <div className="est-input-group">
                            <div className="est-icon pick"></div>
                            <input
                                type="text"
                                placeholder="Pickup Location (e.g., Whitefield)"
                                value={pickup}
                                onChange={(e) => setPickup(e.target.value)}
                            />
                        </div>
                        <div className="est-connector"></div>
                        <div className="est-input-group">
                            <div className="est-icon dest"></div>
                            <input
                                type="text"
                                placeholder="Drop Destination (e.g., Indiranagar)"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary w-full find-btn"
                        onClick={handleEstimate}
                        disabled={estimating}
                    >
                        {estimating ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                        {estimating ? " Calculating..." : " Predict Route"}
                    </button>

                    {routeInfo && (
                        <div className="route-summary animate-slide-up">
                            <div className="route-stat">
                                <Navigation size={16} />
                                <span>{routeInfo.distance} km</span>
                            </div>
                            <div className="route-stat">
                                <Clock size={16} />
                                <span>{routeInfo.duration} mins</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="nearby-drivers mt-6">
                    <div className="section-header">
                        <h4>Available Drivers Nationwide</h4>
                        <span>{drivers.length} Online</span>
                    </div>
                    <div className="driver-list scroll-shadow">
                        {drivers.length > 0 ? drivers.map(d => (
                            <div key={d.id} className="driver-mini-card animate-slide-up" onClick={() => setSelectedDriver(d)}>
                                <div className="driver-avatar-sm">
                                    <TruckIcon size={20} />
                                </div>
                                <div className="driver-info">
                                    <h6>{d.name}</h6>
                                    <p>{d.truckType} • <StarIcon size={12} fill="gold" stroke="gold" /> {d.rating || "4.5"}</p>
                                </div>
                                <div className="driver-action">
                                    <div className="price-tag">₹{d.pricePerKm || 15}/km</div>
                                    <ChevronRight size={18} className="text-muted" />
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">
                                <ShieldCheck size={40} className="empty-icon" />
                                <p>No drivers online at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-right">
                <div className="map-container-wrapper card">
                    <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={location}>
                            <Popup>Your Location</Popup>
                        </Marker>

                        {drivers.map(d => (
                            <Marker key={d.id} position={[d.location.lat, d.location.lng]}>
                                <Popup>
                                    <strong>{d.name}</strong><br />
                                    {d.truckType}
                                </Popup>
                            </Marker>
                        ))}

                        {routeInfo?.geometry && (
                            <>
                                <Polyline
                                    positions={routeInfo.geometry.map(coord => [coord[1], coord[0]])}
                                    color="#0066FF"
                                    weight={5}
                                    opacity={0.8}
                                />
                                <RouteFitter coords={routeInfo.geometry.map(coord => [coord[1], coord[0]])} />
                            </>
                        )}

                        {!routeInfo && <MapMover coords={location} />}
                    </MapContainer>
                </div>
            </div>

            {selectedDriver && (
                <div className="modal-overlay">
                    <div className="booking-modal animate-slide-up">
                        <button className="close-btn" onClick={() => setSelectedDriver(null)}><X size={20} /></button>
                        <div className="modal-header">
                            <div className="driver-profile-lg">
                                <div className="driver-avatar-lg">
                                    <TruckIcon size={40} />
                                </div>
                                <div className="profile-details">
                                    <h3>{selectedDriver.name}</h3>
                                    <div className="rating-pill">
                                        <StarIcon size={14} fill="currentColor" />
                                        <span>{selectedDriver.rating || "4.8"} Rating</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="trip-summary-box">
                            <div className="summary-item">
                                <span>Vehicle</span>
                                <strong>{selectedDriver.truckType} • {selectedDriver.vehicleNumber}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Capacity</span>
                                <strong>{selectedDriver.capacity}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Price / km</span>
                                <strong>₹{selectedDriver.pricePerKm || 15}</strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => window.alert(`Calling ${selectedDriver.phone}...`)}>
                                <PhoneCall size={18} /> Call {selectedDriver.phone}
                            </button>
                            <button className="btn btn-primary" onClick={handleBookingRequest} disabled={isBooking}>
                                {isBooking ? "Requesting..." : "Request Booking"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component: Active Trips & History
const ActiveTrips = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    useEffect(() => {
        const q = query(collection(db, 'bookings'), where('customerId', '==', user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            const history = [];
            let unratedTripToPrompt = null;
            snapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                history.push(data);

                // Track if there's an unrated completed trip to auto-prompt
                if (data.status === 'Completed' && !data.customerRated) {
                    unratedTripToPrompt = data;
                }
            });
            // Sort by date descending
            history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTrips(history);
            setLoading(false);

            if (unratedTripToPrompt) {
                setRatingModal(prev => prev ? prev : unratedTripToPrompt);
            }
        });
        return () => unsub();
    }, [user.uid]);

    const submitRating = async () => {
        if (!ratingModal) return;
        try {
            const ratingId = `rating_c_${ratingModal.id}`;
            await setDoc(doc(db, 'ratings', ratingId), {
                tripId: ratingModal.tripId,
                targetUserId: ratingModal.driverId,
                fromUserId: user.uid,
                fromName: user.name || "Customer",
                score: ratingScore,
                comment: ratingComment,
                date: new Date().toISOString()
            });

            // Mark trip as rated by customer
            await updateDoc(doc(db, 'bookings', ratingModal.id), { customerRated: true });

            // Update driver's overall rating
            const driverRatingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', ratingModal.driverId));
            const snapshot = await getDocs(driverRatingsQ);
            let total = 0;
            snapshot.forEach(doc => total += Number(doc.data().score));
            const avg = snapshot.size > 0 ? (total / snapshot.size).toFixed(1) : ratingScore.toFixed(1);
            await updateDoc(doc(db, 'users', ratingModal.driverId), { rating: avg });

            setRatingModal(null);
            setRatingScore(5);
            setRatingComment("");
            window.alert("Thank you for your rating!");
        } catch (e) {
            console.error(e);
            window.alert("Failed to submit rating.");
        }
    };

    return (
        <div className="content-pad animate-slide-up">
            <h3 className="mb-4 text-xl font-bold">Your Trips</h3>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : trips.length === 0 ? (
                <div className="card p-8 text-center text-muted">You have no trip history.</div>
            ) : (
                <div className="grid gap-4">
                    {trips.map(trip => (
                        <div key={trip.id} className="card p-4 flex-row items-center justify-between">
                            <div>
                                <h5 className="font-bold text-lg">{trip.tripId}</h5>
                                <p className="text-muted">{trip.pickup} ➔ {trip.destination}</p>
                                <p className="text-sm mt-1">Driver: {trip.driverName} ({trip.driverPhone})</p>
                            </div>
                            <div className="text-right">
                                <span className={`status-badge ${trip.status === 'Completed' ? 'success' : trip.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                                    {trip.status}
                                </span>
                                <p className="font-bold mt-2">{trip.distance}km / {trip.duration}m</p>
                                <p className="text-sm text-muted mb-2">{new Date(trip.createdAt).toLocaleDateString()}</p>
                                {trip.status === 'Completed' && !trip.customerRated && (
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setRatingModal(trip)}>
                                        Rate Driver
                                    </button>
                                )}
                                {trip.customerRated && (
                                    <span className="text-xs text-green-600 font-medium flex items-center justify-end"><StarIcon size={12} className="mr-1" /> Rated</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ratingModal && (
                <div className="modal-overlay">
                    <div className="booking-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                        <button className="close-btn" onClick={() => setRatingModal(null)}><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Rate your trip</h3>
                        <p className="text-muted mb-4">How was your experience with {ratingModal.driverName}?</p>

                        <div className="flex flex-row justify-center items-center mb-6 gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <div
                                    key={star}
                                    onClick={() => setRatingScore(star)}
                                    className="cursor-pointer p-1 transition-transform hover:scale-110 flex-shrink-0"
                                >
                                    <StarIcon
                                        size={32}
                                        fill={star <= ratingScore ? "currentColor" : "none"}
                                        className={`pointer-events-none ${star <= ratingScore ? 'text-yellow-500' : 'text-gray-300'}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <textarea
                            className="w-full border rounded p-3 mb-4"
                            rows="3"
                            placeholder="Add a comment..."
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                        />

                        <button className="btn btn-primary w-full" onClick={submitRating}>
                            Submit Rating
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component: Ratings
const Ratings = ({ user }) => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'ratings'), where('targetUserId', '==', user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRatings(data);
            setLoading(false);
        });
        return () => unsub();
    }, [user.uid]);

    return (
        <div className="content-pad animate-slide-up">
            <h3 className="mb-4 text-xl font-bold">Ratings Received from Drivers</h3>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : ratings.length === 0 ? (
                <div className="card p-8 text-center text-muted">You have no ratings yet.</div>
            ) : (
                <div className="grid gap-4">
                    {ratings.map(r => (
                        <div key={r.id} className="card p-4">
                            <div className="flex justify-between items-center mb-2">
                                <strong>{r.fromName}</strong>
                                <span className="flex items-center text-yellow-500"><StarIcon size={16} fill="currentColor" className="mr-1" />{r.score}</span>
                            </div>
                            <p className="text-muted">{r.comment}</p>
                            <span className="text-xs text-light mt-2 block">{new Date(r.date).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main CustomerDashboard Router
const CustomerDashboard = ({ user }) => {
    return (
        <Routes>
            <Route path="find" element={<FindDrivers user={user} />} />
            <Route path="active" element={<ActiveTrips user={user} />} />
            <Route path="ratings" element={<Ratings user={user} />} />
            <Route path="*" element={<Navigate to="find" replace />} />
        </Routes>
    );
};

export default CustomerDashboard;
