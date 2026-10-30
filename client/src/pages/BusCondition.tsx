import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Bus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  Disc,
  Gauge
} from 'lucide-react';
import { api } from '../services/api';
import type { BusConditionInspection, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';

export interface DailyChecklistItem {
  no: number;
  name: string;
  status: 'OK' | 'Not OK';
  remarks: string;
}

export const DEFAULT_18_INSPECTION_ITEMS: { no: number; name: string }[] = [
  { no: 1, name: 'Engine oil level' },
  { no: 2, name: 'Coolant / radiator level and leaks' },
  { no: 3, name: 'Brake system and parking brake' },
  { no: 4, name: 'Clutch and gear operation' },
  { no: 5, name: 'Steering operation' },
  { no: 6, name: 'Tyres: pressure, cuts, tread and wheel nuts' },
  { no: 7, name: 'Headlights, indicators, tail lamps and brake lights' },
  { no: 8, name: 'Horn' },
  { no: 9, name: 'Wipers and washer' },
  { no: 10, name: 'Mirrors, windscreen and windows' },
  { no: 11, name: 'Battery and electrical connections' },
  { no: 12, name: 'Fuel level and fuel leaks' },
  { no: 13, name: 'Air pressure / air brake warning (if fitted)' },
  { no: 14, name: 'Doors, emergency exits and seat belts' },
  { no: 15, name: 'First-aid kit, fire extinguisher and safety equipment' },
  { no: 16, name: 'Tools, jack, spare wheel and documents' },
  { no: 17, name: 'Body, underbody and visible fluid leaks' },
  { no: 18, name: 'Cleanliness and passenger area' }
];

export const getSavedInspectionItems = (): { no: number; name: string }[] => {
  try {
    const saved = localStorage.getItem('charvik_custom_inspection_items');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const combined = [...DEFAULT_18_INSPECTION_ITEMS];
        parsed.forEach((p: any) => {
          const itemName = typeof p === 'string' ? p : p.name;
          if (itemName && !combined.some((c) => c.name.toLowerCase() === itemName.toLowerCase())) {
            combined.push({ no: combined.length + 1, name: itemName });
          }
        });
        return combined.map((it, idx) => ({ no: idx + 1, name: it.name }));
      }
    }
  } catch {}
  return DEFAULT_18_INSPECTION_ITEMS;
};

export const BusCondition: React.FC = () => {
  const { success, error } = useToast();

  const [inspections, setInspections] = useState<BusConditionInspection[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_route_management_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { service_number: 'SRV-101', starting_city: 'Hyderabad', ending_city: 'Bangalore', destination_km: 570 },
      { service_number: 'SRV-204', starting_city: 'Hyderabad', ending_city: 'Vijayawada', destination_km: 275 },
      { service_number: 'SRV-305', starting_city: 'Bangalore', ending_city: 'Chennai', destination_km: 345 },
      { service_number: 'SRV-412', starting_city: 'Hyderabad', ending_city: 'Visakhapatnam', destination_km: 620 }
    ];
  });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<BusConditionInspection | null>(null);
  const [viewingInspection, setViewingInspection] = useState<BusConditionInspection | null>(null);
  const [isBlankPrintModalOpen, setIsBlankPrintModalOpen] = useState(false);
  const [vehicleTyres, setVehicleTyres] = useState<any[]>([]);

  // Item inline edit state
  const [editingItemNo, setEditingItemNo] = useState<number | null>(null);
  const [editingItemName, setEditingItemName] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<{
    bus_id: string;
    vehicle_number: string;
    vehicle_model: string;
    driver_name: string;
    inspection_date: string;
    reporting_time: string;
    starting_km: number | string;
    closing_km: number | string;
    route_trip: string;
    mechanic_supervisor: string;
    defects_found: string;
    items: DailyChecklistItem[];
  }>({
    bus_id: '',
    vehicle_number: '',
    vehicle_model: '',
    driver_name: '',
    inspection_date: new Date().toISOString().split('T')[0],
    reporting_time: '',
    starting_km: '',
    closing_km: '',
    route_trip: '',
    mechanic_supervisor: '',
    defects_found: '',
    items: getSavedInspectionItems().map((item) => ({
      no: item.no,
      name: item.name,
      status: 'OK',
      remarks: ''
    }))
  });

  useEffect(() => {
    loadData();
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insData, busesData, routesData, driversData] = await Promise.all([
        api.getBusConditions(selectedBus ? { bus_id: selectedBus } : undefined),
        api.getBuses(),
        api.getRoutes().catch(() => []),
        api.getEmployees({ role: 'Driver' }).catch(() => [])
      ]);
      setInspections(insData);
      setBuses(busesData);
      if (Array.isArray(routesData) && routesData.length > 0) {
        setRoutes(routesData);
      }
      if (Array.isArray(driversData) && driversData.length > 0) {
        setDrivers(driversData);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const driverSearchOptions: SearchOption[] = React.useMemo(() => {
    const opts: SearchOption[] = drivers.map((d: any) => ({
      value: d.full_name || d.name,
      label: d.full_name || d.name,
      badge: d.employee_code || undefined,
      sublabel: d.phone_number || undefined
    }));

    if (formData.driver_name && !opts.some((o) => o.value.toLowerCase() === formData.driver_name.toLowerCase())) {
      opts.unshift({
        value: formData.driver_name,
        label: formData.driver_name,
        badge: 'Selected'
      });
    }

    return opts;
  }, [drivers, formData.driver_name]);

  const routeSearchOptions: SearchOption[] = React.useMemo(() => {
    const list = routes && routes.length > 0
      ? routes
      : [
          { service_number: 'SRV-101', starting_city: 'Hyderabad', ending_city: 'Bangalore', destination_km: 570 },
          { service_number: 'SRV-204', starting_city: 'Hyderabad', ending_city: 'Vijayawada', destination_km: 275 },
          { service_number: 'SRV-305', starting_city: 'Bangalore', ending_city: 'Chennai', destination_km: 345 },
          { service_number: 'SRV-412', starting_city: 'Hyderabad', ending_city: 'Visakhapatnam', destination_km: 620 }
        ];

    const opts: SearchOption[] = list.map((r: any) => {
      const from = r.starting_city || r.origin || '';
      const to = r.ending_city || r.destination || '';
      const label = from && to ? `${from} → ${to}` : (r.service_number || 'Route');
      return {
        value: label,
        label: label,
        badge: r.service_number || undefined,
        sublabel: r.destination_km ? `${r.destination_km} km` : undefined
      };
    });

    if (formData.route_trip && !opts.some((o) => o.value === formData.route_trip)) {
      opts.unshift({
        value: formData.route_trip,
        label: formData.route_trip,
        badge: 'Selected'
      });
    }

    return opts;
  }, [routes, formData.route_trip]);

  const busSearchOptions: SearchOption[] = React.useMemo(() => {
    return buses.map((b) => ({
      value: String(b.id),
      label: b.registration_number || b.bus_number,
      badge: b.bus_number,
      sublabel: [b.make, b.model].filter(Boolean).join(' ') || undefined
    }));
  }, [buses]);

  const handleOpenAdd = () => {
    setEditingInspection(null);
    setEditingItemNo(null);
    setEditingItemName('');
    setFormData({
      bus_id: '',
      vehicle_number: '',
      vehicle_model: '',
      driver_name: '',
      inspection_date: new Date().toISOString().split('T')[0],
      reporting_time: '',
      starting_km: '',
      closing_km: '',
      route_trip: '',
      mechanic_supervisor: 'Supervisor',
      defects_found: '',
      items: getSavedInspectionItems().map((item) => ({
        no: item.no,
        name: item.name,
        status: 'OK',
        remarks: ''
      }))
    });
    setIsAddOpen(true);
  };

  const handleBusSelectChange = async (busId: string) => {
    if (!busId) {
      setFormData((prev) => ({
        ...prev,
        bus_id: '',
        vehicle_number: '',
        vehicle_model: '',
        starting_km: ''
      }));
      setVehicleTyres([]);
      return;
    }
    const foundBus = buses.find((b) => String(b.id) === busId);
    const busModel = foundBus ? `${foundBus.make || ''} ${foundBus.model || ''}`.trim() : '';
    setFormData((prev) => ({
      ...prev,
      bus_id: busId,
      vehicle_number: foundBus ? foundBus.registration_number || foundBus.bus_number : '',
      vehicle_model: busModel,
      starting_km: foundBus?.current_odometer_km !== undefined ? foundBus.current_odometer_km : ''
    }));

    try {
      const tyres = await api.getNewTyres({ bus_id: busId }).catch(() => []);
      setVehicleTyres(tyres || []);
    } catch (_) {
      setVehicleTyres([]);
    }
  };

  const handleTyreKmChange = (tyreId: number, kmVal: number | string) => {
    setVehicleTyres((prev) =>
      prev.map((t) => (t.id === tyreId ? { ...t, present_km: kmVal === '' ? '' : Number(kmVal) } : t))
    );
  };

  const handleSyncStartingKmToTyres = () => {
    const sKm = Number(formData.starting_km);
    if (!sKm) return;
    setVehicleTyres((prev) =>
      prev.map((t) => ({ ...t, present_km: sKm }))
    );
  };

  const parseChecklistData = (dataStr?: string): DailyChecklistItem[] => {
    if (!dataStr) {
      return getSavedInspectionItems().map((item) => ({
        no: item.no,
        name: item.name,
        status: 'OK',
        remarks: ''
      }));
    }
    try {
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any, idx: number) => ({
          no: p.no || idx + 1,
          name: p.name || `Inspection item #${idx + 1}`,
          status: p.status === 'Not OK' ? 'Not OK' : 'OK',
          remarks: p.remarks || ''
        }));
      }
    } catch (_) {
      // Fallback
    }
    return getSavedInspectionItems().map((item) => ({
      no: item.no,
      name: item.name,
      status: 'OK',
      remarks: ''
    }));
  };

  const handleOpenEdit = (item: any) => {
    setEditingInspection(item);
    setEditingItemNo(null);
    setEditingItemName('');
    const foundBus = buses.find((b) => b.id === item.bus_id);
    const busModel = item.vehicle_model || (foundBus ? `${foundBus.make || ''} ${foundBus.model || ''}`.trim() : '');

    setFormData({
      bus_id: String(item.bus_id),
      vehicle_number: item.registration_number || foundBus?.registration_number || item.bus_number || '',
      vehicle_model: busModel,
      driver_name: item.driver_name || item.inspector_name || foundBus?.driver_name || '',
      inspection_date: item.inspection_date || new Date().toISOString().split('T')[0],
      reporting_time: item.reporting_time || item.inspection_time || '',
      starting_km: item.starting_km ?? item.odometer_km ?? '',
      closing_km: item.closing_km ?? '',
      route_trip: item.route_trip || '',
      mechanic_supervisor: item.mechanic_supervisor || item.inspector_name || 'Supervisor',
      defects_found: item.defects_found || '',
      items: parseChecklistData(item.checklist_data)
    });

    try {
      api.getNewTyres({ bus_id: item.bus_id }).then((tyres) => {
        setVehicleTyres(tyres || []);
      }).catch(() => setVehicleTyres([]));
    } catch (_) {
      setVehicleTyres([]);
    }

    setIsAddOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Daily Vehicle Check Report?')) return;
    try {
      await api.deleteBusCondition(id);
      success('Daily Vehicle Check Report deleted successfully!');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete checkup');
    }
  };

  const handleItemStatusChange = (no: number, status: 'OK' | 'Not OK') => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.no === no ? { ...it, status } : it))
    }));
  };

  const handleItemNameChange = (no: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.no === no ? { ...it, name } : it))
    }));
  };

  const handleStartEditItem = (no: number, currentName: string) => {
    setEditingItemNo(no);
    setEditingItemName(currentName);
  };

  const handleSaveEditItem = (no: number) => {
    if (!editingItemName.trim()) return;
    handleItemNameChange(no, editingItemName.trim());
    setEditingItemNo(null);
    setEditingItemName('');
  };

  const handleCancelEditItem = () => {
    setEditingItemNo(null);
    setEditingItemName('');
  };

  const handleAddInspectionItem = () => {
    const nextNo = formData.items.length + 1;
    const defaultName = `Inspection item #${nextNo}`;
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          no: nextNo,
          name: defaultName,
          status: 'OK',
          remarks: ''
        }
      ]
    }));
    setEditingItemNo(nextNo);
    setEditingItemName(defaultName);
  };

  const handleRemoveInspectionItem = (no: number) => {
    setFormData((prev) => {
      const filtered = prev.items.filter((it) => it.no !== no);
      const renumbered = filtered.map((it, idx) => ({
        ...it,
        no: idx + 1
      }));
      return {
        ...prev,
        items: renumbered
      };
    });
    if (editingItemNo === no) {
      setEditingItemNo(null);
      setEditingItemName('');
    }
  };

  const handleItemRemarksChange = (no: number, remarks: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.no === no ? { ...it, remarks } : it))
    }));
  };

  const handleMarkAll = (status: 'OK' | 'Not OK') => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => ({ ...it, status }))
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_id) {
      error('Please select a vehicle number');
      return;
    }

    const notOkCount = formData.items.filter((it) => it.status === 'Not OK').length;
    const roadworthinessStatus =
      notOkCount > 2 ? 'Not Fit for Service' : notOkCount > 0 ? 'Fit with Restrictions' : 'Fit for Service';

    const startingKmNum = Number(formData.starting_km) || 0;

    const payload = {
      bus_id: Number(formData.bus_id),
      inspection_date: formData.inspection_date,
      inspection_time: formData.reporting_time || '',
      reporting_time: formData.reporting_time || '',
      odometer_km: startingKmNum,
      starting_km: startingKmNum,
      closing_km: 0,
      driver_name: formData.driver_name,
      vehicle_model: formData.vehicle_model,
      route_trip: formData.route_trip,
      inspector_name: formData.driver_name || 'Driver',
      mechanic_supervisor: formData.mechanic_supervisor,
      defects_found: formData.defects_found,
      roadworthiness_status: roadworthinessStatus,
      checklist_data: JSON.stringify(formData.items),
      tyre_updates: vehicleTyres.map((vt) => ({
        id: vt.id,
        tyre_serial_number: vt.tyre_serial_number,
        present_km: Number(vt.present_km) || 0
      }))
    };

    try {
      if (editingInspection) {
        await api.updateBusCondition(editingInspection.id, payload);
        success('Daily Vehicle Check Report updated successfully!');
      } else {
        await api.createBusCondition(payload);
        success('Daily Vehicle Check Report logged successfully!');
      }

      // Synchronize starting KM into bus odometer so it shows everywhere KM data is displayed across the admin panel
      if (formData.bus_id) {
        await api.updateBus(formData.bus_id, {
          current_odometer_km: startingKmNum
        }).catch(() => {});
      }

      // Sync tyre present KM updates into New Tyres inventory
      if (vehicleTyres.length > 0) {
        for (const vt of vehicleTyres) {
          if (vt.id) {
            const pKm = Number(vt.present_km) || 0;
            const bKm = Number(vt.km) || 0;
            await api.updateNewTyre(vt.id, {
              ...vt,
              present_km: pKm,
              running_km: pKm >= bKm ? pKm - bKm : pKm
            }).catch(() => {});
          }
        }
      }

      // Persist any custom inspection items for all future checklists
      try {
        const customItems = formData.items
          .filter((it) => it.name && it.name.trim() && !DEFAULT_18_INSPECTION_ITEMS.some((d) => d.name.toLowerCase() === it.name.trim().toLowerCase()))
          .map((it) => ({ name: it.name.trim() }));
        if (customItems.length > 0) {
          localStorage.setItem('charvik_custom_inspection_items', JSON.stringify(customItems));
        }
      } catch (_) {}

      setIsAddOpen(false);
      setEditingInspection(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save vehicle check report');
    }
  };

  const handlePrintSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      window.print();
      return;
    }

    const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Vehicle Check Report - Charvik Fleet</title>
          ${existingStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
              font-size: 11px;
              line-height: 1.35;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-card {
              max-width: 780px;
              margin: 0 auto;
              padding: 8px;
            }
            .header-title {
              text-align: center;
              font-size: 21px;
              font-weight: 900;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            .header-sub {
              text-align: center;
              font-size: 11.5px;
              font-style: italic;
              color: #222;
              margin: 0 0 16px 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 36px;
              row-gap: 8px;
              margin-bottom: 14px;
            }
            .meta-row {
              display: flex;
              align-items: flex-end;
              font-size: 11px;
            }
            .meta-label {
              font-weight: bold;
              min-width: 110px;
              color: #000;
            }
            .meta-line {
              flex: 1;
              border-bottom: 1px solid #000;
              padding-bottom: 1px;
              font-weight: 600;
              min-height: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1.2px solid #000;
              margin-bottom: 12px;
              font-size: 10.5px;
            }
            th, td {
              border: 1px solid #777;
              padding: 3.5px 6px;
            }
            thead th {
              background-color: #DCE6F1 !important;
              color: #000;
              font-weight: bold;
              text-align: center;
              border: 1px solid #000;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .item-no {
              text-align: center;
              font-weight: bold;
              width: 32px;
            }
            .box-col {
              text-align: center;
              width: 46px;
            }
            .sq-box {
              display: inline-block;
              width: 10px;
              height: 10px;
              border: 1px solid #000;
              vertical-align: middle;
            }
            .sq-box-filled {
              display: inline-block;
              width: 9px;
              height: 9px;
              background-color: #000 !important;
              border: 1px solid #000;
              vertical-align: middle;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .defects-box {
              margin-top: 12px;
              font-size: 11px;
            }
            .defects-line {
              display: inline-block;
              width: 76%;
              border-bottom: 1px solid #000;
              font-weight: 600;
              min-height: 14px;
              margin-left: 6px;
            }
            .defects-line-full {
              display: block;
              width: 100%;
              border-bottom: 1px solid #000;
              min-height: 16px;
              margin-top: 10px;
            }
            .signatures {
              margin-top: 36px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .sig-field {
              display: inline-block;
              width: 200px;
              border-bottom: 1px solid #000;
              text-align: center;
              font-weight: bold;
              font-style: italic;
              margin-left: 6px;
            }
          </style>
        </head>
        <body>
          <div class="report-card">
            ${el.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const filteredInspections = inspections.filter((ins: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (ins.registration_number || '').toLowerCase().includes(s) ||
      (ins.bus_number || '').toLowerCase().includes(s) ||
      (ins.driver_name || '').toLowerCase().includes(s) ||
      (ins.vehicle_model || '').toLowerCase().includes(s) ||
      (ins.route_trip || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Daily Vehicle Checkup</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 ml-1">
              {inspections.length} Reports
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daily pre-trip inspection checklist — complete before starting the trip.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Vehicle Checkup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-2xl font-black text-slate-900 tracking-tight">{inspections.length}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Reports Recorded</p>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {inspections.filter((i) => i.roadworthiness_status === 'Fit for Service').length}
          </p>
          <p className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wider">Fit for Service</p>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <p className="text-2xl font-black text-rose-600 tracking-tight">
            {inspections.filter((i) => i.roadworthiness_status !== 'Fit for Service').length}
          </p>
          <p className="text-xs font-bold text-rose-700 mt-1 uppercase tracking-wider">Defects & Attention Required</p>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle number, driver, route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.registration_number || b.bus_number} ({b.bus_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table of Logged Checkup Reports */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" style={{ minWidth: '1050px' }}>
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">S.NO</th>
                <th className="py-3 px-4 min-w-[130px]">DATE</th>
                <th className="py-3 px-4 min-w-[150px]">VEHICLE NO & MODEL</th>
                <th className="py-3 px-4 min-w-[130px]">DRIVER NAME</th>
                <th className="py-3 px-4 min-w-[140px]">STARTING KM</th>
                <th className="py-3 px-4 min-w-[140px]">ROUTE / TRIP</th>
                <th className="py-3 px-4 min-w-[140px]">CHECKUP STATUS</th>
                <th className="py-3 px-4 text-center min-w-[130px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading vehicle check reports...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No vehicle checkup reports recorded.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &quot;Log Vehicle Checkup&quot; above to log pre-trip inspections.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((item: any, index) => {
                  const bus = buses.find((b) => b.id === item.bus_id);
                  const parsedItems = parseChecklistData(item.checklist_data);
                  const notOkCount = parsedItems.filter((i) => i.status === 'Not OK').length;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-500 text-center">{index + 1}</td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                        <span>{item.inspection_date}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 tracking-wider uppercase block">
                          {item.registration_number || bus?.registration_number || item.bus_number || '—'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                          {item.vehicle_model || (bus ? `${bus.make || ''} ${bus.model || ''}`.trim() : 'Fleet Bus')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {item.driver_name || item.inspector_name || bus?.driver_name || 'Driver Assigned'}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-blue-700">
                          {Number(item.starting_km || item.odometer_km || 0).toLocaleString('en-IN')} KM
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.route_trip || 'General Operations'}
                      </td>

                      <td className="py-3.5 px-4">
                        {notOkCount === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fit for Service</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{notOkCount} Defects Reported</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingInspection(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs cursor-pointer transition-colors"
                            title="View & Print Inspection Sheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="Edit Report"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD / EDIT CHECKUP MODAL ================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingInspection(null);
        }}
        title={editingInspection ? 'Edit Daily Vehicle Check Report' : 'Log Daily Vehicle Check Report'}
        subtitle="Daily pre-trip inspection checklist — complete before starting the trip."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Top Metadata Grid */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-medium"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Vehicle No."
                  required
                  placeholder="-- Select Vehicle --"
                  searchPlaceholder="Search vehicle number, type, model..."
                  options={busSearchOptions}
                  value={formData.bus_id}
                  onChange={(busId) => handleBusSelectChange(busId)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  placeholder="e.g. BharatBenz 1624 Sleeper"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-medium"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Driver Name"
                  required
                  placeholder="-- Search or Select Driver --"
                  searchPlaceholder="Search driver name or employee ID..."
                  options={driverSearchOptions}
                  value={formData.driver_name}
                  onChange={(val) => setFormData((prev) => ({ ...prev, driver_name: val }))}
                  allowCustom
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Starting KM</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.starting_km}
                  onChange={(e) => setFormData({ ...formData, starting_km: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono font-bold"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Route / Trip"
                  placeholder="-- Search or Select Route --"
                  searchPlaceholder="Search route, city or service no..."
                  options={routeSearchOptions}
                  value={formData.route_trip}
                  onChange={(val) => setFormData((prev) => ({ ...prev, route_trip: val }))}
                  allowCustom
                />
              </div>
            </div>
          </div>

          {/* VEHICLE TYRES & KM UPDATE (DIRECT SYNC TO TYRE MAINTENANCE) */}
          {formData.bus_id && (
            <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    <Disc className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">
                      Vehicle Tyres & KM Update
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Update tyre present running kilometers during daily checkup — automatically syncs to Tyre Maintenance.
                    </p>
                  </div>
                </div>

                {formData.starting_km && vehicleTyres.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncStartingKmToTyres}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    Sync Starting KM ({formData.starting_km} KM) to Tyres
                  </button>
                )}
              </div>

              {vehicleTyres.length === 0 ? (
                <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No specific new tyres currently assigned to this vehicle in inventory.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When new tyres are allotted to this vehicle in Tyre Maintenance, their present running kilometers can be recorded and tracked directly here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-50/80 text-blue-900 uppercase font-bold text-[10px] tracking-wider border-b border-blue-100">
                      <tr>
                        <th className="py-2 px-3">Tyre Number</th>
                        <th className="py-2 px-3">Position</th>
                        <th className="py-2 px-3">Before KM</th>
                        <th className="py-2 px-3">Present Tyre KM Running *</th>
                        <th className="py-2 px-3">Total KM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {vehicleTyres.map((vt) => {
                        const bKm = Number(vt.km) || 0;
                        const pKm = Number(vt.present_km) || 0;
                        const total = bKm + pKm;
                        return (
                          <tr key={vt.id} className="hover:bg-blue-50/30">
                            <td className="py-2 px-3 font-mono font-bold text-blue-900">
                              {vt.tyre_serial_number}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-600">
                              {vt.allocated_wheel_position || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              {bKm > 0 ? `${bKm.toLocaleString('en-IN')} KM` : '0 KM'}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={vt.present_km ?? ''}
                                onChange={(e) => handleTyreKmChange(vt.id, e.target.value)}
                                placeholder="Enter present tyre KM"
                                className="w-36 p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono font-bold text-indigo-700 text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono font-black text-emerald-700">
                              {total > 0 ? `${total.toLocaleString('en-IN')} KM` : '0 KM'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {formData.items.length}-Point Pre-Trip Inspection Checklist
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center border-r border-slate-300">No.</th>
                    <th className="py-2 px-3 border-r border-slate-300">Inspection item</th>
                    <th className="py-2 px-2 text-center w-16 border-r border-slate-300 font-bold">OK</th>
                    <th className="py-2 px-2 text-center w-20 border-r border-slate-300 font-bold">Not OK</th>
                    <th className="py-2 px-3 w-64">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {formData.items.map((item) => (
                    <tr key={item.no} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                        {item.no}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                        {editingItemNo === item.no ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditItem(item.no);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditItem();
                                }
                              }}
                              placeholder="Enter item name..."
                              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-blue-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditItem(item.no)}
                              className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                              title="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 group">
                            <span className="font-semibold text-slate-800 text-xs">{item.name}</span>
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(item.no, item.name)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit item name"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveInspectionItem(item.no)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* OK Column - Square Checkbox Matching Image 2 */}
                      <td
                        className="py-1.5 px-2 text-center border-r border-slate-200 cursor-pointer hover:bg-emerald-50/40 select-none"
                        onClick={() => handleItemStatusChange(item.no, 'OK')}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemStatusChange(item.no, 'OK');
                          }}
                          className="inline-flex items-center justify-center p-1 cursor-pointer focus:outline-none"
                          title="Mark as OK"
                        >
                          {item.status === 'OK' ? (
                            <span className="inline-block w-4 h-4 bg-black border-2 border-black rounded-xs shadow-2xs"></span>
                          ) : (
                            <span className="inline-block w-4 h-4 bg-white border-2 border-slate-400 rounded-xs hover:border-slate-600"></span>
                          )}
                        </button>
                      </td>

                      {/* Not OK Column - Square Checkbox Matching Image 2 */}
                      <td
                        className="py-1.5 px-2 text-center border-r border-slate-200 cursor-pointer hover:bg-rose-50/40 select-none"
                        onClick={() => handleItemStatusChange(item.no, 'Not OK')}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemStatusChange(item.no, 'Not OK');
                          }}
                          className="inline-flex items-center justify-center p-1 cursor-pointer focus:outline-none"
                          title="Mark as Not OK"
                        >
                          {item.status === 'Not OK' ? (
                            <span className="inline-block w-4 h-4 bg-black border-2 border-black rounded-xs shadow-2xs"></span>
                          ) : (
                            <span className="inline-block w-4 h-4 bg-white border-2 border-slate-400 rounded-xs hover:border-slate-600"></span>
                          )}
                        </button>
                      </td>

                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          placeholder="Optional notes / remark..."
                          value={item.remarks}
                          onChange={(e) => handleItemRemarksChange(item.no, e.target.value)}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white focus:border-blue-400 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Add Item Action */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddInspectionItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Inspection Item</span>
              </button>
              <span className="text-[11px] text-slate-500 font-semibold">
                Total Checklist Items: <strong className="text-slate-800">{formData.items.length}</strong>
              </span>
            </div>
          </div>

          {/* Bottom Section: Defects / Repairs & Signatures */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Defects / repairs required
              </label>
              <textarea
                rows={2}
                placeholder="Mention any mechanical, electrical or safety defects requiring maintenance..."
                value={formData.defects_found}
                onChange={(e) => setFormData({ ...formData, defects_found: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-all cursor-pointer shadow-sm"
            >
              Save Vehicle Check Report
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= VIEW & PRINT SAVED REPORT MODAL ================= */}
      {viewingInspection && (
        <Modal
          isOpen={!!viewingInspection}
          onClose={() => setViewingInspection(null)}
          title="Daily Vehicle Check Report"
          subtitle={`Vehicle ${viewingInspection.registration_number || viewingInspection.bus_number} • Date: ${viewingInspection.inspection_date}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => handlePrintSection('saved-report-printable-area')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print This Report</span>
              </button>
            </div>

            {/* Exactly matching reference image layout */}
            <div
              id="saved-report-printable-area"
              className="bg-white border border-slate-300 p-6 rounded-xl shadow-xs text-black font-sans"
            >
              <div className="text-center mb-4">
                <h1 className="text-xl font-black tracking-wide text-black uppercase mb-1">
                  DAILY VEHICLE CHECK REPORT
                </h1>
                <p className="text-xs text-slate-600 italic">
                  Daily pre-trip inspection checklist — complete before starting the trip.
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mb-4 text-xs">
                <div className="flex items-center">
                  <span className="w-28 font-bold text-slate-900">Date:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-semibold text-slate-900">
                    {viewingInspection.inspection_date || '—'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 font-bold text-slate-900">Vehicle No.:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-mono font-bold text-slate-900 uppercase">
                    {viewingInspection.registration_number || viewingInspection.bus_number || '—'}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="w-28 font-bold text-slate-900">Vehicle Model:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-semibold text-slate-900">
                    {viewingInspection.vehicle_model || 'Fleet Bus'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 font-bold text-slate-900">Driver Name:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-semibold text-slate-900">
                    {viewingInspection.driver_name || viewingInspection.inspector_name || '—'}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="w-28 font-bold text-slate-900">Starting KM:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-mono font-bold text-slate-900">
                    {viewingInspection.starting_km != null
                      ? `${Number(viewingInspection.starting_km).toLocaleString('en-IN')} KM`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 font-bold text-slate-900">Route / Trip:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-semibold text-slate-900">
                    {viewingInspection.route_trip || 'Transit Corridor'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black text-xs mb-4">
                <thead>
                  <tr className="bg-[#DCE6F1] text-black font-bold border-b border-black">
                    <th className="border border-black py-1.5 px-2 w-10 text-center">No.</th>
                    <th className="border border-black py-1.5 px-3 text-left">Inspection item</th>
                    <th className="border border-black py-1.5 px-2 w-16 text-center">OK</th>
                    <th className="border border-black py-1.5 px-2 w-20 text-center">Not OK</th>
                    <th className="border border-black py-1.5 px-3 text-left w-56">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {parseChecklistData(viewingInspection.checklist_data).map((item) => (
                    <tr key={item.no} className="border-b border-black">
                      <td className="border border-black py-1 px-2 text-center font-bold text-slate-800">
                        {item.no}
                      </td>
                      <td className="border border-black py-1 px-3 text-slate-900 font-medium">
                        {item.name}
                      </td>
                      <td className="border border-black py-1 px-2 text-center">
                        {item.status === 'OK' ? (
                          <span className="sq-box-filled inline-block w-2.5 h-2.5 bg-black text-black leading-none">■</span>
                        ) : (
                          <span className="sq-box inline-block w-2.5 h-2.5 border border-slate-400"></span>
                        )}
                      </td>
                      <td className="border border-black py-1 px-2 text-center">
                        {item.status === 'Not OK' ? (
                          <span className="sq-box-filled inline-block w-2.5 h-2.5 bg-black text-black leading-none">■</span>
                        ) : (
                          <span className="sq-box inline-block w-2.5 h-2.5 border border-slate-400"></span>
                        )}
                      </td>
                      <td className="border border-black py-1 px-3 text-slate-800 italic text-[11px]">
                        {item.remarks || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="space-y-4 pt-1 defects-box">
                <div>
                  <span className="font-bold text-slate-900 text-xs">Defects / repairs required: </span>
                  <span className="border-b border-black inline-block w-[75%] min-h-[16px] pb-0.5 text-xs text-slate-900 font-semibold defects-line">
                    {viewingInspection.defects_found || ''}
                  </span>
                  <div className="border-b border-black w-full min-h-[16px] mt-2 defects-line-full">&nbsp;</div>
                </div>

                <div className="flex items-center justify-between pt-6 text-xs signatures">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Driver Signature:</span>
                    <span className="border-b border-black w-48 inline-block pb-0.5 text-center font-bold text-slate-900 font-serif italic sig-field">
                      {viewingInspection.driver_name || viewingInspection.inspector_name || ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Mechanic / Supervisor:</span>
                    <span className="border-b border-black w-48 inline-block pb-0.5 text-center font-bold text-slate-900 font-serif italic sig-field">
                      {viewingInspection.mechanic_supervisor || 'Supervisor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= PRINT SHEET MODAL ================= */}
      {isBlankPrintModalOpen && (
        <Modal
          isOpen={isBlankPrintModalOpen}
          onClose={() => setIsBlankPrintModalOpen(false)}
          title="Print Sheet"
          subtitle="Ready to print daily pre-trip vehicle check report checklist."
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => handlePrintSection('blank-report-printable-area')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet</span>
              </button>
            </div>

            {/* Exactly matching reference image layout */}
            <div
              id="blank-report-printable-area"
              className="bg-white border border-slate-300 p-6 rounded-xl shadow-xs text-black font-sans"
            >
              <div className="text-center mb-4">
                <h1 className="text-xl font-black tracking-wide text-black uppercase mb-1 header-title">
                  DAILY VEHICLE CHECK REPORT
                </h1>
                <p className="text-xs text-slate-600 italic header-sub">
                  Daily pre-trip inspection checklist — complete before starting the trip.
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4 text-xs meta-grid">
                <div className="flex items-center meta-row">
                  <span className="w-28 font-bold text-slate-900 meta-label">Date:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>
                <div className="flex items-center meta-row">
                  <span className="w-32 font-bold text-slate-900 meta-label">Vehicle No.:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>

                <div className="flex items-center meta-row">
                  <span className="w-28 font-bold text-slate-900 meta-label">Vehicle Model:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>
                <div className="flex items-center meta-row">
                  <span className="w-32 font-bold text-slate-900 meta-label">Driver Name:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>

                <div className="flex items-center meta-row">
                  <span className="w-28 font-bold text-slate-900 meta-label">Starting KM:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>
                <div className="flex items-center meta-row">
                  <span className="w-32 font-bold text-slate-900 meta-label">Route / Trip:</span>
                  <span className="flex-1 border-b border-black pb-0.5 font-medium meta-line">&nbsp;</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black text-xs mb-4">
                <thead>
                  <tr className="bg-[#DCE6F1] text-black font-bold border-b border-black">
                    <th className="border border-black py-1.5 px-2 w-10 text-center item-no">No.</th>
                    <th className="border border-black py-1.5 px-3 text-left">Inspection item</th>
                    <th className="border border-black py-1.5 px-2 w-16 text-center box-col">OK</th>
                    <th className="border border-black py-1.5 px-2 w-20 text-center box-col">Not OK</th>
                    <th className="border border-black py-1.5 px-3 text-left w-56">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {getSavedInspectionItems().map((item) => (
                    <tr key={item.no} className="border-b border-black">
                      <td className="border border-black py-1 px-2 text-center font-bold text-slate-800 item-no">
                        {item.no}
                      </td>
                      <td className="border border-black py-1 px-3 text-slate-900 font-medium">
                        {item.name}
                      </td>
                      <td className="border border-black py-1 px-2 text-center box-col">
                        <span className="sq-box-filled inline-block w-2.5 h-2.5 bg-black text-black leading-none">■</span>
                      </td>
                      <td className="border border-black py-1 px-2 text-center box-col">
                        <span className="sq-box-filled inline-block w-2.5 h-2.5 bg-black text-black leading-none">■</span>
                      </td>
                      <td className="border border-black py-1 px-3 text-slate-400">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="space-y-4 pt-1 defects-box">
                <div>
                  <span className="font-bold text-slate-900 text-xs">Defects / repairs required: </span>
                  <span className="border-b border-black inline-block w-[75%] min-h-[16px] pb-0.5 defects-line">
                    &nbsp;
                  </span>
                  <div className="border-b border-black w-full min-h-[16px] mt-2 defects-line-full">&nbsp;</div>
                </div>

                <div className="flex items-center justify-between pt-8 text-xs signatures">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Driver Signature:</span>
                    <span className="border-b border-black w-48 inline-block pb-0.5 sig-field">&nbsp;</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Mechanic / Supervisor:</span>
                    <span className="border-b border-black w-48 inline-block pb-0.5 sig-field">&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BusCondition;
