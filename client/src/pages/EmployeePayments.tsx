import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Bus, ShieldCheck, IndianRupee, CheckCircle2, Clock,
  Calendar, Download, MapPin, Hash, AlertCircle, ChevronLeft, ChevronRight, Search,
  Users, ChevronDown, Filter, Wallet, ArrowRight, Receipt, Printer, X,
  Upload, Image as ImageIcon, Eye
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/common/Toast";
import { PrintButton } from "../components/common/PrintButton";
import { printSheet } from "../utils/printSheet";

interface TripEntry {
  id: number | string;
  date: string;
  vehicle_number: string;
  route_corridor: string;
  service_number?: string;
  salary: number;
  advance: number;
  balance_due: number;
  isPaid: boolean;
}

interface RecordedPayment {
  id: string;
  employee_name: string;
  employee_code: string;
  role: string;
  amount: number;
  payment_date: string;
  payment_mode: "Cash" | "Online" | "UPI" | "Bank Transfer";
  payment_type: "Bata" | "Salary" | "Advance";
  payment_proof?: string;
  notes?: string;
  created_at: string;
}

interface EmployeePaymentRecord {
  id: number | string;
  full_name: string;
  employee_code: string;
  role: "Driver" | "Helper" | "Captain";
  profile_photo?: string;
  phone?: string;
  tasksHandled: number;
  salaryEarned: number;
  pendingDue: number;
  settledTotal: number;
  advancePaid: number;
  trips: TripEntry[];
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export const EmployeePayments: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const empName = searchParams.get("name") || "";
  const empCode = searchParams.get("code") || "";
  const periodParam = (searchParams.get("period") || "All") as "Today" | "Week" | "Month" | "Year" | "All";

  const { success, error } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<RecordedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [period, setPeriod] = useState<"Today" | "Week" | "Month" | "Year" | "All">(periodParam);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Settled">("All");
  const [roleFilter, setRoleFilter] = useState<"All" | "Driver" | "Helper" | "Captain">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeLedgerTab, setActiveLedgerTab] = useState<"trips" | "history">("trips");
  const [activeProfileTab, setActiveProfileTab] = useState<"biodata" | "documents">("biodata");
  const rowsPerPage = 10;

  // Record Payment Modal State (Matching User's Reference Screenshot)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState<EmployeePaymentRecord | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment_type: "Bata" as "Bata" | "Salary" | "Advance",
    payment_mode: "Cash" as "Cash" | "Online" | "UPI" | "Bank Transfer",
    payment_proof: "",
    notes: ""
  });
  const [previewProofModal, setPreviewProofModal] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, eData, pData] = await Promise.all([
        api.getTasks().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getEmployeePayments().catch(() => [])
      ]);
      setTasks(Array.isArray(tData) ? tData : []);
      setEmployees(Array.isArray(eData) ? eData : []);
      if (Array.isArray(pData) && pData.length > 0) {
        setPaymentHistory(pData);
      } else {
        try {
          const savedPayments = localStorage.getItem("charvik_employee_recorded_payments");
          if (savedPayments) {
            const parsed = JSON.parse(savedPayments);
            if (Array.isArray(parsed)) setPaymentHistory(parsed);
          }
        } catch {}
      }
    } catch {
      error("Failed to load payment records");
    } finally {
      setLoading(false);
    }
  };

  // Period filtered tasks
  const periodFilteredTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (!t.trip_start_date) return false;
      if (period === "Today") return t.trip_start_date === todayStr;
      if (period === "Week") {
        const diff = (today.getTime() - new Date(t.trip_start_date).getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (period === "Month") return t.trip_start_date.startsWith(todayStr.substring(0, 7));
      if (period === "Year") return t.trip_start_date.startsWith(todayStr.substring(0, 4));
      return true;
    });
  }, [tasks, period]);

  // Aggregate all employee records across registered staff & task rosters
  const allEmployeeRecords = useMemo((): EmployeePaymentRecord[] => {
    const map = new Map<string, EmployeePaymentRecord>();

    // 1. Initialize registered employees
    employees.forEach((emp) => {
      const key = (emp.employee_code || emp.full_name || String(emp.id)).trim().toLowerCase();
      if (!key) return;
      const role: "Driver" | "Helper" | "Captain" =
        emp.role === "Driver" || emp.role === "Helper" || emp.role === "Captain" ? emp.role : "Driver";
      map.set(key, {
        id: emp.id,
        full_name: emp.full_name || "Unknown",
        employee_code: emp.employee_code || "-",
        role,
        profile_photo: emp.profile_photo,
        phone: emp.phone,
        tasksHandled: 0,
        salaryEarned: 0,
        pendingDue: 0,
        settledTotal: 0,
        advancePaid: 0,
        trips: []
      });
    });

    // 2. Accumulate tasks
    periodFilteredTasks.forEach((t) => {
      const isTripPaid = t.payment_status === "Paid";
      const slots: { data: any; defaultRole: "Driver" | "Helper" | "Captain" }[] = [
        { data: t.driver1, defaultRole: "Driver" },
        { data: t.driver2, defaultRole: "Driver" },
        { data: t.helper, defaultRole: "Helper" },
        { data: t.captain, defaultRole: "Captain" }
      ];

      slots.forEach(({ data, defaultRole }) => {
        if (!data || !data.employee_name) return;
        const name = String(data.employee_name).trim();
        const code = (data.employee_code || "").trim();
        const key = (code || name).toLowerCase();

        let rec = map.get(key);
        if (!rec) {
          const byName = Array.from(map.values()).find(
            (r) => r.full_name.toLowerCase() === name.toLowerCase()
          );
          if (byName) {
            rec = byName;
          } else {
            rec = {
              id: key,
              full_name: name,
              employee_code: code || "-",
              role: defaultRole,
              tasksHandled: 0,
              salaryEarned: 0,
              pendingDue: 0,
              settledTotal: 0,
              advancePaid: 0,
              trips: []
            };
            map.set(key, rec);
          }
        }

        const sal = Number(data.salary_amount) || 0;
        const adv = Number(data.advance_amount) || 0;
        const due = isTripPaid ? 0 : Math.max(0, sal - adv);

        rec.tasksHandled += 1;
        rec.salaryEarned += sal;
        rec.advancePaid += adv;
        if (isTripPaid) {
          rec.settledTotal += sal;
        } else {
          rec.settledTotal += adv;
          rec.pendingDue += due;
        }

        rec.trips.push({
          id: t.id,
          date: t.trip_start_date,
          vehicle_number: t.vehicle_number || "-",
          route_corridor: t.route_corridor || "-",
          service_number: t.service_number || "",
          salary: sal,
          advance: adv,
          balance_due: due,
          isPaid: isTripPaid
        });
      });
    });

    const list = Array.from(map.values());
    list.forEach((r) => r.trips.sort((a, b) => b.date.localeCompare(a.date)));
    return list;
  }, [employees, periodFilteredTasks]);

  // Selected employee for detailed ledger
  const selectedEmployeeRecord = useMemo((): EmployeePaymentRecord | null => {
    if (allEmployeeRecords.length === 0) return null;
    if (!empName && !empCode) return allEmployeeRecords[0];
    const nameKey = empName.trim().toLowerCase();
    const codeKey = empCode.trim().toLowerCase();

    return (
      allEmployeeRecords.find((r) => {
        if (codeKey && r.employee_code && r.employee_code.toLowerCase() === codeKey) return true;
        if (nameKey && r.full_name.toLowerCase() === nameKey) return true;
        return false;
      }) || allEmployeeRecords[0]
    );
  }, [allEmployeeRecords, empName, empCode]);

  // Filtered trips for individual employee ledger
  const filteredTrips = useMemo(() => {
    if (!selectedEmployeeRecord) return [];
    let list = [...selectedEmployeeRecord.trips];
    if (statusFilter === "Pending") list = list.filter((t) => !t.isPaid);
    if (statusFilter === "Settled") list = list.filter((t) => t.isPaid);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.vehicle_number.toLowerCase().includes(q) ||
          t.route_corridor.toLowerCase().includes(q) ||
          (t.service_number || "").toLowerCase().includes(q) ||
          t.date.includes(q)
      );
    }
    return list;
  }, [selectedEmployeeRecord, statusFilter, searchQuery]);

  // Filtered recorded payments for selected employee
  const employeePaymentsList = useMemo(() => {
    if (!selectedEmployeeRecord) return [];
    const nameKey = selectedEmployeeRecord.full_name.toLowerCase();
    const codeKey = selectedEmployeeRecord.employee_code.toLowerCase();
    return paymentHistory.filter(
      (p) =>
        p.employee_name.toLowerCase() === nameKey ||
        (p.employee_code && p.employee_code.toLowerCase() === codeKey)
    );
  }, [selectedEmployeeRecord, paymentHistory]);

  // Filtered employees for directory view
  const filteredEmployees = useMemo(() => {
    let list = [...allEmployeeRecords];
    if (roleFilter !== "All") {
      list = list.filter((e) => e.role === roleFilter);
    }
    if (statusFilter === "Pending") {
      list = list.filter((e) => e.pendingDue > 0);
    } else if (statusFilter === "Settled") {
      list = list.filter((e) => e.pendingDue === 0 && e.tasksHandled > 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          (e.phone || "").toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEmployeeRecords, roleFilter, statusFilter, searchQuery]);

  // Pagination for directory
  const totalDirPages = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, currentPage]);

  // Pagination for individual trips
  const totalTripPages = Math.max(1, Math.ceil(filteredTrips.length / rowsPerPage));
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTrips.slice(start, start + rowsPerPage);
  }, [filteredTrips, currentPage]);

  // Directory totals
  const dirTotals = useMemo(() => {
    return allEmployeeRecords.reduce(
      (acc, e) => {
        acc.totalSalary += e.salaryEarned;
        acc.totalAdvance += e.advancePaid;
        acc.totalDue += e.pendingDue;
        acc.totalSettled += e.settledTotal;
        if (e.tasksHandled > 0) acc.activeCount += 1;
        return acc;
      },
      { totalSalary: 0, totalAdvance: 0, totalDue: 0, totalSettled: 0, activeCount: 0 }
    );
  }, [allEmployeeRecords]);

  // Open "Record Payment" modal
  const handleOpenRecordPayment = (staff?: EmployeePaymentRecord | null) => {
    const target = staff || selectedEmployeeRecord || allEmployeeRecords[0] || null;
    setTargetStaff(target);
    setPaymentFormData({
      amount: target && target.pendingDue > 0 ? String(target.pendingDue) : "",
      date: new Date().toISOString().split("T")[0],
      payment_type: "Bata",
      payment_mode: "Cash",
      notes: ""
    });
    setIsRecordModalOpen(true);
  };

  // Process payment deduction from oldest pending tasks
  const handleProcessPayment = (shouldPrint: boolean) => {
    if (!targetStaff) {
      error("Please select an employee.");
      return;
    }
    const payAmount = Number(paymentFormData.amount);
    if (!payAmount || payAmount <= 0) {
      error("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    // 1. Sort employee's tasks by oldest first (trip_start_date ASC)
    const staffName = targetStaff.full_name.trim().toLowerCase();
    const staffCode = targetStaff.employee_code.trim().toLowerCase();

    let remainingToSettle = payAmount;
    const slots: ("driver1" | "driver2" | "helper" | "captain")[] = [
      "driver1", "driver2", "helper", "captain"
    ];

    const sortedTasks = [...tasks].sort((a, b) => {
      const da = a.trip_start_date || "";
      const db = b.trip_start_date || "";
      return da.localeCompare(db);
    });

    const modifiedTaskMap = new Map<string | number, any>();

    for (const t of sortedTasks) {
      if (remainingToSettle <= 0) break;

      for (const slot of slots) {
        if (remainingToSettle <= 0) break;
        const slotData = t[slot];
        if (!slotData || !slotData.employee_name) continue;

        const sName = String(slotData.employee_name).trim().toLowerCase();
        const sCode = (slotData.employee_code || "").trim().toLowerCase();
        const isMatch = sName === staffName || (staffCode && sCode === staffCode);

        if (isMatch) {
          const sal = Number(slotData.salary_amount) || 0;
          const currentAdv = Number(slotData.advance_amount) || 0;
          const due = Math.max(0, sal - currentAdv);

          if (due > 0) {
            const deduction = Math.min(remainingToSettle, due);
            const newAdv = currentAdv + deduction;
            remainingToSettle -= deduction;

            const updatedTask = modifiedTaskMap.get(t.id) || { ...t };
            updatedTask[slot] = {
              ...slotData,
              advance_amount: newAdv
            };

            if (newAdv >= sal) {
              updatedTask.payment_status = "Paid";
            }
            modifiedTaskMap.set(t.id, updatedTask);
          }
        }
      }
    }

    // Apply modified tasks to master tasks array
    const updatedTasks = tasks.map((t) => modifiedTaskMap.get(t.id) || t);
    setTasks(updatedTasks);
    try {
      localStorage.setItem("charvik_trip_duty_management_v2", JSON.stringify(updatedTasks));
    } catch {}

    // Sync each modified task with the backend API
    modifiedTaskMap.forEach((updatedTask) => {
      api.updateTask(updatedTask.id, updatedTask).catch(() => {});
    });

    // Create payment receipt record
    const receiptNo = "REC-" + Date.now().toString().slice(-6);
    const newRecord: RecordedPayment = {
      id: receiptNo,
      employee_name: targetStaff.full_name,
      employee_code: targetStaff.employee_code,
      role: targetStaff.role,
      amount: payAmount,
      payment_date: paymentFormData.date,
      payment_type: paymentFormData.payment_type,
      payment_mode: paymentFormData.payment_mode,
      notes: paymentFormData.notes || undefined,
      created_at: new Date().toISOString()
    };

    const updatedHistory = [newRecord, ...paymentHistory];
    setPaymentHistory(updatedHistory);
    try {
      localStorage.setItem("charvik_employee_recorded_payments", JSON.stringify(updatedHistory));
    } catch {}

    api.createEmployeePayment(newRecord).catch((err: any) => {
      error(err.message || 'Failed to save payment record to database');
    });

    setIsRecordModalOpen(false);
    success(`Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully for ${targetStaff.full_name}!`);

    // If user clicked "Confirm & Print Receipt"
    if (shouldPrint) {
      printSheet({
        title: "CHARVIK FLEET MANAGEMENT - PAYMENT RECEIPT",
        subtitle: `Receipt No: ${receiptNo} | Staff: ${targetStaff.full_name} (${targetStaff.employee_code})`,
        orientation: "portrait",
        htmlContent: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; border-bottom: 2px solid #142B4A; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #142B4A; font-size: 22px;">CHARVIK FLEET MANAGEMENT</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Staff Payment & Advance Receipt</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Receipt Number:</td>
                <td style="padding: 8px 0; font-weight: bold; font-family: monospace; text-align: right;">${receiptNo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Payment Date:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentFormData.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Staff Member:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${targetStaff.full_name} (${targetStaff.employee_code})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Staff Role:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${targetStaff.role}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Payment Type:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentFormData.payment_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Payment Mode:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentFormData.payment_mode}</td>
              </tr>
              ${paymentFormData.notes ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Notes:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentFormData.notes}</td>
              </tr>` : ''}
              <tr style="border-top: 2px dashed #cbd5e1; border-bottom: 2px dashed #cbd5e1;">
                <td style="padding: 14px 0; font-size: 15px; font-weight: bold; color: #142B4A;">Amount Paid:</td>
                <td style="padding: 14px 0; font-size: 18px; font-weight: 900; color: #047857; text-align: right;">₹${payAmount.toLocaleString("en-IN")}</td>
              </tr>
            </table>
            <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #64748b;">
              <div>
                <p style="margin: 0; border-top: 1px solid #cbd5e1; padding-top: 6px; width: 140px; text-align: center;">Staff Signature</p>
              </div>
              <div>
                <p style="margin: 0; border-top: 1px solid #cbd5e1; padding-top: 6px; width: 140px; text-align: center;">Authorized Signatory</p>
              </div>
            </div>
          </div>
        `
      });
    }
  };

  // Export CSV for individual employee
  const handleExportIndividualCSV = () => {
    if (!selectedEmployeeRecord || filteredTrips.length === 0) {
      error("No trip records to export.");
      return;
    }
    const headers = [
      "S.No",
      "Date",
      "Vehicle Number",
      "Service Number",
      "Route Corridor",
      "Salary (Rs)",
      "Advance Paid (Rs)",
      "Balance Due (Rs)",
      "Payment Status"
    ];
    const rows = filteredTrips.map((t, i) => [
      i + 1,
      t.date,
      t.vehicle_number,
      t.service_number || "-",
      `"${t.route_corridor}"`,
      t.salary,
      t.advance,
      t.balance_due,
      t.isPaid ? "Settled" : "Pending"
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `${selectedEmployeeRecord.full_name}_Payment_Ledger_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported payment ledger for ${selectedEmployeeRecord.full_name}`);
  };

  // Export CSV for all employees directory
  const handleExportAllCSV = () => {
    if (filteredEmployees.length === 0) {
      error("No employee records to export.");
      return;
    }
    const headers = [
      "S.No",
      "Employee Name",
      "Employee Code",
      "Role",
      "Phone",
      "Tasks Handled",
      "Gross Salary (Rs)",
      "Advance Paid (Rs)",
      "Balance Due (Rs)",
      "Settlement Status"
    ];
    const rows = filteredEmployees.map((e, i) => [
      i + 1,
      `"${e.full_name}"`,
      e.employee_code,
      e.role,
      e.phone || "-",
      e.tasksHandled,
      e.salaryEarned,
      e.advancePaid,
      e.pendingDue,
      e.pendingDue === 0 ? "Settled" : "Pending Due"
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `All_Employee_Payments_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported all employee payments ledger`);
  };

  const handleSelectEmployee = (record: EmployeePaymentRecord) => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("All");
    setActiveLedgerTab("trips");
    navigate(`/admin/employee-payments?name=${encodeURIComponent(record.full_name)}&code=${encodeURIComponent(record.employee_code)}&period=${period}`);
  };

  const handleClearSelection = () => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("All");
    navigate(`/admin/employee-payments?period=${period}`);
  };

  const roleStyles = {
    Driver: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconText: "text-blue-700",
      Icon: Bus
    },
    Helper: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      Icon: User
    },
    Captain: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-700",
      Icon: ShieldCheck
    }
  };

  const r = selectedEmployeeRecord;
  const rawEmp = useMemo(() => {
    if (!r) return null;
    return (
      employees.find(
        (e) =>
          e.id === r.id ||
          (e.employee_code && e.employee_code === r.employee_code) ||
          (e.full_name && e.full_name.toLowerCase() === r.full_name.toLowerCase())
      ) || null
    );
  }, [employees, r]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Payment Records...</p>
        </div>
      </div>
    );
  }

  const handlePrintBiodata = () => {
    if (!r) return;
    printSheet({
      title: `${r.full_name} - Employee Biodata`,
      subtitle: `Official Employee Record | Code: ${r.employee_code} | Role: ${r.role}`,
      orientation: "portrait",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <div style="border-bottom: 2px solid #142B4A; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="margin: 0; font-size: 22px; color: #142B4A; font-weight: 900;">${r.full_name}</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Official Employee Record</p>
            </div>
            <div style="text-align: right;">
              <span style="background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #bfdbfe;">
                ${r.role}
              </span>
              <p style="margin: 4px 0 0; font-size: 11px; font-family: monospace; color: #94a3b8;">${r.employee_code}</p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; width: 25%; color: #64748b;">FULL NAME:</td>
              <td style="padding: 8px 12px; font-weight: 600; width: 25%;">${r.full_name}</td>
              <td style="padding: 8px 12px; font-weight: bold; width: 25%; color: #64748b;">ROLE:</td>
              <td style="padding: 8px 12px; font-weight: 600; width: 25%;">${r.role}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">CONTACT NUMBER:</td>
              <td style="padding: 8px 12px; font-weight: 600;">${rawEmp?.phone_number || r.phone || "-"}</td>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">GENDER:</td>
              <td style="padding: 8px 12px; font-weight: 600;">${rawEmp?.gender || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">EMAIL:</td>
              <td style="padding: 8px 12px; font-weight: 600;">${rawEmp?.email || "-"}</td>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">DATE OF BIRTH:</td>
              <td style="padding: 8px 12px; font-weight: 600;">${rawEmp?.date_of_birth || "-"}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">BLOOD GROUP:</td>
              <td style="padding: 8px 12px; font-weight: 600;">-</td>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">NATIONALITY:</td>
              <td style="padding: 8px 12px; font-weight: 600;">Indian</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">RESIDENTIAL ADDRESS:</td>
              <td colspan="3" style="padding: 8px 12px; font-weight: 600;">${rawEmp?.branch || "-"}</td>
            </tr>
          </table>

          <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
              <div style="font-size: 11px; font-weight: bold; color: #92400e;">TOTAL SALARY EARNED</div>
              <div style="font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 4px;">₹${r.salaryEarned.toLocaleString("en-IN")}</div>
            </div>
            <div style="flex: 1; padding: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
              <div style="font-size: 11px; font-weight: bold; color: #065f46;">TOTAL PAID</div>
              <div style="font-size: 18px; font-weight: 900; color: #047857; margin-top: 4px;">₹${r.advancePaid.toLocaleString("en-IN")}</div>
            </div>
            <div style="flex: 1; padding: 14px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
              <div style="font-size: 11px; font-weight: bold; color: #9f1239;">REMAINING DUE</div>
              <div style="font-size: 18px; font-weight: 900; color: #e11d48; margin-top: 4px;">₹${r.pendingDue.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      `
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* CONDITIONAL CONTENT: MODE 1 (INDIVIDUAL) vs MODE 2 (ALL) */}
      {/* ========================================================= */}
      {r ? (
        /* ========================================== */
        /* VIEW MODE 1: EXACT MATCH TO REFERENCE VIDEO */
        /* ========================================== */
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all shadow-2xs cursor-pointer shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {r.full_name} - Employee Profile
                  </h1>
                  {/* Switch Staff Dropdown */}
                  <select
                    value={r.employee_code || r.full_name}
                    onChange={(e) => {
                      const target = allEmployeeRecords.find(
                        (x) => (x.employee_code || x.full_name) === e.target.value
                      );
                      if (target) handleSelectEmployee(target);
                    }}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs outline-none cursor-pointer"
                    title="Switch Staff Member"
                  >
                    {allEmployeeRecords.map((x) => (
                      <option key={x.id + x.full_name} value={x.employee_code || x.full_name}>
                        {x.full_name} ({x.role})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Official employee record</p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenRecordPayment(r)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={handlePrintBiodata}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Biodata</span>
              </button>
            </div>
          </div>

          {/* Tab Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveProfileTab("biodata")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeProfileTab === "biodata"
                  ? "bg-[#142B4A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              Biodata Sheet
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab("documents")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeProfileTab === "documents"
                  ? "bg-[#142B4A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              Profile Sheet (Documents)
            </button>
          </div>

          {/* TAB 1: Biodata Sheet */}
          {activeProfileTab === "biodata" && (
            <div className="space-y-6">
              {/* Employee Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3.5 gap-x-8 text-xs">
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">FULL NAME: </span>
                    <span className="font-semibold text-slate-800">{r.full_name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">ROLE: </span>
                    <span className="font-semibold text-slate-800">{r.role}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">CONTACT NUMBER: </span>
                    <span className="font-semibold text-slate-800">{rawEmp?.phone_number || r.phone || "-"}</span>
                  </div>

                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">GENDER: </span>
                    <span className="font-semibold text-slate-800">{rawEmp?.gender || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">EMAIL: </span>
                    <span className="font-semibold text-slate-800">{rawEmp?.email || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">DATE OF BIRTH: </span>
                    <span className="font-semibold text-slate-800">{rawEmp?.date_of_birth || "-"}</span>
                  </div>

                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">BLOOD GROUP: </span>
                    <span className="font-semibold text-slate-800">-</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#142B4A] uppercase">NATIONALITY: </span>
                    <span className="font-semibold text-slate-800">Indian</span>
                  </div>
                  <div></div>

                  <div className="md:col-span-3">
                    <span className="font-bold text-[#142B4A] uppercase">RESIDENTIAL ADDRESS: </span>
                    <span className="font-semibold text-slate-800">{rawEmp?.branch || "-"}</span>
                  </div>
                </div>
              </div>

              {/* 3 KPI Summary Cards (Charvik Website Brand Palette) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* TOTAL SALARY EARNED */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
                  <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL SALARY EARNED</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1">
                    ₹{r.salaryEarned.toLocaleString("en-IN")}
                  </h3>
                  <span className="inline-block mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    Billed Staff Fees
                  </span>
                </div>

                {/* TOTAL PAID */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
                  <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL PAID</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    ₹{r.advancePaid.toLocaleString("en-IN")}
                  </h3>
                  <span className="inline-block mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Salary – Remaining Due
                  </span>
                </div>

                {/* REMAINING DUE */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
                  <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">REMAINING DUE</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                    ₹{r.pendingDue.toLocaleString("en-IN")}
                  </h3>
                  <span className="inline-block mt-2 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    Pending Payment
                  </span>
                </div>
              </div>

              {/* Records of Trips */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3">Records of Trips</h3>
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs" style={{ minWidth: "750px" }}>
                      <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-5">DATE</th>
                          <th className="py-3.5 px-5">TASK DETAILS</th>
                          <th className="py-3.5 px-5">VEHICLE NO.</th>
                          <th className="py-3.5 px-5">SALARY AMOUNT</th>
                          <th className="py-3.5 px-5">PAID AMOUNT</th>
                          <th className="py-3.5 px-5">REMAINING DUE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {paginatedTrips.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                              No trip records found for this employee.
                            </td>
                          </tr>
                        ) : (
                          paginatedTrips.map((trip, idx) => {
                            const formattedDate = (() => {
                              if (!trip.date) return "-";
                              const parts = trip.date.split("-");
                              if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                              return trip.date;
                            })();

                            return (
                              <tr key={String(trip.id) + idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-5 font-medium whitespace-nowrap text-slate-600">
                                  {formattedDate}
                                </td>
                                <td className="py-3.5 px-5 font-medium text-slate-800">
                                  {trip.route_corridor}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {trip.vehicle_number}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  ₹{trip.salary.toLocaleString("en-IN")}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-bold text-emerald-600 whitespace-nowrap">
                                  ₹{trip.advance.toLocaleString("en-IN")}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-bold text-rose-600 whitespace-nowrap">
                                  ₹{trip.balance_due.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Showing {filteredTrips.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-
                      {Math.min(currentPage * rowsPerPage, filteredTrips.length)} of {filteredTrips.length}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="font-bold text-slate-800">
                        {currentPage} / {totalTripPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalTripPages, p + 1))}
                        disabled={currentPage === totalTripPages}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Records of Payments */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3">Records of Payments</h3>
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs" style={{ minWidth: "750px" }}>
                      <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-5">#</th>
                          <th className="py-3.5 px-5">DATE</th>
                          <th className="py-3.5 px-5">AMOUNT PAID</th>
                          <th className="py-3.5 px-5">TYPE</th>
                          <th className="py-3.5 px-5">MODE</th>
                          <th className="py-3.5 px-5">PROOF</th>
                          <th className="py-3.5 px-5">NOTES</th>
                          <th className="py-3.5 px-5 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {employeePaymentsList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                              No payment records found.
                            </td>
                          </tr>
                        ) : (
                          employeePaymentsList.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-5 font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">{p.payment_date || (p as any).date}</td>
                              <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {p.payment_type}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">{p.payment_mode}</td>
                              <td className="py-3.5 px-5">
                                {p.payment_proof ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProofModal(p.payment_proof!)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="View Proof Photo"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500">{p.notes || "-"}</td>
                              <td className="py-3.5 px-5 text-center">
                                <button
                                  onClick={() => handlePrintReceipt(p)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Print Receipt"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Profile Sheet (Documents) */}
          {activeProfileTab === "documents" && (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Profile Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">Official compliance verification and identity records</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Aadhaar */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Aadhaar Card</span>
                  <p className="text-xs font-mono font-semibold text-slate-600">{rawEmp?.aadhaar_number || "Not on file"}</p>
                  {rawEmp?.aadhaar_front_doc ? (
                    <a
                      href={rawEmp.aadhaar_front_doc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached</span>
                  )}
                </div>

                {/* PAN */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">PAN Card</span>
                  <p className="text-xs font-mono font-semibold text-slate-600">{rawEmp?.pan_number || "Not on file"}</p>
                  {rawEmp?.pan_doc ? (
                    <a
                      href={rawEmp.pan_doc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached</span>
                  )}
                </div>

                {/* Driving Licence */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Driving Licence</span>
                  <p className="text-xs font-mono font-semibold text-slate-600">{rawEmp?.licence_number || "Not on file"}</p>
                  {rawEmp?.licence_front_doc ? (
                    <a
                      href={rawEmp.licence_front_doc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached</span>
                  )}
                </div>

                {/* Bank Proof */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Bank Account</span>
                  <p className="text-xs font-mono font-semibold text-slate-600">
                    {rawEmp?.bank_name ? `${rawEmp.bank_name} (${rawEmp.account_number || "-"})` : "Not on file"}
                  </p>
                  {rawEmp?.bank_proof_doc ? (
                    <a
                      href={rawEmp.bank_proof_doc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ========================================== */
        /* VIEW MODE 2: ALL EMPLOYEES DIRECTORY       */
        /* ========================================== */
        <>
          {/* Top Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black shadow-xs border border-blue-100/60">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-[#142B4A] tracking-tight">Employee Payments</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track salary accruals, advances paid, and settlement dues across all drivers, helpers, and captains.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
                  {(["Today", "Week", "Month", "Year", "All"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setCurrentPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        period === p
                          ? "bg-[#142B4A] text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* ₹ RECORD PAYMENT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-[#E6F9F0] text-[#065F46] border border-emerald-300 hover:bg-[#D1F5E4] hover:border-emerald-400 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    title="Record new payment for staff"
                  >
                    <span className="text-sm font-black text-emerald-600">₹</span>
                    <span>Record Payment</span>
                  </button>

                  <button
                    onClick={handleExportAllCSV}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                  <PrintButton
                    title="All Employee Payments Ledger"
                    subtitle={`Period: ${period} | Total Staff: ${allEmployeeRecords.length}`}
                    targetId="all-employee-payments-print-wrapper"
                    label="Print Sheet"
                    className="px-3.5 py-2 whitespace-nowrap"
                  />
                </div>
              </div>
            </div>
          </div>

          <div id="all-employee-payments-print-wrapper" className="space-y-6">
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-sm transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff</p>
                  <h3 className="text-3xl font-black text-[#142B4A]">{dirTotals.activeCount}</h3>
                  <p className="text-xs text-slate-400 font-medium">Of {allEmployeeRecords.length} registered</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-sm transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Salaries</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] tracking-tight">
                    ₹{dirTotals.totalSalary.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Assigned trip pay</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/60">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-sm transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advances Disbursed</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                    ₹{dirTotals.totalAdvance.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Pre-paid amounts</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100/60">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-sm transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Dues</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                    ₹{dirTotals.totalDue.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Balance to settle</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/60">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Directory Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Filters Bar */}
              <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Role filter */}
                  <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {(["All", "Driver", "Helper", "Captain"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRoleFilter(r);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          roleFilter === r
                            ? "bg-[#142B4A] text-white shadow-xs font-extrabold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        {r === "All" ? "All Roles" : `${r}s`}
                      </button>
                    ))}
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {(["All", "Pending", "Settled"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStatusFilter(s);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === s
                            ? "bg-[#142B4A] text-white shadow-xs font-extrabold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        {s === "All" ? "All Status" : s === "Pending" ? "Pending Due" : "Settled"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search staff, code, phone..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none w-64 font-medium"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    {filteredEmployees.length} personnel
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" style={{ minWidth: "1050px" }}>
                  <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6 min-w-[60px]">S.NO</th>
                      <th className="py-4 px-5 min-w-[220px]">EMPLOYEE</th>
                      <th className="py-4 px-5 min-w-[120px]">ROLE</th>
                      <th className="py-4 px-5 min-w-[130px]">PHONE</th>
                      <th className="py-4 px-5 text-center min-w-[110px]">TASKS</th>
                      <th className="py-4 px-5 min-w-[130px]">GROSS SALARY</th>
                      <th className="py-4 px-5 min-w-[130px]">ADVANCE PAID</th>
                      <th className="py-4 px-5 min-w-[130px]">BALANCE DUE</th>
                      <th className="py-4 px-5 text-center min-w-[120px]">STATUS</th>
                      <th className="py-4 px-6 text-center min-w-[180px]">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="font-semibold text-slate-600 text-sm">No employee payment records found.</p>
                          <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or period filter.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp, idx) => {
                        const sNo = (currentPage - 1) * rowsPerPage + idx + 1;
                        const rc = roleStyles[emp.role] || roleStyles.Driver;
                        const RoleIcon = rc.Icon;
                        const isSettled = emp.pendingDue === 0;

                        return (
                          <tr key={emp.employee_code + emp.full_name + idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center">
                                {sNo}
                              </span>
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {emp.profile_photo ? (
                                  <img
                                    src={emp.profile_photo}
                                    alt={emp.full_name}
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-[#142B4A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                    {emp.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{emp.full_name}</p>
                                  <span className="font-mono text-[11px] text-slate-400 font-semibold">
                                    {emp.employee_code}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${rc.bg} ${rc.text} ${rc.border}`}
                              >
                                <RoleIcon className="w-3.5 h-3.5" />
                                {emp.role}
                              </span>
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-medium">
                              {emp.phone || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                                {emp.tasksHandled}
                              </span>
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap font-mono font-bold text-slate-900">
                              ₹{emp.salaryEarned.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap font-mono font-bold text-blue-700">
                              ₹{emp.advancePaid.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span
                                className={`font-mono font-bold ${
                                  emp.pendingDue > 0 ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                ₹{emp.pendingDue.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center whitespace-nowrap">
                              {isSettled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                {/* ₹ Record Payment quick button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPayment(emp)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-black bg-[#E6F9F0] text-[#065F46] border border-emerald-300 hover:bg-[#D1F5E4] cursor-pointer shadow-2xs"
                                  title="Record payment for this staff"
                                >
                                  <span className="font-black text-emerald-600">₹</span>
                                  <span>Pay</span>
                                </button>

                                {/* View Ledger button */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectEmployee(emp)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-2xs border border-blue-200 cursor-pointer"
                                >
                                  <span>View Ledger</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {paginatedEmployees.length > 0 && (
                    <tfoot className="bg-[#142B4A]/5 border-t-2 border-[#142B4A]/20">
                      <tr>
                        <td colSpan={5} className="py-4 px-6 font-extrabold text-[#142B4A] text-xs uppercase tracking-wide">
                          Page Total ({paginatedEmployees.length} personnel)
                        </td>
                        <td className="py-4 px-5 font-mono font-black text-slate-900 text-xs">
                          ₹{paginatedEmployees.reduce((s, e) => s + e.salaryEarned, 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-5 font-mono font-black text-blue-700 text-xs">
                          ₹{paginatedEmployees.reduce((s, e) => s + e.advancePaid, 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-5 font-mono font-black text-rose-600 text-xs">
                          ₹{paginatedEmployees.reduce((s, e) => s + e.pendingDue, 0).toLocaleString("en-IN")}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination */}
              <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
                <span>
                  Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{" "}
                  {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} personnel
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {currentPage} of {totalDirPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalDirPages, p + 1))}
                    disabled={currentPage === totalDirPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================================= */}
      {/* EXACT RECORD PAYMENT MODAL (ALWAYS RENDERED FOR BOTH MODES TO GUARANTEE IT OPENS)         */}
      {/* ========================================================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsRecordModalOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-slate-200/90 z-10 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Charvik Navy Gradient Header Matching Website Theme */}
            <div className="bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] text-white px-6 py-5 border-b border-blue-900/40 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Record Payment for {targetStaff?.full_name || "Staff Member"}
                </h2>
                {targetStaff && (
                  <p className="text-xs text-blue-200 font-medium mt-0.5">
                    {targetStaff.role} &nbsp;•&nbsp; {targetStaff.employee_code}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessPayment(false);
              }}
              className="p-6 sm:p-7 space-y-4"
            >
              {/* Informational Subtitle */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 font-medium leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Recording a payment will automatically deduct from the employee's oldest pending tasks until the amount is exhausted.
                </span>
              </div>

              {/* Payment Amount (₹) */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Payment Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#142B4A] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition-all"
                  />
                </div>
              </div>

              {/* Date & Payment Type Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#142B4A] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-900 bg-white transition-all"
                  />
                </div>

                {/* Payment Type */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Payment Type
                  </label>
                  <select
                    value={paymentFormData.payment_type}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        payment_type: e.target.value as "Bata" | "Salary" | "Advance"
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-[#142B4A] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-slate-900 bg-white cursor-pointer shadow-2xs transition-all"
                  >
                    <option value="Bata">Bata</option>
                    <option value="Salary">Salary</option>
                    <option value="Advance">Advance</option>
                  </select>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentFormData.payment_mode}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      payment_mode: e.target.value as "Cash" | "Online" | "UPI" | "Bank Transfer"
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-[#142B4A] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-slate-900 bg-white cursor-pointer shadow-2xs transition-all"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Payment Proof Photo Upload (Shown for Online, UPI, Bank Transfer - Hidden for Cash) */}
              {paymentFormData.payment_mode !== "Cash" && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Payment Proof (Photo Upload)
                  </label>
                  {paymentFormData.payment_proof ? (
                    <div className="rounded-2xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={paymentFormData.payment_proof}
                          alt="Payment proof"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewProofModal(paymentFormData.payment_proof)}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Proof attached</p>
                          <p className="text-[11px] text-slate-500">Click to preview image</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewProofModal(paymentFormData.payment_proof)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentFormData({ ...paymentFormData, payment_proof: "" })}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#142B4A] bg-slate-50/70 hover:bg-blue-50/30 cursor-pointer transition-all group">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#142B4A] transition-colors mb-1" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#142B4A]">
                        Upload Payment Proof / Screenshot
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, JPEG up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              error("File size must be under 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPaymentFormData((prev) => ({
                                ...prev,
                                payment_proof: reader.result as string
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Notes (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Any reference number or notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#142B4A] focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all"
                />
              </div>

              {/* Action Buttons (Website Brand Palette) */}
              <div className="pt-3 flex flex-col items-end gap-2.5">
                {/* Row 1: Cancel + Confirm Payment */}
                <div className="flex items-center justify-end gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Confirm Payment
                  </button>
                </div>

                {/* Row 2: Confirm & Print Receipt */}
                <button
                  type="button"
                  onClick={() => handleProcessPayment(true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Confirm & Print Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Photo Fullscreen Modal */}
      {previewProofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewProofModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Payment Verification Photo</span>
              <button
                onClick={() => setPreviewProofModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3 flex items-center justify-center">
              <img
                src={previewProofModal}
                alt="Payment proof full"
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
