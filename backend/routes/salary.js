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

// Helper to count working days in a month based on working_days_per_week configuration
const countWorkingDaysInMonth = (year, month, workingDaysPerWeek) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay(); 
    // dayOfWeek: 0 = Sunday, 1 = Monday, 6 = Saturday
    // If workingDaysPerWeek is 5, working days are Mon-Fri (1 to 5)
    // If workingDaysPerWeek is 6, working days are Mon-Sat (1 to 6)
    if (dayOfWeek >= 1 && dayOfWeek <= workingDaysPerWeek) {
      workingDays++;
    }
  }
  return workingDays;
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

// Helper to determine overlap dates as an array of strings ('YYYY-MM-DD')
const getOverlapDates = (fromDateStr, toDateStr, year, month) => {
  const dates = [];
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  let current = fromDate > startOfMonth ? new Date(fromDate) : new Date(startOfMonth);
  const end = toDate < endOfMonth ? new Date(toDate) : new Date(endOfMonth);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
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

    // Fetch locked payroll records for this company and month
    const [lockedRecords] = await db.query(
      `SELECT pr.*, e.emp_name, e.emp_department, e.emp_role, c.company_name 
       FROM Payroll_Record pr 
       JOIN Employee e ON pr.emp_id = e.emp_id 
       LEFT JOIN Company c ON e.company_id = c.company_id 
       WHERE pr.month = ? AND pr.year = ? AND e.company_id = ?`,
      [targetMonth, targetYear, companyId]
    );

    const lockedMap = new Map();
    for (const r of lockedRecords) {
      lockedMap.set(r.emp_id, r);
    }

    const salaryList = [];

    for (const emp of employees) {
      if (lockedMap.has(emp.emp_id)) {
        const locked = lockedMap.get(emp.emp_id);
        salaryList.push({
          ...locked,
          monthly_wage: locked.base_salary, // frontend expects monthly_wage
          is_locked: true
        });
        continue;
      }

      // 1. Check if HR/Admin has customized this employee's salary in the Salary table
      const [customSalRows] = await db.query('SELECT * FROM Salary WHERE emp_id = ?', [emp.emp_id]);

      let baseSalary = getBaseSalary(emp.emp_role);
      let customSal = null;
      let workingDaysPerWeek = 5;

      if (customSalRows.length > 0) {
        customSal = customSalRows[0];
        if (parseFloat(customSal.Monthly_Wage) > 0) {
          baseSalary = parseFloat(customSal.Monthly_Wage);
        }
        workingDaysPerWeek = customSal.working_days_per_week || 5;
      }

      // Configured Components (Full amounts before prorating)
      const cBasic  = customSal ? parseFloat(customSal.Basic_Salary) : parseFloat((baseSalary * 0.50).toFixed(2));
      const cHra    = customSal ? parseFloat(customSal.HRA) : parseFloat((baseSalary * 0.20).toFixed(2));
      const cStAll  = customSal ? parseFloat(customSal.St_Allowance) : parseFloat((baseSalary * 0.15).toFixed(2));
      const cPerf   = customSal ? parseFloat(customSal.Performance_Bonus) : parseFloat((baseSalary * 0.05).toFixed(2));
      const cLta    = customSal ? parseFloat(customSal.Leave_Travel_Allowance) : parseFloat((baseSalary * 0.05).toFixed(2));
      const cFixAll = customSal ? parseFloat(customSal.fixed_Allowance) : parseFloat((baseSalary * 0.05).toFixed(2));
      
      // Statutory Deductions (NOT prorated)
      const pf           = customSal ? parseFloat(customSal.Provident_fund) : parseFloat((baseSalary * 0.06).toFixed(2));
      const taxDeduction = customSal ? parseFloat(customSal.Tax_Deduction) : parseFloat((baseSalary * 0.04).toFixed(2));

      // 2. Calculate Working Days in the month
      const totalWorkingDays = countWorkingDaysInMonth(targetYear, targetMonth, workingDaysPerWeek);

      // 3. Calculate Present Days (Unique attendance dates in the month)
      const [attendanceRows] = await db.query(
        'SELECT DISTINCT DATE_FORMAT(attendance_date, "%Y-%m-%d") as date_str FROM Attendance WHERE emp_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?',
        [emp.emp_id, targetYear, targetMonth]
      );
      
      const presentDates = new Set(attendanceRows.map(r => r.date_str));
      const presentDays = presentDates.size;

      // 4. Calculate Leave Days
      const [leaveRows] = await db.query(
        "SELECT leave_type, from_date, to_date FROM Leave_Request WHERE emp_id = ? AND approved_status = 'Approved' AND ((YEAR(from_date) = ? AND MONTH(from_date) = ?) OR (YEAR(to_date) = ? AND MONTH(to_date) = ?))",
        [emp.emp_id, targetYear, targetMonth, targetYear, targetMonth]
      );

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const leave of leaveRows) {
        const type = (leave.leave_type || '').toLowerCase();
        const isUnpaid = type.includes('unpaid') || type.includes('lwp');
        
        const overlapDates = getOverlapDates(leave.from_date, leave.to_date, targetYear, targetMonth);
        
        for (const dateStr of overlapDates) {
          const dateObj = new Date(dateStr);
          const dayOfWeek = dateObj.getDay();
          
          // Only count leave if it falls on a scheduled working day
          if (dayOfWeek >= 1 && dayOfWeek <= workingDaysPerWeek) {
            // Prevent duplicate counting: If employee punched in, don't count it as a leave day for payroll
            if (!presentDates.has(dateStr)) {
              if (isUnpaid) {
                unpaidLeaveDays++;
              } else {
                paidLeaveDays++;
              }
            }
          }
        }
      }

      // 5. Calculate Payable Days and Attendance Factor
      let payableDays = presentDays + paidLeaveDays;
      if (payableDays > totalWorkingDays) {
        payableDays = totalWorkingDays;
      }
      
      const unpaidDays = Math.max(0, totalWorkingDays - payableDays);
      const attendanceFactor = totalWorkingDays > 0 ? (payableDays / totalWorkingDays) : 0;

      // 6. Prorate Salary Components
      const basicSalary = parseFloat((cBasic * attendanceFactor).toFixed(2));
      const hra         = parseFloat((cHra * attendanceFactor).toFixed(2));
      const stAllowance = parseFloat((cStAll * attendanceFactor).toFixed(2));
      const perfBonus   = parseFloat((cPerf * attendanceFactor).toFixed(2));
      const lta         = parseFloat((cLta * attendanceFactor).toFixed(2));
      const fixedAllow  = parseFloat((cFixAll * attendanceFactor).toFixed(2));

      const grossEarnings = basicSalary + hra + stAllowance + perfBonus + lta + fixedAllow;
      
      // Calculate amount lost due to absenteeism (for display purposes)
      const maxGross = cBasic + cHra + cStAll + cPerf + cLta + cFixAll;
      const deductions = parseFloat((maxGross - grossEarnings).toFixed(2));

      // Net Salary formula: (Prorated Gross Earnings) - (PF + Tax)
      const calculatedNet = grossEarnings - pf - taxDeduction;
      const netSalary = Math.max(0, parseFloat(calculatedNet.toFixed(2)));

      salaryList.push({
        emp_id: emp.emp_id,
        emp_name: emp.emp_name,
        emp_department: emp.emp_department,
        emp_role: emp.emp_role,
        company_name: emp.company_name || null,
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
        worked_days: presentDays,
        leave_days: paidLeaveDays + unpaidLeaveDays,
        paid_leave_days: paidLeaveDays,
        unpaid_leave_days: unpaidLeaveDays,
        payable_days: payableDays,
        total_working_days: totalWorkingDays,
        deductions: deductions,
        net_salary: netSalary,
        month: targetMonth,
        year: targetYear,
        is_locked: false
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
    Tax_Deduction,
    working_days_per_week
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
           Provident_fund = ?, Tax_Deduction = ?, working_days_per_week = ?
         WHERE emp_id = ?`,
        [
          Monthly_Wage, Basic_Salary, HRA, St_Allowance,
          Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance,
          Provident_fund, Tax_Deduction, working_days_per_week || 5, emp_id
        ]
      );
    } else {
      await db.query(
        `INSERT INTO Salary
         (emp_id, Monthly_Wage, Basic_Salary, HRA, St_Allowance, Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance, Provident_fund, Tax_Deduction, working_days_per_week)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          emp_id, Monthly_Wage, Basic_Salary, HRA, St_Allowance,
          Performance_Bonus, Leave_Travel_Allowance, fixed_Allowance,
          Provident_fund, Tax_Deduction, working_days_per_week || 5
        ]
      );
    }

    return res.json({ message: 'Salary structure updated successfully!' });
  } catch (error) {
    console.error('Update salary error:', error);
    return res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// Lock Payroll (HR/Admin Only)
router.post('/lock', authenticateToken, async (req, res) => {
  const isManager = req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR';
  if (!isManager) {
    return res.status(403).json({ message: 'Access Denied: Only HR or Admin can lock payroll.' });
  }

  const { month, year, payrolls } = req.body;
  if (!month || !year || !payrolls || !Array.isArray(payrolls)) {
    return res.status(400).json({ message: 'Month, year, and payrolls array are required.' });
  }

  const companyId = req.user.company_id;

  try {
    // Verify each payroll's emp_id belongs to the admin's company
    const empIds = payrolls.map(p => p.emp_id);
    if (empIds.length > 0) {
      const placeholders = empIds.map(() => '?').join(',');
      const [validEmps] = await db.query(
        `SELECT emp_id FROM Employee WHERE company_id = ? AND emp_id IN (${placeholders})`,
        [companyId, ...empIds]
      );
      
      if (validEmps.length !== empIds.length) {
        return res.status(403).json({ message: 'Cannot lock payroll for employees outside your company.' });
      }
    }

    // Insert locked records
    for (const p of payrolls) {
      await db.query(
        `INSERT INTO Payroll_Record
         (emp_id, month, year, base_salary, basic_salary, hra, st_allowance, performance_bonus, leave_travel_allowance, fixed_allowance, provident_fund, tax_deduction, worked_days, leave_days, paid_leave_days, unpaid_leave_days, payable_days, total_working_days, deductions, net_salary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         base_salary = VALUES(base_salary), net_salary = VALUES(net_salary)`,
        [
          p.emp_id, month, year, p.base_salary, p.basic_salary, p.hra, p.st_allowance, 
          p.performance_bonus, p.leave_travel_allowance, p.fixed_allowance, 
          p.provident_fund, p.tax_deduction, p.worked_days, p.leave_days, 
          p.paid_leave_days, p.unpaid_leave_days, p.payable_days, 
          p.total_working_days, p.deductions, p.net_salary
        ]
      );
    }

    return res.json({ message: 'Payroll successfully locked for ' + month + '/' + year });
  } catch (error) {
    console.error('Lock payroll error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
