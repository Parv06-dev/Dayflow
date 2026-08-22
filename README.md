# Dayflow

# Dayflow — HR Management System

> A full-stack Human Resource Management System (HRMS) designed to simplify employee management, attendance tracking, leave management, and payroll operations through a centralized platform.

---

## 📌 Overview

**Dayflow** is a full-stack HR Management System that provides organizations with a centralized platform to manage employees, attendance, leave requests, salaries, and authentication.

The system implements **role-based access control (RBAC)** to provide different levels of access to **Administrators, HR Managers, and Employees**.

### ✨ Key Highlights

- 🔐 Secure authentication with role-based access control
- 👥 Complete employee management
- ⏱️ Real-time attendance tracking
- 📝 Employee leave request and approval workflow
- 💰 Automated salary and payroll calculations
- 📄 Digital and printable payslips
- 🏢 Company registration and management
- 🗄️ MySQL database with automatic initialization
- 🌐 RESTful backend API
- 💻 Separate frontend and backend architecture

---

# 🚀 Features

## 1. 🔐 Authentication & Role-Based Access Control

Dayflow provides secure authentication and access management for different types of users.

### Features

- Login using **Email or custom Login ID**
- Role-based access control
- Supported roles:
  - `ADMIN`
  - `HR`
  - `EMPLOYEE`
- Role-specific dashboards and permissions
- Company registration
- Temporary password generation for employee accounts

---

## 2. 👥 Employee Management

HR and administrators can manage employee information from a centralized directory.

### Features

- Employee directory
- Employee search
- Role-based profile editing
- Employee account creation
- Temporary password generation
- Employee account deletion
- Cascaded deletion of associated account data

---

## 3. ⏱️ Real-Time Attendance

Dayflow provides an integrated attendance management system.

### Features

- Quick **Clock-In / Clock-Out** toggle
- Automatic shift duration calculation
- Attendance history
- Team attendance roster
- Attendance status tracking
- Integration with payroll calculations

---

## 4. 📝 Leave Management

Employees can submit leave requests while HR/management can review and process them.

### Workflow

```text
Employee
   ↓
Submit Leave Request
   ↓
HR / Manager Review
   ↓
Approve / Reject
   ↓
Attendance & Payroll Synchronization

Features
Leave request submission
Leave history
Manager/HR approval hub
Leave approval and rejection
Attendance synchronization
Payroll synchronization

5. 💰 Payroll & Payslips

Dayflow provides dynamic salary calculations based on employee wage structures and attendance.

Features
Monthly salary calculation
Basic salary management
Allowance breakdown
Absenteeism deductions
Capped deduction calculations
Custom wage structure editing
Payroll synchronization with attendance
Digital payslip generation
Printable payslips
🏗️ System Architecture

Dayflow follows a separated frontend–backend architecture.

                    ┌─────────────────────┐
                    │      Frontend       │
                    │                     │
                    │   User Interface    │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │                     │
                    │ Authentication      │
                    │ Employee Management │
                    │ Attendance          │
                    │ Leave Management    │
                    │ Payroll             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MySQL         │
                    │      Database       │
                    └─────────────────────┘
🗄️ Database Schema

The system uses MySQL as its primary relational database.

Main Entities
Company
Employee
Login
Attendance
Leave_Request
Salary

🛠️ Technology Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Backend	Node.js
API	REST API
Database	MySQL
Database Environment	MySQL / XAMPP
Package Manager	npm
Development	VS Code

⚙️ Installation & Setup
Prerequisites

Make sure the following are installed:

Node.js 18+
npm
MySQL or XAMPP
Git
VS Code (recommended)
