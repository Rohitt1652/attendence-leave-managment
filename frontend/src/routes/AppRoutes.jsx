import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Workforce
import EmployeesPage from '../pages/employees/EmployeesPage';
import HierarchyPage from '../pages/employees/HierarchyPage';
import DepartmentsPage from '../pages/employees/DepartmentsPage';
import DesignationsPage from '../pages/employees/DesignationsPage';
import TeamsPage from '../pages/employees/TeamsPage';
import ShiftsPage from '../pages/employees/ShiftsPage';

// Attendance
import MyAttendancePage from '../pages/attendance/MyAttendancePage';
import DailyAttendancePage from '../pages/attendance/DailyAttendancePage';
import MonthlyMatrixPage from '../pages/attendance/MonthlyMatrixPage';
import RegularizationPage from '../pages/attendance/RegularizationPage';
import AttendanceImportPage from '../pages/attendance/AttendanceImportPage';

// Leaves
import LeaveRequestsPage from '../pages/leaves/LeaveRequestsPage';
import LeaveBalancesPage from '../pages/leaves/LeaveBalancesPage';
import LeaveAllocationPage from '../pages/leaves/LeaveAllocationPage';
import LeaveTypesPage from '../pages/leaves/LeaveTypesPage';
import LeaveAnalyticsPage from '../pages/leaves/LeaveAnalyticsPage';

// Culture & Operations
import CalendarPage from '../pages/calendar/CalendarPage';
import TasksPage from '../pages/tasks/TasksPage';
import PerformancePage from '../pages/performance/PerformancePage';
import PoliciesPage from '../pages/policies/PoliciesPage';

// Administration & Reporting
import ReportsPage from '../pages/reports/ReportsPage';
import RolesPage from '../pages/roles/RolesPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import ProfilePage from '../pages/profile/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Workforce */}
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/hierarchy" element={<HierarchyPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/designations" element={<DesignationsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />

          {/* Attendance */}
          <Route path="/attendance/my" element={<MyAttendancePage />} />
          <Route path="/attendance/daily" element={<DailyAttendancePage />} />
          <Route path="/attendance/monthly-matrix" element={<MonthlyMatrixPage />} />
          <Route path="/attendance/regularizations" element={<RegularizationPage />} />
          <Route path="/attendance/import" element={<AttendanceImportPage />} />

          {/* Leaves */}
          <Route path="/leaves" element={<LeaveRequestsPage />} />
          <Route path="/leaves/balances" element={<LeaveBalancesPage />} />
          <Route path="/leaves/allocations" element={<LeaveAllocationPage />} />
          <Route path="/leaves/types" element={<LeaveTypesPage />} />
          <Route path="/leaves/analytics" element={<LeaveAnalyticsPage />} />

          {/* Culture & Operations */}
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/policies" element={<PoliciesPage />} />

          {/* Administration & Reports */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />

          {/* User Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
