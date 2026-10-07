import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useAuthStore } from '../../store/authStore';
import {
  CalendarPlus,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const LeaveRequestsPage = () => {
  const { hasPermission } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDaySession: 'First Half',
    reason: '',
    emergencyContact: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Action Modal
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('Approved');
  const [actionComment, setActionComment] = useState('');

  const fetchLeaveTypes = async () => {
    try {
      const res = await apiClient.get('/leaves/types');
      setLeaveTypes(res.data.data);
      if (res.data.data.length > 0) {
        setApplyForm((prev) => ({ ...prev, leaveTypeId: res.data.data[0]._id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leaves/requests', {
        params: { status: statusFilter },
      });
      setRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError('');
    try {
      await apiClient.post('/leaves/requests', applyForm);
      setIsApplyModalOpen(false);
      fetchLeaveRequests();
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      await apiClient.put(`/leaves/requests/${selectedRequest._id}/action`, {
        status: actionType,
        comment: actionComment,
        rejectionReason: actionType === 'Rejected' ? actionComment : '',
      });
      setIsActionModalOpen(false);
      fetchLeaveRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave applications, track status, and review team approval requests.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={CalendarPlus}
          onClick={() => {
            setApplyError('');
            setIsApplyModalOpen(true);
          }}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card className="p-3!">
        <div className="flex items-center gap-2">
          {['', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st || 'All Requests'}
            </button>
          ))}
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="p-0! overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No leave requests found"
            description="Apply for time off or switch your status filter."
            actionLabel="Apply Leave"
            onAction={() => setIsApplyModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Date Range</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 text-xs">
                        {r.employeeId?.firstName} {r.employeeId?.lastName}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {r.employeeId?.employeeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {r.leaveTypeId?.name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {new Date(r.startDate).toLocaleDateString()} &rarr; {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {r.numberOfDays} Day{r.numberOfDays > 1 ? 's' : ''}
                      {r.isHalfDay && (
                        <span className="text-[10px] text-indigo-600 block font-normal">
                          Half Day ({r.halfDaySession})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-600">
                      {r.reason}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          r.status === 'Approved'
                            ? 'success'
                            : r.status === 'Rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === 'Pending' && hasPermission('leave.approve') ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="xs"
                            variant="success"
                            icon={CheckCircle}
                            onClick={() => {
                              setSelectedRequest(r);
                              setActionType('Approved');
                              setActionComment('');
                              setIsActionModalOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => {
                              setSelectedRequest(r);
                              setActionType('Rejected');
                              setActionComment('');
                              setIsActionModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {r.rejectionReason || 'Reviewed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        subtitle="Automatic calculation excluding weekends and official company holidays."
      >
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Leave Type *</label>
            <select
              required
              value={applyForm.leaveTypeId}
              onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              {leaveTypes.map((lt) => (
                <option key={lt._id} value={lt._id}>
                  {lt.name} ({lt.paid ? 'Paid' : 'Unpaid'} - Annual Limit: {lt.annualLimit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={applyForm.isHalfDay}
                onChange={(e) => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Half Day Request</span>
            </label>

            {applyForm.isHalfDay && (
              <select
                value={applyForm.halfDaySession}
                onChange={(e) => setApplyForm({ ...applyForm, halfDaySession: e.target.value })}
                className="px-2 py-1 border border-slate-200 rounded text-xs"
              >
                <option value="First Half">First Half</option>
                <option value="Second Half">Second Half</option>
              </select>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              required
              rows={2}
              placeholder="State reason for absence"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              placeholder="Emergency phone or contact person"
              value={applyForm.emergencyContact}
              onChange={(e) => setApplyForm({ ...applyForm, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={applyLoading}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Action (Approve / Reject) Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`${actionType === 'Approved' ? 'Approve' : 'Reject'} Leave Application`}
        subtitle={`Application by ${selectedRequest?.employeeId?.firstName} for ${selectedRequest?.numberOfDays} ${selectedRequest?.numberOfDays === 1 ? 'day' : 'days'}`}
      >
        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              {actionType === 'Rejected' ? 'Rejection Reason *' : 'Approval Comments'}
            </label>
            <textarea
              required={actionType === 'Rejected'}
              rows={3}
              placeholder={actionType === 'Rejected' ? 'Provide constructive reason for rejection' : 'Optional notes'}
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'Approved' ? 'success' : 'danger'}
              size="sm"
              type="submit"
              loading={applyLoading}
            >
              Confirm {actionType === 'Approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveRequestsPage;
