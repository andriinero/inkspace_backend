const passport = require('passport');
const asyncHandler = require('express-async-handler');
const { body, param, validationResult } = require('express-validator');

const { isDbIdValid } = require('../middlewares/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const Comment = require('../models/comment');
const Post = require('../models/post');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

exports.comments_get = [
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const allCommentsByPost = await Comment.find(
        { post: req.params.postid },
        'author post body date edit_date'
      )
        .skip(page * MAX_DOCS_PER_FETCH)
        .limit(limit)
        .populate('author', 'username profile_image')
        .sort({ date: -1 })
        .exec();

      if (!allCommentsByPost) {
        res.status(404).json({ message: 'Comments not found' });
      } else {
        res.json(allCommentsByPost);
      }
    }
  }),
];

exports.comment_get = [
  param('commentid', 'Comment id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const comment = await Comment.findById(
        req.params.commentid,
        'author post body date edit_date'
      )
        .populate('author', 'username profile_image')
        .exec();

      if (!comment) {
        res.status(404).json({ message: 'Comment not found' });
      } else {
        res.json(comment);
      }
    }
  }),
];

exports.comment_post = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  body('body', 'Comment body must have correct length')
    .trim()
    .isLength({ min: 10, maxLength: 280 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const post = await Post.findById(req.params.postid).exec();

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
      } else {
        const commentDetail = {
          author: req.user._id,
          post: req.params.postid,
          body: req.body.body,
          date: new Date(),
        };

        const newComment = new Comment(commentDetail);
        const savedComment = await newComment.save();
        await savedComment.populate('author', 'username profile_image');

        post.comments.push(savedComment);
        await post.save();

        res.json(savedComment);
      }
    }
  }),
];

exports.comment_put = [
  passport.authenticate('jwt', { session: false }),
  param('commentid', 'Comment id must be valid').trim().custom(isDbIdValid).escape(),
  body('body', 'Comment body must have correct length')
    .optional()
    .trim()
    .isLength({ min: 10, maxLength: 280 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const commentById = await Comment.findById(req.params.commentid).exec();

      if (!commentById) {
        res.status(404).json({ message: 'Comment not found' });
      } else {
        if (!commentById.author._id.equals(req.user._id)) {
          res.status(403).json({ message: 'Authorization error' });
        } else {
          const commentDetail = {
            body: req.body.body,
            edit_date: new Date(),
          };

          const updatedComment = await Comment.findByIdAndUpdate(
            req.params.commentid,
            commentDetail,
            { new: true, runValidators: true }
          )
            .select('author post body date edit_date')
            .populate('author', 'username profile_image');

          res.json(updatedComment);
        }
      }
    }
  }),
];

exports.comment_delete = [
  passport.authenticate('jwt', { session: false }),
  param('commentid', 'Comment id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const commentById = await Comment.findById(req.params.commentid).exec();
      const postById = await Post.findById(commentById.post).exec();

      if (!commentById || !postById) {
        res.status(404).json({ message: 'Comment not found' });
      } else {
        if (!commentById.author._id.equals(req.user._id)) {
          res.status(403).json({ message: 'Authorization error' });
        } else {
          const result = await commentById.deleteOne();

          if (result.acknowledged) {
            postById.comments = postById.comments.filter(
              (c) => !c.equals(commentById._id)
            );
            await postById.save();
          }

          res.json({ _id: commentById._id.toString() });
        }
      }
    }
  }),
];
