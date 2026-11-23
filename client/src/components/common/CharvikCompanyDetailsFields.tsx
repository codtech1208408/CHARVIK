import React from 'react';
import {
  type CharvikCompanyDetails,
  DEFAULT_CHARVIK_COMPANY_DETAILS,
  saveCharvikCompanyDetails
} from '../../utils/charvikCompanyDetails';

interface CharvikCompanyDetailsFieldsProps {
  sectionTitle?: string;
  values: Partial<CharvikCompanyDetails>;
  onChange: (updated: Partial<CharvikCompanyDetails>) => void;
  className?: string;
}

export const CharvikCompanyDetailsFields: React.FC<CharvikCompanyDetailsFieldsProps> = ({
  sectionTitle = '5. CHARVIK STAFFING & CONSULTANCY COMPANY & TAX DETAILS (PRINTOUT HEADER)',
  values,
  onChange,
  className = ''
}) => {
  const handleFieldChange = (key: keyof CharvikCompanyDetails, val: string) => {
    const updated = { ...values, [key]: val };
    onChange(updated);
    saveCharvikCompanyDetails(updated);
  };

  const handleReset = () => {
    onChange(DEFAULT_CHARVIK_COMPANY_DETAILS);
    saveCharvikCompanyDetails(DEFAULT_CHARVIK_COMPANY_DETAILS);
  };

  return (
    <div className={`bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <span>🏢</span>
          <span>{sectionTitle}</span>
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          Reset to Standard Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Phone Number</label>
          <input
            type="text"
            value={values.company_phone ?? ''}
            onChange={(e) => handleFieldChange('company_phone', e.target.value)}
            placeholder="+91 9505151527"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Email</label>
          <input
            type="email"
            value={values.company_email ?? ''}
            onChange={(e) => handleFieldChange('company_email', e.target.value)}
            placeholder="charvikstaffingconsultancy@gmail.com"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Website</label>
          <input
            type="text"
            value={values.company_website ?? ''}
            onChange={(e) => handleFieldChange('company_website', e.target.value)}
            placeholder="www.charvikstaffing.com"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Company GSTIN</label>
          <input
            type="text"
            value={values.company_gst ?? ''}
            onChange={(e) => handleFieldChange('company_gst', e.target.value.toUpperCase())}
            placeholder="36ABCDE1234F1Z5"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Company PAN</label>
          <input
            type="text"
            value={values.company_pan ?? ''}
            onChange={(e) => handleFieldChange('company_pan', e.target.value.toUpperCase())}
            placeholder="AABPC1234D"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Address / Location</label>
          <input
            type="text"
            value={values.company_address ?? ''}
            onChange={(e) => handleFieldChange('company_address', e.target.value)}
            placeholder="Hyderabad, Telangana"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
