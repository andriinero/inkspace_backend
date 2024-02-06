const asyncHandler = require('express-async-handler');

const Post = require('../models/post');

exports.posts_get = asyncHandler(async (req, res, next) => {
    const allPosts = await Post.find({}).exec();

    res.json(allPosts);
});
