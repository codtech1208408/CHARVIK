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
  AlertCircle,
  ArrowRight,
  Tag,
  Check,
  ChevronDown,
  Landmark
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { numberToWordsIndian } from '../utils/numberToWords';
import { exportTableToExcel } from '../utils/exportToExcel';
import { OperatorSearchSelect, DEFAULT_PRESET_OPERATORS } from '../components/common/OperatorSearchSelect';
import { SearchableSelect } from '../components/common/SearchableSelect';
import type { VyshnaviRecord, VyshnaviTransaction, VyshnaviServiceItem, Bus as BusType } from '../types';
import vyshnaviLogo from '../assets/vyshnavi-logo.png';

const DEFAULT_BANK_DETAILS = {
  bank_name: 'Kotak Mahindra Bank',
  bank_account_name: 'Vyshnavi Travels',
  bank_account_no: '2848153146',
  bank_ifsc: 'KKBK0007460',
  bank_branch: 'VANAS, Hyderabad',
  upi_id: ''
};

export const DEFAULT_COMPANY_DETAILS = {
  company_phone: '+91 9505151527',
  company_email: 'vyshnavitravels@yahoo.com',
  company_website: 'www.vyshnavitravels.com',
  company_gst: '36ABCDE1234F1Z5',
  company_pan: 'AABPV1234D',
  company_address: 'Hyderabad, Telangana'
};

export const getSavedCompanyDetails = () => {
  try {
    const saved = localStorage.getItem('vyshnavi_company_details');
    if (saved) return { ...DEFAULT_COMPANY_DETAILS, ...JSON.parse(saved) };
  } catch { }
  return DEFAULT_COMPANY_DETAILS;
};

export const getParticularIcon = (desc: string) => {
  const d = (desc || '').toLowerCase();
  if (d.includes('stopping') || d.includes('consistency') || d.includes('week') || d.includes('month') || d.includes('date') || d.includes('stay')) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '5px', background: '#ffedd5', color: '#ea580c', fontSize: '13px', marginRight: '8px', verticalAlign: 'middle', border: '1px solid #fdba74', flexShrink: 0 }}>
        📅
      </span>
    );
  }
  if (d.includes('captain') || d.includes('supervision') || d.includes('passenger') || d.includes('care') || d.includes('route') || d.includes('trip') || d.includes('bus') || d.includes('driver')) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '5px', background: '#dbeafe', color: '#1d4ed8', fontSize: '13px', marginRight: '8px', verticalAlign: 'middle', border: '1px solid #bfdbfe', flexShrink: 0 }}>
        🚌
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '5px', background: '#e0e7ff', color: '#4338ca', fontSize: '13px', marginRight: '8px', verticalAlign: 'middle', border: '1px solid #c7d2fe', flexShrink: 0 }}>
      👥
    </span>
  );
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
  const [printFormat, setPrintFormat] = useState<'colourful' | 'letterhead'>('colourful');

  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<VyshnaviTransaction | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Category management (Add more, edit & delete for Income & Expense)
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_vyshnavi_income_categories');
      if (saved) return JSON.parse(saved);
      const general = localStorage.getItem('charvik_custom_income_categories');
      if (general) return JSON.parse(general);
    } catch { }
    return INCOME_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_vyshnavi_expense_categories');
      if (saved) return JSON.parse(saved);
      const general = localStorage.getItem('charvik_custom_expense_categories');
      if (general) return JSON.parse(general);
    } catch { }
    return EXPENSE_CATEGORIES;
  });

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isStandaloneCatModalOpen, setIsStandaloneCatModalOpen] = useState(false);
  const [standaloneCatType, setStandaloneCatType] = useState<'Income' | 'Expense'>('Income');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  // Vehicle Linked Manager State
  const [customVehicles, setCustomVehicles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vyshnavi_custom_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((v: string) => v && !v.toLowerCase().includes('general') && !v.toLowerCase().includes('fleet'));
        }
      }
    } catch { }
    return [
      'AP16TV1234',
      'AP16TC4567',
      'HR55X1200',
      'DL01A1024',
      'TS09UB9999'
    ];
  });
  const [isVehicleManagerOpen, setIsVehicleManagerOpen] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [editingVehicleOldName, setEditingVehicleOldName] = useState<string | null>(null);
  const [editingVehicleNewName, setEditingVehicleNewName] = useState('');

  // Party / Client / Vendor Manager State
  const [parties, setParties] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vyshnavi_custom_parties');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      'Sri Krishna Travels',
      'Indian Oil',
      'HPCL Fuel Depot',
      'Passenger Cash Counter',
      'TSRTC Transit Retainer',
      'Infosys Fleet Services',
      'Sri Balaji Tyres & Alignment'
    ];
  });
  const [isPartyManagerOpen, setIsPartyManagerOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [editingPartyOldName, setEditingPartyOldName] = useState<string | null>(null);
  const [editingPartyNewName, setEditingPartyNewName] = useState('');

  // Printout Report State (for full tab statement printing)
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);
  const [reportPrintType, setReportPrintType] = useState<'records' | 'transactions'>('records');
  const [reportOrientation, setReportOrientation] = useState<'landscape' | 'portrait'>('landscape');

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
    vehicle_number: string;
    bill_to_gst: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    company_gst: string;
    company_pan: string;
    company_address: string;
    upi_id: string;
    qr_code_url: string;
    remarks: string;
  }>({
    record_number: '',
    record_date: new Date().toISOString().split('T')[0],
    period_month: '',
    vehicle_number: '',
    payment_status: 'Pending',
    bill_to_name: '',
    bill_to_phone: '',
    bill_to_address: '',
    bill_to_pan: '',
    bill_to_gst: '',
    items: [
      {
        sr_no: 1,
        description: `LB Nagar to Gachibowli – Dropping Service\nGachibowli to LB Nagar – Pickup Service\nECL to LB Nagar – Pickup Service\n(From October 10th to November 10th)`,
        category: 'Service',
        staff_count: 1,
        salary_paid: 60000
      },
      {
        sr_no: 2,
        description: `Driver Salary – Two Drivers\n(From October 10th to November 10th)`,
        category: 'Driver',
        staff_count: 2,
        salary_paid: 40000
      }
    ],
    received_amount: 0,
    ...DEFAULT_BANK_DETAILS,
    ...getSavedCompanyDetails(),
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

  // Helper to normalize record so items and details are always populated
  const normalizeVyshnaviRecord = (rec: any): VyshnaviRecord => {
    if (!rec) return rec;
    let items: any[] = [];
    if (Array.isArray(rec.items) && rec.items.length > 0) {
      items = rec.items;
    } else if (rec.items_json) {
      try {
        const parsed = typeof rec.items_json === 'string' ? JSON.parse(rec.items_json) : rec.items_json;
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
      } catch (_) { }
    } else if (typeof rec.items === 'string') {
      try {
        const parsed = JSON.parse(rec.items);
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
      } catch (_) { }
    }

    // Fallback: If items is still empty, look for description, particulars, route or remarks
    if (!Array.isArray(items) || items.length === 0) {
      const fallbackDesc = rec.description || rec.particulars || rec.remarks || 'Fleet Bus Operational Duty & Crew Service';
      items = [
        {
          sr_no: 1,
          description: fallbackDesc,
          category: 'Driver',
          staff_count: Number(rec.total_staff_count) || 1,
          salary_paid: Number(rec.total_amount) || 0
        }
      ];
    }

    items = items.map((it: any, i: number) => ({
      sr_no: it.sr_no || i + 1,
      description: it.description || it.particulars || it.service || it.service_details || it.route || it.name || 'Fleet Service & Operations',
      category: it.category || 'Driver',
      staff_count: Number(it.staff_count) || 1,
      salary_paid: Number(it.salary_paid ?? it.amount ?? it.salary ?? it.total ?? 0)
    }));

    const compDefaults = getSavedCompanyDetails();
    return {
      ...rec,
      company_phone: rec.company_phone || compDefaults.company_phone,
      company_email: rec.company_email || compDefaults.company_email,
      company_website: rec.company_website || compDefaults.company_website,
      company_gst: rec.company_gst || compDefaults.company_gst,
      company_pan: rec.company_pan || compDefaults.company_pan,
      company_address: rec.company_address || compDefaults.company_address,
      items,
      items_json: JSON.stringify(items)
    };
  };

  // Load Records
  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const data = await api.getVyshnaviRecords();
      setRecords(Array.isArray(data) ? data.map(normalizeVyshnaviRecord) : []);
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
    }).catch(() => { });
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
    if (!recordForm.upi_id?.trim()) return '';
    const upi = recordForm.upi_id.trim();
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
      vehicle_number: '',
      payment_status: 'Pending',
      bill_to_name: '',
      bill_to_phone: '',
      bill_to_address: '',
      bill_to_pan: '',
      bill_to_gst: '',
      items: [
        {
          sr_no: 1,
          description: `LB Nagar to Gachibowli – Dropping Service\nGachibowli to LB Nagar – Pickup Service\nECL to LB Nagar – Pickup Service\n(From October 10th to November 10th)`,
          category: 'Service',
          staff_count: 1,
          salary_paid: 60000
        },
        {
          sr_no: 2,
          description: `Driver Salary – Two Drivers\n(From October 10th to November 10th)`,
          category: 'Driver',
          staff_count: 2,
          salary_paid: 40000
        }
      ],
      received_amount: 0,
      ...DEFAULT_BANK_DETAILS,
      ...getSavedCompanyDetails(),
      qr_code_url: '',
      remarks: ''
    });
    setIsRecordModalOpen(true);
  };

  // Open Record Modal for Edit
  const handleOpenEditRecord = (rawRec: VyshnaviRecord) => {
    const rec = normalizeVyshnaviRecord(rawRec);
    setEditingRecord(rec);
    setRecordForm({
      record_number: rec.record_number || '',
      record_date: rec.record_date || new Date().toISOString().split('T')[0],
      period_month: rec.period_month || '',
      vehicle_number: rec.vehicle_number || rec.period_month || '',
      payment_status: rec.payment_status || 'Pending',
      bill_to_name: rec.bill_to_name || '',
      bill_to_phone: rec.bill_to_phone || '',
      bill_to_address: rec.bill_to_address || '',
      bill_to_pan: rec.bill_to_pan || '',
      bill_to_gst: rec.bill_to_gst || '',
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
      company_phone: rec.company_phone || getSavedCompanyDetails().company_phone,
      company_email: rec.company_email || getSavedCompanyDetails().company_email,
      company_website: rec.company_website || getSavedCompanyDetails().company_website,
      company_gst: rec.company_gst || getSavedCompanyDetails().company_gst,
      company_pan: rec.company_pan || getSavedCompanyDetails().company_pan,
      company_address: rec.company_address || getSavedCompanyDetails().company_address,
      upi_id: rec.upi_id || '',
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
      period_month: recordForm.vehicle_number || recordForm.period_month,
      vehicle_number: recordForm.vehicle_number,
      payment_status: recordForm.payment_status,
      bill_to_name: recordForm.bill_to_name,
      bill_to_phone: recordForm.bill_to_phone,
      bill_to_address: recordForm.bill_to_address,
      bill_to_pan: recordForm.bill_to_pan,
      bill_to_gst: recordForm.bill_to_gst,
      items: recordForm.items,
      items_json: JSON.stringify(recordForm.items),
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
      company_phone: recordForm.company_phone,
      company_email: recordForm.company_email,
      company_website: recordForm.company_website,
      company_gst: recordForm.company_gst,
      company_pan: recordForm.company_pan,
      company_address: recordForm.company_address,
      upi_id: recordForm.upi_id?.trim() || '',
      qr_code_url: recordForm.upi_id?.trim() ? (liveQrUrl || recordForm.qr_code_url || '') : '',
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
      try {
        localStorage.setItem('vyshnavi_company_details', JSON.stringify({
          company_phone: recordForm.company_phone,
          company_email: recordForm.company_email,
          company_website: recordForm.company_website,
          company_gst: recordForm.company_gst,
          company_pan: recordForm.company_pan,
          company_address: recordForm.company_address
        }));
      } catch { }
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
      category: (type === 'Income' ? incomeCategories[0] : expenseCategories[0]) || '',
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
    handlePrintColourfulInvoice(recordToPrint);
  };

  // Print Colourful Invoice via Isolated IFrame (Matching Reference Template)
  const handlePrintColourfulInvoice = (recordToPrint: VyshnaviRecord) => {
    const printElement = document.getElementById('vyshnavi-printable-colourful-invoice');
    if (!printElement) {
      window.print();
      return;
    }

    let iframe = document.getElementById('vyshnavi-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vyshnavi-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1024px';
      iframe.style.height = '1440px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter((el) => !el.textContent?.includes('visibility: hidden'))
      .map((el) => el.outerHTML)
      .join('\n');

    const clone = printElement.cloneNode(true) as HTMLElement;
    clone.style.display = 'flex';
    clone.style.visibility = 'visible';
    clone.style.opacity = '1';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Vyshnavi Travels Invoice - ${recordToPrint.record_number || 'Statement'}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 6mm;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #002B49 !important;
              width: 100% !important;
              max-width: 100% !important;
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #vyshnavi-printable-colourful-invoice {
              width: 100% !important;
              max-width: 100% !important;
              background: #ffffff !important;
              color: #000000 !important;
              padding: 16px 20px !important;
              margin: 0 auto !important;
              border: 2.5px solid #004b93 !important;
              border-radius: 12px !important;
              min-height: auto !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              gap: 12px !important;
              position: relative !important;
              box-sizing: border-box !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
              }
              #vyshnavi-printable-colourful-invoice {
                border: 2.5px solid #004b93 !important;
                min-height: auto !important;
                page-break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
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

    const imgs = doc.querySelectorAll('img');
    let loadedCount = 0;
    const totalImgs = imgs.length;

    if (totalImgs === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      let isPrinted = false;
      const safeTrigger = () => {
        if (!isPrinted) {
          isPrinted = true;
          triggerPrint();
        }
      };
      for (let i = 0; i < totalImgs; i++) {
        if (imgs[i].complete) {
          loadedCount++;
          if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
        } else {
          imgs[i].onload = () => {
            loadedCount++;
            if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
          };
          imgs[i].onerror = () => {
            loadedCount++;
            if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
          };
        }
      }
      setTimeout(safeTrigger, 500);
    }
  };

  // Export Transactions to Excel
  const handleExportTxnsExcel = () => {
    if (filteredTransactions.length === 0) {
      error('No transactions to export');
      return;
    }
    const headers = ['S.No', 'Date', 'Type', 'Category', 'Vehicle Number', 'Amount (Rs)', 'Payment Mode', 'Party Name', 'Reference No', 'Description'];
    const rows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.transaction_date,
      t.transaction_type,
      t.category || '',
      t.vehicle_number || '',
      Number(t.amount) || 0,
      t.payment_mode || '',
      t.party_name || '',
      t.reference_no || '',
      t.description || ''
    ]);

    exportTableToExcel({
      title: 'Vyshnavi Travels - Income & Expense Ledger Statement',
      subtitle: `Total Transactions: ${filteredTransactions.length} | Income: Rs ${txnMetrics.totalIncome.toLocaleString('en-IN')} | Expenses: Rs ${txnMetrics.totalExpense.toLocaleString('en-IN')} | Balance: Rs ${txnMetrics.netBalance.toLocaleString('en-IN')}`,
      headers,
      rows
    });
    success('Exported ledger Excel successfully');
  };

  // Export Records to Excel
  const handleExportRecordsExcel = () => {
    if (filteredRecords.length === 0) {
      error('No billing records to export');
      return;
    }
    const headers = [
      'S.No',
      'Invoice / Record #',
      'Date',
      'Billed To (Client)',
      'Vehicle Number',
      'Services Count',
      'Total Amount (Rs)',
      'Advance Received (Rs)',
      'Balance Due (Rs)',
      'Payment Status'
    ];
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.record_number,
      r.record_date,
      r.bill_to_name,
      r.vehicle_number || r.period_month || '',
      (r.services || []).length,
      Number(r.total_amount) || 0,
      Number(r.received_amount) || 0,
      Number(r.balance_amount) || 0,
      r.payment_status || 'Pending'
    ]);

    exportTableToExcel({
      title: 'Vyshnavi Travels - Billing & Service Records Statement',
      subtitle: `Total Invoices: ${filteredRecords.length} | Total Billed: Rs ${recordMetrics.totalBilled.toLocaleString('en-IN')} | Total Received: Rs ${recordMetrics.totalReceived.toLocaleString('en-IN')} | Balance Due: Rs ${recordMetrics.totalBalance.toLocaleString('en-IN')}`,
      headers,
      rows
    });
    success('Exported billing records Excel successfully');
  };

  // Export Single Invoice to Excel
  const handleExportSingleRecordExcel = (rec: VyshnaviRecord) => {
    const headers = ['S.No', 'Date', 'Vehicle Number', 'Trip / Service Description', 'Kilometres', 'Rate (Rs)', 'Total Amount (Rs)'];
    const rows = (rec.services || []).map((s, idx) => [
      idx + 1,
      s.service_date || rec.record_date,
      s.vehicle_number || '-',
      s.description || 'Bus Charter Service',
      s.kilometers || '-',
      s.rate || 0,
      s.amount || 0
    ]);

    exportTableToExcel({
      title: `Vyshnavi Travels - Tax Invoice / Service Bill #${rec.record_number}`,
      subtitle: `Client: ${rec.bill_to_name} | Date: ${rec.record_date} | Total Amount: Rs ${Number(rec.total_amount).toLocaleString('en-IN')} | Received: Rs ${Number(rec.received_amount).toLocaleString('en-IN')} | Balance: Rs ${Number(rec.balance_amount).toLocaleString('en-IN')}`,
      headers,
      rows
    });
  };

  const handleQuickExportExcel = () => {
    if (activeTab === 'records') {
      handleExportRecordsExcel();
    } else {
      handleExportTxnsExcel();
    }
  };

  // Legacy CSV fallback
  const handleExportTxnCsv = handleExportTxnsExcel;

  // Active Categories for current transaction form
  const activeTxnCategories = txnForm.transaction_type === 'Income' ? incomeCategories : expenseCategories;

  // Add Category Handler
  const handleAddCategory = (targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || txnForm.transaction_type) === 'Income';
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
      localStorage.setItem('charvik_vyshnavi_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_vyshnavi_expense_categories', JSON.stringify(updated));
    }

    setTxnForm((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    success(`Category "${trimmed}" added!`);
  };

  // Start Edit Category
  const handleStartEditCategory = (catName: string) => {
    setEditingCategoryOldName(catName);
    setEditingCategoryNewName(catName);
  };

  // Save Edit Category
  const handleSaveEditCategory = (oldName: string, targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || txnForm.transaction_type) === 'Income';
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
      localStorage.setItem('charvik_vyshnavi_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_vyshnavi_expense_categories', JSON.stringify(updated));
    }

    if (txnForm.category === oldName) {
      setTxnForm((prev) => ({ ...prev, category: trimmed }));
    }

    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');
    success(`Category renamed to "${trimmed}"!`);
  };

  // Delete Category
  const handleDeleteCategory = (catName: string, targetType?: 'Income' | 'Expense') => {
    const isIncome = (targetType || txnForm.transaction_type) === 'Income';
    const targetList = isIncome ? incomeCategories : expenseCategories;
    if (targetList.length <= 1) {
      error('At least one category is required.');
      return;
    }

    const updated = targetList.filter((c) => c !== catName);
    if (isIncome) {
      setIncomeCategories(updated);
      localStorage.setItem('charvik_vyshnavi_income_categories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('charvik_vyshnavi_expense_categories', JSON.stringify(updated));
    }

    if (txnForm.category === catName) {
      setTxnForm((prev) => ({ ...prev, category: updated[0] || '' }));
    }

    success(`Category "${catName}" deleted.`);
  };

  // Combined Vehicles List (custom + API buses)
  const allVehicles = useMemo(() => {
    const list = customVehicles.filter(v => v && !v.toLowerCase().includes('general') && !v.toLowerCase().includes('fleet'));
    buses.forEach((b) => {
      const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
      if (reg && !reg.toLowerCase().includes('general') && !reg.toLowerCase().includes('fleet') && !list.some((v) => v.toLowerCase() === reg.toLowerCase())) {
        list.push(reg);
      }
    });
    return list;
  }, [customVehicles, buses]);

  // Add Vehicle
  const handleAddVehicle = (val?: string) => {
    const trimmed = (val || newVehicleName).trim();
    if (!trimmed) {
      error('Please enter a vehicle registration number');
      return;
    }
    if (allVehicles.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      error(`Vehicle "${trimmed}" already exists.`);
      return;
    }
    const updated = [...customVehicles, trimmed];
    setCustomVehicles(updated);
    localStorage.setItem('vyshnavi_custom_vehicles', JSON.stringify(updated));
    setTxnForm((prev) => ({ ...prev, vehicle_number: trimmed }));
    setNewVehicleName('');
    success(`Vehicle "${trimmed}" added!`);
  };

  // Start Edit Vehicle
  const handleStartEditVehicle = (veh: string) => {
    setEditingVehicleOldName(veh);
    setEditingVehicleNewName(veh);
  };

  // Save Edit Vehicle
  const handleSaveEditVehicle = (oldName: string) => {
    const trimmed = editingVehicleNewName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingVehicleOldName(null);
      setEditingVehicleNewName('');
      return;
    }
    if (allVehicles.some((v) => v.toLowerCase() === trimmed.toLowerCase() && v.toLowerCase() !== oldName.toLowerCase())) {
      error(`Vehicle "${trimmed}" already exists.`);
      return;
    }
    const updated = customVehicles.map((v) => (v === oldName ? trimmed : v));
    if (!updated.includes(trimmed) && !customVehicles.includes(oldName)) {
      updated.push(trimmed);
    }
    setCustomVehicles(updated);
    localStorage.setItem('vyshnavi_custom_vehicles', JSON.stringify(updated));
    if (txnForm.vehicle_number === oldName) {
      setTxnForm((prev) => ({ ...prev, vehicle_number: trimmed }));
    }
    setEditingVehicleOldName(null);
    setEditingVehicleNewName('');
    success(`Vehicle updated to "${trimmed}".`);
  };

  // Delete Vehicle
  const handleDeleteVehicle = (vehName: string) => {
    if (customVehicles.length <= 1) {
      error('At least one vehicle option is required.');
      return;
    }
    const updated = customVehicles.filter((v) => v !== vehName);
    setCustomVehicles(updated);
    localStorage.setItem('vyshnavi_custom_vehicles', JSON.stringify(updated));
    if (txnForm.vehicle_number === vehName) {
      setTxnForm((prev) => ({ ...prev, vehicle_number: updated[0] || 'General / Fleet Wide' }));
    }
    success(`Vehicle "${vehName}" removed.`);
  };

  // Add Party
  const handleAddParty = (val?: string) => {
    const trimmed = (val || newPartyName).trim();
    if (!trimmed) {
      error('Please enter a party / client / vendor name');
      return;
    }
    if (parties.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      error(`Party "${trimmed}" already exists.`);
      return;
    }
    const updated = [...parties, trimmed];
    setParties(updated);
    localStorage.setItem('vyshnavi_custom_parties', JSON.stringify(updated));
    setTxnForm((prev) => ({ ...prev, party_name: trimmed }));
    setNewPartyName('');
    success(`Party "${trimmed}" added!`);
  };

  // Start Edit Party
  const handleStartEditParty = (party: string) => {
    setEditingPartyOldName(party);
    setEditingPartyNewName(party);
  };

  // Save Edit Party
  const handleSaveEditParty = (oldName: string) => {
    const trimmed = editingPartyNewName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingPartyOldName(null);
      setEditingPartyNewName('');
      return;
    }
    if (parties.some((p) => p.toLowerCase() === trimmed.toLowerCase() && p.toLowerCase() !== oldName.toLowerCase())) {
      error(`Party "${trimmed}" already exists.`);
      return;
    }
    const updated = parties.map((p) => (p === oldName ? trimmed : p));
    setParties(updated);
    localStorage.setItem('vyshnavi_custom_parties', JSON.stringify(updated));
    if (txnForm.party_name === oldName) {
      setTxnForm((prev) => ({ ...prev, party_name: trimmed }));
    }
    setEditingPartyOldName(null);
    setEditingPartyNewName('');
    success(`Party updated to "${trimmed}".`);
  };

  // Delete Party
  const handleDeleteParty = (partyName: string) => {
    if (parties.length <= 1) {
      error('At least one party option is required.');
      return;
    }
    const updated = parties.filter((p) => p !== partyName);
    setParties(updated);
    localStorage.setItem('vyshnavi_custom_parties', JSON.stringify(updated));
    if (txnForm.party_name === partyName) {
      setTxnForm((prev) => ({ ...prev, party_name: updated[0] || '' }));
    }
    success(`Party "${partyName}" removed.`);
  };

  // Open Report Printout Modal
  const handleOpenPrintReport = (type: 'records' | 'transactions') => {
    if (type === 'records' && filteredRecords.length === 1) {
      setPrintingRecord(normalizeVyshnaviRecord(filteredRecords[0]));
      setPrintFormat('colourful');
      return;
    }
    setReportPrintType(type);
    setIsPrintReportModalOpen(true);
  };

  // Print Report Content via Isolated IFrame
  const handlePrintReportContent = () => {
    const printElement = document.getElementById('vyshnavi-printable-report');
    if (!printElement) {
      window.print();
      return;
    }

    let iframe = document.getElementById('vyshnavi-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vyshnavi-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1024px';
      iframe.style.height = '1440px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter((el) => !el.textContent?.includes('visibility: hidden'))
      .map((el) => el.outerHTML)
      .join('\n');

    const isLandscape = reportOrientation === 'landscape';
    const reportTitle = reportPrintType === 'records'
      ? 'Vyshnavi Travels - Billing & Service Records Statement'
      : 'Vyshnavi Travels - Income & Expense Ledger Statement';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle}</title>
          ${styles}
          <style>
            @page {
              size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              max-width: 100% !important;
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #isolated-report-wrap, #vyshnavi-printable-report {
              width: 100% !important;
              max-width: 100% !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .vyshnavi-header-wrap {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              border-bottom: 2.5px solid #1d4ed8 !important;
              padding-bottom: 8px !important;
              margin-bottom: 8px !important;
              width: 100% !important;
            }
            .vyshnavi-header-logo,
            #vyshnavi-printable-report img {
              height: 64px !important;
              max-height: 70px !important;
              width: auto !important;
              display: block !important;
              object-fit: contain !important;
            }
            .vyshnavi-contact-box {
              display: flex !important;
              flex-direction: column !important;
              align-items: flex-end !important;
              gap: 4px !important;
              text-align: right !important;
            }
            .vyshnavi-contact-row {
              display: flex !important;
              align-items: center !important;
              gap: 6px !important;
              font-size: 11px !important;
              color: #1e3a8a !important;
              font-weight: 700 !important;
            }
            .vyshnavi-icon-pill {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              background: #1d4ed8 !important;
              border-radius: 50% !important;
              width: 18px !important;
              height: 18px !important;
              color: white !important;
            }

            /* Statement Title */
            .vyshnavi-title-banner {
              text-align: center !important;
              border-bottom: 2px solid #0f172a !important;
              padding-bottom: 6px !important;
              margin: 10px 0 12px !important;
            }
            .vyshnavi-title-banner h2 {
              font-size: 14px !important;
              font-weight: 900 !important;
              letter-spacing: 0.5px !important;
              color: #0f172a !important;
              text-transform: uppercase !important;
              margin: 0 !important;
            }

            /* Table Styling - BOX-STYLE SIGNATURE VYSHNAVI STATEMENT */
            table {
              width: 100% !important;
              max-width: 100% !important;
              border-collapse: collapse !important;
              margin: 10px 0 !important;
              font-size: ${isLandscape ? '11px' : '9.5px'} !important;
              background: #ffffff !important;
              border: 2px solid #1e3a8a !important;
            }
            thead tr, tr.bg-slate-800 {
              background-color: #b9d8ff !important;
              color: #0f172a !important;
              border-bottom: 2px solid #1e3a8a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th {
              background-color: #b9d8ff !important;
              color: #0f172a !important;
              font-weight: 900 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.3px !important;
              font-size: ${isLandscape ? '10px' : '8.5px'} !important;
              padding: 9px 6px !important;
              border: 1.5px solid #1e3a8a !important;
              text-align: center !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th.text-center, td.text-center {
              text-align: center !important;
            }
            th.text-right, td.text-right {
              text-align: right !important;
            }
            td {
              padding: 8px 6px !important;
              border: 1.5px solid #1e3a8a !important;
              color: #0f172a !important;
              font-size: ${isLandscape ? '10.5px' : '9px'} !important;
              vertical-align: middle !important;
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            tbody tr:nth-child(even), tr.vyshnavi-row-cream, tr.bg-slate-50\\/60 {
              background-color: #fef9c3 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            tbody tr:nth-child(odd), tr.vyshnavi-row-white, tr.bg-white {
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            tfoot tr, tr.bg-slate-100 {
              background-color: #f1f5f9 !important;
              font-weight: 900 !important;
              border-top: 2.5px solid #1e3a8a !important;
              border-bottom: 2px solid #1e3a8a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            tfoot td {
              padding: 9px 6px !important;
              border: 1.5px solid #1e3a8a !important;
              font-size: ${isLandscape ? '11px' : '9.5px'} !important;
              font-weight: 900 !important;
              color: #0f172a !important;
            }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .font-bold { font-weight: bold !important; }
            .font-black { font-weight: 900 !important; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
            .text-emerald-700 { color: #047857 !important; }
            .text-rose-700 { color: #b91c1c !important; }
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-500 { color: #64748b !important; }

            /* Bank Details Strip */
            .vyshnavi-bank-strip,
            div.bg-slate-50.p-3 {
              margin-top: 14px !important;
              background-color: #eff6ff !important;
              border: 1.5px solid #3b82f6 !important;
              border-radius: 8px !important;
              padding: 10px 14px !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: 11px !important;
              color: #1e3a8a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .vyshnavi-bank-strip strong {
              color: #0f172a !important;
              font-weight: 800 !important;
            }

            /* Notice & Signatures */
            .vyshnavi-footer-wrap,
            div.mt-6.flex.items-end.justify-between {
              margin-top: 26px !important;
              padding-top: 12px !important;
              border-top: 1.5px solid #cbd5e1 !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-end !important;
              font-size: 10.5px !important;
            }
            .vyshnavi-notice-box,
            div.text-\\[10px\\].text-slate-500 {
              color: #64748b !important;
              line-height: 1.4 !important;
              font-size: 10px !important;
            }
            .vyshnavi-sig-box,
            div.text-center.space-y-8 {
              text-align: center !important;
              min-width: 190px !important;
            }
            .vyshnavi-sig-line,
            div.w-44.border-b {
              width: 190px !important;
              border-bottom: 1.5px solid #0f172a !important;
              margin-bottom: 6px !important;
            }
            .vyshnavi-sig-title,
            span.text-\\[11px\\].font-bold.text-slate-700 {
              font-size: 11px !important;
              font-weight: 800 !important;
              color: #0f172a !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div id="isolated-report-wrap">
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

        {/* Real Bus Coach Banner Photo Preview */}
        <div className="hidden lg:block relative shrink-0">
          <div className="w-52 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-slate-200 ring-2 ring-slate-100 group">
            <img
              src="/assets/fleet2.jpg"
              alt="Vyshnavi Luxury Coach"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
              <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Intercity Coach</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'records'
                ? 'bg-white text-[#142B4A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Billing & Service Records</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'records' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}>
                {records.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'transactions'
                ? 'bg-white text-[#142B4A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Income & Expense Ledger</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'transactions' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}>
                {transactions.length}
              </span>
            </button>
          </div>

          {/* Quick Export & Printout Options */}
          <button
            type="button"
            onClick={() => navigate('/admin/letter-pad?company=vyshnavi')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-xs font-black shadow-md shadow-amber-900/15 cursor-pointer transition-all"
            title="Open Official Letter Pad for Vyshnavi Travels"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Letter Pad</span>
          </button>

          <button
            type="button"
            onClick={handleQuickExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 cursor-pointer transition-all"
            title={`Export ${activeTab === 'records' ? 'Billing & Service Records' : 'Income & Expense Ledger'} to Excel`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPrintReport(activeTab)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-xs font-bold shadow-md shadow-slate-900/15 cursor-pointer transition-all"
            title={`Print ${activeTab === 'records' ? 'Billing & Service Records' : 'Income & Expense Ledger'} Statement`}
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Printout</span>
          </button>

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
          {/* KPI Summary Cards (Matching Image 4 Glowing Color Palettes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Total Billed (Sky Blue) */}
            <div className="bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-2 border-[#38BDF8] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950 uppercase tracking-wider">Total Billed</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-sky-950 font-mono">
                ₹{recordMetrics.totalBilled.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-sky-850 font-semibold">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span>↑ 12%</span>
                </span>
                <span className="text-[11px] text-sky-800/80">All statements</span>
                <div className="w-6 h-6 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* 2. Amount Received (Mint / Emerald) */}
            <div className="bg-gradient-to-br from-[#DCFCE7] via-[#BBF7D0] to-[#86EFAC] border-2 border-[#4ADE80] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Amount Received</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                ₹{recordMetrics.totalReceived.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-850 font-semibold">
                <span className="flex items-center gap-1 text-emerald-800 font-bold">
                  <span>↑ 18%</span>
                </span>
                <span className="text-[11px] text-emerald-800/80">Settled via Bank & UPI</span>
                <div className="w-6 h-6 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* 3. Balance Due (Rose / Red) */}
            <div className="bg-gradient-to-br from-[#FFE4E6] via-[#FECDD3] to-[#FDA4AF] border-2 border-[#FB7185] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-950 uppercase tracking-wider">Balance Due</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f43f5e] to-[#e11d48] text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-950 font-mono">
                ₹{recordMetrics.totalBalance.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-rose-850 font-semibold">
                <span className="flex items-center gap-1 text-rose-800 font-bold">
                  <span>↑ 5%</span>
                </span>
                <span className="text-[11px] text-rose-800/80">Pending clearance</span>
                <div className="w-6 h-6 rounded-full bg-rose-200/80 text-rose-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* 4. Total Records (Lavender / Purple) */}
            <div className="bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE] border-2 border-[#C084FC] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider">Total Records</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333ea] to-[#7e22ce] text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-purple-950 font-mono">
                {recordMetrics.count}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-purple-850 font-semibold">
                <span className="text-[11px] text-purple-800/80">Service billing records</span>
                <div className="w-6 h-6 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
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

              <button
                type="button"
                onClick={handleExportRecordsExcel}
                className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-emerald-400 transition-colors"
                title="Export Billing & Service Records to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPrintReport('records')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-blue-400 transition-colors"
                title="Print Billing & Service Records Statement"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Print Records</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1e40af] text-white border-b border-blue-900/30 text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">S.No</th>
                    <th className="py-3.5 px-4">Record / Invoice #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Billed To (Client)</th>
                    <th className="py-3.5 px-4">Vehicle No</th>
                    <th className="py-3.5 px-4 text-center">Staff Count</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-right">Received</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
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
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {rec.vehicle_number || rec.period_month || '—'}
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
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isPaid
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
                                  setPrintingRecord(normalizeVyshnaviRecord(rec));
                                  setPrintFormat('colourful');
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Printout / Colourful Invoice"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-700" />
                                <span>Printout</span>
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

          {/* Bottom Summary Cards (Matching Image 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Records */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-100 border border-sky-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Total Records</p>
                <p className="text-2xl font-black text-sky-950 mt-0.5">{recordMetrics.count}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* Completed */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-black text-emerald-950 mt-0.5">
                  {records.filter((r) => r.payment_status === 'Paid').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-300 rounded-3xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-amber-950 mt-0.5">
                  {records.filter((r) => r.payment_status !== 'Paid').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INCOME & EXPENSE LEDGER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* KPI Summary Cards (Matching Glowing Color Palettes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Income */}
            <div className="bg-gradient-to-br from-[#DCFCE7] via-[#BBF7D0] to-[#86EFAC] border-2 border-[#4ADE80] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Total Income</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                + ₹{txnMetrics.totalIncome.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-850 font-semibold">
                <span className="text-[11px] text-emerald-800/80">Bookings, client settlements & fares</span>
                <div className="w-6 h-6 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-gradient-to-br from-[#FFE4E6] via-[#FECDD3] to-[#FDA4AF] border-2 border-[#FB7185] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-950 uppercase tracking-wider">Total Expenses</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f43f5e] to-[#e11d48] text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-950 font-mono">
                - ₹{txnMetrics.totalExpense.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-rose-850 font-semibold">
                <span className="text-[11px] text-rose-800/80">Diesel, maintenance, FASTag, salary</span>
                <div className="w-6 h-6 rounded-full bg-rose-200/80 text-rose-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Net Cash Flow */}
            <div className="bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-2 border-[#38BDF8] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950 uppercase tracking-wider">Net Cash Flow</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <div className={`mt-3 text-2xl sm:text-3xl font-black font-mono ${txnMetrics.netBalance >= 0 ? 'text-sky-950' : 'text-rose-600'}`}>
                ₹{txnMetrics.netBalance.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-sky-850 font-semibold">
                <span className="text-[11px] text-sky-800/80">
                  {txnMetrics.netBalance >= 0 ? 'Net operational surplus' : 'Deficit / outstanding'}
                </span>
                <div className="w-6 h-6 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#D8B4FE] border-2 border-[#C084FC] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider">Transactions</span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333ea] to-[#7e22ce] text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-purple-950 font-mono">
                {txnMetrics.count}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-purple-850 font-semibold">
                <span className="text-[11px] text-purple-800/80">Total entries logged</span>
                <div className="w-6 h-6 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${txnTypeFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('Income')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${txnTypeFilter === 'Income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                    }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('Expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${txnTypeFilter === 'Expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'
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
                  {incomeCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Expense Categories">
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                {Array.from(new Set(transactions.map((t) => t.category).filter((c) => c && !incomeCategories.includes(c) && !expenseCategories.includes(c)))).length > 0 && (
                  <optgroup label="Other Categories">
                    {Array.from(new Set(transactions.map((t) => t.category).filter((c) => c && !incomeCategories.includes(c) && !expenseCategories.includes(c)))).map((c) => (
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

              {/* Categories Management Button */}
              <button
                type="button"
                onClick={() => {
                  setStandaloneCatType(txnTypeFilter === 'Expense' ? 'Expense' : 'Income');
                  setIsStandaloneCatModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-blue-400 transition-colors"
                title="Manage Income & Expense Categories"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Categories</span>
              </button>

              {/* Export Excel */}
              <button
                type="button"
                onClick={handleExportTxnsExcel}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-emerald-400 transition-colors"
                title="Export Income & Expense Ledger to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              {/* Print Ledger */}
              <button
                type="button"
                onClick={() => handleOpenPrintReport('transactions')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-emerald-400 transition-colors"
                title="Print Income & Expense Ledger Statement"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1e40af] text-white border-b border-blue-900/30 text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">S.No</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Vehicle #</th>
                    <th className="py-3.5 px-4">Party / Client / Vendor</th>
                    <th className="py-3.5 px-4">Description / Particulars</th>
                    <th className="py-3.5 px-4">Payment Mode & Ref</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Receipt</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
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
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isIncome
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
        size="xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-6">
          {/* Section 1: Record Details & Vehicle Number */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>1. Record Details & Vehicle Number</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <SearchableSelect
                  label="Vehicle Number"
                  options={allVehicles.map((v) => ({
                    value: v,
                    label: v
                  }))}
                  value={recordForm.vehicle_number}
                  onChange={(val) => setRecordForm({ ...recordForm, vehicle_number: val.toUpperCase() })}
                  placeholder="-- Select Vehicle Number --"
                  searchPlaceholder="Search vehicle number..."
                  allowCustom={true}
                  hideBadge={true}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={recordForm.payment_status}
                  onChange={(e) => setRecordForm({ ...recordForm, payment_status: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To (Client / Organization Details) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>2. Bill To (Client / Organization Details)</span>
            </div>
            <div>
              <OperatorSearchSelect
                label="Company / Client Name"
                required
                value={recordForm.bill_to_name}
                onChange={(val) => setRecordForm({ ...recordForm, bill_to_name: val })}
                onSelectOperator={(op) => {
                  const gst = (op.gstOrPan && op.gstOrPan.length === 15) ? op.gstOrPan : '';
                  const pan = (op.gstOrPan && op.gstOrPan.length === 10) ? op.gstOrPan : (!gst && op.gstOrPan ? op.gstOrPan : '');
                  setRecordForm((prev) => ({
                    ...prev,
                    bill_to_name: op.name,
                    bill_to_phone: op.phone || prev.bill_to_phone || '',
                    bill_to_address: op.address || prev.bill_to_address || '',
                    bill_to_gst: gst || prev.bill_to_gst || '',
                    bill_to_pan: pan || prev.bill_to_pan || ''
                  }));
                }}
                placeholder="e.g. Yolobus Private Limited / Sri Krishna Travels"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Mobile Number</label>
                <input
                  type="text"
                  value={recordForm.bill_to_phone}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_phone: e.target.value })}
                  placeholder="e.g. 9505151527"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Address</label>
                <input
                  type="text"
                  value={recordForm.bill_to_address}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_address: e.target.value })}
                  placeholder="e.g. Unit 330, JMD Megapolis, Sohna Road, Gurgaon"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={recordForm.bill_to_gst}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_gst: e.target.value.toUpperCase() })}
                  placeholder="e.g. 36AABCY5013H1Z2"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={recordForm.bill_to_pan}
                  onChange={(e) => setRecordForm({ ...recordForm, bill_to_pan: e.target.value.toUpperCase() })}
                  placeholder="e.g. AABCY5013H"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Services & Particulars Breakdown (Clean Form Entry) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Users className="w-4 h-4 text-purple-600" />
                <span>3. Particulars &amp; Services Breakdown</span>
              </div>
              <button
                type="button"
                onClick={handleAddServiceRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-14 text-center">S. No.</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Particulars (Service Details &amp; Period) *</th>
                    <th className="py-2.5 px-3 w-44 text-right">Amount (₹) *</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recordForm.items.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500 align-top pt-3.5">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <textarea
                          required
                          rows={3}
                          value={item.description}
                          onChange={(e) => handleUpdateServiceRow(idx, 'description', e.target.value)}
                          placeholder="Enter particulars (e.g. Route dropping/pickup services, driver salary, dates/period...)"
                          className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-y"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right align-top pt-3">
                        <div className="relative inline-block w-36">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.salary_paid || ''}
                            onChange={(e) => handleUpdateServiceRow(idx, 'salary_paid', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center align-top pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Total Summary Row */}
                  <tr className="bg-slate-50/80 font-black text-xs border-t border-slate-200">
                    <td colSpan={2} className="py-3 px-3 text-right uppercase tracking-wider text-slate-700">
                      Total:
                    </td>
                    <td className="py-3 px-3 text-right text-[#142B4A] text-sm font-black">
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

          {/* Section 5: Official Bank Details */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>5. Official Bank Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={recordForm.bank_account_name}
                  onChange={(e) => setRecordForm({ ...recordForm, bank_account_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={recordForm.bank_account_no}
                  onChange={(e) => setRecordForm({ ...recordForm, bank_account_no: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={recordForm.bank_ifsc}
                  onChange={(e) => setRecordForm({ ...recordForm, bank_ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank & Branch</label>
                <input
                  type="text"
                  value={recordForm.bank_name}
                  onChange={(e) => setRecordForm({ ...recordForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Vyshnavi Travels Company & Contact Details (Shown on Printout Header) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏢</span>
                <span>Vyshnavi Travels Company & Tax Details (Printout Header)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setRecordForm((prev) => ({
                    ...prev,
                    ...DEFAULT_COMPANY_DETAILS
                  }));
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Reset to Standard Defaults
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Phone Number</label>
                <input
                  type="text"
                  value={recordForm.company_phone || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_phone: e.target.value })}
                  placeholder="+91 9505151527"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Email</label>
                <input
                  type="email"
                  value={recordForm.company_email || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_email: e.target.value })}
                  placeholder="vyshnavitravels@yahoo.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Website</label>
                <input
                  type="text"
                  value={recordForm.company_website || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_website: e.target.value })}
                  placeholder="www.vyshnavitravels.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company GSTIN</label>
                <input
                  type="text"
                  value={recordForm.company_gst || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_gst: e.target.value.toUpperCase() })}
                  placeholder="36ABCDE1234F1Z5"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Company PAN</label>
                <input
                  type="text"
                  value={recordForm.company_pan || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_pan: e.target.value.toUpperCase() })}
                  placeholder="AABPV1234D"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={recordForm.company_address || ''}
                  onChange={(e) => setRecordForm({ ...recordForm, company_address: e.target.value })}
                  placeholder="Hyderabad, Telangana"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
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
              onClick={() =>
                setTxnForm((prev) => ({
                  ...prev,
                  transaction_type: 'Income',
                  category: incomeCategories.includes(prev.category)
                    ? prev.category
                    : incomeCategories[0] || 'Trip Advance / Booking'
                }))
              }
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${txnForm.transaction_type === 'Income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              + Income (Money In)
            </button>
            <button
              type="button"
              onClick={() =>
                setTxnForm((prev) => ({
                  ...prev,
                  transaction_type: 'Expense',
                  category: expenseCategories.includes(prev.category)
                    ? prev.category
                    : expenseCategories[0] || 'Diesel / Fuel'
                }))
              }
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${txnForm.transaction_type === 'Expense'
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

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(!isCategoryManagerOpen)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add More / Manage</span>
                </button>
              </div>

              <select
                required
                value={txnForm.category}
                onChange={(e) => {
                  if (e.target.value === '__add_more__') {
                    setIsCategoryManagerOpen(true);
                  } else {
                    setTxnForm({ ...txnForm, category: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select Category...</option>
                {activeTxnCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__add_more__" className="text-blue-600 font-bold bg-blue-50">
                  + Add More Category...
                </option>
              </select>

              {/* Inline Category Manager */}
              {isCategoryManagerOpen && (
                <div className="mt-2.5 p-3 bg-slate-100 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage {txnForm.transaction_type} Categories</span>
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
                      placeholder={`New ${txnForm.transaction_type.toLowerCase()} category...`}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCategory()}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Existing Categories List with Edit and Delete options */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-1">
                    {activeTxnCategories.map((cat) => {
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
                              <span className="font-semibold text-slate-800 truncate">{cat}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Category Name"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Category"
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

            {/* Vehicle Linked with Add More / Manage */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Vehicle Linked</label>
                <button
                  type="button"
                  onClick={() => setIsVehicleManagerOpen(!isVehicleManagerOpen)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isVehicleManagerOpen ? 'Close' : '+ Add More / Manage'}</span>
                </button>
              </div>

              <select
                value={txnForm.vehicle_number}
                onChange={(e) => {
                  if (e.target.value === '__add_more_vehicle__') {
                    setIsVehicleManagerOpen(true);
                  } else {
                    setTxnForm({ ...txnForm, vehicle_number: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {allVehicles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                <option value="__add_more_vehicle__" className="text-blue-600 font-bold bg-blue-50">
                  + Add More Vehicle...
                </option>
              </select>

              {/* Inline Vehicle Manager */}
              {isVehicleManagerOpen && (
                <div className="mt-2.5 p-3 bg-slate-100 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage Vehicles</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsVehicleManagerOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add New Vehicle Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AP16TV1234..."
                      value={newVehicleName}
                      onChange={(e) => setNewVehicleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVehicle();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddVehicle()}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Existing Vehicles List with Edit and Delete options */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-1">
                    {allVehicles.map((veh) => {
                      const isEditing = editingVehicleOldName === veh;

                      return (
                        <div key={veh} className="flex items-center justify-between gap-2 p-1.5 text-xs hover:bg-slate-50 rounded-lg group">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingVehicleNewName}
                                onChange={(e) => setEditingVehicleNewName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditVehicle(veh);
                                  } else if (e.key === 'Escape') {
                                    setEditingVehicleOldName(null);
                                  }
                                }}
                                className="flex-1 text-xs px-2 py-1 rounded-lg border border-blue-400 bg-white outline-none font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditVehicle(veh)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                                title="Save Vehicle"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVehicleOldName(null)}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-800 truncate font-mono text-[11px]">{veh}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditVehicle(veh)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Vehicle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(veh)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Vehicle"
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

            {/* Party / Client / Vendor Name with Add More / Manage */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Party / Client / Vendor Name</label>
                <button
                  type="button"
                  onClick={() => setIsPartyManagerOpen(!isPartyManagerOpen)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isPartyManagerOpen ? 'Close' : '+ Add More / Manage'}</span>
                </button>
              </div>

              <select
                value={txnForm.party_name}
                onChange={(e) => {
                  if (e.target.value === '__add_more_party__') {
                    setIsPartyManagerOpen(true);
                  } else {
                    setTxnForm({ ...txnForm, party_name: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Select Party / Client / Vendor...</option>
                {parties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                {txnForm.party_name && !parties.includes(txnForm.party_name) && (
                  <option value={txnForm.party_name}>{txnForm.party_name}</option>
                )}
                <option value="__add_more_party__" className="text-blue-600 font-bold bg-blue-50">
                  + Add More Party / Vendor...
                </option>
              </select>

              {/* Inline Party Manager */}
              {isPartyManagerOpen && (
                <div className="mt-2.5 p-3 bg-slate-100 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage Parties & Vendors</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPartyManagerOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add New Party Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Sri Krishna Travels / Indian Oil..."
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddParty();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddParty()}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Existing Parties List with Edit and Delete options */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-1">
                    {parties.map((pty) => {
                      const isEditing = editingPartyOldName === pty;

                      return (
                        <div key={pty} className="flex items-center justify-between gap-2 p-1.5 text-xs hover:bg-slate-50 rounded-lg group">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingPartyNewName}
                                onChange={(e) => setEditingPartyNewName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditParty(pty);
                                  } else if (e.key === 'Escape') {
                                    setEditingPartyOldName(null);
                                  }
                                }}
                                className="flex-1 text-xs px-2 py-1 rounded-lg border border-blue-400 bg-white outline-none font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditParty(pty)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                                title="Save Party"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPartyOldName(null)}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-800 truncate">{pty}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditParty(pty)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Party"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParty(pty)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Party"
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

            {/* Payment Mode (only UPI, Bank Transfer, Cash) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={txnForm.payment_mode}
                onChange={(e) => setTxnForm({ ...txnForm, payment_mode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
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
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${txnForm.transaction_type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
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
          title="Vyshnavi Travels Invoice & Statement Print"
          subtitle="Pre-formatted on Vyshnavi Travels official header with support for Colourful Invoice and Formal Document styles."
          size="2xl"
        >
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Record No: <strong className="text-slate-900 font-black">{printingRecord.record_number}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {records.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrintingRecord(null);
                      setIsPrintReportModalOpen(true);
                      setReportPrintType('records');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>All Records Summary</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExportSingleRecordExcel(printingRecord)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
                {/* Printout Button - Prints Colourful Invoice (Matching User's Reference Template) */}
                <button
                  type="button"
                  onClick={() => {
                    setPrintFormat('colourful');
                    handlePrintColourfulInvoice(printingRecord);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                  title="Printout (Official Template)"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Printout</span>
                </button>
                {/* Print Document Button - Also Prints Official Sheet */}
                <button
                  type="button"
                  onClick={() => {
                    setPrintFormat('colourful');
                    handlePrintColourfulInvoice(printingRecord);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  title="Print Formal Official Document"
                >
                  <Printer className="w-4 h-4 text-white" />
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
              {/* 1. THE OFFICIAL PRINTABLE A4 INVOICE SHEET (MATCHING USER'S REFERENCE TEMPLATE) */}
              <div
                id="vyshnavi-printable-colourful-invoice"
                className="bg-white mx-auto shadow-2xl font-sans"
                style={{
                  width: '100%',
                  maxWidth: '780px',
                  minHeight: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '2.5px solid #004b93',
                  borderRadius: '12px',
                  padding: '18px 22px 20px 22px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Header: Logo on left, Contact Details on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <img
                        src={vyshnaviLogo || "/vyshnavi-logo.png"}
                        alt="Vyshnavi Travels"
                        style={{ height: '62px', maxHeight: '68px', width: 'auto', maxWidth: '280px', display: 'block', objectFit: 'contain' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/vyshnavi-logo.png';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ borderLeft: '1.5px solid #004b93', height: '46px', margin: '0 16px' }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                        <div style={{ display: 'block', fontSize: '15px', fontWeight: '900', color: '#004b93', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                          <span style={{ fontSize: '14px', marginRight: '6px' }}>📞</span>
                          <span>+91 9000202241</span>
                        </div>
                        <div style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#004b93', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '13px', marginRight: '6px' }}>✉</span>
                          <span>vyshnavitravels@yahoo.com</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Line Under Header */}
                  <div style={{ borderBottom: '2px solid #004b93', width: '100%', margin: '4px 0 12px 0' }}></div>

                  {/* Centered INVOICE Pill */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 0 12px 0' }}>
                    <div
                      style={{
                        backgroundColor: '#004b93',
                        color: '#ffffff',
                        textAlign: 'center',
                        padding: '4px 44px',
                        borderRadius: '20px',
                        fontWeight: '900',
                        fontSize: '18px',
                        letterSpacing: '0.12em',
                        display: 'inline-block'
                      }}
                    >
                      INVOICE
                    </div>
                  </div>

                  {/* Metadata: Billed To Card (Left) & Statement Details Card (Right) */}
                  {(() => {
                    const rawName = (printingRecord.bill_to_name || '').trim().toLowerCase();
                    const matchedOp = DEFAULT_PRESET_OPERATORS.find(
                      (o) => o.name.toLowerCase() === rawName || rawName.includes(o.name.toLowerCase()) || o.name.toLowerCase().includes(rawName)
                    );
                    const clientAddress = printingRecord.bill_to_address || matchedOp?.address || 'Hyderabad, Telangana';
                    const clientPhone = printingRecord.bill_to_phone || matchedOp?.phone || '9309019527';
                    const clientPan = printingRecord.bill_to_pan || (matchedOp?.gstOrPan && matchedOp.gstOrPan.length === 10 ? matchedOp.gstOrPan : '') || 'SAAKY9813M1ZZ';

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                        {/* Billed To Box */}
                        <div
                          style={{
                            border: '1.5px solid #000000',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#000000', letterSpacing: '0.04em', marginBottom: '3px' }}>
                            BILLED TO (CLIENT / OPERATOR)
                          </div>
                          <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: '900', color: '#004b93' }}>
                            {printingRecord.bill_to_name || 'Sri Krishna Travels'}
                          </h3>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '2px' }}>
                            {clientAddress}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#000000', marginBottom: '2px' }}>
                            Contact : {clientPhone}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#000000' }}>
                            PAN : {clientPan}
                          </div>
                        </div>

                        {/* Statement Details Box */}
                        <div
                          style={{
                            border: '1.5px solid #000000',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', margin: 0, fontSize: '12px', color: '#000000', backgroundColor: 'transparent' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>Statement / Invoice No.</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '800', width: '10px' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '800' }}>{printingRecord.record_number || 'VT-REC-2026-001'}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>Record Date</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '800' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '800' }}>{printingRecord.record_date || '2026-11-08'}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>Vehicle Number</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '800' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '800' }}>{printingRecord.vehicle_number || printingRecord.period_month || '-'}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>Payment Status</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '800' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '900', color: '#ea580c', textTransform: 'uppercase' }}>
                                  {printingRecord.payment_status || 'PARTIAL'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Particulars Table with Crisp Black Grid */}
                  <div style={{ border: '1.5px solid #000000', borderRadius: '4px', overflow: 'hidden', margin: '0 0 12px 0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', margin: 0, backgroundColor: '#ffffff' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#ffffff', color: '#000000', borderBottom: '1px solid #000000' }}>
                          <th style={{ width: '70px', padding: '8px', textAlign: 'center', fontWeight: '900', fontSize: '12px', borderRight: '1px solid #000000', color: '#000000' }}>
                            S. NO.
                          </th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: '900', fontSize: '12px', borderRight: '1px solid #000000', color: '#000000' }}>
                            PARTICULARS
                          </th>
                          <th style={{ width: '160px', padding: '8px 14px', textAlign: 'center', fontWeight: '900', fontSize: '12px', color: '#000000' }}>
                            AMOUNT (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const resolvedRecord = normalizeVyshnaviRecord(printingRecord);
                          const rows = resolvedRecord.items;
                          return rows.map((item: any, idx: number) => {
                            const itemDesc = item.description || item.particulars || item.service || item.service_details || item.route || item.name || 'Fleet Service & Operations';
                            const itemAmt = Number(item.salary_paid ?? item.amount ?? item.salary ?? item.total ?? 0);
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                                <td style={{ width: '70px', padding: '8px', textAlign: 'center', fontWeight: '700', fontSize: '12px', borderRight: '1px solid #000000', color: '#000000' }}>
                                  {idx + 1}
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12px', borderRight: '1px solid #000000', color: '#000000' }}>
                                  {itemDesc}
                                </td>
                                <td style={{ width: '160px', padding: '8px 14px', textAlign: 'right', fontWeight: '900', fontSize: '13px', color: '#000000' }}>
                                  ₹{itemAmt.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                        {/* Summary Row */}
                        <tr style={{ backgroundColor: '#ffffff', color: '#000000', borderTop: '1px solid #000000' }}>
                          <td colSpan={2} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '900', fontSize: '13px', color: '#000000', borderRight: '1px solid #000000' }}>
                            GRAND TOTAL :
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '900', fontSize: '14px', color: '#000000' }}>
                            ₹{(printingRecord.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Amount in Words Box */}
                  <div
                    style={{
                      border: '1.5px solid #000000',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      backgroundColor: '#ffffff',
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#000000'
                    }}
                  >
                    <span style={{ fontWeight: '700' }}>Amount in Words :</span>
                    <span style={{ fontWeight: '900', textTransform: 'capitalize' }}>
                      {printingRecord.amount_in_words || numberToWordsIndian(printingRecord.total_amount)}
                    </span>
                  </div>

                  {/* Bottom Section: Accounts on Left, Signatory on Right */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Left: Accounts & Notice */}
                    <div>
                      {/* Bank Details Box */}
                      <div style={{ border: '1.5px solid #000000', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '4px 10px', fontSize: '11px', fontWeight: '900', borderBottom: '1px solid #000000' }}>
                          ACCOUNTS
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', margin: 0, fontSize: '11px', color: '#000000', backgroundColor: '#ffffff' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '3px 10px', border: 'none', fontWeight: '700', width: '95px' }}>Account Name</td>
                              <td style={{ padding: '3px 4px', border: 'none', fontWeight: '700', width: '10px' }}>:</td>
                              <td style={{ padding: '3px 8px', border: 'none', fontWeight: '800' }}>{printingRecord.bank_account_name || 'Vyshnavi Travels'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '3px 10px', border: 'none', fontWeight: '700' }}>Account No.</td>
                              <td style={{ padding: '3px 4px', border: 'none', fontWeight: '700' }}>:</td>
                              <td style={{ padding: '3px 8px', border: 'none', fontWeight: '900' }}>{printingRecord.bank_account_no || '284353146'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '3px 10px', border: 'none', fontWeight: '700' }}>IFSC Code</td>
                              <td style={{ padding: '3px 4px', border: 'none', fontWeight: '700' }}>:</td>
                              <td style={{ padding: '3px 8px', border: 'none', fontWeight: '900' }}>{printingRecord.bank_ifsc || 'KKBK0007466'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 10px', border: 'none', fontWeight: '700' }}>Bank</td>
                              <td style={{ padding: '3px 4px', border: 'none', fontWeight: '700' }}>:</td>
                              <td style={{ padding: '3px 8px', border: 'none', fontWeight: '800' }}>{printingRecord.bank_name || 'Kotak Mahindra Bank'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Notice */}
                      <div style={{ fontSize: '11px', color: '#000000', lineHeight: '1.45' }}>
                        <div style={{ fontWeight: '900', marginBottom: '2px' }}>Notice :</div>
                        <div>1. Please settle statement balance before next cycle.</div>
                        <div>2. Computer generated statement by Vyshnavi Travels.</div>
                      </div>
                    </div>

                    {/* Right: Divider & Authorized Signature */}
                    <div style={{ borderLeft: '1.5px solid #000000', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingLeft: '12px' }}>
                      <div style={{ width: '200px', borderTop: '1.5px solid #000000', marginBottom: '6px' }}></div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', textAlign: 'center' }}>
                        Authorized Signature
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Address Card */}
                <div
                  style={{
                    border: '1.5px solid #000000',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    marginTop: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <div style={{ borderLeft: '1.5px solid #000000', height: '32px' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#000000', lineHeight: '1.4' }}>
                    H.No. 5-5-990, Plot No. 74, Emerald Plaza, Opp. Bajaj Electrical, Beside Kakinada Subbaigaru Hotel,<br />
                    Vanasthalipuram, Sahebnagar Kalan, Hayathnagar, Rangareddy.
                  </div>
                </div>
              </div>

              {/* 2. THE FORMAL PRINTABLE A4 LETTERHEAD SHEET (EXISTING FORMAL DOCUMENT) */}
              <div
                id="vyshnavi-printable-letterhead"
                className="bg-white mx-auto shadow-xl font-sans"
                style={{
                  width: '100%',
                  maxWidth: '780px',
                  minHeight: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#002B49',
                  border: '2px solid #002B49',
                  borderRadius: '4px',
                  padding: '24px 28px',
                  boxSizing: 'border-box',
                  display: printFormat === 'letterhead' ? 'flex' : 'none',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* 1. Official Header: Colorful Logo on Left, Contact info on Right with vertical divider */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
                    <img
                      src={vyshnaviLogo || "/vyshnavi-logo.png"}
                      alt="Vyshnavi Travels"
                      className="vyshnavi-header-logo"
                      style={{ height: '65px', maxHeight: '72px', width: 'auto', maxWidth: '280px', display: 'block', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/vyshnavi-logo.png';
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-start', borderLeft: '1.5px solid #002B49', paddingLeft: '14px', minHeight: '68px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', fontWeight: '800', color: '#002B49', lineHeight: '1.3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '13px' }}>📞</span>
                          <span>{printingRecord.company_phone || '+91 9505151527'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '13px' }}>✉</span>
                          <span>{printingRecord.company_email || 'vyshnavitravels@yahoo.com'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '13px' }}>🌐</span>
                          <span>{printingRecord.company_website || 'www.vyshnavitravels.com'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ border: '1px solid #002B49', borderRadius: '3px', padding: '0 4px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.05em' }}>GST</span>
                          <span>GSTIN : {printingRecord.company_gst || '36ABCDE1234F1Z5'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ border: '1px solid #002B49', borderRadius: '3px', padding: '0 4px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.05em' }}>PAN</span>
                          <span>PAN : {printingRecord.company_pan || 'AABPV1234D'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '13px' }}>📍</span>
                          <span>{printingRecord.company_address || 'Hyderabad, Telangana'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Line Under Header */}
                  <div style={{ borderBottom: '1.5px solid #002B49', width: '100%' }}></div>

                  {/* Document Title Banner */}
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '0.12em', color: '#002B49', textTransform: 'uppercase' }}>
                      BILLING
                    </h2>
                  </div>

                  {/* Horizontal Line Under BILLING */}
                  <div style={{ borderBottom: '1.5px solid #002B49', width: '100%', marginBottom: '16px' }}></div>

                  {/* 2. Client & Statement Metadata (2 Side-by-Side Boxes matching template) */}
                  {(() => {
                    const rawName = (printingRecord.bill_to_name || '').trim().toLowerCase();
                    const matchedOp = DEFAULT_PRESET_OPERATORS.find(
                      (o) => o.name.toLowerCase() === rawName || rawName.includes(o.name.toLowerCase()) || o.name.toLowerCase().includes(rawName)
                    );
                    const clientAddress = printingRecord.bill_to_address || matchedOp?.address || '';
                    const clientPhone = printingRecord.bill_to_phone || matchedOp?.phone || '';
                    const clientGst = printingRecord.bill_to_gst || (matchedOp?.gstOrPan && matchedOp.gstOrPan.length === 15 ? matchedOp.gstOrPan : '');
                    const clientPan = printingRecord.bill_to_pan || (matchedOp?.gstOrPan && matchedOp.gstOrPan.length === 10 ? matchedOp.gstOrPan : '');

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Billed To Box */}
                        <div style={{ border: '1.5px solid #002B49', borderRadius: '6px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#002B49', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                            BILLED TO (CLIENT / OPERATOR)
                          </span>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#002B49' }}>
                            {printingRecord.bill_to_name}
                          </h3>
                          {clientAddress && (
                            <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '600', color: '#002B49' }}>
                              {clientAddress}
                            </p>
                          )}
                          {clientPhone && (
                            <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '600', color: '#002B49' }}>
                              Contact : {clientPhone}
                            </p>
                          )}
                          {(clientPan || clientGst) && (
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#002B49' }}>
                              {clientPan ? `PAN : ${clientPan}` : `GSTIN : ${clientGst}`}
                            </p>
                          )}
                        </div>

                        {/* Statement Details Box */}
                        <div style={{ border: '1.5px solid #002B49', borderRadius: '6px', padding: '12px 14px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', margin: 0, fontSize: '12px', color: '#002B49', backgroundColor: 'transparent' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '600', whiteSpace: 'nowrap', width: '55%' }}>Statement / Invoice No.</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '700', width: '10px' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '900', color: '#002B49' }}>{printingRecord.record_number}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>Record Date</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '700' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700' }}>{printingRecord.record_date}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>Vehicle Number</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '700' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '700' }}>{printingRecord.vehicle_number || printingRecord.period_month || '-'}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>Payment Status</td>
                                <td style={{ padding: '3px 6px', border: 'none', fontWeight: '700' }}>:</td>
                                <td style={{ padding: '3px 0', border: 'none', fontWeight: '900', textTransform: 'uppercase', color: '#002B49' }}>{printingRecord.payment_status}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Services & Staff Breakdown Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #002B49', margin: '0 0 16px 0', backgroundColor: '#ffffff' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#ffffff', color: '#002B49', borderBottom: '1.5px solid #002B49' }}>
                        <th style={{ width: '65px', padding: '9px 8px', textAlign: 'center', fontWeight: '900', fontSize: '12px', borderRight: '1.5px solid #002B49', color: '#002B49' }}>
                          S. NO.
                        </th>
                        <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: '900', fontSize: '12px', borderRight: '1.5px solid #002B49', color: '#002B49' }}>
                          PARTICULARS
                        </th>
                        <th style={{ width: '150px', padding: '9px 14px', textAlign: 'center', fontWeight: '900', fontSize: '12px', color: '#002B49' }}>
                          AMOUNT (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const resolvedRecord = normalizeVyshnaviRecord(printingRecord);
                        const rows = resolvedRecord.items;
                        return rows.map((item: any, idx: number) => {
                          const itemDesc = item.description || item.particulars || item.service || item.service_details || item.route || item.name || 'Fleet Service & Operations';
                          const itemAmt = Number(item.salary_paid ?? item.amount ?? item.salary ?? item.total ?? 0);
                          return (
                            <tr
                              key={idx}
                              style={{
                                backgroundColor: '#ffffff',
                                borderBottom: '1.5px solid #002B49'
                              }}
                            >
                              <td
                                style={{
                                  width: '65px',
                                  padding: '10px 8px',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  fontWeight: '800',
                                  fontSize: '13px',
                                  color: '#002B49',
                                  borderRight: '1.5px solid #002B49'
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td
                                style={{
                                  padding: '10px 14px',
                                  textAlign: 'left',
                                  verticalAlign: 'middle',
                                  borderRight: '1.5px solid #002B49',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  color: '#002B49',
                                  whiteSpace: 'pre-line',
                                  lineHeight: '1.4'
                                }}
                              >
                                {itemDesc}
                              </td>
                              <td
                                style={{
                                  width: '150px',
                                  padding: '10px 14px',
                                  textAlign: 'right',
                                  verticalAlign: 'middle',
                                  fontWeight: '800',
                                  fontSize: '13px',
                                  color: '#002B49'
                                }}
                              >
                                ₹{itemAmt.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        });
                      })()}

                      {/* Grand Total Row */}
                      <tr style={{ backgroundColor: '#ffffff', borderTop: '1.5px solid #002B49' }}>
                        <td
                          colSpan={2}
                          style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#002B49',
                            borderRight: '1.5px solid #002B49',
                            fontWeight: '900',
                            fontSize: '13px'
                          }}
                        >
                          GRAND TOTAL :
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            color: '#002B49',
                            fontWeight: '900',
                            fontSize: '14px'
                          }}
                        >
                          ₹{(printingRecord.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Amount in words */}
                  <div style={{ border: '1.5px solid #002B49', borderRadius: '6px', padding: '9px 14px', marginBottom: '20px', backgroundColor: '#ffffff', fontSize: '12px', color: '#002B49' }}>
                    <span style={{ fontWeight: '600' }}>Amount in Words : </span>
                    <strong style={{ fontWeight: '900', color: '#002B49' }}>
                      {printingRecord.amount_in_words || numberToWordsIndian(printingRecord.total_amount)}
                    </strong>
                  </div>
                </div>

                {/* Bottom Section: Bank Accounts on Left, Signatures on Right split by vertical divider */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0px', marginTop: 'auto', paddingTop: '10px' }}>
                  {/* Left Side: Bank Accounts + Notice */}
                  <div style={{ paddingRight: '20px' }}>
                    {/* Bank Details Box */}
                    <div style={{ border: '1.5px solid #002B49', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                      <div style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '900', color: '#002B49', borderBottom: '1.5px solid #002B49' }}>
                        ACCOUNTS <span style={{ textTransform: 'none', fontWeight: '600' }}>(Bank Details for Direct Settlement)</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', margin: 0, fontSize: '11px', color: '#002B49', backgroundColor: 'transparent' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #002B49' }}>
                            <td style={{ padding: '4px 10px', border: 'none', fontWeight: '700', width: '95px' }}>Account Name</td>
                            <td style={{ padding: '4px 4px', border: 'none', fontWeight: '700', width: '10px' }}>:</td>
                            <td style={{ padding: '4px 8px', border: 'none', fontWeight: '800' }}>{printingRecord.bank_account_name || 'Vyshnavi Travels'}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #002B49' }}>
                            <td style={{ padding: '4px 10px', border: 'none', fontWeight: '700' }}>Account No.</td>
                            <td style={{ padding: '4px 4px', border: 'none', fontWeight: '700' }}>:</td>
                            <td style={{ padding: '4px 8px', border: 'none', fontWeight: '900', fontFamily: 'monospace' }}>{printingRecord.bank_account_no || '284353146'}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #002B49' }}>
                            <td style={{ padding: '4px 10px', border: 'none', fontWeight: '700' }}>IFSC Code</td>
                            <td style={{ padding: '4px 4px', border: 'none', fontWeight: '700' }}>:</td>
                            <td style={{ padding: '4px 8px', border: 'none', fontWeight: '900', fontFamily: 'monospace' }}>{printingRecord.bank_ifsc || 'KKBK0007466'}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 10px', border: 'none', fontWeight: '700' }}>Bank</td>
                            <td style={{ padding: '4px 4px', border: 'none', fontWeight: '700' }}>:</td>
                            <td style={{ padding: '4px 8px', border: 'none', fontWeight: '700' }}>{printingRecord.bank_name || 'Kotak Mahindra Bank'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Notice Block */}
                    <div style={{ fontSize: '11px', color: '#002B49', lineHeight: '1.5' }}>
                      <div style={{ fontWeight: '900', marginBottom: '2px' }}>Notice:</div>
                      <div>1. Please settle statement balance before next cycle.</div>
                      <div>2. Computer generated statement by Vyshnavi Travels.</div>
                    </div>
                  </div>

                  {/* Right Side: Vertical Divider + Authorized Signatory */}
                  <div style={{ borderLeft: '1.5px solid #002B49', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', minHeight: '180px', paddingBottom: '12px' }}>
                    <div style={{ width: '220px', borderTop: '1.5px solid #002B49', marginBottom: '6px' }}></div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#002B49', textAlign: 'center' }}>
                      Authorized Signatory / Seal
                    </div>
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

      {/* ========================================================================= */}
      {/* MODAL 5: STANDALONE TRANSACTION CATEGORY MANAGEMENT                        */}
      {/* ========================================================================= */}
      {isStandaloneCatModalOpen && (
        <Modal
          isOpen={isStandaloneCatModalOpen}
          onClose={() => {
            setIsStandaloneCatModalOpen(false);
            setEditingCategoryOldName(null);
            setEditingCategoryNewName('');
          }}
          title="Manage Vyshnavi Travels Categories"
          subtitle="Add new categories, or edit & delete existing categories for Income and Expense transactions."
          size="md"
        >
          <div className="space-y-4">
            {/* Type Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStandaloneCatType('Income');
                  setEditingCategoryOldName(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${standaloneCatType === 'Income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Income Categories ({incomeCategories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStandaloneCatType('Expense');
                  setEditingCategoryOldName(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${standaloneCatType === 'Expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
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
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddCategory(standaloneCatType)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#142B4A] hover:bg-[#1E3A5F] text-white transition-colors cursor-pointer shrink-0"
              >
                + Add Category
              </button>
            </div>

            {/* Existing Categories List with Edit and Delete options */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-200 p-2">
              {(standaloneCatType === 'Income' ? incomeCategories : expenseCategories).map((cat) => {
                const isEditing = editingCategoryOldName === cat;

                return (
                  <div key={cat} className="flex items-center justify-between gap-2 p-2 text-xs hover:bg-white rounded-xl transition-colors">
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
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat, standaloneCatType)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                          title="Save Category"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryOldName(null)}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${standaloneCatType === 'Income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span className="font-bold text-slate-800 truncate">{cat}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat, standaloneCatType)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Category"
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsStandaloneCatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: OFFICIAL VYSHNAVI TRAVELS REPORT PRINTOUT                         */}
      {/* ========================================================================= */}
      {isPrintReportModalOpen && (
        <Modal
          isOpen={isPrintReportModalOpen}
          onClose={() => setIsPrintReportModalOpen(false)}
          title={`Print ${reportPrintType === 'records' ? 'Billing & Service Records' : 'Income & Expense Ledger'} Statement`}
          size="2xl"
        >
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
              <div className="text-xs text-slate-500">
                <span>Statement: </span>
                <strong className="text-slate-900 font-bold">
                  {reportPrintType === 'records'
                    ? `Vyshnavi Travels Records (${filteredRecords.length} entries)`
                    : `Vyshnavi Travels Ledger (${filteredTransactions.length} entries)`}
                </strong>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {reportPrintType === 'records' && filteredRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrintReportModalOpen(false);
                      setPrintingRecord(normalizeVyshnaviRecord(filteredRecords[0]));
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Official Statement</span>
                  </button>
                )}
                {/* Print Orientation Selector */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setReportOrientation('landscape')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportOrientation === 'landscape'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOrientation('portrait')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportOrientation === 'portrait'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Portrait
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (reportPrintType === 'records') {
                      handleExportRecordsExcel();
                    } else {
                      handleExportTxnsExcel();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintReportContent}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="bg-slate-100 p-4 rounded-2xl overflow-y-auto max-h-[75vh]">
              {/* THE OFFICIAL PRINTABLE REPORT SHEET */}
              <div
                id="vyshnavi-printable-report"
                className="bg-white mx-auto shadow-xl rounded-sm p-6 sm:p-8 text-slate-900 font-sans flex flex-col justify-between"
                style={{ width: '100%', maxWidth: '980px', minHeight: '900px' }}
              >
                <div>
                  {/* Logo + Contact Info row */}
                  <div className="vyshnavi-header-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1d4ed8', paddingBottom: '10px', marginBottom: '4px' }}>
                    <img
                      src="/vyshnavi-letterhead-header-clean.png"
                      alt="Vyshnavi Travels"
                      className="vyshnavi-header-logo"
                      style={{ height: '72px', maxHeight: '75px', width: 'auto', maxWidth: '260px', display: 'block', objectFit: 'contain' }}
                    />
                    <div className="vyshnavi-contact-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', textAlign: 'right' }}>
                      <div className="vyshnavi-contact-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>
                        <span>+91 9000202241</span>
                        <span className="vyshnavi-icon-pill" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1d4ed8', borderRadius: '50%', width: '22px', height: '22px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" /></svg>
                        </span>
                      </div>
                      <div className="vyshnavi-contact-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>
                        <span>vyshnavitravels@yahoo.com</span>
                        <span className="vyshnavi-icon-pill" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1d4ed8', borderRadius: '50%', width: '22px', height: '22px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg>
                        </span>
                      </div>
                      <div className="vyshnavi-contact-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>
                        <span>Hyderabad, Telangana</span>
                        <span className="vyshnavi-icon-pill" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1d4ed8', borderRadius: '50%', width: '22px', height: '22px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Title Banner */}
                  <div className="mt-3 text-center border-b-2 border-slate-800 pb-2">
                    <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
                      {reportPrintType === 'records'
                        ? 'OFFICIAL BILLING & SERVICE RECORDS STATEMENT'
                        : 'OFFICIAL INCOME & EXPENSE LEDGER STATEMENT'}
                    </h2>
                  </div>

                  {/* Complete Printable Table - Box Style Matching Letterhead */}
                  <div className="mt-4 border-2 border-[#1e3a8a] rounded-sm overflow-hidden" style={{ border: '2px solid #1e3a8a', borderRadius: '4px' }}>
                    {reportPrintType === 'records' ? (
                      <table className="w-full text-left border-collapse text-[11px] vyshnavi-box-table" style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#b9d8ff', color: '#0f172a', borderBottom: '2px solid #1e3a8a' }}>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 5px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>S.No</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Record / Inv #</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Date</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Billed To (Client)</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Vehicle / Period</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 5px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Staff</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Invoiced (₹)</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Received (₹)</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Balance Due (₹)</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredRecords.map((rec, idx) => {
                            const isCream = idx % 2 === 1;
                            return (
                              <tr key={rec.id || idx} className={isCream ? 'vyshnavi-row-cream' : 'vyshnavi-row-white'} style={{ backgroundColor: isCream ? '#fef9c3' : '#ffffff', borderBottom: '1.5px solid #1e3a8a' }}>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{idx + 1}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontWeight: 'bold', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{rec.record_number}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{rec.record_date}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontWeight: '700', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{rec.bill_to_name}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{rec.vehicle_number || rec.period_month || '—'}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{rec.total_staff_count || rec.items?.length || 1}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'right', fontWeight: 900, fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>₹{(rec.total_amount || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'right', fontWeight: 'bold', color: '#047857', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>₹{(rec.received_amount || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>₹{(rec.balance_amount || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'center', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>{rec.payment_status}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2.5px solid #1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
                            <td colSpan={6} style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase', fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>Grand Totals:</td>
                            <td style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>
                              ₹{filteredRecords.reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, color: '#047857', fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>
                              ₹{filteredRecords.reduce((acc, r) => acc + (Number(r.received_amount) || 0), 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, color: '#b91c1c', fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>
                              ₹{filteredRecords.reduce((acc, r) => acc + (Number(r.balance_amount) || 0), 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px' }}></td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <table className="w-full text-left border-collapse text-[11px] vyshnavi-box-table" style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#b9d8ff', color: '#0f172a', borderBottom: '2px solid #1e3a8a' }}>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 5px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>S.No</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Date</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Type</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Category</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Vehicle</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Party / Vendor</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Mode</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'center', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Ref / UTR #</th>
                            <th style={{ backgroundColor: '#b9d8ff', color: '#0f172a', border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: '900', fontSize: reportOrientation === 'landscape' ? '10px' : '8.5px' }}>Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredTransactions.map((t, idx) => {
                            const isCream = idx % 2 === 1;
                            return (
                              <tr key={t.id || idx} className={isCream ? 'vyshnavi-row-cream' : 'vyshnavi-row-white'} style={{ backgroundColor: isCream ? '#fef9c3' : '#ffffff', borderBottom: '1.5px solid #1e3a8a' }}>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{idx + 1}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{t.transaction_date}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontWeight: 'bold', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>
                                  <span className={t.transaction_type === 'Income' ? 'text-emerald-700' : 'text-rose-700'} style={{ color: t.transaction_type === 'Income' ? '#047857' : '#b91c1c' }}>
                                    {t.transaction_type}
                                  </span>
                                </td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontWeight: '600', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{t.category}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{t.vehicle_number || 'General'}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{t.party_name || '—'}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>{t.payment_mode}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', fontSize: '9.5px', fontFamily: 'monospace' }}>{t.reference_no || '—'}</td>
                                <td style={{ border: '1.5px solid #1e3a8a', padding: '8px 5px', textAlign: 'right', fontWeight: 900, color: t.transaction_type === 'Income' ? '#047857' : '#b91c1c', fontSize: reportOrientation === 'landscape' ? '10.5px' : '9px' }}>
                                  {t.transaction_type === 'Income' ? '+' : '-'} ₹{(t.amount || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2.5px solid #1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
                            <td colSpan={8} style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase', fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>Net Cash Flow:</td>
                            <td style={{ border: '1.5px solid #1e3a8a', padding: '9px 6px', textAlign: 'right', fontWeight: 900, fontSize: reportOrientation === 'landscape' ? '11px' : '9.5px' }}>
                              ₹{(filteredTransactions.filter(t => t.transaction_type === 'Income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0) - filteredTransactions.filter(t => t.transaction_type === 'Expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  {/* Bank Details Strip */}
                  <div
                    className="vyshnavi-bank-strip mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px]"
                    style={{
                      marginTop: '14px',
                      backgroundColor: '#eff6ff',
                      border: '1.5px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#1e3a8a'
                    }}
                  >
                    <div>
                      <span className="font-bold text-slate-800" style={{ color: '#0f172a', fontWeight: 'bold' }}>Bank Settlement: </span>
                      <span className="text-slate-600" style={{ color: '#1e3a8a' }}>Kotak Mahindra Bank, VANAS Hyderabad • A/C: <strong style={{ color: '#0f172a' }}>2848153146</strong> • IFSC: <strong style={{ color: '#0f172a' }}>KKBK0007460</strong></span>
                    </div>
                  </div>

                  {/* Official Notice & Signatures */}
                  <div
                    className="vyshnavi-footer-wrap mt-6 flex items-end justify-between pt-4 border-t border-slate-200 text-xs"
                    style={{
                      marginTop: '26px',
                      paddingTop: '14px',
                      borderTop: '1.5px solid #cbd5e1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      fontSize: '11px'
                    }}
                  >
                    <div className="vyshnavi-notice-box text-[10px] text-slate-500 space-y-0.5" style={{ color: '#64748b', fontSize: '10px', lineHeight: 1.4 }}>
                      <p className="font-semibold text-slate-700" style={{ color: '#0f172a', fontWeight: 'bold', margin: '0 0 3px 0' }}>Notice:</p>
                      <p style={{ margin: '0 0 2px 0' }}>1. Computer-generated official operations statement issued by Vyshnavi Travels.</p>
                      <p style={{ margin: 0 }}>2. For any discrepancies, please notify accounts within 3 business days.</p>
                    </div>
                    <div className="vyshnavi-sig-box text-center space-y-8" style={{ textAlign: 'center', minWidth: '190px' }}>
                      <div className="vyshnavi-sig-line w-44 border-b border-slate-400" style={{ width: '190px', borderBottom: '1.5px solid #0f172a', marginBottom: '8px' }}></div>
                      <span className="vyshnavi-sig-title text-[11px] font-bold text-slate-700 block" style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                        Authorized Signatory / Seal
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default VyshnaviTravels;

