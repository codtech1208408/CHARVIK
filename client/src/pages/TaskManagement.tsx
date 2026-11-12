import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  X,
  FileSpreadsheet,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { PrintButton } from '../components/common/PrintButton';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BASE_FLEET_TASKS, BASE_FLEET_ORGANIZERS, BASE_FLEET_ROUTES } from '../services/seedData';

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
  vehicle_type?: string; // Seater | Sleeper/Seating | Full Sleeper
  service_number?: string; // service / route number
  vehicle_status: 'RUN' | 'HOLD (Low Occupancy)' | 'HOLD (Maintenance)' | 'HOLD (Break Down)' | 'HOLD (Finance Side)';
  route_corridor: string;
  operator_organizer: string;
  trip_amount?: number;
  operator_commission?: number;
  driver1: CrewFinancial;
  driver2?: CrewFinancial;
  helper?: CrewFinancial;
  captain?: CrewFinancial;
  trip_remarks: string;
  duty_status: 'Scheduled' | 'In Progress' | 'Completed';
  payment_status?: 'Pending' | 'Paid';
  created_at: string;
}

export const mapBusTypeToVehicleType = (type?: string): string => {
  if (!type) return '';
  const lower = type.toLowerCase().trim();
  if (lower.includes('full sleeper')) return 'Full Sleeper';
  if (lower.includes('sleeper') && (lower.includes('seat') || lower.includes('seating'))) return 'Sleeper/Seating';
  if (lower.includes('seater') || lower.includes('seating')) return 'Seater';
  if (lower.includes('sleeper')) return 'Full Sleeper';
  return type;
};

export const getTripMonthKey = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}/.test(clean)) return clean.slice(0, 7);
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const parts = clean.split('-');
    return `${parts[2]}-${parts[1]}`;
  }
  return '';
};

export const normalizeToISODate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('-');
    return `${y}-${m}-${d}`;
  }
  return clean;
};

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}-${m}-${y}`;
  }
  return clean;
};

const STORAGE_KEY = 'charvik_trip_duty_management_v2';

export const TaskManagement: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const { user } = useAuth();
  const location = useLocation();
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin');
  const isOperator =
    location.pathname.startsWith('/operator') ||
    location.pathname.startsWith('/supporter') ||
    (!isAdmin && (
      userRole.includes('operator') ||
      userRole.includes('support') ||
      userRole.includes('manager')
    ));

  const [operatorViewMode, setOperatorViewMode] = useState<boolean>(isOperator);

  useEffect(() => {
    if (isOperator) {
      setOperatorViewMode(true);
    }
  }, [isOperator]);

  // Admin Financial Amount Control Settings
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getSettings().then(setSystemSettings).catch(() => { });
  }, []);

  const isFixedAmountMode = (systemSettings.amount_control_mode || 'company_defined') === 'fixed';
  const isAmountsLocked = systemSettings.lock_amounts_for_staff !== 'false' && !isAdmin;
  const defaultFixedDriverPay = Number(systemSettings.fixed_driver_salary || 1000);
  const defaultFixedHelperPay = Number(systemSettings.fixed_helper_salary || 600);
  const defaultFixedHoldPay = Number(systemSettings.fixed_hold_salary || 500);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(() => dateParam || todayStr);

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  const [buses, setBuses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [staffCategoryFilter, setStaffCategoryFilter] = useState('All Staff Categories');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All Payment Statuses');
  const [routeOriginFilter, setRouteOriginFilter] = useState('All Route Origins');
  const [destinationFilter, setDestinationFilter] = useState('All Destinations');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return BASE_FLEET_TASKS;
    } catch { }
    return BASE_FLEET_TASKS;
  });

  // Form State
  const [formData, setFormData] = useState<Partial<TripDutyItem>>({
    trip_start_date: todayStr,
    vehicle_number: '',
    vehicle_type: '',
    service_number: '',
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
    } catch { }
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
      } catch { }

      // Sync tasks from API
      try {
        const remoteTasks = await api.getTasks().catch(() => []);
        if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
          setTrips(remoteTasks);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteTasks));
        }
      } catch { }

      // Load routes & organizers with seed fallbacks
      try {
        const [rData, oData] = await Promise.all([
          api.getRoutes().catch(() => BASE_FLEET_ROUTES),
          api.getOrganizers().catch(() => BASE_FLEET_ORGANIZERS)
        ]);
        setRoutes(Array.isArray(rData) && rData.length > 0 ? rData : BASE_FLEET_ROUTES);
        setOrganizers(Array.isArray(oData) && oData.length > 0 ? oData : BASE_FLEET_ORGANIZERS);
      } catch {
        setRoutes(BASE_FLEET_ROUTES);
        setOrganizers(BASE_FLEET_ORGANIZERS);
      }
    }
    loadAux();
  }, []);

  const drivers = useMemo(() => employees.filter((e) => e.role === 'Driver'), [employees]);
  const helpers = useMemo(() => employees.filter((e) => e.role === 'Helper'), [employees]);
  const captains = useMemo(() => employees.filter((e) => e.role === 'Captain'), [employees]);

  const busSearchOptions: SearchOption[] = useMemo(() => {
    return buses.map((b) => ({
      value: b.registration_number,
      label: b.registration_number
    }));
  }, [buses]);

  const routeSearchOptions: SearchOption[] = useMemo(() => {
    return routes.map((r: any) => ({
      value: `${r.starting_city} → ${r.ending_city}`,
      label: `${r.starting_city} → ${r.ending_city}`,
      badge: r.service_number || undefined
    }));
  }, [routes]);

  const uniqueOrigins = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r: any) => {
      if (r.starting_city) set.add(r.starting_city.trim());
    });
    trips.forEach((t) => {
      if (t.route_corridor) {
        const parts = t.route_corridor.split(/→|->/);
        if (parts[0]) set.add(parts[0].trim());
      }
    });
    return Array.from(set).sort();
  }, [routes, trips]);

  const uniqueDestinations = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r: any) => {
      if (r.ending_city) set.add(r.ending_city.trim());
    });
    trips.forEach((t) => {
      if (t.route_corridor) {
        const parts = t.route_corridor.split(/→|->/);
        if (parts[1]) set.add(parts[1].trim());
      }
    });
    return Array.from(set).sort();
  }, [routes, trips]);

  // Current active month key: e.g. "2026-11"
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  // Whether user has searched by custom date range
  const isDateRangeActive = Boolean(fromDateFilter || toDateFilter);

  // Active pool of trips:
  // - If From Date or To Date is searched in the filter toolbar: strictly filters by that date range
  // - Otherwise (default): automatically shows fresh data for the CURRENT MONTH only;
  //   completed months are hidden until searched by From & To dates.
  const activePoolTrips = useMemo(() => {
    if (isDateRangeActive) {
      const normFrom = normalizeToISODate(fromDateFilter);
      const normTo = normalizeToISODate(toDateFilter);
      return trips.filter((t) => {
        const norm = normalizeToISODate(t.trip_start_date);
        if (!norm) return false;
        if (normFrom && norm < normFrom) return false;
        if (normTo && norm > normTo) return false;
        return true;
      });
    }

    // Default: current active month data only (completed month data is hidden until searched by from/to dates)
    return trips.filter((t) => {
      return getTripMonthKey(t.trip_start_date) === currentMonthKey;
    });
  }, [trips, isDateRangeActive, fromDateFilter, toDateFilter, currentMonthKey]);

  // Backward compatibility alias for any existing reference
  const dateTrips = activePoolTrips;

  // Group trips by vehicle number in active pool (current month or searched range)
  const busGroupMap = useMemo(() => {
    const map = new Map<string, TripDutyItem[]>();
    activePoolTrips.forEach((t) => {
      const reg = t.vehicle_number;
      if (!map.has(reg)) map.set(reg, []);
      map.get(reg)!.push(t);
    });
    return map;
  }, [activePoolTrips]);

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
    const defaultBusObj = buses.find((b) => b.registration_number === defaultBus);
    const defaultVehicleType = mapBusTypeToVehicleType(defaultBusObj?.bus_type);
    const defaultRouteObj = routes[0];
    const defaultRoute = defaultRouteObj ? `${defaultRouteObj.starting_city} → ${defaultRouteObj.ending_city}` : '';
    const defaultOrg = organizers[0]?.organization_name || '';

    setFormData({
      trip_start_date: selectedDate,
      vehicle_number: defaultBus,
      vehicle_type: defaultVehicleType || 'Full Sleeper',
      service_number: defaultRouteObj?.service_number || '',
      vehicle_status: 'RUN',
      route_corridor: defaultRoute,
      operator_organizer: defaultOrg,
      trip_amount: defaultRouteObj?.trip_amount,
      operator_commission: defaultRouteObj?.operator_commission,
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
    const matchedBus = buses.find((b) => b.registration_number === trip.vehicle_number);
    setFormData({
      ...trip,
      vehicle_type: trip.vehicle_type || mapBusTypeToVehicleType(matchedBus?.bus_type) || 'Full Sleeper',
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
        d1Salary = defaultFixedHoldPay;
        d2Salary = defaultFixedHoldPay;
      } else if (isFixedAmountMode) {
        d1Salary = defaultFixedDriverPay;
        d2Salary = defaultFixedDriverPay;
      } else {
        const d1Emp = drivers.find((d) => d.full_name === prev.driver1?.employee_name);
        const d2Emp = drivers.find((d) => d.full_name === prev.driver2?.employee_name);
        d1Salary = (d1Emp && d1Emp.salary !== undefined && d1Emp.salary !== null && d1Emp.salary !== '')
          ? Number(d1Emp.salary)
          : (prev.driver1?.salary_amount === defaultFixedHoldPay ? ('' as any) : prev.driver1?.salary_amount);
        d2Salary = (d2Emp && d2Emp.salary !== undefined && d2Emp.salary !== null && d2Emp.salary !== '')
          ? Number(d2Emp.salary)
          : (prev.driver2?.salary_amount === defaultFixedHoldPay ? ('' as any) : prev.driver2?.salary_amount);
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

  // Driver 1 Selection: Auto-populates registered salary (Permanent/Temporary) or Fixed Amount
  const handleDriver1Select = (empName: string) => {
    const isHold = formData.vehicle_status?.startsWith('HOLD');
    const emp = drivers.find((d) => d.full_name === empName);
    let salary: any = '';
    if (isHold) {
      salary = defaultFixedHoldPay;
    } else if (isFixedAmountMode) {
      salary = defaultFixedDriverPay;
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

  // Driver 2 Selection: Auto-populates registered salary (Permanent/Temporary) or Fixed Amount
  const handleDriver2Select = (empName: string) => {
    if (!empName) {
      setFormData((prev) => ({ ...prev, driver2: undefined }));
      return;
    }
    const isHold = formData.vehicle_status?.startsWith('HOLD');
    const emp = drivers.find((d) => d.full_name === empName);
    let salary: any = '';
    if (isHold) {
      salary = defaultFixedHoldPay;
    } else if (isFixedAmountMode) {
      salary = defaultFixedDriverPay;
    } else if (emp && emp.salary !== undefined && emp.salary !== null && emp.salary !== '') {
      salary = Number(emp.salary);
    } else if (empName === formData.driver1?.employee_name && formData.driver1?.salary_amount) {
      salary = formData.driver1.salary_amount;
    } else {
      salary = formData.driver2?.salary_amount ?? ('' as any);
    }

    setFormData((prev) => ({
      ...prev,
      driver2: {
        employee_id: emp?.id || (empName === formData.driver1?.employee_name ? formData.driver1?.employee_id : undefined),
        employee_name: empName,
        role: 'Driver',
        salary_amount: salary,
        advance_amount: 0,
        balance_due: Number(salary || 0)
      }
    }));
  };

  // Helper Selection (supports helper salary amount)
  const handleHelperSelect = (empName: string) => {
    if (!empName) {
      setFormData((prev) => ({ ...prev, helper: undefined }));
      return;
    }
    const emp = helpers.find((h) => h.full_name === empName);
    let sal: any = '';
    if (isFixedAmountMode) {
      sal = defaultFixedHelperPay;
    } else if (emp && emp.salary !== undefined && emp.salary !== null && emp.salary !== '') {
      sal = Number(emp.salary);
    } else {
      sal = formData.helper?.salary_amount || ('' as any);
    }

    setFormData((prev) => ({
      ...prev,
      helper: {
        employee_id: emp?.id,
        employee_name: empName,
        role: 'Helper',
        salary_amount: sal,
        advance_amount: 0,
        balance_due: Number(sal || 0)
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
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');

    if (!formData.vehicle_number) {
      if (!isUserAdmin) {
        error('Please select a vehicle number.');
        return;
      }
      formData.vehicle_number = buses[0]?.registration_number || 'AP16TV1234';
    }
    if (!formData.driver1?.employee_name) {
      if (!isUserAdmin) {
        error('Please select Driver 1 (Lead Driver).');
        return;
      }
      formData.driver1 = { employee_name: 'Lead Driver', phone_number: '9999999999' };
    }

    if (editingTrip) {
      const updatedItem: TripDutyItem = {
        ...editingTrip,
        ...formData,
        vehicle_type: formData.vehicle_type || editingTrip.vehicle_type || '',
        trip_amount: formData.trip_amount !== undefined && formData.trip_amount !== ('' as any) ? Number(formData.trip_amount) : undefined,
        operator_commission: formData.operator_commission !== undefined && formData.operator_commission !== ('' as any) ? Number(formData.operator_commission) : undefined,
        driver2: formData.driver2?.employee_name ? formData.driver2 : undefined
      } as TripDutyItem;
      const updated = trips.map((t) => (t.id === editingTrip.id ? updatedItem : t));
      setTrips(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
      api.updateTask(editingTrip.id, updatedItem).catch(() => { });
      success(`Trip duty for ${formData.vehicle_number} updated.`);
    } else {
      const newTrip: TripDutyItem = {
        id: Date.now(),
        trip_start_date: formData.trip_start_date || selectedDate,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type || '',
        service_number: formData.service_number || '',
        vehicle_status: formData.vehicle_status || 'RUN',
        route_corridor: formData.route_corridor || 'Direct Corridor',
        operator_organizer: formData.operator_organizer || 'Charvik Fleet',
        trip_amount: formData.trip_amount !== undefined && formData.trip_amount !== ('' as any) ? Number(formData.trip_amount) : undefined,
        operator_commission: formData.operator_commission !== undefined && formData.operator_commission !== ('' as any) ? Number(formData.operator_commission) : undefined,
        driver1: formData.driver1!,
        driver2: formData.driver2?.employee_name ? formData.driver2 : undefined,
        helper: formData.helper?.employee_name ? formData.helper : undefined,
        captain: formData.captain?.employee_name ? formData.captain : undefined,
        trip_remarks: formData.trip_remarks || '',
        duty_status: formData.duty_status || 'Scheduled',
        created_at: new Date().toISOString()
      };
      const updated = [newTrip, ...trips];
      setTrips(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
      api.createTask(newTrip).then((saved) => {
        if (saved && saved.id) {
          setTrips((prev) => prev.map((t) => (t.id === newTrip.id ? { ...t, ...saved } : t)));
        }
      }).catch((err) => console.error('Failed to sync task:', err));
      success(`Trip duty for ${newTrip.vehicle_number} logged successfully!`);
    }
    setIsAddOpen(false);
  };

  const handleDeleteTrip = (id: number) => {
    if (!confirm('Are you sure you want to delete this trip record?')) return;
    const filtered = trips.filter((t) => t.id !== id);
    setTrips(filtered);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered)); } catch { }
    api.deleteTask(id).catch((err) => console.error('Failed to delete task:', err));
    success('Trip record deleted.');
  };

  const handleToggleTripCompleted = (trip: TripDutyItem) => {
    const nextStatus: TripDutyItem['duty_status'] =
      trip.duty_status === 'Completed' ? 'Scheduled' : 'Completed';
    const updatedItem = { ...trip, duty_status: nextStatus };
    const updated = trips.map((t) => (t.id === trip.id ? updatedItem : t));
    setTrips(updated);
    api.updateTask(trip.id, updatedItem).catch(() => { });
    success(`Trip ${trip.vehicle_number} marked as ${nextStatus}.`);
  };

  const handleToggleTripPaid = (trip: TripDutyItem) => {
    const nextPaid: 'Pending' | 'Paid' = trip.payment_status === 'Paid' ? 'Pending' : 'Paid';
    const updatedItem = { ...trip, payment_status: nextPaid };
    const updated = trips.map((t) => (t.id === trip.id ? updatedItem : t));
    setTrips(updated);
    api.updateTask(trip.id, updatedItem).catch(() => { });
    success(`Payment for ${trip.vehicle_number} marked as ${nextPaid}.`);
  };

  const handleToggleBusCompleted = (busNumber: string) => {
    const updated = trips.map((t) => {
      if (t.trip_start_date === selectedDate && t.vehicle_number === busNumber) {
        const nextStatus: TripDutyItem['duty_status'] =
          t.duty_status === 'Completed' ? 'In Progress' : 'Completed';
        const updatedItem = { ...t, duty_status: nextStatus };
        api.updateTask(t.id, updatedItem).catch(() => { });
        return updatedItem;
      }
      return t;
    });
    setTrips(updated);
    success(`Trip status updated for ${busNumber}`);
  };

  // Filtered trips considering vehicle search, staff category, payment status, origin and destination
  const filteredDateTrips = useMemo(() => {
    return activePoolTrips.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.vehicle_number.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.service_number && t.service_number.toLowerCase().includes(q)) ||
        t.route_corridor.toLowerCase().includes(q) ||
        (t.operator_organizer && t.operator_organizer.toLowerCase().includes(q)) ||
        t.driver1.employee_name.toLowerCase().includes(q) ||
        (t.driver2?.employee_name && t.driver2.employee_name.toLowerCase().includes(q)) ||
        (t.helper?.employee_name && t.helper.employee_name.toLowerCase().includes(q)) ||
        (t.captain?.employee_name && t.captain.employee_name.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Staff Category filter
      if (staffCategoryFilter !== 'All Staff Categories') {
        if (staffCategoryFilter === 'Driver' && !t.driver1?.employee_name && !t.driver2?.employee_name) return false;
        if (staffCategoryFilter === 'Helper' && !t.helper?.employee_name) return false;
        if (staffCategoryFilter === 'Captain' && !t.captain?.employee_name) return false;
      }

      // Payment Status filter
      if (paymentStatusFilter !== 'All Payment Statuses') {
        if ((t.payment_status || 'Pending') !== paymentStatusFilter) return false;
      }

      // Route Origin filter
      if (routeOriginFilter !== 'All Route Origins') {
        if (!t.route_corridor.toLowerCase().includes(routeOriginFilter.toLowerCase())) return false;
      }

      // Destination filter
      if (destinationFilter !== 'All Destinations') {
        if (!t.route_corridor.toLowerCase().includes(destinationFilter.toLowerCase())) return false;
      }

      // Duty status filter
      if (statusFilter === 'Active' && t.duty_status === 'Completed') return false;
      if (statusFilter === 'Completed' && t.duty_status !== 'Completed') return false;
      if (statusFilter === 'Hold' && !t.vehicle_status.startsWith('HOLD')) return false;

      return true;
    });
  }, [
    activePoolTrips,
    search,
    staffCategoryFilter,
    paymentStatusFilter,
    routeOriginFilter,
    destinationFilter,
    statusFilter
  ]);

  // Filtered assigned buses
  const filteredAssignedBuses = useMemo(() => {
    return assignedBusNumbers.filter((busNo) => {
      const bTrips = busGroupMap.get(busNo) || [];
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        busNo.toLowerCase().includes(q) ||
        bTrips.some(
          (t) =>
            t.route_corridor.toLowerCase().includes(q) ||
            t.driver1.employee_name.toLowerCase().includes(q) ||
            (t.driver2 && t.driver2.employee_name.toLowerCase().includes(q)) ||
            (t.captain && t.captain.employee_name.toLowerCase().includes(q))
        );

      if (!matchSearch) return false;

      // Staff category filter on bus
      if (staffCategoryFilter !== 'All Staff Categories') {
        const matchesStaff = bTrips.some((t) => {
          if (staffCategoryFilter === 'Driver') return t.driver1?.employee_name || t.driver2?.employee_name;
          if (staffCategoryFilter === 'Helper') return t.helper?.employee_name;
          if (staffCategoryFilter === 'Captain') return t.captain?.employee_name;
          return true;
        });
        if (!matchesStaff) return false;
      }

      // Payment status filter
      if (paymentStatusFilter !== 'All Payment Statuses') {
        const matchesPay = bTrips.some((t) => (t.payment_status || 'Pending') === paymentStatusFilter);
        if (!matchesPay) return false;
      }

      // Origin filter
      if (routeOriginFilter !== 'All Route Origins') {
        const matchesOrg = bTrips.some((t) => t.route_corridor.toLowerCase().includes(routeOriginFilter.toLowerCase()));
        if (!matchesOrg) return false;
      }

      // Destination filter
      if (destinationFilter !== 'All Destinations') {
        const matchesDst = bTrips.some((t) => t.route_corridor.toLowerCase().includes(destinationFilter.toLowerCase()));
        if (!matchesDst) return false;
      }

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
  }, [
    assignedBusNumbers,
    busGroupMap,
    search,
    staffCategoryFilter,
    paymentStatusFilter,
    routeOriginFilter,
    destinationFilter,
    statusFilter
  ]);

  // Export Tasks to Excel / CSV with vehicle-specific filtering and summary count
  const handleExportTasksExcel = () => {
    try {
      const isFilteredByVeh = !!search.trim();
      const vehLabel = isFilteredByVeh ? search.trim().toUpperCase() : 'All Vehicles';

      const csvLines: string[] = [];
      csvLines.push(`"CHARVIK STAFFING CONSULTANCY - TASK MANAGEMENT FLEET DUTY REPORT"`);
      csvLines.push(`"Vehicle / Search Filter","${vehLabel}"`);
      csvLines.push(`"Staff Category","${staffCategoryFilter}"`);
      csvLines.push(`"Payment Status","${paymentStatusFilter}"`);
      csvLines.push(`"Origin / Destination","${routeOriginFilter} -> ${destinationFilter}"`);
      csvLines.push(`"Date Range","${fromDateFilter || selectedDate} to ${toDateFilter || selectedDate}"`);
      csvLines.push(`"Total Matching Tasks Found","${filteredDateTrips.length}"`);
      csvLines.push(`"Exported At","${new Date().toLocaleString()}"`);
      csvLines.push('');

      const headers = [
        'S.No',
        'Trip Start Date',
        'Vehicle Number',
        'Service Number',
        'Route Corridor',
        'Vehicle Status',
        'Operator',
        'Driver 1',
        'Driver 2',
        'Helper',
        'Captain',
        'Duty Status',
        'Payment Status',
        'Trip Amount (Rs)',
        'Operator Commission (Rs)',
        'Trip Remarks'
      ];
      csvLines.push(headers.map((h) => `"${h}"`).join(','));

      filteredDateTrips.forEach((t, idx) => {
        const row = [
          idx + 1,
          t.trip_start_date,
          t.vehicle_number,
          t.service_number || '',
          t.route_corridor,
          t.vehicle_status,
          t.operator_organizer || '',
          t.driver1?.employee_name || '',
          t.driver2?.employee_name || '',
          t.helper?.employee_name || '',
          t.captain?.employee_name || '',
          t.duty_status || '',
          t.payment_status || 'Pending',
          t.trip_amount || '',
          t.operator_commission || '',
          t.trip_remarks || ''
        ];
        csvLines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeVeh = isFilteredByVeh ? search.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'All';
      link.setAttribute('href', url);
      link.setAttribute('download', `Tasks_Duties_${safeVeh}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success(`Exported ${filteredDateTrips.length} task record(s) for ${vehLabel} to Excel!`);
    } catch {
      error('Failed to export Excel report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action with Bus Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Task Management & Multi-Staff Duty
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Trip Dispatch Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Trip dispatch, multi-staff duty allocation (Driver 1, Driver 2, Helper, Captain), and fleet operation tracking.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Banner Photo & Button */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet5.jpg"
                alt="Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Dispatch Coach</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-blue-800" />
            <span>+ Log New Task & Duty</span>
          </button>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Fleet KPI Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-[#0D6EFD] via-[#0B5ED7] to-[#0047AB] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block">
            Total Fleet Buses
          </span>
          <p className="text-3xl font-black text-white mt-1">{totalFleetCount}</p>
          <span className="text-[10px] text-blue-200 font-medium">Registered Vehicles</span>
        </div>

        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
            Active Assigned
          </span>
          <p className="text-3xl font-black text-white mt-1">{activeAssignedCount}</p>
          <span className="text-[10px] text-emerald-200 font-medium">On Duty Today</span>
        </div>

        <div className="bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">
            Pending / Unassigned
          </span>
          <p className="text-3xl font-black text-white mt-1">{pendingBusesCount}</p>
          <span className="text-[10px] text-amber-200 font-medium">Awaiting Allocation</span>
        </div>

        <div className="bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-purple-100 uppercase tracking-wider block">
            Completed Buses
          </span>
          <p className="text-3xl font-black text-white mt-1">{completedBusesCount}</p>
          <span className="text-[10px] text-purple-200 font-medium">Trips Finished</span>
        </div>

        <div className="bg-gradient-to-br from-[#EC4899] via-[#E11D48] to-[#BE123C] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider block">
            On Hold Buses
          </span>
          <p className="text-3xl font-black text-white mt-1">{holdBusesCount}</p>
          <span className="text-[10px] text-rose-200 font-medium">Low Occ / Maint</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'assigned'
              ? 'bg-[#142B4A] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Assigned Fleet Duties ({filteredDateTrips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'pending'
              ? 'bg-[#142B4A] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Buses ({pendingBusesCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportTasksExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-700 hover:text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
            title="Download Excel containing filtered vehicle / duty data"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <PrintButton
            title={
              activeTab === 'assigned'
                ? `Assigned Fleet Duties (${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel})`
                : activeTab === 'pending'
                  ? `Pending Unassigned Fleet Buses (${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel})`
                  : `All Individual Trip Logs (${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel})`
            }
            subtitle={`Period: ${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel} • Status: ${statusFilter}`}
            targetId={
              activeTab === 'assigned'
                ? 'assigned-duties-table-wrap'
                : activeTab === 'pending'
                  ? 'pending-buses-table-wrap'
                  : 'all-trips-table-wrap'
            }
          />
        </div>
      </div>

      {/* Comprehensive Filter Toolbar (Exact Match to User Screenshot) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-2">
        {/* 1. Search task #, vehicle... (amber-focused border matching screenshot) */}
        <div className="relative min-w-[170px] sm:min-w-[190px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task #, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-xs rounded-xl border border-amber-400 focus:ring-1 focus:ring-amber-500 bg-white font-medium outline-none text-slate-800"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. All Staff Categories */}
        <select
          value={staffCategoryFilter}
          onChange={(e) => setStaffCategoryFilter(e.target.value)}
          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="All Staff Categories">All Staff Categories</option>
          <option value="Driver">Driver Assigned</option>
          <option value="Helper">Helper Assigned</option>
          <option value="Captain">Captain Assigned</option>
        </select>

        {/* 3. All Payment Statuses */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="All Payment Statuses">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
        </select>

        {/* 4. All Route Origins */}
        <select
          value={routeOriginFilter}
          onChange={(e) => setRouteOriginFilter(e.target.value)}
          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer max-w-[150px] truncate"
        >
          <option value="All Route Origins">All Route Origins</option>
          {uniqueOrigins.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>

        {/* 5. All Destinations */}
        <select
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer max-w-[150px] truncate"
        >
          <option value="All Destinations">All Destinations</option>
          {uniqueDestinations.map((dst) => (
            <option key={dst} value={dst}>
              {dst}
            </option>
          ))}
        </select>

        {/* 6. From Date (dd-mm-yyyy) */}
        <div className="flex items-center gap-1.5 text-xs border border-slate-200 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 font-medium">
          <span className="text-slate-500 font-bold">From:</span>
          <input
            type="date"
            value={fromDateFilter}
            onChange={(e) => setFromDateFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          />
        </div>

        {/* 7. To Date (dd-mm-yyyy) */}
        <div className="flex items-center gap-1.5 text-xs border border-slate-200 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 font-medium">
          <span className="text-slate-500 font-bold">To:</span>
          <input
            type="date"
            value={toDateFilter}
            onChange={(e) => setToDateFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          />
        </div>

        {/* Clear Filters Button */}
        {(search || staffCategoryFilter !== 'All Staff Categories' || paymentStatusFilter !== 'All Payment Statuses' || routeOriginFilter !== 'All Route Origins' || destinationFilter !== 'All Destinations' || fromDateFilter || toDateFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStaffCategoryFilter('All Staff Categories');
              setPaymentStatusFilter('All Payment Statuses');
              setRouteOriginFilter('All Route Origins');
              setDestinationFilter('All Destinations');
              setFromDateFilter('');
              setToDateFilter('');
            }}
            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Helper Notification when vehicle search is active in Task Management */}
      {search.trim() && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>
            Filtering exclusively for: <strong>{search.toUpperCase()}</strong>. Found{' '}
            <strong>{filteredDateTrips.length} task duty record(s)</strong>.
          </span>
          <button
            onClick={handleExportTasksExcel}
            className="text-xs font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer"
          >
            Download {search.toUpperCase()} Excel ({filteredDateTrips.length} records) →
          </button>
        </div>
      )}

      {/* Main Table View (For Operator: Matches Image 1; For Admin: Image 2 with toggle) */}
      {activeTab === 'assigned' && (
        <div id="assigned-duties-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Admin toggle: allows Admin to preview Operator view or view full admin financial breakdown */}
          {isAdmin && !isOperator && (
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Display Table Format:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setOperatorViewMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!operatorViewMode ? 'bg-[#142B4A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Admin Financial Breakdown (Image 2)
                </button>
                <button
                  type="button"
                  onClick={() => setOperatorViewMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${operatorViewMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Operator Standard Duty Sheet (Image 1)
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {(isOperator || operatorViewMode) ? (
              /* =========================================================================
                 OPERATOR VIEW: EXACT MATCH FOR IMAGE 1
                 Headers: DATE | SERVICE ID | ROUTE | VEHICLE NO | STATUS | EMP ID | DRIVER NAME 1 | AMOUNT | EMP ID | DRIVER NAME2 | AMOUNT | EMP ID 3 | HELPER | AMOUNT | EMP ID 4 | CAPTAIN | AMOUNT | ACTIONS
                 Strictly shows ONLY the Trip Amount (e.g. ₹25,000 for RUN, ₹500 for HOLD), never actual accounting/cost breakdowns.
                 ========================================================================= */
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-[#142B4A] text-white font-bold text-xs uppercase tracking-wider border-b border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">DATE</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">SERVICE ID</th>
                    <th className="py-2 px-2.5 border-r border-slate-700">ROUTE</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">VEHICLE NO</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">STATUS</th>
                    <th className="py-2 px-2 text-center border-r border-slate-700">EMP ID</th>
                    <th className="py-2 px-2.5 border-r border-slate-700">DRIVER NAME 1</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">AMOUNT</th>
                    <th className="py-2 px-2 text-center border-r border-slate-700">EMP ID</th>
                    <th className="py-2 px-2.5 border-r border-slate-700">DRIVER NAME2</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">AMOUNT</th>
                    <th className="py-2 px-2 text-center border-r border-slate-700">EMP ID 3</th>
                    <th className="py-2 px-2.5 border-r border-slate-700">HELPER</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700">AMOUNT</th>
                    <th className="py-2 px-2 text-center border-r border-slate-700 bg-blue-900/60">EMP ID 4</th>
                    <th className="py-2 px-2.5 border-r border-slate-700 bg-blue-900/60">CAPTAIN</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-700 bg-blue-900/60">AMOUNT</th>
                    <th className="py-2 px-2.5 text-center no-print">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                  {filteredDateTrips.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="py-14 text-center text-slate-400">
                        <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">
                          {isDateRangeActive
                            ? `No trip tasks found for ${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}.`
                            : `No trip tasks found for ${currentMonthLabel}.`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isDateRangeActive
                            ? 'Adjust date range filters above or clear filters.'
                            : 'Fresh month started. Click "Log New Task & Duty" above to assign duties.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDateTrips.map((t) => {
                      const isHold = String(t.vehicle_status || '').toUpperCase().includes('HOLD');
                      const tripRate = Number(t.trip_amount) || 25000;
                      const formattedDate = t.trip_start_date ? t.trip_start_date.split('-').reverse().join('-') : '27-10-2026';
                      const driver1EmpId = t.driver1?.employee_id ? `YS${t.driver1.employee_id}` : (t.driver1_emp_id || 'YS1');
                      const driver2EmpId = t.driver2?.employee_id ? `YS${t.driver2.employee_id}` : (t.driver2_emp_id || (t.driver2?.employee_name ? 'YS4' : '-'));
                      const helperEmpId = t.helper?.employee_id ? `YS${t.helper.employee_id}` : (t.helper_emp_id || (t.helper?.employee_name ? 'YS2' : '-'));
                      const captainEmpId = t.captain?.employee_id ? `YS${t.captain.employee_id}` : (t.captain_emp_id || (t.captain?.employee_name ? 'YS3' : '-'));

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* DATE */}
                          <td className="py-2 px-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                            {formattedDate}
                          </td>

                          {/* SERVICE ID */}
                          <td className="py-2 px-2.5 text-center font-bold text-slate-900 border-r border-slate-100">
                            {t.service_number || 'SRV-101'}
                          </td>

                          {/* ROUTE */}
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                            {t.route_corridor || 'Hyderabad → Bangalore'}
                          </td>

                          {/* VEHICLE NO */}
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-blue-700 border-r border-slate-100">
                            {t.vehicle_number}
                          </td>

                          {/* STATUS */}
                          <td className="py-2 px-2.5 text-center border-r border-slate-100">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${isHold
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                            >
                              {isHold ? 'HOLD' : 'RUN'}
                            </span>
                          </td>

                          {/* DRIVER 1 */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                            {driver1EmpId}
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-100">
                            {t.driver1?.employee_name || t.driver1_name || 'akhil'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold text-slate-900 border-r border-slate-100">
                            {isHold ? '₹500' : `₹${tripRate.toLocaleString('en-IN')}`}
                          </td>

                          {/* DRIVER 2 */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                            {driver2EmpId}
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-100">
                            {t.driver2?.employee_name || t.driver2_name || '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold text-slate-900 border-r border-slate-100">
                            {t.driver2?.employee_name ? (isHold ? '₹500' : `₹${tripRate.toLocaleString('en-IN')}`) : '-'}
                          </td>

                          {/* HELPER */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                            {helperEmpId}
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-100">
                            {t.helper?.employee_name || t.helper_name || '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold text-slate-900 border-r border-slate-100">
                            {t.helper?.employee_name ? (isHold ? '₹500' : `₹${tripRate.toLocaleString('en-IN')}`) : '-'}
                          </td>

                          {/* CAPTAIN */}
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100 bg-blue-50/30">
                            {captainEmpId}
                          </td>
                          <td className="py-2 px-3.5 font-semibold text-slate-900 border-r border-slate-100 bg-blue-50/30">
                            {t.captain?.employee_name || t.captain_name || '-'}
                          </td>
                          <td className="py-2 px-3.5 text-center font-bold text-slate-900 border-r border-slate-100 bg-blue-50/30">
                            {t.captain?.employee_name ? (isHold ? '₹500' : `₹${tripRate.toLocaleString('en-IN')}`) : '-'}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-2 px-3.5 text-center no-print">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Trip Duty"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrip(t.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                                title="Delete Trip Duty"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Admin Original Table (Image 2) */
              <table className="w-full text-left text-sm" style={{ minWidth: '1050px' }}>
                <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-[11px] border-b border-blue-900/30">
                  <tr>
                    <th className="py-2.5 px-2.5 w-12 text-center">S.NO</th>
                    <th className="py-2.5 px-2.5 min-w-[85px] text-center">DATE</th>
                    <th className="py-2.5 px-2.5 min-w-[105px]">VEHICLE NUMBER</th>
                    <th className="py-2.5 px-2.5 min-w-[85px]">SERVICE NUMBER</th>
                    <th className="py-2.5 px-2.5 min-w-[90px]">ROUTE</th>
                    <th className="py-2.5 px-2.5 min-w-[85px]">VEHICLE STATUS</th>
                    <th className="py-2.5 px-2.5 min-w-[95px]">OPERATOR</th>
                    <th className="py-2.5 px-2.5 min-w-[95px]">DRIVER1</th>
                    <th className="py-2.5 px-2.5 min-w-[95px]">DRIVER2</th>
                    <th className="py-2.5 px-2.5 min-w-[85px]">HELPER</th>
                    <th className="py-2.5 px-2.5 min-w-[85px]">CAPTAIN</th>
                    <th className="py-2.5 px-2.5 min-w-[85px]">TOTAL</th>
                    <th className="py-2.5 px-2.5 text-center min-w-[90px]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDateTrips.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-14 text-center text-slate-400">
                        <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">
                          {isDateRangeActive
                            ? `No buses assigned for ${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}.`
                            : `No buses assigned for ${currentMonthLabel}.`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isDateRangeActive
                            ? 'Adjust date range filters above or clear filters.'
                            : 'Fresh month started. Click "Log New Task & Duty" above or choose from Pending Buses below.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDateTrips.map((t, index) => {
                      const totalSalary =
                        Number(t.driver1?.salary_amount || 0) +
                        Number(t.driver2?.salary_amount || 0) +
                        Number(t.helper?.salary_amount || 0) +
                        Number(t.captain?.salary_amount || 0);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. S.NO */}
                          <td className="py-2 px-2.5 font-bold text-slate-500 text-center">{index + 1}</td>

                          {/* 2. DATE */}
                          <td className="py-2 px-2.5 text-center">
                            <span className="font-mono font-bold text-slate-800 text-xs">
                              {formatDisplayDate(t.trip_start_date)}
                            </span>
                          </td>

                          {/* 3. VEHICLE NUMBER */}
                          <td className="py-2 px-2.5">
                            <span className="font-mono font-black text-[#142B4A] text-sm tracking-wider uppercase block">
                              {t.vehicle_number}
                            </span>
                          </td>

                          {/* 4. SERVICE NUMBER */}
                          <td className="py-2 px-2.5">
                            {t.service_number ? (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-xs">
                                {t.service_number}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* 5. ROUTE */}
                          <td className="py-2 px-2.5">
                            <p className="text-xs font-semibold text-slate-800">
                              {t.route_corridor}
                            </p>
                          </td>

                          {/* 6. VEHICLE STATUS */}
                          <td className="py-2 px-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.vehicle_status.startsWith('HOLD')
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${t.vehicle_status.startsWith('HOLD') ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                              ></span>
                              <span>{t.vehicle_status || 'RUN'}</span>
                            </span>
                          </td>

                          {/* 7. OPERATOR */}
                          <td className="py-2 px-2.5 text-slate-700 font-medium text-xs">
                            {t.operator_organizer || 'Charvik Fleet'}
                          </td>

                          {/* 8. DRIVER1 */}
                          <td className="py-2 px-2.5">
                            <div className="space-y-0.5 text-xs">
                              <p className="font-bold text-slate-900">{t.driver1.employee_name}</p>
                              <span className="text-[10px] font-semibold text-slate-500">₹{t.driver1.salary_amount}</span>
                            </div>
                          </td>

                          {/* 9. DRIVER2 */}
                          <td className="py-2 px-2.5">
                            {t.driver2?.employee_name ? (
                              <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-slate-900">{t.driver2.employee_name}</p>
                                <span className="text-[10px] font-semibold text-slate-500">₹{t.driver2.salary_amount}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-xs">—</span>
                            )}
                          </td>

                          {/* 10. HELPER */}
                          <td className="py-2 px-2.5">
                            {t.helper?.employee_name ? (
                              <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-slate-900">{t.helper.employee_name}</p>
                                <span className="text-[10px] font-semibold text-slate-500">₹{t.helper.salary_amount}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-xs">—</span>
                            )}
                          </td>

                          {/* 11. CAPTAIN */}
                          <td className="py-2 px-2.5">
                            {t.captain?.employee_name ? (
                              <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-indigo-700">{t.captain.employee_name}</p>
                                <span className="text-[10px] font-semibold text-indigo-500">₹{t.captain.salary_amount}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-xs">—</span>
                            )}
                          </td>

                          {/* 12. TOTAL */}
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900 text-xs">₹{totalSalary.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">Total Payout</p>
                          </td>

                          {/* 13. ACTIONS */}
                          <td className="py-2 px-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Trip Duty"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTrip(t.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                                title="Delete Trip Duty"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Pending / Unassigned Buses Tab */}
      {activeTab === 'pending' && (
        <div id="pending-buses-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Unassigned Fleet Vehicles for {isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel} ({pendingBusesList.length} Buses Available)
              </h3>
              <p className="text-xs text-slate-500">
                These vehicles do not have any trips or staff duties scheduled for this operational period.
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

            {/* Row 1: Trip Start Date + Vehicle Number (Searchable) + Vehicle Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Trip Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Trip Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.trip_start_date || todayStr}
                  onChange={(e) => setFormData({ ...formData, trip_start_date: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              {/* Vehicle Number (Searchable) */}
              <div>
                <SearchableSelect
                  label="Vehicle Number"
                  required
                  placeholder="-- Search or Select Vehicle --"
                  searchPlaceholder="Search vehicle number..."
                  options={busSearchOptions}
                  value={formData.vehicle_number || ''}
                  onChange={(val) => {
                    const selectedBus = buses.find((b) => b.registration_number === val);
                    const autoType = mapBusTypeToVehicleType(selectedBus?.bus_type);
                    setFormData((prev) => ({
                      ...prev,
                      vehicle_number: val,
                      ...(autoType ? { vehicle_type: autoType } : {})
                    }));
                  }}
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Type *</label>
                <select
                  required
                  value={formData.vehicle_type || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
                >
                  <option value="">-- Select Vehicle Type --</option>
                  <option value="Seater">Seater</option>
                  <option value="Sleeper/Seating">Sleeper/Seating</option>
                  <option value="Full Sleeper">Full Sleeper</option>
                </select>
              </div>
            </div>

            {/* Row 2: Route Corridor + Vehicle Status + Operator / Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Route Corridor (Searchable) */}
              <div>
                <SearchableSelect
                  label="Route Corridor"
                  required
                  placeholder="-- Search or Select Route Corridor --"
                  searchPlaceholder="Search cities or service number..."
                  options={routeSearchOptions}
                  value={formData.route_corridor || ''}
                  onChange={(val) => {
                    const selectedRoute = routes.find(
                      (r: any) => `${r.starting_city} → ${r.ending_city}` === val
                    );
                    setFormData({
                      ...formData,
                      route_corridor: val,
                      service_number: selectedRoute?.service_number || formData.service_number || '',
                      trip_amount: selectedRoute?.trip_amount !== undefined ? selectedRoute.trip_amount : formData.trip_amount,
                      operator_commission: selectedRoute?.operator_commission !== undefined ? selectedRoute.operator_commission : formData.operator_commission
                    });
                  }}
                />
              </div>

              {/* Vehicle Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Status *</label>
                <select
                  required
                  value={formData.vehicle_status || 'RUN'}
                  onChange={(e: any) => handleVehicleStatusChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
                >
                  <option value="RUN">🟢 RUN</option>
                  <option value="HOLD (Low Occupancy)">🟡 HOLD (Low Occupancy)</option>
                  <option value="HOLD (Maintenance)">🔴 HOLD (Maintenance)</option>
                  <option value="HOLD (Break Down)">🟠 HOLD (Break Down)</option>
                  <option value="HOLD (Finance Side)">🟣 HOLD (Finance Side)</option>
                </select>
              </div>

              {/* Operator / Organizer */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operator / Organizer *</label>
                <select
                  required
                  value={formData.operator_organizer || ''}
                  onChange={(e) => setFormData({ ...formData, operator_organizer: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium cursor-pointer"
                >
                  <option value="">-- Choose Organizer --</option>
                  {organizers.map((o: any) => (
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

            {/* Financial Amount Supervision Mode Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  Amount Control: <strong className="text-slate-900">{isFixedAmountMode ? `Fixed Rate (Driver: ₹${defaultFixedDriverPay}, Helper: ₹${defaultFixedHelperPay})` : 'Company-Defined (Employee Profile)'}</strong>
                </span>
              </div>
              {isAmountsLocked ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Staff Locked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Admin Supervised
                </span>
              )}
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Salary Amount ₹ *{' '}
                      {formData.vehicle_status?.startsWith('HOLD') && (
                        <span className="text-[10px] text-amber-700 font-black">(Hold: ₹{defaultFixedHoldPay})</span>
                      )}
                    </span>
                    {isAmountsLocked && (
                      <span className="text-[9px] text-amber-800 font-bold flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Admin Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    readOnly={formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked}
                    placeholder="Enter salary ₹"
                    value={formData.driver1?.salary_amount !== undefined && formData.driver1?.salary_amount !== null ? formData.driver1.salary_amount : ''}
                    onChange={(e) => {
                      if (formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked) return;
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
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 font-bold outline-none ${formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked
                      ? 'bg-amber-50/70 text-amber-900 border-amber-300 cursor-not-allowed'
                      : 'bg-white'
                      }`}
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

                <div className="flex items-center gap-2">
                  {formData.vehicle_status?.startsWith('HOLD') && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      ⚡ Hold Duty: ₹500
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Select Driver 2 Employee</label>
                  </div>
                  <select
                    value={formData.driver2?.employee_name || ''}
                    onChange={(e) => handleDriver2Select(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                  >
                    <option value="">-- None (Single Driver Duty) --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.full_name}>
                        {d.full_name} ({d.employee_code}){d.salary ? ` • ₹${Number(d.salary).toLocaleString('en-IN')}` : ''}{d.employment_type ? ` [${d.employment_type}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Salary Amount ₹{' '}
                      {formData.vehicle_status?.startsWith('HOLD') && (
                        <span className="text-[10px] text-amber-700 font-black">(Hold: ₹{defaultFixedHoldPay})</span>
                      )}
                    </span>
                    {isAmountsLocked && (
                      <span className="text-[9px] text-amber-800 font-bold flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Admin Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    readOnly={formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked}
                    placeholder="Enter salary ₹"
                    value={formData.driver2?.salary_amount !== undefined && formData.driver2?.salary_amount !== null ? formData.driver2.salary_amount : ''}
                    onChange={(e) => {
                      if (formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked) return;
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
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 font-bold outline-none ${formData.vehicle_status?.startsWith('HOLD') || isAmountsLocked
                      ? 'bg-amber-50/70 text-amber-900 border-amber-300 cursor-not-allowed'
                      : 'bg-white'
                      }`}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        {h.full_name} ({h.employee_code}){h.salary ? ` • ₹${Number(h.salary).toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Helper Salary Amount ₹</span>
                    {isAmountsLocked && (
                      <span className="text-[9px] text-amber-800 font-bold flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Admin Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    readOnly={isAmountsLocked}
                    placeholder="Enter helper salary ₹"
                    value={formData.helper?.salary_amount !== undefined && formData.helper?.salary_amount !== null ? formData.helper.salary_amount : ''}
                    onChange={(e) => {
                      if (isAmountsLocked) return;
                      const val = e.target.value;
                      const sal = val === '' ? ('' as any) : Number(val);
                      setFormData({
                        ...formData,
                        helper: {
                          employee_id: formData.helper?.employee_id,
                          employee_name: formData.helper?.employee_name || '',
                          role: 'Helper',
                          salary_amount: sal,
                          advance_amount: formData.helper?.advance_amount || 0,
                          balance_due: Number(sal || 0) - Number(formData.helper?.advance_amount || 0)
                        }
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold outline-none"
                  />
                </div>
              </div>

              {formData.helper?.employee_name && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/50">
                  <span className="text-[10px] text-slate-500">
                    {helpers.find((h) => h.full_name === formData.helper?.employee_name)?.salary ? (
                      <span className="text-emerald-700 font-semibold">
                        ✓ Auto-filled from registered salary
                      </span>
                    ) : null}
                  </span>
                  <span className="text-slate-500">
                    Helper Pay: <strong className="text-slate-900 font-bold">₹{Number(formData.helper?.salary_amount || 0)}</strong>
                  </span>
                </div>
              )}
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Captain Employee</label>
                <select
                  value={formData.captain?.employee_name || ''}
                  onChange={(e) => handleCaptainSelect(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none"
                >
                  <option value="">-- None (No Captain Assigned) --</option>
                  {captains.map((c) => (
                    <option key={c.id} value={c.full_name}>
                      {c.full_name} ({c.employee_code})
                    </option>
                  ))}
                </select>
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
          title={`All Trips for ${selectedBusForView} (${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel})`}
          subtitle={`${busGroupMap.get(selectedBusForView)?.length || 0} Trip(s) Allocated in this period`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vehicle: <strong className="text-blue-900 font-mono text-sm">{selectedBusForView}</strong>
              </span>

              <div className="flex items-center gap-2">
                <PrintButton
                  title={`Trip Allocation Sheet - Bus ${selectedBusForView}`}
                  subtitle={`Period: ${isDateRangeActive ? `${formatDisplayDate(fromDateFilter)} to ${formatDisplayDate(toDateFilter)}` : currentMonthLabel}`}
                  targetId="view-bus-trips-sheet-content"
                />
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
            </div>

            <div id="view-bus-trips-sheet-content" className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {(busGroupMap.get(selectedBusForView) || []).map((t, idx) => (
                <div key={t.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t.route_corridor}</h4>
                        {t.service_number && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mt-0.5">
                            Service No: {t.service_number}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.vehicle_status.startsWith('HOLD')
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

                  <p className="text-xs text-slate-500">
                    Organizer: <strong className="text-slate-800">{t.operator_organizer}</strong> &nbsp;•&nbsp; Date:{' '}
                    <strong className="text-slate-800">{t.trip_start_date}</strong>
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Driver 1</span>
                      <p className="font-bold text-slate-900 text-sm truncate">{t.driver1.employee_name}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-emerald-700 font-bold">
                          ₹{t.driver1.salary_amount}
                        </p>
                        {t.vehicle_status.startsWith('HOLD') && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            HOLD ₹500
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Driver 2</span>
                      <p className="font-bold text-slate-900 text-sm truncate">{t.driver2?.employee_name || <span className="text-slate-300">None</span>}</p>
                      {t.driver2?.employee_name && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-emerald-700 font-bold">
                            ₹{t.driver2.salary_amount}
                          </p>
                          {t.vehicle_status.startsWith('HOLD') && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              HOLD ₹500
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Helper</span>
                      <p className="font-bold text-slate-900 text-sm truncate">{t.helper?.employee_name || <span className="text-slate-300">None</span>}</p>
                      {t.helper?.employee_name && (
                        <p className="text-xs text-emerald-700 font-bold">₹{t.helper.salary_amount}</p>
                      )}
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wide block">Captain</span>
                      <p className="font-bold text-indigo-700 text-sm truncate">{t.captain?.employee_name || <span className="text-slate-300">None</span>}</p>
                      {t.captain?.work_remarks && (
                        <p className="text-[10px] text-indigo-500 truncate">{t.captain.work_remarks}</p>
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
