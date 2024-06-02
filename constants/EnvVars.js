require('dotenv').config();

module.exports = Object.freeze({
  NodeEnv: process.env.NODE_ENV ?? '',
  HOSTNAME: process.env.HOSTNAME ?? 'localhost',
  Port: {
    BASE: parseInt(process.env.PORT ?? 3000),
  },
  MongoDB: {
    URI: process.env.MONGODB_URI ?? '',
  },
  Jwt: {
    SECRET: process.env.JWT_SECRET ?? '',
    EXP: process.env.JWT_EXP ?? '', // exp at the same time as the cookie
  },
  Bcrypt: {
    SALT: parseInt(process.env.BCRYPT_SALT_VALUE),
  },
  Bandwidth: {
    MAX_DOCS_PER_FETCH: parseInt(process.env.MAX_DOCS_PER_FETCH ?? 25),
  },
});
