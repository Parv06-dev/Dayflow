const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

// Login API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Join Employee and Login tables
    const [users] = await db.query(
      'SELECT e.*, l.Password as hashedPassword, l.acc_status FROM Employee e JOIN Login l ON e.emp_id = l.emp_id WHERE e.emp_email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check account status
    if (user.acc_status !== 'Active') {
      return res.status(403).json({ message: 'Your account is currently inactive. Please contact Admin/HR.' });
    }

    // Compare bcrypt passwords
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const payload = {
      emp_id: user.emp_id,
      emp_name: user.emp_name,
      emp_role: user.emp_role,
      emp_email: user.emp_email,
      emp_department: user.emp_department
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dayflow_secret_key_123_abc_xyz',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Register API
router.post('/register', async (req, res) => {
  const { name, department, role, email, phone, password } = req.body;

  if (!name || !department || !role || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Strictly check email rules from the reference wireframe
  const normalizedRole = role.toUpperCase();
  const normalizedEmail = email.toLowerCase();

  if (normalizedRole === 'ADMIN') {
    if (!normalizedEmail.includes('@admin') && !normalizedEmail.endsWith('admin.com')) {
      return res.status(400).json({ message: 'Admin registration requires an email containing "@admin" or ending in "admin.com"' });
    }
  } else if (normalizedRole === 'HR') {
    if (!normalizedEmail.includes('@hr') && !normalizedEmail.endsWith('hr.com')) {
      return res.status(400).json({ message: 'HR registration requires an email containing "@hr" or ending in "hr.com"' });
    }
  }

  // Validate phone number length
  if (phone.length !== 10 || isNaN(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check if email or phone already exists
    const [existing] = await conn.query(
      'SELECT emp_id FROM Employee WHERE emp_email = ? OR emp_phno = ?',
      [email, phone]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'An employee with this email or phone number already exists' });
    }

    // Insert into Employee
    const [empResult] = await conn.query(
      'INSERT INTO Employee (emp_name, emp_department, emp_role, emp_email, emp_phno) VALUES (?, ?, ?, ?, ?)',
      [name, department, normalizedRole, email, phone]
    );

    const empId = empResult.insertId;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert into Login
    await conn.query(
      'INSERT INTO Login (emp_id, Password, acc_status) VALUES (?, ?, ?)',
      [empId, hashedPassword, 'Active']
    );

    await conn.commit();
    return res.status(201).json({ message: 'Registration successful! You can now log in.' });
  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
