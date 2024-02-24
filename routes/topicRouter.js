const express = require('express');
const router = express.Router();

const topicController = require('../controllers/topicController');

// TOPIC //

router.get('/', topicController.topics_get);

router.get('/:topicid', topicController.topic_get);

router.post('/', topicController.topic_post);

router.put('/:topicid', topicController.topic_put);

router.delete('/:topicid', topicController.topic_delete);

module.exports = router;
