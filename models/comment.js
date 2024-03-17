const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  post: { type: Schema.Types.ObjectId, required: true, ref: 'Post' },
  body: { type: String, required: true, minLength: 10, maxLength: 280 },
  date: { type: Date, required: true },
  edit_date: { type: Date },
  __v: { type: Number, select: false },
});

CommentSchema.virtual('url').get(function () {
  return `/comments/${this._id}`;
});

module.exports = mongoose.model('Comment', CommentSchema);
