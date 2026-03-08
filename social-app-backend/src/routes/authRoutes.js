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

// Protected account management routes
const { verifyToken } = require('../middleware/auth.middleware');
router.put('/change-password', verifyToken, authController.changePassword);
router.post('/mfa/setup', verifyToken, authController.setupMfa);
router.post('/mfa/enable', verifyToken, authController.enableMfa);
router.post('/mfa/disable', verifyToken, authController.disableMfa);

// OAuth specific routes
router.post('/google', authController.googleAuth);
router.post('/github', authController.githubAuth);

module.exports = router;
