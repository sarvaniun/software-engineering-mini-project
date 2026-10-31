# Project Deviations Log — Student Record System

**Project:** Student Record System  
**Team:** Team 7  
**Purpose:** Record differences between the original SRS, SAD and STP documents and the implemented system.

## 1. Database Access

**Original design:** The SAD listed the choice between an ORM and raw SQL as an open design decision.

**Final implementation:** The application uses MySQL through the existing database access layer and SQL queries.

**Reason:** This approach was used to keep database operations consistent with the existing project implementation.

## 2. Database Backup Storage

**Original design:** The SAD listed the backup storage location (local disk or cloud) as an open decision.

**Final implementation:** Database backup files are stored locally in the `backups/` directory.

**Reason:** Local storage provides a straightforward way to create and verify database backup files for the project.

## 3. Daily Backup Scheduling

**Original requirement:** The SRS requires the database to be backed up at least once a day.

**Final implementation:** The application schedules a daily backup at 2:00 AM while the server process is running.

**Reason:** The scheduler automates backup creation without requiring a manual command every day.

**Limitation:** The application server must remain running for the scheduled backup to execute.

## 4. HTTPS Certificate

**Original requirement:** The SRS requires HTTPS communication between the browser and server.

**Final implementation:** The project supports a local HTTPS server using a self-signed certificate, alongside the existing HTTP development server.

**Reason:** A self-signed certificate allows HTTPS functionality to be tested locally without purchasing a certificate.

**Limitation:** Browsers do not automatically trust the self-signed certificate. A trusted certificate is required for a production deployment.

## 5. Testing Approach

**Original plan:** The STP describes unit, integration, system and acceptance testing, and mentions browser developer tools and Postman as testing tools.

**Final implementation:** Automated tests are executed using Jest, with additional manual checks of application functionality and database persistence.

**Reason:** Automated tests support repeatable verification of application behaviour, while manual checks help validate complete user workflows.

## 6. Items Requiring Further Confirmation

The following items should be confirmed against the final implementation before this log is considered complete:

- Whether the detailed audit-trail requirements are fully implemented.
- Whether all planned security and session-expiry tests have been executed.
- Whether the final application has been tested on both laptop and mobile browsers.
- Whether the production deployment will use a trusted HTTPS certificate.

## 7. Conclusion

The implementation resolves several design decisions that were left open in the original architecture document. The differences and limitations listed above should be considered during final project evaluation and deployment.