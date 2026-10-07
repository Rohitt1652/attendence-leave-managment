import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building,
  UserCheck,
  Users,
  Briefcase,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    teamLeadId: '',
    memberIds: [],
    description: '',
    status: 'Active',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, deptRes, empRes] = await Promise.all([
        apiClient.get('/teams'),
        apiClient.get('/departments'),
        apiClient.get('/employees?limit=300'),
      ]);
      if (teamsRes.data.success) setTeams(teamsRes.data.data || []);
      if (deptRes.data.success) setDepartments(deptRes.data.data || []);
      if (empRes.data.success) setEmployees(empRes.data.data || []);
    } catch (err) {
      console.error('Failed to load teams', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setMemberSearchTerm('');
    setFormData({
      name: '',
      departmentId: '',
      teamLeadId: '',
      memberIds: [],
      description: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setMemberSearchTerm('');
    // Extract member IDs as strings
    const existingMemberIds = (team.members || team.memberIds || []).map((m) =>
      String(typeof m === 'object' && m?._id ? m._id : m)
    );

    setFormData({
      name: team.name,
      departmentId: String(team.departmentId?._id || team.departmentId || ''),
      teamLeadId: String(team.teamLeadId?._id || team.teamLeadId || ''),
      memberIds: existingMemberIds,
      description: team.description || '',
      status: team.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleToggleMember = (empId) => {
    const idStr = String(empId);
    setFormData((prev) => {
      const exists = prev.memberIds.map(String).includes(idStr);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => String(id) !== idStr)
          : [...prev.memberIds, idStr],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId) {
      return alert('Team name and department are required.');
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.teamLeadId) delete payload.teamLeadId;

      if (editingTeam) {
        await apiClient.put(`/teams/${editingTeam._id}`, payload);
      } else {
        await apiClient.post('/teams', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save team.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    try {
      await apiClient.delete(`/teams/${teamToDelete._id}`);
      setIsConfirmOpen(false);
      setTeamToDelete(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete team.');
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter available employees for modal selection
  const selectableEmployees = employees.filter((emp) => {
    if (!memberSearchTerm) return true;
    const term = memberSearchTerm.toLowerCase();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const desigName = emp.designationId?.name?.toLowerCase() || '';
    const code = emp.employeeCode?.toLowerCase() || '';
    return fullName.includes(term) || desigName.includes(term) || code.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" />
            Operational Teams
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Group employees into project squads, assign Team Leads, and view all team members with their designations.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Team
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Teams Found"
          description="Create your first team to assign team leads and team members."
          actionText="+ Add Team"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const rawMembers = team.members || team.memberIds || [];
            const lead = team.teamLeadId;
            const teamMembers = rawMembers.filter(
              (m) => !lead || String(m._id) !== String(lead._id)
            );

            return (
              <Card
                key={team._id}
                className="p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow rounded-2xl bg-white"
              >
                <div className="space-y-4">
                  {/* Top Bar: Dept Badge & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      {team.departmentId?.name || 'Cross-Functional'}
                    </span>
                    <Badge variant={team.status === 'Active' ? 'success' : 'default'}>
                      {team.status || 'Active'}
                    </Badge>
                  </div>

                  {/* Team Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {team.description || 'No description provided for this team.'}
                    </p>
                  </div>

                  {/* Team Lead Card */}
                  <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Team Lead
                      </span>
                    </div>

                    {lead ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs border border-indigo-400">
                            {lead.profileImage ? (
                              <img
                                src={lead.profileImage}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <span className="text-xs font-medium text-slate-500 block truncate">
                              {lead.email}
                            </span>
                          </div>
                        </div>

                        {/* Designation Badge */}
                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Briefcase className="w-3 h-3 text-indigo-600" />
                            {lead.designationId?.name || 'Lead Officer'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {lead.employeeCode}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-1">
                        No Team Lead assigned
                      </div>
                    )}
                  </div>

                  {/* Team Members Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Team Members
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>

                    {teamMembers.length === 0 ? (
                      <div className="p-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center">
                        <Users className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">
                          No team members assigned yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(team)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1 inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Assign Members
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {teamMembers.map((member) => {
                          const desig = member.designationId?.name || 'Staff Member';
                          return (
                            <div
                              key={member._id}
                              className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-150 transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300">
                                  {member.profileImage ? (
                                    <img
                                      src={member.profileImage}
                                      alt=""
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 block truncate">
                                    {member.firstName} {member.lastName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                                    {member.employeeCode}
                                  </span>
                                </div>
                              </div>

                              {/* Designation Badge */}
                              <div className="shrink-0 text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                  <Briefcase className="w-3 h-3 text-emerald-600" />
                                  {desig}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(team)}
                  >
                    Edit Team & Members
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      setTeamToDelete(team);
                      setIsConfirmOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? `Edit Team: ${editingTeam.name}` : 'Create New Team'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Backend & Services Team"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Assign Team Lead
              </label>
              <select
                value={formData.teamLeadId}
                onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Select Team Lead (Optional) --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.designationId?.name || 'Staff'}
                  </option>
                ))}
              </select>
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
          </div>

          {/* Team Members Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Team Members ({formData.memberIds.length} selected)
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      memberIds: selectableEmployees.map((e) => String(e._id)),
                    })
                  }
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, memberIds: [] })}
                  className="text-slate-500 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Member Search filter */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter employees by name, designation, or code..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            {/* Employee Checkboxes with Designations */}
            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5">
              {selectableEmployees.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No matching employees found.
                </p>
              ) : (
                selectableEmployees.map((emp) => {
                  const isChecked = formData.memberIds.map(String).includes(String(emp._id));
                  const desig = emp.designationId?.name || 'Staff';

                  return (
                    <label
                      key={emp._id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs border ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium'
                          : 'bg-white hover:bg-slate-100/70 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(emp._id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Designation Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        <Briefcase className="w-2.5 h-2.5 text-slate-500" />
                        {desig}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Team mission, tech stack, and scope"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
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
              {editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${teamToDelete?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
