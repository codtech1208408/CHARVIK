import React, { useState, useEffect } from 'react';
import {
  Snowflake,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Bus,
  Save,
  ThermometerSnowflake,
  Edit,
  Trash2,
  RefreshCw,
  Camera,
  Upload,
  Eye,
  X,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import type { AcRecord, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { SearchableSelect } from '../components/common/SearchableSelect';

export const AcMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<AcRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcRecord | null>(null);

  // Renewal Modal
  const [renewingRecord, setRenewingRecord] = useState<AcRecord | null>(null);
  const [renewFormData, setRenewFormData] = useState({
    filter_cleaning_date: new Date().toISOString().split('T')[0],
    filter_expiry_date: '',
    filter_proof_photo: '',
    remarks: ''
  });
  const [uploadingRenewPhoto, setUploadingRenewPhoto] = useState(false);

  // Photo viewer modal
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; title: string } | null>(null);

  // Uploading states in main form
  const [uploadingGeneralPhoto, setUploadingGeneralPhoto] = useState(false);
  const [uploadingFilterPhoto, setUploadingFilterPhoto] = useState(false);

  // Form State for Log / Edit AC Service
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    current_km: '',
    ac_working_status: 'Working',
    cooling_performance: 'Good',
    refrigerant_check: 'Normal',
    filter_cleaning_replacement: 'Cleaned',
    compressor_condition: 'Good',
    leak_inspection: 'None',
    electrical_check: 'Normal',
    issue_description: '',
    work_performed: '',
    service_provider: '',
    next_service_date: '',
    next_service_km: '',
    service_cost: '',
    technician: '',
    status: 'Completed',
    remarks: '',
    filter_cleaning_date: new Date().toISOString().split('T')[0],
    filter_expiry_date: '',
    general_checkup_date: new Date().toISOString().split('T')[0],
    general_checkup_expiry_date: '',
    filter_proof_photo: '',
    general_checkup_photo: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [acData, busesData] = await Promise.all([
        api.getAcRecords({ bus_id: selectedBus || undefined }),
        api.getBuses()
      ]);
      setRecords(acData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load AC maintenance records');
    } finally {
      setLoading(false);
    }
  };

  // Helper to add exactly 1 month to a date string YYYY-MM-DD (e.g. 2026-10-26 -> 2026-11-26)
  const addOneMonthToDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return '';
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

      const nextMonth0 = month; // Next month (0-indexed)
      const nextYear = year + Math.floor(nextMonth0 / 12);
      const normMonth0 = nextMonth0 % 12;
      const maxDaysInNextMonth = new Date(nextYear, normMonth0 + 1, 0).getDate();
      const nextDay = Math.min(day, maxDaysInNextMonth);

      const yyyy = nextYear;
      const mm = String(normMonth0 + 1).padStart(2, '0');
      const dd = String(nextDay).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  // Helper to add days to a date string YYYY-MM-DD
  const addDaysToDate = (startDate: string, days: number) => {
    try {
      const d = new Date(startDate || new Date().toISOString().split('T')[0]);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const today = new Date().toISOString().split('T')[0];
    // Filter expiry automatically set to 5 days after cleaning date
    const defaultExpiry = addDaysToDate(today, 5);
    // Vehicle general checkup is every month (1 month ahead)
    const defaultCheckupExpiry = addOneMonthToDate(today);

    const firstBus = buses[0];
    const currentKm = firstBus ? firstBus.current_odometer_km : '';

    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      inspection_date: today,
      current_km: currentKm,
      ac_working_status: 'Working',
      cooling_performance: 'Good',
      refrigerant_check: 'Normal',
      filter_cleaning_replacement: 'Cleaned',
      compressor_condition: 'Good',
      leak_inspection: 'None',
      electrical_check: 'Normal',
      issue_description: '',
      work_performed: '',
      service_provider: '',
      next_service_date: '',
      next_service_km: '',
      service_cost: '',
      technician: '',
      status: 'Completed',
      remarks: '',
      filter_cleaning_date: today,
      filter_expiry_date: defaultExpiry,
      general_checkup_date: today,
      general_checkup_expiry_date: defaultCheckupExpiry,
      filter_proof_photo: '',
      general_checkup_photo: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (r: AcRecord) => {
    setEditingRecord(r);
    setFormData({
      bus_id: String(r.bus_id),
      inspection_date: r.inspection_date || new Date().toISOString().split('T')[0],
      current_km: r.current_km ?? '',
      ac_working_status: r.ac_working_status || 'Working',
      cooling_performance: r.cooling_performance || 'Good',
      refrigerant_check: r.refrigerant_check || 'Normal',
      filter_cleaning_replacement: r.filter_cleaning_replacement || 'Cleaned',
      compressor_condition: r.compressor_condition || 'Good',
      leak_inspection: r.leak_inspection || 'None',
      electrical_check: r.electrical_check || 'Normal',
      issue_description: r.issue_description || '',
      work_performed: r.work_performed || '',
      service_provider: r.service_provider || '',
      next_service_date: r.next_service_date || '',
      next_service_km: r.next_service_km ?? '',
      service_cost: r.service_cost ?? '',
      technician: r.technician || '',
      status: r.status || 'Completed',
      remarks: r.remarks || '',
      filter_cleaning_date: r.filter_cleaning_date || r.inspection_date || '',
      filter_expiry_date: r.filter_expiry_date || '',
      general_checkup_date: r.general_checkup_date || '',
      general_checkup_expiry_date: r.general_checkup_expiry_date || '',
      filter_proof_photo: r.filter_proof_photo || '',
      general_checkup_photo: r.general_checkup_photo || ''
    });
    setIsAddOpen(true);
  };

  // Open Renewal Modal
  const handleOpenRenewal = (r: AcRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const newExpiry = addDaysToDate(today, 5);
    setRenewingRecord(r);
    setRenewFormData({
      filter_cleaning_date: today,
      filter_expiry_date: newExpiry,
      filter_proof_photo: '',
      remarks: `Renewed filter on ${today}`
    });
  };

  // Upload Photo for Renewal
  const handleRenewalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingRenewPhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setRenewFormData(prev => ({ ...prev, filter_proof_photo: url }));
        success('Filter renewal photo uploaded successfully!');
      } else {
        error('Failed to get uploaded file URL');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingRenewPhoto(false);
    }
  };

  // Submit Renewal
  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingRecord) return;
    if (!renewFormData.filter_cleaning_date) {
      error('Please select filter cleaning date');
      return;
    }
    if (!renewFormData.filter_expiry_date) {
      error('Please select filter expiry date');
      return;
    }

    try {
      await api.renewAcFilter(renewingRecord.id, renewFormData);
      success('Filter renewed successfully with proof!');
      setRenewingRecord(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to renew filter');
    }
  };

  // Upload General Checkup Photo in main form
  const handleGeneralCheckupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingGeneralPhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setFormData((prev: any) => ({ ...prev, general_checkup_photo: url }));
        success('General checkup photo uploaded!');
      } else {
        error('Failed to get uploaded file URL');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload general checkup photo');
    } finally {
      setUploadingGeneralPhoto(false);
    }
  };

  // Upload Filter Cleaning Photo in main form
  const handleFilterPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFilterPhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setFormData((prev: any) => ({ ...prev, filter_proof_photo: url }));
        success('Filter proof photo uploaded!');
      } else {
        error('Failed to get uploaded file URL');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload filter photo');
    } finally {
      setUploadingFilterPhoto(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this AC service record?')) return;
    try {
      await api.deleteAcRecord(id);
      success('AC maintenance record deleted successfully!');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id) {
      error('Please select a vehicle');
      return;
    }
    try {
      if (editingRecord) {
        await api.updateAcRecord(editingRecord.id, formData);
        success('AC maintenance record updated successfully!');
      } else {
        await api.createAcRecord(formData);
        success('AC maintenance inspection & checkup saved!');
      }
      setIsAddOpen(false);
      setEditingRecord(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save AC service record');
    }
  };

  // Expiration helper
  const getFilterStatusInfo = (record: AcRecord) => {
    const expiryDateStr = record.filter_expiry_date;
    if (!expiryDateStr) {
      return {
        label: 'No Expiry Set',
        isExpired: false,
        isExpiring: false,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (expiryDateStr <= todayStr || record.filter_status === 'Expired') {
      return {
        label: 'Expired',
        isExpired: true,
        isExpiring: false,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse'
      };
    }
    const expTime = new Date(expiryDateStr).getTime();
    const curTime = new Date(todayStr).getTime();
    const diffDays = Math.ceil((expTime - curTime) / (1000 * 3600 * 24));
    if (diffDays <= 7) {
      return {
        label: `Expiring Soon (${diffDays}d)`,
        isExpired: false,
        isExpiring: true,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
      };
    }
    return {
      label: `Active (${diffDays}d left)`,
      isExpired: false,
      isExpiring: false,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
    };
  };

  // Bus options for SearchableSelect
  const busSelectOptions = buses.map(b => ({
    value: String(b.id),
    label: b.bus_number,
    subLabel: b.registration_number ? `Reg: ${b.registration_number}` : undefined
  }));

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const busNo = (r.bus_number || '').toLowerCase();
    const regNo = (r.registration_number || '').toLowerCase();
    const tech = (r.technician || '').toLowerCase();
    const prov = (r.service_provider || '').toLowerCase();
    return busNo.includes(query) || regNo.includes(query) || tech.includes(query) || prov.includes(query);
  });

  // Expired records count for quick counter
  const expiredCount = records.filter(r => {
    const status = getFilterStatusInfo(r);
    return status.isExpired;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
              <Snowflake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <span>Air Conditioning Maintenance & Filter Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track filter cleaning, automated expiry schedules, photo verification proof, and vehicle general checkups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {expiredCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{expiredCount} Filter{expiredCount > 1 ? 's' : ''} Expired</span>
            </div>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log AC Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter by Bus</label>
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            >
              <option value="">All Fleet Buses ({buses.length})</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bus_number} {b.registration_number ? `(${b.registration_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Records</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search bus, reg no, tech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
          <span>Filter Check Interval: Every 60–90 Days</span>
        </div>
      </div>

      {/* Main Records Table */}
      {/* STRICT SEQUENCE: S.NO, DATE, VEHICLE NUMBER, FILTER CLEANING DATE, FILTER EXPIRY DATE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">S.NO</th>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">VEHICLE NUMBER</th>
                <th className="py-3.5 px-4">FILTER CLEANING DATE</th>
                <th className="py-3.5 px-4">FILTER EXPIRY DATE</th>
                <th className="py-3.5 px-4 text-center">FILTER STATUS</th>
                <th className="py-3.5 px-4">VEHICLE GENERAL CHECKUP</th>
                <th className="py-3.5 px-4 text-center">PROOFS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading AC service & filter records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Snowflake className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    No AC maintenance records found. Click "Log AC Service" to add one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => {
                  const statusInfo = getFilterStatusInfo(r);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        statusInfo.isExpired ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. S.NO */}
                      <td className="py-3.5 px-4 font-bold text-slate-500 text-center">
                        {index + 1}
                      </td>

                      {/* 2. DATE */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.inspection_date || '-'}</span>
                        </div>
                      </td>

                      {/* 3. VEHICLE NUMBER */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                            <Bus className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {r.bus_number || r.registration_number || (r.bus_id ? `Bus #${r.bus_id}` : '-')}
                          </span>
                        </div>
                      </td>

                      {/* 4. FILTER CLEANING DATE */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                          <span>{r.filter_cleaning_date || r.inspection_date || '-'}</span>
                        </div>
                      </td>

                      {/* 5. FILTER EXPIRY DATE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {statusInfo.isExpired ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span
                            className={`font-bold ${
                              statusInfo.isExpired
                                ? 'text-rose-600 underline'
                                : statusInfo.isExpiring
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {r.filter_expiry_date || '-'}
                          </span>
                        </div>
                      </td>

                      {/* FILTER STATUS BADGE */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* VEHICLE GENERAL CHECKUP (Date, Expiry, Photo) */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-slate-700 font-medium flex items-center gap-1">
                            <span className="text-slate-400">Date:</span>
                            <span className="font-semibold">{r.general_checkup_date || '-'}</span>
                          </div>
                          {r.general_checkup_expiry_date && (
                            <div className="text-slate-500 flex items-center gap-1">
                              <span className="text-slate-400">Exp:</span>
                              <span className="font-semibold text-slate-700">
                                {r.general_checkup_expiry_date}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PROOFS (Thumbnails) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.filter_proof_photo ? (
                            <button
                              onClick={() =>
                                setViewingPhoto({
                                  url: r.filter_proof_photo!,
                                  title: `Filter Proof - ${r.bus_number || 'Vehicle'}`
                                })
                              }
                              className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-cyan-500 transition-all cursor-pointer"
                              title="View Filter Proof Photo"
                            >
                              <img
                                src={r.filter_proof_photo}
                                alt="Filter Proof"
                                className="w-8 h-8 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}

                          {r.general_checkup_photo && (
                            <button
                              onClick={() =>
                                setViewingPhoto({
                                  url: r.general_checkup_photo!,
                                  title: `General Checkup Proof - ${r.bus_number || 'Vehicle'}`
                                })
                              }
                              className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition-all cursor-pointer"
                              title="View General Checkup Photo"
                            >
                              <img
                                src={r.general_checkup_photo}
                                alt="Checkup Proof"
                                className="w-8 h-8 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* RENEW FILTER BUTTON */}
                          <button
                            onClick={() => handleOpenRenewal(r)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              statusInfo.isExpired
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                            }`}
                            title="Renew Filter with Proof Photo"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renew Filter</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* MODAL 1: LOG / EDIT AC SERVICE MODAL */}
      {/* Kept exactly with: DATE, VEHICLE NUMBER, FILTER CLEANING DATE, FILTER EXPIRY DATE, */}
      {/* VEHICLE GENERAL CHECKUP DATE, VEHICLE GENERAL CHECKUP EXPIRY DATE, AND PHOTO UPLOAD */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? 'Edit AC & General Checkup Record' : 'Log AC Service & Vehicle General Checkup'}
        subtitle="Save filter cleaning, expiry schedule, general checkup dates and upload photo proofs"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Row 1: Vehicle Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Number *
              </label>
              <SearchableSelect
                options={busSelectOptions}
                value={formData.bus_id}
                onChange={(val) => {
                  const b = buses.find(x => String(x.id) === val);
                  setFormData({
                    ...formData,
                    bus_id: val,
                    current_km: b?.current_odometer_km || formData.current_km
                  });
                }}
                placeholder="Search or select vehicle number..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date (Service Date) *
              </label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800"
                required
              />
            </div>
          </div>

          {/* Section: AC Filter Service Details */}
          <div className="p-3.5 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 text-cyan-600" />
                AC Filter Cleaning & Expiry Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filter Cleaning Date *
                </label>
                <input
                  type="date"
                  value={formData.filter_cleaning_date}
                  onChange={(e) => {
                    const cDate = e.target.value;
                    const autoExpiry = cDate ? addDaysToDate(cDate, 5) : '';
                    setFormData(prev => ({
                      ...prev,
                      filter_cleaning_date: cDate,
                      filter_expiry_date: autoExpiry || prev.filter_expiry_date
                    }));
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filter Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.filter_expiry_date}
                  onChange={(e) => setFormData({ ...formData, filter_expiry_date: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Filter Cleaning Proof Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Cleaning Proof (Photo Upload)
              </label>
              {formData.filter_proof_photo ? (
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-cyan-200">
                  <img
                    src={formData.filter_proof_photo}
                    alt="Filter Proof"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-emerald-700 block">✓ Filter Proof Photo Attached</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, filter_proof_photo: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold mt-0.5 cursor-pointer"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-cyan-300 bg-white hover:bg-cyan-50/50 cursor-pointer transition-colors text-xs font-bold text-cyan-800">
                    {uploadingFilterPhoto ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-cyan-600" />
                        <span>Upload Filter Proof Photo (Optional)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFilterPhotoUpload}
                      disabled={uploadingFilterPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section: Vehicle General Checkup Details */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                Vehicle General Checkup Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle General Checkup Date
                </label>
                <input
                  type="date"
                  value={formData.general_checkup_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData({
                      ...formData,
                      general_checkup_date: newDate,
                      general_checkup_expiry_date: addOneMonthToDate(newDate)
                    });
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle General Checkup Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.general_checkup_expiry_date}
                  onChange={(e) => setFormData({ ...formData, general_checkup_expiry_date: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* General Checkup Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle General Checkup Proof (Photo Upload)
              </label>
              {formData.general_checkup_photo ? (
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-blue-200">
                  <img
                    src={formData.general_checkup_photo}
                    alt="General Checkup Proof"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-emerald-700 block">✓ General Checkup Photo Attached</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, general_checkup_photo: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold mt-0.5 cursor-pointer"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-white hover:bg-blue-50/50 cursor-pointer transition-colors text-xs font-bold text-blue-800">
                    {uploadingGeneralPhoto ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>Upload Vehicle General Checkup Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGeneralCheckupPhotoUpload}
                      disabled={uploadingGeneralPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>



          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks & Work Performed
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Filter cleaned, general checkup completed, compressor checked..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save AC Record</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: FILTER RENEWAL WITH PHOTO PROOF MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!renewingRecord}
        onClose={() => setRenewingRecord(null)}
        title="Filter Renewal & Verification Proof"
        subtitle={`Renew filter for ${renewingRecord?.bus_number || 'Vehicle'} with proof photo`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveRenewal} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Renewing Filter for {renewingRecord?.bus_number}</span>
            </div>
            <div className="mt-1 text-amber-800 text-[11px]">
              Previous Expiry: <span className="font-bold">{renewingRecord?.filter_expiry_date || 'None'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Filter Cleaning Date *
              </label>
              <input
                type="date"
                value={renewFormData.filter_cleaning_date}
                onChange={(e) => {
                  const cDate = e.target.value;
                  const autoExpiry = cDate ? addDaysToDate(cDate, 5) : '';
                  setRenewFormData(prev => ({
                    ...prev,
                    filter_cleaning_date: cDate,
                    filter_expiry_date: autoExpiry || prev.filter_expiry_date
                  }));
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Filter Expiry Date *
              </label>
              <input
                type="date"
                value={renewFormData.filter_expiry_date}
                onChange={(e) => setRenewFormData({ ...renewFormData, filter_expiry_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800"
                required
              />
            </div>
          </div>

          {/* Photo Option for Proof */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Photo Proof for Filter Renewal *
            </label>
            <p className="text-[11px] text-slate-500">
              Upload clear photo of the cleaned or replaced filter as visual proof.
            </p>

            {renewFormData.filter_proof_photo ? (
              <div className="relative p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={renewFormData.filter_proof_photo}
                  alt="Renewal Proof"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Proof Photo Uploaded Successfully
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setViewingPhoto({
                          url: renewFormData.filter_proof_photo,
                          title: 'Filter Renewal Proof'
                        })
                      }
                      className="text-[11px] font-bold text-cyan-700 hover:underline cursor-pointer"
                    >
                      View Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewFormData({ ...renewFormData, filter_proof_photo: '' })}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/30 hover:bg-cyan-50/70 transition-all cursor-pointer">
                {uploadingRenewPhoto ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-cyan-800">Uploading Renewal Proof...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-2.5 rounded-full bg-cyan-100 text-cyan-700">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#142B4A]">
                      Click to Capture or Upload Proof Photo
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, JPEG up to 10MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRenewalPhotoUpload}
                  disabled={uploadingRenewPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Renewal Remarks / Notes
            </label>
            <input
              type="text"
              value={renewFormData.remarks}
              onChange={(e) => setRenewFormData({ ...renewFormData, remarks: e.target.value })}
              placeholder="e.g. Filters washed, sanitized, and reinstalled"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRenewingRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Renew Filter</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: FULL SCREEN PHOTO VIEWER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        title={viewingPhoto?.title || 'Proof Photo'}
        subtitle="Visual inspection verification proof"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {viewingPhoto && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={viewingPhoto.url}
                alt="Proof Full View"
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setViewingPhoto(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
