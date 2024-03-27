const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Schema = mongoose.Schema;

const gridFSBucket = new GridFSBucket(mongoose.connection, { bucketName: 'images' });

const Comment = require('../models/comment');
const User = require('../models/user');

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true, minLength: 3, maxLength: 100 },
  body: { type: String, required: true, minLength: 100, maxLength: 10000 },
  date: { type: Date, required: true },
  topic: { type: Schema.Types.ObjectId, required: true, ref: 'Topic' },
  comments: [{ type: Schema.Types.ObjectId, required: true, ref: 'Comment' }],
  like_count: { type: Number, required: true, default: 0 },
  thumbnail_image: { type: Schema.Types.ObjectId, ref: 'Image' },
  __v: { type: Number, select: false },
});

PostSchema.virtual('url').get(function () {
  return `/posts/${this._id}`;
});

PostSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await Comment.deleteMany({ post: this._id });
  await gridFSBucket.delete(new mongoose.Types.ObjectId(this.thumbnail_image));

  const userByPostId = await User.findOne({ user_posts: this._id }).exec();
  userByPostId.user_posts = userByPostId.user_posts.filter(
    (p) => !p._id.equals(this._id)
  );
  await userByPostId.save();

  const usersByPostBookmark = await User.find({ post_bookmarks: this._id }).exec();
  for (const user of usersByPostBookmark) {
    user.post_bookmarks = user.post_bookmarks.filter((p) => !p.equals(this._id));
    await user.save();
  }

  const usersByIgnoredPost = await User.find({ ignored_posts: this._id }).exec();
  for (const user of usersByIgnoredPost) {
    user.ignored_posts = user.ignored_posts.filter((p) => !p.equals(this._id));
    await user.save();
  }
});

module.exports = mongoose.model('Post', PostSchema);
