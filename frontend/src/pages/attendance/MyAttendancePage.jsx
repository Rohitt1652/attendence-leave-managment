import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PunchWidget from '../../components/attendance/PunchWidget';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Clock, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  // Regularize modal shortcut
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [regForm, setRegForm] = useState({
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: 'Missed Check-in',
    employeeComment: '',
  });

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/my', {
        params: { month, year },
      });
      setRecords(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [month, year]);

  const handleOpenRegularize = (r) => {
    setSelectedRecord(r);
    setRegForm({
      requestedCheckIn: r.checkIn ? new Date(r.checkIn).toISOString().slice(0, 16) : `${r.date}T09:30`,
      requestedCheckOut: r.checkOut ? new Date(r.checkOut).toISOString().slice(0, 16) : `${r.date}T18:30`,
      reason: 'Biometric Problem',
      employeeComment: '',
    });
    setIsRegModalOpen(true);
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/attendance/regularizations', {
        attendanceDate: selectedRecord.date,
        requestedCheckIn: regForm.requestedCheckIn,
        requestedCheckOut: regForm.requestedCheckOut,
        reason: regForm.reason,
        employeeComment: regForm.employeeComment,
      });
      setIsRegModalOpen(false);
      navigate('/attendance/regularizations');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit regularization request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Attendance Log</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your daily clock-ins, duration logs, and submit regularization requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Punch Widget */}
        <div className="space-y-6">
          <PunchWidget onPunchSuccess={fetchMyAttendance} />

          {/* Month selector */}
          <Card title="Filter Period">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: History Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0! overflow-hidden" title="Attendance History Records">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={6} cols={5} />
              </div>
            ) : records.length === 0 ? (
              <EmptyState title="No attendance records found for this period" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-4 py-3">In</th>
                      <th className="px-4 py-3">Out</th>
                      <th className="px-4 py-3">Work Duration</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-medium text-slate-900 font-mono">
                          {r.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {r.totalWorkingMinutes ? `${(r.totalWorkingMinutes / 60).toFixed(1)} hrs` : '0 hrs'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.attendanceStatus === 'Present' ? 'success' : r.attendanceStatus === 'Late' ? 'warning' : 'neutral'}>
                            {r.attendanceStatus}
                          </Badge>
                          {r.isRegularized && (
                            <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded">
                              REG
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenRegularize(r)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-end ml-auto"
                          >
                            Regularize <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Regularize Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Attendance Regularization Request"
        subtitle={`Request punch time adjustment for ${selectedRecord?.date}`}
      >
        <form onSubmit={handleRegSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Requested Check In *</label>
              <input
                type="datetime-local"
                required
                value={regForm.requestedCheckIn}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Requested Check Out *</label>
              <input
                type="datetime-local"
                required
                value={regForm.requestedCheckOut}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Adjustment *</label>
            <select
              value={regForm.reason}
              onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="Missed Check-in">Missed Check-in</option>
              <option value="Missed Check-out">Missed Check-out</option>
              <option value="Wrong Punch">Wrong Punch</option>
              <option value="Biometric Problem">Biometric Problem</option>
              <option value="System Error">System Error</option>
              <option value="Client Visit">Client Visit</option>
              <option value="Field Work">Field Work</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Explanation / Comment</label>
            <textarea
              rows={2}
              placeholder="Explain circumstances for manager review"
              value={regForm.employeeComment}
              onChange={(e) => setRegForm({ ...regForm, employeeComment: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsRegModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyAttendancePage;
