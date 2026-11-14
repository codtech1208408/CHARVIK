import React from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
import { printSheet } from '../../utils/printSheet';
import { exportTableToExcel } from '../../utils/exportToExcel';

export interface PrintButtonProps {
  title: string;
  subtitle?: string;
  targetId?: string;
  onPrint?: () => void;
  onExportExcel?: () => void;
  showExcel?: boolean;
  className?: string;
  excelClassName?: string;
  orientation?: 'portrait' | 'landscape';
  label?: string;
  excelLabel?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  title,
  subtitle,
  targetId,
  onPrint,
  onExportExcel,
  showExcel = true,
  className = '',
  excelClassName = '',
  orientation = 'landscape',
  label = 'Print Sheet',
  excelLabel = 'Export Excel'
}) => {
  const handlePrintClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPrint) {
      onPrint();
      return;
    }
    if (targetId) {
      printSheet({
        title,
        subtitle,
        elementId: targetId,
        orientation
      });
    } else {
      window.print();
    }
  };

  const handleExcelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExportExcel) {
      onExportExcel();
      return;
    }
    if (targetId) {
      exportTableToExcel({
        elementId: targetId,
        title,
        subtitle
      });
    }
  };

  return (
    <div className="inline-flex items-center gap-2 no-print">
      {showExcel && (
        <button
          type="button"
          onClick={handleExcelClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs shadow-2xs transition-all hover:border-emerald-400 cursor-pointer ${excelClassName}`}
          title={`Export ${title} to Excel`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{excelLabel}</span>
        </button>
      )}
      <button
        type="button"
        onClick={handlePrintClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all hover:border-slate-400 cursor-pointer ${className}`}
        title={`Print ${title}`}
      >
        <Printer className="w-3.5 h-3.5 text-blue-600" />
        <span>{label}</span>
      </button>
    </div>
  );
};
