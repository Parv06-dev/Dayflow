# Dayflow

**Dayflow** is a modern, full-stack Human Resource Management System (HRMS) designed to streamline employee management, attendance tracking, leave requests, and payroll operations through a centralized and secure platform.

## 🚀 Key Features

- **Role-Based Access Control (RBAC):** Secure and granular access for Administrators, HR Managers, and Employees.
- **Employee Directory:** Centralized hub for managing staff records, profiles, and credentials.
- **Time & Attendance:** Real-time clock-in/out tracking and historical attendance logs.
- **Leave Management:** End-to-end leave request and manager approval workflows.
- **Automated Payroll:** Dynamic, attendance-based salary calculations and digital PDF payslip generation.
- **Multi-Tenant Architecture:** Strict company-level data isolation for enterprise security.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Security:** JSON Web Tokens (JWT)

---

## ⚙️ Local Deployment & Setup

Follow these instructions to get the Dayflow application running on your local machine for development or testing.

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (or XAMPP for Windows users)
- Git

### 1. Database Configuration

1. Start your MySQL service.
2. Create a new database for the application.
   ```sql
   CREATE DATABASE dayflow_db;
   ```
> **Note:** You do not need to manually import SQL tables. The backend application will automatically generate the required database schema and seed the initial data upon its first startup.

### 2. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory. You can use the `.env.example` if available, or define the following environment variables:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=dayflow_db
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. Open a new terminal instance and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory to point to your local API:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 4. Accessing the Application

Once both servers are running successfully, open your web browser and navigate to the frontend URL (typically `http://localhost:5173`).

- **Initial Login:** 
  Upon the first backend startup, the system will seed a default Company and Admin user. Check your backend terminal output for the generated admin credentials, or use the UI to register a brand new company.
