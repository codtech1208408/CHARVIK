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
  ExternalLink,
  Shield,
  ChevronDown,
  ChevronUp,
  List,
  LayoutGrid,
  Fuel
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
  registration_date?: string;
  tax_valid_upto?: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  permit_expiry?: string;
  puc_expiry?: string;
  aitp_valid_upto?: string;
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
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isUpdateOdometerOpen, setIsUpdateOdometerOpen] = useState(false);
  const [newOdometerVal, setNewOdometerVal] = useState<number | string>('');

  const [completingService, setCompletingService] = useState<{
    vehicle: Vehicle;
    service: ServiceItem;
  } | null>(null);

  const [completionForm, setCompletionForm] = useState({
    last_service_date: '',
    last_service_km: '' as string | number,
    completion_date: new Date().toISOString().split('T')[0],
    odometer_km: 0,
    cost: 0,
    workshop: 'Charvik Central Workshop',
    mechanic_name: '',
    remarks: '',
    photos: [] as string[]
  });

  const [docForm, setDocForm] = useState({
    registration_date: '',
    fitness_expiry: '',
    tax_valid_upto: '',
    insurance_expiry: '',
    puc_expiry: '',
    permit_expiry: '',
    aitp_valid_upto: ''
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
  const [expandedServiceKey, setExpandedServiceKey] = useState<string | null>(null);
  const [serviceViewMode, setServiceViewMode] = useState<'list' | 'grid'>('list');

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
    const handleBusKmUpdated = () => {
      loadFleetData();
    };
    window.addEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    return () => {
      window.removeEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    };
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
    const isKm = service.intervalType === 'km';
    const isDocService = service.key === 'vehicle_documents' || service.name === 'Vehicle Documents';

    if (isDocService) {
      setDocForm({
        registration_date: vehicle.registration_date || '',
        fitness_expiry: vehicle.fitness_expiry || '',
        tax_valid_upto: vehicle.tax_valid_upto || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        puc_expiry: vehicle.puc_expiry || '',
        permit_expiry: vehicle.permit_expiry || '',
        aitp_valid_upto: vehicle.aitp_valid_upto || ''
      });
    }

    // 1. Last Done Values
    const prevDate = service.lastDoneDate && service.lastDoneDate !== '—' && service.lastDoneDate !== '-'
      ? service.lastDoneDate
      : (vehicle.last_service_date || new Date().toISOString().split('T')[0]);
    const prevKm = service.lastDoneKm > 0
      ? service.lastDoneKm
      : (vehicle.last_service_km || 0);

    // 2. Automatically calculate completion values
    // For KM services: Last Done KM + service interval (e.g., 300,000 + 60,000 = 360,000 KM)
    let autoCompletionKm = 0;
    if (isKm) {
      if (service.nextDueKm && service.nextDueKm > 0) {
        autoCompletionKm = service.nextDueKm;
      } else {
        autoCompletionKm = prevKm + (service.interval || 60000);
      }
    } else {
      autoCompletionKm = vehicle.current_odometer_km || prevKm || 0;
    }

    // For Date services: Last Done Date + interval days (e.g. AC Filter: 7 days, Greecing: 10 days, Deep Cleaning: 30 days, AC General: 90 days)
    let autoCompletionDate = new Date().toISOString().split('T')[0];
    if (!isKm) {
      if (service.nextDueDate && service.nextDueDate !== '—' && service.nextDueDate !== '-') {
        autoCompletionDate = service.nextDueDate;
      } else {
        const d = new Date(prevDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + (service.interval || 7));
          autoCompletionDate = d.toISOString().split('T')[0];
        }
      }
    }

    setCompletionForm({
      last_service_date: prevDate,
      last_service_km: prevKm > 0 ? prevKm : '',
      completion_date: autoCompletionDate,
      odometer_km: autoCompletionKm,
      cost: isDocService ? 1200 : (isKm ? 4500 : 750),
      workshop: isDocService ? 'RTO & Statutory Authority' : 'Charvik Central Workshop',
      mechanic_name: isDocService ? 'Fleet Compliance Officer' : '',
      remarks: isDocService ? 'All document validities verified and updated.' : '',
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

    const isDocService = completingService.service.key === 'vehicle_documents' || completingService.service.name === 'Vehicle Documents';

    try {
      if (isDocService) {
        // Direct save of the 7 document dates to the bus
        await api.updateBus(completingService.vehicle.id, docForm).catch(() => {});
      }

      await api.completeFleetMaintenance({
        bus_id: completingService.vehicle.id,
        service_type: completingService.service.name,
        last_service_date: completionForm.last_service_date || null,
        last_service_km: Number(completionForm.last_service_km) || 0,
        completion_date: completionForm.completion_date,
        odometer_km: completionForm.odometer_km,
        cost: completionForm.cost,
        workshop: completionForm.workshop,
        mechanic_name: completionForm.mechanic_name,
        remarks: completionForm.remarks,
        photos: completionForm.photos,
        ...(isDocService ? docForm : {})
      });

      success(isDocService ? 'Vehicle Documents marked as completed and validity dates updated!' : `Marked "${completingService.service.name}" as completed!`);

      // If completed at an odometer reading, sync bus odometer across fleet
      const compOdo = Number(completionForm.odometer_km) || 0;
      if (compOdo > 0 && compOdo > (completingService.vehicle.current_odometer_km || 0)) {
        await api.updateBus(completingService.vehicle.id, {
          current_odometer_km: compOdo,
          starting_km: compOdo,
          odometer_km: compOdo
        }).catch(() => {});

        try {
          window.dispatchEvent(new CustomEvent('charvik_bus_km_updated', {
            detail: { bus_id: completingService.vehicle.id, vehicle_number: completingService.vehicle.registration_number, km: compOdo }
          }));
        } catch (_) {}
      }

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

  // Quick Odometer Update (syncs to Daily Vehicle Checkup, New Tyres & Tyre Records as well)
  const handleSaveOdometer = async () => {
    if (!selectedVehicle) return;
    const kmNum = Number(newOdometerVal);
    if (!kmNum || kmNum <= 0) {
      error('Please enter a valid odometer KM');
      return;
    }

    try {
      // 1. Update vehicle odometer across fleet
      await api.updateBus(selectedVehicle.id, {
        current_odometer_km: kmNum,
        starting_km: kmNum,
        odometer_km: kmNum
      });

      // 2. Also log a daily checkup entry to keep KM unified
      await api.createBusCondition({
        bus_id: selectedVehicle.id,
        inspection_date: new Date().toISOString().split('T')[0],
        starting_km: kmNum,
        odometer_km: kmNum,
        closing_km: 0,
        inspector_name: 'Odometer Sync',
        vehicle_model: selectedVehicle.model || '',
        roadworthiness_status: 'Fit for Service',
        driver_name: selectedVehicle.driver_name || 'Fleet Driver',
        checklist_data: '[]'
      }).catch(() => { });

      // 3. Direct automatic sync to all tyres allotted to this vehicle in New Tyres inventory
      try {
        const allNewTyres = await api.getNewTyres().catch(() => []);
        if (Array.isArray(allNewTyres)) {
          const vehicleTyresList = allNewTyres.filter((nt: any) =>
            String(nt.allocated_bus_id) === String(selectedVehicle.id) ||
            (selectedVehicle.registration_number && (nt.allocated_bus_number === selectedVehicle.registration_number || nt.vehicle_number === selectedVehicle.registration_number))
          );
          for (const vt of vehicleTyresList) {
            if (vt.id) {
              const bKm = Number(vt.starting_km ?? vt.km) || 0;
              await api.updateNewTyre(vt.id, {
                ...vt,
                present_km: kmNum,
                total_km: bKm + kmNum,
                running_km: kmNum >= bKm ? kmNum - bKm : kmNum
              }).catch(() => { });
            }
          }
        }
      } catch (_) { }

      // 4. Direct automatic sync to tyre records (mounted tyres)
      try {
        const tyreRecs = await api.getTyreRecords({ bus_id: selectedVehicle.id }).catch(() => []);
        if (Array.isArray(tyreRecs)) {
          for (const tr of tyreRecs) {
            if (tr.id) {
              await api.updateTyreRecord(tr.id, {
                ...tr,
                last_km: kmNum,
                current_km: kmNum
              }).catch(() => { });
            }
          }
        }
      } catch (_) { }

      // 5. Dispatch global event so all open tabs update live
      try {
        window.dispatchEvent(new CustomEvent('charvik_bus_km_updated', {
          detail: { bus_id: selectedVehicle.id, vehicle_number: selectedVehicle.registration_number, km: kmNum }
        }));
      } catch (_) { }

      success(`Odometer updated to ${kmNum.toLocaleString('en-IN')} KM!`);
      setIsUpdateOdometerOpen(false);
      setSelectedVehicle((prev: any) => prev ? { ...prev, current_odometer_km: kmNum } : prev);
      await loadFleetData();
      if (selectedVehicle) {
        const refreshed = await api.getFleetMaintenance().catch(() => null);
        if (refreshed?.buses) {
          const updated = refreshed.buses.find((b: Vehicle) => b.id === selectedVehicle.id);
          if (updated) setSelectedVehicle(updated);
        }
      }
    } catch (err: any) {
      error(err?.message || 'Failed to update odometer');
    }
  };

  // Open Add Vehicle Modal
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
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
    setIsAddVehicleOpen(true);
  };

  // Open Edit Vehicle Modal
  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleForm({
      registration_number: veh.registration_number || veh.bus_number || '',
      model: veh.model || '',
      chassis_number: veh.chassis_number || '',
      engine_number: veh.engine_number || '',
      current_odometer_km: veh.current_odometer_km != null ? String(veh.current_odometer_km) : '',
      last_service_date: veh.last_service_date || '',
      last_service_km: veh.last_service_km != null ? String(veh.last_service_km) : '',
      parking_location: veh.parking_location || 'Delhi Depot – Bay 1',
      driver_name: veh.driver_name || '',
      operations_manager: veh.operations_manager || 'Priya Sharma'
    });
    setIsAddVehicleOpen(true);
  };

  // Close Vehicle Modal
  const handleCloseVehicleModal = () => {
    setIsAddVehicleOpen(false);
    setEditingVehicle(null);
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
  };

  // Add / Edit Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = Boolean(
      user?.role?.toLowerCase()?.includes('admin') ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
    );

    if (!vehicleForm.registration_number?.trim()) {
      if (!isUserAdmin) {
        error('Registration number is required');
        return;
      }
      vehicleForm.registration_number = `BUS-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      const payload: any = {
        registration_number: vehicleForm.registration_number.trim(),
        bus_number: vehicleForm.registration_number.trim(),
        model: vehicleForm.model || 'Volvo 9600 Multi-Axle',
        make: vehicleForm.model?.split(' ')[0] || 'Fleet',
        chassis_number: vehicleForm.chassis_number,
        engine_number: vehicleForm.engine_number,
        current_odometer_km: Number(vehicleForm.current_odometer_km) || 0,
        parking_location: vehicleForm.parking_location || 'Delhi Depot – Bay 1',
        operations_manager: vehicleForm.operations_manager || 'Priya Sharma',
        driver_name: vehicleForm.driver_name || '',
        last_service_date: vehicleForm.last_service_date || null,
        last_service_km: Number(vehicleForm.last_service_km) || 0
      };

      if (editingVehicle) {
        if (editingVehicle.id) {
          await api.updateBus(editingVehicle.id, payload).catch(() => {});
        }
        await api.createFleetVehicle(payload).catch(() => {});

        try {
          const cached = localStorage.getItem('charvik_fleet_maintenance_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.buses)) {
              parsed.buses = parsed.buses.map((b: any) => {
                if (
                  b.id === editingVehicle.id ||
                  b.registration_number === editingVehicle.registration_number ||
                  b.bus_number === editingVehicle.bus_number
                ) {
                  return {
                    ...b,
                    ...payload,
                    registration_number: payload.registration_number,
                    bus_number: payload.bus_number
                  };
                }
                return b;
              });
              localStorage.setItem('charvik_fleet_maintenance_cache', JSON.stringify(parsed));
            }
          }
        } catch {}

        success(`Vehicle ${payload.registration_number} updated successfully!`);
      } else {
        await api.createFleetVehicle(payload);
        success('New vehicle added to fleet maintenance!');
      }

      handleCloseVehicleModal();
      await loadFleetData();

      if (editingVehicle) {
        const refreshed = await api.getFleetMaintenance();
        const updated = (refreshed.buses || []).find(
          (b: Vehicle) =>
            b.id === editingVehicle.id ||
            b.registration_number === payload.registration_number ||
            b.bus_number === payload.registration_number
        );
        if (updated) {
          setSelectedVehicle(updated);
          setSearchParams({ vehicle: updated.registration_number });
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save vehicle');
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (veh: Vehicle) => {
    const reg = veh.registration_number || veh.bus_number || 'this vehicle';
    if (!window.confirm(`Are you sure you want to delete vehicle ${reg}? This action cannot be undone.`)) {
      return;
    }

    try {
      const targetId = veh.id || reg;
      await api.deleteFleetVehicle(targetId).catch(() => {});
      if (veh.id) {
        await api.archiveBus(veh.id).catch(() => {});
      }

      try {
        const cached = localStorage.getItem('charvik_fleet_maintenance_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.buses)) {
            parsed.buses = parsed.buses.filter(
              (b: any) =>
                b.id !== veh.id &&
                b.registration_number !== veh.registration_number &&
                b.bus_number !== veh.bus_number
            );
            parsed.summary = {
              ...parsed.summary,
              totalBuses: parsed.buses.length
            };
            localStorage.setItem('charvik_fleet_maintenance_cache', JSON.stringify(parsed));
          }
        }
      } catch {}

      try {
        const bRaw = localStorage.getItem('charvik_buses_data');
        if (bRaw) {
          const bList = JSON.parse(bRaw);
          const filtered = bList.filter(
            (b: any) =>
              b.id !== veh.id &&
              b.bus_number !== veh.bus_number &&
              b.registration_number !== veh.registration_number
          );
          localStorage.setItem('charvik_buses_data', JSON.stringify(filtered));
        }
      } catch {}

      const remaining = vehicles.filter(
        (b) => b.id !== veh.id && b.registration_number !== veh.registration_number
      );
      setVehicles(remaining);
      setSummary((prev: any) => ({
        ...prev,
        totalBuses: Math.max(0, (prev.totalBuses || remaining.length + 1) - 1)
      }));

      success(`Vehicle ${reg} deleted successfully!`);

      if (
        selectedVehicle &&
        (selectedVehicle.id === veh.id ||
          selectedVehicle.registration_number === veh.registration_number ||
          selectedVehicle.bus_number === veh.bus_number)
      ) {
        handleSelectVehicle(null);
      } else {
        await loadFleetData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete vehicle');
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

  const renderAddEditVehicleModal = () => (
    <Modal
      isOpen={isAddVehicleOpen}
      onClose={handleCloseVehicleModal}
      title={editingVehicle ? `Edit Vehicle — ${editingVehicle.registration_number}` : 'Add Vehicle'}
      subtitle={
        editingVehicle
          ? 'Update vehicle specifications, assignments, parking location, and service readings.'
          : 'Registration number and bus model are required — service intervals are calculated automatically from the readings you enter.'
      }
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
            onClick={handleCloseVehicleModal}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
          >
            {editingVehicle ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            <span>{editingVehicle ? 'Save Changes' : 'Add Vehicle'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );

  // =========================================================================
  // VIEW: VEHICLE PROFILE (Matching Frame 7, 5, 6, 18)
  // =========================================================================
  if (selectedVehicle) {
    const v = selectedVehicle;
    return (
      <div className="space-y-6 w-full max-w-full pb-16">
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
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

              {/* Edit & Delete Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditVehicle(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#142B4A] text-xs font-bold transition-all shadow-xs cursor-pointer hover:border-slate-300"
                  title="Edit vehicle details"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-xs cursor-pointer hover:border-rose-300"
                  title="Delete vehicle"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 -mt-2">{v.model}</p>

            {/* Spec Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chassis Number</p>
                <p className="text-sm font-mono font-bold text-slate-800 mt-1 truncate">{v.chassis_number || 'YS2S4X2000551024'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Number</p>
                <p className="text-sm font-mono font-bold text-slate-800 mt-1 truncate">{v.engine_number || 'DC091209451'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operations Manager</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{v.operations_manager || 'Operations Manager'}</p>
              </div>
            </div>
          </div>

          {/* Right Current Odometer Box (Aligned with Charvik Brand Colors #142B4A) */}
          <div className="bg-[#142B4A] rounded-3xl p-6 text-white min-w-[280px] shadow-xl shadow-[#142B4A]/25 border border-white/10 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Current Odometer</p>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight mt-1 flex items-baseline gap-1.5">
                <span>{v.current_odometer_km.toLocaleString('en-IN')}</span>
                <span className="text-sm font-bold text-blue-300">KM</span>
              </div>
              <p className="text-[10px] text-blue-200/80 mt-0.5">
                Synced from Daily Vehicle Checkup
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewOdometerVal(v.current_odometer_km);
                setIsUpdateOdometerOpen(true);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#142B4A] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
            >
              <Gauge className="w-4 h-4 text-[#142B4A]" />
              <span>Update Odometer</span>
            </button>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
              <div>
                <p className="text-xs font-black text-white font-mono">
                  {v.services[0]?.nextDueKm ? `${(v.services[0].nextDueKm / 1000).toFixed(0)}k` : '300k'}
                </p>
                <p className="text-[9px] font-bold text-blue-200 uppercase">Next due</p>
              </div>
              <div>
                <p className="text-xs font-black text-amber-400 font-mono">{v.dueSoonCount}</p>
                <p className="text-[9px] font-bold text-blue-200 uppercase">Due soon</p>
              </div>
              <div>
                <p className="text-xs font-black text-rose-400 font-mono">{v.overdueCount}</p>
                <p className="text-[9px] font-bold text-blue-200 uppercase">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SERVICE STATUS SECTION (Matching Frame 5 & 6)
           ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Service Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Intervals are calculated from the last completion of each service — completing a service resets its next due automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {serviceViewMode === 'list' && (
                <button
                  type="button"
                  onClick={() => setExpandedServiceKey(expandedServiceKey ? null : v.services[0]?.key || null)}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {expandedServiceKey ? 'Close Active Box' : 'Open First'}
                </button>
              )}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setServiceViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceViewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vertical list view"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceViewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid box view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid Boxes</span>
                </button>
              </div>
            </div>
          </div>

          {serviceViewMode === 'list' ? (
            /* Vertical List: Names show one by one vertically; click individually to show box */
            <div className="space-y-2.5">
              {v.services.map((s, idx) => {
                const isOverdue = s.isOverdue;
                const isDueSoon = s.isDueSoon;
                const isExpanded = expandedServiceKey === s.key;

                return (
                  <div
                    key={s.key}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-blue-400 shadow-sm ring-1 ring-blue-100'
                        : isOverdue
                        ? 'border-rose-200/90 hover:border-rose-300 shadow-2xs'
                        : isDueSoon
                        ? 'border-amber-200/90 hover:border-amber-300 shadow-2xs'
                        : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Clickable Header Row: Name displayed vertically one by one */}
                    <button
                      type="button"
                      onClick={() => setExpandedServiceKey(isExpanded ? null : s.key)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : isDueSoon
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {s.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium truncate">
                            {s.intervalLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-3">
                        <span className="hidden md:inline-block text-xs font-semibold text-slate-500">
                          {s.intervalType === 'km'
                            ? `Next: ${s.nextDueKm.toLocaleString('en-IN')} KM`
                            : `Next: ${s.nextDueDate}`}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isDueSoon
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOverdue && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                          {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {!isOverdue && !isDueSoon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>{s.status}</span>
                        </span>

                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
                          }`}
                        />
                      </div>
                    </button>

                    {/* When clicked individually: SHOW THE EXACT BOX ("like this boxes") */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
                          <div>
                            {/* Header: Name and Status Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{s.name}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.intervalLabel}</p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                                  isOverdue
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : isDueSoon
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {isOverdue && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                                {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                {!isOverdue && !isDueSoon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                <span>{s.status}</span>
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOverdue ? 'bg-rose-500' : isDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(5, s.progressPercent)}%` }}
                              />
                            </div>

                            {/* Last Done / Next Due Stats */}
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
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
                              className={`text-sm font-bold mt-3.5 ${
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
                            className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                            <span>Mark Completed</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grid View: 4-column cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug">{s.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{s.intervalLabel}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isDueSoon
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOverdue && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                          {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {!isOverdue && !isDueSoon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>{s.status}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverdue ? 'bg-rose-500' : isDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, s.progressPercent)}%` }}
                        />
                      </div>

                      {/* Last Done / Next Due Stats */}
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
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
                        className={`text-sm font-bold mt-3.5 ${
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
                      className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                      <span>Mark Completed</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            MAINTENANCE HISTORY TABLE (Matching Frame 6 & 18)
           ========================================================================= */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance History</h2>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Last Servicing KM</th>
                    <th className="py-2.5 px-3">Odometer KM</th>
                    <th className="py-2.5 px-3">Next Due</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3">Workshop / Mechanic</th>
                    <th className="py-2.5 px-3 text-center">Invoice / Photos</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(!v.history || v.history.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
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
                          <td className="py-2 px-3 font-semibold whitespace-nowrap text-slate-900">
                            {h.completion_date}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {h.service_type}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">
                            {h.last_service_km || h.previous_km ? `${Number(h.last_service_km || h.previous_km).toLocaleString('en-IN')} KM` : '—'}
                            {h.last_service_date && (
                              <span className="block text-[11px] text-slate-400 font-sans">{h.last_service_date}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {Number(h.odometer_km || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {h.next_due_km ? `${Number(h.next_due_km).toLocaleString('en-IN')} KM` : (h.next_due_date || '—')}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 font-mono">
                            ₹{Number(h.cost || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800 block">{h.workshop || 'Charvik Central Workshop'}</span>
                            {h.mechanic_name && (
                              <span className="text-xs text-slate-400 block mt-0.5">{h.mechanic_name}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {parsedPhotos.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {parsedPhotos.map((photoUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setPreviewPhotoModal(photoUrl)}
                                    className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 cursor-pointer shadow-2xs group shrink-0"
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
                          <td className="py-2 px-3 text-slate-600 text-sm max-w-xs truncate">
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
          subtitle={
            completingService?.service.key === 'vehicle_documents' || completingService?.service.name === 'Vehicle Documents'
              ? 'Review and update vehicle registration and compliance certificate validity dates.'
              : `Interval: ${completingService?.service.intervalLabel}. Completing resets this service's next due to the completion odometer + ${completingService?.service.intervalLabel}.`
          }
          maxWidth={completingService?.service.key === 'vehicle_documents' || completingService?.service.name === 'Vehicle Documents' ? 'max-w-2xl' : 'max-w-xl'}
        >
          <form onSubmit={handleSubmitCompletion} className="space-y-4">
            {completingService?.service.key === 'vehicle_documents' || completingService?.service.name === 'Vehicle Documents' ? (
              <div className="space-y-4">
                {/* DOCUMENT & COMPLIANCE VALIDITY Card (Matching user screenshot) */}
                <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      DOCUMENT & COMPLIANCE VALIDITY
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Registration Date</label>
                        <input
                          type="date"
                          value={docForm.registration_date}
                          onChange={(e) => setDocForm({ ...docForm, registration_date: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tax Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.tax_valid_upto}
                          onChange={(e) => setDocForm({ ...docForm, tax_valid_upto: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">PUCC Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.puc_expiry}
                          onChange={(e) => setDocForm({ ...docForm, puc_expiry: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">AITP Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.aitp_valid_upto}
                          onChange={(e) => setDocForm({ ...docForm, aitp_valid_upto: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Fitness Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.fitness_expiry}
                          onChange={(e) => setDocForm({ ...docForm, fitness_expiry: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Insurance Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.insurance_expiry}
                          onChange={(e) => setDocForm({ ...docForm, insurance_expiry: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Permit Valid Upto</label>
                        <input
                          type="date"
                          value={docForm.permit_expiry}
                          onChange={(e) => setDocForm({ ...docForm, permit_expiry: e.target.value })}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Verification / Renewal Date *</label>
                    <input
                      type="date"
                      required
                      value={completionForm.completion_date}
                      onChange={(e) => setCompletionForm({ ...completionForm, completion_date: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Renewal / Compliance Cost (₹)</label>
                    <input
                      type="number"
                      value={completionForm.cost}
                      onChange={(e) => setCompletionForm({ ...completionForm, cost: Number(e.target.value) })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Compliance Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Document renewal details, payment ref, RTO authority..."
                    value={completionForm.remarks}
                    onChange={(e) => setCompletionForm({ ...completionForm, remarks: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last service date</label>
                <input
                  type="date"
                  value={completionForm.last_service_date}
                  onChange={(e) => {
                    const val = e.target.value;
                    let autoDate = completionForm.completion_date;
                    if (completingService?.service.intervalType === 'date' && val) {
                      const d = new Date(val);
                      if (!isNaN(d.getTime())) {
                        d.setDate(d.getDate() + (completingService.service.interval || 7));
                        autoDate = d.toISOString().split('T')[0];
                      }
                    }
                    setCompletionForm((prev) => ({
                      ...prev,
                      last_service_date: val,
                      completion_date: autoDate
                    }));
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last servicing KM</label>
                <input
                  type="number"
                  placeholder="e.g. 300000"
                  value={completionForm.last_service_km}
                  onChange={(e) => {
                    const val = e.target.value;
                    const kmNum = Number(val) || 0;
                    const isKm = completingService?.service.intervalType === 'km';
                    const autoOdometer = isKm && kmNum > 0
                      ? kmNum + (completingService?.service.interval || 60000)
                      : completionForm.odometer_km;
                    setCompletionForm((prev) => ({
                      ...prev,
                      last_service_km: val,
                      odometer_km: autoOdometer > 0 ? autoOdometer : prev.odometer_km
                    }));
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service completion date *</label>
                <input
                  type="date"
                  required
                  value={completionForm.completion_date}
                  onChange={(e) => setCompletionForm({ ...completionForm, completion_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Odometer at completion (KM) *</label>
                <input
                  type="number"
                  required
                  value={completionForm.odometer_km}
                  onChange={(e) => setCompletionForm({ ...completionForm, odometer_km: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-blue-900 bg-blue-50/30"
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
            )}

            {!(completingService?.service.key === 'vehicle_documents' || completingService?.service.name === 'Vehicle Documents') && (
            <>
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
            </>
            )}

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
                className="w-full text-sm font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
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
                className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
              >
                Save Odometer
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Add / Edit Vehicle */}
        {renderAddEditVehicleModal()}

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
    <div className="space-y-6 w-full max-w-full pb-16">
      {/* Header Hero Banner (Matching Image 2) */}
      <div className="bg-gradient-to-r from-[#0356C4] via-[#0D6EFD] to-[#0284C7] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Gauge className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Fleet Maintenance Dashboard</h1>
            <p className="text-xs text-white/90 font-medium mt-1">
              Monitor your fleet, track maintenance and ensure smooth operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start sm:self-auto flex-wrap sm:flex-nowrap">
          {/* Header Bus Image matching Reference Image 2 */}
          <div className="hidden sm:block relative shrink-0">
            <div className="w-48 sm:w-56 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet1.jpg"
                alt="Fleet Maintenance"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#0356C4] hover:bg-blue-50 text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-[#0356C4]" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Top 5 Stat Cards (Solid Vibrant Palette Matching Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* 1. Total Buses (Solid Blue) */}
        <div className="bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] text-white rounded-3xl p-5 shadow-md shadow-sky-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <Bus className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
              ↑ 100%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Total Buses</p>
            <p className="text-3xl font-black text-white mt-1 font-mono">{summary.totalBuses || vehicles.length}</p>
          </div>
        </div>

        {/* 2. Services Due Soon (Solid Emerald Green) */}
        <div className="bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white rounded-3xl p-5 shadow-md shadow-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
              ↑ 25%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Services Due Soon</p>
            <p className="text-3xl font-black text-white mt-1 font-mono">{summary.servicesDueSoon || 0}</p>
          </div>
        </div>

        {/* 3. Overdue Services (Solid Orange / Amber) */}
        <div className="bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] text-white rounded-3xl p-5 shadow-md shadow-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
              ↑ 88%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Overdue Services</p>
            <p className="text-3xl font-black text-white mt-1 font-mono">{summary.overdueServices || 0}</p>
          </div>
        </div>

        {/* 4. Services Completed (Solid Purple) */}
        <div className="bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#7c3aed] text-white rounded-3xl p-5 shadow-md shadow-purple-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
              ↑ 100%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Services Completed</p>
            <p className="text-3xl font-black text-white mt-1 font-mono">{summary.servicesCompleted || 0}</p>
          </div>
        </div>

        {/* 5. Vehicles Needing Attention (Solid Cyan / Teal) */}
        <div className="bg-gradient-to-br from-[#06b6d4] via-[#0891b2] to-[#0e7490] text-white rounded-3xl p-5 shadow-md shadow-cyan-500/20 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <Flame className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
              ↑ 38%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Vehicles Needing Attention</p>
            <p className="text-3xl font-black text-white mt-1 font-mono">{summary.vehiclesNeedingAttention || 0}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {(['All', 'Needs Attention', 'Due Soon', 'Healthy'] as const).map((filter) => {
            const isSelected = statusFilter === filter;
            if (filter === 'All') {
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
              );
            }
            if (filter === 'Needs Attention') {
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-rose-50 text-rose-700 border-2 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Needs Attention</span>
                </button>
              );
            }
            if (filter === 'Due Soon') {
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-blue-50 text-blue-700 border-2 border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Due Soon</span>
                </button>
              );
            }
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Healthy</span>
              </button>
            );
          })}

          <select
            value={depotFilter}
            onChange={(e) => setDepotFilter(e.target.value)}
            className="text-xs px-3.5 py-2 rounded-full border-2 border-slate-200 focus:outline-none text-slate-700 font-bold bg-white cursor-pointer"
          >
            <option value="All">All Depots</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((bus, idx) => {
            const isAttention = bus.overdueCount > 0;
            const isDueSoon = bus.dueSoonCount > 0 && bus.overdueCount === 0;
            const busImgUrl = idx % 5 === 0 ? '/assets/fleet1.jpg' : idx % 5 === 1 ? '/assets/fleet2.jpg' : idx % 5 === 2 ? '/assets/fleet3.jpg' : idx % 5 === 3 ? '/assets/fleet4.jpg' : '/assets/fleet5.jpg';
            const dueServices = (bus.services || []).filter((s) => s.isOverdue || s.isDueSoon);

            return (
              <div
                key={bus.id}
                onClick={() => handleSelectVehicle(bus)}
                className={`bg-white rounded-3xl border-2 ${
                  isAttention
                    ? 'border-rose-300 hover:border-rose-500 shadow-rose-500/10'
                    : isDueSoon
                    ? 'border-amber-300 hover:border-amber-500 shadow-amber-500/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                } p-6 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group`}
              >
                <div>
                  {/* Top Header: Reg, Badge, Model */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {bus.registration_number}
                      </h2>
                      <p className="text-sm text-slate-500 font-semibold mt-0.5">{bus.model}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isAttention
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isAttention && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                      {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {!isAttention && !isDueSoon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{isAttention ? 'Needs Attention' : isDueSoon ? 'Due Soon' : 'Healthy'}</span>
                    </span>
                  </div>

                  {/* Real Bus Photo matching Reference Image 2 */}
                  <div className="w-full h-40 rounded-2xl overflow-hidden my-3.5 relative shadow-xs border border-slate-100">
                    <img
                      src={busImgUrl}
                      alt={bus.registration_number}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-sky-400" />
                      <span>Fuel: {78 - ((idx * 11) % 25)}%</span>
                    </div>
                  </div>

                  {/* Big Odometer Box (Synced with Daily Vehicle Checkup!) */}
                  <div className="mt-4 bg-[#F8FAFC] rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                    <Gauge className="w-6 h-6 text-slate-400 shrink-0" />
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl font-black text-slate-900">
                        {bus.current_odometer_km.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-bold text-slate-400">KM</span>
                    </div>
                  </div>

                  {/* Meta: Location and Driver */}
                  <div className="mt-3.5 flex items-center gap-4 text-xs text-slate-500 truncate">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{bus.parking_location || 'Delhi Depot – Bay 1'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{bus.driver_name || 'Sunil Yadav'}</span>
                    </span>
                  </div>

                  {/* Services Due Section - ONLY shows services that are Overdue or Due Soon (matching Image 1) */}
                  {dueServices.length > 0 ? (
                    <div className="mt-4 border-t border-slate-100 pt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">
                        <span>Services Due</span>
                        <span className="text-[11px] font-semibold text-rose-600">
                          {bus.overdueCount > 0 ? `${bus.overdueCount} Overdue` : ''}
                          {bus.overdueCount > 0 && bus.dueSoonCount > 0 ? ' • ' : ''}
                          {bus.dueSoonCount > 0 ? `${bus.dueSoonCount} Due Soon` : ''}
                        </span>
                      </div>

                      {dueServices.map((s) => {
                        const isOver = s.isOverdue;
                        const dotClass = isOver ? 'bg-rose-500' : 'bg-amber-500';
                        const badgeBg = isOver
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200';
                        const nextDueLabel =
                          s.intervalType === 'km'
                            ? `${Number(s.nextDueKm || 0).toLocaleString('en-IN')} KM`
                            : (s.statusText || s.intervalLabel || (isOver ? 'Overdue' : 'Due Soon'));

                        return (
                          <div
                            key={s.key}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                              <span className="text-slate-900 font-bold truncate text-xs" title={s.name}>
                                {s.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-right">
                              <span className="text-slate-500 text-[11px] font-medium font-mono">
                                {nextDueLabel}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badgeBg}`}>
                                {s.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-slate-100 pt-3.5">
                      <div className="py-3 px-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-center gap-2 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-extrabold text-emerald-800">All 9 Services Healthy &amp; Up to Date</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Summary count & Open Profile link */}
                <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium text-xs">
                    {bus.overdueCount > 0
                      ? `${bus.overdueCount} service${bus.overdueCount > 1 ? 's' : ''} overdue`
                      : bus.dueSoonCount > 0
                      ? `${bus.dueSoonCount} service${bus.dueSoonCount > 1 ? 's' : ''} due soon`
                      : 'All services OK'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditVehicle(bus);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#142B4A] transition-colors cursor-pointer"
                      title="Edit vehicle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(bus);
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50/60 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Delete vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVehicle(bus);
                      }}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors text-sm ml-1"
                    >
                      <span>Open profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Vehicle */}
      {renderAddEditVehicleModal()}
    </div>
  );
};
