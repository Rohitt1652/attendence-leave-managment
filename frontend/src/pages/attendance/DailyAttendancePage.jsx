import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  Calendar,
  Lock,
  Unlock,
  Edit,
  Clock,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const DailyAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Manual Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    attendanceStatus: 'Present',
    remarks: '',
  });

  // Lock Modal
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockYear, setLockYear] = useState(new Date().getFullYear());
  const [lockMonth, setLockMonth] = useState(new Date().getMonth() + 1);
  const [lockReason, setLockReason] = useState('Monthly Payroll Processing');
  const [isLocked, setIsLocked] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/departments');
      setDepartments(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/daily', {
        params: { date, departmentId, status, search },
      });
      setRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkLocks = async () => {
    try {
      const res = await apiClient.get('/attendance/locks');
      const curLock = res.data.data.find(
        (l) => l.year === lockYear && l.month === lockMonth && l.isLocked
      );
      setIsLocked(!!curLock);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDailyAttendance();
    checkLocks();
  }, [date, departmentId, status, search]);

  const handleOpenEdit = (item) => {
    setSelectedRecord(item);
    setEditForm({
      checkIn: item.attendance.checkIn
        ? new Date(item.attendance.checkIn).toISOString().slice(0, 16)
        : '',
      checkOut: item.attendance.checkOut
        ? new Date(item.attendance.checkOut).toISOString().slice(0, 16)
        : '',
      attendanceStatus: item.attendance.attendanceStatus || 'Present',
      remarks: item.attendance.remarks || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/attendance/manual', {
        employeeId: selectedRecord.employee._id,
        date,
        checkIn: editForm.checkIn ? new Date(editForm.checkIn) : null,
        checkOut: editForm.checkOut ? new Date(editForm.checkOut) : null,
        attendanceStatus: editForm.attendanceStatus,
        remarks: editForm.remarks,
      });
      setIsEditModalOpen(false);
      fetchDailyAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const handleToggleLock = async () => {
    try {
      if (isLocked) {
        await apiClient.post('/attendance/unlock', {
          month: lockMonth,
          year: lockYear,
          reason: 'Manual unlock by HR Admin',
        });
        setIsLocked(false);
      } else {
        await apiClient.post('/attendance/lock', {
          month: lockMonth,
          year: lockYear,
          reason: lockReason,
        });
        setIsLocked(true);
      }
      setIsLockModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Lock operation failed');
    }
  };

  const getStatusBadgeVariant = (st) => {
    switch (st) {
      case 'Present': return 'success';
      case 'Late': return 'warning';
      case 'Half Day': return 'purple';
      case 'Work From Home': return 'brand';
      case 'Paid Leave': return 'primary';
      case 'Week Off': return 'neutral';
      case 'Holiday': return 'brand';
      case 'Absent':
      default: return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Attendance Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time employee check-ins, calculate working duration, and reconcile entries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isLocked ? 'danger' : 'outline'}
            size="sm"
            icon={isLocked ? Lock : Unlock}
            onClick={() => setIsLockModalOpen(true)}
          >
            {isLocked ? 'Month Locked (Payroll)' : 'Lock Month for Payroll'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4!">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Target Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Week Off">Week Off</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Staff</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="p-0! overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={7} cols={6} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="No records found"
            description="No active employees or attendance punches found for this filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Punch In</th>
                  <th className="px-4 py-3.5">Punch Out</th>
                  <th className="px-4 py-3.5">Working Duration</th>
                  <th className="px-4 py-3.5">Late Mins</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((item) => (
                  <tr key={item.employee._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.employee.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">
                            {item.employee.firstName} {item.employee.lastName}
                          </p>
                          <span className="text-[11px] font-mono text-slate-400">
                            {item.employee.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {item.employee.departmentId?.name || '-'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {item.attendance.checkIn
                        ? new Date(item.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {item.attendance.checkOut
                        ? new Date(item.attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {item.attendance.totalWorkingMinutes
                        ? `${(item.attendance.totalWorkingMinutes / 60).toFixed(1)} hrs`
                        : '0 hrs'}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.attendance.lateMinutes > 0 ? (
                        <span className="text-amber-600 font-bold">{item.attendance.lateMinutes} min</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={getStatusBadgeVariant(item.attendance.attendanceStatus)}>
                        {item.attendance.attendanceStatus}
                      </Badge>
                      {item.attendance.isRegularized && (
                        <span className="ml-1.5 text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1 py-0.5 rounded">
                          REG
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Edit}
                        onClick={() => handleOpenEdit(item)}
                      >
                        Manual Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manual Attendance Entry Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Manual Attendance Override"
        subtitle={`Editing for ${selectedRecord?.employee?.firstName} ${selectedRecord?.employee?.lastName} on ${date}`}
      >
        <form onSubmit={handleSaveManual} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Check In Time</label>
              <input
                type="datetime-local"
                value={editForm.checkIn}
                onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Check Out Time</label>
              <input
                type="datetime-local"
                value={editForm.checkOut}
                onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Status Override</label>
            <select
              value={editForm.attendanceStatus}
              onChange={(e) => setEditForm({ ...editForm, attendanceStatus: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Week Off">Week Off</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Audit Reason / Remarks *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Approved biometric reader glitch adjustment"
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lock Month Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        title={isLocked ? 'Unlock Attendance Month' : 'Lock Attendance for Payroll'}
        subtitle="Locked months prevent any modifications by employees and standard managers."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p>
              Locking finalizes all punch times, overtime calculations, and loss-of-pay metrics for payroll processing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Month</label>
              <select
                value={lockMonth}
                onChange={(e) => setLockMonth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Year</label>
              <input
                type="number"
                value={lockYear}
                onChange={(e) => setLockYear(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason</label>
            <input
              type="text"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsLockModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isLocked ? 'primary' : 'danger'}
              size="sm"
              onClick={handleToggleLock}
            >
              {isLocked ? 'Confirm Unlock Month' : 'Confirm Lock Month'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DailyAttendancePage;
