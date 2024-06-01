const mongoose = require('mongoose');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const { body, param, query, validationResult } = require('express-validator');
const { GridFSBucket } = require('mongodb');
const EnvVars = require('../constants/EnvVars');
const { upload } = require('../middlewares/imageUpload');

const {
  topicNameQuerySanitizer,
  isDbIdValid,
  topicSanitizer,
} = require('../middlewares/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const Post = require('../models/post');
const User = require('../models/user');
const Topic = require('../models/topic');

const gridFSBucket = new GridFSBucket(mongoose.connection, {
  bucketName: 'images',
});

const MAX_DOCS_PER_FETCH = parseInt(EnvVars.Bandwidth.MAX_DOCS_PER_FETCH, 10);

exports.posts_get = [
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  query('topic', 'Topic must be valid')
    .optional()
    .default('')
    .trim()
    .escape()
    .customSanitizer(topicNameQuerySanitizer(Topic)),
  query('ignoreList').optional().default('').trim().escape(),
  query('followList').optional().default('').trim().escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { page, limit, topic, userid, random, ignoreList, followList } =
        req.query;

      const queryOpts = [];

      if (limit && limit > 0) queryOpts.push({ $limit: limit });
      if (random) queryOpts.push({ $sample: { size: +random } });
      if (userid) queryOpts.push({ $match: { author: userid } });
      if (topic)
        queryOpts.push({
          $match: { topic: new mongoose.Types.ObjectId(topic) },
        });
      if (ignoreList) {
        const currentUser = await User.findById(ignoreList).exec();
        const allIgnoredUsers = currentUser.ignored_users;

        queryOpts.push({ $match: { author: { $nin: allIgnoredUsers } } });
      }
      if (followList) {
        const currentUser = await User.findById(followList).exec();
        const allFollowedUsers = currentUser.followed_users;

        queryOpts.push({ $match: { author: { $in: allFollowedUsers } } });
      }

      const posts = await Post.aggregate([
        ...queryOpts,
        { $sort: { date: -1 } },
        { $skip: page * MAX_DOCS_PER_FETCH },
        {
          $lookup: {
            from: User.collection.name,
            localField: 'author',
            foreignField: '_id',
            pipeline: [{ $project: { username: 1, profile_image: 1 } }],
            as: 'author',
          },
        },
        { $unwind: '$author' },
        {
          $lookup: {
            from: Topic.collection.name,
            localField: 'topic',
            foreignField: '_id',
            pipeline: [{ $project: { name: 1 } }],
            as: 'topic',
          },
        },
        { $unwind: '$topic' },
      ])
        .project('author title body date topic like_count thumbnail_image')
        .exec();

      res.json(posts);
    }
  }),
];

exports.post_get = [
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const post = await Post.findById(
        req.params.postid,
        'author title body date topic like_count thumbnail_image',
      )
        .populate('author', 'username profile_image')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            model: 'User',
            select: 'username profile_image',
          },
        })
        .populate('topic', 'name')
        .exec();

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.json(post);
      }
    }
  }),
];

exports.post_post = [
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  body('title', 'Title must have correct length')
    .trim()
    .isLength({ min: 3, max: 100 }),
  body('body', 'Post body must have correct length')
    .trim()
    .isLength({ min: 100, max: 10000 }),
  body('topic', 'Topic must be valid')
    .trim()
    .customSanitizer(topicSanitizer)
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const user = req.user;
      const thumbnailImageId = req.file.id;

      const postDetail = {
        author: user._id,
        title: req.body.title,
        body: req.body.body,
        topic: req.body.topic,
        date: new Date(),
        thumbnail_image: thumbnailImageId,
      };

      const newPost = new Post(postDetail);
      const savedPost = await newPost.save();

      user.user_posts.push(savedPost);
      await user.save();

      res.json({ _id: savedPost._id.toString() });
    }
  }),
];

exports.post_put = [
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
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
    .customSanitizer(topicSanitizer)
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const postById = await Post.findById(req.params.postid).exec();

      if (!postById) {
        res.status(404).json({ message: 'Post not found' });
      } else {
        if (!postById.author._id.equals(req.user._id)) {
          res.status(403).json({ message: 'Authorization error' });
        } else {
          const postThumbnailId = postById.thumbnail_image;
          const thumbnailImageId = req.file.id;

          if (postThumbnailId && thumbnailImageId) {
            await gridFSBucket.delete(
              new mongoose.Types.ObjectId(postThumbnailId),
            );
          }

          const postDetail = {
            title: req.body.title,
            body: req.body.body,
            topic: req.body.topic,
            thumbnail_image: thumbnailImageId,
          };

          const updatedPost = await Post.findByIdAndUpdate(
            req.params.postid,
            postDetail,
            { new: true, runValidators: true },
          )
            .select('author title body date topic like_count thumbnail_image')
            .populate('author', 'username profile_image')
            .populate('topic', 'name')
            .exec();

          res.json(updatedPost);
        }
      }
    }
  }),
];

exports.post_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const postId = req.params.postid;
      const postById = await Post.findById(postId).exec();

      if (!postById) {
        res.status(404).json({ message: 'Post not found' });
      } else {
        if (!postById.author._id.equals(req.user._id)) {
          res.status(403).json({ message: 'Authorization error' });
        } else {
          await postById.deleteOne();

          res.json({ _id: postById.id });
        }
      }
    }
  }),
];
