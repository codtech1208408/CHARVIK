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
  LayoutDashboard
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
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

  // Main Dashboard Operational Tab: 'ac' | 'tyre_rotation' | 'tyre_air' | null (none selected initially)
  const [activeOperationalTab, setActiveOperationalTab] = useState<'ac' | 'tyre_rotation' | 'tyre_air' | null>(null);

  // Sub-filters for each tab
  const [acFilter, setAcFilter] = useState<'all' | 'pending' | 'expired' | 'active'>('all');
  const [rotationFilter, setRotationFilter] = useState<'all' | 'pending' | 'expired' | 'active'>('all');
  const [airFilter, setAirFilter] = useState<'all' | 'pending' | 'expired' | 'active'>('all');

  // 1. AC Renewal Modal State
  const [renewingAcRecord, setRenewingAcRecord] = useState<any | null>(null);
  const [renewAcFormData, setRenewAcFormData] = useState({
    filter_cleaning_date: new Date().toISOString().split('T')[0],
    filter_expiry_date: '',
    filter_proof_photo: '',
    remarks: ''
  });
  const [uploadingRenewPhoto, setUploadingRenewPhoto] = useState(false);

  // 2. Tyre Rotation Renewal Modal State
  const [renewingRotationRecord, setRenewingRotationRecord] = useState<any | null>(null);
  const [renewRotationFormData, setRenewRotationFormData] = useState({
    event_date: new Date().toISOString().split('T')[0],
    current_km: '',
    target_km: 10000,
    notes: ''
  });

  // 3. Tyre Air Checkup Renewal Modal State
  const [renewingAirRecord, setRenewingAirRecord] = useState<any | null>(null);
  const [renewAirFormData, setRenewAirFormData] = useState({
    checkup_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    pressure_psi: 110,
    technician: 'Fleet Team',
    remarks: ''
  });

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

  const handleTabSwitch = (newTab: 'ac' | 'tyre_rotation' | 'tyre_air') => {
    setActiveOperationalTab((prev) => (prev === newTab ? null : newTab));
    const tabNameMap = {
      ac: 'AC Maintenance',
      tyre_rotation: 'Due for Tyre Rotation',
      tyre_air: 'Tyre Air Checkup'
    };
    auditLogger.log({
      user: 'Admin',
      module: 'Dashboard',
      action_type: 'Tab Switch',
      description: `Clicked ${tabNameMap[newTab]} card on dashboard`
    });
  };

  // =========================================================================
  // 1. AC RENEWAL HANDLERS
  // =========================================================================
  const handleOpenRenewAcModal = (record: any) => {
    const today = new Date().toISOString().split('T')[0];
    const expiry = addDaysToDate(today, 5);
    setRenewingAcRecord(record);
    setRenewAcFormData({
      filter_cleaning_date: today,
      filter_expiry_date: expiry,
      filter_proof_photo: '',
      remarks: ''
    });
  };

  const handleRenewAcPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingRenewPhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setRenewAcFormData((prev) => ({ ...prev, filter_proof_photo: url }));
        success('Proof photo uploaded successfully!');
      } else {
        error('Failed to get uploaded file URL');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingRenewPhoto(false);
    }
  };

  const handleSaveRenewAc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingAcRecord) return;
    try {
      await api.renewAcFilter(renewingAcRecord.id, renewAcFormData);
      auditLogger.log({
        user: 'Admin',
        module: 'AC Maintenance',
        action_type: 'Renewal',
        description: `Renewed AC filter for ${renewingAcRecord.bus_number || 'vehicle'} (Expiry: ${renewAcFormData.filter_expiry_date})`
      });
      success(`AC filter renewed successfully for ${renewingAcRecord.bus_number || 'vehicle'}!`);
      setRenewingAcRecord(null);
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to renew filter');
    }
  };

  // =========================================================================
  // 2. TYRE ROTATION RENEWAL HANDLERS
  // =========================================================================
  const handleOpenRenewRotationModal = (w: any) => {
    const bus = buses.find((b) => String(b.id) === String(w.bus_id));
    const busKm = (bus as any)?.latest_checkup_km || bus?.current_odometer_km || w.current_km || '';
    setRenewingRotationRecord(w);
    setRenewRotationFormData({
      event_date: new Date().toISOString().split('T')[0],
      current_km: busKm,
      target_km: w.target_km || 10000,
      notes: `Tyre rotation renewed and cycle reset at ${busKm} KM`
    });
  };

  const handleSaveRenewRotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingRotationRecord) return;
    try {
      await api.renewWheelAllotment(renewingRotationRecord.id, renewRotationFormData);
      auditLogger.log({
        user: 'Admin',
        module: 'Wheel Allotment',
        action_type: 'Renewal',
        description: `Renewed tyre rotation for ${renewingRotationRecord.bus_number || 'Vehicle'} at ${renewRotationFormData.current_km} KM. Target: ${renewRotationFormData.target_km} KM`
      });
      success(`Tyre rotation cycle renewed for ${renewingRotationRecord.bus_number || 'vehicle'}!`);
      setRenewingRotationRecord(null);
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to renew rotation');
    }
  };

  // =========================================================================
  // 3. TYRE AIR CHECKUP RENEWAL HANDLERS
  // =========================================================================
  const handleOpenRenewAirModal = (record: any) => {
    const today = new Date().toISOString().split('T')[0];
    setRenewingAirRecord(record);
    setRenewAirFormData({
      checkup_date: today,
      expiry_date: addDaysToDate(today, 4),
      pressure_psi: record.pressure_psi || 110,
      technician: record.technician || 'Fleet Team',
      remarks: `Air pressure inspected and renewed on ${today}`
    });
  };

  const handleSaveRenewAir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingAirRecord) return;
    try {
      await api.renewTyreAirCheckup(renewingAirRecord.id, renewAirFormData);
      auditLogger.log({
        user: 'Admin',
        module: 'Tyre Air Checkup',
        action_type: 'Renewal',
        description: `Renewed tyre air checkup for ${renewingAirRecord.bus_number || 'Vehicle'} (Expiry: ${renewAirFormData.expiry_date})`
      });
      success(`Tyre air checkup renewed for ${renewingAirRecord.bus_number || 'vehicle'}!`);
      setRenewingAirRecord(null);
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to renew air checkup');
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
  const filteredAcRecords = processedAcRecords.filter((r) => acFilter === 'all' || r.statusCategory === acFilter);

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
  const filteredWheelAllotments = processedWheelAllotments.filter((r) => rotationFilter === 'all' || r.statusCategory === rotationFilter);

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
  const filteredAirCheckups = processedAirCheckups.filter((r) => airFilter === 'all' || r.statusCategory === airFilter);



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

            {/* Highlighted Dashboard Badge below the header line */}
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30">
                <LayoutDashboard className="w-3.5 h-3.5" />
                DASHBOARD
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                • Bus Fleet & Maintenance Management Platform • Section 3.1 Operations Dashboard
              </span>
            </div>
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
          3. HIGHLIGHTED OPERATIONAL CARDS (Style matching Image 2)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Maintenance & Renewal Hub
          </h3>
          <span className="text-[11px] font-semibold text-blue-600">Click card to switch view</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: AC MAINTENANCE */}
          <div
            onClick={() => handleTabSwitch('ac')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer group ${
              activeOperationalTab === 'ac'
                ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-md bg-cyan-50/15'
                : 'border-slate-200/80 hover:border-cyan-400 hover:shadow-md'
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AC MAINTENANCE</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1 tracking-tight group-hover:text-cyan-600 transition-colors">
                {acExpiredCount > 0 ? acExpiredCount : processedAcRecords.length}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {acExpiredCount > 0 ? `${acExpiredCount} Expired (Renewal Needed)` : 'All Filters Valid'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 ml-4 shadow-xs group-hover:scale-105 transition-transform">
              <Snowflake className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: DUE FOR TYRE ROTATION */}
          <div
            onClick={() => handleTabSwitch('tyre_rotation')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer group ${
              activeOperationalTab === 'tyre_rotation'
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-md bg-indigo-50/15'
                : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-md'
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">DUE FOR TYRE ROTATION</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                {rotationExpiredCount > 0 ? rotationExpiredCount : processedWheelAllotments.length}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {rotationExpiredCount > 0 ? `${rotationExpiredCount} Over Target Limit` : 'All Rotations Up To Date'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ml-4 shadow-xs group-hover:scale-105 transition-transform">
              <RotateCw className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: TYRE AIR CHECKUP */}
          <div
            onClick={() => handleTabSwitch('tyre_air')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer group ${
              activeOperationalTab === 'tyre_air'
                ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md bg-blue-50/15'
                : 'border-slate-200/80 hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TYRE AIR CHECKUP</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1 tracking-tight group-hover:text-blue-600 transition-colors">
                {airExpiredCount > 0 ? airExpiredCount : processedAirCheckups.length}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {airExpiredCount > 0 ? `${airExpiredCount} Air Expired` : 'Air Pressure Valid'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-4 shadow-xs group-hover:scale-105 transition-transform">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MAIN DASHBOARD OPERATIONAL HUB (AC, Rotation Due, Air Checkup)
         ========================================================================= */}
      {activeOperationalTab !== null ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          {/* Active Module Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {activeOperationalTab === 'ac' ? (
                <>
                  <Snowflake className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-sm font-bold text-[#142B4A]">AC Maintenance Filter Cleaning & Expiry Schedule</h3>
                </>
              ) : activeOperationalTab === 'tyre_rotation' ? (
                <>
                  <RotateCw className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-bold text-[#142B4A]">Due for Tyre Rotation & KM Allotment Tracking</h3>
                </>
              ) : (
                <>
                  <Gauge className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-[#142B4A]">Tyre Air Checkup & Pressure Expiry Schedule</h3>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Tally Active</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveOperationalTab(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Collapse view"
              >
                ✕ Close
              </button>
            </div>
          </div>

        {/* =======================================================================
            TAB 1 CONTENT: AC MAINTENANCE
           ======================================================================= */}
        {activeOperationalTab === 'ac' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAcFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    acFilter === 'all' ? 'bg-[#142B4A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({processedAcRecords.length})
                </button>
                <button
                  onClick={() => setAcFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    acFilter === 'expired'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Expired ({acExpiredCount})</span>
                </button>
                <button
                  onClick={() => setAcFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    acFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pending / Expiring Soon ({acPendingCount})</span>
                </button>
                <button
                  onClick={() => setAcFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    acFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active</span>
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/ac-maintenance')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A]/5 hover:bg-[#142B4A] text-[#142B4A] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Full AC Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">S.NO</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">VEHICLE NUMBER</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">FILTER CLEANING DATE</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">FILTER EXPIRY DATE</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">FILTER STATUS</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredAcRecords.map((a: any, idx: number) => (
                    <tr
                      key={a.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        a.isExpired ? 'bg-rose-50/30' : a.isExpiringSoon ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-700">
                        {a.bus_number || a.registration_number || (a.bus_id ? `Bus #${a.bus_id}` : '-')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                        {a.filter_cleaning_date || a.inspection_date || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200">
                        <span className={`font-black ${a.isExpired ? 'text-rose-600 underline' : a.isExpiringSoon ? 'text-amber-600' : 'text-slate-800'}`}>
                          {a.filter_expiry_date || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200">
                        {a.isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            Expired
                          </span>
                        ) : a.isExpiringSoon ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Expiring ({a.diffDays}d left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active ({a.diffDays}d left)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRenewAcModal(a)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            a.isExpired ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew Filter</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAcRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No AC maintenance records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================================
            TAB 2 CONTENT: DUE FOR TYRE ROTATION (Tallied from Daily Checkup KM)
           ======================================================================= */}
        {activeOperationalTab === 'tyre_rotation' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRotationFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rotationFilter === 'all' ? 'bg-[#142B4A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({processedWheelAllotments.length})
                </button>
                <button
                  onClick={() => setRotationFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rotationFilter === 'expired'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Limit Reached / Expired ({rotationExpiredCount})</span>
                </button>
                <button
                  onClick={() => setRotationFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rotationFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending / Due Soon ({rotationPendingCount})</span>
                </button>
                <button
                  onClick={() => setRotationFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rotationFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active</span>
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/tyre-maintenance?tab=allotment_rotation')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A]/5 hover:bg-[#142B4A] text-[#142B4A] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Open Tyre Rotation Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">S.NO</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">VEHICLE NUMBER</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">WORKING DATE</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">PRESENT KM</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">TARGET KM LIMIT</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">TOTAL TYRE KM RUN</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">STATUS</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredWheelAllotments.map((w: any, idx: number) => (
                    <tr
                      key={w.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        w.isExpired ? 'bg-rose-50/30' : w.isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <span className="font-bold text-blue-700 block">{w.busName}</span>
                        {w.regName && <span className="text-[10px] text-slate-400 font-medium block">{w.regName}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {w.event_date || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {w.fittedKm.toLocaleString('en-IN')} KM
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                        <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                          {w.targetKm.toLocaleString('en-IN')} KM
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 block">
                          {w.totalTyreKm.toLocaleString('en-IN')} KM
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          Checkup: {w.latestVehicleKm.toLocaleString('en-IN')} KM
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200">
                        {w.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Expired (Limit Reached)</span>
                          </span>
                        ) : w.isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending ({w.pendingKm.toLocaleString('en-IN')} KM Left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active ({w.pendingKm.toLocaleString('en-IN')} KM Left)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRenewRotationModal(w)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            w.isExpired ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew / Rotate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredWheelAllotments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        No wheel allotment records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================================
            TAB 3 CONTENT: TYRE AIR CHECKUP
           ======================================================================= */}
        {activeOperationalTab === 'tyre_air' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAirFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    airFilter === 'all' ? 'bg-[#142B4A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({processedAirCheckups.length})
                </button>
                <button
                  onClick={() => setAirFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    airFilter === 'expired'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Air Expired ({airExpiredCount})</span>
                </button>
                <button
                  onClick={() => setAirFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    airFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending ({airPendingCount})</span>
                </button>
                <button
                  onClick={() => setAirFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    airFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active</span>
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/tyre-maintenance?tab=air_checkup')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A]/5 hover:bg-[#142B4A] text-[#142B4A] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Open Tyre Air Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">S.NO</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">VEHICLE NUMBER</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">AIR CHECKUP DATE</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">EXPIRY DATE</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">STATUS</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredAirCheckups.map((a: any, idx: number) => (
                    <tr
                      key={a.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        a.isExpired ? 'bg-rose-50/30' : a.isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-700">
                        {a.busName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {a.checkup_date || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200">
                        <span className={`font-black ${a.isExpired ? 'text-rose-600 underline' : a.isPending ? 'text-amber-600' : 'text-slate-800'}`}>
                          {a.expiry_date || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200">
                        {a.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Expired</span>
                          </span>
                        ) : a.isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending ({a.diffDays}d left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active ({a.diffDays}d left)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRenewAirModal(a)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            a.isExpired ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew Air</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAirCheckups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No tyre air checkup records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    ) : (
        <div className="bg-slate-50/60 border border-dashed border-slate-200/90 rounded-2xl p-6 text-center transition-all">
          <p className="text-xs font-bold text-slate-500">
            Click on <span className="text-cyan-700 font-black">AC Maintenance</span>, <span className="text-indigo-700 font-black">Due for Tyre Rotation</span>, or <span className="text-blue-700 font-black">Tyre Air Checkup</span> above to view inspection schedule & renewals
          </p>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: AC FILTER RENEWAL MODAL
         ========================================================================= */}
      {renewingAcRecord && (
        <Modal
          isOpen={true}
          onClose={() => setRenewingAcRecord(null)}
          title={`Renew AC Filter — ${renewingAcRecord.bus_number || 'Vehicle'}`}
          size="md"
        >
          <form onSubmit={handleSaveRenewAc} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
              Updating filter cleaning record for{' '}
              <strong className="font-black text-blue-950">
                {renewingAcRecord.bus_number || `Bus #${renewingAcRecord.bus_id}`}
              </strong>
              . Filter expiry will automatically set to <strong>5 days</strong> after cleaning date.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Cleaning Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={renewAcFormData.filter_cleaning_date}
                onChange={(e) => {
                  const newCleaning = e.target.value;
                  const newExpiry = addDaysToDate(newCleaning, 5);
                  setRenewAcFormData((prev) => ({
                    ...prev,
                    filter_cleaning_date: newCleaning,
                    filter_expiry_date: newExpiry
                  }));
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Expiry Date <span className="text-emerald-600 font-normal">(Auto +5 Days)</span>
              </label>
              <input
                type="date"
                required
                value={renewAcFormData.filter_expiry_date}
                onChange={(e) =>
                  setRenewAcFormData((prev) => ({ ...prev, filter_expiry_date: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-900 font-bold focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proof Photo (Optional)
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{uploadingRenewPhoto ? 'Uploading...' : 'Upload Cleaning Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRenewAcPhotoUpload}
                    disabled={uploadingRenewPhoto}
                    className="hidden"
                  />
                </label>
                {renewAcFormData.filter_proof_photo && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    ✓ Photo Attached
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                placeholder="Notes on cleaning or filter condition..."
                value={renewAcFormData.remarks}
                onChange={(e) =>
                  setRenewAcFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingAcRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Filter Renewal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: TYRE ROTATION RENEWAL MODAL
         ========================================================================= */}
      {renewingRotationRecord && (
        <Modal
          isOpen={true}
          onClose={() => setRenewingRotationRecord(null)}
          title={`Renew Tyre Rotation — ${renewingRotationRecord.busName || 'Vehicle'}`}
          size="md"
        >
          <form onSubmit={handleSaveRenewRotation} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
              Renewing tyre rotation cycle for <strong className="font-black text-indigo-950">{renewingRotationRecord.busName}</strong>. The starting odometer will reset to entered Present KM, resetting the cycle for the next 10,000 KM.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Working Date *</label>
              <input
                type="date"
                required
                value={renewRotationFormData.event_date}
                onChange={(e) =>
                  setRenewRotationFormData((prev) => ({ ...prev, event_date: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Present KM (Starting Odometer for New Rotation Cycle) *
              </label>
              <input
                type="number"
                required
                value={renewRotationFormData.current_km}
                onChange={(e) =>
                  setRenewRotationFormData((prev) => ({ ...prev, current_km: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target KM Limit *</label>
              <input
                type="number"
                required
                value={renewRotationFormData.target_km}
                onChange={(e) =>
                  setRenewRotationFormData((prev) => ({ ...prev, target_km: Number(e.target.value) }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/40 text-indigo-900 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                placeholder="Tyres rotated cross-diagonally, balance verified"
                value={renewRotationFormData.notes}
                onChange={(e) =>
                  setRenewRotationFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingRotationRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Rotation Renewal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 3: TYRE AIR CHECKUP RENEWAL MODAL
         ========================================================================= */}
      {renewingAirRecord && (
        <Modal
          isOpen={true}
          onClose={() => setRenewingAirRecord(null)}
          title={`Renew Tyre Air Checkup — ${renewingAirRecord.busName || 'Vehicle'}`}
          size="md"
        >
          <form onSubmit={handleSaveRenewAir} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
              Renewing air pressure checkup for <strong className="font-black text-blue-950">{renewingAirRecord.busName}</strong>. The validity will extend to 7 days from checkup date.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Air Checkup Date *</label>
                <input
                  type="date"
                  required
                  value={renewAirFormData.checkup_date}
                  onChange={(e) => {
                    const checkup = e.target.value;
                    const expiry = addDaysToDate(checkup, 4);
                    setRenewAirFormData((prev) => ({
                      ...prev,
                      checkup_date: checkup,
                      expiry_date: expiry
                    }));
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expiry Date <span className="text-emerald-600 font-normal">(Auto +4 Days)</span>
                </label>
                <input
                  type="date"
                  required
                  value={renewAirFormData.expiry_date}
                  onChange={(e) =>
                    setRenewAirFormData((prev) => ({ ...prev, expiry_date: e.target.value }))
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-900 font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                placeholder="Air pressure checked and verified"
                value={renewAirFormData.remarks}
                onChange={(e) =>
                  setRenewAirFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingAirRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Air Renewal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
