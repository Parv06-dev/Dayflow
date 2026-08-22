const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─────────────────────────────────────────────────────────
// Auto-initialise Database & Tables on first startup
// ─────────────────────────────────────────────────────────
async function initDB() {
  const DB_NAME = process.env.DB_NAME || 'dayflow_hrms';

  // Step 1: Connect WITHOUT specifying the database
  const initConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  // Step 2: Create the database if it does not exist
  await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  console.log(`✅ Database "${DB_NAME}" ensured.`);

  // Step 3: Switch to that database
  await initConn.query(`USE \`${DB_NAME}\`;`);

  // Step 4: Create all tables
  await initConn.query(`
    CREATE TABLE IF NOT EXISTS Company (
      company_id    INT AUTO_INCREMENT PRIMARY KEY,
      company_name  VARCHAR(100) NOT NULL,
      company_code  VARCHAR(10)  NOT NULL UNIQUE,
      logo_url      LONGTEXT     NULL
    );

    CREATE TABLE IF NOT EXISTS Employee (
      emp_id          INT AUTO_INCREMENT PRIMARY KEY,
      login_id        VARCHAR(50)  UNIQUE NULL,
      emp_name        VARCHAR(100) NOT NULL,
      emp_department  VARCHAR(100) NOT NULL,
      emp_role        VARCHAR(100) NOT NULL,
      emp_email       VARCHAR(100) UNIQUE NOT NULL,
      emp_phno        VARCHAR(10)  UNIQUE NOT NULL,
      joining_year    INT          NOT NULL DEFAULT 2026,
      serial_num      INT          NOT NULL DEFAULT 1,
      company_id      INT          NULL,
      FOREIGN KEY (company_id) REFERENCES Company(company_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Login (
      emp_id       INT PRIMARY KEY,
      login_id     VARCHAR(50)  NULL,
      Password     VARCHAR(255) NOT NULL,
      acc_status   VARCHAR(100) DEFAULT 'Active',
      is_temp_pass BOOLEAN      DEFAULT FALSE,
      FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Attendance (
      attendance_id  INT AUTO_INCREMENT PRIMARY KEY,
      emp_id         INT  NOT NULL,
      attendance_date DATE NOT NULL,
      login_time     TIME NULL,
      logout_time    TIME NULL,
      FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Leave_Request (
      leave_id        INT AUTO_INCREMENT PRIMARY KEY,
      emp_id          INT          NOT NULL,
      from_date       DATE         NOT NULL,
      to_date         DATE         NOT NULL,
      reason          VARCHAR(1000) NOT NULL,
      approved_status VARCHAR(100) DEFAULT 'Pending',
      approved_by     INT          NULL,
      FOREIGN KEY (emp_id)      REFERENCES Employee(emp_id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES Employee(emp_id) ON DELETE SET NULL
    );
  `);
  console.log('✅ All tables verified / created.');

  // Safe migration for existing databases created before new columns were added
  try {
    await initConn.query(`ALTER TABLE Employee ADD COLUMN login_id VARCHAR(50) UNIQUE NULL;`);
  } catch (e) {}
  try {
    await initConn.query(`ALTER TABLE Employee ADD COLUMN joining_year INT NOT NULL DEFAULT 2026;`);
  } catch (e) {}
  try {
    await initConn.query(`ALTER TABLE Employee ADD COLUMN serial_num INT NOT NULL DEFAULT 1;`);
  } catch (e) {}
  try {
    await initConn.query(`ALTER TABLE Employee ADD COLUMN company_id INT NULL;`);
  } catch (e) {}
  try {
    await initConn.query(`ALTER TABLE Login ADD COLUMN login_id VARCHAR(50) NULL;`);
  } catch (e) {}
  try {
    await initConn.query(`ALTER TABLE Login ADD COLUMN is_temp_pass BOOLEAN DEFAULT FALSE;`);
  } catch (e) {}

  // Step 5: Seed default users if Employee table is empty
  const [rows] = await initConn.query('SELECT COUNT(*) AS cnt FROM Employee;');
  if (rows[0].cnt === 0) {
    // Passwords pre-hashed with bcrypt (rounds=10), plaintext = "password123"
    const hash = '$2a$10$fQAsd8Ir38cjAtQfnYPINubm65ohKoJUBysTFok/s4dYm./bpcIva';

    await initConn.query(`
      INSERT INTO Company (company_id, company_name, company_code)
      VALUES (1, 'Odoo India', 'OI');

      INSERT INTO Employee (emp_id, login_id, emp_name, emp_department, emp_role, emp_email, emp_phno, joining_year, serial_num, company_id)
      VALUES
        (1, 'OIADUS20260001', 'Admin User',  'Management',      'ADMIN',    'admin@admin.com', '9876543210', 2026, 1, 1),
        (2, 'OIHRMA20260002', 'HR Manager',  'Human Resources', 'HR',       'hr@hr.com',       '9876543211', 2026, 2, 1),
        (3, 'JODO20260003',   'John Doe',    'Engineering',     'EMPLOYEE', 'john@gmail.com',  '9876543212', 2026, 3, 1);

      INSERT INTO Login (emp_id, login_id, Password, acc_status)
      VALUES
        (1, 'OIADUS20260001', '${hash}', 'Active'),
        (2, 'OIHRMA20260002', '${hash}', 'Active'),
        (3, 'JODO20260003',   '${hash}', 'Active');
    `);
    console.log('✅ Seed users inserted. Default password: password123');
  } else {
    console.log('ℹ️  Existing data found — skipping seed.');
  }

  await initConn.end();
}

// ─────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────
const authRouter       = require('./routes/auth');
const employeesRouter  = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');
const leavesRouter     = require('./routes/leaves');
const salaryRouter     = require('./routes/salary');

app.use('/api/auth',       authRouter);
app.use('/api/employees',  employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves',     leavesRouter);
app.use('/api/salary',     salaryRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dayflow HRMS Backend is running!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// ─────────────────────────────────────────────────────────
// Boot: init DB → then start listening
// ─────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('\n❌ Database initialisation failed!');
    console.error('   → Make sure MySQL is running (XAMPP Control Panel → Start MySQL)');
    console.error('   → Check DB_USER / DB_PASSWORD in your .env file');
    console.error('   → Error:', err.message, '\n');
    process.exit(1); // Exit so nodemon can restart cleanly after you fix MySQL
  });
