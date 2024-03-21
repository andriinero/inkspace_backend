const asyncHandler = require('express-async-handler');
const { query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const { isDbIdValid } = require('../utils/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const User = require('../models/user');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

exports.authors_get = [
  generalResourceQueries(MAX_DOCS_PER_FETCH),
  query('random', 'Random must have valid format')
    .trim()
    .optional()
    .isInt({ min: 1 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors.array());
    } else {
      const { limit, page, random } = req.query;

      const stages = [];

      if (random) stages.push({ $sample: { size: +random } });

      const allAuthors = await User.aggregate([
        ...stages,
        { $skip: page * MAX_DOCS_PER_FETCH },
        { $limit: +limit },
        { $sort: { sign_up_date: -1 } },
        { $set: { followed_users_count: { $size: '$followed_users' } } },
        { $set: { users_following_count: { $size: '$users_following' } } },
      ])
        .project(
          'username bio followed_users_count users_following_count sign_up_date profile_image'
        )
        .exec();

      res.json(allAuthors);
    }
  }),
];

exports.author_get = [
  param('userid', 'User id must be valid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const authorById = await User.aggregate([
        { $match: { _id: ObjectId(req.params.userid) } },
        { $set: { followed_users_count: { $size: '$followed_users' } } },
        { $set: { users_following_count: { $size: '$users_following' } } },
      ])
        .project(
          'username bio followed_users_count users_following_count sign_up_date profile_image'
        )
        .exec();

      if (!authorById) {
        res.sendStatus(404);
      } else {
        res.json(authorById);
      }
    }
  }),
];
