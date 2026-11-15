import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, User as UserIcon, Calendar, AlertCircle, AlertTriangle, Wrench, ShieldAlert, ArrowLeft, ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { NavbarCalendar } from './NavbarCalendar';

interface NavbarProps {
  onMobileToggle: () => void;
  onToggleSidebar?: () => void;
  pageTitle: string;
  isCollapsed?: boolean;
  isSidebarVisible?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMobileToggle,
  onToggleSidebar,
  pageTitle,
  isCollapsed,
  isSidebarVisible = true,
}) => {
  const { user, logout, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCaptain = location.pathname.startsWith('/captain');
  const isOperator = location.pathname.startsWith('/operator') || location.pathname.startsWith('/supporter');

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
      return {
        id: 7,
        name: 'NEELAM HARISH',
        email: 'harish@charvik.com',
        role: 'Operator'
      };
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
      return {
        id: 2,
        name: 'Captain Lead',
        email: 'captain@charvik.com',
        role: 'Captain'
      };
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
    return {
      id: 1,
      name: 'Admin Manager',
      email: 'admin@charvik.com',
      role: 'Super Admin'
    };
  })();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any>({
    totalCount: 0,
    upcomingMaint: [],
    pendingComplaints: [],
    expiringLicences: [],
    expiringDocs: []
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 45000); // refresh every 45s
    return () => clearInterval(interval);
  }, []);

  const basePrefix = isCaptain ? '/captain' : isOperator ? '/operator' : '/admin';
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

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="min-h-[96px] py-2 bg-white text-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs border-b border-slate-200">
      {/* Left: Menu Drawer Toggle (Mobile) & Brand Logo when collapsed & Page Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              onMobileToggle();
            } else if (onToggleSidebar) {
              onToggleSidebar();
            }
          }}
          className={`p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-slate-200/80 shadow-xs ${isSidebarVisible ? 'lg:hidden' : 'flex'
            }`}
          title={isSidebarVisible ? 'Hide Navigation Sidebar' : 'Show Navigation Sidebar'}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5 text-[#142B4A]" />
        </button>

        {/* Charvik brand logo on desktop */}
        <Link
          to={`${basePrefix}/dashboard`}
          className="flex items-center justify-center py-0.5 mr-4 sm:mr-6 shrink-0 transition-opacity hover:opacity-95 cursor-pointer"
          title="Charvik Staffing Consultancy"
        >
          <img
            src="/logo-compact.png?v=5"
            alt="Charvik Staffing Consultancy"
            className="h-[80px] sm:h-[88px] lg:h-[92px] max-h-[94px] w-auto max-w-[340px] sm:max-w-[420px] lg:max-w-[500px] object-contain transition-transform hover:scale-105"
          />
        </Link>

        {/* Operator Mode: Quick Return to Admin Button */}
        {isOperator && (
          <button
            onClick={() => {
              const adminUser = {
                id: 1,
                name: 'Admin Manager',
                email: 'admin@charvik.com',
                role: 'Super Admin'
              };
              localStorage.setItem('charvik_user', JSON.stringify(adminUser));
              localStorage.setItem('charvik_token', 'charvik_cloud_token_admin_session');
              if (setUser) setUser(adminUser);
              navigate('/admin/dashboard');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer ml-1"
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>Back to Admin</span>
          </button>
        )}

        {/* Page Title beside the logo (hidden when on Dashboard per user request) */}
        {pageTitle && !pageTitle.toLowerCase().includes('dashboard') && (
          <div className="pl-1 sm:pl-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              {pageTitle}
            </h1>
          </div>
        )}
      </div>

      {/* Right: Date, Notifications, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Interactive Fleet Calendar */}
        <NavbarCalendar />

        {/* Pill 2: Notifications Bell + User Profile (Exact Match to Reference Image) */}
        <div className="flex items-center bg-white border border-blue-200/90 rounded-full px-3 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-blue-300 transition-all select-none">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center select-none"
              title="Notifications & Alerts"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="bellGradNavbar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A3FF" />
                    <stop offset="100%" stopColor="#0047FF" />
                  </linearGradient>
                </defs>
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  fill="url(#bellGradNavbar)"
                />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="url(#bellGradNavbar)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9.5px] font-black rounded-full flex items-center justify-center shadow-xs">
                {notifications.totalCount > 0 ? notifications.totalCount : 3}
              </span>
            </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-3 bg-[#142B4A] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-white" />
                  <span className="font-bold text-sm">Fleet Alerts & Updates</span>
                </div>
                <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold border border-white/30">
                  {notifications.totalCount} pending
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.upcomingMaint?.length > 0 && (
                  <div className="p-3">
                    <p className="font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                      <Wrench className="w-3.5 h-3.5" /> Maintenance Due Soon
                    </p>
                    {notifications.upcomingMaint.slice(0, 3).map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`${basePrefix}/maintenance-schedule`);
                        }}
                        className="p-2 rounded-lg hover:bg-amber-50 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{m.bus_number} - {m.maintenance_type}</p>
                          <p className="text-[11px] text-slate-500">Due: {m.next_due_date || `${m.next_due_km} km`}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.pendingComplaints?.length > 0 && (
                  <div className="p-3">
                    <p className="font-bold text-rose-700 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Active Complaints
                    </p>
                    {notifications.pendingComplaints.slice(0, 3).map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`${basePrefix}/complaints`);
                        }}
                        className="p-2 rounded-lg hover:bg-rose-50 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{c.complaint_ref} ({c.bus_number})</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{c.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                          {c.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.expiringLicences?.length > 0 && (
                  <div className="p-3">
                    <p className="font-bold text-indigo-700 flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5" /> Licence Expiries
                    </p>
                    {notifications.expiringLicences.slice(0, 2).map((l: any) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/admin/employees');
                        }}
                        className="p-2 rounded-lg hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{l.full_name} ({l.employee_code})</p>
                          <p className="text-[11px] text-slate-500">Expires: {l.licence_validity_date}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
                          Renew
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.expiringDocs?.length > 0 && (
                  <div className="p-3">
                    <p className="font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Vehicle Document Expiry Alerts
                    </p>
                    {notifications.expiringDocs.slice(0, 3).map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`${basePrefix}/vehicles`);
                        }}
                        className="p-2 rounded-lg hover:bg-amber-50 cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{d.bus_number} ({d.registration_number})</p>
                          <p className="text-[11px] text-amber-700 font-semibold">
                            Compliance doc expiring / requires renewal
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                          Inspect
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.totalCount === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    <p className="text-xs font-medium">All caught up! No critical fleet alerts.</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(`${basePrefix}/dashboard`);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Operational Overview →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-300 mx-2.5 shrink-0" />

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-full hover:bg-slate-50 transition-colors cursor-pointer text-left pl-0.5 pr-1 py-0.5"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#071B36] via-[#0A2540] to-[#041226] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-blue-900/50">
              {activeUser ? (activeUser.name.toLowerCase().includes('admin') ? 'AD' : activeUser.name.slice(0, 2).toUpperCase()) : 'AD'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[13px] font-bold text-[#0F172A] leading-tight truncate">
                {activeUser ? activeUser.name : isCaptain ? 'Route Captain' : isOperator ? 'Operator Staff' : 'Admin Manager'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                {activeUser ? activeUser.role : isCaptain ? 'Captain' : isOperator ? 'Operator' : 'Super Admin'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#0F172A] stroke-[2.5] ml-0.5 shrink-0" />
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-700 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{activeUser?.name || 'User'}</p>
                <p className="text-slate-500 truncate">{activeUser?.email || ''}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${isCaptain ? 'bg-blue-50 text-blue-800' : isOperator ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                  }`}>
                  {activeUser?.role || (isOperator ? 'Operator' : 'Admin')}
                </span>
              </div>
              {isOperator && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    const adminUser = {
                      id: 1,
                      name: 'Admin Manager',
                      email: 'admin@charvik.com',
                      role: 'Super Admin'
                    };
                    localStorage.setItem('charvik_user', JSON.stringify(adminUser));
                    localStorage.setItem('charvik_token', 'charvik_cloud_token_admin_session');
                    if (setUser) setUser(adminUser);
                    navigate('/admin/dashboard');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-bold flex items-center space-x-2 border-b border-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Admin Panel</span>
                </button>
              )}
              {!isCaptain && !isOperator && (
                <>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      const opUser = {
                        id: 7,
                        name: 'NEELAM HARISH',
                        email: 'harish@charvik.com',
                        role: 'Operator',
                        categories: ['Route Management', 'Trip Management', 'AC Maintenance']
                      };
                      localStorage.setItem('charvik_user', JSON.stringify(opUser));
                      localStorage.setItem('charvik_token', 'charvik_cloud_token_operator_session');
                      if (setUser) setUser(opUser);
                      navigate('/operator/dashboard');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-semibold flex items-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Operator Dashboard</span>
                  </button>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Public Website</span>
                  </a>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Account Settings</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  if (isCaptain) navigate('/captain/login');
                  else if (isOperator) navigate('/operator/login');
                  else navigate('/admin/login');
                }}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 border-t border-slate-100"
              >
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
};
