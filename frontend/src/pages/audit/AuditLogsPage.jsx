import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  FileText,
  Filter,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Globe,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [activeLog, setActiveLog] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs(1);
  }, [selectedModule, selectedAction]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit-logs', {
        params: {
          page,
          limit: pagination.limit,
          module: selectedModule || undefined,
          action: selectedAction || undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    'Auth',
    'Employee',
    'Attendance',
    'Leave',
    'Role',
    'Settings',
    'Department',
    'Team',
    'Task',
    'Policy',
  ];

  const getActionBadgeVariant = (action = '') => {
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('LOCK')) {
      return 'danger';
    }
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('UNLOCK')) {
      return 'success';
    }
    if (action.includes('UPDATE') || action.includes('CHANGED')) {
      return 'warning';
    }
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Security & System Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable tracking of administrative modifications, attendance overrides, permission shifts, and security actions.
          </p>
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Filter by Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Search Action / Event
            </label>
            <input
              type="text"
              placeholder="e.g. SETTINGS_UPDATED..."
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedModule('');
                setSelectedAction('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={ShieldAlert}
              title="No Audit Logs Found"
              description="No administrative activities have been logged matching the current criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold tracking-wide uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-3">Module</th>
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Record ID</th>
                  <th className="py-3 px-3">Client IP</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {log.userEmail || log.userId?.email || 'System'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {log.module}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px] max-w-[120px] truncate">
                      {log.recordId || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => {
                          setActiveLog(log);
                          setIsDiffModalOpen(true);
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Inspect Modal */}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title={`Audit Event Inspection: ${activeLog?.action || ''}`}
        size="lg"
      >
        {activeLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Actor:</span>
                <strong className="text-slate-900">{activeLog.userEmail}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <strong className="text-slate-900">
                  {new Date(activeLog.timestamp || activeLog.createdAt).toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Module & Record ID:</span>
                <strong className="text-slate-900">
                  {activeLog.module} ({activeLog.recordId || 'N/A'})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Client IP:</span>
                <strong className="text-slate-900">{activeLog.ipAddress || '127.0.0.1'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Old State (Before Action)
                </h4>
                <pre className="text-[11px] font-mono p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto max-h-60 border border-slate-800">
                  {activeLog.oldData
                    ? JSON.stringify(activeLog.oldData, null, 2)
                    : '// No prior state recorded'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">
                  New State / Payload (After Action)
                </h4>
                <pre className="text-[11px] font-mono p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-60 border border-slate-800">
                  {activeLog.newData
                    ? JSON.stringify(activeLog.newData, null, 2)
                    : '// No modified state recorded'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button
                variant="primary"
                onClick={() => setIsDiffModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
