import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const SeedData = () => {
    const [status, setStatus] = useState('Idle');
    const [logs, setLogs] = useState([]);

    const log = (msg) => setLogs(prev => [...prev, msg]);

    const runSeed = async () => {
        setStatus('Running...');
        log("Starting seeding...");

        const password = 'password123';

        // Data Arrays
        const truckTypes = ['Mini Truck', 'Pickup Truck', 'Flatbed', 'Container', 'Box Truck'];
        const statuses = ['Requested', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

        // Create Customers
        const customers = [];
        for (let i = 1; i <= 10; i++) {
            const email = `customer${i}@drivetrust.com`;
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const uid = cred.user.uid;
                const data = {
                    uid,
                    name: `Customer ${i}`,
                    email,
                    phone: `98765000${i.toString().padStart(2, '0')}`,
                    role: 'Customer',
                    rating: '5.0',
                    createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', uid), data);
                customers.push(data);
                log(`Created Customer ${i}`);
            } catch (e) {
                log(`Error creating Customer ${i}: ${e.message}`);
                // If exists, try to get UID if possible, but for seeding we assume fresh or error is fine
            }
        }

        // Create Drivers
        const drivers = [];
        for (let i = 1; i <= 10; i++) {
            const email = `driver${i}@drivetrust.com`;
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const uid = cred.user.uid;
                const data = {
                    uid,
                    name: `Driver ${i}`,
                    email,
                    phone: `88765000${i.toString().padStart(2, '0')}`,
                    role: 'Driver',
                    vehicleNumber: `KA-01-DT-${1000 + i}`,
                    truckType: truckTypes[i % truckTypes.length],
                    capacity: `${(i % 5) + 1} Tons`,
                    isOnline: true,
                    status: 'Verified',
                    rating: '5.0',
                    createdAt: new Date().toISOString(),
                    location: { lat: 12.9716 + (Math.random() - 0.5) * 0.1, lng: 77.5946 + (Math.random() - 0.5) * 0.1 }
                };
                await setDoc(doc(db, 'users', uid), data);
                drivers.push(data);
                log(`Created Driver ${i}`);
            } catch (e) {
                log(`Error creating Driver ${i}: ${e.message}`);
            }
        }

        // Create Trips (Mock History)
        if (customers.length > 0 && drivers.length > 0) {
            for (let i = 1; i <= 30; i++) {
                const customer = customers[i % customers.length];
                const driver = drivers[i % drivers.length];
                const tripId = `trip_${Date.now()}_${i}`;
                const status = statuses[i % statuses.length];

                await setDoc(doc(db, 'bookings', tripId), {
                    tripId,
                    customerId: customer.uid,
                    customerName: customer.name,
                    driverId: driver.uid,
                    driverName: driver.name,
                    driverPhone: driver.phone,
                    pickup: 'Location A',
                    destination: 'Location B',
                    distance: (Math.random() * 20 + 5).toFixed(1),
                    duration: (Math.random() * 60 + 20).toFixed(0),
                    status,
                    paymentStatus: i % 3 === 0 ? 'Pending' : 'Paid',
                    createdAt: new Date().toISOString()
                });

                // Add Ratings for completed trips
                if (status === 'Completed') {
                    await setDoc(doc(db, 'ratings', `rating_c_${tripId}`), {
                        tripId,
                        targetUserId: driver.uid, // Customer rating the driver
                        fromUserId: customer.uid,
                        fromName: customer.name,
                        score: (Math.random() * 2 + 3).toFixed(1),
                        comment: 'Good service!',
                        date: new Date().toISOString()
                    });
                    await setDoc(doc(db, 'ratings', `rating_d_${tripId}`), {
                        tripId,
                        targetUserId: customer.uid, // Driver rating the customer
                        fromUserId: driver.uid,
                        fromName: driver.name,
                        score: (Math.random() * 1 + 4).toFixed(1),
                        comment: 'Polite customer.',
                        date: new Date().toISOString()
                    });
                }
            }
            log("Created 30 Trip records and associated ratings.");
        }

        setStatus('Completed');
        log("Seeding finished successfully!");
        await signOut(auth);
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
            <h1>Seed Database</h1>
            <p>Status: {status}</p>
            <button
                onClick={runSeed}
                disabled={status === 'Running...'}
                style={{ padding: '0.5rem 1rem', background: '#0066FF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Start Seeding (20 Users + 30 Trips)
            </button>
            <div style={{ marginTop: '2rem', background: '#f4f4f4', padding: '1rem', height: '300px', overflowY: 'auto' }}>
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};

export default SeedData;
