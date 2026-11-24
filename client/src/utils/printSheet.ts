/**
 * Universal Print Sheet Utility
 * Matches the official Charvik & Vyshnavi reference templates exactly
 */

import { getSavedCharvikCompanyDetails } from './charvikCompanyDetails';

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
    title = 'INVOICE',
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
    .filter((el) => !el.textContent?.includes('visibility: hidden'))
    .map((el) => el.outerHTML)
    .join('\n');

  const timeLabel = new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const comp = getSavedCharvikCompanyDetails();

  const isVyshnavi = Boolean(
    options.companyName?.toLowerCase().includes('vyshnavi') ||
    options.title?.toLowerCase().includes('vyshnavi') ||
    options.subtitle?.toLowerCase().includes('vyshnavi') ||
    (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('vyshnavi'))
  );

  const primaryColor = isVyshnavi ? '#004b93' : '#000000';
  const outerBorder = isVyshnavi ? '2.5px solid #004b93' : '2px solid #000000';
  const logoSrc = isVyshnavi ? '/vyshnavi-logo.png' : '/charvik-invoice-logo.png';
  const logoAlt = isVyshnavi ? 'Vyshnavi Travels' : 'CHARVIK Staffing & Consultancy';
  const companyPhone = isVyshnavi ? '+91 9000202241' : (comp.company_phone || '+91 9505151527');
  const companyEmail = isVyshnavi ? 'vyshnavitravels@yahoo.com' : (comp.company_email || 'charvikstaffingconsultancy@gmail.com');
  const companySignTitle = isVyshnavi ? 'Authorized Signature' : 'Authorized Signatory';
  const noticeCompany = isVyshnavi ? 'Vyshnavi Travels' : 'Charvik Staffing & Consultancy';

  const htmlDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Official Print Document</title>
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
          font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #000000 !important;
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

        .printable-sheet {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          border: ${outerBorder} !important;
          border-radius: 12px !important;
          padding: 14px 18px !important;
          background: #ffffff !important;
          color: #000000 !important;
          min-height: auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          gap: 12px !important;
        }

        /* Table Styling: Crisp Black Grid, White Header, Bold Amounts */
        table, .printable-sheet table, .print-body table {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          border-collapse: collapse !important;
          font-size: 11.5px !important;
          border: 1.5px solid #000000 !important;
          margin-top: 2px !important;
          margin-bottom: 12px !important;
          page-break-inside: auto;
          table-layout: auto !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th {
          background-color: #ffffff !important;
          color: #000000 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 8px 10px !important;
          font-size: 11px !important;
          border: 1px solid #000000 !important;
          text-align: center !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          white-space: nowrap !important;
          box-sizing: border-box !important;
        }
        th.text-left, td.text-left {
          text-align: left !important;
        }
        th.text-center, td.text-center {
          text-align: center !important;
        }
        th.text-right, td.text-right {
          text-align: right !important;
        }
        td {
          padding: 7px 10px !important;
          border: 1px solid #000000 !important;
          vertical-align: middle !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
          line-height: 1.35 !important;
        }
        td[style*="text-align: right"], td[style*="monospace"], td:has(span.font-mono), .tabular-nums {
          font-variant-numeric: tabular-nums;
          font-weight: 800 !important;
          white-space: nowrap !important;
        }
        tfoot tr {
          background-color: #ffffff !important;
          font-weight: 900 !important;
          border-top: 2px solid #000000 !important;
        }
        tfoot td {
          padding: 8px 10px !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          color: #000000 !important;
          border: 1px solid #000000 !important;
          white-space: nowrap !important;
        }

        .print-body {
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
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }

        @media print {
          html, body {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-sheet {
            border: ${outerBorder} !important;
            min-height: auto !important;
            page-break-inside: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .print-notice-signatory, .print-footer-card {
            page-break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="printable-sheet">
        <div>
          <!-- Official Header: Full Brand Logo on Left, Phone & Email on Right with vertical divider -->
          ${!hideHeader ? `
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px;">
            <img
              src="${logoSrc}"
              alt="${logoAlt}"
              style="height: 62px; max-height: 68px; width: auto; max-width: 280px; display: block; object-fit: contain;"
              onerror="this.src='/logo-brand.png'"
            />
            <div style="display: flex; align-items: center;">
              <div style="border-left: 1.5px solid ${primaryColor}; height: 46px; margin: 0 16px;"></div>
              <div style="display: flex; flex-direction: column; gap: 5px; text-align: left;">
                <div style="display: block; font-size: 15px; font-weight: 900; color: ${primaryColor}; line-height: 1.3; white-space: nowrap;">
                  <span style="display: inline-block; font-size: 14px; margin-right: 6px;">📞</span><span>${companyPhone}</span>
                </div>
                <div style="display: block; font-size: 12px; font-weight: 700; color: ${primaryColor}; line-height: 1.3; white-space: nowrap;">
                  <span style="display: inline-block; font-size: 13px; margin-right: 6px;">✉</span><span>${companyEmail}</span>
                </div>
              </div>
            </div>
          </div>
          <div style="border-bottom: 2px solid ${primaryColor}; width: 100%; margin: 4px 0 12px 0;"></div>
          ` : ''}

          <!-- Centered Capsule Pill Banner -->
          <div style="display: flex; justify-content: center; align-items: center; margin: 0 0 12px 0;">
            <div style="background-color: ${primaryColor}; color: #ffffff; text-align: center; padding: 4px 44px; border-radius: 20px; font-weight: 900; font-size: 16px; letter-spacing: 0.12em; text-transform: uppercase;">
              ${title}
            </div>
          </div>

          <!-- Metadata Box Strip -->
          ${!hideMetaBar ? `
          <div style="border: 1.5px solid #000000; border-radius: 6px; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; margin-bottom: 12px; font-size: 11.5px; color: #000000;">
            <div style="font-weight: 700;">
              <span>Statement: <strong>${title}</strong></span>
              ${subtitle ? `<span style="margin-left: 8px;">• ${subtitle}</span>` : ''}
            </div>
            <div style="font-weight: 800; white-space: nowrap;">
              Date: ${dateLabel} &nbsp;|&nbsp; Time: ${timeLabel}
            </div>
          </div>
          ` : ''}

          <!-- Printable Table / Content Body -->
          <div class="print-body" style="width: 100%; max-width: 100%; box-sizing: border-box; margin-bottom: 14px;">
            ${bodyContent}
          </div>

          <!-- Bottom Notice & Signatory -->
          <div class="print-notice-signatory" style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: flex-start; margin-top: 10px; page-break-inside: avoid;">
            <div>
              <div style="font-size: 11px; color: #000000; line-height: 1.45;">
                <div style="font-weight: 900; margin-bottom: 2px;">Notice :</div>
                <div>1. Please settle statement balance before next cycle.</div>
                <div>2. Computer generated statement by ${noticeCompany}.</div>
              </div>
            </div>
            <div style="border-left: 1.5px solid #000000; min-height: 80px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-left: 12px;">
              <div style="width: 200px; border-top: 1.5px solid #000000; margin-bottom: 6px;"></div>
              <div style="font-size: 12px; font-weight: 800; color: #000000; text-align: center;">
                ${companySignTitle}
              </div>
            </div>
          </div>
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
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1024px';
      iframe.style.height = '1440px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
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
        let isPrinted = false;
        const safeTrigger = () => {
          if (!isPrinted) {
            isPrinted = true;
            triggerPrint();
          }
        };
        for (let i = 0; i < totalImgs; i++) {
          if (imgs[i].complete) {
            loadedCount++;
            if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
          } else {
            imgs[i].onload = () => {
              loadedCount++;
              if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
            };
            imgs[i].onerror = () => {
              loadedCount++;
              if (loadedCount === totalImgs) setTimeout(safeTrigger, 200);
            };
          }
        }
        setTimeout(safeTrigger, 500);
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
