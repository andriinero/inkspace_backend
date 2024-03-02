const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');

router.get('/:commentid', commentController.comment_get);

router.put('/:commentid', commentController.comment_put);

router.delete('/:commentid', commentController.comment_delete);

module.exports = router;