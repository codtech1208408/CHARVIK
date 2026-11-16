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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  CalendarCheck
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

  // 4 Full-Width Promotional Banners with 3.5s Auto-Scroll & Navigation
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const heroBanners = [
    {
      id: 1,
      image: '/assets/home-banner-1.jpg',
      title: 'Bus Staff & Fleet Support Services',
      bgColor: 'bg-[#002859]',
      link: '/services#fleet-supply',
      objectPosition: 'object-center'
    },
    {
      id: 2,
      image: '/assets/home-banner-2.jpg',
      title: 'Complete Workforce & Fleet Support for Bus Operations',
      bgColor: 'bg-[#dbe7f5]',
      link: '/contact',
      objectPosition: 'object-center'
    },
    {
      id: 3,
      image: '/assets/home-banner-3.jpg',
      title: '24/7 Mobile Fleet Maintenance & Breakdown Services',
      bgColor: 'bg-[#07193d]',
      link: '/services#maintenance-fleet',
      objectPosition: 'object-[center_30%]'
    },
    {
      id: 4,
      image: '/assets/home-banner-4.jpg',
      title: 'Executive Corporate Shuttles & Luxury Bus Rentals',
      bgColor: 'bg-white',
      link: '/services#bus-rental',
      objectPosition: 'object-[center_30%]'
    }
  ];

  // Auto-advance banner every 3.5 seconds unless user hovers
  React.useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, heroBanners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  return (
    <div className="overflow-hidden">
      {/* 1. FULL-WIDTH 4-BANNER AUTO-SCROLLER (FULL PAGE, ZERO WHITE SPACE) */}
      <section className="relative w-full overflow-hidden select-none bg-slate-950">
        <div
          className="relative w-full h-[calc(100vh-5rem)] min-h-[560px] max-h-[880px] overflow-hidden group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Render all 4 banners with smooth crossfade */}
          {heroBanners.map((banner, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Link
                  to={banner.link}
                  className="block w-full h-full cursor-pointer relative"
                  title={banner.title}
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className={`w-full h-full object-cover ${banner.objectPosition || 'object-center'} select-none`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              </div>
            );
          })}

          {/* Left Arrow Navigation */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            aria-label="Previous Banner"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Navigation */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            aria-label="Next Banner"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Slide Indicator Controls */}
          <div className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md pointer-events-auto">
              {heroBanners.map((banner, index) => {
                const isActive = index === currentSlide;
                return (
                  <button
                    key={banner.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`transition-all rounded-full cursor-pointer ${isActive
                        ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-blue-500 shadow-sm'
                        : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/80'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>
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
                href="https://wa.me/919396151527?text=Hello%20Charvik%20Fleet%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
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

      {/* 4. WHY CHOOSE US */}
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
