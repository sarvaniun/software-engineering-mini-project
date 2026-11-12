# Test Reports: Student Record System v1.0

| Report | File | Summary |
| --- | --- | --- |
| Unit test report | [unit-test-report.txt](unit-test-report.txt) | All Jest unit + API tests, listed by name (`npx jest --verbose`) |
| System validation report | [test-cases.md](test-cases.md), [test-summary-report.md](test-summary-report.md) | 15 functional + 5 security + 5 non-functional system tests, executed 01-11-2026 |
| Code coverage report | [coverage-report.txt](coverage-report.txt), [coverage-html/index.html](coverage-html/index.html) | Statements 79.53% · Functions 78.49% · Lines 79.34% |
| Branch coverage report | same files (% Branch column) | Branches 69.05% |
| Traceability | [RTM.md](RTM.md) | Every SRS requirement → issue → PR → test case |

Coverage measured on 12-11-2026 with `npx jest --coverage --collectCoverageFrom='src/**/*.js'` (backend code under `src/`).
Core logic (authentication, role checks, GPA, attendance, student records) is well covered. Lower coverage is mainly in server startup, the backup scheduler and HTTPS setup, which were validated by the manual system tests instead (TC15, SEC1).
Database calls are mocked in the automated tests so they run in GitHub Actions CI without MySQL; real database behaviour is covered by the system tests.
Frontend pages (public/) are validated by the manual system tests in test-cases.md.
