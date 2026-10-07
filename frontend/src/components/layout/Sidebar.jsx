import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  CalendarDays,
  CheckSquare,
  Award,
  FileText,
  BarChart3,
  Shield,
  Settings,
  History,
  ChevronDown,
  Building2,
  Briefcase,
  Layers,
  Network,
  CalendarRange,
  Upload,
  PieChart,
  LogOut,
  Sparkles,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, employee, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const [expandedMenus, setExpandedMenus] = useState({
    employees: true,
    attendance: true,
    leaves: false,
  });

  const toggleSubmenu = (menu) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isEmployeeRole = user?.role?.code === 'employee';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Apex<span className="text-indigo-400">HRMS</span>
            </h1>
            <span className="text-[10px] text-slate-400 block font-medium -mt-0.5">
              Enterprise Attendance
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 custom-scrollbar text-xs font-medium">
          {/* Main Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          {/* Section: Workforce */}
          <div className="pt-2">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workforce
            </span>
          </div>

          {/* Employees Accordion (visible to HR/Managers/Admins) */}
          {hasPermission('employee.view') && !isEmployeeRole && (
            <div>
              <button
                onClick={() => toggleSubmenu('employees')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Employees</span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    expandedMenus.employees ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {expandedMenus.employees && (
                <div className="ml-5 mt-1 pl-3 border-l border-slate-800 space-y-1">
                  <NavLink
                    to="/employees"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>All Employees</span>
                  </NavLink>
                  <NavLink
                    to="/employees/hierarchy"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>Org Hierarchy</span>
                  </NavLink>
                  {hasPermission('department.manage') && (
                    <NavLink
                      to="/departments"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Departments</span>
                    </NavLink>
                  )}
                  {hasPermission('designation.manage') && (
                    <NavLink
                      to="/designations"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Designations</span>
                    </NavLink>
                  )}
                  {hasPermission('team.manage') && (
                    <NavLink
                      to="/teams"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Teams</span>
                    </NavLink>
                  )}
                  {hasPermission('shift.manage') && (
                    <NavLink
                      to="/shifts"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Shifts</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attendance Accordion */}
          <div>
            <button
              onClick={() => toggleSubmenu('attendance')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Attendance</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  expandedMenus.attendance ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {expandedMenus.attendance && (
              <div className="ml-5 mt-1 pl-3 border-l border-slate-800 space-y-1">
                <NavLink
                  to="/attendance/my"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                      isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  <span>My Attendance</span>
                </NavLink>

                {!isEmployeeRole && (
                  <>
                    <NavLink
                      to="/attendance/daily"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Daily Attendance</span>
                    </NavLink>
                    <NavLink
                      to="/attendance/monthly-matrix"
                      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                          isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                        }`
                      }
                    >
                      <span>Monthly Grid Matrix</span>
                    </NavLink>
                  </>
                )}

                <NavLink
                  to="/attendance/regularizations"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                      isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  <span>Regularization Requests</span>
                </NavLink>

                {hasPermission('attendance.import') && (
                  <NavLink
                    to="/attendance/import"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>Import Biometric/Excel</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Leaves Accordion */}
          <div>
            <button
              onClick={() => toggleSubmenu('leaves')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck2 className="h-4 w-4 shrink-0" />
                <span>Leave Management</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  expandedMenus.leaves ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {expandedMenus.leaves && (
              <div className="ml-5 mt-1 pl-3 border-l border-slate-800 space-y-1">
                <NavLink
                  to="/leaves"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                      isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  <span>Leave Requests</span>
                </NavLink>
                <NavLink
                  to="/leaves/balances"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                      isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  <span>Leave Balances</span>
                </NavLink>
                {hasPermission('leave.allocate') && (
                  <NavLink
                    to="/leaves/allocations"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>Leave Allocations</span>
                  </NavLink>
                )}
                {!isEmployeeRole && (
                  <NavLink
                    to="/leaves/analytics"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>Leave Analytics</span>
                  </NavLink>
                )}
                {hasPermission('leave.view') && !isEmployeeRole && (
                  <NavLink
                    to="/leaves/types"
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                        isActive ? 'text-indigo-400 bg-slate-800/40 font-semibold' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <span>Leave Types</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* HR Operations */}
          <div className="pt-2">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations & Culture
            </span>
          </div>

          <NavLink
            to="/calendar"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`
            }
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Calendar & Events</span>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`
            }
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span>Office Tasks</span>
          </NavLink>

          <NavLink
            to="/performance"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`
            }
          >
            <Award className="h-4 w-4 shrink-0" />
            <span>Performance</span>
          </NavLink>

          <NavLink
            to="/policies"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`
            }
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>Company Policies</span>
          </NavLink>

          {/* Section: Administration & Analytics */}
          {hasPermission('reports.view') && (
            <>
              <div className="pt-2">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Analytics & Admin
                </span>
              </div>

              <NavLink
                to="/reports"
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                  }`
                }
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>Reports & Payroll</span>
              </NavLink>
            </>
          )}

          {hasPermission('roles.manage') && (
            <NavLink
              to="/roles"
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                }`
              }
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Roles & Permissions</span>
            </NavLink>
          )}

          {hasPermission('settings.manage') && (
            <NavLink
              to="/settings"
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                }`
              }
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>System Settings</span>
            </NavLink>
          )}

          {hasPermission('audit.view') && (
            <NavLink
              to="/audit-logs"
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                }`
              }
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Audit Trail</span>
            </NavLink>
          )}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden border border-indigo-400">
                {employee?.profileImage ? (
                  <img src={employee.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {employee ? `${employee.firstName} ${employee.lastName}` : user?.email}
                </p>
                <p className="text-[10px] text-indigo-400 truncate font-medium">
                  {user?.role?.name || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
