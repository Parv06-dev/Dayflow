import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Command,
  Clock,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';

const TopNav = ({ user, activeView, onViewChange, onHeaderPunch, punchStatus, punchLoading }) => {
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Command palette keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-[70px] items-center justify-between px-6">
        
        {/* Left: Quick Search Bar */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="group flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] cursor-pointer hover:border-[var(--primary)] hover:text-[var(--text-primary)] transition-all w-64 md:w-80 shadow-sm"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
            <span className="flex-1 truncate">Search employees, leaves, reports...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>

        {/* Right Actions: Date, Clock Button, Quick Add, Notifications, Theme Toggle, Profile */}
        <div className="flex items-center gap-3">
          
          {/* Current Date Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{currentDateStr}</span>
          </div>

          {/* Quick Punch Clock Button */}
          <button
            onClick={onHeaderPunch}
            disabled={punchLoading}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              punchStatus?.punchedIn && !punchStatus?.logout_time
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/20'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${punchLoading ? 'animate-spin' : ''}`} />
            <span>{punchStatus?.punchedIn && !punchStatus?.logout_time ? 'Clocked In' : 'Clock In'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-4 z-50 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">Notifications</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">3 New</span>
                  </div>
                  <div className="divide-y divide-[var(--border-color)] max-h-64 overflow-y-auto">
                    <div className="py-2.5 text-xs">
                      <p className="font-medium text-[var(--text-primary)]">Leave Request Approved</p>
                      <p className="text-[var(--text-muted)] text-[11px] mt-0.5">Your PTO request for Aug 28 was approved by HR.</p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">10m ago</span>
                    </div>
                    <div className="py-2.5 text-xs">
                      <p className="font-medium text-[var(--text-primary)]">Payroll Generated</p>
                      <p className="text-[var(--text-muted)] text-[11px] mt-0.5">August payslips have been published for all departments.</p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">1h ago</span>
                    </div>
                    <div className="py-2.5 text-xs">
                      <p className="font-medium text-[var(--text-primary)]">New Team Member</p>
                      <p className="text-[var(--text-muted)] text-[11px] mt-0.5">Alex Morgan joined the Engineering team.</p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">3h ago</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--primary)] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-white font-bold text-xs flex items-center justify-center shadow-md">
                {getInitials(user?.emp_name)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-none">{user?.emp_name}</span>
                <span className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-none uppercase tracking-wider">{user?.emp_role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden md:block" />
            </button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-2 z-50 backdrop-blur-xl"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{user?.emp_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.emp_email}</p>
                  </div>
                  <button
                    onClick={() => { onViewChange('profile'); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { authService.logout(); window.location.reload(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Global Search Command Palette Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
                <Search className="w-5 h-5 text-[var(--primary)]" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)]"
                >
                  ESC
                </button>
              </div>

              <div className="p-3 max-h-80 overflow-y-auto space-y-1 text-xs">
                <div className="px-2 py-1 font-semibold text-[10px] uppercase text-[var(--text-muted)] tracking-wider">Quick Navigation</div>
                <button
                  onClick={() => { onViewChange('dashboard'); setIsSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span>Go to Dashboard</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Jump</span>
                </button>
                <button
                  onClick={() => { onViewChange('employees'); setIsSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span>View Employee Directory</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Directory</span>
                </button>
                <button
                  onClick={() => { onViewChange('leaves'); setIsSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span>Leave & PTO Requests</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Leaves</span>
                </button>
                <button
                  onClick={() => { onViewChange('salary'); setIsSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span>Payroll Summary & Payslips</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Payroll</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopNav;
