import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bus,
  Sparkles,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

interface CleaningLog {
  id: number;
  bus_number: string;
  registration_number: string;
  cleaning_type: 'Daily Sweep & Mop' | 'Full Exterior Wash' | 'Deep Seat Sanitization' | 'Complete Disinfection';
  cleaner_name: string;
  cleaned_date: string;
  status: 'Completed' | 'Pending' | 'Needs Re-clean';
  floor_cleaned: boolean;
  seats_vacuumed: boolean;
  windows_polished: boolean;
  exterior_washed: boolean;
  sanitizer_refilled: boolean;
  notes: string;
}

const STORAGE_KEY = 'charvik_cleaning_management_logs';

export const CleaningManagement: React.FC = () => {
  const { success, error } = useToast();

  const [logs, setLogs] = useState<CleaningLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buses, setBuses] = useState<any[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CleaningLog | null>(null);

  const [formData, setFormData] = useState({
    bus_id: '',
    bus_number: '',
    registration_number: '',
    cleaning_type: 'Daily Sweep & Mop' as CleaningLog['cleaning_type'],
    cleaner_name: '',
    cleaned_date: new Date().toISOString().split('T')[0],
    status: 'Completed' as CleaningLog['status'],
    floor_cleaned: true,
    seats_vacuumed: true,
    windows_polished: true,
    exterior_washed: true,
    sanitizer_refilled: true,
    notes: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [bData, hData, cData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getEmployees({ role: 'Helper' }).catch(() => []),
          api.getCleaningRecords().catch(() => [])
        ]);
        setBuses(Array.isArray(bData) ? bData : []);
        setHelpers(Array.isArray(hData) ? hData : []);
        if (Array.isArray(cData) && cData.length > 0) {
          setLogs(cData);
        }
      } catch {}
    }
    loadAuxData();
  }, []);

  const handleOpenAdd = () => {
    setEditingLog(null);
    const firstBus = buses[0];
    const firstHelper = helpers[0];
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      bus_number: firstBus?.bus_number || '',
      registration_number: firstBus?.registration_number || '',
      cleaning_type: 'Daily Sweep & Mop',
      cleaner_name: firstHelper?.full_name || '',
      cleaned_date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      floor_cleaned: true,
      seats_vacuumed: true,
      windows_polished: true,
      exterior_washed: true,
      sanitizer_refilled: true,
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (log: CleaningLog) => {
    setEditingLog(log);
    const bus = buses.find((b) => b.bus_number === log.bus_number);
    setFormData({
      bus_id: bus ? String(bus.id) : '',
      bus_number: log.bus_number,
      registration_number: log.registration_number,
      cleaning_type: log.cleaning_type,
      cleaner_name: log.cleaner_name,
      cleaned_date: log.cleaned_date,
      status: log.status,
      floor_cleaned: log.floor_cleaned,
      seats_vacuumed: log.seats_vacuumed,
      windows_polished: log.windows_polished,
      exterior_washed: log.exterior_washed,
      sanitizer_refilled: log.sanitizer_refilled,
      notes: log.notes
    });
    setIsAddOpen(true);
  };

  const handleBusSelect = (busId: string) => {
    const b = buses.find((item) => String(item.id) === busId);
    setFormData((prev) => ({
      ...prev,
      bus_id: busId,
      bus_number: b?.bus_number || '',
      registration_number: b?.registration_number || ''
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_number && !formData.bus_id) {
      error('Please select a fleet vehicle.');
      return;
    }

    const payload = {
      bus_id: formData.bus_id ? Number(formData.bus_id) : null,
      bus_number: formData.bus_number || `Bus #${formData.bus_id}`,
      registration_number: formData.registration_number || 'TS Fleet Reg',
      cleaning_type: formData.cleaning_type,
      cleaner_name: formData.cleaner_name || 'Depot Staff',
      cleaned_date: formData.cleaned_date,
      status: formData.status,
      floor_cleaned: formData.floor_cleaned,
      seats_vacuumed: formData.seats_vacuumed,
      windows_polished: formData.windows_polished,
      exterior_washed: formData.exterior_washed,
      sanitizer_refilled: formData.sanitizer_refilled,
      notes: formData.notes
    };

    try {
      if (editingLog) {
        const res = await api.updateCleaningRecord(editingLog.id, payload);
        const updatedLog: CleaningLog = { ...editingLog, ...payload, ...res };
        setLogs(logs.map((l) => (l.id === editingLog.id ? updatedLog : l)));
        success('Cleaning record updated successfully.');
      } else {
        const saved = await api.createCleaningRecord(payload);
        const newLog: CleaningLog = {
          id: saved.id || Date.now(),
          ...payload,
          ...saved
        };
        setLogs([newLog, ...logs]);
        success('Cleaning inspection logged successfully.');
      }
      setIsAddOpen(false);
      setEditingLog(null);
    } catch (err: any) {
      error(err.message || 'Failed to save cleaning record to database');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cleaning log?')) return;
    try {
      await api.deleteCleaningRecord(id);
      setLogs(logs.filter((l) => l.id !== id));
      success('Cleaning record deleted.');
    } catch (err: any) {
      error(err.message || 'Failed to delete cleaning record from database');
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.bus_number.toLowerCase().includes(search.toLowerCase()) ||
      l.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      l.cleaner_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || l.cleaning_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const cleanedToday = logs.filter((l) => l.cleaned_date === todayStr && l.status === 'Completed').length;
  const pendingCount = logs.filter((l) => l.status === 'Pending' || l.status === 'Needs Re-clean').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <span>Cleaning & Hygiene Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet vehicle sanitization records, interior sweeps, pressure washing, and hygiene audit checklists.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Cleaning Session</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Washed Today</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{cleanedToday} Buses</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Cleared for passenger routes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Completed Logs</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {logs.filter((l) => l.status === 'Completed').length} Logs
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified hygiene inspections</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Attention Required</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Buses</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Pending or re-cleaning needed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bus number, plate, cleaner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Cleaning Types</option>
            <option value="Daily Sweep & Mop">Daily Sweep & Mop</option>
            <option value="Full Exterior Wash">Full Exterior Wash</option>
            <option value="Deep Seat Sanitization">Deep Seat Sanitization</option>
            <option value="Complete Disinfection">Complete Disinfection</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bus Fleet</th>
                <th className="py-3 px-4">Cleaning Service</th>
                <th className="py-3 px-4">Assigned Attendant</th>
                <th className="py-3 px-4">Checklist Checklist</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No cleaning logs recorded yet. Tap &quot;Log Cleaning Session&quot; to add.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.cleaned_date}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.bus_number}</p>
                      <p className="text-[11px] text-blue-700 font-semibold">{log.registration_number}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{log.cleaning_type}</td>
                    <td className="py-3 px-4 text-slate-600">{log.cleaner_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            log.floor_cleaned ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          Floor
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            log.seats_vacuumed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          Seats
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            log.exterior_washed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          Wash
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{log.notes || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Cleaning Log"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Cleaning Log"
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

      {/* Add / Edit Log Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingLog(null);
        }}
        title={editingLog ? "Edit Vehicle Cleaning Session" : "Record Vehicle Cleaning Session"}
        subtitle={editingLog ? "Update bus cleanliness checklist or cleaner assignment" : "Ensure bus cleanliness and sanitization compliance before deployment"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bus *</label>
              <select
                required
                value={formData.bus_id}
                onChange={(e) => handleBusSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- Choose Bus --</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} ({b.registration_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Type *</label>
              <select
                value={formData.cleaning_type}
                onChange={(e) => setFormData({ ...formData, cleaning_type: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Daily Sweep & Mop">Daily Sweep & Mop</option>
                <option value="Full Exterior Wash">Full Exterior Wash</option>
                <option value="Deep Seat Sanitization">Deep Seat Sanitization</option>
                <option value="Complete Disinfection">Complete Disinfection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cleaner / Helper</label>
              <input
                type="text"
                value={formData.cleaner_name}
                onChange={(e) => setFormData({ ...formData, cleaner_name: e.target.value })}
                placeholder="Staff name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cleaning Date</label>
              <input
                type="date"
                value={formData.cleaned_date}
                onChange={(e) => setFormData({ ...formData, cleaned_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Hygiene & Sanitization Checklist</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.floor_cleaned}
                  onChange={(e) => setFormData({ ...formData, floor_cleaned: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-600"
                />
                <span>Floor Swept & Mopped</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.seats_vacuumed}
                  onChange={(e) => setFormData({ ...formData, seats_vacuumed: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-600"
                />
                <span>Seats & Upholstery Cleaned</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.windows_polished}
                  onChange={(e) => setFormData({ ...formData, windows_polished: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-600"
                />
                <span>Windows & Mirrors Wiped</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.exterior_washed}
                  onChange={(e) => setFormData({ ...formData, exterior_washed: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-600"
                />
                <span>Exterior Body Washed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors shadow-sm cursor-pointer"
            >
              Save Cleaning Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
