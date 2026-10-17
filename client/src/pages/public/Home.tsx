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
  Sparkles,
  MapPin,
  CalendarCheck
} from 'lucide-react';

export const Home: React.FC = () => {
  const fleetPhotos = [
    {
      src: '/assets/fleet1.jpg',
      title: 'Luxury Executive Passenger Coach',
      desc: 'High-comfort corporate and executive transport with ergonomic seating, climate control, and modern amenities.',
      badge: 'Executive Class',
      capacity: '40 - 50 Seats',
    },
    {
      src: '/assets/fleet2.jpg',
      title: 'Corporate Staff Commute Coach',
      desc: 'Dedicated daily transport for tech parks, industrial corridors, and institutional employee routes.',
      badge: 'Corporate Shuttle',
      capacity: '45 - 55 Seats',
    },
    {
      src: '/assets/fleet3.jpg',
      title: 'Multi-Vehicle Commercial Fleet',
      desc: 'Expansive depot capacity ready for immediate turnkey deployment on long-term corporate contracts.',
      badge: 'Depot Fleet',
      capacity: '30+ Available',
    },
    {
      src: '/assets/fleet5.jpg',
      title: 'Highway Touring & Contract Coach',
      desc: 'Smooth highway mobility with verified captains, suited for interstate tours and long-distance transit.',
      badge: 'Express Touring',
      capacity: '45 - 52 Seats',
    },
  ];

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

  // 4 Full-Page Banners with 2.5s Auto-Scroll
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const heroBanners = [
    {
      id: 1,
      image: '/assets/fleet1.jpg',
      badge: 'Premier Commercial Fleet & Crew Solutions',
      titleHighlight: 'Reliable Fleets.',
      titleMain: 'Professional Crews. Seamless Journeys.',
      description:
        'Charvik Staffing Consultancy delivers comprehensive bus rentals, turnkey corporate fleet supply, certified drivers & captains, and maintenance-backed mobility operations across India.',
      primaryBtn: { text: 'Request a Fleet Quote', link: '/contact' },
      metrics: [
        { label: 'Buses in Fleet', value: '30+' },
        { label: 'Verified Drivers', value: '100%' },
        { label: 'Breakdown Support', value: '24/7' },
      ],
    },
    {
      id: 2,
      image: '/assets/fleet2.jpg',
      badge: 'Dedicated Corporate Employee Commute',
      titleHighlight: 'Punctual Shuttles.',
      titleMain: 'Tech Park & Corporate Transit Solutions.',
      description:
        'Customized shift routing, luxury air-conditioned coaches, and GPS-monitored routes tailored for IT hubs, multinational corporations, and manufacturing plants.',
      primaryBtn: { text: 'Explore Fleet Supply', link: '/services#fleet-supply' },
      metrics: [
        { label: 'On-Time Punctuality', value: '99.8%' },
        { label: 'Dedicated Account Lead', value: '1-on-1' },
        { label: 'Custom Rosters', value: '24/7' },
      ],
    },
    {
      id: 3,
      image: '/assets/fleet3.jpg',
      badge: 'Expansive Depot Capacity & Fleet Hire',
      titleHighlight: '30+ Modern Buses.',
      titleMain: 'Ready for Instant Commercial Deployment.',
      description:
        'High-capacity luxury coaches and standard buses for educational institutions, infrastructure project corridors, event conventions, and pilgrim journeys.',
      primaryBtn: { text: 'View Bus Rentals', link: '/services#bus-rental' },
      metrics: [
        { label: 'Seating Options', value: '36 - 55' },
        { label: 'State & National Permits', value: 'All India' },
        { label: 'Instant Allocation', value: 'Direct' },
      ],
    },
    {
      id: 4,
      image: '/assets/fleet4.jpg',
      badge: 'Zero-Breakdown Commitment & Certified Crew',
      titleHighlight: 'Maintenance-Backed.',
      titleMain: 'Safe Buses & Police-Verified Captains.',
      description:
        'Every vehicle undergoes routine computerized tyre audits, scheduled oil replacement, AC performance checks, and is operated by background-verified licensed drivers.',
      primaryBtn: { text: 'Maintenance Protocols', link: '/services#maintenance-fleet' },
      metrics: [
        { label: 'Preventive Care', value: 'Daily' },
        { label: 'Mobile Repair Squads', value: 'On-Call' },
        { label: 'Verified Crew', value: '100%' },
      ],
    },
  ];

  // Auto-advance banner every 2.5 seconds (2-3 seconds requirement)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  return (
    <div className="overflow-hidden">
      {/* 1. FULL-WIDTH 4-BANNER AUTO-SCROLLER (PURE BRIGHT IMAGES, NO BLACK OVERLAY) */}
      <section className="relative w-full bg-slate-100 overflow-hidden select-none">
        <div className="relative w-full h-[calc(100vh-6rem)] min-h-[580px] max-h-[850px] overflow-hidden">
          {/* Render all 4 banners with smooth crossfade and professional left-aligned text */}
          {heroBanners.map((banner, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Pure high-resolution commercial bus background */}
                <img
                  src={banner.image}
                  alt={banner.titleMain}
                  className="w-full h-full object-cover object-center"
                />

                {/* Professional cinematic left gradient for crisp, elegant text visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent flex items-center z-20">
                  <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                    <div className="max-w-xl text-white space-y-4 sm:space-y-5">
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
                      <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed drop-shadow max-w-lg">
                        {banner.description}
                      </p>

                      {/* Call-to-Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <Link
                          to={banner.primaryBtn.link}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:-translate-y-0.5"
                        >
                          <span>{banner.primaryBtn.text}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <a
                          href="https://wa.me/919876543210?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
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
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slide Indicator Dots at Bottom-Right */}
          <div className="absolute bottom-6 right-6 sm:right-10 z-30 flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-lg">
            {heroBanners.map((banner, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={banner.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all rounded-full ${
                    isActive
                      ? 'w-7 h-2 bg-blue-500 shadow-sm'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. HERO CONTENT & ENQUIRY SECTION (BELOW THE BANNER - CRISP, BRIGHT, LIKE BEFORE) */}
      <section className="bg-white border-b border-slate-200/80 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6" data-aos="fade-up">
            {/* Top Category Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Premier Commercial Fleet & Crew Solutions</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#142B4A] leading-tight">
              Reliable Fleets.{' '}
              <span className="text-blue-600">Professional Crews.</span>{' '}
              Seamless Journeys.
            </h1>

            {/* Subtext description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Charvik Staffing Consultancy delivers comprehensive bus rentals, turnkey corporate fleet supply, certified drivers & captains, and maintenance-backed mobility operations across India.
            </p>

            {/* Action & Enquiry Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Request a Fleet Quote</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/919876543210?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Enquiry</span>
              </a>

              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-50 hover:bg-slate-100 text-[#142B4A] border border-slate-300 transition-all"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Call Us (+91 98765 43210)</span>
              </a>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-2xl sm:text-3xl font-black text-[#142B4A]">30+</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Buses in Fleet</p>
                <p className="text-[11px] text-slate-500">AC & Non-AC coaches</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-2xl sm:text-3xl font-black text-blue-600">100%</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Verified Drivers</p>
                <p className="text-[11px] text-slate-500">Police & medical cleared</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">24/7</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Breakdown Support</p>
                <p className="text-[11px] text-slate-500">Mobile repair units</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-2xl sm:text-3xl font-black text-[#142B4A]">99.8%</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Punctual Trips</p>
                <p className="text-[11px] text-slate-500">On-time SLA guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPANY INTRODUCTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Image showcase */}
            <div className="lg:col-span-5" data-aos="fade-right">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <img
                    src="/assets/fleet3.jpg"
                    alt="Charvik Operations"
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

      {/* 3. CORE SERVICES SHOWCASE */}
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
                  href="https://wa.me/919876543210?text=Hello%20Charvik%2C%20I%20have%20a%20custom%20transportation%20requirement."
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

      {/* 4. FLEET HIGHLIGHTS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12" data-aos="fade-up">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Fleet Highlights
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#142B4A] mt-3 tracking-tight">
                Our Operational Vehicle Portfolio
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Well-maintained, clean, certified buses ready for immediate deployment.
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
              >
                <span>View Complete Fleet Specifications</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fleetPhotos.map((item, idx) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#142B4A]/90 text-white backdrop-blur-xs">
                      {item.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm">
                      {item.capacity}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Inspected & Certified
                    </span>
                    <a
                      href="https://wa.me/919876543210?text=Hello%20Charvik%2C%20I%20am%20interested%20in%20booking%20the%20bus%20fleet."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Book &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ))}
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
                href="https://wa.me/919876543210?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20booking%20buses."
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
