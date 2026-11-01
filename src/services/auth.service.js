// Auth Service (SAD 3.4): login, token creation, account lockout.
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyPassword } = require('../utils/password');
const AppError = require('../utils/AppError');

// SRSF-003: lock the account after 3 wrong passwords in a row
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MINUTES = 5;

async function login(username, password) {
  // The lock check is done in SQL (NOW()), so the app and the database always agree on the time
  const [rows] = await db.query(
    `SELECT id, username, password_hash, role, full_name, failed_attempts,
            (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked,
            CEIL(TIMESTAMPDIFF(SECOND, NOW(), locked_until) / 60) AS minutes_left
       FROM users WHERE username = ?`,
    [username]
  );
  const user = rows[0];

  // Unknown username: same message as a wrong password (don't reveal which usernames exist)
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  // Locked: refuse even the correct password until the lock expires
  if (Number(user.is_locked)) {
    const mins = Math.max(1, Number(user.minutes_left) || LOCK_MINUTES);
    throw new AppError(423, 'ACCOUNT_LOCKED',
      `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${mins} minute(s).`);
  }

  const passwordOk = await verifyPassword(password, user.password_hash);

  if (!passwordOk) {
    const attempts = (Number(user.failed_attempts) || 0) + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await db.query(
        'UPDATE users SET failed_attempts = 0, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
        [LOCK_MINUTES, user.id]
      );
    } else {
      await db.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
    }
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  // Successful login: clear any earlier failed attempts
  if (Number(user.failed_attempts) > 0) {
    await db.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  return { token, role: user.role, name: user.full_name };
}

module.exports = { login, MAX_FAILED_ATTEMPTS, LOCK_MINUTES };
