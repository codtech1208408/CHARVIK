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
  Sparkles,
  Save,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const SupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [recentKm, setRecentKm] = useState<any[]>([]);

  // Active module tab in Support Dashboard
  const [activeTab, setActiveTab] = useState<'daily-km' | 'maintenance' | 'complaints' | 'bus-condition' | 'fleet-tracking'>('complaints');

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
      const [dashRes, busesRes, compRes, schedRes, repairsRes] = await Promise.all([
        api.getDashboard().catch(() => ({})),
        api.getBuses().catch(() => []),
        api.getComplaints().catch(() => []),
        api.getMaintenanceSchedules().catch(() => []),
        api.getRepairs().catch(() => [])
      ]);

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

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          HEADER: Welcome Banner with Role & Status Indicator
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#142B4A] tracking-tight">
                Support Staff Operational Panel
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Authorized Staff Access
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Logged in as <strong className="text-slate-800">{user?.name}</strong> • Routine Maintenance, Inspections & Defect Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsConditionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Bus Inspection</span>
          </button>

          <button
            onClick={() => setActiveTab('daily-km')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#142B4A] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
          >
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            <span>Log Daily KM</span>
          </button>
        </div>
      </div>

      {/* Role Restriction Notice for Support */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>
            <strong>Support Access Scope:</strong> You can log daily kilometers, record maintenance, manage complaints & repairs, update bus condition, and view fleet/staff tracking. User management, master record deletion, and system settings require Administrator access.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">
          Role: Support Staff
        </span>
      </div>

      {/* =========================================================================
          4 REQUIRED STAT CARDS:
          1. Pending Complaints
          2. Due Maintenance
          3. Today's KM Entries
          4. Repairs in Progress
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Support Operational KPIs
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600">Active Shift Metrics</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Complaints"
            value={pendingComplaintsCount}
            icon={AlertTriangle}
            iconBgColor="bg-rose-50"
            iconColor="text-rose-600"
            linkTo="/supporter/complaints"
          />
          <StatCard
            title="Due Maintenance"
            value={dueMaintenanceCount}
            icon={CalendarDays}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            linkTo="/supporter/maintenance-schedule"
          />
          <StatCard
            title="Today's KM Entries"
            value={todayKmEntriesCount}
            icon={Gauge}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            linkTo="/supporter/daily-kilometers"
          />
          <StatCard
            title="Repairs in Progress"
            value={repairsInProgressCount}
            icon={Wrench}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            linkTo="/supporter/repairs"
          />
        </div>
      </div>

      {/* =========================================================================
          MODULE NAVIGATION TABS (Support Capabilities)
         ========================================================================= */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
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

          <button
            onClick={() => setActiveTab('fleet-tracking')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'fleet-tracking'
                ? 'bg-[#142B4A] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Live Fleet & Staff Tracking</span>
          </button>
        </nav>
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
                onClick={() => navigate('/supporter/complaints')}
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
                  {complaints.slice(0, 6).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
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
                      <td colSpan={7} className="text-center py-8 text-slate-400">
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
                onClick={() => navigate('/supporter/daily-kilometers')}
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
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Bus No</th>
                    <th className="py-2.5 px-3 font-semibold">Driver</th>
                    <th className="py-2.5 px-3 font-semibold">Opening</th>
                    <th className="py-2.5 px-3 font-semibold">Closing</th>
                    <th className="py-2.5 px-3 font-semibold font-mono text-emerald-700">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentKm.slice(0, 6).map((k: any) => (
                    <tr key={k.id} className="hover:bg-slate-50/70">
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
              onClick={() => navigate('/supporter/maintenance-schedule')}
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
                    <strong className="text-slate-800">₹{s.estimated_cost?.toLocaleString()}</strong>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buses.slice(0, 6).map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#142B4A]">{b.bus_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.operational_status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.operational_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{b.make} {b.model} • {b.seating_capacity} Seats</p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Driver: <strong>{b.driver_name || 'Assigned Route Driver'}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>Route: <strong>{b.make ? `${b.make} Assigned Route` : 'Transit Route'}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        <span>Odometer: <strong>{b.current_odometer_km?.toLocaleString()} KM</strong></span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>GPS Telemetry: {b.operational_status === 'Active' ? 'Active' : 'Offline'}</span>
                    <span className="text-emerald-700 font-semibold">{b.operational_status === 'Active' ? 'Status: In-Transit' : 'Status: Stationary'}</span>
                  </div>
                </div>
              ))}
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
