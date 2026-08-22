import React, { useState, useEffect } from 'react';
import authService from './services/authService';
import Login from './auth/login';
import Registration from './auth/registration';
import DashboardPage from './views/DashboardPage';
import EmployeesPage from './views/EmployeesPage';
import AttendancePage from './views/AttendancePage';
import LeavePage from './views/LeavePage';
import SalaryPage from './views/SalaryPage';
import ProfilePage from './views/ProfilePage';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('login'); // login, register, dashboard, employees, attendance, leaves, salary, profile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      setCurrentUser(user);
      setActiveView('dashboard');
    } else {
      setActiveView('login');
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveView('login');
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'employees': return 'Employee Directory';
      case 'attendance': return 'Attendance Logging';
      case 'leaves': return 'Leave Requests & Approvals';
      case 'salary': return 'Payroll & Payslips';
      case 'profile': return 'My Account Profile';
      default: return 'Dayflow HRMS';
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage user={currentUser} onViewChange={setActiveView} />;
      case 'employees':
        return <EmployeesPage user={currentUser} />;
      case 'attendance':
        return <AttendancePage user={currentUser} />;
      case 'leaves':
        return <LeavePage user={currentUser} />;
      case 'salary':
        return <SalaryPage user={currentUser} />;
      case 'profile':
        return <ProfilePage user={currentUser} onUserUpdate={handleUserUpdate} />;
      default:
        return <DashboardPage user={currentUser} onViewChange={setActiveView} />;
    }
  };

  // If not logged in, render auth flow views
  if (!currentUser) {
    if (activeView === 'register') {
      return <Registration onViewChange={setActiveView} />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} onViewChange={setActiveView} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-text">
            Dayflow <div className="logo-dot"></div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <a
            className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            Dashboard
          </a>

          <a
            className={`sidebar-item ${activeView === 'employees' ? 'active' : ''}`}
            onClick={() => { setActiveView('employees'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Employees
          </a>

          <a
            className={`sidebar-item ${activeView === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveView('attendance'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Attendance
          </a>

          <a
            className={`sidebar-item ${activeView === 'leaves' ? 'active' : ''}`}
            onClick={() => { setActiveView('leaves'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Leaves
          </a>

          <a
            className={`sidebar-item ${activeView === 'salary' ? 'active' : ''}`}
            onClick={() => { setActiveView('salary'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Payroll & Payslips
          </a>

          <a
            className={`sidebar-item ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveView('profile'); setIsSidebarOpen(false); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {currentUser.emp_name.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.emp_name}</div>
              <div className="user-role">{currentUser.emp_role}</div>
            </div>
          </div>
          
          <button className="btn-logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="main-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="modal-close-btn"
              style={{ display: 'none', fontSize: '1.8rem', padding: '0 8px' }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              &#9776;
            </button>
            <div className="header-title">
              <h2>{getPageTitle()}</h2>
            </div>
          </div>

          <div className="header-actions">
            <div className="header-date">
              📅 {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="content-body">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;
