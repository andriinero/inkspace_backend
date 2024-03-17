const asyncHandler = require('express-async-handler');
const { query, param, validationResult } = require('express-validator');

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

      let users = [];

      if (random) {
        users = await User.aggregate([
          { $sample: { size: +random } },
          { $skip: page * MAX_DOCS_PER_FETCH },
          { $limit: +limit },
          { $sort: { sign_up_date: -1 } },
        ])
          .project('username bio followed_users sign_up_date profile_image')
          .exec();
      } else {
        users = await User.find(
          {},
          'username bio followed_users sign_up_date profile_image'
        )
          .skip(page * MAX_DOCS_PER_FETCH)
          .limit(limit)
          .sort({ sign_up_date: -1 })
          .exec();
      }

      res.json(users);
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
      const userById = await User.findById(
        req.params.userid,
        'username bio followed_users sign_up_date profile_image'
      ).exec();

      if (!userById) {
        res.sendStatus(404);
      } else {
        res.json(userById);
      }
    }
  }),
];
