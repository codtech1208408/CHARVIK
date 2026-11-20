import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEmployeeId } from "./employeeCode";
import { CHARVIK_LOGO_BASE64 } from "./charvikLogoData";

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
 * Builds a vector-sharp native PDF document using jsPDF and jspdf-autotable.
 * Guaranteed to never produce a blank screen, never depends on DOM screenshotting,
 * and renders with full high-resolution letterhead, tables, and colors.
 */
export function buildSalaryPdfDoc(data: StatementPdfData): jsPDF {
  const { employee, trips = [], payments = [], monthLabel, staffPhone } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // 1. Official Logo (embedded base64, synchronous & vector-sharp)
  const logoWidth = 62;
  const logoHeight = 17;
  const logoX = (pageWidth - logoWidth) / 2;
  try {
    doc.addImage(CHARVIK_LOGO_BASE64, "PNG", logoX, 8, logoWidth, logoHeight);
  } catch (err) {
    console.warn("Logo embed fallback:", err);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 43, 74);
    doc.text("CHARVIK STAFFING CONSULTANCY", pageWidth / 2, 16, { align: "center" });
  }

  // 2. Tagline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(20, 43, 74);
  doc.text("MANPOWER SOLUTIONS • RECRUITMENT • PAYROLL SUPPORT", pageWidth / 2, 28.5, { align: "center" });

  // 3. Contact Strip
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Phone: 9505151527   |   Email: charvikstaffingconsultancy@gmail.com   |   Web: www.charvikstaffing.com", pageWidth / 2, 33, { align: "center" });

  // 4. Office Address Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, 35.5, contentWidth, 7, 2, 2, "FD");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Office: NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana",
    pageWidth / 2,
    40,
    { align: "center" }
  );

  // 5. Title Ribbon
  doc.setFillColor(20, 43, 74);
  doc.roundedRect(marginX, 45, contentWidth, 9.5, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("MONTHLY SALARY & TRIP SETTLEMENT STATEMENT", marginX + 4, 51.5);
  doc.setFontSize(7.8);
  doc.setTextColor(147, 197, 253);
  doc.text(`Cycle: ${monthLabel}`, pageWidth - marginX - 4, 51.5, { align: "right" });

  // 6. Staff Information Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, 57.5, contentWidth, 18, 2, 2, "FD");

  // Staff Name & ID
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("STAFF NAME:", marginX + 4, 63.5);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.full_name || "-", marginX + 28, 63.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("STAFF ID:", marginX + 95, 63.5);
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text(formatEmployeeId(employee.employee_code, employee.role), marginX + 115, 63.5);

  // Role & Contact
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("STAFF ROLE:", marginX + 4, 71);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.role || "-", marginX + 28, 71);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("CONTACT NO:", marginX + 95, 71);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(staffPhone || employee.phone || "-", marginX + 118, 71);

  // 7. Calculate Financial Totals
  const totalSalary = trips.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
  const totalPaid = trips.reduce((sum, t) => sum + (Number(t.advance) || 0), 0);
  const totalDue = trips.reduce((sum, t) => sum + (Number(t.balance_due) || 0), 0);
  const isSettled = totalDue <= 0 && totalSalary > 0;

  // 8. 3 KPI Financial Cards
  const gap = 3;
  const cardWidth = (contentWidth - gap * 2) / 3;

  // Card 1: Salary Earned (Warm Amber)
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(marginX, 78.5, cardWidth, 14.5, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text("TOTAL SALARY EARNED", marginX + cardWidth / 2, 83, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`₹${totalSalary.toLocaleString("en-IN")}`, marginX + cardWidth / 2, 89.5, { align: "center" });

  // Card 2: Total Paid / Advance (Mint Green)
  const card2X = marginX + cardWidth + gap;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card2X, 78.5, cardWidth, 14.5, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text("TOTAL PAID / ADVANCE", card2X + cardWidth / 2, 83, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(`₹${totalPaid.toLocaleString("en-IN")}`, card2X + cardWidth / 2, 89.5, { align: "center" });

  // Card 3: Net Remaining Due (Rose/Red)
  const card3X = marginX + (cardWidth + gap) * 2;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(card3X, 78.5, cardWidth, 14.5, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(159, 18, 57);
  doc.text("NET REMAINING DUE", card3X + cardWidth / 2, 83, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(totalDue > 0 ? 225 : 4, totalDue > 0 ? 29 : 120, totalDue > 0 ? 72 : 87);
  doc.text(`₹${totalDue.toLocaleString("en-IN")}`, card3X + cardWidth / 2, 89.5, { align: "center" });

  // 9. Records of Trips Table via AutoTable
  const tripRows = trips.map((t, idx) => {
    const d = t.date
      ? t.date.includes("-")
        ? t.date.split("-").reverse().join("/")
        : t.date
      : "-";
    const status = (t.balance_due || 0) <= 0 ? "PAID" : "PENDING";
    return [
      String(idx + 1),
      d,
      t.route_corridor || "-",
      t.vehicle_number || "-",
      `₹${(Number(t.salary) || 0).toLocaleString("en-IN")}`,
      `₹${(Number(t.advance) || 0).toLocaleString("en-IN")}`,
      `₹${(Number(t.balance_due) || 0).toLocaleString("en-IN")}`,
      status
    ];
  });

  const tripFoot = [
    [
      "",
      "TOTALS",
      "",
      "",
      `₹${totalSalary.toLocaleString("en-IN")}`,
      `₹${totalPaid.toLocaleString("en-IN")}`,
      `₹${totalDue.toLocaleString("en-IN")}`,
      `${trips.length} Trips`
    ]
  ];

  autoTable(doc, {
    startY: 96.5,
    margin: { left: marginX, right: marginX },
    head: [["#", "DATE", "ROUTE CORRIDOR", "VEHICLE NO.", "SALARY", "PAID", "DUE", "STATUS"]],
    body: tripRows.length > 0 ? tripRows : [["-", "-", "No trip duty records for this period", "-", "₹0", "₹0", "₹0", "-"]],
    foot: tripRows.length > 0 ? tripFoot : undefined,
    theme: "striped",
    headStyles: {
      fillColor: [20, 43, 74],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left"
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 58 },
      3: { cellWidth: 26, fontStyle: "bold", textColor: [30, 64, 175] },
      4: { halign: "right", cellWidth: 18, fontStyle: "bold" },
      5: { halign: "right", cellWidth: 18, textColor: [4, 120, 87] },
      6: { halign: "right", cellWidth: 18, fontStyle: "bold", textColor: [225, 29, 72] },
      7: { halign: "center", cellWidth: 16 }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 5;

  // 10. Records of Payments Table (if any)
  if (payments.length > 0) {
    const paymentRows = payments.map((p, idx) => {
      const pd = p.payment_date
        ? p.payment_date.includes("-")
          ? p.payment_date.split("-").reverse().join("/")
          : p.payment_date
        : "-";
      return [
        String(idx + 1),
        pd,
        `₹${(Number(p.amount) || 0).toLocaleString("en-IN")}`,
        p.payment_mode || "Cash",
        p.payment_type || "Salary",
        p.notes || "-"
      ];
    });

    const totalDisbursed = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["#", "PAYMENT DATE", "AMOUNT PAID", "MODE", "TYPE", "NOTES"]],
      body: paymentRows,
      foot: [["", "TOTAL DISBURSED", `₹${totalDisbursed.toLocaleString("en-IN")}`, "", "", `${payments.length} Payments`]],
      theme: "striped",
      headStyles: {
        fillColor: [20, 43, 74],
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: "bold"
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 7.2,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 24 },
        2: { halign: "right", cellWidth: 24, fontStyle: "bold", textColor: [4, 120, 87] },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 74 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Check if footer fits on page, else create new page
  if (currentY > 255) {
    doc.addPage();
    currentY = 20;
  }

  // 11. Official Authorization & Stamp
  const sealWidth = 55;
  const sealHeight = 22;
  const sealX = pageWidth - marginX - sealWidth;

  doc.setDrawColor(20, 43, 74);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(sealX, currentY, sealWidth, sealHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(20, 43, 74);
  doc.text("CHARVIK STAFFING CONSULTANCY", sealX + sealWidth / 2, currentY + 4.5, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("[ Authorized Signatory & Stamp ]", sealX + sealWidth / 2, currentY + 11.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Payroll & Operations Dept", sealX + sealWidth / 2, currentY + 18, { align: "center" });

  // 12. Declaration Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const declarationText =
    "Official Declaration: This statement is an electronic settlement record issued by Charvik Staffing Consultancy.\nFor questions or payroll reconciliations, contact helpline: +91 9505151527 | charvikstaffingconsultancy@gmail.com";
  doc.text(declarationText, marginX, currentY + 6);

  return doc;
}

/**
 * Creates the PDF Blob and fileName synchronously and safely using jsPDF
 */
export function createSalaryStatementPdfBlob(data: StatementPdfData): { blob: Blob; fileName: string } {
  const fileName = buildSalaryPdfFileName(data.employee.full_name, data.monthLabel);
  const doc = buildSalaryPdfDoc(data);
  const blob = doc.output("blob");
  return { blob, fileName };
}

/**
 * Triggers direct browser download of the PDF statement
 */
export function downloadSalaryStatementPdf(data: StatementPdfData): string {
  const { blob, fileName } = createSalaryStatementPdfBlob(data);
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
  const { blob, fileName } = createSalaryStatementPdfBlob(data);

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
      if (err.name !== "AbortError") {
        console.warn("navigator.share fallback:", err);
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

/**
 * Generates inline-styled HTML for in-browser visual preview tab inside modal & printSheet
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
            <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 11px;">${idx + 1}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #0f172a; font-size: 11px; white-space: nowrap;">${d}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #0f172a; font-size: 11px;">
              ${t.route_corridor || "-"}
              ${t.service_number ? `<span style="font-size: 9.5px; color: #64748b; display: block; font-family: monospace;">SRV: ${t.service_number}</span>` : ""}
            </td>
            <td style="padding: 6px 8px; font-weight: bold; color: #1e40af; font-size: 11px; font-family: monospace; white-space: nowrap;">${t.vehicle_number || "-"}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #0f172a; font-size: 11px;">₹${(Number(t.salary) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #047857; font-size: 11px;">₹${(Number(t.advance) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: ${t.balance_due > 0 ? '#e11d48' : '#047857'}; font-size: 11px;">₹${(Number(t.balance_due) || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 10px; font-weight: bold;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: ${isPaid ? '#ecfdf5' : '#fff1f2'}; color: ${isPaid ? '#047857' : '#e11d48'}; border: 1px solid ${isPaid ? '#a7f3d0' : '#fecdd3'};">
                ${isPaid ? "PAID" : "DUE"}
              </span>
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="8" style="padding: 14px; text-align: center; color: #64748b; font-style: italic;">
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

  return `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 20px 22px; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Top Letterhead -->
      <div style="display: flex; flex-direction: column; align-items: center; border-bottom: 2.5px solid #142B4A; padding-bottom: 10px; margin-bottom: 12px; text-align: center;">
        <img 
          src="${CHARVIK_LOGO_BASE64}" 
          alt="Charvik Staffing Consultancy" 
          style="height: 52px; max-width: 320px; object-fit: contain; margin-bottom: 6px;" 
        />
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #142B4A; margin-bottom: 4px;">
          MANPOWER SOLUTIONS &bull; RECRUITMENT &bull; PAYROLL SUPPORT
        </div>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 10px; color: #334155; font-weight: 600; margin-bottom: 6px; flex-wrap: wrap;">
          <span>📞 Phone: <strong style="color: #0f172a;">9505151527</strong></span>
          <span>✉️ Email: <strong style="color: #0f172a;">charvikstaffingconsultancy@gmail.com</strong></span>
          <span>🌐 Web: <strong style="color: #0f172a;">www.charvikstaffing.com</strong></span>
        </div>

        <div style="display: inline-block; padding: 3px 12px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 9px; color: #475569; line-height: 1.35; max-width: 720px; background: #f8fafc;">
          <strong>Office:</strong> NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana
        </div>
      </div>

      <!-- Title Strip -->
      <div style="background: #142B4A; color: #ffffff; border-radius: 6px; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">
            MONTHLY SALARY &amp; TRIP SETTLEMENT STATEMENT
          </span>
          <span style="display: block; font-size: 9.5px; color: #93c5fd; font-weight: 600; margin-top: 1px;">
            Cycle: ${monthLabel}
          </span>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #e2e8f0; font-weight: 600;">
          <div>Generated: <strong>${currentDate}</strong></div>
          <div style="font-size: 8.5px; color: #cbd5e1;">Time: ${currentTime}</div>
        </div>
      </div>

      <!-- Staff Details Card -->
      <div style="border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; background: #f8fafc;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <tr>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold; width: 18%;">STAFF NAME:</td>
            <td style="padding: 3px 6px; font-weight: 900; color: #0f172a; font-size: 11.5px; width: 32%;">${employee.full_name}</td>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold; width: 18%;">STAFF ID:</td>
            <td style="padding: 3px 6px; font-weight: 900; font-family: monospace; color: #1e40af; font-size: 11.5px; width: 32%;">
              ${formatEmployeeId(employee.employee_code, employee.role)}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold;">STAFF ROLE:</td>
            <td style="padding: 3px 6px; font-weight: 700; color: #0f172a;">${employee.role}</td>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold;">CONTACT NO:</td>
            <td style="padding: 3px 6px; font-weight: 700; color: #0f172a;">${staffPhone || employee.phone || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold;">PAYMENT STATUS:</td>
            <td style="padding: 3px 6px;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                ${statusLabel}
              </span>
            </td>
            <td style="padding: 3px 6px; color: #64748b; font-weight: bold;">BRANCH / ADDRESS:</td>
            <td style="padding: 3px 6px; font-weight: 600; color: #334155;">${employee.branch || "Hyderabad Central Operations"}</td>
          </tr>
        </table>
      </div>

      <!-- Financial KPI Cards -->
      <div style="display: flex; gap: 8px; margin-bottom: 14px;">
        <div style="flex: 1; padding: 8px 10px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 6px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: #92400e; text-transform: uppercase;">TOTAL SALARY EARNED</div>
          <div style="font-size: 15px; font-weight: 900; color: #1e293b; margin-top: 2px;">₹${totalSalary.toLocaleString("en-IN")}</div>
        </div>
        <div style="flex: 1; padding: 8px 10px; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 6px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: #065f46; text-transform: uppercase;">TOTAL PAID / ADVANCE</div>
          <div style="font-size: 15px; font-weight: 900; color: #047857; margin-top: 2px;">₹${totalPaid.toLocaleString("en-IN")}</div>
        </div>
        <div style="flex: 1; padding: 8px 10px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 6px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: #9f1239; text-transform: uppercase;">NET REMAINING DUE</div>
          <div style="font-size: 15px; font-weight: 900; color: ${totalDue > 0 ? '#e11d48' : '#047857'}; margin-top: 2px;">₹${totalDue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <!-- Trips Table -->
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #142B4A; text-transform: uppercase; margin-bottom: 6px;">
          🚌 RECORDS OF TRIPS &amp; DUTIES (${trips.length} TRIPS)
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; font-size: 10.5px;">
          <thead>
            <tr style="background: #142B4A; color: #ffffff;">
              <th style="padding: 6px 8px; text-align: center; font-size: 9.5px; font-weight: 800; width: 6%;">#</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 14%;">DATE</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 33%;">ROUTE CORRIDOR</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 18%;">VEHICLE NO</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; font-weight: 800; width: 10%;">SALARY</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; font-weight: 800; width: 10%;">PAID</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; font-weight: 800; width: 10%;">DUE</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 9.5px; font-weight: 800; width: 9%;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${tripRowsHtml}
          </tbody>
          ${trips.length > 0 ? `
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                <td colspan="4" style="padding: 6px 8px; text-align: right; font-size: 10.5px; color: #0f172a;">TOTALS:</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 10.5px; color: #0f172a;">₹${totalSalary.toLocaleString("en-IN")}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 10.5px; color: #047857;">₹${totalPaid.toLocaleString("en-IN")}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 10.5px; color: ${totalDue > 0 ? '#e11d48' : '#047857'};">₹${totalDue.toLocaleString("en-IN")}</td>
                <td style="padding: 6px 8px; text-align: center; font-size: 9.5px; color: #64748b;">${trips.length} Duties</td>
              </tr>
            </tfoot>
          ` : ""}
        </table>
      </div>

      <!-- Payments Table -->
      ${payments.length > 0 ? `
        <div style="margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 800; color: #142B4A; text-transform: uppercase; margin-bottom: 6px;">
            💳 DISBURSEMENT &amp; DIRECT PAYMENT RECORDS (${payments.length} PAYMENTS)
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; font-size: 10.5px;">
            <thead>
              <tr style="background: #142B4A; color: #ffffff;">
                <th style="padding: 5px 8px; text-align: center; font-size: 9.5px; font-weight: 800; width: 6%;">#</th>
                <th style="padding: 5px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 16%;">PAYMENT DATE</th>
                <th style="padding: 5px 8px; text-align: right; font-size: 9.5px; font-weight: 800; width: 16%;">AMOUNT PAID</th>
                <th style="padding: 5px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 18%;">MODE</th>
                <th style="padding: 5px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 18%;">TYPE</th>
                <th style="padding: 5px 8px; text-align: left; font-size: 9.5px; font-weight: 800; width: 26%;">NOTES</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                <td colspan="2" style="padding: 5px 8px; text-align: right; font-size: 10.5px; color: #0f172a;">TOTAL DISBURSED:</td>
                <td style="padding: 5px 8px; text-align: right; font-size: 10.5px; color: #047857;">₹${totalPaymentsAmount.toLocaleString("en-IN")}</td>
                <td colspan="3" style="padding: 5px 8px; color: #64748b; font-size: 9.5px;">${payments.length} Payments</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ""}

      <!-- Footer & Stamp -->
      <div style="border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 9px; color: #64748b; line-height: 1.45; max-width: 440px;">
          <strong>Official Declaration:</strong> This statement is an electronic settlement record issued by Charvik Staffing Consultancy. For any queries, contact our helpline at <strong>+91 9505151527</strong> or email <strong>charvikstaffingconsultancy@gmail.com</strong>.
        </div>
        <div style="text-align: center; border: 1.5px solid #142B4A; border-radius: 6px; padding: 8px 16px; background: #f8fafc; min-width: 180px;">
          <div style="font-size: 9.5px; font-weight: 800; color: #142B4A; text-transform: uppercase;">
            CHARVIK STAFFING CONSULTANCY
          </div>
          <div style="height: 28px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; font-style: italic;">
            [ Authorized Signatory &amp; Stamp ]
          </div>
          <div style="font-size: 8.5px; font-weight: 700; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 2px; margin-top: 2px;">
            Payroll &amp; Operations Dept
          </div>
        </div>
      </div>

    </div>
  `;
}
