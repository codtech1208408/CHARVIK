import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Bus,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Edit,
  Trash2,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { BASE_FLEET_TASKS, BASE_FLEET_BUSES, BASE_FLEET_EMPLOYEES, BASE_FLEET_ROUTES } from '../services/seedData';

export interface SupporterTaskRow {
  id: number | string;
  trip_start_date: string; // YYYY-MM-DD
  display_date: string;    // DD-MM-YYYY
  service_number: string;
  route_corridor: string;
  vehicle_number: string;
  vehicle_status: 'Run' | 'HOLD';
  hold_reason?: string;
  driver1_emp_id: string;
  driver1_name: string;
  driver2_emp_id: string;
  driver2_name: string;
  helper_emp_id: string;
  helper_name: string;
  captain_emp_id: string;
  captain_name: string;
  actual_trip_amount: number;
}

const STORAGE_KEY = 'charvik_supporter_tasks_store';
const ADMIN_TASKS_KEY = 'charvik_trip_duty_management_v2';

export const SupporterTasks: React.FC = () => {
  const { success, error } = useToast();

  const [buses, setBuses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  // Modals
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | number | null>(null);

  // Form State for + New Task
  const todayIso = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<Partial<SupporterTaskRow>>({
    trip_start_date: todayIso,
    service_number: '',
    route_corridor: '',
    vehicle_number: '',
    vehicle_status: 'Run',
    hold_reason: '',
    driver1_emp_id: '',
    driver1_name: '',
    driver2_emp_id: '',
    driver2_name: '',
    helper_emp_id: '',
    helper_name: '',
    captain_emp_id: '',
    captain_name: '',
    actual_trip_amount: 16000
  });

  // Tasks Store
  const [tasks, setTasks] = useState<SupporterTaskRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Convert from admin tasks if present
    try {
      const adminTasksRaw = localStorage.getItem(ADMIN_TASKS_KEY);
      if (adminTasksRaw) {
        const adminTasks = JSON.parse(adminTasksRaw);
        if (Array.isArray(adminTasks) && adminTasks.length > 0) {
          return adminTasks.map((at: any, idx: number) => ({
            id: at.id || idx + 1,
            trip_start_date: at.trip_start_date || '2026-10-30',
            display_date: at.trip_start_date ? at.trip_start_date.split('-').reverse().join('-') : '30-10-2026',
            service_number: at.service_number || `SRV-${at.id || 101 + idx}`,
            route_corridor: at.route_corridor || '',
            vehicle_number: at.vehicle_number || '',
            vehicle_status: String(at.vehicle_status || '').toUpperCase().includes('HOLD') ? 'HOLD' : 'Run',
            driver1_emp_id: at.driver1?.employee_id ? `YS${at.driver1.employee_id}` : (at.driver1_emp_id || 'YS137'),
            driver1_name: at.driver1?.employee_name || at.driver1_name || '',
            driver2_emp_id: at.driver2?.employee_id ? `YS${at.driver2.employee_id}` : (at.driver2_emp_id || ''),
            driver2_name: at.driver2?.employee_name || at.driver2_name || '',
            helper_emp_id: at.helper?.employee_id ? `YS${at.helper.employee_id}` : (at.helper_emp_id || ''),
            helper_name: at.helper?.employee_name || at.helper_name || '',
            captain_emp_id: at.captain?.employee_id ? `YS${at.captain.employee_id}` : (at.captain_emp_id || ''),
            captain_name: at.captain?.employee_name || at.captain_name || '',
            actual_trip_amount: Number(at.trip_amount || at.actual_trip_amount || 16000)
          }));
        }
      }
    } catch {}

    // Fallback to active fleet tasks
    return BASE_FLEET_TASKS.map((at: any, idx: number) => ({
      id: at.id || idx + 1,
      trip_start_date: at.trip_start_date || '2026-10-30',
      display_date: at.trip_start_date ? at.trip_start_date.split('-').reverse().join('-') : '30-10-2026',
      service_number: at.service_number || `SRV-${101 + idx}`,
      route_corridor: at.route_corridor || 'Hyderabad → Bangalore',
      vehicle_number: at.vehicle_number || 'AP16TV1234',
      vehicle_status: String(at.vehicle_status || '').toUpperCase().includes('HOLD') ? 'HOLD' : 'Run',
      driver1_emp_id: at.driver1?.employee_id ? `YS${at.driver1.employee_id}` : 'YS137',
      driver1_name: at.driver1?.employee_name || 'akhil',
      driver2_emp_id: at.driver2?.employee_id ? `YS${at.driver2.employee_id}` : 'YS185',
      driver2_name: at.driver2?.employee_name || 'kittu',
      helper_emp_id: at.helper?.employee_id ? `YS${at.helper.employee_id}` : 'YS210',
      helper_name: at.helper?.employee_name || 'santhu',
      captain_emp_id: at.captain?.employee_id ? `YS${at.captain.employee_id}` : 'YS201',
      captain_name: at.captain?.employee_name || 'hari',
      actual_trip_amount: 25000
    }));
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Run' | 'HOLD'>('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Load backend data for options (Buses, Employees, Routes)
  useEffect(() => {
    Promise.all([
      api.getBuses().catch(() => BASE_FLEET_BUSES),
      api.getEmployees().catch(() => BASE_FLEET_EMPLOYEES),
      api.getRoutes().catch(() => BASE_FLEET_ROUTES)
    ]).then(([busesData, empData, routesData]) => {
      setBuses(busesData || []);
      setEmployees(empData || []);
      setRoutes(routesData || []);
    });
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  // Helper to dynamically get the ACTUAL TRIP AMOUNT created in Route Management
  const getActualTripAmount = (row: SupporterTaskRow): number => {
    if (routes && routes.length > 0) {
      const match = routes.find(
        (r) =>
          (row.service_number && r.service_number && String(r.service_number).trim().toLowerCase() === String(row.service_number).trim().toLowerCase()) ||
          (row.route_corridor && `${r.starting_city}-${r.ending_city}`.toLowerCase().replace(/\s+/g, '').includes(row.route_corridor.toLowerCase().split(' ')[0].replace(/\s+/g, '')))
      );
      if (match && match.trip_amount) {
        return Number(match.trip_amount);
      }
    }
    return row.actual_trip_amount || 16000;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      const matchesSearch =
        search === '' ||
        (item.service_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.route_corridor || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.vehicle_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.driver1_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.driver2_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.helper_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.captain_name || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || item.vehicle_status === statusFilter;

      const matchesDate =
        dateFilter === 'All' || item.display_date === dateFilter || item.trip_start_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [tasks, search, statusFilter, dateFilter]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.display_date)));
  }, [tasks]);

  const totalRuns = tasks.filter((t) => t.vehicle_status === 'Run').length;
  const totalHolds = tasks.filter((t) => t.vehicle_status === 'HOLD').length;

  // Open modal to add a new task
  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setFormData({
      trip_start_date: todayIso,
      service_number: '',
      route_corridor: '',
      vehicle_number: buses.length > 0 ? (buses[0].registration_number || buses[0].bus_number) : '',
      vehicle_status: 'Run',
      hold_reason: '',
      driver1_emp_id: '',
      driver1_name: '',
      driver2_emp_id: '',
      driver2_name: '',
      helper_emp_id: '',
      helper_name: '',
      captain_emp_id: '',
      captain_name: '',
      actual_trip_amount: 16000
    });
    setIsNewTaskOpen(true);
  };

  // Open modal to edit an existing task
  const handleOpenEditTask = (task: SupporterTaskRow) => {
    setEditingTaskId(task.id);
    setFormData({
      ...task
    });
    setIsNewTaskOpen(true);
  };

  // Delete a task
  const handleDeleteTask = (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this trip task?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    success('Task deleted successfully');
  };

  // Handle Route change in modal: auto-populate service number & actual trip amount from Route Management
  const handleRouteChange = (routeName: string) => {
    const foundRoute = routes.find(
      (r) =>
        r.service_number === routeName ||
        `${r.starting_city} → ${r.ending_city}` === routeName ||
        `${r.starting_city}-${r.ending_city}` === routeName
    );

    setFormData((prev) => ({
      ...prev,
      route_corridor: routeName,
      service_number: foundRoute?.service_number || prev.service_number || '',
      actual_trip_amount: foundRoute?.trip_amount ? Number(foundRoute.trip_amount) : prev.actual_trip_amount || 16000
    }));
  };

  // Handle Driver 1 change: auto-populate emp id
  const handleDriver1Change = (name: string) => {
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setFormData((prev) => ({
      ...prev,
      driver1_name: name,
      driver1_emp_id: emp ? (emp.employee_code || `YS${emp.id}`) : prev.driver1_emp_id || ''
    }));
  };

  // Handle Driver 2 change
  const handleDriver2Change = (name: string) => {
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setFormData((prev) => ({
      ...prev,
      driver2_name: name,
      driver2_emp_id: emp ? (emp.employee_code || `YS${emp.id}`) : prev.driver2_emp_id || ''
    }));
  };

  // Handle Helper change
  const handleHelperChange = (name: string) => {
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setFormData((prev) => ({
      ...prev,
      helper_name: name,
      helper_emp_id: emp ? (emp.employee_code || `YS${emp.id}`) : prev.helper_emp_id || ''
    }));
  };

  // Handle Captain change
  const handleCaptainChange = (name: string) => {
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setFormData((prev) => ({
      ...prev,
      captain_name: name,
      captain_emp_id: emp ? (emp.employee_code || `YS${emp.id}`) : prev.captain_emp_id || ''
    }));
  };

  // Submit New or Edited Task
  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.route_corridor && !formData.service_number) {
      error('Please specify a Route or Service ID');
      return;
    }

    const dateStr = formData.trip_start_date || todayIso;
    const parts = dateStr.split('-');
    const formattedDisplayDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
    const isHoldStatus = String(formData.vehicle_status || '').toUpperCase().includes('HOLD');
    const foundRoute = routes.find(
      (r) =>
        (formData.service_number && r.service_number && String(r.service_number).trim().toLowerCase() === String(formData.service_number).trim().toLowerCase()) ||
        (formData.route_corridor && `${r.starting_city} → ${r.ending_city}` === formData.route_corridor) ||
        (formData.route_corridor && `${r.starting_city}-${r.ending_city}` === formData.route_corridor)
    );
    const resolvedTripAmount = isHoldStatus
      ? 500
      : (foundRoute?.trip_amount ? Number(foundRoute.trip_amount) : (Number(formData.actual_trip_amount) || 16000));

    if (editingTaskId) {
      // Update existing
      setTasks((prev) =>
        prev.map((item) =>
          item.id === editingTaskId
            ? {
                ...item,
                trip_start_date: dateStr,
                display_date: formattedDisplayDate,
                service_number: formData.service_number || item.service_number || 'SRV-101',
                route_corridor: formData.route_corridor || item.route_corridor,
                vehicle_number: formData.vehicle_number || item.vehicle_number,
                vehicle_status: formData.vehicle_status || 'Run',
                hold_reason: formData.hold_reason || '',
                driver1_emp_id: formData.driver1_emp_id || '',
                driver1_name: formData.driver1_name || '',
                driver2_emp_id: formData.driver2_emp_id || '',
                driver2_name: formData.driver2_name || '',
                helper_emp_id: formData.helper_emp_id || '',
                helper_name: formData.helper_name || '',
                captain_emp_id: formData.captain_emp_id || '',
                captain_name: formData.captain_name || '',
                actual_trip_amount: resolvedTripAmount
              }
            : item
        )
      );
      success('Trip task updated successfully!');
    } else {
      // Add new
      const newTask: SupporterTaskRow = {
        id: Date.now(),
        trip_start_date: dateStr,
        display_date: formattedDisplayDate,
        service_number: formData.service_number || `SRV-${Math.floor(100 + Math.random() * 900)}`,
        route_corridor: formData.route_corridor || 'Direct Corridor',
        vehicle_number: formData.vehicle_number || (buses[0]?.registration_number || 'AP16TV1234'),
        vehicle_status: formData.vehicle_status || 'Run',
        hold_reason: formData.hold_reason || '',
        driver1_emp_id: formData.driver1_emp_id || '',
        driver1_name: formData.driver1_name || '',
        driver2_emp_id: formData.driver2_emp_id || '',
        driver2_name: formData.driver2_name || '',
        helper_emp_id: formData.helper_emp_id || '',
        helper_name: formData.helper_name || '',
        captain_emp_id: formData.captain_emp_id || '',
        captain_name: formData.captain_name || '',
        actual_trip_amount: resolvedTripAmount
      };

      setTasks((prev) => [newTask, ...prev]);
      success('New trip task created successfully!');
    }

    setIsNewTaskOpen(false);
  };

  const handlePrintSection = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#142B4A] tracking-tight">
                Trip Tasks & Crew Schedule
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Operational roster for service routes, vehicle assignments, driver, helper & captain schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: + New Task and Print Sheet */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Scheduled</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{tasks.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Active Running</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{totalRuns}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">On HOLD</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">{totalHolds}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Actual Route Amount</p>
            <p className="text-xs font-semibold text-blue-700 mt-0.5">Admin Route Mgmt Sync</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Vehicle No, Route, Service ID, Driver, Helper, Captain..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Run', 'HOLD'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? st === 'Run'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'HOLD'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          {uniqueDates.length > 1 && (
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Dates</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* =========================================================================
          WEB UI TABLE: Sleek Modern Web Grid with Exact Data Headings
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-[#142B4A] text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 text-center border-r border-slate-700">Date</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Service ID</th>
                <th className="py-3 px-4 border-r border-slate-700">Route</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Vehicle No</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Status</th>
                <th className="py-3 px-2 text-center border-r border-slate-700">Emp ID</th>
                <th className="py-3 px-3 border-r border-slate-700">Driver Name 1</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Amount</th>
                <th className="py-3 px-2 text-center border-r border-slate-700">Emp ID</th>
                <th className="py-3 px-3 border-r border-slate-700">Driver Name2</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Amount</th>
                <th className="py-3 px-2 text-center border-r border-slate-700">Emp ID 3</th>
                <th className="py-3 px-3 border-r border-slate-700">Helper</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Amount</th>
                <th className="py-3 px-2 text-center border-r border-slate-700 bg-blue-900/60">Emp ID 4</th>
                <th className="py-3 px-3 border-r border-slate-700 bg-blue-900/60">Captain</th>
                <th className="py-3 px-3 text-center border-r border-slate-700 bg-blue-900/60">Amount</th>
                <th className="py-3 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-500 font-semibold italic">
                    No trip tasks found. Click <strong>"+ New Task"</strong> at the top right to create one.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((row) => {
                  const actualAmt = getActualTripAmount(row);
                  const isHold = row.vehicle_status === 'HOLD';

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-100">
                        {row.display_date}
                      </td>

                      {/* Service ID */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                        {row.service_number}
                      </td>

                      {/* Route */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-100">
                        {row.route_corridor}
                      </td>

                      {/* Vehicle No */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 border-r border-slate-100">
                        {row.vehicle_number}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isHold
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {row.vehicle_status}
                        </span>
                      </td>

                      {/* Driver 1 */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                        {row.driver1_emp_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                        {row.driver1_name || '-'}
                      </td>
                      {/* Driver 1 Amount: 500 if HOLD, else trip amount */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                        {isHold ? '₹500' : (actualAmt > 0 ? `₹${actualAmt.toLocaleString('en-IN')}` : '-')}
                      </td>

                      {/* Driver 2 */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                        {row.driver2_emp_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                        {row.driver2_name || '-'}
                      </td>
                      {/* Driver 2 Amount: 500 if HOLD, else trip amount */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                        {row.driver2_name ? (isHold ? '₹500' : `₹${actualAmt.toLocaleString('en-IN')}`) : '-'}
                      </td>

                      {/* Helper */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100">
                        {row.helper_emp_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                        {row.helper_name || '-'}
                      </td>
                      {/* Helper Amount: NOT paid on hold */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                        {row.helper_name ? (isHold ? '-' : `₹${actualAmt.toLocaleString('en-IN')}`) : '-'}
                      </td>

                      {/* Captain */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-100 bg-blue-50/30">
                        {row.captain_emp_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100 bg-blue-50/30">
                        {row.captain_name || '-'}
                      </td>
                      {/* Captain Amount: NOT paid on hold */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100 bg-blue-50/30">
                        {row.captain_name ? (isHold ? '-' : `₹${actualAmt.toLocaleString('en-IN')}`) : '-'}
                      </td>

                      {/* Row Actions */}
                      <td className="py-2 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditTask(row)}
                            className="p-1 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(row.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Note Banner */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-[#142B4A] flex items-center justify-between">
        <p className="font-medium">
          <strong>Note:</strong> In accordance with role specifications, all values in the <strong>Amount</strong> column show the <strong>actual route trip amount</strong> defined in Route Management (Admin Panel), safeguarding private driver salary and advance records.
        </p>
        <span className="font-bold text-blue-700 shrink-0 ml-4">
          Total Tasks: {filteredTasks.length}
        </span>
      </div>

      {/* =========================================================================
          MODAL 1: + NEW TASK / EDIT TASK MODAL
         ========================================================================= */}
      {isNewTaskOpen && (
        <Modal
          isOpen={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          title={editingTaskId ? 'Edit Trip Task' : 'Create New Trip Task'}
          subtitle="Fill in task details matching the yellow box headings to schedule the trip."
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSubmitTask} className="space-y-4">
            {/* Trip Details Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Trip & Vehicle Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.trip_start_date}
                    onChange={(e) => setFormData({ ...formData, trip_start_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2080 or SRV-101"
                    value={formData.service_number}
                    onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status *</label>
                  <select
                    value={formData.vehicle_status}
                    onChange={(e) => setFormData({ ...formData, vehicle_status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs outline-none"
                  >
                    <option value="Run">Run (Active)</option>
                    <option value="HOLD">HOLD (On Hold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Route Corridor *</label>
                  <input
                    type="text"
                    list="routes-datalist"
                    placeholder="Search or type route corridor..."
                    value={formData.route_corridor}
                    onChange={(e) => handleRouteChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none font-medium"
                    required
                  />
                  <datalist id="routes-datalist">
                    {routes.map((r) => (
                      <option key={r.id} value={`${r.starting_city} → ${r.ending_city}`}>
                        {r.service_number ? `[${r.service_number}] ` : ''}{r.starting_city} → {r.ending_city} (₹{r.trip_amount})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    list="buses-datalist"
                    placeholder="Search or enter bus number..."
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none font-mono font-bold"
                    required
                  />
                  <datalist id="buses-datalist">
                    {buses.map((b) => (
                      <option key={b.id} value={b.registration_number || b.bus_number}>
                        {b.bus_number} - {b.make} {b.model}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Crew Details: Driver 1, Driver 2, Helper, Captain */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Crew Assignment (Emp ID & Names)
              </h4>

              {/* Driver 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver 1 Name</label>
                  <input
                    type="text"
                    list="drivers1-datalist"
                    placeholder="Enter or select Driver 1..."
                    value={formData.driver1_name}
                    onChange={(e) => handleDriver1Change(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none font-medium"
                  />
                  <datalist id="drivers1-datalist">
                    {employees.filter((e) => (e.role || '').toLowerCase().includes('driver')).map((d) => (
                      <option key={d.id} value={d.full_name || d.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver 1 Emp ID</label>
                  <input
                    type="text"
                    placeholder="e.g. YS137"
                    value={formData.driver1_emp_id}
                    onChange={(e) => setFormData({ ...formData, driver1_emp_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Driver 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver 2 Name (Optional)</label>
                  <input
                    type="text"
                    list="drivers2-datalist"
                    placeholder="Enter or select Driver 2..."
                    value={formData.driver2_name}
                    onChange={(e) => handleDriver2Change(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none font-medium"
                  />
                  <datalist id="drivers2-datalist">
                    {employees.filter((e) => (e.role || '').toLowerCase().includes('driver')).map((d) => (
                      <option key={d.id} value={d.full_name || d.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver 2 Emp ID</label>
                  <input
                    type="text"
                    placeholder="e.g. YS185"
                    value={formData.driver2_emp_id}
                    onChange={(e) => setFormData({ ...formData, driver2_emp_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Helper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Helper Name (Optional)</label>
                  <input
                    type="text"
                    list="helpers-datalist"
                    placeholder="Enter or select Helper..."
                    value={formData.helper_name}
                    onChange={(e) => handleHelperChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none font-medium"
                  />
                  <datalist id="helpers-datalist">
                    {employees.filter((e) => (e.role || '').toLowerCase().includes('helper') || (e.role || '').toLowerCase().includes('support')).map((h) => (
                      <option key={h.id} value={h.full_name || h.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Helper Emp ID 3</label>
                  <input
                    type="text"
                    placeholder="e.g. YS210"
                    value={formData.helper_emp_id}
                    onChange={(e) => setFormData({ ...formData, helper_emp_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Captain (Added After Helper) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200">
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Captain Name (Optional)</label>
                  <input
                    type="text"
                    list="captains-datalist"
                    placeholder="Enter or select Captain..."
                    value={formData.captain_name}
                    onChange={(e) => handleCaptainChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-white text-xs outline-none font-medium"
                  />
                  <datalist id="captains-datalist">
                    {employees.filter((e) => (e.role || '').toLowerCase().includes('captain')).map((c) => (
                      <option key={c.id} value={c.full_name || c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-blue-900 mb-1">Captain Emp ID 4</label>
                  <input
                    type="text"
                    placeholder="e.g. YS201"
                    value={formData.captain_emp_id}
                    onChange={(e) => setFormData({ ...formData, captain_emp_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-white text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-sm transition-all cursor-pointer"
              >
                {editingTaskId ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: PRINT SHEET MODAL (EXACTLY MATCHING THE USER'S REFERENCE IMAGE)
         ========================================================================= */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Print Sheet Preview"
          subtitle="Exact Excel-formatted layout with yellow header boxes ready for printing."
          maxWidth="max-w-6xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={handlePrintSection}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>

            {/* Exact Reference Image Spreadsheet Layout */}
            <div id="print-sheet-area" className="bg-white p-4 border border-black rounded-lg overflow-x-auto text-black">
              <div className="text-center mb-3">
                <h2 className="text-base font-black tracking-wider uppercase text-black">
                  CHARVIK FLEET OPERATIONAL TRIP DUTY TASKS & CREW ROSTER
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  Roster Date: {dateFilter === 'All' ? 'All Active Schedule' : dateFilter} • Total Trips: {filteredTasks.length}
                </p>
              </div>

              <table className="w-full text-left border-collapse border-2 border-black text-xs font-sans whitespace-nowrap">
                {/* EXACT YELLOW HEADER MATCHING REFERENCE IMAGE */}
                <thead className="bg-[#FFFF00] text-black font-extrabold uppercase text-[11px] border-b-2 border-black">
                  <tr>
                    <th className="py-2 px-2.5 border border-black text-center">Date</th>
                    <th className="py-2 px-2.5 border border-black text-center">Service ID</th>
                    <th className="py-2 px-3 border border-black text-left">Route</th>
                    <th className="py-2 px-2.5 border border-black text-center">Vehicle No</th>
                    <th className="py-2 px-2.5 border border-black text-center">Status</th>
                    <th className="py-2 px-2 border border-black text-center">Emp ID</th>
                    <th className="py-2 px-3 border border-black text-left">Driver Name 1</th>
                    <th className="py-2 px-2.5 border border-black text-center">Amount</th>
                    <th className="py-2 px-2 border border-black text-center">Emp ID</th>
                    <th className="py-2 px-3 border border-black text-left">Driver Name2</th>
                    <th className="py-2 px-2.5 border border-black text-center">Amount</th>
                    <th className="py-2 px-2 border border-black text-center">Emp ID 3</th>
                    <th className="py-2 px-3 border border-black text-left">Helper</th>
                    <th className="py-2 px-2.5 border border-black text-center">Amount</th>
                    <th className="py-2 px-2 border border-black text-center bg-[#FFEB3B]">Emp ID 4</th>
                    <th className="py-2 px-3 border border-black text-left bg-[#FFEB3B]">Captain</th>
                    <th className="py-2 px-2.5 border border-black text-center bg-[#FFEB3B]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black bg-white font-medium text-black">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="py-6 text-center text-slate-500 italic">
                        No tasks to display.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((row) => {
                      const actualAmt = getActualTripAmount(row);
                      const isHold = row.vehicle_status === 'HOLD';

                      return (
                        <tr key={row.id} className="border-b border-black">
                          <td className="py-1.5 px-2.5 border border-black text-center font-mono">{row.display_date}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-bold">{row.service_number}</td>
                          <td className="py-1.5 px-3 border border-black font-semibold">{row.route_corridor}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-mono font-bold">{row.vehicle_number}</td>
                          <td
                            className={`py-1.5 px-2.5 border border-black text-center font-bold text-white text-xs ${
                              isHold ? 'bg-[#CC0000]' : 'bg-[#009933]'
                            }`}
                          >
                            {row.vehicle_status}
                          </td>
                          <td className="py-1.5 px-2 border border-black text-center font-mono">{row.driver1_emp_id || ''}</td>
                          <td className="py-1.5 px-3 border border-black font-semibold">{row.driver1_name || ''}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-bold">
                            {isHold ? 500 : (actualAmt > 0 ? actualAmt : '')}
                          </td>
                          <td className="py-1.5 px-2 border border-black text-center font-mono">{row.driver2_emp_id || ''}</td>
                          <td className="py-1.5 px-3 border border-black font-semibold">{row.driver2_name || ''}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-bold">
                            {row.driver2_name ? (isHold ? 500 : actualAmt) : ''}
                          </td>
                          <td className="py-1.5 px-2 border border-black text-center font-mono">{row.helper_emp_id || ''}</td>
                          <td className="py-1.5 px-3 border border-black font-semibold">{row.helper_name || ''}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-bold">
                            {row.helper_name ? (isHold ? '-' : actualAmt) : ''}
                          </td>
                          <td className="py-1.5 px-2 border border-black text-center font-mono bg-[#FFFDE7]">{row.captain_emp_id || ''}</td>
                          <td className="py-1.5 px-3 border border-black font-semibold bg-[#FFFDE7]">{row.captain_name || ''}</td>
                          <td className="py-1.5 px-2.5 border border-black text-center font-bold bg-[#FFFDE7]">
                            {row.captain_name ? (isHold ? '-' : actualAmt) : ''}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="mt-6 pt-4 border-t border-black flex items-center justify-between text-xs signatures">
                <div>
                  <span className="font-bold">Prepared By: </span>
                  <span className="border-b border-black w-48 inline-block pb-0.5">&nbsp;</span>
                </div>
                <div>
                  <span className="font-bold">Verified By (Operations): </span>
                  <span className="border-b border-black w-48 inline-block pb-0.5">&nbsp;</span>
                </div>
                <div>
                  <span className="font-bold">Authorized Signature: </span>
                  <span className="border-b border-black w-48 inline-block pb-0.5">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
