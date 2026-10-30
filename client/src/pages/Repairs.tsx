import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Bus,
  Edit,
  Trash2,
  DollarSign,
  ShieldCheck,
  Check,
  ClipboardList
} from 'lucide-react';
import { api } from '../services/api';
import type { RepairWorkOrder, Bus as BusType, Complaint } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const Repairs: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [repairs, setRepairs] = useState<RepairWorkOrder[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [busFilter, setBusFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairWorkOrder | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    linked_complaint_id: '',
    repair_category: 'Mechanical',
    problem_description: '',
    reported_date: new Date().toISOString().split('T')[0],
    work_start_date: new Date().toISOString().split('T')[0],
    work_completion_date: '',
    odometer_km: '',
    diagnosis: '',
    work_performed: '',
    parts_replaced: '',
    labour_cost: '',
    parts_cost: '',
    other_charges: '',
    workshop_vendor: '',
    assigned_technician: '',
    bus_availability_status: 'Under Maintenance',
    warranty_details: '',
    status: 'In Progress',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, busFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repairData, busesData, compData] = await Promise.all([
        api.getRepairs({
          status: statusFilter !== 'All' ? statusFilter : undefined,
          bus_id: busFilter || undefined
        }),
        api.getBuses(),
        api.getComplaints({ status: 'Open' })
      ]);
      setRepairs(repairData);
      setBuses(busesData);
      setComplaints(compData);
    } catch (err: any) {
      error(err.message || 'Failed to load repairs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const firstBus = buses[0];
    const currentKm = firstBus ? firstBus.current_odometer_km : '';
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      linked_complaint_id: '',
      repair_category: 'Mechanical',
      problem_description: '',
      reported_date: new Date().toISOString().split('T')[0],
      work_start_date: new Date().toISOString().split('T')[0],
      work_completion_date: '',
      odometer_km: currentKm,
      diagnosis: '',
      work_performed: '',
      parts_replaced: '',
      labour_cost: '',
      parts_cost: '',
      other_charges: '',
      workshop_vendor: '',
      assigned_technician: '',
      bus_availability_status: 'Under Maintenance',
      warranty_details: '',
      status: 'In Progress',
      remarks: ''
    });
    setIsAddOpen(true);
  };

  const totalCost =
    Number(formData.labour_cost || 0) +
    Number(formData.parts_cost || 0) +
    Number(formData.other_charges || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.problem_description) {
      error('Bus and problem description are required');
      return;
    }
    try {
      await api.createRepair(formData);
      success('Repair work order created!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create work order');
    }
  };

  const handleOpenEdit = (r: RepairWorkOrder) => {
    setEditingRepair(r);
    setFormData({
      bus_id: String(r.bus_id),
      linked_complaint_id: r.linked_complaint_id ? String(r.linked_complaint_id) : '',
      repair_category: r.repair_category || 'Mechanical',
      problem_description: r.problem_description,
      reported_date: r.reported_date || '',
      work_start_date: r.work_start_date || '',
      work_completion_date: r.work_completion_date || '',
      odometer_km: r.odometer_km || 0,
      diagnosis: r.diagnosis || '',
      work_performed: r.work_performed || '',
      parts_replaced: r.parts_replaced || '',
      labour_cost: r.labour_cost || 0,
      parts_cost: r.parts_cost || 0,
      other_charges: r.other_charges || 0,
      workshop_vendor: r.workshop_vendor || '',
      assigned_technician: r.assigned_technician || '',
      bus_availability_status: r.bus_availability_status || 'Under Maintenance',
      warranty_details: r.warranty_details || '',
      status: r.status,
      remarks: r.remarks || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;
    try {
      const returnToService = formData.status === 'Completed';
      await api.updateRepair(editingRepair.id, {
        ...formData,
        return_to_service: returnToService
      });
      success(`Work order ${editingRepair.work_order_number} updated!`);
      setIsEditOpen(false);
      setEditingRepair(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update work order');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this repair work order?')) return;
    try {
      await api.deleteRepair(id);
      success('Repair work order deleted successfully!');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete repair work order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Module Navigation: Repairs & Tasks */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142B4A] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Vehicle Repairs & Work Orders</span>
        </button>

        <button
          onClick={() => navigate(location.pathname.startsWith('/supporter') ? '/supporter/tasks' : '/admin/tasks')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
          <span>Trip Tasks & Crew Schedule</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-600" />
            <span>Repairs & Service Work Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corrective workshop repairs, parts replacement, labour accounting, and return-to-service validation.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'In Progress', 'Waiting for Parts', 'Approved', 'Completed'].map((st) => (
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Problem & Diagnosis</th>
                <th className="py-3 px-4">Workshop / Tech</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Bus Status</th>
                <th className="py-3 px-4">Work Order Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading repair work orders...
                  </td>
                </tr>
              ) : repairs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No repair work orders found matching the criteria.
                  </td>
                </tr>
              ) : (
                repairs.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.work_order_number}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{r.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{r.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.repair_category}</td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="font-medium text-slate-900 truncate">{r.problem_description}</p>
                      {r.parts_replaced && (
                        <p className="text-[10px] text-slate-500 truncate">Parts: {r.parts_replaced}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium">{r.workshop_vendor}</span>
                      <span className="block text-[10px] text-slate-400">{r.assigned_technician}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ₹{r.total_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.bus_availability_status} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit / Manage Work Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Work Order"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
          setEditingRepair(null);
        }}
        title={editingRepair ? `Update Work Order ${editingRepair.work_order_number}` : 'Create Repair Work Order'}
        subtitle="Record diagnostics, labour, parts, and return-to-service authorization"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={editingRepair ? handleUpdate : handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Linked Complaint (Optional)</label>
              <select
                value={formData.linked_complaint_id}
                onChange={(e) => setFormData({ ...formData, linked_complaint_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- No Linked Complaint --</option>
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.complaint_ref} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Repair Category</label>
              <select
                value={formData.repair_category}
                onChange={(e) => setFormData({ ...formData, repair_category: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Mechanical">Mechanical</option>
                <option value="AC Repair">AC Repair</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Tyre Change">Tyre Change</option>
                <option value="Brake Repair">Brake Repair</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Repair">Body Repair</option>
                <option value="General Service">General Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description *</label>
            <input
              type="text"
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              placeholder="e.g. Turbo clamp broken and clutch hard"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mechanic Diagnosis</label>
              <textarea
                rows={2}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Diagnostic root cause..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Performed</label>
              <textarea
                rows={2}
                value={formData.work_performed}
                onChange={(e) => setFormData({ ...formData, work_performed: e.target.value })}
                placeholder="Action taken..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parts Replaced</label>
            <input
              type="text"
              value={formData.parts_replaced}
              onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
              placeholder="e.g. Brake Lining OEM, Brake Fluid Dot-4"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Parts Cost (₹)</label>
              <input
                type="number"
                value={formData.parts_cost}
                onChange={(e) => setFormData({ ...formData, parts_cost: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Other Charges (₹)</label>
              <input
                type="number"
                value={formData.other_charges}
                onChange={(e) => setFormData({ ...formData, other_charges: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Cost (₹)</label>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-900 text-xs">
                ₹{totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workshop / Vendor</label>
              <input
                type="text"
                value={formData.workshop_vendor}
                onChange={(e) => setFormData({ ...formData, workshop_vendor: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Order Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Requested">Requested</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Parts">Waiting for Parts</option>
                <option value="Waiting for Approval">Waiting for Approval</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus Status</label>
              <select
                value={formData.bus_availability_status}
                onChange={(e) => setFormData({ ...formData, bus_availability_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Active">Active (Ready for Service)</option>
              </select>
            </div>
          </div>

          {formData.status === 'Completed' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Marking this repair as Completed will confirm vehicle return-to-service and set bus status to Active.</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
                setEditingRepair(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              {editingRepair ? 'Commit Updates' : 'Issue Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
