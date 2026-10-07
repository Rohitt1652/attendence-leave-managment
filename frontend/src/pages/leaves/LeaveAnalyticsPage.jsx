import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import { Skeleton } from '../../components/common/Skeleton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const LeaveAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/leaves/analytics');
        setAnalytics(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton count={2} className="h-72" />
        </div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthly = analytics?.monthlyTrend?.map((m) => ({
    ...m,
    monthName: monthNames[m._id] || `M${m._id}`,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Utilization Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Macro statistics on time-off trends, approved volumes, and leave-type consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card title="Monthly Leave Consumption Trend" subtitle="Total days taken per month">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leaveTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="totalDays" stroke="#6366f1" fillOpacity={1} fill="url(#leaveTrendGrad)" name="Total Days" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Most Used Leave Types */}
        <Card title="Leave Consumption by Type" subtitle="Days consumed across categories">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.typeCounts || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="totalDays" fill="#10b981" radius={[4, 4, 0, 0]} name="Days Consumed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Approval vs Rejection Status Distribution */}
      <Card title="Leave Request Status Breakdown" subtitle="Distribution of pending, approved, and rejected applications">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {analytics?.statusCounts?.map((st) => (
            <div key={st._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-2xl font-bold text-slate-900 block font-mono">{st.count}</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mt-1">
                {st._id} Requests
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LeaveAnalyticsPage;
