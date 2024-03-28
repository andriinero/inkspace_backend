const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Post = require('../models/post');

const TopicSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 },
  __v: { type: Number, select: false },
});

TopicSchema.virtual('url').get(function () {
  return `/posts/${this._id}`;
});

TopicSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const postsByTopic = await Post.find({ topic: this._id }).exec();

  if (postsByTopic.length > 0)
    throw Error(`Can't delete: topic ${this._id.toString()} is in use.`);
});

TopicSchema.pre('deleteMany', { document: true, query: false }, async function () {
  const postsByTopic = await Post.find({ topic: this._id }).exec();

  if (postsByTopic.length > 0)
    throw Error(`Can't delete: topic ${this._id.toString()} is in use.`);
});

module.exports = mongoose.model('Topic', TopicSchema);
