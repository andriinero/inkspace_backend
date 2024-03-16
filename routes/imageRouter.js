const express = require('express');
const router = express.Router();

const imageController = require('../controllers/imageController');

router.get('/');

router.get('/:imageid', imageController.image_get);

router.post('/', imageController.image_post);

router.put('/:imageid');

router.delete('/:imageid');

module.exports = router;
