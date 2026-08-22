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

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Hide controls during standard print mode */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Payroll & Payslips</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isManager 
            ? 'Generate, review, and print payslips for all staff members.' 
            : 'Access your monthly earnings breakdown and download printable payslips.'
          }
        </p>
      </div>

      <div className="card no-print" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Month:</label>
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Year:</label>
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={fetchSalaries}>
            Recalculate
          </button>
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
                            <button
                              className="btn btn-primary"
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedPayslip(sal)}
                            >
                              Open Payslip
                            </button>
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
                  <div className="payslip-title">DAYFLOW TECHNOLOGIES</div>
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
                    <td>Basic / Base Salary ({selectedPayslip.emp_role})</td>
                    <td className="text-right" style={{ color: 'var(--text-primary)' }}>₹{selectedPayslip.base_salary.toLocaleString()}</td>
                    <td className="text-right">--</td>
                  </tr>
                  <tr>
                    <td>Deductions ({selectedPayslip.absent_days} Absent days)</td>
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
    </div>
  );
};

export default SalaryPage;
