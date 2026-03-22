const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(verifyRole(['DRIVER']));

router.get('/loads/open', driverController.getOpenLoads);
router.post('/loads/:id/bid', driverController.submitBid);

module.exports = router;
