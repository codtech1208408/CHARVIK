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
  RotateCcw,
  Printer,
  Coins,
  Milestone,
  Check,
  X,
  BarChart2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatusToggle } from '../components/common/StatusToggle';
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
  vehicle_type?: VehicleType;
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
    }).catch(() => { });
  }, []);

  const [formData, setFormData] = useState<{
    service_number: string;
    starting_city: string;
    ending_city: string;
    destination_km: string | number;
    status: 'Active' | 'Inactive';
    trip_amount?: string | number;
    operator_commission?: string | number;
  }>({
    service_number: '',
    starting_city: '',
    ending_city: '',
    destination_km: '',
    status: 'Active',
    trip_amount: undefined,
    operator_commission: undefined
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch { }
  }, [routes]);

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      service_number: '',
      starting_city: '',
      ending_city: '',
      destination_km: '',
      status: 'Active',
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
      status: rt.status,
      trip_amount: rt.trip_amount,
      operator_commission: rt.operator_commission
    });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');

    if (!formData.service_number?.trim()) {
      if (!isUserAdmin) {
        error('Please enter a service number.');
        return;
      }
      formData.service_number = `SRV-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!formData.starting_city?.trim()) {
      if (!isUserAdmin) {
        error('Please enter starting city (from).');
        return;
      }
      formData.starting_city = 'Origin City';
    }

    if (!formData.ending_city?.trim()) {
      if (!isUserAdmin) {
        error('Please enter ending city (to).');
        return;
      }
      formData.ending_city = 'Destination City';
    }

    if (
      formData.destination_km === undefined ||
      formData.destination_km === null ||
      formData.destination_km === '' ||
      isNaN(Number(formData.destination_km)) ||
      Number(formData.destination_km) < 0
    ) {
      if (!isUserAdmin) {
        error('Please enter a valid destination KM (0 or greater).');
        return;
      }
      formData.destination_km = 0;
    }

    if (!formData.status) {
      if (!isUserAdmin) {
        error('Please select route status (Active or Inactive).');
        return;
      }
      formData.status = 'Active';
    }

    const payload = {
      service_number: formData.service_number.trim(),
      starting_city: formData.starting_city.trim(),
      ending_city: formData.ending_city.trim(),
      destination_km: Number(formData.destination_km),
      vehicle_type: (editingRoute?.vehicle_type || 'Full Sleeper') as VehicleType,
      status: (formData.status || 'Active') as 'Active' | 'Inactive',
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
      api.updateRoute(editingRoute.id, payload).catch((err: any) => {
        error(err.message || 'Failed to update service in database');
      });
      success(`Service ${formData.service_number.trim()} updated successfully.`);
    } else {
      const newItem: RouteItem = {
        id: Date.now(),
        ...payload
      };
      setRoutes([newItem, ...routes]);
      api.createRoute(payload).then((saved) => {
        if (saved && saved.id) {
          setRoutes((curr) => curr.map((r) => (r.id === newItem.id ? { ...r, id: saved.id } : r)));
        }
      }).catch((err: any) => {
        error(err.message || 'Failed to save new service to database');
      });
      success(`New service ${newItem.service_number} created successfully.`);
    }

    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    const target = routes.find((r) => r.id === id);
    const targetName = target ? target.service_number : 'this route';
    if (!window.confirm(`Are you sure you want to delete service "${targetName}"?`)) return;
    setRoutes(routes.filter((r) => r.id !== id));
    api.deleteRoute(id).catch((err: any) => {
      error(err.message || 'Failed to delete service from database');
    });
    success(`Service ${targetName} deleted successfully.`);
  };

  const handlePrintRoute = (r: RouteItem) => {
    const printContent = `
      <html>
      <head>
        <title>Route Details - ${r.service_number}</title>
        <style>
          @page { margin: 18mm 15mm; size: A4 portrait; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }
          .letterhead { display: flex; align-items: center; justify-content: space-between; padding: 0 0 14px 0; border-bottom: 3px solid #0E52A5; margin-bottom: 18px; }
          .letterhead img { height: 70px; width: auto; object-fit: contain; }
          .company-info { text-align: right; }
          .company-info h2 { font-size: 20px; font-weight: 900; color: #0B3A79; letter-spacing: 1px; }
          .company-info p { font-size: 10px; color: #555; margin-top: 2px; }
          .doc-title { text-align: center; margin-bottom: 18px; }
          .doc-title h3 { font-size: 16px; font-weight: 800; color: #0B3A79; text-transform: uppercase; letter-spacing: 1px; }
          .doc-title p { font-size: 11px; color: #666; margin-top: 3px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
          .info-box { background: #f4f8ff; border: 1px solid #c8daf5; border-radius: 8px; padding: 12px 14px; }
          .info-box label { font-size: 10px; font-weight: 700; color: #0E52A5; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
          .info-box span { font-size: 14px; font-weight: 800; color: #1a1a2e; }
          .info-box.highlight { background: #e8f0fe; border-color: #0B3A79; }
          .route-banner { background: linear-gradient(135deg, #0B3A79, #1E70EB); color: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
          .route-banner .city { font-size: 20px; font-weight: 900; }
          .route-banner .arrow { font-size: 24px; color: #90caf9; }
          .route-banner .km { font-size: 12px; color: #b3d4ff; margin-top: 2px; }
          .financials { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
          .fin-box { border: 2px solid #c8daf5; border-radius: 8px; padding: 12px 14px; text-align: center; }
          .fin-box label { font-size: 10px; font-weight: 700; color: #0E52A5; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
          .fin-box .amount { font-size: 22px; font-weight: 900; color: #0B3A79; }
          .footer { border-top: 1.5px solid #c8daf5; margin-top: 24px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .status-active { background: #d1fae5; color: #065f46; }
          .status-inactive { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <img src="/logo-compact.png" alt="Charvik Logo" />
          <div class="company-info">
            <h2>CHARVIK</h2>
            <p>Staffing Consultancy</p>
            <p>contact@charvikstaffing.com | +91 98765 43210</p>
          </div>
        </div>

        <div class="doc-title">
          <h3>Route Details</h3>
          <p>Service Number: <strong>${r.service_number}</strong> &nbsp;|&nbsp; Printed on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="route-banner">
          <div>
            <div class="city">${r.starting_city}</div>
            <div class="km">Departure</div>
          </div>
          <div class="arrow">&#8594;</div>
          <div style="text-align:center;">
            <div style="font-size:13px; color:#b3d4ff;">${r.destination_km} KM</div>
            <div class="km">${r.vehicle_type || 'N/A'}</div>
          </div>
          <div class="arrow">&#8594;</div>
          <div style="text-align:right;">
            <div class="city">${r.ending_city}</div>
            <div class="km">Destination</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <label>Service Number</label>
            <span>${r.service_number}</span>
          </div>
          <div class="info-box">
            <label>Vehicle Type</label>
            <span>${r.vehicle_type || 'N/A'}</span>
          </div>
          <div class="info-box">
            <label>Distance</label>
            <span>${r.destination_km} KM</span>
          </div>
          <div class="info-box highlight">
            <label>Status</label>
            <span class="status-badge ${r.status === 'Active' ? 'status-active' : 'status-inactive'}">${r.status}</span>
          </div>
        </div>

        <div class="financials">
          <div class="fin-box">
            <label>Trip Amount</label>
            <div class="amount">&#8377; ${(r.trip_amount ?? 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="fin-box">
            <label>Operator Commission</label>
            <div class="amount">&#8377; ${(r.operator_commission ?? 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="footer">
          <span>Generated by Charvik Fleet Management System</span>
          <span>Route ID: #${r.id} &nbsp;|&nbsp; ${new Date().toLocaleString('en-IN')}</span>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=800,height=700');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.service_number.toLowerCase().includes(search.toLowerCase()) ||
      r.starting_city.toLowerCase().includes(search.toLowerCase()) ||
      r.ending_city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRoutesCount = routes.filter((r) => r.status === 'Active').length;
  const inactiveRoutesCount = routes.length - activeRoutesCount;
  const avgDistance = routes.length
    ? Math.round(routes.reduce((acc, r) => acc + (r.destination_km || 0), 0) / routes.length)
    : 0;
  const avgTripAmount = routes.length
    ? Math.round(routes.reduce((acc, r) => acc + (Number(r.trip_amount) || 0), 0) / routes.length)
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
            Configure transit service numbers, starting and ending destinations, kilometer spans, and operational statuses.
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

      {/* Route Road & Map Corridor Illustration Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-3 sm:p-4 flex items-center justify-center bg-slate-50/40">
        <img
          src="/route-map-illustration.jpg?v=2"
          alt="Route Corridor & Map Illustration"
          className="max-h-[440px] sm:max-h-[480px] w-auto max-w-full object-contain rounded-2xl shadow-xs mx-auto block"
        />
      </div>

      {/* KPI Cards (Glowing Color Palettes) */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 sm:gap-5`}>
        {/* Card 1: Active Transit Routes (Emerald Gradient) */}
        <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Active Transit Routes</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
              {activeRoutesCount} / {routes.length} Active
            </h3>
            <p className="text-xs text-emerald-700/90 font-medium mt-1">Operational transport corridors</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Inactive Transit Routes (Orange / Amber Gradient) */}
        <div className="bg-gradient-to-br from-[#FFF5EC] via-[#FFF9F3] to-[#FFE7D1] border-2 border-[#FFD0A8] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-orange-950 uppercase tracking-wider">Inactive Transit Routes</p>
            <h3 className="text-2xl sm:text-3xl font-black text-orange-800 mt-1 font-mono">
              {inactiveRoutesCount} Routes
            </h3>
            <p className="text-xs text-orange-700/90 font-medium mt-1">Currently paused corridors</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F97316] to-[#EA580C] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Average Destination KM (Sky / Blue Gradient) */}
        <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Average Destination KM</p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 font-mono">
              {avgDistance} KM
            </h3>
            <p className="text-xs text-blue-700/90 font-medium mt-1">Average one-way distance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {isAdmin && (
          /* Card 4: Avg Driver Trip Rate (Purple Gradient) */
          <div className="bg-gradient-to-br from-[#F6F0FE] via-[#FAF6FE] to-[#E9DBFC] border-2 border-[#D7BFF9] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
            <div className="flex-1">
              <p className="text-xs font-black text-purple-950 uppercase tracking-wider">Avg Driver Trip Rate</p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-900 mt-1 font-mono">
                ₹{avgTripAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-purple-700/90 font-medium mt-1">Configured per-trip pay</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#7E22CE] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6" />
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
            placeholder="Search by service number, starting city, or ending city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
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
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-xs border-b border-blue-900/30">
              <tr>
                <th className="py-3 px-3 w-14 text-center">S.NO</th>
                <th className="py-3 px-3">Service Number</th>
                <th className="py-3 px-3">Starting City (From)</th>
                <th className="py-3 px-3">Ending City (To)</th>
                <th className="py-3 px-3">Destination KM</th>
                <th className="py-3 px-3">Route Status</th>
                {isAdmin && <th className="py-3 px-3">Trip Amount & Commission</th>}
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-400">
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
                            {routes.length} total route(s) configured. None match {statusFilter !== 'All' ? `"${statusFilter}"` : ''} {search ? `"${search}"` : ''}.
                          </span>
                        ) : (
                          <span>No service routes configured yet. Use the &quot;+ Add New Route&quot; button above to create one.</span>
                        )}
                      </p>
                      {routes.length > 0 && (statusFilter !== 'All' || search) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('All');
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
                    <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                        {r.service_number}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{r.starting_city}</span>
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.ending_city}</span>
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-800 font-mono">
                        {r.destination_km} KM
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <Badge status={r.status} />
                    </td>

                    {isAdmin && (
                      <td className="py-2 px-3">
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

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintRoute(r)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Print Route"
                        >
                          <Printer className="w-4 h-4" />
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
      {/* Modal - Styled Colorfully Matching Image 1 */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingRoute ? 'Edit Transit Route' : 'Configure New Transit Route'}
        subtitle="Define service number, starting and ending city, destination KM, and status"
        icon={<Navigation className="w-5 h-5 text-white" />}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
              <Bus className="w-3.5 h-3.5 text-blue-600" />
              <span>Service Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={formData.service_number || ''}
              onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
              placeholder="e.g. SRV-791"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-[#0E52A5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Starting City (From) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={formData.starting_city || ''}
                onChange={(e) => setFormData({ ...formData, starting_city: e.target.value })}
                placeholder="e.g. Hyderabad"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Ending City (To) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={formData.ending_city || ''}
                onChange={(e) => setFormData({ ...formData, ending_city: e.target.value })}
                placeholder="e.g. Bangalore"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
              <Milestone className="w-3.5 h-3.5 text-blue-600" />
              <span>Destination KM <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.destination_km ?? ''}
              onChange={(e) => setFormData({ ...formData, destination_km: e.target.value })}
              placeholder="e.g. 570 or 0"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Status</span>
            </label>
            <StatusToggle
              value={formData.status || 'Active'}
              onChange={(val) => setFormData({ ...formData, status: val })}
            />
          </div>

          {/* Admin Only: Fixed Trip Amount & Operator Commission */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-200">
              {editingRoute ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
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
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Trip Amount (₹)</span>
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
                        className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>Operator Commission (₹)</span>
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
                        className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0E52A5] hover:bg-[#072B56] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{editingRoute ? 'Update Route' : 'Create Route'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
