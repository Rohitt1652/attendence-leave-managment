import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  FileSpreadsheet,
  Download,
  Filter,
  DollarSign,
  Clock,
  UserCheck,
  AlertOctagon,
  Calendar,
  Building,
  RefreshCw,
} from 'lucide-react';

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [month, year, departmentId]);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/payroll-summary', {
        params: { month, year, departmentId: departmentId || undefined },
      });
      if (res.data.success) {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payroll report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/reports/export-excel', {
        params: { month, year, departmentId: departmentId || undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payroll_Attendance_Report_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export Excel report.');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const filteredEmployees = (summaryData?.summary || []).filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employee.name.toLowerCase().includes(term) ||
      item.employee.employeeCode.toLowerCase().includes(term) ||
      item.employee.department.toLowerCase().includes(term)
    );
  });

  const totals = (summaryData?.summary || []).reduce(
    (acc, cur) => {
      acc.payableDays += cur.payableDays || 0;
      acc.lossOfPayDays += cur.lossOfPayDays || 0;
      acc.overtimeHours += parseFloat(cur.overtimeHours) || 0;
      acc.workingHours += parseFloat(cur.workingHours) || 0;
      return acc;
    },
    { payableDays: 0, lossOfPayDays: 0, overtimeHours: 0, workingHours: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            Payroll & Attendance Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete month-wise attendance aggregation with payable days and Loss of Pay (LOP) calculations for salary processing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchReport}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportExcel}
            loading={exporting}
          >
            Export to Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Select Month
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Select Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Department
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name or Emp Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Total Staff
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {summaryData?.summary?.length || 0}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Active employees in {months.find((m) => m.value === month)?.label}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Total Payable Days
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totals.payableDays.toFixed(1)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Work + Holidays + Week Offs + Paid Leaves
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-50 to-white border-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Loss of Pay (LOP) Days
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totals.lossOfPayDays.toFixed(1)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Absences + Unpaid Leaves
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Total Overtime
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totals.overtimeHours.toFixed(1)} hrs
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Total OT accumulated this month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Attendance Ledger ({months.find((m) => m.value === month)?.label} {year})
            </h2>
            <p className="text-xs text-slate-500">
              Month Days: {summaryData?.daysInMonth || 30} days
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Payroll Compatible Schema
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileSpreadsheet}
              title="No records found"
              description="No active employees or attendance data found for this period."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold tracking-wide uppercase">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-2 text-center">Month Days</th>
                  <th className="py-3 px-2 text-center">Present</th>
                  <th className="py-3 px-2 text-center">Late</th>
                  <th className="py-3 px-2 text-center">Half Day</th>
                  <th className="py-3 px-2 text-center">Paid L.</th>
                  <th className="py-3 px-2 text-center">Unpaid L.</th>
                  <th className="py-3 px-2 text-center">Absent</th>
                  <th className="py-3 px-2 text-center">W-Off</th>
                  <th className="py-3 px-2 text-center">Holiday</th>
                  <th className="py-3 px-2 text-center">OT (h)</th>
                  <th className="py-3 px-2 text-center">Work (h)</th>
                  <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-800 font-bold">
                    Payable Days
                  </th>
                  <th className="py-3 px-3 text-center bg-rose-50 text-rose-800 font-bold">
                    LOP Days
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((row) => (
                  <tr key={row.employee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {row.employee.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {row.employee.employeeCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-700 block font-medium">
                        {row.employee.department}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {row.employee.designation}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-slate-600">
                      {row.daysInMonth}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-emerald-600">
                      {row.presentDays}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-600">
                      {row.lateDays}
                    </td>
                    <td className="py-3 px-2 text-center text-blue-600">
                      {row.halfDays}
                    </td>
                    <td className="py-3 px-2 text-center text-indigo-600">
                      {row.paidLeaves}
                    </td>
                    <td className="py-3 px-2 text-center text-rose-600">
                      {row.unpaidLeaves}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-red-700">
                      {row.absentDays}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">
                      {row.weekOffDays}
                    </td>
                    <td className="py-3 px-2 text-center text-purple-600">
                      {row.holidayDays}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-700">
                      {row.overtimeHours}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-700">
                      {row.workingHours}
                    </td>
                    <td className="py-3 px-3 text-center bg-emerald-50/70">
                      <span className="font-bold text-emerald-800 text-sm px-2 py-0.5 rounded bg-emerald-100">
                        {row.payableDays}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center bg-rose-50/70">
                      <span
                        className={`font-bold text-sm px-2 py-0.5 rounded ${
                          row.lossOfPayDays > 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.lossOfPayDays}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
