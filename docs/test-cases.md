# Test Cases: Student Record System v1.0

Based on the Software Test Plan v1.0 (§5) and the RTM in SRS §8.
Test data: run `db/schema.sql` once, then `npm run seed` (admin/Admin@123 · fac1, fac2/Faculty@123 · roll no/Student@123).
Environment: local Node.js 22 + MySQL 8, Chrome. Automated tests: `npm test` (Jest), also run by GitHub Actions CI on every PR.

## Functional test cases

| TC | Requirement | Steps | Expected result | Actual result | Status | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC1 | SRSF-001 Role-based login | Log in as admin, fac1 and PES2UG24CS001 | Each lands only on their own dashboard | As expected | Pass | Sarvani | 01-11-2026 |
| TC2 | SRSF-002 Password masking | Type in the password field; click Show, then Hide | Masked by default; Show reveals, Hide masks again | As expected | Pass | Sarvani | 01-11-2026 |
| TC3 | SRSF-003 Account lockout | Enter a wrong password 3× for PES2UG24CS001, then the correct one | 4th attempt shows "Account locked…" (HTTP 423); admin login unaffected | As expected | Pass | Sarvani | 01-11-2026 |
| TC4 | SRSF-004 Auto logout | Set SESSION_TIMEOUT_MINUTES = 1, log in, stay idle 1 min | Redirected to login with "session expired" message | As expected | Pass | Sarvani | 31-10-2026 |
| TC5 | SRSF-010 Add student | Admin adds PES2UG24CS099; adds the same roll no again; log in as the new student | Appears in list; duplicate gives a clear error (409); new student can log in | As expected | Pass | Sarvani | 01-11-2026 |
| TC6 | SRSF-011 Edit student | Edit a student's name, clear the phone, save; then clear the name and save | Changes shown; empty required field gives a clear error (not 500) | As expected | Pass | Sarvani | 01-11-2026 |
| TC7 | SRSF-012 Deactivate student | Deactivate a student; tick "Show inactive"; check MySQL | Hidden from list; row kept with is_active = 0; visible with toggle | As expected | Pass | Sarvani | 01-11-2026 |
| TC8 | SRSF-013 View own record | Log in as PES2UG24CS001, then PES2UG24CS002 | Each sees only their own profile, attendance and marks | As expected | Pass | Sarvani | 01-11-2026 |
| TC9 | SRSF-014 Search students | Search by exact roll no, part of a name, branch + semester | Correct matching records only | As expected | Pass | Sarvani | 01-11-2026 |
| TC10 | SRSF-020 Enter marks | fac1 enters CS501 marks; tries 150 and -5; tries CS502 (fac2's) from the console | Saved and shown to the student; invalid values rejected; other faculty's subject blocked (403) | As expected | Pass | Sarvani | 01-11-2026 |
| TC11 | SRSF-021 GPA | Student with SE 85/100 (4 cr) and DBMS 72/100 (4 cr) | GPA 8.5 shown to the student | API returns the correct GPA (8.5; also covered by Jest tests), but it is not displayed on the student dashboard | Partial | Sarvani | 01-11-2026 |
| TC12 | SRSF-022 Mark sheet | Open the mark sheet; Print → Save as PDF | GPA was missing | | Fail | Sarvani | 01-11-2026 |
| TC13 | SRSF-023 Attendance | fac1 marks CS501 attendance; re-marks the same date with a change | Saved, % updates; no duplicate rows in MySQL | As expected | Pass | Sarvani | 01-11-2026 |
| TC14 | SRSF-030 Branch report | Admin opens report for CSE, semester 5 | Per-student attendance % and average marks match individual records | As expected | Pass | Sarvani | 01-11-2026 |
| TC15 | SRSF-040 Daily backup | `npm run backup`; deactivate a student; restore the backup | Backup file created; restore brings the data back | As expected | Pass | Sarvani | 01-11-2026 |

## Security test cases (STP §5.1)

| TC | Requirement | Steps | Expected result | Actual result | Status | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC1 | SRSSR-001 HTTPS | Open https://localhost:3443 and log in | Page and API calls served over HTTPS | As expected | Pass | Sarvani | 01-11-2026 |
| SEC2 | SRSSR-002 Password hashing | `SELECT username, LEFT(password_hash, 7) FROM users;` | Only bcrypt hashes ($2a$/$2b$), no plain passwords | As expected | Pass | Sarvani | 01-11-2026 |
| SEC3 | SRSSR-003 Server-side role check | Student opens /admin.html; student calls GET /api/students/2; admin calls GET /api/me/profile; fac1 posts marks for CS502 | Redirected; 403; 403; 403 | As expected | Pass | Sarvani | 01-11-2026 |
| SEC4 | SRSSR-004 Edit traceability | Edit a student, then check audit_log and the edit form | audit_log row with the admin's id; "last edited by" shown | As expected | Pass | Sarvani | 01-11-2026 |
| SEC5 | SRSSR-005 Session expiry | Jest: expired token → /api/whoami; browser idle test (TC4) | 401 TOKEN_EXPIRED; redirected to login | As expected | Pass | Sarvani | 01-11-2026 |

## Non-functional test cases

| TC | Requirement | Steps | Expected result | Actual result | Status | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NF1 | SRS-NF-001 Performance | With 200+ students, time the student list, a search and a profile (DevTools → Network) | Each under 2 s | As expected | Pass | Sarvani | 01-11-2026 |
| NF2 | SRS-NF-002 Stability | 10-minute run through all features; send invalid JSON to /api/login | No crash; invalid JSON gives 400 | As expected | Pass | Sarvani | 01-11-2026 |
| NF3 | SRS-NF-003 Privacy by role | SEC3 + results from #17 | No data visible outside the user's role | As expected | Pass | Sarvani | 01-11-2026 |
| NF4 | SRS-NF-004 Persistence | Enter attendance + marks, restart the server | Data still there | As expected | Pass | Sarvani | 01-11-2026 |
| NF5 | SRS-NF-005 Usability | Check all pages at 375, 768 and 1366 px (DevTools device toolbar) | Usable, no broken layout | As expected | Pass | Sarvani | 01-11-2026 |

## Automated tests

| Run | Command | Result | Date |
| --- | --- | --- | --- |
| Local | `npm test` | 16 suites, 117 tests passed | 01-11-2026 |
| CI | GitHub Actions on `main` | Green on all merged PRs | 01-11-2026 |
