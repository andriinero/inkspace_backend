const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Topic = require('../models/topic');

exports.isDbIdValid = (id) => mongoose.Types.ObjectId.isValid(id);

exports.limitQuerySanitizer = (value) => {
  if (value < 0 || value > 20) {
    return 0;
  } else {
    return value;
  }
};

exports.pageQuerySanitizer = (value, { req }) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new Error('An error has occurred during sanitization');
  } else {
    if (value < 0) {
      return 0;
    } else {
      return --value;
    }
  }
};

exports.topicNameQuerySanitizer = (model) => {
  return async (value) => {
    const oneModel = await model.findOne({ name: value }).exec();

    if (oneModel) return oneModel._id.toString();
    if (mongoose.Types.ObjectId.isValid(value)) return value;
  };
};

exports.topicSanitizer = async (value) => {
  const topic = await Topic.findOne({ name: value }).exec();

  if (!topic) {
    const topic = new Topic({ name: value });
    const savedTopic = await topic.save();

    return savedTopic._id;
  } else {
    return topic._id;
  }
};
