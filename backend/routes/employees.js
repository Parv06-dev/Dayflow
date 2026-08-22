const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, isAdmin, isAdminOrHR } = require('../middleware/auth');

// List & Search Employees (Authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  const { name, role } = req.query;

  try {
    let query = 'SELECT e.*, l.acc_status FROM Employee e LEFT JOIN Login l ON e.emp_id = l.emp_id WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND e.emp_name LIKE ?';
      params.push(`%${name}%`);
    }

    if (role) {
      query += ' AND e.emp_role = ?';
      params.push(role);
    }

    // Sort by name
    query += ' ORDER BY e.emp_name ASC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error('Fetch employees error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new Employee manually (Admin/HR Only)
router.post('/', authenticateToken, isAdminOrHR, async (req, res) => {
  const { name, department, role, email, phone, password } = req.body;

  if (!name || !department || !role || !email || !phone) {
    return res.status(400).json({ message: 'Name, department, role, email, and phone are required' });
  }

  const normalizedRole = role.toUpperCase();
  const normalizedEmail = email.toLowerCase();

  if (phone.length !== 10 || isNaN(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check unique email/phone
    const [existing] = await conn.query(
      'SELECT emp_id FROM Employee WHERE emp_email = ? OR emp_phno = ?',
      [email, phone]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    // Fetch user's company code
    const [companyRow] = await conn.query(
      `SELECT c.company_code, c.company_id 
       FROM Employee e JOIN Company c ON e.company_id = c.company_id 
       WHERE e.emp_id = ?`,
      [req.user.emp_id]
    );

    const compCode = companyRow.length > 0 ? companyRow[0].company_code : 'DF';
    const companyId = companyRow.length > 0 ? companyRow[0].company_id : null;

    // Generate Login ID
    const currentYear = new Date().getFullYear();
    const [serialRow] = await conn.query(
      'SELECT COUNT(*) as count FROM Employee WHERE joining_year = ?',
      [currentYear]
    );
    const serial = serialRow[0].count + 1;
    const { generateLoginId, generateTempPassword } = require('../utils/helpers');
    const loginId = generateLoginId(compCode, name, currentYear, serial);

    // Temp password if not specified
    const rawPassword = password || generateTempPassword();

    // Insert Employee
    const [empResult] = await conn.query(
      `INSERT INTO Employee 
       (login_id, emp_name, emp_department, emp_role, emp_email, emp_phno, joining_year, serial_num, company_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [loginId, name, department, normalizedRole, normalizedEmail, phone, currentYear, serial, companyId]
    );

    const empId = empResult.insertId;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Insert Login
    await conn.query(
      'INSERT INTO Login (emp_id, login_id, Password, acc_status, is_temp_pass) VALUES (?, ?, ?, ?, ?)',
      [empId, loginId, hashedPassword, 'Active', password ? false : true]
    );

    await conn.commit();
    return res.status(201).json({
      message: 'Employee created successfully',
      emp_id: empId,
      login_id: loginId,
      temp_password: rawPassword
    });
  } catch (error) {
    await conn.rollback();
    console.error('Add employee error:', error);
    return res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  } finally {
    conn.release();
  }
});

// Get detailed info for single employee
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Enforce access rule: Employee can view own, Admin/HR can view anyone's
  if (req.user.emp_role === 'EMPLOYEE' && String(req.user.emp_id) !== String(id)) {
    return res.status(403).json({ message: 'Access Denied: You can only view your own details' });
  }

  try {
    const [rows] = await db.query(
      'SELECT e.*, l.acc_status FROM Employee e LEFT JOIN Login l ON e.emp_id = l.emp_id WHERE e.emp_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Fetch employee detail error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update employee details
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, department, role, email, phone, acc_status, password } = req.body;

  const isSelf = String(req.user.emp_id) === String(id);
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';

  // Access check
  if (!isSelf && !isManager) {
    return res.status(403).json({ message: 'Access Denied: You cannot edit this profile' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch existing employee data
    const [existing] = await conn.query('SELECT e.*, l.acc_status FROM Employee e JOIN Login l ON e.emp_id = l.emp_id WHERE e.emp_id = ?', [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Employee not found' });
    }

    const currentEmp = existing[0];

    // Determine values to update
    const finalName = name !== undefined ? name : currentEmp.emp_name;
    const finalDept = (department !== undefined && isManager) ? department : currentEmp.emp_department;
    const finalRole = (role !== undefined && isManager) ? role.toUpperCase() : currentEmp.emp_role;
    const finalEmail = email !== undefined ? email.toLowerCase() : currentEmp.emp_email;
    const finalPhone = phone !== undefined ? phone : currentEmp.emp_phno;
    const finalStatus = (acc_status !== undefined && isManager) ? acc_status : currentEmp.acc_status;

    // Check unique email and phone if they changed
    if (finalEmail !== currentEmp.emp_email || finalPhone !== currentEmp.emp_phno) {
      const [dup] = await conn.query(
        'SELECT emp_id FROM Employee WHERE (emp_email = ? AND emp_id != ?) OR (emp_phno = ? AND emp_id != ?)',
        [finalEmail, id, finalPhone, id]
      );
      if (dup.length > 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'Email or Phone Number is already in use by another employee' });
      }
    }

    // Role-email check if updated
    if (finalRole !== currentEmp.emp_role || finalEmail !== currentEmp.emp_email) {
      if (finalRole === 'ADMIN') {
        if (!finalEmail.includes('@admin') && !finalEmail.endsWith('admin.com')) {
          await conn.rollback();
          return res.status(400).json({ message: 'Admin registration requires an email containing "@admin" or ending in "admin.com"' });
        }
      } else if (finalRole === 'HR') {
        if (!finalEmail.includes('@hr') && !finalEmail.endsWith('hr.com')) {
          await conn.rollback();
          return res.status(400).json({ message: 'HR registration requires an email containing "@hr" or ending in "hr.com"' });
        }
      }
    }

    // Update Employee table
    await conn.query(
      'UPDATE Employee SET emp_name = ?, emp_department = ?, emp_role = ?, emp_email = ?, emp_phno = ? WHERE emp_id = ?',
      [finalName, finalDept, finalRole, finalEmail, finalPhone, id]
    );

    // Update Login Status
    await conn.query(
      'UPDATE Login SET acc_status = ? WHERE emp_id = ?',
      [finalStatus, id]
    );

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await conn.query(
        'UPDATE Login SET Password = ? WHERE emp_id = ?',
        [hashedPassword, id]
      );
    }

    await conn.commit();
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Update employee error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// Delete Employee (Admin Only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  if (String(req.user.emp_id) === String(id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  try {
    const [result] = await db.query('DELETE FROM Employee WHERE emp_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({ message: 'Employee account deleted successfully (cascaded data removed)' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
