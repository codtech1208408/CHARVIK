import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  Calendar,
  IndianRupee,
  User,
  Users,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Filter,
  X,
  Eye,
  FileCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  QrCode,
  Copy,
  Check,
  UserCheck,
  MessageCircle,
  ArrowUpRight,
  BadgeCheck,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export interface PublicDonationItem {
  id: string | number;
  donor_name: string;
  donor_phone?: string;
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

  // Modals for "View All"
  const [showAllDonatorsModal, setShowAllDonatorsModal] = useState(false);
  const [showAllStaffModal, setShowAllStaffModal] = useState(false);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('All');

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lightbox Modal
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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
        (item.donor_phone && item.donor_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  // Aggregate employees who received donation amounts
  const staffSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      code?: string;
      role?: string;
      totalAmount: number;
      donationCount: number;
      donations: PublicDonationItem[];
    }>();

    donations.forEach((item) => {
      const staffName = item.received_by_employee_name || 'Staff Member';
      if (!map.has(staffName)) {
        map.set(staffName, {
          name: staffName,
          code: item.received_by_employee_code,
          role: item.received_by_employee_role || 'Staff',
          totalAmount: 0,
          donationCount: 0,
          donations: []
        });
      }
      const entry = map.get(staffName)!;
      entry.totalAmount += Number(item.amount) || 0;
      entry.donationCount += 1;
      entry.donations.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [donations]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

      {/* Main Content Area: 3-Box Layout */}
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
                <option value="Online / Bank Transfer">Online / Bank Transfer</option>
                <option value="UPI">UPI</option>
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

        {/* 3 Main Interactive Boxes */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-600">Loading verified donation records...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* ================= BOX 1: DONATORS LIST (VERTICAL) ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-xl group">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-100">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 leading-tight">
                        Donators & Benefactors
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Recent voluntary contributions
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                    {filtered.length} Total
                  </span>
                </div>

                {/* Vertical Donators List */}
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No donation records found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filtered.slice(0, 5).map((item) => {
                      const formattedDate = new Date(item.donation_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {item.donor_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.donor_name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600">{item.payment_mode || 'Cash'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-emerald-600 tracking-tight">
                              ₹{Number(item.amount).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View All Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllDonatorsModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:shadow-md"
                >
                  <Eye className="w-4 h-4 text-rose-400" />
                  <span>View All Donators & Full Details ({filtered.length})</span>
                </button>
              </div>
            </div>

            {/* ================= BOX 2: EMPLOYEES WHO TOOK DONATION (VERTICAL) ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-xl group">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-100">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 leading-tight">
                        Staff Who Received Donation
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Employees who took donated money
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    {staffSummary.length} Crew
                  </span>
                </div>

                {/* Vertical Receiving Employees List */}
                {staffSummary.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No receiving staff records found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {staffSummary.slice(0, 5).map((staff) => (
                      <div
                        key={staff.name}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.code && (
                                <span className="text-[10px] text-slate-500 font-mono font-normal">
                                  ({staff.code})
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-semibold mt-0.5">
                              <span>{staff.role}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-normal">
                                {staff.donationCount} {staff.donationCount === 1 ? 'donation' : 'donations'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Received</span>
                          <div className="text-xs font-black text-slate-900 tracking-tight">
                            ₹{staff.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* View All Staff Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllStaffModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:shadow-md"
                >
                  <Users className="w-4 h-4" />
                  <span>View All Staff & Receiving History ({staffSummary.length})</span>
                </button>
              </div>
            </div>

            {/* ================= BOX 3: DONATE NOW (QR CODE & ACCOUNT DETAILS) ================= */}
            <div className="bg-gradient-to-b from-white to-blue-50/50 rounded-2xl border-2 border-blue-500/25 shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-xl relative overflow-hidden">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-blue-100/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-100">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 leading-tight">
                        Donate & Support Crew
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Scan QR code or transfer to account
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Instant Verified
                  </span>
                </div>

                {/* QR Code Display Card */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div
                    onClick={() => setIsQrModalOpen(true)}
                    className="p-2.5 bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm relative group cursor-pointer hover:border-blue-500 transition-colors"
                    title="Click to view QR code full size"
                  >
                    <img
                      src="/charvik-donation-qr.png"
                      alt="Charvik Staffing Consultancy UPI QR Code"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[11px] font-bold gap-1 pointer-events-none">
                      <Eye className="w-3.5 h-3.5" /> Enlarge QR
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">GPay</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">PhonePe</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Paytm</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Any UPI</span>
                  </div>
                </div>

                {/* Bank Account Particulars */}
                <div className="space-y-2 mt-3 text-xs">
                  {/* Account Number */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Account Number
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                        50200095051515
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('50200095051515', 'account')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'account' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Bank & IFSC */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Bank & IFSC Code
                      </span>
                      <div className="font-bold text-slate-800 text-xs">
                        HDFC Bank • <span className="font-mono text-slate-600">HDFC0000542</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('HDFC0000542', 'ifsc')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* UPI ID */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        UPI ID / Mobile Pay
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        9505151527@ybl
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('9505151527@ybl', 'upi')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedField === 'upi' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Notification Footnote */}
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2 shadow-2xs">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  After transfer, share screenshot via WhatsApp to{' '}
                  <a
                    href="https://wa.me/919505151527?text=Hello%20Charvik%20Staffing%2C%20I%20have%20made%20a%20welfare%20donation.%20Please%20find%20attached%20payment%20proof."
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-emerald-950"
                  >
                    +91 9505151527
                  </a>{' '}
                  for instant receipt and public ledger entry.
                </span>
              </div>
            </div>
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
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <span>Contact Secretariat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ================= MODAL 1: VIEW ALL DONATORS & FULL DETAILS ================= */}
      {showAllDonatorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#0B2545] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Complete Donators & Benefactors Registry
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Showing all {filtered.length} verified benefactor donations with receipt documents and proofs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllDonatorsModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Cards Grid */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  No matching donation records found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top: Donator & Amount */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                                {item.donor_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900">
                                  {item.donor_name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" /> {formattedDate}
                                  </span>
                                  {item.donor_phone && (
                                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      <Phone className="w-3 h-3 text-emerald-500" /> {item.donor_phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-black text-emerald-600">
                                ₹{Number(item.amount).toLocaleString('en-IN')}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {item.payment_mode || 'Cash'}
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 mb-3">
                              "{item.notes}"
                            </p>
                          )}
                        </div>

                        {/* Verified Proof Images */}
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-blue-600" /> Verified Proofs
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {proofCount} {proofCount === 1 ? 'Image' : 'Images'}
                            </span>
                          </div>
                          {proofCount > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {item.proof_images!.map((imgUrl, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => openLightbox(item.proof_images!, idx)}
                                  className="relative rounded-lg overflow-hidden aspect-square border border-slate-200 group/img cursor-pointer bg-slate-100"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Proof ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No images attached.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Total Shown: {filtered.length} Contributions
              </span>
              <button
                type="button"
                onClick={() => setShowAllDonatorsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: VIEW ALL RECEIVING STAFF & BREAKDOWN ================= */}
      {showAllStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#0B2545] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Staff Donation Intake & Accountability Registry
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Comprehensive log of all staff members who took voluntary donations and corresponding donor details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllStaffModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-5">
              {staffSummary.map((staff) => (
                <div
                  key={staff.name}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4"
                >
                  {/* Staff Summary Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <span>{staff.name}</span>
                          {staff.code && (
                            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              {staff.code}
                            </span>
                          )}
                        </h4>
                        <div className="text-xs text-blue-600 font-bold mt-0.5">
                          {staff.role} • {staff.donationCount} {staff.donationCount === 1 ? 'Intake Record' : 'Intake Records'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Funds Handled
                      </span>
                      <div className="text-xl font-black text-emerald-600">
                        ₹{staff.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* List of Donations handled by this staff */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Associated Donor Contributions ({staff.donations.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {staff.donations.map((d) => (
                        <div
                          key={d.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{d.donor_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(d.donation_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}{' '}
                              • {d.payment_mode || 'Cash'}
                            </div>
                            {d.notes && (
                              <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                                "{d.notes}"
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-emerald-600">
                              ₹{Number(d.amount).toLocaleString('en-IN')}
                            </div>
                            {d.proof_images && d.proof_images.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openLightbox(d.proof_images!, 0)}
                                className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> View Proof
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Total Staff Members: {staffSummary.length}
              </span>
              <button
                type="button"
                onClick={() => setShowAllStaffModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Centered QR Payment Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Charvik UPI Payment</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Charvik Staffing Welfare
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Scan with any UPI app to donate directly
            </p>

            {/* Crisp QR Code Container */}
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
              <img
                src="/charvik-donation-qr.png"
                alt="Charvik Donation QR Code"
                className="w-56 h-56 object-contain rounded-xl"
              />
            </div>

            {/* Supported Apps */}
            <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">GPay</span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">PhonePe</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">Paytm</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">BHIM / UPI</span>
            </div>

            {/* Quick Details with Copy */}
            <div className="w-full mt-4 space-y-2 text-xs text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">UPI ID</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">9505151527@ybl</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('9505151527@ybl', 'modal-upi')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedField === 'modal-upi' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account No. (HDFC)</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">50200095051515</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('50200095051515', 'modal-account')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedField === 'modal-account' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Carousel Modal */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
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
              alt={`Document ${lightboxIndex + 1}`}
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
