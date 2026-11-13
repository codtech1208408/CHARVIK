import React, { useState, useEffect, useMemo } from 'react';
import {
  Fuel,
  Search,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Droplet,
  ClipboardList,
  IndianRupee,
  Bus,
  MapPin,
  TrendingUp,
  X,
  Check,
  RotateCcw,
  Printer,
  Gauge,
  Flag
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { auditLogger } from '../services/auditLogger';
import { PrintButton } from '../components/common/PrintButton';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';

export interface FuelingEntry {
  id: string;
  date: string; // YYYY-MM-DD
  vehicle_number: string;
  route: string;
  last_fuel_km: number;
  end_trip_km: number;
  total_km: number;
  fuel_liters: number;
  mileage_km_l: number;
  fuel_cost: number;
  station?: string;
  remarks?: string;
  created_at: string;
}

const STORAGE_KEY = 'charvik_mileage_fueling_records_v2';

const INITIAL_FUELING_ENTRIES: FuelingEntry[] = [
  {
    id: 'fuel-1',
    date: '2026-10-30',
    vehicle_number: 'AR11CD0808',
    route: 'Ponnur -> Hyderabad Airport',
    last_fuel_km: 10000,
    end_trip_km: 20000,
    total_km: 10000,
    fuel_liters: 500,
    mileage_km_l: 20.0,
    fuel_cost: 0,
    station: 'HP Highway Fuel Depot',
    remarks: 'Full tank refueled after round trip completion',
    created_at: '2026-10-30T10:00:00Z'
  },
  {
    id: 'fuel-2',
    date: '2026-10-31',
    vehicle_number: 'AP16TV1234',
    route: 'Chirala -> Hyderabad',
    last_fuel_km: 142000,
    end_trip_km: 142850,
    total_km: 850,
    fuel_liters: 170,
    mileage_km_l: 5.0,
    fuel_cost: 16150,
    station: 'IndianOil Express Way Station',
    remarks: 'Regular route service fueling',
    created_at: '2026-10-31T06:30:00Z'
  }
];

export const DailyKilometers: React.FC = () => {
  const { success, error } = useToast();

  // Fueling entries store (persistent in localStorage)
  const [entries, setEntries] = useState<FuelingEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_FUELING_ENTRIES;
    } catch {
      return INITIAL_FUELING_ENTRIES;
    }
  });

  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  // Search & Filters
  const [searchVehicle, setSearchVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FuelingEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicle_number: '',
    date: new Date().toISOString().split('T')[0],
    route: '',
    last_fuel_km: '' as string | number,
    end_trip_km: '' as string | number,
    fuel_liters: '' as string | number,
    fuel_cost: '' as string | number,
    station: '',
    remarks: ''
  });

  // Load buses and routes from API
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [busesData, routesData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getRoutes().catch(() => [])
        ]);
        if (Array.isArray(busesData)) setBuses(busesData);
        if (Array.isArray(routesData)) setRoutes(routesData);
      } catch (err) {
        console.warn('Could not load buses or routes:', err);
      }
    };
    loadAuxData();
    window.addEventListener('charvik_bus_km_updated', loadAuxData);
    return () => {
      window.removeEventListener('charvik_bus_km_updated', loadAuxData);
    };
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save fueling records to localStorage', e);
    }
  }, [entries]);

  // Filtered Entries based on search vehicle and date range
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Vehicle search filter (strict matching: vehicle number or station)
      if (searchVehicle.trim()) {
        const term = searchVehicle.trim().toLowerCase();
        const matchesVeh = e.vehicle_number.toLowerCase().includes(term);
        const matchesStation = (e.station || '').toLowerCase().includes(term);
        const matchesRoute = e.route.toLowerCase().includes(term);
        if (!matchesVeh && !matchesStation && !matchesRoute) return false;
      }

      // Date Range Filter
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;

      return true;
    });
  }, [entries, searchVehicle, fromDate, toDate]);

  // Searchable bus options for Log / Edit Fueling Modal
  const busSearchOptions: SearchOption[] = useMemo(() => {
    const seen = new Set<string>();
    const options: SearchOption[] = [];

    buses.forEach((b: any) => {
      const reg = (b.bus_number || b.registration_number || '').split('(')[0].trim();
      if (reg && !seen.has(reg)) {
        seen.add(reg);
        const sub = [b.make_model, b.bus_type].filter(Boolean).join(' • ');
        options.push({
          value: reg,
          label: reg,
          sublabel: sub || undefined,
          badge: b.depot_location || undefined
        });
      }
    });

    entries.forEach((e) => {
      const reg = (e.vehicle_number || '').split('(')[0].trim();
      if (reg && !seen.has(reg)) {
        seen.add(reg);
        options.push({
          value: reg,
          label: reg
        });
      }
    });

    if (formData.vehicle_number) {
      const cur = (formData.vehicle_number || '').split('(')[0].trim();
      if (cur && !seen.has(cur)) {
        seen.add(cur);
        options.push({
          value: cur,
          label: cur
        });
      }
    }

    if (options.length === 0) {
      ['AR11CD0808', 'AP16TV1234', 'AP16TV5678', 'TS09UB4545'].forEach((reg) => {
        options.push({ value: reg, label: reg });
      });
    }

    return options;
  }, [buses, entries, formData.vehicle_number]);

  // KPI Calculations
  const totalFuelCost = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + (Number(item.fuel_cost) || 0), 0);
  }, [filteredEntries]);

  const totalLiters = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + (Number(item.fuel_liters) || 0), 0);
  }, [filteredEntries]);

  const totalEntriesCount = filteredEntries.length;

  // Real-time calculation in Form
  const calculatedTotalKm = useMemo(() => {
    const last = Number(formData.last_fuel_km) || 0;
    const end = Number(formData.end_trip_km) || 0;
    return Math.max(0, end - last);
  }, [formData.last_fuel_km, formData.end_trip_km]);

  const calculatedMileage = useMemo(() => {
    const liters = Number(formData.fuel_liters) || 0;
    if (liters <= 0 || calculatedTotalKm <= 0) return 0;
    return parseFloat((calculatedTotalKm / liters).toFixed(2));
  }, [calculatedTotalKm, formData.fuel_liters]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingEntry(null);
    const defaultBus = buses[0]?.bus_number || buses[0]?.registration_number || 'AR11CD0808';
    const defaultRoute = routes[0]
      ? `${routes[0].starting_city} -> ${routes[0].ending_city}`
      : 'Ponnur -> Hyderabad Airport';

    setFormData({
      vehicle_number: defaultBus,
      date: new Date().toISOString().split('T')[0],
      route: defaultRoute,
      last_fuel_km: '',
      end_trip_km: '',
      fuel_liters: '',
      fuel_cost: '',
      station: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: FuelingEntry) => {
    setEditingEntry(entry);
    setFormData({
      vehicle_number: entry.vehicle_number,
      date: entry.date,
      route: entry.route,
      last_fuel_km: entry.last_fuel_km,
      end_trip_km: entry.end_trip_km,
      fuel_liters: entry.fuel_liters,
      fuel_cost: entry.fuel_cost || '',
      station: entry.station || '',
      remarks: entry.remarks || ''
    });
    setIsModalOpen(true);
  };

  // Save Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = Boolean(
      user?.role?.toLowerCase()?.includes('admin') ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
    );

    if (!formData.vehicle_number?.trim()) {
      if (!isUserAdmin) {
        error('Please select a vehicle.');
        return;
      }
      formData.vehicle_number = 'AP16TV1234';
    }

    let last = Number(formData.last_fuel_km);
    let end = Number(formData.end_trip_km);
    let liters = Number(formData.fuel_liters);

    if (isNaN(last) || last < 0) {
      if (!isUserAdmin) {
        error('Please enter valid Last Fuel KM.');
        return;
      }
      last = 0;
    }
    if (isNaN(end) || end < last) {
      if (!isUserAdmin) {
        error('End Trip KM must be greater than or equal to Last Fuel KM.');
        return;
      }
      end = last;
    }
    if (isNaN(liters) || liters <= 0) {
      if (!isUserAdmin) {
        error('Please enter valid Fuel Quantity in liters (greater than 0).');
        return;
      }
      liters = 1;
    }

    const totalKm = end - last;
    const mileage = parseFloat((totalKm / liters).toFixed(2));
    const cost = Number(formData.fuel_cost) || 0;

    if (editingEntry) {
      const updated: FuelingEntry = {
        ...editingEntry,
        vehicle_number: formData.vehicle_number.trim(),
        date: formData.date,
        route: formData.route || 'General Fleet Route',
        last_fuel_km: last,
        end_trip_km: end,
        total_km: totalKm,
        fuel_liters: liters,
        mileage_km_l: mileage,
        fuel_cost: cost,
        station: formData.station.trim() || undefined,
        remarks: formData.remarks.trim() || undefined
      };
      setEntries(entries.map((item) => (item.id === editingEntry.id ? updated : item)));
      auditLogger.log({
        user: 'Admin',
        module: 'Mileage & Fueling',
        action_type: 'Data Update',
        description: `Updated fueling entry for vehicle ${updated.vehicle_number} (${totalKm} KM, ${liters} L, ${mileage} KM/L)`
      });
      success(`Updated fueling record for ${updated.vehicle_number}!`);
    } else {
      const newEntry: FuelingEntry = {
        id: `fuel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vehicle_number: formData.vehicle_number.trim(),
        date: formData.date,
        route: formData.route || 'General Fleet Route',
        last_fuel_km: last,
        end_trip_km: end,
        total_km: totalKm,
        fuel_liters: liters,
        mileage_km_l: mileage,
        fuel_cost: cost,
        station: formData.station.trim() || undefined,
        remarks: formData.remarks.trim() || undefined,
        created_at: new Date().toISOString()
      };
      setEntries([newEntry, ...entries]);
      auditLogger.log({
        user: 'Admin',
        module: 'Mileage & Fueling',
        action_type: 'Data Update',
        description: `Logged new fueling for ${newEntry.vehicle_number}: ${liters}L pumped, ${totalKm} KM, mileage: ${mileage} KM/L`
      });
      success(`Logged fueling record for ${newEntry.vehicle_number} (Mileage: ${mileage} KM/L)!`);
    }

    setIsModalOpen(false);
  };

  // Delete Record
  const handleDeleteRecord = (id: string, veh: string) => {
    if (window.confirm(`Are you sure you want to delete this fueling entry for ${veh}?`)) {
      setEntries(entries.filter((e) => e.id !== id));
      auditLogger.log({
        user: 'Admin',
        module: 'Mileage & Fueling',
        action_type: 'Data Update',
        description: `Deleted fueling entry for ${veh}`
      });
      success(`Deleted fueling entry for ${veh}.`);
    }
  };

  // Print Individual Fueling Slip with Official Charvik Letterhead
  const handlePrintFuelingEntry = (e: FuelingEntry) => {
    const printContent = `
      <html>
      <head>
        <title>Fueling Receipt - ${e.vehicle_number} (${e.date})</title>
        <style>
          @page { margin: 18mm 15mm; size: A4 portrait; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }
          .letterhead { display: flex; align-items: center; justify-content: space-between; padding: 0 0 14px 0; border-bottom: 3px solid #0E52A5; margin-bottom: 18px; }
          .letterhead img { height: 70px; width: auto; object-fit: contain; }
          .company-info { text-align: right; }
          .company-info h2 { font-size: 20px; font-weight: 900; color: #0B3A79; letter-spacing: 1px; }
          .company-info p { font-size: 10px; color: #555; margin-top: 2px; }
          .doc-title { text-align: center; margin-bottom: 18px; }
          .doc-title h3 { font-size: 16px; font-weight: 800; color: #0B3A79; text-transform: uppercase; letter-spacing: 1px; }
          .doc-title p { font-size: 11px; color: #666; margin-top: 3px; }
          .vehicle-banner { background: linear-gradient(135deg, #0B3A79, #1E70EB); color: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
          .vehicle-banner .reg { font-size: 22px; font-weight: 900; font-family: monospace; letter-spacing: 1px; }
          .vehicle-banner .route { font-size: 13px; color: #dbeafe; margin-top: 3px; font-weight: 600; }
          .vehicle-banner .date { font-size: 13px; text-align: right; color: #b3d4ff; font-weight: 700; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
          .info-box { background: #f4f8ff; border: 1px solid #c8daf5; border-radius: 8px; padding: 12px 14px; }
          .info-box label { font-size: 10px; font-weight: 700; color: #0E52A5; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
          .info-box span { font-size: 14px; font-weight: 800; color: #1a1a2e; }
          .financials { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
          .fin-box { border: 2px solid #c8daf5; border-radius: 8px; padding: 12px 14px; text-align: center; }
          .fin-box.highlight { background: #ecfdf5; border-color: #059669; }
          .fin-box label { font-size: 10px; font-weight: 700; color: #0E52A5; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
          .fin-box .amount { font-size: 20px; font-weight: 900; color: #0B3A79; }
          .fin-box.highlight .amount { color: #059669; }
          .notes-box { background: #fff; border: 1px dashed #94a3b8; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px; }
          .notes-box strong { color: #0B3A79; }
          .footer { border-top: 1.5px solid #c8daf5; margin-top: 24px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <img src="/logo-compact.png" alt="Charvik Logo" />
          <div class="company-info">
            <h2>CHARVIK</h2>
            <p>Staffing Consultancy &amp; Fleet Operations</p>
            <p>contact@charvikstaffing.com | +91 98765 43210</p>
          </div>
        </div>

        <div class="doc-title">
          <h3>Mileage &amp; Fueling Receipt</h3>
          <p>Record ID: <strong>#${e.id}</strong> &nbsp;|&nbsp; Printed on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="vehicle-banner">
          <div>
            <div class="reg">${e.vehicle_number}</div>
            <div class="route">${e.route || 'General Fleet Corridor'}</div>
          </div>
          <div class="date">
            <div>Date of Fueling</div>
            <div style="font-size:15px; color:#fff; margin-top:2px;">${e.date}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <label>Last Fuel KM (Start)</label>
            <span>${Number(e.last_fuel_km).toLocaleString('en-IN')} KM</span>
          </div>
          <div class="info-box">
            <label>End Trip KM</label>
            <span>${Number(e.end_trip_km).toLocaleString('en-IN')} KM</span>
          </div>
          <div class="info-box">
            <label>Total Distance Run</label>
            <span>${Number(e.total_km).toLocaleString('en-IN')} KM</span>
          </div>
          <div class="info-box">
            <label>Fuel Station</label>
            <span>${e.station || 'Highway Fuel Depot'}</span>
          </div>
        </div>

        <div class="financials">
          <div class="fin-box">
            <label>Fuel Consumed</label>
            <div class="amount">${e.fuel_liters} L</div>
          </div>
          <div class="fin-box">
            <label>Fuel Cost</label>
            <div class="amount">&#8377; ${Number(e.fuel_cost).toLocaleString('en-IN')}</div>
          </div>
          <div class="fin-box highlight">
            <label>Calculated Mileage</label>
            <div class="amount">${e.mileage_km_l.toFixed(2)} KM/L</div>
          </div>
        </div>

        ${e.remarks ? `
          <div class="notes-box">
            <strong>Remarks / Notes:</strong> ${e.remarks}
          </div>
        ` : ''}

        <div class="footer">
          <span>Generated by Charvik Fleet Management System</span>
          <span>${new Date().toLocaleString('en-IN')}</span>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=800,height=700');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    }
  };

  // Export to Excel / CSV with vehicle-specific filtering and summary count
  const handleExportExcel = () => {
    try {
      const isFilteredByVeh = !!searchVehicle.trim();
      const vehLabel = isFilteredByVeh ? searchVehicle.trim().toUpperCase() : 'All Vehicles';

      const csvLines: string[] = [];
      // Summary Block in CSV
      csvLines.push(`"CHARVIK STAFFING CONSULTANCY - MILEAGE & FUELING REPORT"`);
      csvLines.push(`"Vehicle Filter","${vehLabel}"`);
      csvLines.push(`"Total Matching Records Found","${filteredEntries.length}"`);
      csvLines.push(`"Total Liters Pumped","${totalLiters.toFixed(2)} L"`);
      csvLines.push(`"Total Fuel Cost","Rs. ${totalFuelCost.toLocaleString('en-IN')}"`);
      csvLines.push(`"Exported Date","${new Date().toLocaleString()}"`);
      csvLines.push(''); // Blank separator line

      // Table Header
      const headers = [
        'S.No',
        'Date',
        'Vehicle No.',
        'Round Trip Route',
        'Last Fuel KM',
        'End Trip KM',
        'Total KM',
        'Total Fuel (Liters)',
        'Mileage (KM/L)',
        'Fuel Cost (Rs)',
        'Fuel Station',
        'Remarks'
      ];
      csvLines.push(headers.map((h) => `"${h}"`).join(','));

      // Table Rows
      filteredEntries.forEach((e, idx) => {
        const row = [
          idx + 1,
          e.date,
          e.vehicle_number,
          e.route,
          e.last_fuel_km,
          e.end_trip_km,
          e.total_km,
          `${e.fuel_liters} L`,
          `${e.mileage_km_l} KM/L`,
          e.fuel_cost || 0,
          e.station || '—',
          e.remarks || '—'
        ];
        csvLines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
      });

      const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      const safeVehName = isFilteredByVeh ? searchVehicle.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'All';
      link.setAttribute('href', url);
      link.setAttribute('download', `Mileage_Fueling_${safeVehName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success(`Exported ${filteredEntries.length} fueling record(s) for ${vehLabel} to Excel!`);
    } catch {
      error('Failed to export Excel report.');
    }
  };

  // Helper date formatter: e.g. 2026-10-30 -> 30 Oct 2026
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          1. HEADER: Title, Subtitle & Action Buttons with Real Bus Banner
         ========================================================================= */}
      <div
        data-aos="fade-down"
        className="bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
      >
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <Fuel className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Mileage & Fueling
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {filteredEntries.length} Records
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Track vehicle fueling, odometer readings, and fuel costs across all fleet corridors.
            </p>
          </div>
        </div>

        {/* Bus image & Action Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet4.jpg"
                alt="Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Diesel Fleet</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md shadow-xs transition-all cursor-pointer"
              title="Download Excel / CSV containing filtered vehicle data"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            <PrintButton
              title="Mileage & Fueling Report"
              subtitle={`Total Records: ${filteredEntries.length} • Total Fuel Cost: ₹${totalFuelCost.toLocaleString('en-IN')}`}
              targetId="mileage-fueling-table-wrap"
              label="Print Sheet"
            />

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-white text-blue-900 hover:bg-blue-50 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-800" />
              <span>+ Log Fueling</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* =========================================================================
          2. KPI CARDS: Total Fuel Cost, Total Liters Pumped, Fueling Entries
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL FUEL COST */}
        <div className="bg-gradient-to-br from-[#FFF5EC] via-[#FFF9F3] to-[#FFE7D1] border-2 border-[#FFD0A8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#D97706] uppercase tracking-wider">TOTAL FUEL COST</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 tracking-tight">
              ₹{totalFuelCost.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] font-semibold text-amber-700/80 mt-1">
              {searchVehicle.trim() ? `Filtered for ${searchVehicle.toUpperCase()}` : 'Across all vehicles'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: TOTAL LITERS PUMPED */}
        <div className="bg-gradient-to-br from-[#EAFBF1] via-[#F2FCF6] to-[#D7F7E6] border-2 border-[#A5F0C5] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#059669] uppercase tracking-wider">TOTAL LITERS PUMPED</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 tracking-tight">
              {totalLiters.toFixed(2)} L
            </h3>
            <p className="text-[11px] font-semibold text-emerald-700/80 mt-1">Diesel dispensed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: FUELING ENTRIES */}
        <div className="bg-gradient-to-br from-[#EEF5FF] via-[#F4F8FF] to-[#DBEAFF] border-2 border-[#B8D7FF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#0D6EFD] uppercase tracking-wider">FUELING ENTRIES</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0047AB] mt-1 tracking-tight">
              {totalEntriesCount} ENTRIES
            </h3>
            <p className="text-[11px] font-semibold text-blue-700/80 mt-1">Total trips refueled</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D6EFD] to-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SEARCH & FILTER TOOLBAR (Exact Video Match)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Vehicle or Station */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVehicle}
            onChange={(e) => setSearchVehicle(e.target.value)}
            placeholder="Search vehicle or station..."
            className="w-full text-xs pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
          />
          {searchVehicle && (
            <button
              onClick={() => setSearchVehicle('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Range: From */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Date Range: To */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Clear Filters Button if any active */}
        {(searchVehicle || fromDate || toDate) && (
          <button
            type="button"
            onClick={() => {
              setSearchVehicle('');
              setFromDate('');
              setToDate('');
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Helper Notification when vehicle search is active */}
      {searchVehicle.trim() && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>
            Filtering exclusively for vehicle: <strong>{searchVehicle.toUpperCase()}</strong>. Found{' '}
            <strong>{filteredEntries.length} record(s)</strong>.
          </span>
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer"
          >
            Download {searchVehicle.toUpperCase()} Excel →
          </button>
        </div>
      )}

      {/* =========================================================================
          4. MAIN TABLE (Exact Video Match)
         ========================================================================= */}
      <div id="mileage-fueling-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white font-bold border-b border-blue-900/30">
              <tr>
                <th className="py-3 px-3.5 border-r border-slate-300 whitespace-nowrap">DATE</th>
                <th className="py-3 px-3.5 border-r border-slate-300 whitespace-nowrap">VEHICLE NO.</th>
                <th className="py-3 px-3.5 border-r border-slate-300 whitespace-nowrap">ROUND TRIP</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-300 whitespace-nowrap">LAST FUEL KM</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-300 whitespace-nowrap">END TRIP KM</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-300 whitespace-nowrap">TOTAL KM</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-300 whitespace-nowrap">TOTAL FUEL</th>
                <th className="py-3 px-3.5 text-center border-r border-slate-300 whitespace-nowrap">MILEAGE</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((e) => {
                // Split route by '->' if available for two-line display
                const routeParts = e.route.split('->');
                const origin = routeParts[0]?.trim() || e.route;
                const dest = routeParts[1]?.trim() || '';

                return (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date with Calendar Icon */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-700 border-r border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDisplayDate(e.date)}</span>
                      </div>
                    </td>

                    {/* Vehicle No. in styled badge with Coach Thumbnail */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/assets/fleet${((Number(e.id) || 1) % 5) + 1}.jpg`}
                          alt={e.vehicle_number}
                          className="w-10 h-7 rounded-md object-cover shadow-2xs border border-slate-200 shrink-0"
                        />
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
                          {e.vehicle_number}
                        </span>
                      </div>
                    </td>

                    {/* Round Trip (Origin & Destination) */}
                    <td className="py-3 px-3.5 border-r border-slate-100 max-w-xs">
                      <p className="font-bold text-[#142B4A] leading-tight">{origin}</p>
                      {dest && <p className="text-[11px] text-slate-400 font-medium">to {dest}</p>}
                    </td>

                    {/* Last Fuel KM */}
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-600 border-r border-slate-100">
                      {e.last_fuel_km.toLocaleString('en-IN')}
                    </td>

                    {/* End Trip KM */}
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-600 border-r border-slate-100">
                      {e.end_trip_km.toLocaleString('en-IN')}
                    </td>

                    {/* Total KM */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800 border-r border-slate-100">
                      {e.total_km.toLocaleString('en-IN')}
                    </td>

                    {/* Total Fuel */}
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 border-r border-slate-100">
                      {e.fuel_liters} L
                    </td>

                    {/* Mileage in Bold Green Text */}
                    <td className="py-3 px-3.5 text-center border-r border-slate-100">
                      <span className="text-sm font-black text-emerald-600 tracking-tight">
                        {e.mileage_km_l.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 ml-1">KM/L</span>
                    </td>

                    {/* Actions: Edit, Print & Delete */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit fueling entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintFuelingEntry(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Print fueling receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(e.id, e.vehicle_number)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete fueling entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No fueling records match the selected vehicle or date criteria.{' '}
                    <button
                      onClick={handleOpenAdd}
                      className="text-blue-600 hover:underline font-bold ml-1 cursor-pointer"
                    >
                      Log new fueling
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: LOG NEW FUELING (Exact Video Match)
         ========================================================================= */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingEntry ? 'Edit Fueling Record' : 'Log New Fueling'}
          subtitle="Record mileage and fuel cost details."
          icon={<Fuel className="w-5 h-5 text-white" />}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveRecord} className="space-y-4 pt-1">
            <div className="space-y-3.5">
              {/* Vehicle Selection & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Bus className="w-4 h-4 text-blue-600" />
                    <span>Vehicle <span className="text-rose-600">*</span></span>
                  </label>
                  <SearchableSelect
                    placeholder="Select Vehicle"
                    searchPlaceholder="Search vehicle (e.g. DL01, AP16, AR11)..."
                    options={busSearchOptions}
                    value={(formData.vehicle_number || '').split('(')[0].trim()}
                    onChange={(veh) => {
                      const matched = buses.find((b: any) => (b.bus_number && b.bus_number === veh) || (b.registration_number && b.registration_number === veh));
                      const km = matched?.current_odometer_km || '';
                      setFormData((prev) => ({
                        ...prev,
                        vehicle_number: veh,
                        last_fuel_km: (!prev.last_fuel_km || prev.last_fuel_km === '' || prev.last_fuel_km === 0) ? km : prev.last_fuel_km
                      }));
                    }}
                    allowCustom={true}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Date <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Route */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Route <span className="text-rose-600">*</span></span>
                </label>
                <select
                  required
                  value={formData.route}
                  onChange={(e) => setFormData((prev) => ({ ...prev, route: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Select route</option>
                  {routes.length > 0 ? (
                    routes.map((r: any) => {
                      const label = `${r.service_number ? `${r.service_number} - ` : ''}${r.starting_city} -> ${r.ending_city}`;
                      return (
                        <option key={r.id} value={label}>
                          {label}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="Ponnur → Hyderabad Airport">Ponnur → Hyderabad Airport</option>
                      <option value="3720 - Chirala → Hyderabad">3720 - Chirala → Hyderabad</option>
                      <option value="5703 - Visakhapatnam → Chirala">5703 - Visakhapatnam → Chirala</option>
                      <option value="Full Trip - Ponnur → Hyderabad Airport">Full Trip - Ponnur → Hyderabad Airport</option>
                    </>
                  )}
                </select>
              </div>

              {/* Last Fuel KM & End Trip KM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    <span>Last Fuel KM <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10000"
                    value={formData.last_fuel_km}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_fuel_km: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Flag className="w-4 h-4 text-blue-600" />
                    <span>End Trip KM <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20000"
                    value={formData.end_trip_km}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_trip_km: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Fuel Quantity (Liters) & Calculated Mileage Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Fuel className="w-4 h-4 text-blue-600" />
                    <span>Fuel Quantity (Liters) <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder="e.g. 500"
                    value={formData.fuel_liters}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fuel_liters: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-black text-[#142B4A] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                <div className="p-3.5 bg-[#F0FDF4] border-2 border-[#86EFAC] rounded-2xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                      CALCULATED MILEAGE
                    </span>
                    <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">
                      {calculatedMileage.toFixed(2)}{' '}
                      <span className="text-xs font-bold text-emerald-800">KM/L</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Total KM Auto-Calculated Banner */}
              <div className="p-3.5 bg-[#FEFCE8] border-2 border-[#FDE047] rounded-2xl flex items-center justify-between shadow-2xs">
                <span className="text-sm font-black text-amber-900 flex items-center gap-2">
                  <span className="text-base">🛣️</span>
                  <span>Total KM: {calculatedTotalKm.toLocaleString('en-IN')} KM</span>
                </span>
                <span className="text-xs font-bold text-amber-800">
                  {calculatedTotalKm > 0 ? '✓ Auto-tallied' : 'Enter KM readings'}
                </span>
              </div>

              {/* Optional Fuel Cost & Station */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    <span>Fuel Cost (₹)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 16500"
                    value={formData.fuel_cost}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fuel_cost: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Fuel className="w-4 h-4 text-blue-600" />
                    <span>Fuel Station / Remarks</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HP Highway Depot"
                    value={formData.station}
                    onChange={(e) => setFormData((prev) => ({ ...prev, station: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>{editingEntry ? 'Update Record' : 'Save Record'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
