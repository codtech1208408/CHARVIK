import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Wrench,
  Bus,
  Save,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import type { OilFilterRecord, Bus as BusType } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const OilFilterMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<OilFilterRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    replacement_date: new Date().toISOString().split('T')[0],
    odometer_km: '',
    oil_type: '',
    oil_brand: '',
    oil_quantity_liters: '',
    oil_cost: '',
    oil_filter_replaced: false,
    oil_filter_details: '',
    air_filter_replaced: false,
    air_filter_details: '',
    fuel_filter_replaced: false,
    fuel_filter_details: '',
    other_filter_details: '',
    labour_cost: '',
    service_provider: '',
    next_due_date: '',
    next_due_km: '',
    performed_by: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oilData, busesData] = await Promise.all([
        api.getOilRecords({ bus_id: selectedBus || undefined }),
        api.getBuses()
      ]);
      setRecords(oilData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load oil replacement records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const firstBus = buses[0];
    const currentKm = firstBus ? firstBus.current_odometer_km : '';
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      replacement_date: new Date().toISOString().split('T')[0],
      odometer_km: currentKm,
      oil_type: '',
      oil_brand: '',
      oil_quantity_liters: '',
      oil_cost: '',
      oil_filter_replaced: true,
      oil_filter_details: '',
      air_filter_replaced: false,
      air_filter_details: '',
      fuel_filter_replaced: false,
      fuel_filter_details: '',
      other_filter_details: '',
      labour_cost: '',
      service_provider: '',
      next_due_date: '',
      next_due_km: '',
      performed_by: '',
      remarks: ''
    });
    setIsAddOpen(true);
  };

  const totalCalculated = Number(formData.oil_cost || 0) + Number(formData.labour_cost || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id) {
      error('Please select a bus');
      return;
    }
    try {
      await api.createOilRecord({
        ...formData,
        total_cost: totalCalculated
      });
      success('Oil & Filter replacement record logged!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-600" />
            <span>Oil & Filter / DPF Replacement Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain engine oil, oil filter, air filter, fuel cartridge, and DPF service history with automated costs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Oil & Filter Change</span>
        </button>
      </div>

      {/* Filter */}
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

        <div className="text-xs text-slate-600 font-semibold">
          <span>Standard Oil & Filter Interval: <strong>Every 40,000 KM</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Replacement Date</th>
                <th className="py-3 px-4">Odometer (KM)</th>
                <th className="py-3 px-4">Oil Brand & Grade</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Filters Replaced</th>
                <th className="py-3 px-4">Total Cost (₹)</th>
                <th className="py-3 px-4">Next Due KM</th>
                <th className="py-3 px-4">Mechanic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading oil records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No oil and filter records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{r.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{r.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.replacement_date}</td>
                    <td className="py-3 px-4 font-mono font-medium">{r.odometer_km?.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.oil_brand} {r.oil_type}
                    </td>
                    <td className="py-3 px-4">{r.oil_quantity_liters} Litres</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {r.oil_filter_replaced === 1 && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-bold">Oil</span>
                        )}
                        {r.air_filter_replaced === 1 && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-bold">Air</span>
                        )}
                        {r.fuel_filter_replaced === 1 && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-[10px] font-bold">Fuel</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ₹{r.total_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-blue-700 font-bold font-mono">
                      {r.next_due_km?.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.performed_by || r.service_provider}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Oil & Filter Service"
        subtitle="Log engine lubricant specifications and filter replacements"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bus *</label>
              <select
                value={formData.bus_id}
                onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} ({b.registration_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Replacement Date *</label>
              <input
                type="date"
                value={formData.replacement_date}
                onChange={(e) => setFormData({ ...formData, replacement_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Odometer (KM)</label>
              <input
                type="number"
                value={formData.odometer_km}
                onChange={(e) => setFormData({ ...formData, odometer_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Oil Brand</label>
              <input
                type="text"
                value={formData.oil_brand}
                onChange={(e) => setFormData({ ...formData, oil_brand: e.target.value })}
                placeholder="Castrol / Mobil"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Oil Grade / Type</label>
              <input
                type="text"
                value={formData.oil_type}
                onChange={(e) => setFormData({ ...formData, oil_type: e.target.value })}
                placeholder="15W-40 CI-4"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Checkboxes for filter replacements */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-700">Filter Replacements:</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.oil_filter_replaced}
                  onChange={(e) => setFormData({ ...formData, oil_filter_replaced: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Oil Filter</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.air_filter_replaced}
                  onChange={(e) => setFormData({ ...formData, air_filter_replaced: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Air Filter</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.fuel_filter_replaced}
                  onChange={(e) => setFormData({ ...formData, fuel_filter_replaced: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Fuel Filter</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Oil Cost (₹)</label>
              <input
                type="number"
                value={formData.oil_cost}
                onChange={(e) => setFormData({ ...formData, oil_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Labour Cost (₹)</label>
              <input
                type="number"
                value={formData.labour_cost}
                onChange={(e) => setFormData({ ...formData, labour_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Calculated Total</label>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-900 text-xs">
                ₹{totalCalculated.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Due KM (e.g. +40,000)</label>
              <input
                type="number"
                value={formData.next_due_km}
                onChange={(e) => setFormData({ ...formData, next_due_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Performed By / Mechanic</label>
              <input
                type="text"
                value={formData.performed_by}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              Save Oil & Filter Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
