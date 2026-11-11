import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Edit,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  QrCode,
  Calendar,
  X,
  CreditCard,
  Upload,
  Eye,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { numberToWordsIndian } from '../utils/numberToWords';

export interface RecordItem {
  id: string;
  description: string; // Description of Services
  category: string; // Driver / Helper / Captain / Cleaner / etc.
  staff_count: number; // No of Drivers/Cleaners/captain
  salary_paid: number; // Salary paid ₹
}

export interface ServiceRecord {
  id: number;
  record_number: string;
  record_date: string;
  period_month: string;
  bill_to_name: string;
  bill_to_address: string;
  bill_to_phone: string;
  bill_to_pan: string;
  items: RecordItem[];
  total_staff_count: number;
  total_amount: number;
  amount_in_words: string;
  received_amount: number;
  balance_amount: number;
  payment_status: 'Pending' | 'Partial' | 'Paid';
  bank_name: string;
  bank_account_name: string;
  bank_account_no: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  qr_code_url: string;
  remarks: string;
  created_at?: string;
}

const DEFAULT_BANK_DETAILS = {
  bank_name: 'Kotak Mahindra Bank, VANASTHALIPURAM HYDERABAD',
  bank_account_name: 'Charvik Staffing Consultancy',
  bank_account_no: '2848153146',
  bank_ifsc: 'KKBK0007460',
  bank_branch: 'Vanasthalipuram, Hyderabad',
  upi_id: '9505151527@ybl'
};

export const RECORD_CATEGORIES = ['Driver', 'Helper', 'Captain'];

export const RecordManagement: React.FC = () => {
  const { success, error } = useToast();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<ServiceRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceRecord>>({
    record_number: '',
    record_date: new Date().toISOString().split('T')[0],
    period_month: '',
    bill_to_name: '',
    bill_to_address: '',
    bill_to_phone: '',
    bill_to_pan: '',
    items: [],
    received_amount: 0,
    payment_status: 'Pending',
    ...DEFAULT_BANK_DETAILS,
    qr_code_url: '',
    remarks: ''
  });

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Load records
  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await api.getRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.record_number.toLowerCase().includes(q) ||
        r.bill_to_name.toLowerCase().includes(q) ||
        (r.period_month && r.period_month.toLowerCase().includes(q)) ||
        (r.bill_to_phone && r.bill_to_phone.toLowerCase().includes(q)) ||
        r.items.some(
          (item) =>
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      if (statusFilter !== 'All' && r.payment_status !== statusFilter) return false;

      if (monthFilter !== 'All' && r.period_month !== monthFilter) return false;

      if (categoryFilter !== 'All' && !r.items.some((item) => item.category === categoryFilter)) return false;

      return true;
    });
  }, [records, search, statusFilter, monthFilter, categoryFilter]);

  // Unique periods for filter
  const uniquePeriods = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.period_month?.trim()) set.add(r.period_month.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = records.length;
    let totalStaff = 0;
    let totalBilled = 0;
    let totalReceived = 0;
    let totalBalance = 0;

    records.forEach((r) => {
      totalStaff += Number(r.total_staff_count || 0);
      totalBilled += Number(r.total_amount || 0);
      totalReceived += Number(r.received_amount || 0);
      totalBalance += Number(r.balance_amount || 0);
    });

    return { totalCount, totalStaff, totalBilled, totalReceived, totalBalance };
  }, [records]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingRecord(null);
    const newId = Date.now();
    const nextRecNo = `REC-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, '0')}`;
    setFormData({
      record_number: nextRecNo,
      record_date: new Date().toISOString().split('T')[0],
      period_month: '',
      bill_to_name: '',
      bill_to_address: '',
      bill_to_phone: '',
      bill_to_pan: '',
      items: [
        {
          id: String(Date.now()),
          description: '',
          category: 'Driver',
          staff_count: 0,
          salary_paid: 0
        }
      ],
      received_amount: 0,
      payment_status: 'Pending',
      ...DEFAULT_BANK_DETAILS,
      qr_code_url: '',
      remarks: ''
    });
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: ServiceRecord) => {
    setEditingRecord(rec);
    setFormData({
      ...rec,
      items: rec.items && rec.items.length > 0 ? rec.items : [
        {
          id: String(Date.now()),
          description: '',
          category: 'Driver',
          staff_count: 0,
          salary_paid: 0
        }
      ]
    });
    setIsAddEditOpen(true);
  };

  // Line item helpers
  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: String(Date.now() + Math.random()),
          description: '',
          category: 'Driver',
          staff_count: 0,
          salary_paid: 0
        }
      ]
    }));
  };

  const handleRemoveItemRow = (id: string) => {
    if ((formData.items || []).length <= 1) {
      error('At least one service row is required.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((item) => item.id !== id)
    }));
  };

  const handleUpdateItem = (id: string, field: keyof RecordItem, value: any) => {
    setFormData((prev) => {
      const updated = (prev.items || []).map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return { ...prev, items: updated };
    });
  };

  // Dynamic Tally for current form data
  const formCalculations = useMemo(() => {
    const items = formData.items || [];
    let staffCount = 0;
    let totalAmt = 0;

    items.forEach((item) => {
      staffCount += Number(item.staff_count || 0);
      totalAmt += Number(item.salary_paid || 0);
    });

    const words = numberToWordsIndian(totalAmt);
    const received = Number(formData.received_amount || 0);
    const balance = Math.max(0, totalAmt - received);
    let status: 'Pending' | 'Partial' | 'Paid' = 'Pending';
    if (received >= totalAmt && totalAmt > 0) status = 'Paid';
    else if (received > 0) status = 'Partial';

    return { staffCount, totalAmt, words, balance, status };
  }, [formData.items, formData.received_amount]);

  // Handle Save
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');

    if (!formData.bill_to_name?.trim()) {
      if (!isUserAdmin) {
        error('Please enter Bill To (Client / Company Name).');
        return;
      }
      formData.bill_to_name = 'General Client';
    }

    let items = (formData.items || []).filter((i) => i.description.trim() || i.salary_paid > 0);
    if (items.length === 0) {
      if (!isUserAdmin) {
        error('Please add at least one valid service item row.');
        return;
      }
      items = [{
        id: 1,
        sl_no: 1,
        description: 'Staffing & Support Services',
        staff_count: 1,
        rate_per_staff: 0,
        salary_paid: 0,
        gst_percent: 0,
        total_amount: 0
      }];
    }

    const totalAmt = formCalculations.totalAmt;
    const staffCount = formCalculations.staffCount;
    const words = formCalculations.words;
    const balance = formCalculations.balance;
    const autoStatus = formCalculations.status;

    const recordPayload: ServiceRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      record_number: formData.record_number?.trim() || `REC-${Date.now()}`,
      record_date: formData.record_date || new Date().toISOString().split('T')[0],
      period_month: formData.period_month?.trim() || '',
      bill_to_name: formData.bill_to_name.trim(),
      bill_to_address: formData.bill_to_address?.trim() || '',
      bill_to_phone: formData.bill_to_phone?.trim() || '',
      bill_to_pan: formData.bill_to_pan?.trim() || '',
      items,
      total_staff_count: staffCount,
      total_amount: totalAmt,
      amount_in_words: words,
      received_amount: Number(formData.received_amount || 0),
      balance_amount: balance,
      payment_status: formData.payment_status || autoStatus,
      bank_name: formData.bank_name || DEFAULT_BANK_DETAILS.bank_name,
      bank_account_name: formData.bank_account_name || DEFAULT_BANK_DETAILS.bank_account_name,
      bank_account_no: formData.bank_account_no || DEFAULT_BANK_DETAILS.bank_account_no,
      bank_ifsc: formData.bank_ifsc || DEFAULT_BANK_DETAILS.bank_ifsc,
      bank_branch: formData.bank_branch || DEFAULT_BANK_DETAILS.bank_branch,
      upi_id: formData.upi_id || DEFAULT_BANK_DETAILS.upi_id,
      qr_code_url: formData.qr_code_url || '',
      remarks: formData.remarks || ''
    };

    try {
      if (editingRecord) {
        await api.updateRecord(editingRecord.id, recordPayload);
        setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? recordPayload : r)));
        success(`Record ${recordPayload.record_number} updated successfully!`);
      } else {
        await api.createRecord(recordPayload);
        setRecords((prev) => [recordPayload, ...prev]);
        success(`Record ${recordPayload.record_number} created successfully!`);
      }
      setIsAddEditOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to save record.');
    }
  };

  // Handle Delete
  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this billing record?')) return;
    try {
      await api.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      success('Record deleted.');
    } catch (err: any) {
      error(err.message || 'Failed to delete record.');
    }
  };

  // Trigger High-Quality Isolated Iframe Print
  const handlePrint = () => {
    const printContent = document.getElementById('charvik-official-record-sheet');
    if (!printContent) {
      window.print();
      return;
    }

    // Create a hidden isolated iframe to guarantee no viewport clipping from modal or body overflow
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all stylesheets and style elements to retain exact Tailwind design
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Charvik Official Record - ${printingRecord?.record_number || 'Sheet'}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              overflow: visible !important;
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #isolated-print-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #charvik-official-record-sheet {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
            }
          </style>
        </head>
        <body>
          <div id="isolated-print-wrapper">
            ${printContent.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow resources/fonts/images to settle before invoking native print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Iframe print error, falling back to window.print()', e);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 1500);
      }
    }, 400);
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    try {
      const csvLines: string[] = [];
      csvLines.push(`"CHARVIK STAFFING CONSULTANCY - BILLING & SERVICE RECORDS"`);
      csvLines.push(`"Exported At","${new Date().toLocaleString()}"`);
      csvLines.push(`"Total Records","${filteredRecords.length}"`);
      csvLines.push('');

      const headers = [
        'S.No',
        'Record Number',
        'Record Date',
        'Billing Period',
        'Billed To',
        'Address',
        'Phone',
        'PAN/GST',
        'Total Staff',
        'Total Amount (Rs)',
        'Received Amount (Rs)',
        'Balance Due (Rs)',
        'Payment Status',
        'Bank Name',
        'IFSC Code',
        'Account No',
        'UPI ID'
      ];
      csvLines.push(headers.map((h) => `"${h}"`).join(','));

      filteredRecords.forEach((r, idx) => {
        const row = [
          idx + 1,
          r.record_number,
          r.record_date,
          r.period_month || '',
          r.bill_to_name,
          r.bill_to_address || '',
          r.bill_to_phone || '',
          r.bill_to_pan || '',
          r.total_staff_count,
          r.total_amount,
          r.received_amount,
          r.balance_amount,
          r.payment_status,
          r.bank_name || '',
          r.bank_ifsc || '',
          r.bank_account_no || '',
          r.upi_id || ''
        ];
        csvLines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Charvik_Records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Exported records to Excel / CSV.');
    } catch {
      error('Failed to export CSV report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#142B4A]">Record Management & Service Billing</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Salary Invoices & Print Sheets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage and print official Charvik billing records, staff salary statements, and bank/QR payment sheets.
          </p>
        </div>

        {/* Right Side Action: Add Record */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-emerald-700 hover:text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-[#0D6EFD] via-[#0B5ED7] to-[#0047AB] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block">
            Total Records
          </span>
          <p className="text-3xl font-black text-white mt-1">{metrics.totalCount}</p>
          <span className="text-[10px] text-blue-200 font-medium mt-0.5 block">Generated Statements</span>
        </div>

        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
            Total Staff Covered
          </span>
          <p className="text-3xl font-black text-white mt-1">{metrics.totalStaff}</p>
          <span className="text-[10px] text-emerald-200 font-medium mt-0.5 block">Drivers / Cleaners / Crew</span>
        </div>

        <div className="bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#075985] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider block">
            Total Billed Amount
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">₹{metrics.totalBilled.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-sky-200 font-medium mt-0.5 block">Total Salary Billed</span>
        </div>

        <div className="bg-gradient-to-br from-[#059669] via-[#047857] to-[#065F46] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
            Total Received
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">₹{metrics.totalReceived.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-200 font-medium mt-0.5 block">Payments Collected</span>
        </div>

        <div className="bg-gradient-to-br from-[#EC4899] via-[#E11D48] to-[#BE123C] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider block">
            Balance Due
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">₹{metrics.totalBalance.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-rose-200 font-medium mt-0.5 block">Pending Collection</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search record #, client, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-6 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white font-medium outline-none text-slate-800"
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

        {/* Payment Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm font-semibold py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
        </select>

        {/* Period Filter */}
        {uniquePeriods.length > 0 && (
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-sm font-semibold py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Billing Periods</option>
            {uniquePeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm font-semibold py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="All">All Staff Categories</option>
          {RECORD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {(search || statusFilter !== 'All' || monthFilter !== 'All' || categoryFilter !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setMonthFilter('All');
              setCategoryFilter('All');
            }}
            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-xs border-b border-blue-900/30">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">S.NO</th>
                <th className="py-2.5 px-3 min-w-[95px]">RECORD #</th>
                <th className="py-2.5 px-3 min-w-[85px] text-center">DATE</th>
                <th className="py-2.5 px-3 min-w-[110px]">BILLED TO (CLIENT)</th>
                <th className="py-2.5 px-3 min-w-[95px]">PERIOD</th>
                <th className="py-2.5 px-3 min-w-[100px] text-center">STAFF COUNT</th>
                <th className="py-2.5 px-3 min-w-[105px] text-right">TOTAL AMOUNT</th>
                <th className="py-2.5 px-3 min-w-[95px] text-right">RECEIVED</th>
                <th className="py-2.5 px-3 min-w-[95px] text-right">BALANCE</th>
                <th className="py-2.5 px-3 min-w-[100px] text-center">STATUS</th>
                <th className="py-2.5 px-3 min-w-[100px] text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading billing records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No billing records found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &quot;Add Record&quot; on the top right to create your first official billing and salary record.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. S.NO */}
                    <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>

                    {/* 2. RECORD # */}
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">
                      <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                        {r.record_number}
                      </span>
                    </td>

                    {/* 3. DATE */}
                    <td className="py-2 px-3 text-center font-medium text-slate-600">
                      {r.record_date}
                    </td>

                    {/* 4. BILLED TO */}
                    <td className="py-2 px-3 font-bold text-slate-900">
                      <div>
                        <span>{r.bill_to_name}</span>
                        {r.bill_to_phone && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Phone: {r.bill_to_phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. PERIOD */}
                    <td className="py-2 px-3 font-medium text-slate-700">
                      {r.period_month || '—'}
                    </td>

                    {/* 6. STAFF COUNT */}
                    <td className="py-2 px-3 text-center font-bold text-slate-800">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        {r.total_staff_count} Staff
                      </span>
                    </td>

                    {/* 7. TOTAL AMOUNT */}
                    <td className="py-2 px-3 text-right font-black text-slate-900">
                      ₹{Number(r.total_amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 8. RECEIVED */}
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      ₹{Number(r.received_amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 9. BALANCE */}
                    <td className="py-2 px-3 text-right font-bold text-rose-600">
                      ₹{Number(r.balance_amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 10. STATUS */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.payment_status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.payment_status}
                      </span>
                    </td>

                    {/* 11. ACTIONS */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print Record Button (Matching Images 1, 2, 3) */}
                        <button
                          type="button"
                          onClick={() => setPrintingRecord(r)}
                          className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Print Official Record Sheet"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-700" />
                          <span>Print</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* =========================================================================
          ADD / EDIT RECORD MODAL (DATA ADDED MANUALLY, EXACT COLUMNS FROM IMAGE 4)
          ========================================================================= */}
      {isAddEditOpen && (
        <Modal
          isOpen={isAddEditOpen}
          onClose={() => setIsAddEditOpen(false)}
          title={editingRecord ? `Edit Billing Record: ${editingRecord.record_number}` : 'Add New Billing & Service Record'}
          subtitle="Add service rows, staff counts, salary amounts, and billing details manually."
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSaveRecord} className="space-y-5 text-xs text-slate-700">
            {/* Top Row: Basic Record Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>1. Record Details & Billing Period</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Record / Invoice No *</label>
                  <input
                    type="text"
                    required
                    value={formData.record_number || ''}
                    onChange={(e) => setFormData({ ...formData, record_number: e.target.value })}
                    placeholder="e.g. REC-2026-001"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-blue-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Record Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.record_date || ''}
                    onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Billing Period / Month</label>
                  <input
                    type="text"
                    value={formData.period_month || ''}
                    onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
                    placeholder="e.g. Aug'26 or Oct 2026"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.payment_status || 'Pending'}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Bill To Client Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>2. Bill To (Client / Organization Details)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.bill_to_name || ''}
                    onChange={(e) => setFormData({ ...formData, bill_to_name: e.target.value })}
                    placeholder="e.g. Yolobus Private Limited / Sri Krishna Travels"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Mobile Number</label>
                  <input
                    type="text"
                    value={formData.bill_to_phone || ''}
                    onChange={(e) => setFormData({ ...formData, bill_to_phone: e.target.value })}
                    placeholder="e.g. 9396151527"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Address</label>
                  <input
                    type="text"
                    value={formData.bill_to_address || ''}
                    onChange={(e) => setFormData({ ...formData, bill_to_address: e.target.value })}
                    placeholder="e.g. Unit 330, JMD Megapolis, Sohna Road, Gurugram"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Client PAN / GST Number</label>
                  <input
                    type="text"
                    value={formData.bill_to_pan || ''}
                    onChange={(e) => setFormData({ ...formData, bill_to_pan: e.target.value })}
                    placeholder="e.g. AABCY5013H"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Data Columns Matching 4th Image (Description of Services, category, No of Staff, Salary paid) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>3. Services & Staff Breakdown (Image 4 Columns)</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service Row</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12 text-slate-900">Sr.No</th>
                      <th className="py-2.5 px-3 min-w-[100px] text-slate-900">Description of Services *</th>
                      <th className="py-2.5 px-3 min-w-[100px] text-slate-900">Category *</th>
                      <th className="py-2.5 px-3 min-w-[100px] text-center text-slate-900">No of Drivers/Cleaners/Captain</th>
                      <th className="py-2.5 px-3 min-w-[100px] text-right text-slate-900">Salary Paid (₹) *</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.items || []).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Driver's Salary for Aug'26"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 min-w-[130px]">
                          <select
                            required
                            value={item.category || 'Driver'}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-xs"
                          >
                            <option value="Driver">Driver</option>
                            <option value="Helper">Helper</option>
                            <option value="Captain">Captain</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.staff_count || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'staff_count', Number(e.target.value))}
                            className="w-full p-1.5 text-center rounded-lg border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="₹ 0"
                            value={item.salary_paid || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'salary_paid', Number(e.target.value))}
                            className="w-full p-1.5 text-right rounded-lg border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px] text-slate-900">
                        Total:
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-black text-slate-900">
                        {formCalculations.staffCount}
                      </td>
                      <td className="py-2 px-3 text-right text-sm font-black text-slate-900">
                        ₹{formCalculations.totalAmt.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-xs italic font-semibold text-slate-700 bg-slate-50">
                        In words: {formCalculations.words}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 4: Received Amount & Accounting */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <span>4. Payment & Settlement Summary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    ₹{formCalculations.totalAmt.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <label className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                    Received Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.received_amount !== undefined ? formData.received_amount : ''}
                    onChange={(e) => setFormData({ ...formData, received_amount: Number(e.target.value) })}
                    placeholder="Enter received amount"
                    className="w-full p-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-900 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Balance Due</span>
                  <p className="text-lg font-black text-rose-600 mt-0.5">
                    ₹{formCalculations.balance.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Bank Details and QR Code (From Image 2 End of Page) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>5. Bank Details & Payment QR Code (Image 2 Footer)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Details */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs block border-b pb-1">Official Bank Details</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.bank_account_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                      className="w-full p-1.5 rounded border border-slate-200 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Account Number</label>
                    <input
                      type="text"
                      value={formData.bank_account_no || ''}
                      onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
                      className="w-full p-1.5 rounded border border-slate-200 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">IFSC Code</label>
                      <input
                        type="text"
                        value={formData.bank_ifsc || ''}
                        onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                        className="w-full p-1.5 rounded border border-slate-200 text-xs font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Bank & Branch</label>
                      <input
                        type="text"
                        value={formData.bank_name || ''}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full p-1.5 rounded border border-slate-200 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* QR Code Details */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs block border-b pb-1">Payment QR & UPI ID</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">UPI ID (PhonePe / GPay / Paytm)</label>
                    <input
                      type="text"
                      value={formData.upi_id || ''}
                      onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                      placeholder="e.g. 9505151527@ybl"
                      className="w-full p-1.5 rounded border border-slate-200 text-xs font-mono font-bold text-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Custom QR Image URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.qr_code_url || ''}
                      onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                      placeholder="Leave blank to use auto-generated QR code"
                      className="w-full p-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <img
                      src={
                        formData.qr_code_url ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${encodeURIComponent(
                          formData.upi_id || '9505151527@ybl'
                        )}&pn=${encodeURIComponent(formData.bank_account_name || 'Charvik')}&cu=INR`
                      }
                      alt="Payment QR"
                      className="w-16 h-16 border border-slate-200 rounded p-1 bg-white object-contain"
                    />
                    <div className="text-[11px] text-slate-500">
                      <p className="font-semibold text-slate-800">Live QR Preview</p>
                      <p>Scannable with any UPI app on the printed record sheet.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white shadow-sm transition-all cursor-pointer"
              >
                {editingRecord ? 'Update Record' : 'Save & Create Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          PRINT RECORD MODAL (EXACT MATCH FOR IMAGES 1, 2, 3, AND 4)
          ========================================================================= */}
      {printingRecord && (
        <Modal
          isOpen={!!printingRecord}
          onClose={() => setPrintingRecord(null)}
          title={`Print Official Record: ${printingRecord.record_number}`}
          subtitle="Official Charvik letterhead format with salary statement, bank details, and QR code."
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 no-print">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready for high-quality printing or PDF export.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Record Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingRecord(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div
              ref={printSheetRef}
              id="charvik-official-record-sheet"
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm text-slate-900 max-w-[800px] mx-auto print:border-0 print:p-0 print:shadow-none print:max-w-none"
              style={{ fontFamily: 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              {/* Top Letterhead Header */}
              <div className="border-b-2 border-[#0099B8] pb-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Official Charvik Logo */}
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo-compact.png"
                      alt="Charvik Staffing Consultancy"
                      className="h-16 w-auto max-w-[280px] object-contain block"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = '/logo.png';
                      }}
                    />
                  </div>

                  {/* Right: Contact Information */}
                  <div className="text-right text-xs space-y-1.5 text-slate-700 font-medium">
                    <div className="flex items-center justify-end gap-1.5 text-slate-900 font-bold">
                      <Phone className="w-3.5 h-3.5 text-[#0099B8] shrink-0" />
                      <span>9505151527</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-[#0099B8] shrink-0" />
                      <span>charvikstaffingconsultancy@gmail.com</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#0099B8] shrink-0" />
                      <span>Hyderabad, Vanasthalipuram</span>
                    </div>
                  </div>
                </div>

                {/* Cyan Accent Bar */}
                <div className="h-1 bg-gradient-to-r from-[#0099B8] via-[#00B4D8] to-[#142B4A] rounded-full mt-3"></div>
              </div>

              {/* Title Header (Matching Image 1: BILL OF SUPPLY) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded">
                  BILL OF SUPPLY / OFFICIAL SALARY RECORD
                </span>
                <span className="text-[11px] text-slate-500 font-medium italic">
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>

              {/* BILL TO & INVOICE DETAILS */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3.5 mb-5 bg-slate-50/40 text-xs">
                {/* Left: Bill To */}
                <div className="space-y-1 border-r border-slate-200 pr-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    BILL TO:
                  </span>
                  <p className="font-black text-sm text-[#142B4A] uppercase tracking-wide break-words">
                    {printingRecord.bill_to_name}
                  </p>
                  {printingRecord.bill_to_address && (
                    <p className="text-slate-600 text-[11px] break-words">
                      <strong>Address:</strong> {printingRecord.bill_to_address}
                    </p>
                  )}
                  {printingRecord.bill_to_phone && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Mobile:</strong> {printingRecord.bill_to_phone}
                    </p>
                  )}
                  {printingRecord.bill_to_pan && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>PAN / GST:</strong> {printingRecord.bill_to_pan}
                    </p>
                  )}
                </div>

                {/* Right: Record / Invoice Metadata */}
                <div className="space-y-1.5 pl-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Record / Invoice No:</span>
                    <span className="font-bold tracking-wide text-blue-900 text-xs">
                      {printingRecord.record_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Record Date:</span>
                    <span className="font-medium text-slate-800">{printingRecord.record_date}</span>
                  </div>
                  {printingRecord.period_month && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Billing Period:</span>
                      <span className="font-bold text-slate-800">{printingRecord.period_month}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Payment Status:</span>
                    <span className={`font-bold ${
                      printingRecord.payment_status === 'Paid'
                        ? 'text-emerald-700'
                        : printingRecord.payment_status === 'Partial'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}>
                      {printingRecord.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* SERVICE TABLE (EXACT MATCH FOR IMAGE 4) */}
              <div className="border border-slate-400 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#142B4A] text-white font-bold uppercase text-[11px] tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-14 border-r border-slate-600">Sr.No</th>
                      <th className="py-2.5 px-3 border-r border-slate-600">Description of Services</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-600">Category</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-600">No of Drivers / Cleaners / Captain</th>
                      <th className="py-2.5 px-3 text-right">Salary Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                    {printingRecord.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900 break-words">
                          {item.description}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-300">
                          {item.category}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-bold">
                          {item.staff_count}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{Number(item.salary_paid).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row (Exact Match for Image 4) */}
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs border-r border-slate-300">
                        Total
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 text-sm">
                        {printingRecord.total_staff_count}
                      </td>
                      <td className="py-2 px-3 text-right text-sm text-[#142B4A]">
                        ₹{Number(printingRecord.total_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* In Words Row (Exact Match for Image 4) */}
                    <tr className="bg-slate-50 border-t border-slate-300">
                      <td colSpan={5} className="py-2 px-3 text-xs font-semibold italic text-slate-700">
                        <strong>In words:</strong> {printingRecord.amount_in_words || numberToWordsIndian(printingRecord.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Received Amount Strip (From Image 2) */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs font-bold">
                <div>
                  <span className="text-slate-600">Received Amount: </span>
                  <span className="text-emerald-700 font-black">
                    ₹{Number(printingRecord.received_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Balance Due: </span>
                  <span className="text-rose-600 font-black">
                    ₹{Number(printingRecord.balance_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION: BANK DETAILS & PAYMENT QR CODE (EXACT MATCH FOR IMAGE 2 END OF PAGE) */}
              <div className="grid grid-cols-2 gap-4 border border-slate-400 rounded-lg p-3.5 mb-5 text-xs bg-white">
                {/* Left Box: Bank Details */}
                <div className="border-r border-slate-300 pr-4 space-y-1.5">
                  <span className="font-black text-slate-900 uppercase text-[11px] block border-b border-slate-200 pb-1">
                    Bank Details
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500 font-semibold">Name:</span>
                    <span className="col-span-2 font-bold text-slate-900 break-words">{printingRecord.bank_account_name || 'Charvik Staffing Consultancy'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500 font-semibold">IFSC Code:</span>
                    <span className="col-span-2 font-bold tracking-wider text-slate-900">{printingRecord.bank_ifsc || 'KKBK0007460'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500 font-semibold">Account No:</span>
                    <span className="col-span-2 font-bold tracking-wider text-slate-900">{printingRecord.bank_account_no || '2848153146'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500 font-semibold">Bank:</span>
                    <span className="col-span-2 font-medium text-slate-800 break-words">{printingRecord.bank_name || 'Kotak Mahindra Bank, Vanasthalipuram Hyderabad'}</span>
                  </div>
                </div>

                {/* Right Box: Payment QR Code */}
                <div className="pl-2 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 uppercase text-[11px] block border-b border-slate-200 pb-1">
                      Payment QR Code
                    </span>
                    <p className="text-[11px] font-bold text-slate-600">PhonePe / Google Pay / PayTM</p>
                    <p className="text-xs">
                      <span className="text-slate-500 font-semibold">UPI ID: </span>
                      <strong className="font-bold tracking-wide text-purple-900">{printingRecord.upi_id || '9505151527@ybl'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">Scan to pay instantly via any UPI app</p>
                  </div>

                  {/* QR Code graphic */}
                  <div className="shrink-0 p-1 bg-white border border-slate-300 rounded">
                    <img
                      src={
                        printingRecord.qr_code_url ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=${encodeURIComponent(
                          printingRecord.upi_id || '9505151527@ybl'
                        )}&pn=${encodeURIComponent(printingRecord.bank_account_name || 'Charvik')}&cu=INR`
                      }
                      alt="UPI Payment QR"
                      className="w-20 h-20 object-contain block"
                    />
                  </div>
                </div>
              </div>

              {/* Signature & Seal Footer */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                  <p>1. Payment to be settled within agreed operational cycle terms.</p>
                  <p>2. This is a computer generated official statement.</p>
                </div>

                <div className="text-center space-y-1.5">
                  <div className="w-40 h-8 border-b border-dashed border-slate-400"></div>
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Authorized Signatory
                  </span>
                  <span className="text-[10px] text-slate-500">Charvik Staffing Consultancy</span>
                </div>
              </div>

              {/* Bottom Letterhead Geometric Accent (Matching Image 3) */}
              <div className="mt-6 pt-2 border-t-2 border-[#142B4A]">
                <div className="h-1.5 bg-gradient-to-r from-[#142B4A] via-[#0099B8] to-[#00B4D8] rounded-full"></div>
                <div className="text-center text-[10px] text-slate-400 mt-1.5">
                  Charvik Staffing Consultancy • Your Talent | Our Support | A Brighter Future
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Specific CSS Fallback */}
      <style>{`
        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #charvik-official-record-sheet, #charvik-official-record-sheet * {
            visibility: visible !important;
          }
          #charvik-official-record-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RecordManagement;

