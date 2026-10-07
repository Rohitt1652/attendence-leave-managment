import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import {
  Settings,
  Building2,
  Clock,
  CalendarDays,
  Hash,
  GitBranch,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    // Company
    company_name: 'Acme Global HRMS',
    company_email: 'contact@acmeglobal.com',
    company_phone: '+1 (555) 019-2834',
    company_address: '100 Innovation Way, Suite 400, Tech City, CA',
    company_website: 'https://acmeglobal.example.com',
    company_timezone: 'Asia/Kolkata',
    company_currency: 'INR',
    company_date_format: 'YYYY-MM-DD',
    company_time_format: '12-hour',

    // Attendance
    attendance_default_start: '09:30',
    attendance_default_end: '18:30',
    attendance_grace_minutes: 15,
    attendance_break_minutes: 60,
    attendance_full_day_hours: 8,
    attendance_half_day_hours: 4,

    // Weekly Off
    weekly_off_type: 'saturday_sunday',
    weekly_off_second_fourth_sat: true,

    // Employee ID
    employee_id_prefix: 'EMP',
    employee_id_start: 1,
    employee_id_padding: 3,

    // Approval Workflows
    leave_approval_flow: 'TL -> Manager -> HR',
    reconciliation_approval_flow: 'Manager -> HR',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setSettings((prev) => ({
          ...prev,
          // Company
          company_name: d.company_profile?.companyName || d.company_name || prev.company_name,
          company_email: d.company_profile?.email || d.company_email || prev.company_email,
          company_phone: d.company_profile?.phone || d.company_phone || prev.company_phone,
          company_address: d.company_profile?.address || d.company_address || prev.company_address,
          company_website: d.company_profile?.website || d.company_website || prev.company_website,
          company_timezone: d.company_profile?.timezone || d.company_timezone || prev.company_timezone,
          company_currency: d.company_profile?.currency || d.company_currency || prev.company_currency,
          company_date_format: d.company_profile?.dateFormat || prev.company_date_format,
          company_time_format: d.company_profile?.timeFormat || prev.company_time_format,

          // Attendance rules
          attendance_default_start: d.attendance_rules?.defaultOfficeStart || prev.attendance_default_start,
          attendance_default_end: d.attendance_rules?.defaultOfficeEnd || prev.attendance_default_end,
          attendance_grace_minutes: d.attendance_rules?.graceMinutes ?? prev.attendance_grace_minutes,
          attendance_break_minutes: d.attendance_rules?.breakMinutes ?? prev.attendance_break_minutes,
          attendance_full_day_hours: d.attendance_rules?.fullDayMinutes ? d.attendance_rules.fullDayMinutes / 60 : prev.attendance_full_day_hours,
          attendance_half_day_hours: d.attendance_rules?.halfDayMinutes ? d.attendance_rules.halfDayMinutes / 60 : prev.attendance_half_day_hours,

          // Weekly off
          weekly_off_type: d.weekly_off_config?.type || prev.weekly_off_type,

          // Employee ID
          employee_id_prefix: d.employee_id_config?.prefix || prev.employee_id_prefix,
          employee_id_start: d.employee_id_config?.startingNumber || prev.employee_id_start,
          employee_id_padding: d.employee_id_config?.padding || prev.employee_id_padding,

          // Approvals
          leave_approval_flow: d.approval_workflows?.leaveWorkflow || prev.leave_approval_flow,
          reconciliation_approval_flow: d.approval_workflows?.reconciliationWorkflow || prev.reconciliation_approval_flow,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg('');

    try {
      const payload = {
        settings: [
          {
            key: 'company_profile',
            category: 'company',
            value: {
              companyName: settings.company_name,
              email: settings.company_email,
              phone: settings.company_phone,
              address: settings.company_address,
              website: settings.company_website,
              timezone: settings.company_timezone,
              currency: settings.company_currency,
              dateFormat: settings.company_date_format,
              timeFormat: settings.company_time_format,
            },
          },
          {
            key: 'attendance_rules',
            category: 'attendance',
            value: {
              defaultOfficeStart: settings.attendance_default_start,
              defaultOfficeEnd: settings.attendance_default_end,
              graceMinutes: Number(settings.attendance_grace_minutes),
              breakMinutes: Number(settings.attendance_break_minutes),
              fullDayMinutes: Number(settings.attendance_full_day_hours) * 60,
              halfDayMinutes: Number(settings.attendance_half_day_hours) * 60,
            },
          },
          {
            key: 'weekly_off_config',
            category: 'weeklyOff',
            value: {
              type: settings.weekly_off_type,
            },
          },
          {
            key: 'employee_id_config',
            category: 'employeeId',
            value: {
              prefix: settings.employee_id_prefix,
              startingNumber: Number(settings.employee_id_start),
              padding: Number(settings.employee_id_padding),
            },
          },
          {
            key: 'approval_workflows',
            category: 'approval',
            value: {
              leaveWorkflow: settings.leave_approval_flow,
              reconciliationWorkflow: settings.reconciliation_approval_flow,
            },
          },
        ],
      };

      await apiClient.post('/settings', payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'attendance', label: 'Attendance & Timings', icon: Clock },
    { id: 'weeklyOff', label: 'Weekly Off Rules', icon: CalendarDays },
    { id: 'employeeId', label: 'Employee ID Format', icon: Hash },
    { id: 'approvals', label: 'Approval Workflows', icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            System & Organization Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure global company policies, attendance calculation thresholds, ID formats, and hierarchy approval rules.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Save}
          loading={saving}
          onClick={handleSave}
        >
          Save All Changes
        </Button>
      </div>

      {/* Success / Error Alerts */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>All organizational settings have been saved and applied across the portal.</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs and Form Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-3">
          <Card className="p-6 border border-slate-200 shadow-sm">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {/* 1. Company Profile */}
                {activeTab === 'company' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Company General Information
                      </h2>
                      <p className="text-xs text-slate-500">
                        Primary identification shown on salary slips, reports, and emails.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={settings.company_name}
                          onChange={(e) =>
                            setSettings({ ...settings, company_name: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Official Contact Email
                        </label>
                        <input
                          type="email"
                          value={settings.company_email}
                          onChange={(e) =>
                            setSettings({ ...settings, company_email: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          value={settings.company_phone}
                          onChange={(e) =>
                            setSettings({ ...settings, company_phone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Website URL
                        </label>
                        <input
                          type="url"
                          value={settings.company_website}
                          onChange={(e) =>
                            setSettings({ ...settings, company_website: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Headquarters Address
                        </label>
                        <textarea
                          rows={2}
                          value={settings.company_address}
                          onChange={(e) =>
                            setSettings({ ...settings, company_address: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          System Timezone
                        </label>
                        <select
                          value={settings.company_timezone}
                          onChange={(e) =>
                            setSettings({ ...settings, company_timezone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                          <option value="America/New_York">America/New_York (EST - UTC-5:00)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-8:00)</option>
                          <option value="Europe/London">Europe/London (GMT - UTC+0:00)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4:00)</option>
                          <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+8:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Base Currency
                        </label>
                        <select
                          value={settings.company_currency}
                          onChange={(e) =>
                            setSettings({ ...settings, company_currency: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="INR">INR (₹ - Indian Rupee)</option>
                          <option value="USD">USD ($ - US Dollar)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                          <option value="GBP">GBP (£ - British Pound)</option>
                          <option value="AED">AED (د.إ - UAE Dirham)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Attendance & Timings */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Default Attendance Thresholds & Rules
                      </h2>
                      <p className="text-xs text-slate-500">
                        Thresholds applied when an employee has no custom shift or as company baseline.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Standard Office Start Time
                        </label>
                        <input
                          type="time"
                          value={settings.attendance_default_start}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_default_start: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Standard Office End Time
                        </label>
                        <input
                          type="time"
                          value={settings.attendance_default_end}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_default_end: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Grace Period (Minutes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={settings.attendance_grace_minutes}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_grace_minutes: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Punches within grace period will be marked "Present", after grace marked "Late".
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Default Break Time (Minutes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={settings.attendance_break_minutes}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_break_minutes: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Subtracted automatically from gross check-out duration.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Minimum Hours for Full Day
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={1}
                          value={settings.attendance_full_day_hours}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_full_day_hours: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Minimum Hours for Half Day
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={1}
                          value={settings.attendance_half_day_hours}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              attendance_half_day_hours: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Working duration below this threshold is marked as "Absent".
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Weekly Off */}
                {activeTab === 'weeklyOff' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Company Weekly Off Configuration
                      </h2>
                      <p className="text-xs text-slate-500">
                        Determines non-working days used in leave calculation and attendance ledger.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: 'saturday_sunday',
                          label: 'Saturday + Sunday (5-day work week)',
                          desc: 'Standard for IT and corporate offices.',
                        },
                        {
                          id: 'sunday',
                          label: 'Sunday Only (6-day work week)',
                          desc: 'Common in operations, retail, and manufacturing.',
                        },
                        {
                          id: 'second_fourth_saturday',
                          label: 'Sunday + 2nd & 4th Saturday Off',
                          desc: 'Traditional banking and enterprise schedule.',
                        },
                        {
                          id: 'alternate_saturday',
                          label: 'Alternate Saturdays Off',
                          desc: '1st and 3rd Saturday working, others off.',
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            settings.weekly_off_type === item.id
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="weeklyOff"
                            value={item.id}
                            checked={settings.weekly_off_type === item.id}
                            onChange={(e) =>
                              setSettings({ ...settings, weekly_off_type: e.target.value })
                            }
                            className="mt-1 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <div>
                            <span className="font-semibold text-sm block">
                              {item.label}
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Employee ID Format */}
                {activeTab === 'employeeId' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Employee ID Sequence Generator
                      </h2>
                      <p className="text-xs text-slate-500">
                        Automatically generated codes for new recruits (e.g. EMP-001, EMP-002).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Prefix Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={settings.employee_id_prefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              employee_id_prefix: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="EMP"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Starting Number
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={settings.employee_id_start}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              employee_id_start: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Digit Padding (Zeroes)
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={6}
                          value={settings.employee_id_padding}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              employee_id_padding: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-3">
                      <span className="text-xs font-semibold text-slate-600 uppercase block mb-1">
                        Generated Pattern Preview:
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-mono font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-200">
                          {settings.employee_id_prefix}-
                          {String(settings.employee_id_start).padStart(
                            settings.employee_id_padding,
                            '0'
                          )}
                        </span>
                        <span className="text-xs text-slate-500">
                          Next sample employee code generated automatically.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Approval Workflows */}
                {activeTab === 'approvals' && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Multi-Level Approval Workflows
                      </h2>
                      <p className="text-xs text-slate-500">
                        Hierarchy stages required before leave or attendance corrections are formally sanctioned.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Leave Approval Chain
                        </label>
                        <select
                          value={settings.leave_approval_flow}
                          onChange={(e) =>
                            setSettings({ ...settings, leave_approval_flow: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="TL -> Manager -> HR">
                            Employee → Team Lead → Department Manager → HR Admin (3-Tier)
                          </option>
                          <option value="Manager -> HR">
                            Employee → Department Manager → HR Admin (2-Tier)
                          </option>
                          <option value="HR">
                            Employee → HR Admin Direct (1-Tier)
                          </option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Controls hierarchy routing for all standard employee leave applications.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                          Attendance Regularization Chain
                        </label>
                        <select
                          value={settings.reconciliation_approval_flow}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              reconciliation_approval_flow: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="Manager -> HR">
                            Employee → Reporting Manager → HR Admin (2-Tier)
                          </option>
                          <option value="TL -> HR">
                            Employee → Team Lead → HR Admin (2-Tier)
                          </option>
                          <option value="HR">
                            Employee → HR Admin Direct (1-Tier)
                          </option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Controls validation of punch correction and missed punch regularization claims.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Save}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
