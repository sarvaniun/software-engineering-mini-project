
// Writes a readable test + coverage summary for GitHub Actions.
// Usage: node scripts/test-summary.js test-results.json coverage/coverage-summary.json
// In GitHub Actions it appends to the run's Summary page ($GITHUB_STEP_SUMMARY);
// locally it just prints to the terminal.
const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2] || 'test-results.json';
const coverageFile = process.argv[3] || 'coverage/coverage-summary.json';

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

const results = readJson(resultsFile);
const coverage = readJson(coverageFile);
const lines = [];

if (!results) {
  lines.push('## ❌ Test results not found', '', `Could not read \`${resultsFile}\`.`);
} else {
  const ok = results.success;
  lines.push(`## ${ok ? '✅' : '❌'} Unit & API test summary`, '');
  lines.push('| | Total | Passed | Failed | Skipped |', '| --- | --- | --- | --- | --- |');
  lines.push(`| **Test suites** | ${results.numTotalTestSuites} | ${results.numPassedTestSuites} | ${results.numFailedTestSuites} | ${results.numPendingTestSuites} |`);
  lines.push(`| **Tests** | ${results.numTotalTests} | ${results.numPassedTests} | ${results.numFailedTests} | ${results.numPendingTests} |`);
  lines.push('');

  lines.push('### Results per test file', '', '| File | Tests | Passed | Failed | Status |', '| --- | --- | --- | --- | --- |');
  for (const suite of results.testResults) {
    const name = path.relative(process.cwd(), suite.name) || suite.name;
    const tests = suite.assertionResults || [];
    const passed = tests.filter((t) => t.status === 'passed').length;
    const failed = tests.filter((t) => t.status === 'failed').length;
    lines.push(`| \`${name}\` | ${tests.length} | ${passed} | ${failed} | ${failed || suite.status === 'failed' ? '❌' : '✅'} |`);
  }
  lines.push('');

  lines.push('<details><summary><b>Every test case</b> (click to expand)</summary>', '');
  for (const suite of results.testResults) {
    lines.push(`**${path.relative(process.cwd(), suite.name) || suite.name}**`, '');
    for (const t of suite.assertionResults || []) {
      const icon = t.status === 'passed' ? '✅' : t.status === 'failed' ? '❌' : '⏭️';
      lines.push(`- ${icon} ${t.fullName}`);
    }
    lines.push('');
  }
  lines.push('</details>', '');

  const failures = [];
  for (const suite of results.testResults) {
    for (const t of suite.assertionResults || []) {
      if (t.status === 'failed') failures.push(`- ❌ **${t.fullName}**`);
    }
  }
  if (failures.length) lines.push('### Failed tests', '', ...failures, '');
}

if (coverage && coverage.total) {
  const c = coverage.total;
  const row = (label, m) => `| ${label} | ${m.pct}% | ${m.covered} / ${m.total} |`;
  lines.push('## 📊 Code coverage', '', '| Metric | Coverage | Covered / Total |', '| --- | --- | --- |');
  lines.push(row('Statements', c.statements), row('Branches', c.branches), row('Functions', c.functions), row('Lines', c.lines), '');
}

const output = lines.join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
console.log(output);
