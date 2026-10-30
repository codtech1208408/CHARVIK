import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutGrid,
  ArrowLeft,
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
  ChevronDown,
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
  Users,
  IndianRupee,
  Snowflake,
  ClipboardCheck,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavSubItem {
  label: string;
  route: string;
  icon: any;
  activeRoutes?: string[];
}

export interface NavItemLeaf {
  label: string;
  route: string;
  icon: any;
  hasLiveBadge?: boolean;
  activeRoutes?: string[];
  subItems?: NavSubItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  isPinned?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  isPinned = true,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track expanded/collapsed state of sidebar items with sub-menus
  const [subMenusOpen, setSubMenusOpen] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (route: string, currentExpanded: boolean) => {
    setSubMenusOpen((prev) => ({
      ...prev,
      [route]: !currentExpanded
    }));
  };

  const isCaptain = location.pathname.startsWith('/captain');
  const isSupporter = location.pathname.startsWith('/supporter');
  const isDashboard =
    location.pathname.endsWith('/dashboard') ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/captain' ||
    location.pathname === '/captain/' ||
    location.pathname === '/supporter' ||
    location.pathname === '/supporter/';

  const handleLogout = () => {
    logout();
    if (isCaptain) navigate('/captain/login');
    else if (isSupporter) navigate('/supporter/login');
    else navigate('/admin/login');
  };

  const vehicleManagementTabs: NavItemLeaf[] = [
    {
      label: 'Vehicle Registration',
      route: '/admin/vehicles',
      icon: Bus,
      activeRoutes: ['/admin/vehicles', '/admin/buses', '/admin/vehicle-registration', '/admin/vehicle-management']
    },
    {
      label: 'Route Management',
      route: '/admin/routes',
      icon: Navigation,
      activeRoutes: ['/admin/routes']
    },
    {
      label: 'Task Management',
      route: '/admin/tasks',
      icon: ClipboardList,
      activeRoutes: ['/admin/tasks']
    },
    {
      label: 'Organizer Management',
      route: '/admin/organizers',
      icon: Building2,
      activeRoutes: ['/admin/organizers']
    },
    {
      label: 'Employee Registration',
      route: '/admin/employee-registration',
      icon: UserPlus,
      activeRoutes: ['/admin/employee-registration', '/admin/employees', '/admin/drivers', '/admin/support-staff']
    },
    {
      label: 'Employee Payments',
      route: '/admin/employee-payments',
      icon: IndianRupee,
      activeRoutes: ['/admin/employee-payments']
    },
    {
      label: 'Earnings',
      route: '/admin/earnings',
      icon: TrendingUp,
      activeRoutes: ['/admin/earnings']
    },
  ];

  const vehicleMaintenanceTabs: NavItemLeaf[] = [
    {
      label: 'Mileage & Fueling',
      route: '/admin/mileage-fueling',
      icon: Fuel,
      activeRoutes: ['/admin/mileage-fueling', '/admin/daily-kilometers']
    },
    {
      label: 'Daily Vehicle Checkup',
      route: '/admin/daily-vehicle-checkup',
      icon: ClipboardCheck,
      activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/vehicle-checkup', '/admin/bus-condition']
    },
    {
      label: 'AC Maintenance',
      route: '/admin/ac-maintenance',
      icon: Snowflake,
      activeRoutes: ['/admin/ac-maintenance']
    },
    {
      label: 'Tyre Maintenance',
      route: '/admin/tyre-maintenance',
      icon: CircleDot,
      activeRoutes: ['/admin/tyre-maintenance'],
      subItems: [
        {
          label: 'Tyre Maintenance',
          route: '/admin/tyre-maintenance?tab=maintenance',
          icon: Disc,
          activeRoutes: ['/admin/tyre-maintenance?tab=maintenance', '/admin/tyre-maintenance']
        },
        {
          label: 'New Tyres',
          route: '/admin/tyre-maintenance?tab=new_tyres',
          icon: Package,
          activeRoutes: ['/admin/tyre-maintenance?tab=new_tyres']
        },
        {
          label: 'Wheel Allotment & Tyre Rotation',
          route: '/admin/tyre-maintenance?tab=allotment_rotation',
          icon: RotateCw,
          activeRoutes: ['/admin/tyre-maintenance?tab=allotment_rotation']
        }
      ]
    },
    {
      label: 'Product Management',
      route: '/admin/products',
      icon: Package,
      activeRoutes: ['/admin/products']
    },
    {
      label: 'Cleaning Management',
      route: '/admin/cleaning',
      icon: Droplets,
      activeRoutes: ['/admin/cleaning']
    },
  ];

  // Structured top-level navigation tabs
  const adminNavItems: NavItemLeaf[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: LayoutGrid,
      hasLiveBadge: true,
      activeRoutes: ['/admin/dashboard']
    },
    {
      label: 'Vehicle Management',
      route: '/admin/vehicles',
      icon: Truck,
      activeRoutes: [
        '/admin/vehicles',
        '/admin/buses',
        '/admin/vehicle-registration',
        '/admin/vehicle-management',
        '/admin/routes',
        '/admin/tasks',
        '/admin/organizers',
        '/admin/employee-registration',
        '/admin/employees',
        '/admin/employee-payments',
        '/admin/earnings'
      ]
    },
    {
      label: 'Vehicle Maintenance',
      route: '/admin/mileage-fueling',
      icon: Wrench,
      activeRoutes: [
        '/admin/mileage-fueling',
        '/admin/daily-kilometers',
        '/admin/vehicle-maintenance',
        '/admin/tyre-maintenance',
        '/admin/products',
        '/admin/cleaning'
      ]
    },
    {
      label: 'Website Inquiries',
      route: '/admin/inquiries',
      icon: Bell,
      activeRoutes: ['/admin/inquiries']
    },
  ];

  const captainNavItems: NavItemLeaf[] = [
    { label: 'Dashboard', route: '/captain/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Vehicle Management', route: '/captain/buses', icon: Truck },
    { label: 'Mileage & Fueling', route: '/captain/daily-kilometers', icon: Fuel },
    { label: 'Cleaning Management', route: '/captain/bus-condition', icon: Droplets },
    {
      label: 'Tyre Maintenance',
      route: '/captain/tyre-maintenance',
      icon: CircleDot,
      activeRoutes: ['/captain/tyre-maintenance'],
      subItems: [
        {
          label: 'Tyre Maintenance',
          route: '/captain/tyre-maintenance?tab=maintenance',
          icon: Disc,
          activeRoutes: ['/captain/tyre-maintenance?tab=maintenance', '/captain/tyre-maintenance']
        },
        {
          label: 'New Tyres',
          route: '/captain/tyre-maintenance?tab=new_tyres',
          icon: Package,
          activeRoutes: ['/captain/tyre-maintenance?tab=new_tyres']
        },
        {
          label: 'Wheel Allotment & Tyre Rotation',
          route: '/captain/tyre-maintenance?tab=allotment_rotation',
          icon: RotateCw,
          activeRoutes: ['/captain/tyre-maintenance?tab=allotment_rotation']
        }
      ]
    },
    { label: 'Battery Check', route: '/captain/battery-maintenance', icon: BatteryCharging },
  ];

  const supporterNavItems: NavItemLeaf[] = [
    { label: 'Dashboard', route: '/supporter/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Trip Tasks', route: '/supporter/tasks', icon: ClipboardList, activeRoutes: ['/supporter/tasks'] },
    { label: 'Repairs', route: '/supporter/repairs', icon: Wrench, activeRoutes: ['/supporter/repairs'] },
    { label: 'Cleaning Management', route: '/supporter/bus-condition', icon: Droplets },
    { label: 'Complaints & Issues', route: '/supporter/complaints', icon: AlertTriangle },
    { label: 'Mileage & Fueling', route: '/supporter/daily-kilometers', icon: Fuel },
    { label: 'Maintenance Schedule', route: '/supporter/maintenance-schedule', icon: CalendarDays },
    { label: 'Vehicle Fleet', route: '/supporter/buses', icon: Truck },
  ];

  const isVehicleManagementModule =
    !isDashboard &&
    !isCaptain &&
    !isSupporter &&
    (location.pathname.startsWith('/admin/vehicles') ||
      location.pathname.startsWith('/admin/buses') ||
      location.pathname.startsWith('/admin/vehicle-registration') ||
      location.pathname.startsWith('/admin/vehicle-management') ||
      location.pathname.startsWith('/admin/routes') ||
      location.pathname.startsWith('/admin/tasks') ||
      location.pathname.startsWith('/admin/organizers') ||
      location.pathname.startsWith('/admin/employee-registration') ||
      location.pathname.startsWith('/admin/employees') ||
      location.pathname.startsWith('/admin/drivers') ||
      location.pathname.startsWith('/admin/support-staff') ||
      location.pathname.startsWith('/admin/employee-payments') ||
      location.pathname.startsWith('/admin/earnings'));

  const isVehicleMaintenanceModule =
    !isDashboard &&
    !isCaptain &&
    !isSupporter &&
    (location.pathname.startsWith('/admin/mileage-fueling') ||
      location.pathname.startsWith('/admin/daily-kilometers') ||
      location.pathname.startsWith('/admin/daily-vehicle-checkup') ||
      location.pathname.startsWith('/admin/vehicle-checkup') ||
      location.pathname.startsWith('/admin/vehicle-maintenance') ||
      location.pathname.startsWith('/admin/tyre-maintenance') ||
      location.pathname.startsWith('/admin/products') ||
      location.pathname.startsWith('/admin/cleaning') ||
      location.pathname.startsWith('/admin/maintenance-schedule') ||
      location.pathname.startsWith('/admin/ac-maintenance') ||
      location.pathname.startsWith('/admin/oil-filter-maintenance') ||
      location.pathname.startsWith('/admin/battery-maintenance') ||
      location.pathname.startsWith('/admin/complaints') ||
      location.pathname.startsWith('/admin/repairs') ||
      location.pathname.startsWith('/admin/bus-condition'));

  const navItems = isCaptain
    ? captainNavItems
    : isSupporter
    ? supporterNavItems
    : isVehicleManagementModule
    ? vehicleManagementTabs
    : isVehicleMaintenanceModule
    ? vehicleMaintenanceTabs
    : adminNavItems;

  return (
    <>
      {/* Mobile/Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className={`fixed inset-0 bg-slate-900/60 z-40 ${isPinned ? 'lg:hidden' : 'block'} backdrop-blur-xs transition-opacity`}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200/90 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isPinned
            ? isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
            : isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        {/* Header / Brand Area */}
        <div className="p-4 border-b border-slate-100 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            {!isCollapsed && (
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                MANAGEMENT
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {/* Close Button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className={`${isPinned ? 'lg:hidden' : 'flex'} p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer`}
                title="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Desktop Collapse Button */}
              {isPinned && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Logo - Matches Image 1; Hidden when collapsed so only ONE logo shows on screen */}
          {!isCollapsed && (
            <div className="w-full flex items-center justify-center">
              <div className="w-full rounded-2xl bg-white flex items-center justify-center shadow-xs border-2 border-blue-400 px-3 py-2 max-w-full overflow-hidden hover:border-blue-500 transition-all">
                <img
                  src="/logo-compact.png"
                  alt="Charvik Staffing Consultancy"
                  className="max-h-[72px] h-[68px] w-auto object-contain transition-all duration-200"
                />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="w-full mt-2 flex items-center justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs tracking-wide ${
                isCaptain
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isSupporter
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isCaptain ? (
                  <>⚓ <span>Captain Portal</span></>
                ) : isSupporter ? (
                  <>🛠️ <span>Supporter Portal</span></>
                ) : (
                  <>🛡️ <span>Super Admin Portal</span></>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Dedicated Sub-Dashboard Back Button & Module Indicator */}
          {isVehicleManagementModule && (
            <div className="mb-2 space-y-1.5">
              <NavLink
                to="/admin/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#142B4A] transition-colors group border border-slate-200/60"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                {!isCollapsed && <span>Dashboard Overview</span>}
              </NavLink>

              {!isCollapsed && (
                <div className="px-3.5 py-2 flex items-center gap-2 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-[#142B4A]">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">Vehicle Management</span>
                </div>
              )}
            </div>
          )}

          {isVehicleMaintenanceModule && (
            <div className="mb-2 space-y-1.5">
              <NavLink
                to="/admin/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#142B4A] transition-colors group border border-slate-200/60"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                {!isCollapsed && <span>Dashboard Overview</span>}
              </NavLink>

              {!isCollapsed && (
                <div className="px-3.5 py-2 flex items-center gap-2 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-[#142B4A]">
                  <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">Vehicle Maintenance</span>
                </div>
              )}
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = item.activeRoutes
              ? item.activeRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + '/'))
              : location.pathname === item.route || location.pathname.startsWith(item.route + '/');

            const currentTab = new URLSearchParams(location.search).get('tab') || 'maintenance';
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const defaultExpanded = isItemActive && hasSubItems && !isCollapsed;
            const isSubMenuExpanded = hasSubItems && !isCollapsed && (subMenusOpen[item.route] !== undefined ? subMenusOpen[item.route] : defaultExpanded);

            return (
              <div key={item.route} className="space-y-1">
                <NavLink
                  to={item.route}
                  onClick={() => {
                    setIsMobileOpen(false);
                    if (hasSubItems) {
                      if (isItemActive) {
                        // Clicking active item toggles sub-menu
                        toggleSubMenu(item.route, isSubMenuExpanded);
                      } else {
                        // When navigating to it, ensure sub-menu is opened
                        setSubMenusOpen((prev) => ({ ...prev, [item.route]: true }));
                      }
                    }
                  }}
                  className={`flex items-center px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-150 group relative ${
                    isItemActive
                      ? 'bg-[#142B4A] text-white shadow-md shadow-[#142B4A]/25'
                      : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#142B4A]'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isItemActive ? 'text-white' : 'text-[#2563EB]'
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
                          ? 'bg-blue-500/30 text-blue-100 border border-blue-400/40'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      LIVE
                    </span>
                  )}

                  {/* Expand / Collapse Indicator Button */}
                  {!isCollapsed && hasSubItems && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSubMenu(item.route, isSubMenuExpanded);
                      }}
                      className={`p-1 -mr-1 rounded-lg transition-all cursor-pointer ${
                        isItemActive
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-slate-200/80 text-slate-500'
                      }`}
                      title={isSubMenuExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                      aria-label={isSubMenuExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isSubMenuExpanded ? 'rotate-180 text-white' : isItemActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  )}
                </NavLink>

                {/* Sub-items (Shows only when clicking Tyre Maintenance) */}
                {isSubMenuExpanded && (
                  <div className="mt-1 ml-3 pl-3 pr-2 py-1.5 border-l-2 border-blue-400/80 bg-blue-50/50 rounded-r-2xl space-y-1">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive =
                        (currentTab === 'maintenance' && (sub.route.includes('tab=maintenance') || sub.route === '/admin/tyre-maintenance' || sub.route === '/captain/tyre-maintenance')) ||
                        (currentTab === 'new_tyres' && sub.route.includes('tab=new_tyres')) ||
                        (currentTab === 'allotment_rotation' && sub.route.includes('tab=allotment_rotation'));

                      return (
                        <NavLink
                          key={sub.route}
                          to={sub.route}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSubActive
                              ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                              : 'text-slate-700 hover:text-blue-700 hover:bg-white/80'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 mr-2 shrink-0 ${isSubActive ? 'text-white' : 'text-blue-600'}`} />
                          <span className="truncate flex-1">{sub.label}</span>
                          {isSubActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white ml-1.5 shrink-0" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Area: View Public Website & User Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0 space-y-2">
          {!isCollapsed && (
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-xs transition-all text-xs font-bold text-slate-800 group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#2563EB] group-hover:scale-110 transition-transform" />
                <span>View Public Website</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* User Profile info if available */}
          {!isCollapsed && user && (
            <div className="px-3 py-2 bg-white rounded-xl flex items-center space-x-2.5 border border-slate-200 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
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
                ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold'
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
                ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold'
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
                ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold'
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
                ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold'
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
