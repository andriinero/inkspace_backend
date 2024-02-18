const asyncHandler = require('express-async-handler');
const { body, query, validationResult } = require('express-validator');

const User = require('../models/user');

exports.authors_get = [
  query('limit', 'Limit query must have valid format')
    .optional()
    .trim()
    .isInt({ min: 1, max: 20 })
    .escape(),
  query('page', 'Page query must have valid format')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .customSanitizer(async (value) => {
      const docCount = await User.find().countDocuments().exec();

      if (value > Math.ceil(docCount / process.env.MAX_DOCS_PER_FETCH)) {
        return 0;
      } else {
        return --value;
      }
    })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const { limit, page } = req.query;

      const lastUsers = await User.find({}, 'username bio')
        .skip(page * process.env.DOCS_PER_FETCH)
        .limit(limit)
        .exec();

      res.json(lastUsers);
    }
  }),
];
