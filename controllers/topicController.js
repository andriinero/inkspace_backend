const passport = require('passport');
const asyncHandler = require('express-async-handler');
const { body, query, validationResult, param } = require('express-validator');

const { isDbIdValid } = require('../utils/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const Topic = require('../models/topic');
const User = require('../models/user');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

exports.topics_get = [
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  query('random', 'Random must have valid format')
    .trim()
    .optional()
    .isInt({ min: 1 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.send(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const { limit, page, random } = req.query;

      let topics = [];

      if (random) {
        topics = await Topic.aggregate([{ $sample: { size: +random } }]).exec();
      } else {
        topics = await Topic.find({}, 'name')
          .skip(page * MAX_DOCS_PER_FETCH)
          .limit(limit)
          .exec();
      }

      res.json(topics);
    }
  }),
];

exports.topic_get = [
  param('topicid', 'Topic id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const topicById = await Topic.findById(req.params.topicid).exec();

      if (!topicById) {
        res.status(404).json({ message: 'Topic not found' });
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
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
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
  param('topicid', 'Topic id must have valid format').trim().custom(isDbIdValid).escape(),
  body('name', 'Name must have valid format')
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const topicDetail = { name: req.body.name };

      const updatedTopic = await Topic.findByIdAndUpdate(
        req.params.topicid,
        topicDetail,
        {
          new: true,
          runValidators: true,
        }
      )
        .select('name')
        .exec();

      if (!updatedTopic) {
        res.status(404).json({ message: 'Topic not found' });
      } else {
        res.json(updatedTopic);
      }
    }
  }),
];

exports.topic_delete = [
  passport.authenticate('jwt', { session: false }),
  param('topicid', 'Topic id must have valid format').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const deletedTopic = await Topic.findByIdAndDelete(req.params.topicid).exec();

      if (!deletedTopic) {
        res.status(404).json({ message: 'Topic not found' });
      } else {
        res.json({ _id: deletedTopic._id.toString() });
      }
    }
  }),
];
