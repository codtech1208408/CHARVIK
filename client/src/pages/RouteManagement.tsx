import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Plus,
  Search,
  MapPin,
  Bus,
  Edit,
  Trash2,
  ArrowRight,
  IndianRupee,
  Activity,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { PrintButton } from '../components/common/PrintButton';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export type VehicleType = 'Full Sleeper' | 'Seating/Sleeper' | 'Seater';

export interface RouteItem {
  id: number;
  service_number: string;
  starting_city: string;
  ending_city: string;
  destination_km: number;
  vehicle_type: VehicleType;
  status: 'Active' | 'Inactive';
  trip_amount?: number;
  operator_commission?: number;
}

const STORAGE_KEY = 'charvik_route_management_data';

const DEFAULT_ROUTES: RouteItem[] = [
  { id: 1, service_number: '2080', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 2, service_number: '2168', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 3, service_number: '2214', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 4, service_number: '1838', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 5, service_number: '2081', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 6, service_number: '2215', starting_city: 'Bengaluru', ending_city: 'Tirupati', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 7, service_number: '2173', starting_city: 'Tirupati', ending_city: 'Bengaluru', destination_km: 250, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 16000, operator_commission: 2400 },
  { id: 8, service_number: '3473', starting_city: 'Tirupati', ending_city: 'Vijayawada', destination_km: 380, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 20000, operator_commission: 3000 },
  { id: 9, service_number: '3474', starting_city: 'Vijayawada', ending_city: 'Tirupati', destination_km: 380, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 20000, operator_commission: 3000 },
  { id: 10, service_number: '3483', starting_city: 'Tirupati', ending_city: 'Hyderabad', destination_km: 560, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 26000, operator_commission: 3900 },
  { id: 11, service_number: '3482', starting_city: 'Hyderabad', ending_city: 'Tirupati', destination_km: 560, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 26000, operator_commission: 3900 },
  { id: 12, service_number: '1525', starting_city: 'Tirupati', ending_city: 'Hyderabad', destination_km: 560, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 26000, operator_commission: 3900 },
  { id: 13, service_number: '1526', starting_city: 'Hyderabad', ending_city: 'Tirupati', destination_km: 560, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 26000, operator_commission: 3900 },
  { id: 14, service_number: '2044', starting_city: 'Hyderabad', ending_city: 'Vijayawada', destination_km: 275, vehicle_type: 'Seating/Sleeper', status: 'Active', trip_amount: 14000, operator_commission: 2000 },
  { id: 15, service_number: '2046', starting_city: 'Vijayawada', ending_city: 'Hyderabad', destination_km: 275, vehicle_type: 'Seating/Sleeper', status: 'Active', trip_amount: 14000, operator_commission: 2000 },
  { id: 16, service_number: '1948', starting_city: 'Hyderabad', ending_city: 'Chirala', destination_km: 305, vehicle_type: 'Seating/Sleeper', status: 'Active', trip_amount: 15500, operator_commission: 2200 },
  { id: 17, service_number: 'SRV-101', starting_city: 'Hyderabad', ending_city: 'Bangalore', destination_km: 570, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 25000, operator_commission: 3500 },
  { id: 18, service_number: 'SRV-204', starting_city: 'Hyderabad', ending_city: 'Vijayawada', destination_km: 275, vehicle_type: 'Seating/Sleeper', status: 'Active', trip_amount: 14000, operator_commission: 2000 },
  { id: 19, service_number: 'SRV-305', starting_city: 'Bangalore', ending_city: 'Chennai', destination_km: 345, vehicle_type: 'Full Sleeper', status: 'Active', trip_amount: 18000, operator_commission: 2500 },
  { id: 20, service_number: 'SRV-412', starting_city: 'Hyderabad', ending_city: 'Visakhapatnam', destination_km: 620, vehicle_type: 'Seating/Sleeper', status: 'Active', trip_amount: 28000, operator_commission: 4000 }
];

const normalizeRoute = (item: any, idx: number): RouteItem => {
  return {
    id: Number(item.id || idx + 1),
    service_number: item.service_number || item.route_code || `SRV-${100 + idx}`,
    starting_city: item.starting_city || item.origin || '',
    ending_city: item.ending_city || item.destination || '',
    destination_km: Number(item.destination_km ?? item.total_distance_km ?? 0),
    vehicle_type: (['Full Sleeper', 'Seating/Sleeper', 'Seater'].includes(item.vehicle_type)
      ? item.vehicle_type
      : 'Full Sleeper') as VehicleType,
    status: item.status === 'Inactive' ? 'Inactive' : 'Active',
    trip_amount: item.trip_amount !== undefined ? Number(item.trip_amount) : undefined,
    operator_commission: item.operator_commission !== undefined ? Number(item.operator_commission) : undefined
  };
};

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
          return parsed.map((item, idx) => normalizeRoute(item, idx));
        }
      }
      return DEFAULT_ROUTES;
    } catch {
      return DEFAULT_ROUTES;
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);

  // Sync with backend API on mount
  useEffect(() => {
    api.getRoutes().then((remoteRoutes) => {
      if (Array.isArray(remoteRoutes) && remoteRoutes.length > 0) {
        const normalized = remoteRoutes.map((item, idx) => normalizeRoute(item, idx));
        setRoutes(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    }).catch(() => {});
  }, []);

  const [formData, setFormData] = useState<{
    service_number: string;
    starting_city: string;
    ending_city: string;
    destination_km: string | number;
    vehicle_type: string;
    status: string;
    trip_amount?: string | number;
    operator_commission?: string | number;
  }>({
    service_number: '',
    starting_city: '',
    ending_city: '',
    destination_km: '',
    vehicle_type: '',
    status: '',
    trip_amount: undefined,
    operator_commission: undefined
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch {}
  }, [routes]);

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      service_number: '',
      starting_city: '',
      ending_city: '',
      destination_km: '',
      vehicle_type: '',
      status: '',
      trip_amount: undefined,
      operator_commission: undefined
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rt: RouteItem) => {
    setEditingRoute(rt);
    setFormData({
      service_number: rt.service_number,
      starting_city: rt.starting_city,
      ending_city: rt.ending_city,
      destination_km: rt.destination_km,
      vehicle_type: rt.vehicle_type,
      status: rt.status,
      trip_amount: rt.trip_amount,
      operator_commission: rt.operator_commission
    });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_number?.trim()) {
      error('Please enter a service number.');
      return;
    }

    if (!formData.starting_city?.trim()) {
      error('Please enter starting city (from).');
      return;
    }

    if (!formData.ending_city?.trim()) {
      error('Please enter ending city (to).');
      return;
    }

    if (
      formData.destination_km === undefined ||
      formData.destination_km === null ||
      formData.destination_km === '' ||
      isNaN(Number(formData.destination_km)) ||
      Number(formData.destination_km) < 0
    ) {
      error('Please enter a valid destination KM (0 or greater).');
      return;
    }

    if (!formData.vehicle_type) {
      error('Please select a vehicle type.');
      return;
    }

    if (!formData.status) {
      error('Please select route status (Active or Inactive).');
      return;
    }

    const payload = {
      service_number: formData.service_number.trim(),
      starting_city: formData.starting_city.trim(),
      ending_city: formData.ending_city.trim(),
      destination_km: Number(formData.destination_km),
      vehicle_type: formData.vehicle_type as VehicleType,
      status: formData.status as 'Active' | 'Inactive',
      trip_amount: editingRoute
        ? editingRoute.trip_amount
        : (formData.trip_amount !== undefined && formData.trip_amount !== '' ? Number(formData.trip_amount) : undefined),
      operator_commission: editingRoute
        ? editingRoute.operator_commission
        : (formData.operator_commission !== undefined && formData.operator_commission !== '' ? Number(formData.operator_commission) : undefined)
    };

    if (editingRoute) {
      const updated = routes.map((r) =>
        r.id === editingRoute.id ? ({ ...r, ...payload } as RouteItem) : r
      );
      setRoutes(updated);
      api.updateRoute(editingRoute.id, payload).catch(() => {});
      success(`Service ${formData.service_number.trim()} updated successfully.`);
    } else {
      const newItem: RouteItem = {
        id: Date.now(),
        ...payload
      };
      setRoutes([newItem, ...routes]);
      api.createRoute(payload).catch(() => {});
      success(`New service ${newItem.service_number} created successfully.`);
    }

    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    const target = routes.find((r) => r.id === id);
    const targetName = target ? target.service_number : 'this route';
    if (!window.confirm(`Are you sure you want to delete service "${targetName}"?`)) return;
    setRoutes(routes.filter((r) => r.id !== id));
    api.deleteRoute(id).catch(() => {});
    success(`Service ${targetName} deleted successfully.`);
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.service_number.toLowerCase().includes(search.toLowerCase()) ||
      r.starting_city.toLowerCase().includes(search.toLowerCase()) ||
      r.ending_city.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesVehicleType = vehicleTypeFilter === 'All' || r.vehicle_type === vehicleTypeFilter;
    return matchesSearch && matchesStatus && matchesVehicleType;
  });

  const activeRoutesCount = routes.filter((r) => r.status === 'Active').length;
  const fullSleeperCount = routes.filter((r) => r.vehicle_type === 'Full Sleeper').length;
  const avgDistance = routes.length
    ? Math.round(routes.reduce((acc, r) => acc + (r.destination_km || 0), 0) / routes.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Route Management & Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure transit service numbers, starting and ending destinations, kilometer spans, vehicle types, and operational statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            title="Transit Route Corridor & Dispatch Sheet"
            subtitle={`Total Routes: ${filteredRoutes.length} • Active: ${activeRoutesCount}`}
            targetId="route-management-table-wrap"
          />
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Route</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Transit Routes</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {activeRoutesCount} / {routes.length} Active
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational transport corridors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Full Sleeper Routes</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {fullSleeperCount} Routes
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Luxury overnight corridors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Destination KM</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {avgDistance} KM
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
            placeholder="Search by service number, starting city, ending city, vehicle type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium cursor-pointer"
          >
            <option value="All">All Vehicle Types</option>
            <option value="Full Sleeper">Full Sleeper</option>
            <option value="Seating/Sleeper">Seating/Sleeper</option>
            <option value="Seater">Seater</option>
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div id="route-management-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Service Number</th>
                <th className="py-3 px-4">Starting City (From)</th>
                <th className="py-3 px-4">Ending City (To)</th>
                <th className="py-3 px-4">Destination KM</th>
                <th className="py-3 px-4">Vehicle Type</th>
                <th className="py-3 px-4">Route Status</th>
                {isAdmin && <th className="py-3 px-4">Trip Amount & Commission</th>}
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Navigation className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-700">
                        {routes.length > 0 ? 'No transit routes match current filter' : 'No transit routes found'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm text-center">
                        {routes.length > 0 ? (
                          <span>
                            {routes.length} total route(s) configured. None match {vehicleTypeFilter !== 'All' ? `"${vehicleTypeFilter}"` : ''} {statusFilter !== 'All' ? `"${statusFilter}"` : ''} {search ? `"${search}"` : ''}.
                          </span>
                        ) : (
                          <span>No service routes configured yet. Use the &quot;+ Add New Route&quot; button above to create one.</span>
                        )}
                      </p>
                      {routes.length > 0 && (vehicleTypeFilter !== 'All' || statusFilter !== 'All' || search) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('All');
                            setVehicleTypeFilter('All');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                        {r.service_number}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{r.starting_city}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.ending_city}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 font-mono">
                        {r.destination_km} KM
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                          r.vehicle_type === 'Full Sleeper'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : r.vehicle_type === 'Seating/Sleeper'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>{r.vehicle_type}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          r.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{r.status}</span>
                      </span>
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
                            <span className="font-mono font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              ₹{r.operator_commission !== undefined ? Number(r.operator_commission).toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

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
                          title="Delete Route"
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
        subtitle="Define service number, starting and ending city, destination KM, vehicle type, and status"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Service Number *
            </label>
            <input
              type="text"
              required
              value={formData.service_number || ''}
              onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
              placeholder="e.g. SRV-791"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting City (From) *
              </label>
              <input
                type="text"
                required
                value={formData.starting_city || ''}
                onChange={(e) => setFormData({ ...formData, starting_city: e.target.value })}
                placeholder="e.g. Hyderabad"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ending City (To) *
              </label>
              <input
                type="text"
                required
                value={formData.ending_city || ''}
                onChange={(e) => setFormData({ ...formData, ending_city: e.target.value })}
                placeholder="e.g. Bangalore"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination KM *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.destination_km ?? ''}
                onChange={(e) => setFormData({ ...formData, destination_km: e.target.value })}
                placeholder="e.g. 570 or 0"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Type *
              </label>
              <select
                required
                value={formData.vehicle_type || ''}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="">-- Select Vehicle Type --</option>
                <option value="Full Sleeper">Full Sleeper</option>
                <option value="Seating/Sleeper">Seating/Sleeper</option>
                <option value="Seater">Seater</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Route Status *
            </label>
            <select
              required
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none cursor-pointer"
            >
              <option value="">-- Select Status --</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Admin Only: Fixed Trip Amount & Operator Commission */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              {editingRoute ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      🔒 Fixed Financial Parameters
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Trip Amount</span>
                      <span className="text-sm font-mono font-black text-slate-800">
                        ₹{editingRoute.trip_amount !== undefined ? Number(editingRoute.trip_amount).toLocaleString('en-IN') : '0'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Cannot be modified</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Operator Commission</span>
                      <span className="text-sm font-mono font-black text-slate-800">
                        ₹{editingRoute.operator_commission !== undefined ? Number(editingRoute.operator_commission).toLocaleString('en-IN') : '0'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Cannot be modified</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        placeholder="e.g. 25000"
                        className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
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
                        placeholder="e.g. 3500"
                        className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors shadow-sm cursor-pointer"
            >
              {editingRoute ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
