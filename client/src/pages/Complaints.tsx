import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  Bus,
  Edit,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { Complaint, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const Complaints: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [busFilter, setBusFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    bus_id: '',
    category: 'AC',
    description: '',
    priority: 'Medium',
    reported_by: '',
    contact_number: '',
    assigned_staff: '',
    assigned_vendor: '',
    expected_resolution_date: '',
    remarks: ''
  });

  // Resolve State
  const [resolveData, setResolveData] = useState({
    status: 'Resolved',
    resolution_description: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, busFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compData, busesData] = await Promise.all([
        api.getComplaints({
          status: statusFilter !== 'All' ? statusFilter : undefined,
          priority: priorityFilter !== 'All' ? priorityFilter : undefined,
          bus_id: busFilter || undefined
        }),
        api.getBuses()
      ]);
      setComplaints(compData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const firstBus = buses[0];
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      category: 'AC',
      description: '',
      priority: 'High',
      reported_by: 'Driver (Morning Shift)',
      contact_number: '9848012345',
      assigned_staff: 'Chief Mechanic Anand',
      assigned_vendor: 'Subzero AC Solutions',
      expected_resolution_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: 'Reported during routine depot arrival.'
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.description) {
      error('Bus and complaint description are required');
      return;
    }
    try {
      await api.createComplaint(formData);
      success('Complaint registered successfully!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to register complaint');
    }
  };

  const handleOpenResolve = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setResolveData({
      status: 'Resolved',
      resolution_description: comp.resolution_description || 'Root cause identified and corrective mechanical action completed.',
      remarks: comp.remarks || ''
    });
    setIsResolveOpen(true);
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await api.updateComplaint(selectedComplaint.id, {
        ...selectedComplaint,
        status: resolveData.status,
        resolution_description: resolveData.resolution_description,
        remarks: resolveData.remarks,
        resolved_date: new Date().toISOString()
      });
      success(`Complaint ${selectedComplaint.complaint_ref} updated to ${resolveData.status}!`);
      setIsResolveOpen(false);
      setSelectedComplaint(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update complaint');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Bus Complaints Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log driver and passenger feedback, assign technical staff, and enforce resolution workflows.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Complaint</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
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

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="">All Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bus_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref. No.</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading complaints...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No complaints registered matching this filter.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.complaint_ref}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{c.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{c.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.category}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px]">
                      <p className="line-clamp-2 leading-relaxed">{c.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          c.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : c.priority === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.reported_by}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.assigned_staff || c.assigned_vendor || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenResolve(c)}
                        className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer gap-1"
                        title="Update Status / Resolve"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </td>
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
        title="Register Vehicle Complaint"
        subtitle="Report defect or operational anomaly for fleet engineering resolution"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              >
                <option value="Engine">Engine</option>
                <option value="Tyre">Tyre</option>
                <option value="AC">AC</option>
                <option value="Battery">Battery</option>
                <option value="Oil or Filter">Oil or Filter</option>
                <option value="Brakes">Brakes</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Damage">Body Damage</option>
                <option value="Safety">Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issue Description *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of anomaly, noise, leak, or passenger inconvenience..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Critical">Critical (Immediate Depot Grounding)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reported By</label>
              <input
                type="text"
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Staff / Technician</label>
              <input
                type="text"
                value={formData.assigned_staff}
                onChange={(e) => setFormData({ ...formData, assigned_staff: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign External Vendor</label>
              <input
                type="text"
                value={formData.assigned_vendor}
                onChange={(e) => setFormData({ ...formData, assigned_vendor: e.target.value })}
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
              Submit Complaint
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve / Update Modal */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title={`Update Complaint ${selectedComplaint?.complaint_ref}`}
        subtitle={`Bus: ${selectedComplaint?.bus_number} • Category: ${selectedComplaint?.category}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={resolveData.status}
              onChange={(e) => setResolveData({ ...resolveData, status: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Description *</label>
            <textarea
              rows={3}
              value={resolveData.resolution_description}
              onChange={(e) => setResolveData({ ...resolveData, resolution_description: e.target.value })}
              placeholder="State corrective actions taken, parts replaced, or diagnostic conclusion..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Closing Remarks</label>
            <input
              type="text"
              value={resolveData.remarks}
              onChange={(e) => setResolveData({ ...resolveData, remarks: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResolveOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Save Status Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
