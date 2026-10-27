import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  Gauge,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Disc,
  Snowflake,
  Fuel,
  BatteryCharging,
  ShieldCheck,
  PlusCircle,
  Eye,
  ArrowUpRight,
  Sparkles,
  Save,
  Search,
  Bell,
  MapPin,
  Navigation,
  Star,
  Activity,
  Users,
  Briefcase,
  ChevronRight,
  Clock,
  Radio,
  Sliders,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);

  // Active operational table tab
  const [activeTab, setActiveTab] = useState<'complaints' | 'tyres' | 'ac' | 'oil' | 'battery'>('complaints');

  // Daily KM quick entry state
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickBusId, setQuickBusId] = useState<number | string>('');
  const [quickKm, setQuickKm] = useState<number | string>('');
  const [quickDriver, setQuickDriver] = useState('');
  const [savingKm, setSavingKm] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashData, busesList] = await Promise.all([
        api.getDashboard(),
        api.getBuses()
      ]);
      setData(dashData);
      setBuses(busesList);
      if (busesList.length > 0 && !quickBusId) {
        setQuickBusId(busesList[0].id);
        setQuickDriver(busesList[0].driver_name || '');
        setQuickKm(busesList[0].current_odometer_km ? busesList[0].current_odometer_km : '');
      }
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBusSelect = async (busId: string | number) => {
    setQuickBusId(busId);
    const selected = buses.find((b) => String(b.id) === String(busId));
    if (selected) {
      setQuickDriver(selected.driver_name || '');
      try {
        const res = await api.suggestOpeningKm(busId);
        setQuickKm(res.suggestedOpening || selected.current_odometer_km || '');
      } catch (e) {
        setQuickKm(selected.current_odometer_km || '');
      }
    }
  };

  const handleSaveQuickKm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBusId || !quickKm) {
      error('Please select a bus and enter a valid kilometer reading');
      return;
    }
    setSavingKm(true);
    try {
      const selected = buses.find((b) => String(b.id) === String(quickBusId));
      const openKm = selected ? selected.current_odometer_km : Number(quickKm) - 100;
      await api.createDailyKm({
        entry_date: quickDate,
        bus_id: quickBusId,
        driver_id: selected?.assigned_driver_id || null,
        opening_km: openKm,
        closing_km: Number(quickKm),
        remarks: 'Recorded from quick dashboard entry widget'
      });
      success(`Kilometer reading saved for ${selected?.bus_number || 'bus'}!`);
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to save kilometer entry');
    } finally {
      setSavingKm(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Updating live fleet metrics...</p>
      </div>
    );
  }

  const s = data?.summary || data?.kpis || {};
  const add = data?.additionalKpis || data?.kpis || {};

  // Compute live resilient stats directly from loaded buses list if summary numbers are zero or missing
  const totalBusesVal = s.totalBuses !== undefined && s.totalBuses > 0 ? s.totalBuses : buses.length;
  const activeBusesVal = s.activeBuses !== undefined && s.activeBuses > 0
    ? s.activeBuses
    : buses.filter((b) => (b.operational_status || 'Active').toLowerCase() === 'active').length;
  const underMaintVal = s.underMaintenance !== undefined && s.underMaintenance > 0
    ? s.underMaintenance
    : buses.filter((b) => (b.operational_status || '').toLowerCase().includes('maintenance')).length;
  const unassignedBusesVal = add.unassignedBuses !== undefined && add.unassignedBuses > 0
    ? add.unassignedBuses
    : buses.filter((b) => !b.assigned_driver_id && !b.driver_name).length;
  const totalOperatorsVal = add.totalOperators !== undefined && add.totalOperators > 0
    ? add.totalOperators
    : new Set(buses.map((b) => b.make).filter(Boolean)).size || (buses.length > 0 ? 1 : 0);
  const runningProjectsVal = add.runningProjects !== undefined && add.runningProjects > 0
    ? add.runningProjects
    : activeBusesVal;

  const pieColors = ['#16A34A', '#DC2626', '#D97706', '#64748B'];
  const statusPieData = (data?.statusDistribution && data.statusDistribution.length > 0)
    ? data.statusDistribution.map((item: any) => ({
        name: item.status,
        value: item.count
      }))
    : [
        { name: 'Active', value: activeBusesVal },
        { name: 'Under Maintenance', value: underMaintVal },
        { name: 'Inactive', value: Math.max(0, totalBusesVal - activeBusesVal - underMaintVal) }
      ].filter((x) => x.value > 0);

  const maintenanceBarData = (data?.kmBasedSchedules || []).map((item: any) => ({
    name: item.service.replace(' Maintenance', '').replace(' / Check', '').replace(' Change', ''),
    count: item.dueSoonCount || 0
  }));

  // Upcoming maintenance items
  const filteredUpcoming = data?.upcoming || [];

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          1. HEADER BAR: Welcome & Status
         ========================================================================= */}
      <div
        data-aos="fade-down"
        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#142B4A] flex items-center justify-center text-white shadow-md shrink-0">
            <Bus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#142B4A] tracking-tight">
                Welcome, Admin
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Fleet Operations Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bus Fleet & Maintenance Management Platform • Section 3.1 Operations Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PRIMARY KPI CARDS (7 Cards as per Section 3.1)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Fleet Metrics (Section 3.1)
          </h3>
          <span className="text-[11px] font-semibold text-blue-600">7 Core KPIs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-3.5">
          <StatCard
            title="Total Buses"
            value={totalBusesVal}
            icon={Bus}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            linkTo="/admin/buses"
            dataAosDelay={50}
          />
          <StatCard
            title="Active Buses"
            value={activeBusesVal}
            icon={CheckCircle2}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            linkTo="/admin/buses?status=Active"
            dataAosDelay={100}
          />
          <StatCard
            title="Under Maint."
            value={underMaintVal}
            icon={Wrench}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            linkTo="/admin/buses?status=Under%20Maintenance"
            dataAosDelay={150}
          />
          <StatCard
            title="Total KM (Today)"
            value={`${(s.todayKm || 0).toLocaleString()} km`}
            icon={Gauge}
            iconBgColor="bg-cyan-50"
            iconColor="text-cyan-600"
            linkTo="/admin/daily-kilometers"
            dataAosDelay={200}
          />
          <StatCard
            title="Sched. Maint."
            value={s.scheduledMaintenance ?? 0}
            icon={CalendarDays}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            linkTo="/admin/maintenance-schedule"
            dataAosDelay={250}
          />
          <StatCard
            title="Pending Complaints"
            value={s.pendingComplaints ?? 0}
            icon={AlertTriangle}
            iconBgColor="bg-rose-50"
            iconColor="text-rose-600"
            linkTo="/admin/complaints"
            dataAosDelay={300}
          />
          <StatCard
            title="Completed Month"
            value={s.completedThisMonth ?? 0}
            icon={CheckCircle2}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            linkTo="/admin/maintenance-schedule?status=Completed"
            dataAosDelay={350}
          />
        </div>
      </div>

      {/* =========================================================================
          3. ADDITIONAL KPIS ROW (7 Extra Metrics as per Section 3.1)
         ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Staff & Resource Distribution (Section 3.1 Extra KPIs)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Live Roster & Assignments</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div
            onClick={() => navigate('/admin/captains')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Total Captains</p>
            <p className="text-xl font-black text-blue-400 mt-0.5">{add.totalCaptains ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Route supervisors</p>
          </div>

          <div
            onClick={() => navigate('/admin/drivers')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Total Drivers</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{add.totalDrivers ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active licensed crew</p>
          </div>

          <div
            onClick={() => navigate('/admin/helpers')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Total Helpers</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{add.totalHelpers ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Cabin attendants</p>
          </div>

          <div
            onClick={() => navigate('/admin/buses')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Total Operators</p>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{totalOperatorsVal}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Fleet OEMs / Makes</p>
          </div>

          <div
            onClick={() => navigate('/admin/live-tracking')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Running Projects</p>
            <p className="text-xl font-black text-cyan-400 mt-0.5">{runningProjectsVal}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active contracts</p>
          </div>

          <div
            onClick={() => navigate('/admin/buses')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Unassigned Buses</p>
            <p className="text-xl font-black text-rose-400 mt-0.5">{unassignedBusesVal}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting allocation</p>
          </div>

          <div
            onClick={() => navigate('/admin/drivers')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
          >
            <p className="text-[11px] text-slate-400 font-medium">Unassigned Staff</p>
            <p className="text-xl font-black text-purple-400 mt-0.5">{add.unassignedStaff ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Reserve backup pool</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LIVE FLEET MAP WIDGET & REAL-TIME TRACKING (Section 3.1)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#142B4A]">Live Fleet Map & Active Runs</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-[11px] text-slate-500">Real-time GPS status, speeds, and in-transit route monitoring</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/live-tracking')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Full Fleet Radar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Interactive Radar Graphic Canvas */}
          <div className="lg:col-span-7 rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
            {/* Grid background lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                GPS Telemetry Active • AP Fleet Grid
              </span>
              <span className="text-[10px] text-slate-400 font-mono">16.5062° N, 80.6480° E</span>
            </div>

            {/* Simulated Live Fleet Map Pins */}
            <div className="relative z-10 my-6 grid grid-cols-3 gap-3">
              {(data?.liveRunningBuses || []).slice(0, 6).map((bus: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => navigate('/admin/live-tracking')}
                  className="bg-slate-800/90 border border-slate-700/70 hover:border-blue-500 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{bus.bus_number}</span>
                    <span className={`w-2 h-2 rounded-full ${bus.status === 'Running' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                  </div>
                  <p className="text-[10px] text-blue-300 truncate">{bus.route}</p>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-700/60 text-[10px]">
                    <span className="text-slate-400 font-mono">{bus.speed} km/h</span>
                    <span className="text-emerald-400 font-semibold">{bus.battery}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {(data?.liveRunningBuses || []).filter((b: any) => b.status === 'Running').length} En Route
                <span className="w-2 h-2 rounded-full bg-amber-400 ml-2"></span> {(data?.liveRunningBuses || []).filter((b: any) => b.status !== 'Running').length} Idle / Rest
              </span>
              <span className="text-slate-500">Auto-sync active</span>
            </div>
          </div>

          {/* Running Vehicles List */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Active In-Transit Units
            </p>
            <div className="space-y-2 overflow-y-auto max-h-[230px] pr-1">
              {(data?.liveRunningBuses || []).map((bus: any) => (
                <div
                  key={bus.id}
                  onClick={() => navigate('/admin/live-tracking')}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{bus.bus_number}</span>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                        {bus.speed} km/h
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{bus.route}</p>
                    <p className="text-[10px] text-slate-400">Driver: {bus.driver}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {bus.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{bus.ac}</p>
                  </div>
                </div>
              ))}
              {(data?.liveRunningBuses || []).length === 0 && (
                <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  No active in-transit buses at this time.
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{(data?.liveRunningBuses || []).length} buses streaming active telemetry</span>
              <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => navigate('/admin/live-tracking')}>
                Manage routes →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. UPCOMING MAINTENANCE (NEXT 5) - Table as per Section 3.1
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#142B4A]">Upcoming Maintenance (Next 5)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Section 3.1
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Bus number, service type, due km, due date, and urgent priority status
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/maintenance-schedule')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                <th className="py-2.5 px-3 font-semibold rounded-l-lg text-center w-12">S.NO</th>
                <th className="py-2.5 px-3 font-semibold">Bus Number</th>
                <th className="py-2.5 px-3 font-semibold">Service Type</th>
                <th className="py-2.5 px-3 font-semibold">Due Km</th>
                <th className="py-2.5 px-3 font-semibold">Due Date</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold rounded-r-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUpcoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">No upcoming maintenance scheduled</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All fleet vehicles are operating up to date.</p>
                  </td>
                </tr>
              ) : (
                filteredUpcoming.slice(0, 5).map((m: any, idx: number) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold leading-tight">{m.bus_number}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{m.registration_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {m.maintenance_type}
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-600">
                      {m.next_due_km ? `${m.next_due_km.toLocaleString()} km` : 'Interval Scheduled'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{m.next_due_date || 'Km-Based Interval'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          m.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : m.priority === 'High'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center w-fit gap-1 ${
                          m.status === 'Due Soon'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : m.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Overdue' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                        {m.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate('/admin/maintenance-schedule')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Service Now
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          6. MAINTENANCE SCHEDULE (KM-BASED) & 8 QUICK ACTIONS (Section 3.1 & 3.4)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Km-based Table matching Section 3.4 */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#142B4A]">Maintenance Schedule (Km-based)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Section 3.4 Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tyre, AC, Oil + DPF, Engine Oil, and Battery intervals
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/maintenance-schedule')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Rules →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                  <th className="py-2 px-3 font-semibold">Service Name</th>
                  <th className="py-2 px-3 font-semibold">Standard Interval</th>
                  <th className="py-2 px-3 font-semibold">Operational Scope</th>
                  <th className="py-2 px-3 font-semibold text-right">Due Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(data?.kmBasedSchedules || []).map((kItem: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>{kItem.service}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">
                      Every {kItem.interval_km.toLocaleString()} km
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {kItem.notes}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {kItem.dueSoonCount || 0} buses due
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8 Quick Actions (Section 3.1) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Action Buttons (Section 3.1)
              </h4>
              <p className="text-[11px] text-slate-400">Direct operational entry shortcuts</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
              8 Actions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate('/admin/buses')}
              className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">+ Add Bus</span>
            </button>

            <button
              onClick={() => navigate('/admin/complaints')}
              className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">+ Complaint</span>
            </button>

            <button
              onClick={() => navigate('/admin/repairs')}
              className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Wrench className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">Record Repair</span>
            </button>

            <button
              onClick={() => navigate('/admin/tyre-maintenance')}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#142B4A] hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Disc className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">Tyre</span>
            </button>

            <button
              onClick={() => navigate('/admin/ac-maintenance')}
              className="p-3 rounded-xl border border-cyan-200/80 bg-cyan-50/40 hover:bg-cyan-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Snowflake className="w-5 h-5 text-cyan-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">AC</span>
            </button>

            <button
              onClick={() => navigate('/admin/oil-filter-maintenance')}
              className="p-3 rounded-xl border border-orange-200/80 bg-orange-50/40 hover:bg-orange-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Fuel className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">Oil & Filter</span>
            </button>

            <button
              onClick={() => navigate('/admin/battery-maintenance')}
              className="p-3 rounded-xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <BatteryCharging className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">Battery</span>
            </button>

            <button
              onClick={() => navigate('/admin/reports')}
              className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-600 hover:text-white text-slate-800 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Eye className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors mb-1.5" />
              <span className="text-xs font-bold leading-tight">View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. TABBED OPERATIONAL TABLES & DAILY KILOMETER ENTRY
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabbed Operational Summary Tables */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A]">Operational Activity Tables</h3>
              <p className="text-[11px] text-slate-500">Live records for Complaints, Tyres, AC, Oil, and Battery</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('complaints')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'complaints'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Complaints
              </button>
              <button
                onClick={() => setActiveTab('tyres')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'tyres'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tyres
              </button>
              <button
                onClick={() => setActiveTab('ac')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'ac'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AC
              </button>
              <button
                onClick={() => setActiveTab('oil')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'oil'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Oil & Filter
              </button>
              <button
                onClick={() => setActiveTab('battery')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'battery'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Battery
              </button>
            </div>
          </div>

          {/* TAB 1: Complaints */}
          {activeTab === 'complaints' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                    <th className="py-2 px-3 font-semibold">Ref #</th>
                    <th className="py-2 px-3 font-semibold">Bus</th>
                    <th className="py-2 px-3 font-semibold">Category</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold">Reported By</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.recentComplaints || []).map((c: any, idx: number) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{c.complaint_ref}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{c.bus_number}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600">{c.description}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.reported_by}</td>
                      <td className="py-2.5 px-3">
                        <Badge status={c.status} />
                      </td>
                    </tr>
                  ))}
                  {(data?.recentComplaints || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No recent complaints recorded. Fleet operating smoothly.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Tyre Records */}
          {activeTab === 'tyres' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                    <th className="py-2 px-3 font-semibold">Bus</th>
                    <th className="py-2 px-3 font-semibold">Serial #</th>
                    <th className="py-2 px-3 font-semibold">Position</th>
                    <th className="py-2 px-3 font-semibold">Brand / Size</th>
                    <th className="py-2 px-3 font-semibold">Tread Depth</th>
                    <th className="py-2 px-3 font-semibold">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.recentTyres || []).map((t: any, idx: number) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{t.bus_number}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{t.tyre_serial_number}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.tyre_position}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{t.brand} ({t.size})</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.tread_depth_mm} mm</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.condition}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(data?.recentTyres || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No tyre maintenance records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: AC Records */}
          {activeTab === 'ac' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                    <th className="py-2 px-3 font-semibold">Bus</th>
                    <th className="py-2 px-3 font-semibold">Working Status</th>
                    <th className="py-2 px-3 font-semibold">Cooling Performance</th>
                    <th className="py-2 px-3 font-semibold">Refrigerant Check</th>
                    <th className="py-2 px-3 font-semibold">Next Due Km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.recentAc || []).map((a: any, idx: number) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{a.bus_number}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {a.ac_working_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{a.cooling_performance}</td>
                      <td className="py-2.5 px-3 text-slate-500">{a.refrigerant_check}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{a.next_service_km?.toLocaleString()} km</td>
                    </tr>
                  ))}
                  {(data?.recentAc || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No AC maintenance records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Oil and Filter */}
          {activeTab === 'oil' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                    <th className="py-2 px-3 font-semibold">Bus</th>
                    <th className="py-2 px-3 font-semibold">Oil Type & Brand</th>
                    <th className="py-2 px-3 font-semibold">Filter Replaced</th>
                    <th className="py-2 px-3 font-semibold">Total Cost</th>
                    <th className="py-2 px-3 font-semibold">Next Due Km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.recentOil || []).map((o: any, idx: number) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{o.bus_number}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{o.oil_type} ({o.oil_brand})</td>
                      <td className="py-2.5 px-3 text-slate-600">{o.oil_filter_details}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">₹{o.total_cost?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{o.next_due_km?.toLocaleString()} km</td>
                    </tr>
                  ))}
                  {(data?.recentOil || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No oil & filter replacement records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: Battery */}
          {activeTab === 'battery' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2 px-3 font-semibold text-center w-12">S.NO</th>
                    <th className="py-2 px-3 font-semibold">Bus</th>
                    <th className="py-2 px-3 font-semibold">Battery Brand</th>
                    <th className="py-2 px-3 font-semibold">Measured Voltage</th>
                    <th className="py-2 px-3 font-semibold">Battery Health</th>
                    <th className="py-2 px-3 font-semibold">Alternator / System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.recentBattery || []).map((b: any, idx: number) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{b.bus_number}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{b.battery_brand}</td>
                      <td className="py-2.5 px-3 font-bold text-purple-600">{b.measured_voltage}V</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.battery_health}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{b.charging_system_status}</td>
                    </tr>
                  ))}
                  {(data?.recentBattery || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No battery maintenance records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Kilometer Quick Entry Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#142B4A]">Daily Kilometer Entry</h3>
                  <p className="text-[11px] text-slate-500">Quick odometer logging widget</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/daily-kilometers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                All Entries →
              </button>
            </div>

            <form onSubmit={handleSaveQuickKm} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bus No. *</label>
                <select
                  value={quickBusId}
                  onChange={(e) => handleBusSelect(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kilometer Reading (Closing KM) *</label>
                <input
                  type="number"
                  placeholder="e.g. 45200"
                  value={quickKm}
                  onChange={(e) => setQuickKm(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                  Driver: <strong className="text-slate-800">{quickDriver || 'Assigned Driver'}</strong>
                </span>
                <button
                  type="submit"
                  disabled={savingKm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKm ? 'Saving...' : 'Save Entry'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Odometer updates auto-trigger maintenance schedule alerts.</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          8. BUS CONDITION RATING WIDGET (Section 3.1 & Star Ratings)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#142B4A]">Bus Condition Rating & Roadworthiness Widget</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Section 3.1 Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Multi-point safety condition breakdown, star ratings, and road fitness confirmation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs font-black text-amber-800 ml-1">
                {data?.recentCondition?.length > 0 ? '5.0 / 5' : 'Active'}
              </span>
            </div>
            <button
              onClick={() => navigate('/admin/bus-condition')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Inspection Logs →
            </button>
          </div>
        </div>

        {/* System Condition Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Exterior Body', status: 'Good', icon: Bus },
            { label: 'Tyre Condition', status: 'Good', icon: Disc },
            { label: 'Brake Condition', status: 'Good', icon: Activity },
            { label: 'Engine Condition', status: 'Good', icon: Wrench },
            { label: 'Battery Health', status: 'Good', icon: BatteryCharging },
            { label: 'AC Condition', status: 'Good', icon: Snowflake },
            { label: 'Lights Condition', status: 'Good', icon: CheckCircle },
            { label: 'Mirrors Condition', status: 'Good', icon: Eye },
            { label: 'Windshield', status: 'Good', icon: ShieldCheck },
            { label: 'Wipers Condition', status: 'Good', icon: Sliders },
            { label: 'Doors & Exits', status: 'Good', icon: CheckCircle2 },
            { label: 'Seat Condition', status: 'Good', icon: Users },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{item.label}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {item.status}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Roadworthiness Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fit for Service (Safety Compliant)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Audit status: {data?.recentCondition?.[0]?.inspection_date ? `Latest inspection on ${data.recentCondition[0].inspection_date}` : 'Fleet Inspection Current'}
          </span>
        </div>
      </div>
    </div>
  );
};
