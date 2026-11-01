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
    expect(gradePoint(45, 50)).toBe(10); // 90% -> 10
    expect(gradePoint(40, 50)).toBe(9);  // 80% -> 9
    expect(gradePoint(35, 50)).toBe(8);  // 70% -> 8
    expect(gradePoint(19, 50)).toBe(0);  // 38% -> 0
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
    // 85 -> 9 (4 cr), 72 -> 8 (4 cr)
    // (9*4 + 8*4) / 8 = 68 / 8 = 8.5
    expect(calculateGpa([
      { marks: 85, max_marks: 100, credits: 4 },
      { marks: 72, max_marks: 100, credits: 4 }
    ])).toBe(8.5);
  });

  test('weights subjects by their credits', () => {
    // 90 -> 10 (4 cr), 70 -> 8 (2 cr)
    // (40 + 16) / 6 = 9.333 -> 9.33
    expect(calculateGpa([
      { marks: 90, max_marks: 100, credits: 4 },
      { marks: 70, max_marks: 100, credits: 2 }
    ])).toBe(9.33);
  });

  test('includes failed subject credits in the denominator', () => {
    // 90 -> 10 (4 cr), 39 -> 0 (4 cr)
    // (40 + 0) / 8 = 5
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
    // Only valid subject: 90 -> 10 (4 cr) => 10
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

describe('calculateGpa with weights', () => {
  test('applies weights to subjects correctly', () => {
    // MATH101: 90 -> 10, 4 cr, weight 1.5 => 60 pts / 6 wcr
    // ENG101:  80 -> 9,  3 cr, weight 1   => 27 pts / 3 wcr
    // 87 / 9 = 9.666 -> 9.67
    const subjects = [
      { id: 'MATH101', marks: 90, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 80, max_marks: 100, credits: 3 }
    ];
    const weights = { MATH101: 1.5 };
    expect(calculateGpa(subjects, weights)).toBeCloseTo(9.67, 2);
  });

  test('defaults to no weights if weights object is empty', () => {
    // 90 -> 10 (4 cr), 80 -> 9 (3 cr)
    // (40 + 27) / 7 = 9.571 -> 9.57
    const subjects = [
      { id: 'MATH101', marks: 90, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 80, max_marks: 100, credits: 3 }
    ];
    expect(calculateGpa(subjects, {})).toBe(9.57);
  });

  test('defaults to no weights when weights argument is omitted', () => {
    const subjects = [
      { id: 'MATH101', marks: 90, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 80, max_marks: 100, credits: 3 }
    ];
    expect(calculateGpa(subjects)).toBe(9.57);
  });

  test('ignores weights for subject ids that are not present', () => {
    const subjects = [
      { id: 'MATH101', marks: 90, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 80, max_marks: 100, credits: 3 }
    ];
    expect(calculateGpa(subjects, { PHY101: 2 })).toBe(9.57);
  });

  test('ignores invalid or nonpositive weights (treated as 1)', () => {
    const subjects = [
      { id: 'MATH101', marks: 90, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 80, max_marks: 100, credits: 3 }
    ];
    expect(calculateGpa(subjects, { MATH101: 0 })).toBe(9.57);
    expect(calculateGpa(subjects, { MATH101: -1 })).toBe(9.57);
    expect(calculateGpa(subjects, { MATH101: 'abc' })).toBe(9.57);
  });

  test('weighted failed subject still counts in the denominator', () => {
    // MATH101: 39 -> 0, 4 cr, weight 2 => 0 / 8
    // ENG101:  90 -> 10, 4 cr, weight 1 => 40 / 4
    // 40 / 12 = 3.333 -> 3.33
    const subjects = [
      { id: 'MATH101', marks: 39, max_marks: 100, credits: 4 },
      { id: 'ENG101', marks: 90, max_marks: 100, credits: 4 }
    ];
    expect(calculateGpa(subjects, { MATH101: 2 })).toBe(3.33);
  });
});