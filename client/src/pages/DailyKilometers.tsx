import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Calendar,
  Bus,
  User,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  Save,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { DailyKmEntry, Bus as BusType, Employee } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const DailyKilometers: React.FC = () => {
  const { success, error } = useToast();

  const [entries, setEntries] = useState<DailyKmEntry[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalDistance: 0, totalEntries: 0 });

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyKmEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    entry_date: new Date().toISOString().split('T')[0],
    bus_id: '',
    driver_id: '',
    opening_km: '',
    closing_km: '',
    remarks: ''
  });

  // Correction Form State
  const [correctionData, setCorrectionData] = useState({
    opening_km: 0,
    closing_km: 0,
    remarks: '',
    correction_reason: '',
    corrected_by: 'Admin'
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedBus, selectedDriver]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kmRes, busesData, empsData] = await Promise.all([
        api.getDailyKm({
          date: selectedDate || undefined,
          bus_id: selectedBus || undefined,
          driver_id: selectedDriver || undefined
        }),
        api.getBuses(),
        api.getEmployees({ role: 'Driver' })
      ]);
      setEntries(kmRes.entries || []);
      setSummary(kmRes.summary || { totalDistance: 0, totalEntries: 0 });
      setBuses(busesData);
      setDrivers(empsData);
    } catch (err: any) {
      error(err.message || 'Failed to load kilometer entries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = async () => {
    const firstBus = buses[0];
    let openKm = 0;
    if (firstBus) {
      try {
        const res = await api.suggestOpeningKm(firstBus.id);
        openKm = res.suggestedOpening || firstBus.current_odometer_km || 0;
      } catch (e) {
        openKm = firstBus.current_odometer_km || 0;
      }
    }

    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      bus_id: firstBus ? String(firstBus.id) : '',
      driver_id: firstBus?.assigned_driver_id ? String(firstBus.assigned_driver_id) : '',
      opening_km: openKm,
      closing_km: '',
      remarks: ''
    });
    setIsAddOpen(true);
  };

  const handleBusChange = async (busId: string) => {
    const bus = buses.find((b) => String(b.id) === busId);
    let openKm = bus ? bus.current_odometer_km : 0;
    try {
      const res = await api.suggestOpeningKm(busId);
      if (res.suggestedOpening) openKm = res.suggestedOpening;
    } catch (e) {
      // fallback
    }

    setFormData((prev) => ({
      ...prev,
      bus_id: busId,
      driver_id: bus?.assigned_driver_id ? String(bus.assigned_driver_id) : prev.driver_id,
      opening_km: openKm,
      closing_km: openKm + 120
    }));
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || formData.opening_km === undefined || formData.closing_km === undefined) {
      error('Please fill in all required fields');
      return;
    }
    if (Number(formData.closing_km) < Number(formData.opening_km)) {
      error('Closing KM cannot be less than Opening KM');
      return;
    }

    try {
      await api.createDailyKm(formData);
      success('Daily kilometer entry recorded successfully!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save kilometer entry');
    }
  };

  const handleOpenEdit = (entry: DailyKmEntry) => {
    setEditingEntry(entry);
    setCorrectionData({
      opening_km: entry.opening_km,
      closing_km: entry.closing_km,
      remarks: entry.remarks || '',
      correction_reason: '',
      corrected_by: 'Super Admin'
    });
    setIsEditOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!correctionData.correction_reason) {
      error('Please provide an authorized reason for this odometer correction.');
      return;
    }

    try {
      await api.correctDailyKm(editingEntry.id, correctionData);
      success('Odometer entry corrected with audit record.');
      setIsEditOpen(false);
      setEditingEntry(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update entry');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this kilometer entry?')) return;
    try {
      await api.deleteDailyKm(id);
      success('Entry deleted.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete');
    }
  };

  const distanceTravelled = Math.max(0, Number(formData.closing_km) - Number(formData.opening_km));
  const correctionDistance = Math.max(0, Number(correctionData.closing_km) - Number(correctionData.opening_km));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <span>Daily Kilometer Entry & Odometer Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily opening and closing odometer readings with automated distance calculation and audit control.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Entry</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Logged Distance</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{summary.totalDistance?.toLocaleString()} KM</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined fleet distance</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Trip Entries</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{summary.totalEntries} Logs</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Audited daily submissions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Daily Shift</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">
              {summary.totalEntries ? Math.round(summary.totalDistance / summary.totalEntries) : 0} KM
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Per bus per service run</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:w-48">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>

        <div className="w-full md:w-60">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Bus</label>
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

        <div className="w-full md:w-60">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Driver</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        {(selectedDate || selectedBus || selectedDriver) && (
          <button
            onClick={() => {
              setSelectedDate('');
              setSelectedBus('');
              setSelectedDriver('');
            }}
            className="self-end text-xs font-semibold text-rose-600 hover:text-rose-700 py-2 cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bus Details</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Opening KM</th>
                <th className="py-3 px-4">Closing KM</th>
                <th className="py-3 px-4">Distance Travelled</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No daily kilometer records found matching the criteria.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.entry_date}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{item.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{item.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {item.driver_name || <span className="text-slate-400 italic">Not recorded</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{item.opening_km.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.closing_km.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        +{item.distance_travelled_km} KM
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate">
                      {item.remarks || '-'}
                      {item.is_corrected === 1 && (
                        <span className="block text-[10px] text-amber-600 font-bold">
                          [Corrected: {item.correction_reason}]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Correct Entry (Requires Audit Reason)"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Log Daily Kilometer Reading"
        subtitle="Automatic distance calculation based on valid opening and closing odometer values"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entry Date *</label>
              <input
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bus *</label>
              <select
                value={formData.bus_id}
                onChange={(e) => handleBusChange(e.target.value)}
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name *</label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              <option value="">-- Select Active Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opening KM Reading *</label>
              <input
                type="number"
                value={formData.opening_km}
                onChange={(e) => setFormData({ ...formData, opening_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Closing KM Reading *</label>
              <input
                type="number"
                value={formData.closing_km}
                onChange={(e) => setFormData({ ...formData, closing_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Real-time Distance Calculated Box */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Calculated Distance Travelled:</span>
            <span className="text-base font-black text-blue-700 font-mono">
              {distanceTravelled} KM
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Route & Operational Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="E.g., Morning corporate transport route and return charter"
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
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Authorized Correction Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Correct Historical Kilometer Entry"
        subtitle="Modifications to odometer records require an administrative audit explanation"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Audit Policy Alert:</p>
              <p>Historical readings alter mileage calculations and bus current odometer status. Every edit is permanently recorded in the audit log.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opening KM</label>
              <input
                type="number"
                value={correctionData.opening_km}
                onChange={(e) => setCorrectionData({ ...correctionData, opening_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Closing KM</label>
              <input
                type="number"
                value={correctionData.closing_km}
                onChange={(e) => setCorrectionData({ ...correctionData, closing_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between font-mono">
            <span>Corrected Distance:</span>
            <span className="font-bold text-slate-900">{correctionDistance} KM</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Correction *</label>
            <input
              type="text"
              value={correctionData.correction_reason}
              onChange={(e) => setCorrectionData({ ...correctionData, correction_reason: e.target.value })}
              placeholder="e.g. Driver typo in closing odometer digit verified against physical logbook"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Corrected By</label>
            <input
              type="text"
              value={correctionData.corrected_by}
              onChange={(e) => setCorrectionData({ ...correctionData, corrected_by: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Commit Correction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
