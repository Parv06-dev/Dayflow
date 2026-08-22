import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const calculateWorkHours = (login, logout) => {
  if (!login || !logout) return { work: '--:--', extra: '--:--' };
  const [linH, linM] = login.split(':').map(Number);
  const [loutH, loutM] = logout.split(':').map(Number);
  const worked = (loutH + loutM/60) - (linH + linM/60);
  if (worked <= 0) return { work: '00:00', extra: '00:00' };
  
  const wH = Math.floor(worked);
  const wM = Math.round((worked - wH) * 60);
  const formattedWork = `${String(wH).padStart(2, '0')}:${String(wM).padStart(2, '0')}`;
  
  let formattedExtra = '00:00';
  if (worked > 8) {
    const extra = worked - 8;
    const eH = Math.floor(extra);
    const eM = Math.round((extra - eH) * 60);
    formattedExtra = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
  }
  return { work: formattedWork, extra: formattedExtra };
};

const AttendancePage = ({ user }) => {
  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [adminTodayData, setAdminTodayData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isManager) {
      fetchAdminData();
    } else {
      fetchEmployeeData();
    }
  }, []);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const historyData = await apiRequest(`/attendance/employee/${user.emp_id}`);
      setHistory(historyData);
      
      const leavesData = await apiRequest(`/leaves?emp_id=${user.emp_id}`);
      setLeaves(leavesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const todayData = await apiRequest('/attendance/today');
      setAdminTodayData(todayData.punches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calculations for Employee View
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const filteredHistory = history.filter(row => {
    const rowDate = new Date(row.attendance_date);
    return rowDate.getFullYear() === currentYear && rowDate.getMonth() === currentMonth;
  });

  const daysPresent = filteredHistory.length;

  const getWorkingDaysInMonth = (year, month) => {
    let count = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    }
    return count;
  };
  const totalWorkingDays = getWorkingDaysInMonth(currentYear, currentMonth);

  let leavesCount = 0;
  leaves.forEach(leave => {
    if (leave.approved_status === 'Approved') {
      let start = new Date(leave.from_date);
      let end = new Date(leave.to_date);
      
      let monthStart = new Date(currentYear, currentMonth, 1);
      let monthEnd = new Date(currentYear, currentMonth + 1, 0);

      let actualStart = start > monthStart ? start : monthStart;
      let actualEnd = end < monthEnd ? end : monthEnd;

      if (actualStart <= actualEnd) {
        actualStart.setHours(0, 0, 0, 0);
        actualEnd.setHours(0, 0, 0, 0);
        let count = 0;
        let d = new Date(actualStart);
        while (d <= actualEnd) {
          if (d.getDay() !== 0 && d.getDay() !== 6) count++;
          d.setDate(d.getDate() + 1);
        }
        leavesCount += count;
      }
    }
  });

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading attendance data...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '12px 16px', alignItems: 'center' }}>
          <h3 style={{ margin: 0, width: isManager ? 'auto' : '100%', marginRight: isManager ? '24px' : '0' }}>Attendance</h3>
          {isManager && (
            <input 
              type="text" 
              placeholder="Searchbar" 
              className="form-input" 
              style={{ flex: 1, padding: '6px 12px', borderRadius: '16px', maxWidth: '400px' }} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          )}
        </div>

        {/* Toolbar Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '12px 16px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto' }} onClick={handlePrevMonth}>&lt;-</button>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto' }} onClick={handleNextMonth}>-&gt;</button>
          
          {isManager ? (
            <>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto' }}>Date v</button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto', backgroundColor: 'transparent' }}>Day</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto' }}>
                {currentDate.toLocaleDateString('en-US', { month: 'short' })} v
              </button>
              <div style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}>
                Count of days present: <strong>{daysPresent}</strong>
              </div>
              <div style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}>
                Leaves count: <strong>{leavesCount}</strong>
              </div>
              <div style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}>
                Total working days: <strong>{totalWorkingDays}</strong>
              </div>
            </>
          )}
        </div>

        {/* Table Area */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              {/* Optional Subheader for Date */}
              <tr>
                <th colSpan="5" style={{ padding: '12px 16px', fontWeight: '500', borderBottom: '1px solid var(--border-color)' }}>
                  {currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' ', ',')}
                </th>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)', fontWeight: '600' }}>{isManager ? 'Emp' : 'Date'}</th>
                <th style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)', fontWeight: '600' }}>Check In</th>
                <th style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)', fontWeight: '600' }}>Check Out</th>
                <th style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)', fontWeight: '600' }}>Work Hours</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Extra hours</th>
              </tr>
            </thead>
            <tbody>
              {isManager ? (
                /* Admin Rows */
                adminTodayData.filter(d => d.emp_name.toLowerCase().includes(searchQuery.toLowerCase())).map((row, idx) => {
                  const { work, extra } = calculateWorkHours(row.login_time, row.logout_time);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>[{row.emp_name}]</td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{row.login_time ? row.login_time.slice(0, 5) : '--:--'}</td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{row.logout_time ? row.logout_time.slice(0, 5) : '--:--'}</td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{work}</td>
                      <td style={{ padding: '12px 16px' }}>{extra}</td>
                    </tr>
                  );
                })
              ) : (
                /* Employee Rows */
                filteredHistory.map((row, idx) => {
                  const { work, extra } = calculateWorkHours(row.login_time, row.logout_time);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>
                        {new Date(row.attendance_date).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{row.login_time ? row.login_time.slice(0, 5) : '--:--'}</td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{row.logout_time ? row.logout_time.slice(0, 5) : '--:--'}</td>
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--border-color)' }}>{work}</td>
                      <td style={{ padding: '12px 16px' }}>{extra}</td>
                    </tr>
                  );
                })
              )}
              {((isManager && adminTodayData.length === 0) || (!isManager && filteredHistory.length === 0)) && (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AttendancePage;
