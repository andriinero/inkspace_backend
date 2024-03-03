const asyncHandler = require('express-async-handler');
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../models/post');
const User = require('../models/user');

require('dotenv').config();

exports.profile_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {
    const userById = await User.findById(
      req.user._id,
      'username email role bio sign_up_date'
    ).exec();

    if (!userById) {
      res.sendStatus(404);
    } else {
      res.send(userById);
    }
  }),
];

exports.bio_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.bio_post = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.bio_put = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.bio_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.bookmarks_get = [
  passport.authenticate('jwt', { session: false }),
  query('limit', 'Limit query must have valid format')
    .default(+process.env.MAX_DOCS_PER_FETCH)
    .trim()
    .isInt()
    .customSanitizer((value) => {
      if (value < 0 || value > 20) {
        return 0;
      } else {
        return value;
      }
    })
    .escape(),
  query('page', 'Page query must have valid format')
    .default(1)
    .trim()
    .isInt()
    .customSanitizer(async (value) => {
      const docCount = await Post.countDocuments().exec();

      if (value < 0 || value > Math.ceil(docCount / process.env.MAX_DOCS_PER_FETCH)) {
        return 0;
      } else {
        return --value;
      }
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(400);
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'post_bookmarks')
        .populate({
          path: 'post_bookmarks',
          options: {
            select: '-body -comments',
            limit,
            skip: page * +process.env.MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        res.send(userById);
      }
    }
  }),
];

exports.bookmark_post = [
  passport.authenticate('jwt', { session: false }),
  body('postid', 'Bookmark id must be valid')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id);

      if (userById.post_bookmarks.some((objId) => objId.toString() === value))
        throw new Error('This bookmark already exists');
    }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.post_bookmarks.push(req.body.postid);
        await userById.save();

        res.send({ _id: req.body.postid });
      }
    }
  }),
];

exports.bookmark_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id);

      if (!userById.post_bookmarks.some((objId) => objId.toString() === value))
        throw new Error("This bookmark doesn't exist");
    }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        const index = userById.post_bookmarks.findIndex((id) => id === req.params.postid);
        const removedBookmark = userById.post_bookmarks.splice(index, 1);

        await userById.save();

        res.send({ _id: removedBookmark });
      }
    }
  }),
];

exports.ignored_posts_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.ignored_post_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.ignored_topics_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.ignored_topic_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.followed_users_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];

exports.followed_user_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {}),
];
