import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Save,
  Printer,
  Trash2,
  Edit,
  Search,
  Calendar,
  Building2,
  Bus,
  Landmark,
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  Download,
  RotateCcw,
  Eye,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import charvikLogo from '../assets/logo-horizontal.png';
import vyshnaviLogo from '../assets/vyshnavi-logo.png';
import chandrikaLogo from '../assets/chandrika-finance-logo.png';

export type CompanyKey = 'charvik' | 'vyshnavi' | 'chandrika';

export interface LetterRecord {
  id: string;
  company: CompanyKey;
  companyName: string;
  date: string;
  serialNumber: string;
  title: string;
  respectTo: string;
  matter: string;
  createdAt: string;
}

interface CompanyConfig {
  key: CompanyKey;
  name: string;
  tagline: string;
  logo: string;
  serialPrefix: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  themeColor: string;
  accentColor: string;
  footerText: string;
}

const COMPANIES: Record<CompanyKey, CompanyConfig> = {
  charvik: {
    key: 'charvik',
    name: 'CHARVIK STAFFING CONSULTANCY',
    tagline: 'YOUR TALENT | OUR SUPPORT | A BRIGHTER FUTURE',
    logo: charvikLogo,
    serialPrefix: 'CSC',
    phone: '+91 9505151527',
    email: 'info@charvikconsultancy.com',
    website: 'www.charvikconsultancy.com',
    address: '# 2-2-178, 1st Floor, Main Road, L.B. Nagar, Hyderabad - 500074, Telangana',
    themeColor: '#032B69',
    accentColor: '#F97316',
    footerText: 'CHARVIK STAFFING CONSULTANCY • ISO CERTIFIED MANPOWER SOLUTIONS'
  },
  vyshnavi: {
    key: 'vyshnavi',
    name: 'VAISHNAVI TRAVELS',
    tagline: 'All Types of Bus Passenger & Transport Services',
    logo: vyshnaviLogo,
    serialPrefix: 'VT',
    phone: '+91 9396151527',
    email: 'vyshnavitravels@gmail.com',
    website: 'www.vyshnavitravels.in',
    address: 'Near Bus Terminal, Vanasthalipuram, Hyderabad, Telangana - 500070',
    themeColor: '#006666',
    accentColor: '#F97316',
    footerText: 'VAISHNAVI TRAVELS • INTERCITY LUXURY BUS PASSENGER FLEET'
  },
  chandrika: {
    key: 'chandrika',
    name: 'CHANDRIKA FINANCE',
    tagline: 'Micro Finance, Daily & Monthly Investment Solutions',
    logo: chandrikaLogo,
    serialPrefix: 'CF',
    phone: '+91 9505151527',
    email: 'chandrikafinance@gmail.com',
    website: 'www.chandrikafinance.com',
    address: 'Opp. Kotak Bank, Vanasthalipuram, Hyderabad, Telangana - 500070',
    themeColor: '#78350F',
    accentColor: '#D97706',
    footerText: 'CHANDRIKA FINANCE • AUTHORIZED MICRO FINANCE & DAILY COLLECTIONS'
  }
};

const INITIAL_SAVED_LETTERS: LetterRecord[] = [
  {
    id: 'LET-1001',
    company: 'charvik',
    companyName: 'CHARVIK STAFFING CONSULTANCY',
    date: '21-11-2026',
    serialNumber: 'CSC/2026/0001',
    title: 'Staffing Deployment Order for Interstate Fleet Operations',
    respectTo: 'The Managing Director, Yolobus Private Limited / Sri Krishna Travels',
    matter: `Dear Sir/Madam,

This is to officially certify that Charvik Staffing Consultancy has provisioned and deployed 69 heavy commercial vehicle drivers, 6 maintenance helpers, and 40 fleet captains for active duty across South India intercity transit routes for the scheduled service period.

All personnel have successfully cleared statutory background verification, commercial driving fitness checks, and route orientation. We request your operational team to accept duty rosters and facilitate trip authorizations accordingly.

For any operational inquiries or duty adjustments, our operations helpline (+91 9505151527) remains accessible 24/7.`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'LET-1002',
    company: 'vyshnavi',
    companyName: 'VAISHNAVI TRAVELS',
    date: '21-11-2026',
    serialNumber: 'VT/2026/0001',
    title: 'Intercity Bus Service Clearance & Route Authorization',
    respectTo: 'The Regional Transport Authority (RTA) / Highway Toll Authority',
    matter: `Respected Authority,

Sub: Intercity Passenger Coach Route Operation Clearance.

This letter confirms that Vaishnavi Travels bus coach bearing registration number TS 08 UA 5678 (Scania Metrolink HD) is operating on an authorized scheduled passenger route between Hyderabad and Bengaluru.

All vehicle passenger permits, commercial comprehensive insurance coverage, speed governor certificates, and driver license endorsements are valid and in full compliance with Central Motor Vehicles Rules (CMVR). Kindly extend clearance at toll plazas and passenger checkpoints.`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'LET-1003',
    company: 'chandrika',
    companyName: 'CHANDRIKA FINANCE',
    date: '21-11-2026',
    serialNumber: 'CF/2026/0001',
    title: 'Loan Disbursement & Repayment Settlement Certificate',
    respectTo: 'Ramesh Kumar (Customer ID: CF-CUST-802)',
    matter: `Dear Customer,

We are pleased to inform you that your commercial finance facility with Chandrika Finance has been approved and disbursed. 

All terms regarding daily and monthly collection schedules, interest accruals, and prompt repayment benefits have been explained and acknowledged. Please ensure that collection receipts are preserved for account reconciliations.

We thank you for choosing Chandrika Finance as your trusted financial partner.`,
    createdAt: new Date().toISOString()
  }
];

export const LetterPad: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Read company from URL or default to 'charvik'
  const initialCompany = (searchParams.get('company') as CompanyKey) || 'charvik';
  const [activeCompany, setActiveCompany] = useState<CompanyKey>(
    COMPANIES[initialCompany] ? initialCompany : 'charvik'
  );

  // Saved records state
  const [savedRecords, setSavedRecords] = useState<LetterRecord[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_official_letter_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SAVED_LETTERS;
  });

  // Current editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [letterDate, setLetterDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });

  // Compute next automatic serial number for active company
  const computeNextSerialNumber = (companyKey: CompanyKey) => {
    const year = new Date().getFullYear();
    const config = COMPANIES[companyKey];
    const companyRecords = savedRecords.filter((r) => r.company === companyKey);
    const nextSeq = String(companyRecords.length + 1).padStart(4, '0');
    return `${config.serialPrefix}/${year}/${nextSeq}`;
  };

  const [serialNumber, setSerialNumber] = useState(() => computeNextSerialNumber(activeCompany));
  const [letterTitle, setLetterTitle] = useState('');
  const [respectTo, setRespectTo] = useState('');
  const [letterMatter, setLetterMatter] = useState('');

  // Search & filter in saved records table
  const [tableSearch, setTableSearch] = useState('');
  const [tableCompanyFilter, setTableCompanyFilter] = useState<'All' | CompanyKey>('All');

  // Sync active company when URL changes
  useEffect(() => {
    const qComp = searchParams.get('company') as CompanyKey;
    if (qComp && COMPANIES[qComp] && qComp !== activeCompany) {
      setActiveCompany(qComp);
      setSerialNumber(computeNextSerialNumber(qComp));
    }
  }, [searchParams]);

  // Persist saved letters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('charvik_official_letter_records', JSON.stringify(savedRecords));
    } catch {}
  }, [savedRecords]);

  // Switch company handler
  const handleSwitchCompany = (comp: CompanyKey) => {
    setActiveCompany(comp);
    setSearchParams({ company: comp });
    if (!editingId) {
      setSerialNumber(computeNextSerialNumber(comp));
    }
  };

  // Reset form to blank / new letter
  const handleNewLetter = () => {
    setEditingId(null);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setLetterDate(`${dd}-${mm}-${yyyy}`);
    setSerialNumber(computeNextSerialNumber(activeCompany));
    setLetterTitle('');
    setRespectTo('');
    setLetterMatter('');
    success('New Letter editor ready.');
  };

  // Save record handler
  const handleSaveRecord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!letterMatter.trim()) {
      error('Please write the letter message before saving.');
      return;
    }

    const currentConfig = COMPANIES[activeCompany];
    const recordPayload: LetterRecord = {
      id: editingId || `LET-${Date.now()}`,
      company: activeCompany,
      companyName: currentConfig.name,
      date: letterDate.trim() || new Date().toLocaleDateString('en-GB'),
      serialNumber: serialNumber.trim() || computeNextSerialNumber(activeCompany),
      title: letterTitle.trim() || 'General Official Letter',
      respectTo: respectTo.trim(),
      matter: letterMatter.trim(),
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      setSavedRecords((prev) =>
        prev.map((r) => (r.id === editingId ? recordPayload : r))
      );
      success(`Letter ${recordPayload.serialNumber} updated successfully!`);
    } else {
      setSavedRecords((prev) => [recordPayload, ...prev]);
      setEditingId(recordPayload.id);
      success(`Letter ${recordPayload.serialNumber} saved to browser storage!`);
    }
  };

  // Load existing letter into editor
  const handleLoadLetter = (rec: LetterRecord) => {
    setActiveCompany(rec.company);
    setSearchParams({ company: rec.company });
    setEditingId(rec.id);
    setLetterDate(rec.date);
    setSerialNumber(rec.serialNumber);
    setLetterTitle(rec.title);
    setRespectTo(rec.respectTo || '');
    setLetterMatter(rec.matter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    success(`Loaded letter ${rec.serialNumber} into editor.`);
  };

  // Delete saved letter
  const handleDeleteLetter = (id: string, serial: string) => {
    if (window.confirm(`Are you sure you want to delete letter record ${serial}?`)) {
      setSavedRecords((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) {
        handleNewLetter();
      }
      success(`Letter record ${serial} deleted.`);
    }
  };

  // High quality print / PDF trigger
  const handlePrint = () => {
    const printContent = document.getElementById('letterpad-official-preview-sheet');
    if (!printContent) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const currentConfig = COMPANIES[activeCompany];

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentConfig.name} - Letter ${serialNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm 12mm 14mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1e293b;
              background: #ffffff;
              font-size: 13px;
              line-height: 1.6;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .letter-sheet {
              width: 100%;
              min-height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .letter-header {
              border-bottom: 2px solid ${currentConfig.themeColor};
              padding-bottom: 12px;
              margin-bottom: 16px;
              text-align: center;
            }
            .logo-img {
              max-height: 70px;
              max-width: 280px;
              object-fit: contain;
              margin: 0 auto 6px auto;
              display: block;
            }
            .company-name {
              font-size: 20px;
              font-weight: 900;
              color: ${currentConfig.themeColor};
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .company-tagline {
              font-size: 10px;
              font-weight: 700;
              color: ${currentConfig.accentColor};
              letter-spacing: 1px;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            .contact-pills {
              display: flex;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap;
              gap: 12px;
              font-size: 11px;
              font-weight: 600;
              color: #334155;
              margin-bottom: 4px;
            }
            .address-bar {
              font-size: 10px;
              font-weight: 500;
              color: #475569;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 9999px;
              padding: 3px 12px;
              display: inline-block;
              margin-top: 4px;
            }
            .ref-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 18px;
            }
            .recipient-block {
              margin-bottom: 16px;
              font-size: 13px;
              line-height: 1.5;
            }
            .recipient-label {
              font-weight: 800;
              color: #0f172a;
            }
            .title-block {
              font-size: 14px;
              font-weight: 800;
              color: ${currentConfig.themeColor};
              text-decoration: underline;
              margin-bottom: 16px;
            }
            .matter-body {
              font-size: 13px;
              color: #1e293b;
              line-height: 1.7;
              white-space: pre-wrap;
              word-break: break-word;
              flex: 1;
              min-height: 380px;
            }
            .signoff-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 20px;
            }
            .signoff-box {
              text-align: right;
            }
            .signoff-for {
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
            }
            .signoff-space {
              height: 60px;
            }
            .signoff-title {
              font-size: 12px;
              font-weight: 700;
              color: #334155;
              border-top: 1px solid #94a3b8;
              padding-top: 4px;
              display: inline-block;
              min-width: 170px;
            }
            .footer-strip {
              margin-top: 24px;
              padding-top: 8px;
              border-top: 3px solid ${currentConfig.themeColor};
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="letter-sheet">
            <div>
              <!-- Header -->
              <div class="letter-header">
                <img src="${currentConfig.logo}" class="logo-img" alt="${currentConfig.name}" />
                <div class="contact-pills">
                  <span>📞 ${currentConfig.phone}</span>
                  <span>✉️ ${currentConfig.email}</span>
                  <span>🌐 ${currentConfig.website}</span>
                </div>
                <div class="address-bar">📍 ${currentConfig.address}</div>
              </div>

              <!-- Ref No & Date -->
              <div class="ref-bar">
                <span><strong>Ref No:</strong> ${serialNumber}</span>
                <span><strong>Date:</strong> ${letterDate}</span>
              </div>

              <!-- Recipient -->
              ${
                respectTo.trim()
                  ? `<div class="recipient-block"><span class="recipient-label">To,</span><br/>${respectTo.replace(
                      /\n/g,
                      '<br/>'
                    )}</div>`
                  : ''
              }

              <!-- Letter Subject/Title -->
              ${
                letterTitle.trim()
                  ? `<div class="title-block"><strong>Sub:</strong> ${letterTitle}</div>`
                  : ''
              }

              <!-- Matter -->
              <div class="matter-body">${letterMatter || 'No letter content written.'}</div>
            </div>

            <!-- Signoff & Footer -->
            <div>
              <div class="signoff-section">
                <div></div>
                <div class="signoff-box">
                  <div class="signoff-for">For ${currentConfig.name}</div>
                  <div class="signoff-space"></div>
                  <div class="signoff-title">Authorised Signatory</div>
                </div>
              </div>

              <div class="footer-strip">
                <span>${currentConfig.footerText}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 400);
  };

  // Filtered saved records for table (strictly for activeCompany)
  const filteredRecords = useMemo(() => {
    return savedRecords.filter((rec) => {
      if (rec.company !== activeCompany) return false;
      const q = tableSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        rec.serialNumber.toLowerCase().includes(q) ||
        rec.title.toLowerCase().includes(q) ||
        rec.respectTo.toLowerCase().includes(q) ||
        rec.date.toLowerCase().includes(q)
      );
    });
  }, [savedRecords, activeCompany, tableSearch]);

  const currentConfig = COMPANIES[activeCompany];

  return (
    <div className="space-y-6 pb-16">
      {/* ── TOP ACTION BAR (EXACT MATCH FOR USER VIDEO TOP BUTTONS) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          {/* New Letter Button */}
          <button
            type="button"
            onClick={handleNewLetter}
            className="px-4 py-2 rounded-xl border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>New Letter</span>
          </button>

          {/* Save Record Button */}
          <button
            type="button"
            onClick={() => handleSaveRecord()}
            className="px-4 py-2 rounded-xl bg-[#032B69] hover:bg-[#021F4C] text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save Record</span>
          </button>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#004B9E] hover:bg-[#003B7C] text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Active Company Badge Only (Dedicated tab mode) */}
        <div className="flex items-center gap-2">
          {activeCompany === 'charvik' && (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-black flex items-center gap-2 shadow-xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Charvik Staffing Consultancy</span>
            </div>
          )}
          {activeCompany === 'vyshnavi' && (
            <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-black flex items-center gap-2 shadow-xs">
              <Bus className="w-4 h-4 text-teal-600" />
              <span>Vyshnavi Travels</span>
            </div>
          )}
          {activeCompany === 'chandrika' && (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black flex items-center gap-2 shadow-xs">
              <Landmark className="w-4 h-4 text-amber-600" />
              <span>Chandrika Finance</span>
            </div>
          )}
        </div>
      </div>

      {/* ── EDITOR CARD: EXACT MATCH FOR VIDEO "CHARVIK Letter Pad – Letter Editor" ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: currentConfig.themeColor }}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#142B4A] tracking-tight">
                {currentConfig.name} Letter Pad – Letter Editor
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Official document format with company header, automatic serial tracking & PDF print preview.
              </p>
            </div>
          </div>

          {editingId && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold">
              Editing Record: {serialNumber}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <div className="relative">
                <input
                  type="text"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Serial Number (automatic) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Serial Number <span className="text-slate-400 font-normal">(automatic)</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder={`${currentConfig.serialPrefix}/2026/0001`}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Letter Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Letter Title</label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                placeholder="Title for saved record only"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Respect To (optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Respect To <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={respectTo}
                onChange={(e) => setRespectTo(e.target.value)}
                placeholder="Enter recipient / respected person"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Letter Matter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Letter Matter</label>
            <textarea
              rows={8}
              value={letterMatter}
              onChange={(e) => setLetterMatter(e.target.value)}
              placeholder="Type your letter message here..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 italic mt-1.5">
              The date and serial number are inserted automatically. Save Record stores a copy in this browser on this device.
            </p>
          </div>
        </form>
      </div>

      {/* ── SAVED LETTER RECORDS SECTION (EXACT MATCH FOR VIDEO TABLE) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-[#142B4A] tracking-tight">Saved Letter Records</h2>
            <p className="text-xs font-medium text-slate-500">
              Browser storage is suitable for this demo. Saved copies stay preserved for re-printing and editing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search letters..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter by Company */}
            <select
              value={tableCompanyFilter}
              onChange={(e) => setTableCompanyFilter(e.target.value as any)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Companies</option>
              <option value="charvik">Charvik Consultancy</option>
              <option value="vyshnavi">Vyshnavi Travels</option>
              <option value="chandrika">Chandrika Finance</option>
            </select>
          </div>
        </div>

        {/* Saved Letters Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Serial Number</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Letter Title</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium italic">
                    No saved letters yet. Use the editor above and click "Save Record" to add copies.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          rec.company === 'charvik'
                            ? 'bg-blue-100 text-blue-800'
                            : rec.company === 'vyshnavi'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.company === 'charvik'
                          ? 'Charvik'
                          : rec.company === 'vyshnavi'
                          ? 'Vyshnavi'
                          : 'Chandrika'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {rec.serialNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{rec.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[240px] truncate">
                      {rec.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                      {rec.respectTo || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoadLetter(rec)}
                          className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="Load / Edit Letter"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadLetter(rec);
                            setTimeout(() => handlePrint(), 300);
                          }}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                          title="Print Letterhead"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(rec.id, rec.serialNumber)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                          title="Delete Letter"
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

      {/* ── LIVE LETTER PAD A4 PREVIEW (MATCHING VIDEO EXACT SHEET & FORMAT) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wide">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Official Letter Pad Live Preview (A4 Sheet)</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Print this Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex justify-center bg-slate-200/80 p-4 sm:p-8 rounded-3xl border border-slate-300">
          <div
            id="letterpad-official-preview-sheet"
            ref={printAreaRef}
            className="w-full max-w-[760px] min-h-[960px] bg-white rounded-lg shadow-2xl p-8 sm:p-12 flex flex-col justify-between border border-slate-300 text-slate-900"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <div>
              {/* Official Header */}
              <div
                className="text-center pb-3 mb-4 border-b-2"
                style={{ borderColor: currentConfig.themeColor }}
              >
                <div className="flex justify-center items-center mb-1">
                  <img
                    src={currentConfig.logo}
                    alt={currentConfig.name}
                    className="max-h-16 max-w-[260px] object-contain"
                  />
                </div>

                {/* Contact Strip */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-700 mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-600" />
                    <span>{currentConfig.phone}</span>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-600" />
                    <span>{currentConfig.email}</span>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-600" />
                    <span>{currentConfig.website}</span>
                  </span>
                </div>

                {/* Address Capsule */}
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-0.5 mt-1.5">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{currentConfig.address}</span>
                </div>
              </div>

              {/* Ref No & Date Strip */}
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-b border-slate-300 pb-2 mb-4">
                <span>
                  <strong className="text-slate-600">Ref No:</strong>{' '}
                  <span className="font-mono">{serialNumber}</span>
                </span>
                <span>
                  <strong className="text-slate-600">Date:</strong> {letterDate}
                </span>
              </div>

              {/* Recipient */}
              {respectTo.trim() && (
                <div className="text-xs sm:text-sm text-slate-900 mb-4 leading-snug">
                  <div className="font-bold">To,</div>
                  <div className="font-semibold whitespace-pre-line text-slate-800">{respectTo}</div>
                </div>
              )}

              {/* Title / Subject */}
              {letterTitle.trim() && (
                <div
                  className="text-xs sm:text-sm font-black underline mb-4"
                  style={{ color: currentConfig.themeColor }}
                >
                  <strong>Sub:</strong> {letterTitle}
                </div>
              )}

              {/* Matter */}
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[320px]">
                {letterMatter || (
                  <span className="text-slate-400 italic">
                    Type your letter message in the editor above. Content will render here in real-time.
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Signoff & Footer Bar */}
            <div className="pt-8">
              <div className="flex justify-between items-end pb-4">
                <div></div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Thanking You,
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    Yours Faithfully,
                  </div>
                  <div className="text-xs font-black text-slate-900 pt-1">
                    For {currentConfig.name}
                  </div>
                  <div className="h-12"></div>
                  <div className="text-xs font-bold text-slate-800 border-t border-slate-400 pt-1 inline-block min-w-[160px]">
                    Authorised Signatory
                  </div>
                </div>
              </div>

              {/* Decorative Brand Wave Strip Matching Video */}
              <div
                className="pt-2 border-t-4 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                style={{ borderColor: currentConfig.themeColor }}
              >
                <span>{currentConfig.footerText}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
