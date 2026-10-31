# Requirements Traceability Matrix (RTM): final

From SRS v1.0 §8, extended with the GitHub issue and pull request that implemented each requirement.
Status: Pass / Fail / Not implemented (see docs/DEVIATIONS.md).

| Req ID | Requirement | Module | Issue | PR | Test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SRSF-001 | Role-based login | Auth | #5, #6 | #39, #41 | TC1 | |
| SRSF-002 | Password masking | Auth | #7 | #41 | TC2 | |
| SRSF-003 | Lock account after failed logins | Auth | #20 | | TC3 | |
| SRSF-004 | Auto logout after inactivity | Auth | #21 | | TC4 | |
| SRSF-010 | Add student record | Records | #10 | #43 | TC5 | |
| SRSF-011 | Edit student record | Records | #11 | #44 | TC6 | |
| SRSF-012 | Deactivate student record | Records | #12 | #45 | TC7 | |
| SRSF-013 | View own profile (student) | Records | #13 | #47 | TC8 | |
| SRSF-014 | Search students | Records | #19 | | TC9 | |
| SRSF-020 | Enter marks | Academics | #15 | #49 | TC10 | |
| SRSF-021 | Calculate GPA | Academics | #25 | | TC11 | |
| SRSF-022 | Generate mark sheet | Academics | #26 | | TC12 | |
| SRSF-023 | Mark attendance | Academics | #14 | #48 | TC13 | |
| SRSF-030 | Branch/class report | Reports | #27 | | TC14 | |
| SRSF-040 | Daily database backup | Reports & Backup | #28 | | TC15 | |
| SRS-NF-001 | Fast search/profile load | Records | #29 | | NF1 | |
| SRS-NF-002 | Stable through a session | System | #30 | | NF2 | |
| SRS-NF-003 | Data privacy by role | Auth/Records | #17 | — | NF3 | |
| SRS-NF-004 | Marks/attendance persisted | Academics | #16 | #50 | NF4 | |
| SRS-NF-005 | Usable on laptop and phone | UI | #31 | | NF5 | |
| SRSSR-001 | HTTPS for data in transit | Security | #23 | | SEC1 | |
| SRSSR-002 | Password hashing | Auth | #8 | #38 | SEC2 | |
| SRSSR-003 | Server-side role check | Security/Auth | #9 | #40 | SEC3 | |
| SRSSR-004 | Track who edited a record | Security | #24 | | SEC4 | |
| SRSSR-005 | Session expires after inactivity | Auth | #22 | | SEC5 | |
