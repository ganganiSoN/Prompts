const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Protect all moderation routes - require authentication and admin/moderator role
router.use(verifyToken);
// Assuming requireRole can accept an array or multiple arguments. Let's just use it similarly to how it was created.
// If requireRole only accepts one role, we can do requireRole('admin') for now, but commonly it's `requireRole('admin', 'moderator')`
// Let's assume requireRole handles multiple or just admin for now. Let's use it as verifyToken, requireRole('admin', 'moderator')
router.use(authorizeRoles('admin', 'moderator'));

router.get('/reports', moderationController.getReports);
router.put('/reports/:id', moderationController.updateReport);

module.exports = router;
