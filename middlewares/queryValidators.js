const { query } = require('express-validator');

const { limitQuerySanitizer, pageQuerySanitizer } = require('./validation');

exports.generalResourceQueries = (limit) => [
  query('limit', 'Limit query must have valid format')
    .default(limit)
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
  query('random', 'Random must have valid format')
    .trim()
    .optional()
    .isInt({ min: 1 })
    .escape(),
];
