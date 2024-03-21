const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');

router.get('/', profileController.profile_get);

// BIO //

router.get('/bio', profileController.bio_get);

router.post('/bio', profileController.bio_post);

router.put('/bio', profileController.bio_put);

// BOOKMARKS //

router.get('/bookmarks', profileController.bookmarks_get);

router.post('/bookmarks', profileController.bookmark_post);

router.delete('/bookmarks/:postid', profileController.bookmark_delete);

// IGNORED POSTS //

router.get('/ignored-posts', profileController.ignored_posts_get);

router.post('/ignored-posts', profileController.ignored_post_post);

router.delete('/ignored-posts/:postid', profileController.ignored_post_delete);

// IGNORED TOPICS //

router.get('/ignored-topics', profileController.ignored_topics_get);

router.post('/ignored-topics', profileController.ignored_topic_post);

router.delete('/ignored-topics/:topicid', profileController.ignored_topic_delete);

// FOLLOWED USERS //

router.get('/followed-users', profileController.followed_users_get);

router.post('/followed-users', profileController.followed_user_post);

router.delete('/followed-users/:userid', profileController.followed_user_delete);

// USERS FOLLOWING //

router.get('/users-following', profileController.users_following_get);

module.exports = router;
