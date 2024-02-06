const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');

router.get('/', postController.posts_get);

router.get('/:postid', postController.post_get);

router.post('/', postController.post_post);

router.put('/:postid', postController.post_put);

router.delete('/:postid', postController.post_delete);


module.exports = router;
