import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const LeavePage = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';

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
          from_date: fromDate,
          to_date: toDate,
          reason
        }),
      });

      setFromDate('');
      setToDate('');
      setReason('');
      fetchLeaves();
      alert('Leave request submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit leave request');
    }
  };

  const handleProcessLeave = async (leaveId, status) => {
    try {
      const data = await apiRequest(`/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({
          approved_status: status
        }),
      });
      fetchPendingQueue();
      fetchLeaves(); // Update history list if needed
      alert(data.message);
    } catch (err) {
      alert(err.message || 'Failed to update leave request');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Leave Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Apply for time-off, view status, and manage approvals.</p>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-side">
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Apply for Leave</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="leave-from">From Date</label>
                <input
                  type="date"
                  id="leave-from"
                  className="form-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="leave-to">To Date</label>
                <input
                  type="date"
                  id="leave-to"
                  className="form-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="leave-reason">Reason</label>
                <textarea
                  id="leave-reason"
                  className="form-input"
                  rows="4"
                  placeholder="Describe your reason..."
                  style={{ resize: 'vertical' }}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </form>
          </div>
        </div>

        <div className="dashboard-main">
          {isManager && (
            <div className="card-glass" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                Pending Approval Queue
                <span className="badge badge-admin" style={{ marginLeft: '10px' }}>{pendingQueue.length} pending</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingQueue.length > 0 ? (
                  pendingQueue.map((req) => (
                    <div key={req.leave_id} className="card leave-approval-card Pending" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)' }}>{req.emp_name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {req.emp_department} • {req.emp_role}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--warning)' }}>
                          {new Date(req.from_date).toLocaleDateString()} to {new Date(req.to_date).toLocaleDateString()}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', fontStyle: 'italic' }}>
                        "{req.reason}"
                      </p>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
                          onClick={() => handleProcessLeave(req.leave_id, 'Rejected')}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
                          onClick={() => handleProcessLeave(req.leave_id, 'Approved')}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                    No pending leave applications.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Leave Request History</h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>Loading history...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Processed By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length > 0 ? (
                      leaves.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {new Date(row.from_date).toLocaleDateString()} - {new Date(row.to_date).toLocaleDateString()}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{row.reason}</td>
                          <td>{row.manager_name || (row.approved_status !== 'Pending' ? 'System' : '--')}</td>
                          <td>
                            <span className={`badge ${row.approved_status === 'Approved' ? 'badge-active' : row.approved_status === 'Rejected' ? 'badge-admin' : 'badge-inactive'}`}>
                              {row.approved_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No leave history logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavePage;
