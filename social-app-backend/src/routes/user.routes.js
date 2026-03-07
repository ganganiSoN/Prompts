const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// GET /api/users - Get all users (Admin only)
router.get('/', verifyToken, authorizeRoles('admin'), userController.getUsers);

// GET /api/users/profile - Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', verifyToken, userController.updateProfile);

// GET /api/users/suggestions - Get random user suggestions
router.get('/suggestions', verifyToken, userController.getSuggestions);

// GET /api/users/:id - Get a specific user (Admin only)
router.get('/:id', verifyToken, authorizeRoles('admin'), userController.getUserById);

// PUT /api/users/:id/role - Update a specific user's role (Admin only)
router.put('/:id/role', verifyToken, authorizeRoles('admin'), userController.updateUserRole);

// POST /api/users/:id/follow - Follow or unfollow a user
router.post('/:id/follow', verifyToken, userController.followUser);

// GET /api/users/:id/followers - Get list of users following this user
router.get('/:id/followers', verifyToken, userController.getFollowers);

// GET /api/users/:id/following - Get list of users this user is following
router.get('/:id/following', verifyToken, userController.getFollowing);

module.exports = router;

