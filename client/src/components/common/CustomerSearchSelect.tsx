import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  X,
  Check,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';

export interface RegisteredCustomerItem {
  id: string | number;
  customerCode: string;
  name: string;
  phone?: string;
  city?: string;
  address?: string;
  aadhaarNumber?: string;
  occupation?: string;
  kycStatus?: string;
  loanAmount?: number;
  outstanding?: number;
  [key: string]: any;
}

interface CustomerSearchSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string, customer?: any) => void;
  customers: any[];
  placeholder?: string;
  className?: string;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  label = 'Customer Name',
  required = true,
  value,
  onChange,
  customers = [],
  placeholder = 'e.g. Suresh Reddy (CF-1002)',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered customers based on search query
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => {
      const matchName = c.name ? c.name.toLowerCase().includes(q) : false;
      const matchCode = c.customerCode ? c.customerCode.toLowerCase().includes(q) : false;
      const matchPhone = c.phone ? c.phone.toLowerCase().includes(q) : false;
      const matchCity = c.city ? c.city.toLowerCase().includes(q) : false;
      const matchAadhaar = c.aadhaarNumber ? c.aadhaarNumber.toLowerCase().includes(q) : false;
      const matchOccupation = c.occupation ? c.occupation.toLowerCase().includes(q) : false;
      return matchName || matchCode || matchPhone || matchCity || matchAadhaar || matchOccupation;
    });
  }, [customers, searchQuery]);

  const handleSelect = (c: RegisteredCustomerItem) => {
    const formatted = `${c.name} (${c.customerCode})`;
    onChange(formatted, c);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearchQuery('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return next;
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label and Live Header */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleToggle}
          className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
          title="Click to view all registered customers"
        >
          <Users className="w-3 h-3 text-purple-600" />
          <span>Select Registered Customer ({customers.length})</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Input with Search / Dropdown controls */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <UserCheck className="w-4 h-4 text-purple-600" />
        </div>

        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (!isOpen) {
              setIsOpen(true);
              setSearchQuery('');
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:font-normal placeholder:text-slate-400"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer transition-colors"
            title="Toggle Registered Customer Directory"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu with Instant Search Option */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header & Search Bar inside Dropdown */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Registered Customer Directory</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {filteredCustomers.length} Available
              </span>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, code (e.g. CF-1001), phone, city..."
                className="w-full text-xs pl-8 pr-7 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-100 scrollbar-thin">
            {/* Custom Entry Option if user typed a new name not in the list */}
            {searchQuery.trim() && !customers.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase() || `${c.name} (${c.customerCode})`.toLowerCase() === searchQuery.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onChange(searchQuery.trim());
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full p-2.5 text-xs text-left bg-purple-50/80 hover:bg-purple-100 text-purple-800 rounded-xl font-bold flex items-center justify-between border border-purple-200 mb-1 transition-all cursor-pointer"
              >
                <span>Use custom customer: "<strong>{searchQuery.trim()}</strong>"</span>
                <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-md">Use Custom</span>
              </button>
            )}

            {filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-1 stroke-[1.5]" />
                <p className="font-bold text-slate-600">No registered customer matches "{searchQuery}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You can keep typing above to record with custom name</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const formattedName = `${cust.name} (${cust.customerCode})`;
                const isSelected =
                  value.toLowerCase().trim() === formattedName.toLowerCase().trim() ||
                  value.toLowerCase().trim() === cust.name.toLowerCase().trim();

                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelect(cust)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50 border border-purple-200 text-purple-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Customer Name & Code in Bracket + Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900 tracking-tight">
                          {cust.name} <span className="text-purple-700 font-extrabold">({cust.customerCode})</span>
                        </span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Registered</span>
                        </span>
                        {cust.kycStatus === 'Verified' && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            KYC Verified
                          </span>
                        )}
                      </div>

                      {/* Phone & Financial balance */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                        {cust.phone && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </span>
                        )}
                        {cust.loanAmount > 0 && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <span>Loan:</span>
                            <strong className="text-amber-700 font-bold">₹{cust.loanAmount.toLocaleString('en-IN')}</strong>
                          </span>
                        )}
                        {cust.outstanding > 0 && (
                          <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[10px]">
                            <span>Due: ₹{cust.outstanding.toLocaleString('en-IN')}</span>
                          </span>
                        )}
                      </div>

                      {/* City / Location */}
                      {(cust.city || cust.address) && (
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-500 truncate max-w-[320px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.city || cust.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Check icon if selected */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
