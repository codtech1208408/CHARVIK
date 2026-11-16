import React, { useState, useMemo } from 'react';
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
  UserPlus,
  CalendarPlus,
  X,
  CheckCircle2,
  Filter,
  Download,
  Search
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

export interface FinanceTransaction {
  id: string | number;
  date: string;
  customerName: string;
  type: 'Collection (Interest)' | 'Collection (Principal)' | 'Loan Given' | 'Investment Added';
  amount: number;
  mode: 'UPI' | 'Bank' | 'Cash';
  notes?: string;
}

export interface FinanceCustomer {
  id: string | number;
  name: string;
  phone: string;
  loanAmount: number;
  principalPaid: number;
  interestRate: number;
  outstanding: number;
  startDate: string;
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

  // Customers State (48 customers)
  const [customerCount, setCustomerCount] = useState(48);

  // Core Financial Aggregates (matching the user's exact screenshot values)
  const [totalInvestment, setTotalInvestment] = useState(5000000);
  const [totalLoanGiven, setTotalLoanGiven] = useState(3250000);
  const [totalPrincipalReceived, setTotalPrincipalReceived] = useState(800000);
  const [totalInterestReceived, setTotalInterestReceived] = useState(325000);
  const [todayCollection, setTodayCollection] = useState(85000);
  const [thisMonthCollection, setThisMonthCollection] = useState(1240000);
  const [thisMonthInterest, setThisMonthInterest] = useState(210000);

  // Dynamic Outstanding calculation
  const totalOutstanding = useMemo(() => {
    return Math.max(0, totalLoanGiven - totalPrincipalReceived);
  }, [totalLoanGiven, totalPrincipalReceived]);

  // Modals
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

  // Form states
  const [investmentForm, setInvestmentForm] = useState({ investor: '', amount: '', mode: 'Bank' as 'UPI' | 'Bank' | 'Cash', notes: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', loanAmount: '', interestRate: '2.0', notes: '' });
  const [loanForm, setLoanForm] = useState({ customerName: '', amount: '', mode: 'Cash' as 'UPI' | 'Bank' | 'Cash', notes: '' });
  const [collectionForm, setCollectionForm] = useState({ customerName: '', type: 'Collection (Principal)' as 'Collection (Principal)' | 'Collection (Interest)', amount: '', mode: 'UPI' as 'UPI' | 'Bank' | 'Cash', notes: '' });

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
    setIsInvestmentModalOpen(false);
    setInvestmentForm({ investor: '', amount: '', mode: 'Bank', notes: '' });
  };

  // Handle Add Customer
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    setCustomerCount((prev) => prev + 1);
    success(`Customer ${customerForm.name} registered successfully!`);
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', phone: '', loanAmount: '', interestRate: '2.0', notes: '' });
  };

  // Handle Loan Given
  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(loanForm.amount);
    if (!loanForm.customerName.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid loan amount.');
      return;
    }
    setTotalLoanGiven((prev) => prev + amt);
    setTransactions((prev) => [
      {
        id: Date.now(),
        date: '14 Nov 2026',
        customerName: loanForm.customerName.trim(),
        type: 'Loan Given',
        amount: amt,
        mode: loanForm.mode,
        notes: loanForm.notes
      },
      ...prev
    ]);
    success(`Loan of ₹${amt.toLocaleString('en-IN')} disbursed to ${loanForm.customerName}!`);
    setIsLoanModalOpen(false);
    setLoanForm({ customerName: '', amount: '', mode: 'Cash', notes: '' });
  };

  // Handle Add Collection
  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(collectionForm.amount);
    if (!collectionForm.customerName.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid collection amount.');
      return;
    }

    if (collectionForm.type === 'Collection (Principal)') {
      setTotalPrincipalReceived((prev) => prev + amt);
    } else {
      setTotalInterestReceived((prev) => prev + amt);
      setThisMonthInterest((prev) => prev + amt);
    }
    setTodayCollection((prev) => prev + amt);
    setThisMonthCollection((prev) => prev + amt);

    setTransactions((prev) => [
      {
        id: Date.now(),
        date: '14 Nov 2026',
        customerName: collectionForm.customerName.trim(),
        type: collectionForm.type,
        amount: amt,
        mode: collectionForm.mode,
        notes: collectionForm.notes
      },
      ...prev
    ]);
    success(`${collectionForm.type} of ₹${amt.toLocaleString('en-IN')} recorded!`);
    setIsCollectionModalOpen(false);
    setCollectionForm({ customerName: '', type: 'Collection (Principal)', amount: '', mode: 'UPI', notes: '' });
  };

  // Filtered view all transactions
  const filteredViewAllTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.customerName.toLowerCase().includes(viewAllSearch.toLowerCase()) ||
      t.type.toLowerCase().includes(viewAllSearch.toLowerCase()) ||
      t.mode.toLowerCase().includes(viewAllSearch.toLowerCase())
    );
  }, [transactions, viewAllSearch]);

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

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 w-fit self-start md:self-auto shrink-0">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>14 Nov 2026, Sat</span>
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
        <div className="bg-gradient-to-r from-[#e52d27] to-[#b31217] text-white p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs backdrop-blur-xs">
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
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
              onClick={() => setIsViewAllModalOpen(true)}
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
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">{t.type}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900">
                      ₹ {t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.mode === 'UPI'
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
              <button onClick={() => setIsInvestmentModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
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
                  onClick={() => setIsInvestmentModalOpen(false)}
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

      {/* Modal 2: Add Customer */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-black">Register New Finance Customer</h3>
              </div>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Venkatesh"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9848012345"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Interest Rate (% per month)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.0"
                  value={customerForm.interestRate}
                  onChange={(e) => setCustomerForm({ ...customerForm, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Loan / Amount Given */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5" />
                <h3 className="text-base font-black">Disburse Loan / Amount Given</h3>
              </div>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLoan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Borrower Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anil Verma"
                  value={loanForm.customerName}
                  onChange={(e) => setLoanForm({ ...loanForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Loan Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 200000"
                  value={loanForm.amount}
                  onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-amber-600 text-xs focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Disbursement Mode
                </label>
                <select
                  value={loanForm.mode}
                  onChange={(e: any) => setLoanForm({ ...loanForm, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial vehicle expansion"
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Disburse Loan
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
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCollection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Reddy"
                  value={collectionForm.customerName}
                  onChange={(e) => setCollectionForm({ ...collectionForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Collection Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={collectionForm.type}
                  onChange={(e: any) => setCollectionForm({ ...collectionForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="Collection (Principal)">Collection (Principal)</option>
                  <option value="Collection (Interest)">Collection (Interest)</option>
                </select>
              </div>

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
                  onClick={() => setIsCollectionModalOpen(false)}
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

      {/* Modal 5: View All Transactions */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-300" />
                <h3 className="text-base font-black">All Finance Transactions</h3>
              </div>
              <button onClick={() => setIsViewAllModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, type, or mode..."
                  value={viewAllSearch}
                  onChange={(e) => setViewAllSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                {filteredViewAllTransactions.length} Transactions
              </span>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">{t.type}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900">
                        ₹ {t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.mode === 'UPI'
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

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsViewAllModalOpen(false)}
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
