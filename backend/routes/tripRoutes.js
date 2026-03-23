const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', tripController.getUserTrips);
router.put('/:id/status', tripController.updateTripStatus);
router.put('/:id/confirm-delivery', tripController.confirmDelivery);
router.post('/:id/damage-deduction', tripController.submitDamageDeduction);

module.exports = router;
