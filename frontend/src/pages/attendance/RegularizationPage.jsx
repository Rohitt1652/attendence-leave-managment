import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { Clock, CheckCircle, XCircle, Filter, Plus } from 'lucide-react';

const RegularizationPage = () => {
  const { hasPermission } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Request Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    attendanceDate: new Date().toISOString().split('T')[0],
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: 'Missed Check-in',
    employeeComment: '',
  });

  const fetchRegularizations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/regularizations', {
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
    fetchRegularizations();
  }, [statusFilter]);

  const handleOpenReview = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.put(`/attendance/regularizations/${selectedRequest._id}/action`, {
        status: reviewAction,
        approverComment: reviewComment,
      });
      setIsReviewModalOpen(false);
      fetchRegularizations();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.post('/attendance/regularizations', createForm);
      setIsCreateModalOpen(false);
      fetchRegularizations();
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance Regularization & Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit punch correction requests and review team reconciliation submissions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Correction Request
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
            title="No regularization requests"
            description="There are no punch correction requests matching the selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-4 py-3">Attendance Date</th>
                  <th className="px-4 py-3">Requested In/Out</th>
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
                    <td className="px-4 py-3.5 font-mono text-slate-800 font-medium">
                      {r.attendanceDate}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <span className="text-emerald-700 font-medium">
                        {new Date(r.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>{' '}
                      &rarr;{' '}
                      <span className="text-indigo-700 font-medium">
                        {new Date(r.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800 block">{r.reason}</span>
                      {r.employeeComment && (
                        <span className="text-[11px] text-slate-400 italic block mt-0.5 max-w-xs truncate">
                          "{r.employeeComment}"
                        </span>
                      )}
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
                      {r.status === 'Pending' && hasPermission('attendance.approve') ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="xs"
                            variant="success"
                            icon={CheckCircle}
                            onClick={() => handleOpenReview(r, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => handleOpenReview(r, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">{r.approverComment || '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`${reviewAction === 'Approved' ? 'Approve' : 'Reject'} Regularization Request`}
        subtitle={`Request for ${selectedRequest?.employeeId?.firstName} on ${selectedRequest?.attendanceDate}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Approver Remarks / Comment
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide confirmation notes or reason for rejection"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'Approved' ? 'success' : 'danger'}
              size="sm"
              type="submit"
              loading={actionLoading}
            >
              Confirm {reviewAction === 'Approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Correction Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Submit Punch Regularization"
        subtitle="Request approval for missing or adjusted check-in and check-out punches"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Attendance Date *</label>
            <input
              type="date"
              required
              value={createForm.attendanceDate}
              onChange={(e) => setCreateForm({ ...createForm, attendanceDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Requested Check In *</label>
              <input
                type="datetime-local"
                required
                value={createForm.requestedCheckIn}
                onChange={(e) => setCreateForm({ ...createForm, requestedCheckIn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Requested Check Out *</label>
              <input
                type="datetime-local"
                required
                value={createForm.requestedCheckOut}
                onChange={(e) => setCreateForm({ ...createForm, requestedCheckOut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason *</label>
            <select
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
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
            <label className="block font-medium text-slate-700 mb-1">Details & Context</label>
            <textarea
              rows={2}
              placeholder="Add explanation for manager approval"
              value={createForm.employeeComment}
              onChange={(e) => setCreateForm({ ...createForm, employeeComment: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RegularizationPage;
