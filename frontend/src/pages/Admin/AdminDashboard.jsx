import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Users, History, CheckCircle, XCircle, Trash2, Eye, Truck, Loader2, Filter } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';

// Sub-component: Drivers Management
const AdminDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'Driver'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            // Put pending first
            data.sort((a, b) => (a.status === 'Pending Verification' ? -1 : 1));
            setDrivers(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleVerify = async (id) => {
        try {
            await updateDoc(doc(db, 'users', id), { status: 'Verified' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this driver?")) return;
        try {
            await deleteDoc(doc(db, 'users', id));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="content-pad animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Driver Management</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Total: {drivers.length}</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                            <th className="p-4 font-medium">Driver</th>
                            <th className="p-4 font-medium">Contact</th>
                            <th className="p-4 font-medium">Vehicle info</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(d => (
                            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full text-gray-500"><Truck size={18} /></div>
                                        <div>
                                            <p className="font-bold">{d.name}</p>
                                            <p className="text-xs text-gray-500">ID: {d.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm">{d.email}</p>
                                    <p className="text-sm text-gray-500">{d.phone}</p>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm font-medium">{d.truckType}</p>
                                    <p className="text-xs text-gray-500">{d.vehicleNumber} • {d.capacity}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                            d.status === 'Pending Verification' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {d.status || "Pending Verification"}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {d.status !== 'Verified' && (
                                            <button onClick={() => handleVerify(d.id)} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" title="Verify Driver">
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        <button className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" title="View Profile">
                                            <Eye size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(d.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Delete Driver">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {drivers.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">No driver records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Sub-component: All Trips View
const AdminTrips = () => {
    const [trips, setTrips] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'bookings'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTrips(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filteredTrips = trips.filter(t => {
        if (filter === 'All') return true;
        if (filter === 'Active') return ['Requested', 'Accepted', 'In Progress'].includes(t.status);
        if (filter === 'Completed') return t.status === 'Completed';
        if (filter === 'Cancelled') return t.status === 'Cancelled';
        return true;
    });

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="content-pad animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Platform Trips</h3>

                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                    {['All', 'Active', 'Completed', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredTrips.map(trip => (
                    <div key={trip.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-bold text-lg text-gray-900">{trip.tripId}</h5>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${trip.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        trip.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {trip.status}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs border ${trip.paymentStatus === 'Paid' ? 'border-green-200 text-green-700' : 'border-yellow-200 text-yellow-700'
                                    }`}>
                                    {trip.paymentStatus}
                                </span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-gray-600">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Route</p>
                                    <p>{trip.pickup} ➔ {trip.destination}</p>
                                    <p className="text-xs text-gray-500 mt-1">{trip.distance}km • {trip.duration}m</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Customer</p>
                                    <p>{trip.customerName}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Driver</p>
                                    <p>{trip.driverName || "Unassigned"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right whitespace-nowrap pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 w-full md:w-auto">
                            <p className="text-2xl font-bold text-gray-900">₹{(trip.distance * 15).toFixed(0)}</p>
                            <p className="text-xs text-gray-500">{new Date(trip.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}

                {filteredTrips.length === 0 && (
                    <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
                        <History size={48} className="mx-auto text-gray-300 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900">No trips found</h4>
                        <p className="text-gray-500">There are no trips matching the '{filter}' filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Main AdminDashboard Router
const AdminDashboard = ({ user }) => {
    return (
        <Routes>
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="trips" element={<AdminTrips />} />
            <Route path="*" element={<Navigate to="drivers" replace />} />
        </Routes>
    );
};

export default AdminDashboard;
