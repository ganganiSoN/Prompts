const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/users/profile - Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', verifyToken, userController.updateProfile);

module.exports = router;

