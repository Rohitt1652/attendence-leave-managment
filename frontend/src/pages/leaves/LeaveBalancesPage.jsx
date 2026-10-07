import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { Sparkles, CalendarCheck, CheckCircle, Clock } from 'lucide-react';

const LeaveBalancesPage = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/leaves/balances');
        setBalances(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton count={4} className="h-44" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Balance Entitlements</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Yearly allocation, usage breakdown, pending approvals, and remaining available days.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div
            key={b.leaveTypeId}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                <Badge variant={b.paid ? 'primary' : 'neutral'}>
                  {b.paid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                  {b.available}
                </span>
                <span className="text-xs text-slate-500 font-medium">Days Available</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-xs mt-3">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Allocated</span>
                <span className="font-semibold text-slate-700">{b.allocated}</span>
              </div>
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <span className="text-emerald-600 block text-[10px]">Used</span>
                <span className="font-semibold text-emerald-800">{b.used}</span>
              </div>
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <span className="text-amber-600 block text-[10px]">Pending</span>
                <span className="font-semibold text-amber-800">{b.pending}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalancesPage;
