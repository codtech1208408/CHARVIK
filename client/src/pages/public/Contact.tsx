import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  ShieldCheck,
  Building2,
  CalendarCheck
} from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'bus-rental',
    requirementDetails: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate quick submit
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="overflow-hidden">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-[#0c1b30] via-[#142B4A] to-[#1E3A5F] text-white py-16 sm:py-20 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span
            className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3"
            data-aos="fade-down"
          >
            Get In Touch
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            data-aos="fade-up"
          >
            Contact Charvik Fleet Consultancy
          </h1>
          <p
            className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Reach our fleet coordinators directly for bookings, long-term proposals, driver deployment, or emergency transit assistance.
          </p>
        </div>
      </section>

      {/* 2. Direct Action Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Need Instant Answers?
            </span>
            <a
              href="https://wa.me/919876543210?text=Hello%20Charvik%2C%20I%20have%20an%20urgent%20fleet%20requirement."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct (+91 98765 43210)</span>
            </a>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Phone className="w-4 h-4" />
              <span>Call Helpline Directly</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Form and Contact Information Grid */}
      <section className="py-16 sm:py-20 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6" data-aos="fade-right">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Headquarters
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] mt-2">
                  We're Here to Assist You
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Visit our office, give us a call, or send an email anytime.
                </p>
              </div>

              {/* Cards */}
              <div className="space-y-4">
                {/* Address */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Head Office Location</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Plot 42, Transport Nagar, Vijayawada, Andhra Pradesh - 520007, India
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Phone Numbers</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      <a href="tel:+919876543210" className="font-semibold text-blue-600 hover:underline">
                        +91 98765 43210
                      </a> (Primary Fleet Booking)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      +91 98765 43211 (Maintenance & Support Desk)
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Email Address</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      <a href="mailto:contact@charvikstaffing.com" className="font-semibold text-blue-600 hover:underline">
                        contact@charvikstaffing.com
                      </a>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      support@charvikstaffing.com
                    </p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Operating Hours</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Fleet Operations & Emergency Helpline: <strong className="text-emerald-700">24/7 Active</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Office Hours: Monday – Saturday (9:00 AM – 7:00 PM)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form Column */}
            <div className="lg:col-span-7" data-aos="fade-left">
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">
                      Enquiry Received Successfully!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Thank you for contacting Charvik Staffing Consultancy. Our fleet coordination manager will reach out within 2 hours.
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: '',
                            phone: '',
                            email: '',
                            service: 'bus-rental',
                            requirementDetails: '',
                          });
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#142B4A] text-white hover:bg-[#1E3A5F] transition"
                      >
                        Submit Another Enquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-[#142B4A]">
                        Send Us an Online Fleet Enquiry
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Fill out your requirements below and receive an instant commercial quote.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. +91 98765 00000"
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. corporate@company.com"
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Service Interested In *
                        </label>
                        <select
                          value={formData.service}
                          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                        >
                          <option value="bus-rental">Bus Rental & Hire</option>
                          <option value="fleet-supply">Corporate Fleet Supply</option>
                          <option value="driver-provision">Driver / Helper / Captain Provision</option>
                          <option value="maintenance-fleet">Maintenance-Backed Operations</option>
                          <option value="project-transport">Project / Contract Transportation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Requirement Details (Number of buses, routes, dates, etc.) *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.requirementDetails}
                        onChange={(e) => setFormData({ ...formData, requirementDetails: e.target.value })}
                        placeholder="Please describe your passenger count, dates, pickup location, or any specific requirements..."
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Enquiry Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Google Maps Section */}
      <section className="bg-white py-16 border-t border-slate-200" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Interactive Map
            </span>
            <h3 className="text-2xl font-black text-[#142B4A] mt-2">
              Find Our Depot & Regional Office
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Conveniently located near the transport corridor for rapid vehicle deployment.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-96">
            <iframe
              title="Charvik Fleet Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122410.0526978456!2d80.56948510834313!3d16.510313426294793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35eff9482d944b%3A0x939b7e84ab4a0265!2sVijayawada%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};
