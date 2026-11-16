import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  ShieldCheck,
  Users,
  Wrench,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MapPin,
  CalendarCheck,
  UserCheck,
  Star,
  Check
} from 'lucide-react';

export const Home: React.FC = () => {
  const coreServices = [
    {
      title: 'Bus Rental & Hire',
      desc: 'Short & long-term rentals with luxury AC or non-AC buses for corporate excursions and special events.',
      icon: Bus,
      link: '/services#bus-rental',
    },
    {
      title: 'Fleet Supply',
      desc: 'Turnkey fleet provision for companies, institutions, and industrial sites with customized vehicle mixes.',
      icon: Users,
      link: '/services#fleet-supply',
    },
    {
      title: 'Driver & Crew Provision',
      desc: 'Background-verified, licensed drivers, certified bus captains, and courteous helpers.',
      icon: Award,
      link: '/services#driver-provision',
    },
    {
      title: 'Maintenance-Backed Operations',
      desc: 'Preventive schedules, genuine parts replacement, and zero-breakdown operational maintenance.',
      icon: Wrench,
      link: '/services#maintenance-fleet',
    },
    {
      title: 'Project / Contract Transportation',
      desc: 'Dedicated transport logistics for ongoing contracts, industrial corridors, and event transit.',
      icon: Clock,
      link: '/services#project-transport',
    },
  ];

  const whyChooseUs = [
    {
      icon: ShieldCheck,
      title: '100% Verified Crew & Captains',
      desc: 'All drivers and conductors are police-verified, medically certified, and safety-trained.',
    },
    {
      icon: Wrench,
      title: 'Rigorous Preventive Maintenance',
      desc: 'Daily tyre checks, scheduled oil replacements, and proactive AC & battery upkeep.',
    },
    {
      icon: Clock,
      title: '99.8% Punctual Route Compliance',
      desc: 'Strict adherence to pickup, departure, and project schedules with live monitoring.',
    },
    {
      icon: Award,
      title: 'Comprehensive Compliance',
      desc: 'Full commercial insurance, road permits, fitness certificates, and pollution clearances.',
    },
  ];

  // 5 Public Website Banners (Buses, Drivers, Captains, Supervisors, and Complete Crew Staffing)
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const heroBanners = [
    {
      id: 1,
      image: '/assets/crew-staffing-banner-hd.png',
      badge: 'Premier Commercial Fleet & Crew Solutions',
      titleHighlight: 'Reliable Fleets.',
      titleMain: 'Professional Crews. Seamless Journeys.',
      description:
        'Charvik Staffing Consultancy delivers comprehensive bus rentals, turnkey corporate fleet supply, certified drivers & captains, and maintenance-backed mobility operations across India.',
      primaryBtn: { text: 'Request a Fleet Quote', link: '/contact' },
      navLabel: 'Fleet & All Crew',
      spotlightRole: 'Full Crew & Fleet Division',
      spotlightTitle: 'Complete Mobility & Staffing',
      spotlightImg: '/assets/crew-staffing-banner-hd.png',
      spotlightPoints: [
        '30+ Modern Commercial Buses',
        'Drivers, Captains & Helpers',
        '24/7 Breakdown & Mobile Squads'
      ],
      metrics: [
        { label: 'Buses in Fleet', value: '30+' },
        { label: 'Verified Staff', value: '100%' },
        { label: 'Breakdown Support', value: '24/7' },
      ],
    },
    {
      id: 2,
      image: '/assets/driver-hero-banner.jpg',
      badge: '100% Police-Verified Driver Supply',
      titleHighlight: 'Professional Drivers.',
      titleMain: 'Skilled Heavy-Vehicle Drivers For Your Buses.',
      description:
        'Licensed heavy passenger vehicle (HTV/HMV) drivers with defensive driving credentials, mandatory annual medical screenings, and background-verified records.',
      primaryBtn: { text: 'Hire Verified Drivers', link: '/services#driver-provision' },
      navLabel: 'Bus Drivers',
      spotlightRole: 'Commercial Heavy Vehicle Driver',
      spotlightTitle: 'Police-Verified Chauffeur',
      spotlightImg: '/assets/crew-driver-hd.png',
      spotlightPoints: [
        'Valid Commercial HTV/HMV License',
        'Annual Medical & Vision Audits',
        'Defensive Passenger Driving Certified'
      ],
      metrics: [
        { label: 'Police Verified', value: '100%' },
        { label: 'Medical Audits', value: 'Annual' },
        { label: 'Accident Record', value: 'Zero' },
      ],
    },
    {
      id: 3,
      image: '/assets/captain-hero-banner.jpg',
      badge: 'Certified Bus Captain Supply',
      titleHighlight: 'Experienced Captains.',
      titleMain: 'Courteous & Disciplined Highway Transit.',
      description:
        'Experienced bus captains trained in passenger courtesy, long-distance route management, and emergency response for corporate shuttles and luxury interstate touring.',
      primaryBtn: { text: 'Captain Provision', link: '/services#driver-provision' },
      navLabel: 'Bus Captains',
      spotlightRole: 'Certified Bus Captain',
      spotlightTitle: 'Elite Route Captain',
      spotlightImg: '/assets/crew-captain-hd.png',
      spotlightPoints: [
        '10+ Years Highway Transit Mastery',
        'Passenger Courtesy & Protocol Trained',
        'First-Aid & Emergency Response Ready'
      ],
      metrics: [
        { label: 'Highway Experience', value: '10+ Yrs' },
        { label: 'Passenger Courtesy', value: 'Trained' },
        { label: 'Punctuality SLA', value: '99.8%' },
      ],
    },
    {
      id: 4,
      image: '/assets/fleet1.jpg',
      badge: '30+ Modern Commercial Buses',
      titleHighlight: 'Commercial Fleet Supply.',
      titleMain: 'Luxury Coaches Ready For Immediate Deployment.',
      description:
        'Expansive depot capacity of 36 to 55-seater air-conditioned executive buses for corporate employee commute, IT park shuttles, institutional routes, and special events.',
      primaryBtn: { text: 'View Bus Rentals', link: '/services#bus-rental' },
      navLabel: 'Fleet Buses',
      spotlightRole: 'Executive Passenger Coach',
      spotlightTitle: '36 – 55 Seater Luxury Bus',
      spotlightImg: '/assets/fleet1.jpg',
      spotlightPoints: [
        'Ergonomic Reclining Push-Back Seats',
        'Climate-Controlled AC & Sanitized',
        'All-India Commercial Road Permits'
      ],
      metrics: [
        { label: 'Seating Options', value: '36 - 55' },
        { label: 'All-India Permits', value: 'Active' },
        { label: 'Sanitized & Inspected', value: '100%' },
      ],
    },
    {
      id: 5,
      image: '/assets/supervisor-hero-banner.jpg',
      badge: 'Depot & Route Operations Staff',
      titleHighlight: 'Qualified Supervisors.',
      titleMain: 'Seamless Depot & On-Board Staff Management.',
      description:
        'Dedicated route supervisors and skilled helpers managing passenger boarding, digital ticket validation, fleet dispatch, and on-time adherence.',
      primaryBtn: { text: 'Explore Operations', link: '/services#fleet-supply' },
      navLabel: 'Supervisors & Helpers',
      spotlightRole: 'Fleet Supervisor & Crew',
      spotlightTitle: 'Operations & Ground Crew',
      spotlightImg: '/assets/crew-supervisor-hd.png',
      spotlightPoints: [
        'Real-Time Route & Shift Dispatch',
        'Dedicated Client Account Coordination',
        '24/7 Ground Support & Helper Staff'
      ],
      metrics: [
        { label: 'Route Monitoring', value: 'Live' },
        { label: 'Dedicated Leads', value: '1-on-1' },
        { label: 'Shift Coverage', value: '24/7' },
      ],
    },
  ];

  // Auto-advance banner every 3.5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  return (
    <div className="overflow-hidden">
      {/* 1. FULL-WIDTH MULTI-BANNER AUTO-SCROLLER (BUSES, DRIVERS & EMPLOYEE CREW) */}
      <section className="relative w-full bg-slate-900 overflow-hidden select-none">
        <div className="relative w-full h-[calc(100vh-6rem)] min-h-[620px] max-h-[850px] overflow-hidden">
          {/* Render all banners with smooth crossfade */}
          {heroBanners.map((banner, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image: Buses / Driver / Captain / Crew Banner */}
                <img
                  src={banner.image}
                  alt={banner.titleMain}
                  className="w-full h-full object-cover object-center"
                />

                {/* Professional gradient overlay for crisp readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-950/40 flex items-center z-20">
                  <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      {/* Left: Text & Call-To-Actions */}
                      <div className="lg:col-span-7 text-white space-y-4 sm:space-y-5">
                        {/* Category Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/90 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                          <span>{banner.badge}</span>
                        </div>

                        {/* Main Title */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                          <span className="text-sky-300 block">{banner.titleHighlight}</span>
                          {banner.titleMain}
                        </h2>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed drop-shadow max-w-xl">
                          {banner.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <Link
                            to={banner.primaryBtn.link}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:-translate-y-0.5"
                          >
                            <span>{banner.primaryBtn.text}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <a
                            href="https://wa.me/919396151527?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform hover:-translate-y-0.5"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp Enquiry</span>
                          </a>

                          <a
                            href="tel:+919876543210"
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-300" />
                            <span>Call Us</span>
                          </a>
                        </div>

                        {/* Key Metrics */}
                        <div className="pt-4 flex items-center gap-6 border-t border-white/15">
                          {banner.metrics.map((m) => (
                            <div key={m.label}>
                              <div className="text-xl font-black text-sky-300">{m.value}</div>
                              <div className="text-[11px] text-slate-300 font-semibold">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Glassmorphic Spotlight Card showing the actual staff member or bus */}
                      <div className="hidden lg:flex lg:col-span-5 justify-end">
                        <div className="w-80 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20 shadow-2xl space-y-3 text-white">
                          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-800 border border-white/10">
                            <img
                              src={banner.spotlightImg}
                              alt={banner.spotlightTitle}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-300" />
                              <span>Verified Charvik Staff</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                              {banner.spotlightRole}
                            </span>
                            <h4 className="text-base font-black text-white mt-0.5">
                              {banner.spotlightTitle}
                            </h4>
                          </div>

                          <div className="space-y-1.5 pt-1 text-xs text-slate-200">
                            {banner.spotlightPoints.map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Previous / Next Arrow Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Interactive Slide Tabs Navigation at Bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 shadow-xl max-w-[95%] overflow-x-auto">
            {heroBanners.map((banner, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={banner.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-sky-200' : 'bg-slate-400'}`}></span>
                  <span>{banner.navLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. OPERATIONAL WORKFORCE & FLEET SHOWCASE (HD CARDS OF DRIVERS, CAPTAINS, HELPERS, SUPERVISORS & BUSES) */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12" data-aos="fade-up">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Fleet Staffing & Operations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
              Our Operational Crew & Vehicle Portfolio
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Background-verified drivers, licensed highway captains, safety-first helpers, qualified operations supervisors, and certified commercial buses ready for turnkey deployment.
            </p>
          </div>

          {/* 5 HD Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Driver Supply */}
            <div
              className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="50"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="/assets/crew-driver-hd.png"
                  alt="Driver Supply - Professional Drivers for Your Buses"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  100% Police Verified
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    Driver Supply
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Professional Drivers for Your Buses
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Heavy-vehicle certified drivers with defensive driving licenses and annual health fitness checks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <Link to="/services#driver-provision" className="hover:underline flex items-center gap-1">
                    <span>Enquire Drivers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Helper Supply */}
            <div
              className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="/assets/crew-helper-hd.png"
                  alt="Helper Supply - Skilled Helpers for Your Operations"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Safety Certified
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    Helper Supply
                  </h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    Skilled Helpers for Your Operations
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Courteous conductors and helpers dedicated to passenger assistance, boarding, and baggage support.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <Link to="/services#driver-provision" className="hover:underline flex items-center gap-1">
                    <span>Enquire Helpers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Bus Captain Supply */}
            <div
              className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="150"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="/assets/crew-captain-hd.png"
                  alt="Bus Captain Supply - Experienced Captains for Your Buses"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Highway Certified
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
                    Bus Captain Supply
                  </h3>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">
                    Experienced Captains for Your Buses
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Senior captains delivering passenger etiquette, emergency readiness, and smooth highway transit.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                  <Link to="/services#driver-provision" className="hover:underline flex items-center gap-1">
                    <span>Enquire Captains</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Supervisor Supply */}
            <div
              className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="/assets/crew-supervisor-hd.png"
                  alt="Supervisor Supply - Qualified Supervisors for Better Management"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Operations Lead
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                    Supervisor Supply
                  </h3>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    Qualified Supervisors for Better Management
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    On-ground coordinators managing shift timings, route rosters, maintenance schedules, and dispatch.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                  <Link to="/services#fleet-supply" className="hover:underline flex items-center gap-1">
                    <span>Enquire Supervisors</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPANY INTRODUCTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Image showcase */}
            <div className="lg:col-span-5" data-aos="fade-right">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <img
                    src="/assets/crew-staffing-banner-hd.png"
                    alt="Charvik Operations & Staff"
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                </div>
                {/* Floating Experience Badge */}
                <div className="absolute -bottom-6 -right-6 sm:bottom-6 sm:right-6 bg-[#142B4A] text-white p-5 rounded-2xl shadow-2xl border border-white/10 max-w-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold leading-none">Complete Fleet Care</p>
                      <p className="text-xs text-blue-200 mt-0.5">End-to-End Staffing & Ops</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intro text */}
            <div className="lg:col-span-7 space-y-6" data-aos="fade-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Who We Are
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] tracking-tight">
                Dedicated Fleet Operations & Professional Staffing Consultancy
              </h2>

              <p className="text-slate-600 text-base leading-relaxed">
                <strong className="text-slate-900 font-semibold">Charvik Staffing Consultancy</strong> is an integrated fleet management and crew deployment organization. We eliminate the stress of transport logistics by delivering fully serviced vehicles, certified captains, and transparent operations under one roof.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Turnkey Transportation</h4>
                    <p className="text-xs text-slate-500 mt-0.5">From vehicle procurement to route dispatch and fuel management.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Trained Chauffeurs & Crew</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Medical screenings, defensive driving licenses, and background checks.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Learn more about our Vision & Mission</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE SERVICES SHOWCASE */}
      <section className="py-20 bg-[#F5F7FB] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Our Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
              Tailored Fleet & Transit Services
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Comprehensive fleet solutions engineered for reliability, safety, and operational excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
                  data-aos="fade-up"
                  data-aos-delay={idx * 80}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-[#142B4A] group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={service.link}
                      className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Explore Service</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Quick Enquiry Callout Card */}
            <div
              className="bg-gradient-to-br from-[#142B4A] to-[#1E3A5F] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Custom Requirement?
                </span>
                <h3 className="text-xl font-black mt-3 text-white">
                  Need a Bespoke Contract or Fleet Size?
                </h3>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                  Talk to our fleet managers to get a personalized proposal matching your exact routes, passenger counts, and shift hours.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="https://wa.me/919396151527?text=Hello%20Charvik%2C%20I%20have%20a%20custom%20transportation%20requirement."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#142B4A] font-bold text-xs transition"
                >
                  Send Online Enquiry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-20 bg-gradient-to-b from-[#F5F7FB] to-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              The Charvik Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
              Why Corporate Clients Choose Us
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              We operate an enterprise-grade fleet management infrastructure backed by standardized maintenance protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. ENQUIRY / CALL TO ACTION STRIP */}
      <section className="py-16 bg-[#142B4A] text-white relative overflow-hidden" data-aos="fade-up">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Bus className="w-96 h-96 text-white -mr-20 -mb-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Instant Assistance & Quotations
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 tracking-tight">
                Ready to Upgrade Your Transport Operations?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl">
                Contact our customer support desk today. We provide immediate answers, custom vehicle allocation, and prompt contract quotes.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://wa.me/919396151527?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20booking%20buses."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp Now</span>
              </a>

              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-transform hover:-translate-y-0.5"
              >
                <Phone className="w-5 h-5" />
                <span>Call +91 98765 43210</span>
              </a>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-[#142B4A] shadow-xl transition-transform hover:-translate-y-0.5"
              >
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                <span>Fill Enquiry Form</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
