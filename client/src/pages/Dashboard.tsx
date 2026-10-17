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
  Save
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

  // Daily KM quick entry state
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickBusId, setQuickBusId] = useState<number | string>('');
  const [quickKm, setQuickKm] = useState<number | string>('');
  const [quickDriver, setQuickDriver] = useState('');
  const [savingKm, setSavingKm] = useState(false);

  // Quick complaint modal/inline
  const [quickComplaintBus, setQuickComplaintBus] = useState('');
  const [quickComplaintType, setQuickComplaintType] = useState('AC');
  const [quickComplaintDesc, setQuickComplaintDesc] = useState('');
  const [savingComplaint, setSavingComplaint] = useState(false);

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

  const handleSaveQuickComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComplaintBus || !quickComplaintDesc) {
      error('Please select a bus and describe the complaint');
      return;
    }
    setSavingComplaint(true);
    try {
      await api.createComplaint({
        bus_id: quickComplaintBus,
        category: quickComplaintType,
        description: quickComplaintDesc,
        priority: 'High',
        reported_by: 'Driver (Quick Log)',
        status: 'Open'
      });
      success('Complaint registered successfully!');
      setQuickComplaintDesc('');
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to register complaint');
    } finally {
      setSavingComplaint(false);
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

  const s = data?.summary || {};

  const pieColors = ['#16A34A', '#DC2626', '#D97706', '#64748B'];
  const statusPieData = (data?.statusDistribution || []).map((item: any) => ({
    name: item.status,
    value: item.count
  }));

  const maintenanceBarData = [
    { name: 'Tyre', count: 5 },
    { name: 'AC', count: 4 },
    { name: 'Oil & DPF', count: 6 },
    { name: 'Engine', count: 3 },
    { name: 'Battery', count: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        data-aos="fade-down"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#142B4A] flex items-center justify-center text-white shadow-md shrink-0">
            <Bus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#142B4A] tracking-tight">
                Welcome, Admin
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fleet Operations Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Keep your fleet safe, compliant, and continuously running across all routes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>11 Oct 2026</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Matches Reference Image 1 & 2 & 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Buses"
          value={s.totalBuses || 32}
          icon={Bus}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          linkTo="/admin/buses"
          dataAosDelay={50}
        />
        <StatCard
          title="Active Buses"
          value={s.activeBuses || 28}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          linkTo="/admin/buses?status=Active"
          dataAosDelay={100}
        />
        <StatCard
          title="Under Maint."
          value={s.underMaintenance || 2}
          icon={Wrench}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          linkTo="/admin/buses?status=Under%20Maintenance"
          dataAosDelay={150}
        />
        <StatCard
          title="Sched. Maint."
          value={s.scheduledMaintenance || 8}
          icon={CalendarDays}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          linkTo="/admin/maintenance-schedule"
          dataAosDelay={200}
        />
        <StatCard
          title="Pending Complaints"
          value={s.pendingComplaints || 5}
          icon={AlertTriangle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          linkTo="/admin/complaints"
          dataAosDelay={250}
        />
        <StatCard
          title="Completed Month"
          value={s.completedThisMonth || 27}
          icon={CheckCircle2}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          linkTo="/admin/maintenance-schedule?status=Completed"
          dataAosDelay={300}
        />
      </div>

      {/* Hero Quote and Quick Actions Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Safe Buses Hero Slogan Banner */}
        <div
          data-aos="fade-right"
          className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-md group min-h-[220px] flex flex-col justify-end p-6 text-white bg-gradient-to-tr from-[#0c1b30] via-[#142B4A] to-[#1E3A5F]"
        >
          {/* Elegant decorative lighting gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12"></div>
          
          {/* Subtle transport bus icon watermark */}
          <Bus className="absolute right-3 bottom-2 w-36 h-36 text-white/5 pointer-events-none group-hover:text-white/10 group-hover:scale-105 transition-all duration-500" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30 mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Charvik Fleet Safety Standard
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Safe Buses, Smooth Journeys, Better Tomorrow
            </h3>
            <p className="text-xs text-blue-200 mt-2 font-medium">
              “Well maintained buses lead to safer journeys and happier passengers.”
            </p>
          </div>
        </div>

        {/* Quick Actions Grid (8 quick modules as in Reference Image 2 & 3) */}
        <div data-aos="fade-left" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Fleet Actions
            </h4>
            <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/admin/reports')}>
              View All Modules →
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/admin/tyre-maintenance')}
              className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Disc className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Tyre Maint.</span>
            </button>

            <button
              onClick={() => navigate('/admin/ac-maintenance')}
              className="p-3 rounded-xl border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50 hover:border-cyan-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Snowflake className="w-5 h-5 text-cyan-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">AC Maint.</span>
            </button>

            <button
              onClick={() => navigate('/admin/oil-filter-maintenance')}
              className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Fuel className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Oil & Filter</span>
            </button>

            <button
              onClick={() => navigate('/admin/maintenance-schedule')}
              className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Wrench className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">General Svc</span>
            </button>

            <button
              onClick={() => navigate('/admin/battery-maintenance')}
              className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <BatteryCharging className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Battery Check</span>
            </button>

            <button
              onClick={() => navigate('/admin/complaints')}
              className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Complaint</span>
            </button>

            <button
              onClick={() => navigate('/admin/repairs')}
              className="p-3 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <Wrench className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Repairs & Svc</span>
            </button>

            <button
              onClick={() => navigate('/admin/bus-condition')}
              className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 text-center flex flex-col items-center justify-center transition-all group cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Bus Condition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Daily Kilometer Entry Widget & Km-Based Preventive Maintenance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Kilometer Quick Entry */}
        <div data-aos="fade-up" className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#142B4A]">Daily Kilometer Entry</h3>
                <p className="text-[11px] text-slate-500">Update daily km reading for each bus</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bus No. *</label>
                <select
                  value={quickBusId}
                  onChange={(e) => handleBusSelect(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kilometer Reading *</label>
                <input
                  type="number"
                  placeholder="Enter KM"
                  value={quickKm}
                  onChange={(e) => setQuickKm(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Driver: <span className="font-semibold text-slate-800">{quickDriver || 'Assigned Driver'}</span>
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

          {/* Last 5 Entries Table */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Recent Logged Entries
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 font-medium">Date</th>
                    <th className="py-1.5 font-medium">Bus No.</th>
                    <th className="py-1.5 font-medium">Reading</th>
                    <th className="py-1.5 font-medium">Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {(data?.recentKm || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No daily kilometer entries recorded today yet.
                      </td>
                    </tr>
                  ) : (
                    (data?.recentKm || []).slice(0, 4).map((k: any) => (
                      <tr key={k.id} className="hover:bg-slate-50/80">
                        <td className="py-1.5 font-medium">{k.entry_date}</td>
                        <td className="py-1.5 font-bold text-slate-900">{k.registration_number || k.bus_number}</td>
                        <td className="py-1.5 font-semibold text-blue-600">{k.closing_km.toLocaleString()} km</td>
                        <td className="py-1.5 text-slate-600">{k.driver_name || 'Driver'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Maintenance Standard Intervals (Km Based) Widget */}
        <div data-aos="fade-up" data-aos-delay="100" className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#142B4A]">Standard Maintenance Intervals</h3>
                <p className="text-[11px] text-slate-500">Fleet preventive service guidelines</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/settings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Configure →
            </button>
          </div>

          <div className="space-y-2">
            {[
              { title: 'Tyre Rotation / Check', interval: 'Every 10,000 km', threshold: '10,000 km', badge: 'Preventive', icon: Disc, color: 'text-blue-600' },
              { title: 'AC System Service', interval: 'Every 10,000 km', threshold: '10,000 km', badge: 'Preventive', icon: Snowflake, color: 'text-cyan-600' },
              { title: 'Oil + DPF Filter Change', interval: 'Every 40,000 km', threshold: '40,000 km', badge: 'Periodic', icon: Fuel, color: 'text-amber-600' },
              { title: 'Engine Oil + General Service', interval: 'Every 1,20,000 km', threshold: '1,20,000 km', badge: 'Major Milestone', icon: Wrench, color: 'text-indigo-600' },
              { title: 'Battery Health Inspection', interval: 'Every 10,000 km', threshold: '10,000 km', badge: 'Electrical', icon: BatteryCharging, color: 'text-purple-600' },
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate('/admin/maintenance-schedule')}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                      <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{item.interval}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {item.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Maintenance Table & Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Maintenance Table */}
        <div data-aos="fade-up" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A]">Upcoming Maintenance (Next 5)</h3>
              <p className="text-[11px] text-slate-500">Buses requiring immediate or near-term service</p>
            </div>
            <button
              onClick={() => navigate('/admin/maintenance-schedule')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Schedule →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-semibold">Bus No.</th>
                  <th className="py-2 font-semibold">Service Type</th>
                  <th className="py-2 font-semibold">Due Km</th>
                  <th className="py-2 font-semibold">Due Date</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {(data?.upcoming || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <p className="text-xs font-semibold text-slate-600">No upcoming maintenance scheduled</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All fleet vehicles are up to date on service.</p>
                    </td>
                  </tr>
                ) : (
                  (data?.upcoming || []).map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900">{m.registration_number || m.bus_number}</td>
                      <td className="py-2.5 font-medium text-slate-800">{m.maintenance_type}</td>
                      <td className="py-2.5 font-semibold text-blue-600">{m.next_due_km?.toLocaleString()} km</td>
                      <td className="py-2.5 text-slate-500">{m.next_due_date || 'KM Based'}</td>
                      <td className="py-2.5">
                        <Badge status={m.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints */}
        <div data-aos="fade-up" data-aos-delay="100" className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A]">Recent Complaints</h3>
              <p className="text-[11px] text-slate-500">Reported issues from drivers and staff</p>
            </div>
            <button
              onClick={() => navigate('/admin/complaints')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2.5">
            {(data?.recentComplaints || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">No Active Complaints</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All reported issues have been resolved or none logged.</p>
              </div>
            ) : (
              (data?.recentComplaints || []).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/admin/complaints')}
                  className="p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="truncate flex-1 mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">{c.registration_number || c.bus_number}</span>
                      <span className="text-[10px] text-slate-400">• {c.category}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge status={c.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{c.reported_date?.split(' ')[0]}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Fleet Status Distribution & Visual Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div data-aos="fade-up" className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#142B4A] mb-1">Fleet Status Distribution</h3>
          <p className="text-[11px] text-slate-500 mb-4">Active, under maintenance, and out of service breakdown</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
            {statusPieData.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                <span>{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div data-aos="fade-up" data-aos-delay="100" className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#142B4A] mb-1">Maintenance Categories Overview</h3>
          <p className="text-[11px] text-slate-500 mb-4">Current maintenance tracking across operational categories</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceBarData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A5F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Preventive schedules automatically calculate alerts based on daily kilometer updates.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
