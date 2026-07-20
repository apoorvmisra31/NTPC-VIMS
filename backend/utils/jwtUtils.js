const jwt = require('jsonwebtoken');
const config = require('../config/env');

exports.generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire,
  });
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
