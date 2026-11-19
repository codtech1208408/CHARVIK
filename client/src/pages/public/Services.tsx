import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Truck,
  Users,
  Star,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const Services: React.FC = () => {
  const servicesList = [
    {
      id: 'travel-services',
      anchorAliases: ['bus-rental', 'travel', 'tickets'],
      title: 'Travel Services',
      subtitle: 'Your One-Stop Travel & Holiday Partner across India',
      tagline: 'Best Fares • Easy Booking • Secure Payments • 24/7 Support • Exclusive Deals • Customized Packages',
      desc: 'Charvik delivers comprehensive multimodal ticketing and holiday planning for corporate clients, tourist groups, and individual travelers. From reserved train tatkal bookings and scheduled intercity luxury buses to instant flight ticket issuance, chauffeur-driven rental cabs, and custom holiday tour packages, we guarantee seamless end-to-end journey coordination.',
      icon: Plane,
      image: '/assets/service-travel-banner.jpg?v=20261119_no_logo',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      features: [
        'Train Tickets: Confirmed and tatkal booking assistance with best fares across Indian Railways networks.',
        'Bus Tickets: Nationwide luxury sleeper, semi-sleeper, Volvo multi-axle, and AC/Non-AC intercity bookings.',
        'Flight Tickets: Domestic and international flight ticketing with instant seat confirmation and lowest airfares.',
        'Cab Services: On-demand airport transfers, outstation cab rentals, and city point-to-point chauffeur services.',
        'Tour Packages: Handcrafted family vacations, corporate retreats, and pilgrimage holiday packages.',
        'Holidays & Getaways: Tailored luxury hotel reservations, scenic sightseeing, and end-to-end travel management.',
      ],
      whatsappMsg: 'Hello Charvik, I would like to inquire about your Travel Services (Train, Bus, Flight, Cab & Holidays).',
    },
    {
      id: 'cargo-services',
      anchorAliases: ['project-transport', 'cargo', 'logistics'],
      title: 'Transport & Cargo Services',
      subtitle: 'Safe, Reliable, Fast & Pan-India Logistics Solutions',
      tagline: 'Safe & Secure Handling • On-Time Delivery • Real-Time Tracking • Flexible Logistics • All Types of Cargo & Vehicles • 24/7 Support',
      desc: 'Charvik Transport & Cargo provides integrated logistics, parcel movement, and commercial vehicle supply across India. We manage door-to-door express parcel deliveries, full truck loads, and temperature-sensitive freight with complete transparency, transit insurance, and SLA-guaranteed delivery timelines.',
      icon: Truck,
      image: '/assets/service-cargo-banner.jpg?v=20261119_no_logo',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      features: [
        'Cargo Booking & Pickup: Convenient consignee dispatch, doorstep collection, and centralized hub handling.',
        'Door to Door Delivery: Safe, prompt transit from warehouse to doorstep across Tier-1, Tier-2, and remote destinations.',
        'Parcel & Small Cargo: Rapid logistics for small cartons, commercial merchandise, and priority shipments.',
        'Part Load (LTL) & Full Truck Load (FTL): Cost-effective multi-vendor consolidations and dedicated full-body trucks.',
        'Temperature Controlled Cargo: Modern reefer trucks for pharmaceuticals, cold-chain perishables, and dairy.',
        'Project & Heavy Cargo: Specialized trailers for heavy machinery, over-dimensional cargo, and plant equipment.',
        'Vehicle Transportation: Secure carrier transport for two-wheelers, four-wheelers, and commercial fleets.',
        'Bus Services & Group Travel: Dedicated bus booking, corporate charter leases, and institutional transit.',
      ],
      whatsappMsg: 'Hello Charvik, I would like to inquire about Transport & Cargo Services.',
    },
    {
      id: 'manpower-supply',
      anchorAliases: ['driver-provision', 'fleet-supply', 'staffing', 'crew'],
      title: 'Manpower Supply for Transport & Fleet Operations',
      subtitle: 'Verified, Experienced & Professionally Trained Commercial Transport Crew',
      tagline: 'Verified & Trained Staff • On-Demand Supply • Short & Long-Term Support • Transport Domain Expertise • Pan-India Staffing • Compliant Service',
      desc: 'Finding reliable, licensed, and responsible crew for heavy commercial bus fleets is critical for safety and uptime. Charvik specializes in sourcing, vetting, training, and deploying drivers, helpers, bus captains, and fleet supervisors for private operators, corporate shuttles, and intercity routes.',
      icon: Users,
      image: '/assets/service-manpower-banner.jpg?v=20261119_no_logo',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      features: [
        'Driver Supply: Experienced, police-verified commercial heavy transport (HTV/HMV) drivers trained in defensive driving.',
        'Helper Supply: Courteous, dependable helpers for passenger luggage handling, boarding coordination, and bus maintenance.',
        'Captain Supply: Professional bus captains who manage route timings, passenger hospitality, onboard logistics, and digital ticketing.',
        'Supervisor Supply: Seasoned operations controllers who supervise fleet schedules, crew shifts, depot audits, and road incident response.',
        'Flexible Deployment: Available on daily shift-basis, monthly contracts, seasonal peak surges, or long-term institutional leases.',
        'Complete Compliance: Strict statutory verification, annual eye & medical checkups, and labor law compliance.',
      ],
      whatsappMsg: 'Hello Charvik, I would like to enquire about Driver, Helper, Captain & Supervisor Supply.',
    },
    {
      id: 'bus-rating',
      anchorAliases: ['rating', 'quality-audit', '5-star'],
      title: 'Bus 5-Star Rating Service',
      subtitle: 'Enhance Bus Quality, Safety, Comfort & Passenger Service Standards',
      tagline: 'Quality Bus Fleet • Better Passenger Experience • Safety Assurance • Higher Customer Satisfaction • Improved Business Reputation',
      desc: 'Our proprietary 5-Star Bus Rating & Certification program evaluates and rates passenger buses on safety, comfort, cleanliness, and crew etiquette. Operators and fleet owners use Charvik certification to build passenger trust, charge premium fares, and maintain world-class fleet standards.',
      icon: Star,
      image: '/assets/service-rating-banner.jpg?v=20261119_no_logo',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      features: [
        'Vehicle Condition Inspection: Comprehensive audit of chassis, brake systems, tyres, exterior bodywork, and lighting.',
        'Passenger Comfort Evaluation: Push-back ergonomics, legroom spacing, upholstery quality, USB charging, and suspension smoothness.',
        'AC & Climate Performance: Testing airflow efficiency, duct sanitation, cooling consistency, and compressor health.',
        'Safety & Compliance Check: Physical inspection of emergency exits, fire extinguishers, first-aid kits, GPS trackers, and speed governors.',
        'Cleanliness & Hygiene Standards: High-standard cabin disinfection, spotless seat covers, odor-free curtains, and pest control.',
        'Maintenance & Service Review: Verification of daily maintenance logs, oil change intervals, retread records, and battery health.',
        'Driver & Crew Professionalism: Assessment of driver uniform, road conduct, passenger courtesy, and sobriety checks.',
        'On-Road Service Experience: Real-world route audits measuring on-time departure, smooth driving, and passenger feedback.',
      ],
      whatsappMsg: 'Hello Charvik, I want to get my bus fleet rated & certified with the 5-Star Rating Service.',
    },
    {
      id: 'breakdown-support',
      anchorAliases: ['maintenance-fleet', 'breakdown', 'mechanic', 'electrician'],
      title: 'On-Road Breakdown Support',
      subtitle: '24/7 Emergency Highway Breakdown, Mechanic & Electrician Hiring Services',
      tagline: 'Roadside Repair Support • Skilled Manpower • Quick Deployment • Verified Service Partners • All India Coverage',
      desc: 'Never leave your bus, truck, or commercial vehicle stranded on the highway. Charvik operates a rapid-response emergency breakdown assistance network spanning major national and state highways across India. With one call or dispatch request, we deploy certified mechanics and auto-electricians directly to your breakdown spot.',
      icon: Wrench,
      image: '/assets/service-breakdown-banner.jpg?v=20261119_no_logo',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      features: [
        'Mechanic Support: Emergency on-site repairs for engine overheating, radiator leaks, clutch plates, air-brake locks, gearboxes, and suspension.',
        'Electrician Support: Rapid diagnostics for alternator failure, dead battery jump-starts, starter motor faults, wiring burnout, and electronic sensors.',
        'Local Contact Person Hiring: Direct coordination with verified local mechanics and authorized garage specialists closest to the breakdown coordinates.',
        '24/7 Breakdown Assistance: Round-the-clock emergency dispatch desk operating 365 days a year across day and night highway shifts.',
        'Pan-India Verified Partner Network: Pre-screened workshops and mobile breakdown squads strategically positioned along high-density corridors.',
        'Towing & Transshipment Coordination: In case of catastrophic failure, Charvik coordinates passenger transshipment and heavy towing.',
      ],
      whatsappMsg: 'Hello Charvik, I require emergency On-Road Breakdown Support / Mechanic & Electrician hiring.',
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-[#0c1b30] via-[#142B4A] to-[#1E3A5F] text-white py-16 sm:py-20 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            Comprehensive Fleet, Travel & Transport Solutions
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            data-aos="fade-up"
          >
            Our Core Services & Operational Solutions
          </h1>
          <p
            className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Delivering excellence across Pan-India travel bookings, cargo transportation, commercial crew staffing, 5-star bus audits, and 24/7 highway breakdown assistance.
          </p>
        </div>
      </section>

      {/* 2. Services Detailed Sections */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {servicesList.map((service, index) => {
            const isEven = index % 2 === 1;

            return (
              <div
                key={service.id}
                id={service.id}
                className="scroll-mt-28"
              >
                {/* Hidden anchor targets for backward compatibility with previous route hashes */}
                {service.anchorAliases?.map((alias) => (
                  <span key={alias} id={alias} className="scroll-mt-28 block h-0 -mt-0 invisible" />
                ))}

                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                  data-aos={isEven ? 'fade-left' : 'fade-right'}
                >
                  {/* Visual / HD Poster Image Side */}
                  <div className={`lg:col-span-6 ${isEven ? 'lg:order-2' : ''}`}>
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200/90 bg-slate-950 group transition-all duration-300 hover:shadow-2xl hover:border-blue-400">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-auto object-contain select-none transition-transform duration-500 group-hover:scale-[1.01]"
                        loading="eager"
                      />
                    </div>
                  </div>

                  {/* Content Side beside the poster */}
                  <div className={`lg:col-span-6 space-y-5 ${isEven ? 'lg:order-1' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${service.badgeColor}`}>
                          Service #{index + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          Pan-India Coverage
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#142B4A] tracking-tight">
                        {service.title}
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">
                        {service.subtitle}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 italic">
                        {service.tagline}
                      </p>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">
                      {service.desc}
                    </p>

                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Key Offerings & Operational Inclusions:</span>
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                        {service.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 hover:bg-white hover:border-blue-200 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                            <span className="leading-snug font-medium">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <a
                        href={`https://wa.me/919505151527?text=${encodeURIComponent(service.whatsappMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Book / Enquire on WhatsApp</span>
                      </a>

                      <a
                        href="tel:+919505151527"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>Call +91 95051 51527</span>
                      </a>

                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-colors"
                      >
                        <span>Custom Proposal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
            Have a Specific Fleet, Crew or Logistics Requirement?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-2">
            Send us your travel schedules, crew staffing roster, or cargo specifications. Our logistics coordination managers will reach out within 2 hours.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl transition"
            >
              <span>Submit Requirement Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="tel:+919505151527"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Direct Hotline: +91 95051 51527</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
