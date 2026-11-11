import React from 'react';

export interface StatusToggleProps {
  value: 'Active' | 'Inactive' | string;
  onChange: (value: 'Active' | 'Inactive') => void;
  label?: string;
  required?: boolean;
  className?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  helpText?: string;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  value,
  onChange,
  label = 'Status',
  required = false,
  className = '',
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  helpText,
}) => {
  const isActive = value === 'Active';
  const isInactive = value === 'Inactive';

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Option */}
        <button
          type="button"
          onClick={() => onChange('Active')}
          className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl transition-all cursor-pointer ${
            isActive
              ? 'border-2 border-[#10b981] bg-[#ecfdf5] text-[#064e3b] font-bold shadow-xs'
              : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 font-semibold'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${
              isActive
                ? 'bg-gradient-to-tr from-[#10b981] to-[#34d399]'
                : 'bg-[#10b981]/40'
            }`}
          />
          <span className="text-sm font-bold">{activeLabel}</span>
        </button>

        {/* Inactive Option */}
        <button
          type="button"
          onClick={() => onChange('Inactive')}
          className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl transition-all cursor-pointer ${
            isInactive
              ? 'border-2 border-slate-700 bg-slate-100 text-slate-900 font-bold shadow-xs'
              : 'border border-slate-200 bg-white text-[#475569] hover:border-slate-300 font-semibold'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${
              isInactive
                ? 'bg-slate-800'
                : 'bg-[#334155]'
            }`}
          />
          <span className="text-sm font-bold">{inactiveLabel}</span>
        </button>
      </div>
      {helpText && <p className="text-[11px] text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
};

export default StatusToggle;
