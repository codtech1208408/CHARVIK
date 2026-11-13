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
        <label className="block text-sm font-bold text-slate-800 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Option */}
        <button
          type="button"
          onClick={() => onChange('Active')}
          className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl transition-all cursor-pointer ${
            isActive
              ? 'border-2 border-emerald-500 bg-[#ECFDF5] text-emerald-900 font-extrabold shadow-sm ring-2 ring-emerald-500/20'
              : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 font-bold'
          }`}
        >
          {/* Radio circle */}
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isActive
                ? 'border-emerald-600 bg-emerald-600'
                : 'border-slate-400 bg-white'
            }`}
          >
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          <span className="text-sm font-bold">{activeLabel}</span>
        </button>

        {/* Inactive Option */}
        <button
          type="button"
          onClick={() => onChange('Inactive')}
          className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl transition-all cursor-pointer ${
            isInactive
              ? 'border-2 border-slate-700 bg-slate-100 text-slate-900 font-extrabold shadow-sm'
              : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 font-bold'
          }`}
        >
          {/* Radio circle */}
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isInactive
                ? 'border-slate-700 bg-slate-700'
                : 'border-slate-400 bg-white'
            }`}
          >
            {isInactive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          <span className="text-sm font-bold">{inactiveLabel}</span>
        </button>
      </div>
      {helpText && <p className="text-[11px] text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
};

export default StatusToggle;
