import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';
import PayslipModal from './PayslipModal';

const SalaryPage = ({ user }) => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Payslip detail modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Salary Structure Edit Modal state for HR / Admin
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    Monthly_Wage: '',
    Basic_Salary: '',
    HRA: '',
    St_Allowance: '',
    Performance_Bonus: '',
    Leave_Travel_Allowance: '',
    fixed_Allowance: '',
    Provident_fund: '',
    Tax_Deduction: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const yearsList = [selectedYear - 1, selectedYear, selectedYear + 1];

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth, selectedYear]);

  const fetchSalaries = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = `/salary?month=${selectedMonth}&year=${selectedYear}`;

      const data = await apiRequest(endpoint);
      setSalaries(data);

      // If employee, set their payslip as default
      if (!isManager && data.length > 0) {
        setSelectedPayslip(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch salary data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  /** Opens a dedicated blank window with only the payslip invoice — nothing else prints. */
  const printPayslip = (slip) => {
    const companyName =
      slip.company_name && slip.company_name !== 'Dayflow Technologies'
        ? slip.company_name
        : user?.company_name || 'Odoo India';
    const monthLabel = monthsList.find((m) => m.value === slip.month)?.label || String(slip.month);
    const fmt = (n) =>
      '\u20B9' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const gross =
      slip.basic_salary + slip.hra + slip.st_allowance +
      slip.performance_bonus + slip.leave_travel_allowance + (slip.fixed_allowance || 0);
    const totalDed = slip.provident_fund + slip.tax_deduction + slip.deductions;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Payslip \u2014 ${slip.emp_name} \u2014 ${monthLabel} ${slip.year}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 portrait;margin:20mm 16mm}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a2e;background:#fff}
.hdr{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:3px solid #4f46e5;margin-bottom:20px}
.co-name{font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px}
.sub{font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-top:3px}
.period-box{text-align:right}.period-label{font-size:10px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase}
.period-val{font-size:18px;font-weight:700;color:#4f46e5;margin-top:2px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 32px;background:#f8f9ff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:20px}
.mr{display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid #f1f5f9}
.mr:last-child,.mr:nth-last-child(2){border:none}
.mk{color:#64748b;font-size:11px}.mv{font-weight:600;color:#1e293b;font-size:11px;text-align:right}
.sec{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f46e5;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:11.5px}
thead tr{background:#4f46e5;color:#fff}
th{padding:8px 12px;text-align:left;font-weight:600;letter-spacing:.5px}
th:last-child,td:last-child{text-align:right}
tr:nth-child(even){background:#f8f9ff}
td{padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#334155}
.earn{color:#15803d;font-weight:600}.ded{color:#b91c1c;font-weight:600}
.totals{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.tbox{border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px}
.tl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.tv{font-size:16px;font-weight:700;margin-top:4px}
.te .tv{color:#15803d}.td .tv{color:#b91c1c}
.net{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:10px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.nl{font-size:13px;font-weight:600;letter-spacing:.5px;opacity:.9}
.ns{font-size:10px;opacity:.7;margin-top:2px}
.na{font-size:26px;font-weight:800;letter-spacing:-.5px}
.footer{border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end}
.note{font-size:9.5px;color:#94a3b8;max-width:65%;line-height:1.5}
.sig{text-align:right;font-size:10px;color:#64748b}
.sigline{width:140px;border-top:1px solid #94a3b8;margin-top:28px;margin-left:auto}
</style></head><body>
<div class="hdr"><div><div class="co-name">${companyName}</div><div class="sub">Employee Salary Invoice</div></div>
<div class="period-box"><div class="period-label">Pay Period</div><div class="period-val">${monthLabel.toUpperCase()} ${slip.year}</div></div></div>
<div class="meta">
<div class="mr"><span class="mk">Employee Name</span><span class="mv">${slip.emp_name}</span></div>
<div class="mr"><span class="mk">Department</span><span class="mv">${slip.emp_department}</span></div>
<div class="mr"><span class="mk">Employee ID</span><span class="mv">#${slip.emp_id}</span></div>
<div class="mr"><span class="mk">Designation</span><span class="mv">${slip.emp_role}</span></div>
<div class="mr"><span class="mk">Worked Days</span><span class="mv">${slip.worked_days}/30</span></div>
<div class="mr"><span class="mk">Approved Leaves</span><span class="mv">${slip.leave_days}</span></div>
<div class="mr"><span class="mk">Absent Days</span><span class="mv">${slip.absent_days}</span></div>
<div class="mr"><span class="mk">Date of Issue</span><span class="mv">${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</span></div>
</div>
<div class="sec">Earnings Breakdown</div>
<table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>
<tr><td>Basic Salary</td><td class="earn">${fmt(slip.basic_salary)}</td></tr>
<tr><td>House Rent Allowance (HRA)</td><td class="earn">${fmt(slip.hra)}</td></tr>
<tr><td>Dearness / Special Allowance (DA)</td><td class="earn">${fmt(slip.st_allowance)}</td></tr>
<tr><td>Performance Bonus</td><td class="earn">${fmt(slip.performance_bonus)}</td></tr>
<tr><td>Leave Travel Allowance (LTA)</td><td class="earn">${fmt(slip.leave_travel_allowance)}</td></tr>
<tr><td>Fixed Allowance</td><td class="earn">${fmt(slip.fixed_allowance||0)}</td></tr>
</tbody></table>
<div class="sec">Deductions</div>
<table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>
<tr><td>Provident Fund (PF)</td><td class="ded">${fmt(slip.provident_fund)}</td></tr>
<tr><td>Income Tax / TDS</td><td class="ded">${fmt(slip.tax_deduction)}</td></tr>
<tr><td>Attendance Deduction (${slip.absent_days} day${slip.absent_days!==1?'s':''}, capped)</td><td class="ded">${fmt(slip.deductions)}</td></tr>
</tbody></table>
<div class="totals"><div class="tbox te"><div class="tl">Gross Earnings</div><div class="tv">${fmt(gross)}</div></div>
<div class="tbox td"><div class="tl">Total Deductions</div><div class="tv">${fmt(totalDed)}</div></div></div>
<div class="net"><div><div class="nl">NET TAKE-HOME SALARY</div><div class="ns">${monthLabel} ${slip.year} &bull; ${companyName}</div></div><div class="na">${fmt(slip.net_salary)}</div></div>
<div class="footer"><p class="note">System-generated. No physical signature required. For queries, contact HR.</p>
<div class="sig"><div class="sigline"></div><div>Authorised Signatory</div><div style="margin-top:4px;color:#1e293b;font-weight:600">${companyName}</div></div></div>
</body></html>`;
    const win = window.open('', '_blank', 'width=850,height=1100');
    if (!win) { alert('Popup blocked. Please allow popups and try again.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const openEditModal = (sal) => {
    setEditingEmployee(sal);
    setSaveSuccess('');
    setEditForm({
      Monthly_Wage: sal.monthly_wage || sal.base_salary,
      Basic_Salary: sal.basic_salary || (sal.base_salary * 0.5),
      HRA: sal.hra || (sal.base_salary * 0.2),
      St_Allowance: sal.st_allowance || (sal.base_salary * 0.15),
      Performance_Bonus: sal.performance_bonus || (sal.base_salary * 0.05),
      Leave_Travel_Allowance: sal.leave_travel_allowance || (sal.base_salary * 0.05),
      fixed_Allowance: sal.fixed_allowance || (sal.base_salary * 0.05),
      Provident_fund: sal.provident_fund || (sal.base_salary * 0.06),
      Tax_Deduction: sal.tax_deduction || (sal.base_salary * 0.04)
    });
  };

  const handleSaveSalaryStructure = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    setSaveSuccess('');

    try {
      await apiRequest(`/salary/${editingEmployee.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      setSaveSuccess('Salary structure and tax deductions updated successfully!');
      setTimeout(() => {
        setEditingEmployee(null);
        fetchSalaries();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update salary structure');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div>
      {/* Top Filter Header */}
      <div className="card-glass no-print" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3>Payroll & Payslips</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {isManager
                ? 'Manage employee salary components, tax deductions, and download payslips.'
                : 'View and download your monthly compensation breakdown.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error no-print">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }} className="no-print">Calculating payroll records...</div>
      ) : (
        <>
          {isManager ? (
            /* --- Admin/HR View: All Employee Payslips list --- */
            <div className="card no-print">
              <h3 style={{ marginBottom: '16px' }}>Staff Payroll Summary ({monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear})</h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Base Salary</th>
                      <th>Worked Days</th>
                      <th>Leave Days</th>
                      <th>Net Earnings</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.length > 0 ? (
                      salaries.map((sal) => (
                        <tr key={sal.emp_id}>
                          <td>#{sal.emp_id}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{sal.emp_name}</td>
                          <td><span className={`badge badge-${sal.emp_role.toLowerCase()}`}>{sal.emp_role}</span></td>
                          <td>₹{sal.base_salary.toLocaleString()}</td>
                          <td>{sal.worked_days} / 30</td>
                          <td>{sal.leave_days}</td>
                          <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{sal.net_salary.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-primary"
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => setSelectedPayslip(sal)}
                              >
                                Open Payslip
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => openEditModal(sal)}
                              >
                                ✏️ Edit Structure
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No payroll rows returned. Verify database connection.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* --- Payslip Modal (blurred backdrop popup) --- */}
          {selectedPayslip && (
            <PayslipModal
              slip={selectedPayslip}
              user={user}
              monthLabel={monthsList.find((m) => m.value === selectedPayslip.month)?.label || String(selectedPayslip.month)}
              onClose={() => setSelectedPayslip(null)}
              onPrint={() => printPayslip(selectedPayslip)}
            />
          )}
        </>
      )}

      {/* --- HR/Admin Edit Salary Modal --- */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Configure Salary Structure — {editingEmployee.emp_name}</h3>
              <button className="modal-close" onClick={() => setEditingEmployee(null)}>✕</button>
            </div>

            {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}

            <form onSubmit={handleSaveSalaryStructure}>
              <div className="form-group">
                <label className="form-label">Monthly Base Wage (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.Monthly_Wage}
                  onChange={(e) => setEditForm({ ...editForm, Monthly_Wage: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Basic Salary (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.Basic_Salary}
                    onChange={(e) => setEditForm({ ...editForm, Basic_Salary: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">House Rent Allowance - HRA (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.HRA}
                    onChange={(e) => setEditForm({ ...editForm, HRA: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Special Allowance (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.St_Allowance}
                    onChange={(e) => setEditForm({ ...editForm, St_Allowance: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Performance Bonus (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.Performance_Bonus}
                    onChange={(e) => setEditForm({ ...editForm, Performance_Bonus: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Provident Fund Deduction - PF (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.Provident_fund}
                    onChange={(e) => setEditForm({ ...editForm, Provident_fund: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Deduction (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.Tax_Deduction}
                    onChange={(e) => setEditForm({ ...editForm, Tax_Deduction: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingEmployee(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Salary Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
