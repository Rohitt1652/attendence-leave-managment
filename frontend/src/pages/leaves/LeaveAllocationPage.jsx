import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Layers, Users, CheckCircle2 } from 'lucide-react';

const LeaveAllocationPage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Bulk Form state
  const [bulkForm, setBulkForm] = useState({
    leaveTypeId: '',
    allocatedDays: 12,
    year: new Date().getFullYear(),
    departmentId: '',
    employmentType: 'Permanent',
  });

  const fetchData = async () => {
    try {
      const [resLT, resDept, resAlloc] = await Promise.all([
        apiClient.get('/leaves/types'),
        apiClient.get('/departments'),
        apiClient.get('/leaves/allocations'),
      ]);
      setLeaveTypes(resLT.data.data);
      setDepartments(resDept.data.data);
      setAllocations(resAlloc.data.data);
      if (resLT.data.data.length > 0) {
        setBulkForm((prev) => ({ ...prev, leaveTypeId: resLT.data.data[0]._id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/leaves/allocations/bulk', bulkForm);
      setSuccessMsg(res.data.message);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk allocation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Allocation Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Bulk or individual assignment of annual time-off quotas to departments and workforce segments.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Bulk Allocation Card */}
      <Card
        title="Execute Bulk Leave Allocation"
        subtitle="Quickly assign leave balances across entire departments or specific employment types."
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Leave Type *</label>
              <select
                required
                value={bulkForm.leaveTypeId}
                onChange={(e) => setBulkForm({ ...bulkForm, leaveTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {leaveTypes.map((lt) => (
                  <option key={lt._id} value={lt._id}>{lt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Days to Allocate *</label>
              <input
                type="number"
                required
                min={1}
                value={bulkForm.allocatedDays}
                onChange={(e) => setBulkForm({ ...bulkForm, allocatedDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Year *</label>
              <input
                type="number"
                required
                value={bulkForm.year}
                onChange={(e) => setBulkForm({ ...bulkForm, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Department</label>
              <select
                value={bulkForm.departmentId}
                onChange={(e) => setBulkForm({ ...bulkForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Employment Type</label>
              <select
                value={bulkForm.employmentType}
                onChange={(e) => setBulkForm({ ...bulkForm, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">All Employment Types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" type="submit" loading={loading} icon={Layers}>
              Execute Bulk Allocation
            </Button>
          </div>
        </form>
      </Card>

      {/* Allocation List Table */}
      <Card title="Current Year Allocations" className="p-0! overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase sticky top-0">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Allocated</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-2.5 font-medium text-slate-900">
                    {a.employeeId?.firstName} {a.employeeId?.lastName}
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {a.employeeId?.employeeCode}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {a.leaveTypeId?.name}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{a.allocatedDays}</td>
                  <td className="px-4 py-2.5 text-emerald-600 font-semibold">{a.usedDays}</td>
                  <td className="px-4 py-2.5 text-amber-600 font-semibold">{a.pendingDays}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{a.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaveAllocationPage;
