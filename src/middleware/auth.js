// PLACEHOLDER: lets every request through.
// Real JWT checks: SRSF-001. Real role checks: SRSSR-003. (Sprint 1)

function verifyToken(req, res, next) {
  next();
}

function requireRole(...roles) {
  return (req, res, next) => next();
}

module.exports = { verifyToken, requireRole };
