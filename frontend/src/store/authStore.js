import { create } from 'zustand';
import apiClient from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('hrms_user') || 'null'),
  employee: JSON.parse(localStorage.getItem('hrms_employee') || 'null'),
  token: localStorage.getItem('hrms_access_token') || null,
  isAuthenticated: !!localStorage.getItem('hrms_access_token'),
  loading: false,
  error: null,

  login: async (identifier, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { identifier, password });
      const { accessToken, refreshToken, user, employee } = response.data.data;

      localStorage.setItem('hrms_access_token', accessToken);
      localStorage.setItem('hrms_refresh_token', refreshToken);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      if (employee) {
        localStorage.setItem('hrms_employee', JSON.stringify(employee));
      }

      set({
        token: accessToken,
        user,
        employee,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ loading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hrms_access_token');
      localStorage.removeItem('hrms_refresh_token');
      localStorage.removeItem('hrms_user');
      localStorage.removeItem('hrms_employee');
      set({
        token: null,
        user: null,
        employee: null,
        isAuthenticated: false,
      });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const { user, employee } = res.data.data;
      localStorage.setItem('hrms_user', JSON.stringify(user));
      if (employee) {
        localStorage.setItem('hrms_employee', JSON.stringify(employee));
      }
      set({ user, employee });
    } catch (err) {
      console.error('Failed to sync profile', err);
    }
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (!user || !user.role) return false;

    // Super Admin has all permissions
    if (user.role.name === 'Super Admin' || user.role.code === 'super_admin') {
      return true;
    }

    const perms = Array.isArray(user.role.permissions) ? user.role.permissions : [];
    if (Array.isArray(permission)) {
      return permission.some((p) => perms.includes(p));
    }
    return perms.includes(permission);
  },
}));

export default useAuthStore;

