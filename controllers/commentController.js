const { body, param, query, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const passport = require('passport');

const Comment = require('../models/comment');
const Post = require('../models/post');
const {
  isDbIdValid,
  limitQuerySanitizer,
  pageQuerySanitizer,
} = require('../middlewares/validation');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

// FIXME: postid should be query
exports.comments_get = [
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  query('limit', 'Limit query must have valid format')
    .default(MAX_DOCS_PER_FETCH)
    .trim()
    .isInt()
    .customSanitizer(limitQuerySanitizer)
    .escape(),
  query('page', 'Page query must have valid format')
    .default(1)
    .trim()
    .isInt()
    .customSanitizer(pageQuerySanitizer)
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      // TODO: search by post/not entire db
      const allCommentsByPost = await Comment.find({ post: req.params.postid })
        .skip(page * MAX_DOCS_PER_FETCH)
        .limit(limit)
        .populate('author', 'username role profile_image')
        .sort({ date: -1 })
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
  param('commentid', 'Comment id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const comment = await Comment.findById(req.params.commentid)
        .populate('author', 'username role profile_image')
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
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
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
          body: req.body.body,
          date: new Date(),
        };

        const newComment = new Comment(commentDetail);
        const savedComment = await newComment.save();
        await savedComment.populate('author', 'username role');

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
            body: req.body.body,
            edit_date: new Date(),
          };

          const updatedComment = await Comment.findByIdAndUpdate(
            req.params.commentid,
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
  param('commentid', 'Comment id must be valid')
    .trim()
    .custom(isDbIdValid)
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const commentById = await Comment.findById(req.params.commentid).exec();
      const postById = await Post.findById(commentById.post).exec();

      if (!commentById || !postById) {
        res.sendStatus(404);
      } else {
        if (!commentById.author._id.equals(req.user._id)) {
          res.sendStatus(403);
        } else {
          const result = await commentById.deleteOne();

          if (result.acknowledged) {
            postById.comments = postById.comments.filter(
              (c) => !c.equals(commentById._id)
            );
            await postById.save();
          }

          res.json(commentById);
        }
      }
    }
  }),
];
