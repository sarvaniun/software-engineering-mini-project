function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function gradePoint(marks, maxMarks = 100) {
  const m = toFiniteNumber(marks);
  const max = maxMarks === undefined ? 100 : toFiniteNumber(maxMarks);

  if (Number.isNaN(m) || Number.isNaN(max) || max <= 0) return 0;

  const percentage = (m / max) * 100;

  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  return 0;
}

function calculateGpa(subjects, weights = {}) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;

  let totalPoints = 0;
  let totalWeightedCredits = 0;

  for (const subject of subjects) {
    const credits = toFiniteNumber(subject.credits);
    if (Number.isNaN(credits) || credits <= 0) continue;

    let weight = 1;
    if (weights && subject.id !== undefined && weights[subject.id] !== undefined) {
      const w = toFiniteNumber(weights[subject.id]);
      if (!Number.isNaN(w) && w > 0) weight = w;
    }

    const points = gradePoint(subject.marks, subject.max_marks);
    totalPoints += points * credits * weight;
    totalWeightedCredits += credits * weight;
  }

  if (totalWeightedCredits === 0) return null;

  return Math.round((totalPoints / totalWeightedCredits) * 100) / 100;
}

module.exports = { gradePoint, calculateGpa };