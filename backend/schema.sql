-- Database: dayflow_hrms
CREATE DATABASE IF NOT EXISTS dayflow_hrms;
USE dayflow_hrms;

-- 1. Employee Table
CREATE TABLE IF NOT EXISTS Employee (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_name VARCHAR(100) NOT NULL,
    emp_department VARCHAR(100) NOT NULL,
    emp_role VARCHAR(100) NOT NULL,
    emp_email VARCHAR(100) UNIQUE NOT NULL,
    emp_phno VARCHAR(10) UNIQUE NOT NULL
);

-- 2. Login Table
CREATE TABLE IF NOT EXISTS Login (
    emp_id INT PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    acc_status VARCHAR(100) DEFAULT 'Active',
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    login_time TIME NULL,
    logout_time TIME NULL,
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

-- 4. Leave_Request Table
CREATE TABLE IF NOT EXISTS Leave_Request (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    approved_status VARCHAR(100) DEFAULT 'Pending',
    approved_by INT NULL,
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES Employee(emp_id) ON DELETE SET NULL
);

-- Seeding Default Users (Password for all: password123)
-- Admin
INSERT INTO Employee (emp_id, emp_name, emp_department, emp_role, emp_email, emp_phno)
VALUES (1, 'Admin User', 'Management', 'ADMIN', 'admin@admin.com', '9876543210')
ON DUPLICATE KEY UPDATE emp_name=emp_name;

INSERT INTO Login (emp_id, Password, acc_status)
VALUES (1, '$2a$10$qR2vX33mO62j0b5.5/zMVe/q88qU2FepL17F6vCg.wW96tAepB0wW', 'Active')
ON DUPLICATE KEY UPDATE emp_id=emp_id;

-- HR
INSERT INTO Employee (emp_id, emp_name, emp_department, emp_role, emp_email, emp_phno)
VALUES (2, 'HR Manager', 'Human Resources', 'HR', 'hr@hr.com', '9876543211')
ON DUPLICATE KEY UPDATE emp_name=emp_name;

INSERT INTO Login (emp_id, Password, acc_status)
VALUES (2, '$2a$10$qR2vX33mO62j0b5.5/zMVe/q88qU2FepL17F6vCg.wW96tAepB0wW', 'Active')
ON DUPLICATE KEY UPDATE emp_id=emp_id;

-- Employee
INSERT INTO Employee (emp_id, emp_name, emp_department, emp_role, emp_email, emp_phno)
VALUES (3, 'John Doe', 'Engineering', 'EMPLOYEE', 'john@gmail.com', '9876543212')
ON DUPLICATE KEY UPDATE emp_name=emp_name;

INSERT INTO Login (emp_id, Password, acc_status)
VALUES (3, '$2a$10$qR2vX33mO62j0b5.5/zMVe/q88qU2FepL17F6vCg.wW96tAepB0wW', 'Active')
ON DUPLICATE KEY UPDATE emp_id=emp_id;
