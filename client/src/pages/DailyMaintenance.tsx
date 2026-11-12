import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  Gauge,
  Building2,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  Upload,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Bus,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import type { Bus as BusType } from '../types';
import type { DailyMaintenanceRecord } from '../services/seedData';

export const DailyMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<DailyMaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyMaintenanceRecord | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    date: string;
    vehicle_number: string;
    bus_id: string;
    km: string | number;
    complaints: string;
    showroom_name: string;
    other: string;
    amount: string | number;
    photos: string[];
  }>({
    date: new Date().toISOString().split('T')[0],
    vehicle_number: '',
    bus_id: '',
    km: '',
    complaints: '',
    showroom_name: '',
    other: '',
    amount: '',
    photos: []
  });

  useEffect(() => {
    loadData();
    const handleBusKmUpdated = () => {
      loadData();
    };
    window.addEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    return () => {
      window.removeEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recData, busData] = await Promise.all([
        api.getDailyMaintenance().catch(() => []),
        api.getBuses().catch(() => [])
      ]);
      const cleaned = (recData || []).map((r: any) => ({
        ...r,
        vehicle_number: (r.vehicle_number || '').split('(')[0].trim()
      }));
      setRecords(cleaned);
      setBuses(busData || []);
    } catch (err: any) {
      error(err.message || 'Failed to load daily maintenance records');
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingRecord(null);
    const firstBus = buses[0];
    const initialReg = (firstBus?.registration_number || firstBus?.bus_number || '').split('(')[0].trim();
    const initialKm = Number((firstBus as any)?.latest_checkup_km || firstBus?.current_odometer_km || 0);

    setFormData({
      date: new Date().toISOString().split('T')[0],
      vehicle_number: initialReg,
      bus_id: firstBus ? String(firstBus.id) : '',
      km: initialKm > 0 ? initialKm : '',
      complaints: '',
      showroom_name: '',
      other: '',
      amount: '',
      photos: []
    });
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: DailyMaintenanceRecord) => {
    setEditingRecord(rec);
    let parsedPhotos: string[] = [];
    if (Array.isArray(rec.photos)) {
      parsedPhotos = rec.photos;
    } else if (typeof rec.photos_json === 'string') {
      try {
        parsedPhotos = JSON.parse(rec.photos_json);
      } catch { }
    }

    setFormData({
      date: rec.date || new Date().toISOString().split('T')[0],
      vehicle_number: (rec.vehicle_number || '').split('(')[0].trim(),
      bus_id: rec.bus_id ? String(rec.bus_id) : '',
      km: rec.km ?? '',
      complaints: rec.complaints || '',
      showroom_name: rec.showroom_name || '',
      other: rec.other || '',
      amount: rec.amount ?? '',
      photos: parsedPhotos
    });
    setIsAddEditOpen(true);
  };

  // When vehicle changes in form, auto-sync latest KM
  const handleVehicleChange = (regNo: string) => {
    const cleanReg = (regNo || '').split('(')[0].trim();
    const matchedBus = buses.find(
      (b) => {
        const bReg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
        return bReg === cleanReg || String(b.id) === cleanReg;
      }
    );
    const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);

    setFormData((prev) => ({
      ...prev,
      vehicle_number: matchedBus ? (matchedBus.registration_number || matchedBus.bus_number || '').split('(')[0].trim() : cleanReg,
      bus_id: matchedBus ? String(matchedBus.id) : prev.bus_id,
      km: busKm > 0 ? busKm : prev.km
    }));
  };

  // Handle multi-photo upload (2 to 3 photos)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - formData.photos.length;
    if (remainingSlots <= 0) {
      error('Maximum 3 invoice photos allowed');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    filesToRead.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        error(`File "${file.name}" exceeds 5 MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => {
          if (prev.photos.length >= 3) return prev;
          return {
            ...prev,
            photos: [...prev.photos, reader.result as string]
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Remove photo thumbnail
  const handleRemovePhoto = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx)
    }));
  };

  // Save Record (Add or Edit)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = Boolean(
      user?.role?.toLowerCase()?.includes('admin') ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
    );

    if (!formData.vehicle_number) {
      if (!isUserAdmin) {
        error('Please select or enter vehicle number');
        return;
      }
      formData.vehicle_number = buses[0]?.registration_number || 'AP16TV1234';
    }
    if (!formData.date) {
      if (!isUserAdmin) {
        error('Date is required');
        return;
      }
      formData.date = new Date().toISOString().split('T')[0];
    }

    try {
      const cleanVehicle = (formData.vehicle_number || '').split('(')[0].trim().toUpperCase();
      const payload = {
        date: formData.date,
        vehicle_number: cleanVehicle,
        bus_id: formData.bus_id ? Number(formData.bus_id) : undefined,
        km: Number(formData.km) || 0,
        complaints: formData.complaints || '',
        showroom_name: formData.showroom_name || '',
        other: formData.other || '',
        amount: Number(formData.amount) || 0,
        photos: formData.photos
      };

      if (editingRecord) {
        await api.updateDailyMaintenance(editingRecord.id, payload);
        success('Daily maintenance record updated!');
      } else {
        await api.createDailyMaintenance(payload);
        success('Daily maintenance record created successfully!');
      }

      setIsAddEditOpen(false);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save maintenance record');
    }
  };

  // Delete Record
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      await api.deleteDailyMaintenance(id);
      success('Daily maintenance record deleted');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    try {
      const lines: string[] = [];
      lines.push('"CHARVIK STAFFING CONSULTANCY - DAILY VEHICLE MAINTENANCE"');
      lines.push(`"Exported At","${new Date().toLocaleString()}"`);
      lines.push(`"Total Records","${filteredRecords.length}"`);
      lines.push('');

      const headers = [
        'S.No',
        'Date',
        'Vehicle Number',
        'Odometer KM',
        'Showroom / Workshop',
        'Complaints & Defects',
        'Other Remarks / Work Done',
        'Amount (Rs)',
        'Attached Invoices Count'
      ];
      lines.push(headers.map((h) => `"${h}"`).join(','));

      filteredRecords.forEach((r, idx) => {
        let pCount = 0;
        if (Array.isArray(r.photos)) pCount = r.photos.length;
        else if (typeof r.photos_json === 'string') {
          try {
            pCount = JSON.parse(r.photos_json).length;
          } catch { }
        }

        const row = [
          idx + 1,
          r.date,
          r.vehicle_number,
          r.km || 0,
          r.showroom_name || '',
          r.complaints || '',
          r.other || '',
          r.amount || 0,
          pCount
        ];
        lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Daily_Maintenance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('Exported daily maintenance records to Excel / CSV');
    } catch {
      error('Failed to export CSV report');
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const vNo = (r.vehicle_number || '').split('(')[0].trim();
      const matchSearch =
        !q ||
        vNo.toLowerCase().includes(q) ||
        (r.showroom_name || '').toLowerCase().includes(q) ||
        (r.complaints || '').toLowerCase().includes(q) ||
        (r.other || '').toLowerCase().includes(q);

      const matchVehicle = vehicleFilter === 'All' || vNo === vehicleFilter || r.vehicle_number === vehicleFilter;
      const matchStart = !startDate || r.date >= startDate;
      const matchEnd = !endDate || r.date <= endDate;

      return matchSearch && matchVehicle && matchStart && matchEnd;
    });
  }, [records, searchQuery, vehicleFilter, startDate, endDate]);

  // KPI Metrics
  const stats = useMemo(() => {
    const totalRecords = records.length;
    const totalSpend = records.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter((r) => r.date === todayStr);
    const todaySpend = todayRecords.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const uniqueVehicles = new Set(records.map((r) => (r.vehicle_number || '').split('(')[0].trim())).size;

    return {
      totalRecords,
      totalSpend,
      todayCount: todayRecords.length,
      todaySpend,
      uniqueVehicles
    };
  }, [records]);

  // Unique Vehicles for filter
  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    buses.forEach((b) => {
      const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
      if (reg) set.add(reg);
    });
    records.forEach((r) => {
      const reg = (r.vehicle_number || '').split('(')[0].trim();
      if (reg) set.add(reg);
    });
    return Array.from(set).sort();
  }, [buses, records]);

  return (
    <div className="space-y-6 w-full max-w-full pb-16">
      {/* Header Bar with Real Bus Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Daily Maintenance &amp; Repairs
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {stats.totalRecords} Logs
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Log showroom repair bills, complaints, odometer KM, and upload invoice receipts.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Action Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet3.jpg"
                alt="Workshop Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Workshop Bay</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-blue-800" />
              <span>+ Add Maintenance</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards (Matching Admin Dashboard Glowing Palette) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Total Records</p>
            <p className="text-3xl font-black text-blue-950 mt-1 font-mono">{stats.totalRecords}</p>
            <p className="text-xs text-blue-700/80 font-medium">{stats.uniqueVehicles} distinct vehicles</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#FFF5EC] via-[#FFF9F3] to-[#FFE7D1] border-2 border-[#FFD0A8] p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Total Cost</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 font-mono">₹{stats.totalSpend.toLocaleString('en-IN')}</p>
            <p className="text-xs text-amber-800/80 font-medium">Workshop spend</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Today's Spend</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1 font-mono">₹{stats.todaySpend.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-700/80 font-medium">{stats.todayCount} logged today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#EEF2FF] via-[#E0E7FF] to-[#C7D2FE] border-2 border-[#818CF8] p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-indigo-900 uppercase tracking-wider">Buses Maintained</p>
            <p className="text-3xl font-black text-indigo-950 mt-1 font-mono">{stats.uniqueVehicles}</p>
            <p className="text-xs text-indigo-700/80 font-medium">Fleet coverage</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Bus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle, showroom, complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-[#142B4A]"
          >
            <option value="All">All Vehicles</option>
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-[#142B4A]"
            title="Start date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-[#142B4A]"
            title="End date"
          />

          {(searchQuery || vehicleFilter !== 'All' || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVehicleFilter('All');
                setStartDate('');
                setEndDate('');
              }}
              className="text-sm font-bold text-rose-600 hover:underline px-2 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center">S.No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Vehicle Number</th>
                <th className="py-2.5 px-3">Odometer KM</th>
                <th className="py-2.5 px-3">Showroom Name</th>
                <th className="py-2.5 px-3">Complaints</th>
                <th className="py-2.5 px-3">Other Details</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-center">Invoice Photos</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
                    <span>Loading daily maintenance records...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="font-bold text-slate-700 text-base">No maintenance records found</p>
                    <p className="text-sm text-slate-400 mt-1">Click &quot;+ Add Daily Maintenance&quot; to log your first showroom repair.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  let photos: string[] = [];
                  if (Array.isArray(r.photos)) photos = r.photos;
                  else if (typeof r.photos_json === 'string') {
                    try {
                      photos = JSON.parse(r.photos_json);
                    } catch { }
                  }

                  return (
                    <tr key={r.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700">
                        {r.date || '—'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">
                          {(r.vehicle_number || '').split('(')[0].trim()}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-blue-700">
                        {Number(r.km || 0).toLocaleString('en-IN')} KM
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 max-w-[200px] truncate" title={r.showroom_name}>
                        {r.showroom_name || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 max-w-[240px]" title={r.complaints}>
                        <p className="line-clamp-2">{r.complaints || '—'}</p>
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-[220px]" title={r.other}>
                        <p className="line-clamp-2">{r.other || '—'}</p>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-black text-slate-900">
                        ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {photos.length > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            {photos.map((pUrl, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setPreviewPhoto(pUrl)}
                                className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 hover:border-[#142B4A] shadow-2xs cursor-pointer group"
                                title={`View invoice photo ${pIdx + 1}`}
                              >
                                <img
                                  src={pUrl}
                                  alt="Invoice"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-500 ml-1">
                              ({photos.length})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No invoice</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-700 cursor-pointer shadow-2xs"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shadow-2xs"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Daily Maintenance Record */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingRecord ? `Edit Maintenance Record #${editingRecord.id}` : 'Add Daily Vehicle Maintenance'}
        subtitle="Log workshop visits, defects/complaints, showroom bills, and upload 2 to 3 invoice receipts."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
              />
            </div>

            {/* 2. Vehicle Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.vehicle_number}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-[#142B4A]"
              >
                <option value="">-- Select Vehicle --</option>
                {buses.map((b) => {
                  const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
                  return (
                    <option key={b.id} value={reg}>
                      {reg}
                    </option>
                  );
                })}
                {formData.vehicle_number &&
                  !buses.some((b) => (b.registration_number || b.bus_number || '').split('(')[0].trim() === (formData.vehicle_number || '').split('(')[0].trim()) && (
                    <option value={(formData.vehicle_number || '').split('(')[0].trim()}>
                      {(formData.vehicle_number || '').split('(')[0].trim()}
                    </option>
                  )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 3. KM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Odometer KM <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="e.g. 312000"
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
                />
                <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">
                  KM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Auto-synced with vehicle checkup odometer.
              </p>
            </div>

            {/* 4. Showroom Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Showroom / Workshop Name
              </label>
              <input
                type="text"
                placeholder="e.g. Scania Authorized Service / Tata Hub"
                value={formData.showroom_name}
                onChange={(e) => setFormData({ ...formData, showroom_name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
              />
            </div>
          </div>

          {/* 5. Complaints */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Complaints & Defect Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Front brake pad noise, steering vibration at high speed, AC low cooling..."
              value={formData.complaints}
              onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 6. Other */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Other Details / Parts Replaced
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Replaced 2 brake shoe liners, tightened brass couplings, refilled coolant..."
                value={formData.other}
                onChange={(e) => setFormData({ ...formData, other: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
              />
            </div>

            {/* 7. Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Total repair / service invoice amount.
              </p>
            </div>
          </div>

          {/* 8. Invoice Image Upload Option (2-3 Images Upload) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Invoice Images Upload
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                {formData.photos.length} / 3 photos selected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Upload 2 to 3 photos of invoices, work bills, or replaced parts (JPEG, PNG, WebP — max 5 MB each).
            </p>

            {formData.photos.length < 3 && (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-[#142B4A] rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-slate-100/60 transition-all">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click to choose invoice images</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Up to 3 images can be attached</span>
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                {formData.photos.map((pUrl, pIdx) => (
                  <div key={pIdx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-20 bg-slate-100">
                    <img src={pUrl} alt="Invoice preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(pIdx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-rose-700 transition-colors"
                      title="Remove invoice"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Invoice #{pIdx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{editingRecord ? 'Update Record' : 'Save Maintenance Record'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Full Preview Photo */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white hover:bg-black flex items-center justify-center z-10 cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhoto} alt="Invoice preview full" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMaintenance;

