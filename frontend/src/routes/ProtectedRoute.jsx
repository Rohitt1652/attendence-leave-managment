import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ requiredPermission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">403 - Access Forbidden</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have the required permissions to view this module.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
