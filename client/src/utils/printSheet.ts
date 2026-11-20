/**
 * Universal Print Sheet Utility
 * Matches the official Charvik printed letterhead format with enclosed rounded banner
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
  /** Set to true to hide the outer boxed title & meta strip (used for slips and vouchers) */
  hideMetaBar?: boolean;
  /** Set to true to omit top letterhead banner (if the printable element already contains it) */
  hideHeader?: boolean;
}

export function printSheet(optionsOrHtml: PrintOptions | string, legacyOptions?: any): void {
  let options: PrintOptions;

  if (typeof optionsOrHtml === 'string') {
    // Check if optionsOrHtml is an element ID present in the DOM
    const isElement = typeof document !== 'undefined' && !!document.getElementById(optionsOrHtml);
    const titleStr = typeof legacyOptions === 'string'
      ? legacyOptions
      : (legacyOptions?.title || 'OFFICIAL REPORT');

    options = {
      ...(typeof legacyOptions === 'object' ? legacyOptions : {}),
      elementId: isElement ? optionsOrHtml : undefined,
      htmlContent: isElement ? undefined : optionsOrHtml,
      title: titleStr
    };
  } else {
    options = optionsOrHtml || ({} as PrintOptions);
  }

  const {
    title = 'PAYMENT SLIP',
    subtitle = '',
    dateLabel = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    elementId,
    htmlContent,
    orientation = 'portrait',
    hideMetaBar = false,
    hideHeader = false
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
    clone
      .querySelectorAll('button, .no-print, [data-no-print], input, select')
      .forEach((node) => node.remove());

    // Remove the last <th> and <td> in each row if it's an "Actions" column
    const headerRow = clone.querySelector('thead tr') || clone.querySelector('tr');
    if (headerRow) {
      const ths = Array.from(headerRow.querySelectorAll('th, td'));
      const actionIndex = ths.findIndex((th) =>
        th.textContent?.trim().toLowerCase().includes('action')
      );
      if (actionIndex !== -1) {
        ths[actionIndex].remove();
        clone.querySelectorAll('tbody tr').forEach((row) => {
          const tds = row.querySelectorAll('td');
          if (tds[actionIndex]) tds[actionIndex].remove();
        });
      }
    }

    // Reset inline min-width to prevent table or container horizontal overflow
    clone.querySelectorAll('*').forEach((node) => {
      const htmlEl = node as HTMLElement;
      if (htmlEl.style && htmlEl.style.minWidth) {
        htmlEl.style.minWidth = '0';
      }
    });

    // If the target element is a table or already a printable sheet, keep outerHTML
    const tag = clone.tagName.toLowerCase();
    if (tag === 'table' || clone.classList.contains('printable-sheet')) {
      bodyContent = clone.outerHTML;
    } else {
      bodyContent = clone.innerHTML;
    }
  }

  // Collect page styles to preserve fonts, icons, and tailwind utilities
  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  const timeLabel = new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const htmlDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Official Print Sheet</title>
      ${existingStyles}
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 5mm 6mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box !important;
        }
        html, body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          color: #0f172a;
          font-size: 11.5px;
          line-height: 1.35;
          background: #ffffff;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 1. Official Enclosed Charvik Letterhead Container (High-Resolution Vector Format) */
        .charvik-letterhead-container {
          border: 2px solid #0056b3;
          border-radius: 12px;
          padding: 8px 14px 10px;
          margin-bottom: 8px;
          text-align: center;
          background: #ffffff;
          box-sizing: border-box !important;
          width: 100% !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .charvik-letterhead-logo-row {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2px;
        }
        .charvik-brand-logo {
          height: 56px !important;
          max-height: 60px !important;
          width: auto !important;
          max-width: 320px !important;
          object-fit: contain !important;
          display: block;
          margin: 0 auto;
        }
        .charvik-letterhead-tagline {
          font-size: 11px;
          font-weight: 800;
          color: #00448a;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 3px;
          margin-bottom: 6px;
          text-align: center;
          line-height: 1.3;
        }
        .charvik-letterhead-contacts {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 14px;
          font-size: 11.5px;
          font-weight: 700;
          color: #000000;
          margin-bottom: 6px;
          letter-spacing: 0.2px;
          line-height: 1.35;
        }
        .charvik-contact-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .charvik-contact-label {
          color: #0056b3;
          font-weight: 800;
        }
        .charvik-contact-val {
          color: #000000;
          font-weight: 700;
        }
        .charvik-contact-sep {
          color: #0056b3;
          font-weight: 900;
          font-size: 13px;
        }
        .charvik-letterhead-address-pill {
          display: inline-block;
          border: 1.5px solid #0056b3;
          border-radius: 6px;
          padding: 3px 14px;
          font-size: 10.5px;
          font-weight: 600;
          color: #000000;
          background: #f8fafc;
          max-width: 98%;
          line-height: 1.4;
          margin: 0 auto;
          box-sizing: border-box !important;
        }
        .charvik-address-label {
          color: #0056b3;
          font-weight: 800;
          margin-right: 4px;
        }

        /* 2. Title & Meta Strip Box */
        .charvik-meta-bar {
          border: 1.5px solid #0056b3;
          border-radius: 4px;
          padding: 5px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          margin-bottom: 8px;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .charvik-meta-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .charvik-meta-title {
          font-size: 12px;
          font-weight: 900;
          color: #072346;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .charvik-meta-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
        }
        .charvik-meta-datetime {
          font-size: 10.5px;
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
        }

        /* 3. Table Styling: Zero Right-Side Overflow, Bold Crisp Readable Text & Numbers */
        table, .printable-sheet table, .print-body table {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          border-collapse: collapse !important;
          font-size: 12px !important;
          border: 1.5px solid #072346 !important;
          margin-top: 2px !important;
          margin-bottom: 12px !important;
          page-break-inside: auto;
          table-layout: auto !important;
          box-sizing: border-box !important;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th {
          background-color: #072346 !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.4px !important;
          padding: 8px 10px !important;
          font-size: 11px !important;
          border: 1px solid #072346 !important;
          text-align: left !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          word-break: normal !important;
          white-space: nowrap !important;
          box-sizing: border-box !important;
        }
        th.text-center, td.text-center {
          text-align: center !important;
        }
        th.text-right, td.text-right {
          text-align: right !important;
        }
        td {
          padding: 8px 10px !important;
          border: 1px solid #cbd5e1 !important;
          vertical-align: middle !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
          line-height: 1.35 !important;
        }
        /* Numeric columns & currencies stay bold, clear, and on one line */
        td[style*="text-align: right"], td[style*="monospace"], td[style*="font-family"], td:has(span.font-mono), .tabular-nums {
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          white-space: nowrap !important;
          font-size: 12.5px !important;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        tfoot tr {
          background-color: #f1f5f9 !important;
          font-weight: 900 !important;
          border-top: 2px solid #072346 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        tfoot td {
          padding: 9px 10px !important;
          font-size: 13px !important;
          font-weight: 900 !important;
          color: #072346 !important;
          white-space: nowrap !important;
        }
          vertical-align: middle !important;
          font-size: 9px !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
          box-sizing: border-box !important;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        a, td [class*="text-blue"], td [class*="text-indigo"] {
          color: #1d4ed8 !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }

        /* 4. Cloned Sheets & Modals Styling */
        .printable-sheet, .print-body {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        [class*="min-w-"] {
          min-width: 0 !important;
        }
        .whitespace-nowrap {
          white-space: normal !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }

        @media print {
          body {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .charvik-letterhead-container {
            border: 2px solid #0056b3 !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
          }
          .charvik-letterhead-tagline {
            color: #00448a !important;
            font-weight: 800 !important;
          }
          .charvik-letterhead-contacts, .charvik-contact-val {
            color: #000000 !important;
            font-weight: 700 !important;
          }
          .charvik-contact-label, .charvik-contact-sep, .charvik-address-label {
            color: #0056b3 !important;
            font-weight: 800 !important;
          }
          .charvik-letterhead-address-pill {
            border: 1.5px solid #0056b3 !important;
            color: #000000 !important;
            background: #f8fafc !important;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="printable-sheet" style="width: 100%; max-width: 100%; box-sizing: border-box;">
        <!-- Official Enclosed Charvik Letterhead Header (Crisp Vector Quality & Correct Hyderabad Contact Details) -->
        ${!hideHeader ? `
        <div class="charvik-letterhead-container">
          <div class="charvik-letterhead-logo-row">
            <img 
              src="/charvik-print-logo.png?v=20261120_print" 
              alt="CHARVIK STAFFING CONSULTANCY" 
              class="charvik-brand-logo"
              onerror="this.src='/logo-brand.png'" 
            />
          </div>
          <div class="charvik-letterhead-tagline">
            Manpower Solutions &nbsp;•&nbsp; Recruitment &nbsp;•&nbsp; Payroll Support
          </div>
          <div class="charvik-letterhead-contacts">
            <span class="charvik-contact-item">
              <span class="charvik-contact-label">Phone:</span>
              <span class="charvik-contact-val">9505151527</span>
            </span>
            <span class="charvik-contact-sep">•</span>
            <span class="charvik-contact-item">
              <span class="charvik-contact-label">Email:</span>
              <span class="charvik-contact-val">charvikstaffingconsultancy@gmail.com</span>
            </span>
            <span class="charvik-contact-sep">•</span>
            <span class="charvik-contact-item">
              <span class="charvik-contact-label">Web:</span>
              <span class="charvik-contact-val">www.charvikstaffing.com</span>
            </span>
          </div>
          <div class="charvik-letterhead-address-pill">
            <span class="charvik-address-label">Office:</span>
            <span>NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana</span>
          </div>
        </div>
        ` : ''}

        <!-- Title & Meta Strip Box -->
        ${!hideMetaBar ? `
        <div class="charvik-meta-bar">
          <div class="charvik-meta-left">
            <span class="charvik-meta-title">${title}</span>
            ${subtitle ? `<span class="charvik-meta-subtitle">• ${subtitle}</span>` : ''}
          </div>
          <div class="charvik-meta-datetime">
            Date: ${dateLabel} &nbsp;|&nbsp; Time: ${timeLabel}
          </div>
        </div>
        ` : ''}

        <!-- Printable Table / Body -->
        <div class="print-body" style="width: 100%; max-width: 100%; box-sizing: border-box;">
          ${bodyContent}
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
      } catch { }
    }, 400);
  } else {
    window.print();
  }
}
