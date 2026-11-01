function gradePoint(marks, maxMarks = 100) {
 const numericMarks = Number(marks);
 const numericMaxMarks = Number(maxMarks);

 if (
 !Number.isFinite(numericMarks) ||
 !Number.isFinite(numericMaxMarks) ||
 numericMaxMarks <= 0
 ) {
 return 0;
 }

 const percentage = (numericMarks / numericMaxMarks) * 100;

 if (percentage >= 90) return 10;
 if (percentage >= 80) return 9;
 if (percentage >= 70) return 8;
 if (percentage >= 60) return 7;
 if (percentage >= 50) return 6;
 if (percentage >= 40) return 5;

 return 0;
}

function calculateGpa(subjects) {
 const validSubjects = subjects.filter((subject) => {
 const credits = Number(subject.credits);

 return Number.isFinite(credits) && credits > 0;
 });

 const totalCredits = validSubjects.reduce(
 (sum, subject) => sum + Number(subject.credits),
 0
 );

 if (totalCredits === 0) {
 return null;
 }

 const weightedPoints = validSubjects.reduce(
 (sum, subject) =>
 sum +
 gradePoint(subject.marks, subject.max_marks) *
 Number(subject.credits),
 0
 );

 return Math.round((weightedPoints / totalCredits) * 100) / 100;
}

module.exports = { gradePoint, calculateGpa };
