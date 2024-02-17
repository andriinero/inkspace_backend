const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const User = require('../models/user');

exports.users_get = asyncHandler(async (req, res, next) => {
  const lastUsers = await User.find({}, 'username bio').sort({ sign_up_date: 1 }).limit(3).exec();

  res.json(lastUsers);
});
