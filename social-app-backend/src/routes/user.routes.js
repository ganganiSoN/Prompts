const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// GET /api/users - Get all users (Admin only)
router.get('/', verifyToken, authorizeRoles('admin'), userController.getUsers);

// POST /api/users/moderator - Create a new moderator (Admin only)
router.post('/moderator', verifyToken, authorizeRoles('admin'), userController.createModerator);

// GET /api/users/profile - Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', verifyToken, userController.updateProfile);

// GET /api/users/suggestions - Get random user suggestions
router.get('/suggestions', verifyToken, userController.getSuggestions);

// GET /api/users/:id - Get a specific user (Public to authenticated users)
router.get('/:id', verifyToken, userController.getUserById);

// PUT /api/users/:id/role - Update a specific user's role (Admin only)
router.put('/:id/role', verifyToken, authorizeRoles('admin'), userController.updateUserRole);

// POST /api/users/:id/follow - Follow or unfollow a user
router.post('/:id/follow', verifyToken, userController.followUser);

// GET /api/users/:id/followers - Get list of users following this user
router.get('/:id/followers', verifyToken, userController.getFollowers);

// GET /api/users/:id/following - Get list of users this user is following
router.get('/:id/following', verifyToken, userController.getFollowing);

// GET /api/users/:id/posts - Get all posts created by a user
router.get('/:id/posts', verifyToken, userController.getUserPosts);

// GET /api/users/:id/bookmarks - Get all posts bookmarked by a user
router.get('/:id/bookmarks', verifyToken, userController.getUserBookmarks);

module.exports = router;

