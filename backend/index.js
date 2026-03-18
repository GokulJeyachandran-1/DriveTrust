const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// [IMPORTANT] Replace with your serviceAccountKey.json path
// const serviceAccount = require('./config/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Real-time tracking logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinTrip', (tripId) => {
        socket.join(tripId);
        console.log(`User joined trip: ${tripId}`);
    });

    socket.on('updateLocation', (data) => {
        // data: { tripId, lat, lng, speed, bearing }
        io.to(data.tripId).emit('locationUpdate', {
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            bearing: data.bearing
        });
    });

    socket.on('bookingRequest', (data) => {
        // data: { driverId, customerId, tripDetails }
        io.emit(`notification_${data.driverId}`, {
            type: 'BOOKING_REQUEST',
            ...data
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
