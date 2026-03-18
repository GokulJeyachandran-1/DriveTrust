import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Replace with production URL

const socket = io(SOCKET_URL, {
    autoConnect: false,
});

export const connectSocket = () => {
    if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};

export const joinTrip = (tripId) => {
    socket.emit('joinTrip', tripId);
};

export const updateDriverLocation = (data) => {
    // data: { tripId, lat, lng, speed }
    socket.emit('updateLocation', data);
};

export const sendBookingRequest = (data) => {
    socket.emit('bookingRequest', data);
};

export const subscribeToNotifications = (userId, callback) => {
    socket.on(`notification_${userId}`, (data) => {
        callback(data);
    });
};

export const subscribeToLocationUpdates = (callback) => {
    socket.on('locationUpdate', (data) => {
        callback(data);
    });
};

export default socket;
