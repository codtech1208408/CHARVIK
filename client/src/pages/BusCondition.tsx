import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Bus,
  Eye,
  Camera,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { BusConditionInspection, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const BusCondition: React.FC = () => {
  const { success, error } = useToast();

  const [inspections, setInspections] = useState<BusConditionInspection[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');
  const [roadworthinessFilter, setRoadworthinessFilter] = useState('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<BusConditionInspection | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: '',
    odometer_km: '',
    inspector_name: '',
    exterior_body: 'Good',
    tyre_condition: 'Good',
    brake_condition: 'Good',
    engine_condition: 'Good',
    battery_condition: 'Good',
    ac_condition: 'Good',
    lights_condition: 'Good',
    mirrors_condition: 'Good',
    windshield_condition: 'Good',
    wiper_condition: 'Good',
    doors_emergency_exits: 'Good',
    seat_condition: 'Good',
    safety_equipment: 'Good',
    fluid_levels: 'Good',
    visible_leaks: 'Good',
    roadworthiness_status: 'Fit for Service',
    defects_found: '',
    corrective_action_required: '',
    inspector_remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBus, roadworthinessFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insData, busesData] = await Promise.all([
        api.getBusConditions({
          bus_id: selectedBus || undefined,
          roadworthiness: roadworthinessFilter !== 'All' ? roadworthinessFilter : undefined
        }),
        api.getBuses()
      ]);
      setInspections(insData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load inspections');
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
      inspection_time: '11:00',
      odometer_km: currentKm,
      inspector_name: 'K. Satyanarayana (Senior Inspector)',
      exterior_body: 'Good',
      tyre_condition: 'Good',
      brake_condition: 'Good',
      engine_condition: 'Good',
      battery_condition: 'Good',
      ac_condition: 'Good',
      lights_condition: 'Good',
      mirrors_condition: 'Good',
      windshield_condition: 'Good',
      wiper_condition: 'Good',
      doors_emergency_exits: 'Good',
      seat_condition: 'Good',
      safety_equipment: 'Good',
      fluid_levels: 'Good',
      visible_leaks: 'Good',
      roadworthiness_status: 'Fit for Service',
      defects_found: '',
      corrective_action_required: '',
      inspector_remarks: 'Vehicle inspected and cleared for service.'
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.inspector_name) {
      error('Bus and inspector name are required');
      return;
    }
    try {
      await api.createBusCondition(formData);
      success('Bus condition inspection checklist recorded!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save inspection');
    }
  };

  const checklistItems = [
    { key: 'exterior_body', label: 'Exterior Body & Paint' },
    { key: 'tyre_condition', label: 'Tyre Condition & Tread' },
    { key: 'brake_condition', label: 'Brake Operation & Lining' },
    { key: 'engine_condition', label: 'Engine Smoothness & Sound' },
    { key: 'battery_condition', label: 'Battery & Starting Health' },
    { key: 'ac_condition', label: 'AC & Cabin Cooling' },
    { key: 'lights_condition', label: 'Headlights, Indicators & Tail' },
    { key: 'mirrors_condition', label: 'Side & Rearview Mirrors' },
    { key: 'windshield_condition', label: 'Windshield Glass & Crack Test' },
    { key: 'wiper_condition', label: 'Wipers & Washer Nozzles' },
    { key: 'doors_emergency_exits', label: 'Doors & Emergency Exit Locks' },
    { key: 'seat_condition', label: 'Passenger Seats & Belts' },
    { key: 'safety_equipment', label: 'Fire Extinguisher & First Aid' },
    { key: 'fluid_levels', label: 'Coolant, Brake & Lube Levels' },
    { key: 'visible_leaks', label: 'Underbody Fluid Leaks Check' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Bus Condition & Roadworthiness Inspection</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct 15-point safety inspection checklists, identify mechanical defects, and certify vehicle road fitness.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection Checklist</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Fit for Service', 'Fit with Restrictions', 'Not Fit for Service'].map((st) => (
            <button
              key={st}
              onClick={() => setRoadworthinessFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                roadworthinessFilter === st
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref. No.</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Inspection Date & Time</th>
                <th className="py-3 px-4">Odometer (KM)</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Roadworthiness Fitness</th>
                <th className="py-3 px-4">Identified Defects</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading inspection records...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No inspection checklists found.
                  </td>
                </tr>
              ) : (
                inspections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.inspection_ref}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{item.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{item.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.inspection_date} <span className="text-[10px] text-slate-400">({item.inspection_time || '10:00'})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{item.odometer_km?.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.inspector_name}</td>
                    <td className="py-3 px-4">
                      <Badge status={item.roadworthiness_status} />
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-600">
                      {item.defects_found || <span className="text-emerald-600 font-semibold">None reported (Clean)</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewingInspection(item)}
                        className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer gap-1"
                        title="View Full 15-Point Checklist"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Checklist</span>
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
        title="Conduct 15-Point Bus Safety Inspection"
        subtitle="Verify mechanical integrity, safety accessories, and cabin cleanliness"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Date *</label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Name *</label>
              <input
                type="text"
                value={formData.inspector_name}
                onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>
          </div>

          {/* 15-Point Inspection Checklist Grid */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Safety & Mechanical Inspection Checklist (Mark Condition)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {checklistItems.map((item) => (
                <div key={item.key} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800 block mb-1 truncate">{item.label}</span>
                  <select
                    value={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                    className="w-full text-xs p-1 rounded-md border border-slate-200 bg-slate-50 outline-none"
                  >
                    <option value="Good">Good</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Defective">Defective</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roadworthiness Status *</label>
              <select
                value={formData.roadworthiness_status}
                onChange={(e) => setFormData({ ...formData, roadworthiness_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
              >
                <option value="Fit for Service">Fit for Service</option>
                <option value="Fit with Restrictions">Fit with Restrictions</option>
                <option value="Not Fit for Service">Not Fit for Service (Ground Vehicle)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
              <input
                type="number"
                value={formData.odometer_km}
                onChange={(e) => setFormData({ ...formData, odometer_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Defects Found (If Any)</label>
              <textarea
                rows={2}
                value={formData.defects_found}
                onChange={(e) => setFormData({ ...formData, defects_found: e.target.value })}
                placeholder="State any failed safety check..."
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corrective Action Required</label>
              <textarea
                rows={2}
                value={formData.corrective_action_required}
                onChange={(e) => setFormData({ ...formData, corrective_action_required: e.target.value })}
                placeholder="Required workshop job or maintenance..."
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Remarks</label>
            <input
              type="text"
              value={formData.inspector_remarks}
              onChange={(e) => setFormData({ ...formData, inspector_remarks: e.target.value })}
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
              Submit Inspection
            </button>
          </div>
        </form>
      </Modal>

      {/* View Checklist Details Modal */}
      {viewingInspection && (
        <Modal
          isOpen={!!viewingInspection}
          onClose={() => setViewingInspection(null)}
          title={`Checklist Inspection ${viewingInspection.inspection_ref}`}
          subtitle={`Bus: ${viewingInspection.bus_number} (${viewingInspection.registration_number}) • Inspector: ${viewingInspection.inspector_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Roadworthiness Fitness</span>
                <Badge status={viewingInspection.roadworthiness_status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Inspection Date</span>
                <span className="font-bold text-slate-800">{viewingInspection.inspection_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Odometer</span>
                <span className="font-bold text-slate-800">{viewingInspection.odometer_km?.toLocaleString()} km</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {checklistItems.map((item) => (
                <div key={item.key} className="p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <Badge status={(viewingInspection as any)[item.key] || 'Good'} />
                </div>
              ))}
            </div>

            {viewingInspection.defects_found && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                <span className="font-bold text-rose-800 block">Defects Found:</span>
                <p className="text-rose-700 mt-0.5">{viewingInspection.defects_found}</p>
                {viewingInspection.corrective_action_required && (
                  <p className="text-slate-700 font-medium mt-1">Action: {viewingInspection.corrective_action_required}</p>
                )}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Inspector Remarks:</span>
              <p className="mt-0.5">{viewingInspection.inspector_remarks || 'None'}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
