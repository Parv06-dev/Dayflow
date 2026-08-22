import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

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

          {/* --- Payslip Document View --- */}
          {selectedPayslip && (
            <div className="payslip-box">
              <div className="payslip-header">
                <div>
                  <div className="payslip-title">
                    {(selectedPayslip.company_name && selectedPayslip.company_name !== 'Dayflow Technologies') 
                      ? selectedPayslip.company_name 
                      : (user?.company_name || 'Odoo India')}
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px', letterSpacing: '0.05em' }}>EMPLOYEE PAYROLL RECEIPT</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>PAYSLIP MONTH</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent)', marginTop: '4px' }}>
                    {monthsList.find(m => m.value === selectedPayslip.month)?.label.toUpperCase()} {selectedPayslip.year}
                  </p>
                </div>
              </div>

              <div className="payslip-details">
                <div className="payslip-meta">
                  <div className="payslip-meta-row">
                    <span>Employee Name:</span>
                    <span className="payslip-meta-val">{selectedPayslip.emp_name}</span>
                  </div>
                  <div className="payslip-meta-row">
                    <span>Employee ID:</span>
                    <span className="payslip-meta-val">#{selectedPayslip.emp_id}</span>
                  </div>
                  <div className="payslip-meta-row">
                    <span>System Role:</span>
                    <span className="payslip-meta-val">{selectedPayslip.emp_role}</span>
                  </div>
                </div>

                <div className="payslip-meta">
                  <div className="payslip-meta-row">
                    <span>Department:</span>
                    <span className="payslip-meta-val">{selectedPayslip.emp_department}</span>
                  </div>
                  <div className="payslip-meta-row">
                    <span>Worked Days:</span>
                    <span className="payslip-meta-val">{selectedPayslip.worked_days} / 30</span>
                  </div>
                  <div className="payslip-meta-row">
                    <span>Approved Leave Days:</span>
                    <span className="payslip-meta-val">{selectedPayslip.leave_days}</span>
                  </div>
                </div>
              </div>

              <table className="payslip-calc-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="text-right">Earnings</th>
                    <th className="text-right">Deductions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td className="text-right" style={{ color: 'var(--text-primary)' }}>₹{(selectedPayslip.basic_salary).toLocaleString()}</td>
                    <td className="text-right">--</td>
                  </tr>
                  <tr>
                    <td>House Rent Allowance (HRA)</td>
                    <td className="text-right" style={{ color: 'var(--text-primary)' }}>₹{(selectedPayslip.hra).toLocaleString()}</td>
                    <td className="text-right">--</td>
                  </tr>
                  <tr>
                    <td>Special Allowance</td>
                    <td className="text-right" style={{ color: 'var(--text-primary)' }}>₹{(selectedPayslip.st_allowance).toLocaleString()}</td>
                    <td className="text-right">--</td>
                  </tr>
                  <tr>
                    <td>Performance Bonus & LTA</td>
                    <td className="text-right" style={{ color: 'var(--text-primary)' }}>₹{((selectedPayslip.performance_bonus) + (selectedPayslip.leave_travel_allowance)).toLocaleString()}</td>
                    <td className="text-right">--</td>
                  </tr>
                  <tr>
                    <td>Provident Fund (PF)</td>
                    <td className="text-right">--</td>
                    <td className="text-right" style={{ color: 'var(--error)' }}>
                      ₹{(selectedPayslip.provident_fund).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>Tax Deduction</td>
                    <td className="text-right">--</td>
                    <td className="text-right" style={{ color: 'var(--error)' }}>
                      ₹{(selectedPayslip.tax_deduction).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>Attendance Deductions ({selectedPayslip.absent_days} Unapproved Absent days - Capped)</td>
                    <td className="text-right">--</td>
                    <td className="text-right" style={{ color: 'var(--error)' }}>
                      ₹{selectedPayslip.deductions.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="payslip-summary-row">
                    <td>NET REMUNERATION</td>
                    <td colSpan="2" className="text-right payslip-net-glow">
                      ₹{selectedPayslip.net_salary.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="payslip-footer-msg">
                * This is a computer-generated document and does not require a physical signature.
              </div>

              <div className="payslip-actions-row no-print">
                {isManager && (
                  <button className="btn btn-secondary" onClick={() => setSelectedPayslip(null)}>
                    Close Preview
                  </button>
                )}
                <button className="btn btn-success" onClick={handlePrint}>
                  🖨️ Print / Download PDF
                </button>
              </div>
            </div>
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
