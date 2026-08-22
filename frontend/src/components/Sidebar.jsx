import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange, currentUser, collapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const isManager = currentUser?.emp_role === 'ADMIN' || currentUser?.emp_role === 'HR';

  const menuItems = [
    ...(isManager ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Management', icon: CalendarDays },
    ...(currentUser?.emp_role === 'ADMIN' ? [{ id: 'salary', label: 'Payroll', icon: CreditCard }] : []),
    { id: 'profile', label: 'My Account', icon: User }
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-300 backdrop-blur-xl ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* Brand Logo Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-[var(--border-color)]">
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
          {currentUser?.logo_url ? (
            <img
              src={currentUser.logo_url}
              alt="Company Logo"
              className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl object-cover border border-[var(--border-color)] shadow-md shrink-0"
            />
          ) : (
            <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0 flex-1"
            >
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] font-['Outfit'] leading-none truncate">
                {currentUser?.company_name || 'Dayflow'}
              </span>
              <span className="text-[9px] font-semibold text-[var(--primary)] tracking-widest uppercase mt-1">
                Enterprise HRMS
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0 ml-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Collapse Expand Button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all absolute -right-3 top-5 z-50 shadow-md"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/10 text-[var(--text-primary)] font-semibold border border-[var(--primary)]/30 shadow-md shadow-[var(--primary)]/5'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-all ${
                  isActive ? 'text-[var(--primary)] drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:scale-110'
                }`}
              />

              {!collapsed && <span>{item.label}</span>}

              {/* Glowing active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute right-2 w-1.5 h-6 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Info Card */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div
          onClick={() => onViewChange('profile')}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] hover:border-[var(--primary)]/50 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {currentUser?.emp_name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{currentUser?.emp_name}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--primary)]" />
                {currentUser?.emp_role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
