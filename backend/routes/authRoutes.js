const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.uploadMiddleware, authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
