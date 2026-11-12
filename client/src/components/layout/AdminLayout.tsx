import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
import AOS from 'aos';
import { auditLogger } from '../../services/auditLogger';
import { ALL_CATEGORY_NAMES } from '../../constants/moduleCategories';

export const AdminLayout: React.FC = () => {
  // 1. ALL HOOKS CALLED UNCONDITIONALLY AT THE VERY TOP
  const { user, isAuthenticated, loading, setUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);

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

  const isCaptainPortal = location.pathname.startsWith('/captain');
  const isOperatorPortal = location.pathname.startsWith('/operator') || location.pathname.startsWith('/supporter');
  const isAdminPortal = location.pathname.startsWith('/admin') || (!isCaptainPortal && !isOperatorPortal);

  const DEFAULT_ADMIN = {
    id: 1,
    name: 'Admin Manager',
    email: 'admin@charvik.com',
    email_or_username: 'admin@charvik.com',
    role: 'Super Admin',
    categories: ALL_CATEGORY_NAMES
  };

  const DEFAULT_OPERATOR = {
    id: 7,
    name: 'NEELAM HARISH',
    email: 'neelam.harish@charvik.com',
    email_or_username: 'neelam.harish@charvik.com',
    role: 'Operator',
    categories: ['Route Management', 'Task Management', 'AC Maintenance']
  };

  const DEFAULT_CAPTAIN = {
    id: 2,
    name: 'Captain Lead',
    email: 'captain@charvik.com',
    email_or_username: 'captain@charvik.com',
    phone_number: '9701055555',
    role: 'Captain'
  };

  // Synchronous resolution guaranteeing that /admin opens Admin Dashboard and /operator opens Operator Dashboard
  const activeUser = (() => {
    try {
      const s = localStorage.getItem('charvik_user');
      const parsed = s ? JSON.parse(s) : null;
      if (parsed && parsed.role) {
        if (isOperatorPortal) {
          const isOp = parsed.role.toLowerCase().includes('operator') || parsed.role.toLowerCase().includes('support');
          if (isOp) return parsed;
          localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_OPERATOR));
          localStorage.setItem('charvik_token', 'charvik_cloud_token_operator_session');
          return DEFAULT_OPERATOR;
        }
        if (isCaptainPortal) {
          const isCap = parsed.role.toLowerCase().includes('captain');
          if (isCap) return parsed;
          localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_CAPTAIN));
          localStorage.setItem('charvik_token', 'charvik_cloud_token_captain_session');
          return DEFAULT_CAPTAIN;
        }
        if (isAdminPortal) {
          const isAdm = parsed.role.toLowerCase().includes('admin');
          if (isAdm) return parsed;
          localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_ADMIN));
          localStorage.setItem('charvik_token', 'charvik_cloud_token_admin_session');
          return DEFAULT_ADMIN;
        }
        return parsed;
      }
    } catch {}

    // Default to the dedicated account corresponding to the URL
    if (isOperatorPortal) {
      localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_OPERATOR));
      localStorage.setItem('charvik_token', 'charvik_cloud_token_operator_session');
      return DEFAULT_OPERATOR;
    }
    if (isCaptainPortal) {
      localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_CAPTAIN));
      localStorage.setItem('charvik_token', 'charvik_cloud_token_captain_session');
      return DEFAULT_CAPTAIN;
    }
    localStorage.setItem('charvik_user', JSON.stringify(DEFAULT_ADMIN));
    localStorage.setItem('charvik_token', 'charvik_cloud_token_admin_session');
    return DEFAULT_ADMIN;
  })();

  // Role-Based Access Guards
  const userRole = (activeUser?.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin');
  const isCaptain = userRole.includes('captain');
  const isOperator = userRole.includes('support') || userRole.includes('helper') || userRole.includes('operator') || userRole.includes('manager');

  // Determine current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) {
      if (isCaptainPortal) return 'Captain Route & Fleet Overview';
      if (isOperatorPortal) return 'Operator Operational Dashboard';
      return 'Dashboard';
    }
    if (p.includes('/vehicles') || p.includes('/buses')) return isCaptainPortal ? 'Vehicle Management' : isOperatorPortal ? 'Fleet Overview' : 'Vehicle Management';
    if (p.includes('/vehicle-maintenance')) return 'Vehicle Maintenance';
    if (p.includes('/daily-maintenance')) return 'Daily Maintenance';
    if (p.includes('/daily-vehicle-checkup') || p.includes('/vehicle-checkup')) return 'Daily Vehicle Checkup';
    if (p.includes('/new-tyres') || p.includes('/tyres/new')) return 'New Tyres';
    if (p.includes('/mileage-fueling') || p.includes('/daily-kilometers')) return 'Mileage & Fueling';
    if (p.includes('/tyre-maintenance')) return 'Tyre Maintenance';
    if (p.includes('/products')) return 'Product Management';
    if (p.includes('/cleaning')) return 'Cleaning Management';
    if (p.includes('/routes')) return 'Route Management';
    if (p.includes('/organizers')) return 'Organizer Management';
    if (p.includes('/tasks')) return isOperatorPortal ? 'Trip Tasks & Crew Schedule' : 'Task Management';
    if (p.includes('/employee-registration') || p.includes('/employees') || p.includes('/drivers/new') || p.includes('/support-staff/new')) return 'Employee Registration';
    if (p.includes('/employee-payments')) return 'Employee Payments';
    if (p.includes('/earnings')) return 'Earnings';
    if (p.includes('/inquiries')) return 'Website Inquiries';
    if (p.includes('/maintenance-schedule')) return 'Maintenance Schedule';
    if (p.includes('/ac-maintenance')) return 'AC Maintenance';
    if (p.includes('/oil-filter-maintenance')) return 'Oil & Filter Replacement';
    if (p.includes('/battery-maintenance')) return 'Battery Health & Inspection';
    if (p.includes('/complaints')) return isCaptainPortal ? 'Complaints & Defects' : isOperatorPortal ? 'Bus Complaints & Issues' : 'Complaints';
    if (p.includes('/repairs')) return 'Repairs & Service';
    if (p.includes('/bus-condition')) return isOperatorPortal ? 'Cleaning Management' : 'Bus Condition Inspection';
    if (p.includes('/reports')) return 'Fleet & Operational Reports';
    if (p.includes('/audit-log')) return 'Audit Log & History';
    if (p.includes('/settings')) return 'Application & System Settings';
    return isCaptainPortal ? 'Captain Portal' : isOperatorPortal ? 'Operator Portal' : 'Admin Panel';
  };

  // Automatically log tab/page navigation across the panel into the Audit Log
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      const pageName = getPageTitle();
      const currentRole = activeUser?.role || 'Admin';
      auditLogger.log({
        user: activeUser?.username || activeUser?.name || currentRole,
        module: pageName,
        action_type: 'Tab Switch',
        description: `Switched page to ${pageName} (${location.pathname})`
      });
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname, activeUser]);

  // For Admin user: disable native HTML form validation on all forms and buttons
  // so that even if the admin doesn't fill in all details, the data can be submitted
  useEffect(() => {
    if (!isAdmin) return;

    const disableFormValidation = () => {
      document.querySelectorAll('form').forEach((form) => {
        if (!form.noValidate) {
          form.noValidate = true;
        }
      });
    };

    disableFormValidation();
    const observer = new MutationObserver(disableFormValidation);
    observer.observe(document.body, { childList: true, subtree: true });

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const button = target.closest('button[type="submit"], input[type="submit"], button');
      if (button) {
        const form = button.closest('form');
        if (form) {
          form.noValidate = true;
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isAdmin, location.pathname]);

  // Synchronize active portal user into AuthContext state
  useEffect(() => {
    if (activeUser && (!user || user.role !== activeUser.role || user.name !== activeUser.name)) {
      setUser(activeUser);
    }
  }, [location.pathname, activeUser, user, setUser]);

  // 2. NOW SAFELY EXECUTE CONDITIONAL RENDERS & REDIRECTS (AFTER ALL HOOKS)
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

  if (!isUserAuthenticated) {
    if (isCaptainPortal) return <Navigate to="/captain/login" replace />;
    if (isOperatorPortal) return <Navigate to="/operator/login" replace />;
    return <Navigate to="/admin/login" replace />;
  }

  const getCategoryForPath = (path: string): string | null => {
    if (path.startsWith('/admin/vehicles') || path.startsWith('/admin/buses') || path.startsWith('/admin/vehicle-registration')) return 'Vehicle Registration';
    if (path.startsWith('/admin/routes')) return 'Route Management';
    if (path.startsWith('/admin/tasks')) return 'Task Management';
    if (path.startsWith('/admin/organizers')) return 'Organizer Management';
    if (path.startsWith('/admin/daily-vehicle-checkup') || path.startsWith('/admin/vehicle-checkup') || path.startsWith('/admin/bus-condition')) return 'Daily Vehicle Checkup';
    if (path.startsWith('/admin/daily-maintenance')) return 'Daily Maintenance';
    if (path.startsWith('/admin/new-tyres') || path.startsWith('/admin/tyres/new')) return 'New Tyres';
    if (path.startsWith('/admin/vehicle-maintenance')) return 'Vehicle Maintenance';
    if (path.startsWith('/admin/mileage-fueling') || path.startsWith('/admin/daily-kilometers')) return 'Mileage & Fueling';
    if (path.startsWith('/admin/ac-maintenance')) return 'AC Maintenance';
    if (path.startsWith('/admin/tyre-maintenance')) return 'Tyre Maintenance';
    if (path.startsWith('/admin/products')) return 'Product Management';
    return null;
  };

  // Admin Portal Access Control:
  if (isAdminPortal) {
    // Both Admin and authenticated staff can open the Main Dashboard (/admin or /admin/dashboard)
    const isDashboardRoute =
      location.pathname === '/admin' ||
      location.pathname === '/admin/' ||
      location.pathname === '/admin/dashboard';

    if (!isDashboardRoute && !isAdmin) {
      if (isOperator) {
        const cat = getCategoryForPath(location.pathname);
        const rawActiveCats = Array.isArray(activeUser?.categories)
          ? activeUser.categories
          : typeof activeUser?.categories === 'string'
          ? (function () {
              try {
                return JSON.parse(activeUser.categories);
              } catch {
                return [];
              }
            })()
          : [];
        const userCats: string[] = rawActiveCats.length > 0
          ? rawActiveCats.map((c: any) => String(c || '').trim()).filter(Boolean)
          : ALL_CATEGORY_NAMES;

        if (cat && !userCats.includes(cat)) {
          return <Navigate to="/admin/dashboard" replace />;
        }
      } else {
        return <Navigate to="/admin/login" replace />;
      }
    }
  }

  // Captain Portal: Captain or Admin
  if (isCaptainPortal && !isCaptain && !isAdmin) {
    return <Navigate to="/captain/login" replace />;
  }

  // Supporter / Operator Portal: Operator or Admin
  if (isOperatorPortal && !isOperator && !isAdmin) {
    return <Navigate to="/operator/login" replace />;
  }

  const isDashboard =
    location.pathname.endsWith('/dashboard') ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/captain' ||
    location.pathname === '/captain/' ||
    location.pathname === '/supporter' ||
    location.pathname === '/supporter/' ||
    location.pathname === '/operator' ||
    location.pathname === '/operator/';

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex flex-col">
      {/* Sidebar - Pinned on desktop */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isPinned={true}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-[88px]' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onMobileToggle={() => setIsMobileOpen(true)}
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          pageTitle={getPageTitle()}
          isCollapsed={isCollapsed}
        />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full ${isDashboard ? 'max-w-7xl' : 'max-w-[1920px] admin-data-page'} mx-auto pb-24 lg:pb-8`}>
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
