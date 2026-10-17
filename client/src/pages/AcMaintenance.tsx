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
  ThermometerSnowflake
} from 'lucide-react';
import { api } from '../services/api';
import type { AcRecord, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const AcMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<AcRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    current_km: '',
    ac_working_status: 'Working',
    cooling_performance: '',
    refrigerant_check: '',
    filter_cleaning_replacement: '',
    compressor_condition: '',
    leak_inspection: '',
    electrical_check: '',
    issue_description: '',
    work_performed: '',
    service_provider: '',
    next_service_date: '',
    next_service_km: '',
    service_cost: '',
    technician: '',
    status: 'Completed',
    remarks: ''
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

  const handleOpenAdd = () => {
    const firstBus = buses[0];
    const currentKm = firstBus ? firstBus.current_odometer_km : 50000;
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      inspection_date: new Date().toISOString().split('T')[0],
      current_km: currentKm,
      ac_working_status: 'Working',
      cooling_performance: 'Good (Cabin 21°C)',
      refrigerant_check: 'Normal (R134a 45 psi)',
      filter_cleaning_replacement: 'Cleaned return air filters',
      compressor_condition: 'Good & Quiet',
      leak_inspection: 'No leaks found',
      electrical_check: 'Clutch and blower normal',
      issue_description: '',
      work_performed: 'Routine monthly checkup and filter wash',
      service_provider: 'Subzero AC Solutions',
      next_service_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_service_km: currentKm + 10000,
      service_cost: 3200,
      technician: 'Naveen Kumar',
      status: 'Completed',
      remarks: 'AC running at full cooling efficiency'
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id) {
      error('Please select a bus');
      return;
    }
    try {
      await api.createAcRecord(formData);
      success('AC maintenance inspection saved!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save AC service record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-cyan-600" />
            <span>Air Conditioning Maintenance & Gas Service</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log refrigerant pressure, cooling performance, compressor condition, and filter cleaning history.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log AC Service</span>
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

        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
          <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
          <span>Recommended AC Inspection Interval: Every 10,000 KM</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Working Status</th>
                <th className="py-3 px-4">Cooling Performance</th>
                <th className="py-3 px-4">Gas / Refrigerant</th>
                <th className="py-3 px-4">Filters & Compressor</th>
                <th className="py-3 px-4">Technician / Vendor</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Next Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading AC service records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No AC maintenance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{r.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{r.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.inspection_date}</td>
                    <td className="py-3 px-4">
                      <Badge status={r.ac_working_status} />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.cooling_performance}</td>
                    <td className="py-3 px-4 text-slate-600">{r.refrigerant_check}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{r.filter_cleaning_replacement}</span>
                      <span className="block text-[10px] text-slate-400">{r.compressor_condition}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{r.technician || r.service_provider}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ₹{r.service_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">
                      {r.next_service_km ? `${r.next_service_km.toLocaleString()} km` : r.next_service_date || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add AC Service Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record AC Maintenance Service"
        subtitle="Log refrigerant charge, filter status and cabin cooling efficiency"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Date *</label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
              <input
                type="number"
                value={formData.current_km}
                onChange={(e) => setFormData({ ...formData, current_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Working Status *</label>
              <select
                value={formData.ac_working_status}
                onChange={(e) => setFormData({ ...formData, ac_working_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Working">Working</option>
                <option value="Needs Inspection">Needs Inspection</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cooling Performance</label>
              <input
                type="text"
                value={formData.cooling_performance}
                onChange={(e) => setFormData({ ...formData, cooling_performance: e.target.value })}
                placeholder="Good (Cabin 21°C)"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gas / Refrigerant Check</label>
              <input
                type="text"
                value={formData.refrigerant_check}
                onChange={(e) => setFormData({ ...formData, refrigerant_check: e.target.value })}
                placeholder="R134a 45 psi"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Filter Cleaning / Replacement</label>
              <input
                type="text"
                value={formData.filter_cleaning_replacement}
                onChange={(e) => setFormData({ ...formData, filter_cleaning_replacement: e.target.value })}
                placeholder="Washed return filters"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Compressor Condition</label>
              <input
                type="text"
                value={formData.compressor_condition}
                onChange={(e) => setFormData({ ...formData, compressor_condition: e.target.value })}
                placeholder="Good & belt tight"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Provider / Tech</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                placeholder="Subzero AC / Naveen"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Cost (₹)</label>
              <input
                type="number"
                value={formData.service_cost}
                onChange={(e) => setFormData({ ...formData, service_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Service Due (KM)</label>
              <input
                type="number"
                value={formData.next_service_km}
                onChange={(e) => setFormData({ ...formData, next_service_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Performed & Corrective Actions</label>
            <textarea
              rows={2}
              value={formData.work_performed}
              onChange={(e) => setFormData({ ...formData, work_performed: e.target.value })}
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              Save AC Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
