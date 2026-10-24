import React from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Truck,
  Fuel,
  CircleDot,
  Package,
  Droplets,
  Navigation,
  Building2,
  ClipboardList,
  UserPlus,
  TrendingUp,
  Bell,
  ExternalLink,
  ChevronRight,
  LogOut,
  ChevronLeft,
  X,
  Bus,
  ShieldCheck,
  CalendarDays,
  Disc,
  BatteryCharging,
  AlertTriangle,
  Wrench,
  Users
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

  const handleLogout = () => {
    logout();
    if (isCaptain) navigate('/captain/login');
    else if (isSupporter) navigate('/supporter/login');
    else navigate('/admin/login');
  };

  // Dedicated navigation matching the user's provided management structure
  const adminNavItems = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Vehicle Management', route: '/admin/vehicles', icon: Truck },
    { label: 'Mileage & Fueling', route: '/admin/mileage-fueling', icon: Fuel },
    { label: 'Tyre Maintenance', route: '/admin/tyre-maintenance', icon: CircleDot },
    { label: 'Product Management', route: '/admin/products', icon: Package },
    { label: 'Cleaning Management', route: '/admin/cleaning', icon: Droplets },
    { label: 'Route Management', route: '/admin/routes', icon: Navigation },
    { label: 'Organizer Management', route: '/admin/organizers', icon: Building2 },
    { label: 'Task Management', route: '/admin/tasks', icon: ClipboardList },
    { label: 'Employee Registration', route: '/admin/employee-registration', icon: UserPlus },
    { label: 'Earnings', route: '/admin/earnings', icon: TrendingUp },
    { label: 'Website Inquiries', route: '/admin/inquiries', icon: Bell },
  ];

  const captainNavItems = [
    { label: 'Dashboard', route: '/captain/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Vehicle Management', route: '/captain/buses', icon: Truck },
    { label: 'Mileage & Fueling', route: '/captain/daily-kilometers', icon: Fuel },
    { label: 'Cleaning Management', route: '/captain/bus-condition', icon: Droplets },
    { label: 'Complaints & Defects', route: '/captain/complaints', icon: AlertTriangle },
    { label: 'Maintenance Schedule', route: '/captain/maintenance-schedule', icon: CalendarDays },
    { label: 'Tyre Maintenance', route: '/captain/tyre-maintenance', icon: CircleDot },
    { label: 'Battery Check', route: '/captain/battery-maintenance', icon: BatteryCharging },
  ];

  const supporterNavItems = [
    { label: 'Dashboard', route: '/supporter/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Cleaning Management', route: '/supporter/bus-condition', icon: Droplets },
    { label: 'Complaints & Issues', route: '/supporter/complaints', icon: AlertTriangle },
    { label: 'Repairs & Tasks', route: '/supporter/repairs', icon: Wrench },
    { label: 'Mileage & Fueling', route: '/supporter/daily-kilometers', icon: Fuel },
    { label: 'Maintenance Schedule', route: '/supporter/maintenance-schedule', icon: CalendarDays },
    { label: 'Vehicle Fleet', route: '/supporter/buses', icon: Truck },
  ];

  const navItems = isCaptain ? captainNavItems : isSupporter ? supporterNavItems : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] text-slate-800 flex flex-col transition-all duration-300 border-r-2 border-amber-400 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header / Brand Area */}
        <div className="p-4 border-b border-slate-100 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            {!isCollapsed && (
              <span className="text-[11px] font-black tracking-widest text-[#8A9BA8] uppercase">
                MANAGEMENT
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Logo */}
          <div className="w-full flex items-center justify-center">
            {isCollapsed ? (
              <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs border border-slate-100">
                <img
                  src="/logo.jpg"
                  alt="Charvik Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-20 rounded-xl bg-white p-2 flex items-center justify-center shadow-xs border border-slate-100 overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Charvik Staffing Consultancy"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin scrollbar-thumb-amber-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              location.pathname === item.route ||
              (item.route === '/admin/vehicles' && location.pathname === '/admin/buses') ||
              (item.route === '/admin/mileage-fueling' && location.pathname === '/admin/daily-kilometers') ||
              (item.route === '/admin/employee-registration' && location.pathname === '/admin/employees');

            return (
              <NavLink
                key={item.route}
                to={item.route}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-150 group relative ${
                  isItemActive
                    ? 'bg-[#C68A00] text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-800 hover:bg-amber-50/80 hover:text-amber-800'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isItemActive ? 'text-white' : 'text-amber-500'
                  } ${isCollapsed ? '' : 'mr-3'}`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                )}

                {/* LIVE Badge on Dashboard */}
                {!isCollapsed && item.hasLiveBadge && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                      isItemActive
                        ? 'bg-amber-600/50 text-white border border-white/30'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    LIVE
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Area: View Public Website & User Actions */}
        <div className="p-3 border-t border-slate-100 bg-[#FFFDF9] shrink-0 space-y-2">
          {!isCollapsed && (
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all text-xs font-bold text-slate-800 group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>View Public Website</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* User Profile info if available */}
          {!isCollapsed && user && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center space-x-2.5 border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user.name.slice(0, 2)}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">{user.role}</p>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className={`w-4 h-4 shrink-0 ${isCollapsed ? '' : 'mr-2.5'}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar (as shown in image) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex justify-around items-center">
        {/* Dash */}
        <NavLink
          to={isCaptain ? '/captain/dashboard' : isSupporter ? '/supporter/dashboard' : '/admin/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Dash</span>
        </NavLink>

        {/* Staff / Employee Registration */}
        <NavLink
          to={isCaptain ? '/captain/buses' : isSupporter ? '/supporter/buses' : '/admin/employee-registration'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Staff</span>
        </NavLink>

        {/* Vehicles */}
        <NavLink
          to={isCaptain ? '/captain/buses' : isSupporter ? '/supporter/buses' : '/admin/vehicles'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Truck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Vehicles</span>
        </NavLink>

        {/* Fuel / Mileage */}
        <NavLink
          to={isCaptain ? '/captain/daily-kilometers' : isSupporter ? '/supporter/daily-kilometers' : '/admin/mileage-fueling'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'border-2 border-amber-500 bg-amber-50 text-amber-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Fuel className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Fuel</span>
        </NavLink>

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <span className="text-base leading-none mb-1 font-black">•••</span>
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>
    </>
  );
};
