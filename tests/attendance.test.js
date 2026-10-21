
const { attendancePercent } = require('../src/utils/attendance');

describe('attendancePercent', () => {
  test('calculates the attendance percentage correctly', () => {
    expect(attendancePercent(3, 4)).toBe(75);
    expect(attendancePercent(8, 10)).toBe(80);
  });

  test('returns zero when no classes have been attended', () => {
    expect(attendancePercent(0, 10)).toBe(0);
  });

  test('returns zero when no classes have taken place', () => {
    expect(attendancePercent(0, 0)).toBe(0);
  });

  test('rounds percentages to two decimal places', () => {
    expect(attendancePercent(2, 3)).toBe(66.67);
  });

  test('rejects invalid attendance counts', () => {
    expect(() => attendancePercent(-1, 5)).toThrow(TypeError);
    expect(() => attendancePercent(6, 5)).toThrow(TypeError);
    expect(() => attendancePercent(1.5, 5)).toThrow(TypeError);
  });
});
