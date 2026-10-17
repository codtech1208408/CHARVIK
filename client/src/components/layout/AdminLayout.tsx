import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#142B4A]">Loading Charvik Fleet Management...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Determine current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Fleet & Maintenance Dashboard';
    if (p.includes('/buses')) return 'Bus Master & Fleet Details';
    if (p.includes('/daily-kilometers')) return 'Daily Kilometer Entry';
    if (p.includes('/maintenance-schedule')) return 'Preventive Maintenance Schedule';
    if (p.includes('/tyre-maintenance')) return 'Tyre Maintenance & Tracking';
    if (p.includes('/ac-maintenance')) return 'AC Maintenance & Service';
    if (p.includes('/oil-filter-maintenance')) return 'Oil & Filter Replacement';
    if (p.includes('/battery-maintenance')) return 'Battery Health & Inspection';
    if (p.includes('/complaints')) return 'Bus Complaints Management';
    if (p.includes('/repairs')) return 'Repairs & Service Work Orders';
    if (p.includes('/bus-condition')) return 'Bus Condition Inspection';
    if (p.includes('/drivers/new')) return 'Driver Biodata Registration';
    if (p.includes('/support-staff/new')) return 'Helper & Captain Registration';
    if (p.includes('/employees')) return 'Employee Biodata Management';
    if (p.includes('/reports')) return 'Fleet & Operational Reports';
    if (p.includes('/settings')) return 'Application & System Settings';
    return 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onMobileToggle={() => setIsMobileOpen(true)}
          pageTitle={getPageTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
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
