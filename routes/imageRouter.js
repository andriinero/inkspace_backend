const express = require('express');
const router = express.Router();

const imageController = require('../controllers/imageController');

router.get('/:', imageController.images_get);

router.get('/:pathname');

router.post('/', imageController.image_post);

router.put('/:pathname');

router.delete('/:pathname');

module.exports = router;
