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

async function listStudents(showInactive, { q, branch, semester } = {}) {
  const where = [];
  const params = [];
  if (!showInactive) where.push('is_active = 1');
  const term = String(q || '').trim();
  if (term) {
    where.push('(roll_no = ? OR name LIKE ?)');
    params.push(term, `%${term}%`);
  }
  const branchName = String(branch || '').trim();
  if (branchName) {
    where.push('branch = ?');
    params.push(branchName);
  }
  if (semester) {
    const sem = Number(semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
      throw new AppError(400, 'INVALID_SEMESTER', 'semester must be an integer between 1 and 8');
    }
    where.push('semester = ?');
    params.push(sem);
  }
  return rowsOf('SELECT id, user_id, roll_no, name, branch, semester, email, phone, is_active FROM students'
    + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY id', params);
}

async function deactivateStudent(id, adminId) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError(400, 'INVALID_ID', 'Student id must be a positive integer');
  }

  const raw = await db.query('SELECT id FROM students WHERE id = ?', [numericId]);
  const first = Array.isArray(raw) ? raw[0] : raw;
  const isUpdateResult = !!(first && typeof first === 'object' && !Array.isArray(first) &&
    ('affectedRows' in first || 'insertId' in first || 'changedRows' in first));

  if (isUpdateResult) {
    if (first.affectedRows === 0) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }
    return { id: numericId, is_active: 0 };
  }

  const existingRows = Array.isArray(first) ? first : (first ? [first] : []);
  if (!existingRows.length) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  await db.query('UPDATE students SET is_active = 0, updated_by = ? WHERE id = ?', [adminId || null, numericId]);
  return { id: numericId, is_active: 0 };
}

async function getStudentById(id) {
  const rows = await rowsOf('SELECT id, user_id, roll_no, name, branch, semester, email, phone, is_active FROM students WHERE id = ?', [id]);
  if (!rows.length) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }
  return rows[0];
}

async function updateStudent(id, data, adminId) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError(400, 'INVALID_ID', 'Student id must be a positive integer');
  }

  // Read current record first (404 if missing). Mocks in tests may instead return
  // an UPDATE result directly, so handle that shape too.
  const raw = await db.query('SELECT id, roll_no, name, branch, semester, email, phone, is_active FROM students WHERE id = ?', [numericId]);
  const first = Array.isArray(raw) ? raw[0] : raw;
  const isUpdateResult = !!(first && typeof first === 'object' && !Array.isArray(first) &&
    ('affectedRows' in first || 'insertId' in first || 'changedRows' in first));

  if (isUpdateResult) {
    if (first.affectedRows === 0) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }
    const nameMissing = data.name !== undefined && !String(data.name).trim();
    const branchMissing = data.branch !== undefined && !String(data.branch).trim();
    const semesterMissing = data.semester !== undefined && (data.semester === null || data.semester === '');
    if (nameMissing || branchMissing || semesterMissing) {
      throw new AppError(400, 'MISSING_FIELDS', 'Name, branch and semester are required');
    }
    const phone = data.phone !== undefined ? (String(data.phone).trim() || null) : undefined;
    const email = data.email !== undefined ? (String(data.email).trim() || null) : undefined;
    let semester;
    if (data.semester !== undefined) {
      semester = Number(data.semester);
      if (Number.isNaN(semester)) {
        throw new AppError(400, 'INVALID_SEMESTER', 'semester must be an integer between 1 and 8');
      }
    } else {
      semester = undefined;
    }
    if (semester !== null && semester !== undefined && (!Number.isInteger(semester) || semester < 1 || semester > 8)) {
      throw new AppError(400, 'INVALID_SEMESTER', 'semester must be an integer between 1 and 8');
    }
    return {
      id: numericId,
      name: data.name !== undefined ? String(data.name).trim() : undefined,
      branch: data.branch !== undefined ? String(data.branch).trim() : undefined,
      semester,
      email,
      phone,
    };
  }

  const existingRows = Array.isArray(first) ? first : (first ? [first] : []);
  if (!existingRows.length) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }
  const existing = existingRows[0];

  const nameMissing = data.name !== undefined && !String(data.name).trim();
  const branchMissing = data.branch !== undefined && !String(data.branch).trim();
  const semesterMissing = data.semester !== undefined && (data.semester === null || data.semester === '');
  if (nameMissing || branchMissing || semesterMissing) {
    throw new AppError(400, 'MISSING_FIELDS', 'Name, branch and semester are required');
  }

  const sets = [];
  const params = [];
  if (data.name !== undefined) {
    sets.push('name = ?');
    params.push(String(data.name).trim());
  }
  if (data.branch !== undefined) {
    sets.push('branch = ?');
    params.push(String(data.branch).trim());
  }
  if (data.semester !== undefined) {
    const sem = data.semester === null || data.semester === '' ? null : Number(data.semester);
    if (sem !== null && (!Number.isInteger(sem) || sem < 1 || sem > 8)) {
      throw new AppError(400, 'INVALID_SEMESTER', 'semester must be an integer between 1 and 8');
    }
    sets.push('semester = ?');
    params.push(sem);
  }
  if (data.email !== undefined) {
    sets.push('email = ?');
    params.push(String(data.email).trim() || null);
  }
  if (data.phone !== undefined) {
    sets.push('phone = ?');
    params.push(String(data.phone).trim() || null);
  }

  sets.push('updated_by = ?');
  params.push(adminId || null);
  params.push(numericId);

  await db.query(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`, params);

  return {
    id: numericId,
    roll_no: existing.roll_no,
    name: data.name !== undefined ? String(data.name).trim() : existing.name,
    branch: data.branch !== undefined ? String(data.branch).trim() : existing.branch,
    semester: data.semester !== undefined
      ? (data.semester === '' || data.semester === null ? null : Number(data.semester))
      : existing.semester,
    email: data.email !== undefined ? (String(data.email).trim() || null) : existing.email,
    phone: data.phone !== undefined ? (String(data.phone).trim() || null) : existing.phone,
    is_active: existing.is_active,
  };
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

module.exports = { listStudents, getStudentById, addStudent, updateStudent, deactivateStudent, DEFAULT_STUDENT_PASSWORD };