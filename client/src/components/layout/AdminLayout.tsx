import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  Truck,
  Navigation,
  ClipboardList,
  Building2,
  UserPlus,
  Fuel,
  CircleDot,
  Package,
  Droplets,
  Bus,
  Wrench
} from 'lucide-react';
import AOS from 'aos';

const registrationTabs = [
  { label: 'Vehicle Management', route: '/admin/vehicles', icon: Truck },
  { label: 'Route Management', route: '/admin/routes', icon: Navigation },
  { label: 'Task Management', route: '/admin/tasks', icon: ClipboardList },
  { label: 'Organizer Management', route: '/admin/organizers', icon: Building2 },
  { label: 'Employee Registration', route: '/admin/employee-registration', icon: UserPlus },
];

const maintenanceTabs = [
  { label: 'Mileage & Fueling', route: '/admin/mileage-fueling', icon: Fuel },
  { label: 'Tyre Maintenance', route: '/admin/tyre-maintenance', icon: CircleDot },
  { label: 'Product Management', route: '/admin/products', icon: Package },
  { label: 'Cleaning Management', route: '/admin/cleaning', icon: Droplets },
];

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [location.pathname]);

  // Synchronous fallback from localStorage to guarantee zero-flicker and eliminate refresh logout
  const activeUser = user || (function() {
    try {
      const s = localStorage.getItem('charvik_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const isUserAuthenticated = isAuthenticated || !!activeUser;

  if (loading && !isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#142B4A]">Loading Charvik Fleet Management...</p>
        </div>
      </div>
    );
  }

  const isCaptainPortal = location.pathname.startsWith('/captain');
  const isSupporterPortal = location.pathname.startsWith('/supporter');
  const isAdminPortal = location.pathname.startsWith('/admin');

  if (!isUserAuthenticated) {
    if (isCaptainPortal) return <Navigate to="/captain/login" replace />;
    if (isSupporterPortal) return <Navigate to="/supporter/login" replace />;
    return <Navigate to="/admin/login" replace />;
  }

  // Strict Role-Based Access Guard
  const userRole = (activeUser?.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin');
  const isCaptain = userRole.includes('captain');
  const isSupporter = userRole.includes('support') || userRole.includes('helper');

  // Admin Portal: Only Admin accounts can access
  if (isAdminPortal && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Captain Portal: Only Captain accounts can access
  if (isCaptainPortal && !isCaptain) {
    return <Navigate to="/captain/login" replace />;
  }

  // Supporter Portal: Only Support/Helper accounts can access
  if (isSupporterPortal && !isSupporter) {
    return <Navigate to="/supporter/login" replace />;
  }

  // Determine current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) {
      if (isCaptainPortal) return 'Captain Route & Fleet Overview';
      if (isSupporterPortal) return 'Supporter Operational Dashboard';
      return 'Dashboard';
    }
    if (p.includes('/vehicles') || p.includes('/buses')) return isCaptainPortal ? 'Vehicle Management' : isSupporterPortal ? 'Fleet Overview' : 'Vehicle Management';
    if (p.includes('/mileage-fueling') || p.includes('/daily-kilometers')) return 'Mileage & Fueling';
    if (p.includes('/tyre-maintenance')) return 'Tyre Maintenance';
    if (p.includes('/products')) return 'Product Management';
    if (p.includes('/cleaning')) return 'Cleaning Management';
    if (p.includes('/routes')) return 'Route Management';
    if (p.includes('/organizers')) return 'Organizer Management';
    if (p.includes('/tasks')) return 'Task Management';
    if (p.includes('/employee-registration') || p.includes('/employees') || p.includes('/drivers/new') || p.includes('/support-staff/new')) return 'Employee Registration';
    if (p.includes('/earnings')) return 'Earnings';
    if (p.includes('/inquiries')) return 'Website Inquiries';
    if (p.includes('/maintenance-schedule')) return 'Maintenance Schedule';
    if (p.includes('/ac-maintenance')) return 'AC Maintenance';
    if (p.includes('/oil-filter-maintenance')) return 'Oil & Filter Replacement';
    if (p.includes('/battery-maintenance')) return 'Battery Health & Inspection';
    if (p.includes('/complaints')) return isCaptainPortal ? 'Complaints & Defects' : isSupporterPortal ? 'Bus Complaints & Issues' : 'Complaints';
    if (p.includes('/repairs')) return 'Repairs & Service';
    if (p.includes('/bus-condition')) return isSupporterPortal ? 'Cleaning Management' : 'Bus Condition Inspection';
    if (p.includes('/reports')) return 'Fleet & Operational Reports';
    if (p.includes('/settings')) return 'Application & System Settings';
    return isCaptainPortal ? 'Captain Portal' : isSupporterPortal ? 'Supporter Portal' : 'Admin Panel';
  };

  const isDashboard =
    location.pathname.endsWith('/dashboard') ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/captain' ||
    location.pathname === '/captain/' ||
    location.pathname === '/supporter' ||
    location.pathname === '/supporter/';

  const isRegistrationModule = registrationTabs.some(
    (t) =>
      location.pathname === t.route ||
      (t.route === '/admin/vehicles' && location.pathname === '/admin/buses') ||
      (t.route === '/admin/employee-registration' && location.pathname === '/admin/employees')
  );

  const isMaintenanceModule = maintenanceTabs.some(
    (t) =>
      location.pathname === t.route ||
      (t.route === '/admin/mileage-fueling' && location.pathname === '/admin/daily-kilometers')
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Sidebar - Pinned only on Dashboard; hidden into off-canvas drawer on any tab page */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isPinned={isDashboard}
      />

      {/* Main Content Area - Full screen width (pl-0) when on any tab */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isDashboard ? (isCollapsed ? 'lg:pl-20' : 'lg:pl-72') : 'pl-0 lg:pl-0'
        }`}
      >
        <Navbar
          onMobileToggle={() => setIsMobileOpen(true)}
          pageTitle={getPageTitle()}
        />

        {/* Module Sub-Tabs Bar: Vehicle Registration */}
        {isAdminPortal && isRegistrationModule && (
          <div className="bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider shrink-0 mr-1 sm:mr-3">
              <Bus className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Vehicle Registration:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {registrationTabs.map((tab) => {
                const isTabActive =
                  location.pathname === tab.route ||
                  (tab.route === '/admin/vehicles' && location.pathname === '/admin/buses') ||
                  (tab.route === '/admin/employee-registration' && location.pathname === '/admin/employees');
                const TabIcon = tab.icon;

                return (
                  <NavLink
                    key={tab.route}
                    to={tab.route}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isTabActive
                        ? 'bg-[#142B4A] text-white shadow-xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-white' : 'text-blue-600'}`} />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Module Sub-Tabs Bar: Vehicle Maintenance */}
        {isAdminPortal && isMaintenanceModule && (
          <div className="bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider shrink-0 mr-1 sm:mr-3">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Vehicle Maintenance:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {maintenanceTabs.map((tab) => {
                const isTabActive =
                  location.pathname === tab.route ||
                  (tab.route === '/admin/mileage-fueling' && location.pathname === '/admin/daily-kilometers');
                const TabIcon = tab.icon;

                return (
                  <NavLink
                    key={tab.route}
                    to={tab.route}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isTabActive
                        ? 'bg-[#142B4A] text-white shadow-xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-white' : 'text-blue-600'}`} />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full ${isDashboard ? 'max-w-7xl' : 'max-w-[1920px]'} mx-auto pb-24 lg:pb-8`}>
          <ErrorBoundary fallbackTitle="Unable to Load Dashboard View">
            <Outlet />
          </ErrorBoundary>
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <p>© 2026 Charvik Staffing Consultancy. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Fleet System Online • v1.0 Production
          </p>
        </footer>
      </div>
    </div>
  );
};
