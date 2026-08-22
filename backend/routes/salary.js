const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get Base Salary for a role
const getBaseSalary = (role) => {
  const normalized = role.toUpperCase();
  if (normalized === 'ADMIN') return 80000;
  if (normalized === 'HR') return 60000;
  return 40000; // Default EMPLOYEE base salary
};

// Helper to calculate overlapping days of a leave request with a specific month/year
const getMonthOverlapDays = (fromDateStr, toDateStr, year, month) => {
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);
  
  // month parameter is 1-indexed (1 = Jan, 12 = Dec)
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0); // Last day of month

  const overlapStart = fromDate > startOfMonth ? fromDate : startOfMonth;
  const overlapEnd = toDate < endOfMonth ? toDate : endOfMonth;

  if (overlapStart > overlapEnd) {
    return 0;
  }

  const diffTime = overlapEnd - overlapStart;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// Calculate Salary Endpoint
router.get('/', authenticateToken, async (req, res) => {
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';
  const { emp_id, month, year } = req.query;

  // Set default month & year if not provided
  const now = new Date();
  const targetYear = parseInt(year) || now.getFullYear();
  const targetMonth = parseInt(month) || (now.getMonth() + 1); // 1-indexed month

  let targetEmpId = null;
  if (!isManager) {
    // Regular employee can only view their own salary
    targetEmpId = req.user.emp_id;
  } else if (emp_id) {
    // Admin/HR can filter by specific employee
    targetEmpId = emp_id;
  }

  try {
    // Get employee list
    let empQuery = 'SELECT emp_id, emp_name, emp_department, emp_role, emp_email, emp_phno FROM Employee';
    const empParams = [];
    if (targetEmpId) {
      empQuery += ' WHERE emp_id = ?';
      empParams.push(targetEmpId);
    }
    const [employees] = await db.query(empQuery, empParams);

    const salaryList = [];

    for (const emp of employees) {
      const baseSalary = getBaseSalary(emp.emp_role);

      // 1. Calculate Worked Days (attendance rows in target month/year)
      const [attendanceRows] = await db.query(
        'SELECT DISTINCT attendance_date FROM Attendance WHERE emp_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?',
        [emp.emp_id, targetYear, targetMonth]
      );
      const workedDays = attendanceRows.length;

      // 2. Calculate Leave Days (Approved leaves overlapping target month)
      const [leaveRows] = await db.query(
        "SELECT from_date, to_date FROM Leave_Request WHERE emp_id = ? AND approved_status = 'Approved' AND ((YEAR(from_date) = ? AND MONTH(from_date) = ?) OR (YEAR(to_date) = ? AND MONTH(to_date) = ?))",
        [emp.emp_id, targetYear, targetMonth, targetYear, targetMonth]
      );

      let leaveDays = 0;
      for (const leave of leaveRows) {
        leaveDays += getMonthOverlapDays(leave.from_date, leave.to_date, targetYear, targetMonth);
      }

      // Max total days in calendar month
      const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      // Absent Days calculation: Total Days in Month - Worked Days - Leave Days
      const absentDays = Math.max(0, totalDaysInMonth - workedDays - leaveDays);

      // Deductions formula: (Base Salary / 30) * absentDays
      const deductions = parseFloat(((baseSalary / 30) * absentDays).toFixed(2));

      // Net Salary formula
      const netSalary = Math.max(0, parseFloat((baseSalary - deductions).toFixed(2)));

      salaryList.push({
        emp_id: emp.emp_id,
        emp_name: emp.emp_name,
        emp_department: emp.emp_department,
        emp_role: emp.emp_role,
        base_salary: baseSalary,
        worked_days: workedDays,
        leave_days: leaveDays,
        absent_days: absentDays,
        deductions: deductions,
        net_salary: netSalary,
        month: targetMonth,
        year: targetYear
      });
    }

    return res.json(salaryList);
  } catch (error) {
    console.error('Salary calculation error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
