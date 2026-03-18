import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Since we are using standard Firestore for now, we'll do a simple radius filter
// In production, one would use geofire-common or similar
export const findNearbyDrivers = async (customerCoords, radiusInKm = 10) => {
    const driversRef = collection(db, 'users');
    const q = query(
        driversRef,
        where('role', '==', 'Driver'),
        where('status', '==', 'Approved'),
        where('isOnline', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const drivers = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location) {
            const distance = calculateDistance(
                customerCoords[0], customerCoords[1],
                data.location.lat, data.location.lng
            );

            if (distance <= radiusInKm) {
                drivers.push({ id: doc.id, ...data, distance: distance.toFixed(1) });
            }
        }
    });

    return drivers.sort((a, b) => a.distance - b.distance);
};

// Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
