import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import PunchWidget from '../../components/attendance/PunchWidget';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck2,
  Home,
  CheckCircle,
  AlertCircle,
  Gift,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, employee } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebrations, setCelebrations] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resStats, resCeleb] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/calendar/celebrations'),
      ]);
      setStats(resStats.data.data);
      setCelebrations(resCeleb.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton count={4} className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const isEmployeeRole = user?.role?.code === 'employee';

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            {stats?.role || 'Welcome to HRMS'} Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Hello, {employee ? `${employee.firstName} ${employee.lastName}` : user?.email}! 👋
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {employee?.departmentId?.name || 'Enterprise'} &bull; {employee?.designationId?.name || user?.role?.name} &bull; Employee ID: {employee?.employeeCode || user?.employeeId || 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/calendar')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            icon={Calendar}
          >
            Company Calendar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/leaves')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
            icon={CalendarCheck2}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Role Condition: Employee Specific Dashboard */}
      {isEmployeeRole ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Live Punch & Monthly Summary */}
          <div className="space-y-6">
            <PunchWidget onPunchSuccess={fetchDashboardData} />

            <Card title="Monthly Attendance Summary" subtitle="Current Month Performance">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats?.monthlySummary?.present || 0}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">Days Present</span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-2xl font-bold text-amber-700">
                    {stats?.monthlySummary?.late || 0}
                  </span>
                  <span className="text-xs text-amber-600 block mt-0.5">Late Arrivals</span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-2xl font-bold text-indigo-700">
                    {stats?.monthlySummary?.halfDay || 0}
                  </span>
                  <span className="text-xs text-indigo-600 block mt-0.5">Half Days</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-2xl font-bold text-emerald-700">
                    {stats?.monthlySummary?.totalHours || 0}h
                  </span>
                  <span className="text-xs text-emerald-600 block mt-0.5">Total Hours</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Actions, Tasks, Holidays */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500">Pending Tasks</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.pendingTasks || 0}</p>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-2"
                >
                  View Tasks <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500">Pending Leaves</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.pendingLeaves || 0}</p>
                <button
                  onClick={() => navigate('/leaves')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-2"
                >
                  View Status <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-500">Regularizations</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">Ready</p>
                <button
                  onClick={() => navigate('/attendance/regularizations')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-2"
                >
                  Request Punch Fix <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Upcoming Holidays Card */}
            <Card title="Upcoming Company Holidays">
              <div className="space-y-3">
                {stats?.upcomingHolidays?.length > 0 ? (
                  stats.upcomingHolidays.map((h) => (
                    <div
                      key={h._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex flex-col items-center justify-center font-bold text-xs leading-none">
                          <span>{new Date(h.date).getDate()}</span>
                          <span className="text-[10px] font-normal uppercase mt-0.5">
                            {new Date(h.date).toLocaleString('default', { month: 'short' })}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{h.name}</p>
                          <span className="text-[10px] text-slate-400">{h.type}</span>
                        </div>
                      </div>
                      <Badge variant="brand">Holiday</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No upcoming holidays scheduled</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* HR / Admin / Manager Full Dashboard */
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Staff</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.metrics?.totalEmployees || 0}</p>
              <span className="text-[10px] text-slate-400">Active roster</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Present Today</span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats?.metrics?.presentToday || 0}</p>
              <span className="text-[10px] text-emerald-600">
                {stats?.metrics?.totalEmployees
                  ? Math.round((stats.metrics.presentToday / stats.metrics.totalEmployees) * 100)
                  : 0}
                % attendance
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Late Arrivals</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats?.metrics?.lateToday || 0}</p>
              <span className="text-[10px] text-amber-600">Past grace period</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Absent</span>
                <UserX className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-rose-600">{stats?.metrics?.absentToday || 0}</p>
              <span className="text-[10px] text-rose-500">No punch yet</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">On Leave</span>
                <CalendarCheck2 className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats?.metrics?.leaveToday || 0}</p>
              <span className="text-[10px] text-slate-400">Approved leaves</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Pending Approvals</span>
                <AlertCircle className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                {(stats?.metrics?.pendingLeaveRequests || 0) +
                  (stats?.metrics?.pendingRegularizations || 0)}
              </p>
              <span className="text-[10px] text-indigo-500">Leaves & Punches</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Attendance Trend Chart */}
            <Card
              className="lg:col-span-2"
              title="7-Day Attendance Trend"
              subtitle="Daily Present, Late, and Absent rates"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="present" stroke="#4f46e5" fillOpacity={1} fill="url(#presentGrad)" name="Present" />
                    <Area type="monotone" dataKey="late" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" name="Late" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Department Distribution */}
            <Card title="Department Distribution" subtitle="Active employees per department">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.departmentDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="employeeCount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Employees" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Lower Grid: Pending Leaves & Upcoming Celebrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Leave Approvals */}
            <Card
              title="Pending Leave Requests"
              subtitle="Requires approval review"
              action={
                <Button size="xs" variant="outline" onClick={() => navigate('/leaves')}>
                  View All
                </Button>
              }
            >
              <div className="space-y-3">
                {stats?.recentLeaves?.length > 0 ? (
                  stats.recentLeaves.map((lr) => (
                    <div
                      key={lr._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {lr.employeeId?.firstName} {lr.employeeId?.lastName} ({lr.employeeId?.employeeCode})
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lr.leaveTypeId?.name} &bull; {lr.numberOfDays} Day{lr.numberOfDays > 1 ? 's' : ''} ({new Date(lr.startDate).toLocaleDateString()})
                        </p>
                      </div>
                      <Badge variant="warning">Pending Review</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No pending leaves</p>
                )}
              </div>
            </Card>

            {/* Upcoming Birthdays & Work Anniversaries */}
            <Card title="Celebrations & Milestones" subtitle="Birthdays and Work Anniversaries">
              <div className="space-y-3">
                {celebrations?.todayBirthdays?.length > 0 &&
                  celebrations.todayBirthdays.map((b) => (
                    <div key={b._id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                      <div className="flex items-center gap-2.5">
                        <Gift className="h-4 w-4 text-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-rose-900">{b.firstName} {b.lastName} &bull; Today!</p>
                          <span className="text-[10px] text-rose-600">Birthday Celebration</span>
                        </div>
                      </div>
                      <Badge variant="danger">Birthday 🎂</Badge>
                    </div>
                  ))}

                {celebrations?.upcomingBirthdays?.slice(0, 3).map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Gift className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-800">{b.firstName} {b.lastName}</p>
                        <span className="text-[10px] text-slate-500">Birthday: Day {b.day}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Upcoming</span>
                  </div>
                ))}

                {celebrations?.upcomingAnniversaries?.slice(0, 2).map((a) => (
                  <div key={a._id} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-900">{a.firstName} {a.lastName}</p>
                        <span className="text-[10px] text-emerald-600">{a.years} Year{a.years > 1 ? 's' : ''} Work Anniversary</span>
                      </div>
                    </div>
                    <Badge variant="success">Milestone</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
