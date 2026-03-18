import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    Truck,
    User,
    Navigation,
    Zap,
    History,
    Star as StarIcon,
    Loader2,
    X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import './DriverDashboard.css';

const MapMover = ({ coords }) => {
    const map = useMap();
    useEffect(() => { if (coords) map.setView(coords, 14); }, [coords]);
    return null;
};

// Sub-component: Dashboard (Requests & Stats)
const DriverRequests = ({ user }) => {
    const [isOnline, setIsOnline] = useState(user?.isOnline || false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Mock active toggle state
        setIsOnline(user?.isOnline);

        const q = query(
            collection(db, 'bookings'),
            where('driverId', '==', user.uid),
            where('status', '==', 'Requested')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const reqs = [];
            snapshot.forEach(doc => reqs.push({ id: doc.id, ...doc.data() }));
            setRequests(reqs);
            setLoading(false);
        });
        return () => unsub();
    }, [user.uid, user?.isOnline]);
    const toggleOnline = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await updateDoc(doc(db, 'users', user.uid), { isOnline: newStatus });
        } catch (err) {
            console.error(err);
        }
    };
    const handleAccept = async (reqId) => {
        try {
            await updateDoc(doc(db, 'bookings', reqId), { status: 'Accepted' });
            // Should theoretically move to active trips now
        } catch (e) {
            console.error(e);
        }
    };
    const handleReject = async (reqId) => {
        try {
            await updateDoc(doc(db, 'bookings', reqId), { status: 'Cancelled' });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="driver-grid">
            <div className="driver-left">
                <div className="card status-card animate-slide-up">
                    <div className="status-header">
                        <div className="status-info">
                            <h3 className="card-title">Availability</h3>
                            <p className={isOnline ? "text-success" : "text-muted"}>
                                {isOnline ? "You are online and tracking" : "Go online to receive requests"}
                            </p>
                        </div>
                        <div className={`status-toggle ${isOnline ? 'active' : ''}`} onClick={toggleOnline}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                </div>

                <div className="stats-row mt-6">
                    <div className="card stat-mini-card animate-slide-up">
                        <div className="stat-icon earnings"><DollarSign size={20} /></div>
                        <div className="stat-data">
                            <span className="stat-label">Earnings</span>
                            <strong className="stat-value">₹4,250</strong>
                        </div>
                    </div>
                    <div className="card stat-mini-card animate-slide-up">
                        <div className="stat-icon" style={{ background: '#fefce8', color: '#eab308' }}><StarIcon size={20} className="fill-current" /></div>
                        <div className="stat-data">
                            <span className="stat-label">Driver Rating</span>
                            <strong className="stat-value">{user?.rating || '5.0'} / 5.0</strong>
                        </div>
                    </div>
                </div>

                <div className="booking-requests mt-6">
                    <div className="section-header">
                        <h4>Booking Requests</h4>
                        {requests.length > 0 && <span className="badge-pulsing">{requests.length} Active</span>}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" size={32} /></div>
                    ) : requests.length === 0 ? (
                        <div className="card text-center p-8 mt-4 text-muted animate-slide-up">
                            {isOnline ? "Listening for customer requests..." : "Go online to receive booking requests."}
                        </div>
                    ) : (
                        <div className="request-list">
                            {requests.map(req => (
                                <div key={req.id} className="request-card card animate-slide-up">
                                    <div className="req-header">
                                        <div className="customer-meta">
                                            <div className="avatar-sm"><User size={20} /></div>
                                            <div>
                                                <h6>{req.customerName}</h6>
                                                <p>Dist: {req.distance}km • {req.duration}m</p>
                                            </div>
                                        </div>
                                        <div className="req-earnings">₹{(req.distance * 15).toFixed(0)}</div>
                                    </div>
                                    <div className="req-route">
                                        <div className="route-stop">
                                            <div className="dot blue"></div>
                                            <span>{req.pickup}</span>
                                        </div>
                                        <div className="route-line"></div>
                                        <div className="route-stop">
                                            <div className="dot green"></div>
                                            <span>{req.destination}</span>
                                        </div>
                                    </div>
                                    <div className="req-actions">
                                        <button className="btn btn-outline-danger" onClick={() => handleReject(req.id)}>Reject</button>
                                        <button className="btn btn-secondary" onClick={() => handleAccept(req.id)}>Accept Trip</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="driver-right">
                <div className="map-view-card card">
                    <div className="card-header">
                        <Navigation size={20} className="text-secondary" />
                        <h3 className="card-title">Live Tracking Area</h3>
                    </div>
                    <div className="driver-map-container">
                        <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                            <Marker position={[12.9716, 77.5946]} />
                        </MapContainer>
                    </div>
                    <div className="map-overlay-banner">
                        {isOnline ? (
                            <div className="banner-content">
                                <span className="dot-pulsing"></span>
                                <strong>System active & visible to customers</strong>
                            </div>
                        ) : (
                            <div className="banner-content offline">
                                <strong>System Offline</strong>
                                <span>Switch toggle to start working</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component: All Trips
const DriverTrips = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState("");

    useEffect(() => {
        const q = query(collection(db, 'bookings'), where('driverId', '==', user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            const history = [];
            snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
            history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTrips(history);
            setLoading(false);
        });
        return () => unsub();
    }, [user.uid]);

    const submitRating = async () => {
        if (!ratingModal) return;
        try {
            const ratingId = `rating_d_${ratingModal.id}`;
            await setDoc(doc(db, 'ratings', ratingId), {
                tripId: ratingModal.tripId,
                targetUserId: ratingModal.customerId,
                fromUserId: user.uid,
                fromName: user.name || "Driver",
                score: ratingScore,
                comment: ratingComment,
                date: new Date().toISOString()
            });

            // Mark trip as rated by driver
            await updateDoc(doc(db, 'bookings', ratingModal.id), { driverRated: true });

            // Update customer's overall rating
            const customerRatingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', ratingModal.customerId));
            const snapshot = await getDocs(customerRatingsQ);
            let total = 0;
            snapshot.forEach(doc => total += Number(doc.data().score));
            const avg = snapshot.size > 0 ? (total / snapshot.size).toFixed(1) : ratingScore.toFixed(1);
            await updateDoc(doc(db, 'users', ratingModal.customerId), { rating: avg });

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
            <h3 className="mb-4 text-xl font-bold">Your Assigned Bookings</h3>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" size={32} /></div>
            ) : trips.length === 0 ? (
                <div className="card p-8 text-center text-muted">You have no trips in your history.</div>
            ) : (
                <div className="grid gap-4">
                    {trips.map(trip => (
                        <div key={trip.id} className="card p-4 flex-row items-center justify-between">
                            <div>
                                <h5 className="font-bold text-lg">{trip.tripId}</h5>
                                <p className="text-muted">{trip.pickup} ➔ {trip.destination}</p>
                                <p className="text-sm mt-1">Customer: {trip.customerName}</p>
                            </div>
                            <div className="text-right">
                                <span className={`status-badge ${trip.status === 'Completed' ? 'success' : trip.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                                    {trip.status}
                                </span>
                                <p className="font-bold mt-2">₹{(trip.distance * 15).toFixed(0)} • {trip.distance}km</p>
                                <p className="text-sm text-muted mb-2">{new Date(trip.createdAt).toLocaleDateString()}</p>
                                {trip.status === 'Completed' && !trip.driverRated && (
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setRatingModal(trip)}>
                                        Rate Customer
                                    </button>
                                )}
                                {trip.driverRated && (
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
                        <h3 className="text-xl font-bold mb-4">Rate Customer</h3>
                        <p className="text-muted mb-4">How was your experience with {ratingModal.customerName}?</p>

                        <div className="flex justify-center mb-6 gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button type="button" key={star} onClick={() => setRatingScore(star)} className="focus:outline-none" style={{ background: 'none', border: 'none', padding: 0 }}>
                                    <StarIcon
                                        size={32}
                                        className={`cursor-pointer ${star <= ratingScore ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                    />
                                </button>
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

// Sub-component: Active Trip View
const ActiveTrip = ({ user }) => {
    const [activeTrip, setActiveTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState("");

    useEffect(() => {
        const q = query(
            collection(db, 'bookings'),
            where('driverId', '==', user.uid),
            where('status', 'in', ['Accepted', 'In Progress'])
        );
        const unsub = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Just take the first active one for now
                setActiveTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                setActiveTrip(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [user.uid]);

    const handleComplete = async () => {
        if (!activeTrip) return;
        try {
            const completedTrip = activeTrip;
            await updateDoc(doc(db, 'bookings', completedTrip.id), { status: 'Completed' });
            window.alert("Trip marked as completed!");
            setRatingModal(completedTrip);
        } catch (e) {
            console.error(e);
        }
    };

    const submitRating = async () => {
        if (!ratingModal) return;
        try {
            const ratingId = `rating_d_${ratingModal.id}`;
            await setDoc(doc(db, 'ratings', ratingId), {
                tripId: ratingModal.tripId,
                targetUserId: ratingModal.customerId,
                fromUserId: user.uid,
                fromName: user.name || "Driver",
                score: ratingScore,
                comment: ratingComment,
                date: new Date().toISOString()
            });

            // Mark trip as rated by driver
            await updateDoc(doc(db, 'bookings', ratingModal.id), { driverRated: true });

            // Update customer's overall rating
            const customerRatingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', ratingModal.customerId));
            const snapshot = await getDocs(customerRatingsQ);
            let total = 0;
            snapshot.forEach(doc => total += Number(doc.data().score));
            const avg = snapshot.size > 0 ? (total / snapshot.size).toFixed(1) : ratingScore.toFixed(1);
            await updateDoc(doc(db, 'users', ratingModal.customerId), { rating: avg });

            setRatingModal(null);
            setRatingScore(5);
            setRatingComment("");
            window.alert("Thank you for your rating!");
        } catch (e) {
            console.error(e);
            window.alert("Failed to submit rating.");
        }
    };

    const handleStart = async () => {
        if (!activeTrip) return;
        try {
            await updateDoc(doc(db, 'bookings', activeTrip.id), { status: 'In Progress' });
        } catch (e) {
            console.error(e);
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" size={32} /></div>;

    if (!activeTrip && !ratingModal) {
        return (
            <div className="content-pad animate-slide-up text-center pt-20">
                <Truck size={64} className="mx-auto text-muted mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Active Trip</h3>
                <p className="text-muted">You do not have any trips currently in progress or accepted.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid animate-slide-up relative">
            {!activeTrip && ratingModal && (
                <div className="content-pad text-center pt-20 w-full col-span-2">
                    <Truck size={64} className="mx-auto text-muted mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">No Active Trip</h3>
                    <p className="text-muted">You do not have any trips currently in progress or accepted.</p>
                </div>
            )}

            {activeTrip && (
                <>
                    <div className="driver-left">
                        <div className="card">
                            <div className="card-header border-b pb-4 mb-4">
                                <Truck size={24} className="text-secondary" />
                                <h3 className="card-title text-xl">Current Mission</h3>
                                <span className={`status-badge ${activeTrip.status === 'In Progress' ? 'success' : 'warning'} ml-auto`}>
                                    {activeTrip.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h5 className="text-sm text-muted uppercase tracking-wider mb-2">Customer Details</h5>
                                <p className="font-bold text-lg">{activeTrip.customerName}</p>
                            </div>

                            <div className="req-route mb-8 bg-gray-50 p-4 rounded-lg">
                                <div className="route-stop">
                                    <div className="dot blue"></div>
                                    <span className="font-medium">{activeTrip.pickup}</span>
                                </div>
                                <div className="route-line" style={{ height: '30px' }}></div>
                                <div className="route-stop">
                                    <div className="dot green"></div>
                                    <span className="font-medium">{activeTrip.destination}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                    <span className="text-muted text-sm block mb-1">Distance</span>
                                    <span className="font-bold text-lg">{activeTrip.distance} km</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                    <span className="text-muted text-sm block mb-1">Estimated Fare</span>
                                    <span className="font-bold text-lg text-green-600">₹{(activeTrip.distance * 15).toFixed(0)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {activeTrip.status === 'Accepted' && (
                                    <button className="btn btn-secondary w-full" onClick={handleStart}>
                                        Start Trip
                                    </button>
                                )}
                                {activeTrip.status === 'In Progress' && (
                                    <button className="btn btn-primary w-full" onClick={handleComplete}>
                                        <CheckCircle size={18} /> Mark as Completed
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="driver-right">
                        <div className="map-view-card card" style={{ height: 'calc(100vh - 120px)' }}>
                            <MapContainer center={[12.9716, 77.5946]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[12.9716, 77.5946]}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </>
            )
            }

            {
                ratingModal && (
                    <div className="modal-overlay">
                        <div className="booking-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                            <button className="close-btn" onClick={() => setRatingModal(null)}><X size={20} /></button>
                            <h3 className="text-xl font-bold mb-4">Rate Customer</h3>
                            <p className="text-muted mb-4">How was your experience with {ratingModal.customerName}?</p>

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
                )
            }
        </div >
    );
};

// Ratings Sub-Component
const DriverRatings = ({ user }) => {
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
            <h3 className="mb-4 text-xl font-bold">Ratings Received</h3>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" size={32} /></div>
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

// Main DriverDashboard Router
const DriverDashboard = ({ user }) => {
    return (
        <Routes>
            <Route path="dashboard" element={<DriverRequests user={user} />} />
            <Route path="trips" element={<DriverTrips user={user} />} />
            <Route path="active" element={<ActiveTrip user={user} />} />
            <Route path="ratings" element={<DriverRatings user={user} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};

export default DriverDashboard;
