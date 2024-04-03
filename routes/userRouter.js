const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.delete('/:userid', userController.user_delete);

module.exports = router;
