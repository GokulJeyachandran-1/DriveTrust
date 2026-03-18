import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCUNDXifqscU8oL8yjmjLUdymR3rra46x4",
    authDomain: "drivetrust-da1c7.firebaseapp.com",
    projectId: "drivetrust-da1c7",
    storageBucket: "drivetrust-da1c7.firebasestorage.app",
    messagingSenderId: "585518672711",
    appId: "1:585518672711:web:25d54fc3f31b08fa367a62",
    measurementId: "G-LGY1PE9MPX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const runSeed = async () => {
    console.log("Starting seeding...");

    const password = 'password123';
    const truckTypes = ['Mini Truck', 'Pickup Truck', 'Flatbed', 'Container', 'Box Truck'];
    const statuses = ['Requested', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

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
                createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', uid), data);
            customers.push(data);
            console.log(`Created Customer ${i}: ${email}`);
        } catch (e) {
            console.log(`Error Customer ${i}: ${e.message}`);
        }
    }

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
                createdAt: new Date().toISOString(),
                location: { lat: 12.9716 + (Math.random() - 0.5) * 0.1, lng: 77.5946 + (Math.random() - 0.5) * 0.1 }
            };
            await setDoc(doc(db, 'users', uid), data);
            drivers.push(data);
            console.log(`Created Driver ${i}: ${email}`);
        } catch (e) {
            console.log(`Error Driver ${i}: ${e.message}`);
        }
    }

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

            if (status === 'Completed') {
                await setDoc(doc(db, 'ratings', `rating_c_${tripId}`), {
                    tripId,
                    targetUserId: driver.uid,
                    fromUserId: customer.uid,
                    fromName: customer.name,
                    score: (Math.random() * 2 + 3).toFixed(1),
                    comment: 'Good service!',
                    date: new Date().toISOString()
                });
                await setDoc(doc(db, 'ratings', `rating_d_${tripId}`), {
                    tripId,
                    targetUserId: customer.uid,
                    fromUserId: driver.uid,
                    fromName: driver.name,
                    score: (Math.random() * 1 + 4).toFixed(1),
                    comment: 'Polite customer.',
                    date: new Date().toISOString()
                });
            }
        }
        console.log("Created 30 Trip records and associated ratings.");
    }
    console.log("Seeding finished successfully!");
    process.exit(0);
};

runSeed();
