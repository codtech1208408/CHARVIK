import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  Search,
  ChevronDown,
  X,
  Check,
  User,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { BASE_FLEET_ORGANIZERS } from '../../services/seedData';

export interface RegisteredOperator {
  id: string | number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstOrPan?: string;
}

// Default established operators in the system
export const DEFAULT_PRESET_OPERATORS: RegisteredOperator[] = [
  {
    id: 'op-1',
    name: 'Sri Krishna Travels',
    contactPerson: 'Karthik / Ravi Kumar',
    phone: '8519821491',
    email: 'admin1@gmail.com',
    address: 'Plot 42, Transport Nagar, LB Nagar, Hyderabad',
    gstOrPan: '36RRHHT879IK'
  },
  {
    id: 'op-2',
    name: 'Yolobus Private Limited',
    contactPerson: 'Operations Fleet Manager',
    phone: '9848033445',
    email: 'ops@yolobus.in',
    address: 'Unit 330, JMD Megapolis, Sohna Road, Gurugram, Haryana',
    gstOrPan: '07AAECY9012K1Z8'
  },
  {
    id: 'op-3',
    name: 'Charvik Staffing Consultancy',
    contactPerson: 'Ramya',
    phone: '9505151527',
    email: 'charvikstaffingconsulrancy@gmail.com',
    address: 'NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana',
    gstOrPan: '36GGGGG0000WG6G'
  },
  {
    id: 'op-4',
    name: 'Vyshnavi Travels Operator',
    contactPerson: 'Fleet Dispatcher',
    phone: '9848011223',
    email: 'info@vyshnavitravels.in',
    address: 'Auto Nagar Main Road, Vijayawada, Andhra Pradesh',
    gstOrPan: '36AABCY5013H1ZV'
  },
  {
    id: 'op-5',
    name: 'Orange Tours & Travels',
    contactPerson: 'Dispatch Manager',
    phone: '9848022334',
    email: 'booking@orangetravels.com',
    address: 'Ameerpet, Hyderabad, Telangana',
    gstOrPan: '36AABCO9912L1ZU'
  },
  {
    id: 'op-6',
    name: 'VRL Logistics Ltd',
    contactPerson: 'Regional Incharge',
    phone: '9848044556',
    email: 'customercare@vrllogistics.com',
    address: 'Hubli-Dharwad / Hyderabad Central Depot',
    gstOrPan: '29AABCV1234M1ZX'
  },
  {
    id: 'op-7',
    name: 'Kaveri Travels',
    contactPerson: 'Fleet Operations Lead',
    phone: '9848055667',
    email: 'support@kaveritravels.com',
    address: 'Benz Circle, Vijayawada, Andhra Pradesh',
    gstOrPan: '37AABCK4567N1ZY'
  }
];

interface OperatorSearchSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelectOperator?: (operator: RegisteredOperator) => void;
  placeholder?: string;
  className?: string;
}

export const OperatorSearchSelect: React.FC<OperatorSearchSelectProps> = ({
  label = 'Company / Client Name',
  required = true,
  value,
  onChange,
  onSelectOperator,
  placeholder = 'e.g. Yolobus Private Limited / Sri Krishna Travels',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredOperators, setRegisteredOperators] = useState<RegisteredOperator[]>(DEFAULT_PRESET_OPERATORS);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load operators from API, localStorage and base seed
  useEffect(() => {
    let isMounted = true;
    const loadOperators = async () => {
      const map = new Map<string, RegisteredOperator>();

      // 1. Add default presets
      DEFAULT_PRESET_OPERATORS.forEach((op) => map.set(op.name.toLowerCase().trim(), op));

      // 2. Add BASE_FLEET_ORGANIZERS
      if (Array.isArray(BASE_FLEET_ORGANIZERS)) {
        BASE_FLEET_ORGANIZERS.forEach((o, idx) => {
          const name = o.organization_name || o.name;
          if (name) {
            const key = name.toLowerCase().trim();
            const existing = map.get(key);
            map.set(key, {
              id: o.id || `seed-${idx}`,
              name: name.trim(),
              contactPerson: o.contact_person || existing?.contactPerson || '',
              phone: o.phone_number || existing?.phone || '',
              email: o.email || existing?.email || '',
              address: o.office_address || existing?.address || '',
              gstOrPan: o.gst_number || o.pan_number || existing?.gstOrPan || ''
            });
          }
        });
      }

      // 3. Add localStorage saved organizers
      try {
        const saved = localStorage.getItem('charvik_organizer_management_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((o, idx) => {
              const name = o.organization_name || o.name;
              if (name) {
                const key = name.toLowerCase().trim();
                const existing = map.get(key);
                map.set(key, {
                  id: o.id || `local-${idx}`,
                  name: name.trim(),
                  contactPerson: o.contact_person || existing?.contactPerson || '',
                  phone: o.phone_number || existing?.phone || '',
                  email: o.email || existing?.email || '',
                  address: o.office_address || existing?.address || '',
                  gstOrPan: o.gst_number || o.pan_number || existing?.gstOrPan || ''
                });
              }
            });
          }
        }
      } catch { }

      // 4. Try loading from API
      try {
        const apiOrgs = await api.getOrganizers().catch(() => []);
        if (Array.isArray(apiOrgs)) {
          apiOrgs.forEach((o, idx) => {
            const name = o.organization_name || o.name;
            if (name) {
              const key = name.toLowerCase().trim();
              const existing = map.get(key);
              map.set(key, {
                id: o.id || `api-${idx}`,
                name: name.trim(),
                contactPerson: o.contact_person || existing?.contactPerson || '',
                phone: o.phone_number || existing?.phone || '',
                email: o.email || existing?.email || '',
                address: o.office_address || existing?.address || '',
                gstOrPan: o.gst_number || o.pan_number || existing?.gstOrPan || ''
              });
            }
          });
        }
      } catch { }

      if (isMounted) {
        setRegisteredOperators(Array.from(map.values()));
      }
    };

    loadOperators();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Filtered operators based on search query
  const filteredOperators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return registeredOperators;
    return registeredOperators.filter((op) => {
      const matchName = op.name.toLowerCase().includes(q);
      const matchContact = op.contactPerson ? op.contactPerson.toLowerCase().includes(q) : false;
      const matchPhone = op.phone ? op.phone.toLowerCase().includes(q) : false;
      const matchAddress = op.address ? op.address.toLowerCase().includes(q) : false;
      const matchGst = op.gstOrPan ? op.gstOrPan.toLowerCase().includes(q) : false;
      return matchName || matchContact || matchPhone || matchAddress || matchGst;
    });
  }, [registeredOperators, searchQuery]);

  const handleSelect = (op: RegisteredOperator) => {
    onChange(op.name);
    if (onSelectOperator) {
      onSelectOperator(op);
    }
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
      {/* Label */}
      <div className="mb-1">
        <label className="block text-[11px] font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>

      {/* Main Input with Search / Dropdown controls */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <Building2 className="w-4 h-4 text-emerald-600" />
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
          className="w-full pl-9 pr-16 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal placeholder:text-slate-400"
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
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            title="Toggle Operator Search Dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
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
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Registered Operator Directory</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {filteredOperators.length} Available
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
                placeholder="Search operator name, contact person, phone, or location..."
                className="w-full text-xs pl-8 pr-7 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-slate-800"
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

          {/* Operator Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-100 scrollbar-thin">
            {/* Custom Entry Option if user typed a new name not in the list */}
            {searchQuery.trim() && !registeredOperators.some((o) => o.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onChange(searchQuery.trim());
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full p-2.5 text-xs text-left bg-blue-50/80 hover:bg-blue-100 text-blue-800 rounded-xl font-bold flex items-center justify-between border border-blue-200 mb-1 transition-all cursor-pointer"
              >
                <span>Use custom client: "<strong>{searchQuery.trim()}</strong>"</span>
                <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">Use Custom</span>
              </button>
            )}

            {filteredOperators.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-1 stroke-[1.5]" />
                <p className="font-bold text-slate-600">No registered operator matches "{searchQuery}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You can keep typing above to use a custom operator name</p>
              </div>
            ) : (
              filteredOperators.map((op) => {
                const isSelected = value.toLowerCase().trim() === op.name.toLowerCase().trim();
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => handleSelect(op)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                      }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Company Name & Badge */}
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900 tracking-tight">
                          {op.name}
                        </span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Registered
                        </span>
                      </div>

                      {/* Contact & Phone */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                        {op.contactPerson && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{op.contactPerson}</span>
                          </span>
                        )}
                        {op.phone && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{op.phone}</span>
                          </span>
                        )}
                      </div>

                      {/* Address & GST */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-500">
                        {op.address && (
                          <span className="flex items-center gap-1 truncate max-w-[280px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{op.address}</span>
                          </span>
                        )}
                        {op.gstOrPan && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            <FileText className="w-3 h-3" />
                            <span>{op.gstOrPan}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Check icon if selected */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
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

export default OperatorSearchSelect;
