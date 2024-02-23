const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.get('/login', authController.login_get);

router.post('/login', authController.login_post);

router.get('/sign-up', authController.singup_get);

router.post('/sign-up', authController.singup_post);

module.exports = router;
