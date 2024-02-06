const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');

router.get('/posts', postController.posts_get);

router.get('/posts/:postid', postController.post_get);

router.post('/posts', postController.post_post);

router.put('/posts/:postid', postController.post_put);

router.delete('/posts/:postid', postController.post_delete);


module.exports = router;
