import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const DashboardPage = ({ user, onViewChange }) => {
  const [stats, setStats] = useState(null);
  const [punchStatus, setPunchStatus] = useState(null);
  const [leavesCount, setLeavesCount] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isManager) {
        // Fetch Today's Attendance stats for Admin/HR
        const attendanceData = await apiRequest('/attendance/today');
        
        // Fetch Pending Leaves Count
        const pendingLeaves = await apiRequest('/leaves/pending');
        
        // Fetch Employees count
        const employeesList = await apiRequest('/employees');

        setStats({
          totalEmployees: employeesList.length,
          present: attendanceData.stats.present,
          onLeave: attendanceData.stats.onLeave,
          absent: attendanceData.stats.absent,
          pendingLeaves: pendingLeaves.length,
          punches: attendanceData.punches
        });
      } else {
        // Fetch personal punch status for standard employee
        const status = await apiRequest('/attendance/status');
        setPunchStatus(status);

        // Fetch personal leaves
        const leaves = await apiRequest('/leaves');
        const pending = leaves.filter(l => l.approved_status === 'Pending').length;
        const approved = leaves.filter(l => l.approved_status === 'Approved').length;

        setLeavesCount({
          total: leaves.length,
          pending,
          approved
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async () => {
    try {
      const punchRes = await apiRequest('/attendance/punch', { method: 'POST' });
      // Refresh status
      const status = await apiRequest('/attendance/status');
      setPunchStatus(status);
      alert(punchRes.message);
    } catch (err) {
      alert(err.message || 'Clock action failed');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard details...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome back, {user.emp_name} 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here is a summary of Dayflow HRMS for today.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isManager ? (
        /* --- ADMIN/HR Dashboard --- */
        <>
          <div className="dashboard-grid">
            <div className="card stat-card" onClick={() => onViewChange('employees')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Total Employees</span>
                <span className="stat-value">{stats?.totalEmployees || 0}</span>
              </div>
              <div className="stat-icon primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>

            <div className="card stat-card" onClick={() => onViewChange('attendance')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Present Today</span>
                <span className="stat-value">{stats?.present || 0}</span>
              </div>
              <div className="stat-icon success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>

            <div className="card stat-card" onClick={() => onViewChange('leaves')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Pending Leaves</span>
                <span className="stat-value">{stats?.pendingLeaves || 0}</span>
              </div>
              <div className="stat-icon accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>

            <div className="card stat-card" onClick={() => onViewChange('attendance')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Absent / Out</span>
                <span className="stat-value">{stats?.absent || 0}</span>
              </div>
              <div className="stat-icon error">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
            </div>
          </div>

          <div className="dashboard-layout">
            <div className="dashboard-main">
              <div className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Today's Attendance Roll</h3>
                  <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchDashboardData}>Refresh</button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.punches && stats.punches.length > 0 ? (
                        stats.punches.map((punch, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{punch.emp_name}</td>
                            <td>{punch.emp_department}</td>
                            <td><span className={`badge badge-${punch.emp_role.toLowerCase()}`}>{punch.emp_role}</span></td>
                            <td style={{ color: punch.login_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>{punch.login_time || '--:--:--'}</td>
                            <td style={{ color: punch.logout_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>{punch.logout_time || '--:--:--'}</td>
                            <td>
                              <span className={`badge ${punch.status === 'Present' ? 'badge-active' : punch.status === 'On Leave' ? 'badge-hr' : 'badge-inactive'}`}>
                                {punch.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No employee punch records found today</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="dashboard-side">
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={() => onViewChange('employees')}>Manage Directory</button>
                  <button className="btn btn-secondary" onClick={() => onViewChange('leaves')}>Review Leaves</button>
                  <button className="btn btn-secondary" onClick={() => onViewChange('salary')}>View Payroll</button>
                </div>
              </div>
              
              <div className="card" style={{ marginTop: '12px' }}>
                <h3 style={{ marginBottom: '12px' }}>System Alerts</h3>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '10px' }}>
                    <p style={{ fontWeight: '600' }}>Leave Applications</p>
                    <p style={{ color: 'var(--text-secondary)' }}>You have {stats?.pendingLeaves || 0} leave request(s) awaiting approval.</p>
                  </div>
                  <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '10px' }}>
                    <p style={{ fontWeight: '600' }}>Clock Summary</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{stats?.present || 0} employees have clocked in today.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* --- STANDARD EMPLOYEE Dashboard --- */
        <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="dashboard-main">
            <div className="card-glass punch-card-wrapper">
              <h3 style={{ marginBottom: '12px' }}>Shift Time Tracker</h3>
              <div className="digital-clock">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="clock-date">
                {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                  <div className="punch-time-label">Clock In</div>
                  <div className="punch-time-val" style={{ color: punchStatus?.login_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {punchStatus?.login_time || '--:--:--'}
                  </div>
                </div>
                <div style={{ borderRight: '1px solid var(--border-color)' }}></div>
                <div>
                  <div className="punch-time-label">Clock Out</div>
                  <div className="punch-time-val" style={{ color: punchStatus?.logout_time ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {punchStatus?.logout_time || '--:--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-side">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ marginBottom: '20px' }}>Leave Status Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-title)' }}>
                      {leavesCount.pending}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Pending Requests</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
                      {leavesCount.approved}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Approved Requests</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '16px' }}>Quick Shortcuts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={() => onViewChange('attendance')}>View My Attendance Log</button>
                  <button className="btn btn-secondary" onClick={() => onViewChange('leaves')}>Apply For Leave</button>
                  <button className="btn btn-secondary" onClick={() => onViewChange('salary')}>View Payslip</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
