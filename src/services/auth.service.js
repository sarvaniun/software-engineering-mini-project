// Auth Service (SAD 3.4): login and token creation.
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyPassword } = require('../utils/password');
const AppError = require('../utils/AppError');

async function login(username, password) {
  const [rows] = await db.query(
    'SELECT id, username, password_hash, role, full_name FROM users WHERE username = ?',
    [username]
  );
  const user = rows[0];

  // Same message whether the username or the password is wrong,
  // so an attacker can't find out which usernames exist.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  return { token, role: user.role, name: user.full_name };
}

module.exports = { login };
