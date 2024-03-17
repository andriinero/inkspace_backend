const { param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const passport = require('passport');

const Post = require('../models/post');
const { isDbIdValid } = require('../utils/validation');

exports.likes_get = [
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
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
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
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
