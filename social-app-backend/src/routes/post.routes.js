const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
// We need to import the authentication middleware to protect routes
// I'll assume it exists based on earlier conversations ('/api/auth')
// Attempting to require from middlewares/auth.middleware.js, but if it's missing, we need to create/find it.
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, postController.createPost);
router.get('/', verifyToken, postController.getFeed);
router.get('/drafts', verifyToken, postController.getDrafts);
router.get('/explore', verifyToken, postController.getExplore);
router.post('/:id/engage', verifyToken, postController.engage);
router.post('/:id/repost', verifyToken, postController.repostPost);
router.post('/:id/vote', verifyToken, postController.votePoll);
router.post('/:id/report', verifyToken, postController.reportPost);
router.get('/:id/comments', postController.getComments);
router.delete('/:id', verifyToken, postController.deletePost);
router.put('/:id', verifyToken, postController.updatePost);

module.exports = router;
