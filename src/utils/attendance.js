
function attendancePercent(present, total) {
  if (
    !Number.isInteger(present) ||
    !Number.isInteger(total) ||
    present < 0 ||
    total < 0 ||
    present > total
  ) {
    throw new TypeError('Present and total must be valid non-negative counts');
  }

  if (total === 0) {
    return 0;
  }

  return Number(((present / total) * 100).toFixed(2));
}

module.exports = { attendancePercent };
