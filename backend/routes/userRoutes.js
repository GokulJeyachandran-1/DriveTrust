const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/:id/profile', userController.getUserProfile);

module.exports = router;
