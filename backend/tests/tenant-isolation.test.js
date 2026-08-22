/**
 * tenant-isolation.test.js
 *
 * Tests that every resource endpoint strictly enforces company-level isolation.
 *
 * Strategy:
 *   - The DB layer (db.js) is mocked so no live MySQL connection is needed.
 *   - JWT tokens are signed with the test secret directly, simulating two companies:
 *       Company A (company_id: 1)
 *       Company B (company_id: 2)
 *   - Each test verifies that data from Company B is never served to Company A tokens
 *     and vice versa (and that the correct HTTP status codes are returned).
 *
 * Run: npx jest tests/tenant-isolation.test.js --verbose
 */

'use strict';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

// ─── Mock the database module ────────────────────────────────────────────────
// We intercept db.query so we can control what the DB "returns" per test.
const mockQuery = jest.fn();
const mockGetConnection = jest.fn();

jest.mock('../db', () => ({
  query: (...args) => mockQuery(...args),
  getConnection: (...args) => mockGetConnection(...args),
}));

// ─── Load the Express app after the mock is in place ─────────────────────────
// We import routes directly rather than server.js (which would run initDB).
const express  = require('express');
const authRouter       = require('../routes/auth');
const employeesRouter  = require('../routes/employees');
const attendanceRouter = require('../routes/attendance');
const leavesRouter     = require('../routes/leaves');
const salaryRouter     = require('../routes/salary');

const app = express();
app.use(express.json());
app.use('/api/auth',       authRouter);
app.use('/api/employees',  employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves',     leavesRouter);
app.use('/api/salary',     salaryRouter);

// ─── JWT helpers ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_secret_key_123_abc_xyz';

/**
 * Mint a test JWT for the given company / role.
 */
function makeToken({ emp_id, company_id, emp_role = 'ADMIN', emp_name = 'Test User' }) {
  return jwt.sign(
    { emp_id, company_id, emp_role, emp_name, emp_email: `user${emp_id}@test.com`, emp_department: 'Test', company_name: 'Test Co', is_temp_pass: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const tokenA = makeToken({ emp_id: 1, company_id: 1, emp_role: 'ADMIN' }); // Company A admin
const tokenB = makeToken({ emp_id: 2, company_id: 2, emp_role: 'ADMIN' }); // Company B admin
const tokenAEmp = makeToken({ emp_id: 10, company_id: 1, emp_role: 'EMPLOYEE' }); // Company A regular employee

// ─── Shared mock connection object ────────────────────────────────────────────
const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetConnection.mockResolvedValue(mockConn);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. EMPLOYEE — List (GET /api/employees)
// ─────────────────────────────────────────────────────────────────────────────

describe('Employee isolation — GET /api/employees', () => {
  const companyAEmployees = [
    { emp_id: 1, emp_name: 'Alice', company_id: 1, emp_role: 'ADMIN', acc_status: 'Active' },
    { emp_id: 3, emp_name: 'Charlie', company_id: 1, emp_role: 'EMPLOYEE', acc_status: 'Active' },
  ];
  const companyBEmployees = [
    { emp_id: 2, emp_name: 'Bob', company_id: 2, emp_role: 'ADMIN', acc_status: 'Active' },
  ];

  test('Company A token returns only Company A employees', async () => {
    mockQuery.mockResolvedValueOnce([companyAEmployees]);

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every(e => e.company_id === 1)).toBe(true);

    // Verify the SQL query contained the correct company_id binding
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1); // company_id = 1
  });

  test('Company B token returns only Company B employees', async () => {
    mockQuery.mockResolvedValueOnce([companyBEmployees]);

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].emp_id).toBe(2);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(params).toContain(2); // company_id = 2
  });

  test('Unauthenticated request is rejected with 401', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EMPLOYEE — Get by ID (GET /api/employees/:id) — IDOR prevention
// ─────────────────────────────────────────────────────────────────────────────

describe('Employee isolation — GET /api/employees/:id (IDOR)', () => {
  test('Company A token cannot access Company B employee by ID (returns 404)', async () => {
    // When queried with emp_id=2 AND company_id=1, the DB returns no rows
    mockQuery.mockResolvedValueOnce([[]]); // empty result

    const res = await request(app)
      .get('/api/employees/2') // emp_id 2 belongs to Company B
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);

    // Confirm query included both emp_id and company_id constraints
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/emp_id\s*=\s*\?/i);
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(2); // target emp_id
    expect(params).toContain(1); // company_id from token A
  });

  test('Company A token can access Company A employee by ID', async () => {
    const empData = { emp_id: 1, emp_name: 'Alice', company_id: 1, emp_role: 'ADMIN', acc_status: 'Active', company_name: 'Alpha Corp' };
    mockQuery.mockResolvedValueOnce([[empData]]);

    const res = await request(app)
      .get('/api/employees/1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.emp_id).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMPLOYEE — Create (POST /api/employees)
// ─────────────────────────────────────────────────────────────────────────────

describe('Employee isolation — POST /api/employees', () => {
  test('New employee inherits company_id from JWT token, not request body', async () => {
    // No duplicate found
    mockConn.query
      .mockResolvedValueOnce([[]])          // duplicate check
      .mockResolvedValueOnce([[{ company_code: 'AC' }]])  // company code lookup
      .mockResolvedValueOnce([[{ count: 2 }]])            // serial count (scoped to company)
      .mockResolvedValueOnce([{ insertId: 99 }])          // INSERT Employee
      .mockResolvedValueOnce([{}]);                       // INSERT Login

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Dave',
        department: 'Engineering',
        role: 'EMPLOYEE',
        email: 'dave@alpha.com',
        phone: '9876543299',
        // SECURITY: Even if company_id is sent in body, it must be ignored
        company_id: 999,
      });

    expect(res.status).toBe(201);

    // Find the INSERT Employee call and verify company_id = 1 (from JWT), not 999 (from body)
    const insertCall = mockConn.query.mock.calls.find(([sql]) =>
      sql && /INSERT INTO Employee/i.test(sql)
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).toContain(1);    // company_id from JWT = 1
    expect(insertCall[1]).not.toContain(999); // body company_id must NOT appear
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMPLOYEE — Delete (DELETE /api/employees/:id)
// ─────────────────────────────────────────────────────────────────────────────

describe('Employee isolation — DELETE /api/employees/:id', () => {
  test('Company A admin cannot delete Company B employee (affectedRows = 0 → 404)', async () => {
    // DELETE WHERE emp_id=2 AND company_id=1 → 0 rows affected
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/employees/2')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1); // Company A's id from token
    expect(params).toContain(2); // target employee
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ATTENDANCE — Today's dashboard (GET /api/attendance/today)
// ─────────────────────────────────────────────────────────────────────────────

describe('Attendance isolation — GET /api/attendance/today', () => {
  test('Company A admin only sees Company A employees in daily report', async () => {
    const companyAEmps = [
      { emp_id: 1, emp_name: 'Alice', emp_department: 'Mgmt', emp_role: 'ADMIN' },
    ];

    // 1. employees query, 2. attendance query, 3. leaves query
    mockQuery
      .mockResolvedValueOnce([companyAEmps])    // employees for company_id=1
      .mockResolvedValueOnce([[]])              // attendance records
      .mockResolvedValueOnce([[]]);             // leave records

    const res = await request(app)
      .get('/api/attendance/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.total).toBe(1);
    expect(res.body.punches[0].emp_id).toBe(1);

    // Verify the employee query uses company_id from token
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ATTENDANCE — History by employee ID (GET /api/attendance/employee/:id)
// ─────────────────────────────────────────────────────────────────────────────

describe('Attendance isolation — GET /api/attendance/employee/:id', () => {
  test('Company A manager cannot access attendance of Company B employee', async () => {
    // empCheck returns no rows (emp_id=2 not in company_id=1)
    mockQuery.mockResolvedValueOnce([[]]); // empty empCheck

    const res = await request(app)
      .get('/api/attendance/employee/2')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  test('Company A manager can access attendance of Company A employee', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ emp_id: 3 }]])  // empCheck passes
      .mockResolvedValueOnce([[              // attendance rows
        { attendance_date: '2026-08-01', login_time: '09:00:00', logout_time: '18:00:00' }
      ]]);

    const res = await request(app)
      .get('/api/attendance/employee/3')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].workedHours).toBe(9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. LEAVES — Pending list (GET /api/leaves/pending)
// ─────────────────────────────────────────────────────────────────────────────

describe('Leave isolation — GET /api/leaves/pending', () => {
  test('Company A admin only receives Company A pending leaves', async () => {
    const pendingLeaves = [
      { leave_id: 1, emp_id: 1, emp_name: 'Alice', emp_department: 'Mgmt', emp_role: 'ADMIN', approved_status: 'Pending' },
    ];
    mockQuery.mockResolvedValueOnce([pendingLeaves]);

    const res = await request(app)
      .get('/api/leaves/pending')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);

    // The query must join Employee and filter by company_id from the token
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1);
  });

  test('EMPLOYEE role is denied access to pending leaves (403)', async () => {
    const res = await request(app)
      .get('/api/leaves/pending')
      .set('Authorization', `Bearer ${tokenAEmp}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. LEAVES — Cross-company approve (PUT /api/leaves/:id)
// ─────────────────────────────────────────────────────────────────────────────

describe('Leave isolation — PUT /api/leaves/:id (cross-company approval)', () => {
  test('Company A manager cannot approve a leave belonging to Company B employee', async () => {
    // The ownership check query returns 0 rows (leave belongs to Company B emp)
    mockQuery.mockResolvedValueOnce([[]]); // empty

    const res = await request(app)
      .put('/api/leaves/99')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'Approved' });

    expect(res.status).toBe(404);

    // Confirm the ownership check used company_id from token
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1);
    expect(params).toContain('99'); // leave_id
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. SALARY — List (GET /api/salary)
// ─────────────────────────────────────────────────────────────────────────────

describe('Salary isolation — GET /api/salary', () => {
  test('Company A admin receives only Company A salary data', async () => {
    const companyAEmps = [
      { emp_id: 1, emp_name: 'Alice', emp_department: 'Mgmt', emp_role: 'ADMIN', emp_email: 'alice@a.com', emp_phno: '9876543210', company_name: 'Alpha Corp' },
    ];
    // employees query + (customSalary + attendance + leaves for each emp)
    mockQuery
      .mockResolvedValueOnce([companyAEmps]) // employee list scoped to company_id=1
      .mockResolvedValueOnce([[]])           // no custom salary
      .mockResolvedValueOnce([[]])           // no attendance
      .mockResolvedValueOnce([[]]);          // no leaves

    const res = await request(app)
      .get('/api/salary')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].emp_id).toBe(1);

    // Verify first query scoped to company_id
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. SALARY — Update (PUT /api/salary/:emp_id)
// ─────────────────────────────────────────────────────────────────────────────

describe('Salary isolation — PUT /api/salary/:emp_id', () => {
  test('Company A admin cannot update salary of Company B employee', async () => {
    // empCheck: emp_id=2 AND company_id=1 → no rows
    mockQuery.mockResolvedValueOnce([[]]); // empty

    const res = await request(app)
      .put('/api/salary/2')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ Monthly_Wage: 50000, Basic_Salary: 25000, HRA: 10000, St_Allowance: 7500, Performance_Bonus: 2500, Leave_Travel_Allowance: 2500, fixed_Allowance: 2500, Provident_fund: 3000, Tax_Deduction: 2000 });

    expect(res.status).toBe(404);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/company_id\s*=\s*\?/i);
    expect(params).toContain(1); // Company A's id, NOT 2
  });

  test('Company A admin can update salary of Company A employee', async () => {
    // empCheck passes
    mockQuery
      .mockResolvedValueOnce([[{ emp_id: 1 }]]) // empCheck succeeds
      .mockResolvedValueOnce([[{ salary_id: 1 }]]) // existing salary record
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    const res = await request(app)
      .put('/api/salary/1')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ Monthly_Wage: 80000, Basic_Salary: 40000, HRA: 16000, St_Allowance: 12000, Performance_Bonus: 4000, Leave_Travel_Allowance: 4000, fixed_Allowance: 4000, Provident_fund: 4800, Tax_Deduction: 3200 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. REGISTRATION — Company + Admin created in a transaction
// ─────────────────────────────────────────────────────────────────────────────

describe('Registration — company creation flow', () => {
  test('Successful registration creates Company then Admin Employee atomically', async () => {
    mockConn.query
      .mockResolvedValueOnce([[]])             // duplicate check (no existing)
      .mockResolvedValueOnce([{ insertId: 5 }])  // INSERT Company
      .mockResolvedValueOnce([[{ count: 0 }]])   // serial count for new company
      .mockResolvedValueOnce([{ insertId: 50 }]) // INSERT Employee
      .mockResolvedValueOnce([{}]);              // INSERT Login

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Gamma Inc',
        name: 'Gary Admin',
        email: 'gary@gamma.com',
        phone: '9900001111',
        password: 'SecurePass@1',
        confirmPassword: 'SecurePass@1',
      });

    expect(res.status).toBe(201);
    expect(res.body.loginId).toBeDefined();
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();

    // Verify Employee INSERT contains the companyId (insertId=5 from Company INSERT)
    const empInsert = mockConn.query.mock.calls.find(([sql]) =>
      sql && /INSERT INTO Employee/i.test(sql)
    );
    expect(empInsert).toBeDefined();
    expect(empInsert[1]).toContain(5); // company_id = 5
  });

  test('Registration rolls back if error occurs mid-transaction', async () => {
    mockConn.query
      .mockResolvedValueOnce([[]])                   // duplicate check
      .mockResolvedValueOnce([{ insertId: 6 }])      // INSERT Company
      .mockResolvedValueOnce([[{ count: 0 }]])        // serial count
      .mockRejectedValueOnce(new Error('DB error')); // Employee INSERT fails

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Fail Corp',
        name: 'Failed User',
        email: 'fail@corp.com',
        phone: '9911112222',
        password: 'Pass@1234',
      });

    expect(res.status).toBe(500);
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
  });
});
