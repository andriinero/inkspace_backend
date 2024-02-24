const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  post: { type: Schema.Types.ObjectId, required: true, ref: 'Post' },
  title: { type: String, required: true, minLength: 3, maxLength: 100 },
  body: { type: String, required: true, minLength: 10, maxLength: 280 },
  date: { type: Date, required: true },
});

CommentSchema.virtual('url').get(function () {
  return `/comments/${this._id}`;
});

module.exports = mongoose.model('Comment', CommentSchema);
