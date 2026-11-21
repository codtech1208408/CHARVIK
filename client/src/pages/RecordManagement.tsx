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
  MapPin,
  Check,
  ChevronDown,
  Filter,
  Save
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { numberToWordsIndian } from '../utils/numberToWords';
import { exportTableToExcel } from '../utils/exportToExcel';
import { OperatorSearchSelect } from '../components/common/OperatorSearchSelect';

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
  operator_name: string;
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

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  availableCategories: string[];
  onAddCategory: (newCategory: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  availableCategories,
  onAddCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = availableCategories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleAdd = () => {
    const trimmed = newCatInput.trim();
    if (trimmed) {
      onAddCategory(trimmed);
      onChange(trimmed);
      setNewCatInput('');
      setShowAddInput(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 outline-none focus:border-blue-500 shadow-xs text-left"
      >
        <span className="truncate">{value || 'Select Category'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2">
          {/* Search Category */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Select Category List */}
          <div className="max-h-36 overflow-y-auto space-y-0.5 divide-y divide-slate-50">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onChange(cat);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${value === cat
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span>{cat}</span>
                  {value === cat && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))
            ) : (
              <div className="text-center py-2 text-[11px] text-slate-400 italic">
                No matching category
              </div>
            )}
          </div>

          {/* Add More Option */}
          <div className="pt-1.5 border-t border-slate-100">
            {!showAddInput ? (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Category</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="New category..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  className="w-full p-1 text-xs border border-blue-400 rounded-md outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newCatInput.trim()}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInput(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const RecordManagement: React.FC = () => {
  const { success, error } = useToast();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Categories (Select, Search, Add More)
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_record_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return ['Driver', 'Helper', 'Captain'];
  });

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setAvailableCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const updated = [...prev, trimmed];
      try {
        localStorage.setItem('charvik_record_categories', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<ServiceRecord | null>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const getInitialFormData = (existingRecordsCount: number = 0): Partial<ServiceRecord> => ({
    record_number: `REC-${new Date().getFullYear()}-${String(existingRecordsCount + 1).padStart(3, '0')}`,
    record_date: new Date().toISOString().split('T')[0],
    period_month: '',
    bill_to_name: '',
    bill_to_address: '',
    bill_to_phone: '',
    bill_to_pan: '',
    operator_name: '',
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

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceRecord>>(() => getInitialFormData(0));

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData(getInitialFormData(records.length));
    setIsModalOpen(true);
  };

  const handleOpenCreate = handleOpenAdd;

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
    setIsModalOpen(true);
  };

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
      formData.bill_to_name = 'Charvik Staffing Consultancy';
    }

    let items = (formData.items || []).filter((i) => i.description.trim() || (i.salary_paid && i.salary_paid > 0));
    if (items.length === 0) {
      items = (formData.items || []).length > 0 ? formData.items! : [{
        id: 'item-1',
        description: "Driver's Salary for Aug'26",
        category: 'Driver',
        staff_count: 69,
        salary_paid: 1858400
      }];
    }

    const totalAmt = formCalculations.totalAmt;
    const staffCount = formCalculations.staffCount;
    const words = formCalculations.words;
    const balance = formCalculations.balance;
    const autoStatus = formCalculations.status;

    const d = new Date(formData.record_date || new Date());
    const monthYear = d.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'");

    const recordPayload: ServiceRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      record_number: formData.record_number?.trim() || `REC-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, '0')}`,
      record_date: formData.record_date || new Date().toISOString().split('T')[0],
      period_month: formData.period_month?.trim() || monthYear,
      bill_to_name: formData.bill_to_name?.trim() || 'Charvik Staffing Consultancy',
      bill_to_address: formData.bill_to_address?.trim() || '',
      bill_to_phone: formData.bill_to_phone?.trim() || '',
      bill_to_pan: formData.bill_to_pan?.trim() || '',
      items,
      total_staff_count: staffCount,
      total_amount: totalAmt,
      amount_in_words: words,
      received_amount: Number(formData.received_amount || 0),
      balance_amount: balance,
      payment_status: formData.payment_status || autoStatus || 'Pending',
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
      setIsModalOpen(false);
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
              margin: 5mm 6mm;
            }
            * { box-sizing: border-box !important; }
            html, body {
              margin: 0 !important;
              padding: 2px !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: visible !important;
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #isolated-print-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            #charvik-official-record-sheet {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              box-sizing: border-box !important;
            }
            table {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              box-sizing: border-box !important;
            }
            th, td {
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
              box-sizing: border-box !important;
            }
            [class*="min-w-"] {
              min-width: 0 !important;
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
          } catch { }
        }, 1500);
      }
    }, 400);
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    try {
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

      const rows = filteredRecords.map((r, idx) => [
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
      ]);

      exportTableToExcel({
        title: 'Billing & Service Records Ledger',
        subtitle: `Total Records: ${filteredRecords.length} | Staffing & Operational Retainership`,
        headers,
        rows
      });
      success('Exported successfully to Excel!');
    } catch {
      error('Failed to export Excel report.');
    }
  };

  const handleExportSingleRecordExcel = (rec: any) => {
    const headers = ['Staff Name', 'Designation / Role', 'Duty Shift / Corridor', 'Contact Phone', 'Monthly Salary (Rs)', 'Allowances (Rs)', 'Deductions (Rs)', 'Net Payable (Rs)', 'Status'];
    const rows = (rec.staff_details || []).map((s: any) => [
      s.staff_name,
      s.role,
      s.duty_route || 'Standard Shift',
      s.phone_number || '-',
      s.salary_amount || 0,
      s.allowances || 0,
      s.deductions || 0,
      s.net_payable || s.salary_amount || 0,
      s.payment_status || 'Paid'
    ]);

    exportTableToExcel({
      title: `Billing & Staffing Statement - Record #${rec.record_number}`,
      subtitle: `Client: ${rec.bill_to_name} | Period: ${rec.period_month || ''} | Date: ${rec.record_date} | Total Amount: Rs ${Number(rec.total_amount).toLocaleString('en-IN')} | Received: Rs ${Number(rec.received_amount).toLocaleString('en-IN')} | Balance: Rs ${Number(rec.balance_amount).toLocaleString('en-IN')}`,
      headers,
      rows
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Hero Banner with Real Bus Coach */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Record Management &amp; Billing
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {metrics.totalCount} Statements
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Official Charvik billing records, staff salary statements, and bank/QR payment sheets.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet4.jpg"
                alt="Billing Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Billing Records</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-blue-800" />
              <span>+ Add Record</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
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
          {availableCategories.map((c) => (
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.payment_status === 'Paid'
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

      {/* ── MODAL: ADD / EDIT BILLING & SERVICE RECORD (IDENTICAL TO SERVICE PARTNERS) ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit Billing Record: ${editingRecord.record_number}` : 'Add New Billing & Service Record'}
        subtitle="Maintain official billing details, client name, service description, category, staff count, and salary paid."
        size="lg"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          {/* Only Date Field as requested */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.record_date || ''}
              onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* ── SERVICES & STAFF SALARY DETAILS (Clean grid inputs, NOT box format) ── */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Services & Staff Breakdown
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Service</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(formData.items || []).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                >
                  {/* Description of Services */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Description of Services <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Driver's Salary for Aug'26"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Category with select, search, add more */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <CategorySelector
                      value={item.category}
                      onChange={(newCat) => handleUpdateItem(item.id, 'category', newCat)}
                      availableCategories={availableCategories}
                      onAddCategory={handleAddCategory}
                    />
                  </div>

                  {/* Staff count */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 text-center">
                      Staff Count <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={item.staff_count !== undefined && item.staff_count !== null && item.staff_count > 0 ? item.staff_count : ''}
                      onChange={(e) => handleUpdateItem(item.id, 'staff_count', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Salary Paid */}
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 text-right">
                        Salary Paid (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="₹ 0"
                        value={item.salary_paid !== undefined && item.salary_paid !== null && item.salary_paid > 0 ? item.salary_paid : ''}
                        onChange={(e) => handleUpdateItem(item.id, 'salary_paid', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-right outline-none focus:border-blue-500"
                      />
                    </div>
                    {(formData.items || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(item.id)}
                        className="mt-4 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs font-bold text-blue-950">
              <span>Total Statement Summary:</span>
              <div className="flex items-center gap-4">
                <span>Total Staff: <strong className="text-blue-700">{formCalculations.staffCount}</strong></span>
                <span>Total Salary: <strong className="text-slate-900">₹ {formCalculations.totalAmt.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingRecord ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </Modal>

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
                  onClick={() => handleExportSingleRecordExcel(printingRecord)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
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
              {/* Top Letterhead Header (Official Enclosed Charvik Letterhead) */}
              <div className="border-2 border-[#0056b3] rounded-xl p-2.5 sm:p-3 bg-white text-center mb-3">
                <div className="flex justify-center items-center mb-1">
                  <img
                    src="/charvik-print-logo.png?v=20261120_print"
                    alt="CHARVIK STAFFING CONSULTANCY"
                    className="h-14 max-h-[58px] w-auto max-w-[320px] object-contain block mx-auto"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo-brand.png'; }}
                  />
                </div>
                <div className="text-[11px] font-extrabold text-[#00448a] tracking-widest uppercase my-1 text-center">
                  Manpower Solutions &nbsp;•&nbsp; Recruitment &nbsp;•&nbsp; Payroll Support
                </div>
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-black mb-1.5 leading-tight">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Phone:</span>
                    <span className="text-black">9505151527</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Email:</span>
                    <span className="text-black">charvikstaffingconsultancy@gmail.com</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Web:</span>
                    <span className="text-black">www.charvikstaffing.com</span>
                  </span>
                </div>
                <div className="inline-block border border-[#0056b3] rounded-md px-3 py-1 text-[11px] font-semibold text-black bg-slate-50 max-w-[98%] leading-snug">
                  <span className="text-[#0056b3] font-extrabold mr-1">Office:</span>
                  <span>NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana</span>
                </div>
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
                  {printingRecord.bill_to_phone && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Mobile:</strong> {printingRecord.bill_to_phone}
                    </p>
                  )}
                  {(printingRecord as any).operator_name && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Operator Name:</strong> {(printingRecord as any).operator_name}
                    </p>
                  )}
                  {printingRecord.bill_to_address && (
                    <p className="text-slate-600 text-[11px] break-words">
                      <strong>Operator Address:</strong> {printingRecord.bill_to_address}
                    </p>
                  )}
                  {printingRecord.bill_to_pan && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Operator PAN/GST:</strong> {printingRecord.bill_to_pan}
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
                    <span className={`font-bold ${printingRecord.payment_status === 'Paid'
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

              {/* SERVICE TABLE (MATCHING IMAGE 2 EXACT 5 COLUMNS) */}
              <div className="border border-slate-400 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#142B4A] text-white font-bold uppercase text-[11px] tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-14 border-r border-slate-600">Sr. No</th>
                      <th className="py-2.5 px-3 border-r border-slate-600">Description of Services</th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-center w-28">Category</th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-center w-36">No. of Driver/Helper/Captain</th>
                      <th className="py-2.5 px-3 text-right w-36">Salary Paid (₹)</th>
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
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-semibold text-slate-800">
                          {item.category || 'Driver'}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-900">
                          {item.staff_count ?? 0}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{Number(item.salary_paid).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs border-r border-slate-300">
                        Total
                      </td>
                      <td className="py-2 px-3 text-center text-xs font-black text-blue-900 border-r border-slate-300">
                        {printingRecord.total_staff_count || printingRecord.items.reduce((acc, i) => acc + (Number(i.staff_count) || 0), 0)} Staff
                      </td>
                      <td className="py-2 px-3 text-right text-sm text-[#142B4A]">
                        ₹{Number(printingRecord.total_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* In Words Row */}
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

