import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getSocket = () => {
    const token = localStorage.getItem('access_token');
    return io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        autoConnect: false,
    });
};

const socket = getSocket();

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
    socket.emit('updateLocation', data);
};

export const subscribeToLocationUpdates = (callback) => {
    socket.on('locationUpdate', (data) => {
        callback(data);
    });
};

export default socket;
