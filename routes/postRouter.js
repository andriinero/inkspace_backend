const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// POSTS //

router.get('/', postController.posts_get);

router.get('/:postid', postController.post_get);

router.post('/', postController.post_post);

router.put('/:postid', postController.post_put);

router.delete('/:postid', postController.post_delete);

// COMMENTS //

router.get('/:postid/comments', commentController.comments_get);

router.get('/:postid/comments/:commentid', commentController.comment_get);

router.post('/:postid/comments', commentController.comment_post);

router.put('/:postid/comments/:commentid', commentController.comment_put);

router.delete('/:postid/comments/:commentid', commentController.comment_delete);

module.exports = router;
