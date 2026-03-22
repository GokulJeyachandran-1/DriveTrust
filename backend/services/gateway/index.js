const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config({ path: '../../../.env' });

const app = express();
const server = http.createServer(app);

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const MAIN_SERVICE_URL = process.env.MAIN_SERVICE_URL || 'http://localhost:5002';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));

// JWT Verification Middleware for Proxy
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

// Proxy Routes
app.use('/api/auth', createProxyMiddleware({ 
    target: AUTH_SERVICE_URL, 
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' } 
}));

app.use('/api', authenticate, createProxyMiddleware({
    target: MAIN_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-role', req.user.role);
        }
    }
}));

// Socket.IO with Authentication
const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    socket.on('joinTrip', (tripId) => {
        // Here we could check if the user is authorized for this trip
        socket.join(tripId);
    });

    socket.on('updateLocation', (data) => {
        if (socket.user.role === 'DRIVER') {
            io.to(data.tripId).emit('locationUpdate', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.GATEWAY_PORT || 5000;
server.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
