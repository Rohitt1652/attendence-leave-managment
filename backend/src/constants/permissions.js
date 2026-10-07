const PERMISSIONS = {
  // Employee
  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_EDIT: 'employee.edit',
  EMPLOYEE_DELETE: 'employee.delete',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_EDIT: 'attendance.edit',
  ATTENDANCE_APPROVE: 'attendance.approve',
  ATTENDANCE_IMPORT: 'attendance.import',
  ATTENDANCE_LOCK: 'attendance.lock',

  // Leave
  LEAVE_VIEW: 'leave.view',
  LEAVE_REQUEST: 'leave.request',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',
  LEAVE_ALLOCATE: 'leave.allocate',

  // Department & Designation & Team & Shift
  DEPARTMENT_MANAGE: 'department.manage',
  DESIGNATION_MANAGE: 'designation.manage',
  TEAM_MANAGE: 'team.manage',
  SHIFT_MANAGE: 'shift.manage',

  // Office Tasks
  TASK_VIEW: 'task.view',
  TASK_MANAGE: 'task.manage',

  // Performance
  PERFORMANCE_VIEW: 'performance.view',
  PERFORMANCE_MANAGE: 'performance.manage',

  // Policies
  POLICY_VIEW: 'policy.view',
  POLICY_MANAGE: 'policy.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Roles & Permissions
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Audit Logs
  AUDIT_VIEW: 'audit.view',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
};
