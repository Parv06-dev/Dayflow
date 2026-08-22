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
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import { ThemeProvider } from './context/ThemeContext';
import apiRequest from './services/apiService';
import './App.css';

import { ToastProvider, useToast } from './context/ToastContext';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('login');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const [punchStatus, setPunchStatus] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const { showToast } = useToast();

  const isManager = currentUser?.emp_role === 'ADMIN' || currentUser?.emp_role === 'HR';

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      setCurrentUser(user);
      setActiveView(user.emp_role === 'ADMIN' || user.emp_role === 'HR' ? 'dashboard' : 'employees');
    } else {
      setActiveView('login');
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    apiRequest('/attendance/status')
      .then(setPunchStatus)
      .catch((error) => console.error('Error fetching header punch status:', error));
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveView(user.emp_role === 'ADMIN' || user.emp_role === 'HR' ? 'dashboard' : 'employees');
  };

  const handleHeaderPunch = async () => {
    setPunchLoading(true);
    try {
      const response = await apiRequest('/attendance/punch', { method: 'POST' });
      setPunchStatus({
        punchedIn: true,
        login_time: response.login_time,
        logout_time: response.logout_time
      });
      showToast(response.message, 'success');
    } catch (error) {
      showToast(error.message || 'Clock action failed', 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return isManager ? (
          <DashboardPage user={currentUser} onViewChange={setActiveView} />
        ) : (
          <EmployeesPage
            user={currentUser}
            onViewProfile={(employee) => {
              setProfileTarget(employee);
              setActiveView('profile');
            }}
          />
        );
      case 'employees':
        return (
          <EmployeesPage
            user={currentUser}
            onViewProfile={(employee) => {
              setProfileTarget(employee);
              setActiveView('profile');
            }}
          />
        );
      case 'attendance':
        return <AttendancePage user={currentUser} />;
      case 'leaves':
        return <LeavePage user={currentUser} />;
      case 'salary':
        return currentUser.emp_role === 'ADMIN' ? (
          <SalaryPage user={currentUser} />
        ) : (
          <EmployeesPage user={currentUser} />
        );
      case 'profile':
        return (
          <ProfilePage
            user={profileTarget || currentUser}
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            readOnly={Boolean(profileTarget && profileTarget.emp_id !== currentUser.emp_id)}
          />
        );
      default:
        return (
          <EmployeesPage
            user={currentUser}
            onViewProfile={(employee) => {
              setProfileTarget(employee);
              setActiveView('profile');
            }}
          />
        );
    }
  };

  if (!currentUser) {
    if (activeView === 'register') {
      return <Registration onViewChange={setActiveView} />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} onViewChange={setActiveView} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Layout Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
        }`}
      >
        {/* Sticky Top Bar */}
        <TopNav
          user={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          onHeaderPunch={handleHeaderPunch}
          punchStatus={punchStatus}
          punchLoading={punchLoading}
        />

        {/* Dynamic View Page Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
