import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { FileText, CheckCircle2, ShieldCheck, Plus, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const PoliciesPage = () => {
  const { hasPermission } = useAuthStore();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Policy for reading and acknowledgement
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  // Create Policy Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Attendance Policy',
    description: '',
    version: '1.0',
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/policies');
      setPolicies(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleOpenPolicy = (p) => {
    setSelectedPolicy(p);
    setIsReadModalOpen(true);
  };

  const handleAcknowledge = async () => {
    if (!selectedPolicy) return;
    setAckLoading(true);
    try {
      await apiClient.post(`/policies/${selectedPolicy._id}/acknowledge`);
      setSelectedPolicy((prev) => ({ ...prev, isAcknowledged: true }));
      fetchPolicies();
    } catch (err) {
      alert('Failed to acknowledge policy');
    } finally {
      setAckLoading(false);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/policies', createForm);
      setIsCreateModalOpen(false);
      fetchPolicies();
    } catch (err) {
      alert('Failed to create policy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">HR Policies & Compliance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official workplace handbooks, attendance protocols, security regulations, and employee acknowledgements.
          </p>
        </div>

        {hasPermission('policy.manage') && (
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            Publish Policy
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((p) => (
          <div
            key={p._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="primary">{p.category}</Badge>
                {p.isAcknowledged ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Acknowledged
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="h-3 w-3" /> Pending Sign
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-2">{p.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">v{p.version} &bull; Effective</span>
              <Button size="xs" variant="outline" onClick={() => handleOpenPolicy(p)}>
                Read & Acknowledge
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Read & Acknowledge Modal */}
      <Modal
        isOpen={isReadModalOpen}
        onClose={() => setIsReadModalOpen(false)}
        title={selectedPolicy?.title}
        subtitle={`${selectedPolicy?.category} (Version ${selectedPolicy?.version})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {selectedPolicy?.description}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {selectedPolicy?.isAcknowledged ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="h-4 w-4" /> You have acknowledged this policy document.
              </span>
            ) : (
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                loading={ackLoading}
                onClick={handleAcknowledge}
              >
                I Have Read & Acknowledge This Policy
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setIsReadModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Policy Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Publish HR Policy">
        <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Attendance Policy">Attendance Policy</option>
                <option value="Leave Policy">Leave Policy</option>
                <option value="WFH Policy">WFH Policy</option>
                <option value="IT Policy">IT Policy</option>
                <option value="Code of Conduct">Code of Conduct</option>
                <option value="Holiday Policy">Holiday Policy</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Version</label>
              <input
                type="text"
                value={createForm.version}
                onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Policy Content / Description *</label>
            <textarea
              required
              rows={4}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PoliciesPage;
