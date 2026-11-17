import * as XLSX from 'xlsx';

export interface ExportExcelOptions {
  /** ID of the table or container element to extract from */
  elementId?: string;
  /** Explicit title of the report */
  title: string;
  /** Subtitle or summary metrics */
  subtitle?: string;
  /** Filename without extension (defaults to sanitized title) */
  filename?: string;
  /** Sheet name inside the workbook (max 31 chars) */
  sheetName?: string;
  /** Optional custom headers if bypassing DOM */
  headers?: string[];
  /** Optional custom data rows if bypassing DOM */
  rows?: (string | number | null | undefined)[][];
}

export interface MultiSheetExportOptions {
  filename?: string;
  sheets: {
    sheetName: string;
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number | null | undefined)[][];
  }[];
}

/**
 * Builds a single professionally formatted Worksheet with Charvik letterhead,
 * left-aligned text, unit formatting, and auto-fit column widths.
 */
export function buildFormattedWorksheet(params: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}): XLSX.WorkSheet {
  const { title, subtitle, headers: finalHeaders, rows: finalRows } = params;
  const colCount = Math.max(finalHeaders.length, 1);

  // Build the 2D Array of Sheet data:
  const wsData: any[][] = [];
  wsData.push(['CHARVIK STAFFING CONSULTANCY']);
  wsData.push(['STAFFING | MANPOWER SOLUTIONS | FLEET MAINTENANCE SUPPORT | OPERATIONAL SERVICES']);
  wsData.push(['NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana | Phone: 9505151527 | Email: charvikstaffingconsulrancy@gmail.com']);
  wsData.push([title]);

  let metaRowIdx = 4;
  if (subtitle) {
    wsData.push([subtitle]);
    metaRowIdx++;
  }

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  wsData.push([`Export Date: ${dateStr} | Time: ${timeStr}`]);
  wsData.push([]); // Empty spacing row

  // Table Headers row index
  const headerRowIdx = wsData.length;
  wsData.push(finalHeaders);

  // Table Data rows - Format every cell value cleanly so sequence and alignment are 100% perfect
  finalRows.forEach((row) => {
    const formattedRow: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const val = row[c];
      const hLower = String(finalHeaders[c] || '').toLowerCase();

      if (val === null || val === undefined || val === '') {
        formattedRow.push('—');
      } else if (typeof val === 'number') {
        if (
          hLower.includes('amount') ||
          hLower.includes('cost') ||
          hLower.includes('salary') ||
          hLower.includes('rate') ||
          hLower.includes('due') ||
          hLower.includes('balance') ||
          (hLower.includes('total') && (hLower.includes('rs') || hLower.includes('inr') || hLower.includes('price') || hLower.includes('amount') || hLower.includes('spend')))
        ) {
          formattedRow.push(`₹ ${val.toLocaleString('en-IN')}`);
        } else if (hLower.includes('km') || hLower.includes('odometer') || hLower.includes('distance')) {
          formattedRow.push(`${val.toLocaleString('en-IN')} KM`);
        } else if (hLower.includes('seating') || hLower.includes('capacity')) {
          formattedRow.push(`${val} Seats`);
        } else if (hLower.includes('count') && hLower.includes('staff')) {
          formattedRow.push(`${val} Staff`);
        } else if (hLower.includes('complaint')) {
          formattedRow.push(`${val} Complaints`);
        } else if (hLower.includes('issues')) {
          formattedRow.push(`${val} Issues`);
        } else if (hLower.includes('tasks')) {
          formattedRow.push(`${val} Tasks`);
        } else {
          formattedRow.push(String(val));
        }
      } else {
        const strVal = String(val).trim();
        formattedRow.push(strVal || '—');
      }
    }
    wsData.push(formattedRow);
  });

  // Convert to Excel Worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Configure cell merges for the top branding/letterhead rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } }
  ];
  if (subtitle) {
    ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: colCount - 1 } });
  }
  ws['!merges'].push({ s: { r: metaRowIdx, c: 0 }, e: { r: metaRowIdx, c: colCount - 1 } });

  // Calculate Auto-Column Widths to completely prevent text overlapping or cutoffs:
  const colWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    const headerLen = String(finalHeaders[c] || '').length;
    let maxCellLen = 0;
    for (let r = 0; r < finalRows.length; r++) {
      const cellVal = String(finalRows[r]?.[c] ?? '');
      if (cellVal.length > maxCellLen) {
        maxCellLen = cellVal.length;
      }
    }

    // Generous base width with padding
    let width = Math.max(headerLen, maxCellLen) + 6;

    // Specific domain keywords that need extra breathing room
    const hLower = String(finalHeaders[c] || '').toLowerCase();
    if (hLower.includes('date') || hLower.includes('time')) width = Math.max(width, 20);
    if (hLower.includes('phone') || hLower.includes('mobile') || hLower.includes('contact')) width = Math.max(width, 20);
    if (hLower.includes('bus') || hLower.includes('vehicle') || hLower.includes('registration')) width = Math.max(width, 22);
    if (hLower.includes('chassis') || hLower.includes('engine')) width = Math.max(width, 24);
    if (hLower.includes('route') || hLower.includes('corridor') || hLower.includes('city') || hLower.includes('location')) width = Math.max(width, 26);
    if (hLower.includes('name') || hLower.includes('client') || hLower.includes('party') || hLower.includes('vendor') || hLower.includes('manager') || hLower.includes('driver')) width = Math.max(width, 24);
    if (hLower.includes('amount') || hLower.includes('cost') || hLower.includes('rate') || hLower.includes('salary') || hLower.includes('total') || hLower.includes('balance') || hLower.includes('due')) width = Math.max(width, 18);
    if (hLower.includes('status')) width = Math.max(width, 18);
    if (hLower.includes('license') || hLower.includes('aadhaar') || hLower.includes('pan') || hLower.includes('gst')) width = Math.max(width, 22);
    if (hLower.includes('account') || hLower.includes('ifsc') || hLower.includes('bank') || hLower.includes('upi')) width = Math.max(width, 24);
    if (hLower.includes('desc') || hLower.includes('remark') || hLower.includes('notes') || hLower.includes('address') || hLower.includes('complaint')) width = Math.max(width, 38);

    // Hard bounds: min 14, max 70
    width = Math.min(Math.max(width, 14), 70);
    colWidths.push(width);
  }
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  // Enforce explicit Text cell type for all data cells
  // Keeps all text and numbers left-aligned directly below their column headers,
  // prevents scientific notation (8.52E+09) and '########'
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = headerRowIdx + 1; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell || cell.v === undefined || cell.v === null) continue;

      cell.t = 's'; // Force string type in Excel (ensures left-alignment with column headers)
      cell.v = String(cell.v);
      cell.z = '@'; // Explicit text format
    }
  }

  return ws;
}

/**
 * Universal High-Definition Excel (.xlsx) Exporter for Charvik tables.
 * Generates true Microsoft Excel Workbooks (.xlsx) with:
 *  - Auto-calculated generous column widths (no text truncation or overlap)
 *  - Text format enforcement for phone numbers, UTRs, account numbers, and dates (prevents 8.52E+09 and ########)
 *  - Merged official Charvik letterhead banner
 *  - Clean sequence and cell alignment
 */
export function exportTableToExcel(options: ExportExcelOptions): void {
  const { elementId, title, subtitle, filename, sheetName, headers: directHeaders, rows: directRows } = options;

  let finalHeaders: string[] = [];
  let finalRows: (string | number)[][] = [];

  if (directHeaders && directRows) {
    finalHeaders = directHeaders;
    finalRows = directRows.map((r) => r.map((cell) => cell ?? ''));
  } else if (elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
      alert(`No data found to export for: ${title}`);
      return;
    }

    const table = el.tagName.toLowerCase() === 'table' ? el : el.querySelector('table');
    if (!table) {
      alert(`No table found inside container: ${elementId}`);
      return;
    }

    // Extract headers
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
    const actionIndices = new Set<number>();

    if (headerRow) {
      const ths = Array.from(headerRow.querySelectorAll('th, td'));
      ths.forEach((th, idx) => {
        const text = (th.textContent || '').replace(/\s+/g, ' ').trim();
        if (
          text.toLowerCase().includes('action') ||
          text.toLowerCase().includes('proof') ||
          th.classList.contains('no-print') ||
          th.getAttribute('data-no-print') !== null
        ) {
          actionIndices.add(idx);
        } else {
          finalHeaders.push(text || `Column ${idx + 1}`);
        }
      });
    }

    // Extract body rows
    const tbody = table.querySelector('tbody') || table;
    const trs = Array.from(tbody.querySelectorAll('tr'));
    trs.forEach((tr) => {
      // Skip header row if tbody included it
      if (tr.parentElement?.tagName.toLowerCase() === 'thead') return;
      if (tr.classList.contains('no-print') || tr.getAttribute('data-no-print') !== null) return;

      const tds = Array.from(tr.querySelectorAll('td'));
      // Check if it's an empty state row (colSpan)
      if (tds.length === 1 && (tds[0].colSpan > 1 || !tds[0].textContent?.trim())) {
        return;
      }
      if (tds.length === 0) return;

      const rowData: (string | number)[] = [];
      tds.forEach((td, idx) => {
        if (actionIndices.has(idx)) return;
        if (td.classList.contains('no-print') || td.getAttribute('data-no-print') !== null) return;

        // Clone cell to strip interactive buttons or badges before reading text
        const cellClone = td.cloneNode(true) as HTMLElement;
        cellClone.querySelectorAll('button, .no-print, [data-no-print], svg').forEach((elem) => elem.remove());

        // Clean inner text (remove newlines, collapse spaces)
        const cellText = (cellClone.innerText || cellClone.textContent || '')
          .replace(/\r?\n|\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        rowData.push(cellText);
      });

      if (rowData.some((c) => String(c).length > 0)) {
        finalRows.push(rowData);
      }
    });
  }

  if (finalHeaders.length === 0 && finalRows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const ws = buildFormattedWorksheet({
    title,
    subtitle,
    headers: finalHeaders,
    rows: finalRows
  });

  // Create Workbook and save as real .xlsx
  const wb = XLSX.utils.book_new();
  const safeSheetName = (sheetName || title || 'Sheet1')
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const safeFileName = (filename || title)
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const dateSuffix = new Date().toISOString().split('T')[0];

  XLSX.writeFile(wb, `${safeFileName}_${dateSuffix}.xlsx`);
}

/**
 * Universal Multi-Sheet High-Definition Excel (.xlsx) Exporter
 */
export function exportMultiSheetExcel(options: MultiSheetExportOptions): void {
  const { filename, sheets } = options;
  if (!sheets || sheets.length === 0) {
    alert('No sheets to export.');
    return;
  }

  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet, idx) => {
    const ws = buildFormattedWorksheet({
      title: sheet.title,
      subtitle: sheet.subtitle,
      headers: sheet.headers,
      rows: sheet.rows
    });

    const safeSheetName = (sheet.sheetName || `Sheet${idx + 1}`)
      .replace(/[\\/*?:[\]]/g, '')
      .slice(0, 31);

    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  const safeFileName = (filename || 'Report')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const dateSuffix = new Date().toISOString().split('T')[0];

  XLSX.writeFile(wb, `${safeFileName}_${dateSuffix}.xlsx`);
}
