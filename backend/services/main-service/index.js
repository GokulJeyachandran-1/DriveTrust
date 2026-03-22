const express = require('express');
const prisma = require('../../common/prisma');
require('dotenv').config({ path: '../../../.env' });

const app = express();
app.use(express.json());

// Helper middleware to extract user info from headers (passed by Gateway)
const extractUser = (req, res, next) => {
    req.userId = req.headers['x-user-id'];
    req.userRole = req.headers['x-user-role'];
    if (!req.userId) return res.status(401).json({ error: 'Missing user context' });
    next();
};

app.use(extractUser);

// --- Customer Routes ---

app.get('/api/customer/loads', async (req, res) => {
    try {
        const loads = await prisma.loadPost.findMany({
            where: { customerId: req.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(loads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/customer/loads', async (req, res) => {
    try {
        const { origin, destination, requiredVehicle, estimatedWeightKg } = req.body;
        const weight = parseFloat(estimatedWeightKg);
        if (!origin || !destination || !requiredVehicle || isNaN(weight)) {
            return res.status(400).json({ error: 'Valid fields are required' });
        }

        const loadPost = await prisma.loadPost.create({
            data: { customerId: req.userId, origin, destination, requiredVehicle, estimatedWeightKg: weight }
        });
        res.status(201).json(loadPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/customer/loads/:id/bids', async (req, res) => {
    try {
        const { id: postId } = req.params;
        const bids = await prisma.bid.findMany({
            where: { postId, post: { customerId: req.userId } },
            include: { driver: { select: { name: true, isKycVerified: true } } }
        });
        res.json(bids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/customer/loads/:id/book', async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { bidId } = req.body;

        const load = await prisma.loadPost.findUnique({ where: { id: postId } });
        if (!load || load.customerId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

        const bid = await prisma.bid.findUnique({ where: { id: bidId } });
        if (!bid || bid.postId !== postId) return res.status(400).json({ error: 'Invalid bid' });

        // Atomic transaction: update load status and create trip
        const [updatedLoad, trip] = await prisma.$transaction([
            prisma.loadPost.update({
                where: { id: postId },
                data: { status: 'BOOKED' }
            }),
            prisma.trip.create({
                data: {
                    postId,
                    driverId: bid.driverId,
                    currentLocation: load.origin,
                    status: 'PENDING'
                }
            })
        ]);

        res.json({ message: 'Load booked successfully', trip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/driver/loads/open', async (req, res) => {
    try {
        const loads = await prisma.loadPost.findMany({
            where: { status: 'OPEN' },
            include: { customer: { select: { name: true, isKycVerified: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(loads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/driver/loads/:id/bid', async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { amount, message } = req.body;
        const bidAmount = parseFloat(amount);
        if (isNaN(bidAmount)) return res.status(400).json({ error: 'Valid bid amount is required' });

        const loadPost = await prisma.loadPost.findUnique({ where: { id: postId } });
        if (!loadPost || loadPost.status !== 'OPEN') return res.status(400).json({ error: 'Load not available' });

        const bid = await prisma.bid.create({
            data: { postId, driverId: req.userId, amount: bidAmount, message: message || null }
        });
        res.status(201).json(bid);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/trips', async (req, res) => {
    try {
        const isCustomer = req.userRole === 'CUSTOMER';
        const trips = await prisma.trip.findMany({
            where: isCustomer ? { post: { customerId: req.userId } } : { driverId: req.userId },
            include: { post: { include: { customer: { select: { id: true, name: true } } } }, driver: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(trips);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/api/trips/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['IN_TRANSIT', 'DELIVERED'];
        
        if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const trip = await prisma.trip.findUnique({ where: { id } });
        if (!trip || trip.driverId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

        const updatedTrip = await prisma.trip.update({
            where: { id },
            data: { 
                status,
                completedAt: status === 'DELIVERED' ? new Date() : null
            }
        });

        // Update the load status as well
        await prisma.loadPost.update({
            where: { id: trip.postId },
            data: { status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT' }
        });

        res.json(updatedTrip);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.MAIN_PORT || 5002;
app.listen(PORT, () => {
    console.log(`Main Service running on port ${PORT}`);
});
