
# Student Record System

![CI](https://github.com/sarvaniun/software-engineering-mini-project/actions/workflows/ci.yml/badge.svg)


Team 7 · Software Engineering Mini-Project · PES University

A web application for one college to manage student records, attendance and marks. Students can view their own profile, attendance, marks and mark sheet. Faculty can mark attendance and enter marks. Admins can manage student records and view reports.


## Team

| Name | SRN | Module |
|---|---|---|
| Upadrasta Naga Sarvani | PES2UG24CS567 | Auth & Security, Test Lead |
| Vinaayak G Dasika | PES2UG24CS588 | Student Records |
| Yaseen Mulla | PES2UG24CS607 | Database, Attendance & Marks |
| Eshwar B H | PES2UG25CS808 | Setup/CI, UI, Reports & Backup, Docs |

## Documents

- Software Requirements Specification (SRS) v1.0
- Software Architecture & Design Specification (SAD) v1.0
- Software Test Plan (STP) v1.0
- Sprint 1 demo video: demo/sprint1_demo_video.mp4

## Tech Stack

- **Backend:** Node.js and Express
- **Database:** MySQL
- **Authentication:** JWT and bcrypt
- **Frontend:** HTML, CSS and JavaScript
- **Testing:** Jest
- **CI:** GitHub Actions

## Prerequisites

Install the following software before running the project:

- Node.js 22
- Git
- MySQL 8.0 or a compatible MySQL server
- MySQL Workbench (recommended)
- Visual Studio Code (recommended)

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/sarvaniun/software-engineering-mini-project.git
cd software-engineering-mini-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file to `.env`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Open `.env` and configure it with your local MySQL credentials and a private JWT secret.

Example configuration:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_LOCAL_MYSQL_PASSWORD
DB_NAME=student_records
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=15m
```

Replace the placeholder values with your own local configuration. Do not share your `.env` file or commit it to GitHub.

### 4. Create the database tables

Make sure your local MySQL server is running.

**Windows (MySQL Command Line Client):**

Connect to your local MySQL server and execute:

```sql
source C:/path/to/software-engineering-mini-project/db/schema.sql
```

Replace the example path with the actual location of the cloned repository.

**Linux/macOS:**

Run the following command from the project root, replacing `<user>` with your local MySQL username:

```bash
mysql -u <user> -p < db/schema.sql
```

The schema creates the `student_records` database and its required tables.

**Warning:** The schema script drops and recreates the project tables. Running it again will erase data stored in those tables. Use it only with your local development database.

### 5. Insert sample data

Return to the project directory in your VS Code terminal and run:

```bash
npm run seed
```

The seed script adds:

- 1 admin account
- 2 faculty accounts
- 10 student accounts across 2 branches and 2 semesters
- 4 subjects and their faculty assignments

The seed script clears existing rows in the project tables before inserting the sample data. Do not run it again unnecessarily if you need to preserve data you have entered.

### 6. Start the application

```bash
npm start
```

The server is configured to use port `3000` by default.

Check the health endpoint in your browser:

http://localhost:3000/api/health

The expected response is:

```json
{"status":"ok"}
```

Keep the terminal running while using the application.

## Local Seed Accounts

The following credentials are for local development and testing only.

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Faculty | `fac1` | `Faculty@123` |
| Faculty | `fac2` | `Faculty@123` |
| Student | `PES2UG24CS001` | `Student@123` |
| Student | `PES2UG24CS002` | `Student@123` |
| Student | `PES2UG24CS003` | `Student@123` |
| Student | `PES2UG24CS004` | `Student@123` |
| Student | `PES2UG24CS005` | `Student@123` |
| Student | `PES2UG25EC001` | `Student@123` |
| Student | `PES2UG25EC002` | `Student@123` |
| Student | `PES2UG25EC003` | `Student@123` |
| Student | `PES2UG25EC004` | `Student@123` |
| Student | `PES2UG25EC005` | `Student@123` |

All seeded accounts use the passwords specified above, stored in the database as bcrypt hashes rather than plain-text passwords.

These are publicly visible development credentials. Never use them in production or with real student information.

## Available Commands

| Command | Purpose |
|---|---|
| `npm start` | Start the application |
| `npm run dev` | Start the application in development mode |
| `npm test` | Run the Jest test suite |
| `npm run seed` | Populate the local database with sample data |
| `npm run backup` | Run the database backup script |

## How We Work

- Backlog and sprints are tracked in the GitHub Project linked to this repository.
- Use one branch per issue, for example `feature/12-login-api`.
- Make meaningful commits that reference the issue being worked on.
- Every change must go through a pull request that includes `Closes #<issue-number>`.
- Add the designated reviewer to the pull request.
- Team members must not approve their own pull requests.
- Pull requests are reviewed and merged by the repository owner after the required checks pass.
- Move project-board cards through Todo, In Progress and In Review as work progresses.

## Security Notes

- Never commit `.env`, database passwords, JWT secrets or other private credentials.
- Passwords must be stored as bcrypt hashes, not plain text.
- Server-side authorization must protect student, faculty and admin data.
- Use sample data for local development and testing.
- The sample credentials in this README must not be used in production.

## Scope

The system covers student record management, role-based access, attendance, marks, GPA calculation, mark sheet generation, basic reports and database backup.

Fee payment, hostel allocation, library management and multi-institution support are outside the scope of this project.
## Local HTTPS Setup (Issue #23)

The Student Record System supports both HTTP and HTTPS for local development.

### Requirements
- Node.js and npm
- OpenSSL

### Generate a local self-signed certificate

Run these commands from the project root:

```powershell
New-Item -ItemType Directory -Force certs

openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.crt -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

### Start the application

```powershell
npm start
```

The application starts on:
- HTTP: http://localhost:3000
- HTTPS: https://localhost:3443

### Verify HTTPS

```powershell
curl.exe -k https://localhost:3443/api/health
```

Expected response:

```json
{"status":"ok"}
```

The `-k` option is used only for local testing with a self-signed certificate.

### Certificate security

The certificate and private key are generated locally and must not be committed to GitHub. The `certs/*.key` and `certs/*.crt` files are excluded through `.gitignore`.

**Note:** Browsers may show a certificate authority warning because the local certificate is self-signed. This is expected for local development.