const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, minLength: 3, maxLength: 100 },
  password: { type: String, required: true, minLength: 8 },
  email: { type: String, required: true, minLength: 3, maxLength: 100 },
  role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
  bio: { type: String, maxLength: 280 },
  sign_up_date: { type: Date, required: true, default: Date.now },
  user_posts: [{ type: Schema.Types.ObjectId, required: true, ref: 'Post' }],
  post_bookmarks: [{ type: Schema.Types.ObjectId, required: true, ref: 'Post' }],
  ignored_posts: [{ type: Schema.Types.ObjectId, required: true, ref: 'Post' }],
  ignored_topics: [{ type: Schema.Types.ObjectId, required: true, ref: 'Topic' }],
  followed_users: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  profile_image: { type: Schema.Types.ObjectId, required: true, ref: '' },
});

UserSchema.virtual('url').get(function () {
  return `/users/${this._id}`;
});

module.exports = mongoose.model('User', UserSchema);
