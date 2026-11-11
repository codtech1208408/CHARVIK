import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  FileText,
  Upload,
  Image as ImageIcon,
  Eye,
  Edit,
  Trash2,
  Printer,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  TrendingUp,
  TrendingDown,
  Bus,
  FileCheck
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { numberToWordsIndian } from '../utils/numberToWords';

export interface IncomeExpenseItem {
  id: number;
  transaction_type: 'Income' | 'Expense';
  date: string;
  category: string;
  amount: number;
  payment_mode: 'Cash' | 'Bank Transfer' | 'Online' | 'UPI';
  proof_url?: string;
  reference_no?: string;
  party_name?: string;
  vehicle_number?: string;
  description?: string;
  created_at?: string;
}

const INCOME_SUGGESTIONS = [
  'Trip Advance / Booking',
  'Client Settlement',
  'Passenger Fare',
  'Bus Rental / Lease',
  'Special Charter Tour',
  'Contract Retainer',
  'Commission',
  'Other Income'
];

const EXPENSE_SUGGESTIONS = [
  'Diesel / Fuel',
  'Repairs & Maintenance',
  'Driver Bata / Daily Allowance',
  'Staff Salary',
  'Toll & Taxes (FASTag)',
  'Police & RTO Challan',
  'Tyres & Wheel Service',
  'Vehicle Insurance & Tax',
  'Lubricants & AdBlue',
  'Office & Admin',
  'Other Expense'
];

export const IncomeExpense: React.FC = () => {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<IncomeExpenseItem[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [datePreset, setDatePreset] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeExpenseItem | null>(null);
  const [previewProof, setPreviewProof] = useState<IncomeExpenseItem | null>(null);
  const [voucherItem, setVoucherItem] = useState<IncomeExpenseItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    transaction_type: 'Income' as 'Income' | 'Expense',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '' as string | number,
    payment_mode: 'UPI' as 'Cash' | 'Bank Transfer' | 'Online' | 'UPI',
    proof_url: '',
    reference_no: '',
    party_name: '',
    vehicle_number: '',
    description: ''
  });

  // Load Transactions & Vehicles
  const loadData = async () => {
    try {
      setLoading(true);
      const [ieRes, fleetRes] = await Promise.all([
        api.getIncomeExpenses(),
        api.getFleetMaintenance().catch(() => null)
      ]);

      if (ieRes && Array.isArray(ieRes.transactions)) {
        setTransactions(ieRes.transactions);
      }
      if (fleetRes && Array.isArray(fleetRes.buses)) {
        setVehicles(fleetRes.buses);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load income & expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    return transactions.filter((t) => {
      // 1. Type
      if (typeFilter !== 'All' && t.transaction_type !== typeFilter) return false;

      // 2. Payment Mode
      if (modeFilter !== 'All' && t.payment_mode !== modeFilter) return false;

      // 3. Date Preset
      if (datePreset === 'Today' && t.date !== todayStr) return false;
      if (datePreset === 'Week' && t.date < weekStr) return false;
      if (datePreset === 'Month' && t.date < monthStr) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (t.category || '').toLowerCase().includes(q) ||
          (t.party_name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.reference_no || '').toLowerCase().includes(q) ||
          (t.vehicle_number || '').toLowerCase().includes(q) ||
          String(t.amount).includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, modeFilter, datePreset, searchQuery]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    let onlineTotal = 0;
    let upiTotal = 0;

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.transaction_type === 'Income') {
        income += amt;
      } else {
        expense += amt;
      }

      if (t.payment_mode === 'Cash') cashTotal += amt;
      else if (t.payment_mode === 'Bank Transfer') bankTotal += amt;
      else if (t.payment_mode === 'Online') onlineTotal += amt;
      else if (t.payment_mode === 'UPI') upiTotal += amt;
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      totalCount: transactions.length,
      cashTotal,
      bankTotal,
      onlineTotal,
      upiTotal
    };
  }, [transactions]);

  // Open Modal for Add
  const handleOpenAdd = (defaultType: 'Income' | 'Expense' = 'Income') => {
    setEditingItem(null);
    setFormData({
      transaction_type: defaultType,
      date: new Date().toISOString().split('T')[0],
      category: defaultType === 'Income' ? 'Trip Advance / Booking' : 'Diesel / Fuel',
      amount: '',
      payment_mode: 'UPI',
      proof_url: '',
      reference_no: '',
      party_name: '',
      vehicle_number: '',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item: IncomeExpenseItem) => {
    setEditingItem(item);
    setFormData({
      transaction_type: item.transaction_type,
      date: item.date,
      category: item.category,
      amount: item.amount,
      payment_mode: item.payment_mode,
      proof_url: item.proof_url || '',
      reference_no: item.reference_no || '',
      party_name: item.party_name || '',
      vehicle_number: item.vehicle_number || '',
      description: item.description || ''
    });
    setIsAddModalOpen(true);
  };

  // Handle Photo/Proof Upload
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('File size must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          proof_url: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      error('Please enter a valid amount');
      return;
    }

    if (!formData.category.trim()) {
      error('Please select or enter a category');
      return;
    }

    try {
      const payload = {
        transaction_type: formData.transaction_type,
        date: formData.date,
        category: formData.category.trim(),
        amount: amt,
        payment_mode: formData.payment_mode,
        proof_url: formData.proof_url,
        reference_no: formData.reference_no.trim(),
        party_name: formData.party_name.trim(),
        vehicle_number: formData.vehicle_number.trim(),
        description: formData.description.trim()
      };

      if (editingItem) {
        await api.updateIncomeExpense(editingItem.id, payload);
        success(`${formData.transaction_type} updated successfully!`);
      } else {
        await api.createIncomeExpense(payload);
        success(`New ${formData.transaction_type} of ₹${amt.toLocaleString('en-IN')} added!`);
      }

      setIsAddModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save transaction');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (item: IncomeExpenseItem) => {
    if (!window.confirm(`Are you sure you want to delete this ${item.transaction_type.toLowerCase()} record of ₹${item.amount.toLocaleString('en-IN')}?`)) {
      return;
    }

    try {
      await api.deleteIncomeExpense(item.id);
      success('Transaction deleted successfully');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete transaction');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      error('No transactions to export');
      return;
    }

    const headers = ['S.No', 'Date', 'Type', 'Category', 'Party / Vendor', 'Vehicle', 'Payment Mode', 'Reference / UTR', 'Amount (INR)', 'Proof Attached', 'Description'];
    const rows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.date,
      t.transaction_type,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${(t.party_name || '—').replace(/"/g, '""')}"`,
      t.vehicle_number || '—',
      t.payment_mode,
      `"${(t.reference_no || '—').replace(/"/g, '""')}"`,
      t.transaction_type === 'Income' ? t.amount : -t.amount,
      t.proof_url ? 'Yes' : 'No',
      `"${(t.description || '—').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Income_Expense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Income & Expense ledger exported successfully!');
  };

  // Print Voucher
  const handlePrintVoucher = (item: IncomeExpenseItem) => {
    setVoucherItem(item);
  };

  const executePrint = () => {
    const printArea = document.getElementById('printable-voucher');
    if (!printArea) {
      window.print();
      return;
    }
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Transaction Voucher #${voucherItem?.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; }
            .voucher { border: 2px solid #0f172a; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
            .income { background: #ecfdf5; color: #047857; }
            .expense { background: #fef2f2; color: #b91c1c; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .row { margin-bottom: 8px; }
            .label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin: 16px 0; text-align: right; }
            .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          ${printArea.outerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Payment mode helper
  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wallet className="w-3 h-3 text-amber-600" />
            <span>Cash</span>
          </span>
        );
      case 'Bank Transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>Bank Transfer</span>
          </span>
        );
      case 'Online':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard className="w-3 h-3 text-purple-600" />
            <span>Online</span>
          </span>
        );
      case 'UPI':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Smartphone className="w-3 h-3 text-emerald-600" />
            <span>UPI</span>
          </span>
        );
    }
  };

  // Proof guidance text based on payment mode
  const getProofGuidance = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return 'Attach Cash Voucher / Cash Memo / Physical Receipt Slip';
      case 'Bank Transfer':
        return 'Attach Bank Counterfoil / Transfer Slip / NEFT/RTGS Advice';
      case 'Online':
        return 'Attach Net Banking Confirmation / Payment Gateway Receipt';
      case 'UPI':
      default:
        return 'Attach PhonePe / Google Pay / Paytm / UPI Transaction Screenshot';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#142B4A] to-[#1E3A8A] flex items-center justify-center text-white shadow-md shadow-blue-900/15 shrink-0">
              <IndianRupee className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Income & Expense</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  Financial Ledger
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage revenue cash flow, operational expenditures, payment modes, and payment proof vouchers.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('Expense')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>- Add Expense</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('Income')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Income</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Income */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Income</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 font-mono">
              + ₹{stats.totalIncome.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block">
              Revenue & Advances
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Total Expense */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 font-mono">
              - ₹{stats.totalExpense.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block">
              Fuel, Repairs, Bata & Operations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Net Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Balance</p>
            <p className={`text-2xl sm:text-3xl font-black mt-1 font-mono ${stats.netBalance >= 0 ? 'text-[#142B4A]' : 'text-rose-600'}`}>
              ₹{stats.netBalance.toLocaleString('en-IN')}
            </p>
            <span className={`text-[11px] font-bold mt-1 inline-block ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.netBalance >= 0 ? '▲ Net Surplus' : '▼ Net Deficit'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#142B4A]/10 text-[#142B4A] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Payment Modes Total */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Modes Processed</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">UPI</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.upiTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">Bank</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.bankTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">Cash</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.cashTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">Online</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.onlineTotal / 1000).toFixed(0)}k</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search category, party, ref, vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#142B4A]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          {/* Type Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/60">
            {(['All', 'Income', 'Expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === t
                    ? t === 'Income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : t === 'Expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'Income' ? '+ Income' : t === 'Expense' ? '- Expense' : 'All'}
              </button>
            ))}
          </div>

          {/* Payment Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-700 font-semibold bg-white cursor-pointer"
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online">Online</option>
            <option value="UPI">UPI</option>
          </select>

          {/* Date Presets */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-700 font-semibold bg-white cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Week">This Week</option>
            <option value="Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Transaction Records ({filteredTransactions.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified income deposits and expense disbursements with payment proofs.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Party / Vendor</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Ref / UTR #</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Payment Proof</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading income & expense records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-slate-700 text-sm">No transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "+ Add Income" or "- Add Expense" above to record a new transaction.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const isIncome = t.transaction_type === 'Income';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isIncome ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          <span>{t.transaction_type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]" title={t.party_name}>
                        {t.party_name || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {t.vehicle_number ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[11px]">
                            {t.vehicle_number}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getModeBadge(t.payment_mode)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {t.reference_no || '—'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'} ₹{Number(t.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {t.proof_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewProof(t)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
                            title="View Payment Proof / Slip"
                          >
                            <img
                              src={t.proof_url}
                              alt="Proof preview"
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">No proof</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintVoucher(t)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#142B4A] transition-colors cursor-pointer"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
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

      {/* =========================================================================
          MODAL: ADD / EDIT INCOME & EXPENSE
         ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? `Edit ${formData.transaction_type}` : `Add ${formData.transaction_type}`}
        subtitle="Record cash flow, passenger fares, operational expenses, and payment proof slips."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          {/* Top Switcher: Income vs Expense */}
          {!editingItem && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    transaction_type: 'Income',
                    category: prev.category === 'Diesel / Fuel' ? 'Trip Advance / Booking' : prev.category
                  }));
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.transaction_type === 'Income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Income (Money In)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    transaction_type: 'Expense',
                    category: prev.category === 'Trip Advance / Booking' ? 'Diesel / Fuel' : prev.category
                  }));
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.transaction_type === 'Expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>- Expense (Money Out)</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium bg-white"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-mono font-bold text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category (Manual entry with datalist suggestions) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                list="category-suggestions"
                required
                placeholder="Type or select category..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-medium"
              />
              <datalist id="category-suggestions">
                {(formData.transaction_type === 'Income' ? INCOME_SUGGESTIONS : EXPENSE_SUGGESTIONS).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode *</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-semibold text-slate-800 cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="Online">Online / Net Banking / Gateway</option>
                <option value="UPI">UPI (PhonePe / Google Pay / Paytm)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Party / Vendor Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Party / Vendor / Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Travels / HPCL Bunk / John"
                value={formData.party_name}
                onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            {/* Reference / UTR Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference / UTR / Voucher No</label>
              <input
                type="text"
                placeholder="e.g. UTR-982138 or Voucher #5421"
                value={formData.reference_no}
                onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-mono"
              />
            </div>
          </div>

          {/* Vehicle Linked (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Linked (Optional)</label>
            <input
              type="text"
              list="vehicle-suggestions"
              placeholder="e.g. AP16TV1234 or select fleet vehicle..."
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-mono"
            />
            <datalist id="vehicle-suggestions">
              {vehicles.map((v) => (
                <option key={v.id || v.registration_number} value={v.registration_number || v.bus_number} />
              ))}
            </datalist>
          </div>

          {/* Proof Option for Every Type of Payment Mode (User Request) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Payment Proof / Receipt Voucher
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Available for {formData.payment_mode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              {getProofGuidance(formData.payment_mode)} (max 5 MB).
            </p>

            {formData.proof_url ? (
              <div className="relative group w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={formData.proof_url}
                    alt="Uploaded proof"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Proof Uploaded Successfully</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Ready to save</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, proof_url: '' })}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                >
                  Remove Proof
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click to upload payment proof</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, or WebP voucher screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Diesel top-up 150L, trip settlement, advance fare..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                formData.transaction_type === 'Income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingItem ? 'Update Record' : `Save ${formData.transaction_type}`}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: FULL PAYMENT PROOF VIEWER
         ========================================================================= */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Payment Proof — {previewProof.category}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {previewProof.date} · {previewProof.payment_mode} · ₹{Number(previewProof.amount).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 flex items-center justify-center p-2">
              <img
                src={previewProof.proof_url}
                alt="Payment Proof Full"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">
                Ref: {previewProof.reference_no || 'N/A'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewProof.proof_url}
                  download={`Proof_${previewProof.id}_${previewProof.date}.png`}
                  className="px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewProof(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL TRANSACTION VOUCHER PREVIEW & PRINT
         ========================================================================= */}
      {voucherItem && (
        <Modal
          isOpen={!!voucherItem}
          onClose={() => setVoucherItem(null)}
          title={`Transaction Voucher #${voucherItem.id}`}
          subtitle="Official cash / bank disbursement and receipt voucher."
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* The Printable Sheet */}
            <div id="printable-voucher" className="voucher bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-sm space-y-4">
              <div className="header flex items-start justify-between border-b-2 border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">CHARVIK FLEET MANAGEMENT</h2>
                  <p className="text-[11px] text-slate-500 font-semibold">Official Corporate Accounts & Treasury Department</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${voucherItem.transaction_type === 'Income' ? 'income' : 'expense'}`}>
                    {voucherItem.transaction_type.toUpperCase()} VOUCHER
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">VCH-{voucherItem.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="row">
                  <span className="label block">Transaction Date</span>
                  <span className="val block">{voucherItem.date}</span>
                </div>
                <div className="row">
                  <span className="label block">Payment Mode</span>
                  <span className="val block">{voucherItem.payment_mode}</span>
                </div>
                <div className="row">
                  <span className="label block">Category</span>
                  <span className="val block font-bold">{voucherItem.category}</span>
                </div>
                <div className="row">
                  <span className="label block">Reference / UTR / Cheque</span>
                  <span className="val block font-mono">{voucherItem.reference_no || '—'}</span>
                </div>
                <div className="row">
                  <span className="label block">Party / Vendor / Customer</span>
                  <span className="val block">{voucherItem.party_name || 'Fleet Cash Counter'}</span>
                </div>
                <div className="row">
                  <span className="label block">Vehicle Linked</span>
                  <span className="val block font-mono">{voucherItem.vehicle_number || 'General Fleet'}</span>
                </div>
              </div>

              {voucherItem.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="label block mb-1">Particulars / Description</span>
                  <p className="text-slate-800 font-medium">{voucherItem.description}</p>
                </div>
              )}

              <div className="amount-box bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
                <span className="text-xs text-slate-500 font-bold uppercase block">Total Amount</span>
                <span className="text-2xl font-black font-mono text-slate-900 block mt-0.5">
                  ₹{Number(voucherItem.amount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-600 italic block mt-1">
                  ({numberToWordsIndian(Number(voucherItem.amount))} Only)
                </span>
              </div>

              <div className="signatures flex justify-between pt-8 text-xs text-slate-500 border-t border-dashed border-slate-300">
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span>Prepared By / Cashier</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span>Accountant / Auditor</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVoucherItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
