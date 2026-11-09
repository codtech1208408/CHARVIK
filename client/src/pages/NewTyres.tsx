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
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import type { Bus as BusType } from '../types';

interface NewTyre {
  id: number;
  purchase_date: string;
  vehicle_number?: string;
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tyresData, busesData] = await Promise.all([
        api.getNewTyres().catch(() => []),
        api.getBuses().catch(() => [])
      ]);
      setNewTyres(tyresData || []);
      setBuses(busesData || []);
    } catch (err: any) {
      error(err.message || 'Failed to load new tyre inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vNumber: string) => {
    const cleanReg = (vNumber || '').split('(')[0].trim();
    const matchedBus = buses.find(
      (b) => {
        const bReg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
        return bReg === cleanReg || String(b.id) === cleanReg;
      }
    );
    const busKm = Number((matchedBus as any)?.latest_checkup_km || matchedBus?.current_odometer_km || 0);

    setFormData((prev: any) => ({
      ...prev,
      vehicle_number: cleanReg,
      allocated_bus_id: matchedBus ? matchedBus.id : prev.allocated_bus_id,
      allocated_bus_number: cleanReg,
      total_km: busKm > 0 ? busKm : prev.total_km
    }));
  };

  const handleOpenAdd = () => {
    setEditingTyre(null);
    const firstBus = buses[0];
    const initialReg = (firstBus?.registration_number || firstBus?.bus_number || '').split('(')[0].trim();
    const initialKm = Number((firstBus as any)?.latest_checkup_km || firstBus?.current_odometer_km || 0);

    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      vehicle_number: initialReg,
      allocated_bus_id: firstBus ? firstBus.id : undefined,
      allocated_bus_number: initialReg,
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
    const cleanVehicle = (t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? (buses.find(b => b.id === t.allocated_bus_id)?.registration_number || `Bus #${t.allocated_bus_id}`) : '') || '').split('(')[0].trim();
    const currentKm = t.total_km ?? t.km ?? t.present_km ?? '';

    setFormData({
      purchase_date: t.purchase_date || new Date().toISOString().split('T')[0],
      vehicle_number: cleanVehicle,
      allocated_bus_id: t.allocated_bus_id,
      allocated_bus_number: cleanVehicle,
      total_km: currentKm,
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

  const handleSaveTyre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tyre_serial_number) {
      error('Tyre serial number is required');
      return;
    }
    if (!formData.vehicle_number) {
      error('Please select or enter vehicle number');
      return;
    }

    const cleanVehicle = (formData.vehicle_number || '').split('(')[0].trim();
    const kmVal = Number(formData.total_km) || 0;

    const payload = {
      ...formData,
      vehicle_number: cleanVehicle,
      allocated_bus_number: cleanVehicle,
      total_km: kmVal,
      km: kmVal,
      present_km: kmVal,
      status: 'Allocated'
    };

    try {
      if (editingTyre) {
        await api.updateNewTyre(editingTyre.id, payload);
        success('Tyre record updated!');
      } else {
        await api.createNewTyre(payload);
        success('New tyre registered with vehicle!');
      }
      setIsAddEditModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save new tyre');
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
            placeholder="Search serial, vehicle, brand, size..."
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
                <th className="py-2.5 px-3">Total KM</th>
                <th className="py-2.5 px-3">Tyre Serial & Photo</th>
                <th className="py-2.5 px-3">Brand & Size</th>
                <th className="py-2.5 px-3">Supplier / Notes</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading tyre inventory...</span>
                  </td>
                </tr>
              ) : filteredTyres.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No tyre inventory records found.</span>
                  </td>
                </tr>
              ) : (
                filteredTyres.map((t, idx) => {
                  const vehicleNum = (t.vehicle_number || t.allocated_bus_number || (t.allocated_bus_id ? (buses.find(b => b.id === t.allocated_bus_id)?.registration_number || `Bus #${t.allocated_bus_id}`) : '') || '—').split('(')[0].trim();
                  const totalKmVal = Number(t.total_km ?? t.km ?? t.present_km) || 0;

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
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 text-sm">
                        {totalKmVal > 0 ? `${totalKmVal.toLocaleString('en-IN')} KM` : '0 KM'}
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
                        <span className="font-bold text-slate-800 text-sm">{t.brand}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">{t.size}</span>
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
        <form onSubmit={handleSaveTyre} className="space-y-4">
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
                    <option key={b.id} value={reg}>
                      {reg}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total KM *
                <span className="text-[10px] text-emerald-600 font-medium ml-1">(Synced from vehicle checkup)</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 45000"
                value={formData.total_km}
                onChange={(e) => setFormData({ ...formData, total_km: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Serial Number *</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Size Specification</label>
              <input
                type="text"
                placeholder="e.g. 295/80 R22.5"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
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
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Tyre Record</span>
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
