import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
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
  History,
  FileText,
  CalendarCheck,
  Gauge
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
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  isPinned?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = true,
  setIsCollapsed,
  isVisible = true,
  onToggleVisibility,
  isMobileOpen,
  setIsMobileOpen,
  isPinned = true,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const isCaptain = location.pathname.startsWith('/captain');
  const isOperator = location.pathname.startsWith('/operator') || location.pathname.startsWith('/supporter');

  const handleLogout = () => {
    logout();
    if (isCaptain) navigate('/captain/login');
    else if (isOperator) navigate('/operator/login');
    else navigate('/admin/login');
  };

  // =========================================================================
  // SUBTABS SPECIFICATIONS (Exact 1-to-1 match with all system pages)
  // =========================================================================

  // Admin Vehicle Management Subtabs (8 modules)
  const adminVehicleManagementSubItems: NavSubItem[] = [
    { label: 'Route Management', route: '/admin/routes', icon: Navigation, activeRoutes: ['/admin/routes'] },
    { label: 'Task Management', route: '/admin/tasks', icon: ClipboardList, activeRoutes: ['/admin/tasks'] },
    { label: 'Organizer Management', route: '/admin/organizers', icon: Building2, activeRoutes: ['/admin/organizers'] },
    { label: 'Employee Registration', route: '/admin/employee-registration', icon: UserPlus, activeRoutes: ['/admin/employee-registration', '/admin/employees', '/admin/drivers', '/admin/support-staff'] },
    { label: 'Employee Payments', route: '/admin/employee-payments', icon: IndianRupee, activeRoutes: ['/admin/employee-payments'] },
    { label: 'Earnings', route: '/admin/earnings', icon: TrendingUp, activeRoutes: ['/admin/earnings'] },
    { label: 'Record Management', route: '/admin/records', icon: FileText, activeRoutes: ['/admin/records', '/admin/record-management', '/admin/record'] },
    { label: 'Captain Audit Record', route: '/admin/captain-audit', icon: ShieldCheck, activeRoutes: ['/admin/captain-audit', '/captain/audit-record'] },
  ];

  // Admin Vehicle Maintenance Subtabs (Exact match to the 6 tabs from before!)
  const adminVehicleMaintenanceSubItems: NavSubItem[] = [
    { label: 'Fleet Maintenance Overview', route: '/admin/vehicle-maintenance', icon: Gauge, activeRoutes: ['/admin/vehicle-maintenance'] },
    { label: 'Vehicle Registration', route: '/admin/vehicles', icon: Bus, activeRoutes: ['/admin/vehicles', '/admin/buses', '/admin/vehicle-registration', '/admin/vehicle-management'] },
    { label: 'Daily Vehicle Checkup', route: '/admin/daily-vehicle-checkup', icon: ClipboardCheck, activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/vehicle-checkup', '/admin/bus-condition'] },
    { label: 'Daily Maintenance', route: '/admin/daily-maintenance', icon: CalendarCheck, activeRoutes: ['/admin/daily-maintenance'] },
    { label: 'New Tyres', route: '/admin/new-tyres', icon: Disc, activeRoutes: ['/admin/new-tyres', '/admin/tyres/new'] },
    { label: 'Product Management', route: '/admin/products', icon: Package, activeRoutes: ['/admin/products', '/admin/product-management'] },
  ];

  // Admin Vyshnavi Travels Subtabs
  const adminVyshnaviTravelsSubItems: NavSubItem[] = [
    { label: 'Travels Statement & Billing', route: '/admin/vyshnavi-travels', icon: FileText, activeRoutes: ['/admin/vyshnavi-travels', '/admin/vyshnavi'] },
    { label: 'Service Records', route: '/admin/vyshnavi-travels?tab=records', icon: ClipboardList, activeRoutes: ['/admin/vyshnavi-travels?tab=records'] },
    { label: 'Operator Income & Expense', route: '/admin/income-expense', icon: IndianRupee, activeRoutes: ['/admin/income-expense'] },
  ];

  // Operator Subtabs
  const operatorDutySubItems: NavSubItem[] = [
    { label: 'Task Management', route: '/operator/tasks', icon: ClipboardList, activeRoutes: ['/operator/tasks', '/admin/tasks'] },
    { label: 'Route Operations', route: '/admin/routes', icon: Navigation, activeRoutes: ['/admin/routes'] },
  ];

  const operatorFleetSubItems: NavSubItem[] = [
    { label: 'Daily Vehicle Checkup', route: '/operator/bus-condition', icon: ClipboardCheck, activeRoutes: ['/operator/bus-condition', '/admin/daily-vehicle-checkup', '/admin/bus-condition'] },
    { label: 'Daily Kilometers & Fuel', route: '/operator/daily-kilometers', icon: Fuel, activeRoutes: ['/operator/daily-kilometers', '/admin/daily-kilometers'] },
    { label: 'Maintenance Schedule', route: '/operator/maintenance-schedule', icon: CalendarDays, activeRoutes: ['/operator/maintenance-schedule', '/admin/maintenance-schedule'] },
    { label: 'Complaints & Defects', route: '/operator/complaints', icon: AlertTriangle, activeRoutes: ['/operator/complaints', '/admin/complaints'] },
    { label: 'Repair Work Orders', route: '/operator/repairs', icon: Wrench, activeRoutes: ['/operator/repairs', '/admin/repairs'] },
    { label: 'Registered Buses', route: '/operator/buses', icon: Bus, activeRoutes: ['/operator/buses', '/admin/buses', '/admin/vehicles'] },
  ];

  const operatorStaffSubItems: NavSubItem[] = [
    { label: 'Employee Registration', route: '/operator/employee-registration', icon: UserPlus, activeRoutes: ['/operator/employee-registration', '/operator/employees', '/supporter/employee-registration', '/supporter/employees'] },
    { label: 'Captain Audit Record', route: '/operator/captain-audit', icon: ShieldCheck, activeRoutes: ['/operator/captain-audit', '/operator/audit-record', '/admin/captain-audit'] },
  ];

  // Captain Subtabs
  const captainAuditSubItems: NavSubItem[] = [
    { label: 'Duty Audit Record', route: '/captain/audit-record', icon: ShieldCheck, activeRoutes: ['/captain/audit-record', '/captain/captain-audit'] },
  ];

  const captainFleetSubItems: NavSubItem[] = [
    { label: 'Mileage & Fueling', route: '/captain/daily-kilometers', icon: Fuel, activeRoutes: ['/captain/daily-kilometers'] },
    { label: 'Bus Condition Inspection', route: '/captain/bus-condition', icon: ClipboardCheck, activeRoutes: ['/captain/bus-condition'] },
    { label: 'Fleet Buses', route: '/captain/buses', icon: Bus, activeRoutes: ['/captain/buses'] },
  ];

  const captainMaintenanceSubItems: NavSubItem[] = [
    { label: 'Tyre Maintenance', route: '/captain/tyre-maintenance', icon: CircleDot, activeRoutes: ['/captain/tyre-maintenance'] },
    { label: 'Battery Check', route: '/captain/battery-maintenance', icon: BatteryCharging, activeRoutes: ['/captain/battery-maintenance'] },
    { label: 'Maintenance Schedule', route: '/captain/maintenance-schedule', icon: CalendarDays, activeRoutes: ['/captain/maintenance-schedule'] },
    { label: 'Complaints & Defects', route: '/captain/complaints', icon: AlertTriangle, activeRoutes: ['/captain/complaints'] },
  ];

  // =========================================================================
  // MAIN NAVIGATION TABS (Settings removed per user request!)
  // =========================================================================

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
      route: '/admin/routes',
      icon: Truck,
      activeRoutes: [
        '/admin/routes',
        '/admin/tasks',
        '/admin/organizers',
        '/admin/employee-registration',
        '/admin/employees',
        '/admin/drivers',
        '/admin/support-staff',
        '/admin/employee-payments',
        '/admin/earnings',
        '/admin/records',
        '/admin/record-management',
        '/admin/record',
        '/admin/captain-audit',
        '/admin/captain-audit-record'
      ],
      subItems: adminVehicleManagementSubItems
    },
    {
      label: 'Vehicle Maintenance',
      route: '/admin/vehicle-maintenance',
      icon: Wrench,
      activeRoutes: [
        '/admin/vehicle-maintenance',
        '/admin/vehicles',
        '/admin/buses',
        '/admin/vehicle-registration',
        '/admin/vehicle-management',
        '/admin/daily-vehicle-checkup',
        '/admin/vehicle-checkup',
        '/admin/bus-condition',
        '/admin/daily-maintenance',
        '/admin/new-tyres',
        '/admin/tyres/new',
        '/admin/products',
        '/admin/product-management'
      ],
      subItems: adminVehicleMaintenanceSubItems
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
    {
      label: 'Income & Expense',
      route: '/admin/income-expense',
      icon: IndianRupee,
      activeRoutes: ['/admin/income-expense', '/admin/income-and-expense']
    }
  ];

  const captainNavItems: NavItemLeaf[] = [
    { label: 'Dashboard', route: '/captain/dashboard', icon: LayoutGrid, hasLiveBadge: true, activeRoutes: ['/captain/dashboard'] },
    {
      label: 'Audit Record',
      route: '/captain/audit-record',
      icon: ShieldCheck,
      activeRoutes: ['/captain/audit-record', '/captain/captain-audit'],
      subItems: captainAuditSubItems
    },
    {
      label: 'Vehicle Ops',
      route: '/captain/daily-kilometers',
      icon: Truck,
      activeRoutes: ['/captain/daily-kilometers', '/captain/bus-condition', '/captain/buses'],
      subItems: captainFleetSubItems
    },
    {
      label: 'Maintenance',
      route: '/captain/tyre-maintenance',
      icon: Wrench,
      activeRoutes: ['/captain/tyre-maintenance', '/captain/battery-maintenance', '/captain/maintenance-schedule', '/captain/complaints'],
      subItems: captainMaintenanceSubItems
    }
  ];

  const supporterNavItems: NavItemLeaf[] = [
    { label: 'Dashboard', route: '/operator/dashboard', icon: ShieldCheck, hasLiveBadge: true, activeRoutes: ['/operator/dashboard', '/supporter/dashboard'] },
    {
      label: 'Duty & Tasks',
      route: '/operator/tasks',
      icon: ClipboardList,
      activeRoutes: ['/operator/tasks', '/admin/routes'],
      subItems: operatorDutySubItems
    },
    {
      label: 'Maintenance',
      route: '/operator/bus-condition',
      icon: Truck,
      activeRoutes: ['/operator/bus-condition', '/operator/daily-kilometers', '/operator/maintenance-schedule', '/operator/complaints', '/operator/repairs', '/operator/buses'],
      subItems: operatorFleetSubItems
    },
    {
      label: 'Staff & Audit',
      route: '/operator/employee-registration',
      icon: Users,
      activeRoutes: ['/operator/employee-registration', '/operator/employees', '/operator/captain-audit', '/operator/audit-record'],
      subItems: operatorStaffSubItems
    }
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

  const isOperatorPortal = isOperator;
  const showOperatorNav = isOperatorPortal || (isOperatorUser && !isAdmin);
  const showCaptainNav = isCaptain || (isCaptainUser && !isAdmin);

  const navItems = showCaptainNav
    ? captainNavItems
    : showOperatorNav
      ? supporterNavItems
      : adminNavItems;

  // Active status helper
  const isTabActive = (item: NavItemLeaf) => {
    if (item.activeRoutes && item.activeRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + '/'))) {
      return true;
    }
    if (location.pathname === item.route || location.pathname.startsWith(item.route + '/')) {
      return true;
    }
    if (item.subItems) {
      return item.subItems.some((sub) => {
        if (sub.activeRoutes && sub.activeRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + '/'))) {
          return true;
        }
        const pureSub = sub.route.split('?')[0];
        return location.pathname === pureSub;
      });
    }
    return false;
  };

  const isSubActive = (sub: NavSubItem) => {
    if (sub.activeRoutes && sub.activeRoutes.some((r) => {
      const pureR = r.split('?')[0];
      return location.pathname === pureR || location.pathname.startsWith(pureR + '/');
    })) {
      return true;
    }
    const pureRoute = sub.route.split('?')[0];
    if (sub.route.includes('?')) {
      const query = sub.route.split('?')[1];
      return location.pathname === pureRoute && location.search.includes(query);
    }
    return location.pathname === pureRoute;
  };

  // Track inline expanded state of tabs with sub-modules (ZERO popup box!)
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    return initial;
  });

  // Auto-expand on navigation
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems && isTabActive(item)) {
        setExpandedTabs((prev) => ({ ...prev, [item.route]: true }));
      }
    });
  }, [location.pathname, location.search]);

  // Click handler: toggles subtabs inline directly inside the sidebar (ZERO floating popup box!)
  const handleTabClick = (e: React.MouseEvent, item: NavItemLeaf) => {
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    if (!hasSubItems) {
      if (window.innerWidth < 1024) setIsMobileOpen(false);
      navigate(item.route);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Toggle inline subtabs under the clicked tab
    setExpandedTabs((prev) => ({
      ...prev,
      [item.route]: !prev[item.route]
    }));
  };

  return (
    <>
      {/* Mobile/Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className={`fixed inset-0 bg-slate-900/60 z-40 ${isPinned ? 'lg:hidden' : 'block'} backdrop-blur-xs transition-opacity`}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer - Full sidebar matching Image 3 / Image 4 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200/90 shadow-xl w-64 ${
          isMobileOpen
            ? 'translate-x-0'
            : isVisible
              ? 'translate-x-0'
              : '-translate-x-full'
        }`}
      >
        {/* Mobile Close Button (shown only on mobile drawer) */}
        {isMobileOpen && (
          <div className="lg:hidden p-2.5 border-b border-slate-100 flex items-center justify-end">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header - Three Lines (Hamburger Toggle Button) directly above Dashboard */}
        <div className="h-[128px] flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              } else {
                onToggleVisibility?.();
              }
            }}
            className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-xs"
            title="Hide Navigation Sidebar"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5 text-[#142B4A]" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
        </div>

        {/* Navigation Items List (Matching Image 4: horizontal icon + title + right chevron / LIVE badge) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item);
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isExpanded = Boolean(hasSubItems && expandedTabs[item.route]);

            return (
              <div key={item.route} className="space-y-1">
                {/* Main Item Row */}
                <div
                  onClick={(e) => handleTabClick(e, item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-150 group cursor-pointer ${
                    active
                      ? 'bg-[#142B4A] text-white shadow-md shadow-[#142B4A]/25'
                      : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#142B4A]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                        active ? 'text-white' : 'text-[#2563EB]'
                      }`}
                    />
                    <span className="truncate tracking-tight">{item.label}</span>
                  </div>

                  {/* Badges / Chevrons */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.hasLiveBadge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                          active
                            ? 'bg-blue-500/30 text-blue-100 border border-blue-400/40'
                            : item.label === 'Audit Log'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        LIVE
                      </span>
                    )}

                    {hasSubItems && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded
                            ? 'rotate-90 ' + (active ? 'text-white' : 'text-[#2563EB]')
                            : active
                              ? 'text-white'
                              : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Inline Subtabs List (NO floating popup/box!) */}
                {hasSubItems && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 py-1 space-y-1 border-l-2 border-blue-400/70 animate-fadeIn">
                    {item.subItems?.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = isSubActive(sub);

                      return (
                        <NavLink
                          key={sub.route}
                          to={sub.route}
                          onClick={() => {
                            if (window.innerWidth < 1024) setIsMobileOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            subActive
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-[#142B4A] hover:bg-blue-50/80'
                          }`}
                        >
                          <SubIcon
                            className={`w-4 h-4 shrink-0 ${
                              subActive ? 'text-white' : 'text-[#2563EB]'
                            }`}
                          />
                          <span className="truncate">{sub.label}</span>
                          {subActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0" />
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

        {/* Footer Area: Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0 space-y-2">
          {/* Admin shortcut: View Operator Dashboard vs Return to Admin Dashboard */}
          {isAdmin && (
            isOperatorPortal ? (
              <Link
                to="/admin/dashboard"
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all text-xs font-bold group cursor-pointer"
                title="Return to the Main Admin Dashboard"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span className="truncate">Admin Dashboard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
              </Link>
            ) : (
              <Link
                to="/operator/dashboard"
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-xs font-bold text-blue-900 group cursor-pointer shadow-xs"
                title="Open Operator Dashboard"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span className="truncate">Operator Portal</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              </Link>
            )
          )}

          {/* User Profile info if available */}
          {activeUser && (
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
            className="w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 mr-2.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex justify-around items-center">
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
