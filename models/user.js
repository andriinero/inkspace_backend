const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, minLength: 3, maxLength: 100 },
  password: { type: String, required: true, minLength: 8 },
  email: { type: String, minLength: 3, maxLength: 100 },
  role: { type: String, required: true, enum: ['user', 'admin'] },
});

UserSchema.virtual('url').get(function () {
  return `/users/${this._id}`;
});

module.exports = mongoose.model('User', UserSchema);
