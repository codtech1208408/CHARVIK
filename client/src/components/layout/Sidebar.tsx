import React, { useState, useEffect } from 'react';
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
  RotateCw,
  History,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ALL_MODULE_CATEGORIES, ALL_CATEGORY_NAMES } from '../../constants/moduleCategories';

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
  const DEFAULT_OPERATOR_CATEGORIES = ['Route Management', 'Task Management', 'AC Maintenance'];
  const [operatorCategories, setOperatorCategories] = useState<string[]>(DEFAULT_OPERATOR_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    api.getStaffCredentials().then((list) => {
      if (!isMounted) return;
      const op = (list || []).find((s: any) => (s.role === 'Support Staff' || s.role === 'Operator') && s.status === 'Active') ||
        (list || []).find((s: any) => s.role === 'Support Staff' || s.role === 'Operator');
      if (op) {
        let cats: string[] = [];
        if (Array.isArray(op.categories)) {
          cats = op.categories;
        } else if (typeof op.categories === 'string') {
          try {
            const parsed = JSON.parse(op.categories);
            if (Array.isArray(parsed)) cats = parsed;
          } catch { }
        }
        if (cats.length > 0) {
          setOperatorCategories(cats);
        }
      }
    }).catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const toggleSubMenu = (route: string, currentExpanded: boolean) => {
    setSubMenusOpen((prev) => ({
      ...prev,
      [route]: !currentExpanded
    }));
  };

  const isCaptain = location.pathname.startsWith('/captain');
  const isOperator = location.pathname.startsWith('/operator') || location.pathname.startsWith('/supporter');
  const isDashboard =
    location.pathname.endsWith('/dashboard') ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/captain' ||
    location.pathname === '/captain/' ||
    location.pathname === '/operator' ||
    location.pathname === '/operator/' ||
    location.pathname === '/supporter' ||
    location.pathname === '/supporter/';

  const handleLogout = () => {
    logout();
    if (isCaptain) navigate('/captain/login');
    else if (isOperator) navigate('/operator/login');
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
    {
      label: 'Record',
      route: '/admin/records',
      icon: FileText,
      activeRoutes: ['/admin/records', '/admin/record-management', '/admin/record']
    },
    {
      label: 'Captain Audit Record',
      route: '/admin/captain-audit',
      icon: ShieldCheck,
      activeRoutes: ['/admin/captain-audit', '/captain/audit-record']
    },
  ];

  const vehicleMaintenanceTabs: NavItemLeaf[] = [
    {
      label: 'Daily Vehicle Checkup',
      route: '/admin/daily-vehicle-checkup',
      icon: ClipboardCheck,
      activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/vehicle-checkup', '/admin/bus-condition']
    },
    {
      label: 'Daily Maintenance',
      route: '/admin/daily-maintenance',
      icon: CalendarCheck,
      activeRoutes: ['/admin/daily-maintenance']
    },
    {
      label: 'New Tyres',
      route: '/admin/new-tyres',
      icon: Disc,
      activeRoutes: ['/admin/new-tyres', '/admin/tyres/new']
    },
    {
      label: 'Product Management',
      route: '/admin/products',
      icon: Package,
      activeRoutes: ['/admin/products', '/admin/product-management']
    }
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
        '/admin/earnings',
        '/admin/records',
        '/admin/captain-audit'
      ]
    },
    {
      label: 'Vehicle Maintenance',
      route: '/admin/vehicle-maintenance',
      icon: Wrench,
      activeRoutes: [
        '/admin/vehicle-maintenance',
        '/admin/daily-vehicle-checkup',
        '/admin/vehicle-checkup',
        '/admin/bus-condition',
        '/admin/daily-maintenance',
        '/admin/new-tyres',
        '/admin/tyres/new',
        '/admin/products',
        '/admin/product-management'
      ]
    },
    {
      label: 'Vyshnavi Travels',
      route: '/admin/vyshnavi-travels',
      icon: Bus,
      activeRoutes: ['/admin/vyshnavi-travels', '/admin/vyshnavi']
    },
    {
      label: 'Website Inquiries',
      route: '/admin/inquiries',
      icon: Bell,
      activeRoutes: ['/admin/inquiries']
    },
    {
      label: 'Audit Log',
      route: '/admin/audit-log',
      icon: History,
      hasLiveBadge: true,
      activeRoutes: ['/admin/audit-log']
    },
  ];

  const captainNavItems: NavItemLeaf[] = [
    { label: 'Dashboard', route: '/captain/dashboard', icon: LayoutGrid, hasLiveBadge: true },
    { label: 'Captain Audit Record', route: '/captain/audit-record', icon: ShieldCheck, activeRoutes: ['/captain/audit-record'] },
    { label: 'Vehicle Management', route: '/captain/buses', icon: Truck },
    { label: 'Mileage & Fueling', route: '/captain/daily-kilometers', icon: Fuel },
    {
      label: 'Tyre Maintenance',
      route: '/captain/tyre-maintenance',
      icon: CircleDot,
      activeRoutes: ['/captain/tyre-maintenance']
    },
    { label: 'Battery Check', route: '/captain/battery-maintenance', icon: BatteryCharging },
  ];

  const DEFAULT_OPERATOR = {
    id: 7,
    name: 'NEELAM HARISH',
    email: 'harish@charvik.com',
    role: 'Operator',
    categories: ['Route Management', 'Task Management', 'AC Maintenance']
  };

  const DEFAULT_ADMIN = {
    id: 1,
    name: 'Admin Manager',
    email: 'admin@charvik.com',
    role: 'Super Admin',
    categories: ALL_CATEGORY_NAMES
  };

  const activeUser = (() => {
    if (isOperator) {
      if (user && (user.role.toLowerCase().includes('operator') || user.role.toLowerCase().includes('support'))) {
        return user;
      }
      try {
        const s = localStorage.getItem('charvik_user');
        const parsed = s ? JSON.parse(s) : null;
        if (parsed && (parsed.role.toLowerCase().includes('operator') || parsed.role.toLowerCase().includes('support'))) {
          return parsed;
        }
      } catch { }
      return DEFAULT_OPERATOR;
    }
    if (isCaptain) {
      if (user && user.role.toLowerCase().includes('captain')) {
        return user;
      }
      try {
        const s = localStorage.getItem('charvik_user');
        const parsed = s ? JSON.parse(s) : null;
        if (parsed && parsed.role.toLowerCase().includes('captain')) {
          return parsed;
        }
      } catch { }
      return { id: 2, name: 'Captain Lead', email: 'captain@charvik.com', role: 'Captain' };
    }
    if (user && user.role.toLowerCase().includes('admin')) {
      return user;
    }
    try {
      const s = localStorage.getItem('charvik_user');
      const parsed = s ? JSON.parse(s) : null;
      if (parsed && parsed.role.toLowerCase().includes('admin')) {
        return parsed;
      }
    } catch { }
    return DEFAULT_ADMIN;
  })();

  const userRole = (activeUser?.role || '').toLowerCase();
  const isAdmin = !isOperator && !isCaptain && userRole.includes('admin');
  const isOperatorUser = isOperator || userRole.includes('support') || userRole.includes('operator') || userRole.includes('manager');
  const isCaptainUser = isCaptain || userRole.includes('captain');

  const parseCategoriesList = (cat: any): string[] => {
    if (Array.isArray(cat)) {
      return cat.map((c) => String(c || '').trim()).filter(Boolean);
    }
    if (typeof cat === 'string') {
      try {
        const parsed = JSON.parse(cat);
        if (Array.isArray(parsed)) {
          return parsed.map((c) => String(c || '').trim()).filter(Boolean);
        }
      } catch { }
    }
    return [];
  };

  // When on Operator portal (/operator/* or /supporter/*), ALWAYS strictly show only Operator's categories!
  // If user is Operator, use their categories. If Admin is viewing Operator portal, use operatorCategories.
  // NEVER show Admin's all 9 categories in the Operator portal!
  let userCategoryNames: string[] = [];
  if (isOperator) {
    if (!isAdmin && activeUser?.categories) {
      userCategoryNames = parseCategoriesList(activeUser.categories);
    }
    if (userCategoryNames.length === 0 && operatorCategories.length > 0) {
      userCategoryNames = parseCategoriesList(operatorCategories);
    }
    if (userCategoryNames.length === 0) {
      userCategoryNames = DEFAULT_OPERATOR_CATEGORIES;
    }
  } else {
    // Admin or Captain Portal
    if (activeUser?.categories) {
      userCategoryNames = parseCategoriesList(activeUser.categories);
    }
    if (userCategoryNames.length === 0) {
      userCategoryNames = ALL_CATEGORY_NAMES;
    }
  }

  // Filter module tabs to strictly those allowed for this operator
  const operatorPermittedTabs: NavItemLeaf[] = ALL_MODULE_CATEGORIES
    .filter((cat) => {
      return userCategoryNames.some(
        (assigned) => assigned.toLowerCase() === cat.name.trim().toLowerCase()
      );
    })
    .map((cat) => ({
      label: cat.name,
      route: isOperator && cat.id === 'task_management' ? '/operator/tasks' : cat.route,
      icon: cat.icon,
      activeRoutes: cat.id === 'task_management' ? ['/admin/tasks', '/operator/tasks'] : cat.activeRoutes
    }));

  const supporterNavItems: NavItemLeaf[] = [
    { label: 'Operator Dashboard', route: '/operator/dashboard', icon: ShieldCheck, hasLiveBadge: true },
    {
      label: 'Employee Registration',
      route: '/operator/employee-registration',
      icon: UserPlus,
      activeRoutes: ['/operator/employee-registration', '/operator/employees', '/supporter/employee-registration', '/supporter/employees']
    },
    ...operatorPermittedTabs
  ];

  const isVehicleManagementModule =
    !isDashboard &&
    !isCaptain &&
    !isOperator &&
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
      location.pathname.startsWith('/admin/earnings') ||
      location.pathname.startsWith('/admin/records') ||
      location.pathname.startsWith('/admin/captain-audit'));

  const isVehicleMaintenanceModule =
    !isDashboard &&
    !isCaptain &&
    !isOperator &&
    (location.pathname.startsWith('/admin/daily-maintenance') ||
      location.pathname.startsWith('/admin/new-tyres') ||
      location.pathname.startsWith('/admin/tyres/new') ||
      location.pathname.startsWith('/admin/vehicle-maintenance') ||
      location.pathname.startsWith('/admin/daily-vehicle-checkup') ||
      location.pathname.startsWith('/admin/vehicle-checkup') ||
      location.pathname.startsWith('/admin/bus-condition') ||
      location.pathname.startsWith('/admin/mileage-fueling') ||
      location.pathname.startsWith('/admin/daily-kilometers') ||
      location.pathname.startsWith('/admin/tyre-maintenance') ||
      location.pathname.startsWith('/admin/products') ||
      location.pathname.startsWith('/admin/product-management') ||
      location.pathname.startsWith('/admin/cleaning') ||
      location.pathname.startsWith('/admin/maintenance-schedule') ||
      location.pathname.startsWith('/admin/ac-maintenance') ||
      location.pathname.startsWith('/admin/oil-filter-maintenance') ||
      location.pathname.startsWith('/admin/battery-maintenance') ||
      location.pathname.startsWith('/admin/complaints') ||
      location.pathname.startsWith('/admin/repairs'));

  const isOperatorPortal = isOperator;
  const showOperatorNav = isOperatorPortal || (isOperatorUser && !isAdmin);
  const showCaptainNav = isCaptain || (isCaptainUser && !isAdmin);

  const navItems = showCaptainNav
    ? captainNavItems
    : showOperatorNav
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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200/90 shadow-2xl ${isCollapsed ? 'w-20' : 'w-72'
          } ${isPinned
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
                  className="w-full h-auto max-h-[76px] object-contain transition-all duration-200"
                />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="w-full mt-2 flex items-center justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs tracking-wide ${isCaptain
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : isOperator
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                {isCaptain ? (
                  <>⚓ <span>Captain Portal</span></>
                ) : isOperatorPortal ? (
                  <>⚙️ <span>Operator Portal</span></>
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
                <NavLink
                  to="/admin/vehicle-maintenance"
                  onClick={() => setIsMobileOpen(false)}
                  className={`px-3.5 py-2.5 flex items-center justify-between rounded-2xl border transition-all cursor-pointer ${location.pathname.startsWith('/admin/vehicle-maintenance')
                      ? 'bg-[#142B4A] text-white border-[#142B4A] shadow-md shadow-[#142B4A]/25'
                      : 'bg-slate-100/80 border-slate-200/90 text-[#142B4A] hover:bg-slate-200/80'
                    }`}
                  title="Vehicle Maintenance Overview"
                >
                  <div className="flex items-center gap-2">
                    <Wrench
                      className={`w-4 h-4 shrink-0 ${location.pathname.startsWith('/admin/vehicle-maintenance') ? 'text-white' : 'text-[#142B4A]'
                        }`}
                    />
                    <span className="text-xs font-black uppercase tracking-wider">Vehicle Maintenance</span>
                  </div>
                  {location.pathname.startsWith('/admin/vehicle-maintenance') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white ml-1.5 shrink-0" />
                  )}
                </NavLink>
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
                  className={`flex items-center px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-150 group relative ${isItemActive
                    ? 'bg-[#142B4A] text-white shadow-md shadow-[#142B4A]/25'
                    : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#142B4A]'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isItemActive ? 'text-white' : 'text-[#2563EB]'
                      } ${isCollapsed ? '' : 'mr-3'}`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                  )}

                  {/* LIVE Badge on Dashboard */}
                  {!isCollapsed && item.hasLiveBadge && (
                    <span
                      className={`ml-auto px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${isItemActive
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
                      className={`p-1 -mr-1 rounded-lg transition-all cursor-pointer ${isItemActive
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-slate-200/80 text-slate-500'
                        }`}
                      title={isSubMenuExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                      aria-label={isSubMenuExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isSubMenuExpanded ? 'rotate-180 text-white' : isItemActive ? 'text-white' : 'text-slate-400'
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
                          className={`flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isSubActive
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
          {/* Admin shortcut: View Operator Dashboard vs Return to Admin Dashboard */}
          {isAdmin && !isCollapsed && (
            isOperatorPortal ? (
              <Link
                to="/admin/dashboard"
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all text-xs font-bold group cursor-pointer"
                title="Return to the Main Admin Dashboard"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
                  <span>Return to Admin Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </Link>
            ) : (
              <Link
                to="/operator/dashboard"
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:border-blue-500 hover:bg-blue-100/70 hover:shadow-xs transition-all text-xs font-bold text-blue-900 group cursor-pointer"
                title="Open Operator Dashboard to inspect real-time staff operations"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB] group-hover:scale-110 transition-transform" />
                  <span>View Operator Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )
          )}

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
          {!isCollapsed && activeUser && (
            <div className="px-3 py-2 bg-white rounded-xl flex items-center space-x-2.5 border border-slate-200 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {(activeUser.name || 'Admin').slice(0, 2)}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{activeUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">{activeUser.role}</p>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${isCollapsed ? 'justify-center' : ''
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
          to={isCaptain ? '/captain/dashboard' : isOperator ? '/operator/dashboard' : '/admin/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive
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
          to={isCaptain ? '/captain/buses' : isOperator ? '/operator/employee-registration' : '/admin/employee-registration'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive
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
          to={isCaptain ? '/captain/buses' : isOperator ? '/operator/buses' : '/admin/vehicles'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive
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
          to={isCaptain ? '/captain/daily-kilometers' : isOperator ? '/operator/daily-kilometers' : '/admin/mileage-fueling'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive
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
