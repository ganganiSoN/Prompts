const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard Auth
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Verification Steps
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-mfa', authController.verifyMfa);

module.exports = router;
