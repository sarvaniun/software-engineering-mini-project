
const db = require('../config/db');
const { attendancePercent } = require('../utils/attendance');

function rowsOf(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return Array.isArray(first) ? first : (first ? [first] : []);
}

async function getBranchReport(branch, semester) {
  const students = rowsOf(await db.query(
    `SELECT
       s.id,
       s.roll_no,
       s.name,
       COALESCE(att.present_count, 0) AS present_count,
       COALESCE(att.total_count, 0) AS total_count,
       COALESCE(m.avg_marks, 0) AS average_marks
     FROM students s
     LEFT JOIN (
       SELECT
         a.student_id,
         SUM(a.present = 1) AS present_count,
         COUNT(*) AS total_count
       FROM attendance a
       JOIN subjects sub ON sub.id = a.subject_id
       WHERE sub.branch = ? AND sub.semester = ?
       GROUP BY a.student_id
     ) att ON att.student_id = s.id
     LEFT JOIN (
       SELECT
         m.student_id,
         AVG(m.marks) AS avg_marks
       FROM marks m
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE sub.branch = ? AND sub.semester = ?
       GROUP BY m.student_id
     ) m ON m.student_id = s.id
     WHERE s.branch = ?
       AND s.semester = ?
       AND s.is_active = 1
     ORDER BY s.roll_no`,
    [branch, semester, branch, semester, branch, semester]
  ));

  const reportStudents = students.map((student) => {
    const present = Number(student.present_count);
    const total = Number(student.total_count);

    return {
      id: student.id,
      roll_no: student.roll_no,
      name: student.name,
      attendance_percentage: attendancePercent(present, total),
      average_marks: Number(Number(student.average_marks).toFixed(2)),
    };
  });

  const count = reportStudents.length;

  const classAverage = count
    ? {
        attendance_percentage: Number((
          reportStudents.reduce((sum, s) => sum + s.attendance_percentage, 0) / count
        ).toFixed(2)),
        average_marks: Number((
          reportStudents.reduce((sum, s) => sum + s.average_marks, 0) / count
        ).toFixed(2)),
      }
    : {
        attendance_percentage: 0,
        average_marks: 0,
      };

  return {
    branch,
    semester,
    total_students: count,
    students: reportStudents,
    class_average: classAverage,
  };
}

module.exports = { getBranchReport };
