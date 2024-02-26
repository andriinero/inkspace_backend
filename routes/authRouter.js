const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.get('/login', authController.login_get);

router.post('/login', authController.login_post);

router.post('/sign-up', authController.signup_post);

module.exports = router;
