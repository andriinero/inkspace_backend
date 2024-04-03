const asyncHandler = require('express-async-handler');
const { param, validationResult } = require('express-validator');
const passport = require('passport');
const { isDbIdValid } = require('../middlewares/validation');
const { updateUserList } = require('../utils/userUtils');

const User = require('../models/user');

exports.user_delete = [
  passport.authenticate('jwt', { session: false }),
  param('userid').trim().custom(isDbIdValid).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json(400).json({ message: 'Validation error', errors: errors.array() });
    } else {
      const userId = req.params.userid;

      const currentUser = req.user;
      const userById = await User.findById(userId).exec();

      if (!userById) {
        res.status(404).json({ message: 'User not found' });
      } else {
        if (!currentUser._id.equals(userById._id)) {
          res.status(403).json('Authorization error');
        } else {
          await userById.deleteOne();

          const allUsersByFollowedUsers = await User.find({
            followed_users: userId,
          }).exec();
          const allUsersByUsersFollowing = await User.find({
            users_following: userId,
          }).exec();
          const allUsersByIgnoredUsers = await User.find({
            ignored_users: userId,
          }).exec();

          updateUserList(allUsersByFollowedUsers, 'followed_users', userById.id);
          updateUserList(allUsersByUsersFollowing, 'users_following', userById.id);
          updateUserList(allUsersByIgnoredUsers, 'ignored_users', userById.id);

          res.json({ _id: userById.id });
        }
      }
    }
  }),
];
