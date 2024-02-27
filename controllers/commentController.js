const { body, param, query, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const passport = require('passport');

const Comment = require('../models/comment');
const Post = require('../models/post');

require('dotenv').config();

// TODO: comment edit date stamp
exports.comments_get = [
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
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
    .customSanitizer(async (value, { req }) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        throw new Error('An error has occurred during sanitization');
      } else {
        const docCount = await Comment.countDocuments({ post: req.params.postid }).exec();

        if (value < 0 || value > Math.ceil(docCount / process.env.MAX_DOCS_PER_FETCH)) {
          return 0;
        } else {
          return --value;
        }
      }
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const allCommentsByPost = await Comment.find({ post: req.params.postid })
        .skip(page * process.env.MAX_DOCS_PER_FETCH)
        .limit(limit)
        .populate('authors')
        .exec();

      if (allCommentsByPost === undefined) {
        res.sendStatus(404);
      } else {
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const comment = await Comment.findOne({
        _id: req.params.commentid,
        post: req.params.postid,
      })
        .populate('author')
        .exec();

      if (!comment) {
        res.sendStatus(404);
      } else {
        res.json(comment);
      }
    }
  }),
];

exports.comment_post = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .escape(),
  body('title', 'Title must have correct length').trim().isLength({ min: 3, max: 100 }),
  body('body', 'Comment body must have correct length')
    .trim()
    .isLength({ min: 10, maxLength: 280 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid).exec();

      if (!post) {
        res.sendStatus(404);
      } else {
        const commentDetail = {
          author: req.user._id,
          post: req.params.postid,
          title: req.body.title,
          body: req.body.body,
          date: new Date(),
        };

        const newComment = new Comment(commentDetail);
        const savedComment = await newComment.save();

        post.comments.push(savedComment);
        await post.save();

        res.json(savedComment);
      }
    }
  }),
];

exports.comment_put = [
  passport.authenticate('jwt', { session: false }),
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
  body('title', 'Title must have correct length')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }),
  body('body', 'Comment body must have correct length')
    .optional()
    .trim()
    .isLength({ min: 10, maxLength: 280 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const commentById = await Comment.findById(req.params.commentid).exec();

      if (!commentById) {
        res.sendStatus(404);
      } else {
        if (!commentById.author._id.equals(req.user._id)) {
          res.sendStatus(403);
        } else {
          const commentDetail = {
            email: req.body.email,
            title: req.body.title,
            body: req.body.body,
          };

          const updatedComment = await Comment.findOneAndUpdate(
            {
              _id: req.params.commentid,
              post: req.params.postid,
            },
            commentDetail,
            { new: true, runValidators: true }
          );

          res.json(updatedComment);
        }
      }
    }
  }),
];

exports.comment_delete = [
  passport.authenticate('jwt', { session: false }),
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const commentById = await Comment.findById(req.params.commentid).exec();

      if (!commentById) {
        res.sendStatus(404);
      } else {
        if (!commentById.author._id.equals(req.user._id)) {
          res.sendStatus(403);
        } else {
          const deletedComment = await Comment.findByIdAndDelete({
            _id: req.params.commentid,
            post: req.params.postid,
          });

          res.json(deletedComment);
        }
      }
    }
  }),
];
