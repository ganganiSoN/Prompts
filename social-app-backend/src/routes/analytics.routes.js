const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/analytics/creator - Get full creator metrics suite
router.get('/creator', verifyToken, analyticsController.getCreatorMetrics);

module.exports = router;
