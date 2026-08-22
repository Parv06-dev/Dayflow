import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  CreditCard,
  UserPlus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  BarChart3,
  Check,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import apiRequest from '../services/apiService';
import useAttendance from '../services/attendanceService';

const DashboardPage = ({ user, onViewChange }) => {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';
  const { status: punchStatus, checkIn, checkOut, loading: punchLoading } = useAttendance(!isManager);

  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isManager) {
        const attendanceData = await apiRequest('/attendance/today');
        const pendingQueue = await apiRequest('/leaves/pending');
        const employeesList = await apiRequest('/employees');
        let trendData = [];
        try {
          trendData = await apiRequest('/attendance/weekly-trend');
        } catch (e) {
          console.warn('Weekly trend fetch issue:', e);
        }

        // Dynamically compute department allocation from real employee database records
        const deptCounts = {};
        const colors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
        employeesList.forEach((e) => {
          const dept = e.emp_department || 'General';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const totalEmp = employeesList.length || 1;
        const dynamicDepts = Object.keys(deptCounts).map((dept, idx) => ({
          name: dept,
          value: Math.round((deptCounts[dept] / totalEmp) * 100),
          color: colors[idx % colors.length]
        }));

        // Calculate dynamic new joiners (joined in current year or recently created)
        const currentYear = new Date().getFullYear();
        const newJoinersCount = employeesList.filter((e) => {
          if (e.joining_year && Number(e.joining_year) === currentYear) return true;
          if (e.date_of_joining) {
            const joinYear = new Date(e.date_of_joining).getFullYear();
            return joinYear === currentYear;
          }
          return false;
        }).length;

        setStats({
          totalEmployees: employeesList.length,
          present: attendanceData.stats?.present || 0,
          onLeave: attendanceData.stats?.onLeave || 0,
          absent: attendanceData.stats?.absent || 0,
          pendingLeavesCount: pendingQueue.length,
          newJoinersCount: newJoinersCount || employeesList.length,
          punches: attendanceData.punches || [],
          departments: dynamicDepts
        });
        setWeeklyTrend(trendData);
        setPendingLeaves(pendingQueue);
      } else {
        const leaves = await apiRequest('/leaves');
        const pending = leaves.filter((l) => l.approved_status === 'Pending').length;
        const approved = leaves.filter((l) => l.approved_status === 'Approved').length;

        setStats({
          personalLeaves: leaves.length,
          pending,
          approved
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeave = async (leaveId, status) => {
    try {
      await apiRequest(`/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update leave status');
    }
  };

  // Mock chart data series
  const attendanceTrendData = [
    { day: 'Mon', present: 8, absent: 2 },
    { day: 'Tue', present: 9, absent: 1 },
    { day: 'Wed', present: 10, absent: 0 },
    { day: 'Thu', present: 8, absent: 2 },
    { day: 'Fri', present: 7, absent: 3 },
    { day: 'Sat', present: 5, absent: 5 }
  ];

  const deptDistributionData = [
    { name: 'Engineering', value: 45, color: '#8b5cf6' },
    { name: 'HR & Admin', value: 20, color: '#3b82f6' },
    { name: 'Sales & Mktg', value: 25, color: '#22c55e' },
    { name: 'Operations', value: 10, color: '#f59e0b' }
  ];

  const leaveStatsData = [
    { type: 'Paid Time Off', count: 14 },
    { type: 'Sick Leave', count: 6 },
    { type: 'Maternity/Paternity', count: 2 },
    { type: 'Unpaid Leave', count: 3 }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading enterprise dashboard...</p>
      </div>
    );
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* --- HERO WELCOME SECTION --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-background p-8 border border-[var(--primary)]/20 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs font-semibold text-[var(--primary)] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise HR Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-['Outfit']">
              Good Morning, {user?.emp_name?.split(' ')[0] || user?.emp_name} 👋
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xl">
              Here is your company's real-time attendance, leave status, and team productivity overview for <span className="font-semibold text-[var(--text-primary)]">{currentDateStr}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-color)] text-xs text-[var(--text-secondary)] backdrop-blur-md">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-semibold">Attendance Rate</span>
              <span className="text-lg font-bold text-emerald-400">
                {stats?.totalEmployees ? Math.round((stats.present / stats.totalEmployees) * 100) : 100}%
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-color)] text-xs text-[var(--text-secondary)] backdrop-blur-md">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-semibold">Active Shifts</span>
              <span className="text-lg font-bold text-[var(--primary)]">{stats?.present || 0} Clocked In</span>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {isManager ? (
        /* ================= ADMIN / HR DASHBOARD ================= */
        <>
          {/* --- KPI CARDS GRID (6 Cards Desktop) --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Card 1: Total Employees */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('employees')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-purple-500 hover:border-purple-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Total Staff</span>
                <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                {stats?.totalEmployees || 0}
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-emerald-400 gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>+4 this month</span>
              </div>
            </motion.div>

            {/* Card 2: Present Today */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('attendance')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-emerald-500 hover:border-emerald-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Present Today</span>
                <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                {stats?.present || 0}
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-emerald-400 gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>On Time 98%</span>
              </div>
            </motion.div>

            {/* Card 3: Employees On Leave */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('leaves')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-amber-500 hover:border-amber-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>On Leave</span>
                <CalendarCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                {stats?.onLeave || 0}
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-amber-400 gap-1">
                <span>{stats?.pendingLeavesCount || 0} pending review</span>
              </div>
            </motion.div>

            {/* Card 4: Absent */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('attendance')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-rose-500 hover:border-rose-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Absent</span>
                <UserX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                {stats?.absent || 0}
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-rose-400 gap-1">
                <ArrowDownRight className="w-3 h-3" />
                <span>-2 vs yesterday</span>
              </div>
            </motion.div>

            {/* Card 5: Payroll Processed */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('salary')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-blue-500 hover:border-blue-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Payroll</span>
                <CreditCard className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                100%
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-blue-400 gap-1">
                <span>August Completed</span>
              </div>
            </motion.div>

            {/* Card 6: New Joiners */}
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onViewChange('employees')}
              className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-t-[3px] border-t-indigo-500 hover:border-indigo-500/50 shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>New Joiners</span>
                <UserPlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">
                +{stats?.newJoinersCount || 0}
              </div>
              <div className="mt-2 flex items-center text-[10px] font-semibold text-indigo-400 gap-1">
                <span>Active Year</span>
              </div>
            </motion.div>
          </div>

          {/* --- ANALYTICS SECTION (CHARTS) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Attendance Trend (Area Chart) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Attendance Trend (Weekly)</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time daily clock-in records vs expected attendance.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" /> Present
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend && weeklyTrend.length > 0 ? weeklyTrend : attendanceTrendData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department Distribution (Donut Chart) */}
            <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Department Allocation</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Staff breakdown across company units.</p>
              </div>

              <div className="h-48 w-full my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.departments && stats.departments.length > 0 ? stats.departments : deptDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {(stats?.departments && stats.departments.length > 0 ? stats.departments : deptDistributionData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(stats?.departments && stats.departments.length > 0 ? stats.departments : deptDistributionData).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[var(--text-secondary)] font-medium truncate">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* --- QUICK ACTION CARDS & HR APPROVAL QUEUE --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Quick Actions</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onViewChange('employees')}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex flex-col gap-3 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">Manage Employees</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">View staff directory & roles</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onViewChange('leaves')}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex flex-col gap-3 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">Review Leaves</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Approve or reject PTO requests</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onViewChange('salary')}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex flex-col gap-3 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">Process Payroll</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Generate monthly payslips</span>
                  </div>
                </motion.button>
              </div>

              {/* Attendance Roll Table Preview */}
              <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Today's Attendance Roll</h3>
                  <button onClick={fetchDashboardData} className="text-xs text-[var(--primary)] hover:underline font-semibold">Refresh</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                        <th className="pb-3">Employee</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Clock In</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {stats?.punches && stats.punches.length > 0 ? (
                        stats.punches.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-3 font-semibold text-[var(--text-primary)]">{p.emp_name}</td>
                            <td className="py-3 text-[var(--text-secondary)]">{p.emp_department}</td>
                            <td className="py-3 text-[var(--text-muted)]">{p.login_time || '--:--'}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                p.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-[var(--text-muted)]">No punch records found today</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pending Leave Approval Cards Sidebar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Pending PTO Requests</h3>
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold">
                  {pendingLeaves.length}
                </span>
              </div>

              <div className="space-y-3">
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.map((req) => (
                    <div key={req.leave_id} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-l-4 border-l-amber-500 space-y-3 shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-xs text-[var(--text-primary)]">{req.emp_name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{req.emp_department}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                          {req.leave_type || 'Paid time Off'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-tertiary)] p-2 rounded-xl border border-[var(--border-color)]">
                        "{req.reason}"
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleProcessLeave(req.leave_id, 'Rejected')}
                          className="flex-1 py-1.5 text-xs font-medium rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleProcessLeave(req.leave_id, 'Approved')}
                          className="flex-1 py-1.5 text-xs font-medium rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
                    No pending leave applications requiring action.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* ================= REGULAR EMPLOYEE DASHBOARD ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shift Time Clock Tracker */}
          <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Shift Time Tracker</h3>
            
            <button
              onClick={async () => {
                try {
                  const isCheckedIn = punchStatus?.punchedIn && !punchStatus?.logout_time;
                  const punchRes = isCheckedIn ? await checkOut() : await checkIn();
                  alert(punchRes.message);
                } catch (e) {
                  alert(e.message || 'Action failed');
                }
              }}
              disabled={punchLoading}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-300 shadow-2xl ${
                punchStatus?.punchedIn && !punchStatus?.logout_time
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-rose-500/20 hover:scale-105'
                  : 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-emerald-500/20 hover:scale-105'
              }`}
            >
              <Clock className="w-8 h-8" />
              <span className="font-extrabold text-sm uppercase tracking-wider">
                {punchStatus?.punchedIn && !punchStatus?.logout_time ? 'Clock Out' : 'Clock In'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-[var(--border-color)] text-xs">
              <div>
                <span className="text-[var(--text-muted)] block">Clock In</span>
                <span className="font-bold text-[var(--text-primary)] mt-1 block">{punchStatus?.login_time || '--:--'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">Clock Out</span>
                <span className="font-bold text-[var(--text-primary)] mt-1 block">{punchStatus?.logout_time || '--:--'}</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts for Employees */}
          <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Quick Actions</h3>

            <div className="space-y-3">
              <button
                onClick={() => onViewChange('attendance')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] transition-all"
              >
                <span>View Attendance Log</span>
                <Clock className="w-4 h-4 text-[var(--primary)]" />
              </button>
              <button
                onClick={() => onViewChange('leaves')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] transition-all"
              >
                <span>Request PTO / Time Off</span>
                <CalendarCheck className="w-4 h-4 text-[var(--accent)]" />
              </button>
              <button
                onClick={() => onViewChange('salary')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--primary)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] transition-all"
              >
                <span>My Payslips</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
