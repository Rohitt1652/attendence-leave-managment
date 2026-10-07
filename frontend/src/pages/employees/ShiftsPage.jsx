import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Clock, Plus, Edit2, Trash2, Search, Sun, Moon, Sunset } from 'lucide-react';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:30',
    endTime: '18:30',
    graceMinutes: 15,
    breakMinutes: 60,
    fullDayHours: 8,
    halfDayHours: 4,
    status: 'Active',
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/shifts');
      if (res.data.success) {
        setShifts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load shifts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingShift(null);
    setFormData({
      name: '',
      startTime: '09:30',
      endTime: '18:30',
      graceMinutes: 15,
      breakMinutes: 60,
      fullDayHours: 8,
      halfDayHours: 4,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceMinutes: shift.graceMinutes ?? 15,
      breakMinutes: shift.breakMinutes ?? 60,
      fullDayHours: shift.fullDayMinutes ? shift.fullDayMinutes / 60 : 8,
      halfDayHours: shift.halfDayMinutes ? shift.halfDayMinutes / 60 : 4,
      status: shift.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
      return alert('Shift name, start time, and end time are required.');
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        graceMinutes: Number(formData.graceMinutes),
        breakMinutes: Number(formData.breakMinutes),
        fullDayMinutes: Number(formData.fullDayHours) * 60,
        halfDayMinutes: Number(formData.halfDayHours) * 60,
        status: formData.status,
      };

      if (editingShift) {
        await apiClient.put(`/shifts/${editingShift._id}`, payload);
      } else {
        await apiClient.post('/shifts', payload);
      }
      setIsModalOpen(false);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save shift.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shiftToDelete) return;
    try {
      await apiClient.delete(`/shifts/${shiftToDelete._id}`);
      setIsConfirmOpen(false);
      setShiftToDelete(null);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete shift.');
    }
  };

  const filteredShifts = shifts.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" />
            Work Shifts & Rosters
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure working hours, grace periods, lunch breaks, and thresholds for automated attendance tracking.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create Shift
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shifts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : filteredShifts.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Shifts Found"
          description="Create your company shifts to schedule employees."
          actionText="+ Create Shift"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShifts.map((shift) => (
            <Card
              key={shift._id}
              className="p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">
                      {shift.name}
                    </h3>
                  </div>
                  <Badge variant={shift.status === 'Active' ? 'success' : 'default'}>
                    {shift.status || 'Active'}
                  </Badge>
                </div>

                {/* Timing Badge */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 mb-4 text-center">
                  <span className="text-xs text-indigo-600 font-semibold block uppercase tracking-wider">
                    Working Hours
                  </span>
                  <div className="text-lg font-mono font-bold text-indigo-950 mt-0.5">
                    {shift.startTime} – {shift.endTime}
                  </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Grace Period</span>
                    <span className="font-semibold text-slate-800">{shift.graceMinutes || 15} mins</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Break Deduct</span>
                    <span className="font-semibold text-slate-800">{shift.breakMinutes || 60} mins</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Full Day Min.</span>
                    <span className="font-semibold text-slate-800">
                      {shift.fullDayMinutes ? shift.fullDayMinutes / 60 : 8} hrs
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Half Day Min.</span>
                    <span className="font-semibold text-slate-800">
                      {shift.halfDayMinutes ? shift.halfDayMinutes / 60 : 4} hrs
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(shift)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setShiftToDelete(shift);
                    setIsConfirmOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShift ? `Edit Shift: ${editingShift.name}` : 'Create Work Shift'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Shift Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. General Day Shift"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Grace Minutes
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={formData.graceMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, graceMinutes: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Break Duration (mins)
              </label>
              <input
                type="number"
                min={0}
                value={formData.breakMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, breakMinutes: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Day Threshold (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min={1}
                value={formData.fullDayHours}
                onChange={(e) =>
                  setFormData({ ...formData, fullDayHours: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Half Day Threshold (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min={1}
                value={formData.halfDayHours}
                onChange={(e) =>
                  setFormData({ ...formData, halfDayHours: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingShift ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Shift"
        message={`Are you sure you want to delete shift "${shiftToDelete?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
