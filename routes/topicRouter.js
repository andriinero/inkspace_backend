const express = require('express');
const router = express.Router();

const topicController = require('../controllers/topicController');

// TOPIC //

router.get('/', topicController.topics_get);

module.exports = router;
