import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bus,
  User,
  Edit,
  Trash2,
  Calendar,
  Check,
  Eye,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Users,
  MapPin,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

export interface CrewFinancial {
  employee_id?: number | string;
  employee_name: string;
  role: 'Driver' | 'Helper' | 'Captain';
  salary_amount: number;
  advance_amount: number;
  balance_due: number;
  work_remarks?: string;
}

export interface TripDutyItem {
  id: number;
  trip_start_date: string; // YYYY-MM-DD
  vehicle_number: string; // registration_number
  vehicle_status: 'RUN' | 'HOLD (Low Occupancy)' | 'HOLD (Maintenance)' | 'HOLD (Break Down)' | 'HOLD (Finance Side)';
  route_corridor: string;
  operator_organizer: string;
  driver1: CrewFinancial;
  driver2?: CrewFinancial;
  helper?: CrewFinancial;
  captain?: CrewFinancial;
  trip_remarks: string;
  duty_status: 'Scheduled' | 'In Progress' | 'Completed';
  created_at: string;
}

const STORAGE_KEY = 'charvik_trip_duty_management_v2';

export const TaskManagement: React.FC = () => {
  const { success, error } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [buses, setBuses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'assigned' | 'pending' | 'all_trips'>('assigned');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripDutyItem | null>(null);
  const [isViewTripsOpen, setIsViewTripsOpen] = useState(false);
  const [selectedBusForView, setSelectedBusForView] = useState<string | null>(null);

  // Trips Store
  const [trips, setTrips] = useState<TripDutyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Form State
  const [formData, setFormData] = useState<Partial<TripDutyItem>>({
    trip_start_date: todayStr,
    vehicle_number: '',
    vehicle_status: 'RUN',
    route_corridor: '',
    operator_organizer: '',
    driver1: {
      employee_name: '',
      role: 'Driver',
      salary_amount: '' as any,
      advance_amount: 0,
      balance_due: 0
    },
    driver2: {
      employee_name: '',
      role: 'Driver',
      salary_amount: '' as any,
      advance_amount: 0,
      balance_due: 0
    },
    helper: undefined,
    captain: undefined,
    trip_remarks: '',
    duty_status: 'Scheduled'
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    } catch {}
  }, [trips]);

  useEffect(() => {
    async function loadAux() {
      try {
        const [bData, eData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getEmployees().catch(() => [])
        ]);
        setBuses(Array.isArray(bData) ? bData : []);
        setEmployees(Array.isArray(eData) ? eData : []);
      } catch {}

      // Load routes & organizers from local storage caches
      try {
        const rSaved = localStorage.getItem('charvik_route_management_data');
        if (rSaved) setRoutes(JSON.parse(rSaved));
        const oSaved = localStorage.getItem('charvik_organizer_management_data');
        if (oSaved) setOrganizers(JSON.parse(oSaved));
      } catch {}
    }
    loadAux();
  }, []);

  const drivers = useMemo(() => employees.filter((e) => e.role === 'Driver'), [employees]);
  const helpers = useMemo(() => employees.filter((e) => e.role === 'Helper'), [employees]);
  const captains = useMemo(() => employees.filter((e) => e.role === 'Captain'), [employees]);

  // Trips strictly on the selected date
  const dateTrips = useMemo(() => {
    return trips.filter((t) => t.trip_start_date === selectedDate);
  }, [trips, selectedDate]);

  // Group trips by vehicle number on selected date
  const busGroupMap = useMemo(() => {
    const map = new Map<string, TripDutyItem[]>();
    dateTrips.forEach((t) => {
      const reg = t.vehicle_number;
      if (!map.has(reg)) map.set(reg, []);
      map.get(reg)!.push(t);
    });
    return map;
  }, [dateTrips]);

  const assignedBusNumbers = useMemo(() => Array.from(busGroupMap.keys()), [busGroupMap]);

  // Unassigned buses on selected date
  const pendingBusesList = useMemo(() => {
    const assignedSet = new Set(assignedBusNumbers.map((s) => s.toUpperCase()));
    return buses.filter((b) => !assignedSet.has(b.registration_number.toUpperCase()));
  }, [buses, assignedBusNumbers]);

  // Metrics for selected date
  const totalFleetCount = buses.length;
  const activeAssignedCount = assignedBusNumbers.length;
  const pendingBusesCount = pendingBusesList.length;

  const completedBusesCount = useMemo(() => {
    return assignedBusNumbers.filter((busNo) => {
      const bTrips = busGroupMap.get(busNo) || [];
      return bTrips.length > 0 && bTrips.every((t) => t.duty_status === 'Completed');
    }).length;
  }, [assignedBusNumbers, busGroupMap]);

  const holdBusesCount = useMemo(() => {
    return assignedBusNumbers.filter((busNo) => {
      const bTrips = busGroupMap.get(busNo) || [];
      return bTrips.some((t) => t.vehicle_status.startsWith('HOLD'));
    }).length;
  }, [assignedBusNumbers, busGroupMap]);

  // Open Add Modal
  const handleOpenAdd = (preselectedBusNumber?: string) => {
    setEditingTrip(null);
    const defaultBus = preselectedBusNumber || buses[0]?.registration_number || '';
    const defaultRoute = routes[0] ? `${routes[0].starting_city} → ${routes[0].ending_city}` : '';
    const defaultOrg = organizers[0]?.organization_name || '';

    setFormData({
      trip_start_date: selectedDate,
      vehicle_number: defaultBus,
      vehicle_status: 'RUN',
      route_corridor: defaultRoute,
      operator_organizer: defaultOrg,
      driver1: {
        employee_name: '',
        role: 'Driver',
        salary_amount: '' as any,
        advance_amount: 0,
        balance_due: 0
      },
      driver2: {
        employee_name: '',
        role: 'Driver',
        salary_amount: '' as any,
        advance_amount: 0,
        balance_due: 0
      },
      helper: undefined,
      captain: undefined,
      trip_remarks: '',
      duty_status: 'Scheduled'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (trip: TripDutyItem) => {
    setEditingTrip(trip);
    setFormData({
      ...trip,
      driver2: trip.driver2 || {
        employee_name: '',
        role: 'Driver',
        salary_amount: '' as any,
        advance_amount: 0,
        balance_due: 0
      }
    });
    setIsAddOpen(true);
  };

  // Status Change Rule: If Vehicle Status is HOLD, Driver 1 & Driver 2 salary auto-sets to 500 and advance resets to 0.
  // If RUN, it auto-restores the driver's registered salary (temporary or permanent).
  const handleVehicleStatusChange = (newStatus: 'RUN' | 'HOLD (Low Occupancy)' | 'HOLD (Maintenance)' | 'HOLD (Break Down)' | 'HOLD (Finance Side)') => {
    setFormData((prev) => {
      const isHold = newStatus.startsWith('HOLD');
      let d1Salary: any = '';
      let d2Salary: any = '';

      if (isHold) {
        d1Salary = 500;
        d2Salary = 500;
      } else {
        const d1Emp = drivers.find((d) => d.full_name === prev.driver1?.employee_name);
        const d2Emp = drivers.find((d) => d.full_name === prev.driver2?.employee_name);
        d1Salary = (d1Emp && d1Emp.salary !== undefined && d1Emp.salary !== null && d1Emp.salary !== '')
          ? Number(d1Emp.salary)
          : (prev.driver1?.salary_amount === 500 ? ('' as any) : prev.driver1?.salary_amount);
        d2Salary = (d2Emp && d2Emp.salary !== undefined && d2Emp.salary !== null && d2Emp.salary !== '')
          ? Number(d2Emp.salary)
          : (prev.driver2?.salary_amount === 500 ? ('' as any) : prev.driver2?.salary_amount);
      }

      return {
        ...prev,
        vehicle_status: newStatus,
        driver1: {
          employee_name: prev.driver1?.employee_name || '',
          role: 'Driver',
          salary_amount: d1Salary,
          advance_amount: 0,
          balance_due: Number(d1Salary || 0)
        },
        driver2: {
          employee_name: prev.driver2?.employee_name || '',
          role: 'Driver',
          salary_amount: d2Salary,
          advance_amount: 0,
          balance_due: Number(d2Salary || 0)
        }
      };
    });
  };

  // Driver 1 Selection: Auto-populates registered salary (Permanent/Temporary)
  const handleDriver1Select = (empName: string) => {
    const isHold = formData.vehicle_status?.startsWith('HOLD');
    const emp = drivers.find((d) => d.full_name === empName);
    let salary: any = '';
    if (isHold) {
      salary = 500;
    } else if (emp && emp.salary !== undefined && emp.salary !== null && emp.salary !== '') {
      salary = Number(emp.salary);
    } else {
      salary = formData.driver1?.salary_amount ?? ('' as any);
    }

    setFormData((prev) => ({
      ...prev,
      driver1: {
        employee_id: emp?.id,
        employee_name: empName,
        role: 'Driver',
        salary_amount: salary,
        advance_amount: 0,
        balance_due: Number(salary || 0)
      }
    }));
  };

  // Driver 2 Selection: Auto-populates registered salary (Permanent/Temporary)
  const handleDriver2Select = (empName: string) => {
    const isHold = formData.vehicle_status?.startsWith('HOLD');
    const emp = drivers.find((d) => d.full_name === empName);
    let salary: any = '';
    if (isHold) {
      salary = 500;
    } else if (emp && emp.salary !== undefined && emp.salary !== null && emp.salary !== '') {
      salary = Number(emp.salary);
    } else {
      salary = formData.driver2?.salary_amount ?? ('' as any);
    }

    setFormData((prev) => ({
      ...prev,
      driver2: {
        employee_id: emp?.id,
        employee_name: empName,
        role: 'Driver',
        salary_amount: salary,
        advance_amount: 0,
        balance_due: Number(salary || 0)
      }
    }));
  };

  // Helper Selection (No trip salary needed)
  const handleHelperSelect = (empName: string) => {
    if (!empName) {
      setFormData((prev) => ({ ...prev, helper: undefined }));
      return;
    }
    const emp = helpers.find((h) => h.full_name === empName);

    setFormData((prev) => ({
      ...prev,
      helper: {
        employee_id: emp?.id,
        employee_name: empName,
        role: 'Helper',
        salary_amount: 0,
        advance_amount: 0,
        balance_due: 0
      }
    }));
  };

  // Captain Selection
  const handleCaptainSelect = (empName: string) => {
    if (!empName) {
      setFormData((prev) => ({ ...prev, captain: undefined }));
      return;
    }
    const emp = captains.find((c) => c.full_name === empName);

    setFormData((prev) => ({
      ...prev,
      captain: {
        employee_id: emp?.id,
        employee_name: empName,
        role: 'Captain',
        salary_amount: prev.captain?.salary_amount || 0,
        advance_amount: prev.captain?.advance_amount || 0,
        balance_due: 0,
        work_remarks: prev.captain?.work_remarks || 'Supervise route stops, passenger comfort & safety'
      }
    }));
  };

  // Financial Tally Calculation
  const tally = useMemo(() => {
    let totalSalary = 0;
    let totalAdv = 0;

    if (formData.driver1?.employee_name) {
      totalSalary += Number(formData.driver1.salary_amount || 0);
      totalAdv += Number(formData.driver1.advance_amount || 0);
    }
    if (formData.driver2?.employee_name) {
      totalSalary += Number(formData.driver2.salary_amount || 0);
      totalAdv += Number(formData.driver2.advance_amount || 0);
    }
    if (formData.helper?.employee_name) {
      totalSalary += Number(formData.helper.salary_amount || 0);
      totalAdv += Number(formData.helper.advance_amount || 0);
    }
    if (formData.captain?.employee_name) {
      totalSalary += Number(formData.captain.salary_amount || 0);
      totalAdv += Number(formData.captain.advance_amount || 0);
    }

    const totalDue = Math.max(0, totalSalary - totalAdv);
    return { totalSalary, totalAdv, totalDue };
  }, [formData]);

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_number) {
      error('Please select a vehicle number.');
      return;
    }
    if (!formData.driver1?.employee_name) {
      error('Please select Driver 1 (Lead Driver).');
      return;
    }

    if (editingTrip) {
      const updated = trips.map((t) =>
        t.id === editingTrip.id
          ? ({
              ...t,
              ...formData,
              driver2: formData.driver2?.employee_name ? formData.driver2 : undefined
            } as TripDutyItem)
          : t
      );
      setTrips(updated);
      success(`Trip duty for ${formData.vehicle_number} updated.`);
    } else {
      const newTrip: TripDutyItem = {
        id: Date.now(),
        trip_start_date: formData.trip_start_date || selectedDate,
        vehicle_number: formData.vehicle_number,
        vehicle_status: formData.vehicle_status || 'RUN',
        route_corridor: formData.route_corridor || 'Direct Corridor',
        operator_organizer: formData.operator_organizer || 'Charvik Fleet',
        driver1: formData.driver1!,
        driver2: formData.driver2?.employee_name ? formData.driver2 : undefined,
        helper: formData.helper?.employee_name ? formData.helper : undefined,
        captain: formData.captain?.employee_name ? formData.captain : undefined,
        trip_remarks: formData.trip_remarks || '',
        duty_status: formData.duty_status || 'Scheduled',
        created_at: new Date().toISOString()
      };
      setTrips([newTrip, ...trips]);
      success(`Trip duty for ${newTrip.vehicle_number} logged successfully!`);
    }
    setIsAddOpen(false);
  };

  const handleDeleteTrip = (id: number) => {
    if (!confirm('Are you sure you want to delete this trip record?')) return;
    setTrips(trips.filter((t) => t.id !== id));
    success('Trip record deleted.');
  };

  const handleToggleBusCompleted = (busNumber: string) => {
    const updated = trips.map((t) => {
      if (t.trip_start_date === selectedDate && t.vehicle_number === busNumber) {
        const nextStatus: TripDutyItem['duty_status'] =
          t.duty_status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...t, duty_status: nextStatus };
      }
      return t;
    });
    setTrips(updated);
    success(`Trip status updated for ${busNumber}`);
  };

  // Filtered assigned buses
  const filteredAssignedBuses = useMemo(() => {
    return assignedBusNumbers.filter((busNo) => {
      const bTrips = busGroupMap.get(busNo) || [];
      const matchSearch =
        busNo.toLowerCase().includes(search.toLowerCase()) ||
        bTrips.some(
          (t) =>
            t.route_corridor.toLowerCase().includes(search.toLowerCase()) ||
            t.driver1.employee_name.toLowerCase().includes(search.toLowerCase()) ||
            (t.driver2 && t.driver2.employee_name.toLowerCase().includes(search.toLowerCase())) ||
            (t.captain && t.captain.employee_name.toLowerCase().includes(search.toLowerCase()))
        );

      if (!matchSearch) return false;

      if (statusFilter === 'Active') {
        return bTrips.some((t) => t.duty_status !== 'Completed');
      }
      if (statusFilter === 'Completed') {
        return bTrips.every((t) => t.duty_status === 'Completed');
      }
      if (statusFilter === 'Hold') {
        return bTrips.some((t) => t.vehicle_status.startsWith('HOLD'));
      }
      return true;
    });
  }, [assignedBusNumbers, busGroupMap, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#142B4A]">Task Management & Multi-Staff Duty</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Trip Dispatch Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trip dispatch, multi-staff duty allocation (Driver 1, Driver 2, Helper, Captain), and fleet operation tracking.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Task & Duty</span>
        </button>
      </div>

      {/* Date Selector & Operational Fleet Overview Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-[#142B4A] to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
                Select Operational Date
              </span>
              <p className="text-sm font-black text-white">Daily Fleet Dispatch & Duty Status</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setSelectedDate(y.toISOString().split('T')[0]);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr ? 'bg-blue-600 text-white shadow-xs' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const t = new Date();
                t.setDate(t.getDate() + 1);
                setSelectedDate(t.toISOString().split('T')[0]);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/15 border border-white/25 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Fleet KPI Metrics for Selected Date */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-center sm:text-left">
          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
              Total Fleet Buses
            </span>
            <p className="text-2xl font-black text-white mt-0.5">{totalFleetCount}</p>
            <span className="text-[10px] text-blue-300">Registered Vehicles</span>
          </div>

          <div className="bg-emerald-500/20 p-3.5 rounded-xl border border-emerald-400/30">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
              Active Assigned
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{activeAssignedCount}</p>
            <span className="text-[10px] text-emerald-200">On Duty Today</span>
          </div>

          <div className="bg-amber-500/20 p-3.5 rounded-xl border border-amber-400/30">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Pending / Unassigned
            </span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{pendingBusesCount}</p>
            <span className="text-[10px] text-amber-200">Awaiting Allocation</span>
          </div>

          <div className="bg-blue-500/20 p-3.5 rounded-xl border border-blue-400/30">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
              Completed Buses
            </span>
            <p className="text-2xl font-black text-white mt-0.5">{completedBusesCount}</p>
            <span className="text-[10px] text-blue-200">Trips Finished</span>
          </div>

          <div className="bg-rose-500/20 p-3.5 rounded-xl border border-rose-400/30">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
              On Hold Buses
            </span>
            <p className="text-2xl font-black text-rose-300 mt-0.5">{holdBusesCount}</p>
            <span className="text-[10px] text-rose-200">Low Occ / Maint</span>
          </div>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'assigned'
                ? 'bg-[#142B4A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Assigned Fleet Buses ({activeAssignedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Buses ({pendingBusesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_trips')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all_trips'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Individual Trips ({dateTrips.length})</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle, driver, route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Duty</option>
            <option value="Completed">Completed</option>
            <option value="Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Main Table View (Grouped by Bus - 1 Bus shows as Active even with 3 Trips!) */}
      {activeTab === 'assigned' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">S.NO</th>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4 text-center">Trip Count Today</th>
                  <th className="py-3 px-4">Route Corridor(s)</th>
                  <th className="py-3 px-4">Vehicle Status</th>
                  <th className="py-3 px-4">Assigned Crew</th>
                  <th className="py-3 px-4">Total Payout Tally</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssignedBuses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No buses assigned for {selectedDate}.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &quot;Log New Task & Duty&quot; above or choose from Pending Buses below.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAssignedBuses.map((busNo, index) => {
                    const busTrips = busGroupMap.get(busNo) || [];
                    const tripCount = busTrips.length;
                    const primaryTrip = busTrips[0];
                    const allCompleted = busTrips.every((t) => t.duty_status === 'Completed');
                    const hasHold = busTrips.some((t) => t.vehicle_status.startsWith('HOLD'));

                    // Aggregate financials across all trips for this bus
                    let busTotalSalary = 0;
                    let busTotalAdv = 0;
                    busTrips.forEach((t) => {
                      if (t.driver1) {
                        busTotalSalary += Number(t.driver1.salary_amount || 0);
                        busTotalAdv += Number(t.driver1.advance_amount || 0);
                      }
                      if (t.driver2) {
                        busTotalSalary += Number(t.driver2.salary_amount || 0);
                        busTotalAdv += Number(t.driver2.advance_amount || 0);
                      }
                      if (t.helper) {
                        busTotalSalary += Number(t.helper.salary_amount || 0);
                        busTotalAdv += Number(t.helper.advance_amount || 0);
                      }
                    });
                    const busTotalDue = busTotalSalary - busTotalAdv;

                    return (
                      <tr key={busNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-[#142B4A] text-sm tracking-wider uppercase block">
                            {busNo}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Active in Fleet</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                              {tripCount} {tripCount === 1 ? 'Trip' : 'Trips'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBusForView(busNo);
                                setIsViewTripsOpen(true);
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline mt-1 cursor-pointer flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Trips ({tripCount})</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-[220px]">
                            {busTrips.slice(0, 2).map((t, idx) => (
                              <p key={t.id} className="text-xs font-semibold text-slate-800 truncate">
                                <span className="text-[10px] text-slate-400 font-bold mr-1">#{idx + 1}</span>
                                {t.route_corridor}
                              </p>
                            ))}
                            {tripCount > 2 && (
                              <p className="text-[10px] text-slate-400 font-bold italic">
                                +{tripCount - 2} more trips scheduled
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              hasHold
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                hasHold ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            ></span>
                            <span>{primaryTrip?.vehicle_status || 'RUN'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-semibold text-slate-800">
                              <span className="text-slate-400 font-bold">D1:</span> {primaryTrip?.driver1.employee_name}
                            </p>
                            {primaryTrip?.driver2?.employee_name && (
                              <p className="text-slate-600">
                                <span className="text-slate-400 font-bold">D2:</span> {primaryTrip.driver2.employee_name}
                              </p>
                            )}
                            {primaryTrip?.captain?.employee_name && (
                              <p className="text-indigo-700 font-bold">
                                <span className="text-indigo-400 font-bold">CPT:</span> {primaryTrip.captain.employee_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-xs">₹{busTotalSalary.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">Total Payout</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              allCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {allCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{allCompleted ? 'Completed' : 'Active Run'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedBusForView(busNo);
                                setIsViewTripsOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="View all trips for this bus"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAdd(busNo)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Add another trip for this bus"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBusCompleted(busNo)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                allCompleted
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={allCompleted ? 'Re-open Trips' : 'Mark All Completed'}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending / Unassigned Buses Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Unassigned Fleet Vehicles for {selectedDate} ({pendingBusesList.length} Buses Available)
              </h3>
              <p className="text-xs text-slate-500">
                These vehicles do not have any trips or staff duties scheduled for the selected date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {pendingBusesList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center col-span-full">
                All fleet vehicles have active trips scheduled for this date!
              </p>
            ) : (
              pendingBusesList.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-black text-slate-900 text-sm">{b.registration_number}</span>
                    <span className="text-[10px] text-amber-600 font-bold block">{b.bus_type || 'Fleet Bus'}</span>
                  </div>

                  <button
                    onClick={() => handleOpenAdd(b.registration_number)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Assign</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Individual Trips Flat Tab */}
      {activeTab === 'all_trips' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">S.NO</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Route Corridor</th>
                  <th className="py-3 px-4">Organizer</th>
                  <th className="py-3 px-4">Vehicle Status</th>
                  <th className="py-3 px-4">Driver 1</th>
                  <th className="py-3 px-4">Driver 2</th>
                  <th className="py-3 px-4">Helper</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dateTrips.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No individual trip logs on this date.
                    </td>
                  </tr>
                ) : (
                  dateTrips.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.vehicle_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.route_corridor}</td>
                      <td className="py-3 px-4 text-slate-600">{t.operator_organizer}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.vehicle_status.startsWith('HOLD')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.vehicle_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{t.driver1.employee_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-700">₹{t.driver1.salary_amount}</span>
                          {t.vehicle_status.startsWith('HOLD') && (
                            <span className="text-[9px] font-black px-1 rounded bg-amber-100 text-amber-800">
                              HOLD ₹500
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {t.driver2?.employee_name ? (
                          <div>
                            <p className="font-semibold text-slate-900">{t.driver2.employee_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-700">₹{t.driver2.salary_amount}</span>
                              {t.vehicle_status.startsWith('HOLD') && (
                                <span className="text-[9px] font-black px-1 rounded bg-amber-100 text-amber-800">
                                  HOLD ₹500
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.helper?.employee_name ? (
                          <div>
                            <p className="font-semibold text-slate-900">{t.helper.employee_name}</p>
                            <p className="text-[10px] text-slate-500">₹{t.helper.salary_amount}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.captain?.employee_name ? (
                          <p className="font-bold text-indigo-700">{t.captain.employee_name}</p>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.duty_status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.duty_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Trip"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(t.id)}
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
      )}

      {/* Log New Task / Trip Duty Modal (Matching Reference Image) */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingTrip ? 'Edit Task & Multi-Staff Duty' : 'Log New Task & Multi-Staff Duty'}
        subtitle="Assign up to 4 crew members (Driver 1, Driver 2, Helper, Captain) and fleet operation tracking."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveTrip} className="space-y-5">
          {/* Section 1: Trip Details & Operational Route */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>1. Trip Details & Operational Route</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Trip Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.trip_start_date || selectedDate}
                  onChange={(e) => setFormData({ ...formData, trip_start_date: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Number *</label>
                <select
                  required
                  value={formData.vehicle_number || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">-- Select Vehicle --</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.registration_number}>
                      {b.registration_number} {b.bus_type ? `(${b.bus_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Status *</label>
                <select
                  required
                  value={formData.vehicle_status || 'RUN'}
                  onChange={(e: any) => handleVehicleStatusChange(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="RUN">🟢 RUN</option>
                  <option value="HOLD (Low Occupancy)">🟡 HOLD (Low Occupancy)</option>
                  <option value="HOLD (Maintenance)">🔴 HOLD (Maintenance)</option>
                  <option value="HOLD (Break Down)">🟠 HOLD (Break Down)</option>
                  <option value="HOLD (Finance Side)">🟣 HOLD (Finance Side)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Route Corridor *</label>
                <select
                  required
                  value={formData.route_corridor || ''}
                  onChange={(e) => setFormData({ ...formData, route_corridor: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                >
                  <option value="">-- Choose Route Corridor --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={`${r.starting_city} → ${r.ending_city}`}>
                      {r.starting_city} → {r.ending_city} ({r.service_number})
                    </option>
                  ))}
                  <option value="Direct Express Line">Direct Express Line</option>
                  <option value="Local Depot Transfer">Local Depot Transfer</option>
                  <option value="Special Chartered Duty">Special Chartered Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operator / Organizer *</label>
                <select
                  required
                  value={formData.operator_organizer || ''}
                  onChange={(e) => setFormData({ ...formData, operator_organizer: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                >
                  <option value="">-- Choose Organizer --</option>
                  {organizers.map((o) => (
                    <option key={o.id} value={o.organization_name}>
                      {o.organization_name}
                    </option>
                  ))}
                  <option value="Charvik Internal Fleet">Charvik Internal Fleet</option>
                  <option value="Direct Passenger Service">Direct Passenger Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Crew Assignment & Separate Financial Split (Up to 4 Members) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Users className="w-4 h-4 text-blue-600" />
                <span>2. Crew Assignment & Salary Split (Up to 4 Members)</span>
              </div>
            </div>

            {/* Hold Status Auto-Rate Banner */}
            {formData.vehicle_status?.startsWith('HOLD') && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between text-amber-900 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-extrabold block">HOLD STATUS ACTIVE ({formData.vehicle_status})</span>
                    <span className="text-[11px] text-amber-800">
                      Flat hold duty pay of <strong>₹500</strong> is automatically assigned for Driver 1 and Driver 2.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-[11px] shadow-xs">
                  ₹500 Hold Allowance
                </span>
              </div>
            )}

            {/* Crew Member 1: Driver 1 (Lead Driver / Captain) */}
            <div className="p-4 rounded-2xl border-2 border-amber-300/80 bg-amber-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <span>🚗 1. Driver 1 (Lead Driver)</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Required
                  </span>
                </span>

                {formData.vehicle_status?.startsWith('HOLD') && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    ⚡ Hold Duty: ₹500
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Driver 1 Employee *</label>
                  <select
                    required
                    value={formData.driver1?.employee_name || ''}
                    onChange={(e) => handleDriver1Select(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                  >
                    <option value="">-- Select Driver 1 --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.full_name}>
                        {d.full_name} ({d.employee_code}){d.salary ? ` • ₹${Number(d.salary).toLocaleString('en-IN')}` : ''}{d.employment_type ? ` [${d.employment_type}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Salary Amount ₹ *{' '}
                    {formData.vehicle_status?.startsWith('HOLD') && (
                      <span className="text-[10px] text-amber-700 font-black">(Hold: ₹500)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    readOnly={formData.vehicle_status?.startsWith('HOLD')}
                    placeholder="Enter salary ₹"
                    value={formData.driver1?.salary_amount !== undefined && formData.driver1?.salary_amount !== null ? formData.driver1.salary_amount : ''}
                    onChange={(e) => {
                      if (formData.vehicle_status?.startsWith('HOLD')) return;
                      const val = e.target.value;
                      const sal = val === '' ? ('' as any) : Number(val);
                      setFormData({
                        ...formData,
                        driver1: {
                          ...formData.driver1!,
                          salary_amount: sal,
                          advance_amount: 0,
                          balance_due: Number(sal || 0)
                        }
                      });
                    }}
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 font-bold outline-none ${formData.vehicle_status?.startsWith('HOLD') ? 'bg-amber-100/60 text-amber-900 border-amber-300 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/50">
                {formData.vehicle_status?.startsWith('HOLD') ? (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <span>⚡</span> Bus on Hold: Driver 1 receives ₹500 flat pay
                  </span>
                ) : (
                  <div className="w-full flex items-center justify-between text-slate-500">
                    <span className="text-[10px]">
                      {drivers.find((d) => d.full_name === formData.driver1?.employee_name)?.salary ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ Auto-filled from {drivers.find((d) => d.full_name === formData.driver1?.employee_name)?.employment_type || 'registered'} salary
                        </span>
                      ) : null}
                    </span>
                    <span>
                      Driver 1 Pay:{' '}
                      <strong className="text-slate-900 font-bold">
                        ₹{Number(formData.driver1?.salary_amount || 0)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Crew Member 2: Driver 2 (Secondary / Reliever Driver) */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <span>🚗 2. Driver 2 (Secondary / Reliever Driver)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Optional
                  </span>
                </span>

                {formData.vehicle_status?.startsWith('HOLD') && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    ⚡ Hold Duty: ₹500
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Driver 2 Employee</label>
                  <select
                    value={formData.driver2?.employee_name || ''}
                    onChange={(e) => handleDriver2Select(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                  >
                    <option value="">-- None (Single Driver Duty) --</option>
                    {drivers
                      .filter((d) => d.full_name !== formData.driver1?.employee_name)
                      .map((d) => (
                        <option key={d.id} value={d.full_name}>
                          {d.full_name} ({d.employee_code}){d.salary ? ` • ₹${Number(d.salary).toLocaleString('en-IN')}` : ''}{d.employment_type ? ` [${d.employment_type}]` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Salary Amount ₹{' '}
                    {formData.vehicle_status?.startsWith('HOLD') && (
                      <span className="text-[10px] text-amber-700 font-black">(Hold: ₹500)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    readOnly={formData.vehicle_status?.startsWith('HOLD')}
                    placeholder="Enter salary ₹"
                    value={formData.driver2?.salary_amount !== undefined && formData.driver2?.salary_amount !== null ? formData.driver2.salary_amount : ''}
                    onChange={(e) => {
                      if (formData.vehicle_status?.startsWith('HOLD')) return;
                      const val = e.target.value;
                      const sal = val === '' ? ('' as any) : Number(val);
                      setFormData({
                        ...formData,
                        driver2: {
                          employee_name: formData.driver2?.employee_name || '',
                          role: 'Driver',
                          salary_amount: sal,
                          advance_amount: 0,
                          balance_due: Number(sal || 0)
                        }
                      });
                    }}
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 font-bold outline-none ${formData.vehicle_status?.startsWith('HOLD') ? 'bg-amber-100/60 text-amber-900 border-amber-300 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/50">
                {formData.vehicle_status?.startsWith('HOLD') ? (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <span>⚡</span> Bus on Hold: Driver 2 receives ₹500 flat pay
                  </span>
                ) : (
                  <div className="w-full flex items-center justify-between text-slate-500">
                    <span className="text-[10px]">
                      {drivers.find((d) => d.full_name === formData.driver2?.employee_name)?.salary ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ Auto-filled from {drivers.find((d) => d.full_name === formData.driver2?.employee_name)?.employment_type || 'registered'} salary
                        </span>
                      ) : null}
                    </span>
                    <span>
                      Driver 2 Pay:{' '}
                      <strong className="text-slate-900 font-bold">
                        ₹{Number(formData.driver2?.salary_amount || 0)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Crew Member 3: Helper (Loading Assistant / Cleaner) */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <span>🛠️ 3. Helper (Loading Assistant / Cleaner)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Optional
                  </span>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Helper Employee</label>
                <select
                  value={formData.helper?.employee_name || ''}
                  onChange={(e) => handleHelperSelect(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                >
                  <option value="">-- None (No Helper Required) --</option>
                  {helpers.map((h) => (
                    <option key={h.id} value={h.full_name}>
                      {h.full_name} ({h.employee_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Crew Member 4: Captain (Route Supervisor / Duty Captain) */}
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <span>⚓ 4. Captain (Route Supervisor / Duty Captain)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    Optional
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Captain Employee</label>
                  <select
                    value={formData.captain?.employee_name || ''}
                    onChange={(e) => handleCaptainSelect(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                  >
                    <option value="">-- None (No Captain Assigned) --</option>
                    {captains.map((c) => (
                      <option key={c.id} value={c.full_name}>
                        {c.full_name} ({c.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                {formData.captain?.employee_name && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Assigned Work & Duty Instructions
                    </label>
                    <input
                      type="text"
                      value={formData.captain?.work_remarks || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          captain: {
                            ...formData.captain!,
                            work_remarks: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. Passenger onboarding check, luggage tagging, AC regulation"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Trip Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Trip Remarks (Admin Notes / Experience / Performance)
            </label>
            <textarea
              rows={2}
              value={formData.trip_remarks || ''}
              onChange={(e) => setFormData({ ...formData, trip_remarks: e.target.value })}
              placeholder="e.g. Completed route on time, disciplined behavior, good vehicle maintenance..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              These remarks will be permanently preserved in all assigned crew members&apos; dossiers.
            </p>
          </div>

          {/* Bottom Tally Bar & Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="uppercase tracking-wider text-slate-400 text-[10px]">TOTAL CREW PAYOUT:</span>
              <span className="font-black text-slate-900 text-sm">₹{tally.totalSalary}</span>
            </div>

            <div className="flex items-center gap-2">
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
                {editingTrip ? 'Update Task Record' : 'Save Task Record'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Trips Modal for a Bus */}
      {selectedBusForView && (
        <Modal
          isOpen={isViewTripsOpen}
          onClose={() => setIsViewTripsOpen(false)}
          title={`All Trips for ${selectedBusForView} (${selectedDate})`}
          subtitle={`${busGroupMap.get(selectedBusForView)?.length || 0} Trip(s) Allocated on this date`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vehicle: <strong className="text-blue-900 font-mono text-sm">{selectedBusForView}</strong>
              </span>

              <button
                onClick={() => {
                  setIsViewTripsOpen(false);
                  handleOpenAdd(selectedBusForView);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A] text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Trip</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(busGroupMap.get(selectedBusForView) || []).map((t, idx) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{t.route_corridor}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.vehicle_status.startsWith('HOLD')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.vehicle_status}
                      </span>
                      <button
                        onClick={() => {
                          setIsViewTripsOpen(false);
                          handleOpenEdit(t);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Edit Trip"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(t.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-600 cursor-pointer"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Organizer: <strong className="text-slate-800">{t.operator_organizer}</strong> • Date:{' '}
                    <strong className="text-slate-800">{t.trip_start_date}</strong>
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Driver 1</span>
                      <p className="font-bold text-slate-900 truncate">{t.driver1.employee_name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[10px] text-slate-500">
                          ₹{t.driver1.salary_amount}
                        </p>
                        {t.vehicle_status.startsWith('HOLD') && (
                          <span className="text-[8px] font-black px-1 rounded bg-amber-100 text-amber-800">
                            HOLD ₹500
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Driver 2</span>
                      <p className="font-bold text-slate-900 truncate">{t.driver2?.employee_name || 'None'}</p>
                      {t.driver2?.employee_name && (
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-slate-500">
                            ₹{t.driver2.salary_amount}
                          </p>
                          {t.vehicle_status.startsWith('HOLD') && (
                            <span className="text-[8px] font-black px-1 rounded bg-amber-100 text-amber-800">
                              HOLD ₹500
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Helper</span>
                      <p className="font-bold text-slate-900 truncate">{t.helper?.employee_name || 'None'}</p>
                      {t.helper?.employee_name && (
                        <p className="text-[10px] text-slate-500">₹{t.helper.salary_amount}</p>
                      )}
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Captain</span>
                      <p className="font-bold text-indigo-700 truncate">{t.captain?.employee_name || 'None'}</p>
                      {t.captain?.work_remarks && (
                        <p className="text-[9px] text-slate-500 truncate">{t.captain.work_remarks}</p>
                      )}
                    </div>
                  </div>

                  {t.trip_remarks && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                      Remarks: {t.trip_remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
