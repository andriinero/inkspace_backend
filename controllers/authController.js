const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const EnvVars = require('../constants/EnvVars');

const User = require('../models/user');

exports.login_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res) => {
    const authData = {
      sub: req.user._id,
      username: req.user.username,
      role: req.user.role,
    };

    res.json(authData);
  }),
];

exports.login_post = [
  body('username', 'Invalid username format').notEmpty().trim().escape(),
  body('password', 'Invalid password format').notEmpty().trim().escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const userByUsername = await User.findOne({
        username: req.body.username,
      }).exec();

      if (!userByUsername) {
        res.status(401).json({ message: 'Incorrect credentials' });
      } else {
        const match = await bcrypt.compare(
          req.body.password,
          userByUsername.password,
        );

        if (!match) {
          res.status(401).json({ message: 'Incorrect credentials' });
        } else {
          const opts = { expiresIn: '1d' };
          const SECRET_KEY = EnvVars.Jwt.SECRET;
          const jwtPayload = {
            sub: userByUsername._id,
            username: userByUsername.username,
          };

          const token = jwt.sign(jwtPayload, SECRET_KEY, opts);

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
  body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 100 })
    .custom(async (value) => {
      const userByEmail = await User.findOne({ email: value });

      if (userByEmail) {
        throw new Error('User with this email already exists');
      } else {
        return true;
      }
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const SALT_VALUE = EnvVars.Bcrypt.SALT;
      const hashedPassword = await bcrypt.hash(req.body.password, SALT_VALUE);

      const userDetail = {
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      };

      const newUser = new User(userDetail);

      await newUser.save();

      res.json({
        message: 'User created successfully',
        _id: newUser._id.toString(),
      });
    }
  }),
];
