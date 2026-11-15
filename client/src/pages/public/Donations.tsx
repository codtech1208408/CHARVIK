import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  Calendar,
  IndianRupee,
  User,
  Users,
  ShieldCheck,
  CheckCircle2,
  Filter,
  X,
  Eye,
  FileCheck,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export interface PublicDonationItem {
  id: string | number;
  donor_name: string;
  amount: number;
  donation_date: string;
  received_by_employee_name: string;
  received_by_employee_code?: string;
  received_by_employee_role?: string;
  payment_mode?: string;
  notes?: string;
  proof_images?: string[];
}

export const Donations: React.FC = () => {
  const [donations, setDonations] = useState<PublicDonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');

  // Lightbox Modal
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    async function fetchDonations() {
      try {
        setLoading(true);
        const data = await api.getDonations();
        const formatted = (data || []).map((d: any) => ({
          ...d,
          amount: Number(d.amount) || 0,
          proof_images: Array.isArray(d.proof_images)
            ? d.proof_images
            : (typeof d.proof_images === 'string' ? JSON.parse(d.proof_images || '[]') : [])
        }));
        setDonations(formatted);
      } catch (err) {
        console.error('Failed to load public donations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, []);

  const filtered = useMemo(() => {
    return donations.filter((item) => {
      const matchesSearch =
        item.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.received_by_employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMode = modeFilter === 'All' || item.payment_mode === modeFilter;

      let matchesDate = true;
      if (periodFilter === 'Month') {
        const d = new Date(item.donation_date);
        const now = new Date();
        matchesDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (periodFilter === 'Year') {
        const d = new Date(item.donation_date);
        const now = new Date();
        matchesDate = d.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesMode && matchesDate;
    });
  }, [donations, searchTerm, modeFilter, periodFilter]);

  const stats = useMemo(() => {
    const totalAmount = donations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDonors = donations.length;
    return { totalAmount, totalDonors };
  }, [donations]);

  const openLightbox = (images: string[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-b from-[#142B4A] via-[#1A365D] to-[#142B4A] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-rose-400 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Breadcrumb / Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-300 mb-6 shadow-sm">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <span>TRANSPARENCY & PUBLIC DONATION RECORD</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Benefactor Contributions & Staff Welfare Donations
          </h1>

          <p className="mt-4 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            All voluntary contributions and donations made to Charvik Staffing Consultancy or received on duty by our staff are publicly documented here with complete transparency, verified receiving crew accountability, and photographic proofs.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-lg text-center">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
                Total Contributions Raised
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                ₹{stats.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-lg text-center">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
                Verified Donors
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {stats.totalDonors} Benefactors
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-lg text-center">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
                Accountability
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-300 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-7 h-7 text-emerald-400" /> 100%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-5 flex flex-col md:flex-row gap-3 items-center justify-between mb-8">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name, receiving staff, or occasion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Payment Mode Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-[11px]">Mode:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="All">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI / Online">UPI / Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-[11px]">Period:</span>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="All">All Time</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Donations Cards Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-600">Loading verified donation records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800">No Donations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || modeFilter !== 'All'
                ? 'No donation records match your search criteria. Please adjust your filters.'
                : 'No donations have been published yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const proofCount = item.proof_images?.length || 0;
              const formattedDate = new Date(item.donation_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Top Card Section */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-black text-base shadow-md shadow-rose-100">
                          {item.donor_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.donor_name}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formattedDate}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {item.payment_mode || 'Cash'}
                      </span>
                    </div>

                    {/* Amount Banner */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/80 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Contribution Amount
                        </span>
                        <div className="text-2xl font-black text-emerald-600 tracking-tight">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Receiving Employee */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Received On Duty By Staff
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          {item.received_by_employee_name}
                          {item.received_by_employee_code && (
                            <span className="text-slate-500 font-mono font-normal ml-1.5">
                              ({item.received_by_employee_code})
                            </span>
                          )}
                          {item.received_by_employee_role && (
                            <span className="text-blue-600 font-semibold ml-1.5">
                              • {item.received_by_employee_role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes / Purpose */}
                    {item.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Proof Photo Gallery Section */}
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        Verified Proof Documents
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {proofCount} {proofCount === 1 ? 'Image' : 'Images'}
                      </span>
                    </div>

                    {proofCount > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {item.proof_images!.slice(0, 4).map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => openLightbox(item.proof_images!, idx)}
                            className="relative rounded-xl overflow-hidden aspect-square border border-slate-200 group/img shadow-2xs hover:border-blue-500 transition-colors cursor-pointer bg-white"
                            title="Click to view image in high definition"
                          >
                            <img
                              src={imgUrl}
                              alt={`Proof Document ${idx + 1}`}
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Receipt registered on official ledger.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Public Transparency Disclaimer */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Official Transparency & Audit Protocol
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                Charvik Staffing Consultancy publishes all voluntary donations and passenger welfare funds to uphold the highest standard of accountability. If you have contributed and need an official certificate or tax receipt, please contact our office.
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm transition-colors shrink-0"
          >
            <span>Contact Secretariat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox Carousel Modal */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-xs text-white/80 font-bold">
              {lightboxIndex + 1} / {lightboxImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center relative">
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Proof Document ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {lightboxImages.length > 1 && (
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Donations;
