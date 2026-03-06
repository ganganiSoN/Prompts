const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
// We need to import the authentication middleware to protect routes
// I'll assume it exists based on earlier conversations ('/api/auth')
// Attempting to require from middlewares/auth.middleware.js, but if it's missing, we need to create/find it.
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, postController.createPost);
router.get('/', verifyToken, postController.getFeed);
router.post('/:id/engage', verifyToken, postController.engage);
router.get('/:id/comments', postController.getComments);

module.exports = router;
