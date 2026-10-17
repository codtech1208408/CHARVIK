import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Users,
  Award,
  Wrench,
  Clock,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
  Shield,
  FileCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

export const Services: React.FC = () => {
  const servicesList = [
    {
      id: 'bus-rental',
      title: 'Bus Rental & Hire',
      subtitle: 'Flexible Daily, Weekly, and Monthly Commercial Bus Hire',
      desc: 'Whether you require a single 40-seater luxury bus for a corporate offsite, or multiple coaches for an institutional convention, our bus rental solutions provide modern, AC and non-AC buses on demand with experienced chauffeurs.',
      icon: Bus,
      image: '/assets/fleet1.jpg',
      features: [
        'Luxury AC push-back and semi-sleeper configurations',
        'Standard non-AC high-capacity buses (40 to 55 seats)',
        'GPS-enabled live tracking and speed governor compliance',
        'Clean, sanitized interiors with sound systems and charging ports',
        'Transparent slab-based daily and distance billing',
      ],
      whatsappMsg: 'Hello Charvik, I would like to inquire about Bus Rental & Hire services.',
    },
    {
      id: 'fleet-supply',
      title: 'Fleet Supply for Corporates & Institutions',
      subtitle: 'End-to-End Dedicated Fleet Sourcing & Long-Term Leases',
      desc: 'We supply customized bus fleets for IT firms, manufacturing hubs, educational universities, and government establishments. We manage the fleet lifecycle, insurance, compliance, and scheduled rotations so your leadership can focus on business.',
      icon: Users,
      image: '/assets/fleet2.jpg',
      features: [
        'Dedicated vehicle allocation with client branding option',
        'Shift-based employee commute routing and rostering',
        'Guaranteed replacement buses in case of unforeseen breakdowns',
        'Centralized monthly invoicing with detailed kilometer audits',
        'Strict statutory insurance, fitness, and state permit coverage',
      ],
      whatsappMsg: 'Hello Charvik, I would like to inquire about Corporate Fleet Supply.',
    },
    {
      id: 'driver-provision',
      title: 'Driver / Helper / Captain Provision',
      subtitle: 'Certified, Police-Verified Crew & Chauffeur Staffing',
      desc: 'Sourcing and retaining competent commercial heavy-vehicle drivers is challenging. Charvik provides vetted, trained, and medically fit bus drivers, licensed captains, and courteous conductors/helpers to operate your transit routes securely.',
      icon: Award,
      image: '/assets/fleet5.jpg',
      features: [
        '100% background and police-verified credentials',
        'Valid commercial Heavy Transport Vehicle (HTV/HMV) badges',
        'Mandatory annual medical and vision checkups',
        'Training in defensive driving, passenger etiquette, and road safety',
        'Dedicated support staff and helpers for schools & industrial routes',
      ],
      whatsappMsg: 'Hello Charvik, I would like to enquire about Driver, Helper & Captain Provision.',
    },
    {
      id: 'maintenance-fleet',
      title: 'Maintenance-Backed Fleet Operations',
      subtitle: 'Proactive Vehicle Upkeep, Zero-Breakdown Assurance',
      desc: 'Our fleet operations are anchored by an in-house fleet maintenance framework. We track daily kilometers, schedule preventive maintenance, inspect tyres, service air-conditioning units, replace oil & filters, and monitor battery health to ensure peak reliability.',
      icon: Wrench,
      image: '/assets/fleet4.jpg',
      features: [
        'Kilometer-driven oil, fuel, and air filter replacements',
        'Laser-aligned tyre pressure, tread depth, and retread monitoring',
        'Pre-trip AC cooling, compressor, and gas pressure audits',
        'Battery voltage, specific gravity, and terminal testing',
        '24/7 on-call roadside assistance and mobile mechanic squads',
      ],
      whatsappMsg: 'Hello Charvik, I would like to learn about Maintenance-Backed Fleet Operations.',
    },
    {
      id: 'project-transport',
      title: 'Project / Contract Transportation Services',
      subtitle: 'Turnkey Transit Logistics for Long-Term Infrastructure Projects',
      desc: 'From remote construction sites, power plants, and industrial greenfield projects to mega conferences and pilgrimage movements, Charvik designs and executes reliable route transit tailored to heavy project conditions.',
      icon: Clock,
      image: '/assets/fleet3.jpg',
      features: [
        'Tailored site-to-camp and employee transit logistics',
        'Heavy-duty buses adapted for rugged terrain and industrial zones',
        'Dedicated on-site transport coordinator and route supervisor',
        'Custom shift logistics (day/night shifts, 24/7 operational cycles)',
        'Full SLA commitments with penalty-backed punctuality guarantees',
      ],
      whatsappMsg: 'Hello Charvik, I would like to discuss Project / Contract Transportation.',
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-[#0c1b30] via-[#142B4A] to-[#1E3A5F] text-white py-16 sm:py-20 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span
            className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3"
            data-aos="fade-down"
          >
            Comprehensive Fleet Solutions
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            data-aos="fade-up"
          >
            Our Fleet & Staffing Services
          </h1>
          <p
            className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Delivering excellence in commercial bus rentals, corporate fleet operations, trained driving crew, and heavy-project logistics.
          </p>
        </div>
      </section>

      {/* 2. Services Detailed Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {servicesList.map((service, index) => {
            const Icon = service.icon;
            const isEven = index % 2 === 1;

            return (
              <div
                key={service.id}
                id={service.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
                data-aos={isEven ? 'fade-left' : 'fade-right'}
              >
                {/* Visual / Image Side */}
                <div className={`lg:col-span-5 ${isEven ? 'lg:order-2' : ''}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="w-12 h-12 rounded-xl bg-[#142B4A]/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className={`lg:col-span-7 space-y-5 ${isEven ? 'lg:order-1' : ''}`}>
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Service #{index + 1}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] mt-2 tracking-tight">
                      {service.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                      {service.subtitle}
                    </p>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {service.desc}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Key Highlights & Inclusions:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {service.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={`https://wa.me/919876543210?text=${encodeURIComponent(service.whatsappMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Book on WhatsApp</span>
                    </a>

                    <a
                      href="tel:+919876543210"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition"
                    >
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>Call for Rates</span>
                    </a>

                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition"
                    >
                      <span>Custom Proposal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Bottom CTA */}
      <section className="py-16 bg-[#142B4A] text-white" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black">
            Have a Specific Project or Fleet Tender?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-2">
            Send us your tender specifications, route rosters, or requirement details. We respond within 2 working hours with comprehensive commercials.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl transition"
            >
              <span>Submit Project Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Direct Hotline: +91 98765 43210</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
