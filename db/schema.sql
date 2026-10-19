-- Student Record System: database schema (SAD §3.3 Data Layer)
-- Re-runnable: drops and recreates all tables (wipes local data!)

CREATE DATABASE IF NOT EXISTS student_records;
USE student_records;

DROP TABLE IF EXISTS audit_log, marks, attendance, faculty_subjects, subjects, students, users;

-- Login accounts for all three roles (SRSF-001, SRSF-003 lockout fields, SRSSR-002 hashes only)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('student','faculty','admin') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student records (SRSF-010 unique roll no, SRSF-012 deactivate, SRS-NF-001 indexes)
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  branch VARCHAR(50) NOT NULL,
  semester TINYINT NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_branch_sem (branch, semester)
);

-- Subjects; a "class" in the SAD = one subject for one branch + semester
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  credits TINYINT NOT NULL DEFAULT 4,
  branch VARCHAR(50) NOT NULL,
  semester TINYINT NOT NULL,
  max_marks INT NOT NULL DEFAULT 100
);

-- Which faculty teaches which subject (SRSF-020: "subjects they teach")
CREATE TABLE faculty_subjects (
  faculty_id INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (faculty_id, subject_id),
  FOREIGN KEY (faculty_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- One row per student per subject per day (SRSF-023)
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_date DATE NOT NULL,
  present TINYINT(1) NOT NULL,
  marked_by INT NOT NULL,
  UNIQUE KEY uq_attendance (student_id, subject_id, class_date),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- One marks row per student per subject (SRSF-020, SRSF-021 GPA)
CREATE TABLE marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  entered_by INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_marks (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (entered_by) REFERENCES users(id)
);

-- Who changed what (SRSSR-004)
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);