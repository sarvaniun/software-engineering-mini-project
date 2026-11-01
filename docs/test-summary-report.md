# Test Summary Report: Student Record System v1.0

**Test lead:** Upadrasta Naga Sarvani · **Final run:** 01-11-2026 on `main` · **Environment:** Node.js 22, MySQL 8, Chrome, Ubuntu (HTTP :3000 and HTTPS :3443)

## Results

| Type | Planned | Executed | Pass | Partial | Fail |
| --- | --- | --- | --- | --- | --- |
| Functional (TC1–TC15) | 15 | 15 | 13 | 1 (TC11) | 1 (TC12) |
| Security (SEC1–SEC5) | 5 | 5 | 5 | 0 | 0 |
| Non-functional (NF1–NF5) | 5 | 5 | 5 | 0 | 0 |
| Automated (Jest) | 117 | 117 | 117 | 0 | 0 |

Automated tests also run on every pull request via GitHub Actions (CI); branch protection requires a green run and one approval before merging. Detailed results: docs/test-cases.md. Traceability: docs/RTM.md.

## Open defects at v1.0
- **TC12 (SRSF-022 mark sheet): Fail.** GPA was not displayed on the student dashboard.
- **TC11 (SRSF-021 GPA): Partial.** GPA is computed correctly by the API but not displayed on the student dashboard.

## Defects found during reviews (all fixed and re-tested)
- Edit student with an invalid id returned 500 → now 400/404 (#44)
- Clearing an optional field (phone) was not saved (#44)
- Deactivate sent a duplicate request with a literal `${s.id}` → fixed (#45)
- Edit button stopped working after the deactivate fix (regression) → fixed (#45)
- Blank required fields on edit returned 500 → now 400 (#46)
- CI failing due to an out-of-sync package-lock.json → fixed (#51)
- Private key files included in two PRs → removed before merging; merged with squash so they never entered main

## Known limitations
- Deactivated students can still log in (the SRS does not specify this behaviour)
- Roll-number search matches the full roll number only; names match partially
- The marks form requires a value for every student in the class
- The JWT expires 15 minutes after login even for active users (no token refresh; optional per the SRS)
- HTTPS uses a self-signed certificate for local development

## Exit criteria (STP §5)
All planned tests were executed and the RTM is updated. Two functional requirements remain open (SRSF-021 partial, SRSF-022 failed); neither is a security or data-integrity defect. All security and non-functional tests pass.
