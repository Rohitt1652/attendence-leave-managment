import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('admin@company.com');
  const [password, setPassword] = useState('Admin@123');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(identifier, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const handleQuickDemo = (demoId, demoPass) => {
    setIdentifier(demoId);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/20 mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Apex<span className="text-indigo-400">HRMS</span> Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Employee & Attendance Management
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email or Employee ID (e.g. EMP-001)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="Enter email or EMP code"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 text-xs font-semibold mt-2"
              icon={ArrowRight}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>One-Click Demo Roles</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@company.com', 'Admin@123')}
                className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-[11px]"
              >
                <span className="font-semibold block text-indigo-400">Super Admin</span>
                <span className="text-[10px] text-slate-500">Full system access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hr@company.com', 'HR@123')}
                className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-[11px]"
              >
                <span className="font-semibold block text-teal-400">HR Admin</span>
                <span className="text-[10px] text-slate-500">People & Payroll</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('manager@company.com', 'Manager@123')}
                className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-[11px]"
              >
                <span className="font-semibold block text-amber-400">Manager</span>
                <span className="text-[10px] text-slate-500">Dept & Approvals</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('employee@company.com', 'Employee@123')}
                className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-[11px]"
              >
                <span className="font-semibold block text-emerald-400">Employee</span>
                <span className="text-[10px] text-slate-500">Self-service punch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Powered by MongoDB Atlas &bull; MERN Stack HRMS &bull; v1.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
