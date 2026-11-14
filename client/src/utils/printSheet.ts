/**
 * Universal Print Sheet Utility
 * Matches the official Charvik printed letterhead format shown in image copy 2.png
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
    dateLabel = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
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
          padding: 4px 8px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 1. Top Header Box with outer blue border */
        .charvik-top-header {
          border: 1.5px solid #0056b3;
          border-radius: 6px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          margin-bottom: 4px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header-logo-box {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: 8px;
        }
        .header-logo-box img {
          max-height: 82px;
          max-width: 280px;
          object-fit: contain;
          display: block;
        }
        .header-divider-line {
          width: 1.5px;
          height: 80px;
          background-color: #0056b3;
          margin: 0 24px;
          flex-shrink: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header-contacts-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4.5px;
        }
        .contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .contact-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0056b3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .contact-circle svg {
          display: block !important;
          width: 12px;
          height: 12px;
        }
        .contact-phone-text {
          font-size: 17px;
          font-weight: 800;
          color: #072346;
          letter-spacing: 0.5px;
        }
        .contact-sub-text {
          font-size: 12.5px;
          font-weight: 600;
          color: #072346;
        }

        /* 2. Sub-Header Bar (Light blue fill, dark blue border) */
        .charvik-service-bar {
          border: 1.5px solid #0056b3;
          border-radius: 4px;
          background: #dbeafe !important;
          padding: 5px 12px;
          text-align: center;
          font-size: 10.5px;
          font-weight: 800;
          color: #072346;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 3. Title & Meta Strip Box */
        .charvik-meta-bar {
          border: 1.5px solid #0056b3;
          border-radius: 4px;
          padding: 5.5px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          margin-bottom: 8px;
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

        /* 4. Table Styling matching Image copy 2 */
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

        svg {
          display: inline-block;
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
      <!-- Top Header Container matching Image copy 2 -->
      <div class="charvik-top-header">
        <div class="header-logo-box">
          <img 
            src="/logo.png" 
            alt="CHARVIK STAFFING CONSULTANCY" 
            onerror="this.src='/logo-compact.png'" 
          />
        </div>
        <div class="header-divider-line"></div>
        <div class="header-contacts-box">
          <!-- Phone -->
          <div class="contact-row">
            <span class="contact-circle">
              <svg viewBox="0 0 24 24" fill="white"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.27.36-.66.25-1.02A11.36 11.36 0 0 1 9 5.31c0-.55-.45-1-1-1H4.5c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-.93z"/></svg>
            </span>
            <span class="contact-phone-text">9396151527</span>
          </div>
          <!-- Email -->
          <div class="contact-row">
            <span class="contact-circle">
              <svg viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </span>
            <span class="contact-sub-text">charvikstaffingconsulrancy@gmail.com</span>
          </div>
          <!-- Website -->
          <div class="contact-row">
            <span class="contact-circle">
              <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </span>
            <span class="contact-sub-text">charvikstaffingconsulrancy.in</span>
          </div>
          <!-- Location -->
          <div class="contact-row">
            <span class="contact-circle">
              <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </span>
            <span class="contact-sub-text">Hyderabad, Telangana</span>
          </div>
        </div>
      </div>

      <!-- 2. Sub-Header Bar (Light blue fill, dark blue border) -->
      <div class="charvik-service-bar">
        STAFFING &nbsp;|&nbsp; MANPOWER SOLUTIONS &nbsp;|&nbsp; FLEET MAINTENANCE SUPPORT &nbsp;|&nbsp; OPERATIONAL SERVICES
      </div>

      <!-- 3. Report Title & Meta Strip Box -->
      <div class="charvik-meta-bar">
        <div class="charvik-meta-left">
          <span class="charvik-meta-title">${title}</span>
          ${subtitle ? `<span class="charvik-meta-subtitle">• ${subtitle}</span>` : ''}
        </div>
        <div class="charvik-meta-datetime">
          Date: ${dateLabel} &nbsp;|&nbsp; Time: ${timeLabel}
        </div>
      </div>

      <!-- 4. Printable Table / Body -->
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
      } catch {}
    }, 400);
  } else {
    window.print();
  }
}
