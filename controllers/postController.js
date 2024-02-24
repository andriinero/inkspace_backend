const asyncHandler = require('express-async-handler');
const { body, param, query, validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');
const Topic = require('../models/topic');

const mongoose = require('mongoose');
const passport = require('passport');

require('dotenv').config();

exports.posts_get = [
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors.array());
    } else {
      const { page, limit } = req.query;

      const allPosts = await Post.find({})
        .skip(page * +process.env.MAX_DOCS_PER_FETCH)
        .limit(limit)
        .populate('author', 'username email')
        .populate('topic', 'name')
        .sort({ date: -1 })
        .exec();

      res.json(allPosts);
    }
  }),
];

exports.post_get = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid)
        .populate('author', 'username email')
        .populate('topic', 'name')
        .exec();

      if (!post) {
        res.sendStatus(404);
      } else {
        res.json(post);
      }
    }
  }),
];

exports.post_post = [
  passport.authenticate('jwt', { session: false }),
  body('title', 'Title must have correct length').trim().isLength({ min: 3, max: 100 }),
  body('body', 'Post body must have correct length')
    .trim()
    .isLength({ min: 100, max: 10000 }),
  body('topic', 'Topic must be valid')
    .trim()
    .custom(async (value) => {
      const isValid = mongoose.Types.ObjectId.isValid(value);

      if (!isValid) {
        throw new Error('Invalid topic id');
      } else {
        const topic = await Topic.findOne({ _id: value }).exec();

        if (!topic) throw new Error('Invalid topic');
      }
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const user = req.user;

      const postDetail = {
        author: user._id,
        title: req.body.title,
        body: req.body.body,
        topic: req.body.topic,
        date: new Date(),
      };

      const newPost = new Post(postDetail);
      const savedPost = await newPost.save();

      user.user_posts.push(savedPost);
      await user.save();

      res.json(savedPost);
    }
  }),
];

exports.post_put = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  body('title', 'Title must have correct length')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }),
  body('body', 'Post body must have correct length')
    .optional()
    .trim()
    .isLength({ min: 100, max: 10000 }),
  body('topic', 'Topic must be valid')
    .optional()
    .trim()
    .custom(async (value) => {
      const isValid = mongoose.Types.ObjectId.isValid(value);

      if (!isValid) {
        throw new Error('Invalid topic id');
      } else {
        const topic = await Topic.findOne({ _id: value }).exec();

        if (!topic) throw new Error('Invalid topic');
      }
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const postById = await Post.findById(req.params.postid).exec();

      if (!postById) {
        res.sendStatus(404);
      } else {
        if (!postById.author._id.equals(req.user._id)) {
          res.sendStatus(403);
        } else {
          const postDetail = {
            title: req.body.title,
            body: req.body.body,
            topic: req.body.topic,
          };

          const updatedPost = await Post.findByIdAndUpdate(
            req.params.postid,
            postDetail,
            { new: true, runValidators: true }
          );

          if (!updatedPost) {
            res.sendStatus(404);
          } else {
            res.json(updatedPost);
          }
        }
      }
    }
  }),
];

exports.post_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const postById = await Post.findById(req.params.postid).exec();

      if (!postById) {
        res.sendStatus(404);
      } else {
        if (!postById.author._id.equals(req.user._id)) {
          res.sendStatus(403);
        } else {
          const deletedPost = await postById.deleteOne();

          res.json(deletedPost);
        }
      }
    }
  }),
];
