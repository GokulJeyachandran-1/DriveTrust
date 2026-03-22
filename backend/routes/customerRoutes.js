const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(verifyRole(['CUSTOMER']));

router.get('/loads', customerController.getMyLoads);
router.post('/loads', customerController.createLoad);
router.get('/loads/:id/bids', customerController.getBidsForLoad);
router.post('/loads/:id/book', customerController.acceptBidAndBook);

module.exports = router;
