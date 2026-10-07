import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

const LeaveTypesPage = () => {
  const [types, setTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    paid: true,
    annualLimit: 12,
    carryForwardAllowed: false,
    maxCarryForward: 0,
    halfDayAllowed: true,
    status: 'Active',
  });

  const fetchTypes = async () => {
    try {
      const res = await apiClient.get('/leaves/types');
      setTypes(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      paid: true,
      annualLimit: 12,
      carryForwardAllowed: false,
      maxCarryForward: 0,
      halfDayAllowed: true,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingType(t);
    setFormData({
      name: t.name,
      code: t.code,
      paid: t.paid,
      annualLimit: t.annualLimit,
      carryForwardAllowed: t.carryForwardAllowed,
      maxCarryForward: t.maxCarryForward,
      halfDayAllowed: t.halfDayAllowed,
      status: t.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await apiClient.put(`/leaves/types/${editingType._id}`, formData);
      } else {
        await apiClient.post('/leaves/types', formData);
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save leave type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) return;
    try {
      await apiClient.delete(`/leaves/types/${id}`);
      fetchTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Types Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure annual caps, rollover thresholds, and payability rules for time off.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Leave Type
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((t) => (
          <div key={t._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                <Badge variant={t.paid ? 'primary' : 'neutral'}>
                  {t.paid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>

              <span className="text-[11px] font-mono font-bold text-indigo-600 block mb-3">
                CODE: {t.code}
              </span>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual Quota:</span>
                  <span className="font-semibold text-slate-800">{t.annualLimit} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Carry Forward:</span>
                  <span className="font-medium text-slate-800">
                    {t.carryForwardAllowed ? `Yes (Max ${t.maxCarryForward})` : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Half Day Allowed:</span>
                  <span className="font-medium text-slate-800">{t.halfDayAllowed ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <Button size="xs" variant="ghost" icon={Edit} onClick={() => handleOpenEdit(t)}>
                Edit
              </Button>
              <Button size="xs" variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" icon={Trash2} onClick={() => handleDelete(t._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? 'Edit Leave Type' : 'Create Leave Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Annual Limit (Days) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.annualLimit}
                onChange={(e) => setFormData({ ...formData, annualLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Compensation Type</label>
              <select
                value={formData.paid ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, paid: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="true">Paid Leave</option>
                <option value="false">Unpaid Leave</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.carryForwardAllowed}
                onChange={(e) => setFormData({ ...formData, carryForwardAllowed: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Allow Carry Forward</span>
            </label>

            {formData.carryForwardAllowed && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Max Days:</span>
                <input
                  type="number"
                  min={0}
                  value={formData.maxCarryForward}
                  onChange={(e) => setFormData({ ...formData, maxCarryForward: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Leave Type
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveTypesPage;
