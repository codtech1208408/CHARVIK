import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Plus,
  Search,
  MapPin,
  Clock,
  Bus,
  User,
  Edit,
  Trash2,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RouteItem {
  id: number;
  route_code: string;
  route_name: string;
  origin: string;
  destination: string;
  total_distance_km: number;
  morning_time: string;
  evening_time: string;
  total_stops: number;
  assigned_bus_number: string;
  assigned_driver_name: string;
  status: 'Active' | 'Inactive' | 'Under Review';
  trip_amount?: number;
  operator_commission?: number;
}

const STORAGE_KEY = 'charvik_route_management_data';

const DEFAULT_ROUTES: RouteItem[] = [
  {
    id: 1,
    route_code: 'RT-101',
    route_name: 'Kukatpally - HITEC City Express',
    origin: 'Kukatpally Depot',
    destination: 'HITEC City Tech Park',
    total_distance_km: 22,
    morning_time: '07:15 AM',
    evening_time: '05:45 PM',
    total_stops: 6,
    assigned_bus_number: 'TS09-UA-1234',
    assigned_driver_name: 'Ramesh Kumar',
    status: 'Active',
    trip_amount: 2500,
    operator_commission: 350
  },
  {
    id: 2,
    route_code: 'RT-204',
    route_name: 'Secunderabad - Gachibowli Shuttle',
    origin: 'Secunderabad Station',
    destination: 'Gachibowli Financial Dist',
    total_distance_km: 28,
    morning_time: '07:30 AM',
    evening_time: '06:00 PM',
    total_stops: 8,
    assigned_bus_number: 'TS09-UA-5678',
    assigned_driver_name: 'Suresh Babu',
    status: 'Active',
    trip_amount: 2800,
    operator_commission: 400
  },
  {
    id: 3,
    route_code: 'RT-305',
    route_name: 'Dilsukhnagar - Madhapur Metro Link',
    origin: 'Dilsukhnagar Hub',
    destination: 'Madhapur Cyber Towers',
    total_distance_km: 24,
    morning_time: '08:00 AM',
    evening_time: '06:30 PM',
    total_stops: 7,
    assigned_bus_number: 'TS09-UB-9012',
    assigned_driver_name: 'Venkatesh Rao',
    status: 'Active',
    trip_amount: 2400,
    operator_commission: 300
  }
];

export const RouteManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase().includes('admin');
  const { success, error } = useToast();

  const [routes, setRoutes] = useState<RouteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_ROUTES;
    } catch {
      return DEFAULT_ROUTES;
    }
  });

  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);

  const [formData, setFormData] = useState<Partial<RouteItem>>({
    route_code: '',
    route_name: '',
    origin: '',
    destination: '',
    total_distance_km: 25,
    morning_time: '07:30 AM',
    evening_time: '05:45 PM',
    total_stops: 8,
    assigned_bus_number: '',
    assigned_driver_name: '',
    status: 'Active',
    trip_amount: undefined,
    operator_commission: undefined
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch {}
  }, [routes]);

  useEffect(() => {
    async function loadAux() {
      try {
        const [bData, dData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getEmployees({ role: 'Driver' }).catch(() => [])
        ]);
        setBuses(Array.isArray(bData) ? bData : []);
        setDrivers(Array.isArray(dData) ? dData : []);
      } catch {}
    }
    loadAux();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      route_code: `RT-${Math.floor(100 + Math.random() * 900)}`,
      route_name: '',
      origin: 'Kukatpally Depot',
      destination: 'HITEC City Tech Park',
      total_distance_km: 22,
      morning_time: '07:15 AM',
      evening_time: '05:45 PM',
      total_stops: 6,
      assigned_bus_number: buses[0]?.bus_number || '',
      assigned_driver_name: drivers[0]?.full_name || '',
      status: 'Active',
      trip_amount: undefined,
      operator_commission: undefined
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rt: RouteItem) => {
    setEditingRoute(rt);
    setFormData({ ...rt });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_name || !formData.route_code) {
      error('Please enter route code and route name.');
      return;
    }

    if (editingRoute) {
      const updated = routes.map((r) =>
        r.id === editingRoute.id
          ? ({
              ...r,
              ...formData,
              trip_amount: formData.trip_amount !== undefined ? Number(formData.trip_amount) : r.trip_amount,
              operator_commission: formData.operator_commission !== undefined ? Number(formData.operator_commission) : r.operator_commission
            } as RouteItem)
          : r
      );
      setRoutes(updated);
      success('Route updated successfully.');
    } else {
      const newItem: RouteItem = {
        id: Date.now(),
        route_code: formData.route_code!,
        route_name: formData.route_name!,
        origin: formData.origin || 'Main Hub',
        destination: formData.destination || 'Terminus',
        total_distance_km: Number(formData.total_distance_km) || 0,
        morning_time: formData.morning_time || '07:30 AM',
        evening_time: formData.evening_time || '06:00 PM',
        total_stops: Number(formData.total_stops) || 5,
        assigned_bus_number: formData.assigned_bus_number || 'Unassigned',
        assigned_driver_name: formData.assigned_driver_name || 'Unassigned',
        status: (formData.status as any) || 'Active',
        trip_amount: formData.trip_amount !== undefined ? Number(formData.trip_amount) : 0,
        operator_commission: formData.operator_commission !== undefined ? Number(formData.operator_commission) : 0
      };
      setRoutes([newItem, ...routes]);
      success('New route created successfully.');
    }
    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    setRoutes(routes.filter((r) => r.id !== id));
    success('Route deleted.');
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.route_code.toLowerCase().includes(search.toLowerCase()) ||
      r.route_name.toLowerCase().includes(search.toLowerCase()) ||
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-500" />
            <span>Route Management & Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure transit lines, scheduled stops, morning/evening shifts, and assigned fleet assets.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Route</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Transit Routes</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {routes.filter((r) => r.status === 'Active').length} Routes
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational transport corridors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Vehicles</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              {routes.filter((r) => r.assigned_bus_number && r.assigned_bus_number !== 'Unassigned').length} Buses
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Dedicated fleet buses</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Route Length</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {routes.length
                ? Math.round(routes.reduce((acc, r) => acc + r.total_distance_km, 0) / routes.length)
                : 0}{' '}
              KM
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Average one-way distance</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Avg Driver Trip Rate</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                ₹{routes.length
                  ? Math.round(routes.reduce((acc, r) => acc + (r.trip_amount || 0), 0) / routes.length).toLocaleString('en-IN')
                  : 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Payable to driver per trip</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by route code, name, origin, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Under Review">Under Review</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Route Name</th>
                <th className="py-3 px-4">Origin & Destination</th>
                <th className="py-3 px-4">Distance & Stops</th>
                <th className="py-3 px-4">Timings (Morning / Eve)</th>
                <th className="py-3 px-4">Assigned Bus & Driver</th>
                {isAdmin && <th className="py-3 px-4">Trip Amount & Commission</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                    No routes created yet. Click &quot;Add New Route&quot; to configure your first route.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{r.route_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.route_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <span>{r.origin}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{r.destination}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{r.total_distance_km} KM</p>
                      <p className="text-[11px] text-slate-400">{r.total_stops} intermediate stops</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800">
                        <span className="font-semibold text-blue-600">AM:</span> {r.morning_time}
                      </p>
                      <p className="text-slate-800">
                        <span className="font-semibold text-purple-600">PM:</span> {r.evening_time}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.assigned_bus_number || 'Unassigned'}</p>
                      <p className="text-[11px] text-slate-500">{r.assigned_driver_name || 'No driver assigned'}</p>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Trip:</span>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              ₹{r.trip_amount !== undefined ? Number(r.trip_amount).toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Comm:</span>
                            <span className="font-mono font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              ₹{r.operator_commission !== undefined ? Number(r.operator_commission).toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
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
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingRoute ? 'Edit Transit Route' : 'Configure New Transit Route'}
        subtitle="Define origin, destination, timings, stops, and vehicle assignments"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Route Code *</label>
              <input
                type="text"
                required
                value={formData.route_code || ''}
                onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                placeholder="e.g. RT-101"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Route Title / Name *</label>
              <input
                type="text"
                required
                value={formData.route_name || ''}
                onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                placeholder="e.g. HITEC City Corporate Express"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Origin Point *</label>
              <input
                type="text"
                required
                value={formData.origin || ''}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Start location"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Destination Point *</label>
              <input
                type="text"
                required
                value={formData.destination || ''}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="End location"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total One-Way KM</label>
              <input
                type="number"
                min="1"
                value={formData.total_distance_km ?? ''}
                onChange={(e) => setFormData({ ...formData, total_distance_km: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Stops</label>
              <input
                type="number"
                min="0"
                value={formData.total_stops ?? ''}
                onChange={(e) => setFormData({ ...formData, total_stops: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Morning Departure Time</label>
              <input
                type="text"
                value={formData.morning_time || ''}
                onChange={(e) => setFormData({ ...formData, morning_time: e.target.value })}
                placeholder="e.g. 07:15 AM"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Evening Return Time</label>
              <input
                type="text"
                value={formData.evening_time || ''}
                onChange={(e) => setFormData({ ...formData, evening_time: e.target.value })}
                placeholder="e.g. 05:45 PM"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Fleet Bus</label>
              <select
                value={formData.assigned_bus_number || ''}
                onChange={(e) => setFormData({ ...formData, assigned_bus_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- Choose Bus --</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.bus_number}>
                    {b.bus_number} ({b.registration_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Driver</label>
              <select
                value={formData.assigned_driver_name || ''}
                onChange={(e) => setFormData({ ...formData, assigned_driver_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.full_name}>
                    {d.full_name} ({d.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Admin Only: Trip Amount & Operator Commission */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trip Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.trip_amount !== undefined ? formData.trip_amount : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trip_amount: e.target.value === '' ? undefined : Number(e.target.value)
                      })
                    }
                    placeholder="e.g. 2500"
                    className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operator Commission (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.operator_commission !== undefined ? formData.operator_commission : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operator_commission: e.target.value === '' ? undefined : Number(e.target.value)
                      })
                    }
                    placeholder="e.g. 350"
                    className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
            >
              {editingRoute ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
