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
  const options: PrintOptions = typeof optionsOrHtml === 'string'
    ? {
        ...(legacyOptions || {}),
        htmlContent: optionsOrHtml,
        title: legacyOptions?.title || 'PAYMENT SLIP'
      }
    : (optionsOrHtml || {} as PrintOptions);

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

    bodyContent = clone.innerHTML;
  }

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
          padding: 4px 6px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 1. Exact Full-Width Letterhead & Sub-Banner matching Image copy 2 */
        .charvik-exact-header-wrap {
          width: 100%;
          margin-bottom: 5px;
        }
        .charvik-exact-header-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* 2. Title & Meta Strip Box */
        .charvik-meta-bar {
          border: 1.5px solid #0056b3;
          border-radius: 3px;
          padding: 4.5px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          margin-bottom: 6px;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .charvik-meta-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .charvik-meta-title {
          font-size: 11.5px;
          font-weight: 900;
          color: #072346;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .charvik-meta-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #072346;
        }
        .charvik-meta-datetime {
          font-size: 10px;
          font-weight: 700;
          color: #072346;
          white-space: nowrap;
        }

        /* 3. Table Styling matching Image copy 2 */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10px !important;
          border: 1.5px solid #0056b3 !important;
          margin-top: 0 !important;
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
          background-color: #072346 !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.4px !important;
          padding: 7px 10px !important;
          font-size: 9.5px !important;
          border: 1px solid #072346 !important;
          text-align: left !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        th.text-center, td.text-center {
          text-align: center !important;
        }
        td {
          padding: 6.5px 10px !important;
          border: 1px solid #93c5fd !important;
          vertical-align: middle !important;
          font-size: 10px !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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
        .printable-sheet {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
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
      <!-- Exact Full-Width Header from Reference Image -->
      ${!hideHeader ? `
      <div class="charvik-exact-header-wrap">
        <img 
          src="/charvik-exact-print-header.png?v=20261115" 
          alt="CHARVIK STAFFING CONSULTANCY" 
          class="charvik-exact-header-img"
          onerror="this.src='/charvik-letterhead-header.png?v=20261115'"
        />
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
      <div class="print-body">
        ${bodyContent}
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
