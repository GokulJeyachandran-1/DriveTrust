const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.post('/', reviewController.createReview);

module.exports = router;
