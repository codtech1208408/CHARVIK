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
  ExternalLink
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
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Website Inquiries & Customer Leads</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming quote requests, client contact messages, and staffing consultations from the public portal.
          </p>
        </div>

        <a
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <span>View Public Contact Form</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">New Inquiries</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{newCount} Leads</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting first follow-up</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Submissions</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{inquiries.length} Inquiries</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Received through website</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Converted Clients</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {inquiries.filter((i) => i.status === 'Converted').length} Converted
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Signed fleet service contracts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
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
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
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
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Prospect Name</th>
                <th className="py-3 px-4">Contact Phone & Email</th>
                <th className="py-3 px-4">Service Requested</th>
                <th className="py-3 px-4">Inquiry Message</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No website inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-amber-500" />
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
                    <td className="py-3 px-4 font-semibold text-amber-700">{item.service_type}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[260px]">
                      <p className="line-clamp-2">{item.message}</p>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-center">
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
    </div>
  );
};
