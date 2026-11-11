import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  Gauge,
  Tag,
  Building,
  DollarSign,
  Bus,
  RefreshCw,
  Eye,
  FileText,
  Image as ImageIcon,
  Check,
  Receipt,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { BASE_FLEET_BUSES, BASE_FLEET_MAINTENANCE_BUSES } from '../services/seedData';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import type { Bus as BusType } from '../types';

const normalizeVeh = (str?: string) => (str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

interface NewTyre {
  id: number;
  purchase_date: string;
  vehicle_number?: string;
  starting_km?: number | string;
  total_km?: number | string;
  quantity: number;
  tyre_serial_number: string;
  km?: number | string;
  present_km?: number | string;
  running_km?: number | string;
  brand: string;
  size: string;
  model?: string;
  supplier?: string;
  invoice_number?: string;
  purchase_cost?: number | string;
  status?: 'In Stock' | 'Allocated' | 'Scrapped';
  allocated_bus_id?: number;
  allocated_bus_number?: string;
  allocated_wheel_position?: string;
  notes?: string;
  tyre_photo_url?: string;
  invoice_photo_url?: string;
  created_at?: string;
}

export const NewTyres: React.FC = () => {
  const { success, error } = useToast();

  const [buses, setBuses] = useState<BusType[]>([]);
  const [newTyres, setNewTyres] = useState<NewTyre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTyre, setEditingTyre] = useState<NewTyre | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    purchase_date: new Date().toISOString().split('T')[0],
    vehicle_number: '',
    total_km: '',
    quantity: 1,
    tyre_serial_number: '',
    brand: 'MRF',
    size: '295/80 R22.5',
    supplier: '',
    notes: '',
    tyre_photo_url: '',
    invoice_photo_url: ''
  });

  useEffect(() => {
    loadData();

    // 1. Direct event listener for live KM updates from Daily Vehicle Checkup or Odometer update
    const handleBusKmUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.km) {
        const updateKm = Number(detail.km);
        const targetVeh = normalizeVeh(detail.vehicle_number);
        const targetBusId = detail.bus_id ? Number(detail.bus_id) : null;

        // Immediately update buses in state so UI updates with 0 lag
        setBuses((prevBuses) =>
          prevBuses.map((b) => {
            const bReg = normalizeVeh(b.registration_number || b.bus_number);
            if ((targetBusId && Number(b.id) === targetBusId) || (targetVeh && bReg === targetVeh)) {
              return {
                ...b,
                latest_checkup_km: updateKm,
                current_odometer_km: updateKm
              };
            }
            return b;
          })
        );

        // Immediately update new tyres in state
        setNewTyres((prevTyres) =>
          prevTyres.map((t) => {
            const tVeh = normalizeVeh(t.vehicle_number || t.allocated_bus_number);
            if ((targetBusId && Number(t.allocated_bus_id) === targetBusId) || (targetVeh && tVeh === targetVeh)) {
              const sKm = Number(t.starting_km ?? t.km) || 0;
              return {
                ...t,
                present_km: updateKm,
                total_km: sKm + updateKm,
                running_km: updateKm >= sKm ? updateKm - sKm : updateKm
              };
            }
            return t;
          })
        );
      }
      loadData();
    };

    // 2. Storage event listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'charvik_inspections_data' ||
        e.key === 'charvik_cache_buses' ||
        e.key === 'charvik_buses_data' ||
        e.key === 'charvik_new_tyres_data'
      ) {
        loadData();
      }
    };

    window.addEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('charvik_bus_km_updated', handleBusKmUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tyresData, busesData, checkupsData] = await Promise.all([
        api.getNewTyres().catch(() => []),
        api.getBuses().catch(() => []),
        api.getBusConditions().catch(() => [])
      ]);

      // 1. Gather all buses from API, localStorage, and baseline seed data
      const seedBuses = [...BASE_FLEET_BUSES, ...BASE_FLEET_MAINTENANCE_BUSES];
      let storedBuses: any[] = [];
      try {
        const raw = localStorage.getItem('charvik_buses_data') || localStorage.getItem('charvik_cache_buses');
        if (raw) storedBuses = JSON.parse(raw);
      } catch { }

      const busMap = new Map<string, any>();
      [...seedBuses, ...(Array.isArray(storedBuses) ? storedBuses : []), ...(Array.isArray(busesData) ? busesData : [])].forEach((b: any) => {
        if (!b) return;
        const rawReg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
        const normKey = normalizeVeh(rawReg);
        if (normKey) {
          const prev = busMap.get(normKey) || {};
          busMap.set(normKey, {
            ...prev,
            ...b,
            registration_number: rawReg || prev.registration_number,
            bus_number: rawReg || prev.bus_number
          });
        }
      });

      // 2. Aggregate all inspection records from both local storage & backend
      let localInspections: any[] = [];
      try {
        const raw = localStorage.getItem('charvik_inspections_data');
        if (raw) localInspections = JSON.parse(raw);
      } catch { }

      const allInspections = [
        ...(Array.isArray(localInspections) ? localInspections : []),
        ...(Array.isArray(checkupsData) ? checkupsData : [])
      ];

      // Sort inspections so latest is first
      allInspections.sort((a: any, b: any) => {
        const timeA = new Date(a.inspection_date || a.created_at || a.date || 0).getTime();
        const timeB = new Date(b.inspection_date || b.created_at || b.date || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      // 3. For each bus in busMap, compute effective checkup KM
      const allBusesList = Array.from(busMap.values());
      const enrichedBuses = allBusesList.map((b: any) => {
        const bReg = normalizeVeh(b.registration_number || b.bus_number);
        const bId = Number(b.id);

        const latestCheckup = allInspections.find((c: any) => {
          if (!c) return false;
          if (bId && c.bus_id && Number(c.bus_id) === bId) return true;
          const cReg = normalizeVeh(c.registration_number || c.bus_number || c.vehicle_number);
          return Boolean(bReg && cReg && bReg === cReg);
        });

        const checkupKm = Number(latestCheckup?.starting_km || latestCheckup?.odometer_km || latestCheckup?.closing_km || 0);
        const busOdoKm = Number(b.current_odometer_km || b.starting_km || b.odometer_km || 0);
        const effectiveKm = Math.max(checkupKm, busOdoKm);

        return {
          ...b,
          latest_checkup_km: effectiveKm,
          current_odometer_km: effectiveKm
        };
      });

      // Sort buses alphabetically by registration number
      enrichedBuses.sort((a, b) => (a.registration_number || '').localeCompare(b.registration_number || ''));

      // 4. Enrich tyres data with latest vehicle KM
      const enrichedTyres = (tyresData || []).map((t: any) => {
        const tVeh = normalizeVeh(t.vehicle_number || t.allocated_bus_number);
        const tBusId = Number(t.allocated_bus_id);

        const matchedBus = enrichedBuses.find((b: any) => {
          if (tBusId && Number(b.id) === tBusId) return true;
          const bReg = normalizeVeh(b.registration_number || b.bus_number);
          return Boolean(tVeh && bReg && tVeh === bReg);
        });

        const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);
        const sKm = Number(t.starting_km ?? t.km) || 0;
        const rawPresentKm = Number(t.present_km) || 0;
        const effectivePresentKm = busKm > 0 ? busKm : rawPresentKm;
        const effectiveTotalKm = sKm + effectivePresentKm;

        return {
          ...t,
          present_km: effectivePresentKm > 0 ? effectivePresentKm : (t.present_km || 0),
          total_km: effectiveTotalKm > 0 ? effectiveTotalKm : (t.total_km || 0),
          running_km: effectivePresentKm >= sKm ? effectivePresentKm - sKm : effectivePresentKm
        };
      });

      setNewTyres(enrichedTyres);
      setBuses(enrichedBuses);
    } catch (err: any) {
      error(err.message || 'Failed to load new tyre inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vNumber: string) => {
    const cleanReg = (vNumber || '').split('(')[0].trim().toUpperCase();
    const matchedBus = buses.find((b) => {
      const bReg = normalizeVeh(b.registration_number || b.bus_number);
      return bReg === normalizeVeh(cleanReg) || String(b.id) === cleanReg;
    });
    const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);

    setFormData((prev: any) => {
      const sKm = Number(prev.starting_km) || 0;
      const pKm = busKm > 0 ? busKm : (Number(prev.present_km) || 0);
      return {
        ...prev,
        vehicle_number: matchedBus?.registration_number || cleanReg,
        allocated_bus_id: matchedBus ? matchedBus.id : prev.allocated_bus_id,
        allocated_bus_number: matchedBus?.registration_number || cleanReg,
        present_km: pKm > 0 ? pKm : '',
        total_km: (sKm + pKm) > 0 ? (sKm + pKm) : ''
      };
    });
  };

  const handleOpenAdd = () => {
    setEditingTyre(null);
    const firstBus = buses.length > 0 ? buses[0] : null;
    const initialReg = firstBus ? (firstBus.registration_number || firstBus.bus_number || '').split('(')[0].trim() : '';
    const initialKm = firstBus ? Number((firstBus as any)?.latest_checkup_km || firstBus?.current_odometer_km || 0) : 0;

    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      vehicle_number: initialReg,
      allocated_bus_id: firstBus ? firstBus.id : undefined,
      allocated_bus_number: initialReg,
      starting_km: 0,
      present_km: initialKm > 0 ? initialKm : '',
      total_km: initialKm > 0 ? initialKm : '',
      quantity: 1,
      tyre_serial_number: '',
      brand: 'MRF',
      size: '295/80 R22.5',
      supplier: '',
      notes: '',
      tyre_photo_url: '',
      invoice_photo_url: ''
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (t: NewTyre) => {
    setEditingTyre(t);
    const tVeh = normalizeVeh(t.vehicle_number || t.allocated_bus_number);
    const matchedBus = buses.find(b =>
      (t.allocated_bus_id && Number(b.id) === Number(t.allocated_bus_id)) ||
      (tVeh && normalizeVeh(b.registration_number || b.bus_number) === tVeh)
    );
    const cleanVehicle = (matchedBus?.registration_number || t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? `Bus #${t.allocated_bus_id}` : '') || '').split('(')[0].trim();
    const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);
    const sKm = Number(t.starting_km ?? t.km) || 0;
    const pKm = busKm > 0 ? busKm : (Number(t.present_km) || 0);
    const totKm = sKm + pKm;

    setFormData({
      purchase_date: t.purchase_date || new Date().toISOString().split('T')[0],
      vehicle_number: cleanVehicle,
      allocated_bus_id: t.allocated_bus_id || (matchedBus ? matchedBus.id : undefined),
      allocated_bus_number: cleanVehicle,
      starting_km: sKm,
      present_km: pKm > 0 ? pKm : '',
      total_km: totKm > 0 ? totKm : '',
      quantity: t.quantity || 1,
      tyre_serial_number: t.tyre_serial_number || '',
      brand: t.brand || 'MRF',
      size: t.size || '295/80 R22.5',
      supplier: t.supplier || '',
      notes: t.notes || '',
      tyre_photo_url: t.tyre_photo_url || '',
      invoice_photo_url: t.invoice_photo_url || ''
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveTyre = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    let currentUser: any = null;
    try {
      const rawUser = localStorage.getItem('charvik_user');
      if (rawUser) currentUser = JSON.parse(rawUser);
    } catch { }
    const isUserAdmin = Boolean(
      currentUser?.role?.toLowerCase()?.includes('admin') ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
    );

    const tyreNum = (formData.tyre_serial_number || '').trim();
    if (!tyreNum) {
      if (!isUserAdmin) {
        error('Please enter a Tyre Number');
        return;
      }
      formData.tyre_serial_number = `TYRE-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const vehNum = (formData.vehicle_number || '').trim();
    if (!vehNum) {
      if (!isUserAdmin) {
        error('Please select a Vehicle Number');
        return;
      }
      formData.vehicle_number = buses[0]?.registration_number || 'AP16TV1234';
    }

    const cleanVehicle = (formData.vehicle_number || '').split('(')[0].trim().toUpperCase();
    const matchedBus = buses.find((b) => normalizeVeh(b.registration_number || b.bus_number) === normalizeVeh(cleanVehicle));
    const sKm = Number(formData.starting_km) || 0;
    const pKm = Number(formData.present_km) || 0;
    const totalKmVal = sKm + pKm;

    const payload = {
      ...formData,
      vehicle_number: cleanVehicle,
      allocated_bus_id: matchedBus ? matchedBus.id : formData.allocated_bus_id,
      allocated_bus_number: cleanVehicle,
      starting_km: sKm,
      km: sKm,
      present_km: pKm,
      running_km: pKm >= sKm ? pKm - sKm : pKm,
      total_km: totalKmVal,
      status: cleanVehicle && cleanVehicle !== '—' && cleanVehicle !== '-' ? 'Allocated' : 'In Stock'
    };

    try {
      setSaving(true);
      let res: any = null;
      if (editingTyre) {
        res = await api.updateNewTyre(editingTyre.id, payload);
        success('Tyre record updated successfully!');
      } else {
        res = await api.createNewTyre(payload);
        success('New tyre registered with vehicle!');
      }

      // Immediately reflect newly created/edited tyre in local React state
      const recordId = editingTyre?.id || res?.id || Date.now();
      const updatedItem = { ...payload, id: recordId };
      setNewTyres((prev) => {
        if (editingTyre) {
          return prev.map((t) => (t.id === editingTyre.id ? updatedItem : t));
        } else {
          return [updatedItem, ...prev.filter((t) => t.id !== recordId)];
        }
      });

      setIsAddEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save new tyre');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tyre stock record?')) return;
    try {
      await api.deleteNewTyre(id);
      success('Tyre record deleted!');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete tyre');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'tyre_photo_url' | 'invoice_photo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev: any) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    buses.forEach((b) => {
      const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
      if (reg) set.add(reg);
    });
    newTyres.forEach((t) => {
      const reg = (t.vehicle_number || t.allocated_bus_number || '').split('(')[0].trim();
      if (reg) set.add(reg);
    });
    return Array.from(set).sort();
  }, [buses, newTyres]);

  const filteredTyres = useMemo(() => {
    return newTyres.filter((t) => {
      const q = searchQuery.toLowerCase();
      const vNumber = (t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? (buses.find(b => b.id === t.allocated_bus_id)?.registration_number || `Bus #${t.allocated_bus_id}`) : '') || '').split('(')[0].trim().toLowerCase();
      const matchSearch =
        !q ||
        (t.tyre_serial_number || '').toLowerCase().includes(q) ||
        (t.brand || '').toLowerCase().includes(q) ||
        (t.size || '').toLowerCase().includes(q) ||
        (t.supplier || '').toLowerCase().includes(q) ||
        vNumber.includes(q);

      const matchVehicle = vehicleFilter === 'All' || vNumber === vehicleFilter.toLowerCase();
      return matchSearch && matchVehicle;
    });
  }, [newTyres, searchQuery, vehicleFilter, buses]);

  const stats = useMemo(() => {
    const total = newTyres.length;
    const uniqueVehicles = new Set(
      newTyres.map((t) => (t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? String(t.allocated_bus_id) : '')).split('(')[0].trim()).filter(Boolean)
    ).size;
    const totalKm = newTyres.reduce((acc, t) => acc + (Number(t.total_km ?? t.km ?? t.present_km) || 0), 0);
    const brandsCount = new Set(newTyres.map((t) => t.brand).filter(Boolean)).size;
    return {
      total,
      uniqueVehicles,
      totalKm,
      brandsCount
    };
  }, [newTyres]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#142B4A] flex items-center gap-2.5 tracking-tight">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>New Tyres Inventory & Purchases</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register brand-new tyres, log total odometer KM, vehicle assignment, specifications, and invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Tyre Stock</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tyres</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Registered tyre units</p>
        </div>
        <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-5 shadow-2xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Vehicles Covered</p>
          <p className="text-3xl font-black text-emerald-800 mt-1">{stats.uniqueVehicles}</p>
          <p className="text-xs text-emerald-600 mt-1">Fleet buses equipped</p>
        </div>
        <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-5 shadow-2xs">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Logged KM</p>
          <p className="text-3xl font-black text-blue-800 mt-1">{stats.totalKm.toLocaleString('en-IN')} KM</p>
          <p className="text-xs text-blue-600 mt-1">Cumulative mileage</p>
        </div>
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tyre Brands</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.brandsCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active manufacturers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tyre number, vehicle, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Vehicles</option>
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center">S.No</th>
                <th className="py-2.5 px-3">Purchase Date</th>
                <th className="py-2.5 px-3">Vehicle Number</th>
                <th className="py-2.5 px-3">Starting KM</th>
                <th className="py-2.5 px-3">Present Running KM</th>
                <th className="py-2.5 px-3">Total KM</th>
                <th className="py-2.5 px-3">Tyre Number & Photo</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Supplier / Notes</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading tyre inventory...</span>
                  </td>
                </tr>
              ) : filteredTyres.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No tyre inventory records found.</span>
                  </td>
                </tr>
              ) : (
                filteredTyres.map((t, idx) => {
                  const tVeh = normalizeVeh(t.vehicle_number || t.allocated_bus_number);
                  const matchedBus = buses.find(b => {
                    if (t.allocated_bus_id && Number(b.id) === Number(t.allocated_bus_id)) return true;
                    const bReg = normalizeVeh(b.registration_number || b.bus_number);
                    return Boolean(bReg && tVeh && bReg === tVeh);
                  });
                  const vehicleNum = (matchedBus?.registration_number || t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? `Bus #${t.allocated_bus_id}` : '') || '—').split('(')[0].trim();
                  const isAssigned = vehicleNum && vehicleNum !== '—' && vehicleNum !== '-';

                  // 1. Starting KM (Initial / Before KM)
                  const startingKm = Number(t.starting_km ?? t.km) || 0;

                  // 2. Present Running KM (taken directly from Daily Vehicle Checkup of this vehicle)
                  const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);
                  const rawPresentKm = t.present_km !== undefined && t.present_km !== null && t.present_km !== '' ? Number(t.present_km) : 0;
                  const presentRunningKm = isAssigned ? (busKm > 0 ? busKm : rawPresentKm) : rawPresentKm;

                  // 3. Total KM (by adding Starting KM + Present Running KM)
                  const totalKmVal = startingKm + presentRunningKm;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium whitespace-nowrap text-slate-700">{t.purchase_date || '—'}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-[#142B4A] text-xs bg-slate-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-blue-600" />
                          {vehicleNum || '—'}
                        </span>
                      </td>

                      {/* Starting KM */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-700 text-xs whitespace-nowrap">
                        {startingKm > 0 ? `${startingKm.toLocaleString('en-IN')} KM` : '0 KM'}
                      </td>

                      {/* Present Running KM (from Daily Vehicle Checkup) */}
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700 text-xs whitespace-nowrap">
                        {presentRunningKm > 0 ? (
                          <span>{presentRunningKm.toLocaleString('en-IN')} KM</span>
                        ) : isAssigned ? (
                          <span className="text-slate-400">0 KM</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Total KM (Starting KM + Present Running KM) */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {totalKmVal > 0 ? `${totalKmVal.toLocaleString('en-IN')} KM` : '0 KM'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          {t.tyre_photo_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(t.tyre_photo_url!)}
                              className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:border-emerald-500 shadow-2xs"
                              title="View tyre photo"
                            >
                              <img src={t.tyre_photo_url} alt={t.tyre_serial_number} className="w-full h-full object-cover" />
                            </button>
                          )}
                          {t.invoice_photo_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(t.invoice_photo_url!)}
                              className="w-9 h-9 rounded-xl overflow-hidden border border-amber-300 bg-amber-50 text-amber-700 shrink-0 flex items-center justify-center cursor-pointer hover:border-amber-500 shadow-2xs"
                              title="View invoice photo"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                              {t.tyre_serial_number}
                            </span>
                            {t.supplier && (
                              <span className="text-xs text-slate-400 block truncate max-w-[130px] mt-0.5">
                                {t.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-800 text-sm">{t.brand || '—'}</span>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-500 max-w-[180px] truncate">
                        {t.supplier || t.notes || '—'}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer shadow-2xs"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shadow-2xs"
                            title="Delete"
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

      {/* Modal: Add/Edit Tyre */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingTyre ? 'Edit New Tyre Record' : 'Add New Tyre Stock'}
        subtitle="Log tyre purchase date, vehicle number, total KM and tyre details"
        maxWidth="max-w-2xl"
      >
        <form noValidate onSubmit={handleSaveTyre} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Number *</label>
              <select
                required
                value={formData.vehicle_number}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-800"
              >
                <option value="">-- Select Vehicle Number --</option>
                {buses.map((b) => {
                  const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
                  return (
                    <option key={b.id || reg} value={reg}>
                      {reg}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting KM
              </label>
              <input
                type="number"
                placeholder="e.g. 0"
                value={formData.starting_km}
                onChange={(e) => {
                  const s = e.target.value;
                  const sNum = Number(s) || 0;
                  const pNum = Number(formData.present_km) || 0;
                  setFormData((prev: any) => ({
                    ...prev,
                    starting_km: s,
                    total_km: (sNum + pNum) > 0 ? (sNum + pNum) : ''
                  }));
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Present Running KM
              </label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={formData.present_km}
                onChange={(e) => {
                  const p = e.target.value;
                  const pNum = Number(p) || 0;
                  const sNum = Number(formData.starting_km) || 0;
                  setFormData((prev: any) => ({
                    ...prev,
                    present_km: p,
                    total_km: (sNum + pNum) > 0 ? (sNum + pNum) : ''
                  }));
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-indigo-700"
              />
            </div>

            {/* Live Total KM Banner */}
            <div className="sm:col-span-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">
                  Total KM Running:
                </span>
              </div>
              <span className="text-sm font-black font-mono text-emerald-700">
                {((Number(formData.starting_km) || 0) + (Number(formData.present_km) || 0)).toLocaleString('en-IN')} KM
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. MRF-8899201"
                value={formData.tyre_serial_number}
                onChange={(e) => setFormData({ ...formData, tyre_serial_number: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="MRF">MRF</option>
                <option value="Apollo">Apollo</option>
                <option value="JK Tyre">JK Tyre</option>
                <option value="Bridgestone">Bridgestone</option>
                <option value="Michelin">Michelin</option>
                <option value="Ceat">Ceat</option>
                <option value="Goodyear">Goodyear</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Dealer</label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Tyres, Hyd"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Photo Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'tyre_photo_url')}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              {formData.tyre_photo_url && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                  <img src={formData.tyre_photo_url} alt="Tyre preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Receipt Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'invoice_photo_url')}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
              />
              {formData.invoice_photo_url && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                  <img src={formData.invoice_photo_url} alt="Invoice preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Purchase details, warranty or batch notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTyre}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Tyre Record...' : 'Save Tyre Record'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Full Photo Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Tyre preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
