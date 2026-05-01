const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, env.get('JWT_SECRET'), {
    expiresIn: env.get('JWT_EXPIRE'),
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, env.get('JWT_REFRESH_SECRET'), {
    expiresIn: env.get('JWT_REFRESH_EXPIRE'),
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.get('JWT_REFRESH_SECRET'));
}

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
