import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Award, Plus, Star, Target, CheckCircle2 } from 'lucide-react';

const PerformancePage = () => {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review creation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    reviewPeriod: 'Q3 2026',
    reviewCycle: 'Quarterly',
    rating: 4,
    finalScore: 85,
    managerFeedback: '',
    achievements: '',
    areasOfImprovement: '',
    status: 'Reviewed',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRev, resEmp] = await Promise.all([
        apiClient.get('/performance'),
        apiClient.get('/employees', { params: { limit: 100 } }),
      ]);
      setReviews(resRev.data.data);
      setEmployees(resEmp.data.data);
      if (resEmp.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, employeeId: resEmp.data.data[0]._id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/performance', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance Appraisals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarterly and monthly reviews, goals evaluation, manager feedback, and scorecards.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Performance Review
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : reviews.length === 0 ? (
        <EmptyState title="No performance reviews recorded" actionLabel="Create Review" onAction={() => setIsModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {r.employeeId?.firstName} {r.employeeId?.lastName}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {r.employeeId?.employeeCode} &bull; {r.reviewPeriod} ({r.reviewCycle})
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>{r.rating} / 5</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">Key Achievements:</span>
                  <p className="text-slate-600 mt-0.5">{r.achievements || 'Exceeded technical milestones and deliverables.'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">Manager Feedback:</span>
                  <p className="text-slate-600 mt-0.5">{r.managerFeedback || 'Solid performance and reliable execution.'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Evaluator: {r.reviewerId ? `${r.reviewerId.firstName} ${r.reviewerId.lastName}` : 'Lead'}
                </span>
                <span className="font-bold text-indigo-600">
                  Overall Score: {r.finalScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Conduct Performance Review">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Employee *</label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Review Period *</label>
              <input
                type="text"
                required
                value={formData.reviewPeriod}
                onChange={(e) => setFormData({ ...formData, reviewPeriod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Star Rating (1 - 5) *</label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Final Score Percentage (%) *</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={formData.finalScore}
                onChange={(e) => setFormData({ ...formData, finalScore: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Key Achievements</label>
            <textarea
              rows={2}
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Manager Feedback</label>
            <textarea
              rows={2}
              value={formData.managerFeedback}
              onChange={(e) => setFormData({ ...formData, managerFeedback: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PerformancePage;
