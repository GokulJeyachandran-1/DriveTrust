const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(verifyRole(['ADMIN']));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:id/kyc', adminController.getUserKyc);
router.put('/users/:id/kyc', adminController.updateKycStatus);
router.get('/trips', adminController.getTrips);
router.get('/sos', adminController.getSosAlerts);
router.put('/sos/:id/resolve', adminController.resolveSos);
router.get('/payments', adminController.getPayments);
router.put('/payments/:id/release', adminController.releasePayment);

module.exports = router;
