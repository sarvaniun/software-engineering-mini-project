// Business logic and SQL for the students module (SAD 3.4).
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

const DEFAULT_STUDENT_PASSWORD = 'Student@123';

// mysql2 returns [rows, fields]; mocks in tests may or may not wrap rows.
async function rowsOf(sql, params) {
  const res = await db.query(sql, params);
  const first = Array.isArray(res) ? res[0] : res;
  return Array.isArray(first) ? first : (first ? [first] : []);
}

async function headerOf(sql, params) {
  const res = await db.query(sql, params);
  const first = Array.isArray(res) ? res[0] : res;
  return first && typeof first === 'object' && !Array.isArray(first) ? first : res;
}

function isDuplicate(err) {
  return !!(err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062 ||
    /duplicate/i.test(err.message || '')));
}

async function listStudents() {
  return rowsOf('SELECT id, user_id, roll_no, name, branch, semester, email, phone, is_active FROM students ORDER BY id', []);
}

async function addStudent(data, adminId) {
  const roll_no = (data.roll_no || data.rollNo || '').trim();
  const name = (data.name || data.full_name || data.fullName || '').trim();
  const branch = (data.branch || '').trim();
  const semester = data.semester;
  const contact = data.contact || data.contactInfo || {};
  const email = (data.email || contact.email || '').trim() || null;
  const phone = (data.phone || contact.phone || '').trim() || null;

  if (!roll_no || !name || !branch || semester === undefined || semester === null || semester === '') {
    throw new AppError(400, 'MISSING_FIELDS', 'roll_no, name, branch and semester are required');
  }

  const sem = Number(semester);
  if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
    throw new AppError(400, 'INVALID_SEMESTER', 'semester must be an integer between 1 and 8');
  }

  // Duplicate roll_no check (also guards the users.username unique key).
  const existing = await rowsOf('SELECT id FROM students WHERE roll_no = ?', [roll_no]);
  if (existing.length) {
    throw new AppError(409, 'DUPLICATE_ROLL_NO', 'A student with this roll number already exists');
  }
  const existingUser = await rowsOf('SELECT id FROM users WHERE username = ?', [roll_no]);
  if (existingUser.length) {
    throw new AppError(409, 'DUPLICATE_ROLL_NO', 'A student with this roll number already exists');
  }

  const passwordHash = await hashPassword(DEFAULT_STUDENT_PASSWORD);

  let userId;
  try {
    const userRes = await headerOf(
      'INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
      [roll_no, passwordHash, 'student', name]
    );
    userId = userRes.insertId;
  } catch (err) {
    if (isDuplicate(err)) throw new AppError(409, 'DUPLICATE_ROLL_NO', 'A student with this roll number already exists');
    throw err;
  }

  let studentId;
  try {
    const studentRes = await headerOf(
      'INSERT INTO students (user_id, roll_no, name, branch, semester, email, phone, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, roll_no, name, branch, sem, email, phone, adminId || null]
    );
    studentId = studentRes.insertId;
  } catch (err) {
    if (isDuplicate(err)) throw new AppError(409, 'DUPLICATE_ROLL_NO', 'A student with this roll number already exists');
    throw err;
  }

  return {
    id: studentId,
    user_id: userId,
    roll_no,
    name,
    branch,
    semester: sem,
    email,
    phone,
    is_active: 1,
  };
}

module.exports = { listStudents, addStudent, DEFAULT_STUDENT_PASSWORD };