import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const AttendancePage = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [punchStatus, setPunchStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manager capabilities
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(user.emp_id);
  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';

  useEffect(() => {
    // Tick clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchEmployeesList();
    }
  }, []);

  useEffect(() => {
    fetchPunchStatus();
    fetchAttendanceHistory();
  }, [selectedEmpId]);

  const fetchEmployeesList = async () => {
    try {
      const data = await apiRequest('/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  };

  const fetchPunchStatus = async () => {
    // Only check punch status for the logged-in user themselves
    if (selectedEmpId === user.emp_id) {
      try {
        const data = await apiRequest('/attendance/status');
        setPunchStatus(data);
      } catch (err) {
        console.error('Error fetching punch status:', err);
      }
    } else {
      setPunchStatus(null);
    }
  };

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/attendance/employee/${selectedEmpId}`);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async () => {
    try {
      const data = await apiRequest('/attendance/punch', { method: 'POST' });
      fetchPunchStatus();
      fetchAttendanceHistory();
      alert(data.message);
    } catch (err) {
      alert(err.message || 'Failed to punch');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Attendance Log</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Clock in/out of work shifts and review historical records.</p>
      </div>

      {isManager && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>View Log for Employee:</label>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '240px' }}
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(parseInt(e.target.value))}
            >
              <option value={user.emp_id}>{user.emp_name} (Self)</option>
              {employees
                .filter(e => e.emp_id !== user.emp_id)
                .map(e => (
                  <option key={e.emp_id} value={e.emp_id}>
                    {e.emp_name} ({e.emp_role} - {e.emp_department})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {selectedEmpId === user.emp_id && (
          <div className="dashboard-side">
            <div className="card-glass punch-card-wrapper">
              <h3 style={{ marginBottom: '12px' }}>Clock Work Shift</h3>
              <div className="digital-clock">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="clock-date">
                {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <button
                className={`punch-circle-btn ${punchStatus?.punchedIn && !punchStatus?.logout_time ? 'punched' : ''}`}
                onClick={handlePunch}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                {punchStatus?.punchedIn && !punchStatus?.logout_time ? 'Clock Out' : 'Clock In'}
              </button>

              <div className="punch-today-stats">
                <div>
                  <div className="punch-time-label">Login Time</div>
                  <div className="punch-time-val" style={{ color: punchStatus?.login_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {punchStatus?.login_time || '--:--:--'}
                  </div>
                </div>
                <div style={{ borderRight: '1px solid var(--border-color)' }}></div>
                <div>
                  <div className="punch-time-label">Logout Time</div>
                  <div className="punch-time-val" style={{ color: punchStatus?.logout_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {punchStatus?.logout_time || '--:--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-main" style={{ gridColumn: selectedEmpId !== user.emp_id ? '1 / -1' : undefined }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Attendance History</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>Loading historical logs...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Punch In</th>
                      <th>Punch Out</th>
                      <th>Worked Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {new Date(row.attendance_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ color: 'var(--success)' }}>{row.login_time || '--:--:--'}</td>
                          <td style={{ color: row.logout_time ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {row.logout_time || '--:--:--'}
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {row.workedHours !== undefined ? `${row.workedHours} hr` : '--'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No shift logs found for this user</td>
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

export default AttendancePage;
