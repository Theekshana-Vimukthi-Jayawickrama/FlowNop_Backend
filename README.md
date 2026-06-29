# TaskFlow - Backend REST API Server

This is the backend server application for TaskFlow, built using Node.js, Express, Mongoose ODM, and TypeScript.

---

## Table of Contents
1. Core Features
2. Tech Stack and Key Libraries
3. Folder Structure
4. Setup and Installation
5. Environment Variables
6. Database Seeding and Seeding Accounts
7. Running the Server
8. REST API Endpoints Reference
9. Email Configuration Modes (Brevo)

---

## Core Features
- <b>RESTful Task Actions</b>: Route logic for creation, assignment, progress tracking, and approval checks.
- <b>Role Validation Middleware</b>: Route guards distinguishing Super Admin, Admin, and Standard User scopes.
- <b>JWT Authentication</b>: Access token and refresh token rotation pairs with bcrypt password hashing.
- <b>User Locking Mechanics</b>: Accounts can be deactivated, preventing logins and logging reactivation appeal requests.
- <b>Brevo Mailing Clients</b>: Unified email notifier supporting SMTP Relay mode and HTTP REST API mode.

---

## Tech Stack and Key Libraries
- <b>Core Platform</b>: Node.js + TypeScript 5
- <b>Web Framework</b>: Express.js
- <b>Database</b>: MongoDB + Mongoose ODM
- <b>Security</b>: jsonwebtoken + bcryptjs
- <b>Emailing</b>: nodemailer

---

## Folder Structure
```text
backend/
├── src/
│   ├── config/       # Environment loading and database connections setup
│   ├── controllers/  # API request router handlers
│   ├── middleware/   # JWT validations, error handlers, role checks
│   ├── models/       # MongoDB schemas and Mongoose validation setups
│   ├── routes/       # Endpoint route mapping definition files
│   ├── services/     # Core business logic processing (email, tasks, users)
│   ├── utils/        # ApiError, Success helper formatters
│   ├── seed.ts       # Database seeding population script
│   └── server.ts     # Express app initiation server entrypoint
├── dist/             # Compiled Javascript build output
├── render.yaml       # Render.com Blueprint configuration specification
├── package.json      # Dependencies and execution script definitions
└── tsconfig.json     # Typescript compile configuration rules
```

---

## Setup and Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   Copy .env.example to .env:
   ```bash
   copy .env.example .env
   ```

---

## Environment Variables

Open `.env` and configure the following variables:

- <b>PORT</b>: Server listening port (default: 5000).
- <b>MONGO_URI</b>: MongoDB connection string (e.g. mongodb://localhost:27017/taskflow).
- <b>JWT_SECRET</b>: Secret key for signing authorization JWTs.
- <b>JWT_EXPIRES_IN</b>: Expiration period of the access token (e.g. 15m).
- <b>JWT_REFRESH_SECRET</b>: Secret key for signing refresh JWTs.
- <b>JWT_REFRESH_EXPIRES_IN</b>: Expiration period of refresh token (e.g. 7d).
- <b>CLIENT_URL</b>: CORS origin address permission (default: http://localhost:5173).
- <b>BREVO_EMAIL_MODE</b>: Mode for Brevo email client (api | smtp).
- <b>BREVO_API_KEY</b>: Key credentials (use xkeysib- for api mode, use SMTP password xsmtpsib- for smtp mode).
- <b>BREVO_SENDER_EMAIL</b>: Sender address display format (e.g. "FlowNop <no-reply@flownop.com>").

---

## Database Seeding and Seeding Accounts

To populate your database with initial users, admin profiles, and starter tasks:

```bash
npm run seed
```

### Seeded Credentials
- <b>Super Admin</b>: superAdminFlowNop@gmail.com / FlowNop#2026 (immune account)
- <b>Admin User</b>: admin@taskflow.com / Password123
- <b>Standard Users</b>: alice@taskflow.com, bob@taskflow.com / Password123

---

## Running the Server

### Development mode
Runs ts-node-dev and restarts automatically on file updates:
```bash
npm run dev
```

### Production Build and Execution
```bash
npm run build
npm start
```

---

## REST API Endpoints Reference

All routes are prefixed with `/api`.

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| /health | GET | Public | Database, email service health checks. |
| /auth/register | POST | Public | Standard signup (enforces min 18 years check). |
| /auth/login | POST | Public | Signs in and returns JWT credentials. |
| /auth/request-reactivation | POST | Public | Submits a deactivation recovery appeal. |
| /auth/me | GET | JWT Protected | Returns logged-in user profile details. |
| /users | GET | JWT + Admin | Retrieves complete directory of users. |
| /users/:id/disable | POST | JWT + Admin | Lock a user account. |
| /users/:id/reactivate | POST | JWT + Admin | Re-enable a disabled user account. |
| /tasks | GET | JWT Protected | Returns role-scoped list of tasks. |
| /tasks | POST | JWT Protected | Creates a new task. |
| /tasks/:id/approve | PATCH | JWT + Admin | Approve a task (Responsible Admin or Super Admin only). |

---

## Email Configuration Modes (Brevo)

The server selects the email client mode dynamically based on `.env`:

### 1. REST API Mode (api)
- Connects via HTTPS to Brevo REST API v3.
- Bypasses outbound SMTP port blockages in server environments like Render.com.
- Requires a REST API key (starts with xkeysib-).

### 2. SMTP Relay Mode (smtp)
- Uses nodemailer to connect to smtp-relay.brevo.com.
- Typically used for local testing or traditional VM server deployments.
- Requires an SMTP key (starts with xsmtpsib-).
