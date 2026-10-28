import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bus,
  User,
  Users,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
  Briefcase,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { PrintButton } from '../components/common/PrintButton';

interface OrganizerPayment {
  id: number;
  organizer_name: string;
  amount: number;
  received_date: string;
  notes?: string;
}

export const Earnings: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Core Data
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [organizerPayments, setOrganizerPayments] = useState<OrganizerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Time Period Filter: 'Today' | 'Week' | 'Month' | 'Year' | 'All'
  const [period, setPeriod] = useState<'Today' | 'Week' | 'Month' | 'Year' | 'All'>('Month');
  const [isSwitchingPeriod, setIsSwitchingPeriod] = useState(false);

  // Matrix Category Filter: 'All' | 'Driver' | 'Helper' | 'Captain'
  const [matrixCategory, setMatrixCategory] = useState<'All' | 'Driver' | 'Helper' | 'Captain'>('All');

  // Search & Pagination in Ledger
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStaffForLedger, setSelectedStaffForLedger] = useState<any | null>(null);

  // Form State for Record Organizer Amount
  const [paymentForm, setPaymentForm] = useState({
    organizer_name: '',
    amount: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tData, eData, oData, pData] = await Promise.all([
        api.getTasks().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getOrganizers().catch(() => []),
        api.getOrganizerPayments().catch(() => [])
      ]);
      setTasks(Array.isArray(tData) ? tData : []);
      setEmployees(Array.isArray(eData) ? eData : []);
      setOrganizers(Array.isArray(oData) ? oData : []);
      setOrganizerPayments(Array.isArray(pData) ? pData : []);
    } catch (err: any) {
      error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  // Switch Period with subtle feedback
  const handlePeriodChange = (newPeriod: 'Today' | 'Week' | 'Month' | 'Year' | 'All') => {
    setIsSwitchingPeriod(true);
    setPeriod(newPeriod);
    setCurrentPage(1);
    setTimeout(() => {
      setIsSwitchingPeriod(false);
    }, 250);
  };

  // Filter Tasks by Period
  const periodFilteredTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return tasks.filter((t) => {
      if (!t.trip_start_date) return false;

      if (period === 'Today') {
        return t.trip_start_date === todayStr;
      }

      if (period === 'Week') {
        const d = new Date(t.trip_start_date);
        const diffTime = today.getTime() - d.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      if (period === 'Month') {
        const currentMonth = todayStr.substring(0, 7); // YYYY-MM
        return t.trip_start_date.startsWith(currentMonth);
      }

      if (period === 'Year') {
        const currentYear = todayStr.substring(0, 4); // YYYY
        return t.trip_start_date.startsWith(currentYear);
      }

      return true; // 'All'
    });
  }, [tasks, period]);

  // Filter Organizer Payments by Period
  const periodFilteredPayments = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return organizerPayments.filter((p) => {
      if (!p.received_date) return false;

      if (period === 'Today') {
        return p.received_date === todayStr;
      }
      if (period === 'Week') {
        const d = new Date(p.received_date);
        const diffTime = today.getTime() - d.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (period === 'Month') {
        const currentMonth = todayStr.substring(0, 7);
        return p.received_date.startsWith(currentMonth);
      }
      if (period === 'Year') {
        const currentYear = todayStr.substring(0, 4);
        return p.received_date.startsWith(currentYear);
      }
      return true;
    });
  }, [organizerPayments, period]);

  // Top 4 KPI Metrics
  const totalOrganizerReceived = useMemo(() => {
    return periodFilteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [periodFilteredPayments]);

  const { totalTaskSpend, totalPaid, totalPending } = useMemo(() => {
    let spend = 0;
    let paid = 0;
    let pending = 0;

    periodFilteredTasks.forEach((t) => {
      const tripCrew = [t.driver1, t.driver2, t.helper, t.captain].filter(Boolean);
      const isTripPaid = t.payment_status === 'Paid';

      tripCrew.forEach((c) => {
        const sal = Number(c.salary_amount) || 0;
        const adv = Number(c.advance_amount) || 0;
        const due = Math.max(0, sal - adv);

        spend += sal;
        if (isTripPaid) {
          paid += sal;
        } else {
          paid += adv;
          pending += due;
        }
      });
    });

    return { totalTaskSpend: spend, totalPaid: paid, totalPending: pending };
  }, [periodFilteredTasks]);

  // Category Matrix Metrics
  const categoryMetrics = useMemo(() => {
    const result = {
      Driver: { completedTasks: 0, grossBilled: 0, salary: 0, pending: 0 },
      Helper: { completedTasks: 0, grossBilled: 0, salary: 0, pending: 0 },
      Captain: { completedTasks: 0, grossBilled: 0, salary: 0, pending: 0 }
    };

    periodFilteredTasks.forEach((t) => {
      const isTripPaid = t.payment_status === 'Paid';

      // Drivers (Driver 1 & Driver 2)
      if (t.driver1?.employee_name) {
        result.Driver.completedTasks += 1;
        const sal = Number(t.driver1.salary_amount) || 0;
        const adv = Number(t.driver1.advance_amount) || 0;
        result.Driver.salary += sal;
        if (!isTripPaid) result.Driver.pending += Math.max(0, sal - adv);
      }
      if (t.driver2?.employee_name) {
        result.Driver.completedTasks += 1;
        const sal = Number(t.driver2.salary_amount) || 0;
        const adv = Number(t.driver2.advance_amount) || 0;
        result.Driver.salary += sal;
        if (!isTripPaid) result.Driver.pending += Math.max(0, sal - adv);
      }

      // Helper
      if (t.helper?.employee_name) {
        result.Helper.completedTasks += 1;
        const sal = Number(t.helper.salary_amount) || 0;
        const adv = Number(t.helper.advance_amount) || 0;
        result.Helper.salary += sal;
        if (!isTripPaid) result.Helper.pending += Math.max(0, sal - adv);
      }

      // Captain
      if (t.captain?.employee_name) {
        result.Captain.completedTasks += 1;
        const sal = Number(t.captain.salary_amount) || 0;
        const adv = Number(t.captain.advance_amount) || 0;
        result.Captain.salary += sal;
        if (!isTripPaid) result.Captain.pending += Math.max(0, sal - adv);
      }
    });

    return result;
  }, [periodFilteredTasks]);

  // Staff Ledger Rows (Aggregated per employee)
  const staffLedgerRecords = useMemo(() => {
    const map = new Map<string, {
      id: number | string;
      full_name: string;
      employee_code: string;
      role: 'Driver' | 'Helper' | 'Captain';
      profile_photo?: string;
      tasksHandled: number;
      salaryEarned: number;
      pendingDue: number;
      settledTotal: number;
      trips: any[];
    }>();

    // Initialize map from employees list
    employees.forEach((e) => {
      const role = (e.role === 'Driver' || e.role === 'Helper' || e.role === 'Captain')
        ? e.role
        : 'Driver';

      map.set(e.full_name.trim().toLowerCase(), {
        id: e.id,
        full_name: e.full_name,
        employee_code: e.employee_code || `EMP-${String(e.id).padStart(4, '0')}`,
        role,
        profile_photo: e.profile_photo,
        tasksHandled: 0,
        salaryEarned: 0,
        pendingDue: 0,
        settledTotal: 0,
        trips: []
      });
    });

    // Populate with filtered tasks
    periodFilteredTasks.forEach((t) => {
      const isTripPaid = t.payment_status === 'Paid';

      const crewItems = [
        { data: t.driver1, role: 'Driver' },
        { data: t.driver2, role: 'Driver' },
        { data: t.helper, role: 'Helper' },
        { data: t.captain, role: 'Captain' }
      ];

      crewItems.forEach(({ data, role }) => {
        if (!data || !data.employee_name) return;
        const nameKey = data.employee_name.trim().toLowerCase();

        let record = map.get(nameKey);
        if (!record) {
          record = {
            id: data.employee_id || Date.now(),
            full_name: data.employee_name,
            employee_code: `EMP-${data.employee_name.substring(0, 3).toUpperCase()}`,
            role: role as any,
            tasksHandled: 0,
            salaryEarned: 0,
            pendingDue: 0,
            settledTotal: 0,
            trips: []
          };
          map.set(nameKey, record);
        }

        const sal = Number(data.salary_amount) || 0;
        const adv = Number(data.advance_amount) || 0;
        const due = Math.max(0, sal - adv);

        record.tasksHandled += 1;
        record.salaryEarned += sal;
        if (isTripPaid) {
          record.settledTotal += sal;
        } else {
          record.settledTotal += adv;
          record.pendingDue += due;
        }

        record.trips.push({
          date: t.trip_start_date,
          vehicle_number: t.vehicle_number,
          route_corridor: t.route_corridor,
          service_number: t.service_number,
          salary: sal,
          advance: adv,
          balance_due: due,
          isPaid: isTripPaid
        });
      });
    });

    let records = Array.from(map.values());

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.employee_code.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q)
      );
    }

    // Filter by category matrix filter if not 'All'
    if (matrixCategory !== 'All') {
      records = records.filter((r) => r.role === matrixCategory);
    }

    // Sort by tasks handled DESC, then salary earned DESC
    return records.sort((a, b) => b.tasksHandled - a.tasksHandled || b.salaryEarned - a.salaryEarned);
  }, [employees, periodFilteredTasks, search, matrixCategory]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(staffLedgerRecords.length / rowsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return staffLedgerRecords.slice(start, start + rowsPerPage);
  }, [staffLedgerRecords, currentPage, rowsPerPage]);

  // Save Organizer Payment
  const handleSaveOrganizerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.organizer_name) {
      error('Please select an organizer.');
      return;
    }
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      error('Please enter a valid received amount.');
      return;
    }

    try {
      const created = await api.createOrganizerPayment({
        organizer_name: paymentForm.organizer_name,
        amount: amt,
        received_date: paymentForm.received_date,
        notes: paymentForm.notes
      });
      setOrganizerPayments([created, ...organizerPayments]);
      success(`Recorded ₹${amt.toLocaleString('en-IN')} from ${paymentForm.organizer_name}`);
      setIsRecordModalOpen(false);
      setPaymentForm({
        organizer_name: '',
        amount: '',
        received_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err: any) {
      error('Failed to save organizer payment');
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (staffLedgerRecords.length === 0) {
      error('No financial records to export.');
      return;
    }

    const headers = ['Employee Code', 'Full Name', 'Category', 'Tasks Handled', 'Salary Earned (Rs)', 'Pending Due (Rs)', 'Settled Total (Rs)'];
    const rows = staffLedgerRecords.map((r) => [
      r.employee_code,
      `"${r.full_name}"`,
      r.role,
      r.tasksHandled,
      r.salaryEarned,
      r.pendingDue,
      r.settledTotal
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Charvik_Staff_Earnings_Ledger_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Financial ledger exported to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        {/* Row 1: Title & Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-[#142B4A] tracking-tight">
              Financial &amp; Earnings Analytics
            </h2>
          </div>

          {/* Action Buttons - Always on a clean row with no vertical wrapping */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#142B4A]/5 text-[#142B4A] border border-[#142B4A]/10 whitespace-nowrap">
              Revenue &amp; Margins
            </span>

            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white flex items-center gap-1.5 transition-all shadow-sm hover:shadow cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Organizer Amount</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title="Download Financial Ledger as Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Excel ({staffLedgerRecords.length})</span>
            </button>

            <PrintButton
              title={`Financial & Earnings Analytics Report (${period})`}
              subtitle={`Total Tasks: ${periodFilteredTasks.length} • Task Spend: ₹${totalTaskSpend.toLocaleString('en-IN')}`}
              targetId="earnings-full-analytics-wrap"
              label="Print Report"
              className="px-3.5 py-2 whitespace-nowrap shrink-0"
            />
          </div>
        </div>

        {/* Row 2: Subtitle & Time Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            Detailed financial breakdown of company commissions, staff payouts, and category margins.
          </p>

          {/* Time Filter Pills - Spacious and cleanly separated */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/90 self-start sm:self-auto shrink-0 shadow-2xs">
            {(['Today', 'Week', 'Month', 'Year', 'All'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  period === p
                    ? 'bg-[#142B4A] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Printable Section Wrapper */}
      <div id="earnings-full-analytics-wrap" className="space-y-6">
        {/* Loading Spinner Feedback */}
        {isSwitchingPeriod && (
          <div className="py-14 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold">Updating Financial Statements...</p>
          </div>
        )}

        {/* 1. TOP 4 KPI CARDS (Matching Reference Video) */}
        {!isSwitchingPeriod && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Organizer Amount Received */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Organizer Amount Received
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] tracking-tight">
                  ₹{totalOrganizerReceived.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Collections from organizers</p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Task Spend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Task Spend
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] tracking-tight">
                  ₹{totalTaskSpend.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Salary allocated to tasks</p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60 shadow-2xs">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Pending Task Payments */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pending Task Payments
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  ₹{totalPending.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Salary balance to pay</p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/60 shadow-2xs">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Paid for Tasks */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Paid for Tasks
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Employee task payments</p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* 2. FLEET FINANCIAL MATRIX (Matching Reference Video) */}
        {!isSwitchingPeriod && (
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#142B4A]">Fleet Financial Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revenue, amount received, advance, and pending dues across operational roles.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                {(['All', 'Driver', 'Helper', 'Captain'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMatrixCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      matrixCategory === cat
                        ? 'bg-[#142B4A] text-white shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Driver Category */}
              {(matrixCategory === 'All' || matrixCategory === 'Driver') && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-5 hover:border-blue-400 hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <Bus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#142B4A]">Driver Category</h4>
                        <span className="text-xs font-semibold text-slate-500">
                          {categoryMetrics.Driver.completedTasks} Completed Tasks
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      0% Margin
                    </span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200/80 text-xs font-semibold">
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Gross Billed:</span>
                      <span className="font-mono font-bold text-sm text-slate-800">
                        ₹{categoryMetrics.Driver.grossBilled.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Staff Salary:</span>
                      <span className="font-mono font-bold text-sm text-blue-700">
                        ₹{categoryMetrics.Driver.salary.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Pending Due:</span>
                      <span className="font-mono font-bold text-sm text-rose-600">
                        ₹{categoryMetrics.Driver.pending.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Helper Category */}
              {(matrixCategory === 'All' || matrixCategory === 'Helper') && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-5 hover:border-emerald-400 hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#142B4A]">Helper Category</h4>
                        <span className="text-xs font-semibold text-slate-500">
                          {categoryMetrics.Helper.completedTasks} Completed Tasks
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      0% Margin
                    </span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200/80 text-xs font-semibold">
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Gross Billed:</span>
                      <span className="font-mono font-bold text-sm text-slate-800">
                        ₹{categoryMetrics.Helper.grossBilled.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Staff Salary:</span>
                      <span className="font-mono font-bold text-sm text-emerald-700">
                        ₹{categoryMetrics.Helper.salary.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Pending Due:</span>
                      <span className="font-mono font-bold text-sm text-rose-600">
                        ₹{categoryMetrics.Helper.pending.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Captain Category */}
              {(matrixCategory === 'All' || matrixCategory === 'Captain') && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-5 hover:border-indigo-400 hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#142B4A]">Captain Category</h4>
                        <span className="text-xs font-semibold text-slate-500">
                          {categoryMetrics.Captain.completedTasks} Completed Tasks
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      0% Margin
                    </span>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200/80 text-xs font-semibold">
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Gross Billed:</span>
                      <span className="font-mono font-bold text-sm text-slate-800">
                        ₹{categoryMetrics.Captain.grossBilled.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Staff Salary:</span>
                      <span className="font-mono font-bold text-sm text-indigo-700">
                        ₹{categoryMetrics.Captain.salary.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 py-0.5">
                      <span>Pending Due:</span>
                      <span className="font-mono font-bold text-sm text-rose-600">
                        ₹{categoryMetrics.Captain.pending.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. STAFF FINANCIAL EARNINGS & DUES LEDGER (Matching Reference Video) */}
        {!isSwitchingPeriod && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            {/* Ledger Header */}
            <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#142B4A]">
                  Staff Financial Earnings &amp; Dues Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete breakdown of salary obligations, pending dues, and settled payments.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff name or code..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-medium"
                  />
                </div>

                <span className="text-xs font-bold text-slate-400 shrink-0 whitespace-nowrap">
                  Showing {staffLedgerRecords.length} staff records
                </span>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ minWidth: '1050px' }}>
                <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 min-w-[240px]">EMPLOYEE ID &amp; NAME</th>
                    <th className="py-4 px-5 min-w-[120px]">CATEGORY</th>
                    <th className="py-4 px-5 min-w-[130px]">TASKS HANDLED</th>
                    <th className="py-4 px-5 min-w-[140px]">SALARY EARNED</th>
                    <th className="py-4 px-5 min-w-[140px]">PENDING DUE</th>
                    <th className="py-4 px-5 min-w-[140px]">SETTLED TOTAL</th>
                    <th className="py-4 px-5 text-center min-w-[90px]">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                        <p className="font-semibold text-slate-600 text-sm">No financial ledger entries match this criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try switching the time filter or clearing the search box.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r) => (
                      <tr key={r.full_name} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. EMPLOYEE ID & NAME */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {r.profile_photo ? (
                              <img
                                src={r.profile_photo}
                                alt={r.full_name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-black text-xs shrink-0">
                                {r.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{r.full_name}</p>
                              <span className="font-mono text-[10px] text-slate-400 font-semibold block">
                                {r.employee_code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. CATEGORY */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              r.role === 'Driver'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : r.role === 'Helper'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {r.role}
                          </span>
                        </td>

                        {/* 3. TASKS HANDLED */}
                        <td className="py-4 px-5 font-semibold text-slate-700 whitespace-nowrap">
                          {r.tasksHandled} {r.tasksHandled === 1 ? 'task' : 'tasks'}
                        </td>

                        {/* 4. SALARY EARNED */}
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{r.salaryEarned.toLocaleString('en-IN')}
                        </td>

                        {/* 5. PENDING DUE */}
                        <td className="py-4 px-5 font-mono font-bold text-rose-600 whitespace-nowrap">
                          ₹{r.pendingDue.toLocaleString('en-IN')}
                        </td>

                        {/* 6. SETTLED TOTAL */}
                        <td className="py-4 px-5 font-mono font-bold text-emerald-600 whitespace-nowrap">
                          ₹{r.settledTotal.toLocaleString('en-IN')}
                        </td>

                        {/* 7. ACTION */}
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/employee-payments?name=${encodeURIComponent(r.full_name)}&code=${encodeURIComponent(r.employee_code)}&period=${period}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <span>
                  Showing {staffLedgerRecords.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
                  {Math.min(currentPage * rowsPerPage, staffLedgerRecords.length)} of {staffLedgerRecords.length} records
                </span>

                <div className="flex items-center gap-1 ml-3">
                  <span className="text-slate-400">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Record Organizer Amount (Matching Reference Video) */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Organizer Amount"
        subtitle="Log payment receipt collections from client partner organizations."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveOrganizerPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Organizer *</label>
            <select
              required
              value={paymentForm.organizer_name}
              onChange={(e) => setPaymentForm({ ...paymentForm, organizer_name: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-medium cursor-pointer"
            >
              <option value="">Select organizer</option>
              {organizers.map((o) => (
                <option key={o.id} value={o.organization_name}>
                  {o.organization_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (Rs.) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 50000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Received Date *</label>
              <input
                type="date"
                required
                value={paymentForm.received_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, received_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional reference / invoice number"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white shadow-sm cursor-pointer"
            >
              Save Amount
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Staff Detailed Trip Ledger (When clicking View ↗) */}
      {selectedStaffForLedger && (
        <Modal
          isOpen={Boolean(selectedStaffForLedger)}
          onClose={() => setSelectedStaffForLedger(null)}
          title={`Financial Ledger: ${selectedStaffForLedger.full_name}`}
          subtitle={`Employee Code: ${selectedStaffForLedger.employee_code} • Category: ${selectedStaffForLedger.role}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tasks Handled</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {selectedStaffForLedger.tasksHandled}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Salary Earned</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  ₹{selectedStaffForLedger.salaryEarned.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Due</span>
                <p className="text-lg font-black text-rose-600 mt-0.5">
                  ₹{selectedStaffForLedger.pendingDue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Trip List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {selectedStaffForLedger.trips.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No individual task assignments recorded for this period.
                </p>
              ) : (
                selectedStaffForLedger.trips.map((tr: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{tr.vehicle_number}</span>
                        {tr.service_number && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            {tr.service_number}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">&bull; {tr.date}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{tr.route_corridor}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{tr.salary.toLocaleString('en-IN')}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full mt-0.5 ${
                          tr.isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tr.isPaid ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStaffForLedger(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
