import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Gauge,
  Wrench,
  Bus,
  CheckCircle2,
  Clock,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Radio,
  MapPin,
  Users,
  Navigation,
  FileText,
  Activity,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  Sparkles,
  Save,
  Check,
  X,
  ClipboardList,
  UserPlus,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ALL_MODULE_CATEGORIES } from '../constants/moduleCategories';

export const SupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const activeOperator = (() => {
    if (user && (user.role.toLowerCase().includes('operator') || user.role.toLowerCase().includes('support'))) {
      return user;
    }
    try {
      const s = localStorage.getItem('charvik_user');
      const parsed = s ? JSON.parse(s) : null;
      if (parsed && (parsed.role.toLowerCase().includes('operator') || parsed.role.toLowerCase().includes('support'))) {
        return parsed;
      }
    } catch {}
    return {
      id: 7,
      name: 'NEELAM HARISH',
      email: 'harish@charvik.com',
      role: 'Operator',
      categories: ['Route Management', 'Task Management', 'AC Maintenance']
    };
  })();
  const isAdmin = false;

  const handleReturnToAdmin = () => {
    const adminUser = {
      id: 1,
      name: 'Admin Manager',
      email: 'admin@charvik.com',
      role: 'Super Admin'
    };
    localStorage.setItem('charvik_user', JSON.stringify(adminUser));
    localStorage.setItem('charvik_token', 'charvik_cloud_token_admin_session');
    if (setUser) setUser(adminUser);
    navigate('/admin/dashboard');
  };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [recentKm, setRecentKm] = useState<any[]>([]);
  const [operatorCategories, setOperatorCategories] = useState<string[]>(['Route Management', 'Task Management', 'AC Maintenance']);
  const [operatorName, setOperatorName] = useState<string>('');

  // Active module tab in Support Dashboard
  const [activeTab, setActiveTab] = useState<'daily-km' | 'maintenance' | 'complaints' | 'bus-condition' | 'fleet-tracking'>('maintenance');

  // Daily KM Quick Entry State
  const [kmBusId, setKmBusId] = useState('');
  const [kmDate, setKmDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [openingKm, setOpeningKm] = useState<number | string>('');
  const [closingKm, setClosingKm] = useState<number | string>('');
  const [kmRemarks, setKmRemarks] = useState('');
  const [savingKm, setSavingKm] = useState(false);

  // Condition Quick Check Modal State
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [conditionBusId, setConditionBusId] = useState('');
  const [conditionCleanliness, setConditionCleanliness] = useState('Clean & Sanitized');
  const [conditionBrakes, setConditionBrakes] = useState('Good');
  const [conditionAc, setConditionAc] = useState('Working');
  const [conditionTyres, setConditionTyres] = useState('Good');
  const [conditionRoadworthy, setConditionRoadworthy] = useState<'Fit for Service' | 'Fit with Restrictions' | 'Not Fit for Service'>('Fit for Service');
  const [conditionNotes, setConditionNotes] = useState('');
  const [savingCondition, setSavingCondition] = useState(false);

  // Quick Complaint Status Update Modal
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaintStatus, setComplaintStatus] = useState('In Progress');
  const [complaintResolution, setComplaintResolution] = useState('');
  const [updatingComplaint, setUpdatingComplaint] = useState(false);

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      const [dashRes, busesRes, compRes, schedRes, repairsRes, staffRes] = await Promise.all([
        api.getDashboard().catch(() => ({})),
        api.getBuses().catch(() => []),
        api.getComplaints().catch(() => []),
        api.getMaintenanceSchedules().catch(() => []),
        api.getRepairs().catch(() => []),
        api.getStaffCredentials().catch(() => [])
      ]);

      const op = (staffRes || []).find((s: any) => (s.role === 'Support Staff' || s.role === 'Operator') && s.status === 'Active') ||
                 (staffRes || []).find((s: any) => s.role === 'Support Staff' || s.role === 'Operator');
      if (op) {
        setOperatorName(op.name);
        let cats: string[] = [];
        if (Array.isArray(op.categories)) {
          cats = op.categories;
        } else if (typeof op.categories === 'string') {
          try {
            const parsed = JSON.parse(op.categories);
            if (Array.isArray(parsed)) cats = parsed;
          } catch {}
        }
        if (cats.length > 0) {
          setOperatorCategories(cats);
        }
      }

      setData(dashRes);
      setBuses(busesRes || []);
      setComplaints(compRes || []);
      setSchedules(schedRes || []);
      setRepairs(repairsRes || []);
      setRecentKm(dashRes?.recentKm || []);

      if (busesRes?.length > 0) {
        setKmBusId(String(busesRes[0].id));
        setConditionBusId(String(busesRes[0].id));
        setOpeningKm(busesRes[0].current_odometer_km || 0);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load support dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBusChangeForKm = async (busIdStr: string) => {
    setKmBusId(busIdStr);
    const bus = buses.find((b) => String(b.id) === String(busIdStr));
    if (bus) {
      try {
        const res = await api.suggestOpeningKm(bus.id);
        setOpeningKm(res.suggestedOpening || bus.current_odometer_km || 0);
      } catch {
        setOpeningKm(bus.current_odometer_km || 0);
      }
    }
  };

  const handleQuickKmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmBusId) {
      error('Please select a bus');
      return;
    }
    const op = Number(openingKm);
    const cl = Number(closingKm);
    if (!cl || cl < op) {
      error('Closing KM must be greater than Opening KM');
      return;
    }

    setSavingKm(true);
    try {
      const selectedBus = buses.find((b) => String(b.id) === String(kmBusId));
      await api.createDailyKm({
        bus_id: Number(kmBusId),
        entry_date: kmDate,
        opening_km: op,
        closing_km: cl,
        driver_id: selectedBus?.assigned_driver_id || null,
        remarks: kmRemarks || 'Logged via Support Panel'
      });
      success(`Kilometer entry saved! Distance: ${cl - op} km for ${selectedBus?.bus_number}`);
      setKmRemarks('');
      setClosingKm('');
      loadSupportData();
    } catch (err: any) {
      error(err.message || 'Failed to save kilometer entry');
    } finally {
      setSavingKm(false);
    }
  };

  const handleQuickConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionBusId) {
      error('Please select a bus');
      return;
    }
    setSavingCondition(true);
    try {
      await api.createBusCondition({
        bus_id: Number(conditionBusId),
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_name: user?.name || 'Support Staff Member',
        seat_condition: conditionCleanliness,
        brake_condition: conditionBrakes,
        ac_condition: conditionAc,
        tyre_condition: conditionTyres,
        roadworthiness_status: conditionRoadworthy,
        inspector_remarks: conditionNotes || 'Routine support checklist completed'
      });
      success('Bus condition and cleanliness inspection logged successfully!');
      setIsConditionModalOpen(false);
      setConditionNotes('');
    } catch (err: any) {
      error(err.message || 'Failed to save condition report');
    } finally {
      setSavingCondition(false);
    }
  };

  const handleUpdateComplaintStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdatingComplaint(true);
    try {
      await api.updateComplaint(selectedComplaint.id, {
        status: complaintStatus,
        resolution_description: complaintResolution
      });
      success(`Complaint ${selectedComplaint.complaint_ref} updated to ${complaintStatus}`);
      setSelectedComplaint(null);
      loadSupportData();
    } catch (err: any) {
      error(err.message || 'Failed to update complaint');
    } finally {
      setUpdatingComplaint(false);
    }
  };

  // 4 Required KPIs
  const pendingComplaintsCount = complaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Closed'
  ).length;

  const dueMaintenanceCount = schedules.filter(
    (s) => s.status === 'Due' || s.status === 'Due Soon' || s.status === 'Scheduled' || s.status === 'Pending'
  ).length;

  const todayKmEntriesCount = recentKm.length || data?.recentKm?.length || 0;

  const repairsInProgressCount = repairs.filter(
    (r) => r.status === 'In Progress' || r.status === 'Waiting for Parts' || r.status === 'Requested'
  ).length;

  // Filter permitted categories for the Operator (Never use Admin's 9 categories)
  const DEFAULT_OP_CATS = ['Route Management', 'Task Management', 'AC Maintenance'];
  const effectiveUserCats = (!isAdmin && Array.isArray(user?.categories) && user.categories.length > 0)
    ? user.categories
    : operatorCategories.length > 0
    ? operatorCategories
    : DEFAULT_OP_CATS;

  const userCats = effectiveUserCats.map((c: any) => String(c || '').trim()).filter(Boolean);
  const permittedModules = ALL_MODULE_CATEGORIES.filter((cat) => {
    return userCats.some((c) => c.toLowerCase() === cat.name.trim().toLowerCase());
  });

  const hasRouteManagement = userCats.some(c => c.toLowerCase() === 'route management');
  const hasTaskManagement = userCats.some(c => c.toLowerCase() === 'task management');
  const hasAcMaintenance = userCats.some(c => c.toLowerCase() === 'ac maintenance');
  const hasTyreMaintenance = userCats.some(c => c.toLowerCase() === 'tyre maintenance');
  const hasDailyKm = userCats.some(c => c.toLowerCase() === 'mileage & fueling');
  const hasCheckup = userCats.some(c => c.toLowerCase() === 'daily vehicle checkup');
  const hasVehicles = userCats.some(c => c.toLowerCase() === 'vehicle registration');

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          HEADER: Welcome Banner with Role & Real Bus Coach matching Admin Panel
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-lg">
        {/* Background glow effects */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-10 w-48 h-48 bg-sky-400/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Operator Fleet Operations Live</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Operator Operational Panel
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                Logged in as <strong className="text-white font-bold">{activeOperator.name}</strong> • Authorized Fleet Operations & Dispatch Management
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 pt-1">
              <button
                onClick={handleReturnToAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 shadow-sm transition-all cursor-pointer"
                title="Return to Main Admin Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-700" />
                <span>Return to Admin Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/operator/employee-registration')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Employee Registration</span>
              </button>

              {(hasTaskManagement || hasRouteManagement) && (
                <button
                  onClick={() => navigate('/operator/tasks')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 shadow-sm transition-all cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Trip Tasks & Schedule</span>
                </button>
              )}

              {hasCheckup && (
                <button
                  onClick={() => setIsConditionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-500/80 hover:bg-teal-500 backdrop-blur-md border border-white/25 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Bus Inspection</span>
                </button>
              )}
            </div>
          </div>

          {/* Real Bus Coach Image inside Banner matching Admin Panel */}
          <div className="w-full lg:w-72 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-md relative group shrink-0">
            <img
              src="/assets/fleet2.jpg"
              alt="Premium Fleet Coach"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <span className="absolute bottom-2 left-3 text-[10px] font-black text-white tracking-wider uppercase drop-shadow-sm">
              PREMIUM FLEET COACH
            </span>
          </div>
        </div>
      </div>

      {/* Colourful KPI Cards matching Admin Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Fleet Buses (Emerald Gradient) */}
        <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Active Fleet Buses</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
              {buses.filter((b) => b.operational_status === 'Active').length} / {buses.length || 0}
            </h3>
            <p className="text-xs text-emerald-700/90 font-medium mt-1">Operational in-transit coaches</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Permitted Modules (Sky Blue Gradient) */}
        <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Active Categories</p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 font-mono">
              {permittedModules.length} Modules
            </h3>
            <p className="text-xs text-blue-700/90 font-medium mt-1">Authorized operator access</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Maintenance & Tasks (Amber Gradient) */}
        <div className="bg-gradient-to-br from-[#FEF5ED] via-[#FFF9F4] to-[#FDE8D7] border-2 border-[#FCD2B3] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">Schedules & Services</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 font-mono">
              {schedules.length || 0} Scheduled
            </h3>
            <p className="text-xs text-amber-700/90 font-medium mt-1">Active service intervals</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Open Defects (Rose / Purple Gradient) */}
        <div className="bg-gradient-to-br from-[#FFF0F2] via-[#FFF6F7] to-[#FEDEE2] border-2 border-[#FDB8C2] p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
          <div className="flex-1">
            <p className="text-xs font-black text-rose-950 uppercase tracking-wider">Complaints & Defects</p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-900 mt-1 font-mono">
              {complaints.length} Open
            </h3>
            <p className="text-xs text-rose-700/90 font-medium mt-1">Pending maintenance issues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#BE123C] text-white flex items-center justify-center shrink-0 ml-3 shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Role Notice for Operator */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>
            <strong>Operator Category Permissions ({operatorName || user?.name || 'Operator'}):</strong> Authorized for{' '}
            <strong className="text-blue-700">{permittedModules.length} Categories:</strong>{' '}
            {permittedModules.map((m) => m.name).join(', ') || 'No categories assigned yet'}.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
          {permittedModules.length} Active Categories
        </span>
      </div>

      {/* =========================================================================
          MODULE NAVIGATION TABS (Support Capabilities)
         ========================================================================= */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          {(hasAcMaintenance || hasTyreMaintenance) && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'maintenance'
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Maintenance Schedule</span>
            </button>
          )}

          {(hasRouteManagement || hasTaskManagement) && (
            <button
              onClick={() => setActiveTab('fleet-tracking')}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'fleet-tracking'
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Fleet & Route Tracking</span>
            </button>
          )}

          {hasDailyKm && (
            <button
              onClick={() => setActiveTab('daily-km')}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'daily-km'
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Daily KM Logging</span>
            </button>
          )}

          {hasCheckup && (
            <button
              onClick={() => setActiveTab('bus-condition')}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'bus-condition'
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bus Cleanliness & Inspection</span>
            </button>
          )}

          {(hasVehicles || complaints.length > 0) && (
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'complaints'
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Complaints & Defects ({complaints.length})</span>
            </button>
          )}

          <button
            onClick={() => navigate('/operator/employee-registration')}
            className="py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Employee Registration</span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          PERMITTED CATEGORIES & ADMIN MODULES (Strictly Filtered)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Accessible Operations Modules ({permittedModules.length} Active Categories)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Only modules authorized by Administrator for this operator account are displayed here. All records sync live with the Admin database.
            </p>
          </div>
          <button
            onClick={() => navigate('/operator/employee-registration')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer w-fit"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Employee</span>
          </button>
        </div>

        {permittedModules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-xs text-slate-700">No Operation Categories Assigned Yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Administrator assigns category permissions in Admin Panel under Employee Registration. Once permissions are granted, assigned modules will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {permittedModules.map((m) => {
              const IconComponent = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(m.route)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-400 transition-all text-left flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-blue-600 group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                        {m.name}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{m.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: COMPLAINTS & DEFECTS MANAGEMENT
         ========================================================================= */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-[#142B4A]">Active Complaints & Defects Log</h4>
                <p className="text-xs text-slate-500">Track and update resolution status for reported vehicle issues</p>
              </div>
              <button
                onClick={() => navigate('/operator/complaints')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Full Complaints Board</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-14">S.NO</th>
                    <th className="py-2.5 px-3 font-semibold">Ref ID</th>
                    <th className="py-2.5 px-3 font-semibold">Bus No</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.slice(0, 6).map((c, index) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{c.complaint_ref}</td>
                      <td className="py-3 px-3 font-bold text-blue-700">{c.bus_number}</td>
                      <td className="py-3 px-3 text-slate-600">{c.category}</td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{c.description}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : c.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            c.status === 'Resolved'
                              ? 'success'
                              : c.status === 'In Progress'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setComplaintStatus(c.status);
                            setComplaintResolution(c.resolution_description || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                  {complaints.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No active complaints reported. Fleet operating smoothly!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAILY KM LOGGING
         ========================================================================= */}
      {activeTab === 'daily-km' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h4 className="text-base font-bold text-[#142B4A] mb-1">Quick Daily KM Log</h4>
            <p className="text-xs text-slate-500 mb-4">Record distance travelled for route buses today</p>

            <form onSubmit={handleQuickKmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bus Number</label>
                <select
                  value={kmBusId}
                  onChange={(e) => handleBusChangeForKm(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number} — {b.model || b.make} ({b.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entry Date</label>
                <input
                  type="date"
                  value={kmDate}
                  onChange={(e) => setKmDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening KM</label>
                  <input
                    type="number"
                    value={openingKm}
                    onChange={(e) => setOpeningKm(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Closing KM</label>
                  <input
                    type="number"
                    value={closingKm}
                    onChange={(e) => setClosingKm(e.target.value)}
                    placeholder="e.g. 45240"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              {Number(closingKm) > Number(openingKm) && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex justify-between">
                  <span>Distance Travelled:</span>
                  <span>{Number(closingKm) - Number(openingKm)} KM</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={kmRemarks}
                  onChange={(e) => setKmRemarks(e.target.value)}
                  placeholder="e.g. Completed Route 14 shift on time"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingKm}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {savingKm ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Daily KM Record</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-[#142B4A]">Recent KM Entries</h4>
                <p className="text-xs text-slate-500">Live operational logs recorded across the fleet</p>
              </div>
              <button
                onClick={() => navigate('/operator/daily-kilometers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-14">S.NO</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Bus No</th>
                    <th className="py-2.5 px-3 font-semibold">Driver</th>
                    <th className="py-2.5 px-3 font-semibold">Opening</th>
                    <th className="py-2.5 px-3 font-semibold">Closing</th>
                    <th className="py-2.5 px-3 font-semibold font-mono text-emerald-700">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentKm.slice(0, 6).map((k: any, index: number) => (
                    <tr key={k.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{k.entry_date}</td>
                      <td className="py-2.5 px-3 font-bold text-[#142B4A]">{k.bus_number}</td>
                      <td className="py-2.5 px-3 text-slate-600">{k.driver_name || 'Assigned Driver'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{k.opening_km}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{k.closing_km}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{k.distance_travelled_km} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PREVENTIVE MAINTENANCE SCHEDULE
         ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-[#142B4A]">Upcoming Preventive Maintenance</h4>
              <p className="text-xs text-slate-500">Scheduled servicing across tyres, AC, oil filters, and batteries</p>
            </div>
            <button
              onClick={() => navigate('/operator/maintenance-schedule')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Manage Schedules</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {schedules.slice(0, 6).map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-xs text-[#142B4A]">{s.bus_number}</span>
                    <p className="text-[11px] text-slate-500">{s.maintenance_type}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'Due'
                        ? 'bg-rose-100 text-rose-800'
                        : s.status === 'Due Soon'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 mt-2 pt-2 border-t border-slate-200/60">
                  <p className="flex justify-between">
                    <span>Due Date:</span>
                    <strong className="text-slate-800">{s.next_due_date || 'KM-based'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Target KM:</span>
                    <strong className="text-slate-800">{s.next_due_km ? `${s.next_due_km} km` : 'N/A'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Estimated Cost:</span>
                    <strong className="text-slate-800">₹{Number(s.estimated_cost || 0).toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BUS CONDITION CHECKLIST
         ========================================================================= */}
      {activeTab === 'bus-condition' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-[#142B4A]">Bus Condition & Cleanliness Inspections</h4>
              <p className="text-xs text-slate-500">Log pre-trip sanitary checks, interior condition, and safety equipment</p>
            </div>
            <button
              onClick={() => setIsConditionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Inspection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sanitization & Cleanliness
              </span>
              <p className="text-[11px] text-slate-600 mt-1">Floor mopped, handles wiped, seats sanitized prior to route dispatch.</p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Safety & Emergency Exits
              </span>
              <p className="text-[11px] text-slate-600 mt-1">Emergency doors clear, glass hammers in place, first aid kit stocked.</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                Lighting & Wipers
              </span>
              <p className="text-[11px] text-slate-600 mt-1">Headlamps, brake lights, indicators, and windshield wipers tested.</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
              <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                Tyre & Fluid Checks
              </span>
              <p className="text-[11px] text-slate-600 mt-1">Tread visual check, pressure inspection, engine coolant & oil levels.</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: LIVE FLEET & STAFF TRACKING (VIEW ONLY FOR SUPPORT)
         ========================================================================= */}
      {activeTab === 'fleet-tracking' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-[#142B4A]">Live Fleet & Staff Tracking View</h4>
                <p className="text-xs text-slate-500">Real-time bus locations, assigned driver, helper, and route status</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                GPS Satellites Online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {buses.slice(0, 6).map((b, idx) => {
                const busImgUrl = (idx % 5 === 0) ? '/assets/fleet1.jpg' : (idx % 5 === 1) ? '/assets/fleet2.jpg' : (idx % 5 === 2) ? '/assets/fleet3.jpg' : (idx % 5 === 3) ? '/assets/fleet4.jpg' : '/assets/fleet5.jpg';
                return (
                  <div key={b.id || idx} className="p-4 rounded-3xl border-2 border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-black text-base text-[#142B4A]">{b.registration_number || b.bus_number}</span>
                          <p className="text-[11px] text-slate-500 font-semibold">{b.make} {b.model || 'Scania Metrolink'}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.operational_status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.operational_status}
                        </span>
                      </div>

                      {/* Real Bus Coach Image matching Admin Panel */}
                      <div className="w-full h-36 rounded-2xl overflow-hidden my-2.5 relative shadow-xs border border-slate-100">
                        <img
                          src={busImgUrl}
                          alt={b.registration_number || b.bus_number}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <span className="absolute bottom-2 left-2.5 text-[10px] font-black text-white tracking-wider uppercase drop-shadow-sm">
                          {b.bus_type || 'Express Fleet Coach'}
                        </span>
                      </div>

                      {/* Odometer Ribbon matching Admin Panel */}
                      <div className="my-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-sky-50/80 border border-blue-200/80 flex items-center justify-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-600" />
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {Number(b.current_odometer_km || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">KM</span>
                      </div>

                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Driver: <strong className="text-slate-800">{b.driver_name || 'Assigned Route Captain'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Corridor: <strong className="text-slate-800">{b.make ? `${b.make} Express Corridor` : 'State Transit Route'}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        GPS Telemetry Live
                      </span>
                      <span className="font-semibold text-slate-700">{b.seating_capacity || 42} Seater AC</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Quick Bus Condition Inspection
         ========================================================================= */}
      <Modal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        title="Record Bus Condition & Sanitization Inspection"
      >
        <form onSubmit={handleQuickConditionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Bus</label>
            <select
              value={conditionBusId}
              onChange={(e) => setConditionBusId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-xs"
              required
            >
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bus_number} — {b.model || b.make}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sanitization / Seats</label>
              <select
                value={conditionCleanliness}
                onChange={(e) => setConditionCleanliness(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="Clean & Sanitized">Clean & Sanitized</option>
                <option value="Needs Light Cleaning">Needs Light Cleaning</option>
                <option value="Dirty / Needs Wash">Dirty / Needs Wash</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Brakes Condition</label>
              <select
                value={conditionBrakes}
                onChange={(e) => setConditionBrakes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="Good">Good</option>
                <option value="Spongy / Needs Bleeding">Spongy / Needs Bleeding</option>
                <option value="Worn Pads">Worn Pads</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">AC & Cooling</label>
              <select
                value={conditionAc}
                onChange={(e) => setConditionAc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="Working">Working (Optimal)</option>
                <option value="Low Cooling">Low Cooling</option>
                <option value="Not Working">Not Working</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tyres Condition</label>
              <select
                value={conditionTyres}
                onChange={(e) => setConditionTyres(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="Good">Good (Above 6mm)</option>
                <option value="Moderate Wear">Moderate Wear</option>
                <option value="Critical Wear / Puncture">Critical Wear</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Roadworthiness Fitness Status</label>
            <select
              value={conditionRoadworthy}
              onChange={(e) => setConditionRoadworthy(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
            >
              <option value="Fit for Service">Fit for Service (Cleared for Route)</option>
              <option value="Fit with Restrictions">Fit with Restrictions</option>
              <option value="Not Fit for Service">Not Fit for Service (Grounded for Repairs)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Inspection Notes & Findings</label>
            <textarea
              rows={3}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Record any scratches, broken bulb, interior odor, or minor observations..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConditionModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCondition}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {savingCondition ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Inspection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: Update Complaint Status
         ========================================================================= */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Update Complaint Status: ${selectedComplaint.complaint_ref}`}
        >
          <form onSubmit={handleUpdateComplaintStatus} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-[#142B4A]">{selectedComplaint.bus_number} — {selectedComplaint.category}</p>
              <p className="text-slate-600 mt-1">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Resolution Status</label>
              <select
                value={complaintStatus}
                onChange={(e) => setComplaintStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
              >
                <option value="Open">Open</option>
                <option value="Assigned">Assigned to Technician</option>
                <option value="In Progress">In Progress (Work Underway)</option>
                <option value="Resolved">Resolved (Work Completed)</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Done / Action Taken</label>
              <textarea
                rows={3}
                value={complaintResolution}
                onChange={(e) => setComplaintResolution(e.target.value)}
                placeholder="Describe parts replaced, adjustments made, or technician notes..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingComplaint}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
              >
                {updatingComplaint ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
