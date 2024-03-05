const jwt = require('jsonwebtoken');

require('dotenv').config();

export const extractToken = (req, res, next) => {
  const bearer = req.headers['authorization'];
  const token = bearer.split(' ')[1];

  if (typeof token !== 'undefined') req.token = token;

  next();
};

export const verifyToken = (req, res, next) => {
  if (req.token) {
    const secret = process.env.SECRET_KEY;
    const token = req.token;

    jwt.verify(token, secret, (err, authData) => {
      if (err) next(err);

      req.user = authData;
    });
  }

  next();
};
