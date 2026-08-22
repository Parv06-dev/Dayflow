const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { generateCompanyCode, generateLoginId } = require('../utils/helpers');
require('dotenv').config();

// Login API (Supports Login ID OR Email)
router.post('/login', async (req, res) => {
  const { loginIdentifier, password } = req.body;
  // Fallback to email if loginIdentifier not passed directly
  const identifier = (loginIdentifier || req.body.email || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Login ID / Email and password are required' });
  }

  try {
    // Join Employee, Login, and Company tables
    const [users] = await db.query(
      `SELECT e.*, l.Password as hashedPassword, l.acc_status, l.login_id as loginId, l.is_temp_pass, c.company_name, c.logo_url 
       FROM Employee e 
       JOIN Login l ON e.emp_id = l.emp_id 
       LEFT JOIN Company c ON e.company_id = c.company_id 
       WHERE e.emp_email = ? OR e.login_id = ? OR l.login_id = ?`,
      [identifier, identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid Login ID / Email or password' });
    }

    const user = users[0];

    // Check account status
    if (user.acc_status !== 'Active') {
      return res.status(403).json({ message: 'Your account is currently inactive. Please contact Admin/HR.' });
    }

    // Compare bcrypt passwords
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Login ID / Email or password' });
    }

    // Generate JWT token (do NOT embed large base64 logo_url in JWT token!)
    const payload = {
      emp_id: user.emp_id,
      login_id: user.login_id || user.loginId,
      emp_name: user.emp_name,
      emp_role: user.emp_role,
      emp_email: user.emp_email,
      emp_department: user.emp_department,
      company_name: user.company_name || 'Dayflow',
      is_temp_pass: user.is_temp_pass || false
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dayflow_secret_key_123_abc_xyz',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        ...payload,
        logo_url: user.logo_url || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Company Sign Up API (Creates Company + Admin Account + Generates Login ID)
router.post('/register', async (req, res) => {
  const { companyName, logoUrl, name, email, phone, password, confirmPassword } = req.body;

  if (!companyName || !name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (phone.length !== 10 || isNaN(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check existing email or phone
    const [existing] = await conn.query(
      'SELECT emp_id FROM Employee WHERE emp_email = ? OR emp_phno = ?',
      [email, phone]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'An account with this email or phone number already exists' });
    }

    // 1. Create or get Company
    const compCode = generateCompanyCode(companyName);
    const [compResult] = await conn.query(
      'INSERT INTO Company (company_name, company_code, logo_url) VALUES (?, ?, ?)',
      [companyName, compCode, logoUrl || null]
    );
    const companyId = compResult.insertId;

    // 2. Compute Login ID
    const currentYear = new Date().getFullYear();
    const [serialRow] = await conn.query(
      'SELECT COUNT(*) as count FROM Employee WHERE joining_year = ?',
      [currentYear]
    );
    const serial = serialRow[0].count + 1;
    const loginId = generateLoginId(compCode, name, currentYear, serial);

    // 3. Create Admin Employee record
    const [empResult] = await conn.query(
      `INSERT INTO Employee 
       (login_id, emp_name, emp_department, emp_role, emp_email, emp_phno, joining_year, serial_num, company_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [loginId, name, 'Management', 'ADMIN', email, phone, currentYear, serial, companyId]
    );
    const empId = empResult.insertId;

    // 4. Create Login credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await conn.query(
      'INSERT INTO Login (emp_id, login_id, Password, acc_status) VALUES (?, ?, ?, ?)',
      [empId, loginId, hashedPassword, 'Active']
    );

    await conn.commit();

    return res.status(201).json({
      message: 'Company Sign Up successful!',
      loginId: loginId,
      email: email
    });
  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
