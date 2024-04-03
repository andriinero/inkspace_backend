const mongoose = require('mongoose');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const { body, param, validationResult } = require('express-validator');
const { GridFSBucket } = require('mongodb');
const bcrypt = require('bcryptjs');
const { upload } = require('../middlewares/imageUpload');
const { updateUserList } = require('../utils/userUtils');

const User = require('../models/user');
const Post = require('../models/post');
const Topic = require('../models/topic');

const { isDbIdValid } = require('../middlewares/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const gridFSBucket = new GridFSBucket(mongoose.connection, {
  bucketName: 'images',
});

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

exports.profile_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res) => {
    const userById = await User.findById(req.user._id, '-password -__v').exec();

    if (!userById) {
      res.sendStatus(404);
    } else {
      res.json(userById);
    }
  }),
];

exports.profile_put = [
  passport.authenticate('jwt', { session: false }),
  body('username').trim().isLength({ min: 3, max: 100 }).optional().escape(),
  body('email').trim().isLength({ min: 3, max: 100 }).optional().escape(),
  body('bio').trim().isLength({ max: 280 }).optional().escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const profileDetails = {
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio,
      };

      const updatedProfile = await User.findByIdAndUpdate(req.user._id, profileDetails, {
        new: true,
        runValidators: true,
      })
        .select('username email bio')
        .exec();

      if (!updatedProfile) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(updatedProfile);
      }
    }
  }),
];

exports.profile_delete = [
  passport.authenticate('jwt', { session: false }),
  param('userid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const userId = req.params.userid;

      const currentUser = req.user;
      const userById = await User.findById(userId).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        if (!currentUser._id.equals(userById._id)) {
          res.status(403).json('Authorization error');
        } else {
          const allUsersByFollowedUsers = await User.find({
            followed_users: userId,
          }).exec();
          const allUsersByUsersFollowing = await User.find({
            users_following: userId,
          }).exec();
          const allUsersByIgnoredUsers = await User.find({
            ignored_users: userId,
          }).exec();

          updateUserList(allUsersByFollowedUsers, 'followed_users', userById.id);
          updateUserList(allUsersByUsersFollowing, 'users_following', userById.id);
          updateUserList(allUsersByIgnoredUsers, 'ignored_users', userById.id);

          await userById.deleteOne();

          res.json({ _id: userById.id });
        }
      }
    }
  }),
];

// #region PASSWORD //

exports.password_put = [
  passport.authenticate('jwt', { session: false }),
  body('password').trim().isLength({ min: 8 }).escape(),
  body('passwordConfirmation')
    .trim()
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const SALT_VALUE = +process.env.SALT_VALUE;
      const password = await bcrypt.hash(req.body.password, SALT_VALUE);

      const updatedProfile = await User.findByIdAndUpdate(
        req.user._id,
        { password },
        {
          new: true,
          runValidators: true,
        }
      ).exec();

      if (!updatedProfile) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json({ _id: req.user._id });
      }
    }
  }),
];

// #endregion

// #region PROFILE IMAGE //

exports.profile_image_put = [
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: 'Validation error' });
    } else {
      const currentUser = req.user;
      const profileImageId = req.user.profile_image;
      const imageId = req.file.id;

      if (profileImageId) {
        await gridFSBucket.delete(new mongoose.Types.ObjectId(profileImageId));
      }

      currentUser.profile_image = imageId;
      await currentUser.save();

      currentUser.profile_image = res.json({ _id: currentUser.profile_image });
    }
  }),
];

// #endregion

// #region BOOKMARKS //

exports.bookmarks_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'post_bookmarks')
        .populate({
          path: 'post_bookmarks',
          options: {
            select: '-comments',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
          populate: {
            path: 'topic author',
            select: 'username email profile_image name',
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById.post_bookmarks);
      }
    }
  }),
];

exports.bookmark_post = [
  passport.authenticate('jwt', { session: false }),
  body('postid', 'Bookmark id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        userById.post_bookmarks.push(req.body.postid);
        await userById.save();

        res.json({ _id: req.body.postid });
      }
    }
  }),
];

exports.bookmark_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        const index = userById.post_bookmarks.findIndex(
          (p) => p._id.toString() === req.params.postid
        );
        const removedBookmark = userById.post_bookmarks.splice(index, 1)[0];

        await userById.save();

        res.json({ _id: removedBookmark });
      }
    }
  }),
];

// #endregion

// #region IGNORED POSTS

exports.ignored_posts_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'ignored_posts')
        .populate({
          path: 'ignored_posts',
          options: {
            select: '-body -comments',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById);
      }
    }
  }),
];

exports.ignored_post_post = [
  passport.authenticate('jwt', { session: false }),
  body('postid', 'Post id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        userById.ignored_posts.push(req.body.postid);
        await userById.save();

        res.json({ _id: req.body.postid });
      }
    }
  }),
];

exports.ignored_post_delete = [
  passport.authenticate('jwt', { session: false }),
  param('postid', 'Post id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        const index = userById.ignored_posts.findIndex(
          (p) => p._id.toString() === req.params.postid
        );
        const removedIgnoredPost = userById.ignored_posts.splice(index, 1)[0];

        await userById.save();

        res.json({ _id: removedIgnoredPost });
      }
    }
  }),
];

// #endregion

// #region IGNORED USERS

exports.ignored_users_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'ignored_users')
        .populate({
          path: 'ignored_users',
          options: {
            select: 'username bio profile_image',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById.ignored_users);
      }
    }
  }),
];

exports.ignored_user_post = [
  passport.authenticate('jwt', { session: false }),
  body('userid', 'User id must be valid')
    .trim()
    .custom(isDbIdValid)
    .custom(async (value) => {
      const userById = await User.findById(value).exec();

      if (!userById) throw new Error("User with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id).exec();

      if (userById.ignored_users.some((objId) => objId.toString() === value))
        throw new Error('This user is already ignored');
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        userById.ignored_users.push(req.body.userid);
        await userById.save();

        res.json({ _id: req.body.userid });
      }
    }
  }),
];

exports.ignored_user_delete = [
  passport.authenticate('jwt', { session: false }),
  param('userid', 'User id must be valid')
    .trim()
    .custom(isDbIdValid)
    .custom(async (value) => {
      const userById = await User.findById(value).exec();

      if (!userById) throw new Error("User with this id doesn't exist");
    })
    .custom(async (value, { req }) => {
      const userById = await User.findById(req.user._id);

      if (!userById.ignored_users.some((objId) => objId.toString() === value))
        throw new Error("This user doesn't exist");
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        const index = userById.ignored_users.findIndex(
          (p) => p._id.toString() === req.params.userid
        );
        const removedIgnoredUser = userById.ignored_users.splice(index, 1)[0];

        await userById.save();

        res.json({ _id: removedIgnoredUser });
      }
    }
  }),
];

// #endregion

// #region IGNORED TOPICS

exports.ignored_topics_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'ignored_topics')
        .populate({
          path: 'ignored_topics',
          options: {
            select: '-body -comments',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById);
      }
    }
  }),
];

exports.ignored_topic_post = [
  passport.authenticate('jwt', { session: false }),
  body('topicid', 'Topic id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        userById.ignored_topics.push(req.body.topicid);
        await userById.save();

        res.json({ _id: req.body.topicid });
      }
    }
  }),
];

exports.ignored_topic_delete = [
  passport.authenticate('jwt', { session: false }),
  param('topicid', 'Topic id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const userById = await User.findById(req.user._id).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        const index = userById.ignored_topics.findIndex(
          (p) => p._id.toString() === req.params.topicid
        );
        const removedIgnoredTopic = userById.ignored_topics.splice(index, 1)[0];

        await userById.save();

        res.json({ _id: removedIgnoredTopic });
      }
    }
  }),
];

// #endregion

// #region FOLLOWED USERS

exports.followed_users_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'followed_users')
        .populate({
          path: 'followed_users',
          options: {
            select: '-body -comments',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById.followed_users);
      }
    }
  }),
];

exports.followed_user_post = [
  passport.authenticate('jwt', { session: false }),
  body('userid', 'User id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const currentUser = req.user;
      const userById = await User.findById(req.body.userid).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        currentUser.followed_users.push(req.body.userid);
        userById.users_following.push(currentUser._id);

        await currentUser.save();
        await userById.save();

        res.json({ _id: req.body.userid });
      }
    }
  }),
];

exports.followed_user_delete = [
  passport.authenticate('jwt', { session: false }),
  param('userid', 'User id must be valid')
    .trim()
    .custom(isDbIdValid)
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
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ message: 'Validation error', errors: errors.array() });
    } else {
      const currentUser = req.user;
      const userById = await User.findById(req.params.userid).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        const indexFollowed = currentUser.followed_users.findIndex(
          (u) => u._id.toString() === req.params.userid
        );
        const unfollowedUser = currentUser.followed_users.splice(indexFollowed, 1)[0];

        const indexFollowing = userById.users_following.findIndex(
          (u) => u._id.toString() === currentUser._id
        );
        userById.users_following.splice(indexFollowing, 1)[0];

        await currentUser.save();
        await userById.save();

        res.json({ _id: unfollowedUser });
      }
    }
  }),
];

// #endregion

// #region USERS FOLLOWING

exports.users_following_get = [
  passport.authenticate('jwt', { session: false }),
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const userById = await User.findById(req.user._id, 'users_following')
        .populate({
          path: 'users_following',
          options: {
            select: '-body -comments',
            limit,
            skip: page * MAX_DOCS_PER_FETCH,
          },
        })
        .exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json(userById);
      }
    }
  }),
];

// #endregion
