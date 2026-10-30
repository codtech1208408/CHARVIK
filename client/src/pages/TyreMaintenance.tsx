import React, { useState, useEffect, useMemo } from 'react';
import {
  Disc,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RotateCw,
  Edit,
  Trash2,
  Bus,
  Save,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Wrench,
  Check,
  Tag,
  Truck,
  Clock,
  Gauge
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { TyreRecord, Bus as BusType, NewTyre, WheelAllotment } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { SearchableSelect } from '../components/common/SearchableSelect';

export const TyreMaintenance: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  // Active Tab: 'maintenance' | 'new_tyres' | 'allotment_rotation' determined by left sidebar URL
  const tabParam = searchParams.get('tab');
  const activeTab: 'maintenance' | 'new_tyres' | 'allotment_rotation' =
    tabParam === 'new_tyres' || tabParam === 'allotment_rotation' ? tabParam : 'maintenance';

  // Shared Data
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);

  // TAB 1: TYRE MAINTENANCE DATA
  const [tyres, setTyres] = useState<TyreRecord[]>([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedTyre, setSelectedTyre] = useState<TyreRecord | null>(null);

  const [formData, setFormData] = useState<any>({
    bus_id: '',
    tyre_serial_number: '',
    brand: '',
    size: '',
    tyre_position: 'Front Left',
    installation_date: '',
    installation_km: '',
    last_inspection_date: new Date().toISOString().split('T')[0],
    tread_depth_mm: '',
    tyre_pressure_psi: '',
    condition: 'Good',
    supplier: '',
    cost: '',
    remarks: ''
  });

  const [rotationData, setRotationData] = useState({
    new_position: 'Rear Right',
    rotation_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // TAB 2: NEW TYRES (INVENTORY) DATA
  const [newTyres, setNewTyres] = useState<NewTyre[]>([]);
  const [newTyreSearch, setNewTyreSearch] = useState('');
  const [newTyreStatusFilter, setNewTyreStatusFilter] = useState('all');
  const [isNewTyreModalOpen, setIsNewTyreModalOpen] = useState(false);
  const [editingNewTyre, setEditingNewTyre] = useState<NewTyre | null>(null);

  const [newTyreForm, setNewTyreForm] = useState<any>({
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    tyre_serial_number: '',
    km: '',
    present_km: '',
    brand: 'MRF',
    size: '295/80 R22.5',
    model: 'Steel Muscle',
    supplier: '',
    invoice_number: '',
    purchase_cost: '',
    status: 'In Stock',
    notes: ''
  });

  // Quick Allotment Modal from New Tyres
  const [allottingNewTyre, setAllottingNewTyre] = useState<NewTyre | null>(null);
  const [allotmentForm, setAllotmentForm] = useState<any>({
    bus_id: '',
    wheel_position: 'Front Left',
    event_date: new Date().toISOString().split('T')[0],
    current_km: '',
    technician: '',
    notes: ''
  });

  // TAB 3: WHEEL ALLOTMENT & ROTATION DATA
  const [allotments, setAllotments] = useState<WheelAllotment[]>([]);
  const [allotmentSearch, setAllotmentSearch] = useState('');
  const [allotmentBusFilter, setAllotmentBusFilter] = useState('');
  const [allotmentActionFilter, setAllotmentActionFilter] = useState('all');
  const [isAllotmentModalOpen, setIsAllotmentModalOpen] = useState(false);
  const [editingAllotment, setEditingAllotment] = useState<WheelAllotment | null>(null);

  const [allotmentModalData, setAllotmentModalData] = useState<any>({
    bus_id: '',
    action_type: 'Rotation',
    event_date: new Date().toISOString().split('T')[0],
    current_km: '',
    target_km: 10000,
    tyre_serial_number: '',
    from_position: 'Front Left',
    to_position: 'Rear Right Outer',
    technician: '',
    tread_depth_mm: '',
    pressure_psi: '',
    notes: ''
  });

  // Load Initial Data
  useEffect(() => {
    loadAllData();
  }, [selectedBus, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tyreData, busesData, newTyresData, allotmentsData] = await Promise.all([
        api.getTyreRecords({ bus_id: selectedBus || undefined }).catch(() => []),
        api.getBuses().catch(() => []),
        api.getNewTyres().catch(() => []),
        api.getWheelAllotments().catch(() => [])
      ]);
      setTyres(tyreData || []);
      setBuses(busesData || []);
      setNewTyres(newTyresData || []);
      setAllotments(allotmentsData || []);
    } catch (err: any) {
      error(err.message || 'Failed to load tyre management data');
    } finally {
      setLoading(false);
    }
  };

  // Bus options for SearchableSelect
  const busSelectOptions = buses.map((b) => ({
    value: String(b.id),
    label: b.bus_number,
    subLabel: b.registration_number ? `Reg: ${b.registration_number}` : undefined
  }));

  // =========================================================================
  // TAB 1 HANDLERS: TYRE MAINTENANCE
  // =========================================================================
  const handleOpenAdd = () => {
    setEditingTyre(null);
    const firstBus = buses[0];
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      tyre_serial_number: '',
      brand: 'MRF',
      size: '295/80 R22.5',
      tyre_position: 'Front Left',
      installation_date: new Date().toISOString().split('T')[0],
      installation_km: firstBus ? ((firstBus as any).latest_checkup_km || firstBus.current_odometer_km || '') : '',
      last_inspection_date: new Date().toISOString().split('T')[0],
      tread_depth_mm: '12',
      tyre_pressure_psi: '110',
      condition: 'Good',
      supplier: '',
      cost: '',
      remarks: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t: TyreRecord) => {
    setEditingTyre(t);
    setFormData({
      bus_id: String(t.bus_id),
      tyre_serial_number: t.tyre_serial_number,
      brand: t.brand || 'MRF',
      size: t.size || '295/80 R22.5',
      tyre_position: t.tyre_position || 'Front Left',
      installation_date: t.installation_date || new Date().toISOString().split('T')[0],
      installation_km: t.installation_km || '',
      last_inspection_date: t.last_inspection_date || new Date().toISOString().split('T')[0],
      tread_depth_mm: t.tread_depth_mm ?? '',
      tyre_pressure_psi: t.tyre_pressure_psi ?? '',
      condition: t.condition || 'Good',
      supplier: t.supplier || '',
      cost: t.cost ?? '',
      remarks: t.remarks || ''
    });
    setIsAddOpen(true);
  };

  const handleDeleteTyre = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tyre record?')) return;
    try {
      await api.deleteTyreRecord(id);
      success('Tyre record deleted successfully!');
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to delete tyre record');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.tyre_serial_number) {
      error('Bus and tyre serial number are required');
      return;
    }
    try {
      if (editingTyre) {
        await api.updateTyreRecord(editingTyre.id, formData);
        success('Tyre record updated successfully!');
      } else {
        await api.createTyreRecord(formData);
        success('Tyre record saved successfully!');
      }
      setIsAddOpen(false);
      setEditingTyre(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to save tyre record');
    }
  };

  const handleOpenRotate = (t: TyreRecord) => {
    setSelectedTyre(t);
    setRotationData({
      new_position: t.tyre_position.includes('Front') ? 'Rear Right Outer' : 'Front Left',
      rotation_date: new Date().toISOString().split('T')[0],
      remarks: `Rotated from ${t.tyre_position}`
    });
    setIsRotateModalOpen(true);
  };

  const handleConfirmRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTyre) return;
    try {
      await api.updateTyreRecord(selectedTyre.id, {
        ...selectedTyre,
        tyre_position: rotationData.new_position,
        rotation_date: rotationData.rotation_date,
        remarks: `${selectedTyre.remarks || ''} [${rotationData.remarks} on ${rotationData.rotation_date}]`
      });

      // Also log entry into Wheel Allotment & Tyre Rotation history
      const bus = buses.find((b) => b.id === selectedTyre.bus_id);
      await api.createWheelAllotment({
        bus_id: selectedTyre.bus_id,
        action_type: 'Rotation',
        event_date: rotationData.rotation_date,
        current_km: (bus as any)?.latest_checkup_km || bus?.current_odometer_km || 0,
        tyre_serial_number: selectedTyre.tyre_serial_number,
        from_position: selectedTyre.tyre_position,
        to_position: rotationData.new_position,
        technician: 'Workshop Team',
        tread_depth_mm: selectedTyre.tread_depth_mm,
        pressure_psi: selectedTyre.tyre_pressure_psi,
        notes: rotationData.remarks
      }).catch(() => {});

      success(`Tyre position rotated to ${rotationData.new_position}!`);
      setIsRotateModalOpen(false);
      setSelectedTyre(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to update tyre rotation');
    }
  };

  // =========================================================================
  // TAB 2 HANDLERS: NEW TYRES (INVENTORY / PURCHASES)
  // =========================================================================
  const handleOpenAddNewTyre = () => {
    setEditingNewTyre(null);
    setNewTyreForm({
      purchase_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      tyre_serial_number: '',
      km: '',
      present_km: '',
      brand: 'MRF',
      size: '295/80 R22.5',
      model: 'Steel Muscle',
      supplier: '',
      invoice_number: '',
      purchase_cost: '',
      status: 'In Stock',
      notes: ''
    });
    setIsNewTyreModalOpen(true);
  };

  const handleOpenEditNewTyre = (nt: NewTyre) => {
    setEditingNewTyre(nt);
    setNewTyreForm({
      purchase_date: nt.purchase_date || new Date().toISOString().split('T')[0],
      quantity: nt.quantity || 1,
      tyre_serial_number: nt.tyre_serial_number,
      km: nt.km !== undefined && nt.km !== null ? nt.km : '',
      present_km: nt.present_km !== undefined && nt.present_km !== null ? nt.present_km : '',
      brand: nt.brand || 'MRF',
      size: nt.size || '295/80 R22.5',
      model: nt.model || '',
      supplier: nt.supplier || '',
      invoice_number: nt.invoice_number || '',
      purchase_cost: nt.purchase_cost ?? '',
      status: nt.status || 'In Stock',
      notes: nt.notes || ''
    });
    setIsNewTyreModalOpen(true);
  };

  const handleSaveNewTyre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTyreForm.tyre_serial_number) {
      error('Tyre Serial / Number is required');
      return;
    }
    try {
      if (editingNewTyre) {
        await api.updateNewTyre(editingNewTyre.id, newTyreForm);
        success('New tyre record updated!');
      } else {
        await api.createNewTyre(newTyreForm);
        success('New tyre added to stock inventory!');
      }
      setIsNewTyreModalOpen(false);
      setEditingNewTyre(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to save new tyre');
    }
  };

  const handleDeleteNewTyre = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this tyre from stock?')) return;
    try {
      await api.deleteNewTyre(id);
      success('Tyre removed from stock inventory!');
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to delete tyre');
    }
  };

  // Open Allotment modal for a specific new tyre
  const handleOpenAllotNewTyre = (nt: NewTyre) => {
    setAllottingNewTyre(nt);
    const firstBus = buses[0];
    const busKm = firstBus ? ((firstBus as any).latest_checkup_km || firstBus.current_odometer_km || '') : '';
    setAllotmentForm({
      bus_id: firstBus ? String(firstBus.id) : '',
      wheel_position: 'Front Left',
      event_date: new Date().toISOString().split('T')[0],
      current_km: busKm,
      technician: '',
      notes: `Allotted new tyre ${nt.tyre_serial_number}`
    });
  };

  const handleConfirmAllotNewTyre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allottingNewTyre || !allotmentForm.bus_id) {
      error('Please select a vehicle');
      return;
    }

    try {
      // 1. Update New Tyre status to Allotted
      await api.updateNewTyre(allottingNewTyre.id, {
        ...allottingNewTyre,
        status: 'Allotted',
        allocated_bus_id: Number(allotmentForm.bus_id),
        allocated_wheel_position: allotmentForm.wheel_position,
        notes: allotmentForm.notes
      });

      // 2. Create entry in Tyre Records (mounted tyres)
      await api.createTyreRecord({
        bus_id: Number(allotmentForm.bus_id),
        tyre_serial_number: allottingNewTyre.tyre_serial_number,
        brand: allottingNewTyre.brand,
        size: allottingNewTyre.size,
        tyre_position: allotmentForm.wheel_position,
        installation_date: allotmentForm.event_date,
        installation_km: allotmentForm.current_km || 0,
        last_inspection_date: allotmentForm.event_date,
        tread_depth_mm: 14,
        tyre_pressure_psi: 110,
        condition: 'Good',
        supplier: allottingNewTyre.supplier,
        cost: allottingNewTyre.purchase_cost,
        remarks: `Allotted from New Stock (Invoice: ${allottingNewTyre.invoice_number || '-'})`
      });

      // 3. Log Wheel Allotment record
      await api.createWheelAllotment({
        bus_id: Number(allotmentForm.bus_id),
        action_type: 'Allotment',
        event_date: allotmentForm.event_date,
        current_km: allotmentForm.current_km || 0,
        tyre_serial_number: allottingNewTyre.tyre_serial_number,
        from_position: 'New Stock',
        to_position: allotmentForm.wheel_position,
        technician: allotmentForm.technician || 'Fleet Team',
        tread_depth_mm: 14,
        pressure_psi: 110,
        notes: allotmentForm.notes
      });

      success(`Tyre ${allottingNewTyre.tyre_serial_number} allotted to vehicle successfully!`);
      setAllottingNewTyre(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to allot tyre');
    }
  };

  // =========================================================================
  // TAB 3 HANDLERS: WHEEL ALLOTMENT & TYRE ROTATION
  // =========================================================================
  const handleOpenAddAllotment = () => {
    setEditingAllotment(null);
    const firstBus = buses[0];
    const busKm = firstBus ? ((firstBus as any).latest_checkup_km || firstBus.current_odometer_km || '') : '';
    setAllotmentModalData({
      bus_id: firstBus ? String(firstBus.id) : '',
      action_type: 'Rotation',
      event_date: new Date().toISOString().split('T')[0],
      current_km: busKm,
      target_km: 10000,
      tyre_serial_number: '',
      from_position: 'Front Left',
      to_position: 'Rear Right Outer',
      technician: '',
      tread_depth_mm: '',
      pressure_psi: '110',
      notes: ''
    });
    setIsAllotmentModalOpen(true);
  };

  const handleOpenEditAllotment = (w: WheelAllotment) => {
    setEditingAllotment(w);
    setAllotmentModalData({
      bus_id: String(w.bus_id),
      action_type: w.action_type || 'Rotation',
      event_date: w.event_date || new Date().toISOString().split('T')[0],
      current_km: w.current_km ?? '',
      target_km: w.target_km ?? 10000,
      tyre_serial_number: w.tyre_serial_number,
      from_position: w.from_position || 'Front Left',
      to_position: w.to_position || 'Rear Right Outer',
      technician: w.technician || '',
      tread_depth_mm: w.tread_depth_mm ?? '',
      pressure_psi: w.pressure_psi ?? '',
      notes: w.notes || ''
    });
    setIsAllotmentModalOpen(true);
  };

  const handleSaveAllotmentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allotmentModalData.bus_id || !allotmentModalData.tyre_serial_number) {
      error('Vehicle and Tyre Number are required');
      return;
    }
    try {
      if (editingAllotment) {
        await api.updateWheelAllotment(editingAllotment.id, allotmentModalData);
        success('Allotment / Rotation record updated!');
      } else {
        await api.createWheelAllotment(allotmentModalData);
        success('Allotment / Rotation recorded successfully!');
      }
      setIsAllotmentModalOpen(false);
      setEditingAllotment(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to save record');
    }
  };

  const handleDeleteAllotment = async (id: number) => {
    if (!window.confirm('Delete this wheel allotment/rotation log?')) return;
    try {
      await api.deleteWheelAllotment(id);
      success('Log deleted successfully!');
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  // Filtered New Tyres
  const filteredNewTyres = newTyres.filter((nt) => {
    const query = newTyreSearch.toLowerCase();
    const matchesSearch =
      !newTyreSearch ||
      nt.tyre_serial_number.toLowerCase().includes(query) ||
      (nt.brand || '').toLowerCase().includes(query) ||
      (nt.supplier || '').toLowerCase().includes(query) ||
      (nt.invoice_number || '').toLowerCase().includes(query);

    const matchesStatus = newTyreStatusFilter === 'all' || nt.status === newTyreStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Wheel Allotments
  const filteredAllotments = allotments.filter((w) => {
    const query = allotmentSearch.toLowerCase();
    const busNo = (w.bus_number || '').toLowerCase();
    const regNo = (w.registration_number || '').toLowerCase();
    const tyreNo = (w.tyre_serial_number || '').toLowerCase();
    const tech = (w.technician || '').toLowerCase();

    const matchesSearch =
      !allotmentSearch ||
      busNo.includes(query) ||
      regNo.includes(query) ||
      tyreNo.includes(query) ||
      tech.includes(query);

    const matchesBus = !allotmentBusFilter || String(w.bus_id) === String(allotmentBusFilter);
    const matchesAction = allotmentActionFilter === 'all' || w.action_type === allotmentActionFilter;

    return matchesSearch && matchesBus && matchesAction;
  });

  // Summary Stats for Wheel Allotment & Rotation
  const allotmentStats = useMemo(() => {
    let totalAllotted = allotments.length;
    let totalKmRun = 0;
    let limitReachedCount = 0;
    let inProgressCount = 0;

    allotments.forEach((w) => {
      const bus = buses.find((b) => b.id === w.bus_id);
      const fittedKm = Number(w.current_km) || 0;
      const latestKm = Math.max(
        Number(w.latest_vehicle_km) || 0,
        bus?.current_odometer_km ? Number(bus.current_odometer_km) : 0,
        fittedKm
      );
      const runKm = Math.max(0, latestKm - fittedKm);
      const targetKm = Number(w.target_km) > 0 ? Number(w.target_km) : 10000;
      totalKmRun += runKm;
      if (runKm >= targetKm) {
        limitReachedCount++;
      } else {
        inProgressCount++;
      }
    });

    return { totalAllotted, totalKmRun, limitReachedCount, inProgressCount };
  }, [allotments, buses]);

  return (
    <div className="space-y-6">


      {/* ========================================================================= */}
      {/* TAB 1: TYRE MAINTENANCE & INSPECTION TRACKING (KEPT AS IT IS) */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <Disc className="w-5 h-5 text-blue-600" />
                <span>Tyre Maintenance & Inspection Tracking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor tread depth, tyre pressure, positions, rotations, and replacement history per bus.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Mount / Register Tyre</span>
            </button>
          </div>

          {/* Filter and Bus Selection */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter by Bus</label>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="">All Fleet Buses</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} ({b.registration_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold self-start sm:self-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tread &gt; 4mm (Safe)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Tread &le; 3.5mm (Replace Soon)
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-14 text-center">S.NO</th>
                    <th className="py-3 px-4 min-w-[110px]">DATE</th>
                    <th className="py-3 px-4 min-w-[140px]">VEHICLE NUMBER</th>
                    <th className="py-3 px-4 min-w-[100px]">KM</th>
                    <th className="py-3 px-4 min-w-[110px]">TYRE SIZE</th>
                    <th className="py-3 px-4 min-w-[130px]">TYRE NUMBER</th>
                    <th className="py-3 px-4 min-w-[150px] text-center">TOTAL RUNNING KM (TYRE)</th>
                    <th className="py-3 px-4 text-center min-w-[120px]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading tyre records...
                      </td>
                    </tr>
                  ) : tyres.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No tyre maintenance records found.
                      </td>
                    </tr>
                  ) : (
                    tyres.map((t, index) => {
                      const bus = buses.find((b) => b.id === t.bus_id);
                      const displayDate = t.installation_date || t.last_inspection_date || '-';
                      const vehicleNumber = t.registration_number || bus?.registration_number || t.bus_number || bus?.bus_number || '—';
                      const kmVal = (t as any).latest_km || (bus as any)?.latest_checkup_km || bus?.current_odometer_km || t.installation_km;
                      const fittedKm = Number(t.installation_km) || 0;
                      const currentVehicleKm = Number(kmVal) || 0;
                      const totalRunningKm = Math.max(0, currentVehicleKm - fittedKm);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. S.NO */}
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>

                          {/* 2. DATE */}
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {displayDate}
                          </td>

                          {/* 3. VEHICLE NUMBER */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-slate-900 tracking-wider uppercase block">
                              {vehicleNumber}
                            </span>
                          </td>

                          {/* 4. KM */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {kmVal ? `${Number(kmVal).toLocaleString('en-IN')} KM` : '—'}
                          </td>

                          {/* 5. TYRE SIZE */}
                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            {t.size || '295/80 R22.5'}
                          </td>

                          {/* 6. TYRE NUMBER */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-xs">
                              {t.tyre_serial_number}
                            </span>
                            {t.brand && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">{t.brand} • {t.tyre_position}</span>
                            )}
                          </td>

                          {/* 7. TOTAL RUNNING KM (TYRE) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="font-mono font-black text-indigo-700 block text-xs">
                              {totalRunningKm > 0 ? `${totalRunningKm.toLocaleString('en-IN')} KM` : '0 KM'}
                            </span>
                            {fittedKm > 0 && (
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                Fitted @ {fittedKm.toLocaleString('en-IN')} KM
                              </span>
                            )}
                          </td>

                          {/* 8. ACTIONS */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenRotate(t)}
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Rotate Tyre Position"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>Rotate</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Tyre Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTyre(t.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Tyre Record"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEW TYRES (INVENTORY / PURCHASES) */}
      {/* ========================================================================= */}
      {activeTab === 'new_tyres' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>New Tyres Inventory & Purchases</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register brand-new tyres in stock, invoice details, size specifications, and assign them to fleet buses.
              </p>
            </div>

            <button
              onClick={handleOpenAddNewTyre}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Tyre Stock</span>
            </button>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search New Tyres</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search serial no, brand, invoice..."
                    value={newTyreSearch}
                    onChange={(e) => setNewTyreSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter by Stock Status</label>
                <select
                  value={newTyreStatusFilter}
                  onChange={(e) => setNewTyreStatusFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-700"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="In Stock">In Stock (Available)</option>
                  <option value="Allotted">Allotted to Bus</option>
                  <option value="Scrapped">Scrapped / Retired</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Total In-Stock: {newTyres.filter((n) => n.status === 'In Stock').length} Tyres</span>
            </div>
          </div>

          {/* New Tyres Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">S.NO</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4 text-center">NUMBER OF TYRES</th>
                    <th className="py-3 px-4">TYRE NUMBER</th>
                    <th className="py-3 px-4">KM</th>
                    <th className="py-3 px-4">PRESENT TYRE KM RUNNING</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading new tyre inventory...
                      </td>
                    </tr>
                  ) : filteredNewTyres.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        No new tyre stock records found. Click "+ Add New Tyre Stock" to register new purchases.
                      </td>
                    </tr>
                  ) : (
                    filteredNewTyres.map((nt, index) => {
                      const initialKm = Number(nt.km) || 0;
                      const presentKm = nt.present_km !== undefined && nt.present_km !== null && nt.present_km !== '' ? Number(nt.present_km) : initialKm;
                      const diffKm = presentKm >= initialKm ? presentKm - initialKm : 0;

                      return (
                        <tr key={nt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                          {/* 1. DATE */}
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {nt.purchase_date || '-'}
                          </td>
                          {/* 2. NUMBER OF TYRES */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                              {nt.quantity || 1}
                            </span>
                          </td>
                          {/* 3. TYRE NUMBER */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs">
                              {nt.tyre_serial_number}
                            </span>
                          </td>
                          {/* 4. KM */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {initialKm > 0 ? `${initialKm.toLocaleString('en-IN')} KM` : '0 KM'}
                          </td>
                          {/* 5. PRESENT TYRE KM RUNNING */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-indigo-700 block text-xs">
                              {presentKm > 0 ? `${presentKm.toLocaleString('en-IN')} KM` : '0 KM'}
                            </span>
                            {diffKm > 0 && (
                              <span className="text-[10px] text-emerald-600 font-bold block">
                                +{diffKm.toLocaleString('en-IN')} KM run
                              </span>
                            )}
                          </td>
                          {/* ACTIONS */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditNewTyre(nt)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNewTyre(nt.id)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHEEL ALLOTMENT & TYRE ROTATION */}
      {/* ========================================================================= */}
      {activeTab === 'allotment_rotation' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-indigo-600" />
                <span>Wheel Allotment & Tyre Rotation Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track tyre wheel position allotments, systematic rotation cycles, odometer readings, and live kilometer wear balance.
              </p>
            </div>

            <button
              onClick={handleOpenAddAllotment}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Allotment / Rotation</span>
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Allotted Tyres</p>
                <h3 className="text-2xl font-black text-[#142B4A] mt-1">{allotmentStats.totalAllotted}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Active tyre allotments</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Disc className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tyre KM Run</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{allotmentStats.totalKmRun.toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-400">KM</span></h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Accumulated across fleet</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Running (Pending KM)</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{allotmentStats.inProgressCount}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Progressing towards target</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due for Rotation</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{allotmentStats.limitReachedCount}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Reached Target (≥ 10,000 KM)</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-60">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter by Bus</label>
                <select
                  value={allotmentBusFilter}
                  onChange={(e) => setAllotmentBusFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  <option value="">All Fleet Buses</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number} ({b.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Action Type</label>
                <select
                  value={allotmentActionFilter}
                  onChange={(e) => setAllotmentActionFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-700"
                >
                  <option value="all">All Actions</option>
                  <option value="Rotation">Rotation Only</option>
                  <option value="Allotment">Allotment Only</option>
                </select>
              </div>

              <div className="w-full sm:w-60">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Tyre / Tech</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tyre number, tech..."
                    value={allotmentSearch}
                    onChange={(e) => setAllotmentSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <RotateCw className="w-4 h-4 text-indigo-600" />
              <span>Standard Target Limit: 10,000 KM</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">S.NO</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">VEHICLE NUMBER</th>
                    <th className="py-3 px-4">TYRE NUMBER</th>
                    <th className="py-3 px-4">ALLOTMENT / FITTED KM</th>
                    <th className="py-3 px-4">TARGET KM</th>
                    <th className="py-3 px-4">TOTAL TYRE KM</th>
                    <th className="py-3 px-4">TYRE PENDING KM</th>
                    <th className="py-3 px-4">POSITION / ACTION</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading wheel allotment and rotation history...
                      </td>
                    </tr>
                  ) : filteredAllotments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <RotateCw className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        No wheel allotment or tyre rotation records logged yet.
                      </td>
                    </tr>
                  ) : (
                    filteredAllotments.map((w, index) => {
                      const bus = buses.find((b) => b.id === w.bus_id);
                      const busName = w.bus_number || bus?.bus_number || (w.bus_id ? `Bus #${w.bus_id}` : '-');
                      const regName = w.registration_number || bus?.registration_number;

                      const fittedKm = Number(w.current_km) || 0;
                      const latestVehicleKm = Math.max(
                        Number(w.latest_vehicle_km) || 0,
                        bus?.current_odometer_km ? Number(bus.current_odometer_km) : 0,
                        fittedKm
                      );
                      const totalTyreKm = Math.max(0, latestVehicleKm - fittedKm);
                      const targetKm = Number(w.target_km) > 0 ? Number(w.target_km) : 10000;
                      const pendingKm = Math.max(0, targetKm - totalTyreKm);
                      const percentRun = Math.min(100, Math.round((totalTyreKm / targetKm) * 100));
                      const isLimitReached = totalTyreKm >= targetKm;

                      return (
                        <tr key={w.id} className={`hover:bg-slate-50/80 transition-colors ${isLimitReached ? 'bg-rose-50/20' : ''}`}>
                          {/* 1. S.NO */}
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>

                          {/* 2. DATE */}
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {w.event_date || '-'}
                          </td>

                          {/* 3. VEHICLE NUMBER */}
                          <td className="py-3 px-4">
                            <span className="font-black font-mono text-blue-600 block text-xs tracking-wider">
                              {busName}
                            </span>
                            {regName && (
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {regName}
                              </span>
                            )}
                          </td>

                          {/* 4. TYRE NUMBER */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs">
                              {w.tyre_serial_number}
                            </span>
                          </td>

                          {/* 5. ALLOTMENT / FITTED KM */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {fittedKm > 0 ? `${fittedKm.toLocaleString('en-IN')} KM` : '0 KM'}
                          </td>

                          {/* 6. TARGET KM */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                              {targetKm.toLocaleString('en-IN')} KM
                            </span>
                          </td>

                          {/* 7. TOTAL TYRE KM */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="font-mono font-black text-slate-900 block text-xs">
                                {totalTyreKm.toLocaleString('en-IN')} KM
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                Live Checkup: {latestVehicleKm.toLocaleString('en-IN')} KM
                              </span>
                            </div>
                          </td>

                          {/* 8. TYRE PENDING KM */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-1.5 min-w-[150px]">
                              {isLimitReached ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>0 KM (Limit Reached)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{pendingKm.toLocaleString('en-IN')} KM Pending</span>
                                </span>
                              )}
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isLimitReached ? 'bg-rose-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${percentRun}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {percentRun}% completed ({totalTyreKm.toLocaleString('en-IN')} / {targetKm.toLocaleString('en-IN')} KM)
                              </span>
                            </div>
                          </td>

                          {/* 9. POSITION / ACTION */}
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-700 mb-0.5">
                              <span className="text-slate-600 font-medium text-[11px]">{w.from_position || 'Stock'}</span>
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                              <span className="text-indigo-900 font-bold text-[11px]">{w.to_position}</span>
                            </div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {w.action_type || 'Rotation'}
                            </span>
                          </td>

                          {/* 10. ACTIONS */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditAllotment(w)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAllotment(w.id)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MOUNT / REGISTER TYRE (TAB 1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingTyre(null);
        }}
        title={editingTyre ? 'Edit Tyre Record' : 'Mount / Register New Tyre to Bus'}
        subtitle="Record tyre installation, serial number, tread depth and wheel position"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bus *</label>
              <SearchableSelect
                options={busSelectOptions}
                value={formData.bus_id}
                onChange={(val) => {
                  const b = buses.find((x) => String(x.id) === val);
                  setFormData({
                    ...formData,
                    bus_id: val,
                    installation_km: (b as any)?.latest_checkup_km || b?.current_odometer_km || formData.installation_km
                  });
                }}
                placeholder="Search or select bus..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Serial Number *</label>
              <input
                type="text"
                value={formData.tyre_serial_number}
                onChange={(e) => setFormData({ ...formData, tyre_serial_number: e.target.value })}
                placeholder="e.g. MRF-2026-001"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="MRF / Apollo / JK"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="295/80 R22.5"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wheel Position</label>
              <select
                value={formData.tyre_position}
                onChange={(e) => setFormData({ ...formData, tyre_position: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              >
                <option value="Front Left">Front Left</option>
                <option value="Front Right">Front Right</option>
                <option value="Rear Left Outer">Rear Left Outer</option>
                <option value="Rear Left Inner">Rear Left Inner</option>
                <option value="Rear Right Outer">Rear Right Outer</option>
                <option value="Rear Right Inner">Rear Right Inner</option>
                <option value="Spare">Spare</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation KM</label>
              <input
                type="number"
                value={formData.installation_km}
                onChange={(e) => setFormData({ ...formData, installation_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tread Depth (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tread_depth_mm}
                onChange={(e) => setFormData({ ...formData, tread_depth_mm: Number(e.target.value) })}
                placeholder="14"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pressure (PSI)</label>
              <input
                type="number"
                value={formData.tyre_pressure_psi}
                onChange={(e) => setFormData({ ...formData, tyre_pressure_psi: Number(e.target.value) })}
                placeholder="110"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Good">Good</option>
                <option value="Worn">Worn</option>
                <option value="Damaged">Damaged</option>
                <option value="Needs Replacement">Needs Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                placeholder="0"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Tyre Record</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ROTATE TYRE (QUICK MODAL FROM TAB 1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => {
          setIsRotateModalOpen(false);
          setSelectedTyre(null);
        }}
        title="Tyre Rotation"
        subtitle={`Rotate tyre ${selectedTyre?.tyre_serial_number} from current position: ${selectedTyre?.tyre_position}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmRotate} className="space-y-4">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
            <span className="font-bold text-blue-900 block">Current Wheel Position:</span>
            <span className="font-extrabold text-blue-700 text-sm">{selectedTyre?.tyre_position}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select New Wheel Position *</label>
            <select
              value={rotationData.new_position}
              onChange={(e) => setRotationData({ ...rotationData, new_position: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-blue-900"
            >
              <option value="Front Left">Front Left</option>
              <option value="Front Right">Front Right</option>
              <option value="Rear Left Outer">Rear Left Outer</option>
              <option value="Rear Left Inner">Rear Left Inner</option>
              <option value="Rear Right Outer">Rear Right Outer</option>
              <option value="Rear Right Inner">Rear Right Inner</option>
              <option value="Spare">Spare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rotation Date *</label>
            <input
              type="date"
              value={rotationData.rotation_date}
              onChange={(e) => setRotationData({ ...rotationData, rotation_date: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Reason</label>
            <input
              type="text"
              value={rotationData.remarks}
              onChange={(e) => setRotationData({ ...rotationData, remarks: e.target.value })}
              placeholder="e.g. Scheduled 15,000 km diagonal swap"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRotateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Confirm Rotation</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT NEW TYRE STOCK (TAB 2) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewTyreModalOpen}
        onClose={() => {
          setIsNewTyreModalOpen(false);
          setEditingNewTyre(null);
        }}
        title={editingNewTyre ? 'Edit New Tyre Stock' : 'Add New Tyre to Inventory'}
        subtitle="Register brand new tyre purchases, specifications and dealer invoices"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveNewTyre} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={newTyreForm.purchase_date}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, purchase_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Tyres *</label>
              <input
                type="number"
                min="1"
                value={newTyreForm.quantity}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, quantity: Number(e.target.value) || 1 })}
                placeholder="1"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-blue-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Number (Serial No) *</label>
              <input
                type="text"
                value={newTyreForm.tyre_serial_number}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, tyre_serial_number: e.target.value })}
                placeholder="e.g. MRF-2026-X880"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">KM (Initial / Purchase KM)</label>
              <input
                type="number"
                value={newTyreForm.km}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, km: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="e.g. 0 or 120000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Present Tyre KM Running</label>
              <input
                type="number"
                value={newTyreForm.present_km}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, present_km: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="e.g. 145000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand *</label>
              <input
                type="text"
                value={newTyreForm.brand}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, brand: e.target.value })}
                placeholder="MRF / Apollo / JK Tyre"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Size *</label>
              <input
                type="text"
                value={newTyreForm.size}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, size: e.target.value })}
                placeholder="295/80 R22.5"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Pattern</label>
              <input
                type="text"
                value={newTyreForm.model}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, model: e.target.value })}
                placeholder="Steel Muscle / EnduRace"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Dealer</label>
              <input
                type="text"
                value={newTyreForm.supplier}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, supplier: e.target.value })}
                placeholder="Apex Tyre Agency"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={newTyreForm.invoice_number}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, invoice_number: e.target.value })}
                placeholder="INV-99218"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                value={newTyreForm.purchase_cost}
                onChange={(e) => setNewTyreForm({ ...newTyreForm, purchase_cost: Number(e.target.value) })}
                placeholder="22000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Warranty Details</label>
            <textarea
              rows={2}
              value={newTyreForm.notes}
              onChange={(e) => setNewTyreForm({ ...newTyreForm, notes: e.target.value })}
              placeholder="3 years manufacturer warranty against manufacturing defects"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTyreModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save New Tyre Stock</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ALLOT NEW TYRE TO VEHICLE (QUICK FROM TAB 2) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!allottingNewTyre}
        onClose={() => setAllottingNewTyre(null)}
        title="Allot New Tyre to Vehicle"
        subtitle={`Assign tyre ${allottingNewTyre?.tyre_serial_number} (${allottingNewTyre?.brand} ${allottingNewTyre?.size}) to a bus wheel`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAllotNewTyre} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-900 block">Selected Stock Tyre:</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {allottingNewTyre?.tyre_serial_number} • {allottingNewTyre?.brand} ({allottingNewTyre?.size})
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Fleet Vehicle *</label>
            <SearchableSelect
              options={busSelectOptions}
              value={allotmentForm.bus_id}
              onChange={(val) => {
                const b = buses.find((x) => String(x.id) === val);
                setAllotmentForm({
                  ...allotmentForm,
                  bus_id: val,
                  current_km: (b as any)?.latest_checkup_km || b?.current_odometer_km || ''
                });
              }}
              placeholder="Search or select bus..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wheel Position *</label>
              <select
                value={allotmentForm.wheel_position}
                onChange={(e) => setAllotmentForm({ ...allotmentForm, wheel_position: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold"
              >
                <option value="Front Left">Front Left</option>
                <option value="Front Right">Front Right</option>
                <option value="Rear Left Outer">Rear Left Outer</option>
                <option value="Rear Left Inner">Rear Left Inner</option>
                <option value="Rear Right Outer">Rear Right Outer</option>
                <option value="Rear Right Inner">Rear Right Inner</option>
                <option value="Spare">Spare</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Allotment Date *</label>
              <input
                type="date"
                value={allotmentForm.event_date}
                onChange={(e) => setAllotmentForm({ ...allotmentForm, event_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation KM</label>
              <input
                type="number"
                value={allotmentForm.current_km}
                onChange={(e) => setAllotmentForm({ ...allotmentForm, current_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fitted By / Tech</label>
              <input
                type="text"
                value={allotmentForm.technician}
                onChange={(e) => setAllotmentForm({ ...allotmentForm, technician: e.target.value })}
                placeholder="Technician name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAllottingNewTyre(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Allotment</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RECORD WHEEL ALLOTMENT / TYRE ROTATION (TAB 3) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAllotmentModalOpen}
        onClose={() => {
          setIsAllotmentModalOpen(false);
          setEditingAllotment(null);
        }}
        title={editingAllotment ? 'Edit Allotment / Rotation Log' : 'Record Wheel Allotment or Tyre Rotation'}
        subtitle="Log systematic wheel position changes, new allotments, and tread telemetry"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveAllotmentRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Action Type *</label>
              <select
                value={allotmentModalData.action_type}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, action_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-indigo-900"
              >
                <option value="Rotation">Tyre Rotation</option>
                <option value="Allotment">Wheel Allotment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Vehicle *</label>
              <SearchableSelect
                options={busSelectOptions}
                value={allotmentModalData.bus_id}
                onChange={(val) => {
                  const b = buses.find((x) => String(x.id) === val);
                  setAllotmentModalData({
                    ...allotmentModalData,
                    bus_id: val,
                    current_km: (b as any)?.latest_checkup_km || b?.current_odometer_km || ''
                  });
                }}
                placeholder="Search bus..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
              <input
                type="date"
                value={allotmentModalData.event_date}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, event_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Number / Serial *</label>
              <input
                type="text"
                value={allotmentModalData.tyre_serial_number}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, tyre_serial_number: e.target.value })}
                placeholder="e.g. MRF-2026-001"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From Position</label>
              <select
                value={allotmentModalData.from_position}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, from_position: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="New Stock">New Stock</option>
                <option value="Front Left">Front Left</option>
                <option value="Front Right">Front Right</option>
                <option value="Rear Left Outer">Rear Left Outer</option>
                <option value="Rear Left Inner">Rear Left Inner</option>
                <option value="Rear Right Outer">Rear Right Outer</option>
                <option value="Rear Right Inner">Rear Right Inner</option>
                <option value="Spare">Spare</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To Position *</label>
              <select
                value={allotmentModalData.to_position}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, to_position: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-indigo-900"
              >
                <option value="Front Left">Front Left</option>
                <option value="Front Right">Front Right</option>
                <option value="Rear Left Outer">Rear Left Outer</option>
                <option value="Rear Left Inner">Rear Left Inner</option>
                <option value="Rear Right Outer">Rear Right Outer</option>
                <option value="Rear Right Inner">Rear Right Inner</option>
                <option value="Spare">Spare</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fitted Odometer (KM)</label>
              <input
                type="number"
                value={allotmentModalData.current_km}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, current_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">Target KM Limit *</label>
              <input
                type="number"
                value={allotmentModalData.target_km}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, target_km: Number(e.target.value) })}
                placeholder="10000"
                className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 focus:bg-white outline-none font-mono font-bold text-indigo-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tread Depth (mm)</label>
              <input
                type="number"
                step="0.1"
                value={allotmentModalData.tread_depth_mm}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, tread_depth_mm: Number(e.target.value) })}
                placeholder="10.5"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pressure (PSI)</label>
              <input
                type="number"
                value={allotmentModalData.pressure_psi}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, pressure_psi: Number(e.target.value) })}
                placeholder="110"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Technician</label>
              <input
                type="text"
                value={allotmentModalData.technician}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, technician: e.target.value })}
                placeholder="Technician name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Reason</label>
            <textarea
              rows={2}
              value={allotmentModalData.notes}
              onChange={(e) => setAllotmentModalData({ ...allotmentModalData, notes: e.target.value })}
              placeholder="e.g. Diagonal rotation to equalize front tyre shoulder wear"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAllotmentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
