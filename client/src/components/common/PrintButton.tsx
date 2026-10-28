import React from 'react';
import { Printer } from 'lucide-react';
import { printSheet } from '../../utils/printSheet';

interface PrintButtonProps {
  title: string;
  subtitle?: string;
  targetId?: string;
  onPrint?: () => void;
  className?: string;
  orientation?: 'portrait' | 'landscape';
  label?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  title,
  subtitle,
  targetId,
  onPrint,
  className = '',
  orientation = 'landscape',
  label = 'Print Sheet'
}) => {
  const handleClick = (e: React.MouseEvent) => {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all hover:border-slate-400 cursor-pointer no-print ${className}`}
      title={`Print ${title}`}
    >
      <Printer className="w-3.5 h-3.5 text-blue-600" />
      <span>{label}</span>
    </button>
  );
};
