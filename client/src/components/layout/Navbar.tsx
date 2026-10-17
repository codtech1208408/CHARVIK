import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, User as UserIcon, Calendar, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMobileToggle: () => void;
  pageTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileToggle, pageTitle }) => {
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

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 bg-[#142B4A] text-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-md border-b border-slate-700">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            {pageTitle}
          </h1>
        </div>
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
                if (val) navigate(`/admin/buses?search=${encodeURIComponent(val)}`);
              }
            }}
            className="w-full bg-[#1E3A5F]/60 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right: Date, Notifications, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">{todayStr}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5" />
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
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">Fleet Alerts & Updates</span>
                </div>
                <span className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-400/30">
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
                          navigate('/admin/maintenance-schedule');
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
                          navigate('/admin/complaints');
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
                    navigate('/admin/dashboard');
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
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-blue-400">
              {user ? user.name.slice(0, 2) : 'AD'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight truncate">
                {user ? user.name : 'Administrator'}
              </span>
              <span className="text-[10px] text-blue-300 font-medium">
                {user ? user.role : 'Super Admin'}
              </span>
            </div>
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-700 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 truncate">{user?.email}</p>
              </div>
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
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/admin/login');
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
