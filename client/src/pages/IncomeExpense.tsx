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
  FileCheck,
  Check,
  Tag
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

  // Category management (Matching Daily Vehicle Checkup with Add More, Edit & Delete)
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_custom_income_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INCOME_SUGGESTIONS;
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_custom_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return EXPENSE_SUGGESTIONS;
  });

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isStandaloneCatModalOpen, setIsStandaloneCatModalOpen] = useState(false);
  const [standaloneCatType, setStandaloneCatType] = useState<'Income' | 'Expense'>('Income');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  const activeCategories = formData.transaction_type === 'Income' ? incomeCategories : expenseCategories;

  const handleAddCategory = (targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || formData.transaction_type) === 'Income';
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const targetList = isIncome ? incomeCategories : expenseCategories;

    if (targetList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      error(`Category "${trimmed}" already exists.`);
      return;
    }

    const updated = [...targetList, trimmed];
    if (isIncome) {
      setIncomeCategories(updated);
      localStorage.setItem('charvik_custom_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_custom_expense_categories', JSON.stringify(updated));
    }

    setFormData((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    success(`Category "${trimmed}" added!`);
  };

  const handleStartEditCategory = (catName: string) => {
    setEditingCategoryOldName(catName);
    setEditingCategoryNewName(catName);
  };

  const handleSaveEditCategory = (oldName: string, targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || formData.transaction_type) === 'Income';
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategoryOldName(null);
      setEditingCategoryNewName('');
      return;
    }

    const targetList = isIncome ? incomeCategories : expenseCategories;

    if (targetList.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      error(`Category "${trimmed}" already exists.`);
      return;
    }

    const updated = targetList.map((c) => (c === oldName ? trimmed : c));
    if (isIncome) {
      setIncomeCategories(updated);
      localStorage.setItem('charvik_custom_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_custom_expense_categories', JSON.stringify(updated));
    }

    if (formData.category === oldName) {
      setFormData((prev) => ({ ...prev, category: trimmed }));
    }

    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');
    success(`Category renamed to "${trimmed}"!`);
  };

  const handleDeleteCategory = (catName: string, targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || formData.transaction_type) === 'Income';
    const targetList = isIncome ? incomeCategories : expenseCategories;
    if (targetList.length <= 1) {
      error('At least one category is required.');
      return;
    }

    const updated = targetList.filter((c) => c !== catName);
    if (isIncome) {
      setIncomeCategories(updated);
      localStorage.setItem('charvik_custom_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_custom_expense_categories', JSON.stringify(updated));
    }

    if (formData.category === catName) {
      setFormData((prev) => ({ ...prev, category: updated[0] || '' }));
    }

    success(`Category "${catName}" deleted.`);
  };

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
      if (modeFilter !== 'All') {
        if (modeFilter === 'Online / Net Banking') {
          if (t.payment_mode !== 'Online / Net Banking' && t.payment_mode !== 'Online') return false;
        } else if (t.payment_mode !== modeFilter) {
          return false;
        }
      }

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
    setIsCategoryManagerOpen(false);
    setFormData({
      transaction_type: defaultType,
      date: new Date().toISOString().split('T')[0],
      category: defaultType === 'Income' ? (incomeCategories[0] || 'Trip Advance / Booking') : (expenseCategories[0] || 'Diesel / Fuel'),
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
      window.dispatchEvent(new CustomEvent('charvik_income_expenses_updated'));
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
      window.dispatchEvent(new CustomEvent('charvik_income_expenses_updated'));
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

    let iframe = document.getElementById('charvik-voucher-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'charvik-voucher-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Charvik Official Voucher - #${voucherItem?.id}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-voucher {
              border: 1.5px solid #cbd5e1 !important;
              box-shadow: none !important;
              border-radius: 8px !important;
              max-width: 680px !important;
              margin: 0 auto !important;
              padding: 16px !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 10px;">
            ${printArea.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    };

    const imgs = doc.getElementsByTagName('img');
    let loadedCount = 0;
    const totalImgs = imgs.length;

    if (totalImgs === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      for (let i = 0; i < totalImgs; i++) {
        if (imgs[i].complete) {
          loadedCount++;
          if (loadedCount === totalImgs) setTimeout(triggerPrint, 250);
        } else {
          imgs[i].onload = () => {
            loadedCount++;
            if (loadedCount === totalImgs) setTimeout(triggerPrint, 250);
          };
          imgs[i].onerror = () => {
            loadedCount++;
            if (loadedCount === totalImgs) setTimeout(triggerPrint, 250);
          };
        }
      }
    }
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
      case 'Online / Net Banking':
      case 'Online/Net Banking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard className="w-3 h-3 text-purple-600" />
            <span>Online / Net Banking</span>
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
      case 'Online / Net Banking':
      case 'Online/Net Banking':
        return 'Attach Net Banking Confirmation / Payment Gateway Receipt';
      case 'UPI':
      default:
        return 'Attach PhonePe / Google Pay / Paytm / UPI Transaction Screenshot';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full pb-16">
      {/* Top Header Hero Banner with Bus Coach */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <IndianRupee className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Income &amp; Expense
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Financial Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Manage revenue cash flow, operational expenditures, payment modes, and payment proof vouchers.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet5.jpg"
                alt="Financial Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Treasury Ops</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setStandaloneCatType('Income');
                setIsStandaloneCatModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Tag className="w-4 h-4 text-white" />
              <span>Categories</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('Expense')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Minus className="w-4 h-4" />
              <span>- Add Expense</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('Income')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-blue-800" />
              <span>+ Add Income</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Income */}
        <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#059669] uppercase tracking-wider">Total Income</p>
            <p className="text-2xl sm:text-3xl font-black text-[#047857] mt-1 font-mono">
              + ₹{stats.totalIncome.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-semibold text-emerald-700/80 mt-1 inline-block">
              Revenue & Advances
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Total Expense */}
        <div className="bg-gradient-to-br from-[#FFF1F2] via-[#FFF5F6] to-[#FFE2E5] border-2 border-[#FDA4AF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#E11D48] uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl sm:text-3xl font-black text-[#BE123C] mt-1 font-mono">
              - ₹{stats.totalExpense.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-semibold text-rose-700/80 mt-1 inline-block">
              Fuel, Repairs, Bata & Operations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Net Balance */}
        <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#0D6EFD] uppercase tracking-wider">Net Cash Balance</p>
            <p className={`text-2xl sm:text-3xl font-black mt-1 font-mono ${stats.netBalance >= 0 ? 'text-[#0B5ED7]' : 'text-rose-600'}`}>
              ₹{stats.netBalance.toLocaleString('en-IN')}
            </p>
            <span className={`text-[11px] font-bold mt-1 inline-block ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.netBalance >= 0 ? '▲ Net Surplus' : '▼ Net Deficit'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D6EFD] to-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Payment Modes Total */}
        <div className="bg-gradient-to-br from-[#F6F0FE] via-[#FAF5FF] to-[#E9DBFC] border-2 border-[#D8B4FE] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-black text-[#8B5CF6] uppercase tracking-wider">Payment Modes Processed</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/80 p-1.5 rounded-lg border border-purple-200 text-center shadow-2xs">
              <span className="text-[10px] text-purple-700 font-bold block">UPI</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.upiTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-purple-200 text-center shadow-2xs">
              <span className="text-[10px] text-purple-700 font-bold block">Bank</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.bankTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-purple-200 text-center shadow-2xs">
              <span className="text-[10px] text-purple-700 font-bold block">Cash</span>
              <span className="text-xs font-black text-slate-800 font-mono">₹{(stats.cashTotal / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-purple-200 text-center shadow-2xs">
              <span className="text-[10px] text-purple-700 font-bold block">Online</span>
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
            <option value="Online / Net Banking">Online / Net Banking</option>
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
            <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-[11px] border-b border-blue-900/30">
              <tr>
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
                    category: incomeCategories.includes(prev.category) ? prev.category : (incomeCategories[0] || 'Trip Advance / Booking')
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
                    category: expenseCategories.includes(prev.category) ? prev.category : (expenseCategories[0] || 'Diesel / Fuel')
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
            {/* Category with Add More, Edit, and Delete options */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(!isCategoryManagerOpen)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCategoryManagerOpen ? 'Hide Category List' : '+ Add More / Edit'}</span>
                </button>
              </div>

              <select
                required
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === '__add_more__') {
                    setIsCategoryManagerOpen(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-semibold text-slate-800 cursor-pointer"
              >
                <option value="">Select Category...</option>
                {activeCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__add_more__" className="text-blue-600 font-bold bg-blue-50">
                  + Add More Category...
                </option>
              </select>

              {/* Category Manager (Matching Daily Vehicle Checkup design) */}
              {isCategoryManagerOpen && (
                <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage {formData.transaction_type} Categories</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCategoryManagerOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add New Category Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`New ${formData.transaction_type.toLowerCase()} category...`}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCategory()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Existing Categories List with Edit and Delete options */}
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-1">
                    {activeCategories.map((cat) => {
                      const isEditing = editingCategoryOldName === cat;

                      return (
                        <div key={cat} className="flex items-center justify-between gap-2 p-1.5 text-xs hover:bg-slate-50 rounded-lg group">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingCategoryNewName}
                                onChange={(e) => setEditingCategoryNewName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditCategory(cat);
                                  } else if (e.key === 'Escape') {
                                    setEditingCategoryOldName(null);
                                  }
                                }}
                                className="flex-1 text-xs px-2 py-1 rounded-lg border border-blue-400 bg-white outline-none font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditCategory(cat)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                                title="Save Category"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryOldName(null)}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, category: cat }));
                                  setIsCategoryManagerOpen(false);
                                }}
                                className={`text-left font-semibold truncate hover:text-blue-600 cursor-pointer flex-1 ${
                                  formData.category === cat ? 'text-blue-700 font-bold' : 'text-slate-800'
                                }`}
                              >
                                {cat}
                                {formData.category === cat && (
                                  <span className="ml-1.5 text-[10px] text-blue-600 font-bold">(Selected)</span>
                                )}
                              </button>
                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit category"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online / Net Banking">Online / Net Banking</option>
                <option value="UPI">UPI</option>
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
            <div id="printable-voucher" className="voucher bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-3 font-sans">
              {/* Official Charvik Letterhead Header */}
              <div className="w-full mb-2">
                <img
                  src="/charvik-letterhead-header.png"
                  alt="CHARVIK STAFFING CONSULTANCY"
                  className="w-full h-auto block rounded-t"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              <div className="header flex items-center justify-between border-b-2 border-[#142B4A] pb-2.5 mb-3">
                <div>
                  <h3 className="text-base font-black text-[#142B4A] uppercase tracking-wide">
                    {voucherItem.transaction_type.toUpperCase()} PAYMENT VOUCHER
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Official Treasury & Cash Flow Record</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${voucherItem.transaction_type === 'Income' ? 'income' : 'expense'}`}>
                    {voucherItem.transaction_type.toUpperCase()}
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

              <div className="signatures flex justify-between pt-6 text-xs text-slate-500 border-t border-dashed border-slate-300">
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

              {/* Official Charvik Letterhead Footer */}
              <div className="w-full mt-4 pt-1">
                <img
                  src="/charvik-letterhead-footer.png"
                  alt="Charvik Footer"
                  className="w-full h-auto block"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
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

      {/* Standalone Category Management Modal (Matching Daily Vehicle Checkup) */}
      {isStandaloneCatModalOpen && (
        <Modal
          isOpen={isStandaloneCatModalOpen}
          onClose={() => setIsStandaloneCatModalOpen(false)}
          title="Manage Transaction Categories"
          subtitle="Add, edit, or delete categories for Income and Expense transactions."
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Tab switch between Income and Expense */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setStandaloneCatType('Income')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  standaloneCatType === 'Income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Income Categories ({incomeCategories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStandaloneCatType('Expense')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  standaloneCatType === 'Expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Expense Categories ({expenseCategories.length})</span>
              </button>
            </div>

            {/* Add New Category Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`New ${standaloneCatType.toLowerCase()} category name...`}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory(standaloneCatType);
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddCategory(standaloneCatType)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
              >
                + Add Category
              </button>
            </div>

            {/* Existing Categories List with Edit and Delete options */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 p-1">
              {(standaloneCatType === 'Income' ? incomeCategories : expenseCategories).map((cat) => {
                const isEditing = editingCategoryOldName === cat;

                return (
                  <div key={cat} className="flex items-center justify-between gap-2 p-2 text-xs hover:bg-slate-50 rounded-xl group">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingCategoryNewName}
                          onChange={(e) => setEditingCategoryNewName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditCategory(cat, standaloneCatType);
                            } else if (e.key === 'Escape') {
                              setEditingCategoryOldName(null);
                            }
                          }}
                          className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-blue-400 bg-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat, standaloneCatType)}
                          className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                          title="Save Category"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryOldName(null)}
                          className="p-1.5 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-800 flex-1 truncate">{cat}</span>
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat, standaloneCatType)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStandaloneCatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

