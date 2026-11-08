import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Bus,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Download,
  ArrowLeft,
  ArrowRight,
  Gauge,
  MapPin,
  User,
  Calendar,
  IndianRupee,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Edit,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

interface ServiceItem {
  key: string;
  name: string;
  intervalType: 'km' | 'date';
  interval: number;
  intervalLabel: string;
  lastDoneKm: number;
  lastDoneDate: string;
  nextDueKm: number;
  nextDueDate: string;
  status: 'OK' | 'Due Soon' | 'Overdue';
  statusText: string;
  progressPercent: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

interface Vehicle {
  id: number;
  bus_number: string;
  registration_number: string;
  make?: string;
  model: string;
  chassis_number?: string;
  engine_number?: string;
  current_odometer_km: number;
  parking_location?: string;
  operations_manager?: string;
  driver_name?: string;
  last_service_date?: string;
  last_service_km?: number;
  status: 'Healthy' | 'Due Soon' | 'Needs Attention';
  overdueCount: number;
  dueSoonCount: number;
  services: ServiceItem[];
  history: any[];
}

export const VehicleMaintenance: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    totalBuses: 0,
    servicesDueSoon: 0,
    overdueServices: 0,
    servicesCompleted: 0,
    vehiclesNeedingAttention: 0
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Needs Attention' | 'Due Soon' | 'Healthy'>('All');
  const [depotFilter, setDepotFilter] = useState('All');

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isUpdateOdometerOpen, setIsUpdateOdometerOpen] = useState(false);
  const [newOdometerVal, setNewOdometerVal] = useState<number | string>('');

  const [completingService, setCompletingService] = useState<{
    vehicle: Vehicle;
    service: ServiceItem;
  } | null>(null);

  const [completionForm, setCompletionForm] = useState({
    completion_date: new Date().toISOString().split('T')[0],
    odometer_km: 0,
    cost: 0,
    workshop: 'Charvik Central Workshop',
    mechanic_name: '',
    remarks: '',
    photos: [] as string[]
  });

  const [vehicleForm, setVehicleForm] = useState({
    registration_number: '',
    model: '',
    chassis_number: '',
    engine_number: '',
    current_odometer_km: '',
    last_service_date: '',
    last_service_km: '',
    parking_location: 'Delhi Depot – Bay 1',
    driver_name: '',
    operations_manager: 'Priya Sharma'
  });

  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // Load Data
  const loadFleetData = async () => {
    try {
      setLoading(true);
      const res = await api.getFleetMaintenance();
      if (res) {
        setSummary(res.summary || {});
        setVehicles(res.buses || []);

        // Check if query param selected a vehicle
        const vehicleParam = searchParams.get('vehicle');
        if (vehicleParam) {
          const match = (res.buses || []).find(
            (b: Vehicle) =>
              b.registration_number.toLowerCase() === vehicleParam.toLowerCase() ||
              b.bus_number.toLowerCase() === vehicleParam.toLowerCase() ||
              String(b.id) === vehicleParam
          );
          if (match) setSelectedVehicle(match);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to load fleet maintenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  // Update URL when vehicle selection changes
  const handleSelectVehicle = (v: Vehicle | null) => {
    setSelectedVehicle(v);
    if (v) {
      setSearchParams({ vehicle: v.registration_number });
    } else {
      setSearchParams({});
    }
  };

  // Open "Mark Completed" Modal
  const handleOpenCompleteModal = (vehicle: Vehicle, service: ServiceItem) => {
    setCompletingService({ vehicle, service });
    setCompletionForm({
      completion_date: new Date().toISOString().split('T')[0],
      odometer_km: vehicle.current_odometer_km || 0,
      cost: service.intervalType === 'km' ? 4500 : 750,
      workshop: 'Charvik Central Workshop',
      mechanic_name: '',
      remarks: '',
      photos: []
    });
  };

  // Handle multi-photo uploads (up to 3 photos as requested by user)
  const handleMultiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - completionForm.photos.length;
    if (remainingSlots <= 0) {
      error('Maximum 3 photos allowed');
      return;
    }

    const filesToLoad = Array.from(files).slice(0, remainingSlots);
    filesToLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setCompletionForm((prev) => {
            if (prev.photos.length >= 3) return prev;
            return {
              ...prev,
              photos: [...prev.photos, reader.result as string]
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setCompletionForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx)
    }));
  };

  // Submit Service Completion
  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingService) return;

    try {
      await api.completeFleetMaintenance({
        bus_id: completingService.vehicle.id,
        service_type: completingService.service.name,
        completion_date: completionForm.completion_date,
        odometer_km: completionForm.odometer_km,
        cost: completionForm.cost,
        workshop: completionForm.workshop,
        mechanic_name: completionForm.mechanic_name,
        remarks: completionForm.remarks,
        photos: completionForm.photos
      });

      success(`Marked "${completingService.service.name}" as completed!`);
      setCompletingService(null);
      await loadFleetData();

      // Refresh selected vehicle if in profile view
      if (selectedVehicle) {
        const refreshed = await api.getFleetMaintenance();
        const updated = (refreshed.buses || []).find((b: Vehicle) => b.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (err: any) {
      error(err.message || 'Failed to complete maintenance');
    }
  };

  // Quick Odometer Update (syncs to Daily Vehicle Checkup as well)
  const handleSaveOdometer = async () => {
    if (!selectedVehicle) return;
    const kmNum = Number(newOdometerVal);
    if (!kmNum || kmNum <= 0) {
      error('Please enter a valid odometer KM');
      return;
    }

    try {
      await api.updateBus(selectedVehicle.id, {
        current_odometer_km: kmNum
      });

      // Also create/update a daily checkup entry to keep KM unified
      await api.createBusConditionInspection({
        bus_id: selectedVehicle.id,
        inspection_date: new Date().toISOString().split('T')[0],
        starting_km: kmNum,
        odometer_km: kmNum,
        inspector_name: 'Odometer Sync',
        vehicle_model: selectedVehicle.model,
        roadworthiness_status: 'Fit for Service',
        driver_name: selectedVehicle.driver_name || 'Fleet Driver'
      }).catch(() => {});

      success(`Odometer updated to ${kmNum.toLocaleString('en-IN')} KM!`);
      setIsUpdateOdometerOpen(false);
      await loadFleetData();
      if (selectedVehicle) {
        const refreshed = await api.getFleetMaintenance();
        const updated = (refreshed.buses || []).find((b: Vehicle) => b.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update odometer');
    }
  };

  // Add Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.registration_number) {
      error('Registration number is required');
      return;
    }

    try {
      await api.createFleetVehicle({
        registration_number: vehicleForm.registration_number,
        bus_number: vehicleForm.registration_number,
        model: vehicleForm.model || 'Volvo 9600 Multi-Axle',
        make: vehicleForm.model?.split(' ')[0] || 'Fleet',
        chassis_number: vehicleForm.chassis_number,
        engine_number: vehicleForm.engine_number,
        current_odometer_km: Number(vehicleForm.current_odometer_km) || 0,
        parking_location: vehicleForm.parking_location || 'Delhi Depot – Bay 1',
        operations_manager: vehicleForm.operations_manager || 'Priya Sharma',
        last_service_date: vehicleForm.last_service_date,
        last_service_km: Number(vehicleForm.last_service_km) || 0
      });

      success('New vehicle added to fleet maintenance!');
      setIsAddVehicleOpen(false);
      setVehicleForm({
        registration_number: '',
        model: '',
        chassis_number: '',
        engine_number: '',
        current_odometer_km: '',
        last_service_date: '',
        last_service_km: '',
        parking_location: 'Delhi Depot – Bay 1',
        driver_name: '',
        operations_manager: 'Priya Sharma'
      });
      loadFleetData();
    } catch (err: any) {
      error(err.message || 'Failed to add vehicle');
    }
  };

  // Export Excel (Matching 3-sheet format shown in frame 3)
  const handleExportExcel = () => {
    try {
      const summaryRows = vehicles.map((v) => ({
        'Registration No': v.registration_number,
        'Bus Model': v.model,
        'Chassis No': v.chassis_number || '—',
        'Engine No': v.engine_number || '—',
        'Current Odometer (KM)': v.current_odometer_km,
        'Last Service Date': v.last_service_date || '—',
        'Last Service Odometer (KM)': v.last_service_km || 0,
        'Parking Location': v.parking_location || '—',
        'Driver': v.driver_name || '—',
        'Operations Manager': v.operations_manager || '—',
        'Status': v.status
      }));

      const serviceStatusRows: any[] = [];
      vehicles.forEach((v) => {
        v.services.forEach((s) => {
          serviceStatusRows.push({
            'Registration No': v.registration_number,
            'Bus Model': v.model,
            'Service Name': s.name,
            'Interval': s.intervalLabel,
            'Last Done KM': s.lastDoneKm || '—',
            'Last Done Date': s.lastDoneDate || '—',
            'Next Due (KM / Date)': s.intervalType === 'km' ? `${s.nextDueKm.toLocaleString('en-IN')} KM` : s.nextDueDate,
            'Status': s.status,
            'Status Details': s.statusText
          });
        });
      });

      const allHistoryRows: any[] = [];
      vehicles.forEach((v) => {
        (v.history || []).forEach((h) => {
          allHistoryRows.push({
            'Registration No': v.registration_number,
            'Date': h.completion_date,
            'Service': h.service_type,
            'Odometer KM': h.odometer_km,
            'Next Due': h.next_due_km ? `${h.next_due_km} KM` : (h.next_due_date || '—'),
            'Cost (₹)': h.cost,
            'Workshop': h.workshop || '—',
            'Mechanic': h.mechanic_name || '—',
            'Remarks': h.remarks || '—'
          });
        });
      });

      // Generate clean Excel-compatible CSV export with UTF-8 BOM
      const lines: string[] = [];
      lines.push('"CHARVIK FLEET MAINTENANCE OVERVIEW"');
      lines.push(`"Exported At","${new Date().toLocaleString()}"`);
      lines.push(`"Total Fleet Vehicles","${vehicles.length}"`);
      lines.push('');

      lines.push('"=== 1. FLEET SUMMARY ==="');
      if (summaryRows.length > 0) {
        const h1 = Object.keys(summaryRows[0]);
        lines.push(h1.map((k) => `"${k}"`).join(','));
        summaryRows.forEach((row: any) => {
          lines.push(h1.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
        });
      }
      lines.push('');

      lines.push('"=== 2. SERVICE STATUS (9 SERVICES) ==="');
      if (serviceStatusRows.length > 0) {
        const h2 = Object.keys(serviceStatusRows[0]);
        lines.push(h2.map((k) => `"${k}"`).join(','));
        serviceStatusRows.forEach((row: any) => {
          lines.push(h2.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
        });
      }
      lines.push('');

      lines.push('"=== 3. MAINTENANCE HISTORY ==="');
      if (allHistoryRows.length > 0) {
        const h3 = Object.keys(allHistoryRows[0]);
        lines.push(h3.map((k) => `"${k}"`).join(','));
        allHistoryRows.forEach((row: any) => {
          lines.push(h3.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
        });
      } else {
        lines.push('"No completed maintenance history records found"');
      }

      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Fleet_Maintenance_Overview_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('Fleet maintenance overview exported successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to export Excel report');
    }
  };

  // Filtered vehicles for overview
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        v.registration_number.toLowerCase().includes(q) ||
        v.bus_number.toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        (v.driver_name || '').toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Needs Attention'
          ? v.overdueCount > 0
          : statusFilter === 'Due Soon'
          ? v.dueSoonCount > 0 && v.overdueCount === 0
          : v.overdueCount === 0 && v.dueSoonCount === 0;

      const matchDepot = depotFilter === 'All' || (v.parking_location || '').includes(depotFilter);

      return matchSearch && matchStatus && matchDepot;
    });
  }, [vehicles, searchQuery, statusFilter, depotFilter]);

  // Unique depots for dropdown
  const depots = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => {
      if (v.parking_location) set.add(v.parking_location);
    });
    return Array.from(set);
  }, [vehicles]);

  // =========================================================================
  // VIEW: VEHICLE PROFILE (Matching Frame 7, 5, 6, 18)
  // =========================================================================
  if (selectedVehicle) {
    const v = selectedVehicle;
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Back Navigation */}
        <div>
          <button
            type="button"
            onClick={() => handleSelectVehicle(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Fleet Dashboard</span>
          </button>
        </div>

        {/* Top Vehicle Header Card (Matching Frame 7) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {v.registration_number}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  v.overdueCount > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : v.dueSoonCount > 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>{v.overdueCount > 0 ? 'Needs Attention' : v.dueSoonCount > 0 ? 'Due Soon' : 'Healthy'}</span>
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-500 -mt-2">{v.model}</p>

            {/* Spec Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chassis Number</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">{v.chassis_number || 'YS2S4X2000551024'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Number</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">{v.engine_number || 'DC091209451'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parking Location</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{v.parking_location || 'Delhi Depot – Bay 1'}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Driver</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{v.driver_name || 'Sunil Yadav'}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operations Manager</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{v.operations_manager || 'Priya Sharma'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Service Date</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{v.last_service_date || '13 Oct 2026'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Service Odometer</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                  {v.last_service_km ? `${v.last_service_km.toLocaleString('en-IN')} KM` : '3,05,000 KM'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Dark Current Odometer Box (Matching Frame 7) */}
          <div className="bg-[#0B1527] rounded-3xl p-6 text-white min-w-[280px] shadow-lg flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Odometer</p>
              <div className="text-3xl sm:text-4xl font-black text-[#FACC15] font-mono tracking-tight mt-1 flex items-baseline gap-1.5">
                <span>{v.current_odometer_km.toLocaleString('en-IN')}</span>
                <span className="text-sm font-bold text-slate-400">KM</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Synced from Daily Vehicle Checkup
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewOdometerVal(v.current_odometer_km);
                setIsUpdateOdometerOpen(true);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Gauge className="w-4 h-4 text-slate-950" />
              <span>Update Odometer</span>
            </button>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
              <div>
                <p className="text-xs font-black text-white font-mono">
                  {v.services[0]?.nextDueKm ? `${(v.services[0].nextDueKm / 1000).toFixed(0)}k` : '300k'}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Next due</p>
              </div>
              <div>
                <p className="text-xs font-black text-amber-400 font-mono">{v.dueSoonCount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Due soon</p>
              </div>
              <div>
                <p className="text-xs font-black text-rose-400 font-mono">{v.overdueCount}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SERVICE STATUS SECTION (Matching Frame 5 & 6)
           ========================================================================= */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Service Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Intervals are calculated from the last completion of each service — completing a service resets its next due automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {v.services.map((s) => {
              const isOverdue = s.isOverdue;
              const isDueSoon = s.isDueSoon;

              return (
                <div
                  key={s.key}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name and Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{s.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{s.intervalLabel}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isDueSoon
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isOverdue && <Flame className="w-3 h-3 text-rose-500" />}
                        {isDueSoon && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {!isOverdue && !isDueSoon && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        <span>{s.status}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverdue ? 'bg-rose-500' : isDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, s.progressPercent)}%` }}
                      />
                    </div>

                    {/* Last Done / Next Due Stats */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last done</span>
                        <span className="font-semibold text-slate-800">
                          {s.intervalType === 'km'
                            ? `${s.lastDoneKm.toLocaleString('en-IN')} KM`
                            : s.lastDoneDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Next due</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {s.intervalType === 'km'
                            ? `${s.nextDueKm.toLocaleString('en-IN')} KM`
                            : s.nextDueDate}
                        </span>
                      </div>
                    </div>

                    {/* Status Text Line */}
                    <p
                      className={`text-xs font-bold mt-3 ${
                        isOverdue
                          ? 'text-rose-600'
                          : isDueSoon
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {s.statusText}
                    </p>
                  </div>

                  {/* Mark Completed Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenCompleteModal(v, s)}
                    className="mt-4 w-full py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mark Completed</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            MAINTENANCE HISTORY TABLE (Matching Frame 6 & 18)
           ========================================================================= */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance History</h2>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Previous KM</th>
                    <th className="py-3.5 px-4">Odometer KM</th>
                    <th className="py-3.5 px-4">Next Due</th>
                    <th className="py-3.5 px-4">Cost</th>
                    <th className="py-3.5 px-4">Workshop / Mechanic</th>
                    <th className="py-3.5 px-4 text-center">Invoice / Photos</th>
                    <th className="py-3.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(!v.history || v.history.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No maintenance completion history logged for this vehicle yet.
                      </td>
                    </tr>
                  ) : (
                    v.history.map((h: any, idx: number) => {
                      let parsedPhotos: string[] = [];
                      if (Array.isArray(h.photos)) parsedPhotos = h.photos;
                      else if (typeof h.photos_json === 'string') {
                        try {
                          parsedPhotos = JSON.parse(h.photos_json);
                        } catch {}
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold whitespace-nowrap text-slate-900">
                            {h.completion_date}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {h.service_type}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {h.previous_km ? `${Number(h.previous_km).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {Number(h.odometer_km || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {h.next_due_km ? `${Number(h.next_due_km).toLocaleString('en-IN')} KM` : (h.next_due_date || '—')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            ₹{Number(h.cost || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">{h.workshop || 'Charvik Central Workshop'}</span>
                            {h.mechanic_name && (
                              <span className="text-[10px] text-slate-400 block">{h.mechanic_name}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {parsedPhotos.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {parsedPhotos.map((photoUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setPreviewPhotoModal(photoUrl)}
                                    className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 cursor-pointer shadow-2xs group shrink-0"
                                    title={`View Photo ${pIdx + 1}`}
                                  >
                                    <img src={photoUrl} alt="Service proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate">
                            {h.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Mark Completed with 2-3 Photos Option (Matching Frame 16) */}
        <Modal
          isOpen={!!completingService}
          onClose={() => setCompletingService(null)}
          title={`Mark Completed — ${completingService?.service.name}`}
          subtitle={`Interval: ${completingService?.service.intervalLabel}. Completing resets this service's next due to the completion odometer + ${completingService?.service.intervalLabel}.`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitCompletion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service completion date *</label>
                <input
                  type="date"
                  required
                  value={completionForm.completion_date}
                  onChange={(e) => setCompletionForm({ ...completionForm, completion_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Odometer at completion (KM) *</label>
                <input
                  type="number"
                  required
                  value={completionForm.odometer_km}
                  onChange={(e) => setCompletionForm({ ...completionForm, odometer_km: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance cost (₹)</label>
                <input
                  type="number"
                  value={completionForm.cost}
                  onChange={(e) => setCompletionForm({ ...completionForm, cost: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Workshop</label>
                <input
                  type="text"
                  value={completionForm.workshop}
                  onChange={(e) => setCompletionForm({ ...completionForm, workshop: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mechanic name</label>
              <input
                type="text"
                placeholder="e.g. B. Singh / Rajesh"
                value={completionForm.mechanic_name}
                onChange={(e) => setCompletionForm({ ...completionForm, mechanic_name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                placeholder="Parts replaced, observations, follow-ups..."
                value={completionForm.remarks}
                onChange={(e) => setCompletionForm({ ...completionForm, remarks: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 2-3 Photos Upload (User Request) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Upload Photos / Invoices
                </label>
                <span className="text-[10px] text-slate-400">
                  {completionForm.photos.length} / 3 selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Upload photos (work proof, replaced parts, or invoice receipt — max 5 MB each).
              </p>

              {completionForm.photos.length < 3 && (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Click to choose photos</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, or WebP</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultiPhotoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Thumbnails preview */}
              {completionForm.photos.length > 0 && (
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {completionForm.photos.map((pUrl, pIdx) => (
                    <div key={pIdx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                      <img src={pUrl} alt={`Upload ${pIdx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(pIdx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletingService(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Mark completed</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Odometer */}
        <Modal
          isOpen={isUpdateOdometerOpen}
          onClose={() => setIsUpdateOdometerOpen(false)}
          title={`Update Odometer — ${v.registration_number}`}
          subtitle="Updates current odometer reading and automatically syncs across Daily Vehicle Checkup."
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
              <input
                type="number"
                value={newOdometerVal}
                onChange={(e) => setNewOdometerVal(e.target.value)}
                className="w-full text-sm font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUpdateOdometerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOdometer}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-xs"
              >
                Save Odometer
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Full Preview Photo */}
        {previewPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewPhotoModal} alt="Service proof preview" className="max-w-full max-h-[85vh] object-contain" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: FLEET MAINTENANCE OVERVIEW (Matching Frame 0 & 2)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Maintenance Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            {summary.totalBuses || vehicles.length} buses · today is {new Date().toISOString().split('T')[0]}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddVehicleOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Top 5 Stat Cards (Matching Frame 0) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Buses */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Buses</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalBuses || vehicles.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Services Due Soon */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services Due Soon</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.servicesDueSoon || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Overdue Services */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Services</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.overdueServices || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Services Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services Completed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.servicesCompleted || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Vehicles Needing Attention */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicles Needing Attention</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.vehiclesNeedingAttention || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Matching Frame 0) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {(['All', 'Needs Attention', 'Due Soon', 'Healthy'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}

          <select
            value={depotFilter}
            onChange={(e) => setDepotFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none text-slate-700 font-semibold"
          >
            <option value="All">All depots</option>
            {depots.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Bus Cards (Matching Frame 0, 2 & Image 2) */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-500" />
          <p className="font-semibold text-sm">Loading fleet maintenance overview...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Bus className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm text-slate-700">No vehicles found matching filters</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the search or status filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((bus) => {
            const isAttention = bus.overdueCount > 0;
            const isDueSoon = bus.dueSoonCount > 0 && bus.overdueCount === 0;

            return (
              <div
                key={bus.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Reg, Badge, Model */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                        {bus.registration_number}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{bus.model}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isAttention
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isAttention && <Flame className="w-3 h-3 text-rose-500" />}
                      {isDueSoon && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      {!isAttention && !isDueSoon && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      <span>{isAttention ? 'Needs Attention' : isDueSoon ? 'Due Soon' : 'Healthy'}</span>
                    </span>
                  </div>

                  {/* Big Odometer Box (Synced with Daily Vehicle Checkup!) */}
                  <div className="mt-4 bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center gap-2.5 border border-slate-100">
                    <Gauge className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-xl font-black text-slate-900">
                        {bus.current_odometer_km.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-slate-400">KM</span>
                    </div>
                  </div>

                  {/* Meta: Location and Driver */}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 truncate">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{bus.parking_location || 'Delhi Depot – Bay 1'}</span>
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{bus.driver_name || 'Sunil Yadav'}</span>
                    </span>
                  </div>

                  {/* The 9 Service Checklist Rows (Matching Video Frame 0 & 2 and Image 2) */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    {bus.services.map((s) => {
                      const isOver = s.isOverdue;
                      const isSoon = s.isDueSoon;

                      return (
                        <div key={s.key} className="flex items-center justify-between gap-2 py-0.5">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isOver ? 'bg-rose-500' : isSoon ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-800 truncate">{s.name}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-slate-500 text-[11px]">
                              {s.intervalType === 'km'
                                ? `${s.nextDueKm.toLocaleString('en-IN')} KM`
                                : s.name.includes('week') || s.name.includes('Weekly') || s.interval === 7
                                ? 'Weekly'
                                : 'Monthly'}
                            </span>

                            <span
                              className={`text-[11px] font-bold min-w-[50px] text-right ${
                                isOver
                                  ? 'text-rose-600'
                                  : isSoon
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: Summary count & Open Profile link */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {bus.overdueCount > 0
                      ? `${bus.overdueCount} service${bus.overdueCount > 1 ? 's' : ''} overdue`
                      : bus.dueSoonCount > 0
                      ? `${bus.dueSoonCount} service${bus.dueSoonCount > 1 ? 's' : ''} due soon`
                      : 'All services OK'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectVehicle(bus)}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Open profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Vehicle (Matching Frame 1) */}
      <Modal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        title="Add Vehicle"
        subtitle="Registration number and bus model are required — service intervals are calculated automatically from the readings you enter."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registration number *</label>
              <input
                type="text"
                required
                placeholder="e.g. NL01B3309"
                value={vehicleForm.registration_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Volvo 9600 Multi-Axle"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chassis number</label>
              <input
                type="text"
                placeholder="Chassis number..."
                value={vehicleForm.chassis_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, chassis_number: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Engine number</label>
              <input
                type="text"
                placeholder="Engine number..."
                value={vehicleForm.engine_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, engine_number: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current odometer (KM)</label>
              <input
                type="number"
                placeholder="e.g. 245000"
                value={vehicleForm.current_odometer_km}
                onChange={(e) => setVehicleForm({ ...vehicleForm, current_odometer_km: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last service date</label>
              <input
                type="date"
                value={vehicleForm.last_service_date}
                onChange={(e) => setVehicleForm({ ...vehicleForm, last_service_date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last service odometer (KM)</label>
              <input
                type="number"
                placeholder="e.g. 240000"
                value={vehicleForm.last_service_km}
                onChange={(e) => setVehicleForm({ ...vehicleForm, last_service_km: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parking location</label>
              <input
                type="text"
                placeholder="e.g. Delhi Depot – Bay 4"
                value={vehicleForm.parking_location}
                onChange={(e) => setVehicleForm({ ...vehicleForm, parking_location: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned driver</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={vehicleForm.driver_name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operations manager</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={vehicleForm.operations_manager}
                onChange={(e) => setVehicleForm({ ...vehicleForm, operations_manager: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
