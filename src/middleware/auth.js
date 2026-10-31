// Auth middleware (SAD 4.1, SRSSR-003): the SERVER checks login and role on every request,
// not just the UI hiding buttons.
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
    // SRSSR-005: tokens expire after JWT_EXPIRES_IN (15 min); jsonwebtoken reports that as TokenExpiredError
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired, please log in again'));
    }
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid session, please log in again'));
  }
}

// SRSSR-003: only let the listed roles through. Wrong role -> 403.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'NO_TOKEN', 'Please log in first'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };
}

// Shortcut for teammates: router.post('/', allow('admin'), handler)
function allow(...roles) {
  return [verifyToken, requireRole(...roles)];
}

module.exports = { verifyToken, requireRole, allow };
