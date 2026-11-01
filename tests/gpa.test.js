const { gradePoint, calculateGpa } = require('../src/utils/gpa');

describe('gradePoint', () => {
 test.each([
 [100, 10],
 [90, 10],
 [89.99, 9],
 [80, 9],
 [79.99, 8],
 [70, 8],
 [69.99, 7],
 [60, 7],
 [59.99, 6],
 [50, 6],
 [49.99, 5],
 [40, 5],
 [39, 0],
 [0, 0]
 ])('%s out of 100 gives %s points', (marks, expected) => {
 expect(gradePoint(marks)).toBe(expected);
 });

 test('uses percentage when maximum marks is not 100', () => {
 expect(gradePoint(45, 50)).toBe(10);
 expect(gradePoint(40, 50)).toBe(9);
 });

 test('supports numeric strings returned by the database', () => {
 expect(gradePoint('85.00', '100')).toBe(9);
 });

 test('returns zero for invalid maximum marks', () => {
 expect(gradePoint(80, 0)).toBe(0);
 expect(gradePoint(80, -100)).toBe(0);
 expect(gradePoint(80, null)).toBe(0);
 expect(gradePoint(80, 'invalid')).toBe(0);
 expect(gradePoint(80, NaN)).toBe(0);
 expect(gradePoint(80, Infinity)).toBe(0);
 });

 test('returns zero for nonnumeric or nonfinite marks', () => {
 expect(gradePoint('invalid', 100)).toBe(0);
 expect(gradePoint(NaN, 100)).toBe(0);
 expect(gradePoint(Infinity, 100)).toBe(0);
 expect(gradePoint(-Infinity, 100)).toBe(0);
 });

 test('defaults maximum marks to 100 when undefined', () => {
 expect(gradePoint(80, undefined)).toBe(9);
 });
});

describe('calculateGpa', () => {
 test('TC11: reproduces the hand-worked example exactly', () => {
 // SE: 85/100, 4 credits -> 9 points
 // DBMS: 72/100, 4 credits -> 8 points
 // GPA = (9 * 4 + 8 * 4) / 8 = 8.5
 expect(calculateGpa([
 { marks: 85, max_marks: 100, credits: 4 },
 { marks: 72, max_marks: 100, credits: 4 }
 ])).toBe(8.5);
 });

 test('weights subjects by their credits', () => {
 expect(calculateGpa([
 { marks: 90, max_marks: 100, credits: 4 },
 { marks: 70, max_marks: 100, credits: 2 }
 ])).toBe(9.33);
 });

 test('includes failed subject credits in the denominator', () => {
 expect(calculateGpa([
 { marks: 90, max_marks: 100, credits: 4 },
 { marks: 39, max_marks: 100, credits: 4 }
 ])).toBe(5);
 });

 test('returns null when there are no subjects', () => {
 expect(calculateGpa([])).toBeNull();
 });

 test('returns null when total credits are zero', () => {
 expect(calculateGpa([
 { marks: 85, max_marks: 100, credits: 0 }
 ])).toBeNull();
 });

 test('supports numeric database strings', () => {
 expect(calculateGpa([
 { marks: '85.00', max_marks: '100', credits: '4' },
 { marks: '72.00', max_marks: '100', credits: '4' }
 ])).toBe(8.5);
 });

 test('ignores subjects with invalid or nonpositive credits', () => {
 expect(calculateGpa([
 { marks: 90, max_marks: 100, credits: 4 },
 { marks: 40, max_marks: 100, credits: 0 },
 { marks: 40, max_marks: 100, credits: -2 },
 { marks: 40, max_marks: 100, credits: 'invalid' },
 { marks: 40, max_marks: 100, credits: null },
 { marks: 40, max_marks: 100, credits: undefined },
 { marks: 40, max_marks: 100, credits: Infinity }
 ])).toBe(10);
 });

 test('returns null when no subjects have valid positive credits', () => {
 expect(calculateGpa([
 { marks: 85, max_marks: 100, credits: 0 },
 { marks: 72, max_marks: 100, credits: -2 },
 { marks: 90, max_marks: 100, credits: 'invalid' }
 ])).toBeNull();
 });
});
