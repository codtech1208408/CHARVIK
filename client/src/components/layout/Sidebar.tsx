import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bus,
  Gauge,
  CalendarDays,
  Disc,
  Snowflake,
  Fuel,
  BatteryCharging,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  UserPlus,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCaptain = location.pathname.startsWith('/captain');
  const isSupporter = location.pathname.startsWith('/supporter');

  const portalType = isCaptain ? 'captain' : isSupporter ? 'supporter' : 'admin';

  const handleLogout = () => {
    logout();
    if (isCaptain) navigate('/captain/login');
    else if (isSupporter) navigate('/supporter/login');
    else navigate('/admin/login');
  };

  const navItems = isCaptain
    ? [
        { label: 'Captain Dashboard', route: '/captain/dashboard', icon: LayoutDashboard },
        { label: 'Bus Fleet Status', route: '/captain/buses', icon: Bus },
        { label: 'Daily KM Entry', route: '/captain/daily-kilometers', icon: Gauge },
        { label: 'Bus Condition Inspection', route: '/captain/bus-condition', icon: ShieldCheck },
        { label: 'Bus Complaints & Defects', route: '/captain/complaints', icon: AlertTriangle },
        { label: 'Maintenance Schedule', route: '/captain/maintenance-schedule', icon: CalendarDays },
        { label: 'Tyre Inspection', route: '/captain/tyre-maintenance', icon: Disc },
        { label: 'Battery Check', route: '/captain/battery-maintenance', icon: BatteryCharging },
      ]
    : isSupporter
    ? [
        { label: 'Supporter Dashboard', route: '/supporter/dashboard', icon: LayoutDashboard },
        { label: 'Bus Condition Inspection', route: '/supporter/bus-condition', icon: ShieldCheck },
        { label: 'Bus Complaints & Issues', route: '/supporter/complaints', icon: AlertTriangle },
        { label: 'Repairs & Service Orders', route: '/supporter/repairs', icon: Wrench },
        { label: 'Daily KM Logging', route: '/supporter/daily-kilometers', icon: Gauge },
        { label: 'Maintenance Schedule', route: '/supporter/maintenance-schedule', icon: CalendarDays },
        { label: 'Fleet Overview', route: '/supporter/buses', icon: Bus },
      ]
    : [
        { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Bus Master', route: '/admin/buses', icon: Bus },
        { label: 'Daily Kilometer Entry', route: '/admin/daily-kilometers', icon: Gauge },
        { label: 'Maintenance Schedule', route: '/admin/maintenance-schedule', icon: CalendarDays },
        { label: 'Tyre Maintenance', route: '/admin/tyre-maintenance', icon: Disc },
        { label: 'AC Maintenance', route: '/admin/ac-maintenance', icon: Snowflake },
        { label: 'Oil & Filter Replacement', route: '/admin/oil-filter-maintenance', icon: Fuel },
        { label: 'Battery Check', route: '/admin/battery-maintenance', icon: BatteryCharging },
        { label: 'Complaints', route: '/admin/complaints', icon: AlertTriangle },
        { label: 'Repairs & Service', route: '/admin/repairs', icon: Wrench },
        { label: 'Bus Condition', route: '/admin/bus-condition', icon: ShieldCheck },
        { label: 'Driver Registration', route: '/admin/drivers/new', icon: UserPlus },
        { label: 'Helper & Captain Reg.', route: '/admin/support-staff/new', icon: UserCheck },
        { label: 'Employee Management', route: '/admin/employees', icon: Users },
        { label: 'Reports', route: '/admin/reports', icon: FileBarChart },
        { label: 'Settings', route: '/admin/settings', icon: Settings },
      ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#142B4A] text-white flex flex-col transition-all duration-300 border-r border-slate-800 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-white/10 shrink-0 bg-[#0e1f36]">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/80 px-1">
                {isCaptain ? 'Captain Portal' : isSupporter ? 'Supporter Portal' : 'Admin Fleet Panel'}
              </span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
                  <img
                    src="/logo.jpg"
                    alt="Charvik Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="hidden lg:flex p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full h-22 rounded-xl bg-white p-2 flex items-center justify-center shadow-md border border-white/10 overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Charvik Staffing Consultancy"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            {!isCollapsed && (
              <div className="mt-2 flex items-center justify-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isCaptain
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isSupporter
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {isCaptain ? '⚓ Route Captain' : isSupporter ? '🛠️ Support Staff' : '🛡️ Super Admin'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.route}
                to={item.route}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isCollapsed ? '' : 'mr-3'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0e1f36] shrink-0">
          {!isCollapsed && user && !isCaptain && !isSupporter && (
            <div className="px-3 py-2 mb-2 bg-white/5 rounded-xl flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs uppercase border border-blue-400/30">
                {user.name.slice(0, 2)}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-blue-300 font-medium truncate">{user.role}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={`Sign out of ${isCaptain ? 'Captain' : isSupporter ? 'Supporter' : 'Admin'} Portal`}
          >
            <LogOut className={`w-4 h-4 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
