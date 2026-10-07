# Production-Ready MERN Stack HRMS & Attendance Management Portal

A full-featured, enterprise-grade **Human Resource Management & Employee Attendance System** built with the modern MERN Stack (MongoDB Atlas, Express.js, React.js with Vite & Tailwind CSS, Node.js). 

Designed with clean layered backend architecture, strict separation between User credentials and Employee profiles, configurable organization settings, granular database-driven permissions, live attendance regularization workflows, payroll-ready payable days calculations, and Excel export capabilities.

---

## 📑 Table of Contents
1. [Architectural Highlights](#-architectural-highlights)
2. [Technology Stack](#-technology-stack)
3. [System Modules](#-system-modules)
4. [Database & Schema Design](#-database--schema-design)
5. [Demo Credentials](#-demo-credentials)
6. [Getting Started & Local Setup](#-getting-started--local-setup)
7. [Database Seeder](#-database-seeder)
8. [Automated Verification & Testing](#-automated-verification--testing)
9. [REST API Endpoints Reference](#-rest-api-endpoints-reference)
10. [Attendance Calculation & Payroll Readiness](#-attendance-calculation--payroll-readiness)
11. [Production Deployment](#-production-deployment)

---

## 🏛 Architectural Highlights

- **Strict Separation of Users & Employees:**
  - `User`: Handles authentication, credentials (bcrypt), JWT tokens, active state, and assigned database-driven role.
  - `Employee`: Manages demographics, emergency contacts, department, designation, team, hierarchy (reporting manager, team lead), and assigned shifts.
- **Layered Clean Architecture:**
  ```text
  Client (React + Zustand + Axios)
  ↓
  Express Routes (api/v1/*)
  ↓
  Authentication & Permission Middlewares (RBAC 403 Forbidden)
  ↓
  Controllers (Request handling & response framing)
  ↓
  Business Services (AttendanceCalculationService, LeaveCalculationService, EmployeeIdService, AuditService, NotificationService)
  ↓
  Mongoose 8 Models with Compound Indexes
  ↓
  MongoDB Atlas Cluster (hrms_attendance)
  ```
- **Compound Database Indexes:**
  - `Attendance`: `{ employeeId: 1, date: 1 }` (unique) to mathematically eliminate duplicate punch records.
  - `Employee`: `{ employeeCode: 1 }` (unique) and `{ email: 1 }` (unique).
  - `User`: `{ email: 1 }` (unique) and `{ employeeId: 1 }` (unique).
- **Audit Trail & System Governance:**
  - Every administrative action (employee creation, role modifications, attendance regularization, payroll lock/unlock, settings shifts) writes an immutable record to the `AuditLog` collection.

---

## 💻 Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **State Management:** Zustand (reactive auth, profile sync, permission checks)
- **Styling:** Tailwind CSS + Vanilla CSS micro-animations
- **Icons:** Lucide React Icons
- **Data Visualization:** Recharts (Attendance 7-day trend, Department breakdown, Monthly percentages)
- **HTTP Client:** Axios with auto-refresh token request interceptor
- **Routing:** React Router v7 with protected routes and role/permission gates

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 4
- **Database:** MongoDB Atlas via Mongoose 8 (with SRV public DNS resolver fallback for Windows)
- **Security:** Helmet, CORS, Express-Rate-Limit, bcryptjs
- **Tokens:** JSON Web Token (Access Token 15m + Refresh Token 7d)
- **Excel Generation:** ExcelJS (multi-tab styled payroll spreadsheets)
- **File Uploads:** Multer with MIME-type and size limits

---

## 📦 System Modules

1. **Executive & Employee Dashboards:**
   - Role-specific KPI metrics (Total staff, Present today, Late arrivals, On leave, WFH).
   - Live Web Check-In / Check-Out punch widget with real-time digital clock.
   - Attendance trend charts and upcoming celebrations (Birthdays, Work Anniversaries).
2. **Employee Management:**
   - Full CRUD, search, department/status filters, pagination.
   - Auto-generated employee codes (`EMP-001`, `EMP-002`, etc.) based on configurable prefix, padding, and start number.
   - Profile demographic viewing modal and document attachments.
3. **Organization Hierarchy:**
   - Visual reporting tree: Department &rarr; Department Manager &rarr; Team &rarr; Team Lead &rarr; Employees.
4. **Attendance Management:**
   - **Daily Attendance Log:** Filterable daily roll call with manual adjustment modal.
   - **Monthly Matrix Grid:** Visual 1..31 day status grid mapping every employee's status badge.
   - **My Attendance:** Self-service employee log with 1-click regularization claim trigger.
   - **Regularization Workflow:** Employee requests &rarr; Approver multi-tier review &rarr; Automatic attendance record update.
   - **Biometric/Excel Import:** CSV/Excel punch file upload with dry-run validation preview and error logging.
   - **Monthly Attendance Lock:** HR can freeze monthly records for salary calculation (unmodifiable without unlock privileges).
5. **Leave Management:**
   - Configurable leave types (Casual, Sick, Earned, Unpaid, Maternity, Comp Off).
   - Dynamic leave balance calculation (Allocated, Used, Pending, Available).
   - Working day calculation excluding configured weekends and gazetted company holidays.
   - Bulk leave allocation by department or employment type.
   - Multi-tier approval/rejection audit trail.
   - Leave analytics charts (monthly consumption, leave types distribution).
6. **HR Operations & Culture:**
   - **Unified HR Calendar:** Aggregates holidays, company events, approved leaves, birthdays, and work anniversaries into a single synchronized monthly/weekly view.
   - **Office Tasks:** Project task board with priority badges, status tracking, and comment threads.
   - **Performance Reviews:** Appraisal scoring with KPI/KRA evaluation and feedback cards.
   - **Company Policies:** Digital HR handbook with timestamped employee acknowledgement tracker.
7. **Payroll-Ready Reports:**
   - Aggregates Present, Late, Half-Day, Paid Leave, Unpaid Leave, Absent, Week Off, Holiday, and Overtime.
   - Calculates **Payable Days** and **Loss of Pay (LOP)** days.
   - Direct export to Microsoft Excel (`.xlsx`) with formatted headers and auto-width columns.
8. **Roles, Permissions & Settings:**
   - Granular checkboxes across 14 modules.
   - System roles safeguarded against accidental deletion.
   - Tabbed settings for Company profile, Attendance thresholds, Weekly off schedules, ID generators, and Hierarchy workflows.

---

## 🗄 Database & Schema Design

All 23 collections reside inside the Atlas database `hrms_attendance`:

- `users` — Authentication credentials, role mapping, refresh tokens.
- `employees` — Workforce demographics, department/designation/team foreign keys, shift link.
- `departments` — Operational business units with manager reference.
- `designations` — Job titles and ranks.
- `teams` — Project squads with assigned Team Leads.
- `shifts` — Start/end times, grace periods, break minutes, full/half day thresholds.
- `attendances` — Daily punch logs with calculated status and overtime.
- `attendance_regularizations` — Correction requests and approval workflow states.
- `attendance_locks` — Monthly finalized payroll locks.
- `leave_types` — Leave policies and quotas.
- `leave_allocations` — Employee annual leave quotas.
- `leave_requests` — Applied leave durations and multi-tier approval states.
- `holidays` — Public, company, and optional holidays.
- `events` — Company meetings, celebrations, and training programs.
- `tasks` — Assigned workplace deliverables and status.
- `performance_reviews` — Scorecards, KPI reviews, and ratings.
- `policies` — HR policy documents.
- `policy_acknowledgements` — Employee digital sign-offs.
- `roles` — System and custom administrative roles.
- `permissions` — Granular security privileges.
- `notifications` — In-app alerts for requests and status updates.
- `audit_logs` — Immutable administrative event ledger.
- `settings` — Organization configuration key-value store.

---

## 🔑 Demo Credentials

The database has been seeded with realistic enterprise demo data:

| Role | Login Identifier (Email or Code) | Password | Default Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@company.com` or `EMP-001` | `Admin@123` | Full access to all 23 modules & settings |
| **HR Admin** | `hr@company.com` or `EMP-002` | `HR@123` | Employee, Attendance, Leaves, Reports, Policies |
| **Manager** | `manager@company.com` or `EMP-003` | `Manager@123` | Department team attendance, reviews, tasks, approvals |
| **Employee** | `employee@company.com` or `EMP-005` | `Employee@123` | Self-service attendance punch, leave requests, profile |

> **Note:** The login screen provides **1-Click Quick Demo Switcher Buttons** for instant testing without manual typing.

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas**: Active cluster connection

### 2. Backend Setup
```bash
cd backend

# Create .env file with MongoDB Atlas credentials:
# (Note: backend/.env is already populated in this project)
cat <<EOT > .env
PORT=5000
MONGODB_URI=mongodb+srv://rs4146143_db_user:i1i0aZimq0f2HE1f@cluster0.5tk4p0e.mongodb.net/hrms_attendance?retryWrites=true&w=majority&appName=Cluster0
JWT_ACCESS_SECRET=hrms_super_secure_access_token_secret_key_2026_xyz789
JWT_REFRESH_SECRET=hrms_super_secure_refresh_token_secret_key_2026_abc123
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
EOT

# Install dependencies (if not already installed)
npm install

# Start the server
npm run dev
# or
node server.js
```
The backend will launch at `http://localhost:5000/api/v1`.

### 3. Frontend Setup
```bash
cd frontend

# Verify frontend/.env points to backend API:
# VITE_API_BASE_URL=http://localhost:5000/api/v1

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` (or `http://localhost:5174`) in your browser.

---

## 🌿 Database Seeder

To re-seed the MongoDB Atlas cluster with complete sample data (roles, shifts, 7 employees, 14 days of realistic attendance, leave types, allocations, requests, tasks, events, and holidays):

```bash
cd backend
node src/seeders/seed.js
```

---

## 🧪 Automated Verification & Testing

An end-to-end regression and integration test suite is included in the project root:

```bash
node test_e2e_api.js
```

### Verification Results:
```text
--- 🧪 HRMS & Attendance System Full E2E Verification ---
✅ [PASS] Super Admin Login via Email
✅ [PASS] Employee Login via Employee Code (EMP-005)
✅ [PASS] JWT Refresh Token Flow
✅ [PASS] Authenticated User Profile (/me)
✅ [PASS] Employee Directory List (Count: 7)
✅ [PASS] Departments List API
✅ [PASS] Designations List API
✅ [PASS] Teams List API
✅ [PASS] Shifts List API
✅ [PASS] Daily Attendance Log
✅ [PASS] Employee Attendance Punch Check-In
✅ [PASS] Monthly Attendance Matrix Grid
✅ [PASS] Leave Types API
✅ [PASS] Leave Balances Calculation API
✅ [PASS] HR Unified Calendar Feed
✅ [PASS] Birthdays & Work Anniversaries Celebrations API
✅ [PASS] Office Tasks Management API
✅ [PASS] Performance Reviews API
✅ [PASS] HR Company Policies API
✅ [PASS] Monthly Payroll & LOP Summary Calculation
✅ [PASS] Roles Management API
✅ [PASS] Granular Permissions API
✅ [PASS] Organization Settings API
✅ [PASS] Security Audit Logs Trail
✅ [PASS] User Notifications API
✅ [PASS] Executive Dashboard Analytics Aggregations
========================================
TOTAL TESTS: 26 | PASSED: 26 | FAILED: 0
========================================
```

---

## 📡 REST API Endpoints Reference

All endpoints are prefixed with `/api/v1`:

### Authentication & Self-Service
- `POST /api/v1/auth/login` — Login via Email or Employee Code
- `POST /api/v1/auth/refresh-token` — Rotate Access Token via Refresh Token
- `POST /api/v1/auth/logout` — Invalidate session and clear refresh token
- `GET /api/v1/auth/me` — Fetch currently logged-in user and employee profile
- `POST /api/v1/auth/change-password` — Change password

### Employees & Organization
- `GET /api/v1/employees` — List employees (page, limit, search, departmentId, status)
- `POST /api/v1/employees` — Create new employee record
- `GET /api/v1/employees/:id` — Get full employee profile
- `PUT /api/v1/employees/:id` — Update employee record
- `DELETE /api/v1/employees/:id` — Soft-delete employee
- `GET /api/v1/employees/hierarchy/tree` — Organizational reporting hierarchy
- `GET /api/v1/departments` — List departments (CRUD on `/api/v1/departments`)
- `GET /api/v1/designations` — List designations (CRUD on `/api/v1/designations`)
- `GET /api/v1/teams` — List teams (CRUD on `/api/v1/teams`)
- `GET /api/v1/shifts` — List shifts (CRUD on `/api/v1/shifts`)

### Attendance & Regularization
- `POST /api/v1/attendance/punch` — Digital web check-in & check-out
- `GET /api/v1/attendance/daily` — Daily attendance roll call
- `GET /api/v1/attendance/monthly-matrix` — Month-long 1..31 grid matrix
- `GET /api/v1/attendance/my` — Employee self attendance log
- `POST /api/v1/attendance/manual` — Administrative manual attendance entry
- `POST /api/v1/attendance/import` — Excel / CSV punch import with validation
- `POST /api/v1/attendance/lock` — Finalize and lock monthly attendance
- `POST /api/v1/attendance/unlock` — Unlock monthly attendance
- `GET /api/v1/attendance/regularizations` — List regularization correction claims
- `POST /api/v1/attendance/regularizations` — Submit punch correction request
- `PUT /api/v1/attendance/regularizations/:id/action` — Approve/Reject regularization

### Leaves
- `GET /api/v1/leaves/types` & `GET /api/v1/leave-types` — List configured leave types
- `GET /api/v1/leaves/balances` — Fetch remaining leave balances
- `GET /api/v1/leaves/allocations` & `GET /api/v1/leave-allocations` — List allocations
- `POST /api/v1/leaves/allocations/bulk` — Bulk allocate leaves across department
- `POST /api/v1/leaves/requests` — Apply for leave
- `GET /api/v1/leaves/requests` — List leave requests
- `PUT /api/v1/leaves/requests/:id/action` — Multi-tier approve or reject leave
- `GET /api/v1/leaves/analytics` — Leave consumption analytics charts

### Reports & Payroll
- `GET /api/v1/reports/payroll-summary` — Month-end attendance ledger with payable days & LOP
- `GET /api/v1/reports/export-excel` — Download Excel spreadsheet (`.xlsx`)

### Culture & Operations
- `GET /api/v1/calendar/feed` — Unified calendar events (holidays, leaves, events, birthdays)
- `GET /api/v1/calendar/celebrations` — Today & upcoming birthdays and work anniversaries
- `GET /api/v1/tasks` — Office task board (CRUD on `/api/v1/tasks`)
- `GET /api/v1/performance` — Performance reviews & KPIs
- `GET /api/v1/policies` — HR policy handbooks
- `POST /api/v1/policies/:id/acknowledge` — Digital employee policy acknowledgement
- `GET /api/v1/roles` — Database-driven roles
- `GET /api/v1/permissions` — System security permissions list
- `GET /api/v1/settings` — System and organization settings
- `POST /api/v1/settings` — Update organization configuration
- `GET /api/v1/audit-logs` — Administrative audit trail

---

## 📊 Attendance Calculation & Payroll Readiness

The portal includes a dedicated `AttendanceCalculationService` implementing enterprise logic:

1. **Working Duration:**
   $$\text{Working Minutes} = \max(0, (\text{CheckOut} - \text{CheckIn}) - \text{BreakMinutes})$$
2. **Late Arrival Determination:**
   $$\text{Is Late} = \text{CheckIn Minutes} > (\text{ShiftStart} + \text{GraceMinutes})$$
3. **Daily Status Categorization:**
   - $\text{Working Duration} < \text{HalfDayThreshold} \implies \textbf{Absent}$
   - $\text{HalfDayThreshold} \le \text{Working Duration} < \text{FullDayThreshold} \implies \textbf{Half Day}$
   - $\text{Working Duration} \ge \text{FullDayThreshold} \implies \textbf{Present / Late}$
4. **Payroll Summary Metrics:**
   - **Payable Days:**
     $$\text{Payable Days} = \text{Present} + (0.5 \times \text{HalfDay}) + \text{PaidLeaves} + \text{Holidays} + \text{WeeklyOffs}$$
   - **Loss of Pay (LOP) Days:**
     $$\text{LOP Days} = \text{Absent} + (0.5 \times \text{HalfDay}) + \text{UnpaidLeaves}$$

---

## 🚢 Production Deployment

### Frontend Production Build
```bash
cd frontend
npm run build
```
Generates an optimized static bundle in `frontend/dist/` ready to be served via Nginx, Vercel, or AWS S3 + CloudFront.

### Backend Production Execution
```bash
cd backend
export NODE_ENV=production
node server.js
```
Or with PM2 process manager:
```bash
pm2 start server.js --name "hrms-backend" -i max
```
