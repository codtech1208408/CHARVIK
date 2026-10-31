import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, User as UserIcon, Calendar, AlertCircle, AlertTriangle, Wrench, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { NavbarCalendar } from './NavbarCalendar';

interface NavbarProps {
  onMobileToggle: () => void;
  pageTitle: string;
  isCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileToggle, pageTitle, isCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const location = useLocation();
  const isCaptain = location.pathname.startsWith('/captain');
  const isSupporter = location.pathname.startsWith('/supporter');
  const basePrefix = isCaptain ? '/captain' : isSupporter ? '/supporter' : '/admin';
  const isDashboard =
    location.pathname.endsWith('/dashboard') ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/captain' ||
    location.pathname === '/captain/' ||
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
    <header className="min-h-[82px] py-1 bg-white text-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs border-b border-slate-200">
      {/* Left: Menu Drawer Toggle (Mobile) & Brand Logo when collapsed & Page Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#142B4A]" />
        </button>

        {/* When sidebar is collapsed on desktop, Charvik brand logo with increased size */}
        {isCollapsed && (
          <Link
            to={`${basePrefix}/dashboard`}
            className="hidden lg:flex items-center justify-center py-1 mr-4 shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
            title="Charvik Staffing Consultancy"
          >
            <img
              src="/logo-compact.png"
              alt="Charvik Staffing Consultancy"
              className="h-[60px] sm:h-[66px] max-h-[70px] w-auto max-w-[240px] object-contain transition-transform hover:scale-105"
            />
          </Link>
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

      {/* Middle: Search Box */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Bus No / Driver / Service..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val) navigate(`${basePrefix}/vehicles?search=${encodeURIComponent(val)}`);
              }
            }}
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right: Date, Notifications, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Interactive Fleet Calendar */}
        <NavbarCalendar />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5 text-[#2563EB]" />
            {notifications.totalCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifications.totalCount}
              </span>
            )}
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

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm border ${
              isCaptain ? 'bg-[#142B4A] border-blue-400' : isSupporter ? 'bg-emerald-600 border-emerald-400' : 'bg-[#142B4A] border-blue-500'
            }`}>
              {user ? user.name.slice(0, 2) : isCaptain ? 'CP' : isSupporter ? 'SP' : 'AD'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate">
                {user ? user.name : isCaptain ? 'Route Captain' : isSupporter ? 'Support Staff' : 'Administrator'}
              </span>
              <span className={`text-[10px] font-medium ${isCaptain ? 'text-blue-600' : isSupporter ? 'text-emerald-600' : 'text-slate-500'}`}>
                {user ? user.role : isCaptain ? 'Captain' : isSupporter ? 'Support Staff' : 'Super Admin'}
              </span>
            </div>
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-700 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 truncate">{user?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCaptain ? 'bg-blue-50 text-blue-800' : isSupporter ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  {user?.role}
                </span>
              </div>
              {!isCaptain && !isSupporter && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account Settings</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  if (isCaptain) navigate('/captain/login');
                  else if (isSupporter) navigate('/supporter/login');
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
    </header>
  );
};
