import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Calendar, Filter } from 'lucide-react';

const MonthlyMatrixPage = () => {
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/monthly-matrix', {
        params: { month, year, departmentId },
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiClient.get('/departments').then((r) => setDepartments(r.data.data));
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [month, year, departmentId]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Present':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">P</span>;
      case 'Late':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">L</span>;
      case 'Half Day':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">HD</span>;
      case 'Work From Home':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">WFH</span>;
      case 'Paid Leave':
      case 'Unpaid Leave':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">LV</span>;
      case 'Week Off':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">WO</span>;
      case 'Holiday':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">H</span>;
      case 'Absent':
        return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">A</span>;
      default:
        return <span className="text-slate-300">-</span>;
    }
  };

  const daysArray = data ? Array.from({ length: data.daysInMonth }, (_, i) => i + 1) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Attendance Grid Matrix</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-level calendar visualization of all employee punches and leaves across each day of the month.
        </p>
      </div>

      {/* Controls & Legend */}
      <Card className="p-4!">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-emerald-100 text-emerald-800 font-bold rounded">P</span> Present</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-amber-100 text-amber-800 font-bold rounded">L</span> Late</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-purple-100 text-purple-800 font-bold rounded">HD</span> Half Day</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-rose-100 text-rose-800 font-bold rounded">A</span> Absent</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-slate-100 text-slate-500 font-bold rounded">WO</span> Week Off</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-sky-100 text-sky-800 font-bold rounded">H</span> Holiday</span>
            <span className="flex items-center gap-1 font-medium"><span className="px-1 bg-indigo-100 text-indigo-800 font-bold rounded">LV</span> Leave</span>
          </div>
        </div>
      </Card>

      {/* Grid Table */}
      <Card className="p-0! overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={12} />
          </div>
        ) : !data || data.matrix?.length === 0 ? (
          <EmptyState title="No employee records found" />
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[10px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3 sticky left-0 z-20 bg-slate-50 min-w-[160px] border-r border-slate-200 shadow-xs">
                    Employee
                  </th>
                  {daysArray.map((day) => (
                    <th key={day} className="px-1.5 py-3 text-center min-w-[32px] border-r border-slate-100">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {data.matrix.map((row) => (
                  <tr key={row.employee._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-left font-medium text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-200 whitespace-nowrap shadow-xs">
                      <div>
                        <span>{row.employee.firstName} {row.employee.lastName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{row.employee.employeeCode}</span>
                      </div>
                    </td>
                    {daysArray.map((day) => (
                      <td key={day} className="px-1 py-2 border-r border-slate-50">
                        {getStatusBadge(row.days[day])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MonthlyMatrixPage;
