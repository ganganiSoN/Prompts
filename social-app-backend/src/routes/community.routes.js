const express = require('express');
const router = express.Router();
const {
    createCommunity,
    getCommunities,
    getCommunityById,
    toggleJoinCommunity
} = require('../controllers/community.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Routes
router.route('/')
    .post(verifyToken, createCommunity)
    .get(verifyToken, getCommunities);

router.route('/:id')
    .get(verifyToken, getCommunityById);

router.route('/:id/join')
    .post(verifyToken, toggleJoinCommunity);

module.exports = router;

