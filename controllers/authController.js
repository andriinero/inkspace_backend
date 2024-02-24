const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const passport = require('passport');
const jwtStrategy = require('passport-jwt');

require('dotenv').config();

const User = require('../models/user');

exports.login_get = [asyncHandler(async (req, res, next) => {})];

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
          const opts = { expiresIn: '1d' };
          const secret = process.env.SECRET_KEY;
          const jwtPayload = {
            sub: userByUsername._id,
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

exports.signup_post = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .custom(async (value) => {
      const userByUsername = await User.findOne({ username: value });

      if (userByUsername) {
        throw new Error('User with this name already exists');
      } else {
        return true;
      }
    })
    .escape(),
  body('password').trim().isLength({ min: 8 }).escape(),
  body('passwordConfirmation')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      } else {
        return true;
      }
    })
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .custom(async (value) => {
      const userByEmail = await User.findOne({ email: value });

      if (userByEmail) {
        throw new Error('User with this email already exists');
      } else {
        return true;
      }
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const salt = +process.env.SALT_VALUE;
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const userDetail = {
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      };

      const user = new User(userDetail);

      const newUser = await user.save();

      res.sendStatus(200);
    }
  }),
];
