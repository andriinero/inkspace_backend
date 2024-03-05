const asyncHandler = require('express-async-handler');
const { body, query, validationResult, param } = require('express-validator');
const mongoose = require('mongoose');
const passport = require('passport');

const Topic = require('../models/topic');
const user = require('../models/user');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = process.env.MAX_DOCS_PER_FETCH;

// TODO: data manipulation for admin role only
exports.topics_get = [
  query('limit', 'Limit query must have valid format')
    .default(+MAX_DOCS_PER_FETCH)
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
      const docCount = await Topic.countDocuments().exec();

      if (value < 0 || value > Math.ceil(docCount / MAX_DOCS_PER_FETCH)) {
        return 0;
      } else {
        return --value;
      }
    })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.send(400).json({ errors: errors.array() });
    } else {
      const { limit, page } = req.query;

      const topics = await Topic.find({}, 'name')
        .skip(page * MAX_DOCS_PER_FETCH)
        .limit(limit)
        .exec();

      res.json(topics);
    }
  }),
];

exports.topic_get = [
  param('topicid', 'Topic id must be valid')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const topicById = await Topic.findById(req.params.topicid).exec();

      if (!topicById) {
        res.sendStatus(404);
      } else {
        res.json(topicById);
      }
    }
  }),
];

exports.topic_post = [
  passport.authenticate('jwt', { session: false }),
  body('name', 'Name must have valid format')
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const topicDetail = { name: req.body.name };

      const newTopic = new Topic(topicDetail);
      const savedTopic = await newTopic.save();

      res.json(savedTopic);
    }
  }),
];

exports.topic_put = [
  passport.authenticate('jwt', { session: false }),
  param('topicid', 'Topic id must have valid format')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .escape(),
  body('name', 'Name must have valid format')
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const topicDetail = { name: req.body.name };

      const updatedTopic = await Topic.findByIdAndUpdate(
        req.params.topicid,
        topicDetail,
        {
          new: true,
          runValidators: true,
        }
      ).exec();

      if (!updatedTopic) {
        res.sendStatus(404);
      } else {
        res.json(updatedTopic);
      }
    }
  }),
];

exports.topic_delete = [
  passport.authenticate('jwt', { session: false }),
  param('topicid', 'Topic id must have valid format')
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const deletedTopic = await Topic.findByIdAndDelete(req.params.topicid).exec();

      if (!deletedTopic) {
        res.sendStatus(400);
      } else {
        res.json(deletedTopic);
      }
    }
  }),
];
