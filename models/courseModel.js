// Mock database model for courses
class CourseModel {
  static async getStudentCourses(studentId) {
    // Mock data - replace with real DB calls
    const mockCourses = {
      '123': [
        { id: 'MATH101', marks: 85, max_marks: 100, credits: 4 },
        { id: 'ENG101', marks: 72, max_marks: 100, credits: 4 },
        { id: 'PHYS101', marks: 90, max_marks: 100, credits: 3 },
      ],
      '456': [
        { id: 'CS101', marks: 88, max_marks: 100, credits: 3 },
        { id: 'HIST101', marks: 65, max_marks: 100, credits: 2 },
      ],
    };
    return mockCourses[studentId] || [];
  }

  static async getCourseWeights(studentId) {
    // Mock weights - replace with real DB calls
    const mockWeights = {
      '123': { 'MATH101': 1.5, 'ENG101': 1.0, 'PHYS101': 0.8 },
      '456': { 'CS101': 1.2, 'HIST101': 1.0 },
    };
    return mockWeights[studentId] || {};
  }
}

module.exports = CourseModel;