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
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  CheckSquare,
  Square,
  Users,
  Search,
} from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/roles'),
        apiClient.get('/permissions'),
      ]);
      if (rolesRes.data.success) setRoles(rolesRes.data.data || []);
      if (permsRes.data.success) setPermissions(permsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load roles and permissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (slug) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(slug);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== slug)
          : [...prev.permissions, slug],
      };
    });
  };

  const handleSelectAllInModule = (modulePerms) => {
    const slugs = modulePerms.map((p) => p.slug);
    const allSelected = slugs.every((s) => formData.permissions.includes(s));
    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((s) => !slugs.includes(s))
        : Array.from(new Set([...prev.permissions, ...slugs])),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Role name is required.');
    setSaving(true);
    try {
      if (editingRole) {
        await apiClient.put(`/roles/${editingRole._id}`, formData);
      } else {
        await apiClient.post('/roles', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await apiClient.delete(`/roles/${roleToDelete._id}`);
      setIsConfirmOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete role.');
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, p) => {
    const mod = p.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system roles and assign granular security privileges for API & UI access.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create New Role
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </Card>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Roles Found"
          description="Create a custom role to grant tailored permissions."
          actionText="+ Create Role"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => (
            <Card
              key={role._id}
              className="p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {role.name}
                    </h3>
                    {role.isSystemRole && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        System
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {role.description || 'No description provided.'}
                </p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Permissions Assigned:</span>
                    <span className="font-semibold text-indigo-600">
                      {role.permissions?.length || 0} / {permissions.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          ((role.permissions?.length || 0) / (permissions.length || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(role)}
                >
                  Edit Permissions
                </Button>
                {!role.isSystemRole && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      setRoleToDelete(role);
                      setIsConfirmOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Finance Officer"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief explanation of duties"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Permissions ({formData.permissions.length} selected)
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      permissions: permissions.map((p) => p.slug),
                    })
                  }
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, permissions: [] })}
                  className="text-slate-500 hover:underline font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
                const slugs = modulePerms.map((p) => p.slug);
                const isAllSelected = slugs.every((s) =>
                  formData.permissions.includes(s)
                );

                return (
                  <div
                    key={moduleName}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="font-semibold text-xs uppercase tracking-wider text-slate-900">
                        {moduleName} Module
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInModule(modulePerms)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {isAllSelected ? 'Deselect Module' : 'Select Module'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modulePerms.map((perm) => {
                        const isChecked = formData.permissions.includes(perm.slug);
                        return (
                          <label
                            key={perm._id || perm.slug}
                            className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors text-xs ${
                              isChecked
                                ? 'bg-indigo-50/70 border border-indigo-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.slug)}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {perm.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {perm.slug}
                              </span>
                              {perm.description && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {perm.description}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete role "${roleToDelete?.name}"? Users assigned this role may lose access.`}
        confirmText="Delete Role"
        variant="danger"
      />
    </div>
  );
}
