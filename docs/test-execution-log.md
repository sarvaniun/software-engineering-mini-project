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

## Notes

- The MySQL server remained running during the application-server restart test.
- These checks verify persistence across a Node.js application restart; they do not verify a MySQL server restart.
- Manual database queries and Student Dashboard screenshots were used to verify the saved records.

---

# Test Execution Log — Issue #30 (SRS-NF-002: Stable through a full demo session)

**Test date:** ____-__-__  
**Tester:** ________  
**Environment:** Node.js, Express and MySQL 8.0

## Test 4: Bad input does not crash the server

**Steps performed:**
1. Sent a malformed JSON body to `POST /api/login`.
2. Sent a request to an unknown endpoint `/api/whatever` with a valid token.
3. Called `GET /api/health` afterwards.

**Expected result:** 400 `INVALID_JSON`, then 404 `NOT_FOUND`, both as `{ status, errorCode, message }`; the server stays up and `/api/health` returns `{ status: "ok" }`.

**Actual result:** ________

**Status:** ________

## Test 5: 10-minute demo run

**Steps performed:**
1. Started the server with `npm start`.
2. For 10 minutes, used every feature as admin, faculty and student: login/logout, student records CRUD, attendance, marks, reports, backup, and a few deliberately wrong inputs.
3. Watched the server console for crashes and checked that no password or token appeared in the logs.

**Expected result:** The server runs for the full 10 minutes without crashing or restarting.

**Actual result:** 10-min run, no crash, ____-__-__

**Status:** ________

## Test 6: Automated application tests

**Command:** `npm test`

**Result:** 80 tests passed across 13 test suites (includes `tests/stability.test.js`).

**Status:** PASS