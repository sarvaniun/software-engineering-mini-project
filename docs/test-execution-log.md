
# Test Execution Log

**Project:** Student Record System  
**Issue:** #16 — Marks and Attendance Persistence  
**Test date:** 2026-10-21  
**Environment:** Node.js, Express and MySQL 8.0

## Test 1: Attendance persistence after application restart

**Steps performed:**
1. Logged in as faculty and marked attendance for five CSE students in CS501.
2. Saved the attendance records to MySQL.
3. Changed an existing attendance record and saved it again.
4. Queried the database and confirmed that five records existed for the selected subject and date.
5. Restarted the Node.js application server.
6. Logged in as student Aarav Sharma and checked the Student Dashboard.

**Expected result:** Previously saved attendance remains available after the application server restarts.

**Actual result:** The CS501 attendance record remained visible. The dashboard showed 1 total session, 0 sessions attended and 0% attendance for Aarav.

**Status:** PASS

## Test 2: Marks persistence after application restart

**Steps performed:**
1. Logged in as faculty and entered marks for five CSE students in CS501.
2. Saved the marks to MySQL.
3. Changed Aarav Sharma's marks from 68 to 69 and saved again.
4. Queried MySQL and confirmed that Aarav had one CS501 marks record with 69.00.
5. Restarted the Node.js application server.
6. Logged in as Aarav Sharma and checked the Student Dashboard.

**Expected result:** Previously saved marks remain available after the application server restarts.

**Actual result:** The Student Dashboard displayed CS501 with 69 marks out of 100 after the restart.

**Status:** PASS

## Test 3: Automated application tests

**Command:** `npm test`

**Result:** 61 tests passed across 9 test suites.

**Status:** PASS

## Test 4: Profile load and search performance (SRS-NF-001, #29)

**Steps performed:**
1. Created the schema from `db/schema.sql` on MySQL 8.0.40, loaded the base data with `db/seed.js`, then ran `node scripts/seed-many.js` to add 200 students (210 in total).
2. Checked the indexes on `students`: `roll_no` (UNIQUE), `idx_name` and `idx_branch_sem`.
3. Started the application from a local build with the search (#19) and audit (#24) changes merged, since neither is on `main` yet.
4. Opened each page in headless Google Chrome, logged in with a seed account, and read the response time of each request from Chrome's network log. Ran three times; median and max are shown.

**Expected result:** Each check completes in under 2 seconds.

| Check | Records | Time (median / max) | Pass (< 2 s)? |
| --- | --- | --- | --- |
| Admin student list (`GET /api/students`) | 210 | 3 ms / 4 ms | ✓ |
| Admin search, `q=ar` | 3 | 4 ms / 5 ms | ✓ |
| Faculty search, exact roll no `PES2UG24CS150` | 1 | 4 ms / 4 ms | ✓ |
| Faculty search, branch ECE and text `Test` | 100 | 6 ms / 6 ms | ✓ |
| Student profile (`GET /api/me/profile`) | 1 | 2 ms / 2 ms | ✓ |

**Actual result:** All five checks completed in 6 ms or less.

**Status:** PASS

**Limits:** The times are API response times as Chrome's network log records them, not DevTools readings taken by hand, and they do not include page paint. MySQL was a local 8.0.40 instance on the same machine as the app, so latency on the team's own MySQL setup may differ.

## Notes

- The MySQL server remained running during the application-server restart test.
- These checks verify persistence across a Node.js application restart; they do not verify a MySQL server restart.
- Manual database queries and Student Dashboard screenshots were used to verify the saved records.
