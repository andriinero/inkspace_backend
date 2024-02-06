const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const Comment = require('../models/comment');
const Post = require('../models/post');

exports.comments_get = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.statusCode = 400;
      res.json({ errors: errors.array() });
    } else {
      const allCommentsByPost = await Comment.find({ post: req.params.postid }).exec();

      if (allCommentsByPost === undefined) {
        res.sendStatus(404);
      } else {
        console.log(allCommentsByPost);
        res.json(allCommentsByPost);
      }
    }
  }),
];

exports.comment_get = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  param('commentid', 'Comment id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.statusCode = 400;
      res.json({ errors: errors.array() });
    } else {
      const comment = await Comment.findOne({
        _id: req.params.commentid,
        post: req.params.postid,
      });

      if (!comment) {
        res.sendStatus(404);
      } else {
        res.json(comment);
      }
    }
  }),
];

exports.comment_post = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  body('email', 'Email must have correct format')
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body('title', 'Title must have correct length')
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body('body', 'Comment body must have correct length')
    .trim()
    .isLength({ min: 10, maxLength: 280 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.statusCode = 400;
      res.json({ errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid).exec();

      if (!post) {
        res.sendStatus(404);
      } else {
        const commentDetail = {
          post: req.params.postid,
          email: req.body.email,
          title: req.body.title,
          body: req.body.body,
          date: new Date(),
        };

        const newComment = new Comment(commentDetail);

        const savedComment = await newComment.save();

        await post.comments.push(savedComment);
        await post.save();

        res.json(savedComment);
      }
    }
  }),
];

exports.comment_put = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  param('commentid', 'Comment id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  body('email', 'Email must have correct format')
    .optional()
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 10 })
    .escape(),
  body('title', 'Title must have correct length')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body('body', 'Comment body must have correct length')
    .optional()
    .trim()
    .isLength({ min: 10, maxLength: 280 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.array()) {
      res.statusCode = 400;
      res.json({ errors: errors.array() });
    } else {
      const comment = await Comment.findOne({
        _id: req.params.commentid,
        post: req.params.postid,
      }).exec();

      if (!comment) {
        res.sendStatus(404);
      } else {
        const commentDetail = {
          ...Post,
          _id: req.params.commentid,
          email: req.body.email || comment.email,
          title: req.body.title || comment.title,
          body: req.body.body || comment.body,
        };

        const newComment = new Comment(commentDetail);

        const updatedComment = await Comment.findOneAndUpdate(
          {
            _id: req.params.commentid,
            post: req.params.postid,
          },
          newComment,
          { new: true }
        );

        res.json(updatedComment);
      }
    }
  }),
];

exports.comment_delete = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  param('commentid', 'Comment id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.statusCode = 400;
      res.json({ errors: errors.array() });
    } else {
      const comment = await Comment.findOne({
        _id: req.params.commentid,
        post: req.params.postid,
      }).exec();

      if (!comment) {
        res.sendStatus(404);
      } else {
        const deletedComment = await comment.deleteOne();
        res.json(deletedComment);
      }
    }
  }),
];
