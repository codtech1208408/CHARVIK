import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  IndianRupee,
  Users,
  Coins,
  HandCoins,
  Percent,
  RefreshCw,
  BarChart3,
  ClipboardList,
  Zap,
  Plus,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  CalendarPlus,
  X,
  CheckCircle2,
  Filter,
  Download,
  Search,
  User,
  FileText,
  Landmark,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Upload,
  Eye,
  Printer,
  Trash2,
  Check,
  FileCheck,
  Building,
  Image,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { printSheet } from '../utils/printSheet';
import { exportMultiSheetExcel } from '../utils/exportToExcel';
import { CustomerSearchSelect } from '../components/common/CustomerSearchSelect';

export const AVAILABLE_MONTHS = [
  'November 2026',
  'October 2026',
  'September 2026',
  'August 2026',
  'July 2026',
  'June 2026',
  'May 2026',
  'April 2026',
  'March 2026',
  'February 2026',
  'January 2026',
  'December 2025',
  'November 2025',
  'October 2025',
  'September 2025',
  'August 2025',
  'July 2025',
  'June 2025',
  'May 2025',
  'April 2025',
  'March 2025',
  'February 2025',
  'January 2025',
  'December 2026'
];

export const formatDisplayDate = (dStr?: string) => {
  if (!dStr) return '18 Nov 2026';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dStr;
  }
};

export interface FinanceTransaction {
  id: string | number;
  date: string;
  customerName: string;
  type: 'Collection (Interest)' | 'Collection (Principal)' | 'Loan Given' | 'Investment Added' | 'Month of Interest' | string;
  amount: number;
  mode: 'UPI' | 'Bank' | 'Cash';
  notes?: string;
  monthOfInterest?: string;
  paymentDate?: string;
}

export interface FinanceCustomer {
  id: string | number;
  customerCode: string;
  name: string;
  fatherName?: string;
  gender: string;
  dob?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  monthlyIncome?: number | string;
  profilePhoto?: string;

  // KYC
  aadhaarNumber?: string;
  aadhaarFrontDoc?: string;
  aadhaarBackDoc?: string;
  panNumber?: string;
  panDoc?: string;
  otherDocType?: string;
  otherDocNumber?: string;
  otherDocFile?: string;
  kycStatus?: 'Verified' | 'Pending Verification';

  // Loan Terms
  loanAmount: number;
  interestRate: number;
  repaymentFrequency?: 'Monthly' | 'Weekly' | 'Daily';
  loanTermMonths?: number;
  startDate: string;
  disbursementMode?: 'Cash' | 'Bank' | 'UPI';
  securityType?: string;
  securityDetails?: string;
  securityDoc?: string;

  // Bank
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  bankProofDoc?: string;

  // Guarantor & Reference
  guarantorName?: string;
  guarantorRelation?: string;
  guarantorPhone?: string;
  guarantorAadhaar?: string;
  guarantorAddress?: string;
  guarantorDoc?: string;
  ref1Name?: string;
  ref1Phone?: string;
  ref2Name?: string;
  ref2Phone?: string;
  internalRemarks?: string;

  // Balance
  principalPaid: number;
  interestPaid?: number;
  outstanding: number;
}

export interface CustomerFinancials {
  principalRemaining: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  monthlyInterest: number;
  monthsElapsed: number;
  totalInterestAccrued: number;
  unpaidInterest: number;
  totalOutstanding: number;
}

export function computeCustomerFinancials(
  customer: FinanceCustomer,
  allTransactions: FinanceTransaction[] = []
): CustomerFinancials {
  const loanAmt = Number(customer.loanAmount) || 0;
  const rate = Number(customer.interestRate) || 2.0;

  // Filter transactions for this customer
  const custName = (customer.name || '').trim().toLowerCase();
  const custCode = (customer.customerCode || '').trim().toLowerCase();
  const txs = allTransactions.filter((t) => {
    const tName = (t.customerName || '').trim().toLowerCase();
    return (tName && tName === custName) || (custCode && tName.includes(custCode));
  });

  // Calculate principal paid (seed + tx)
  const txPrincipal = txs
    .filter((t) => t.type && t.type.toLowerCase().includes('principal'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPrincipalPaid = Math.min(loanAmt, (customer.principalPaid || 0) + txPrincipal);
  const principalRemaining = Math.max(0, loanAmt - totalPrincipalPaid);

  // Calculate elapsed months since disbursement/startDate
  let monthsElapsed = 0;
  if (customer.startDate) {
    try {
      const start = new Date(customer.startDate);
      const now = new Date();
      if (!isNaN(start.getTime())) {
        const yearDiff = now.getFullYear() - start.getFullYear();
        const monthDiff = now.getMonth() - start.getMonth();
        let m = yearDiff * 12 + monthDiff;
        if (now.getDate() < start.getDate()) {
          m = Math.max(0, m - 1);
        }
        monthsElapsed = Math.max(0, m);
      }
    } catch {
      monthsElapsed = 0;
    }
  }

  // Monthly interest amount on remaining principal balance at the agreed monthly interest rate
  const monthlyInterest = Math.round((principalRemaining * rate) / 100);

  // Calculate interest paid (seed + tx)
  const txInterest = txs
    .filter(
      (t) =>
        t.type &&
        (t.type.toLowerCase().includes('interest') || t.type.toLowerCase().includes('month of interest'))
    )
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalInterestPaid = (customer.interestPaid || 0) + txInterest;

  // Total interest accrued over elapsed months
  const totalInterestAccrued = Math.round(monthsElapsed * monthlyInterest);
  const unpaidInterest = Math.max(0, totalInterestAccrued - totalInterestPaid);

  // Live Balance Outstanding: remaining principal + unpaid monthly interest
  const totalOutstanding = principalRemaining + unpaidInterest;

  return {
    principalRemaining,
    totalPrincipalPaid,
    totalInterestPaid,
    monthlyInterest,
    monthsElapsed,
    totalInterestAccrued,
    unpaidInterest,
    totalOutstanding
  };
}

export const ChandrikaFinance: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Transactions State (seeded with the user's reference image data)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([
    {
      id: 1,
      date: '14 Nov 2026',
      customerName: 'Ramesh Kumar',
      type: 'Collection (Interest)',
      amount: 10000,
      mode: 'UPI',
      notes: 'Monthly interest installment received via PhonePe'
    },
    {
      id: 2,
      date: '14 Nov 2026',
      customerName: 'Suresh Reddy',
      type: 'Collection (Principal)',
      amount: 50000,
      mode: 'Bank',
      notes: 'Principal repayment tranche via NEFT transfer'
    },
    {
      id: 3,
      date: '14 Nov 2026',
      customerName: 'Anil Verma',
      type: 'Loan Given',
      amount: 200000,
      mode: 'Cash',
      notes: 'Commercial vehicle expansion financing disbursement'
    }
  ]);

  // Customers State (Initialized from localStorage or default seed)
  const SEED_CUSTOMERS: FinanceCustomer[] = [
    {
      id: 1,
      customerCode: 'CF-1001',
      name: 'Ramesh Kumar',
      fatherName: 'K. Satyanarayana',
      gender: 'Male',
      dob: '1988-05-12',
      phone: '9848012345',
      altPhone: '9848054321',
      email: 'ramesh.kumar@gmail.com',
      address: 'H.No 4-22, Agamaiah Nagar, Vanasthalipuram',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500070',
      occupation: 'Fleet Transport Contractor',
      monthlyIncome: 75000,
      aadhaarNumber: '7845 1290 3412',
      panNumber: 'ABCDE1234F',
      kycStatus: 'Verified',
      loanAmount: 500000,
      interestRate: 2.0,
      repaymentFrequency: 'Monthly',
      loanTermMonths: 12,
      startDate: '2026-05-10',
      disbursementMode: 'Bank',
      securityType: 'Promissory Note',
      securityDetails: 'Original signed promissory note and stamp paper',
      bankName: 'Kotak Mahindra Bank',
      accountHolderName: 'Ramesh Kumar',
      accountNumber: '2848153146',
      ifscCode: 'KKBK0007460',
      branch: 'Vanasthalipuram, Hyderabad',
      upiId: '9848012345@ybl',
      guarantorName: 'M. Srinivas Rao',
      guarantorRelation: 'Brother',
      guarantorPhone: '9848099887',
      guarantorAadhaar: '6543 2109 8765',
      guarantorAddress: 'L.B. Nagar, Hyderabad',
      ref1Name: 'G. Krishna',
      ref1Phone: '9848011223',
      internalRemarks: 'Existing borrower with good credit repayment history',
      principalPaid: 200000,
      outstanding: 300000
    },
    {
      id: 2,
      customerCode: 'CF-1002',
      name: 'Suresh Reddy',
      fatherName: 'S. Narsimha Reddy',
      gender: 'Male',
      dob: '1985-09-24',
      phone: '9848098765',
      address: 'Plot 18, Bank Colony, Hayathnagar',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500071',
      occupation: 'Commercial Vehicle Owner',
      monthlyIncome: 90000,
      aadhaarNumber: '8912 3456 7890',
      panNumber: 'FGHIJ5678K',
      kycStatus: 'Verified',
      loanAmount: 800000,
      interestRate: 2.0,
      repaymentFrequency: 'Monthly',
      loanTermMonths: 24,
      startDate: '2026-06-15',
      disbursementMode: 'Bank',
      securityType: 'Cheque',
      securityDetails: 'SBI blank signed guarantee cheque No. 392011',
      bankName: 'State Bank of India',
      accountHolderName: 'Suresh Reddy',
      accountNumber: '30492817263',
      ifscCode: 'SBIN0004567',
      branch: 'L.B. Nagar',
      upiId: '9848098765@sbi',
      guarantorName: 'V. Prabhakar',
      guarantorRelation: 'Colleague',
      guarantorPhone: '9848077665',
      ref1Name: 'K. Mohan',
      ref1Phone: '9848033445',
      principalPaid: 450000,
      outstanding: 350000
    },
    {
      id: 3,
      customerCode: 'CF-1003',
      name: 'Anil Verma',
      fatherName: 'R. Ram Verma',
      gender: 'Male',
      dob: '1992-02-18',
      phone: '9848045678',
      address: 'Flat 302, Sai Residency, Dilsukhnagar',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500060',
      occupation: 'Automobile Workshop Proprietor',
      monthlyIncome: 60000,
      aadhaarNumber: '4567 8901 2345',
      panNumber: 'KLMNO9012P',
      kycStatus: 'Verified',
      loanAmount: 200000,
      interestRate: 2.0,
      repaymentFrequency: 'Monthly',
      loanTermMonths: 6,
      startDate: '2026-11-14',
      disbursementMode: 'Cash',
      securityType: 'Promissory Note',
      bankName: 'HDFC Bank',
      accountHolderName: 'Anil Verma',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0001234',
      branch: 'Dilsukhnagar',
      upiId: 'anilverma@okaxis',
      principalPaid: 0,
      outstanding: 200000
    }
  ];

  const [customers, setCustomers] = useState<FinanceCustomer[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_chandrika_finance_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return SEED_CUSTOMERS;
  });

  const [customerCount, setCustomerCount] = useState<number>(() => {
    return Math.max(48, customers.length + 45);
  });

  // Core Financial Aggregates (matching the user's exact balance values)
  const [totalInvestment, setTotalInvestment] = useState(5000000);
  const [totalLoanGiven, setTotalLoanGiven] = useState(3250000);
  const [totalPrincipalReceived, setTotalPrincipalReceived] = useState(800000);
  const [totalInterestReceived, setTotalInterestReceived] = useState(325000);
  const [todayCollection, setTodayCollection] = useState(85000);
  const [thisMonthCollection, setThisMonthCollection] = useState(1240000);
  const [thisMonthInterest, setThisMonthInterest] = useState(210000);

  // Dynamic Outstanding calculation (updates automatically each month with accrued interest according to interest percentage)
  const totalDynamicOutstanding = useMemo(() => {
    const custSum = customers.reduce((sum, c) => {
      const f = computeCustomerFinancials(c, transactions);
      return sum + f.totalOutstanding;
    }, 0);
    return Math.max(custSum, totalLoanGiven - totalPrincipalReceived);
  }, [customers, transactions, totalLoanGiven, totalPrincipalReceived]);

  const totalOutstanding = totalDynamicOutstanding;

  // Modals
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [viewAllActiveTab, setViewAllActiveTab] = useState<'balance' | 'transactions'>('transactions');

  // Form states
  const [investmentForm, setInvestmentForm] = useState({ investor: '', amount: '', mode: 'Bank' as 'UPI' | 'Bank' | 'Cash', notes: '' });
  const [loanForm, setLoanForm] = useState({
    customerName: '',
    amount: '',
    interestRate: '2.0',
    repaymentFrequency: 'Monthly',
    loanTermMonths: '12',
    paymentDate: new Date().toISOString().split('T')[0],
    mode: 'Cash' as 'UPI' | 'Bank' | 'Cash',
    securityType: 'Promissory Note',
    securityDetails: '',
    securityDoc: '',
    notes: ''
  });
  const [collectionForm, setCollectionForm] = useState({
    customerName: '',
    type: 'Collection (Principal)' as 'Collection (Principal)' | 'Collection (Interest)' | 'Month of Interest',
    monthOfInterest: 'November 2026',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'UPI' as 'UPI' | 'Bank' | 'Cash',
    notes: ''
  });

  // View All Search
  const [viewAllSearch, setViewAllSearch] = useState('');

  // Handle Add Investment
  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(investmentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid investment amount.');
      return;
    }
    setTotalInvestment((prev) => prev + amt);
    setTransactions((prev) => [
      {
        id: Date.now(),
        date: '14 Nov 2026',
        customerName: investmentForm.investor || 'Partner Investment',
        type: 'Investment Added',
        amount: amt,
        mode: investmentForm.mode,
        notes: investmentForm.notes
      },
      ...prev
    ]);
    success(`Investment of ₹${amt.toLocaleString('en-IN')} added successfully!`);
    handleCloseInvestmentModal();
    setInvestmentForm({ investor: '', amount: '', mode: 'Bank', notes: '' });
  };

  // Save customers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('charvik_chandrika_finance_customers', JSON.stringify(customers));
    } catch { }
  }, [customers]);

  // Stepper state for customer registration
  const [currentCustomerStep, setCurrentCustomerStep] = useState(1);

  const createBlankCustomerForm = (nextIdx: number) => ({
    // Step 1: Personal Information
    customerCode: `CF-${String(nextIdx).padStart(4, '0')}`,
    profilePhoto: '',
    name: '',
    fatherName: '',
    gender: 'Male',
    dob: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500070',
    occupation: '',
    monthlyIncome: '',

    // Step 2: KYC & Identity Documents
    aadhaarNumber: '',
    aadhaarFrontDoc: '',
    aadhaarBackDoc: '',
    panNumber: '',
    panDoc: '',
    otherDocType: 'Voter ID',
    otherDocNumber: '',
    otherDocFile: '',
    kycStatus: 'Verified' as 'Verified' | 'Pending Verification',

    // Step 3: Loan & Security Terms
    loanAmount: '',
    interestRate: '2.0',
    repaymentFrequency: 'Monthly' as 'Monthly' | 'Weekly' | 'Daily',
    loanTermMonths: '12',
    disbursementDate: new Date().toISOString().split('T')[0],
    disbursementMode: 'Cash' as 'Cash' | 'Bank' | 'UPI',
    securityType: 'Promissory Note',
    securityDetails: '',
    securityDoc: '',

    // Step 4: Bank Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branch: 'Hyderabad',
    upiId: '',
    bankProofDoc: '',

    // Step 5: Guarantor & References
    guarantorName: '',
    guarantorRelation: '',
    guarantorPhone: '',
    guarantorAadhaar: '',
    guarantorAddress: '',
    guarantorDoc: '',
    ref1Name: '',
    ref1Phone: '',
    ref2Name: '',
    ref2Phone: '',
    internalRemarks: ''
  });

  const [customerForm, setCustomerForm] = useState(() => createBlankCustomerForm(customerCount + 1));

  // Handle file uploads (converts file to base64 for instant preview)
  const handleCustomerFileUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomerForm((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleLoanFileUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLoanForm((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Print Official Customer Registration & KYC Sheet
  const handlePrintCustomerKYC = (cust: FinanceCustomer) => {
    const f = computeCustomerFinancials(cust, transactions);
    const reportHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.45;">
        <!-- Header Banner -->
        <div style="border-bottom: 2px solid #1E3A8A; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <img src="/chandrika-finance-logo.png" alt="Chandrika Finance" style="height: 52px; width: auto; object-fit: contain; display: block;" onerror="this.src='/chandrika-finance-logo-transparent.png'" />
            <div>
              <h1 style="margin: 0; color: #1E3A8A; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">CHANDRIKA FINANCE</h1>
              <p style="margin: 3px 0 0; color: #64748b; font-size: 10px; font-weight: 600;">NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana</p>
              <p style="margin: 2px 0 0; color: #64748b; font-size: 10px;">Phone: 9505151527 | Email: charvikstaffingconsulrancy@gmail.com</p>
              <div style="display: inline-block; margin-top: 6px; padding: 3px 10px; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 6px; font-size: 10.5px; font-weight: bold; color: #3730A3;">
                OFFICIAL BORROWER REGISTRATION & KYC ENROLLMENT DOSSIER
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            ${cust.profilePhoto
        ? `<img src="${cust.profilePhoto}" style="width: 85px; height: 95px; object-fit: cover; border: 2px solid #CBD5E1; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />`
        : `<div style="width: 85px; height: 95px; border: 2px dashed #CBD5E1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; text-align: center; padding: 4px;">AFFIX BORROWER PHOTO</div>`
      }
            <div style="margin-top: 5px; font-family: monospace; font-size: 12px; font-weight: bold; color: #1E3A8A;">${cust.customerCode || 'CF-1000'}</div>
          </div>
        </div>

        <!-- Section 1: Borrower Personal Profile -->
        <div style="margin-bottom: 16px;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 11px; font-weight: 900; color: #1E293B; text-transform: uppercase; border-left: 4px solid #1E3A8A; margin-bottom: 8px;">
            1. Borrower Personal & Contact Profile
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Full Name:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #0f172a; width: 28%;">${cust.name}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Father / Guardian:</td>
              <td style="padding: 5px 8px; color: #0f172a; width: 28%;">${cust.fatherName || '—'}</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Gender:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.gender}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Date of Birth:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.dob || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Primary Mobile:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #0f172a;">${cust.phone}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Alternative Phone:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.altPhone || '—'}</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Occupation / Trade:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.occupation || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Monthly Income:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #047857;">${cust.monthlyIncome ? `₹ ${Number(cust.monthlyIncome).toLocaleString('en-IN')}` : '—'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Residential Address:</td>
              <td colspan="3" style="padding: 5px 8px; color: #0f172a;">${cust.address || '—'}, ${cust.city || 'Hyderabad'}, ${cust.state || 'Telangana'} ${cust.pincode ? `- ${cust.pincode}` : ''}</td>
            </tr>
          </table>
        </div>

        <!-- Section 2: Identity & KYC Verification -->
        <div style="margin-bottom: 16px;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 11px; font-weight: 900; color: #1E293B; text-transform: uppercase; border-left: 4px solid #1E3A8A; margin-bottom: 8px;">
            2. Identity & KYC Verification Particulars
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Aadhaar Card No:</td>
              <td style="padding: 5px 8px; font-weight: bold; font-family: monospace; color: #0f172a; width: 28%;">${cust.aadhaarNumber || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">PAN Card No:</td>
              <td style="padding: 5px 8px; font-weight: bold; font-family: monospace; color: #0f172a; width: 28%;">${cust.panNumber || '—'}</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">KYC Status:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: ${cust.kycStatus === 'Verified' ? '#047857' : '#D97706'};">${cust.kycStatus || 'Verified'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Enrollment Date:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.startDate || new Date().toISOString().split('T')[0]}</td>
            </tr>
          </table>
        </div>

        <!-- Section 3: Loan Parameters & Collateral Security -->
        <div style="margin-bottom: 16px;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 11px; font-weight: 900; color: #1E293B; text-transform: uppercase; border-left: 4px solid #1E3A8A; margin-bottom: 8px;">
            3. Loan Terms, Interest & Security Parameters
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Sanctioned Loan:</td>
              <td style="padding: 5px 8px; font-weight: 900; color: #1E3A8A; font-size: 13px; width: 28%;">₹ ${Number(cust.loanAmount || 0).toLocaleString('en-IN')}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Monthly Interest Rate:</td>
              <td style="padding: 5px 8px; font-weight: 900; color: #047857; width: 28%;">${cust.interestRate || '2.0'}% per month</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Repayment Frequency:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.repaymentFrequency || 'Monthly'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Loan Term:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.loanTermMonths || 12} Months</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Collateral / Security:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #0f172a;">${cust.securityType || 'Promissory Note'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Security Particulars:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.securityDetails || 'Standard agreement executed'}</td>
            </tr>
            <tr style="background: #FFFBEB; border-top: 1.5px solid #FDE68A;">
              <td style="padding: 6px 8px; font-weight: bold; color: #92400E;">Monthly Interest Accrual:</td>
              <td style="padding: 6px 8px; font-weight: bold; color: #92400E;">₹ ${f.monthlyInterest.toLocaleString('en-IN')} / mo</td>
              <td style="padding: 6px 8px; font-weight: bold; color: #92400E;">Current Balance Outstanding:</td>
              <td style="padding: 6px 8px; font-weight: 900; color: #DC2626; font-size: 12px;">₹ ${f.totalOutstanding.toLocaleString('en-IN')} (${f.monthsElapsed} mo elapsed)</td>
            </tr>
          </table>
        </div>

        <!-- Section 4: Bank Account & Payout Details -->
        <div style="margin-bottom: 16px;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 11px; font-weight: 900; color: #1E293B; text-transform: uppercase; border-left: 4px solid #1E3A8A; margin-bottom: 8px;">
            4. Bank Account & Settlement Channel
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Bank Name:</td>
              <td style="padding: 5px 8px; color: #0f172a; width: 28%;">${cust.bankName || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Account Holder:</td>
              <td style="padding: 5px 8px; color: #0f172a; width: 28%;">${cust.accountHolderName || cust.name}</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Account Number:</td>
              <td style="padding: 5px 8px; font-family: monospace; font-weight: bold; color: #0f172a;">${cust.accountNumber || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">IFSC Code:</td>
              <td style="padding: 5px 8px; font-family: monospace; font-weight: bold; color: #0f172a;">${cust.ifscCode || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Branch:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.branch || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">UPI ID:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #0f172a;">${cust.upiId || '—'}</td>
            </tr>
          </table>
        </div>

        <!-- Section 5: Guarantor & Contact References -->
        <div style="margin-bottom: 24px;">
          <div style="background: #F1F5F9; padding: 6px 12px; font-size: 11px; font-weight: 900; color: #1E293B; text-transform: uppercase; border-left: 4px solid #1E3A8A; margin-bottom: 8px;">
            5. Guarantor (Surety) & Personal References
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Guarantor Name:</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #0f172a; width: 28%;">${cust.guarantorName || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569; width: 22%;">Relationship:</td>
              <td style="padding: 5px 8px; color: #0f172a; width: 28%;">${cust.guarantorRelation || '—'}</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Guarantor Mobile:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.guarantorPhone || '—'}</td>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Guarantor Aadhaar:</td>
              <td style="padding: 5px 8px; color: #0f172a;">${cust.guarantorAadhaar || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; font-weight: bold; color: #475569;">Reference Contact:</td>
              <td colspan="3" style="padding: 5px 8px; color: #0f172a;">${cust.ref1Name || '—'} ${cust.ref1Phone ? `(${cust.ref1Phone})` : ''}</td>
            </tr>
          </table>
        </div>

        <!-- Borrower Undertaking -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 8px; font-size: 9.5px; color: #475569; line-height: 1.4; margin-bottom: 30px;">
          <strong>Declaration:</strong> I hereby declare that all information furnished herein is true, complete, and authentic. I agree to repay the principal and agreed monthly interest installment punctually as per the repayment schedule of Chandrika Finance.
        </div>

        <!-- Signature Blocks -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px;">
          <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1.5px solid #0f172a; height: 40px; margin-bottom: 6px;"></div>
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a;">Signature of Borrower</p>
            <p style="margin: 2px 0 0; font-size: 9px; color: #64748b;">(${cust.name})</p>
          </div>

          <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1.5px solid #0f172a; height: 40px; margin-bottom: 6px;"></div>
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a;">Authorized Signatory</p>
            <p style="margin: 2px 0 0; font-size: 9px; color: #64748b;">For CHANDRIKA FINANCE</p>
          </div>
        </div>
      </div>
    `;

    printSheet({
      title: `CUSTOMER REGISTRATION & KYC DOSSIER - ${cust.name}`,
      subtitle: `Chandrika Finance • Customer Code: ${cust.customerCode || cust.id}`,
      orientation: 'portrait',
      hideMetaBar: true,
      hideHeader: true,
      htmlContent: reportHtml
    });
  };

  // Handle Save / Submit Customer Registration
  const handleSaveCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!customerForm.name.trim()) {
      toastError('Please enter Customer Full Name in Step 1.');
      setCurrentCustomerStep(1);
      return;
    }
    if (!customerForm.phone.trim()) {
      toastError('Please enter Customer Mobile Number in Step 1.');
      setCurrentCustomerStep(1);
      return;
    }

    const newCustomer: FinanceCustomer = {
      id: Date.now(),
      customerCode: customerForm.customerCode || `CF-${String(customerCount + 1).padStart(4, '0')}`,
      name: customerForm.name.trim(),
      fatherName: customerForm.fatherName.trim(),
      gender: customerForm.gender,
      dob: customerForm.dob,
      phone: customerForm.phone.trim(),
      altPhone: customerForm.altPhone.trim(),
      email: customerForm.email.trim(),
      address: customerForm.address.trim(),
      city: customerForm.city.trim() || 'Hyderabad',
      state: customerForm.state.trim() || 'Telangana',
      pincode: customerForm.pincode.trim(),
      occupation: customerForm.occupation.trim(),
      monthlyIncome: customerForm.monthlyIncome,
      profilePhoto: customerForm.profilePhoto,

      // KYC
      aadhaarNumber: customerForm.aadhaarNumber.trim(),
      aadhaarFrontDoc: customerForm.aadhaarFrontDoc,
      aadhaarBackDoc: customerForm.aadhaarBackDoc,
      panNumber: customerForm.panNumber.trim(),
      panDoc: customerForm.panDoc,
      otherDocType: customerForm.otherDocType,
      otherDocNumber: customerForm.otherDocNumber.trim(),
      otherDocFile: customerForm.otherDocFile,
      kycStatus: customerForm.kycStatus,

      // Default loan terms (to be disbursed via '+ Loan / Amount Given')
      loanAmount: 0,
      interestRate: 2.0,
      repaymentFrequency: 'Monthly',
      loanTermMonths: 12,
      startDate: new Date().toISOString().split('T')[0],
      disbursementMode: 'Cash',
      securityType: 'None',
      securityDetails: '',
      securityDoc: '',

      // Bank
      bankName: customerForm.bankName.trim(),
      accountHolderName: customerForm.accountHolderName.trim() || customerForm.name.trim(),
      accountNumber: customerForm.accountNumber.trim(),
      ifscCode: customerForm.ifscCode.trim(),
      branch: customerForm.branch.trim(),
      upiId: customerForm.upiId.trim(),
      bankProofDoc: customerForm.bankProofDoc,

      // Guarantor & References
      guarantorName: customerForm.guarantorName.trim(),
      guarantorRelation: customerForm.guarantorRelation.trim(),
      guarantorPhone: customerForm.guarantorPhone.trim(),
      guarantorAadhaar: customerForm.guarantorAadhaar.trim(),
      guarantorAddress: customerForm.guarantorAddress.trim(),
      guarantorDoc: customerForm.guarantorDoc,
      ref1Name: customerForm.ref1Name.trim(),
      ref1Phone: customerForm.ref1Phone.trim(),
      ref2Name: customerForm.ref2Name.trim(),
      ref2Phone: customerForm.ref2Phone.trim(),
      internalRemarks: customerForm.internalRemarks.trim(),

      // Balances
      principalPaid: 0,
      outstanding: 0
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setCustomerCount((prev) => prev + 1);

    success(`Customer ${newCustomer.name} (${newCustomer.customerCode}) registered successfully!`);
    setIsCustomerModalOpen(false);
    setCurrentCustomerStep(1);
    setCustomerForm(createBlankCustomerForm(customerCount + 2));
  };

  // Handle Loan Given
  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(loanForm.amount);
    if (!loanForm.customerName.trim()) {
      toastError('Please enter or select the customer name.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid loan amount.');
      return;
    }
    const rateVal = parseFloat(loanForm.interestRate) || 2.0;
    setTotalLoanGiven((prev) => prev + amt);
    const displayDate = formatDisplayDate(loanForm.paymentDate);

    setTransactions((prev) => [
      {
        id: Date.now(),
        date: displayDate,
        customerName: loanForm.customerName.trim(),
        type: 'Loan Given',
        amount: amt,
        mode: loanForm.mode,
        notes: loanForm.notes || `Sanctioned loan @ ${rateVal}% / mo, tenure: ${loanForm.loanTermMonths} mos, ${loanForm.securityType}`,
        paymentDate: loanForm.paymentDate
      },
      ...prev
    ]);

    // Update customer loan amount & terms
    setCustomers((prev) =>
      prev.map((c) => {
        const matches =
          loanForm.customerName.includes(c.name) ||
          (c.customerCode && loanForm.customerName.includes(c.customerCode));
        if (matches) {
          return {
            ...c,
            loanAmount: (c.loanAmount || 0) + amt,
            interestRate: rateVal,
            repaymentFrequency: loanForm.repaymentFrequency || c.repaymentFrequency || 'Monthly',
            loanTermMonths: parseInt(loanForm.loanTermMonths) || c.loanTermMonths || 12,
            startDate: loanForm.paymentDate || c.startDate,
            disbursementMode: loanForm.mode,
            securityType: loanForm.securityType,
            securityDetails: loanForm.securityDetails,
            securityDoc: loanForm.securityDoc || c.securityDoc,
            outstanding: (c.outstanding || 0) + amt
          };
        }
        return c;
      })
    );

    success(`Loan of ₹${amt.toLocaleString('en-IN')} disbursed to ${loanForm.customerName}!`);
    handleCloseLoanModal();
  };

  // Handle Add Collection
  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(collectionForm.amount);
    if (!collectionForm.customerName.trim()) {
      toastError('Please enter or select the customer name.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid collection amount.');
      return;
    }

    const isInterest = collectionForm.type === 'Collection (Interest)' || collectionForm.type === 'Month of Interest';

    if (!isInterest) {
      setTotalPrincipalReceived((prev) => prev + amt);
    } else {
      setTotalInterestReceived((prev) => prev + amt);
      setThisMonthInterest((prev) => prev + amt);
    }
    setTodayCollection((prev) => prev + amt);
    setThisMonthCollection((prev) => prev + amt);

    const displayDate = formatDisplayDate(collectionForm.paymentDate);
    const monthNote = isInterest ? `Month of Interest: ${collectionForm.monthOfInterest}` : '';

    setTransactions((prev) => [
      {
        id: Date.now(),
        date: displayDate,
        customerName: collectionForm.customerName.trim(),
        type: collectionForm.type,
        amount: amt,
        mode: collectionForm.mode,
        notes: collectionForm.notes
          ? `${collectionForm.notes}${monthNote ? ' • ' + monthNote : ''}`
          : monthNote || undefined,
        monthOfInterest: isInterest ? collectionForm.monthOfInterest : undefined,
        paymentDate: collectionForm.paymentDate
      },
      ...prev
    ]);

    // Update customer's principal/outstanding if it's principal collection
    if (!isInterest) {
      setCustomers((prev) =>
        prev.map((c) => {
          const matches =
            collectionForm.customerName.includes(c.name) ||
            collectionForm.customerName.includes(c.customerCode);
          if (matches) {
            const newPrincipal = (c.principalPaid || 0) + amt;
            const newOutstanding = Math.max(0, (c.outstanding || 0) - amt);
            return {
              ...c,
              principalPaid: newPrincipal,
              outstanding: newOutstanding
            };
          }
          return c;
        })
      );
    }

    success(`${collectionForm.type} of ₹${amt.toLocaleString('en-IN')} recorded successfully!`);
    handleCloseCollectionModal();
    setCollectionForm({
      customerName: '',
      type: 'Collection (Principal)',
      monthOfInterest: 'November 2026',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      mode: 'UPI',
      notes: ''
    });
  };

  // Customers Directory state & search
  const [isCustomersDirectoryOpen, setIsCustomersDirectoryOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Subtabs URL query handler for sidebar flyout navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');

  const clearTabParam = () => {
    if (searchParams.get('tab')) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleCloseInvestmentModal = () => {
    setIsInvestmentModalOpen(false);
    clearTabParam();
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
    clearTabParam();
  };

  const handleCloseCustomersDirectory = () => {
    setIsCustomersDirectoryOpen(false);
    clearTabParam();
  };

  const handleCloseLoanModal = () => {
    setIsLoanModalOpen(false);
    setLoanForm({
      customerName: '',
      amount: '',
      interestRate: '2.0',
      repaymentFrequency: 'Monthly',
      loanTermMonths: '12',
      paymentDate: new Date().toISOString().split('T')[0],
      mode: 'Cash',
      securityType: 'Promissory Note',
      securityDetails: '',
      securityDoc: '',
      notes: ''
    });
    clearTabParam();
  };

  const handleCloseCollectionModal = () => {
    setIsCollectionModalOpen(false);
    clearTabParam();
  };

  const handleCloseViewAllModal = () => {
    setIsViewAllModalOpen(false);
    clearTabParam();
  };

  useEffect(() => {
    if (!activeTabParam) return;
    if (activeTabParam === 'investment') {
      setIsInvestmentModalOpen(true);
    } else if (activeTabParam === 'customers') {
      setIsCustomersDirectoryOpen(true);
    } else if (activeTabParam === 'loan') {
      setIsLoanModalOpen(true);
    } else if (activeTabParam === 'collections') {
      setIsCollectionModalOpen(true);
    } else if (activeTabParam === 'balance') {
      setViewAllActiveTab('balance');
      setIsViewAllModalOpen(true);
    }
  }, [activeTabParam]);

  // Filtered directory customers
  const filteredDirectoryCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.occupation && c.occupation.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.panNumber && c.panNumber.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Export all finance data into professionally formatted multi-sheet Excel
  const handleExportExcel = () => {
    try {
      const customerRows = customers.map((c, idx) => {
        const f = computeCustomerFinancials(c, transactions);
        return [
          idx + 1,
          c.customerCode || `CF-${String(c.id).padStart(4, '0')}`,
          c.name,
          c.phone || '—',
          c.aadhaarNumber || '—',
          c.panNumber || '—',
          c.occupation || '—',
          c.monthlyIncome ? `₹ ${Number(c.monthlyIncome).toLocaleString('en-IN')}` : '—',
          `₹ ${Number(c.loanAmount || 0).toLocaleString('en-IN')}`,
          `${c.interestRate || 2.0}% / mo`,
          c.repaymentFrequency || 'Monthly',
          `${c.loanTermMonths || 12} Months`,
          `₹ ${f.totalOutstanding.toLocaleString('en-IN')}`,
          c.kycStatus || 'Verified'
        ];
      });

      const txRows = transactions.map((t, idx) => [
        idx + 1,
        t.date,
        t.customerName,
        t.type,
        `₹ ${Number(t.amount).toLocaleString('en-IN')}`,
        t.mode,
        t.notes || '—'
      ]);

      exportMultiSheetExcel({
        filename: `Chandrika_Finance_Report_${new Date().toISOString().split('T')[0]}`,
        sheets: [
          {
            sheetName: 'Customers Directory',
            title: 'CHANDRIKA FINANCE - REGISTERED BORROWERS & LOAN STATUS',
            subtitle: `Total Customers: ${customerCount} | Total Loan Given: ₹ ${totalLoanGiven.toLocaleString('en-IN')} | Total Outstanding: ₹ ${totalOutstanding.toLocaleString('en-IN')}`,
            headers: [
              'S.No',
              'Customer Code',
              'Full Name',
              'Phone',
              'Aadhaar Number',
              'PAN Number',
              'Occupation',
              'Monthly Income',
              'Loan Amount',
              'Interest Rate',
              'Repayment Frequency',
              'Term',
              'Outstanding Balance',
              'KYC Status'
            ],
            rows: customerRows
          },
          {
            sheetName: 'Transactions Register',
            title: 'CHANDRIKA FINANCE - TRANSACTIONS & COLLECTIONS REGISTER',
            subtitle: `Total Investment: ₹ ${totalInvestment.toLocaleString('en-IN')} | Total Principal Received: ₹ ${totalPrincipalReceived.toLocaleString('en-IN')} | Interest Received: ₹ ${totalInterestReceived.toLocaleString('en-IN')}`,
            headers: ['S.No', 'Date', 'Customer Name', 'Transaction Type', 'Amount (₹)', 'Payment Mode', 'Notes / Remarks'],
            rows: txRows
          }
        ]
      });
      success('Finance report exported to Excel successfully!');
    } catch (err: any) {
      error(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Print Summary Statement Report
  const handlePrintSummaryReport = () => {
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <!-- Chandrika Finance Exclusive Letterhead Banner (Logo Only) -->
        <div style="border: 2px solid #0056b3; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="/chandrika-finance-logo.png" alt="Chandrika Finance" style="height: 55px; width: auto; object-fit: contain; display: block;" onerror="this.src='/chandrika-finance-logo-transparent.png'" />
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px;">CHANDRIKA FINANCE</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #64748b; letter-spacing: 0.3px;">FINANCIAL & MICRO-LENDING SOLUTIONS</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 10.5px; color: #334155; line-height: 1.45;">
              <div style="color: #0f172a; font-weight: 800;">📞 Phone: 9505151527</div>
              <div style="color: #0f172a; font-weight: 800;">✉️ Email: charvikstaffingconsulrancy@gmail.com</div>
              <div style="color: #64748b; font-size: 9.5px; margin-top: 3px;">Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
            </div>
          </div>
          <div style="font-size: 9.5px; color: #475569; text-align: center; background: #f8fafc; padding: 5px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-weight: 600;">
            📍 NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana
          </div>
        </div>

        <!-- Document Sub-Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #142B4A; padding-bottom: 8px; margin-bottom: 18px;">
          <div>
            <h2 style="color: #142B4A; font-size: 15px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              Financial Portfolio & Loan Summary Statement
            </h2>
            <p style="font-size: 10.5px; color: #64748b; margin: 3px 0 0;">Comprehensive record of loans disbursed, principal collections, and borrower directory</p>
          </div>
          <div style="background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; padding: 3px 10px; border-radius: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
            Official Statement
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Investment</div>
            <div style="font-size: 16px; font-weight: 900; color: #4338ca; margin-top: 4px;">₹ ${totalInvestment.toLocaleString('en-IN')}</div>
          </div>
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Loan Given</div>
            <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 4px;">₹ ${totalLoanGiven.toLocaleString('en-IN')}</div>
          </div>
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Principal Received</div>
            <div style="font-size: 16px; font-weight: 900; color: #16a34a; margin-top: 4px;">₹ ${totalPrincipalReceived.toLocaleString('en-IN')}</div>
          </div>
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Outstanding</div>
            <div style="font-size: 16px; font-weight: 900; color: #dc2626; margin-top: 4px;">₹ ${totalOutstanding.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 16px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Registered Borrowers Directory</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
          <thead>
            <tr style="background: #142B4A; color: white; text-align: left;">
              <th style="padding: 6px 8px;">Code</th>
              <th style="padding: 6px 8px;">Customer Name</th>
              <th style="padding: 6px 8px;">Phone</th>
              <th style="padding: 6px 8px;">Loan Amount</th>
              <th style="padding: 6px 8px;">Rate</th>
              <th style="padding: 6px 8px;">Outstanding</th>
              <th style="padding: 6px 8px;">KYC Status</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map((c) => {
              const f = computeCustomerFinancials(c, transactions);
              return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 8px; font-family: monospace; font-weight: bold;">${c.customerCode || 'CF-' + c.id}</td>
                <td style="padding: 6px 8px; font-weight: bold;">${c.name}</td>
                <td style="padding: 6px 8px;">${c.phone || '—'}</td>
                <td style="padding: 6px 8px;">₹ ${Number(c.loanAmount || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px;">${c.interestRate || 2.0}% / mo</td>
                <td style="padding: 6px 8px; font-weight: bold; color: #dc2626;">₹ ${f.totalOutstanding.toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px;">${c.kycStatus || 'Verified'}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 16px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Recent Transactions</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #142B4A; color: white; text-align: left;">
              <th style="padding: 6px 8px;">Date</th>
              <th style="padding: 6px 8px;">Customer Name</th>
              <th style="padding: 6px 8px;">Type</th>
              <th style="padding: 6px 8px;">Amount</th>
              <th style="padding: 6px 8px;">Mode</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 10).map((t) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 8px;">${t.date}</td>
                <td style="padding: 6px 8px; font-weight: bold;">${t.customerName}</td>
                <td style="padding: 6px 8px;">${t.type}</td>
                <td style="padding: 6px 8px; font-weight: bold;">₹ ${Number(t.amount).toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px;">${t.mode}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    printSheet({
      title: 'CHANDRIKA FINANCE - FINANCIAL STATEMENT & LOAN DIRECTORY',
      subtitle: 'Finance Portfolio & Registered Borrowers Directory',
      orientation: 'portrait',
      hideHeader: true,
      hideMetaBar: true,
      htmlContent: content
    });
  };

  // Filtered view all transactions
  const filteredViewAllTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.customerName.toLowerCase().includes(viewAllSearch.toLowerCase()) ||
      t.type.toLowerCase().includes(viewAllSearch.toLowerCase()) ||
      t.mode.toLowerCase().includes(viewAllSearch.toLowerCase())
    );
  }, [transactions, viewAllSearch]);

  // Filtered balance customers for modal view
  const filteredBalanceCustomers = useMemo(() => {
    if (!viewAllSearch.trim()) return customers;
    const q = viewAllSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, viewAllSearch]);

  // Donut chart percentage calculations
  const principalPct = totalLoanGiven > 0 ? ((totalPrincipalReceived / totalLoanGiven) * 100).toFixed(1) : '24.6';
  const outstandingPct = totalLoanGiven > 0 ? ((totalOutstanding / totalLoanGiven) * 100).toFixed(1) : '75.4';

  return (
    <div className="space-y-5 pb-12 font-sans select-none">
      {/* 1. Top Greeting & Date Header with Chandrika Finance Logo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-gradient-to-r from-blue-50/90 via-amber-50/40 to-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 flex items-center justify-center">
            <img
              src="/chandrika-finance-logo.png"
              alt="Chandrika Finance"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Welcome, Admin <span className="inline-block">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Here is your finance summary for today
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsCustomersDirectoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="View full borrowers directory"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Customers ({customerCount})</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Export full finance data to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrintSummaryReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Print Finance Summary Report"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Print Report</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>14 Nov 2026, Sat</span>
          </div>
        </div>
      </div>

      {/* 2. Top 5 Primary Colored Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Investment (Purple Gradient) */}
        <div className="bg-gradient-to-r from-[#4A00E0] to-[#8E2DE2] text-white p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
            <span>₹</span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wide truncate">
              Total Investment
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
              ₹ {totalInvestment.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Total Loan Given (Blue Gradient) */}
        <div className="bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs backdrop-blur-xs">
            <HandCoins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wide truncate">
              Total Loan Given
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
              ₹ {totalLoanGiven.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Total Principal Received (Green Gradient) */}
        <div className="bg-gradient-to-r from-[#0ba360] to-[#3cba92] text-white p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wide truncate">
              Total Principal Received
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
              ₹ {totalPrincipalReceived.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Total Interest Received (Orange Gradient) */}
        <div className="bg-gradient-to-r from-[#f12711] to-[#f5af19] text-white p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs backdrop-blur-xs">
            <Percent className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wide truncate">
              Total Interest Received
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
              ₹ {totalInterestReceived.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Total Outstanding (Red Gradient) */}
        <div
          onClick={() => {
            setViewAllActiveTab('balance');
            setIsViewAllModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#e52d27] to-[#b31217] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view full borrower balance & interest accrual breakdown"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
              <RefreshCw className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wide truncate">
                Total Outstanding
              </span>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
                ₹ {totalOutstanding.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-xs shrink-0">
            View Breakdown
          </span>
        </div>
      </div>

      {/* 3. Second Row: 4 Clean White Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Collection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              Today's Collection
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              ₹ {todayCollection.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* This Month Collection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              This Month Collection
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              ₹ {thisMonthCollection.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* This Month Interest */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              This Month Interest
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              ₹ {thisMonthInterest.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => setIsCustomersDirectoryOpen(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
          title="Click to view all registered customers"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                Total Customers
              </span>
              <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {customerCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
            View All →
          </span>
        </div>
      </div>

      {/* 4. Middle Section (2 Columns): Loan Status Overview & Monthly Collection Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column 1: Loan Status Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Loan Status Overview</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2 flex-1">
            {/* SVG Donut Chart */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />
                {/* Outstanding (Blue) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#0080FF"
                  strokeWidth="18"
                  strokeDasharray={`${(75.4 / 100) * 276.46} 276.46`}
                  strokeDashoffset="0"
                />
                {/* Principal Received (Green) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#22C55E"
                  strokeWidth="18"
                  strokeDasharray={`${(24.6 / 100) * 276.46} 276.46`}
                  strokeDashoffset={`-${(75.4 / 100) * 276.46}`}
                />
                {/* Interest Received small accent arc (Orange) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="18"
                  strokeDasharray={`${(10 / 100) * 276.46} 276.46`}
                  strokeDashoffset={`-${(95 / 100) * 276.46}`}
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-slate-900 leading-tight">
                  ₹ {totalLoanGiven.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">Loan Given</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-3.5 flex-1 w-full text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 shrink-0"></span>
                  <span className="font-bold text-slate-700 text-xs">Principal Received</span>
                </div>
                <div className="font-black text-slate-900 text-xs">
                  ₹ {totalPrincipalReceived.toLocaleString('en-IN')} ({principalPct}%)
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-blue-600 shrink-0"></span>
                  <span className="font-bold text-slate-700 text-xs">Outstanding</span>
                </div>
                <div className="font-black text-slate-900 text-xs">
                  ₹ {totalOutstanding.toLocaleString('en-IN')} ({outstandingPct}%)
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 shrink-0"></span>
                  <span className="font-bold text-slate-700 text-xs">Interest Received</span>
                </div>
                <div className="font-black text-slate-900 text-xs">
                  ₹ {totalInterestReceived.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Monthly Collection Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Monthly Collection Trend</h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-right shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 block leading-none">Nov Collection</span>
              <span className="text-xs font-black text-slate-800 leading-tight">₹ 12,40,000</span>
            </div>
          </div>

          {/* Bar Chart with Y-axis */}
          <div className="relative pt-6 pb-2">
            {/* Grid Lines with Y-Axis Values */}
            <div className="flex flex-col justify-between h-40 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">14L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">12L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">10L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">8L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">6L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">4L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-dashed border-slate-100 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">2L</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="flex items-center w-full border-b border-slate-200 pb-0.5">
                <span className="w-8 shrink-0 text-right pr-2">0</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            </div>

            {/* Vertical Bars */}
            <div className="absolute inset-x-0 bottom-2 pl-8 pr-2 flex items-end justify-between h-40 gap-3">
              {[
                { month: 'Jun', height: '29%', color: 'bg-emerald-500', val: '4L' },
                { month: 'Jul', height: '41%', color: 'bg-emerald-500', val: '5.8L' },
                { month: 'Aug', height: '49%', color: 'bg-emerald-500', val: '6.8L' },
                { month: 'Sep', height: '61%', color: 'bg-emerald-500', val: '8.6L' },
                { month: 'Oct', height: '73%', color: 'bg-emerald-500', val: '10.2L' },
                { month: 'Nov', height: '88%', color: 'bg-blue-600', val: '12.4L', isCurrent: true }
              ].map((b) => (
                <div key={b.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div
                    style={{ height: b.height }}
                    className={`w-full max-w-[34px] rounded-t-sm transition-all duration-500 ${b.color} hover:opacity-90 shadow-2xs`}
                    title={`${b.month}: ₹${b.val}`}
                  ></div>
                  <span className={`text-[10px] mt-2 whitespace-nowrap ${b.isCurrent ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                    {b.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (~7 cols): Recent Transactions */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Recent Transactions</h3>
            </div>
            <button
              onClick={() => {
                setViewAllActiveTab('transactions');
                setIsViewAllModalOpen(true);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">{t.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">{t.customerName}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      <div>{t.type}</div>
                      {t.monthOfInterest && (
                        <span className="inline-block mt-0.5 text-[9.5px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                          Month: {t.monthOfInterest}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900">
                      ₹ {t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.mode === 'UPI'
                          ? 'bg-purple-100 text-purple-700'
                          : t.mode === 'Bank'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {t.mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (~5 cols): Quick Actions */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 items-center">
            {/* 1. + Add Investment */}
            <button
              onClick={() => setIsInvestmentModalOpen(true)}
              className="h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 px-3 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Coins className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="text-xs font-black tracking-tight whitespace-nowrap">+ Add Investment</span>
            </button>

            {/* 2. + Add Customer */}
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 px-3 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="text-xs font-black tracking-tight whitespace-nowrap">+ Add Customer</span>
            </button>

            {/* 3. + Loan / Amount Given */}
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 px-3 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <HandCoins className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="text-xs font-black tracking-tight whitespace-nowrap">+ Loan / Amount Given</span>
            </button>

            {/* 4. + Add Collection */}
            <button
              onClick={() => setIsCollectionModalOpen(true)}
              className="h-14 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 px-3 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <CalendarPlus className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="text-xs font-black tracking-tight whitespace-nowrap">+ Add Collection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Add Investment */}
      {isInvestmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="text-base font-black">Record New Capital Investment</h3>
              </div>
              <button onClick={handleCloseInvestmentModal} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInvestment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Investor / Partner Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Partner Capital"
                  value={investmentForm.investor}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, investor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Investment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500000"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-emerald-600 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Mode
                </label>
                <select
                  value={investmentForm.mode}
                  onChange={(e: any) => setInvestmentForm({ ...investmentForm, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="Bank">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tranche 2 capital infusion"
                  value={investmentForm.notes}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseInvestmentModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Customer (Matching Comprehensive Employee Registration Format) */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* 1. Modal Top Banner */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#142B4A] via-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 shadow-inner">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                    <span>Register New Finance Customer</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                      {customerForm.customerCode || 'CF-1001'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-200/90 font-medium">
                    Chandrika Finance • Comprehensive borrower profile, KYC verification, loan terms & bank records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Horizontal Stepper Bar (Matching DriverRegistration format) */}
            <div className="bg-slate-50/90 px-6 py-3.5 border-b border-slate-200 overflow-x-auto shrink-0">
              <div className="flex items-center justify-between min-w-[560px] relative max-w-3xl mx-auto">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0"></div>
                {[
                  { number: 1, title: 'Personal Info', icon: User },
                  { number: 2, title: 'KYC & Identity', icon: FileText },
                  { number: 3, title: 'Bank Account', icon: Landmark },
                  { number: 4, title: 'Guarantor & Refs', icon: ShieldCheck }
                ].map((st) => {
                  const Icon = st.icon;
                  const isDone = st.number < currentCustomerStep;
                  const isCurrent = st.number === currentCustomerStep;
                  return (
                    <div
                      key={st.number}
                      onClick={() => setCurrentCustomerStep(st.number)}
                      className="flex flex-col items-center relative z-10 cursor-pointer group"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105'
                            : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-400 border border-slate-300 group-hover:border-slate-400'
                          }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span
                        className={`text-[10.5px] font-bold mt-1 whitespace-nowrap ${isCurrent ? 'text-blue-700 font-black' : isDone ? 'text-slate-800' : 'text-slate-400'
                          }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Stepper Form Content */}
            <form onSubmit={handleSaveCustomer} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* ==================== STEP 1: PERSONAL INFORMATION ==================== */}
              {currentCustomerStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                    <User className="w-3.5 h-3.5 text-blue-300" />
                    <span>Step 1: Personal Information (Borrower Biodata)</span>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-blue-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {customerForm.profilePhoto ? (
                        <img src={customerForm.profilePhoto} alt="Profile Photo" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-blue-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-800 mb-0.5">Borrower Profile Photo</label>
                      <p className="text-[11px] text-slate-500 mb-2">Upload passport-size photograph or portrait of the customer</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomerFileUpload('profilePhoto', e)}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#142B4A] file:text-white hover:file:bg-blue-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Customer Code */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Customer ID / Code <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={customerForm.customerCode}
                        onChange={(e) => setCustomerForm({ ...customerForm, customerCode: e.target.value })}
                        placeholder="e.g. CF-1001"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/30 font-mono font-bold text-blue-700 outline-none"
                        required
                      />
                    </div>

                    {/* Customer Full Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Full Name (As per Aadhaar) <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. K. Venkatesh"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Father / Husband Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Father / Guardian Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. K. Satyanarayana"
                        value={customerForm.fatherName}
                        onChange={(e) => setCustomerForm({ ...customerForm, fatherName: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={customerForm.gender}
                        onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date of Birth</span>
                      </label>
                      <input
                        type="date"
                        value={customerForm.dob}
                        onChange={(e) => setCustomerForm({ ...customerForm, dob: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none"
                      />
                    </div>

                    {/* Primary Mobile */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Primary Mobile Number <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9848012345"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      />
                    </div>

                    {/* Alternative Mobile */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Alternative Mobile</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9848054321"
                        value={customerForm.altPhone}
                        onChange={(e) => setCustomerForm({ ...customerForm, altPhone: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none font-mono"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. customer@gmail.com"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>

                    {/* Occupation / Trade */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>Occupation / Trade</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Transport Contractor / Business"
                        value={customerForm.occupation}
                        onChange={(e) => setCustomerForm({ ...customerForm, occupation: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Residential Address & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Residential Address (Door No, Street, Colony)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. H.No 4-22, Agamaiah Nagar Colony, Bank Colony, Vanasthalipuram"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City & State</label>
                      <input
                        type="text"
                        placeholder="Hyderabad, Telangana"
                        value={`${customerForm.city}, ${customerForm.state}`}
                        onChange={(e) => {
                          const parts = e.target.value.split(',');
                          setCustomerForm({ ...customerForm, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                        }}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: KYC & IDENTITY DOCUMENTS ==================== */}
              {currentCustomerStep === 2 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    <span>Step 2: Identity Documents & KYC Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Aadhaar Number */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Aadhaar Number (12 Digits) <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="e.g. 7845 1290 3412"
                        value={customerForm.aadhaarNumber}
                        onChange={(e) => setCustomerForm({ ...customerForm, aadhaarNumber: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* PAN Card Number */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>PAN Card Number (10 Characters)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. ABCDE1234F"
                        value={customerForm.panNumber}
                        onChange={(e) => setCustomerForm({ ...customerForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Document Upload Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Aadhaar Front */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-0.5">Aadhaar Card (Front)</span>
                        <p className="text-[10.5px] text-slate-500 mb-2">Upload photo / scan of front side</p>
                      </div>
                      {customerForm.aadhaarFrontDoc ? (
                        <div className="relative w-full h-24 rounded-xl border border-slate-300 overflow-hidden group">
                          <img src={customerForm.aadhaarFrontDoc} alt="Aadhaar Front" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCustomerForm({ ...customerForm, aadhaarFrontDoc: '' })}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleCustomerFileUpload('aadhaarFrontDoc', e)}
                          className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#142B4A] file:text-white cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Aadhaar Back */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-0.5">Aadhaar Card (Back)</span>
                        <p className="text-[10.5px] text-slate-500 mb-2">Upload address side scan</p>
                      </div>
                      {customerForm.aadhaarBackDoc ? (
                        <div className="relative w-full h-24 rounded-xl border border-slate-300 overflow-hidden group">
                          <img src={customerForm.aadhaarBackDoc} alt="Aadhaar Back" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCustomerForm({ ...customerForm, aadhaarBackDoc: '' })}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleCustomerFileUpload('aadhaarBackDoc', e)}
                          className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#142B4A] file:text-white cursor-pointer"
                        />
                      )}
                    </div>

                    {/* PAN Card Photo */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-0.5">PAN Card Document</span>
                        <p className="text-[10.5px] text-slate-500 mb-2">Upload scanned PAN card copy</p>
                      </div>
                      {customerForm.panDoc ? (
                        <div className="relative w-full h-24 rounded-xl border border-slate-300 overflow-hidden group">
                          <img src={customerForm.panDoc} alt="PAN Doc" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCustomerForm({ ...customerForm, panDoc: '' })}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleCustomerFileUpload('panDoc', e)}
                          className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#142B4A] file:text-white cursor-pointer"
                        />
                      )}
                    </div>
                  </div>

                  {/* KYC Status & Secondary Proof */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Identification (Optional)</label>
                      <select
                        value={customerForm.otherDocType}
                        onChange={(e) => setCustomerForm({ ...customerForm, otherDocType: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none"
                      >
                        <option value="Voter ID">Voter ID Card (EPIC)</option>
                        <option value="Ration Card">Ration Card</option>
                        <option value="Electricity Bill">Electricity / Utility Bill</option>
                        <option value="Driving Licence">Driving Licence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">KYC Verification Status</label>
                      <select
                        value={customerForm.kycStatus}
                        onChange={(e: any) => setCustomerForm({ ...customerForm, kycStatus: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none"
                      >
                        <option value="Verified">Verified (Documents Checked & Approved)</option>
                        <option value="Pending Verification">Pending Verification (Under Review)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: BANK ACCOUNT DETAILS ==================== */}
              {currentCustomerStep === 3 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                    <Landmark className="w-3.5 h-3.5 text-blue-300" />
                    <span>Step 3: Bank Account & Payout Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Bank Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bank Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kotak Mahindra Bank / SBI"
                        value={customerForm.bankName}
                        onChange={(e) => setCustomerForm({ ...customerForm, bankName: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none"
                      />
                    </div>

                    {/* Account Holder Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Account Holder Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder={customerForm.name || 'e.g. K. Venkatesh'}
                        value={customerForm.accountHolderName}
                        onChange={(e) => setCustomerForm({ ...customerForm, accountHolderName: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none"
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bank Account Number</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2848153146"
                        value={customerForm.accountNumber}
                        onChange={(e) => setCustomerForm({ ...customerForm, accountNumber: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>

                    {/* IFSC Code */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. KKBK0007460"
                        value={customerForm.ifscCode}
                        onChange={(e) => setCustomerForm({ ...customerForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-none uppercase"
                      />
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Vanasthalipuram, Hyderabad"
                        value={customerForm.branch}
                        onChange={(e) => setCustomerForm({ ...customerForm, branch: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>

                    {/* UPI ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (PhonePe / GPay / Paytm)</label>
                      <input
                        type="text"
                        placeholder="e.g. 9848012345@ybl"
                        value={customerForm.upiId}
                        onChange={(e) => setCustomerForm({ ...customerForm, upiId: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Bank Proof Upload */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-0.5">Bank Passbook / Cancelled Cheque</span>
                      <p className="text-[10.5px] text-slate-500">Upload account proof document for direct settlement</p>
                    </div>
                    {customerForm.bankProofDoc ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Proof Uploaded</span>
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, bankProofDoc: '' })}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer text-xs ml-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleCustomerFileUpload('bankProofDoc', e)}
                        className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#142B4A] file:text-white cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 4: GUARANTOR & REFERENCES ==================== */}
              {currentCustomerStep === 4 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    <span>Step 4: Guarantor (Surety) & Personal References</span>
                  </div>

                  {/* Guarantor Details Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Guarantor (Surety) Information</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. M. Srinivas Rao"
                          value={customerForm.guarantorName}
                          onChange={(e) => setCustomerForm({ ...customerForm, guarantorName: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Relationship with Borrower</label>
                        <input
                          type="text"
                          placeholder="e.g. Brother / Business Partner"
                          value={customerForm.guarantorRelation}
                          onChange={(e) => setCustomerForm({ ...customerForm, guarantorRelation: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Mobile Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9848099887"
                          value={customerForm.guarantorPhone}
                          onChange={(e) => setCustomerForm({ ...customerForm, guarantorPhone: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Aadhaar / ID No</label>
                        <input
                          type="text"
                          placeholder="e.g. 6543 2109 8765"
                          value={customerForm.guarantorAadhaar}
                          onChange={(e) => setCustomerForm({ ...customerForm, guarantorAadhaar: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-medium text-slate-800 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Plot 12, L.B. Nagar, Hyderabad"
                          value={customerForm.guarantorAddress}
                          onChange={(e) => setCustomerForm({ ...customerForm, guarantorAddress: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal References */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Personal & Business References</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference 1 Name</label>
                          <input
                            type="text"
                            placeholder="e.g. G. Krishna"
                            value={customerForm.ref1Name}
                            onChange={(e) => setCustomerForm({ ...customerForm, ref1Name: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference 1 Phone</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="e.g. 9848011223"
                            value={customerForm.ref1Phone}
                            onChange={(e) => setCustomerForm({ ...customerForm, ref1Phone: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono font-medium text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference 2 Name</label>
                          <input
                            type="text"
                            placeholder="e.g. T. Srinivas"
                            value={customerForm.ref2Name}
                            onChange={(e) => setCustomerForm({ ...customerForm, ref2Name: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference 2 Phone</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="e.g. 9848044556"
                            value={customerForm.ref2Phone}
                            onChange={(e) => setCustomerForm({ ...customerForm, ref2Phone: e.target.value })}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono font-medium text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Internal Credit Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Internal Officer Remarks / Credit Assessment</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Neighbor enquiry verified, business shop visited in Vanasthalipuram, approved for disbursement."
                      value={customerForm.internalRemarks}
                      onChange={(e) => setCustomerForm({ ...customerForm, internalRemarks: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. Modal Action Navigation Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5">
                  {currentCustomerStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentCustomerStep((prev) => Math.max(1, prev - 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}

                  {currentCustomerStep < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentCustomerStep === 1) {
                          if (!customerForm.name.trim()) {
                            toastError('Please enter Customer Full Name before continuing.');
                            return;
                          }
                          if (!customerForm.phone.trim()) {
                            toastError('Please enter Customer Mobile Number before continuing.');
                            return;
                          }
                        }
                        setCurrentCustomerStep((prev) => Math.min(4, prev + 1));
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs hover:shadow transition-all cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Customer Registration</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Loan / Amount Given */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Disburse Loan / Amount Given</h3>
                  <p className="text-[11px] text-white/90">
                    Chandrika Finance • Loan parameters, monthly interest rate, collateral security & disbursement
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseLoanModal}
                className="text-white/80 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLoan} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* 1. Registered Customer Search & Auto-Select */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
                <CustomerSearchSelect
                  label="Select Registered Borrower / Customer"
                  required
                  value={loanForm.customerName}
                  onChange={(val, selectedCust) => {
                    setLoanForm((prev) => ({
                      ...prev,
                      customerName: val,
                      interestRate: selectedCust?.interestRate ? String(selectedCust.interestRate) : prev.interestRate,
                      repaymentFrequency: selectedCust?.repaymentFrequency || prev.repaymentFrequency
                    }));
                  }}
                  customers={customers}
                  placeholder="Search or select registered borrower (e.g. Suresh Reddy CF-1002)..."
                />
              </div>

              {/* Step 3 Subheader Badge matching the user's screenshot */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                <IndianRupee className="w-3.5 h-3.5 text-blue-300" />
                <span>STEP 3: LOAN PARAMETERS, INTEREST & COLLATERAL SECURITY</span>
              </div>

              {/* Loan Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sanctioned Loan Amount */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sanctioned Loan Amount (₹) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1000"
                    placeholder="e.g. 200000"
                    value={loanForm.amount}
                    onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Monthly Interest Rate */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Monthly Interest Rate (% per month) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    placeholder="e.g. 2.0"
                    value={loanForm.interestRate}
                    onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Repayment Frequency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repayment Frequency</label>
                  <select
                    value={loanForm.repaymentFrequency}
                    onChange={(e: any) => setLoanForm({ ...loanForm, repaymentFrequency: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none"
                  >
                    <option value="Monthly">Monthly Installments</option>
                    <option value="Weekly">Weekly Collections</option>
                    <option value="Daily">Daily Collections</option>
                  </select>
                </div>

                {/* Loan Tenure (Months) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Tenure / Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={loanForm.loanTermMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, loanTermMonths: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none"
                  />
                </div>

                {/* Disbursement Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={loanForm.paymentDate}
                    onChange={(e) => setLoanForm({ ...loanForm, paymentDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none"
                  />
                </div>

                {/* Disbursement Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Mode</label>
                  <select
                    value={loanForm.mode}
                    onChange={(e: any) => setLoanForm({ ...loanForm, mode: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI / Instant Transfer</option>
                  </select>
                </div>
              </div>

              {/* Live Monthly Interest & Balance Accrual Information Banner */}
              {Number(loanForm.amount) > 0 && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      ₹
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-xs sm:text-sm">
                        Monthly Interest Accrual: <span className="text-emerald-700">₹ {((Number(loanForm.amount || 0) * (Number(loanForm.interestRate) || 2.0)) / 100).toLocaleString('en-IN')}</span> / month
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Calculated at {loanForm.interestRate || '2.0'}% per month. The borrower's balance outstanding will automatically update each month according to this percentage.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                    Auto-Update Active
                  </span>
                </div>
              )}

              {/* Security & Collateral Particulars */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Security & Collateral Particulars</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Collateral / Security Type</label>
                    <select
                      value={loanForm.securityType}
                      onChange={(e) => setLoanForm({ ...loanForm, securityType: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none"
                    >
                      <option value="Promissory Note">Promissory Note (Pro-Note Signed)</option>
                      <option value="Cheque">Signed Security Cheque</option>
                      <option value="Vehicle">Vehicle RC / Hypothecation</option>
                      <option value="Property">Property Deed / Land Documents</option>
                      <option value="Gold">Gold Pledge</option>
                      <option value="Personal Guarantee">Personal Guarantor Undertaking</option>
                      <option value="None">Unsecured / None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cheque / Collateral Specifics</label>
                    <input
                      type="text"
                      placeholder="e.g. Cheque No. 492019, HDFC Bank, blank guarantee cheque"
                      value={loanForm.securityDetails}
                      onChange={(e) => setLoanForm({ ...loanForm, securityDetails: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Upload Security / Promissory Document Scan</label>
                  {loanForm.securityDoc ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Security document scan uploaded</span>
                      <button
                        type="button"
                        onClick={() => setLoanForm({ ...loanForm, securityDoc: '' })}
                        className="ml-auto text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleLoanFileUpload('securityDoc', e)}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#142B4A] file:text-white cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Purpose / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial vehicle expansion, business inventory financing"
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseLoanModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <HandCoins className="w-4 h-4" />
                  <span>Sanction & Disburse Loan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Collection */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5" />
                <h3 className="text-base font-black">Record Repayment Collection</h3>
              </div>
              <button onClick={handleCloseCollectionModal} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCollection} className="p-6 space-y-4 text-xs">
              {/* 1. Registered Customer Search & Auto-Select with (ID) in bracket */}
              <CustomerSearchSelect
                label="Customer Name"
                required
                value={collectionForm.customerName}
                onChange={(val) => setCollectionForm({ ...collectionForm, customerName: val })}
                customers={customers}
                placeholder="Search or select registered customer..."
              />

              {/* 2. Collection Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Collection Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={collectionForm.type}
                  onChange={(e: any) => setCollectionForm({ ...collectionForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="Collection (Principal)">Collection (Principal)</option>
                  <option value="Collection (Interest)">Collection (Interest)</option>
                  <option value="Month of Interest">Month of Interest</option>
                </select>
              </div>

              {/* 3. Month of Interest (shown when Interest or Month of Interest is selected) */}
              {(collectionForm.type === 'Collection (Interest)' || collectionForm.type === 'Month of Interest') && (
                <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Select Month of Interest <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 border border-purple-200 px-2 py-0.5 rounded-full">
                      Which month they gave
                    </span>
                  </div>
                  <select
                    required
                    value={collectionForm.monthOfInterest}
                    onChange={(e) => setCollectionForm({ ...collectionForm, monthOfInterest: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-300 rounded-xl font-black text-purple-900 text-xs bg-white focus:ring-2 focus:ring-purple-500/20"
                  >
                    {AVAILABLE_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-purple-700 font-semibold flex items-center gap-1">
                    <span>✨ Recording interest collection for:</span>
                    <strong className="underline font-black">{collectionForm.monthOfInterest}</strong>
                  </p>
                </div>
              )}

              {/* 4. Payment Given Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Given Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={collectionForm.paymentDate}
                  onChange={(e) => setCollectionForm({ ...collectionForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* 5. Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  value={collectionForm.amount}
                  onChange={(e) => setCollectionForm({ ...collectionForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-purple-600 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* 6. Payment Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Mode
                </label>
                <select
                  value={collectionForm.mode}
                  onChange={(e: any) => setCollectionForm({ ...collectionForm, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseCollectionModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Record Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Balance / Outstanding & View All Transactions */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Chandrika Finance — Balance & Transactions</h3>
                  <p className="text-[11px] text-blue-200/80">
                    Live balance auto-updates every month with interest accrual based on repayment rate
                  </p>
                </div>
              </div>
              <button onClick={handleCloseViewAllModal} className="text-white/80 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewAllActiveTab('balance')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    viewAllActiveTab === 'balance'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Balance / Outstanding</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    viewAllActiveTab === 'balance' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 font-bold'
                  }`}>
                    Auto-Accrual
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewAllActiveTab('transactions')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    viewAllActiveTab === 'transactions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>All Transactions History</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    viewAllActiveTab === 'transactions' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 font-bold'
                  }`}>
                    {transactions.length}
                  </span>
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={viewAllActiveTab === 'balance' ? "Search borrower by name or code..." : "Search customer, type, or mode..."}
                  value={viewAllSearch}
                  onChange={(e) => setViewAllSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {viewAllActiveTab === 'balance' ? (
                <>
                  {/* Summary metric banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Loan Given</span>
                      <span className="text-base font-black text-slate-900">₹ {totalLoanGiven.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Principal Repaid</span>
                      <span className="text-base font-black text-emerald-800">₹ {totalPrincipalReceived.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Monthly Interest Accrued</span>
                      <span className="text-base font-black text-amber-800">
                        ₹ {customers.reduce((s, c) => s + computeCustomerFinancials(c, transactions).totalInterestAccrued, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Live Total Outstanding</span>
                      <span className="text-base font-black text-rose-800">₹ {totalOutstanding.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Information Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-700">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900">
                        Monthly Interest Percentage Auto-Update System
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Each borrower's balance outstanding automatically accrues interest each calendar month according to their contracted monthly interest rate (e.g., 2.0% / mo) from their disbursement date. Any interest collections logged clear the unpaid accrued interest, while principal collections reduce the underlying principal.
                      </p>
                    </div>
                  </div>

                  {/* Borrowers Balance Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-3.5">Borrower</th>
                          <th className="py-3 px-3">Sanctioned Loan</th>
                          <th className="py-3 px-3">Interest Rate</th>
                          <th className="py-3 px-3">Elapsed Time</th>
                          <th className="py-3 px-3">Accrued Interest</th>
                          <th className="py-3 px-3">Principal Due</th>
                          <th className="py-3 px-3">Balance Outstanding</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredBalanceCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                              No customer records found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredBalanceCustomers.map((c) => {
                            const f = computeCustomerFinancials(c, transactions);
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3.5">
                                  <div className="font-black text-slate-900">{c.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {c.customerCode || `CF-${c.id}`} • {c.phone || 'No phone'}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-800">
                                    ₹ {Number(c.loanAmount || 0).toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Disbursed: {c.startDate || 'N/A'}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-blue-700">
                                    {c.interestRate || 2.0}% / month
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    ₹ {f.monthlyInterest.toLocaleString('en-IN')} / mo
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {f.monthsElapsed} month{f.monthsElapsed === 1 ? '' : 's'} elapsed
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-amber-700">
                                    ₹ {f.unpaidInterest.toLocaleString('en-IN')} due
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Accrued: ₹ {f.totalInterestAccrued.toLocaleString('en-IN')}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-800">
                                    ₹ {f.principalRemaining.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Paid: ₹ {f.totalPrincipalPaid.toLocaleString('en-IN')}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-black text-rose-600 text-sm">
                                    ₹ {f.totalOutstanding.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[9.5px] text-emerald-700 font-bold">
                                    Auto-calculated
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => handlePrintCustomerKYC(c)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                                    title="Print Borrower Loan & Interest Statement"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* All Transactions Table */
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Customer Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3 text-right">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredViewAllTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">{t.date}</td>
                          <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">{t.customerName}</td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                            <div>{t.type}</div>
                            {t.monthOfInterest && (
                              <span className="inline-block mt-0.5 text-[9.5px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                                Month: {t.monthOfInterest}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900">
                            ₹ {t.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                t.mode === 'UPI'
                                  ? 'bg-purple-100 text-purple-700'
                                  : t.mode === 'Bank'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {t.mode}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">
                {viewAllActiveTab === 'balance'
                  ? `${filteredBalanceCustomers.length} registered borrowers with auto-updating monthly interest`
                  : `${filteredViewAllTransactions.length} recorded finance transactions`}
              </span>
              <button
                onClick={handleCloseViewAllModal}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Customers Directory & KYC Dossier Manager */}
      {isCustomersDirectoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Registered Borrowers & Customers Directory</h3>
                  <p className="text-[11px] text-blue-200/80 font-medium">
                    Chandrika Finance customer records, loan balances, KYC documentation, and printable dossiers
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCustomersDirectory}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, code, phone, PAN, city..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export</span>
                </button>
                <button
                  onClick={handlePrintSummaryReport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => {
                    setIsCustomersDirectoryOpen(false);
                    setCurrentCustomerStep(1);
                    setCustomerForm(createBlankCustomerForm(customerCount + 1));
                    setIsCustomerModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#1a385f] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Customer</span>
                </button>
              </div>
            </div>

            {/* Customers Table / Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              {filteredDirectoryCustomers.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-sm font-bold text-slate-600">No customers found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or phone number</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-3.5">Customer / Borrower</th>
                        <th className="py-3 px-3.5">Contact & Location</th>
                        <th className="py-3 px-3.5">KYC Identity</th>
                        <th className="py-3 px-3.5">Sanctioned Loan</th>
                        <th className="py-3 px-3.5">Outstanding Balance</th>
                        <th className="py-3 px-3.5">KYC Status</th>
                        <th className="py-3 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredDirectoryCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                          {/* Name & Photo */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-3">
                              {c.profilePhoto ? (
                                <img
                                  src={c.profilePhoto}
                                  alt={c.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 leading-tight">{c.name}</div>
                                <div className="text-[10.5px] font-mono text-blue-700 font-bold mt-0.5">
                                  {c.customerCode || `CF-${String(c.id).padStart(4, '0')}`}
                                </div>
                                {c.occupation && (
                                  <div className="text-[10px] text-slate-400 truncate">{c.occupation}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.phone || '—'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{c.city || 'Hyderabad'}, {c.state || 'Telangana'}</span>
                            </div>
                          </td>

                          {/* KYC IDs */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono text-[11px] font-bold text-slate-700">
                              Aadhaar: {c.aadhaarNumber || '—'}
                            </div>
                            <div className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                              PAN: {c.panNumber || '—'}
                            </div>
                          </td>

                          {/* Sanctioned Loan */}
                          <td className="py-3 px-3.5">
                            <div className="font-black text-slate-900">
                              ₹ {Number(c.loanAmount || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                              @{c.interestRate || 2.0}% / mo ({c.repaymentFrequency || 'Monthly'})
                            </div>
                          </td>

                          {/* Outstanding */}
                          <td className="py-3 px-3.5">
                            {(() => {
                              const f = computeCustomerFinancials(c, transactions);
                              return (
                                <>
                                  <div className="font-black text-rose-600 text-sm">
                                    ₹ {f.totalOutstanding.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-0.5">
                                    <span>Principal Due: ₹ {f.principalRemaining.toLocaleString('en-IN')}</span>
                                    {f.unpaidInterest > 0 ? (
                                      <span className="text-amber-700 font-bold">
                                        + Interest ({f.monthsElapsed} mo @ {c.interestRate || 2}%): ₹ {f.unpaidInterest.toLocaleString('en-IN')}
                                      </span>
                                    ) : f.monthsElapsed > 0 ? (
                                      <span className="text-emerald-600 font-bold">Interest paid up to date</span>
                                    ) : (
                                      <span className="text-slate-400">Current month (₹ {f.monthlyInterest.toLocaleString('en-IN')}/mo)</span>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${c.kycStatus === 'Verified'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{c.kycStatus || 'Verified'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePrintCustomerKYC(c)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-colors border border-blue-200/80"
                                title="Print Official KYC Sheet"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print KYC</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove customer ${c.name}?`)) {
                                    setCustomers((prev) => prev.filter((item) => item.id !== c.id));
                                    setCustomerCount((prev) => Math.max(0, prev - 1));
                                    success(`Customer ${c.name} removed`);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Showing {filteredDirectoryCustomers.length} of {customers.length} registered borrowers
              </span>
              <button
                onClick={handleCloseCustomersDirectory}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChandrikaFinance;
