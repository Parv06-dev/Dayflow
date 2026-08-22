const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdminOrHR } = require('../middleware/auth');

// Apply for leave (Authenticated users)
router.post('/', authenticateToken, async (req, res) => {
  const { from_date, to_date, reason } = req.body;
  const empId = req.user.emp_id;

  if (!from_date || !to_date || !reason) {
    return res.status(400).json({ message: 'From date, to date, and reason are required' });
  }

  try {
    await db.query(
      'INSERT INTO Leave_Request (emp_id, from_date, to_date, reason, approved_status, approved_by) VALUES (?, ?, ?, ?, ?, NULL)',
      [empId, from_date, to_date, reason, 'Pending']
    );
    return res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// List leaves (Employees see own, Admin/HR see all or filtered by emp_id)
router.get('/', authenticateToken, async (req, res) => {
  const { emp_id, status } = req.query;
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';

  let targetEmpId = req.user.emp_id;
  if (isManager && emp_id) {
    targetEmpId = emp_id;
  }

  try {
    let query = 'SELECT lr.*, e.emp_name, e.emp_department, e.emp_role, mgr.emp_name as manager_name FROM Leave_Request lr JOIN Employee e ON lr.emp_id = e.emp_id LEFT JOIN Employee mgr ON lr.approved_by = mgr.emp_id WHERE 1=1';
    const params = [];

    // If not manager, strictly filter by own ID
    if (!isManager) {
      query += ' AND lr.emp_id = ?';
      params.push(targetEmpId);
    } else if (emp_id) {
      query += ' AND lr.emp_id = ?';
      params.push(targetEmpId);
    }

    if (status) {
      query += ' AND lr.approved_status = ?';
      params.push(status);
    }

    query += ' ORDER BY lr.from_date DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error('Fetch leaves error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Fetch pending leave requests (Admin/HR Only)
router.get('/pending', authenticateToken, isAdminOrHR, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT lr.*, e.emp_name, e.emp_department, e.emp_role FROM Leave_Request lr JOIN Employee e ON lr.emp_id = e.emp_id WHERE lr.approved_status = 'Pending' ORDER BY lr.from_date ASC"
    );
    return res.json(rows);
  } catch (error) {
    console.error('Fetch pending leaves error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Approve or Reject a Leave (Admin/HR Only)
router.put('/:id', authenticateToken, isAdminOrHR, async (req, res) => {
  const { id } = req.params;
  const { approved_status } = req.body;
  const managerId = req.user.emp_id;

  if (!approved_status || !['Approved', 'Rejected'].includes(approved_status)) {
    return res.status(400).json({ message: 'approved_status must be either "Approved" or "Rejected"' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM Leave_Request WHERE leave_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leave = existing[0];
    if (leave.approved_status !== 'Pending') {
      return res.status(400).json({ message: 'This leave request has already been processed' });
    }

    await db.query(
      'UPDATE Leave_Request SET approved_status = ?, approved_by = ? WHERE leave_id = ?',
      [approved_status, managerId, id]
    );

    return res.json({ message: `Leave request successfully ${approved_status.toLowerCase()}` });
  } catch (error) {
    console.error('Approve/Reject leave error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
