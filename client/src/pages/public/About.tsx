import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Eye,
  Compass,
  ShieldCheck,
  Award,
  Users,
  CheckCircle,
  Phone,
  MessageCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* 1. Page Header Banner */}
      <section className="bg-gradient-to-r from-[#0c1b30] via-[#142B4A] to-[#1E3A5F] text-white py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full border border-white/15"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <span
            className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3"
            data-aos="fade-down"
          >
            About Charvik Staffing Consultancy
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            data-aos="fade-up"
          >
            Transforming Fleet Mobility & Workforce Operations
          </h1>
          <p
            className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            A forward-thinking logistics and staffing enterprise dedicated to safety, compliance, and punctual corporate transport across India.
          </p>
        </div>
      </section>

      {/* 2. Company Story & Introduction */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6" data-aos="fade-right">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Our Story & Heritage
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] tracking-tight">
                Empowering Businesses With Punctual & Safe Transportation
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                <strong className="text-slate-900 font-semibold">Charvik Staffing Consultancy</strong> was founded with a clear objective: to bring order, accountability, and modern fleet maintenance standards to commercial bus rentals and transport crew staffing.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Over the years, we have scaled our operations from specialized bus rentals to holistic enterprise fleet logistics. Today, we supply custom fleets to corporate headquarters, IT parks, industrial zones, and major educational institutions.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-2xl font-black text-blue-600">30+</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Modern Fleet Units</p>
                  <p className="text-[11px] text-slate-500">AC & Non-AC luxury coaches</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-2xl font-black text-blue-600">99.8%</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Uptime Record</p>
                  <p className="text-[11px] text-slate-500">Preventive maintenance protocol</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6" data-aos="fade-left">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <img
                    src="/assets/fleet2.jpg"
                    alt="Charvik Staffing Team & Fleet"
                    className="w-full h-96 object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 sm:bottom-6 sm:left-6 bg-[#142B4A] text-white p-5 rounded-2xl shadow-2xl border border-white/10 max-w-xs">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">100% Statutory Compliance</p>
                      <p className="text-xs text-blue-200">Permits, insurance & verified crews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AIM, VISION & MISSION (User's Exact Core Requirement) */}
      <section className="py-20 bg-[#F5F7FB] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Guiding Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
              Our Aim, Vision & Mission
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              The foundational pillars that guide our daily operations, fleet upkeep, and client relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AIM CARD */}
            <div
              className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <Target className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                  Target & Focus
                </span>
                <h3 className="text-2xl font-black text-[#142B4A] mt-1 mb-4">
                  Our Aim
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To provide reliable, safe, and cost-effective transportation services for corporate, educational, and industrial sectors. We aim to eradicate delays, uncertified drivers, and mechanical failures through rigorous operational oversight and preventive care.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Zero Delays & Verified Safety</span>
              </div>
            </div>

            {/* VISION CARD */}
            <div
              className="bg-white rounded-2xl p-8 border-2 border-blue-500/30 shadow-md hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#142B4A] text-white flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-xs">
                  <Eye className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                  Future Horizon
                </span>
                <h3 className="text-2xl font-black text-[#142B4A] mt-1 mb-4">
                  Our Vision
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To become India’s most trusted and technologically integrated fleet partner, renowned for setting the gold standard in crew discipline, passenger comfort, predictive vehicle maintenance, and sustainable logistics solutions.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Nationwide Excellence & Innovation</span>
              </div>
            </div>

            {/* MISSION CARD */}
            <div
              className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <Compass className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                  Our Commitment
                </span>
                <h3 className="text-2xl font-black text-[#142B4A] mt-1 mb-4">
                  Our Mission
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Empowering our clients by delivering modern fleets, certified captains, and dedicated support. We ensure every single journey is comfortable, fully compliant with statutory norms, and supported by a continuous maintenance ecosystem.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Dedicated Support On Every Route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Values & Quality Benchmark */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Core Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
              Values That Drive Every Mile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200" data-aos="fade-up" data-aos-delay="100">
              <ShieldCheck className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-[#142B4A] text-base mb-1">Safety First</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Speed governors, emergency exits, fire extinguishers, and rigorous daily brake inspections on every bus.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200" data-aos="fade-up" data-aos-delay="200">
              <Users className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-[#142B4A] text-base mb-1">Crew Discipline</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Courteous, uniformed drivers, captains, and helpers trained in customer service and defensive road maneuvers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200" data-aos="fade-up" data-aos-delay="300">
              <Award className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-[#142B4A] text-base mb-1">Zero Downtime Focus</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automated kilometer tracking, oil renewal schedules, and reserve buses positioned for instant relief.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200" data-aos="fade-up" data-aos-delay="400">
              <Compass className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-[#142B4A] text-base mb-1">Total Transparency</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear billing, no hidden fees, transparent kilometer logs, and customized monthly reporting for audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-16 bg-[#142B4A] text-white" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black">Partner With Charvik Today</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-2">
            Discover how our aim, vision, and mission translate into worry-free transport for your company or institution.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition"
            >
              <span>Explore Our Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/919876543210?text=Hello%20Charvik%2C%20I%20would%20like%20to%20know%20more%20about%20your%20company."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>

            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Call Us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
