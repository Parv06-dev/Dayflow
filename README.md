# 🌊 Dayflow — Human Resource Management System

> **A modern, secure, and scalable Human Resource Management System built to simplify employee operations, attendance, leave management, and payroll.**

Dayflow is a full-stack **Human Resource Management System (HRMS)** designed to centralize and automate essential HR operations through a clean, intuitive, and role-based platform.

The system provides dedicated workflows for **Administrators, HR Managers, and Employees**, while maintaining strict company-level data isolation through a multi-tenant architecture.

---

## ✨ Why Dayflow?

Traditional HR processes often involve spreadsheets, manual attendance records, disconnected payroll calculations, and lengthy approval workflows.

**Dayflow brings these operations together into one centralized platform.**

With Dayflow, organizations can:

* Manage employees from a centralized directory
* Track attendance and working hours
* Submit and approve leave requests
* Calculate salaries based on attendance
* Generate digital payslips
* Control access using role-based permissions
* Maintain secure company-level data isolation

---

## 🚀 Core Features

### 🔐 Role-Based Access Control

Dayflow provides different capabilities depending on the user's role.

| Role              | Capabilities                                                                 |
| ----------------- | ---------------------------------------------------------------------------- |
| **Administrator** | Company management, employee management, HR configuration, payroll oversight |
| **HR Manager**    | Employee records, attendance, leave approvals, payroll operations            |
| **Employee**      | Profile, attendance, leave requests, salary and payslip information          |

Access to resources is protected through **JWT-based authentication and authorization**.

---

### 👥 Employee Management

Centralized employee directory for managing organizational workforce data.

**Capabilities include:**

* Employee profiles
* Employee onboarding
* Department and designation management
* Employment information
* Contact information
* Role assignment
* Account credentials
* Employee status management

---

### 🕐 Time & Attendance

Track employee attendance through a centralized attendance system.

**Features:**

* Clock-in / Clock-out
* Daily attendance records
* Attendance history
* Working-hours tracking
* Attendance status
* Historical attendance logs

The attendance data can also be used as an input for payroll calculations.

---

### 🏖️ Leave Management

Digitize the complete leave workflow.

**Employees can:**

* Submit leave requests
* Select leave types
* Specify leave duration
* Add leave reasons
* Track request status
* View leave history

**Managers / HR can:**

* Review requests
* Approve or reject leave
* Track employee leave history
* Manage leave workflows

---

### 💰 Automated Payroll

Dayflow simplifies salary processing by combining employee salary information with attendance data.

**Features include:**

* Salary configuration
* Attendance-based calculations
* Deductions
* Payroll processing
* Salary records
* Payslip generation
* Digital PDF payslips

This reduces repetitive manual calculations and helps maintain consistent payroll records.

---

### 🏢 Multi-Tenant Architecture

Dayflow is designed with **company-level data isolation**.

Each organization operates within its own logical tenant, ensuring that:

* Employees belong to a specific company
* HR data is scoped to the organization
* Attendance records remain company-specific
* Leave records remain company-specific
* Payroll information remains isolated

This architecture provides a foundation for supporting multiple organizations securely within the same application.

---

## 🎨 User Experience

Dayflow focuses on providing a modern and intuitive HR experience.

### Design Principles

* Clean and minimal interface
* Soothing visual design
* Responsive layouts
* Clear navigation
* Role-specific dashboards
* Accessible information hierarchy
* Consistent UI components
* Reduced visual clutter

The goal is to make everyday HR operations **simple, fast, and easy to understand**.

---

# 🏗️ System Architecture

Dayflow follows a modern full-stack architecture:

```text
┌──────────────────────────────┐
│          Frontend            │
│      React + Vite            │
│      Tailwind CSS            │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│           Backend            │
│     Node.js + Express        │
│                              │
│  Authentication             │
│  Authorization              │
│  Business Logic             │
│  Payroll Processing         │
│  Leave Management           │
│  Attendance Management      │
└──────────────┬───────────────┘
               │
               │ SQL
               ▼
┌──────────────────────────────┐
│           Database           │
│            MySQL             │
│                              │
│ Employees                   │
│ Companies                   │
│ Attendance                  │
│ Leave Requests              │
│ Payroll                     │
│ Authentication              │
└──────────────────────────────┘
```

---

# 🛠️ Technology Stack

| Layer               | Technology            |
| ------------------- | --------------------- |
| Frontend            | React                 |
| Build Tool          | Vite                  |
| Styling             | Tailwind CSS          |
| Backend             | Node.js               |
| API Framework       | Express.js            |
| Database            | MySQL                 |
| Authentication      | JSON Web Tokens (JWT) |
| Password Security   | Password Hashing      |
| Document Generation | PDF Payslips          |
| Version Control     | Git + GitHub          |

---

# 📁 Project Structure

```text
Dayflow/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── README.md
└── LICENSE
```

> The exact structure may vary depending on the current implementation.

---

# ⚙️ Local Development Setup

## Prerequisites

Before running Dayflow locally, make sure you have:

* **Node.js 18+**
* **npm**
* **MySQL 8+**
* **Git**

Verify your installation:

```bash
node --version
npm --version
mysql --version
git --version
```

---

# 1️⃣ Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Dayflow
```

---

# 2️⃣ Configure MySQL

Start your MySQL server.

Create the Dayflow database:

```sql
CREATE DATABASE dayflow_db;
```

You do **not** need to manually create application tables if the backend is configured to initialize the schema automatically.

---

# 3️⃣ Configure the Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=dayflow_db

JWT_SECRET=your_super_secret_jwt_key
```

### Environment Variables

| Variable     | Description                    |
| ------------ | ------------------------------ |
| `PORT`       | Backend server port            |
| `DB_HOST`    | MySQL host                     |
| `DB_USER`    | MySQL username                 |
| `DB_PASS`    | MySQL password                 |
| `DB_NAME`    | Application database           |
| `JWT_SECRET` | Secret used to sign JWT tokens |

> **Important:** Never commit `.env` files or production secrets to GitHub.

Start the backend:

```bash
npm run dev
```

The API should now be available at:

```text
http://localhost:5000
```

---

# 4️⃣ Configure the Frontend

Open another terminal.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local development URL in the terminal, typically:

```text
http://localhost:5173
```

---

# 5️⃣ Open Dayflow

Open the frontend URL shown by Vite in your browser.

```text
http://localhost:5173
```

Make sure **both the frontend and backend servers are running**.

```text
Frontend
   │
   │ http://localhost:5173
   ▼
Dayflow UI
   │
   │ REST API
   ▼
Backend
   │
   │ MySQL
   ▼
Database
```

---

# 🔑 Initial Login

On the first backend startup, Dayflow may initialize the database and seed an initial company and administrator account, depending on the current backend configuration.

If seed credentials are generated automatically, they will be displayed in the backend terminal.

Example:

```text
Database initialized successfully.

Default administrator created:
Email: admin@example.com
Password: ********
```

> **For security, change the default administrator password immediately after the first login.**

If your implementation does not currently seed an administrator automatically, create the first organization through the registration/onboarding workflow.

---

# 🔒 Security

Dayflow is designed with security as a core requirement.

### Authentication

Authentication is implemented using:

```text
JWT
```

After successful login, the authenticated session is represented through a signed token.

### Authorization

API access is protected using role-based authorization.

```text
User
 │
 ▼
Authentication
 │
 ▼
JWT Validation
 │
 ▼
Role Verification
 │
 ├── Administrator
 ├── HR Manager
 └── Employee
```

### Data Isolation

Tenant-aware access control ensures that users can only access resources belonging to their organization.

---

# 🔄 Main Application Workflows

## Employee Workflow

```text
Login
  ↓
Employee Dashboard
  ↓
View Profile
  ↓
Clock In / Clock Out
  ↓
View Attendance
  ↓
Request Leave
  ↓
Track Approval
  ↓
View Payroll
  ↓
Download Payslip
```

---

## HR Workflow

```text
Login
  ↓
HR Dashboard
  ↓
Manage Employees
  ↓
Review Attendance
  ↓
Review Leave Requests
  ↓
Approve / Reject Leave
  ↓
Process Payroll
  ↓
Generate Payslips
```

---

## Administrator Workflow

```text
Login
  ↓
Admin Dashboard
  ↓
Manage Organization
  ↓
Manage Employees
  ↓
Manage Roles & Access
  ↓
Configure HR Operations
  ↓
Monitor Attendance
  ↓
Manage Payroll
```

---

# 🧪 Development Commands

### Backend

```bash
cd backend

npm install
npm run dev
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

If the project contains additional scripts, they can be viewed using:

```bash
npm run
```

---

# 🐛 Troubleshooting

### MySQL connection error

Check:

* MySQL is running
* Database exists
* Username is correct
* Password is correct
* `.env` is located inside the backend directory

---

### Frontend cannot connect to backend

Check:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Also verify that the backend is running.

---

### Port already in use

Check which process is using the port and either stop it or configure Dayflow to use another port.

---

### Dependencies are not working

Try reinstalling dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

Run this separately inside the affected `frontend` or `backend` directory.

---

# 📸 Screenshots

> Add screenshots of the application here as the UI becomes finalized.

Recommended screenshots:

1. Login Page
2. Admin Dashboard
3. Employee Dashboard
4. Employee Directory
5. Attendance Management
6. Leave Management
7. Payroll Dashboard
8. Payslip
9. Employee Profile

Example:

```text
docs/
└── screenshots/
    ├── login.png
    ├── dashboard.png
    ├── employees.png
    ├── attendance.png
    ├── leave.png
    └── payroll.png
```

---

# 🗺️ Roadmap

### Authentication

* [x] JWT authentication
* [x] Role-based authorization
* [ ] Password reset
* [ ] Email verification
* [ ] Session management improvements

### Employee Management

* [x] Employee directory
* [x] Employee profiles
* [ ] Employee onboarding
* [ ] Document management
* [ ] Employee import/export

### Attendance

* [x] Clock-in / Clock-out
* [x] Attendance history
* [ ] Shift management
* [ ] Overtime tracking
* [ ] Attendance reports

### Leave Management

* [x] Leave requests
* [x] Approval workflow
* [ ] Leave balance management
* [ ] Configurable leave policies
* [ ] Holiday calendar

### Payroll

* [x] Salary calculations
* [x] Attendance-based processing
* [x] Payslip generation
* [ ] Advanced deductions
* [ ] Payroll reports
* [ ] Tax calculations

### Platform

* [x] Multi-tenant foundation
* [ ] Audit logs
* [ ] Notifications
* [ ] Email integration
* [ ] Production deployment
* [ ] Automated testing

---

# 🧑‍💻 Development Philosophy

Dayflow is being developed with the following principles:

* **Security first**
* **Clean architecture**
* **Separation of concerns**
* **Reusable components**
* **Scalable backend design**
* **Maintainable code**
* **Responsive UI**
* **User-centered workflows**

---

# 🤝 Contributing

Contributions are welcome.

To contribute:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them locally, and commit:

```bash
git add .
git commit -m "feat: add your feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# 📄 License

This project is distributed under the license specified in the repository's `LICENSE` file.

---

# 🌊 Dayflow

**One platform. One workforce. One streamlined HR experience.**

Dayflow aims to transform everyday HR operations from fragmented manual processes into a **secure, centralized, and intuitive digital workflow**.
