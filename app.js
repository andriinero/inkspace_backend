const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const EnvVars = require('./constants/EnvVars');

const User = require('./models/user');

const strategyOpts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: EnvVars.Jwt.SECRET,
};

const indexRouter = require('./routes/index');
const postRouter = require('./routes/postRouter');
const commentRouter = require('./routes/commentRouter');
const authorRouter = require('./routes/authorRouter');
const topicRouter = require('./routes/topicRouter');
const profileRouter = require('./routes/profileRouter');
const authRouter = require('./routes/authRouter');
const imageRouter = require('./routes/imageRouter');

const app = express();

const mongoDB = EnvVars.MongoDB.URI;
mongoose.set('strictQuery', false);
const main = async () => {
  await mongoose.connect(mongoDB);
};
main().catch((err) => console.log(err.message));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1000,
});

app.use(limiter);
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

passport.use(
  new JWTStrategy(strategyOpts, async (jwt_payload, done) => {
    try {
      const user = await User.findOne({ _id: jwt_payload.sub });

      if (user) {
        return done(null, user);
      } else {
        return done(null, null);
      }
    } catch (err) {
      return done(err, null);
    }
  }),
);

app.use('/', indexRouter);
app.use('/api/posts', postRouter);
app.use('/api/comments', commentRouter);
app.use('/api/authors', authorRouter);
app.use('/api/topics', topicRouter);
app.use('/api/profile', profileRouter);
app.use('/auth', authRouter);
app.use('/api/images', imageRouter);

module.exports = app;
