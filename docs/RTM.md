# Requirements Traceability Matrix (RTM): final

From SRS v1.0 §8, extended with the GitHub issue and pull request that implemented each requirement.
Status: Pass / Fail / Not implemented (see docs/DEVIATIONS.md).

| Req ID | Requirement | Module | Issue | PR | Test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SRSF-001 | Role-based login | Auth | #5, #6 | #39, #41 | TC1 | Pass |
| SRSF-002 | Password masking | Auth | #7 | #41 | TC2 | Pass |
| SRSF-003 | Lock account after failed logins | Auth | #20 | #54 | TC3 | Pass |
| SRSF-004 | Auto logout after inactivity | Auth | #21 | #55 | TC4 | Pass |
| SRSF-010 | Add student record | Records | #10 | #43 | TC5 | Pass |
| SRSF-011 | Edit student record | Records | #11 | #44 | TC6 | Pass |
| SRSF-012 | Deactivate student record | Records | #12 | #45 | TC7 | Pass |
| SRSF-013 | View own profile (student) | Records | #13 | #47 | TC8 | Pass |
| SRSF-014 | Search students | Records | #19 | #62 | TC9 | Pass |
| SRSF-020 | Enter marks | Academics | #15 | #49 | TC10 | Pass |
| SRSF-021 | Calculate GPA | Academics | #25 | #60 | TC11 | Partial |
| SRSF-022 | Generate mark sheet | Academics | #26 | #66 | TC12 | Fail |
| SRSF-023 | Mark attendance | Academics | #14 | #48 | TC13 | Pass |
| SRSF-030 | Branch/class report | Reports | #27 | #57 | TC14 | Pass |
| SRSF-040 | Daily database backup | Reports & Backup | #28 | #56 | TC15 | Pass |
| SRS-NF-001 | Fast search/profile load | Records | #29 | #64 | NF1 | Pass |
| SRS-NF-002 | Stable through a session | System | #30 | #70 | NF2 | Pass |
| SRS-NF-003 | Data privacy by role | Auth/Records | #17 | — | NF3 | Pass |
| SRS-NF-004 | Marks/attendance persisted | Academics | #16 | #50 | NF4 | Pass |
| SRS-NF-005 | Usable on laptop and phone | UI | #31 | #65 | NF5 | Pass |
| SRSSR-001 | HTTPS for data in transit | Security | #23 | #58 | SEC1 | Pass |
| SRSSR-002 | Password hashing | Auth | #8 | #38 | SEC2 | Pass |
| SRSSR-003 | Server-side role check | Security/Auth | #9 | #40 | SEC3 | Pass |
| SRSSR-004 | Track who edited a record | Security | #24 | #63 | SEC4 | Pass |
| SRSSR-005 | Session expires after inactivity | Auth | #22 | #55 | SEC5 | Pass |
