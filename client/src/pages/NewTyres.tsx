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
  quantity: number;
  tyre_serial_number: string;
  km: number | string;
  present_km?: number | string;
  running_km?: number | string;
  brand: string;
  size: string;
  model?: string;
  supplier?: string;
  invoice_number?: string;
  purchase_cost?: number | string;
  status: 'In Stock' | 'Allocated' | 'Scrapped';
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
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTyre, setEditingTyre] = useState<NewTyre | null>(null);
  const [allottingTyre, setAllottingTyre] = useState<NewTyre | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    tyre_serial_number: '',
    km: '',
    present_km: '',
    brand: 'MRF',
    size: '295/80 R22.5',
    supplier: '',
    invoice_number: '',
    purchase_cost: '',
    status: 'In Stock',
    notes: '',
    tyre_photo_url: '',
    invoice_photo_url: ''
  });

  const [allotmentForm, setAllotmentForm] = useState<any>({
    bus_id: '',
    to_position: 'Front Left',
    current_km: '',
    technician: 'Fleet Workshop',
    notes: ''
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

  const handleOpenAdd = () => {
    setEditingTyre(null);
    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      tyre_serial_number: '',
      km: '',
      present_km: '',
      brand: 'MRF',
      size: '295/80 R22.5',
      supplier: '',
      invoice_number: '',
      purchase_cost: '',
      status: 'In Stock',
      notes: '',
      tyre_photo_url: '',
      invoice_photo_url: ''
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (t: NewTyre) => {
    setEditingTyre(t);
    setFormData({
      purchase_date: t.purchase_date || new Date().toISOString().split('T')[0],
      quantity: t.quantity || 1,
      tyre_serial_number: t.tyre_serial_number || '',
      km: t.km ?? '',
      present_km: t.present_km ?? '',
      brand: t.brand || 'MRF',
      size: t.size || '295/80 R22.5',
      supplier: t.supplier || '',
      invoice_number: t.invoice_number || '',
      purchase_cost: t.purchase_cost ?? '',
      status: t.status || 'In Stock',
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

    try {
      if (editingTyre) {
        await api.updateNewTyre(editingTyre.id, formData);
        success('New tyre record updated!');
      } else {
        await api.createNewTyre(formData);
        success('New tyre added to stock inventory!');
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

  const handleOpenAllot = (nt: NewTyre) => {
    setAllottingTyre(nt);
    const firstBus = buses[0];
    const busKm = Number((firstBus as any)?.latest_checkup_km || firstBus?.current_odometer_km || 0);
    setAllotmentForm({
      bus_id: firstBus ? String(firstBus.id) : '',
      to_position: 'Front Left',
      current_km: busKm,
      technician: 'Fleet Workshop',
      notes: `Allotted new tyre ${nt.tyre_serial_number}`
    });
  };

  const handleConfirmAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allottingTyre || !allotmentForm.bus_id) {
      error('Please select a bus');
      return;
    }

    try {
      const selectedBus = buses.find((b) => String(b.id) === String(allotmentForm.bus_id));
      const busKm = Number((selectedBus as any)?.latest_checkup_km || selectedBus?.current_odometer_km || allotmentForm.current_km || 0);

      await api.updateNewTyre(allottingTyre.id, {
        ...allottingTyre,
        status: 'Allocated',
        allocated_bus_id: Number(allotmentForm.bus_id),
        allocated_bus_number: selectedBus?.bus_number || selectedBus?.registration_number,
        allocated_wheel_position: allotmentForm.to_position,
        present_km: busKm
      });

      await api.createWheelAllotment({
        bus_id: Number(allotmentForm.bus_id),
        action_type: 'Installation',
        event_date: new Date().toISOString().split('T')[0],
        current_km: busKm,
        tyre_serial_number: allottingTyre.tyre_serial_number,
        from_position: 'Warehouse Stock',
        to_position: allotmentForm.to_position,
        technician: allotmentForm.technician || 'Fleet Workshop',
        notes: allotmentForm.notes || `Mounted new tyre ${allottingTyre.tyre_serial_number}`
      }).catch(() => {});

      success(`Tyre ${allottingTyre.tyre_serial_number} allotted to ${selectedBus?.bus_number || 'vehicle'}!`);
      setAllottingTyre(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to allot tyre');
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

  const filteredTyres = useMemo(() => {
    return newTyres.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (t.tyre_serial_number || '').toLowerCase().includes(q) ||
        (t.brand || '').toLowerCase().includes(q) ||
        (t.size || '').toLowerCase().includes(q) ||
        (t.supplier || '').toLowerCase().includes(q) ||
        (t.allocated_bus_number || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [newTyres, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const inStock = newTyres.filter((t) => t.status === 'In Stock').length;
    const allocated = newTyres.filter((t) => t.status === 'Allocated').length;
    const totalCost = newTyres.reduce((acc, t) => acc + (Number(t.purchase_cost) || 0), 0);
    return {
      total: newTyres.length,
      inStock,
      allocated,
      totalCost
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
            Register brand-new tyres in stock, invoice details, specifications, and assign them directly to fleet buses.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tyres</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Purchased inventory</p>
        </div>
        <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">In Stock Ready</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{stats.inStock}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Available for mounting</p>
        </div>
        <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Allocated to Fleet</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats.allocated}</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Currently on vehicles</p>
        </div>
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{stats.totalCost.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Stock investment</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search serial, brand, size, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'In Stock', 'Allocated'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#142B4A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 text-center">S.No</th>
                <th className="py-3 px-3">Purchase Date</th>
                <th className="py-3 px-3">Tyre Serial & Photo</th>
                <th className="py-3 px-3">Brand & Size</th>
                <th className="py-3 px-3">Initial KM</th>
                <th className="py-3 px-3">Present KM</th>
                <th className="py-3 px-3">Cost</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Allocated Bus</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading tyre inventory...</span>
                  </td>
                </tr>
              ) : filteredTyres.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No tyre inventory records found.</span>
                  </td>
                </tr>
              ) : (
                filteredTyres.map((t, idx) => {
                  const initialKm = Number(t.km) || 0;
                  const presentKm = Number(t.present_km) || 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium whitespace-nowrap">{t.purchase_date || '—'}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {t.tyre_photo_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(t.tyre_photo_url!)}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:border-emerald-500 shadow-2xs"
                              title="View tyre photo"
                            >
                              <img src={t.tyre_photo_url} alt={t.tyre_serial_number} className="w-full h-full object-cover" />
                            </button>
                          )}
                          {t.invoice_photo_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(t.invoice_photo_url!)}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-amber-300 bg-amber-50 text-amber-700 shrink-0 flex items-center justify-center cursor-pointer hover:border-amber-500 shadow-2xs"
                              title="View invoice photo"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {t.tyre_serial_number}
                            </span>
                            {t.supplier && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                {t.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">{t.brand}</span>
                        <span className="text-[10px] text-slate-400 block">{t.size}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium">{initialKm.toLocaleString('en-IN')} KM</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                        {presentKm > 0 ? `${presentKm.toLocaleString('en-IN')} KM` : '0 KM'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {t.purchase_cost ? `₹${Number(t.purchase_cost).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : t.status === 'Allocated'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {t.status === 'Allocated' ? (
                          <div>
                            <span className="font-bold text-blue-900">{t.allocated_bus_number || `Bus #${t.allocated_bus_id}`}</span>
                            <span className="text-[10px] text-slate-500 block">{t.allocated_wheel_position || 'Mounted'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">In Warehouse</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {t.status === 'In Stock' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAllot(t)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer shadow-2xs"
                              title="Allot to Bus"
                            >
                              Allot
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete"
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

      {/* Modal: Add/Edit Tyre */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingTyre ? 'Edit New Tyre Stock' : 'Add New Tyre Stock'}
        subtitle="Register brand new tyre purchases, specifications and dealer invoices"
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial KM / Before KM</label>
              <input
                type="number"
                placeholder="0 for fresh tyre"
                value={formData.km}
                onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                placeholder="e.g. 24000"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Dealer</label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Tyres, Hyd"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="In Stock">In Stock (Warehouse)</option>
                <option value="Allocated">Allocated (On Vehicle)</option>
                <option value="Scrapped">Scrapped</option>
              </select>
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
              <span>Save Tyre Stock</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Allot to Vehicle */}
      <Modal
        isOpen={!!allottingTyre}
        onClose={() => setAllottingTyre(null)}
        title="Allot New Tyre to Vehicle"
        subtitle={`Assign tyre ${allottingTyre?.tyre_serial_number} (${allottingTyre?.brand} ${allottingTyre?.size}) to a bus wheel`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAllotment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Bus / Vehicle *</label>
            <select
              required
              value={allotmentForm.bus_id}
              onChange={(e) => {
                const bId = e.target.value;
                const foundBus = buses.find((b) => String(b.id) === String(bId));
                const busKm = Number((foundBus as any)?.latest_checkup_km || foundBus?.current_odometer_km || 0);
                setAllotmentForm((prev: any) => ({
                  ...prev,
                  bus_id: bId,
                  current_km: busKm
                }));
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose fleet vehicle --</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bus_number} {b.registration_number ? `(${b.registration_number})` : ''} — {b.model || b.make || 'Bus'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Wheel Position *</label>
            <select
              value={allotmentForm.to_position}
              onChange={(e) => setAllotmentForm({ ...allotmentForm, to_position: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Front Left">Front Left</option>
              <option value="Front Right">Front Right</option>
              <option value="Rear Left Outer">Rear Left Outer</option>
              <option value="Rear Left Inner">Rear Left Inner</option>
              <option value="Rear Right Outer">Rear Right Outer</option>
              <option value="Rear Right Inner">Rear Right Inner</option>
              <option value="Spare / Stepney">Spare / Stepney</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Present Odometer Reading (KM)
              <span className="text-[10px] text-blue-600 font-semibold ml-1">(Synced from Daily Vehicle Checkup)</span>
            </label>
            <input
              type="number"
              required
              value={allotmentForm.current_km}
              onChange={(e) => setAllotmentForm({ ...allotmentForm, current_km: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Mechanic</label>
            <input
              type="text"
              value={allotmentForm.technician}
              onChange={(e) => setAllotmentForm({ ...allotmentForm, technician: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAllottingTyre(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Allotment</span>
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
