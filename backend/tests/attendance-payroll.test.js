/**
 * attendance-payroll.test.js
 *
 * Tests the attendance-based salary calculation logic.
 */

'use strict';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

// ─── Mock the database module ────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.mock('../db', () => ({
  query: (...args) => mockQuery(...args),
}));

const express  = require('express');
const salaryRouter = require('../routes/salary');

const app = express();
app.use(express.json());
app.use('/api/salary', salaryRouter);

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_secret_key_123_abc_xyz';
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const mockAdminToken = signToken({ emp_id: 1, emp_role: 'ADMIN', company_id: 1 });

describe('Attendance-Based Salary Calculation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates full salary when attendance is perfect', async () => {
    mockQuery
      // 1. Employee query
      .mockResolvedValueOnce([[{ emp_id: 2, emp_name: 'John', emp_role: 'EMPLOYEE', company_name: 'Test Co' }]])
      // 2. Payroll_Record query (empty)
      .mockResolvedValueOnce([[]])
      // 3. Salary Config query (Wage = 100,000, 5 days/week)
      .mockResolvedValueOnce([[{ Monthly_Wage: 100000, working_days_per_week: 5, Basic_Salary: 50000, HRA: 25000, St_Allowance: 10000, Performance_Bonus: 5000, Leave_Travel_Allowance: 5000, fixed_Allowance: 5000, Provident_fund: 5000, Tax_Deduction: 1000 }]])
      // 4. Attendance query (Present 22 days out of a 22-working-day month)
      .mockResolvedValueOnce([
        Array.from({ length: 22 }, (_, i) => ({ date_str: `2026-08-${String(i+1).padStart(2, '0')}` }))
      ])
      // 5. Leaves query (no leaves)
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/salary?month=8&year=2026&emp_id=2')
      .set('Authorization', `Bearer ${mockAdminToken}`);

    expect(res.status).toBe(200);
    const sal = res.body[0];
    
    expect(sal.payable_days).toBeGreaterThanOrEqual(20);
    expect(sal.basic_salary).toBe(50000); // 100% factor
    expect(sal.net_salary).toBe(100000 - 5000 - 1000); // Gross - PF - Tax
  });

  it('prorates salary components when employee has unpaid leaves', async () => {
    // 21 working days in Aug 2026 for 5 days/week (it varies, let's assume totalWorkingDays is ~21)
    // We mock attendance = 10 days, Unpaid Leave = 5 days.
    
    mockQuery
      .mockResolvedValueOnce([[{ emp_id: 2, emp_name: 'John', emp_role: 'EMPLOYEE', company_name: 'Test Co' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ Monthly_Wage: 100000, working_days_per_week: 5, Basic_Salary: 50000, HRA: 25000, St_Allowance: 10000, Performance_Bonus: 5000, Leave_Travel_Allowance: 5000, fixed_Allowance: 5000, Provident_fund: 5000, Tax_Deduction: 1000 }]])
      .mockResolvedValueOnce([
        Array.from({ length: 10 }, (_, i) => ({ date_str: `2026-08-${String(i+1).padStart(2, '0')}` })) // 10 days present
      ])
      .mockResolvedValueOnce([
        [{ leave_type: 'Unpaid Leave', from_date: '2026-08-15', to_date: '2026-08-20' }]
      ]);

    const res = await request(app)
      .get('/api/salary?month=8&year=2026&emp_id=2')
      .set('Authorization', `Bearer ${mockAdminToken}`);

    expect(res.status).toBe(200);
    const sal = res.body[0];
    
    // PF and Tax should remain fixed
    expect(sal.provident_fund).toBe(5000);
    expect(sal.tax_deduction).toBe(1000);
    
    // Gross earnings should be less than max, so deductions > 0
    expect(sal.deductions).toBeGreaterThan(0);
    expect(sal.basic_salary).toBeLessThan(50000);
  });
});
