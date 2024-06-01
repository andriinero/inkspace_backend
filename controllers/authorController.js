const asyncHandler = require('express-async-handler');
const { query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const EnvVars = require('../constants/EnvVars');

const { isDbIdValid } = require('../middlewares/validation');
const { generalResourceQueries } = require('../middlewares/queryValidators');

const User = require('../models/user');

const MAX_DOCS_PER_FETCH = EnvVars.Bandwidth.MAX_DOCS_PER_FETCH;

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
      res
        .status(400)
        .json({ message: 'Validation error', error: errors.array() });
    } else {
      const { limit, page, random } = req.query;

      const queryOpts = [];

      if (limit && limit > 0) queryOpts.push({ $limit: limit });
      if (random) queryOpts.push({ $sample: { size: +random } });

      const allAuthors = await User.aggregate([
        ...queryOpts,
        { $skip: page * MAX_DOCS_PER_FETCH },
        { $sort: { sign_up_date: -1 } },
        { $set: { followed_users_count: { $size: '$followed_users' } } },
        { $set: { users_following_count: { $size: '$users_following' } } },
      ])
        .project(
          'username bio followed_users_count users_following_count sign_up_date profile_image',
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
      res
        .status(400)
        .json({ message: 'Validation error', errors: errors.array() });
    } else {
      const authorById = await User.aggregate([
        { $match: { _id: ObjectId(req.params.userid) } },
        { $set: { followed_users_count: { $size: '$followed_users' } } },
        { $set: { users_following_count: { $size: '$users_following' } } },
      ])
        .project(
          'username bio followed_users_count users_following_count sign_up_date profile_image',
        )
        .exec();

      if (!authorById) {
        res.status(404).json({ message: 'Author not found' });
      } else {
        res.json(authorById[0]);
      }
    }
  }),
];
