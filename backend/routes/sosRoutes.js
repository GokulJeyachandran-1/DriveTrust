const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.post('/raise', sosController.raiseSos);

module.exports = router;
