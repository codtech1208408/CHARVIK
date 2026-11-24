import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, User, Bus, ShieldCheck, IndianRupee, CheckCircle2, Clock,
  Calendar, Download, MapPin, Hash, AlertCircle, ChevronLeft, ChevronRight, Search,
  Users, ChevronDown, Filter, Wallet, ArrowRight, Receipt, Printer, X,
  Upload, Image as ImageIcon, Eye, FileText, Edit2, Trash2,
  MessageCircle, Copy, Phone, Send, Sparkles, Loader2, Share2
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/common/Toast";
import { PrintButton } from "../components/common/PrintButton";
import { printSheet } from "../utils/printSheet";
import { formatEmployeeId } from "../utils/employeeCode";
import { exportTableToExcel } from "../utils/exportToExcel";
import { Modal } from "../components/common/Modal";
import { getSavedCharvikCompanyDetails } from "../utils/charvikCompanyDetails";
import {
  generateSalaryStatementHtml,
  downloadSalaryStatementPdf,
  shareOrSendWhatsAppSalaryStatement,
  buildSalaryPdfFileName,
  parseTripDateToTime,
  type StatementPdfData
} from "../utils/statementPdf";

export interface PaymentSlipData {
  voucherNumber: string;
  employeeName: string;
  employeeCode: string;
  grossSalary: number;
  advanceAmount: number;
  balanceDue: number;
  date?: string;
  vehicleNumber?: string;
  route?: string;
}

export const generatePaymentSlipHtml = (data: PaymentSlipData, mode: 'bw' | 'colourful') => {
  const comp = getSavedCharvikCompanyDetails();
  const isColourful = mode === 'colourful';

  const borderColor = isColourful ? '#072346' : '#000000';
  const pillBorder = isColourful ? '#072346' : '#000000';
  const pillBg = isColourful ? 'linear-gradient(135deg, #072346, #0284c7)' : '#ffffff';
  const pillColor = isColourful ? '#ffffff' : '#000000';
  const logoFilter = isColourful ? 'none' : 'grayscale(100%) contrast(140%)';
  const headerDividerColor = isColourful ? '#0284c7' : '#000000';
  const sec1Bg = isColourful ? '#f8fafc' : '#ffffff';
  const sec1Text = isColourful ? '#072346' : '#000000';
  const grossColor = isColourful ? '#0f172a' : '#000000';
  const advanceColor = isColourful ? '#15803d' : '#000000';
  const balanceColor = isColourful ? '#be123c' : '#000000';

  return `
    <div
      id="charvik-printable-payment-slip"
      style="
        width: 100%;
        max-width: 680px;
        min-height: 940px;
        margin: 0 auto;
        background: #ffffff;
        color: #000000;
        border: 2px solid ${borderColor};
        border-radius: 12px;
        padding: 18px 22px 20px 22px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
      "
    >
      <div>
        <!-- Top Header: Logo on left, Contact Details on right -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px;">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <img
              src="/charvik-invoice-logo.png"
              alt="CHARVIK Staffing & Consultancy"
              style="height: 62px; max-height: 68px; width: auto; max-width: 280px; display: block; object-fit: contain; filter: ${logoFilter};"
              onerror="this.src='/logo-brand.png'"
            />
          </div>

          <div style="display: flex; align-items: center;">
            <div style="border-left: 1.5px solid ${headerDividerColor}; height: 42px; margin: 0 16px;"></div>
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
              <div style="display: block; font-size: 15px; font-weight: 900; color: ${isColourful ? '#072346' : '#000000'}; white-space: nowrap; margin-bottom: 2px;">
                <span style="font-size: 14px; margin-right: 6px; ${isColourful ? 'color: #ea580c;' : ''}">📞</span>
                <span>${comp.company_phone || '9505151527'}</span>
              </div>
              <div style="display: block; font-size: 12px; font-weight: 700; color: ${isColourful ? '#072346' : '#000000'}; white-space: nowrap;">
                <span style="font-size: 13px; margin-right: 6px; ${isColourful ? 'color: #0284c7;' : ''}">✉</span>
                <span>${comp.company_email || 'charvikstaffingconsultancy@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Horizontal Line Under Header -->
        <div style="border-bottom: 2px solid ${borderColor}; width: 100%; margin: 6px 0 14px 0;"></div>

        <!-- Centered Pill: PAYMENT SLIP -->
        <div style="display: flex; justify-content: center; align-items: center; margin: 0 0 14px 0;">
          <div
            style="
              background: ${pillBg};
              color: ${pillColor};
              border: 2px solid ${pillBorder};
              text-align: center;
              padding: 4px 38px;
              border-radius: 20px;
              font-weight: 900;
              font-size: 17px;
              letter-spacing: 0.12em;
              display: inline-block;
            "
          >
            PAYMENT SLIP
          </div>
        </div>

        <!-- Boxed Data Table (Section 1 and Section 2 matching reference image) -->
        <div
          style="
            border: 2px solid ${borderColor};
            border-radius: 10px;
            overflow: hidden;
            width: 100%;
            background: #ffffff;
            margin-top: 10px;
          "
        >
          <!-- Section 1: Trip & Employee Info -->
          <div style="background: ${sec1Bg};">
            <div style="display: flex; border-bottom: 1.5px solid ${borderColor};">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text};">
                Trip ID / Voucher
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: ${sec1Text};">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text}; font-family: monospace;">
                ${data.voucherNumber}
              </div>
            </div>

            <div style="display: flex; border-bottom: 1.5px solid ${borderColor};">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text};">
                Employee Name
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: ${sec1Text};">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text};">
                ${data.employeeName}
              </div>
            </div>

            <div style="display: flex;">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text};">
                Employee Code / ID
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: ${sec1Text};">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: ${sec1Text}; font-family: monospace;">
                ${data.employeeCode}
              </div>
            </div>
          </div>

          <!-- Section Divider (Double border separating Section 1 & Section 2) -->
          <div style="border-top: 3px double ${borderColor};"></div>

          <!-- Section 2: Salary Figures -->
          <div style="background: #ffffff;">
            <div style="display: flex; border-bottom: 1.5px solid ${borderColor};">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: #000000;">
                Gross Trip Salary
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: #000000;">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 15px; color: ${grossColor};">
                ₹${Number(data.grossSalary).toLocaleString('en-IN')}
              </div>
            </div>

            <div style="display: flex; border-bottom: 1.5px solid ${borderColor};">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: #000000;">
                Advance / Paid Amount
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: #000000;">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 15px; color: ${advanceColor};">
                ₹${Number(data.advanceAmount).toLocaleString('en-IN')}
              </div>
            </div>

            <div style="display: flex;">
              <div style="width: 44%; padding: 11px 16px; font-weight: 900; font-size: 14px; color: #000000;">
                Remaining Balance Due
              </div>
              <div style="width: 6%; padding: 11px 4px; font-weight: 900; font-size: 14px; text-align: center; color: #000000;">
                :
              </div>
              <div style="width: 50%; padding: 11px 16px; font-weight: 900; font-size: 15px; color: ${balanceColor};">
                ₹${Number(data.balanceDue).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Signatures -->
      <div>
        <!-- Three Signatures (Prepared By, Verified By, Received By) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 40px 0 16px 0;">
          <div style="text-align: center;">
            <div style="border-top: 1.5px solid #000000; width: 130px; margin: 0 auto 6px auto;"></div>
            <span style="font-size: 12px; font-weight: 900; color: #000000;">Prepared By</span>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1.5px solid #000000; width: 130px; margin: 0 auto 6px auto;"></div>
            <span style="font-size: 12px; font-weight: 900; color: #000000;">Verified By</span>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1.5px solid #000000; width: 130px; margin: 0 auto 6px auto;"></div>
            <span style="font-size: 12px; font-weight: 900; color: #000000;">Received By</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

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
  slot?: "driver1" | "driver2" | "helper" | "captain";
}

// Generate Trip Duty & Salary Ledger Printable HTML (Matching User's Reference Template)
export const generateTripDutySalaryLedgerHtml = (
  employee: { full_name: string; employee_code: string; role?: string },
  trips: TripEntry[],
  mode: 'bw' | 'colourful' = 'colourful'
) => {
  const comp = getSavedCharvikCompanyDetails();
  const isColourful = mode === 'colourful';
  const borderColor = isColourful ? '#004B9E' : '#000000';
  const pillBg = isColourful ? '#004B9E' : '#000000';
  const headerText = isColourful ? '#004B9E' : '#000000';
  const totalBg = isColourful ? '#dbeafe' : '#f1f5f9';
  const totalText = isColourful ? '#004B9E' : '#000000';
  const logoFilter = isColourful ? 'none' : 'grayscale(100%) contrast(140%)';

  const sortedTrips = [...trips].sort(
    (a, b) => parseTripDateToTime(a.date) - parseTripDateToTime(b.date)
  );

  const totalSal = sortedTrips.reduce((a, b) => a + (Number(b.salary) || 0), 0);
  const totalAdv = sortedTrips.reduce((a, b) => a + (Number(b.advance) || 0), 0);
  const totalDue = sortedTrips.reduce((a, b) => a + (Number(b.balance_due) || 0), 0);

  const empId = formatEmployeeId(employee.employee_code, employee.role || 'Driver');

  return `
    <div
      id="charvik-printable-trip-duty-salary-ledger"
      style="
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        color: #000000;
        border: 2px solid ${borderColor};
        border-radius: 14px;
        padding: 16px 20px 18px 20px;
        box-sizing: border-box;
        font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      "
    >
      <!-- Top Header: Logo on Left, Vertical Divider, Phone and Email on Right -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px;">
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
          <img
            src="/charvik-invoice-logo.png"
            alt="CHARVIK Staffing & Consultancy"
            style="height: 54px; max-height: 58px; width: auto; max-width: 280px; display: block; object-fit: contain; filter: ${logoFilter};"
            onerror="this.src='/logo-brand.png'"
          />
        </div>

        <div style="display: flex; align-items: center;">
          <div style="border-left: 1.5px solid ${borderColor}; height: 42px; margin: 0 16px;"></div>
          <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: ${headerText}; white-space: nowrap;">
              <span style="font-size: 15px; ${isColourful ? 'color: #004B9E;' : ''}">📞</span>
              <span>9505151527</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: ${headerText}; white-space: nowrap;">
              <span style="font-size: 13px; ${isColourful ? 'color: #004B9E;' : ''}">✉</span>
              <span>charvikstaffingconsulrancy@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Horizontal Divider -->
      <div style="border-bottom: 2.5px solid ${borderColor}; width: 100%; margin: 8px 0 16px 0;"></div>

      <!-- Subheader: Pill on Left, Driver Name & Employee ID Box on Right -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px;">
        <!-- Left: Pill Badge -->
        <div
          style="
            background: ${pillBg};
            color: #ffffff;
            padding: 8px 26px;
            border-radius: 9999px;
            font-weight: 900;
            font-size: 16px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            white-space: nowrap;
          "
        >
          TRIP DUTY &amp; SALARY LEDGER
        </div>

        <!-- Right: Outlined Details Box -->
        <div
          style="
            border: 1.5px solid ${borderColor};
            border-radius: 10px;
            padding: 6px 14px;
            min-width: 270px;
            background: #ffffff;
            font-size: 13px;
            font-weight: 800;
            color: #000000;
            display: flex;
            flex-direction: column;
            gap: 5px;
          "
        >
          <div style="display: flex; align-items: flex-end;">
            <span style="white-space: nowrap; font-weight: 900;">Driver Name :</span>
            <span style="flex: 1; border-bottom: 1.5px solid #000000; margin-left: 6px; padding-left: 6px; font-weight: 900; line-height: 1.2;">
              ${employee.full_name}
            </span>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <span style="white-space: nowrap; font-weight: 900;">Employee ID :</span>
            <span style="flex: 1; border-bottom: 1.5px solid #000000; margin-left: 6px; padding-left: 6px; font-weight: 900; font-family: monospace; line-height: 1.2;">
              ${empId}
            </span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <table
        style="
          width: 100%;
          border-collapse: collapse;
          border: 2px solid ${borderColor};
          margin-bottom: 16px;
          font-size: 12px;
        "
      >
        <thead>
          <tr style="background: ${pillBg}; color: #ffffff; font-weight: 900; text-transform: uppercase; font-size: 11px;">
            <th style="padding: 8px 4px; text-align: center; width: 5%; border-right: 1.5px solid #ffffff;">#</th>
            <th style="padding: 8px 6px; text-align: center; width: 14%; border-right: 1.5px solid #ffffff;">DATE</th>
            <th style="padding: 8px 8px; text-align: center; width: 24%; border-right: 1.5px solid #ffffff;">TASK / ROUTE</th>
            <th style="padding: 8px 6px; text-align: center; width: 16%; border-right: 1.5px solid #ffffff;">VEHICLE NO</th>
            <th style="padding: 8px 6px; text-align: center; width: 13%; border-right: 1.5px solid #ffffff;">SALARY</th>
            <th style="padding: 8px 6px; text-align: center; width: 13%; border-right: 1.5px solid #ffffff;">PAID AMOUNT</th>
            <th style="padding: 8px 6px; text-align: center; width: 15%; border-right: 1.5px solid #ffffff;">REMAINING DUE</th>
            <th style="padding: 8px 6px; text-align: center; width: 12%;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${sortedTrips.map((t, idx) => {
            const formattedDate = (() => {
              if (!t.date) return "-";
              const parts = t.date.split("-");
              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;
            })();
            const isPaid = t.isPaid;
            const statusColor = isPaid
              ? (isColourful ? '#16a34a' : '#000000')
              : (isColourful ? '#dc2626' : '#000000');
            const statusText = isPaid ? 'PAID' : 'PENDING';

            return `
              <tr style="border-bottom: 1.5px solid ${borderColor};">
                <td style="padding: 7px 4px; text-align: center; font-weight: 800; border-right: 1.5px solid ${borderColor};">${idx + 1}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 800; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">${formattedDate}</td>
                <td style="padding: 7px 8px; text-align: center; font-weight: 800; border-right: 1.5px solid ${borderColor};">${t.route_corridor || '-'}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 800; font-family: monospace; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">${t.vehicle_number || '-'}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 900; font-family: monospace; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">₹${(Number(t.salary) || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 900; font-family: monospace; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">₹${(Number(t.advance) || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 900; font-family: monospace; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">₹${(Number(t.balance_due) || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 7px 6px; text-align: center; font-weight: 900; color: ${statusColor}; border-right: none;">${statusText}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: ${totalBg}; font-weight: 900; font-size: 13px; border-top: 2px solid ${borderColor};">
            <td colspan="4" style="padding: 8px 12px; text-align: center; font-weight: 900; color: ${totalText}; text-transform: uppercase; border-right: 1.5px solid ${borderColor};">
              TOTAL (${sortedTrips.length} TRIPS)
            </td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 900; font-family: monospace; color: ${totalText}; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">
              ₹${totalSal.toLocaleString('en-IN')}
            </td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 900; font-family: monospace; color: ${totalText}; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">
              ₹${totalAdv.toLocaleString('en-IN')}
            </td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 900; font-family: monospace; color: ${totalText}; border-right: 1.5px solid ${borderColor}; white-space: nowrap;">
              ₹${totalDue.toLocaleString('en-IN')}
            </td>
            <td style="padding: 8px 6px; background: ${totalBg};"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

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
  const location = useLocation();
  const { user } = useAuth();

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

  // Payment Slip Preview & Print Modal State (Matching User's Reference Template)
  const [printingSlipData, setPrintingSlipData] = useState<PaymentSlipData | null>(null);
  const [slipFormat, setSlipFormat] = useState<'bw' | 'colourful'>('bw');

  const executePrintPaymentSlip = (data: PaymentSlipData, mode: 'bw' | 'colourful') => {
    const slipHtml = generatePaymentSlipHtml(data, mode);
    let iframe = document.getElementById("charvik-payment-slip-frame") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "charvik-payment-slip-frame";
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "1024px";
      iframe.style.height = "1440px";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.voucherNumber || 'Payment Slip'} - Charvik</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            #charvik-printable-payment-slip {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${slipHtml}
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print payment slip error:", e);
        }
      }, 350);
    };

    const imgs = doc.getElementsByTagName("img");
    if (imgs.length === 0) {
      triggerPrint();
    } else {
      let loaded = 0;
      const total = imgs.length;
      let fired = false;
      const done = () => {
        if (fired) return;
        fired = true;
        triggerPrint();
      };
      for (let i = 0; i < total; i++) {
        if (imgs[i].complete) {
          loaded++;
        } else {
          imgs[i].onload = () => {
            loaded++;
            if (loaded >= total) done();
          };
          imgs[i].onerror = () => {
            loaded++;
            if (loaded >= total) done();
          };
        }
      }
      if (loaded >= total) done();
      setTimeout(done, 1500);
    }
  };

  // Isolated Print for Trip Duty & Salary Ledger
  const executePrintTripLedger = (
    employee: { full_name: string; employee_code: string; role?: string },
    trips: TripEntry[],
    mode: 'bw' | 'colourful'
  ) => {
    const ledgerHtml = generateTripDutySalaryLedgerHtml(employee, trips, mode);
    let iframe = document.getElementById("charvik-trip-ledger-frame") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "charvik-trip-ledger-frame";
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "1024px";
      iframe.style.height = "1440px";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${employee.full_name} - Trip Duty & Salary Ledger</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            #charvik-printable-trip-duty-salary-ledger {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${ledgerHtml}
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print Trip Ledger error:", e);
        }
      }, 350);
    };

    const imgs = doc.getElementsByTagName("img");
    if (imgs.length === 0) {
      triggerPrint();
    } else {
      let loaded = 0;
      const total = imgs.length;
      let fired = false;
      const done = () => {
        if (fired) return;
        fired = true;
        triggerPrint();
      };
      for (let i = 0; i < total; i++) {
        if (imgs[i].complete) {
          loaded++;
        } else {
          imgs[i].onload = () => {
            loaded++;
            if (loaded >= total) done();
          };
          imgs[i].onerror = () => {
            loaded++;
            if (loaded >= total) done();
          };
        }
      }
      if (loaded >= total) done();
      setTimeout(done, 1500);
    }
  };

  // Edit / Delete Trip Modals
  const [editingTrip, setEditingTrip] = useState<{
    trip: TripEntry;
    date: string;
    route_corridor: string;
    vehicle_number: string;
    salary: string;
    advance: string;
  } | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<TripEntry | null>(null);

  // Edit / Delete Payment Modals
  const [editingPayment, setEditingPayment] = useState<{
    id: string;
    employee_name: string;
    employee_code: string;
    role: string;
    amount: string;
    payment_date: string;
    payment_type: "Bata" | "Salary" | "Advance";
    payment_mode: "Cash" | "Online" | "UPI" | "Bank Transfer";
    payment_proof?: string;
    notes?: string;
  } | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<RecordedPayment | null>(null);

  // WhatsApp Monthly Auto-Dispatch States
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetEmployee, setWhatsAppTargetEmployee] = useState<EmployeePaymentRecord | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [whatsAppMonth, setWhatsAppMonth] = useState("");
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [dispatchesMap, setDispatchesMap] = useState<Record<string, { sent_at: string; phone: string; amount: number }>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewTab, setPdfPreviewTab] = useState<"pdf" | "text">("pdf");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("charvik_employee_monthly_whatsapp_dispatches");
      if (raw) setDispatchesMap(JSON.parse(raw));
    } catch {}
  }, []);

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
      const slots: { data: any; defaultRole: "Driver" | "Helper" | "Captain"; slotKey: "driver1" | "driver2" | "helper" | "captain" }[] = [
        { data: t.driver1, defaultRole: "Driver", slotKey: "driver1" },
        { data: t.driver2, defaultRole: "Driver", slotKey: "driver2" },
        { data: t.helper, defaultRole: "Helper", slotKey: "helper" },
        { data: t.captain, defaultRole: "Captain", slotKey: "captain" }
      ];

      slots.forEach(({ data, defaultRole, slotKey }) => {
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
          isPaid: isTripPaid,
          slot: slotKey
        });
      });
    });

    const list = Array.from(map.values());
    list.forEach((r) =>
      r.trips.sort((a, b) => parseTripDateToTime(a.date) - parseTripDateToTime(b.date))
    );
    return list;
  }, [employees, periodFilteredTasks]);

  // Profile View Staff & Category Switcher State (Separate Category & Employee with Search & Select)
  const [profileCategorySearch, setProfileCategorySearch] = useState("");
  const [profileSelectedCategory, setProfileSelectedCategory] = useState("All");
  const [profileEmployeeSearch, setProfileEmployeeSearch] = useState("");

  const distinctEmployeeCategories = useMemo(() => {
    const set = new Set<string>();
    allEmployeeRecords.forEach((x) => {
      if (x.role && x.role.trim()) set.add(x.role.trim());
    });
    return Array.from(set).sort();
  }, [allEmployeeRecords]);

  const filteredCategoryOptions = useMemo(() => {
    if (!profileCategorySearch.trim()) return distinctEmployeeCategories;
    const q = profileCategorySearch.toLowerCase();
    return distinctEmployeeCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [distinctEmployeeCategories, profileCategorySearch]);

  const filteredProfileEmployees = useMemo(() => {
    return allEmployeeRecords.filter((x) => {
      const matchesCat =
        profileSelectedCategory === "All" ||
        (x.role && x.role.trim().toLowerCase() === profileSelectedCategory.toLowerCase());
      if (!matchesCat) return false;

      if (!profileEmployeeSearch.trim()) return true;
      const q = profileEmployeeSearch.toLowerCase();
      const name = (x.full_name || "").toLowerCase();
      const code = (x.employee_code || "").toLowerCase();
      const phone = (x.phone || "").toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [allEmployeeRecords, profileSelectedCategory, profileEmployeeSearch]);

  // Selected employee for detailed ledger
  const selectedEmployeeRecord = useMemo((): EmployeePaymentRecord | null => {
    if (allEmployeeRecords.length === 0) return null;
    if (searchParams.get("view") === "all") return null;
    if (!empName && !empCode) return null;
    const nameKey = empName.trim().toLowerCase();
    const codeKey = empCode.trim().toLowerCase();

    return (
      allEmployeeRecords.find((r) => {
        if (codeKey && r.employee_code && r.employee_code.toLowerCase() === codeKey) return true;
        if (nameKey && r.full_name.toLowerCase() === nameKey) return true;
        return false;
      }) || null
    );
  }, [allEmployeeRecords, empName, empCode, searchParams]);

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
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');
    let effectiveStaff = targetStaff;
    if (!effectiveStaff) {
      if (!isUserAdmin) {
        error("Please select an employee.");
        return;
      }
      effectiveStaff = allStaffList[0];
      setTargetStaff(effectiveStaff);
    }
    if (!effectiveStaff) return;

    let payAmount = Number(paymentFormData.amount);
    if (!payAmount || payAmount <= 0) {
      if (!isUserAdmin) {
        error("Please enter a valid payment amount greater than ₹0.");
        return;
      }
      payAmount = 0;
    }

    // 1. Sort employee's tasks by oldest first (trip_start_date ASC)
    const staffName = effectiveStaff.full_name.trim().toLowerCase();
    const staffCode = effectiveStaff.employee_code.trim().toLowerCase();

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
      const slipData: PaymentSlipData = {
        voucherNumber: receiptNo,
        employeeName: `${targetStaff.full_name} (${targetStaff.role})`,
        employeeCode: formatEmployeeId(targetStaff.employee_code, targetStaff.role),
        grossSalary: payAmount,
        advanceAmount: paymentFormData.payment_type === 'Advance' ? payAmount : 0,
        balanceDue: 0,
        date: paymentFormData.date
      };
      setPrintingSlipData(slipData);
      setSlipFormat('bw');
      executePrintPaymentSlip(slipData, 'bw');
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
      t.route_corridor,
      Number(t.salary) || 0,
      Number(t.advance) || 0,
      Number(t.balance_due) || 0,
      t.isPaid ? "Settled" : "Pending"
    ]);

    exportTableToExcel({
      title: `Employee Payment Ledger - ${selectedEmployeeRecord.full_name}`,
      subtitle: `Role: ${selectedEmployeeRecord.role} • ID: ${formatEmployeeId(selectedEmployeeRecord.employee_code, selectedEmployeeRecord.role)} • Period: ${period}`,
      filename: `${selectedEmployeeRecord.full_name}_Payment_Ledger_${period}`,
      headers,
      rows
    });
    success(`Exported payment ledger for ${selectedEmployeeRecord.full_name} to Excel!`);
  };

  // Export Excel for all employees directory
  const handleExportAllCSV = () => {
    if (filteredEmployees.length === 0) {
      error("No employee records to export.");
      return;
    }
    const headers = [
      "S.No",
      "Employee Name",
      "Employee ID",
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
      e.full_name,
      formatEmployeeId(e.employee_code, e.role),
      e.role,
      e.phone || "-",
      e.tasksHandled,
      Number(e.salaryEarned) || 0,
      Number(e.advancePaid) || 0,
      Number(e.pendingDue) || 0,
      e.pendingDue === 0 ? "Settled" : "Pending Due"
    ]);

    exportTableToExcel({
      title: "All Employee Payments & Settlement Ledger",
      subtitle: `Period: ${period} • Total Employees: ${filteredEmployees.length}`,
      filename: `All_Employee_Payments_${period}`,
      headers,
      rows
    });
    success(`Exported all employee payments ledger to Excel!`);
  };

  const handleSelectEmployee = (record: EmployeePaymentRecord | null) => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("All");
    setActiveLedgerTab("trips");
    if (!record) {
      handleClearSelection();
      return;
    }
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

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleString("en-IN", { month: "long", year: "numeric" });
  }, []);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return now.toISOString().substring(0, 7);
  }, []);

  const sanitizeWhatsAppPhone = (phoneStr: string): string => {
    const digits = (phoneStr || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    return digits;
  };

  const generateWhatsAppMonthlyStatement = (
    employee: EmployeePaymentRecord,
    tripsList: TripEntry[],
    paymentsList: RecordedPayment[],
    monthLabel: string,
    staffPhone: string
  ) => {
    // Sort in sequential chronological order (oldest duty to newest duty)
    const sortedTrips = [...tripsList].sort(
      (a, b) => parseTripDateToTime(a.date) - parseTripDateToTime(b.date)
    );
    const sortedPayments = [...paymentsList].sort(
      (a, b) => parseTripDateToTime(a.payment_date) - parseTripDateToTime(b.payment_date)
    );

    const totalSal = sortedTrips.reduce((a, b) => a + (b.salary || 0), 0);
    const totalPaid = sortedTrips.reduce((a, b) => a + (b.advance || 0), 0);
    const totalDue = sortedTrips.reduce((a, b) => a + (b.balance_due || 0), 0);

    const formattedTrips =
      sortedTrips.length > 0
        ? sortedTrips
            .map((t, idx) => {
              const d = t.date
                ? t.date.includes("-")
                  ? t.date.split("-").reverse().join("/")
                  : t.date
                : "-";
              return `${idx + 1}. *${d}* | *${t.route_corridor}*\n   🚌 Bus: *${t.vehicle_number}*\n   💵 Salary: ₹${t.salary.toLocaleString("en-IN")} | Paid: ₹${t.advance.toLocaleString("en-IN")} | Due: ₹${t.balance_due.toLocaleString("en-IN")}`;
            })
            .join("\n\n")
        : "(No trip duties recorded for this period)";

    const formattedPayments =
      sortedPayments.length > 0
        ? sortedPayments
            .map((p, idx) => {
              const pd = p.payment_date
                ? p.payment_date.includes("-")
                  ? p.payment_date.split("-").reverse().join("/")
                  : p.payment_date
                : "-";
              return `${idx + 1}. *${pd}:* ₹${Number(p.amount).toLocaleString("en-IN")} (${p.payment_mode} - ${p.payment_type})${p.notes ? ` - ${p.notes}` : ""}`;
            })
            .join("\n")
        : "(No direct disbursement records logged for this period)";

    const statusText = totalDue <= 0 ? "✅ FULLY SETTLED / PAID" : "⏳ PENDING PAYMENT";

    return `🌟 *CHARVIK STAFFING CONSULTANCY* 🌟
📋 *MONTHLY SALARY & TRIP SETTLEMENT STATEMENT*
════════════════════════════
👤 *Staff Name:* ${employee.full_name}
🆔 *Employee ID:* ${formatEmployeeId(employee.employee_code, employee.role)}
💼 *Role:* ${employee.role}
📅 *Billing Period:* ${monthLabel}
📱 *Staff Phone:* ${staffPhone || "-"}
════════════════════════════
💰 *PAYMENT & SALARY SUMMARY:*
• *Total Salary Earned:* ₹${totalSal.toLocaleString("en-IN")}
• *Total Paid / Advance:* ₹${totalPaid.toLocaleString("en-IN")}
• *Net Remaining Due:* ₹${totalDue.toLocaleString("en-IN")}
• *Payment Status:* ${statusText}
════════════════════════════
🚌 *RECORDS OF TRIPS (${tripsList.length} Trips):*
${formattedTrips}
════════════════════════════
💳 *RECORDS OF PAYMENTS (${paymentsList.length} Payments):*
${formattedPayments}
════════════════════════════
🏢 *CHARVIK STAFFING CONSULTANCY*
📍 Hyderabad, Telangana
📞 Helpline: +91 9505151527
📧 charvikstaffingconsultancy@gmail.com
🌐 www.charvikstaffing.com
════════════════════════════
_This is an official automated monthly salary & trip record statement._`;
  };

  const generateWhatsAppTripSlip = (
    employee: EmployeePaymentRecord,
    trip: TripEntry
  ) => {
    const d = trip.date
      ? trip.date.includes("-")
        ? trip.date.split("-").reverse().join("/")
        : trip.date
      : "-";
    return `🌟 *CHARVIK STAFFING CONSULTANCY* 🌟
🎫 *OFFICIAL TRIP DUTY & SALARY SLIP*
════════════════════════════
👤 *Staff Name:* ${employee.full_name}
🆔 *Staff ID:* ${formatEmployeeId(employee.employee_code, employee.role)} (${employee.role})
📅 *Trip Date:* ${d}
🚌 *Vehicle No:* ${trip.vehicle_number}
🛣️ *Route:* ${trip.route_corridor}
════════════════════════════
💰 *TRIP SALARY DETAILS:*
• *Trip Salary:* ₹${trip.salary.toLocaleString("en-IN")}
• *Advance / Paid:* ₹${trip.advance.toLocaleString("en-IN")}
• *Balance Due:* ₹${trip.balance_due.toLocaleString("en-IN")}
• *Trip Status:* ${trip.isPaid ? "✅ PAID" : "⏳ PENDING PAYMENT"}
════════════════════════════
📞 Helpline: +91 9505151527 | Charvik Staffing Consultancy`;
  };

  const handleOpenWhatsAppModal = (emp?: EmployeePaymentRecord | null) => {
    const target = emp || r;
    if (!target) return;
    setWhatsAppTargetEmployee(target);
    const targetRawEmp = employees.find(
      (e) =>
        e.id === target.id ||
        (e.employee_code && e.employee_code === target.employee_code) ||
        (e.full_name && e.full_name.toLowerCase() === target.full_name.toLowerCase())
    );
    const phone = targetRawEmp?.phone || targetRawEmp?.phone_number || targetRawEmp?.mobile || target.phone || "";
    setWhatsAppPhone(phone);
    setWhatsAppMonth(currentMonthLabel);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendTripWhatsApp = (trip: TripEntry) => {
    if (!r) return;
    const phone = rawEmp?.phone || rawEmp?.phone_number || rawEmp?.mobile || r.phone || "";
    const clean = phone.replace(/\D/g, "");
    const finalPhone = clean.length === 10 ? `91${clean}` : clean.startsWith("0") ? `91${clean.slice(1)}` : clean;
    const msg = generateWhatsAppTripSlip(r, trip);
    const url = finalPhone
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    success(`Opening WhatsApp with Trip Slip for ${r.full_name}!`);
  };

  const getPdfDataForTarget = (
    emp: EmployeePaymentRecord,
    phoneStr: string,
    monthStr: string
  ): StatementPdfData => {
    const rawTarget = employees.find(
      (e) =>
        e.id === emp.id ||
        (e.employee_code && e.employee_code === emp.employee_code) ||
        (e.full_name && e.full_name.toLowerCase() === emp.full_name.toLowerCase())
    );
    const staffPayments = paymentHistory.filter(
      (p) =>
        (p.employee_code && p.employee_code.toLowerCase() === (emp.employee_code || "").toLowerCase()) ||
        (p.employee_name && p.employee_name.toLowerCase() === emp.full_name.toLowerCase())
    );
    return {
      employee: {
        full_name: emp.full_name,
        employee_code: emp.employee_code,
        role: emp.role,
        phone: phoneStr || emp.phone,
        salaryEarned: emp.salaryEarned,
        pendingDue: emp.pendingDue,
        advancePaid: emp.advancePaid,
        branch: rawTarget?.branch || rawEmp?.branch
      },
      trips: emp.trips || [],
      payments: staffPayments,
      monthLabel: monthStr || currentMonthLabel,
      staffPhone: phoneStr
    };
  };

  const handleConfirmSendMonthlyWhatsApp = async () => {
    if (!whatsAppTargetEmployee) return;
    const clean = whatsAppPhone.replace(/\D/g, "");
    if (!clean) {
      error("Please enter a valid WhatsApp mobile number for this employee.");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const pdfData = getPdfDataForTarget(
        whatsAppTargetEmployee,
        whatsAppPhone,
        whatsAppMonth || currentMonthLabel
      );

      const result = await shareOrSendWhatsAppSalaryStatement({
        data: pdfData,
        targetPhone: whatsAppPhone
      });

      const empKey = (whatsAppTargetEmployee.employee_code || whatsAppTargetEmployee.full_name).trim().toLowerCase();
      const updated = {
        ...dispatchesMap,
        [`${empKey}_${currentMonthKey}`]: {
          sent_at: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          }),
          phone: whatsAppPhone,
          amount: whatsAppTargetEmployee.pendingDue
        }
      };
      setDispatchesMap(updated);
      try {
        localStorage.setItem("charvik_employee_monthly_whatsapp_dispatches", JSON.stringify(updated));
      } catch {}

      if (result.method === "native-share") {
        success(`Monthly Salary Statement PDF dispatched directly to WhatsApp for ${whatsAppTargetEmployee.full_name}!`);
      } else {
        success(`Official PDF Statement downloaded (${result.fileName}) & WhatsApp opened!`);
      }
      setIsWhatsAppModalOpen(false);
    } catch (err: any) {
      console.error("PDF WhatsApp dispatch error:", err);
      error("Failed to generate PDF statement: " + (err?.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDirectDownloadPdf = async () => {
    if (!whatsAppTargetEmployee) return;
    try {
      setIsGeneratingPdf(true);
      const pdfData = getPdfDataForTarget(
        whatsAppTargetEmployee,
        whatsAppPhone,
        whatsAppMonth || currentMonthLabel
      );
      const fileName = await downloadSalaryStatementPdf(pdfData);
      success(`Official statement PDF downloaded: ${fileName}`);
    } catch (err: any) {
      console.error("Direct download PDF error:", err);
      error("Failed to generate PDF: " + (err?.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintStatementSheet = () => {
    if (!whatsAppTargetEmployee) return;
    const pdfData = getPdfDataForTarget(
      whatsAppTargetEmployee,
      whatsAppPhone,
      whatsAppMonth || currentMonthLabel
    );
    printSheet({
      title: `${whatsAppTargetEmployee.full_name} - Monthly Salary Statement`,
      subtitle: `Official Statement | Cycle: ${whatsAppMonth || currentMonthLabel}`,
      orientation: "portrait",
      hideMetaBar: true,
      hideHeader: true,
      htmlContent: generateSalaryStatementHtml(pdfData)
    });
  };

  const handleCopyWhatsAppMessage = () => {
    if (!whatsAppTargetEmployee) return;
    const staffPayments = paymentHistory.filter(
      (p) =>
        (p.employee_code && p.employee_code.toLowerCase() === (whatsAppTargetEmployee.employee_code || "").toLowerCase()) ||
        (p.employee_name && p.employee_name.toLowerCase() === whatsAppTargetEmployee.full_name.toLowerCase())
    );
    const msg = generateWhatsAppMonthlyStatement(
      whatsAppTargetEmployee,
      whatsAppTargetEmployee.trips || [],
      staffPayments,
      whatsAppMonth || currentMonthLabel,
      whatsAppPhone
    );
    navigator.clipboard.writeText(msg);
    success("Statement text copied to clipboard!");
  };

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
      subtitle: `Official Employee Record | ID: ${formatEmployeeId(r.employee_code, r.role)} | Role: ${r.role}`,
      orientation: "portrait",
      hideMetaBar: true,
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
              <p style="margin: 4px 0 0; font-size: 11px; font-family: monospace; color: #94a3b8;">${formatEmployeeId(r.employee_code, r.role)}</p>
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

  const handlePrintOverallPayments = () => {
    if (allEmployeeRecords.length === 0) {
      error("No employee payment records found to print");
      return;
    }

    // Filter employees who have activity or payments, or all registered staff
    const paidEmployees = allEmployeeRecords.filter(
      (e) => e.salaryEarned > 0 || e.advancePaid > 0 || e.settledTotal > 0 || e.tasksHandled > 0
    );
    const listToPrint = paidEmployees.length > 0 ? paidEmployees : allEmployeeRecords;

    const totalSalary = listToPrint.reduce((acc, e) => acc + (e.salaryEarned || 0), 0);
    const totalPaid = listToPrint.reduce((acc, e) => acc + (e.advancePaid || e.settledTotal || 0), 0);
    const totalRemaining = listToPrint.reduce((acc, e) => acc + (e.pendingDue || 0), 0);

    const rowsHtml = listToPrint
      .map((e, idx) => {
        const paidAmount = e.advancePaid || e.settledTotal || 0;
        const dueAmount = e.pendingDue || 0;
        const isPaidInFull = dueAmount === 0 && paidAmount > 0;
        const statusText = isPaidInFull
          ? "PAID (100%)"
          : paidAmount > 0
          ? "PARTIAL"
          : dueAmount > 0
          ? "PENDING"
          : "NIL";
        const statusColor = isPaidInFull ? "#047857" : paidAmount > 0 ? "#1d4ed8" : "#b45309";
        const statusBg = isPaidInFull ? "#ecfdf5" : paidAmount > 0 ? "#eff6ff" : "#fffbeb";

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 9px 8px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
            <td style="padding: 9px 10px; font-weight: bold; color: #0f172a;">
              <div style="font-size: 12px;">${e.full_name}</div>
              <div style="font-size: 9px; color: #94a3b8; font-family: monospace;">ID: ${formatEmployeeId(e.employee_code, e.role)}</div>
            </td>
            <td style="padding: 9px 10px;">
              <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; border: 1px solid #cbd5e1;">
                ${e.role}
              </span>
            </td>
            <td style="padding: 9px 10px; color: #475569; font-family: monospace;">${e.phone || "-"}</td>
            <td style="padding: 9px 8px; text-align: center; font-weight: bold; color: #1e293b;">${e.tasksHandled}</td>
            <td style="padding: 9px 10px; text-align: right; font-weight: 800; color: #0f172a; font-family: monospace; font-size: 13px; white-space: nowrap;">
              ₹${e.salaryEarned.toLocaleString("en-IN")}
            </td>
            <td style="padding: 9px 10px; text-align: right; font-weight: 800; color: #047857; font-family: monospace; background: #f0fdf4; font-size: 13px; white-space: nowrap;">
              ₹${paidAmount.toLocaleString("en-IN")}
            </td>
            <td style="padding: 9px 10px; text-align: right; font-weight: 900; color: ${dueAmount > 0 ? "#e11d48" : "#64748b"}; font-family: monospace; background: ${dueAmount > 0 ? "#fff1f2" : "transparent"}; font-size: 13px; white-space: nowrap;">
              ₹${dueAmount.toLocaleString("en-IN")}
            </td>
            <td style="padding: 9px 8px; text-align: center;">
              <span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; border: 1px solid ${statusColor}40; display: inline-block;">
                ${statusText}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");

    const grandTotalRow = `
      <tr style="background: #142B4A; color: #ffffff; font-weight: 900; font-size: 12px;">
        <td colspan="4" style="padding: 10px 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          GRAND TOTAL (${listToPrint.length} EMPLOYEES)
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 900;">
          ${listToPrint.reduce((acc, e) => acc + e.tasksHandled, 0)} trips
        </td>
        <td style="padding: 10px 10px; text-align: right; font-family: monospace; font-size: 13.5px; font-weight: 900; white-space: nowrap;">
          ₹${totalSalary.toLocaleString("en-IN")}
        </td>
        <td style="padding: 10px 10px; text-align: right; font-family: monospace; color: #4ade80; font-size: 13.5px; font-weight: 900; white-space: nowrap;">
          ₹${totalPaid.toLocaleString("en-IN")}
        </td>
        <td style="padding: 10px 10px; text-align: right; font-family: monospace; color: #fca5a5; font-size: 13.5px; font-weight: 900; white-space: nowrap;">
          ₹${totalRemaining.toLocaleString("en-IN")}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 900;">
          ${totalRemaining === 0 ? "ALL SETTLED" : "DUES PENDING"}
        </td>
      </tr>
    `;

    printSheet({
      title: "All Employees Payment & Salary Statement",
      subtitle: `Overall Fleet Crew Disbursements & Outstanding Dues Summary | Total Staff: ${listToPrint.length}`,
      orientation: "landscape",
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 4px; color: #0f172a;">
          <div style="border-bottom: 2px solid #142B4A; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #142B4A; text-transform: uppercase;">
                Overall Employee Payments &amp; Disbursed Salary Statement
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Fleet Operations Staff Payout Ledger • Verified Accounts Copy
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #475569;">
              <div><strong>Staff Covered:</strong> ${listToPrint.length} of ${allEmployeeRecords.length} registered</div>
            </div>
          </div>

          <div style="display: flex; gap: 14px; margin-bottom: 16px;">
            <div style="flex: 1; padding: 10px 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
              <div style="font-size: 10.5px; font-weight: bold; color: #475569; text-transform: uppercase;">Total Salary Earned</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 3px; font-family: monospace;">₹${totalSalary.toLocaleString("en-IN")}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Total task remuneration obligation</div>
            </div>
            <div style="flex: 1; padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px;">
              <div style="font-size: 10.5px; font-weight: bold; color: #15803d; text-transform: uppercase;">Total Amount Paid</div>
              <div style="font-size: 18px; font-weight: 900; color: #166534; margin-top: 3px; font-family: monospace;">₹${totalPaid.toLocaleString("en-IN")}</div>
              <div style="font-size: 10px; color: #15803d; margin-top: 2px;">Disbursed via Bata, Advance & Settlements</div>
            </div>
            <div style="flex: 1; padding: 10px 14px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 8px;">
              <div style="font-size: 10.5px; font-weight: bold; color: #be123c; text-transform: uppercase;">Total Remaining Balance Due</div>
              <div style="font-size: 18px; font-weight: 900; color: #9f1239; margin-top: 3px; font-family: monospace;">₹${totalRemaining.toLocaleString("en-IN")}</div>
              <div style="font-size: 10px; color: #be123c; margin-top: 2px;">Outstanding unpaid crew balance</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #334155; font-weight: 800;">
                <th style="padding: 8px 6px; text-align: center; width: 40px;">S.No</th>
                <th style="padding: 8px 10px; text-align: left;">Employee Name & ID</th>
                <th style="padding: 8px 10px; text-align: left; width: 90px;">Role</th>
                <th style="padding: 8px 10px; text-align: left; width: 110px;">Phone</th>
                <th style="padding: 8px 8px; text-align: center; width: 60px;">Trips</th>
                <th style="padding: 8px 10px; text-align: right; width: 120px;">Salary Earned</th>
                <th style="padding: 8px 10px; text-align: right; width: 120px;">Paid Amount</th>
                <th style="padding: 8px 10px; text-align: right; width: 120px;">Remaining Due</th>
                <th style="padding: 8px 8px; text-align: center; width: 90px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              ${grandTotalRow}
            </tfoot>
          </table>

          <div style="margin-top: 36px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #475569;">
            <div style="text-align: center; width: 180px;">
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: bold;">Prepared by (Operations)</div>
            </div>
            <div style="text-align: center; width: 180px;">
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: bold;">Accounts / Finance Officer</div>
            </div>
            <div style="text-align: center; width: 180px;">
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: bold;">Authorized Signatory</div>
            </div>
          </div>
        </div>
      `
    });
  };

  // 1. Print Individual Payment Receipt / Slip
  const handlePrintReceipt = (payment: RecordedPayment) => {
    const slipData: PaymentSlipData = {
      voucherNumber: payment.id,
      employeeName: payment.employee_name,
      employeeCode: payment.employee_code,
      grossSalary: payment.amount,
      advanceAmount: payment.payment_type === 'Advance' ? payment.amount : 0,
      balanceDue: 0,
      date: payment.payment_date || (payment as any).date
    };
    setPrintingSlipData(slipData);
    setSlipFormat('bw');
  };

  // 2. Print Single Trip Duty & Remuneration Slip
  const handlePrintTripSlip = (trip: TripEntry) => {
    if (!r) return;
    const slipData: PaymentSlipData = {
      voucherNumber: `#${trip.id}`,
      employeeName: `${r.full_name} (${r.role})`,
      employeeCode: formatEmployeeId(r.employee_code, r.role),
      grossSalary: trip.salary,
      advanceAmount: trip.advance,
      balanceDue: trip.balance_due,
      date: trip.date,
      vehicleNumber: trip.vehicle_number,
      route: trip.route_corridor
    };
    setPrintingSlipData(slipData);
    setSlipFormat('bw');
  };

  // 3. Print Complete Trip Ledger for this Employee (Matching User's Reference Template)
  const handlePrintTripLedger = (mode: 'bw' | 'colourful' = 'bw') => {
    if (!r || filteredTrips.length === 0) {
      error("No trips available to print for this employee.");
      return;
    }
    executePrintTripLedger(r, filteredTrips, mode);
  };

  // 4. Save Trip Edit
  const handleSaveTripEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    const taskToUpdate = tasks.find((t) => t.id === editingTrip.trip.id);
    if (!taskToUpdate) {
      error("Task record not found");
      return;
    }

    const slotKey = editingTrip.trip.slot || "driver1";
    const slotData = taskToUpdate[slotKey] || {};

    const newSalary = Number(editingTrip.salary) || 0;
    const newAdvance = Number(editingTrip.advance) || 0;
    const newDue = Math.max(0, newSalary - newAdvance);

    const updatedTask = {
      ...taskToUpdate,
      trip_start_date: editingTrip.date,
      route_corridor: editingTrip.route_corridor,
      vehicle_number: editingTrip.vehicle_number,
      [slotKey]: {
        ...slotData,
        salary_amount: newSalary,
        advance_amount: newAdvance,
        balance_due: newDue
      }
    };

    if (newAdvance >= newSalary && newSalary > 0) {
      updatedTask.payment_status = "Paid";
    }

    try {
      await api.updateTask(updatedTask.id, updatedTask);
      const updatedTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      setTasks(updatedTasks);
      try {
        localStorage.setItem("charvik_trip_duty_management_v2", JSON.stringify(updatedTasks));
      } catch {}
      setEditingTrip(null);
      success("Trip record updated successfully!");
    } catch (err: any) {
      error(err.message || "Failed to update trip record");
    }
  };

  // 5. Confirm Delete Trip
  const handleConfirmDeleteTrip = async () => {
    if (!deletingTrip) return;

    const taskToUpdate = tasks.find((t) => t.id === deletingTrip.id);
    if (!taskToUpdate) {
      error("Task record not found");
      setDeletingTrip(null);
      return;
    }

    const slotKey = deletingTrip.slot || "driver1";

    try {
      const otherSlots = (["driver1", "driver2", "helper", "captain"] as const).filter((s) => s !== slotKey);
      const hasOtherStaff = otherSlots.some((s) => taskToUpdate[s] && taskToUpdate[s].employee_name);

      if (!hasOtherStaff) {
        await api.deleteTask(deletingTrip.id);
        const updatedTasks = tasks.filter((t) => t.id !== deletingTrip.id);
        setTasks(updatedTasks);
        try {
          localStorage.setItem("charvik_trip_duty_management_v2", JSON.stringify(updatedTasks));
        } catch {}
      } else {
        const updatedTask = {
          ...taskToUpdate,
          [slotKey]: null
        };
        await api.updateTask(updatedTask.id, updatedTask);
        const updatedTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        setTasks(updatedTasks);
        try {
          localStorage.setItem("charvik_trip_duty_management_v2", JSON.stringify(updatedTasks));
        } catch {}
      }

      setDeletingTrip(null);
      success("Trip record deleted successfully!");
    } catch (err: any) {
      error(err.message || "Failed to delete trip record");
    }
  };

  // 6. Save Payment Edit
  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const updated: RecordedPayment = {
      id: editingPayment.id,
      employee_name: editingPayment.employee_name,
      employee_code: editingPayment.employee_code,
      role: editingPayment.role,
      amount: Number(editingPayment.amount) || 0,
      payment_date: editingPayment.payment_date,
      payment_type: editingPayment.payment_type,
      payment_mode: editingPayment.payment_mode,
      payment_proof: editingPayment.payment_proof || undefined,
      notes: editingPayment.notes || undefined,
      created_at: new Date().toISOString()
    };

    try {
      await api.updateEmployeePayment(updated.id, updated);
      const updatedHistory = paymentHistory.map((p) => (p.id === updated.id ? updated : p));
      setPaymentHistory(updatedHistory);
      try {
        localStorage.setItem("charvik_employee_recorded_payments", JSON.stringify(updatedHistory));
      } catch {}
      setEditingPayment(null);
      success("Payment record updated successfully!");
    } catch (err: any) {
      error(err.message || "Failed to update payment record");
    }
  };

  // 7. Confirm Delete Payment
  const handleConfirmDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      await api.deleteEmployeePayment(deletingPayment.id);
      const updatedHistory = paymentHistory.filter((p) => p.id !== deletingPayment.id);
      setPaymentHistory(updatedHistory);
      try {
        localStorage.setItem("charvik_employee_recorded_payments", JSON.stringify(updatedHistory));
      } catch {}
      setDeletingPayment(null);
      success("Payment record deleted successfully!");
    } catch (err: any) {
      error(err.message || "Failed to delete payment record");
    }
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
                onClick={handleClearSelection}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all shadow-2xs cursor-pointer shrink-0"
                title="Back to Select Employee / Directory"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {r.full_name} - Employee Profile
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {r.role}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap ml-1"
                    title="Switch to select employee / directory"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View All Staff</span>
                  </button>
                </div>

                {/* Separate Category Option & Employee Option (Both with Search & Select) */}
                <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                  {/* 1. CATEGORY OPTION: Search & Select */}
                  <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-1 gap-1.5 shadow-2xs">
                    <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-[11px] font-bold text-slate-600 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      <span>Category:</span>
                    </div>

                    {/* Category Search Option */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search category..."
                        value={profileCategorySearch}
                        onChange={(e) => setProfileCategorySearch(e.target.value)}
                        className="w-28 sm:w-32 text-xs pl-6 pr-5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        title="Search Category / Role"
                      />
                      {profileCategorySearch && (
                        <button
                          type="button"
                          onClick={() => setProfileCategorySearch("")}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 leading-none"
                          title="Clear category search"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Category Select Option */}
                    <select
                      value={profileSelectedCategory}
                      onChange={(e) => setProfileSelectedCategory(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs outline-none cursor-pointer hover:border-slate-300 focus:border-blue-500"
                      title="Select Category"
                    >
                      <option value="All">All Categories ({distinctEmployeeCategories.length})</option>
                      {filteredCategoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. EMPLOYEE OPTION: Search & Select */}
                  <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-1 gap-1.5 shadow-2xs">
                    <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-[11px] font-bold text-slate-600 shrink-0">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Employee:</span>
                    </div>

                    {/* Employee Search Option */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={profileEmployeeSearch}
                        onChange={(e) => setProfileEmployeeSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && filteredProfileEmployees.length > 0) {
                            handleSelectEmployee(filteredProfileEmployees[0]);
                          }
                        }}
                        className="w-32 sm:w-36 text-xs pl-6 pr-5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        title="Search Employee by name or code (Press Enter to select)"
                      />
                      {profileEmployeeSearch && (
                        <button
                          type="button"
                          onClick={() => setProfileEmployeeSearch("")}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 leading-none"
                          title="Clear employee search"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Employee Select Option */}
                    <select
                      value={r ? (r.employee_code || r.full_name) : ""}
                      onChange={(e) => {
                        if (!e.target.value || e.target.value === "__ALL__") {
                          handleClearSelection();
                          return;
                        }
                        const target = allEmployeeRecords.find(
                          (x) => (x.employee_code || x.full_name) === e.target.value
                        );
                        if (target) handleSelectEmployee(target);
                      }}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs outline-none cursor-pointer hover:border-slate-300 focus:border-emerald-500 max-w-[210px] truncate"
                      title="Select Employee"
                    >
                      <option value="">-- Select Employee --</option>
                      {filteredProfileEmployees.length === 0 ? (
                        <option disabled value="">No employees found</option>
                      ) : (
                        filteredProfileEmployees.map((x) => (
                          <option key={x.id + x.full_name} value={x.employee_code || x.full_name}>
                            {x.full_name} ({x.role})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium">
                  Official employee record &bull; Filter by category or search employee by name/code
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenWhatsAppModal(r)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
                title="Send official monthly statement to this employee via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send Monthly WhatsApp</span>
              </button>

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
                title="Print biodata for this employee"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Biodata</span>
              </button>

              <button
                type="button"
                onClick={handlePrintOverallPayments}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
                title="Print overall salary and payout statement for all employees"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-100" />
                <span>Print All Paid Employees</span>
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

              {/* 3 KPI Summary Cards (Glowing Vibrant Color Palette) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* TOTAL SALARY EARNED (Sky Blue Gradient) */}
                <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-blue-900 tracking-wider uppercase">TOTAL SALARY EARNED</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 font-mono">
                      ₹{r.salaryEarned.toLocaleString("en-IN")}
                    </h3>
                    <span className="inline-block mt-2 text-xs font-bold text-blue-800 bg-blue-100/90 px-3 py-0.5 rounded-full border border-blue-200">
                      Billed Staff Fees
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform shrink-0 ml-3">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                {/* TOTAL PAID (Emerald Green Gradient) */}
                <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-emerald-900 tracking-wider uppercase">TOTAL PAID</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
                      ₹{r.advancePaid.toLocaleString("en-IN")}
                    </h3>
                    <span className="inline-block mt-2 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-0.5 rounded-full border border-emerald-200">
                      Salary – Remaining Due
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform shrink-0 ml-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* REMAINING DUE (Orange / Rose Gradient) */}
                <div className="bg-gradient-to-br from-[#FFF5EC] via-[#FFF9F3] to-[#FFE7D1] border-2 border-[#FFD0A8] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-orange-950 tracking-wider uppercase">REMAINING DUE</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-orange-800 mt-1 font-mono">
                      ₹{r.pendingDue.toLocaleString("en-IN")}
                    </h3>
                    <span className="inline-block mt-2 text-xs font-bold text-orange-800 bg-orange-100/90 px-3 py-0.5 rounded-full border border-orange-200">
                      Pending Payment
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F97316] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform shrink-0 ml-3">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Records of Trips: TRIP DUTY & SALARY LEDGER (Matches exact template in image) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                    Trip Duty &amp; Salary Ledger
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Print Report (Black & White) */}
                    <button
                      type="button"
                      onClick={() => handlePrintTripLedger('bw')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-2xs cursor-pointer"
                      title="Print official Black & White report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Report</span>
                    </button>

                    {/* Save as PDF (Colourful) */}
                    <button
                      type="button"
                      onClick={() => handlePrintTripLedger('colourful')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#004B9E] hover:bg-[#00367A] text-white transition-colors shadow-2xs cursor-pointer"
                      title="Save colorful report as PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save as PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppModal(r)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                      title="Send Complete Monthly Statement to Employee via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* On-Screen Card formatted identically to the reference template */}
                <div className="border-2 border-[#004B9E] rounded-2xl bg-white p-4 sm:p-6 shadow-sm space-y-4">
                  {/* Top Header: Logo on left, vertical divider, Phone and Email on right */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
                    <img
                      src="/charvik-invoice-logo.png"
                      alt="CHARVIK Staffing & Consultancy"
                      className="h-12 sm:h-14 w-auto max-w-[260px] object-contain block"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo-brand.png'; }}
                    />
                    <div className="flex items-center">
                      <div className="border-l-[1.5px] border-[#004B9E] h-10 sm:h-11 mx-3 sm:mx-4"></div>
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-[#004B9E] whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#004B9E] text-white text-[10px]">📞</span>
                          <span>9505151527</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#004B9E] whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#004B9E] text-white text-[10px]">✉</span>
                          <span>charvikstaffingconsulrancy@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Divider */}
                  <div className="border-b-[2.5px] border-[#004B9E] w-full"></div>

                  {/* Subheader: Pill on left, Driver Name & Employee ID Box on right */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="bg-[#004B9E] text-white px-6 sm:px-8 py-2 rounded-full font-black text-sm sm:text-base uppercase tracking-wider shadow-xs whitespace-nowrap">
                      TRIP DUTY &amp; SALARY LEDGER
                    </div>

                    <div className="border-[1.5px] border-[#004B9E] rounded-xl px-4 py-2 bg-white text-xs sm:text-sm font-bold text-slate-900 min-w-[260px] space-y-1">
                      <div className="flex items-center">
                        <span className="whitespace-nowrap font-extrabold text-slate-800">Driver Name :</span>
                        <span className="flex-1 border-b-[1.5px] border-slate-900 ml-2 pl-2 font-black text-slate-900">
                          {r.full_name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="whitespace-nowrap font-extrabold text-slate-800">Employee ID :</span>
                        <span className="flex-1 border-b-[1.5px] border-slate-900 ml-2 pl-2 font-black font-mono text-slate-900">
                          {formatEmployeeId(r.employee_code, r.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* The Ledger Table */}
                  <div className="overflow-x-auto border-2 border-[#004B9E] rounded-lg">
                    <table className="w-full text-center border-collapse text-xs" style={{ minWidth: "750px" }}>
                      <thead>
                        <tr className="bg-[#004B9E] text-white font-black text-xs uppercase tracking-wider">
                          <th className="py-2.5 px-2 w-10 border-r border-white">#</th>
                          <th className="py-2.5 px-3 w-28 border-r border-white">DATE</th>
                          <th className="py-2.5 px-3 border-r border-white">TASK / ROUTE</th>
                          <th className="py-2.5 px-3 w-32 border-r border-white">VEHICLE NO</th>
                          <th className="py-2.5 px-3 w-28 border-r border-white">SALARY</th>
                          <th className="py-2.5 px-3 w-28 border-r border-white">PAID AMOUNT</th>
                          <th className="py-2.5 px-3 w-32 border-r border-white">REMAINING DUE</th>
                          <th className="py-2.5 px-3 w-24 border-r border-white">STATUS</th>
                          <th className="py-2.5 px-3 w-28 no-print">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#004B9E]/30 text-slate-900 font-semibold">
                        {paginatedTrips.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
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
                            const isPaid = trip.isPaid;

                            return (
                              <tr key={String(trip.id) + idx} className="hover:bg-blue-50/40 transition-colors border-b border-[#004B9E]/30">
                                <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-[#004B9E]/40">
                                  {(currentPage - 1) * rowsPerPage + idx + 1}
                                </td>
                                <td className="py-2 px-3 text-center font-bold whitespace-nowrap text-slate-800 border-r border-[#004B9E]/40">
                                  {formattedDate}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-[#004B9E]/40">
                                  {trip.route_corridor}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap border-r border-[#004B9E]/40">
                                  {trip.vehicle_number}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap border-r border-[#004B9E]/40">
                                  ₹{trip.salary.toLocaleString("en-IN")}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap border-r border-[#004B9E]/40">
                                  ₹{trip.advance.toLocaleString("en-IN")}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap border-r border-[#004B9E]/40">
                                  ₹{trip.balance_due.toLocaleString("en-IN")}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap border-r border-[#004B9E]/40">
                                  <span className={`font-black uppercase ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isPaid ? 'PAID' : 'PENDING'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap no-print">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintTripSlip(trip)}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Print Payment Slip"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendTripWhatsApp(trip)}
                                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                      title="Send Trip Slip via WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingTrip({
                                          trip,
                                          date: trip.date,
                                          route_corridor: trip.route_corridor,
                                          vehicle_number: trip.vehicle_number,
                                          salary: String(trip.salary),
                                          advance: String(trip.advance)
                                        })
                                      }
                                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Edit Trip Details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTrip(trip)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Trip Record"
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
                      <tfoot>
                        <tr className="bg-[#dbeafe] font-black text-xs border-t-2 border-[#004B9E]">
                          <td colSpan={4} className="py-2.5 px-4 text-center font-black uppercase text-[#004B9E] border-r border-[#004B9E]">
                            TOTAL ({filteredTrips.length} TRIPS)
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-[#004B9E] whitespace-nowrap border-r border-[#004B9E]">
                            ₹{filteredTrips.reduce((a, b) => a + (b.salary || 0), 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-[#004B9E] whitespace-nowrap border-r border-[#004B9E]">
                            ₹{filteredTrips.reduce((a, b) => a + (b.advance || 0), 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-[#004B9E] whitespace-nowrap border-r border-[#004B9E]">
                            ₹{filteredTrips.reduce((a, b) => a + (b.balance_due || 0), 0).toLocaleString("en-IN")}
                          </td>
                          <td colSpan={2} className="py-2.5 px-3 bg-[#dbeafe]"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
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
                      <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-xs border-b border-blue-900/30">
                        <tr>
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">DATE</th>
                          <th className="py-3 px-3">AMOUNT PAID</th>
                          <th className="py-3 px-3">TYPE</th>
                          <th className="py-3 px-3">MODE</th>
                          <th className="py-3 px-3">PROOF</th>
                          <th className="py-3 px-3">NOTES</th>
                          <th className="py-3 px-3 text-center">ACTION</th>
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
                              <td className="py-2 px-3 font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium text-slate-700">{p.payment_date || (p as any).date}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {p.payment_type}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-700">{p.payment_mode}</td>
                              <td className="py-2 px-3">
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
                              <td className="py-2 px-3 text-slate-500">{p.notes || "-"}</td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintReceipt(p)}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Print Receipt"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingPayment({
                                        id: p.id,
                                        employee_name: p.employee_name,
                                        employee_code: p.employee_code,
                                        role: p.role,
                                        amount: String(p.amount),
                                        payment_date: p.payment_date || (p as any).date,
                                        payment_type: p.payment_type || "Bata",
                                        payment_mode: p.payment_mode || "Cash",
                                        payment_proof: p.payment_proof,
                                        notes: p.notes
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                    title="Edit Payment"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingPayment(p)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Payment"
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
          {/* Top Header Banner with Bus Image */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center space-x-4 max-w-xl">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                      Employee Payments
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                      Active Payroll
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                    Track salary accruals, advances paid, and settlement dues across all drivers, helpers, and captains.
                  </p>
                </div>
              </div>

              {/* Real Bus Coach Banner Photo Preview */}
              <div className="flex items-center gap-3.5 self-start lg:self-auto flex-wrap sm:flex-nowrap">
                <div className="hidden sm:block relative shrink-0">
                  <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
                    <img
                      src="/assets/fleet2.jpg"
                      alt="Payroll Fleet Coach"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Payroll Ops</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex items-center bg-white/15 p-1 rounded-xl border border-white/20 backdrop-blur-md shrink-0">
                    {(["Today", "Week", "Month", "Year", "All"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPeriod(p);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          period === p
                            ? "bg-white text-blue-900 shadow-xs font-black"
                            : "text-blue-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBulkWhatsAppOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md whitespace-nowrap"
                    title="Open Monthly WhatsApp Auto-Dispatch Roster"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Monthly WhatsApp Dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment(null)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-white text-blue-900 hover:bg-blue-50 transition-all cursor-pointer shadow-md whitespace-nowrap"
                    title="Record new payment for staff"
                  >
                    <span className="text-sm font-black text-blue-700">₹</span>
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Category & Employee Search & Select Option Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* 1. CATEGORY OPTION: Search & Select */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1.5 shadow-2xs">
                <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-[11px] font-bold text-slate-600 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Category:</span>
                </div>

                {/* Category Search Option */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={profileCategorySearch}
                    onChange={(e) => setProfileCategorySearch(e.target.value)}
                    className="w-28 sm:w-32 text-xs pl-6 pr-5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    title="Search Category / Role"
                  />
                  {profileCategorySearch && (
                    <button
                      type="button"
                      onClick={() => setProfileCategorySearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 leading-none"
                      title="Clear category search"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Category Select Option */}
                <select
                  value={profileSelectedCategory}
                  onChange={(e) => setProfileSelectedCategory(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs outline-none cursor-pointer hover:border-slate-300 focus:border-blue-500"
                  title="Select Category"
                >
                  <option value="All">All Categories ({distinctEmployeeCategories.length})</option>
                  {filteredCategoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. EMPLOYEE OPTION: Search & Select */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1.5 shadow-2xs">
                <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-[11px] font-bold text-slate-600 shrink-0">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Employee:</span>
                </div>

                {/* Employee Search Option */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={profileEmployeeSearch}
                    onChange={(e) => setProfileEmployeeSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredProfileEmployees.length > 0) {
                        handleSelectEmployee(filteredProfileEmployees[0]);
                      }
                    }}
                    className="w-32 sm:w-36 text-xs pl-6 pr-5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    title="Search Employee by name or code (Press Enter to select)"
                  />
                  {profileEmployeeSearch && (
                    <button
                      type="button"
                      onClick={() => setProfileEmployeeSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 leading-none"
                      title="Clear employee search"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Employee Select Option */}
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const target = allEmployeeRecords.find(
                      (x) => (x.employee_code || x.full_name) === e.target.value
                    );
                    if (target) handleSelectEmployee(target);
                  }}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs outline-none cursor-pointer hover:border-slate-300 focus:border-emerald-500 max-w-[210px] truncate"
                  title="Select Employee"
                >
                  <option value="">-- Select Employee --</option>
                  {filteredProfileEmployees.length === 0 ? (
                    <option disabled value="">No employees found</option>
                  ) : (
                    filteredProfileEmployees.map((x) => (
                      <option key={x.id + x.full_name} value={x.employee_code || x.full_name}>
                        {x.full_name} ({x.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <span>👉 Select an employee above or click <strong>View Ledger</strong> below</span>
            </div>
          </div>

          <div id="all-employee-payments-print-wrapper" className="space-y-6">
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-gradient-to-br from-[#EEF2FF] via-[#E0E7FF] to-[#C7D2FE] border-2 border-[#818CF8] p-5 rounded-3xl shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">Active Staff</p>
                  <h3 className="text-3xl font-black text-indigo-950 font-mono">{dirTotals.activeCount}</h3>
                  <p className="text-xs text-indigo-800 font-bold">Of {allEmployeeRecords.length} registered</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0] border-2 border-[#34D399] p-5 rounded-3xl shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">Gross Salaries</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                    ₹{dirTotals.totalSalary.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-emerald-800 font-bold">Assigned trip pay</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] border-2 border-[#38BDF8] p-5 rounded-3xl shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-sky-950 uppercase tracking-wider">Advances Disbursed</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-sky-950 font-mono">
                    ₹{dirTotals.totalAdvance.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-sky-800 font-bold">Pre-paid amounts</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFE4E6] via-[#FECDD3] to-[#FDA4AF] border-2 border-[#FB7185] p-5 rounded-3xl shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-950 uppercase tracking-wider">Pending Dues</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-950 font-mono">
                    ₹{dirTotals.totalDue.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-rose-800 font-bold">Balance to settle</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F43F5E] to-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
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
                      placeholder="Search staff, employee id, phone..."
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
                <table className="w-full text-left text-sm" style={{ minWidth: "850px" }}>
                  <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[50px]">S.NO</th>
                      <th className="py-2.5 px-3 min-w-[160px]">EMPLOYEE</th>
                      <th className="py-2.5 px-3 min-w-[90px]">ROLE</th>
                      <th className="py-2.5 px-3 min-w-[110px]">PHONE</th>
                      <th className="py-2.5 px-3 text-center min-w-[90px]">TASKS</th>
                      <th className="py-2.5 px-3 min-w-[105px]">GROSS SALARY</th>
                      <th className="py-2.5 px-3 min-w-[105px]">ADVANCE PAID</th>
                      <th className="py-2.5 px-3 min-w-[105px]">BALANCE DUE</th>
                      <th className="py-2.5 px-3 text-center min-w-[90px]">STATUS</th>
                      <th className="py-2.5 px-3 text-center min-w-[95px]">ACTION</th>
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
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center">
                                {sNo}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
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
                                    {formatEmployeeId(emp.employee_code, emp.role)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${rc.bg} ${rc.text} ${rc.border}`}
                              >
                                <RoleIcon className="w-3.5 h-3.5" />
                                {emp.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-medium">
                              {emp.phone || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                                {emp.tasksHandled}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                              ₹{emp.salaryEarned.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-blue-700">
                              ₹{emp.advancePaid.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                className={`font-mono font-bold ${
                                  emp.pendingDue > 0 ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                ₹{emp.pendingDue.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
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
                            <td className="py-2 px-3 text-center whitespace-nowrap">
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

                                {/* WhatsApp monthly statement button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppModal(emp)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer shadow-2xs transition-all"
                                  title="Send Monthly WhatsApp Statement"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
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
                        <td colSpan={5} className="py-2 px-3 font-extrabold text-[#142B4A] text-xs uppercase tracking-wide">
                          Page Total ({paginatedEmployees.length} personnel)
                        </td>
                        <td className="py-2 px-3 font-mono font-black text-slate-900 text-xs">
                          ₹{paginatedEmployees.reduce((s, e) => s + e.salaryEarned, 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3 font-mono font-black text-blue-700 text-xs">
                          ₹{paginatedEmployees.reduce((s, e) => s + e.advancePaid, 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3 font-mono font-black text-rose-600 text-xs">
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

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingTrip(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Trip Duty Record</h3>
                <p className="text-xs text-slate-500">Update date, vehicle, route, and staff remuneration</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTripEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Trip Date</label>
                  <input
                    type="date"
                    required
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    value={editingTrip.vehicle_number}
                    onChange={(e) => setEditingTrip({ ...editingTrip, vehicle_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task / Route Details</label>
                <input
                  type="text"
                  required
                  value={editingTrip.route_corridor}
                  onChange={(e) => setEditingTrip({ ...editingTrip, route_corridor: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Salary Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingTrip.salary}
                    onChange={(e) => setEditingTrip({ ...editingTrip, salary: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingTrip.advance}
                    onChange={(e) => setEditingTrip({ ...editingTrip, advance: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Calculated Remaining Due */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Calculated Remaining Due:</span>
                <span className="font-black text-sm text-rose-600 font-mono">
                  ₹{Math.max(0, (Number(editingTrip.salary) || 0) - (Number(editingTrip.advance) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Trip Confirmation */}
      {deletingTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDeletingTrip(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Trip Record?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-rose-950 space-y-1">
              <p><strong>Route:</strong> {deletingTrip.route_corridor}</p>
              <p><strong>Vehicle:</strong> {deletingTrip.vehicle_number}</p>
              <p><strong>Date:</strong> {deletingTrip.date}</p>
              <p><strong>Salary Amount:</strong> ₹{deletingTrip.salary.toLocaleString("en-IN")}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTrip(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTrip}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Yes, Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingPayment(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Payment Record</h3>
                <p className="text-xs text-slate-500">Receipt No: {editingPayment.id} | Staff: {editingPayment.employee_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-bold text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={editingPayment.payment_date}
                    onChange={(e) => setEditingPayment({ ...editingPayment, payment_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Type</label>
                  <select
                    value={editingPayment.payment_type}
                    onChange={(e) =>
                      setEditingPayment({
                        ...editingPayment,
                        payment_type: e.target.value as "Bata" | "Salary" | "Advance"
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-semibold"
                  >
                    <option value="Bata">Bata</option>
                    <option value="Salary">Salary</option>
                    <option value="Advance">Advance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={editingPayment.payment_mode}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      payment_mode: e.target.value as "Cash" | "Online" | "UPI" | "Bank Transfer"
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Reference or transaction notes"
                  value={editingPayment.notes || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#142B4A] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation */}
      {deletingPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDeletingPayment(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Payment Record?</h3>
                <p className="text-xs text-slate-500">This action will remove the record from ledger.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-rose-950 space-y-1">
              <p><strong>Receipt No:</strong> {deletingPayment.id}</p>
              <p><strong>Staff:</strong> {deletingPayment.employee_name}</p>
              <p><strong>Date:</strong> {deletingPayment.payment_date}</p>
              <p><strong>Amount Paid:</strong> ₹{deletingPayment.amount.toLocaleString("en-IN")}</p>
              <p><strong>Mode:</strong> {deletingPayment.payment_mode} ({deletingPayment.payment_type})</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePayment}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Yes, Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Monthly Statement Modal */}
      {isWhatsAppModalOpen && whatsAppTargetEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isGeneratingPdf && setIsWhatsAppModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide">
                      Monthly Salary Statement
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white border border-white/30">
                      PDF Document
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">
                    Generates official Charvik Letterhead A4 PDF &amp; dispatches via WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-2 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Employee Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{whatsAppTargetEmployee.full_name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Role: <strong className="text-slate-800">{whatsAppTargetEmployee.role}</strong> &nbsp;|&nbsp;
                    ID: <strong className="font-mono text-blue-700">{formatEmployeeId(whatsAppTargetEmployee.employee_code, whatsAppTargetEmployee.role)}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Remaining Due</span>
                  <span className="text-base font-black font-mono text-rose-600">
                    ₹{whatsAppTargetEmployee.pendingDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Form Controls: Phone & Billing Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={whatsAppPhone}
                      onChange={(e) => setWhatsAppPhone(e.target.value)}
                      placeholder="e.g. 9848012345"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-900 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">10-digit mobile number for WhatsApp delivery</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Billing Period / Month
                  </label>
                  <input
                    type="text"
                    value={whatsAppMonth}
                    onChange={(e) => setWhatsAppMonth(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-900 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Cycle statement period label</span>
                </div>
              </div>

              {/* Notice Card: PDF Generation */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Official PDF Delivery:</strong> Clicking <strong>Send PDF via WhatsApp</strong> automatically compiles the official statement into an A4 document with the Charvik letterhead, seal, itemized trip duties, and payments, ready for direct WhatsApp dispatch.
                </div>
              </div>

              {/* Live Preview Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPdfPreviewTab("pdf")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pdfPreviewTab === "pdf"
                          ? "bg-white text-emerald-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>PDF Document Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfPreviewTab("text")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pdfPreviewTab === "text"
                          ? "bg-white text-emerald-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Summary</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintStatementSheet}
                      title="Print or Save as PDF via Browser"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      <span>Print Sheet</span>
                    </button>
                    {pdfPreviewTab === "text" && (
                      <button
                        type="button"
                        onClick={handleCopyWhatsAppMessage}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </button>
                    )}
                  </div>
                </div>

                {pdfPreviewTab === "pdf" ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
                    <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 flex items-center justify-between border-b border-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>A4 Letterhead • High DPI Document</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[240px]">
                        {buildSalaryPdfFileName(whatsAppTargetEmployee.full_name, whatsAppMonth || currentMonthLabel)}
                      </span>
                    </div>
                    <div 
                      className="max-h-72 overflow-y-auto p-2 bg-white"
                      dangerouslySetInnerHTML={{
                        __html: generateSalaryStatementHtml(
                          getPdfDataForTarget(
                            whatsAppTargetEmployee,
                            whatsAppPhone,
                            whatsAppMonth || currentMonthLabel
                          )
                        )
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-[#0b141a] text-[#e9edef] rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-emerald-950/40 shadow-inner leading-relaxed">
                    {generateWhatsAppMonthlyStatement(
                      whatsAppTargetEmployee,
                      whatsAppTargetEmployee.trips || [],
                      paymentHistory.filter(
                        (p) =>
                          (p.employee_code && p.employee_code.toLowerCase() === (whatsAppTargetEmployee.employee_code || "").toLowerCase()) ||
                          (p.employee_name && p.employee_name.toLowerCase() === whatsAppTargetEmployee.full_name.toLowerCase())
                      ),
                      whatsAppMonth || currentMonthLabel,
                      whatsAppPhone
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDirectDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handlePrintStatementSheet}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleConfirmSendMonthlyWhatsApp}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating &amp; Sending PDF...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Send PDF via WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Monthly WhatsApp Auto-Dispatch Roster Modal */}
      {isBulkWhatsAppOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsBulkWhatsAppOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide">
                    Monthly WhatsApp Auto-Dispatch Roster • {currentMonthLabel}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    1-Click WhatsApp monthly statements dispatch for all active crew &amp; drivers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkWhatsAppOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-2 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950">
                <span>Active Personnel in {currentMonthLabel}: <strong>{allEmployeeRecords.filter(e => e.tasksHandled > 0).length} Staff Members</strong></span>
                <span>Total Month Dues: <strong className="font-mono text-rose-700">₹{allEmployeeRecords.reduce((acc, curr) => acc + curr.pendingDue, 0).toLocaleString("en-IN")}</strong></span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B3A79] text-white uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">STAFF NAME</th>
                      <th className="py-2.5 px-3">ROLE</th>
                      <th className="py-2.5 px-3">TRIPS</th>
                      <th className="py-2.5 px-3">TOTAL EARNED</th>
                      <th className="py-2.5 px-3">REMAINING DUE</th>
                      <th className="py-2.5 px-3">DISPATCH STATUS</th>
                      <th className="py-2.5 px-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {allEmployeeRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No employee records found for this period.
                        </td>
                      </tr>
                    ) : (
                      allEmployeeRecords.map((emp) => {
                        const empKey = (emp.employee_code || emp.full_name).trim().toLowerCase();
                        const dispatch = dispatchesMap[`${empKey}_${currentMonthKey}`];
                        return (
                          <tr key={emp.id + emp.full_name} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {emp.full_name}
                              <span className="block text-[10px] font-mono text-slate-400">{formatEmployeeId(emp.employee_code, emp.role)}</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{emp.role}</td>
                            <td className="py-2.5 px-3 font-bold">{emp.tasksHandled}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">₹{emp.salaryEarned.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-3 font-mono font-black text-rose-600">₹{emp.pendingDue.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {dispatch ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsBulkWhatsAppOpen(false);
                                  handleOpenWhatsAppModal(emp);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{dispatch ? "Resend" : "Send"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Dispatches are saved automatically to the audit ledger.
              </span>
              <button
                type="button"
                onClick={() => setIsBulkWhatsAppOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Slip Preview & Print Modal (Matching User's Reference Template) */}
      {printingSlipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>📄 Payment Slip</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                    {printingSlipData.voucherNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {printingSlipData.employeeName} ({printingSlipData.employeeCode})
                </p>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSlipFormat('bw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    slipFormat === 'bw'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Black & White
                </button>
                <button
                  type="button"
                  onClick={() => setSlipFormat('colourful')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    slipFormat === 'colourful'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Colourful
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executePrintPaymentSlip(printingSlipData, slipFormat)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => executePrintPaymentSlip(printingSlipData, 'colourful')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingSlipData(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center items-start">
              <div
                className="bg-white shadow-lg rounded-xl overflow-hidden"
                style={{ width: '100%', maxWidth: '680px' }}
                dangerouslySetInnerHTML={{
                  __html: generatePaymentSlipHtml(printingSlipData, slipFormat)
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
              <button
                type="button"
                onClick={() => setPrintingSlipData(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
