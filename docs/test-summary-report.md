# Test Summary Report — Student Record System

**Project:** Student Record System  
**Team:** Team 7  
**Version:** 1.0  
**Report date:** 31 October 2026  
**Test framework:** Jest  
**Environment:** Node.js, Express and MySQL 8.0

## 1. Introduction

This report summarizes the testing evidence available for the Student Record System. It records automated test execution and selected manual verification activities.

The report follows the testing deliverables defined in Section 8 of the Software Test Plan (STP).

## 2. Testing Scope

The STP identifies the following modules for testing:

- Login and role-based access.
- Student record management.
- Attendance management.
- Marks and academic records.
- GPA and mark sheet functionality.
- Branch/class reports.
- Daily database backup.
- Security and session management.
- Performance and usability requirements.

## 3. Automated Test Results

**Command executed:**

`npm test`

**Latest recorded result on the documentation branch:**

| Metric | Result |
|---|---:|
| Test suites passed | 9 |
| Test suites failed | 0 |
| Total tests passed | 61 |
| Total tests failed | 0 |
| Snapshots | 0 |

**Overall automated test result: PASS**

The automated test suites cover authentication, attendance, attendance routes, marks routes, student records, roles, password handling, health checks and user profile functionality.

## 4. Manual Test Execution Evidence

### Test 1: Attendance persistence

**Procedure:**
1. Logged in as faculty.
2. Marked attendance for five CSE students in CS501.
3. Updated an existing attendance record.
4. Verified the records in MySQL.
5. Restarted the Node.js application.
6. Checked the student dashboard.

**Expected result:** Previously saved attendance remains available after an application restart.

**Actual result:** The CS501 attendance record remained visible.

**Status:** PASS

### Test 2: Marks persistence

**Procedure:**
1. Entered marks for five CSE students in CS501.
2. Updated Aarav Sharma's marks from 68 to 69.
3. Verified the value in MySQL.
4. Restarted the Node.js application.
5. Checked the student dashboard.

**Expected result:** Previously saved marks remain available after an application restart.

**Actual result:** The dashboard displayed 69 marks out of 100.

**Status:** PASS

These two manual tests are recorded in `docs/test-execution-log.md`.

## 5. Additional Verification

The following checks were performed during development:

- HTTP health endpoint returned `{"status":"ok"}` on port 3000.
- HTTPS health endpoint returned `{"status":"ok"}` on port 3443 when tested with certificate verification disabled for the local self-signed certificate.
- Branch/class report endpoint automated tests passed on the feature branch for Issue #27.
- Local database backup creation and restoration were manually verified during Issue #28 development.

These results are development verification evidence and should not be interpreted as proof that every planned STP test has passed.

## 6. Test Environment

| Component | Environment |
|---|---|
| Backend | Node.js and Express |
| Database | MySQL 8.0 |
| Frontend | HTML, CSS and JavaScript |
| Automated testing | Jest |
| API testing | Supertest |
| Browser | Google Chrome |
| Operating system | Windows |

## 7. Defects and Limitations

The available execution log records successful attendance and marks persistence checks.

A complete consolidated defect register was not available in the execution evidence reviewed for this report.

The following STP activities still require final confirmation and evidence:

- Account lockout and session timeout testing.
- HTTPS certificate and security validation.
- Edit-traceability verification.
- Performance testing against the two-second requirement.
- Laptop and phone usability testing.
- Full execution of planned test cases and RTM updates.

## 8. Conclusion

The latest recorded automated test execution completed successfully with 61 passing tests across 9 test suites and no automated test failures.

Manual verification also confirmed attendance and marks persistence across a Node.js application restart.

The project has additional development verification evidence for HTTPS, branch/class reports and database backups.

However, the full STP exit criteria cannot yet be declared satisfied until the remaining planned tests, defect status and Requirements Traceability Matrix have been reviewed and updated.

**Report status:** Development test summary — pending final team validation.