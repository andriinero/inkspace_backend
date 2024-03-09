const express = require('express');
const router = express.Router();

const authorController = require('../controllers/authorController');

// USER //

router.get('/', authorController.authors_get);

router.get('/:userid', authorController.author_get);

module.exports = router;
