import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Menu, X, LogIn } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

            {/* Desktop Login Button — goes directly to /login page */}
            <div className="hidden lg:flex items-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-sm hover:shadow-md transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-300" />
                <span>Login</span>
              </Link>
            </div>

            {/* Mobile Actions: Login Button & Hamburger Menu */}
            <div className="flex lg:hidden items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-white bg-[#142B4A] hover:bg-[#1E3A5F] flex items-center gap-1.5 text-xs font-bold shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-300" />
                <span>Login</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition"
                >
                  <LogIn className="w-4 h-4 text-blue-300" />
                  Login
                </Link>

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
        )}
      </header>
    </>
  );
};
