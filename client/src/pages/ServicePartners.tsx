import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Zap,
  Snowflake,
  MapPin,
  Phone,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  ClipboardList,
  Users,
  CheckCircle2,
  X,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import * as XLSX from 'xlsx';
import luxuryCoachHeader from '../assets/luxury-coach-header.png';

export interface ServicePartner {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  alternateMobile?: string;
  category: 'Mechanical' | 'Electrical' | 'AC / HVAC';
  location: string;
  address?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
}

const INITIAL_SERVICE_PARTNERS: ServicePartner[] = [
  {
    id: 'SP-101',
    name: 'Sri Sai Auto Works',
    contactPerson: 'Rakesh',
    mobile: '+91 98765 43210',
    alternateMobile: '+91 98765 43211',
    category: 'Mechanical',
    location: 'Bengaluru',
    address: 'Plot 44, Peenya Industrial Area, Bengaluru, Karnataka',
    status: 'Active',
    notes: 'Engine overhaul, suspension overhaul, brakes and clutch works'
  },
  {
    id: 'SP-102',
    name: 'Vijaya Electricals',
    contactPerson: 'Manoj',
    mobile: '+91 99876 54321',
    alternateMobile: '+91 99876 54322',
    category: 'Electrical',
    location: 'Hyderabad',
    address: 'Near Autonagar Gate, Vanasthalipuram, Hyderabad, Telangana',
    status: 'Active',
    notes: 'Wiring harness, alternator, starter motor, LED display boards'
  },
  {
    id: 'SP-103',
    name: 'Cool Air AC Service',
    contactPerson: 'Suresh',
    mobile: '+91 90123 45678',
    alternateMobile: '+91 90123 45679',
    category: 'AC / HVAC',
    location: 'Chennai',
    address: 'Koyambedu Bus Terminal Road, Chennai, Tamil Nadu',
    status: 'Active',
    notes: 'Bus AC compressor gas charging, blower fan repair, duct cleaning'
  },
  {
    id: 'SP-104',
    name: 'Om Bus Service Point',
    contactPerson: 'Pradeep',
    mobile: '+91 98450 66778',
    category: 'Mechanical',
    location: 'Pune',
    address: 'Wakad Highway Bypass, Pune, Maharashtra',
    status: 'Active',
    notes: 'Emergency breakdown mechanical assistance 24/7'
  },
  {
    id: 'SP-105',
    name: 'S N Electro Works',
    contactPerson: 'Naveen',
    mobile: '+91 96012 33445',
    category: 'Electrical',
    location: 'Vijayawada',
    address: 'Bhavanipuram Auto Nagar, Vijayawada, Andhra Pradesh',
    status: 'Active',
    notes: 'Battery bank maintenance, sensor calibrations, inverter repairs'
  },
  {
    id: 'SP-106',
    name: 'Smart AC Solutions',
    contactPerson: 'Arun',
    mobile: '+91 91009 88776',
    category: 'AC / HVAC',
    location: 'Coimbatore',
    address: 'Gandhipuram Central, Coimbatore, Tamil Nadu',
    status: 'Active',
    notes: 'Subros & Denso bus AC maintenance specialists'
  }
];

export const ServicePartners: React.FC = () => {
  const { success, error } = useToast();

  const [partners, setPartners] = useState<ServicePartner[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_service_partners');
      if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_SERVICE_PARTNERS;
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ServicePartner | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ServicePartner>>({
    name: '',
    contactPerson: '',
    mobile: '',
    alternateMobile: '',
    category: 'Mechanical',
    location: 'Hyderabad',
    address: '',
    status: 'Active',
    notes: ''
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('charvik_service_partners', JSON.stringify(partners));
    } catch { }
  }, [partners]);

  // Unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      if (p.location) set.add(p.location.trim());
    });
    return Array.from(set);
  }, [partners]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);

      const matchLocation = locationFilter === 'All' || p.location.toLowerCase() === locationFilter.toLowerCase();
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;

      return matchSearch && matchLocation && matchCategory && matchStatus;
    });
  }, [partners, searchTerm, locationFilter, categoryFilter, statusFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      contactPerson: '',
      mobile: '',
      alternateMobile: '',
      category: 'Mechanical',
      location: 'Hyderabad',
      address: '',
      status: 'Active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (partner: ServicePartner) => {
    setEditingPartner(partner);
    setFormData({ ...partner });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      error('Please enter the Service Partner Name');
      return;
    }
    if (!formData.contactPerson?.trim()) {
      error('Please enter the Contact Person name');
      return;
    }
    if (!formData.mobile?.trim()) {
      error('Please enter a valid Mobile Number');
      return;
    }

    if (editingPartner) {
      setPartners((prev) =>
        prev.map((p) => (p.id === editingPartner.id ? ({ ...p, ...formData } as ServicePartner) : p))
      );
      success(`Partner "${formData.name}" updated successfully.`);
    } else {
      const newPartner: ServicePartner = {
        id: `SP-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile: formData.mobile.trim(),
        alternateMobile: formData.alternateMobile?.trim() || '',
        category: (formData.category as any) || 'Mechanical',
        location: formData.location?.trim() || 'Hyderabad',
        address: formData.address?.trim() || '',
        status: (formData.status as any) || 'Active',
        notes: formData.notes?.trim() || '',
        createdAt: new Date().toISOString()
      };
      setPartners((prev) => [newPartner, ...prev]);
      success(`Service Partner "${newPartner.name}" added successfully.`);
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from Service Partners?`)) {
      setPartners((prev) => prev.filter((p) => p.id !== id));
      success(`Service Partner "${name}" removed.`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const rows = filteredPartners.map((p, idx) => ({
        '#': idx + 1,
        'Partner Name': p.name,
        'Contact Person': p.contactPerson,
        'Mobile Number': p.mobile,
        'Alternate Mobile': p.alternateMobile || '',
        Category: p.category,
        Location: p.location,
        Address: p.address || '',
        Status: p.status,
        Specialization: p.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Service Partners');
      XLSX.writeFile(wb, `Charvik_Service_Partners_${new Date().toISOString().slice(0, 10)}.xlsx`);
      success('Service Partner Directory exported to Excel successfully.');
    } catch (err: any) {
      error(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Print Partner Directory
  const handlePrintDirectory = () => {
    window.print();
  };

  // Category Badge Render Helper
  const renderCategoryBadge = (cat: 'Mechanical' | 'Electrical' | 'AC / HVAC') => {
    switch (cat) {
      case 'Mechanical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0284c7] text-white shadow-2xs">
            <Wrench className="w-3.5 h-3.5" />
            <span>Mechanical</span>
          </span>
        );
      case 'Electrical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f59e0b] text-white shadow-2xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Electrical</span>
          </span>
        );
      case 'AC / HVAC':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7c3aed] text-white shadow-2xs">
            <Snowflake className="w-3.5 h-3.5" />
            <span>AC / HVAC</span>
          </span>
        );
      default:
        return <span>{cat}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── TOP HERO HEADER BANNER (MATCHES USER IMAGE 1 EXACTLY) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032B69] via-[#004B9E] to-[#0072E5] text-white p-5 sm:p-7 shadow-xl border-2 border-blue-400/30">
        {/* Subtle background graphics */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none overflow-hidden hidden md:block">
          <img
            src={luxuryCoachHeader}
            alt="Coach Fleet"
            className="w-full h-full object-cover object-right"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Top brand tagline strip */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-blue-200 uppercase">
              <span className="font-black text-amber-300">CHARVIK</span>
              <span>•</span>
              <span>Travel</span>
              <span>|</span>
              <span>Staffing</span>
              <span>|</span>
              <span>Fleet</span>
              <span>|</span>
              <span>Cargo</span>
              <span>|</span>
              <span>Bus</span>
              <span>|</span>
              <span>Technology</span>
            </div>

            {/* Main Title Badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                <Wrench className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  Service Partner Directory
                </h1>
                <p className="text-xs sm:text-sm font-bold text-blue-100 tracking-wide mt-0.5">
                  Mechanical &nbsp;|&nbsp; Electrical &nbsp;|&nbsp; AC & HVAC – Contact Database
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export</span>
            </button>
            <button
              onClick={handlePrintDirectory}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Print Partner Directory"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Printout</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR (MATCHES REFERENCE IMAGE) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name / Mobile / Location..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500 hidden sm:inline shrink-0" />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">Location (All)</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500 hidden sm:inline shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">Category (All)</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="AC / HVAC">AC / HVAC</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="All">Status (All)</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Add Partner Action Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {/* ── SERVICE PARTNER DIRECTORY TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#032B69] via-[#004B9E] to-[#0284c7] text-white text-[11px] font-black uppercase tracking-wider border-b border-blue-900/30">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Service Partner Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4 text-center">Category</th>
                <th className="py-3 px-4 text-center">Location</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No service partners found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner, index) => (
                  <tr
                    key={partner.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                      {index + 1}
                    </td>

                    {/* Partner Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#142B4A] text-sm group-hover:text-blue-600 transition-colors">
                        {partner.name}
                      </div>
                      {partner.notes && (
                        <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {partner.notes}
                        </div>
                      )}
                    </td>

                    {/* Contact Person */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {partner.contactPerson}
                    </td>

                    {/* Mobile Number with Direct Call & WA */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${partner.mobile.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{partner.mobile}</span>
                        </a>
                        <a
                          href={`https://wa.me/${partner.mobile.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="WhatsApp Partner"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Category Pill */}
                    <td className="py-3.5 px-4 text-center">
                      {renderCategoryBadge(partner.category)}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{partner.location}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide ${
                          partner.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(partner)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(partner.id, partner.name)}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTTOM BANNER & QUICK ACTION PILLS (MATCHES REFERENCE IMAGE) ── */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600 rounded-3xl p-5 text-white shadow-lg space-y-4">
        {/* Banner Pill Header */}
        <div className="inline-block bg-white text-orange-600 font-black px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-md">
          Maintain All Your Service Partners in One Place
        </div>

        {/* Horizontal Quick-Action Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Card 1: Mechanical Partners */}
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Mechanical');
              setStatusFilter('All');
            }}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Mechanical Partners
            </span>
          </button>

          {/* Card 2: Electrical Partners */}
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Electrical');
              setStatusFilter('All');
            }}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Electrical Partners
            </span>
          </button>

          {/* Card 3: AC / HVAC Partners */}
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('AC / HVAC');
              setStatusFilter('All');
            }}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Snowflake className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              AC / HVAC Partners
            </span>
          </button>

          {/* Card 4: Location Wise */}
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('All');
              setLocationFilter('Hyderabad');
            }}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Location Wise
            </span>
          </button>

          {/* Card 5: Quick Contact */}
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
              setLocationFilter('All');
              setStatusFilter('All');
            }}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-1.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Quick Contact
            </span>
          </button>

          {/* Card 6: Service History */}
          <button
            type="button"
            onClick={() => success('Navigating to Service History records.')}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Service History
            </span>
          </button>

          {/* Card 7: Work Orders & Follow-up */}
          <button
            type="button"
            onClick={() => success('Navigating to Work Orders & Maintenance Schedule.')}
            className="bg-white/95 hover:bg-white text-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 leading-tight">
              Work Orders & Follow-up
            </span>
          </button>
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT SERVICE PARTNER ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPartner ? 'Edit Service Partner' : 'Add New Service Partner'}
        subtitle="Maintain official contact details, specialized category, and base workshop location."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Partner Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Partner Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sri Sai Auto Works"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Rakesh"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Primary Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alternate Phone Number
              </label>
              <input
                type="text"
                value={formData.alternateMobile || ''}
                onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                placeholder="e.g. +91 98765 43211"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category || 'Mechanical'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="AC / HVAC">AC / HVAC</option>
              </select>
            </div>

            {/* Location City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Base Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Hyderabad / Bengaluru / Chennai"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Workshop / Office Address
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Plot 44, Peenya Industrial Area, Bengaluru, Karnataka"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Specialization / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Specialization & Services Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Engine overhaul, suspension overhaul, brakes, 24/7 highway breakdown..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status || 'Active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full sm:w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {editingPartner ? 'Update Partner' : 'Save Partner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
