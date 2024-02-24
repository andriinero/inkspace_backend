const asyncHandler = require('express-async-handler');
const { body, query, params, validationResult } = require('express-validator');
const passport = require('passport');

const Topic = require('../models/topic');

require('dotenv').config();

exports.topics_get = [
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
    .customSanitizer(async (value) => {
      const docCount = await Topic.countDocuments().exec();

      if (value < 0 || value > Math.ceil(docCount / process.env.MAX_DOCS_PER_FETCH)) {
        return 0;
      } else {
        return --value;
      }
    })
    .escape(),
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.send(400).json(errors.array());
    } else {
      const { limit, page } = req.query;

      const topics = await Topic.find({}, 'name')
        .skip(page * process.env.MAX_DOCS_PER_FETCH)
        .limit(limit)
        .exec();

      res.json(topics);
    }
  }),
];
