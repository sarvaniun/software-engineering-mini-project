// Auth middleware (SAD 4.1): every request except login carries a JWT.
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// SRSF-001: reject requests without a valid token. Puts {id, role, name} on req.user.
function verifyToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'NO_TOKEN', 'Please log in first'));
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new AppError(401, 'INVALID_TOKEN', 'Session expired or invalid, please log in again'));
  }
}

// PLACEHOLDER until SRSSR-003 (#9): lets every logged-in role through.
function requireRole(...roles) {
  return (req, res, next) => next();
}

module.exports = { verifyToken, requireRole };
