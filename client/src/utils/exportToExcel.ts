/**
 * Universal Excel / CSV Exporter for Charvik tables
 * Generates an Excel-ready CSV with UTF-8 BOM so native Microsoft Excel,
 * Google Sheets, and LibreOffice open it flawlessly with proper column alignment.
 */

export interface ExportExcelOptions {
  /** ID of the table or container element to extract from */
  elementId?: string;
  /** Explicit title of the report */
  title: string;
  /** Subtitle or summary metrics */
  subtitle?: string;
  /** Filename without extension (defaults to sanitized title) */
  filename?: string;
  /** Optional custom headers if bypassing DOM */
  headers?: string[];
  /** Optional custom data rows if bypassing DOM */
  rows?: (string | number)[][];
}

export function exportTableToExcel(options: ExportExcelOptions): void {
  const { elementId, title, subtitle, filename, headers: directHeaders, rows: directRows } = options;

  let finalHeaders: string[] = [];
  let finalRows: string[][] = [];

  if (directHeaders && directRows) {
    finalHeaders = directHeaders;
    finalRows = directRows.map((r) => r.map((cell) => String(cell ?? '')));
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

      const rowData: string[] = [];
      tds.forEach((td, idx) => {
        if (actionIndices.has(idx)) return;
        if (td.classList.contains('no-print') || td.getAttribute('data-no-print') !== null) return;

        // Clone cell to strip interactive buttons or badges before reading text
        const cellClone = td.cloneNode(true) as HTMLElement;
        cellClone.querySelectorAll('button, .no-print, [data-no-print], svg').forEach((el) => el.remove());

        // Clean inner text (remove newlines, collapse spaces)
        let cellText = (cellClone.innerText || cellClone.textContent || '')
          .replace(/\r?\n|\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // If cell has leading + or - or = that could trigger formula injection in Excel, sanitize
        if (cellText.startsWith('=') || cellText.startsWith('+')) {
          cellText = `'${cellText}`;
        }

        rowData.push(cellText);
      });

      if (rowData.some((c) => c.length > 0)) {
        finalRows.push(rowData);
      }
    });
  }

  if (finalHeaders.length === 0 && finalRows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const colCount = Math.max(finalHeaders.length, 1);
  const padRow = (firstCell: string) => {
    const row = [firstCell];
    for (let i = 1; i < colCount; i++) row.push('""');
    return row.join(',');
  };

  // Construct Excel CSV with Official Charvik Header Block
  const csvLines: string[] = [];
  csvLines.push(padRow('"CHARVIK STAFFING CONSULTANCY"'));
  csvLines.push(padRow('"STAFFING | MANPOWER SOLUTIONS | FLEET MAINTENANCE SUPPORT | OPERATIONAL SERVICES"'));
  csvLines.push(padRow(`"${title.replace(/"/g, '""')}"`));
  if (subtitle) {
    csvLines.push(padRow(`"${subtitle.replace(/"/g, '""')}"`));
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
  csvLines.push(padRow(`"Export Date: ${dateStr} | Time: ${timeStr}"`));
  csvLines.push(padRow('""')); // Blank separator row

  // Add Table Headers
  csvLines.push(finalHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Add Table Rows
  finalRows.forEach((row) => {
    // Ensure row matches colCount
    const rowCells = [...row];
    while (rowCells.length < colCount) rowCells.push('');
    csvLines.push(rowCells.map((val) => `"${val.replace(/"/g, '""')}"`).join(','));
  });

  // UTF-8 BOM prefix '\uFEFF' ensures Microsoft Excel opens unicode characters and text without mojibake
  const csvBlob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  const safeName = (filename || title)
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

