const asyncHandler = require('express-async-handler');
const { body, param, validationResult } = require('express-validator');

const Post = require('../models/post');
const mongoose = require('mongoose');

exports.posts_get = asyncHandler(async (req, res, next) => {
  const allPosts = await Post.find({}).exec();

  res.json(allPosts);
});

exports.post_get = [
  param('postid')
    .trim()
    .custom(async (value) => {
      let valid = mongoose.Types.ObjectId.isValid(value);
      if (!valid) throw new Error('Post id must be valid');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json({ errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid);

      if (!post) {
        res.sendStatus(404);
      } else {
        res.json(post);
      }
    }
  }),
];

exports.post_post = [
  body('title', 'Title must have correct length')
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body('body', 'Post body must have correct length')
    .trim()
    .isLength({ min: 3, max: 500 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400);
      res.json({ errors: errors.array() });
    } else {
      const postDetail = {
        author: '65c20bf87454d893cab48638',
        title: req.body.title,
        body: req.body.body,
        date: new Date(),
      };

      const post = new Post(postDetail);

      const newPost = await post.save();

      res.json(newPost);
    }
  }),
];

exports.post_put = [
  param('postid')
    .trim()
    .custom(async (value) => {
      let valid = mongoose.Types.ObjectId.isValid(value);
      if (!valid) throw new Error('Post id must be valid');
    })
    .escape(),
  body('title', 'Title must have correct length')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body('body', 'Post body must have correct length')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json({ errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid).exec();

      if (!post) {
        res.sendStatus(404);
      } else {
        const newPost = {
          ...post,
          _id: req.params.id,
          title: req.body.title || post.title,
          body: req.body.body || post.body,
        };

        const updatedPost = await Post.findByIdAndUpdate(req.params.postid, newPost, {
          new: true,
        });
        res.json(updatedPost);
      }
    }
  }),
];

exports.post_delete = [
  param('postid')
    .trim()
    .custom(async (value) => {
      let valid = mongoose.Types.ObjectId.isValid(value);
      if (!valid) throw new Error('Post id must be valid');
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json({ errors: errors.array() });
    } else {
      const deletedPost = await Post.findByIdAndDelete(req.params.postid);

      if (!deletedPost) {
        res.sendStatus(404);
      } else {
        res.json(deletedPost);
      }
    }
  }),
];
