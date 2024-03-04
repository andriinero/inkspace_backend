const mongoose = require('mongoose');
const { param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const passport = require('passport');

const Post = require('../models/post');

exports.likes_get = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const postById = await Post.findById(req.params.postid, 'like_count').exec();

      if (!postById) {
        res.sendStatus(404);
      } else {
        res.json(postById);
      }
    }
  }),
];

exports.likes_put = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const postById = await Post.findById(req.params.postid, 'like_count').exec();

      if (!postById) {
        res.sendStatus(404);
      } else {
        postById.like_count += 1;
        await postById.save();

        res.json(postById);
      }
    }
  }),
];
