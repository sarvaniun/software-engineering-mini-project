// Auth endpoints (SAD 4.3)
const express = require('express');
const authService = require('../services/auth.service');
const { verifyToken } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

// POST /api/login  { username, password } -> { status, token, role, name }
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new AppError(400, 'MISSING_FIELDS', 'Username and password are required');
    }
    const result = await authService.login(username, password);
    res.json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/whoami -> who is logged in (used by the dashboards to show the user's name)
router.get('/whoami', verifyToken, (req, res) => {
  res.json({ status: 'success', user: req.user });
});

module.exports = router;
