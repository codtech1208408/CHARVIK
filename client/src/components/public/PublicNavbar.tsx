import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Menu, X, Compass, Key, ShieldCheck, LogIn, ChevronDown } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close login dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setLoginDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const loginPortals = [
    {
      title: 'Admin Login',
      badge: 'Super Admin',
      badgeClass: 'bg-blue-100 text-blue-700',
      description: 'Management, Fleet & Core Operations',
      path: '/admin/login',
      icon: ShieldCheck,
      iconBg: 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
      borderHover: 'hover:bg-blue-50/70 group-hover:text-blue-700',
    },
    {
      title: 'Operator Login',
      badge: 'Operator',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      description: 'Duty Scheduling & Bus Operations',
      path: '/operator/login',
      icon: Key,
      iconBg: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
      borderHover: 'hover:bg-emerald-50/70 group-hover:text-emerald-700',
    },
    {
      title: 'Captain Login',
      badge: 'Captain',
      badgeClass: 'bg-amber-100 text-amber-900',
      description: 'Route Execution & Vehicle Audits',
      path: '/captain/login',
      icon: Compass,
      iconBg: 'bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white',
      borderHover: 'hover:bg-amber-50/70 group-hover:text-amber-800',
    },
  ];

  return (
    <>
      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center group py-2" aria-label="Charvik Home">
              <div className="h-20 sm:h-24 w-auto px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-sm group-hover:shadow transition-shadow flex items-center justify-center">
                <img
                  src="/logo-compact.png"
                  alt="Charvik Staffing Consultancy"
                  className="h-full w-auto max-h-18 sm:max-h-22 object-contain transition-transform group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:text-[#142B4A] hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Login Dropdown Selector */}
            <div className="hidden lg:flex items-center relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLoginDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-sm hover:shadow-md transition-all cursor-pointer"
                aria-expanded={loginDropdownOpen}
                aria-haspopup="true"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-300" />
                <span>Login</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-blue-300 transition-transform duration-200 ${
                    loginDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu of Individual Logins */}
              {loginDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Portal</p>
                      <p className="text-xs font-black text-[#142B4A]">Individual Logins</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {loginPortals.map((portal) => {
                      const Icon = portal.icon;
                      return (
                        <Link
                          key={portal.path}
                          to={portal.path}
                          onClick={() => setLoginDropdownOpen(false)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group ${portal.borderHover}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${portal.iconBg}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                                {portal.title}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${portal.badgeClass}`}>
                                {portal.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{portal.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions: Login Button & Hamburger Menu */}
            <div className="flex lg:hidden items-center space-x-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setLoginDropdownOpen((prev) => !prev);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-white bg-[#142B4A] hover:bg-[#1E3A5F] flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-300" />
                  <span>Login</span>
                  <ChevronDown
                    className={`w-3 h-3 text-blue-300 transition-transform duration-200 ${
                      loginDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Mobile Floating Dropdown */}
                {loginDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Portal</p>
                      <p className="text-xs font-black text-[#142B4A]">Individual Logins</p>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {loginPortals.map((portal) => {
                        const Icon = portal.icon;
                        return (
                          <Link
                            key={portal.path}
                            to={portal.path}
                            onClick={() => setLoginDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${portal.iconBg}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">{portal.title}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${portal.badgeClass}`}>
                                  {portal.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">{portal.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setLoginDropdownOpen(false);
                }}
                className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-3 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(link.path) ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Individual Logins Section inside Mobile Drawer */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                  Individual Portal Logins
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {loginPortals.map((portal) => {
                    const Icon = portal.icon;
                    return (
                      <Link
                        key={portal.path}
                        to={portal.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${portal.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 block">{portal.title}</span>
                          <span className="text-[10px] text-slate-500">{portal.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href="https://wa.me/919396151527?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>

                  <a
                    href="tel:+919876543210"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    <Phone className="w-4 h-4" />
                    Call Directly (+91 98765 43210)
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
