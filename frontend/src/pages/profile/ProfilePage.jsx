import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import useAuthStore from '../../store/authStore';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  MapPin,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPass, setChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPassMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setChangingPass(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data.success) {
        setPassMessage({ type: 'success', text: 'Password changed successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPassMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setChangingPass(false);
    }
  };

  const employee = profileData?.employee;
  const user = profileData?.user || authUser;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Hero Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-md border-0 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner">
            {employee?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">
                {employee ? `${employee.firstName} ${employee.lastName}` : user?.email}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-white/20 text-indigo-100 border border-white/20">
                  {employee?.employeeCode || user?.employeeId || 'SUPER-ADMIN'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {employee?.status || user?.status || 'Active'}
                </span>
              </div>
            </div>

            <p className="text-sm text-indigo-200">
              {employee?.designationId?.name || user?.roleId?.name || 'Administrator'} •{' '}
              {employee?.departmentId?.name || 'Corporate Management'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-indigo-100/80">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              {employee?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {employee.phone}
                </span>
              )}
              {employee?.joiningDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Personal & Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Details */}
          <Card className="p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Organizational & Shift Assignment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.departmentId?.name || 'Headquarters'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Designation</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.designationId?.name || 'Lead Officer'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Employment Type</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.employmentType || 'Permanent'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Assigned Shift</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.shiftId
                    ? `${employee.shiftId.name} (${employee.shiftId.startTime} - ${employee.shiftId.endTime})`
                    : 'General Shift (09:30 - 18:30)'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Reporting Manager</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.reportingManagerId
                    ? `${employee.reportingManagerId.firstName} ${employee.reportingManagerId.lastName}`
                    : 'Direct to Executive Board'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Team Lead</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.teamLeadId
                    ? `${employee.teamLeadId.firstName} ${employee.teamLeadId.lastName}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Personal Demographics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString()
                    : 'Not Specified'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.gender || 'Not Specified'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.emergencyContact?.phone
                    ? `${employee.emergencyContact.name || 'Relation'} (${employee.emergencyContact.phone})`
                    : 'None provided'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Office Location</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.officeLocation || 'Main Corporate Campus'}
                </span>
              </div>

              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Current Address</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {employee?.address
                    ? `${employee.address.street || ''}, ${employee.address.city || ''}, ${employee.address.state || ''} ${employee.address.country || ''}`
                    : 'No address registered on record.'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Security & Password Form */}
        <div className="space-y-6">
          {/* Account Security Information */}
          <Card className="p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Account Security
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Role</span>
                <span className="font-bold text-indigo-600">
                  {user?.roleId?.name || 'Super Admin'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Account Status</span>
                <span className="font-semibold text-emerald-600">
                  {user?.status || 'Active'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Login</span>
                <span className="text-slate-700">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : 'Current Session'}
                </span>
              </div>
            </div>
          </Card>

          {/* Change Password Form */}
          <Card className="p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Change Password
            </h2>

            {passMessage.text && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-4 ${
                  passMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={changingPass}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
