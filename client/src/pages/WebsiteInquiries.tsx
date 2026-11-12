import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Clock,
  Filter,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Users,
  Check
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

interface InquiryItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  service_type: string;
  message: string;
  date: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Converted' | 'Closed';
}

const STORAGE_KEY = 'charvik_website_inquiries_data';

export const WebsiteInquiries: React.FC = () => {
  const { success, error } = useToast();

  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              name: 'Raghavendra Rao',
              phone: '9849011223',
              email: 'raghavendra@techsolutions.com',
              service_type: 'Corporate Staff Bus Rental',
              message: 'Looking for 3 air-conditioned 45-seater buses for daily employee transit between Miyapur and Gachibowli.',
              date: '2026-10-23',
              status: 'New'
            },
            {
              id: 2,
              name: 'Priyanka Sharma',
              phone: '9701044556',
              email: 'priyanka@springdales.edu',
              service_type: 'School Transport Contract',
              message: 'Require 5 buses with GPS tracking, CCTV, and verified lady helpers for the academic year.',
              date: '2026-10-22',
              status: 'Contacted'
            }
          ];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
    } catch {}
  }, [inquiries]);

  const handleStatusChange = (id: number, nextStatus: InquiryItem['status']) => {
    const updated = inquiries.map((i) => (i.id === id ? { ...i, status: nextStatus } : i));
    setInquiries(updated);
    success(`Inquiry marked as ${nextStatus}.`);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to remove this inquiry?')) return;
    setInquiries(inquiries.filter((i) => i.id !== id));
    success('Inquiry deleted.');
  };

  const filtered = inquiries.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.service_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const newCount = inquiries.filter((i) => i.status === 'New').length;

  return (
    <div className="space-y-6">
      {/* Page Hero Banner with Bus Coach */}
      <div className="bg-gradient-to-r from-[#0052cc] via-[#1a73e8] to-[#0d47a1] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Bell className="w-7 h-7 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Website Inquiries &amp; Customer Leads
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Public Lead Portal
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium mt-1">
              Incoming quote requests, client contact messages, and staffing consultations from the public portal.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Action Button */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet2.jpg"
                alt="Customer Inquiries Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Charter Bookings</span>
              </div>
            </div>
          </div>

          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-blue-700 bg-white hover:bg-blue-50 transition-all shadow-md shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>View Public Form</span>
            <ExternalLink className="w-4 h-4 text-blue-700" />
          </a>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards (Matching Image 3 Glowing Color Palettes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* 1. New Inquiries (Cyan / Sky) */}
        <div className="bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-2 border-[#38BDF8] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
          <div className="flex-1">
            <p className="text-xs font-black text-sky-950 uppercase tracking-wider">New Inquiries</p>
            <h3 className="text-2xl sm:text-3xl font-black text-sky-950 mt-1">{newCount} Leads</h3>
            <p className="text-xs text-sky-800/90 font-semibold mt-1">Awaiting first follow-up</p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0 ml-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <div className="w-7 h-7 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 2. Total Submissions (Mint / Emerald) */}
        <div className="bg-gradient-to-br from-[#DCFCE7] via-[#BBF7D0] to-[#86EFAC] border-2 border-[#4ADE80] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">{inquiries.length} Inquiries</h3>
            <p className="text-xs text-emerald-800/90 font-semibold mt-1">Received through website</p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0 ml-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. Converted Clients (Lavender / Purple) */}
        <div className="bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE] border-2 border-[#C084FC] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
          <div className="flex-1">
            <p className="text-xs font-black text-purple-950 uppercase tracking-wider">Converted Clients</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-950 mt-1">
              {inquiries.filter((i) => i.status === 'Converted').length} Converted
            </h3>
            <p className="text-xs text-purple-800/90 font-semibold mt-1">Signed fleet service contracts</p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0 ml-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or service required..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Inquiries</option>
            <option value="New">New Unread</option>
            <option value="Contacted">Contacted</option>
            <option value="Quoted">Quoted</option>
            <option value="Converted">Converted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[#0052cc] via-[#1a73e8] to-[#0d47a1] text-white uppercase font-bold tracking-wider text-xs border-b border-blue-900/30">
              <tr>
                <th className="py-3 px-3 w-14 text-center">S.NO</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Prospect Name</th>
                <th className="py-3 px-3">Contact Phone & Email</th>
                <th className="py-3 px-3">Service Requested</th>
                <th className="py-3 px-3">Inquiry Message</th>
                <th className="py-3 px-3">Lead Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No website inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.date}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-2 px-3">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <a href={`tel:${item.phone}`} className="hover:underline">
                          {item.phone}
                        </a>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <a href={`mailto:${item.email}`} className="hover:underline">
                          {item.email}
                        </a>
                      </p>
                    </td>
                    <td className="py-2 px-3 font-semibold text-blue-700">{item.service_type}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-[260px]">
                      <p className="line-clamp-2">{item.message}</p>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className={`text-[11px] font-bold py-1 px-2.5 rounded-full border outline-none cursor-pointer ${
                          item.status === 'New'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : item.status === 'Contacted'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : item.status === 'Converted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Converted">Converted</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Cards (Matching Image 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-100 border border-sky-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-black text-sky-950 mt-0.5">{inquiries.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Converted Leads */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Converted Leads</p>
            <p className="text-2xl font-black text-emerald-950 mt-0.5">
              {inquiries.filter((i) => i.status === 'Converted').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Follow-ups</p>
            <p className="text-2xl font-black text-amber-950 mt-0.5">
              {inquiries.filter((i) => i.status === 'New' || i.status === 'Contacted').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-black text-purple-950 mt-0.5">
              {inquiries.filter((i) => i.status === 'Converted' || i.status === 'Closed').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
