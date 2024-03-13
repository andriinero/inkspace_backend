const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

require('dotenv').config();

const MAX_DOCS_PER_FETCH = parseInt(process.env.MAX_DOCS_PER_FETCH, 10);

exports.isDbIdValid = (id) => mongoose.Types.ObjectId.isValid(id);

exports.limitQuerySanitizer = (value) => {
  if (value < 0 || value > 20) {
    return 0;
  } else {
    return value;
  }
};

exports.pageQuerySanitizer = (model) => {
  return async (value, { req }) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new Error('An error has occurred during sanitization');
    } else {
      const docCount = await model.countDocuments().exec();

      if (value < 0 || value > Math.ceil(docCount / MAX_DOCS_PER_FETCH)) {
        return 0;
      } else {
        return --value;
      }
    }
  };
};

exports.topicNameQuerySanitizer = (model) => {
  return async (value) => {
    const oneModel = await model.findOne({ name: value }).exec();

    if (oneModel) return oneModel._id.toString();
    if (mongoose.Types.ObjectId.isValid(value)) return value;
  };
};
