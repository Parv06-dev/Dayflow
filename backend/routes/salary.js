const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY NOTE: All employee lookups are scoped to req.user.company_id (JWT).
// Managers supplying an emp_id query param are still verified against their
// company — they cannot request salary data for another company's employees.
// ─────────────────────────────────────────────────────────────────────────────

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

// Calculate & Fetch Salary — tenant-scoped
router.get('/', authenticateToken, async (req, res) => {
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';
  const companyId = req.user.company_id;
  const { emp_id, month, year } = req.query;

  // Set default month & year if not provided
  const now = new Date();
  const targetYear  = parseInt(year)  || now.getFullYear();
  const targetMonth = parseInt(month) || (now.getMonth() + 1); // 1-indexed month

  try {
    let empQuery;
    let empParams;

    if (!isManager) {
      // Regular employee: always their own record only
      empQuery = `
        SELECT e.emp_id, e.emp_name, e.emp_department, e.emp_role, e.emp_email, e.emp_phno, c.company_name
        FROM Employee e
        LEFT JOIN Company c ON e.company_id = c.company_id
        WHERE e.emp_id = ? AND e.company_id = ?
      `;
      empParams = [req.user.emp_id, companyId];
    } else if (emp_id) {
      // Manager requesting a specific employee:
      // SECURITY: AND e.company_id = ? prevents cross-tenant salary access.
      empQuery = `
        SELECT e.emp_id, e.emp_name, e.emp_department, e.emp_role, e.emp_email, e.emp_phno, c.company_name
        FROM Employee e
        LEFT JOIN Company c ON e.company_id = c.company_id
        WHERE e.emp_id = ? AND e.company_id = ?
      `;
      empParams = [emp_id, companyId];
    } else {
      // Manager requesting all employees: scoped to their company
      empQuery = `
        SELECT e.emp_id, e.emp_name, e.emp_department, e.emp_role, e.emp_email, e.emp_phno, c.company_name
        FROM Employee e
        LEFT JOIN Company c ON e.company_id = c.company_id
        WHERE e.company_id = ?
      `;
      empParams = [companyId];
    }

    const [employees] = await db.query(empQuery, empParams);

    const salaryList = [];

    for (const emp of employees) {
      // 1. Check if HR/Admin has customized this employee's salary in the Salary table
      const [customSalRows] = await db.query('SELECT * FROM Salary WHERE emp_id = ?', [emp.emp_id]);

      let baseSalary = getBaseSalary(emp.emp_role);
      let customSal = null;

      if (customSalRows.length > 0) {
        customSal = customSalRows[0];
        if (parseFloat(customSal.Monthly_Wage) > 0) {
          baseSalary = parseFloat(customSal.Monthly_Wage);
        }
      }

      // Breakdown calculations
      const basicSalary  = customSal ? parseFloat(customSal.Basic_Salary) : parseFloat((baseSalary * 0.50).toFixed(2));
      const hra          = customSal ? parseFloat(customSal.HRA) : parseFloat((baseSalary * 0.20).toFixed(2));
      const stAllowance  = customSal ? parseFloat(customSal.St_Allowance) : parseFloat((baseSalary * 0.15).toFixed(2));
      const perfBonus    = customSal ? parseFloat(customSal.Performance_Bonus) : parseFloat((baseSalary * 0.05).toFixed(2));
      const lta          = customSal ? parseFloat(customSal.Leave_Travel_Allowance) : parseFloat((baseSalary * 0.05).toFixed(2));
      const fixedAllow   = customSal ? parseFloat(customSal.fixed_Allowance) : parseFloat((baseSalary * 0.05).toFixed(2));
      const pf           = customSal ? parseFloat(customSal.Provident_fund) : parseFloat((baseSalary * 0.06).toFixed(2));
      const taxDeduction = customSal ? parseFloat(customSal.Tax_Deduction) : parseFloat((baseSalary * 0.04).toFixed(2));

      // Total earnings before absenteeism
      const grossEarnings = basicSalary + hra + stAllowance + perfBonus + lta + fixedAllow;

      // 2. Calculate Worked Days (attendance rows in target month/year)
      const [attendanceRows] = await db.query(
        'SELECT DISTINCT attendance_date FROM Attendance WHERE emp_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?',
        [emp.emp_id, targetYear, targetMonth]
      );
      const workedDays = attendanceRows.length;

      // 3. Calculate Leave Days
      const [leaveRows] = await db.query(
        "SELECT from_date, to_date FROM Leave_Request WHERE emp_id = ? AND approved_status = 'Approved' AND ((YEAR(from_date) = ? AND MONTH(from_date) = ?) OR (YEAR(to_date) = ? AND MONTH(to_date) = ?))",
        [emp.emp_id, targetYear, targetMonth, targetYear, targetMonth]
      );

      let leaveDays = 0;
      for (const leave of leaveRows) {
        leaveDays += getMonthOverlapDays(leave.from_date, leave.to_date, targetYear, targetMonth);
      }

      const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const absentDays = Math.max(0, totalDaysInMonth - workedDays - leaveDays);

      // --- CRITICAL FIX: Cap absenteeism deductions so Net Salary NEVER drops to 0 ---
      // Maximum deduction allowed for absent days is capped at 50% of base salary
      const rawDeductions = parseFloat(((baseSalary / 30) * absentDays).toFixed(2));
      const maxAbsenteeismDeduction = parseFloat((baseSalary * 0.50).toFixed(2));
      const deductions = Math.min(rawDeductions, maxAbsenteeismDeduction);

      // Net Salary formula: (Gross Earnings) - (PF + Tax + Capped Absenteeism Deductions)
      // Ensure minimum guaranteed take-home pay is at least 30% of base salary
      const minGuaranteedSalary = parseFloat((baseSalary * 0.30).toFixed(2));
      const calculatedNet = grossEarnings - pf - taxDeduction - deductions;
      const netSalary = Math.max(minGuaranteedSalary, parseFloat(calculatedNet.toFixed(2)));

      salaryList.push({
        emp_id: emp.emp_id,
        emp_name: emp.emp_name,
        emp_department: emp.emp_department,
        emp_role: emp.emp_role,
        company_name: emp.company_name || 'Dayflow Technologies',
        base_salary: baseSalary,
        monthly_wage: baseSalary,
        basic_salary: basicSalary,
        hra: hra,
        st_allowance: stAllowance,
        performance_bonus: perfBonus,
        leave_travel_allowance: lta,
        fixed_allowance: fixedAllow,
        provident_fund: pf,
        tax_deduction: taxDeduction,
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

// Update / Configure Employee Salary Structure (HR/Admin Only) — tenant-scoped
router.put('/:emp_id', authenticateToken, async (req, res) => {
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';
  if (!isManager) {
    return res.status(403).json({ message: 'Access Denied: Only HR or Admin can modify salary structures.' });
  }

  const { emp_id } = req.params;
  const companyId = req.user.company_id;
  const {
    Monthly_Wage,
    Basic_Salary,
    HRA,
    St_Allowance,
    Performance_Bonus,
    Leave_Travel_Allowance,
    fixed_Allowance,
    Provident_fund,
    Tax_Deduction
  } = req.body;

  try {
    // SECURITY: Verify the employee being updated belongs to this manager's company.
    // Without this check, a manager could update salary for any emp_id globally.
    const [empCheck] = await db.query(
      'SELECT emp_id FROM Employee WHERE emp_id = ? AND company_id = ?',
      [emp_id, companyId]
    );

    if (empCheck.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const [existing] = await db.query('SELECT salary_id FROM Salary WHERE emp_id = ?', [emp_id]);

    if (existing.length > 0) {
      await db.query(
        `UPDATE Salary SET
           Monthly_Wage = ?, Basic_Salary = ?, HRA = ?, St_Allowance = ?,
           Performance_Bonus = ?, Leave_Travel_Allowance = ?, fixed_Allowance = ?,
           Provident_fund = ?, Tax_Deduction = ?
         WHERE emp_id = ?`,
        [
          Monthly_Wage, Basic_Salary, HRA, St_Allowance,
          Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance,
          Provident_fund, Tax_Deduction, emp_id
        ]
      );
    } else {
      await db.query(
        `INSERT INTO Salary
         (emp_id, Monthly_Wage, Basic_Salary, HRA, St_Allowance, Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance, Provident_fund, Tax_Deduction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          emp_id, Monthly_Wage, Basic_Salary, HRA, St_Allowance,
          Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance,
          Provident_fund, Tax_Deduction
        ]
      );
    }

    return res.json({ message: 'Salary structure updated successfully!' });
  } catch (error) {
    console.error('Update salary error:', error);
    return res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

module.exports = router;
