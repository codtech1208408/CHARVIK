import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Edit,
  Trash2,
  Bus,
  Check,
  Disc,
  Snowflake,
  Fuel,
  BatteryCharging
} from 'lucide-react';
import { api } from '../services/api';
import type { MaintenanceSchedule as ScheduleType, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const MaintenanceSchedule: React.FC = () => {
  const { success, error } = useToast();

  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [busFilter, setBusFilter] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [scheduleToComplete, setScheduleToComplete] = useState<ScheduleType | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    maintenance_type: 'General Service',
    last_service_date: '',
    last_service_km: '',
    interval_km: '',
    next_due_date: '',
    next_due_km: '',
    priority: 'Medium',
    assigned_to: '',
    estimated_cost: '',
    status: 'Scheduled',
    notes: ''
  });

  // Completion Form State
  const [completeData, setCompleteData] = useState({
    completion_date: new Date().toISOString().split('T')[0],
    odometer_km: 0,
    actual_cost: 0,
    work_performed: '',
    next_due_km: 0,
    next_due_date: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, busFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedData, busesData] = await Promise.all([
        api.getMaintenanceSchedules({
          status: statusFilter !== 'All' ? statusFilter : undefined,
          bus_id: busFilter || undefined
        }),
        api.getBuses()
      ]);
      setSchedules(schedData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load maintenance schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    const firstBus = buses[0];
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      maintenance_type: 'General Service',
      last_service_date: '',
      last_service_km: '',
      interval_km: '',
      next_due_date: '',
      next_due_km: '',
      priority: 'Medium',
      assigned_to: '',
      estimated_cost: '',
      status: 'Scheduled',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (sched: ScheduleType) => {
    setEditingSchedule(sched);
    setFormData({
      bus_id: String(sched.bus_id),
      maintenance_type: sched.maintenance_type,
      last_service_date: sched.last_service_date || '',
      last_service_km: sched.last_service_km || 0,
      interval_km: sched.interval_km || 10000,
      next_due_date: sched.next_due_date || '',
      next_due_km: sched.next_due_km || 0,
      priority: sched.priority || 'Medium',
      assigned_to: sched.assigned_to || '',
      estimated_cost: sched.estimated_cost || 0,
      status: sched.status || 'Scheduled',
      notes: sched.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.updateMaintenanceSchedule(editingSchedule.id, formData);
        success('Maintenance schedule updated successfully!');
      } else {
        await api.createMaintenanceSchedule(formData);
        success('Maintenance scheduled successfully!');
      }
      setIsAddEditOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save maintenance schedule');
    }
  };

  const handleOpenComplete = (sched: ScheduleType) => {
    setScheduleToComplete(sched);
    setCompleteData({
      completion_date: new Date().toISOString().split('T')[0],
      odometer_km: sched.current_odometer_km || sched.next_due_km || 50000,
      actual_cost: sched.estimated_cost || 4500,
      work_performed: `Completed ${sched.maintenance_type} service and road test verification`,
      next_due_km: (sched.current_odometer_km || 50000) + (sched.interval_km || 10000),
      next_due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleToComplete) return;

    try {
      await api.updateMaintenanceSchedule(scheduleToComplete.id, {
        ...scheduleToComplete,
        status: 'Completed',
        notes: `${scheduleToComplete.notes || ''} [Completed on ${completeData.completion_date} at ${completeData.odometer_km} km for ₹${completeData.actual_cost}]`
      });
      success(`Service marked completed for ${scheduleToComplete.bus_number}!`);
      setIsCompleteModalOpen(false);
      setScheduleToComplete(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to complete maintenance');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this maintenance schedule?')) return;
    try {
      await api.deleteMaintenanceSchedule(id);
      success('Schedule removed.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Preventive Maintenance Schedule</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated calendar date and kilometer-based preventive maintenance scheduling and work tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Due Soon', 'Pending', 'Scheduled', 'In Progress', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
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
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Bus Details</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Interval</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Next Due KM</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading schedule...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No maintenance schedules found.
                  </td>
                </tr>
              ) : (
                schedules.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{s.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{s.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.maintenance_type}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">Every {s.interval_km?.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{s.next_due_date || 'KM Triggered'}</td>
                    <td className="py-3 px-4 font-bold text-blue-600 font-mono">{s.next_due_km?.toLocaleString()} km</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          s.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : s.priority === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.assigned_to || 'Depot'}</td>
                    <td className="py-3 px-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {s.status !== 'Completed' && (
                          <button
                            onClick={() => handleOpenComplete(s)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Complete Service Job"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Edit Schedule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Schedule"
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

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingSchedule ? 'Edit Maintenance Schedule' : 'Schedule Preventive Maintenance'}
        subtitle="Set both calendar due dates and odometer interval thresholds"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Type *</label>
              <select
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              >
                <option value="General Service">General Service</option>
                <option value="Tyre Maintenance">Tyre Maintenance</option>
                <option value="AC Maintenance">AC Maintenance</option>
                <option value="Oil Replacement">Oil Replacement</option>
                <option value="Filter Replacement">Filter Replacement</option>
                <option value="Battery Check">Battery Check</option>
                <option value="Brake Inspection">Brake Inspection</option>
                <option value="Engine Inspection">Engine Inspection</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Interval (KM)</label>
              <input
                type="number"
                value={formData.interval_km}
                onChange={(e) => setFormData({ ...formData, interval_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Due KM</label>
              <input
                type="number"
                value={formData.next_due_km}
                onChange={(e) => setFormData({ ...formData, next_due_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Due Date</label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Due Soon">Due Soon</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Vendor / Staff</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              placeholder="e.g. Subzero AC Solutions / Chief Mechanic Anand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Service Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Service: ${scheduleToComplete?.maintenance_type}`}
        subtitle={`Bus: ${scheduleToComplete?.bus_number} (${scheduleToComplete?.registration_number})`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmComplete} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Completion Date *</label>
              <input
                type="date"
                value={completeData.completion_date}
                onChange={(e) => setCompleteData({ ...completeData, completion_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Odometer KM at Service</label>
              <input
                type="number"
                value={completeData.odometer_km}
                onChange={(e) => setCompleteData({ ...completeData, odometer_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Actual Incurred Cost (₹)</label>
            <input
              type="number"
              value={completeData.actual_cost}
              onChange={(e) => setCompleteData({ ...completeData, actual_cost: Number(e.target.value) })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Performed Summary</label>
            <textarea
              rows={2}
              value={completeData.work_performed}
              onChange={(e) => setCompleteData({ ...completeData, work_performed: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
            >
              Confirm Completion
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
