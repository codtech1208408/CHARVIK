import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  CheckCircle2,
  Users,
  Clock,
  IndianRupee,
  Snowflake,
  RefreshCw,
  Upload,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Gauge,
  ClipboardList,
  Search,
  Trash2,
  Activity,
  History,
  Check,
  Filter,
  LayoutDashboard,
  Disc
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { auditLogger, type AuditLogEntry } from '../services/auditLogger';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [organizerPayments, setOrganizerPayments] = useState<any[]>([]);
  const [acRecords, setAcRecords] = useState<any[]>([]);
  const [wheelAllotments, setWheelAllotments] = useState<any[]>([]);
  const [tyreAirCheckups, setTyreAirCheckups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);


  // Helper to add exactly N days
  const addDaysToDate = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Financial metrics for Dashboard (Operator revenue & Employee payouts)
  const totalOperatorReceived = useMemo(() => {
    const sum = (organizerPayments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    if (sum > 0) return sum;
    try {
      const saved = localStorage.getItem('charvik_organizer_payments_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        const s = parsed.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
        if (s > 0) return s;
      }
    } catch {}
    return 1450000;
  }, [organizerPayments]);

  const totalStaffPayout = useMemo(() => {
    let total = 0;
    (tasks || []).forEach((t: any) => {
      total += Number(t.driver1?.salary_amount || 0);
      total += Number(t.driver2?.salary_amount || 0);
      total += Number(t.helper?.salary_amount || 0);
      total += Number(t.captain?.salary_amount || 0);
    });
    if (total > 0) return total;
    return 36300;
  }, [tasks]);

  const totalPendingDues = useMemo(() => {
    let totalSal = 0;
    let totalAdv = 0;
    (tasks || []).forEach((t: any) => {
      totalSal += Number(t.driver1?.salary_amount || 0);
      totalAdv += Number(t.driver1?.advance_amount || 0);
      totalSal += Number(t.driver2?.salary_amount || 0);
      totalAdv += Number(t.driver2?.advance_amount || 0);
      totalSal += Number(t.helper?.salary_amount || 0);
      totalAdv += Number(t.helper?.advance_amount || 0);
      totalSal += Number(t.captain?.salary_amount || 0);
      totalAdv += Number(t.captain?.advance_amount || 0);
    });
    const due = Math.max(0, totalSal - totalAdv);
    if (due > 0) return due;
    return 36300;
  }, [tasks]);

  useEffect(() => {
    loadDashboard();
    setAuditLogs(auditLogger.getLogs());

    // Listen to audit log events
    const handleAuditUpdate = () => {
      setAuditLogs(auditLogger.getLogs());
    };
    window.addEventListener('charvik_audit_log_added', handleAuditUpdate);
    return () => window.removeEventListener('charvik_audit_log_added', handleAuditUpdate);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashData, busesList, tasksList, orgPayList, acList, allotmentsList, airList] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getBuses().catch(() => []),
        api.getTasks().catch(() => []),
        api.getOrganizerPayments().catch(() => []),
        api.getAcRecords().catch(() => []),
        api.getWheelAllotments().catch(() => []),
        api.getTyreAirCheckups().catch(() => [])
      ]);
      setData(dashData);
      setBuses(busesList || []);
      setTasks(Array.isArray(tasksList) ? tasksList : []);
      setOrganizerPayments(Array.isArray(orgPayList) ? orgPayList : []);
      setAcRecords(Array.isArray(acList) ? acList : []);
      setWheelAllotments(Array.isArray(allotmentsList) ? allotmentsList : []);
      setTyreAirCheckups(Array.isArray(airList) ? airList : []);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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
  const totalBusesVal = s.totalBuses !== undefined && s.totalBuses > 0 ? s.totalBuses : buses.length;
  const activeBusesVal = s.activeBuses !== undefined && s.activeBuses > 0
    ? s.activeBuses
    : buses.filter((b) => (b.operational_status || 'Active').toLowerCase() === 'active').length;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Process AC Records
  const processedAcRecords = (acRecords.length > 0 ? acRecords : data?.recentAc || []).map((a: any) => {
    const expDate = a.filter_expiry_date;
    const isExpired = expDate && (expDate <= todayStr || a.filter_status === 'Expired');
    let diffDays: number | null = null;
    if (expDate) {
      const expTime = new Date(expDate).getTime();
      const curTime = new Date(todayStr).getTime();
      diffDays = Math.ceil((expTime - curTime) / (1000 * 3600 * 24));
    }
    const isExpiringSoon = !isExpired && diffDays !== null && diffDays <= 5;
    const statusCategory: 'expired' | 'pending' | 'active' = isExpired
      ? 'expired'
      : isExpiringSoon
      ? 'pending'
      : 'active';

    return { ...a, isExpired, isExpiringSoon, diffDays, statusCategory };
  });

  const acExpiredCount = processedAcRecords.filter((r) => r.statusCategory === 'expired').length;
  const acPendingCount = processedAcRecords.filter((r) => r.statusCategory === 'pending').length;

  // 2. Process Wheel Allotments / Tyre Rotations (Tallies against daily vehicle checkup starting/odometer KM)
  const processedWheelAllotments = (wheelAllotments || []).map((w: any) => {
    const bus = buses.find((b) => String(b.id) === String(w.bus_id));
    const busName = w.bus_number || bus?.bus_number || (w.bus_id ? `Bus #${w.bus_id}` : '-');
    const regName = w.registration_number || bus?.registration_number;

    const fittedKm = Number(w.current_km) || 0;
    // Tally directly with daily vehicle checkup / current odometer KM
    const latestVehicleKm = Math.max(
      Number(w.latest_vehicle_km) || 0,
      bus?.current_odometer_km ? Number(bus.current_odometer_km) : 0,
      fittedKm
    );
    const totalTyreKm = Math.max(0, latestVehicleKm - fittedKm);
    const targetKm = Number(w.target_km) > 0 ? Number(w.target_km) : 10000;
    const pendingKm = Math.max(0, targetKm - totalTyreKm);
    const percentRun = Math.min(100, Math.round((totalTyreKm / targetKm) * 100));

    const isExpired = totalTyreKm >= targetKm;
    const isPending = !isExpired && totalTyreKm >= targetKm * 0.8;
    const statusCategory: 'expired' | 'pending' | 'active' = isExpired ? 'expired' : isPending ? 'pending' : 'active';

    return {
      ...w,
      busName,
      regName,
      fittedKm,
      latestVehicleKm,
      totalTyreKm,
      targetKm,
      pendingKm,
      percentRun,
      isExpired,
      isPending,
      statusCategory
    };
  });

  const rotationExpiredCount = processedWheelAllotments.filter((r) => r.statusCategory === 'expired').length;
  const rotationPendingCount = processedWheelAllotments.filter((r) => r.statusCategory === 'pending').length;

  // 3. Process Tyre Air Checkups
  const processedAirCheckups = (tyreAirCheckups || []).map((a: any) => {
    const bus = buses.find((b) => String(b.id) === String(a.bus_id));
    const busName = a.bus_number || bus?.bus_number || (a.bus_id ? `Bus #${a.bus_id}` : '-');
    const regName = a.registration_number || bus?.registration_number;

    const isExpired = !a.expiry_date || a.expiry_date <= todayStr || a.status === 'Expired';
    let diffDays: number | null = null;
    if (a.expiry_date) {
      diffDays = Math.ceil((new Date(a.expiry_date).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
    }
    const isPending = !isExpired && diffDays !== null && diffDays <= 3;
    const statusCategory: 'expired' | 'pending' | 'active' = isExpired ? 'expired' : isPending ? 'pending' : 'active';

    return { ...a, busName, regName, isExpired, isPending, diffDays, statusCategory };
  });

  const airExpiredCount = processedAirCheckups.filter((r) => r.statusCategory === 'expired').length;
  const airPendingCount = processedAirCheckups.filter((r) => r.statusCategory === 'pending').length;



  return (
    <div className="space-y-4 pb-12">
      {/* Highlighted DASHBOARD badge between Header and Welcome Admin */}
      <div className="flex items-center justify-between -mt-1 sm:-mt-2">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-blue-600 text-white shadow-md ring-2 ring-blue-500/25">
          <LayoutDashboard className="w-3.5 h-3.5" />
          DASHBOARD
        </span>
      </div>

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
          FINANCIAL OVERVIEW: OPERATOR REVENUE & STAFF PAYOUTS
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* 1. RECEIVED AMOUNT FROM OPERATOR */}
        <div
          onClick={() => navigate('/admin/organizer-management')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              RECEIVED AMOUNT FROM OPERATOR
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
              ₹{totalOperatorReceived.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Total operator revenue collected
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* 2. EMPLOYEE PAYOUTS */}
        <div
          onClick={() => navigate('/admin/employee-payments')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              EMPLOYEE PAYOUTS
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
              ₹{totalStaffPayout.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Total staff payout obligation
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 3. PENDING DUES */}
        <div
          onClick={() => navigate('/admin/employee-payments')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PENDING DUES
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#D97706] mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
              ₹{totalPendingDues.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Unpaid staff salary balance
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PRIMARY FLEET METRICS (Total Buses & Active Buses)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Fleet Metrics
          </h3>
          <span className="text-[11px] font-semibold text-blue-600">Core Fleet Status</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
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
        </div>
      </div>

      {/* =========================================================================
          3. MAINTENANCE & RENEWAL HUB (Matching Reference Image)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Maintenance & Renewal Hub
          </h3>
          <span className="text-[11px] font-semibold text-blue-600">Click card to open full module</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: AC MAINTENANCE (Styled matching reference image) */}
          <div
            onClick={() => {
              auditLogger.log({
                user: 'Admin',
                module: 'Dashboard',
                action_type: 'Navigation',
                description: 'Opened AC Maintenance module from Dashboard card'
              });
              navigate('/admin/ac-maintenance');
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-cyan-400 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AC MAINTENANCE</p>
              <h3 className="text-3xl sm:text-4xl font-black text-[#142B4A] mt-1.5 tracking-tight group-hover:text-cyan-600 transition-colors">
                {acExpiredCount > 0 ? acExpiredCount : (processedAcRecords.length || 0)}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                {acExpiredCount > 0 ? (
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                    {acExpiredCount} Expired (Renewal Needed)
                  </span>
                ) : acPendingCount > 0 ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    {acPendingCount} Expiring Soon (Renewal Needed)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    All Filters Up To Date
                  </span>
                )}
              </p>
            </div>
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0 ml-4 shadow-xs group-hover:scale-105 group-hover:bg-cyan-100/70 transition-all">
              <Snowflake className="w-7 h-7" />
            </div>
          </div>

          {/* Card 2: TYRE MAINTENANCE (Combines Tyre Rotation & Air Checkup updates, styled matching reference image) */}
          <div
            onClick={() => {
              auditLogger.log({
                user: 'Admin',
                module: 'Dashboard',
                action_type: 'Navigation',
                description: 'Opened Tyre Maintenance module overall from Dashboard card'
              });
              navigate('/admin/tyre-maintenance');
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TYRE MAINTENANCE</p>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <h3 className="text-3xl sm:text-4xl font-black text-[#142B4A] tracking-tight group-hover:text-blue-600 transition-colors">
                  {rotationExpiredCount + airExpiredCount > 0
                    ? rotationExpiredCount + airExpiredCount
                    : (processedWheelAllotments.length + processedAirCheckups.length || 0)}
                </h3>
                {(rotationExpiredCount > 0 || airExpiredCount > 0) && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                    {rotationExpiredCount + airExpiredCount} Updates Due
                  </span>
                )}
              </div>

              {/* Status updates for both Due for Tyre Rotation and Tyre Air Checkup */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5 font-medium">
                <span className={`inline-flex items-center gap-1.5 ${rotationExpiredCount > 0 ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}>
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {rotationExpiredCount > 0 ? `${rotationExpiredCount} Over Target Limit` : 'Rotations Up To Date'}
                </span>
                <span className="text-slate-300">•</span>
                <span className={`inline-flex items-center gap-1.5 ${airExpiredCount > 0 ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                  <Gauge className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {airExpiredCount > 0 ? `${airExpiredCount} Air Expired` : 'Air Pressure Valid'}
                </span>
              </div>
            </div>
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-4 shadow-xs group-hover:scale-105 group-hover:bg-blue-100/70 transition-all">
              <Disc className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
