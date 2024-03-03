const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');

router.get('/', profileController.profile_get);

router.get('/bio', profileController.bio_get);

router.post('/bio', profileController.bio_post);

router.put('/bio', profileController.bio_put);

router.delete('/bio', profileController.bio_delete);

router.get('/bookmarks', profileController.bookmarks_get);

router.post('/bookmarks', profileController.bookmark_post);

router.delete('/bookmarks/:postid', profileController.bookmark_delete);

router.get('/ignored-posts', profileController.ignored_posts_get);

router.delete('/ignored-posts/:postid', profileController.ignored_post_delete);

router.get('/ignored-topic', profileController.ignored_topics_get);

router.delete('/ignored-topic/:topicid', profileController.ignored_topic_delete);

router.get('/followed-users', profileController.followed_users_get);

router.delete('/followed-users/:userid', profileController.followed_user_delete);

module.exports = router;
