// Password hashing (SRSSR-002): passwords are only ever stored as bcrypt hashes.
// Use these two functions everywhere; never store or log a plain password.
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, storedHash) {
  return bcrypt.compare(plainPassword, storedHash);
}

module.exports = { hashPassword, verifyPassword };
