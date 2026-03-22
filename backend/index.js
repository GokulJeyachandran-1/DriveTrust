const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const sosRoutes = require('./routes/sosRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io for Live Tracking
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL],
    credentials: true,
  }
});
app.set('io', io);

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500 // Increased limit, rebooting server cleanses IPs
});
app.use('/api/', limiter);

// Built-in Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/users', userRoutes);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('joinTrip', (tripId) => {
    socket.join(tripId);
    console.log(`User joined trip room: ${tripId}`);
  });

  socket.on('updateLocation', (data) => {
    // Expected data: { tripId, lat, lng }
    io.to(data.tripId).emit('locationUpdate', {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});
