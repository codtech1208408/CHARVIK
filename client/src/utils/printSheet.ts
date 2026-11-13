/**
 * Universal Print Sheet Utility
 * Generates a clean, professional print-friendly sheet from any HTML table or data section.
 */

interface PrintOptions {
  title: string;
  subtitle?: string;
  dateLabel?: string;
  companyName?: string;
  /** ID of the container/table element to print */
  elementId?: string;
  /** Directly pass HTML content to print */
  htmlContent?: string;
  /** Orientation: 'portrait' or 'landscape' */
  orientation?: 'portrait' | 'landscape';
}

export function printSheet(options: PrintOptions): void {
  const {
    title,
    subtitle = '',
    dateLabel = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
    companyName = 'CHARVIK FLEET MANAGEMENT',
    elementId,
    htmlContent,
    orientation = 'landscape'
  } = options;

  let bodyContent = '';

  if (htmlContent) {
    bodyContent = htmlContent;
  } else if (elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
      alert(`No data found to print for section: ${title}`);
      return;
    }
    // Clone the element and remove action buttons, search bars, pagination
    const clone = el.cloneNode(true) as HTMLElement;
    
    // Remove unwanted UI elements
    clone.querySelectorAll('button, .no-print, [data-no-print], input, select').forEach(node => node.remove());
    
    // Remove the last <th> and <td> in each row if it's an "Actions" column
    const headerRow = clone.querySelector('thead tr');
    if (headerRow) {
      const ths = Array.from(headerRow.querySelectorAll('th'));
      const actionIndex = ths.findIndex(th => th.textContent?.trim().toLowerCase().includes('action'));
      if (actionIndex !== -1) {
        ths[actionIndex].remove();
        clone.querySelectorAll('tbody tr').forEach(row => {
          const tds = row.querySelectorAll('td');
          if (tds[actionIndex]) tds[actionIndex].remove();
        });
      }
    }

    bodyContent = clone.innerHTML;
  }

  const htmlDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Print Sheet</title>
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 6mm 8mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          color: #0f172a;
          font-size: 11px;
          line-height: 1.4;
          background: #ffffff;
          padding: 6px 12px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .charvik-letterhead-header {
          width: 100%;
          margin-bottom: 10px;
        }
        .charvik-letterhead-header img {
          width: 100%;
          height: auto;
          display: block;
        }
        .print-meta-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #142B4A;
          padding: 6px 12px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .print-meta-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .report-title {
          font-size: 13px;
          font-weight: 900;
          color: #142B4A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .report-subtitle {
          font-size: 10.5px;
          color: #475569;
          font-weight: 600;
        }
        .report-date {
          font-size: 10px;
          color: #475569;
          font-weight: 700;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10.5px !important;
          margin-top: 6px;
          page-break-inside: auto;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th {
          background-color: #142B4A !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 8px 10px !important;
          text-align: left !important;
          font-size: 9.5px !important;
          border: 1px solid #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        td {
          padding: 7px 10px !important;
          border: 1px solid #cbd5e1 !important;
          vertical-align: middle !important;
          font-size: 10px !important;
          color: #1e293b !important;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        svg {
          display: none !important;
        }
        .badge, [class*="rounded-full"], [class*="rounded-lg"] {
          border: 1px solid #94a3b8 !important;
          background: #f1f5f9 !important;
          color: #0f172a !important;
          padding: 2px 6px !important;
          font-weight: 600 !important;
          font-size: 9px !important;
          display: inline-block;
          border-radius: 4px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-footer-container {
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .print-footer-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 8px;
          font-size: 10px;
          color: #64748b;
        }
        .signature-line {
          border-top: 1.5px solid #0f172a;
          width: 190px;
          text-align: center;
          padding-top: 5px;
          font-size: 10px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .charvik-letterhead-footer img {
          width: 100%;
          height: auto;
          display: block;
        }
        @media print {
          body {
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Official Charvik Letterhead Header (Image from Template) -->
      <div class="charvik-letterhead-header">
        <img 
          src="/charvik-letterhead-header.png" 
          alt="CHARVIK STAFFING CONSULTANCY" 
          onerror="this.src='/logo-compact-wide.png'"
        />
      </div>

      <!-- Report Metadata Strip -->
      <div class="print-meta-strip">
        <div class="print-meta-left">
          <span class="report-title">${title}</span>
          ${subtitle ? `<span class="report-subtitle">• ${subtitle}</span>` : ''}
        </div>
        <div class="report-date">
          <span>Date: ${dateLabel}</span>
          <span style="margin: 0 6px; color: #94a3b8;">|</span>
          <span>Time: ${new Date().toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      <!-- Printable Body Content with Translucent Watermark -->
      <div class="print-body" style="position: relative; min-height: 400px;">
        <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 340px; opacity: 0.04; pointer-events: none; z-index: 0;">
          <img src="/logo.png" style="width: 100%; display: block;" alt="Watermark" />
        </div>
        <div style="position: relative; z-index: 1;">
          ${bodyContent}
        </div>
      </div>

      <!-- Official Charvik Letterhead Footer (Curved Swooshes) -->
      <div class="print-footer-container">
        <div class="print-footer-info">
          <div>
            <p style="font-weight: 800; color: #142B4A; text-transform: uppercase;">CHARVIK STAFFING CONSULTANCY</p>
            <p>Official Fleet Operations & Staffing Record &bull; Computer Generated</p>
          </div>
          <div class="signature-line">
            Authorized Signatory / Seal
          </div>
        </div>
        <div class="charvik-letterhead-footer">
          <img 
            src="/charvik-letterhead-footer.png" 
            alt="Charvik Footer" 
          />
        </div>
      </div>
    </body>
    </html>
  `;

  // Prefer hidden iframe printing so modern browsers never block pop-ups
  try {
    let iframe = document.getElementById('charvik-universal-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'charvik-universal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlDoc);
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
      return;
    }
  } catch (e) {
    console.warn('Iframe print error, falling back to window.open', e);
  }

  // Fallback to window.open if iframe is blocked by security context
  const printWindow = window.open('', '_blank', 'width=1200,height=850');
  if (printWindow) {
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {}
    }, 400);
  } else {
    window.print();
  }
}
