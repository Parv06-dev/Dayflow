import React, { useEffect, useCallback } from 'react';

/**
 * PayslipModal — Self-contained, accessible payslip popup.
 *
 * Props:
 *   slip      — the salary data object from the API
 *   user      — the logged-in user (for fallback company name)
 *   monthLabel — human-readable month string e.g. "August"
 *   onClose   — callback to close the modal
 *   onPrint   — callback that fires the dedicated print window
 */
const PayslipModal = ({ slip, user, monthLabel, onClose, onPrint }) => {
  // ── Close on Escape key ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body from scrolling while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // ── Derived values ────────────────────────────────────────────────────────
  const companyName =
    slip.company_name && slip.company_name !== 'Dayflow Technologies'
      ? slip.company_name
      : user?.company_name || 'Odoo India';

  const fmt = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const grossEarnings =
    slip.basic_salary +
    slip.hra +
    slip.st_allowance +
    slip.performance_bonus +
    slip.leave_travel_allowance +
    (slip.fixed_allowance || 0);

  const totalDeductions =
    slip.provident_fund + slip.tax_deduction + slip.deductions;

  const issuedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // ── Rows config (keeps JSX clean) ────────────────────────────────────────
  const earningRows = [
    { label: 'Basic Salary',                        value: slip.basic_salary },
    { label: 'House Rent Allowance (HRA)',           value: slip.hra },
    { label: 'Dearness / Special Allowance (DA)',    value: slip.st_allowance },
    { label: 'Performance Bonus',                    value: slip.performance_bonus },
    { label: 'Leave Travel Allowance (LTA)',         value: slip.leave_travel_allowance },
    { label: 'Fixed Allowance',                      value: slip.fixed_allowance || 0 },
  ];

  const deductionRows = [
    { label: 'Provident Fund (PF)',                  value: slip.provident_fund },
    { label: 'Income Tax / TDS',                     value: slip.tax_deduction },
    { label: `Attendance Deduction (Lost Earnings)`, value: slip.deductions },
  ];

  return (
    /* ── Backdrop ── */
    <div
      className="pslip-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Payslip for ${slip.emp_name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Panel ── */}
      <div className="pslip-panel">

        {/* ── Sticky header bar ── */}
        <div className="pslip-topbar">
          <button className="pslip-back-btn" onClick={onClose} aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <span className="pslip-topbar-title">Payslip — {monthLabel} {slip.year}</span>
          <button className="pslip-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pslip-body">

          {/* Company + Period header */}
          <div className="pslip-hero">
            <div className="pslip-hero-left">
              <div className="pslip-company-name">{companyName}</div>
              <div className="pslip-subtitle">Employee Salary Invoice</div>
            </div>
            <div className="pslip-hero-right">
              <div className="pslip-period-label">Pay Period</div>
              <div className="pslip-period-value">{monthLabel.toUpperCase()} {slip.year}</div>
            </div>
          </div>

          {/* Employee metadata grid */}
          <div className="pslip-meta-grid">
            <MetaRow label="Employee Name"      value={slip.emp_name} />
            <MetaRow label="Department"         value={slip.emp_department} />
            <MetaRow label="Employee ID"        value={`#${slip.emp_id}`} />
            <MetaRow label="Designation"        value={slip.emp_role} />
            <MetaRow label="Payable Days"       value={`${slip.payable_days} / ${slip.total_working_days}`} />
            <MetaRow label="Leaves Taken"       value={`${slip.leave_days} (${slip.paid_leave_days} Paid)`} />
            <MetaRow label="Date of Issue"      value={issuedOn} />
          </div>

          {/* Earnings */}
          <SectionTitle icon="📈">Earnings Breakdown</SectionTitle>
          <table className="pslip-table">
            <thead>
              <tr>
                <th>Component</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earningRows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="text-right pslip-earn">{fmt(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Deductions */}
          <SectionTitle icon="📉">Deductions</SectionTitle>
          <table className="pslip-table">
            <thead>
              <tr>
                <th>Component</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {deductionRows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="text-right pslip-deduct">{fmt(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Gross / Deductions summary */}
          <div className="pslip-summary-row">
            <div className="pslip-summary-box pslip-summary-earn">
              <div className="pslip-summary-label">Gross Earnings</div>
              <div className="pslip-summary-val">{fmt(grossEarnings)}</div>
            </div>
            <div className="pslip-summary-box pslip-summary-deduct">
              <div className="pslip-summary-label">Total Deductions</div>
              <div className="pslip-summary-val">{fmt(totalDeductions)}</div>
            </div>
          </div>

          {/* Net salary banner */}
          <div className="pslip-net-banner">
            <div>
              <div className="pslip-net-label">NET TAKE-HOME SALARY</div>
              <div className="pslip-net-sub">{monthLabel} {slip.year} · {companyName}</div>
            </div>
            <div className="pslip-net-amount">{fmt(slip.net_salary)}</div>
          </div>

          {/* Footer note */}
          <p className="pslip-footer-note">
            * This is a system-generated salary invoice and does not require a physical signature.
            For queries, contact your HR department.
          </p>

          {/* Action buttons */}
          <div className="pslip-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            <button className="btn btn-success" onClick={onPrint}>
              🖨️ Print / Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Small reusable sub-components ─────────────────────────────────────── */

const MetaRow = ({ label, value }) => (
  <div className="pslip-meta-item">
    <span className="pslip-meta-key">{label}</span>
    <span className="pslip-meta-val">{value}</span>
  </div>
);

const SectionTitle = ({ icon, children }) => (
  <div className="pslip-section-title">
    <span className="pslip-section-icon">{icon}</span>
    {children}
  </div>
);

export default PayslipModal;
