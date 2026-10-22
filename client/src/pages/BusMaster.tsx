import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Bus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  User,
  Wrench,
  Gauge
} from 'lucide-react';
import { api } from '../services/api';
import type { Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export const BusMaster: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  const [buses, setBuses] = useState<BusType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusType | null>(null);
  const [viewingBusDetails, setViewingBusDetails] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'km' | 'maint' | 'tyres' | 'ac' | 'oil' | 'battery' | 'complaints' | 'repairs' | 'inspections'>('km');
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [busToArchive, setBusToArchive] = useState<BusType | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_number: '',
    registration_number: '',
    make: '',
    model: '',
    bus_type: 'Staff Bus',
    manufacturing_year: new Date().getFullYear(),
    purchase_date: '',
    chassis_number: '',
    engine_number: '',
    fuel_type: 'Diesel',
    seating_capacity: '',
    current_odometer_km: '',
    operational_status: 'Active',
    insurance_expiry: '',
    fitness_expiry: '',
    permit_expiry: '',
    puc_expiry: '',
    assigned_driver_id: '',
    assigned_helper_id: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busData, empData] = await Promise.all([
        api.getBuses({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        api.getEmployees()
      ]);
      setBuses(busData);
      setEmployees(empData);
    } catch (err: any) {
      error(err.message || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      bus_number: `BUS-${String(buses.length + 1).padStart(2, '0')}`,
      registration_number: '',
      make: '',
      model: '',
      bus_type: 'Staff Bus',
      manufacturing_year: new Date().getFullYear(),
      purchase_date: '',
      chassis_number: '',
      engine_number: '',
      fuel_type: 'Diesel',
      seating_capacity: '',
      current_odometer_km: '',
      operational_status: 'Active',
      insurance_expiry: '',
      fitness_expiry: '',
      permit_expiry: '',
      puc_expiry: '',
      assigned_driver_id: '',
      assigned_helper_id: '',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (bus: BusType) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      registration_number: bus.registration_number,
      make: bus.make || '',
      model: bus.model || '',
      bus_type: bus.bus_type || 'Staff Bus',
      manufacturing_year: bus.manufacturing_year || 2021,
      purchase_date: bus.purchase_date || '',
      chassis_number: bus.chassis_number || '',
      engine_number: bus.engine_number || '',
      fuel_type: bus.fuel_type || 'Diesel',
      seating_capacity: bus.seating_capacity || 45,
      current_odometer_km: bus.current_odometer_km || 0,
      operational_status: bus.operational_status || 'Active',
      insurance_expiry: bus.insurance_expiry || '',
      fitness_expiry: bus.fitness_expiry || '',
      permit_expiry: bus.permit_expiry || '',
      puc_expiry: bus.puc_expiry || '',
      assigned_driver_id: bus.assigned_driver_id ? String(bus.assigned_driver_id) : '',
      assigned_helper_id: bus.assigned_helper_id ? String(bus.assigned_helper_id) : '',
      notes: bus.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBus) {
        await api.updateBus(editingBus.id, formData);
        success(`Bus ${formData.bus_number} updated successfully!`);
      } else {
        await api.createBus(formData);
        success(`Bus ${formData.bus_number} added to fleet!`);
      }
      setIsAddEditOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save bus record');
    }
  };

  const handleViewProfile = async (bus: BusType) => {
    try {
      const details = await api.getBus(bus.id);
      setViewingBusDetails(details);
      setIsViewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load bus profile');
    }
  };

  const handleArchive = async () => {
    if (!busToArchive) return;
    try {
      await api.archiveBus(busToArchive.id);
      success(`Bus ${busToArchive.bus_number} archived safely.`);
      setIsArchiveConfirmOpen(false);
      setBusToArchive(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to archive bus');
    }
  };

  const filteredBuses = buses.filter((b) => {
    const s = searchTerm.toLowerCase();
    return (
      b.bus_number.toLowerCase().includes(s) ||
      b.registration_number.toLowerCase().includes(s) ||
      (b.make && b.make.toLowerCase().includes(s)) ||
      (b.model && b.model.toLowerCase().includes(s)) ||
      (b.driver_name && b.driver_name.toLowerCase().includes(s))
    );
  });

  const drivers = employees.filter((e) => e.role === 'Driver');
  const helpers = employees.filter((e) => e.role === 'Helper');

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-600" />
            <span>Bus Master Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fleet specifications, odometer readings, assigned drivers, and compliance documents.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bus</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bus no, registration, make..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['All', 'Active', 'Under Maintenance', 'Inactive', 'Out of Service'].map((st) => (
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
      </div>

      {/* Buses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bus ID</th>
                <th className="py-3 px-4">Registration No.</th>
                <th className="py-3 px-4">Make & Model</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Current KM</th>
                <th className="py-3 px-4">Assigned Driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading fleet records...
                  </td>
                </tr>
              ) : filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No buses found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBuses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.bus_number}</td>
                    <td className="py-3 px-4 font-bold text-blue-700">{b.registration_number}</td>
                    <td className="py-3 px-4 font-medium">
                      {b.make} {b.model}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.bus_type}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.current_odometer_km?.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4">
                      {b.driver_name ? (
                        <div>
                          <p className="font-semibold text-slate-900">{b.driver_name}</p>
                          <p className="text-[10px] text-slate-400">{b.driver_phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={b.operational_status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleViewProfile(b)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Full Bus Operational Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Edit Bus Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setBusToArchive(b);
                              setIsArchiveConfirmOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archive Bus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Bus Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingBus ? `Edit Bus ${editingBus.bus_number}` : 'Register New Fleet Bus'}
        subtitle="Ensure vehicle specifications and registration details are normalized"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveBus} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus Number *</label>
              <input
                type="text"
                value={formData.bus_number}
                onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                placeholder="BUS-01"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registration No. *</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="AP 16 TC 2080"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus Type</label>
              <select
                value={formData.bus_type}
                onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="School Bus">School Bus</option>
                <option value="Staff Bus">Staff Bus</option>
                <option value="Contract Bus">Contract Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer (Make)</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="Ashok Leyland"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Viking 222"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mfg Year</label>
              <input
                type="number"
                value={formData.manufacturing_year}
                onChange={(e) => setFormData({ ...formData, manufacturing_year: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
              <input
                type="number"
                value={formData.current_odometer_km}
                onChange={(e) => setFormData({ ...formData, current_odometer_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operational Status *</label>
              <select
                value={formData.operational_status}
                onChange={(e: any) => setFormData({ ...formData, operational_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                required
              >
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Inactive">Inactive</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Driver</label>
              <select
                value={formData.assigned_driver_id}
                onChange={(e) => setFormData({ ...formData, assigned_driver_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">-- No Assigned Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.employee_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Helper</label>
              <select
                value={formData.assigned_helper_id}
                onChange={(e) => setFormData({ ...formData, assigned_helper_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">-- No Assigned Helper --</option>
                {helpers.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.full_name} ({h.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compliance & Document Expiry Dates */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Vehicle Compliance Expiry Dates
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fitness Expiry</label>
                <input
                  type="date"
                  value={formData.fitness_expiry}
                  onChange={(e) => setFormData({ ...formData, fitness_expiry: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Permit Expiry</label>
                <input
                  type="date"
                  value={formData.permit_expiry}
                  onChange={(e) => setFormData({ ...formData, permit_expiry: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PUC Expiry</label>
                <input
                  type="date"
                  value={formData.puc_expiry}
                  onChange={(e) => setFormData({ ...formData, puc_expiry: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              placeholder="Contract or operational notes..."
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
              {editingBus ? 'Update Bus Record' : 'Save Bus to Fleet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Bus Full Operational Profile Modal */}
      {viewingBusDetails && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Bus Profile: ${viewingBusDetails.bus.bus_number} (${viewingBusDetails.bus.registration_number})`}
          subtitle={`${viewingBusDetails.bus.make} ${viewingBusDetails.bus.model} • Current Odometer: ${viewingBusDetails.bus.current_odometer_km?.toLocaleString()} KM`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Top specs summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <Badge status={viewingBusDetails.bus.operational_status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Driver</span>
                <span className="font-bold text-slate-800">{viewingBusDetails.bus.driver_name || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Seating</span>
                <span className="font-bold text-slate-800">{viewingBusDetails.bus.seating_capacity} Seats</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Insurance Valid Till</span>
                <span className="font-bold text-blue-700">{viewingBusDetails.bus.insurance_expiry || 'N/A'}</span>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs pb-1">
              {[
                { id: 'km', label: 'Kilometers' },
                { id: 'maint', label: 'Maintenance' },
                { id: 'tyres', label: 'Tyres' },
                { id: 'ac', label: 'AC Service' },
                { id: 'oil', label: 'Oil & Filter' },
                { id: 'battery', label: 'Battery' },
                { id: 'complaints', label: 'Complaints' },
                { id: 'repairs', label: 'Repairs' },
                { id: 'inspections', label: 'Condition' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveViewTab(t.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                    activeViewTab === t.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="max-h-72 overflow-y-auto">
              {activeViewTab === 'km' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kilometer Entry History</p>
                  {viewingBusDetails.kmHistory?.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="py-1">Date</th>
                          <th className="py-1">Opening</th>
                          <th className="py-1">Closing</th>
                          <th className="py-1">Distance</th>
                          <th className="py-1">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {viewingBusDetails.kmHistory.map((k: any) => (
                          <tr key={k.id}>
                            <td className="py-1 font-medium">{k.entry_date}</td>
                            <td className="py-1 text-slate-500">{k.opening_km}</td>
                            <td className="py-1 font-semibold text-slate-900">{k.closing_km}</td>
                            <td className="py-1 font-bold text-blue-600">{k.distance_travelled_km} km</td>
                            <td className="py-1 text-slate-500">{k.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No kilometer entries logged yet.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'maint' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Services</p>
                  {viewingBusDetails.maintenanceHistory?.length > 0 ? (
                    viewingBusDetails.maintenanceHistory.map((m: any) => (
                      <div key={m.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{m.maintenance_type}</p>
                          <p className="text-slate-500 text-[11px]">Due: {m.next_due_date || `${m.next_due_km} km`} • Assigned: {m.assigned_to || 'Workshop'}</p>
                        </div>
                        <Badge status={m.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No maintenance scheduled.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'tyres' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Installed Tyres</p>
                  {viewingBusDetails.tyreHistory?.length > 0 ? (
                    viewingBusDetails.tyreHistory.map((t: any) => (
                      <div key={t.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{t.tyre_position}: {t.brand} ({t.tyre_serial_number})</p>
                          <p className="text-slate-500 text-[11px]">Tread: {t.tread_depth_mm}mm • Pressure: {t.tyre_pressure_psi} psi</p>
                        </div>
                        <Badge status={t.condition} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No tyres registered for this bus.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'complaints' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Complaints</p>
                  {viewingBusDetails.complaints?.length > 0 ? (
                    viewingBusDetails.complaints.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{c.complaint_ref} ({c.category})</p>
                          <p className="text-slate-600 text-[11px]">{c.description}</p>
                        </div>
                        <Badge status={c.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No complaints on file.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'repairs' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repair Work Orders</p>
                  {viewingBusDetails.repairs?.length > 0 ? (
                    viewingBusDetails.repairs.map((r: any) => (
                      <div key={r.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{r.work_order_number} ({r.repair_category})</p>
                          <p className="text-slate-600 text-[11px]">{r.problem_description} • Cost: ₹{r.total_cost?.toLocaleString()}</p>
                        </div>
                        <Badge status={r.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No repairs on record.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'inspections' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition Inspections</p>
                  {viewingBusDetails.inspections?.length > 0 ? (
                    viewingBusDetails.inspections.map((i: any) => (
                      <div key={i.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{i.inspection_ref} - {i.inspection_date}</p>
                          <p className="text-slate-600 text-[11px]">Inspector: {i.inspector_name}</p>
                        </div>
                        <Badge status={i.roadworthiness_status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No condition inspections on record.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Confirmation Dialog */}
      <Modal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        title="Confirm Bus Archival"
        subtitle="Historical maintenance and odometer logs will be preserved safely"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to archive bus <strong className="text-slate-900">{busToArchive?.bus_number} ({busToArchive?.registration_number})</strong>?
            Archived buses are removed from active operations but kept for reporting and audit history.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsArchiveConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
            >
              Confirm Archival
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
