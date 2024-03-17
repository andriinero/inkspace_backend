const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 },
  __v: { type: Number, select: false },
});

TopicSchema.virtual('url').get(function () {
  return `/posts/${this._id}`;
});

module.exports = mongoose.model('Topic', TopicSchema);
