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
  Gauge,
  Upload,
  Image as ImageIcon,
  Camera,
  Receipt,
  FileText,
  X,
  Wind,
  RefreshCw
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { auditLogger } from '../services/auditLogger';
import type { TyreRecord, Bus as BusType, NewTyre, WheelAllotment } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { SearchableSelect } from '../components/common/SearchableSelect';

export const TyreMaintenance: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'maintenance' | 'new_tyres' | 'allotment_rotation' | 'air_checkup'
  const tabParam = searchParams.get('tab');
  const activeTab: 'maintenance' | 'new_tyres' | 'allotment_rotation' | 'air_checkup' =
    tabParam === 'new_tyres' || tabParam === 'allotment_rotation' || tabParam === 'air_checkup'
      ? tabParam
      : 'maintenance';

  const handleTabChange = (newTab: 'maintenance' | 'new_tyres' | 'allotment_rotation' | 'air_checkup') => {
    setSearchParams({ tab: newTab });
    auditLogger.log({
      user: 'Admin',
      module: 'Tyre Maintenance',
      action_type: 'Tab Switch',
      description: `Switched to ${newTab === 'air_checkup' ? 'Tyre Air Checkup' : newTab === 'allotment_rotation' ? 'Wheel Allotment & Tyre Rotation' : newTab}`
    });
  };

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
  const [uploadingTyrePhoto, setUploadingTyrePhoto] = useState(false);
  const [uploadingInvoicePhoto, setUploadingInvoicePhoto] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  const [newTyreForm, setNewTyreForm] = useState<any>({
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    tyre_serial_number: '',
    km: '',
    present_km: '',
    brand: 'MRF',
    size: '295/80 R22.5',
    supplier: '',
    invoice_number: '',
    tyre_photo_url: '',
    invoice_photo_url: '',
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

  // Helper to add N days to date string
  const addDaysToDate = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Wheel Allotment Renewal State
  const [renewingAllotment, setRenewingAllotment] = useState<WheelAllotment | null>(null);
  const [renewAllotmentData, setRenewAllotmentData] = useState({
    event_date: new Date().toISOString().split('T')[0],
    current_km: '',
    target_km: 10000,
    notes: ''
  });

  // TAB 4: TYRE AIR CHECKUP DATA
  const [airCheckups, setAirCheckups] = useState<any[]>([]);
  const [airSearch, setAirSearch] = useState('');
  const [airBusFilter, setAirBusFilter] = useState('');
  const [airStatusFilter, setAirStatusFilter] = useState('all');
  const [isAirModalOpen, setIsAirModalOpen] = useState(false);
  const [editingAirCheckup, setEditingAirCheckup] = useState<any | null>(null);
  const [renewingAirCheckup, setRenewingAirCheckup] = useState<any | null>(null);

  const [airFormData, setAirFormData] = useState<any>({
    bus_id: '',
    checkup_date: new Date().toISOString().split('T')[0],
    expiry_date: addDaysToDate(new Date().toISOString().split('T')[0], 4),
    pressure_psi: 110,
    technician: 'Fleet Team',
    remarks: ''
  });

  const [renewAirData, setRenewAirData] = useState({
    checkup_date: new Date().toISOString().split('T')[0],
    expiry_date: addDaysToDate(new Date().toISOString().split('T')[0], 4),
    pressure_psi: 110,
    technician: 'Fleet Team',
    remarks: ''
  });

  // Load Initial Data
  useEffect(() => {
    loadAllData();
  }, [selectedBus, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tyreData, busesData, newTyresData, allotmentsData, airData] = await Promise.all([
        api.getTyreRecords({ bus_id: selectedBus || undefined }).catch(() => []),
        api.getBuses().catch(() => []),
        api.getNewTyres().catch(() => []),
        api.getWheelAllotments().catch(() => []),
        api.getTyreAirCheckups().catch(() => [])
      ]);
      setTyres(tyreData || []);
      setBuses(busesData || []);
      setNewTyres(newTyresData || []);
      setAllotments(allotmentsData || []);
      setAirCheckups(airData || []);
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
      supplier: '',
      invoice_number: '',
      tyre_photo_url: '',
      invoice_photo_url: '',
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
      supplier: nt.supplier || nt.supplier_name || '',
      invoice_number: nt.invoice_number || '',
      tyre_photo_url: nt.tyre_photo_url || '',
      invoice_photo_url: nt.invoice_photo_url || '',
      status: nt.status || 'In Stock',
      notes: nt.notes || ''
    });
    setIsNewTyreModalOpen(true);
  };

  const handleTyrePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingTyrePhoto(true);
      const res = await api.uploadFile(file);
      const photoUrl = res.fileUrl || res.url || '';
      setNewTyreForm((prev: any) => ({ ...prev, tyre_photo_url: photoUrl }));
      success('Tyre photo uploaded successfully');
    } catch (err: any) {
      error(err.message || 'Failed to upload tyre photo');
    } finally {
      setUploadingTyrePhoto(false);
    }
  };

  const handleInvoicePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingInvoicePhoto(true);
      const res = await api.uploadFile(file);
      const photoUrl = res.fileUrl || res.url || '';
      setNewTyreForm((prev: any) => ({ ...prev, invoice_photo_url: photoUrl }));
      success('Invoice photo uploaded successfully');
    } catch (err: any) {
      error(err.message || 'Failed to upload invoice photo');
    } finally {
      setUploadingInvoicePhoto(false);
    }
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
    if (!allotmentModalData.bus_id) {
      error('Please select a vehicle');
      return;
    }
    const payload = {
      ...allotmentModalData,
      tyre_serial_number: allotmentModalData.tyre_serial_number || 'Tyre'
    };
    try {
      if (editingAllotment) {
        await api.updateWheelAllotment(editingAllotment.id, payload);
        success('Allotment / Rotation record updated!');
      } else {
        await api.createWheelAllotment(payload);
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

  // Wheel Allotment Renewal Handlers
  const handleOpenRenewAllotment = (w: WheelAllotment) => {
    const bus = buses.find((b) => b.id === w.bus_id);
    const busKm = (bus as any)?.latest_checkup_km || bus?.current_odometer_km || w.current_km || '';
    setRenewingAllotment(w);
    setRenewAllotmentData({
      event_date: new Date().toISOString().split('T')[0],
      current_km: busKm,
      target_km: w.target_km || 10000,
      notes: `Tyre rotation renewed and cycle reset at ${busKm} KM`
    });
  };

  const handleSaveRenewAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingAllotment) return;
    try {
      await api.renewWheelAllotment(renewingAllotment.id, renewAllotmentData);
      auditLogger.log({
        user: 'Admin',
        module: 'Wheel Allotment',
        action_type: 'Renewal',
        description: `Renewed tyre rotation for ${renewingAllotment.bus_number || 'Vehicle'} at ${renewAllotmentData.current_km} KM. Target: ${renewAllotmentData.target_km} KM`
      });
      success(`Tyre rotation renewed for ${renewingAllotment.bus_number || 'vehicle'}!`);
      setRenewingAllotment(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to renew rotation');
    }
  };

  // TAB 4 HANDLERS: TYRE AIR CHECKUP
  const handleOpenAddAirCheckup = () => {
    setEditingAirCheckup(null);
    const firstBus = buses[0];
    const today = new Date().toISOString().split('T')[0];
    setAirFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      checkup_date: today,
      expiry_date: addDaysToDate(today, 4),
      pressure_psi: 110,
      technician: 'Fleet Team',
      remarks: ''
    });
    setIsAirModalOpen(true);
  };

  const handleOpenEditAirCheckup = (record: any) => {
    setEditingAirCheckup(record);
    setAirFormData({
      bus_id: String(record.bus_id),
      checkup_date: record.checkup_date || new Date().toISOString().split('T')[0],
      expiry_date: record.expiry_date || addDaysToDate(new Date().toISOString().split('T')[0], 4),
      pressure_psi: record.pressure_psi || 110,
      technician: record.technician || 'Fleet Team',
      remarks: record.remarks || ''
    });
    setIsAirModalOpen(true);
  };

  const handleSaveAirCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!airFormData.bus_id) {
      error('Please select a vehicle');
      return;
    }
    try {
      if (editingAirCheckup) {
        await api.updateTyreAirCheckup(editingAirCheckup.id, airFormData);
        auditLogger.log({
          user: 'Admin',
          module: 'Tyre Air Checkup',
          action_type: 'Update',
          description: `Updated tyre air checkup for Bus #${airFormData.bus_id}`
        });
        success('Tyre air checkup updated!');
      } else {
        await api.createTyreAirCheckup(airFormData);
        auditLogger.log({
          user: 'Admin',
          module: 'Tyre Air Checkup',
          action_type: 'Create',
          description: `Logged new tyre air checkup for Bus #${airFormData.bus_id} (${airFormData.pressure_psi} PSI)`
        });
        success('Tyre air checkup recorded!');
      }
      setIsAirModalOpen(false);
      setEditingAirCheckup(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to save tyre air checkup');
    }
  };

  const handleOpenRenewAir = (record: any) => {
    const today = new Date().toISOString().split('T')[0];
    setRenewingAirCheckup(record);
    setRenewAirData({
      checkup_date: today,
      expiry_date: addDaysToDate(today, 4),
      pressure_psi: record.pressure_psi || 110,
      technician: record.technician || 'Fleet Team',
      remarks: `Air pressure inspected and renewed on ${today}`
    });
  };

  const handleSaveRenewAir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingAirCheckup) return;
    try {
      await api.renewTyreAirCheckup(renewingAirCheckup.id, renewAirData);
      auditLogger.log({
        user: 'Admin',
        module: 'Tyre Air Checkup',
        action_type: 'Renewal',
        description: `Renewed tyre air checkup for ${renewingAirCheckup.bus_number || 'Vehicle'} (Expiry: ${renewAirData.expiry_date})`
      });
      success(`Tyre air checkup renewed for ${renewingAirCheckup.bus_number || 'vehicle'}!`);
      setRenewingAirCheckup(null);
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to renew air checkup');
    }
  };

  const handleDeleteAirCheckup = async (id: number | string) => {
    if (!window.confirm('Delete this tyre air checkup record?')) return;
    try {
      await api.deleteTyreAirCheckup(id);
      auditLogger.log({
        user: 'Admin',
        module: 'Tyre Air Checkup',
        action_type: 'Delete',
        description: `Deleted tyre air checkup record #${id}`
      });
      success('Air checkup deleted!');
      loadAllData();
    } catch (err: any) {
      error(err.message || 'Failed to delete air checkup');
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
      {/* 1. TOP HEADER: TYRE MAINTENANCE & INSPECTION TRACKING */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#142B4A]">
            <Disc className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#142B4A]">Tyre Maintenance & Inspection Tracking</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor tread depth, tyre pressure, positions, rotations, and replacement history per bus.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL TABS (BELOW THE HEADER) */}
      {/* ========================================================================= */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center overflow-x-auto">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => handleTabChange('maintenance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-[#142B4A] text-white shadow-sm ring-1 ring-[#142B4A]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Tyre Maintenance</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('new_tyres')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'new_tyres'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>New Tyres</span>
            {newTyres.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'new_tyres' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {newTyres.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('allotment_rotation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'allotment_rotation'
                ? 'bg-[#142B4A] text-white shadow-sm ring-1 ring-[#142B4A]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Wheel Allotment & Tyre Rotation</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('air_checkup')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'air_checkup'
                ? 'bg-[#142B4A] text-white shadow-sm ring-1 ring-[#142B4A]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Tyre Air Checkup</span>
            {airCheckups.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'air_checkup' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {airCheckups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TYRE MAINTENANCE & INSPECTION TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">

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
                    <th className="py-3 px-4">TOTAL KM RUNNING</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading new tyre inventory...
                      </td>
                    </tr>
                  ) : filteredNewTyres.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        No new tyre stock records found. Click "+ Add New Tyre Stock" to register new purchases.
                      </td>
                    </tr>
                  ) : (
                    filteredNewTyres.map((nt, index) => {
                      const initialKm = Number(nt.km) || 0;
                      const presentKm = nt.present_km !== undefined && nt.present_km !== null && nt.present_km !== '' ? Number(nt.present_km) : 0;
                      const totalKmRunning = initialKm + presentKm;
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
                            <div className="flex items-center gap-2">
                              {nt.tyre_photo_url ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhotoModal(nt.tyre_photo_url!)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 cursor-pointer flex-shrink-0 group relative shadow-2xs"
                                  title="Click to view tyre photo"
                                >
                                  <img src={nt.tyre_photo_url} alt={nt.tyre_serial_number} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </button>
                              ) : null}
                              {nt.invoice_photo_url ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhotoModal(nt.invoice_photo_url!)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-amber-300 hover:border-amber-500 cursor-pointer flex-shrink-0 group relative shadow-2xs bg-amber-50 flex items-center justify-center text-amber-700"
                                  title="Click to view invoice photo"
                                >
                                  <img src={nt.invoice_photo_url} alt="Invoice" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </button>
                              ) : null}
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs">
                                    {nt.tyre_serial_number}
                                  </span>
                                  {nt.invoice_photo_url && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhotoModal(nt.invoice_photo_url!)}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                      title="View invoice photo"
                                    >
                                      <Receipt className="w-3 h-3 text-amber-600" />
                                      <span>Invoice</span>
                                    </button>
                                  )}
                                </div>
                                {nt.supplier && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                                    {nt.supplier}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* 4. KM (Initial / Before KM) */}
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
                          {/* 6. TOTAL KM RUNNING (Before KM + Present KM Running) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-emerald-700 block text-xs">
                              {totalKmRunning > 0 ? `${totalKmRunning.toLocaleString('en-IN')} KM` : '0 KM'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              ({initialKm.toLocaleString('en-IN')} + {presentKm.toLocaleString('en-IN')})
                            </span>
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
                    <th className="py-3 px-4">WORKING DATE</th>
                    <th className="py-3 px-4">VEHICLE NUMBER</th>
                    <th className="py-3 px-4">PRESENT KM</th>
                    <th className="py-3 px-4">TARGET KM</th>
                    <th className="py-3 px-4">TOTAL TYRE KM</th>
                    <th className="py-3 px-4">TYRE PENDING KM</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading wheel allotment and rotation history...
                      </td>
                    </tr>
                  ) : filteredAllotments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
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
                      const isDueSoon = !isLimitReached && totalTyreKm >= targetKm * 0.8;

                      return (
                        <tr key={w.id} className={`hover:bg-slate-50/80 transition-colors ${isLimitReached ? 'bg-rose-50/20' : ''}`}>
                          {/* 1. S.NO */}
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>

                          {/* 2. WORKING DATE */}
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

                          {/* 4. PRESENT KM */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {fittedKm > 0 ? `${fittedKm.toLocaleString('en-IN')} KM` : '0 KM'}
                          </td>

                          {/* 5. TARGET KM */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                              {targetKm.toLocaleString('en-IN')} KM
                            </span>
                          </td>

                          {/* 6. TOTAL TYRE KM */}
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

                          {/* 7. TYRE PENDING KM */}
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

                          {/* 8. STATUS (Replaced ACTION TYPE) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isLimitReached ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Expired (Limit Reached)</span>
                              </span>
                            ) : isDueSoon ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending ({pendingKm.toLocaleString('en-IN')} KM Left)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Active ({pendingKm.toLocaleString('en-IN')} KM Left)</span>
                              </span>
                            )}
                          </td>

                          {/* 9. ACTIONS with RENEWAL OPTION */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenRenewAllotment(w)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                  isLimitReached
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : isDueSoon
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                                title="Renew / Rotate Tyre Cycle"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Renew / Rotate</span>
                              </button>
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
      {/* TAB 4: TYRE AIR CHECKUP & PRESSURE TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'air_checkup' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" />
                <span>Tyre Air Checkup & Pressure Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Maintain optimal tyre pressure (PSI), track inspection dates, monitor air validity expiry, and execute instant renewals.
              </p>
            </div>

            <button
              onClick={handleOpenAddAirCheckup}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Air Checkup</span>
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Air Logs</p>
                <h3 className="text-2xl font-black text-[#142B4A] mt-1">{airCheckups.length}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Recorded pressure checks</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valid & Active</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {airCheckups.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    return a.expiry_date && a.expiry_date > today;
                  }).length}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Pressure compliant</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending / Due Soon</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {airCheckups.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    if (!a.expiry_date || a.expiry_date <= today) return false;
                    const diffDays = Math.ceil((new Date(a.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
                    return diffDays <= 3;
                  }).length}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Expires within 3 days</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Air Check Expired</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {airCheckups.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    return !a.expiry_date || a.expiry_date <= today || a.status === 'Expired';
                  }).length}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Immediate pressure check due</p>
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
                  value={airBusFilter}
                  onChange={(e) => setAirBusFilter(e.target.value)}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Filter</label>
                <select
                  value={airStatusFilter}
                  onChange={(e) => setAirStatusFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Expired">Expired Only</option>
                </select>
              </div>

              <div className="w-full sm:w-60">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Air Logs</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search technician, notes..."
                    value={airSearch}
                    onChange={(e) => setAirSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Standard Air Check Validity: 7 Days</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">S.NO</th>
                    <th className="py-3 px-4">VEHICLE NUMBER</th>
                    <th className="py-3 px-4">AIR CHECKUP DATE</th>
                    <th className="py-3 px-4">EXPIRY DATE</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {airCheckups
                    .filter((a) => {
                      if (airBusFilter && String(a.bus_id) !== String(airBusFilter)) return false;
                      const today = new Date().toISOString().split('T')[0];
                      const isExpired = !a.expiry_date || a.expiry_date <= today || a.status === 'Expired';
                      let diffDays = null;
                      if (a.expiry_date) {
                        diffDays = Math.ceil((new Date(a.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
                      }
                      const isPending = !isExpired && diffDays !== null && diffDays <= 3;
                      const computedStatus = isExpired ? 'Expired' : isPending ? 'Pending' : 'Active';
                      if (airStatusFilter !== 'all' && computedStatus !== airStatusFilter) return false;
                      if (airSearch) {
                        const q = airSearch.toLowerCase();
                        const matchBus = (a.bus_number || '').toLowerCase().includes(q);
                        const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
                        if (!matchBus && !matchRemarks) return false;
                      }
                      return true;
                    })
                    .map((a, index) => {
                      const bus = buses.find((b) => b.id === a.bus_id);
                      const busName = a.bus_number || bus?.bus_number || (a.bus_id ? `Bus #${a.bus_id}` : '-');
                      const regName = a.registration_number || bus?.registration_number;

                      const today = new Date().toISOString().split('T')[0];
                      const isExpired = !a.expiry_date || a.expiry_date <= today || a.status === 'Expired';
                      let diffDays: number | null = null;
                      if (a.expiry_date) {
                        diffDays = Math.ceil((new Date(a.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
                      }
                      const isPending = !isExpired && diffDays !== null && diffDays <= 3;

                      return (
                        <tr key={a.id || index} className={`hover:bg-slate-50/80 transition-colors ${isExpired ? 'bg-rose-50/20' : ''}`}>
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-black font-mono text-blue-600 block text-xs tracking-wider">
                              {busName}
                            </span>
                            {regName && <span className="text-[10px] text-slate-400 font-medium block">{regName}</span>}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {a.checkup_date || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-black ${isExpired ? 'text-rose-600 underline' : isPending ? 'text-amber-600' : 'text-slate-800'}`}>
                              {a.expiry_date || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Expired</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending ({diffDays}d left)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Active ({diffDays}d left)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenRenewAir(a)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                  isExpired
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title="Renew Tyre Air Checkup"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Renew Air</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditAirCheckup(a)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Checkup"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAirCheckup(a.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Checkup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {airCheckups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Gauge className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        No tyre air checkup records logged yet. Click "+ Log Air Checkup" to add one.
                      </td>
                    </tr>
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

          {/* Live Total KM Running banner */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Total KM Running (Before + Present):</span>
            </div>
            <span className="text-sm font-black font-mono text-emerald-700">
              {((Number(newTyreForm.km) || 0) + (Number(newTyreForm.present_km) || 0)).toLocaleString('en-IN')} KM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
            <input
              type="text"
              value={newTyreForm.supplier}
              onChange={(e) => setNewTyreForm({ ...newTyreForm, supplier: e.target.value })}
              placeholder="e.g. Apex Tyre Agency"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          {/* Upload Photos Grid: Tyre Photo and Invoice Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tyre Upload Photo Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                Upload Tyre Photo
              </label>
              {newTyreForm.tyre_photo_url ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <img
                    src={newTyreForm.tyre_photo_url}
                    alt="Tyre preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Tyre Photo Attached</p>
                    <p className="text-[10px] text-slate-500 truncate">{newTyreForm.tyre_photo_url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewTyreForm((prev: any) => ({ ...prev, tyre_photo_url: '' }))}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-50/20 transition-all cursor-pointer h-[88px]">
                  {uploadingTyrePhoto ? (
                    <div className="flex flex-col items-center gap-1 text-emerald-600 py-1">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] font-bold">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700 text-center">Click to upload tyre photo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTyrePhotoUpload}
                    disabled={uploadingTyrePhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Invoice Upload Photo Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                Upload Invoice Photo
              </label>
              {newTyreForm.invoice_photo_url ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <img
                    src={newTyreForm.invoice_photo_url}
                    alt="Invoice preview"
                    className="w-14 h-14 object-cover rounded-lg border border-amber-200 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-900">Invoice Photo Attached</p>
                    <p className="text-[10px] text-amber-700/80 truncate">{newTyreForm.invoice_photo_url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewTyreForm((prev: any) => ({ ...prev, invoice_photo_url: '' }))}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove invoice photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl bg-slate-50 hover:bg-amber-50/20 transition-all cursor-pointer h-[88px]">
                  {uploadingInvoicePhoto ? (
                    <div className="flex flex-col items-center gap-1 text-amber-600 py-1">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] font-bold">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5 text-amber-500/80 mb-1" />
                      <span className="text-xs font-bold text-slate-700 text-center">Click to upload invoice photo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInvoicePhotoUpload}
                    disabled={uploadingInvoicePhoto}
                    className="hidden"
                  />
                </label>
              )}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Working Date *</label>
              <input
                type="date"
                value={allotmentModalData.event_date}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, event_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Present KM</label>
              <input
                type="number"
                value={allotmentModalData.current_km}
                onChange={(e) => setAllotmentModalData({ ...allotmentModalData, current_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold"
                placeholder="e.g. 45000"
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

      {/* PHOTO PREVIEW MODAL */}
      <Modal
        isOpen={!!previewPhotoModal}
        onClose={() => setPreviewPhotoModal(null)}
        title="Photo / Document Preview"
        subtitle="Full resolution tyre inspection or invoice photo"
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col items-center p-2">
          {previewPhotoModal && (
            <img
              src={previewPhotoModal}
              alt="Enlarged tyre preview"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-200 shadow-md"
            />
          )}
          <div className="w-full flex justify-end mt-4">
            <button
              type="button"
              onClick={() => setPreviewPhotoModal(null)}
              className="px-4 py-2 bg-[#142B4A] text-white rounded-xl text-xs font-bold hover:bg-[#1E3A5F] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RENEW WHEEL ALLOTMENT / ROTATION CYCLE */}
      {/* ========================================================================= */}
      {renewingAllotment && (
        <Modal
          isOpen={true}
          onClose={() => setRenewingAllotment(null)}
          title={`Renew Tyre Rotation — ${renewingAllotment.bus_number || 'Vehicle'}`}
          subtitle="Reset tyre rotation kilometer cycle with new present odometer reading"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRenewAllotment} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
              Renewing tyre rotation cycle for <strong className="font-black text-indigo-950">{renewingAllotment.bus_number || `Bus #${renewingAllotment.bus_id}`}</strong>. The starting odometer will reset to the entered Present KM and status will return to Active.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Working Date *</label>
              <input
                type="date"
                required
                value={renewAllotmentData.event_date}
                onChange={(e) => setRenewAllotmentData({ ...renewAllotmentData, event_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Present KM (New Starting Cycle Reading) *</label>
              <input
                type="number"
                required
                value={renewAllotmentData.current_km}
                onChange={(e) => setRenewAllotmentData({ ...renewAllotmentData, current_km: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold"
                placeholder="e.g. 55000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target KM Limit *</label>
              <input
                type="number"
                required
                value={renewAllotmentData.target_km}
                onChange={(e) => setRenewAllotmentData({ ...renewAllotmentData, target_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-indigo-900 outline-none font-mono font-bold"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Reason</label>
              <textarea
                rows={2}
                value={renewAllotmentData.notes}
                onChange={(e) => setRenewAllotmentData({ ...renewAllotmentData, notes: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                placeholder="e.g. Rotated front to rear, cross-diagonal alignment done"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingAllotment(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Rotation Renewal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG / EDIT TYRE AIR CHECKUP */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAirModalOpen}
        onClose={() => {
          setIsAirModalOpen(false);
          setEditingAirCheckup(null);
        }}
        title={editingAirCheckup ? 'Edit Tyre Air Checkup' : 'Log Tyre Air Pressure Checkup'}
        subtitle="Record inspection date, measured PSI, and compute expiry date"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAirCheckup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Vehicle *</label>
            <SearchableSelect
              options={busSelectOptions}
              value={airFormData.bus_id}
              onChange={(val) => setAirFormData({ ...airFormData, bus_id: val })}
              placeholder="Search bus..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Air Checkup Date *</label>
              <input
                type="date"
                required
                value={airFormData.checkup_date}
                onChange={(e) => {
                  const checkup = e.target.value;
                  const expiry = addDaysToDate(checkup, 4);
                  setAirFormData({ ...airFormData, checkup_date: checkup, expiry_date: expiry });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (Auto +4 Days) *</label>
              <input
                type="date"
                required
                value={airFormData.expiry_date}
                onChange={(e) => setAirFormData({ ...airFormData, expiry_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-indigo-900 font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={airFormData.remarks}
              onChange={(e) => setAirFormData({ ...airFormData, remarks: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              placeholder="e.g. Air pressure checked and verified"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAirModalOpen(false);
                setEditingAirCheckup(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingAirCheckup ? 'Update Air Checkup' : 'Save Air Checkup'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RENEW TYRE AIR CHECKUP */}
      {/* ========================================================================= */}
      {renewingAirCheckup && (
        <Modal
          isOpen={true}
          onClose={() => setRenewingAirCheckup(null)}
          title={`Renew Tyre Air Checkup — ${renewingAirCheckup.bus_number || 'Vehicle'}`}
          subtitle="Record new inspection date and renew validity period"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRenewAir} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
              Renewing air pressure checkup for <strong className="font-black text-blue-950">{renewingAirCheckup.bus_number || `Bus #${renewingAirCheckup.bus_id}`}</strong>. The validity will extend to 4 days from checkup date.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Checkup Date *</label>
                <input
                  type="date"
                  required
                  value={renewAirData.checkup_date}
                  onChange={(e) => {
                    const checkup = e.target.value;
                    const expiry = addDaysToDate(checkup, 4);
                    setRenewAirData({ ...renewAirData, checkup_date: checkup, expiry_date: expiry });
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (Auto +4 Days) *</label>
                <input
                  type="date"
                  required
                  value={renewAirData.expiry_date}
                  onChange={(e) => setRenewAirData({ ...renewAirData, expiry_date: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-900 font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={renewAirData.remarks}
                onChange={(e) => setRenewAirData({ ...renewAirData, remarks: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingAirCheckup(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Air Renewal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
