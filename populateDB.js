#! /usr/bin/env node

require('dotenv').config();

const bcrypt = require('bcryptjs');
const userArgs = process.argv.slice(2);

const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const Topic = require('./models/topic');

const users = [];
const posts = [];
const comments = [];
const topics = [];

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const mongoDB = process.env.DEV_MONGODB_URI;

main().catch((err) => console.log(err));

async function main() {
  console.log('Debug: About to connect');
  await mongoose.connect(mongoDB);
  console.log('Debug: Should be connected?');
  await createUsers();
  await createTopics();
  await createPosts();
  await createComments();
  console.log('Debug: Closing mongoose');
  mongoose.connection.close();
}

async function userCreate(index, username, password, email, role) {
  const hashedPassword = await bcrypt.hash(password, +process.env.SALT_VALUE);

  const userDetail = { username, password: hashedPassword, email, role };

  const user = new User(userDetail);
  await user.save();

  users[index] = user;
  console.log(`Added user: ${username}`);
}

async function topicCreate(index, name) {
  const topicDetail = { name };

  const topic = new Topic(topicDetail);
  await topic.save();

  topics[index] = topic;
  console.log(`Addede topic: ${name}`);
}

async function postCreate(index, author, title, body, topic) {
  const postDetail = {
    author,
    title,
    body,
    date: new Date(),
    topic,
    comments: [],
  };

  const newPost = new Post(postDetail);
  const userById = await User.findById(author._id).exec();

  await newPost.save();
  userById.user_posts.push(newPost);
  await userById.save();
  posts[index] = newPost;
  console.log(`Added post: ${title}`);
}

async function commentCreate(index, post, email, title, body) {
  const commentDetail = {
    post,
    email,
    title,
    body,
    date: new Date(),
  };

  const comment = new Comment(commentDetail);
  const postById = await Post.findById(post._id).exec();

  const savedComment = await comment.save();
  postById.comments.push(savedComment);
  await postById.save();

  comments[index] = comment;
  console.log(`Added comment: ${title}`);
}

async function createUsers() {
  console.log('Adding users...');
  await Promise.all([userCreate(0, 'user1', 'strongpass1', 'example@gmail.com', 'user')]);
}

async function createTopics() {
  console.log('Adding topics...');
  await Promise.all([topicCreate(0, 'javascript'), topicCreate(1, 'react')]);
}

async function createPosts() {
  console.log('Adding posts...');
  await Promise.all([
    postCreate(
      0,
      users[0],
      'First post title',
      'Sentence officer go lay individual leather zoo had selection along while fix speed spring loss solid affect stomach outer two listen joined met eventually',
      topics[0]
    ),
    postCreate(
      1,
      users[0],
      'Second post title',
      'Hardly sweet yet stone local flight save day carry pony outer hollow log myself brave fort fine poetry wear pound massage plain girl good',
      topics[1]
    ),
  ]);
}

async function createComments() {
  console.log('Adding comments...');
  await Promise.all([
    commentCreate(
      0,
      posts[0],
      'example@gmail.com',
      "That's a crazy post",
      'western wall stick crack rubber serve prove two volume nearly noted swept scene railroad aboard at share impossible have future method alike fastened ready'
    ),
    commentCreate(
      1,
      posts[0],
      'coolemail@gmail.com',
      'You are doing a great job',
      'sister slide bear now pleasure daily itself unusual test hand waste prize palace silk situation went further bell forgotten keep alone white they chose'
    ),
    commentCreate(
      2,
      posts[1],
      'me@gmail.com',
      'Keep up the work',
      'grandmother able might next met supply greatest common fine than rich carry ice complex may industry food folks think moving once solar air volume'
    ),
  ]);
}
