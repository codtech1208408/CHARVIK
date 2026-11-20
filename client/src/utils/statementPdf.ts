import html2pdf from "html2pdf.js";
import { formatEmployeeId } from "./employeeCode";

export interface StatementPdfData {
  employee: {
    full_name: string;
    employee_code?: string;
    role: string;
    phone?: string;
    salaryEarned?: number;
    pendingDue?: number;
    advancePaid?: number;
    settledTotal?: number;
    branch?: string;
    email?: string;
    gender?: string;
    date_of_birth?: string;
  };
  trips: Array<{
    date: string;
    vehicle_number: string;
    route_corridor: string;
    service_number?: string;
    salary: number;
    advance: number;
    balance_due: number;
    isPaid?: boolean;
  }>;
  payments: Array<{
    payment_date: string;
    amount: number;
    payment_mode: string;
    payment_type: string;
    notes?: string;
  }>;
  monthLabel: string;
  staffPhone?: string;
}

/**
 * Sanitizes phone number to WhatsApp international format (e.g., 919848012345)
 */
export function sanitizeWhatsAppNumber(phoneStr: string): string {
  const digits = (phoneStr || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

/**
 * Builds safe PDF file name
 */
export function buildSalaryPdfFileName(fullName: string, monthLabel: string): string {
  const safeName = (fullName || "Staff").trim().replace(/[^a-zA-Z0-9]/g, "_");
  const safeMonth = (monthLabel || "Monthly").trim().replace(/[^a-zA-Z0-9]/g, "_");
  return `${safeName}_Salary_Statement_${safeMonth}.pdf`;
}

/**
 * Generates high-res inline-styled HTML for Charvik Monthly Salary Statement A4 PDF
 */
export function generateSalaryStatementHtml(data: StatementPdfData): string {
  const { employee, trips = [], payments = [], monthLabel, staffPhone } = data;

  const totalSalary = trips.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
  const totalPaid = trips.reduce((sum, t) => sum + (Number(t.advance) || 0), 0);
  const totalDue = trips.reduce((sum, t) => sum + (Number(t.balance_due) || 0), 0);

  const isSettled = totalDue <= 0 && totalSalary > 0;
  const statusLabel = isSettled ? "FULLY SETTLED / PAID" : totalDue > 0 ? "PENDING PAYMENT" : "NIL";
  const statusColor = isSettled ? "#047857" : "#e11d48";
  const statusBg = isSettled ? "#ecfdf5" : "#fff1f2";
  const statusBorder = isSettled ? "#a7f3d0" : "#fecdd3";

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  const tripRowsHtml = trips.length > 0
    ? trips.map((t, idx) => {
        const d = t.date
          ? t.date.includes("-")
            ? t.date.split("-").reverse().join("/")
            : t.date
          : "-";
        const isPaid = (t.balance_due || 0) <= 0;
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 7px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 11px;">${idx + 1}</td>
            <td style="padding: 7px 8px; font-weight: 600; color: #0f172a; font-size: 11px; white-space: nowrap;">${d}</td>
            <td style="padding: 7px 8px; font-weight: 600; color: #0f172a; font-size: 11px;">
              ${t.route_corridor || "-"}
              ${t.service_number ? `<span style="font-size: 9.5px; color: #64748b; display: block; font-family: monospace;">SRV: ${t.service_number}</span>` : ""}
            </td>
            <td style="padding: 7px 8px; font-weight: bold; color: #1e40af; font-size: 11px; font-family: monospace; white-space: nowrap;">${t.vehicle_number || "-"}</td>
            <td style="padding: 7px 8px; text-align: right; font-weight: bold; color: #0f172a; font-size: 11px;">₹${(Number(t.salary) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 7px 8px; text-align: right; font-weight: 600; color: #047857; font-size: 11px;">₹${(Number(t.advance) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 7px 8px; text-align: right; font-weight: bold; color: ${t.balance_due > 0 ? '#e11d48' : '#047857'}; font-size: 11px;">₹${(Number(t.balance_due) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 7px 8px; text-align: center; font-size: 10px; font-weight: bold;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: ${isPaid ? '#ecfdf5' : '#fff1f2'}; color: ${isPaid ? '#047857' : '#e11d48'}; border: 1px solid ${isPaid ? '#a7f3d0' : '#fecdd3'};">
                ${isPaid ? "PAID" : "DUE"}
              </span>
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="8" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">
          No trip duty records logged for this period.
        </td>
      </tr>
    `;

  const paymentRowsHtml = payments.length > 0
    ? payments.map((p, idx) => {
        const pd = p.payment_date
          ? p.payment_date.includes("-")
            ? p.payment_date.split("-").reverse().join("/")
            : p.payment_date
          : "-";
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 11px;">${idx + 1}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #0f172a; font-size: 11px; white-space: nowrap;">${pd}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #047857; font-size: 11px;">₹${(Number(p.amount) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #1e40af; font-size: 11px;">${p.payment_mode || "Cash"}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #475569; font-size: 11px;">${p.payment_type || "Salary"}</td>
            <td style="padding: 6px 8px; color: #64748b; font-size: 10.5px;">${p.notes || "-"}</td>
          </tr>
        `;
      }).join("")
    : "";

  const totalPaymentsAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Logo URL (uses absolute URL for clean html2canvas rendering)
  const logoUrl = typeof window !== "undefined"
    ? `${window.location.origin}/charvik-print-logo.png`
    : "/charvik-print-logo.png";

  return `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 22px 26px; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Official Charvik Letterhead Top Banner -->
      <div style="display: flex; flex-direction: column; align-items: center; border-bottom: 2.5px solid #142B4A; padding-bottom: 12px; margin-bottom: 14px; text-align: center;">
        <img 
          src="${logoUrl}" 
          alt="Charvik Staffing Consultancy" 
          crossorigin="anonymous"
          style="height: 64px; max-width: 380px; object-fit: contain; margin-bottom: 6px;" 
        />
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #142B4A; margin-bottom: 6px;">
          MANPOWER SOLUTIONS &bull; RECRUITMENT &bull; PAYROLL SUPPORT
        </div>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 10.5px; color: #334155; font-weight: 600; margin-bottom: 6px; flex-wrap: wrap;">
          <span>📞 Phone: <strong style="color: #0f172a;">9505151527</strong></span>
          <span>✉️ Email: <strong style="color: #0f172a;">charvikstaffingconsultancy@gmail.com</strong></span>
          <span>🌐 Web: <strong style="color: #0f172a;">www.charvikstaffing.com</strong></span>
        </div>

        <div style="display: inline-block; padding: 4px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 9.5px; color: #475569; line-height: 1.35; max-width: 720px; background: #f8fafc;">
          <strong>Office:</strong> NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana
        </div>
      </div>

      <!-- Document Title Strip -->
      <div style="background: #142B4A; color: #ffffff; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <span style="font-size: 13px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">
            MONTHLY SALARY &amp; TRIP SETTLEMENT STATEMENT
          </span>
          <span style="display: block; font-size: 10px; color: #93c5fd; font-weight: 600; margin-top: 1px;">
            Cycle: ${monthLabel}
          </span>
        </div>
        <div style="text-align: right; font-size: 10px; color: #e2e8f0; font-weight: 600;">
          <div>Generated: <strong>${currentDate}</strong></div>
          <div style="font-size: 9px; color: #cbd5e1;">Time: ${currentTime}</div>
        </div>
      </div>

      <!-- Employee Details & Status Card -->
      <div style="border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; background: #f8fafc;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold; width: 18%;">STAFF NAME:</td>
            <td style="padding: 4px 6px; font-weight: 900; color: #0f172a; font-size: 12.5px; width: 32%;">${employee.full_name}</td>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold; width: 18%;">STAFF ID:</td>
            <td style="padding: 4px 6px; font-weight: 900; font-family: monospace; color: #1e40af; font-size: 12px; width: 32%;">
              ${formatEmployeeId(employee.employee_code, employee.role)}
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold;">STAFF ROLE:</td>
            <td style="padding: 4px 6px; font-weight: 700; color: #0f172a;">${employee.role}</td>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold;">CONTACT NO:</td>
            <td style="padding: 4px 6px; font-weight: 700; color: #0f172a;">${staffPhone || employee.phone || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold;">PAYMENT STATUS:</td>
            <td style="padding: 4px 6px;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                ${statusLabel}
              </span>
            </td>
            <td style="padding: 4px 6px; color: #64748b; font-weight: bold;">BRANCH / ADDRESS:</td>
            <td style="padding: 4px 6px; font-weight: 600; color: #334155;">${employee.branch || "Hyderabad Central Operations"}</td>
          </tr>
        </table>
      </div>

      <!-- Financial KPI Cards (3 side-by-side) -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px;">
        <div style="flex: 1; padding: 10px 12px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; text-align: center;">
          <div style="font-size: 9.5px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">TOTAL SALARY EARNED</div>
          <div style="font-size: 17px; font-weight: 900; color: #1e293b; margin-top: 2px;">₹${totalSalary.toLocaleString("en-IN")}</div>
          <div style="font-size: 9px; color: #78350f; margin-top: 1px;">From ${trips.length} trip duties</div>
        </div>
        <div style="flex: 1; padding: 10px 12px; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; text-align: center;">
          <div style="font-size: 9.5px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em;">TOTAL PAID / ADVANCE</div>
          <div style="font-size: 17px; font-weight: 900; color: #047857; margin-top: 2px;">₹${totalPaid.toLocaleString("en-IN")}</div>
          <div style="font-size: 9px; color: #065f46; margin-top: 1px;">Disbursed towards salary</div>
        </div>
        <div style="flex: 1; padding: 10px 12px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 8px; text-align: center;">
          <div style="font-size: 9.5px; font-weight: 800; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">NET REMAINING DUE</div>
          <div style="font-size: 17px; font-weight: 900; color: ${totalDue > 0 ? '#e11d48' : '#047857'}; margin-top: 2px;">₹${totalDue.toLocaleString("en-IN")}</div>
          <div style="font-size: 9px; color: ${totalDue > 0 ? '#9f1239' : '#065f46'}; margin-top: 1px;">${totalDue > 0 ? 'Pending disbursement' : 'Balance cleared'}</div>
        </div>
      </div>

      <!-- Section: Itemized Records of Trips -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 11.5px; font-weight: 800; color: #142B4A; text-transform: uppercase; letter-spacing: 0.05em;">
            🚌 RECORDS OF TRIPS &amp; DUTIES (${trips.length} TRIPS)
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b;">
            Billing Cycle: ${monthLabel}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; font-size: 11px;">
          <thead>
            <tr style="background: #142B4A; color: #ffffff;">
              <th style="padding: 7px 8px; text-align: center; font-size: 10px; font-weight: 800; width: 5%;">#</th>
              <th style="padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 14%;">DATE</th>
              <th style="padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 33%;">ROUTE CORRIDOR</th>
              <th style="padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 18%;">VEHICLE NO</th>
              <th style="padding: 7px 8px; text-align: right; font-size: 10px; font-weight: 800; width: 10%;">SALARY</th>
              <th style="padding: 7px 8px; text-align: right; font-size: 10px; font-weight: 800; width: 10%;">PAID</th>
              <th style="padding: 7px 8px; text-align: right; font-size: 10px; font-weight: 800; width: 10%;">DUE</th>
              <th style="padding: 7px 8px; text-align: center; font-size: 10px; font-weight: 800; width: 10%;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${tripRowsHtml}
          </tbody>
          ${trips.length > 0 ? `
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                <td colspan="4" style="padding: 7px 8px; text-align: right; font-size: 11px; color: #0f172a;">TOTALS:</td>
                <td style="padding: 7px 8px; text-align: right; font-size: 11px; color: #0f172a;">₹${totalSalary.toLocaleString("en-IN")}</td>
                <td style="padding: 7px 8px; text-align: right; font-size: 11px; color: #047857;">₹${totalPaid.toLocaleString("en-IN")}</td>
                <td style="padding: 7px 8px; text-align: right; font-size: 11px; color: ${totalDue > 0 ? '#e11d48' : '#047857'};">₹${totalDue.toLocaleString("en-IN")}</td>
                <td style="padding: 7px 8px; text-align: center; font-size: 10px; color: #64748b;">${trips.length} Duties</td>
              </tr>
            </tfoot>
          ` : ""}
        </table>
      </div>

      <!-- Section: Payment Disbursements (if present) -->
      ${payments.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11.5px; font-weight: 800; color: #142B4A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            💳 DISBURSEMENT &amp; DIRECT PAYMENT RECORDS (${payments.length} PAYMENTS)
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; font-size: 11px;">
            <thead>
              <tr style="background: #142B4A; color: #ffffff;">
                <th style="padding: 6px 8px; text-align: center; font-size: 10px; font-weight: 800; width: 6%;">#</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 16%;">PAYMENT DATE</th>
                <th style="padding: 6px 8px; text-align: right; font-size: 10px; font-weight: 800; width: 16%;">AMOUNT PAID</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 18%;">MODE</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 18%;">TYPE</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 800; width: 26%;">NOTES</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                <td colspan="2" style="padding: 6px 8px; text-align: right; font-size: 11px; color: #0f172a;">TOTAL DISBURSED:</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 11px; color: #047857;">₹${totalPaymentsAmount.toLocaleString("en-IN")}</td>
                <td colspan="3" style="padding: 6px 8px; color: #64748b; font-size: 10px;">${payments.length} Transactions</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ""}

      <!-- Official Verification & Signatures -->
      <div style="border-top: 2px solid #cbd5e1; padding-top: 14px; margin-top: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 9.5px; color: #64748b; line-height: 1.45; max-width: 440px;">
          <strong>Official Declaration:</strong> This statement is an automated electronic settlement record issued by Charvik Staffing Consultancy. For any payroll discrepancies, advance reconciliations, or bank transfer queries, contact our helpline at <strong>+91 9505151527</strong> or email <strong>charvikstaffingconsultancy@gmail.com</strong>.
        </div>
        <div style="text-align: center; border: 1.5px solid #142B4A; border-radius: 8px; padding: 10px 18px; background: #f8fafc; min-width: 190px;">
          <div style="font-size: 10px; font-weight: 800; color: #142B4A; text-transform: uppercase; letter-spacing: 0.05em;">
            CHARVIK STAFFING CONSULTANCY
          </div>
          <div style="height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; font-style: italic;">
            [ Authorized Signatory &amp; Stamp ]
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 3px; margin-top: 2px;">
            Payroll &amp; Operations Dept
          </div>
        </div>
      </div>

    </div>
  `;
}

/**
 * Builds offscreen container and renders PDF blob using html2pdf.js
 */
export async function createSalaryStatementPdfBlob(data: StatementPdfData): Promise<{ blob: Blob; fileName: string }> {
  const fileName = buildSalaryPdfFileName(data.employee.full_name, data.monthLabel);
  const htmlContent = generateSalaryStatementHtml(data);

  // Create temporary container
  const container = document.createElement("div");
  container.id = `temp-pdf-${Date.now()}`;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // Standard A4 width in 96dpi pixels (210mm)
  container.style.background = "#ffffff";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // Wait for any images inside container to finish loading
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(true);
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          })
      )
    );

    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const
      }
    };

    const worker = html2pdf().from(container).set(opt);
    const pdfBlob: Blob = await worker.output("blob");

    return { blob: pdfBlob, fileName };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Triggers direct browser download of the PDF statement
 */
export async function downloadSalaryStatementPdf(data: StatementPdfData): Promise<string> {
  const { blob, fileName } = await createSalaryStatementPdfBlob(data);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 1000);
  return fileName;
}

/**
 * Generates statement PDF and dispatches via native Web Share API (actual PDF file attachment)
 * or falls back to downloading the PDF file and opening WhatsApp.
 */
export async function shareOrSendWhatsAppSalaryStatement(options: {
  data: StatementPdfData;
  targetPhone: string;
}): Promise<{
  method: "native-share" | "whatsapp-web";
  fileName: string;
}> {
  const { data, targetPhone } = options;
  const { blob, fileName } = await createSalaryStatementPdfBlob(data);

  // Always trigger auto-download so the user has the physical PDF file saved
  const blobUrl = URL.createObjectURL(blob);
  const dlLink = document.createElement("a");
  dlLink.href = blobUrl;
  dlLink.download = fileName;
  document.body.appendChild(dlLink);
  dlLink.click();
  setTimeout(() => {
    document.body.removeChild(dlLink);
    URL.revokeObjectURL(blobUrl);
  }, 1500);

  // Summary figures
  const totalSal = data.trips.reduce((a, b) => a + (Number(b.salary) || 0), 0);
  const totalPaid = data.trips.reduce((a, b) => a + (Number(b.advance) || 0), 0);
  const totalDue = data.trips.reduce((a, b) => a + (Number(b.balance_due) || 0), 0);
  const statusStr = totalDue <= 0 ? "✅ FULLY SETTLED" : "⏳ PENDING PAYMENT";

  const messageText = `🌟 *CHARVIK STAFFING CONSULTANCY* 🌟\n📄 *OFFICIAL SALARY STATEMENT (PDF)*\n────────────────────────────\n👤 *Staff Name:* ${data.employee.full_name}\n🆔 *Staff ID:* ${formatEmployeeId(data.employee.employee_code, data.employee.role)}\n💼 *Role:* ${data.employee.role}\n📅 *Billing Cycle:* ${data.monthLabel}\n────────────────────────────\n💰 *Total Salary:* ₹${totalSal.toLocaleString("en-IN")}\n💵 *Total Paid:* ₹${totalPaid.toLocaleString("en-IN")}\n⏳ *Remaining Due:* ₹${totalDue.toLocaleString("en-IN")}\n📊 *Status:* ${statusStr}\n────────────────────────────\n📎 *The official monthly statement PDF has been generated:*\n👉 *"${fileName}"*\n────────────────────────────\n🏢 Charvik Staffing Consultancy | +91 9505151527`;

  // Check if browser supports Web Share API with File sharing (e.g. Android Chrome, iOS Safari)
  const pdfFile = new File([blob], fileName, { type: "application/pdf" });
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `${data.employee.full_name} Salary Statement - ${data.monthLabel}`,
        text: messageText
      });
      return { method: "native-share", fileName };
    } catch (err: any) {
      // User cancelled share dialog or dismissed, fall back to WhatsApp Web
      if (err.name !== "AbortError") {
        console.warn("navigator.share failed, falling back to WhatsApp URL:", err);
      }
    }
  }

  // Fallback: Open WhatsApp with clean summary text pointing to the attached PDF
  const finalPhone = sanitizeWhatsAppNumber(targetPhone);
  const whatsappUrl = finalPhone
    ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(messageText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  window.open(whatsappUrl, "_blank");
  return { method: "whatsapp-web", fileName };
}
