// Adds 200 extra students so the performance check (SRS-NF-001, #29) runs on a realistic size. Run after npm run seed.
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'student_records',
  });

  const rows = [];
  for (let i = 100; i < 300; i++) {
    rows.push([`PES2UG24CS${i}`, `Test Student ${i}`, i % 2 ? 'CSE' : 'ECE', i % 2 ? 5 : 3]);
  }

  await db.query('INSERT IGNORE INTO students (roll_no, name, branch, semester) VALUES ?', [rows]);
  console.log('Added', rows.length, 'students');
  await db.end();
})();
