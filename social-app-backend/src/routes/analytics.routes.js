const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// GET /api/analytics/creator - Get full creator metrics suite
router.get('/creator', verifyToken, analyticsController.getCreatorMetrics);

// GET /api/analytics/overview - Admin only dashboard metrics
router.get('/overview', verifyToken, authorizeRoles('admin'), analyticsController.getAdminOverview);

module.exports = router;
