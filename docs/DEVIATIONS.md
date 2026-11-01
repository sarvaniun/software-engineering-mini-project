# Deviations from SRS v1.0, SAD v1.0 and STP v1.0

This log records every place where the implementation, or our own documents, differ from what was submitted, and why. Rows marked *(Sprint 2)* will be finalised when that work is done.

## A. Inconsistencies found in the submitted documents

| # | Document & section | What the document says | What we did | Why |
| --- | --- | --- | --- | --- |
| 1 | SRS §4 vs §8 (RTM) | Body uses IDs SRSF-001 / SRSSR-001; RTM uses SRS-F-001 / SRS-SR-001 | Used the body format (SRSF / SRSSR) everywhere: issues, commits, PRs | One consistent ID per requirement for traceability |
| 2 | SRS §4.1 SRSF-002 | Requirement is password masking, but its acceptance criterion says "DB check shows password field is hashed" | TC2 tests masking in the UI; hashing is tested under SRSSR-002 | The criterion belongs to a different requirement |
| 3 | SRS SRSF-004 and SRSSR-005 | Both describe logout after inactivity | SRSF-004 = frontend idle timer; SRSSR-005 = JWT expiry on the server *(Sprint 2)* | Covers both the UI and the security side without duplicate work |
| 4 | SRS RTM vs SAD §3.8 | RTM puts SRSF-040 (backup) in the Records module; SAD puts it in the Reports & Backup Service | Followed the SAD | SAD is the later, design-level document |
| 5 | STP §3 | "Features to be tested" omits SRS-NF-003 and SRS-NF-004 | Both are tested (own backlog items #16, #17) | Both are High priority in the SRS |
| 6 | STP §6 | Defects logged in "a spreadsheet or Jira-style tracker" | GitHub Issues with the `bug` label (e.g. #46) | Keeps defects linked to the code and PRs that fix them |

## B. Differences between the design and the implementation

| # | Document & section | What the document says | What we did | Why |
| --- | --- | --- | --- | --- |
| 7 | SAD §4.3, Fig. 2 | Endpoints `/login`, `/attendance`, `/students/{id}/marks` | All endpoints are under `/api` (e.g. `/api/login`, `/api/attendance`) | Separates the API from the web pages served by the same server |
| 8 | SAD Fig. 2 | Student fetches marks via `GET /students/{id}/marks` | Students use `/api/me/profile`, `/api/me/attendance`, `/api/me/marks`; the student is found from the login token (`req.user.id` → `students.user_id`) | A student can't change an id in the URL to see someone else's data (SRSSR-003, SRS-NF-003) |
| 9 | SAD §4.3 | `POST /attendance` takes `classId` | `classId` = `subjects.id` (one subject for one branch + semester) | The schema has no separate class table |
| 10 | SAD §4.3 | Only `/login` and `/attendance` are specified | Added helper endpoints: `GET /api/whoami`, `GET /api/attendance/subjects`, `/attendance/students`, `/marks/subjects`, `/marks/students`, and student CRUD under `/api/students` | Needed by the dashboards; all protected by login + role checks |
| 11 | SAD §3.3 (layered: routes → services → DB) | Logic lives in the service layer | Attendance & marks logic currently sits in `academics.routes.js` *(to be moved to `academics.service.js` in Sprint 2)* | Implemented quickly in Sprint 1; refactor planned |
| 12 | SAD §3.6 | "bcrypt" for password hashing | `bcryptjs` | Same bcrypt algorithm in pure JavaScript; installs on every OS without build tools |
| 13 | SAD §4.6 (open issues) | ORM vs raw SQL, JWT expiry, AuditLog schema, backup location undecided | Raw SQL via `mysql2`; JWT expiry 15 min; `audit_log` table in the schema; backups written to the `backups/` directory daily at 02:00 (`scripts/backup.js`, `src/server.js`) | Decided during Sprint 0/1 |
| 14 | SRS (no requirement) | No requirement for managing subjects or assigning faculty to subjects | Subjects and faculty–subject links are created by `db/seed.js`; no UI | Needed by SRSF-020/023, but outside the SRS scope |
| 15 | SRS / SAD (not specified) | Where the browser keeps the login token | `sessionStorage` (cleared when the tab closes) | A forgotten tab on a shared computer doesn't stay logged in |

## C. Process / backlog

| # | Document & section | What the document says | What we did | Why |
| --- | --- | --- | --- | --- |
| 16 | Backlog vs SRS | SRS lists only functional/non-functional requirements | Added SETUP, TEST, DEMO and DOC items; split SRSF-001 into API (#5) and UI (#6) | Real project work not covered by requirements; keeps items at most 5 points |
| 17 | Sprint plan | Sprint 0 (dry run) items planned for 12–16 Oct | Unfinished Sprint 0 items moved into Sprint 1 on 19 Oct | Honest carry-over; allowed backlog change on 19 Oct |

## D. To be filled in during Sprint 2
- SRSF-003 lockout: SRS says "a few minutes"; actual duration chosen
- SRSF-021 GPA: grading scale (not defined in the SRS)
- SRSSR-001 HTTPS: how it was achieved (local certificate or hosting)
- SRSF-040 backup: confirm the `backups/` location and 02:00 schedule meet the SRS wording
