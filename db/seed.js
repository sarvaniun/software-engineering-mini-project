// Fills the database with test data (STP §6): 1 admin, 2 faculty, 4 subjects, 10 students.
// Run with: npm run seed   (wipes existing rows first)
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'student_records',
  });

  // Clear old data
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['audit_log', 'marks', 'attendance', 'faculty_subjects', 'subjects', 'students', 'users']) {
    await db.query(`TRUNCATE TABLE ${t}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // Passwords are stored only as bcrypt hashes (SRSSR-002)
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const facultyHash = await bcrypt.hash('Faculty@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  const addUser = async (username, hash, role, fullName) => {
    const [r] = await db.execute(
      'INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
      [username, hash, role, fullName]
    );
    return r.insertId;
  };

  // Admin + faculty
  await addUser('admin', adminHash, 'admin', 'Admin Office');
  const fac1 = await addUser('fac1', facultyHash, 'faculty', 'Dr. Ramesh Kumar');
  const fac2 = await addUser('fac2', facultyHash, 'faculty', 'Dr. Priya Nair');

  // Subjects and who teaches them
  const subjects = [
    ['CS501', 'Software Engineering', 4, 'CSE', 5, fac1],
    ['CS502', 'Database Management Systems', 4, 'CSE', 5, fac2],
    ['EC301', 'Signals and Systems', 4, 'ECE', 3, fac1],
    ['EC302', 'Digital Electronics', 3, 'ECE', 3, fac2],
  ];
  for (const [code, name, credits, branch, sem, facultyId] of subjects) {
    const [r] = await db.execute(
      'INSERT INTO subjects (code, name, credits, branch, semester) VALUES (?, ?, ?, ?, ?)',
      [code, name, credits, branch, sem]
    );
    await db.execute('INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)', [facultyId, r.insertId]);
  }

  // Students: 5 in CSE sem 5, 5 in ECE sem 3. Login username = roll no.
  const students = [
    ['PES2UG24CS001', 'Aarav Sharma', 'CSE', 5],
    ['PES2UG24CS002', 'Diya Reddy', 'CSE', 5],
    ['PES2UG24CS003', 'Rohan Iyer', 'CSE', 5],
    ['PES2UG24CS004', 'Ananya Rao', 'CSE', 5],
    ['PES2UG24CS005', 'Karthik Menon', 'CSE', 5],
    ['PES2UG25EC001', 'Sneha Patil', 'ECE', 3],
    ['PES2UG25EC002', 'Vikram Shetty', 'ECE', 3],
    ['PES2UG25EC003', 'Meera Joshi', 'ECE', 3],
    ['PES2UG25EC004', 'Arjun Hegde', 'ECE', 3],
    ['PES2UG25EC005', 'Kavya Bhat', 'ECE', 3],
  ];
  for (const [rollNo, name, branch, sem] of students) {
    const userId = await addUser(rollNo, studentHash, 'student', name);
    const email = rollNo.toLowerCase() + '@pesu.example';
    await db.execute(
      'INSERT INTO students (user_id, roll_no, name, branch, semester, email) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, rollNo, name, branch, sem, email]
    );
  }

  console.log('Seed complete: 1 admin, 2 faculty, 4 subjects, 10 students.');
  console.log('Logins → admin / Admin@123 · fac1, fac2 / Faculty@123 · <roll no> / Student@123');
  await db.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});