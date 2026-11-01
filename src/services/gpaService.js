// services/gpaService.js
const { getStudentCourses } = require('../models/courseModel'); // Assume this exists

/**
 * Calculate GPA for a student, optionally with course weights
 * @param {string} studentId - Student ID
 * @param {Object} courseWeights - Optional weights for specific courses (e.g., { "MATH101": 1.5 })
 * @returns {Promise<number>} - Calculated GPA
 */
async function calculateGPA(studentId, courseWeights = {}) {
  const courses = await getStudentCourses(studentId);

  if (courses.length === 0) {
    throw new Error('No courses found for student');
  }

  // Convert letter grades to grade points (A=4.0, B=3.0, etc.)
  const gradePoints = courses.map(course => {
    const grade = course.grade.toUpperCase();
    switch (grade) {
      case 'A': return 4.0;
      case 'A-': return 3.7;
      case 'B+': return 3.3;
      case 'B': return 3.0;
      case 'B-': return 2.7;
      case 'C+': return 2.3;
      case 'C': return 2.0;
      default: return 0; // F or invalid grade
    }
  });

  // Apply weights (default to 1.0 if no weight specified)
  const weightedGrades = courses.map((course, index) => {
    const weight = courseWeights[course.id] || 1.0;
    return gradePoints[index] * weight;
  });

  // Calculate weighted average
  const weightedSum = weightedGrades.reduce((sum, grade) => sum + grade, 0);
  const totalWeight = weightedGrades.reduce((sum, grade) => sum + (grade / gradePoints[weightedGrades.indexOf(grade)]), 0);

  return weightedSum / totalWeight;
}
module.exports = { calculateGPA };