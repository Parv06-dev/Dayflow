const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdminOrHR } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY NOTE: All manager-level queries join back to Employee and filter
// by e.company_id = req.user.company_id to prevent cross-tenant data leakage.
// Regular employees can only see/create their own leave requests (emp_id from JWT).
// ─────────────────────────────────────────────────────────────────────────────

// Apply for leave (Authenticated users) — emp_id from JWT, inherently tenant-safe
router.post('/', authenticateToken, async (req, res) => {
  const { from_date, to_date, reason, leave_type } = req.body;
  const empId = req.user.emp_id;

  if (!from_date || !to_date || !reason) {
    return res.status(400).json({ message: 'From date, to date, and reason are required' });
  }

  const type = leave_type || 'Paid time Off';

  try {
    await db.query(
      'INSERT INTO Leave_Request (emp_id, leave_type, from_date, to_date, reason, approved_status, approved_by) VALUES (?, ?, ?, ?, ?, ?, NULL)',
      [empId, type, from_date, to_date, reason, 'Pending']
    );
    return res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// List leaves — employees see own; managers see all within their company
router.get('/', authenticateToken, async (req, res) => {
  const { emp_id, status } = req.query;
  const companyId = req.user.company_id;
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';

  try {
    // SECURITY: The base JOIN to Employee + company_id filter ensures managers
    // only see leave requests from their own company, regardless of any emp_id
    // query param provided in the request.
    let query = `
      SELECT lr.*, e.emp_name, e.emp_department, e.emp_role, mgr.emp_name as manager_name
      FROM Leave_Request lr
      JOIN Employee e ON lr.emp_id = e.emp_id AND e.company_id = ?
      LEFT JOIN Employee mgr ON lr.approved_by = mgr.emp_id
      WHERE 1=1
    `;
    const params = [companyId];

    if (!isManager) {
      // Regular employees: only their own leave requests
      query += ' AND lr.emp_id = ?';
      params.push(req.user.emp_id);
    } else if (emp_id) {
      // Managers requesting a specific employee's leaves:
      // the JOIN already ensures emp belongs to the same company
      query += ' AND lr.emp_id = ?';
      params.push(emp_id);
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

// Fetch pending leave requests (Admin/HR Only) — tenant-scoped
router.get('/pending', authenticateToken, isAdminOrHR, async (req, res) => {
  const companyId = req.user.company_id;

  try {
    // SECURITY: JOIN to Employee + company_id = ? ensures only this company's
    // pending leaves are returned.
    const [rows] = await db.query(
      `SELECT lr.*, e.emp_name, e.emp_department, e.emp_role
       FROM Leave_Request lr
       JOIN Employee e ON lr.emp_id = e.emp_id AND e.company_id = ?
       WHERE lr.approved_status = 'Pending'
       ORDER BY lr.from_date ASC`,
      [companyId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Fetch pending leaves error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Approve or Reject a Leave (Admin/HR Only) — tenant-scoped ownership check
router.put('/:id', authenticateToken, isAdminOrHR, async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.company_id;
  const statusInput = req.body.status || req.body.approved_status;
  const managerId = req.user.emp_id;

  if (!statusInput || !['Approved', 'Rejected', 'Refused'].includes(statusInput)) {
    return res.status(400).json({ message: 'Status must be either "Approved" or "Rejected"' });
  }

  const finalStatus = statusInput === 'Refused' ? 'Rejected' : statusInput;

  try {
    // SECURITY: Verify the leave request belongs to an employee in THIS company.
    // This prevents a manager from Company A approving Company B's leave requests.
    const [existing] = await db.query(
      `SELECT lr.leave_id
       FROM Leave_Request lr
       JOIN Employee e ON lr.emp_id = e.emp_id AND e.company_id = ?
       WHERE lr.leave_id = ?`,
      [companyId, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    await db.query(
      'UPDATE Leave_Request SET approved_status = ?, approved_by = ? WHERE leave_id = ?',
      [finalStatus, managerId, id]
    );

    return res.json({ message: `Leave request successfully ${finalStatus.toLowerCase()}` });
  } catch (error) {
    console.error('Approve/Reject leave error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
