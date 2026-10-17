import React, { useState, useEffect } from 'react';
import {
  Disc,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RotateCw,
  Edit,
  Bus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { TyreRecord, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const TyreMaintenance: React.FC = () => {
  const { success, error } = useToast();

  const [tyres, setTyres] = useState<TyreRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedTyre, setSelectedTyre] = useState<TyreRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    bus_id: '',
    tyre_serial_number: '',
    brand: '',
    size: '',
    tyre_position: 'Front Left',
    installation_date: '',
    installation_km: '',
    last_inspection_date: new Date().toISOString().split('T')[0],
    tread_depth_mm: '',
    tyre_pressure_psi: '',
    condition: 'Good',
    supplier: '',
    cost: '',
    remarks: ''
  });

  // Rotation State
  const [rotationData, setRotationData] = useState({
    new_position: 'Rear Right',
    rotation_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tyreData, busesData] = await Promise.all([
        api.getTyreRecords({ bus_id: selectedBus || undefined }),
        api.getBuses()
      ]);
      setTyres(tyreData);
      setBuses(busesData);
    } catch (err: any) {
      error(err.message || 'Failed to load tyre records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const firstBus = buses[0];
    setFormData({
      bus_id: firstBus ? String(firstBus.id) : '',
      tyre_serial_number: `TYRE-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      brand: 'MRF Steel Muscle',
      size: '295/80 R22.5',
      tyre_position: 'Front Left',
      installation_date: '2025-06-15',
      installation_km: firstBus ? firstBus.current_odometer_km : 50000,
      last_inspection_date: new Date().toISOString().split('T')[0],
      tread_depth_mm: 10.0,
      tyre_pressure_psi: 110,
      condition: 'Good',
      supplier: 'Tirumala Tyres Pvt Ltd',
      cost: 18500,
      remarks: 'Mounted on vehicle'
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.tyre_serial_number) {
      error('Bus and tyre serial number are required');
      return;
    }
    try {
      await api.createTyreRecord(formData);
      success('Tyre record saved successfully!');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save tyre record');
    }
  };

  const handleOpenRotate = (t: TyreRecord) => {
    setSelectedTyre(t);
    setRotationData({
      new_position: t.tyre_position.includes('Front') ? 'Rear Right' : 'Front Left',
      rotation_date: new Date().toISOString().split('T')[0],
      remarks: `Rotated from ${t.tyre_position}`
    });
    setIsRotateModalOpen(true);
  };

  const handleConfirmRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTyre) return;
    try {
      await api.updateTyreRecord(selectedTyre.id, {
        ...selectedTyre,
        tyre_position: rotationData.new_position,
        rotation_date: rotationData.rotation_date,
        remarks: `${selectedTyre.remarks || ''} [${rotationData.remarks} on ${rotationData.rotation_date}]`
      });
      success(`Tyre position rotated to ${rotationData.new_position}!`);
      setIsRotateModalOpen(false);
      setSelectedTyre(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update tyre rotation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-600" />
            <span>Tyre Maintenance & Inspection Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor tread depth, tyre pressure, positions, rotations, and replacement history per bus.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mount / Register Tyre</span>
        </button>
      </div>

      {/* Filter and Bus Selection */}
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

        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold self-start sm:self-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tread &gt; 4mm (Safe)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Tread &le; 3.5mm (Replace Soon)
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Tyre Serial</th>
                <th className="py-3 px-4">Brand & Size</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Tread Depth</th>
                <th className="py-3 px-4">Pressure (PSI)</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Last Inspected</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading tyre records...
                  </td>
                </tr>
              ) : tyres.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No tyre maintenance records found.
                  </td>
                </tr>
              ) : (
                tyres.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{t.bus_number}</span>
                      <span className="block text-[11px] text-blue-700 font-semibold">{t.registration_number}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.tyre_serial_number}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{t.brand}</span>
                      <span className="block text-[11px] text-slate-400">{t.size}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{t.tyre_position}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          (t.tread_depth_mm || 0) <= 3.5 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {t.tread_depth_mm} mm
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{t.tyre_pressure_psi} psi</td>
                    <td className="py-3 px-4">
                      <Badge status={t.condition} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{t.last_inspection_date || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenRotate(t)}
                        className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer gap-1"
                        title="Rotate Tyre Position"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mount New Tyre Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register & Mount Tyre"
        subtitle="Track tyre serial number, installation date and axle position"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Serial Number *</label>
              <input
                type="text"
                value={formData.tyre_serial_number}
                onChange={(e) => setFormData({ ...formData, tyre_serial_number: e.target.value })}
                placeholder="MRF-2024-9988"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Position *</label>
              <select
                value={formData.tyre_position}
                onChange={(e) => setFormData({ ...formData, tyre_position: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Front Left">Front Left</option>
                <option value="Front Right">Front Right</option>
                <option value="Rear Left">Rear Left</option>
                <option value="Rear Right">Rear Right</option>
                <option value="Inner Left">Inner Left</option>
                <option value="Inner Right">Inner Right</option>
                <option value="Spare">Spare</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tread Depth (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tread_depth_mm}
                onChange={(e) => setFormData({ ...formData, tread_depth_mm: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pressure (PSI)</label>
              <input
                type="number"
                value={formData.tyre_pressure_psi}
                onChange={(e) => setFormData({ ...formData, tyre_pressure_psi: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Good">Good</option>
                <option value="Worn">Worn</option>
                <option value="Damaged">Damaged</option>
                <option value="Needs Replacement">Needs Replacement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Cost (₹)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
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
              Save Tyre Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Tyre Rotation Modal */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => setIsRotateModalOpen(false)}
        title="Tyre Rotation Execution"
        subtitle={`Rotate tyre ${selectedTyre?.tyre_serial_number} from current position: ${selectedTyre?.tyre_position}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmRotate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Axle Position *</label>
            <select
              value={rotationData.new_position}
              onChange={(e) => setRotationData({ ...rotationData, new_position: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            >
              <option value="Front Left">Front Left</option>
              <option value="Front Right">Front Right</option>
              <option value="Rear Left">Rear Left</option>
              <option value="Rear Right">Rear Right</option>
              <option value="Inner Left">Inner Left</option>
              <option value="Inner Right">Inner Right</option>
              <option value="Spare">Spare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rotation Date</label>
            <input
              type="date"
              value={rotationData.rotation_date}
              onChange={(e) => setRotationData({ ...rotationData, rotation_date: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technician Notes</label>
            <input
              type="text"
              value={rotationData.remarks}
              onChange={(e) => setRotationData({ ...rotationData, remarks: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRotateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Confirm Rotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
