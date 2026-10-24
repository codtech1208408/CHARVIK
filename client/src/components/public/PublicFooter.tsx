import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowUp, ChevronRight, Users } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0e1f36] text-white border-t border-slate-800">
      {/* Top CTA Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#1E3A5F] py-10 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Looking for Reliable Fleet & Transportation?
            </h3>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Get immediate fleet availability, custom commercial contracts, or verified drivers & support staff today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/919876543210?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20a%20quote%20for%20bus%20rental%20%2F%20fleet%20supply."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>

            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-[#142B4A] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              Call +91 98765 43210
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Column */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-16 sm:h-20 w-auto px-3 py-1.5 rounded-xl bg-white border border-white/20 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/logo-tight.png"
                  alt="Charvik Staffing Consultancy Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Premier fleet supply, bus rentals, qualified crew staffing, and maintenance-backed transportation logistics tailored for corporates, educational institutions, and infrastructure projects across India.
            </p>
          </div>

          {/* Quick Links with Supporter Login */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/10 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> About Company
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> All Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Contact & Location
                </Link>
              </li>
            </ul>
          </div>

          {/* Services List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/10 pb-2">
              Core Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/services#bus-rental" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Bus Rental & Hire
                </Link>
              </li>
              <li>
                <Link to="/services#fleet-supply" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Corporate Fleet Supply
                </Link>
              </li>
              <li>
                <Link to="/services#driver-provision" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Drivers, Helpers & Captains
                </Link>
              </li>
              <li>
                <Link to="/services#maintenance-fleet" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Maintenance-Backed Operations
                </Link>
              </li>
              <li>
                <Link to="/services#project-transport" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> Project & Contract Mobility
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/10 pb-2">
              Corporate Office
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Plot 42, Transport Nagar, Vijayawada, Andhra Pradesh - 520007</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:contact@charvikstaffing.com" className="hover:text-white transition-colors">
                  contact@charvikstaffing.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Mon – Sun: 24/7 Operations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Role Portal Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Charvik Staffing Consultancy. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/supporter"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-all font-bold text-xs"
              title="Supporter Account Portal (/supporter)"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>/supporter</span>
            </Link>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 ml-2"
              aria-label="Back to top"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
