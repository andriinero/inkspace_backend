const asyncHandler = require('express-async-handler');
const { body, param, query, validationResult } = require();
const mongoose = require('mongoose');
const passport = require('passport');

require('dotenv').config();

exports.bio_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.bio_post = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.bio_put = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.bio_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.bookmarks_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.bookmark_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.ignored_posts_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.ignored_post_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.ignored_topics_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.ignored_topic_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.followed_users_get = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];

exports.followed_user_delete = [
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async () => {}),
];
