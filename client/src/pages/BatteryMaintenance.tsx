import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  Bus,
  ShieldAlert,
  Edit,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import type { BatteryRecord, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const BatteryMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<BatteryRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BatteryRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    current_km: '',
    battery_brand: '',
    serial_number: '',
    battery_type: 'Lead Acid Heavy Duty',
    battery_voltage: 24.0,
    measured_voltage: '',
    battery_health: 'Good',
    terminal_condition: '',
    charging_system_status: '',
    installation_date: '',
    warranty_expiry_date: '',
    battery_cost: '',
    technician: '',
    next_check_date: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batData, busesData] = await Promise.all([
        api.getBatteryRecords({ bus_id: selectedBus || undefined }),
        api.getBuses()
      ]);
      setRecords(batData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load battery check records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const firstBus = buses[0];
    const currentKm = firstBus ? firstBus.current_odometer_km : '';
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      inspection_date: new Date().toISOString().split('T')[0],
      current_km: currentKm,
      battery_brand: '',
      serial_number: '',
      battery_type: 'Lead Acid Heavy Duty',
      battery_voltage: '',
      measured_voltage: '',
      battery_health: 'Good',
      terminal_condition: 'Clean',
      charging_system_status: 'Normal',
      installation_date: '',
      warranty_expiry_date: '',
      battery_cost: '',
      technician: '',
      next_check_date: '',
      remarks: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (r: BatteryRecord) => {
    setEditingRecord(r);
    setFormData({
      bus_id: String(r.bus_id),
      inspection_date: r.inspection_date || new Date().toISOString().split('T')[0],
      current_km: r.current_km ?? '',
      battery_brand: r.battery_brand || '',
      serial_number: r.serial_number || '',
      battery_type: r.battery_type || 'Lead Acid Heavy Duty',
      battery_voltage: r.battery_voltage ?? '',
      measured_voltage: r.measured_voltage ?? '',
      battery_health: r.battery_health || 'Good',
      terminal_condition: r.terminal_condition || 'Clean',
      charging_system_status: r.charging_system_status || 'Normal',
      installation_date: r.installation_date || '',
      warranty_expiry_date: r.warranty_expiry_date || '',
      battery_cost: r.battery_cost ?? '',
      technician: r.technician || '',
      next_check_date: r.next_check_date || '',
      remarks: r.remarks || ''
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this battery record?')) return;
    try {
      await api.deleteBatteryRecord(id);
      success('Battery record deleted successfully!');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id) {
      error('Please select a bus');
      return;
    }
    try {
      if (editingRecord) {
        await api.updateBatteryRecord(editingRecord.id, formData);
        success('Battery record updated successfully!');
      } else {
        await api.createBatteryRecord(formData);
        success('Battery check inspection logged!');
      }
      setIsAddOpen(false);
      setEditingRecord(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save battery check');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <BatteryCharging className="w-5 h-5 text-purple-600" />
            <span>Battery Health & Electrical Inspection Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track battery voltage, terminal condition, alternator charging efficiency, and warranty expiry dates.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Battery Inspection</span>
        </button>
      </div>

      {/* Filter and Warning Threshold info */}
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

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Zap className="w-4 h-4 text-purple-600" />
          <span>Recommended Battery Voltage: <strong>24V Nominal (Resting &gt; 24.8V)</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Inspection Date</th>
                <th className="py-3 px-4">Brand & Serial</th>
                <th className="py-3 px-4">Nominal / Measured</th>
                <th className="py-3 px-4">Battery Health</th>
                <th className="py-3 px-4">Terminals & Charging</th>
                <th className="py-3 px-4">Warranty Expiry</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading battery records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No battery inspection records found.
                  </td>
                </tr>
              ) : (
                records.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{r.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{r.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.inspection_date}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{r.battery_brand}</span>
                      <span className="block text-[11px] font-mono text-slate-400">{r.serial_number}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className="text-slate-500">{r.battery_voltage}V / </span>
                      <span className={r.measured_voltage && r.measured_voltage < 24 ? 'text-rose-600' : 'text-emerald-700'}>
                        {r.measured_voltage}V
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.battery_health} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{r.terminal_condition}</span>
                      <span className="block text-[10px] text-slate-400">{r.charging_system_status}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {r.warranty_expiry_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.technician || 'Workshop'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? 'Edit Battery Inspection Record' : 'Log Battery Inspection & Health'}
        subtitle={editingRecord ? 'Update battery voltage and electrical health metrics' : 'Monitor electrical voltage, terminal corrosion and charging output'}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Date *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Battery Brand</label>
              <input
                type="text"
                value={formData.battery_brand}
                onChange={(e) => setFormData({ ...formData, battery_brand: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Battery Health Status</label>
              <select
                value={formData.battery_health}
                onChange={(e) => setFormData({ ...formData, battery_health: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Good">Good</option>
                <option value="Needs Monitoring">Needs Monitoring</option>
                <option value="Weak">Weak</option>
                <option value="Replace Soon">Replace Soon</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                value={formData.battery_voltage}
                onChange={(e) => setFormData({ ...formData, battery_voltage: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Measured Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                value={formData.measured_voltage}
                onChange={(e) => setFormData({ ...formData, measured_voltage: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Condition</label>
              <input
                type="text"
                value={formData.terminal_condition}
                onChange={(e) => setFormData({ ...formData, terminal_condition: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Charging System / Alternator</label>
              <input
                type="text"
                value={formData.charging_system_status}
                onChange={(e) => setFormData({ ...formData, charging_system_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Expiry Date</label>
              <input
                type="date"
                value={formData.warranty_expiry_date}
                onChange={(e) => setFormData({ ...formData, warranty_expiry_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Battery Cost (₹)</label>
              <input
                type="number"
                value={formData.battery_cost}
                onChange={(e) => setFormData({ ...formData, battery_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Electrician / Tech</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
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
              Save Battery Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
