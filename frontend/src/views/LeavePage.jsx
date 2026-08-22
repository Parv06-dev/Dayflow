import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const LeavePage = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form & modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Paid time Off');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';

  const publicHolidays = [
    { date: 'Jan 14, 2026', name: 'Kite Festival' },
    { date: 'Jan 26, 2026', name: 'Republic Day' },
    { date: 'Mar 4, 2026', name: 'Dhuleti' },
    { date: 'Aug 15, 2026', name: 'Independence Day' },
    { date: 'Aug 24, 2026', name: 'Rakhi' },
    { date: 'Oct 2, 2026', name: 'Gandhi Jayanti' },
    { date: 'Nov 8, 2026', name: 'Diwali' },
    { date: 'Nov 10, 2026', name: 'New Year' },
    { date: 'Nov 11, 2026', name: 'Bhai Dooj' }
  ];

  useEffect(() => {
    fetchLeaves();
    if (isManager) {
      fetchPendingQueue();
    }
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/leaves');
      setLeaves(data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingQueue = async () => {
    try {
      const data = await apiRequest('/leaves/pending');
      setPendingQueue(data);
    } catch (err) {
      console.error('Error fetching pending queue:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) {
      alert('Please fill out all fields');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert('From date cannot be after To date');
      return;
    }

    try {
      await apiRequest('/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leave_type: leaveType,
          from_date: fromDate,
          to_date: toDate,
          reason
        })
      });

      alert('Time off request submitted successfully!');
      setShowNewModal(false);
      setFromDate('');
      setToDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      alert(err.message || 'Failed to submit request');
    }
  };

  const handleProcessLeave = async (leaveId, status) => {
    try {
      await apiRequest(`/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchPendingQueue();
      fetchLeaves();
    } catch (err) {
      alert(err.message || 'Failed to process leave request');
    }
  };

  // Helper to render calendar month grid
  const renderCalendarMonth = (year, monthIndex, monthName) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      // Check if day has leave
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const leaveForDay = leaves.find(l => {
        const f = l.from_date.substring(0, 10);
        const t = l.to_date.substring(0, 10);
        return dateStr >= f && dateStr <= t;
      });

      let dayClass = 'calendar-day';
      if (leaveForDay) {
        if (leaveForDay.approved_status === 'Approved') dayClass += ' validated';
        else if (leaveForDay.approved_status === 'Pending') dayClass += ' to-approve';
        else if (leaveForDay.approved_status === 'Rejected') dayClass += ' refused';
      }

      days.push(
        <div key={d} className={dayClass} title={leaveForDay ? `${leaveForDay.approved_status}: ${leaveForDay.reason}` : ''}>
          {d}
        </div>
      );
    }

    return (
      <div className="calendar-month-box" key={monthName}>
        <div className="calendar-month-title">{monthName} {year}</div>
        <div className="calendar-week-header">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="calendar-days-grid">{days}</div>
      </div>
    );
  };

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  // Dynamic Days Available calculation
  const computeAvailableDays = (type, totalQuota) => {
    const normalizedType = type.toLowerCase();
    const used = leaves
      .filter(l => {
        const lt = (l.leave_type || 'Paid time Off').toLowerCase();
        return lt === normalizedType && l.approved_status === 'Approved';
      })
      .reduce((acc, l) => {
        const f = new Date(l.from_date);
        const t = new Date(l.to_date);
        const diffDays = Math.ceil((t - f) / (1000 * 60 * 60 * 24)) + 1;
        return acc + diffDays;
      }, 0);
    return Math.max(0, totalQuota - used);
  };

  const paidDaysAvailable = computeAvailableDays('Paid time Off', 24);
  const sickDaysAvailable = computeAvailableDays('Sick time off', 7);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Sleek Time Off Header */}
      <div className="wireframe-timeoff-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Time Off & Leave Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Request paid leave, track sick time, and view annual company calendar.
            </p>
          </div>
          <button className="btn wireframe-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setShowNewModal(true)}>
            + NEW REQUEST
          </button>
        </div>
      </div>

      {/* Available Days Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card-glass" style={{ textAlign: 'center', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
          <h3 style={{ color: '#818cf8', fontSize: '1.2rem', marginBottom: '8px' }}>Paid time Off</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {String(paidDaysAvailable).padStart(2, '0')} Days Available
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Out of 24 Annual Days</span>
        </div>

        <div className="card-glass" style={{ textAlign: 'center', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
          <h3 style={{ color: '#c084fc', fontSize: '1.2rem', marginBottom: '8px' }}>Sick time off</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {String(sickDaysAvailable).padStart(2, '0')} Days Available
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Out of 07 Annual Days</span>
        </div>
      </div>

      {/* Pending Queue Manager Box */}
      {isManager && (
        <div className="card-glass" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            HR Leave Approval Queue
            <span className="badge badge-admin">{pendingQueue.length} Pending</span>
          </h3>

          {pendingQueue.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {pendingQueue.map(req => (
                <div key={req.leave_id} className="card" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{req.emp_name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {req.emp_department} • {req.emp_role}
                      </span>
                    </div>
                    <span className="badge badge-hr">{req.leave_type || 'Paid time Off'}</span>
                  </div>

                  <div style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '600' }}>
                    📅 {new Date(req.from_date).toLocaleDateString()} — {new Date(req.to_date).toLocaleDateString()}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                    "{req.reason}"
                  </p>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', width: 'auto' }}
                      onClick={() => handleProcessLeave(req.leave_id, 'Rejected')}
                    >
                      ✕ Reject
                    </button>
                    <button
                      className="btn btn-success"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', width: 'auto' }}
                      onClick={() => handleProcessLeave(req.leave_id, 'Approved')}
                    >
                      ✓ Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              ✨ No pending leave or sick time requests in the approval queue.
            </p>
          )}
        </div>
      )}

      {/* Main Wireframe Calendar Grid & Legend Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        {/* Annual 12-Month Calendar Grid */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="annual-calendar-grid">
            {months.map((m, idx) => renderCalendarMonth(2026, idx, m))}
          </div>
        </div>

        {/* Right Legend & Public Holidays Bar */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Legend</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
              Validated (Approved)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
              To approve (Pending)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f43f5e', display: 'inline-block' }}></span>
              Refused (Rejected)
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Public Holidays</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {publicHolidays.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{h.date}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{h.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Time Off Modal */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Apply for Time Off</h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Time Off Type</label>
                <select
                  className="form-input"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Paid time Off">Paid time Off</option>
                  <option value="Sick time off">Sick time off</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describe your leave reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn wireframe-btn">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
