const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const passport = require('passport');
const jwtStrategy = require('passport-jwt');

require('dotenv').config();

const User = require('../models/user');

exports.login_get = [];

exports.login_post = [
  body('username', 'Invalid username format').notEmpty().trim().escape(),
  body('password', 'Invalid password format').notEmpty().trim().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors.array());
    } else {
      const userByUsername = await User.findOne({ username: req.body.username }).exec();

      if (!userByUsername) {
        res.status(404).json({ message: 'Error: incorrect credentials.' });
      } else {
        const match = await bcrypt.compare(req.body.password, userByUsername.password);

        if (!match) {
          res.status(404).json({ message: 'Error: incorrect credentials.' });
        } else {
          const opts = { expiresIn: '120s' };
          const secret = process.env.SECRET_KEY;
          const jwtPayload = {
            username: userByUsername.username,
            email: userByUsername.email,
            role: userByUsername.role,
          };

          const token = jwt.sign(jwtPayload, secret, opts);

          res.json({ message: 'Login successful', token });
        }
      }
    }
  }),
];

exports.singup_get = [];

exports.singup_post = [];
