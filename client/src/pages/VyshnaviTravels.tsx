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
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Bus,
  ArrowUpDown,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { numberToWordsIndian } from '../utils/numberToWords';
import type { VyshnaviRecord, VyshnaviTransaction, VyshnaviServiceItem, Bus as BusType } from '../types';
import vyshnaviLogo from '../assets/vyshnavi-logo.png';

const DEFAULT_BANK_DETAILS = {
  bank_name: 'Kotak Mahindra Bank',
  bank_account_name: 'Vyshnavi Travels',
  bank_account_no: '2848153146',
  bank_ifsc: 'KKBK0007460',
  bank_branch: 'VANAS, Hyderabad',
  upi_id: '9000202241@ybl'
};

const SERVICE_CATEGORIES = ['Driver', 'Helper', 'Captain', 'Cleaner', 'Other'];

const INCOME_CATEGORIES = [
  'Trip Advance / Booking',
  'Client Settlement',
  'Passenger Fare',
  'Bus Lease / Rental',
  'Special Charter Tour',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Diesel / Fuel',
  'Repairs & Maintenance',
  'Toll & Taxes (FASTag)',
  'Driver Bata / Daily Allowance',
  'Staff Salary',
  'Tyres & Wheel Service',
  'Police & RTO Challan',
  'Vehicle Insurance & Tax',
  'Lubricants & AdBlue',
  'Office & Admin',
  'Other Expense'
];

export const VyshnaviTravels: React.FC = () => {
  const { success, error } = useToast();

  // Active Tab: 'records' | 'transactions'
  const [activeTab, setActiveTab] = useState<'records' | 'transactions'>('records');

  // Data States
  const [records, setRecords] = useState<VyshnaviRecord[]>([]);
  const [transactions, setTransactions] = useState<VyshnaviTransaction[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Records Filters
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatusFilter, setRecordStatusFilter] = useState('All');
  const [recordPeriodFilter, setRecordPeriodFilter] = useState('All');

  // Transactions Filters
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [txnCategoryFilter, setTxnCategoryFilter] = useState('All');
  const [txnVehicleFilter, setTxnVehicleFilter] = useState('All');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VyshnaviRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<VyshnaviRecord | null>(null);

  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<VyshnaviTransaction | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Record Form State
  const [recordForm, setRecordForm] = useState<{
    record_number: string;
    record_date: string;
    period_month: string;
    payment_status: 'Pending' | 'Paid' | 'Partially Paid' | 'Cancelled';
    bill_to_name: string;
    bill_to_phone: string;
    bill_to_address: string;
    bill_to_pan: string;
    items: VyshnaviServiceItem[];
    received_amount: number;
    bank_name: string;
    bank_account_name: string;
    bank_account_no: string;
    bank_ifsc: string;
    bank_branch: string;
    upi_id: string;
    qr_code_url: string;
    remarks: string;
  }>({
    record_number: '',
    record_date: new Date().toISOString().split('T')[0],
    period_month: '',
    payment_status: 'Pending',
    bill_to_name: '',
    bill_to_phone: '',
    bill_to_address: '',
    bill_to_pan: '',
    items: [
      {
        sr_no: 1,
        description: "Driver's monthly salary",
        category: 'Driver',
        staff_count: 1,
        salary_paid: 20000
      }
    ],
    received_amount: 0,
    ...DEFAULT_BANK_DETAILS,
    qr_code_url: '',
    remarks: ''
  });

  // Transaction Form State
  const [txnForm, setTxnForm] = useState<{
    transaction_type: 'Income' | 'Expense';
    transaction_date: string;
    category: string;
    vehicle_number: string;
    amount: string | number;
    payment_mode: string;
    party_name: string;
    description: string;
    reference_no: string;
    receipt_url: string;
  }>({
    transaction_type: 'Income',
    transaction_date: new Date().toISOString().split('T')[0],
    category: INCOME_CATEGORIES[0],
    vehicle_number: 'All / General Fleet',
    amount: '',
    payment_mode: 'UPI',
    party_name: '',
    description: '',
    reference_no: '',
    receipt_url: ''
  });

  // Load Records
  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const data = await api.getVyshnaviRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Load Transactions
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const data = await api.getVyshnaviTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load Fleet Buses
  useEffect(() => {
    loadRecords();
    loadTransactions();
    api.getBuses().then((res) => {
      if (Array.isArray(res)) setBuses(res);
    }).catch(() => {});
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = recordSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.record_number || '').toLowerCase().includes(q) ||
        (r.bill_to_name || '').toLowerCase().includes(q) ||
        (r.bill_to_phone || '').toLowerCase().includes(q) ||
        (r.period_month || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (recordStatusFilter !== 'All' && r.payment_status !== recordStatusFilter) return false;
      if (recordPeriodFilter !== 'All' && r.period_month !== recordPeriodFilter) return false;
      return true;
    });
  }, [records, recordSearch, recordStatusFilter, recordPeriodFilter]);

  // Record Metrics
  const recordMetrics = useMemo(() => {
    const totalBilled = records.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
    const totalReceived = records.reduce((sum, r) => sum + (Number(r.received_amount) || 0), 0);
    const totalBalance = records.reduce((sum, r) => sum + (Number(r.balance_amount) || 0), 0);
    return {
      totalBilled,
      totalReceived,
      totalBalance,
      count: records.length
    };
  }, [records]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = txnSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.party_name || '').toLowerCase().includes(q) ||
        (t.vehicle_number || '').toLowerCase().includes(q) ||
        (t.reference_no || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (txnTypeFilter !== 'All' && t.transaction_type !== txnTypeFilter) return false;
      if (txnCategoryFilter !== 'All' && t.category !== txnCategoryFilter) return false;
      if (txnVehicleFilter !== 'All' && t.vehicle_number !== txnVehicleFilter) return false;
      return true;
    });
  }, [transactions, txnSearch, txnTypeFilter, txnCategoryFilter, txnVehicleFilter]);

  // Transaction Metrics
  const txnMetrics = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.transaction_type === 'Income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = transactions
      .filter((t) => t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;
    return {
      totalIncome,
      totalExpense,
      netBalance,
      count: transactions.length
    };
  }, [transactions]);

  // Record Calculations
  const calculatedTotalStaff = useMemo(() => {
    return recordForm.items.reduce((sum, it) => sum + (Number(it.staff_count) || 0), 0);
  }, [recordForm.items]);

  const calculatedTotalAmount = useMemo(() => {
    return recordForm.items.reduce((sum, it) => sum + (Number(it.salary_paid) || 0), 0);
  }, [recordForm.items]);

  const calculatedBalanceDue = useMemo(() => {
    const billed = calculatedTotalAmount;
    const received = Number(recordForm.received_amount) || 0;
    return Math.max(0, billed - received);
  }, [calculatedTotalAmount, recordForm.received_amount]);

  const calculatedAmountWords = useMemo(() => {
    return numberToWordsIndian(calculatedTotalAmount);
  }, [calculatedTotalAmount]);

  // Live QR Code Generation for Record Form
  const liveQrUrl = useMemo(() => {
    if (recordForm.qr_code_url) return recordForm.qr_code_url;
    const upi = recordForm.upi_id || '9000202241@ybl';
    const payee = recordForm.bank_account_name || 'Vyshnavi Travels';
    const amt = calculatedBalanceDue > 0 ? calculatedBalanceDue : calculatedTotalAmount;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${encodeURIComponent(
      upi
    )}%26pn=${encodeURIComponent(payee)}%26am=${amt}%26cu=INR`;
  }, [recordForm.qr_code_url, recordForm.upi_id, recordForm.bank_account_name, calculatedBalanceDue, calculatedTotalAmount]);

  // Handlers for Record Service Rows
  const handleAddServiceRow = () => {
    setRecordForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sr_no: prev.items.length + 1,
          description: '',
          category: 'Driver',
          staff_count: 1,
          salary_paid: 0
        }
      ]
    }));
  };

  const handleUpdateServiceRow = (index: number, field: keyof VyshnaviServiceItem, value: any) => {
    setRecordForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleRemoveServiceRow = (index: number) => {
    if (recordForm.items.length <= 1) {
      error('At least one service row is required');
      return;
    }
    setRecordForm((prev) => {
      const filtered = prev.items.filter((_, i) => i !== index);
      const renumbered = filtered.map((item, idx) => ({ ...item, sr_no: idx + 1 }));
      return { ...prev, items: renumbered };
    });
  };

  // Open Record Modal for Add
  const handleOpenAddRecord = () => {
    const nextRecNum = `VT-REC-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, '0')}`;
    setEditingRecord(null);
    setRecordForm({
      record_number: nextRecNum,
      record_date: new Date().toISOString().split('T')[0],
      period_month: '',
      payment_status: 'Pending',
      bill_to_name: '',
      bill_to_phone: '',
      bill_to_address: '',
      bill_to_pan: '',
      items: [
        {
          sr_no: 1,
          description: "Driver's monthly salary",
          category: 'Driver',
          staff_count: 2,
          salary_paid: 32000
        }
      ],
      received_amount: 0,
      ...DEFAULT_BANK_DETAILS,
      qr_code_url: '',
      remarks: ''
    });
    setIsRecordModalOpen(true);
  };

  // Open Record Modal for Edit
  const handleOpenEditRecord = (rec: VyshnaviRecord) => {
    setEditingRecord(rec);
    setRecordForm({
      record_number: rec.record_number || '',
      record_date: rec.record_date || new Date().toISOString().split('T')[0],
      period_month: rec.period_month || '',
      payment_status: rec.payment_status || 'Pending',
      bill_to_name: rec.bill_to_name || '',
      bill_to_phone: rec.bill_to_phone || '',
      bill_to_address: rec.bill_to_address || '',
      bill_to_pan: rec.bill_to_pan || '',
      items: rec.items && rec.items.length > 0 ? rec.items : [
        {
          sr_no: 1,
          description: "Driver's salary",
          category: 'Driver',
          staff_count: 1,
          salary_paid: rec.total_amount || 0
        }
      ],
      received_amount: rec.received_amount || 0,
      bank_name: rec.bank_name || DEFAULT_BANK_DETAILS.bank_name,
      bank_account_name: rec.bank_account_name || DEFAULT_BANK_DETAILS.bank_account_name,
      bank_account_no: rec.bank_account_no || DEFAULT_BANK_DETAILS.bank_account_no,
      bank_ifsc: rec.bank_ifsc || DEFAULT_BANK_DETAILS.bank_ifsc,
      bank_branch: rec.bank_branch || DEFAULT_BANK_DETAILS.bank_branch,
      upi_id: rec.upi_id || DEFAULT_BANK_DETAILS.upi_id,
      qr_code_url: rec.qr_code_url || '',
      remarks: rec.remarks || ''
    });
    setIsRecordModalOpen(true);
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.record_number.trim()) {
      error('Record / Invoice Number is required');
      return;
    }
    if (!recordForm.bill_to_name.trim()) {
      error('Company / Client Name is required');
      return;
    }
    if (recordForm.items.length === 0) {
      error('Please add at least one service item');
      return;
    }

    const payload: VyshnaviRecord = {
      record_number: recordForm.record_number,
      record_date: recordForm.record_date,
      period_month: recordForm.period_month,
      payment_status: recordForm.payment_status,
      bill_to_name: recordForm.bill_to_name,
      bill_to_phone: recordForm.bill_to_phone,
      bill_to_address: recordForm.bill_to_address,
      bill_to_pan: recordForm.bill_to_pan,
      items: recordForm.items,
      total_staff_count: calculatedTotalStaff,
      total_amount: calculatedTotalAmount,
      amount_in_words: calculatedAmountWords,
      received_amount: Number(recordForm.received_amount) || 0,
      balance_amount: calculatedBalanceDue,
      bank_name: recordForm.bank_name,
      bank_account_name: recordForm.bank_account_name,
      bank_account_no: recordForm.bank_account_no,
      bank_ifsc: recordForm.bank_ifsc,
      bank_branch: recordForm.bank_branch,
      upi_id: recordForm.upi_id,
      qr_code_url: liveQrUrl,
      remarks: recordForm.remarks
    };

    try {
      if (editingRecord?.id) {
        await api.updateVyshnaviRecord(editingRecord.id, payload);
        success('Record updated successfully');
      } else {
        await api.createVyshnaviRecord(payload);
        success('New record created successfully');
      }
      setIsRecordModalOpen(false);
      loadRecords();
    } catch (err: any) {
      error(err?.message || 'Failed to save record');
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: number | undefined) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this billing record?')) return;
    try {
      await api.deleteVyshnaviRecord(id);
      success('Record deleted');
      loadRecords();
    } catch {
      error('Failed to delete record');
    }
  };

  // Open Transaction Modal for Add
  const handleOpenAddTxn = (type: 'Income' | 'Expense' = 'Income') => {
    setEditingTxn(null);
    setTxnForm({
      transaction_type: type,
      transaction_date: new Date().toISOString().split('T')[0],
      category: '',
      vehicle_number: buses.length > 0 ? (buses[0].registration_number || buses[0].bus_number).split('(')[0].trim() : 'General / Fleet Wide',
      amount: '',
      payment_mode: 'UPI',
      party_name: '',
      description: '',
      reference_no: '',
      receipt_url: ''
    });
    setIsTxnModalOpen(true);
  };

  // Open Transaction Modal for Edit
  const handleOpenEditTxn = (txn: VyshnaviTransaction) => {
    setEditingTxn(txn);
    setTxnForm({
      transaction_type: txn.transaction_type,
      transaction_date: txn.transaction_date || new Date().toISOString().split('T')[0],
      category: txn.category || '',
      vehicle_number: (txn.vehicle_number || 'General / Fleet Wide').split('(')[0].trim(),
      amount: txn.amount || '',
      payment_mode: txn.payment_mode || 'UPI',
      party_name: txn.party_name || '',
      description: txn.description || '',
      reference_no: txn.reference_no || '',
      receipt_url: txn.receipt_url || ''
    });
    setIsTxnModalOpen(true);
  };

  // Save Transaction
  const handleSaveTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      error('Please enter a valid amount');
      return;
    }
    if (!txnForm.category || !txnForm.category.trim()) {
      error('Please enter a category');
      return;
    }
    if (!txnForm.description.trim()) {
      error('Description is required');
      return;
    }

    const payload: VyshnaviTransaction = {
      transaction_type: txnForm.transaction_type,
      transaction_date: txnForm.transaction_date,
      category: txnForm.category.trim(),
      vehicle_number: (txnForm.vehicle_number || 'General / Fleet Wide').split('(')[0].trim(),
      amount: Number(txnForm.amount) || 0,
      payment_mode: txnForm.payment_mode,
      party_name: txnForm.party_name,
      description: txnForm.description,
      reference_no: txnForm.reference_no,
      receipt_url: txnForm.receipt_url
    };

    try {
      if (editingTxn?.id) {
        await api.updateVyshnaviTransaction(editingTxn.id, payload);
        success('Transaction updated');
      } else {
        await api.createVyshnaviTransaction(payload);
        success('Transaction recorded');
      }
      setIsTxnModalOpen(false);
      loadTransactions();
    } catch (err: any) {
      error(err?.message || 'Failed to save transaction');
    }
  };

  // Delete Transaction
  const handleDeleteTxn = async (id: number | undefined) => {
    if (!id) return;
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteVyshnaviTransaction(id);
      success('Transaction deleted');
      loadTransactions();
    } catch {
      error('Failed to delete transaction');
    }
  };

  // Handle Receipt File Upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      if (res?.fileUrl) {
        setTxnForm((prev) => ({ ...prev, receipt_url: res.fileUrl }));
        success('Receipt uploaded');
      }
    } catch {
      error('Failed to upload receipt');
    }
  };

  // Print Letterhead Action via Isolated IFrame
  const handlePrintLetterhead = (recordToPrint: VyshnaviRecord) => {
    const printElement = document.getElementById('vyshnavi-printable-letterhead');
    if (!printElement) {
      window.print();
      return;
    }

    let iframe = document.getElementById('vyshnavi-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vyshnavi-print-frame';
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
          <title>Vyshnavi Travels - ${recordToPrint.record_number || 'Statement'}</title>
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
            #isolated-letterhead-wrap {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          <div id="isolated-letterhead-wrap">
            ${printElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
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

  // Export Transactions to CSV
  const handleExportTxnCsv = () => {
    if (filteredTransactions.length === 0) {
      error('No transactions to export');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Vehicle Number', 'Amount (INR)', 'Payment Mode', 'Party Name', 'Reference No', 'Description'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.transaction_date,
      t.transaction_type,
      `"${t.category || ''}"`,
      `"${t.vehicle_number || ''}"`,
      t.amount,
      `"${t.payment_mode || ''}"`,
      `"${t.party_name || ''}"`,
      `"${t.reference_no || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vyshnavi_Travels_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported ledger CSV successfully');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center py-1">
          <img
            src={vyshnaviLogo}
            alt="Vyshnavi Travels"
            className="h-20 sm:h-24 md:h-28 w-auto object-contain max-w-[340px] sm:max-w-[460px] drop-shadow-2xs transition-all"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/vyshnavi-logo.png';
            }}
          />
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'records'
                  ? 'bg-white text-[#142B4A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Billing & Service Records</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'records' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {records.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-[#142B4A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Income & Expense Ledger</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'transactions' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {transactions.length}
              </span>
            </button>
          </div>

          {activeTab === 'records' ? (
            <button
              type="button"
              onClick={handleOpenAddRecord}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#142B4A] hover:bg-[#0F2042] text-white text-xs font-bold shadow-md shadow-blue-950/15 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddTxn('Income')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Income</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddTxn('Expense')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>- Expense</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BILLING & SERVICE RECORDS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                ₹{recordMetrics.totalBilled.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Sum of all generated statements</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Amount Received</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                ₹{recordMetrics.totalReceived.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Settled via Bank & UPI</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Balance Due</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-rose-600">
                ₹{recordMetrics.totalBalance.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Pending client clearance</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{recordMetrics.count}</div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Service billing records</p>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search record #, client, month..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={recordStatusFilter}
                  onChange={(e) => setRecordStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {(recordSearch || recordStatusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSearch('');
                    setRecordStatusFilter('All');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">S.No</th>
                    <th className="py-3 px-4">Record / Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Billed To (Client)</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4 text-center">Staff Count</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Received</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingRecords ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        Loading Vyshnavi Travels records...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        No billing & service records found. Click <strong>Add Record</strong> to generate one.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec, index) => {
                      const isPaid = rec.payment_status === 'Paid';
                      const isPartial = rec.payment_status === 'Partially Paid';
                      return (
                        <tr key={rec.id || index} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="py-3.5 px-4 font-bold text-slate-400">{index + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-[#142B4A] tracking-wide">{rec.record_number}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{rec.record_date}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{rec.bill_to_name}</div>
                            {rec.bill_to_phone && (
                              <div className="text-[11px] text-slate-400 font-medium">{rec.bill_to_phone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {rec.period_month || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                              <Users className="w-3 h-3 text-slate-500" />
                              {rec.total_staff_count || (rec.items?.length ?? 1)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900">
                            ₹{(rec.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                            ₹{(rec.received_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                            ₹{(rec.balance_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rec.payment_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Print Sheet on Letterhead */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintingRecord(rec);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Print on Vyshnavi Travels Letterhead"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-700" />
                                <span>Print</span>
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditRecord(rec)}
                                className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                title="Delete Record"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INCOME & EXPENSE LEDGER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Income</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                + ₹{txnMetrics.totalIncome.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Bookings, client settlements & fares</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Expenses</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-rose-600">
                - ₹{txnMetrics.totalExpense.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Diesel, maintenance, FASTag, salary</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Net Cash Flow</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className={`mt-2 text-2xl font-black ${txnMetrics.netBalance >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
                ₹{txnMetrics.netBalance.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                {txnMetrics.netBalance >= 0 ? 'Net positive operational surplus' : 'Deficit / outstanding'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{txnMetrics.count}</div>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Total entries logged</p>
            </div>
          </div>

          {/* Filter & Toolbar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, party, vehicle, ref #..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              {/* Type Switcher */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('All')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    txnTypeFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('Income')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    txnTypeFilter === 'Income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('Expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    txnTypeFilter === 'Expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Expense
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={txnCategoryFilter}
                onChange={(e) => setTxnCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <optgroup label="Income Categories">
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Expense Categories">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                {Array.from(new Set(transactions.map((t) => t.category).filter((c) => c && !INCOME_CATEGORIES.includes(c) && !EXPENSE_CATEGORIES.includes(c)))).length > 0 && (
                  <optgroup label="Other Categories">
                    {Array.from(new Set(transactions.map((t) => t.category).filter((c) => c && !INCOME_CATEGORIES.includes(c) && !EXPENSE_CATEGORIES.includes(c)))).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Vehicle Filter */}
              <select
                value={txnVehicleFilter}
                onChange={(e) => setTxnVehicleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Vehicles</option>
                {buses.map((b) => {
                  const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
                  return (
                    <option key={b.id || reg} value={reg}>{reg}</option>
                  );
                })}
                <option value="General / Fleet Wide">General / Fleet Wide</option>
              </select>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportTxnCsv}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export transactions to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">S.No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vehicle #</th>
                    <th className="py-3 px-4">Party / Client / Vendor</th>
                    <th className="py-3 px-4">Description / Particulars</th>
                    <th className="py-3 px-4">Payment Mode & Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        No transactions found. Log income or expense via the buttons above.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t, idx) => {
                      const isIncome = t.transaction_type === 'Income';
                      return (
                        <tr key={t.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{t.transaction_date}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {t.transaction_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{t.category}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {t.vehicle_number || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">{t.party_name || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate" title={t.description}>
                            {t.description}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">{t.payment_mode || 'UPI'}</div>
                            {t.reference_no && (
                              <div className="text-[10px] text-slate-400 font-mono">{t.reference_no}</div>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-black ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'} ₹{(Number(t.amount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {t.receipt_url ? (
                              <button
                                type="button"
                                onClick={() => setPreviewReceiptUrl(t.receipt_url || null)}
                                className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="View Receipt"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTxn(t)}
                                className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTxn(t.id)}
                                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT BILLING & SERVICE RECORD (MATCHES IMAGES 2 & 3)       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={editingRecord ? 'Edit Billing & Service Record' : 'Add New Billing & Service Record'}
        subtitle="Add service rows, staff counts, salary amounts, and billing details manually."
        size="2xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-6">
          {/* Section 1: Record Details & Billing Period */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>1. Record Details & Billing Period</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Record / Invoice No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recordForm.record_number}
                  onChange={(e) => setRecordForm({ ...recordForm, record_number: e.target.value })}
                  placeholder="e.g. VT-REC-2026-001"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Record Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={recordForm.record_date}
                  onChange={(e) => setRecordForm({ ...recordForm, record_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Billing Period / Month</label>
                <input
                  type="text"
                  value={recordForm.period_month}
                  onChange={(e) => setRecordForm({ ...recordForm, period_month: e.target.value })}
                  placeholder="e.g. Aug'26 or Oct 2026"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={recordForm.payment_status}
                  onChange={(e) => setRecordForm({ ...recordForm, payment_status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To (Client Details) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>2. Bill To (Client / Organization Details)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company / Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recordForm.bill_to_name}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_name: e.target.value })}
                  placeholder="e.g. Yolobus Private Limited / Sri Krishna Travels"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Mobile Number</label>
                <input
                  type="tel"
                  value={recordForm.bill_to_phone}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_phone: e.target.value })}
                  placeholder="e.g. 9396151527"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Address</label>
                <input
                  type="text"
                  value={recordForm.bill_to_address}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_address: e.target.value })}
                  placeholder="e.g. Unit 330, JMD Megapolis, Sohna Road, Gurugram"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client PAN / GST Number</label>
                <input
                  type="text"
                  value={recordForm.bill_to_pan}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_pan: e.target.value })}
                  placeholder="e.g. AABCY5013H"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Staff Breakdown */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Users className="w-4 h-4 text-purple-600" />
                <span>3. Services & Staff Breakdown</span>
              </div>
              <button
                type="button"
                onClick={handleAddServiceRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Service Row</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">Sr.No</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Description of Services *</th>
                    <th className="py-2.5 px-3 w-32">Category *</th>
                    <th className="py-2.5 px-3 w-36 text-center">No of Drivers / Cleaners</th>
                    <th className="py-2.5 px-3 w-36 text-right">Salary Paid (₹) *</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recordForm.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleUpdateServiceRow(idx, 'description', e.target.value)}
                          placeholder="e.g. Driver's Salary for AP16TV1234 route"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateServiceRow(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.staff_count}
                          onChange={(e) => handleUpdateServiceRow(idx, 'staff_count', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.salary_paid}
                            onChange={(e) => handleUpdateServiceRow(idx, 'salary_paid', parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-right text-slate-900 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Total Summary Row */}
                  <tr className="bg-slate-50/90 font-black text-xs border-t-2 border-slate-200">
                    <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-slate-700">
                      Total:
                    </td>
                    <td className="py-3 px-3 text-center text-slate-900">
                      {calculatedTotalStaff}
                    </td>
                    <td className="py-3 px-3 text-right text-[#142B4A] text-sm">
                      ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* In Words */}
            <div className="text-[11px] font-bold text-slate-600 italic px-1">
              <span>In words: </span>
              <strong className="text-slate-900 font-black not-italic">{calculatedAmountWords}</strong>
            </div>
          </div>

          {/* Section 4: Payment & Settlement Summary */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <IndianRupee className="w-4 h-4 text-blue-600" />
              <span>4. Payment & Settlement Summary</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-[10px] font-black uppercase text-slate-400">Total Billed</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">
                  Received Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={recordForm.received_amount}
                  onChange={(e) => setRecordForm({ ...recordForm, received_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-black text-emerald-800 focus:outline-none"
                />
              </div>

              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80">
                <span className="block text-[10px] font-black uppercase text-rose-700">Balance Due</span>
                <span className="text-xl font-black text-rose-700 mt-1 block">
                  ₹{calculatedBalanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Bank Details & Payment QR Code */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-purple-600" />
              <span>5. Bank Details & Payment QR Code</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Bank Info */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Official Bank Details</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Account Holder Name</label>
                  <input
                    type="text"
                    value={recordForm.bank_account_name}
                    onChange={(e) => setRecordForm({ ...recordForm, bank_account_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Account Number</label>
                  <input
                    type="text"
                    value={recordForm.bank_account_no}
                    onChange={(e) => setRecordForm({ ...recordForm, bank_account_no: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">IFSC Code</label>
                    <input
                      type="text"
                      value={recordForm.bank_ifsc}
                      onChange={(e) => setRecordForm({ ...recordForm, bank_ifsc: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">Bank & Branch</label>
                    <input
                      type="text"
                      value={recordForm.bank_name}
                      onChange={(e) => setRecordForm({ ...recordForm, bank_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Payment QR & UPI ID */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Payment QR & UPI ID</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">UPI ID (PhonePe / GPay / PayTM)</label>
                  <input
                    type="text"
                    value={recordForm.upi_id}
                    onChange={(e) => setRecordForm({ ...recordForm, upi_id: e.target.value })}
                    placeholder="9000202241@ybl"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-purple-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <img
                      src={liveQrUrl}
                      alt="UPI Payment QR Code"
                      className="w-20 h-20 object-contain block"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">Live QR Preview</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Scannable with any UPI app on the printed Vyshnavi Travels record sheet.
                    </p>
                    <span className="text-[10px] text-purple-700 font-bold block">{recordForm.upi_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#142B4A] hover:bg-[#0F2042] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {editingRecord ? 'Save Changes' : 'Save & Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT INCOME OR EXPENSE TRANSACTION                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        title={editingTxn ? 'Edit Transaction' : `Add ${txnForm.transaction_type} Entry`}
        subtitle="Record cash flow, bookings, diesel top-up, client settlements, or fleet expenses."
        size="lg"
      >
        <form onSubmit={handleSaveTxn} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTxnForm((prev) => ({ ...prev, transaction_type: 'Income' }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                txnForm.transaction_type === 'Income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Income (Money In)
            </button>
            <button
              type="button"
              onClick={() => setTxnForm((prev) => ({ ...prev, transaction_type: 'Expense' }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                txnForm.transaction_type === 'Expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Expense (Money Out)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={txnForm.transaction_date}
                onChange={(e) => setTxnForm({ ...txnForm, transaction_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={txnForm.amount}
                  onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="vyshnavi-category-suggestions"
                placeholder={txnForm.transaction_type === 'Income' ? 'Type income category (e.g. Trip Advance, Booking...)' : 'Type expense category (e.g. Diesel, Maintenance, Toll...)'}
                value={txnForm.category}
                onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <datalist id="vyshnavi-category-suggestions">
                {(txnForm.transaction_type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Linked</label>
              <select
                value={txnForm.vehicle_number}
                onChange={(e) => setTxnForm({ ...txnForm, vehicle_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="General / Fleet Wide">General / Fleet Wide</option>
                {buses.map((b) => {
                  const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
                  return (
                    <option key={b.id || reg} value={reg}>
                      {reg}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Party / Client / Vendor Name</label>
              <input
                type="text"
                placeholder="e.g. Sri Krishna Travels / Indian Oil"
                value={txnForm.party_name}
                onChange={(e) => setTxnForm({ ...txnForm, party_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={txnForm.payment_mode}
                onChange={(e) => setTxnForm({ ...txnForm, payment_mode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online / Net Banking">Online / Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="FASTag">FASTag</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diesel top-up 150L at Suryapet highway bunk"
              value={txnForm.description}
              onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference / UTR / Bill No</label>
              <input
                type="text"
                placeholder="e.g. UTR-982138 or Bill #5421"
                value={txnForm.reference_no}
                onChange={(e) => setTxnForm({ ...txnForm, reference_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Invoice Image</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{txnForm.receipt_url ? 'Change Image' : 'Upload Receipt'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
                {txnForm.receipt_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewReceiptUrl(txnForm.receipt_url)}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                    title="Preview uploaded receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTxnModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${
                txnForm.transaction_type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {editingTxn ? 'Save Changes' : `Save ${txnForm.transaction_type}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL VYSHNAVI TRAVELS LETTERHEAD PRINT PREVIEW (IMAGE 1)     */}
      {/* ========================================================================= */}
      {printingRecord && (
        <Modal
          isOpen={!!printingRecord}
          onClose={() => setPrintingRecord(null)}
          title="Print Official Statement on Vyshnavi Travels Letterhead"
          subtitle="Pre-formatted on Vyshnavi Travels official header with scannable QR code and company footer."
          size="2xl"
        >
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                Record No: <strong className="text-slate-900 font-black">{printingRecord.record_number}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintLetterhead(printingRecord)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingRecord(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="bg-slate-100 p-4 rounded-2xl overflow-y-auto max-h-[75vh]">
              {/* THE OFFICIAL PRINTABLE A4 LETTERHEAD SHEET */}
              <div
                id="vyshnavi-printable-letterhead"
                className="bg-white mx-auto shadow-xl rounded-sm p-8 text-slate-900 font-sans flex flex-col justify-between"
                style={{ width: '100%', maxWidth: '780px', minHeight: '1050px' }}
              >
                {/* 1. Official Letterhead Header (Image 1 top) */}
                <div>
                  <div style={{ height: '112px', overflow: 'hidden', width: '100%' }}>
                    <img
                      src="/vyshnavi-travels-letterhead.jpg"
                      alt="Vyshnavi Travels Official Letterhead Header"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>

                  {/* Document Title Banner */}
                  <div className="mt-4 text-center border-b-2 border-slate-800 pb-2">
                    <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
                      SERVICE BILLING & STAFF STATEMENT
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Crew Duty, Staff Salaries & Monthly Operations Settlement
                    </p>
                  </div>

                  {/* 2. Client & Statement Metadata */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    {/* Bill To */}
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Billed To (Client / Operator)
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1">{printingRecord.bill_to_name}</h3>
                      {printingRecord.bill_to_address && (
                        <p className="text-slate-600 text-[11px] mt-0.5">{printingRecord.bill_to_address}</p>
                      )}
                      {printingRecord.bill_to_phone && (
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          <span className="font-semibold text-slate-500">Contact: </span>
                          {printingRecord.bill_to_phone}
                        </p>
                      )}
                      {printingRecord.bill_to_pan && (
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          <span className="font-semibold text-slate-500">PAN / GSTIN: </span>
                          <span className="font-mono font-bold uppercase">{printingRecord.bill_to_pan}</span>
                        </p>
                      )}
                    </div>

                    {/* Statement Details */}
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Statement / Invoice No:</span>
                        <strong className="font-black text-[#142B4A]">{printingRecord.record_number}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Record Date:</span>
                        <span className="font-medium text-slate-800">{printingRecord.record_date}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Billing Period / Month:</span>
                        <span className="font-bold text-slate-900">{printingRecord.period_month || 'Current Cycle'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-semibold">Payment Status:</span>
                        <span className="font-black uppercase tracking-wider text-blue-900">
                          {printingRecord.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Services & Staff Breakdown Table */}
                  <div className="mt-4 border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-slate-300">Sr.No</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Description of Services</th>
                          <th className="py-2.5 px-3 w-28 text-center border-r border-slate-300">Category</th>
                          <th className="py-2.5 px-3 w-28 text-center border-r border-slate-300">Staff Count</th>
                          <th className="py-2.5 px-3 w-32 text-right">Salary Paid (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {printingRecord.items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 border-r border-slate-200">
                              {item.description}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                              {item.category}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800 border-r border-slate-200">
                              {item.staff_count}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              ₹{(Number(item.salary_paid) || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}

                        {/* Grand Total Row */}
                        <tr className="bg-slate-100/90 font-black text-xs border-t-2 border-slate-400">
                          <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-800 border-r border-slate-300">
                            Grand Total:
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-900 border-r border-slate-300 font-black">
                            {printingRecord.total_staff_count || printingRecord.items?.length || 1}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-950 font-black text-sm">
                            ₹{(printingRecord.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Amount in words */}
                  <div className="mt-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
                    <span className="font-semibold text-slate-500">Amount in Words: </span>
                    <strong className="font-black text-slate-950">
                      {printingRecord.amount_in_words || numberToWordsIndian(printingRecord.total_amount)}
                    </strong>
                  </div>

                  {/* 4. Payment Settlement Summary */}
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-slate-50 border border-slate-300 rounded">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed</span>
                      <strong className="text-sm font-black text-slate-900 block mt-0.5">
                        ₹{(printingRecord.total_amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Received Amount</span>
                      <strong className="text-sm font-black text-emerald-800 block mt-0.5">
                        ₹{(printingRecord.received_amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="p-2 bg-rose-50 border border-rose-300 rounded">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Balance Outstanding</span>
                      <strong className="text-sm font-black text-rose-800 block mt-0.5">
                        ₹{(printingRecord.balance_amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* 5. Bank Account & Payment QR */}
                  <div className="mt-4 border border-slate-300 rounded-lg p-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Bank Info */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block border-b border-slate-200 pb-1">
                        Bank Details for Direct Settlement
                      </span>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Account Name:</span>
                        <strong className="font-bold text-slate-900">{printingRecord.bank_account_name || 'Vyshnavi Travels'}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Account No:</span>
                        <strong className="font-mono font-black text-slate-900">{printingRecord.bank_account_no || '2848153146'}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">IFSC Code:</span>
                        <strong className="font-mono font-bold text-slate-900">{printingRecord.bank_ifsc || 'KKBK0007460'}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Bank:</span>
                        <span className="font-medium text-slate-800">{printingRecord.bank_name || 'Kotak Mahindra Bank, VANAS'}</span>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex items-center justify-between pl-3 border-l border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                          Instant UPI QR Code
                        </span>
                        <p className="text-[10px] text-slate-600 font-semibold">Scan via PhonePe, GPay, PayTM</p>
                        <p className="text-[11px] font-black text-purple-900 font-mono">
                          {printingRecord.upi_id || '9000202241@ybl'}
                        </p>
                        <p className="text-[9px] text-slate-400">Direct instant settlement to account</p>
                      </div>
                      <div className="p-1 bg-white border border-slate-300 rounded">
                        <img
                          src={
                            printingRecord.qr_code_url ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=${encodeURIComponent(
                              printingRecord.upi_id || '9000202241@ybl'
                            )}%26pn=${encodeURIComponent(printingRecord.bank_account_name || 'Vyshnavi Travels')}%26cu=INR`
                          }
                          alt="UPI Payment QR"
                          className="w-16 h-16 object-contain block"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-6 flex items-end justify-between pt-4 border-t border-slate-200 text-xs">
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p className="font-semibold text-slate-700">Notice:</p>
                      <p>1. Please settle statement balance before next cycle.</p>
                      <p>2. Computer generated statement by Vyshnavi Travels.</p>
                    </div>
                    <div className="text-center space-y-8">
                      <div className="w-40 border-b border-slate-400"></div>
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Authorized Signatory / Seal
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Official Letterhead Bottom Footer (Image 1 bottom) */}
                <div className="mt-8">
                  <div style={{ height: '62px', overflow: 'hidden', width: '100%', position: 'relative' }}>
                    <img
                      src="/vyshnavi-travels-letterhead.jpg"
                      alt="Vyshnavi Travels Official Letterhead Footer"
                      style={{ width: '100%', height: 'auto', display: 'block', position: 'absolute', bottom: 0, left: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECEIPT IMAGE PREVIEW                                            */}
      {/* ========================================================================= */}
      {previewReceiptUrl && (
        <Modal
          isOpen={!!previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
          title="Transaction Receipt / Invoice"
          size="md"
        >
          <div className="space-y-4 text-center">
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-100 p-2">
              <img
                src={previewReceiptUrl}
                alt="Receipt preview"
                className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
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
export default VyshnaviTravels;

