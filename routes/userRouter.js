const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// USER //

router.get('/', userController.users_get);

module.exports = router;
