import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  Bus,
  MapPin,
  User,
  Phone,
  Upload,
  Trash2,
  Edit2,
  Eye,
  Printer,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowLeft,
  FileCheck,
  Camera,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';

export interface AmenityCheckItem {
  id: string;
  name: string;
  status: 'OK' | 'Not OK';
  remarks: string;
  isCustom?: boolean;
}

export interface CaptainAuditRecordItem {
  id: number | string;
  audit_date: string;
  audit_time: string;
  bus_number: string;
  route: string;
  captain_name: string;
  captain_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  staff_pictures: string[];
  cleaning_pictures: string[];
  amenities: AmenityCheckItem[];
  overall_status: 'Passed' | 'Needs Attention';
  remarks?: string;
  submitted_by_role?: string;
  submitted_by_user_id?: number | string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_AMENITY_NAMES: string[] = [
  'Blanket',
  'Charging Point',
  'AC',
  'First Add Box',
  'Fire Cylinder',
  'Spare Tyre (Stepny)',
  'Cleaning',
  'Driver Dress',
  'Captain Dress',
  'Water Bottle',
  'Birth Cleaning',
  'GPs Tracking',
  'Bus Branding',
  'Tyre Condition'
];

export const CaptainAuditRecord: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const isAdmin = Boolean(
    user?.role === 'Super Admin' ||
    user?.role === 'Admin' ||
    user?.email?.toLowerCase().includes('admin')
  );

  const [records, setRecords] = useState<CaptainAuditRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Needs Attention'>('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form Modal State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View / Print Modal State
  const [viewRecord, setViewRecord] = useState<CaptainAuditRecordItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Form Fields
  const [busNumber, setBusNumber] = useState('');
  const [route, setRoute] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [staffPictures, setStaffPictures] = useState<string[]>([]);
  const [cleaningPictures, setCleaningPictures] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<AmenityCheckItem[]>([]);
  const [generalRemarks, setGeneralRemarks] = useState('');

  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const [uploadingCleaningPhoto, setUploadingCleaningPhoto] = useState(false);

  const staffFileInputRef = useRef<HTMLInputElement>(null);
  const cleaningFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Default Amenities
  const initializeAmenities = () => {
    return DEFAULT_AMENITY_NAMES.map((name, index) => ({
      id: `amenity-${index}-${Date.now()}`,
      name,
      status: 'OK' as const,
      remarks: '',
      isCustom: false
    }));
  };

  // Fetch all records and dropdown data
  const loadData = async () => {
    setLoading(true);
    try {
      const [auditData, busData, routeData, empData] = await Promise.all([
        api.getCaptainAudits().catch(() => []),
        api.getBuses().catch(() => []),
        api.getRoutes().catch(() => []),
        api.getEmployees().catch(() => [])
      ]);

      setRecords(Array.isArray(auditData) ? auditData : []);
      setBuses(Array.isArray(busData) ? busData : []);
      setRoutes(Array.isArray(routeData) ? routeData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err: any) {
      console.error('Error loading captain audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Form for New Submission
  const handleOpenNewForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setBusNumber('');
    setRoute('');
    setCaptainName(user?.role === 'Captain' ? (user?.name || '') : '');
    setCaptainPhone(user?.phone_number || '');
    setDriverName('');
    setDriverPhone('');
    setStaffPictures([]);
    setCleaningPictures([]);
    setAmenities(initializeAmenities());
    setGeneralRemarks('');
    setIsFormOpen(true);
  };

  // Open Form for Editing (Admin only)
  const handleOpenEditForm = (rec: CaptainAuditRecordItem) => {
    if (!isAdmin) {
      error('Access Denied: Only Admins can modify submitted audit records.');
      return;
    }
    setIsEditing(true);
    setEditingId(rec.id);
    setBusNumber(rec.bus_number || '');
    setRoute(rec.route || '');
    setCaptainName(rec.captain_name || '');
    setCaptainPhone(rec.captain_phone || '');
    setDriverName(rec.driver_name || '');
    setDriverPhone(rec.driver_phone || '');
    setStaffPictures(Array.isArray(rec.staff_pictures) ? [...rec.staff_pictures] : []);
    setCleaningPictures(Array.isArray(rec.cleaning_pictures) ? [...rec.cleaning_pictures] : []);
    setAmenities(Array.isArray(rec.amenities) && rec.amenities.length > 0 ? [...rec.amenities] : initializeAmenities());
    setGeneralRemarks(rec.remarks || '');
    setIsFormOpen(true);
  };

  // Handle Deleting Record (Admin only)
  const handleDeleteRecord = async (id: number | string) => {
    if (!isAdmin) {
      error('Access Denied: Only Admins can delete audit records.');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this Captain Audit Record?')) {
      return;
    }
    try {
      await api.deleteCaptainAudit(id);
      success('Captain Audit Record deleted successfully.');
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (viewRecord?.id === id) {
        setIsViewOpen(false);
        setViewRecord(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  // Photo Upload Handlers
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'staff' | 'cleaning'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentList = type === 'staff' ? staffPictures : cleaningPictures;
    const remainingSlots = 5 - currentList.length;

    if (remainingSlots <= 0) {
      error('You have already reached the limit of 5 pictures.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (type === 'staff') setUploadingStaffPhoto(true);
    else setUploadingCleaningPhoto(true);

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        error(`File ${file.name} exceeds 10MB limit and was skipped.`);
        continue;
      }
      try {
        const res = await api.uploadFile(file);
        const url = res.fileUrl || res.url;
        if (url) {
          uploadedUrls.push(url);
        } else {
          // Fallback to local DataURL for instant preview
          const reader = new FileReader();
          reader.onload = (loadEv) => {
            if (loadEv.target?.result) {
              uploadedUrls.push(loadEv.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        // Fallback to local DataURL
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (loadEv) => {
            if (loadEv.target?.result) {
              uploadedUrls.push(loadEv.target.result as string);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    if (type === 'staff') {
      setStaffPictures((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      setUploadingStaffPhoto(false);
      if (staffFileInputRef.current) staffFileInputRef.current.value = '';
    } else {
      setCleaningPictures((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      setUploadingCleaningPhoto(false);
      if (cleaningFileInputRef.current) cleaningFileInputRef.current.value = '';
    }

    if (uploadedUrls.length > 0) {
      success(`Uploaded ${uploadedUrls.length} photo(s) successfully.`);
    }
  };

  const removePhoto = (index: number, type: 'staff' | 'cleaning') => {
    if (type === 'staff') {
      setStaffPictures((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCleaningPictures((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Amenities Table Actions
  const handleToggleAmenityStatus = (index: number, newStatus: 'OK' | 'Not OK') => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleAmenityRemarkChange = (index: number, remarks: string) => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], remarks };
      return copy;
    });
  };

  const handleCustomAmenityNameChange = (index: number, name: string) => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  };

  const handleAddMoreAmenity = () => {
    const newItem: AmenityCheckItem = {
      id: `custom-amenity-${Date.now()}`,
      name: '',
      status: 'OK',
      remarks: '',
      isCustom: true
    };
    setAmenities((prev) => [...prev, newItem]);
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!busNumber.trim()) {
      error('Bus Number is required.');
      return;
    }
    if (!route.trim()) {
      error('Route is required.');
      return;
    }
    if (!captainName.trim()) {
      error('Captain Name is required.');
      return;
    }

    // Check if any amenity has 'Not OK'
    const hasDeficiencies = amenities.some((a) => a.status === 'Not OK');
    const overall_status: 'Passed' | 'Needs Attention' = hasDeficiencies ? 'Needs Attention' : 'Passed';

    const now = new Date();
    const audit_date = now.toISOString().split('T')[0];
    const audit_time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const payload = {
      audit_date,
      audit_time,
      bus_number: busNumber.trim().toUpperCase(),
      route: route.trim(),
      captain_name: captainName.trim(),
      captain_phone: captainPhone.trim(),
      driver_name: driverName.trim(),
      driver_phone: driverPhone.trim(),
      staff_pictures: staffPictures,
      cleaning_pictures: cleaningPictures,
      amenities,
      overall_status,
      remarks: generalRemarks.trim(),
      submitted_by_role: user?.role || 'Captain',
      submitted_by_user_id: user?.id || null
    };

    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        if (!isAdmin) {
          error('Only Admin can edit submitted records.');
          setSubmitting(false);
          return;
        }
        const updated = await api.updateCaptainAudit(editingId, payload);
        success('Captain Audit Record updated successfully.');
        setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r)));
      } else {
        const created = await api.createCaptainAudit(payload);
        success('Captain Audit Record submitted successfully!');
        setRecords((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to submit Captain Audit Record');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.bus_number.toLowerCase().includes(q) ||
        rec.captain_name.toLowerCase().includes(q) ||
        rec.route.toLowerCase().includes(q) ||
        (rec.driver_name && rec.driver_name.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' || rec.overall_status === statusFilter;

      let matchDate = true;
      if (fromDate) {
        matchDate = matchDate && rec.audit_date >= fromDate;
      }
      if (toDate) {
        matchDate = matchDate && rec.audit_date <= toDate;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [records, searchTerm, statusFilter, fromDate, toDate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const passed = records.filter((r) => r.overall_status === 'Passed').length;
    const flagged = records.filter((r) => r.overall_status === 'Needs Attention').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAudits = records.filter((r) => r.audit_date === todayStr).length;

    return { total, passed, flagged, todayAudits };
  }, [records]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Captain Audit Record
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {records.length} Total Audits
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboard bus inspection, amenities verification, and crew photo checklist.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Captain Audit Record</span>
          </button>
        </div>
      </div>

      {/* Role Notice for Captains */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Captain Notice:</strong> Once an audit record is submitted, it is permanently locked and cannot be edited or deleted by captains. Only Administrators have modification permissions.
          </span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Audits
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-slate-800">{metrics.total}</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Inspections logged</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Passed (All OK)
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-emerald-700">{metrics.passed}</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">100% compliant</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Needs Attention
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-rose-700">{metrics.flagged}</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-rose-600/80 mt-1 block">Deficiencies noted</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Today's Audits
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-indigo-700">{metrics.todayAudits}</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-indigo-600/80 mt-1 block">Active date shifts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bus No / Captain / Route / Driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="All">All Compliance Statuses</option>
              <option value="Passed">Passed (Compliant)</option>
              <option value="Needs Attention">Needs Attention</option>
            </select>
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-hidden"
              />
            </div>
            <div className="flex-1 flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-hidden"
              />
            </div>
            {(fromDate || toDate || searchTerm || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">S.No</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Bus Number</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Captain</th>
                <th className="py-3.5 px-4">Driver</th>
                <th className="py-3.5 px-4">Amenities Checklist</th>
                <th className="py-3.5 px-4">Photos</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Loading Captain Audit Records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-600">No Captain Audit Records found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Submit Captain Audit Record" to add an onboard audit.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const amenitiesList = Array.isArray(rec.amenities) ? rec.amenities : [];
                  const okCount = amenitiesList.filter((a) => a.status === 'OK').length;
                  const totalCount = amenitiesList.length || 14;
                  const isFullyPassed = okCount === totalCount;
                  const totalPhotos = (rec.staff_pictures?.length || 0) + (rec.cleaning_pictures?.length || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.audit_date}</span>
                        </div>
                        {rec.audit_time && (
                          <span className="text-[10px] text-slate-400 font-normal pl-5 block">
                            {rec.audit_time}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-[#142B4A] bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-blue-600" />
                          {rec.bus_number}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[180px] truncate" title={rec.route}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.route}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{rec.captain_name}</div>
                        {rec.captain_phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {rec.captain_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{rec.driver_name || '-'}</div>
                        {rec.driver_phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {rec.driver_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isFullyPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{okCount} / {totalCount} OK</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Camera className="w-3 h-3 text-slate-500" />
                          {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${rec.overall_status === 'Passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {rec.overall_status === 'Passed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {rec.overall_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setViewRecord(rec);
                              setIsViewOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Audit Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setViewRecord(rec);
                              setIsViewOpen(true);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Audit Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit & Delete strictly restricted to Admin */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditForm(rec)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record (Admin Only)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record (Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
      {/* MODAL: SUBMIT / EDIT CAPTAIN AUDIT RECORD FORM (Images 1, 2, 3, 4 layout) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? 'Edit Captain Audit Record (Admin)' : 'Captain Audit Record Form'}
        subtitle="Complete the bus inspection checklist and upload crew & bus photos."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmitAudit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Staff Picture (Image 1) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-black text-slate-800 flex items-center gap-1">
                  Staff Picture <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 5 supported files. Max 10 MB per file.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {staffPictures.length} / 5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {staffPictures.map((picUrl, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-white">
                  <img src={picUrl} alt={`Staff ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, 'staff')}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {staffPictures.length < 5 && (
                <div>
                  <input
                    type="file"
                    ref={staffFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'staff')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => staffFileInputRef.current?.click()}
                    disabled={uploadingStaffPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingStaffPhoto ? 'Uploading...' : 'Add file'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Bus Number (Image 1) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-sm font-black text-slate-800 flex items-center gap-1">
              Bus Number <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                list="buses-datalist"
                placeholder="Your answer (e.g. AP16TV1234)"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-bold uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <datalist id="buses-datalist">
                {buses.map((b: any) => (
                  <option key={b.id} value={b.bus_number}>
                    {b.bus_number} - {b.bus_type || 'Fleet'}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Card 3: Route & Crew Details (Image 2) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-200/80 pb-2">
              Route & Crew Information
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Route <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="routes-datalist"
                placeholder="Your answer (e.g. Hyderabad - Bangalore)"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <datalist id="routes-datalist">
                {routes.map((r: any) => (
                  <option key={r.id} value={r.route_name || `${r.origin} - ${r.destination}`}>
                    {r.route_code ? `[${r.route_code}] ` : ''}
                    {r.origin} - {r.destination}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Captain Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Captain Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="Your answer (10 digits)"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Driver Name
                </label>
                <input
                  type="text"
                  placeholder="Your answer"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Driver Number
                </label>
                <input
                  type="tel"
                  placeholder="Your answer"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Amenities Checklist (Image 3 & Image 4 layout) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Amenties
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check each item as OK or Not OK. Add notes in Remarks if anything is deficient.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMoreAmenity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200/80 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Amenities</span>
              </button>
            </div>

            {/* Amenities Table as in Image 4 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3.5">Amenity / Item</th>
                    <th className="py-2.5 px-3 text-center w-20">OK</th>
                    <th className="py-2.5 px-3 text-center w-20">Not OK</th>
                    <th className="py-2.5 px-3.5">Remarks</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amenities.map((item, idx) => {
                    const isOk = item.status === 'OK';
                    const isNotOk = item.status === 'Not OK';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-slate-800">
                          {item.isCustom ? (
                            <input
                              type="text"
                              required
                              placeholder="Enter amenity name..."
                              value={item.name}
                              onChange={(e) => handleCustomAmenityNameChange(idx, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded-lg focus:outline-hidden font-semibold text-blue-900 bg-blue-50/30"
                            />
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </td>

                        {/* OK Button (Solid Square when checked like Image 4) */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAmenityStatus(idx, 'OK')}
                            className={`w-7 h-7 mx-auto rounded flex items-center justify-center transition-all cursor-pointer ${isOk
                                ? 'bg-black text-white shadow-xs'
                                : 'border-2 border-slate-400 hover:border-black bg-white text-transparent'
                              }`}
                            title="Mark as OK"
                          >
                            {isOk ? '■' : '□'}
                          </button>
                        </td>

                        {/* Not OK Button */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAmenityStatus(idx, 'Not OK')}
                            className={`w-7 h-7 mx-auto rounded flex items-center justify-center transition-all cursor-pointer ${isNotOk
                                ? 'bg-rose-600 text-white shadow-xs font-bold'
                                : 'border-2 border-slate-400 hover:border-rose-500 bg-white text-transparent'
                              }`}
                            title="Mark as Not OK"
                          >
                            {isNotOk ? '■' : '□'}
                          </button>
                        </td>

                        {/* Remarks Input field */}
                        <td className="py-2 px-3.5">
                          <input
                            type="text"
                            placeholder="Optional notes / remark..."
                            value={item.remarks}
                            onChange={(e) => handleAmenityRemarkChange(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                          />
                        </td>

                        {/* Action column (delete for custom amenities) */}
                        <td className="py-2 px-2 text-center">
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAmenity(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete amenity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <span className="text-xs font-bold text-slate-500">
                Total Checklist Items: <strong>{amenities.length}</strong> (
                {amenities.filter((a) => a.status === 'OK').length} OK,{' '}
                {amenities.filter((a) => a.status === 'Not OK').length} Not OK)
              </span>
            </div>
          </div>

          {/* Card 5: Bus Cleaning Picture (Image 3) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-black text-slate-800 flex items-center gap-1">
                  Bus Cleaning Picture <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 5 supported files. Max 10 MB per file.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {cleaningPictures.length} / 5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {cleaningPictures.map((picUrl, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-white">
                  <img src={picUrl} alt={`Cleaning ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, 'cleaning')}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {cleaningPictures.length < 5 && (
                <div>
                  <input
                    type="file"
                    ref={cleaningFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'cleaning')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => cleaningFileInputRef.current?.click()}
                    disabled={uploadingCleaningPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingCleaningPhoto ? 'Uploading...' : 'Add file'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 6: General Audit Remarks (Optional) */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              General Audit Remarks / Handover Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any additional feedback or supervisor instructions..."
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving Record...'
                  : isEditing
                    ? 'Update Captain Audit Record'
                    : 'Submit Captain Audit Record'}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW & PRINT OFFICIAL CAPTAIN AUDIT REPORT SHEET                  */}
      {/* ========================================================================= */}
      {viewRecord && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Captain Audit Sheet #${viewRecord.id}`}
          subtitle={`Bus ${viewRecord.bus_number} • Date: ${viewRecord.audit_date}`}
          maxWidth="max-w-4xl"
        >
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Action Bar for Modal (hidden on print) */}
            <div className="flex items-center justify-between no-print pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${viewRecord.overall_status === 'Passed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                    }`}
                >
                  Status: {viewRecord.overall_status}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Audited on {viewRecord.audit_date} {viewRecord.audit_time}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Printable Audit Sheet Container */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 print:border-none print:p-0 space-y-6">
              {/* Header Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo-compact.png"
                    alt="Charvik Staffing Consultancy"
                    className="h-16 w-auto object-contain block"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = '/logo.png';
                    }}
                  />
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                      Charvik Staffing Consultancy
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Fleet Operations, Staffing & Transit Vehicle Quality Audits
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Official Captain Onboard Vehicle Inspection Record
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-blue-900 uppercase">Audit Record</div>
                  <div className="text-sm font-extrabold text-slate-800">#{viewRecord.id}</div>
                  <div className="text-[11px] text-slate-500">{viewRecord.audit_date}</div>
                </div>
              </div>

              {/* Bus & Crew Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bus Number</span>
                  <span className="font-extrabold text-slate-900 text-sm">{viewRecord.bus_number}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Route</span>
                  <span className="font-bold text-slate-800">{viewRecord.route}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Captain Name</span>
                  <span className="font-bold text-slate-800">{viewRecord.captain_name}</span>
                  {viewRecord.captain_phone && (
                    <span className="text-[10px] text-slate-500 block">{viewRecord.captain_phone}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver Name</span>
                  <span className="font-bold text-slate-800">{viewRecord.driver_name || 'N/A'}</span>
                  {viewRecord.driver_phone && (
                    <span className="text-[10px] text-slate-500 block">{viewRecord.driver_phone}</span>
                  )}
                </div>
              </div>

              {/* Amenities Inspection Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Onboard Amenities & Maintenance Checklist
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Amenity Item</th>
                        <th className="py-2 px-3 text-center w-24">Compliance</th>
                        <th className="py-2 px-3">Remarks / Inspector Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewRecord.amenities || []).map((a, i) => (
                        <tr key={i} className={a.status === 'Not OK' ? 'bg-rose-50/40' : ''}>
                          <td className="py-2 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{a.name}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${a.status === 'OK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 italic">
                            {a.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-4 print:break-inside-avoid">
                {/* Staff Pictures */}
                {viewRecord.staff_pictures && viewRecord.staff_pictures.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      Staff Pictures ({viewRecord.staff_pictures.length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {viewRecord.staff_pictures.map((pic, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhotoModal(pic)}
                          className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 shadow-2xs"
                        >
                          <img src={pic} alt={`Staff ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bus Cleaning Pictures */}
                {viewRecord.cleaning_pictures && viewRecord.cleaning_pictures.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      Bus Cleaning Pictures ({viewRecord.cleaning_pictures.length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {viewRecord.cleaning_pictures.map((pic, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhotoModal(pic)}
                          className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 shadow-2xs"
                        >
                          <img src={pic} alt={`Cleaning ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* General Remarks */}
              {viewRecord.remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Supervisor / Captain Remarks:</span>
                  <p className="text-slate-600">{viewRecord.remarks}</p>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600 print:pt-16">
                <div className="text-center">
                  <div className="border-b border-slate-400 w-44 mb-1"></div>
                  <span className="font-bold block">{viewRecord.captain_name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Captain Signature</span>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-400 w-44 mb-1"></div>
                  <span className="font-bold block">Fleet Operations Manager</span>
                  <span className="text-[10px] text-slate-400 uppercase">Charvik Quality Admin</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox / Zoom Photo Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={activePhotoModal} alt="Zoomed audit capture" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainAuditRecord;

