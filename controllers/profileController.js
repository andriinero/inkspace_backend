const asyncHandler = require('express-async-handler');
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const passport = require('passport');

const User = require('../models/user');
const Post = require('../models/post');
const Topic = require('../models/topic');

require('dotenv').config();

exports.profile_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {
    const userById = await User.findById(req.user._id, '-password -__v').exec();

    if (!userById) {
      res.sendStatus(404);
    } else {
      res.send(userById);
    }
  }),
];

exports.bio_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {
    const userById = await User.findById(req.user._id, 'bio').exec();

    if (!userById) {
      res.sendStatus(404);
    } else {
      res.send(userById);
    }
  }),
];

exports.bio_post = [
  passport.authenticate('jwt', { session: false }),
  body('biobody')
    .trim()
    .isLength({ max: 280 })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById && userById.bio) throw new Error('User bio already exists');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id, 'bio').exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.bio = req.body.biobody;
        await userById.save();

        res.send(userById);
      }
    }
  }),
];

exports.bio_put = [
  passport.authenticate('jwt', { session: false }),
  body('biobody').trim().isLength({ max: 280 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id, 'bio').exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.bio = req.body.biobody;
        await userById.save();

        res.send(userById);
      }
    }
  }),
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
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById.post_bookmarks.some((objId) => objId.toString() === value))
        throw new Error('This bookmark already exists');
    })
    .escape(),
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
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id);

      if (!userById.post_bookmarks.some((objId) => objId.toString() === value))
        throw new Error("This bookmark doesn't exist");
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        const index = userById.post_bookmarks.findIndex(
          (p) => p._id.toString() === req.params.postid
        );
        const removedBookmark = userById.post_bookmarks.splice(index, 1)[0];

        await userById.save();

        res.send({ _id: removedBookmark });
      }
    }
  }),
];

exports.ignored_posts_get = [
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

      const userById = await User.findById(req.user._id, 'ignored_posts')
        .populate({
          path: 'ignored_posts',
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

exports.ignored_post_post = [
  passport.authenticate('jwt', { session: false }),
  body('postid', 'Post id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById.ignored_posts.some((objId) => objId.toString() === value))
        throw new Error('This post is already ignored');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.ignored_posts.push(req.body.postid);
        await userById.save();

        res.send({ _id: req.body.postid });
      }
    }
  }),
];

exports.ignored_post_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const postById = await Post.findById(value).exec();

      if (!postById) throw new Error("Post with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (!userById.ignored_posts.some((objId) => objId.toString() === value))
        throw new Error("This ignored post doesn't exist");
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        const index = userById.ignored_posts.findIndex((id) => id === req.params.postid);
        const removedIgnoredPost = userById.ignored_posts.splice(index, 1);

        await userById.save();

        res.send({ _id: removedIgnoredPost });
      }
    }
  }),
];

exports.ignored_topics_get = [
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

      const userById = await User.findById(req.user._id, 'ignored_topics')
        .populate({
          path: 'ignored_topics',
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

exports.ignored_topic_post = [
  passport.authenticate('jwt', { session: false }),
  body('topicid', 'Topic id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const topicById = await Topic.findById(value).exec();

      if (!topicById) throw new Error("Topic with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById.ignored_topics.some((objId) => objId.toString() === value))
        throw new Error('This topic is already ignored');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.ignored_topics.push(req.body.topicid);
        await userById.save();

        res.send({ _id: req.body.topicid });
      }
    }
  }),
];

exports.ignored_topic_delete = [
  passport.authenticate('jwt', { session: false }),
  param('topicid', 'Topic id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const topicById = await Topic.findById(value).exec();

      if (!topicById) throw new Error("Topic with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (!userById.ignored_topics.some((objId) => objId.toString() === value))
        throw new Error("This ignored topic doesn't exist");
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        const index = userById.ignored_topics.findIndex((id) => id === req.params.postid);
        const removedIgnoredTopic = userById.ignored_topics.splice(index, 1);

        await userById.save();

        res.send({ _id: removedIgnoredTopic });
      }
    }
  }),
];

exports.followed_users_get = [
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

      const userById = await User.findById(req.user._id, 'followed_users')
        .populate({
          path: 'followed_users',
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

exports.followed_user_post = [
  passport.authenticate('jwt', { session: false }),
  body('userid', 'User id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const userById = await User.findById(value).exec();

      if (!userById) throw new Error("User with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById.followed_users.some((objId) => objId.toString() === value))
        throw new Error('User with this id is already followed');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        userById.followed_users.push(req.body.userid);
        await userById.save();

        res.send({ _id: req.body.userid });
      }
    }
  }),
];

exports.followed_user_delete = [
  passport.authenticate('jwt', { session: false }),
  param('userid', 'User id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .custom(async (value) => {
      const userById = await User.findById(value).exec();

      if (!userById) throw new Error("User with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (!userById.followed_users.some((objId) => objId.toString() === value))
        throw new Error("This followed user doesn't exist");
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        const index = userById.followed_users.findIndex((id) => id === req.params.postid);
        const removedFollowedUser = userById.followed_users.splice(index, 1);

        await userById.save();

        res.send({ _id: removedFollowedUser });
      }
    }
  }),
];
