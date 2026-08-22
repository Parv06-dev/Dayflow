const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdminOrHR } = require('../middleware/auth');

// Helper to format date as YYYY-MM-DD in local time
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format time as HH:MM:SS in local time
const getLocalTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Clock In / Clock Out Toggle (Authenticated users)
router.post('/punch', authenticateToken, async (req, res) => {
  const empId = req.user.emp_id;
  const today = getLocalDateString();
  const nowTime = getLocalTimeString();

  try {
    // Check if record exists for today
    const [existing] = await db.query(
      'SELECT * FROM Attendance WHERE emp_id = ? AND attendance_date = ?',
      [empId, today]
    );

    if (existing.length === 0) {
      // Clock In (Insert new record)
      await db.query(
        'INSERT INTO Attendance (emp_id, attendance_date, login_time, logout_time) VALUES (?, ?, ?, NULL)',
        [empId, today, nowTime]
      );
      return res.json({
        type: 'IN',
        message: `Clocked In successfully at ${nowTime}`,
        login_time: nowTime,
        logout_time: null
      });
    } else {
      // Clock Out (Update existing record)
      const record = existing[0];
      
      // If already clocked out, allow updating or reject?
      // Updating is fine, as it logs the latest departure time.
      await db.query(
        'UPDATE Attendance SET logout_time = ? WHERE attendance_id = ?',
        [nowTime, record.attendance_id]
      );

      return res.json({
        type: 'OUT',
        message: `Clocked Out successfully at ${nowTime}`,
        login_time: record.login_time,
        logout_time: nowTime
      });
    }
  } catch (error) {
    console.error('Punch error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Check Current Status of User's Punch for Today (Authenticated users)
router.get('/status', authenticateToken, async (req, res) => {
  const empId = req.user.emp_id;
  const today = getLocalDateString();

  try {
    const [rows] = await db.query(
      'SELECT * FROM Attendance WHERE emp_id = ? AND attendance_date = ?',
      [empId, today]
    );

    if (rows.length === 0) {
      return res.json({ punchedIn: false, login_time: null, logout_time: null });
    } else {
      const record = rows[0];
      return res.json({
        punchedIn: true,
        login_time: record.login_time,
        logout_time: record.logout_time
      });
    }
  } catch (error) {
    console.error('Fetch punch status error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Dashboard Summary of Today's Attendance (Admin/HR Only)
router.get('/today', authenticateToken, isAdminOrHR, async (req, res) => {
  const today = getLocalDateString();

  try {
    // 1. Get all employees
    const [employees] = await db.query('SELECT emp_id, emp_name, emp_department, emp_role FROM Employee');
    
    // 2. Get today's attendance records
    const [attendance] = await db.query(
      'SELECT a.*, e.emp_name, e.emp_department, e.emp_role FROM Attendance a JOIN Employee e ON a.emp_id = e.emp_id WHERE a.attendance_date = ?',
      [today]
    );

    // 3. Get today's approved leaves
    const [leaves] = await db.query(
      "SELECT emp_id FROM Leave_Request WHERE approved_status = 'Approved' AND ? BETWEEN from_date AND to_date",
      [today]
    );

    const presentMap = new Map(attendance.map(a => [a.emp_id, a]));
    const leaveSet = new Set(leaves.map(l => l.emp_id));

    let presentCount = attendance.length;
    let leaveCount = 0;
    let absentCount = 0;

    const punchList = employees.map(emp => {
      const hasPunch = presentMap.get(emp.emp_id);
      const isOnLeave = leaveSet.has(emp.emp_id);
      
      let status = 'Absent';
      if (hasPunch) {
        status = 'Present';
      } else if (isOnLeave) {
        status = 'On Leave';
        leaveCount++;
      } else {
        absentCount++;
      }

      return {
        emp_id: emp.emp_id,
        emp_name: emp.emp_name,
        emp_department: emp.emp_department,
        emp_role: emp.emp_role,
        login_time: hasPunch ? hasPunch.login_time : null,
        logout_time: hasPunch ? hasPunch.logout_time : null,
        status
      };
    });

    return res.json({
      date: today,
      stats: {
        total: employees.length,
        present: presentCount,
        onLeave: leaveCount,
        absent: absentCount
      },
      punches: punchList
    });
  } catch (error) {
    console.error('Fetch today attendance error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Fetch Single Employee's Attendance History (Self or Admin/HR)
router.get('/employee/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const isSelf = String(req.user.emp_id) === String(id);
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';

  if (!isSelf && !isManager) {
    return res.status(403).json({ message: 'Access Denied' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM Attendance WHERE emp_id = ? ORDER BY attendance_date DESC',
      [id]
    );

    // Calculate worked hours for each day
    const history = rows.map(r => {
      let workedHours = 0;
      if (r.login_time && r.logout_time) {
        const [linH, linM, linS] = r.login_time.split(':').map(Number);
        const [loutH, loutM, loutS] = r.logout_time.split(':').map(Number);

        const loginSec = linH * 3600 + linM * 60 + linS;
        const logoutSec = loutH * 3600 + loutM * 60 + loutS;

        workedHours = Math.max(0, (logoutSec - loginSec) / 3600);
      }

      return {
        ...r,
        workedHours: parseFloat(workedHours.toFixed(2))
      };
    });

    return res.json(history);
  } catch (error) {
    console.error('Fetch employee attendance history error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
