import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Bus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  Disc,
  Gauge,
  ClipboardList,
  AlertCircle,
  Calendar,
  MapPin,
  Save,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';
import type { BusConditionInspection, Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';
import { printSheet } from '../utils/printSheet';
import { exportTableToExcel } from '../utils/exportToExcel';
import { CharvikCompanyDetailsFields } from '../components/common/CharvikCompanyDetailsFields';
import { getSavedCharvikCompanyDetails, type CharvikCompanyDetails } from '../utils/charvikCompanyDetails';

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
  } catch { }
  return DEFAULT_18_INSPECTION_ITEMS;
};

export const BusCondition: React.FC = () => {
  const { user } = useAuth();
  const [companyDetails, setCompanyDetails] = useState<CharvikCompanyDetails>(getSavedCharvikCompanyDetails());
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
    } catch { }
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
    const handleBusKmUpdated = () => {
      loadData();
    };
    window.addEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    return () => {
      window.removeEventListener('charvik_bus_km_updated', handleBusKmUpdated);
    };
  }, [selectedBus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insData, busesData, routesData, driversData] = await Promise.all([
        api.getBusConditions(selectedBus ? { bus_id: selectedBus } : undefined).catch(() => []),
        api.getBuses().catch(() => []),
        api.getRoutes().catch(() => []),
        api.getEmployees({ role: 'Driver' }).catch(() => [])
      ]);
      setInspections(Array.isArray(insData) ? insData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      if (Array.isArray(routesData) && routesData.length > 0) {
        setRoutes(routesData);
      }
      if (Array.isArray(driversData) && driversData.length > 0) {
        setDrivers(driversData);
      }
    } catch (err: any) {
      error(err?.message || 'Failed to load inspections');
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
      label: (b.registration_number || b.bus_number || '').split('(')[0].trim().toUpperCase()
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

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      const isUserAdmin = Boolean(
        user?.role?.toLowerCase()?.includes('admin') ||
        (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
      );

      let selectedBusId = formData.bus_id;
      let selectedVehicleNum = formData.vehicle_number;

      if (!selectedBusId) {
        error('Please select a vehicle number');
        return;
      }

      if (!selectedVehicleNum && selectedBusId) {
        const found = buses.find((b) => String(b.id) === String(selectedBusId));
        if (found) {
          selectedVehicleNum = (found.registration_number || found.bus_number || '').split(/[-–(]/)[0].trim().toUpperCase();
        }
      }

      const notOkCount = (formData.items || []).filter((it) => it.status === 'Not OK').length;
      const roadworthinessStatus =
        notOkCount > 2 ? 'Not Fit for Service' : notOkCount > 0 ? 'Fit with Restrictions' : 'Fit for Service';

      const startingKmNum = Number(formData.starting_km) || 0;
      const inspectionDate = formData.inspection_date || new Date().toISOString().split('T')[0];

      const payload = {
        bus_id: Number(selectedBusId),
        inspection_date: inspectionDate,
        inspection_time: formData.reporting_time || '',
        reporting_time: formData.reporting_time || '',
        odometer_km: startingKmNum,
        starting_km: startingKmNum,
        closing_km: 0,
        driver_name: formData.driver_name || 'Driver',
        vehicle_model: formData.vehicle_model || '',
        route_trip: formData.route_trip || '',
        inspector_name: formData.driver_name || 'Driver',
        mechanic_supervisor: formData.mechanic_supervisor || '',
        defects_found: formData.defects_found || '',
        roadworthiness_status: roadworthinessStatus,
        checklist_data: JSON.stringify(formData.items || [])
      };

      if (editingInspection) {
        await api.updateBusCondition(editingInspection.id, payload);
        success('Daily Vehicle Check Report updated successfully!');
      } else {
        await api.createBusCondition(payload);
        success('Daily Vehicle Check Report saved successfully!');
      }

      // Automatically update vehicle starting/odometer KM and sync to all related tabs & tyres
      if (selectedBusId) {
        // 1. Update bus odometer across fleet
        if (startingKmNum > 0) {
          await api.updateBus(Number(selectedBusId), {
            current_odometer_km: startingKmNum,
            starting_km: startingKmNum,
            odometer_km: startingKmNum
          }).catch(() => { });

          // Update local bus cache
          try {
            const rawBuses = localStorage.getItem('charvik_cache_buses') || localStorage.getItem('charvik_buses_data');
            if (rawBuses) {
              const bList = JSON.parse(rawBuses);
              if (Array.isArray(bList)) {
                const updatedBuses = bList.map((b: any) =>
                  String(b.id) === String(selectedBusId) || (selectedVehicleNum && (b.registration_number === selectedVehicleNum || b.bus_number === selectedVehicleNum))
                    ? { ...b, current_odometer_km: startingKmNum, starting_km: startingKmNum, latest_checkup_km: startingKmNum }
                    : b
                );
                localStorage.setItem('charvik_cache_buses', JSON.stringify(updatedBuses));
                localStorage.setItem('charvik_buses_data', JSON.stringify(updatedBuses));
              }
            }
          } catch (_) { }
        }

        // 2. Direct automatic sync to all tyres allotted to this vehicle in New Tyres inventory
        try {
          const allNewTyres = await api.getNewTyres().catch(() => []);
          if (Array.isArray(allNewTyres)) {
            const cleanTargetVeh = (selectedVehicleNum || '').split(/[-–(]/)[0].trim().toUpperCase();
            const vehicleTyresList = allNewTyres.filter((nt: any) => {
              if (String(nt.allocated_bus_id) === String(selectedBusId)) return true;
              const tVeh = (nt.vehicle_number || nt.allocated_bus_number || '').split(/[-–(]/)[0].trim().toUpperCase();
              return Boolean(tVeh && cleanTargetVeh && tVeh === cleanTargetVeh);
            });
            for (const vt of vehicleTyresList) {
              if (vt.id) {
                const bKm = Number(vt.starting_km ?? vt.km) || 0;
                await api.updateNewTyre(vt.id, {
                  ...vt,
                  allocated_bus_id: Number(selectedBusId),
                  allocated_bus_number: selectedVehicleNum,
                  vehicle_number: selectedVehicleNum,
                  starting_km: bKm,
                  present_km: startingKmNum,
                  total_km: bKm + startingKmNum,
                  running_km: startingKmNum >= bKm ? startingKmNum - bKm : startingKmNum
                }).catch(() => { });
              }
            }
          }
        } catch (_) { }

        // 3. Direct automatic sync to tyre records (mounted tyres)
        if (startingKmNum > 0) {
          try {
            const tyreRecs = await api.getTyreRecords({ bus_id: Number(selectedBusId) }).catch(() => []);
            if (Array.isArray(tyreRecs)) {
              for (const tr of tyreRecs) {
                if (tr.id) {
                  await api.updateTyreRecord(tr.id, {
                    ...tr,
                    last_km: startingKmNum,
                    current_km: startingKmNum
                  }).catch(() => { });
                }
              }
            }
          } catch (_) { }
        }

        // 4. Save inspection to local cache
        try {
          const insRaw = localStorage.getItem('charvik_inspections_data');
          const insList = insRaw ? JSON.parse(insRaw) : [];
          const newInsEntry = {
            id: editingInspection?.id || Date.now(),
            bus_id: Number(selectedBusId),
            registration_number: selectedVehicleNum,
            bus_number: selectedVehicleNum,
            vehicle_number: selectedVehicleNum,
            starting_km: startingKmNum,
            odometer_km: startingKmNum,
            inspection_date: inspectionDate,
            roadworthiness_status: roadworthinessStatus,
            created_at: new Date().toISOString()
          };
          const filteredIns = Array.isArray(insList) ? insList.filter((i: any) => i.id !== newInsEntry.id) : [];
          localStorage.setItem('charvik_inspections_data', JSON.stringify([newInsEntry, ...filteredIns]));
        } catch (_) { }

        // 5. Dispatch global event so all tabs/pages update live
        try {
          window.dispatchEvent(new CustomEvent('charvik_bus_km_updated', {
            detail: { bus_id: Number(selectedBusId), vehicle_number: selectedVehicleNum, km: startingKmNum }
          }));
        } catch (_) { }
      }

      // Persist any custom inspection items for all future checklists
      try {
        const customItems = (formData.items || [])
          .filter((it) => it.name && it.name.trim() && !DEFAULT_18_INSPECTION_ITEMS.some((d) => d.name.toLowerCase() === it.name.trim().toLowerCase()))
          .map((it) => ({ name: it.name.trim() }));
        if (customItems.length > 0) {
          localStorage.setItem('charvik_custom_inspection_items', JSON.stringify(customItems));
        }
      } catch (_) { }

      setIsAddOpen(false);
      setEditingInspection(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save vehicle check report:', err);
      error(err?.message || 'Failed to save vehicle check report');
    }
  };

  const handlePrintSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return;
    }

    let iframe = document.getElementById('bus-condition-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'bus-condition-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1024px';
      iframe.style.height = '1440px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Vehicle Check Report - Charvik Fleet</title>
          ${existingStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
            }
            * {
              box-sizing: border-box !important;
            }
            html, body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
              font-size: 10.5px;
              line-height: 1.35;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-card {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 auto;
              padding: 2px;
              box-sizing: border-box !important;
            }
            .header-title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
              text-transform: uppercase;
            }
            .header-sub {
              text-align: center;
              font-size: 11px;
              font-style: italic;
              color: #222;
              margin: 0 0 14px 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 24px;
              row-gap: 6px;
              margin-bottom: 12px;
            }
            .meta-row {
              display: flex;
              align-items: flex-end;
              font-size: 10.5px;
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
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              border: 1.2px solid #000;
              margin-bottom: 10px;
              font-size: 9.5px;
              box-sizing: border-box !important;
            }
            th, td {
              border: 1px solid #777;
              padding: 3px 5px;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
              box-sizing: border-box !important;
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
              width: 44px;
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
              margin-top: 10px;
              font-size: 10.5px;
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
              margin-top: 8px;
            }
            .signatures {
              margin-top: 28px;
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
            }
            .sig-field {
              display: inline-block;
              width: 180px;
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
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 250);
  };

  const handleExportTableExcel = () => {
    const headers = ['S.No', 'Date', 'Vehicle Number', 'Captain / Driver', 'Starting KM', 'Ending KM', 'Total KM', 'Issues Count', 'Inspection Status'];
    const rows = filteredInspections.map((item: any, idx) => [
      idx + 1,
      item.inspection_date || '',
      item.registration_number || item.bus_number || '',
      item.inspector_name || item.driver_name || '',
      item.starting_km || 0,
      item.ending_km || 0,
      item.total_km || 0,
      item.issues_count || 0,
      item.status || 'Passed'
    ]);

    exportTableToExcel({
      title: 'Daily Pre-Trip Vehicle Checkup Reports',
      subtitle: `Total Reports: ${filteredInspections.length} | Pre-trip inspections recorded across fleet`,
      headers,
      rows
    });
  };

  const handlePrintTable = () => {
    printSheet({
      title: 'Daily Pre-Trip Vehicle Checkup Reports',
      subtitle: `Total Reports: ${filteredInspections.length} | Pre-trip inspections recorded across fleet`,
      elementId: 'bus-condition-records-table-container',
      orientation: 'landscape'
    });
  };

  const handleExportSingleReportExcel = (insp: BusConditionInspection) => {
    let checklist: DailyChecklistItem[] = [];
    try {
      checklist = insp.checklist_data
        ? (typeof insp.checklist_data === 'string' ? JSON.parse(insp.checklist_data) : insp.checklist_data)
        : [];
    } catch {
      checklist = [];
    }

    const headers = ['Item #', 'Inspection Component', 'Status', 'Remarks / Defects'];
    const rows = checklist.map((item) => [
      item.no,
      item.name,
      item.status,
      item.remarks || '-'
    ]);

    exportTableToExcel({
      title: `Daily Pre-Trip Vehicle Check Report - ${insp.registration_number || insp.bus_number}`,
      subtitle: `Date: ${insp.inspection_date} | Starting KM: ${insp.starting_km || 0} | Ending KM: ${insp.ending_km || 0} | Inspector: ${insp.inspector_name || insp.driver_name || 'Staff'} | Status: ${insp.status || 'Passed'}`,
      headers,
      rows
    });
  };

  const handleExportBlankTemplateExcel = () => {
    const headers = ['Item #', 'Inspection Component', 'Status (OK / Not OK)', 'Remarks / Notes'];
    const rows = DEFAULT_18_INSPECTION_ITEMS.map((item) => [
      item.no,
      item.name,
      '',
      ''
    ]);
    exportTableToExcel({
      title: 'Daily Pre-Trip Vehicle Check Report - Blank Inspection Checklist',
      subtitle: 'Charvik Staffing & Fleet Operations • Daily Pre-Trip Checklist Form',
      headers,
      rows
    });
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
      {/* Page Header with Real Bus Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Daily Vehicle Checkup
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {inspections.length} Reports
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Daily pre-trip inspection checklist — complete before starting the transport corridor.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet2.jpg"
                alt="Inspection Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Pre-Trip Check</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportTableExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="Export Vehicle Checkups to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintTable}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="Print Vehicle Checkup Sheet"
          >
            <Printer className="w-4 h-4 text-purple-100" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-blue-800" />
            <span>+ Log Vehicle Checkup</span>
          </button>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards - Vibrant Gradients matching user reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: TOTAL REPORTS RECORDED (Vibrant Blue Gradient) */}
        <div className="bg-gradient-to-r from-sky-400 to-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black text-sky-100 uppercase tracking-wider">TOTAL REPORTS RECORDED</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 font-mono">{inspections.length}</p>
              <p className="text-[11px] font-semibold text-sky-100/90 mt-0.5">Pre-trip logs</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 font-bold">
            →
          </div>
        </div>

        {/* Card 2: FIT FOR SERVICE (Vibrant Emerald Green Gradient) */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black text-emerald-100 uppercase tracking-wider">FIT FOR SERVICE</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 font-mono">
                {inspections.filter((i) => i.roadworthiness_status === 'Fit for Service').length}
              </p>
              <p className="text-[11px] font-semibold text-emerald-100/90 mt-0.5">Passed full checklist</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
        </div>

        {/* Card 3: DEFECTS & ATTENTION (Vibrant Crimson Red Gradient) */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white p-5 rounded-3xl shadow-lg shadow-rose-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black text-rose-100 uppercase tracking-wider">DEFECTS &amp; ATTENTION</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 font-mono">
                {inspections.filter((i) => i.roadworthiness_status !== 'Fit for Service').length}
              </p>
              <p className="text-[11px] font-semibold text-rose-100/90 mt-0.5">Deficiencies noted</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 font-bold text-sm">
            !
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle number, driver, route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="w-full md:w-72">
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {(b.registration_number || b.bus_number || '').split('(')[0].trim().toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table of Logged Checkup Reports */}
      <div id="bus-condition-records-table-container" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: '750px' }}>
            <thead className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] text-white uppercase font-black tracking-wider text-xs border-b border-indigo-900/30">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">S.NO</th>
                <th className="py-2.5 px-3 min-w-[95px]">DATE</th>
                <th className="py-2.5 px-3 min-w-[110px]">VEHICLE NO</th>
                <th className="py-2.5 px-3 min-w-[100px]">STARTING KM</th>
                <th className="py-2.5 px-3 min-w-[100px]">ROUTE / TRIP</th>
                <th className="py-2.5 px-3 min-w-[100px]">CHECKUP STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[100px] no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading vehicle check reports...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
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
                      <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>

                      <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-900">
                        <span>{item.inspection_date}</span>
                      </td>

                      <td className="py-2 px-3">
                        <span className="font-mono font-black text-slate-900 tracking-wider uppercase block text-sm">
                          {item.registration_number || bus?.registration_number || item.bus_number || '—'}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-blue-700 text-sm">
                          {Number(item.starting_km || item.odometer_km || 0).toLocaleString('en-IN')} KM
                        </span>
                      </td>

                      <td className="py-2 px-3 font-medium text-slate-700">
                        {item.route_trip || 'General Operations'}
                      </td>

                      <td className="py-2 px-3">
                        {notOkCount === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fit for Service</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{notOkCount} Defects Reported</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingInspection(item)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs cursor-pointer transition-colors"
                            title="View & Print Inspection Sheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                            title="Edit Report"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200 shadow-2xs"
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
        <form noValidate onSubmit={handleSave} className="space-y-4">
          {/* Top Metadata Grid */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="flex items-center gap-1.5 font-bold text-xs text-slate-800 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Date <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Vehicle No."
                  required
                  placeholder="-- Select Vehicle --"
                  searchPlaceholder="Search vehicle number..."
                  options={busSearchOptions}
                  value={formData.bus_id}
                  onChange={(busId) => handleBusSelectChange(busId)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-xs text-slate-800 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span>Starting KM</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.starting_km}
                  onChange={(e) => setFormData({ ...formData, starting_km: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white outline-none font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 shadow-2xs"
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

          {/* Dynamic Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                <Wrench className="w-4 h-4 text-white" />
                <span>{formData.items.length}-Point Pre-Trip Inspection Checklist</span>
              </div>
            </div>

            <div className="border border-blue-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#004B9E] text-white font-bold border-b border-blue-900 sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-blue-800/60">No.</th>
                    <th className="py-2.5 px-3 border-r border-blue-800/60">Inspection item</th>
                    <th className="py-2.5 px-2 text-center w-16 border-r border-blue-800/60 font-bold">OK</th>
                    <th className="py-2.5 px-2 text-center w-20 border-r border-blue-800/60 font-bold">Not OK</th>
                    <th className="py-2.5 px-3 w-64">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {formData.items.map((item) => (
                    <tr key={item.no} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
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

                      {/* OK Column - Square Checkbox Matching Image */}
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
                          className="inline-flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
                          title="Mark as OK"
                        >
                          {item.status === 'OK' ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-600 rounded-md text-white shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-block w-5 h-5 bg-white border-2 border-slate-300 rounded-md hover:border-slate-400"></span>
                          )}
                        </button>
                      </td>

                      {/* Not OK Column - Square Checkbox Matching Image */}
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
                          className="inline-flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
                          title="Mark as Not OK"
                        >
                          {item.status === 'Not OK' ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-600 rounded-md text-white shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-block w-5 h-5 bg-white border-2 border-slate-300 rounded-md hover:border-slate-400"></span>
                          )}
                        </button>
                      </td>

                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          placeholder="Optional notes / remark..."
                          value={item.remarks}
                          onChange={(e) => handleItemRemarksChange(item.no, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-blue-100 bg-white focus:border-blue-400 outline-none"
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
              <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-lg text-xs font-bold border border-blue-200">
                Total Checklist Items: <strong className="text-blue-950 font-black">{formData.items.length}</strong>
              </span>
            </div>
          </div>

          {/* Bottom Section: Defects / Repairs & Signatures */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Defects / Repairs Required</span>
              </label>
              <textarea
                rows={2}
                placeholder="Mention any mechanical, electrical or safety defects requiring maintenance..."
                value={formData.defects_found}
                onChange={(e) => setFormData({ ...formData, defects_found: e.target.value })}
                className="w-full text-sm p-3.5 rounded-2xl border border-blue-200 bg-white focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-slate-800 shadow-2xs resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Charvik Company & Tax Details */}
          <CharvikCompanyDetailsFields
            sectionTitle="Charvik Staffing & Consultancy Company & Tax Details (Printout Header)"
            values={companyDetails}
            onChange={(updated) => setCompanyDetails((prev) => ({ ...prev, ...updated }))}
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-6 py-2.5 rounded-2xl border border-slate-300 font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-sm font-black shadow-md flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Vehicle Check Report</span>
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
                onClick={() => handleExportSingleReportExcel(viewingInspection)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
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
              {/* Official Charvik Letterhead Header */}
              <div className="border-2 border-[#0056b3] rounded-xl p-2.5 sm:p-3 bg-white text-center mb-3">
                <div className="flex justify-center items-center mb-2">
                  <img
                    src="/charvik-print-logo.png?v=20261120_print"
                    alt="CHARVIK STAFFING CONSULTANCY"
                    className="h-14 max-h-[58px] w-auto max-w-[320px] object-contain block mx-auto"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo-brand.png'; }}
                  />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-black mb-1.5 leading-tight">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Phone:</span>
                    <span className="text-black">{companyDetails.company_phone || '9505151527'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Email:</span>
                    <span className="text-black">{companyDetails.company_email || 'charvikstaffingconsultancy@gmail.com'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Web:</span>
                    <span className="text-black">{companyDetails.company_website || 'www.charvikstaffing.com'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Location:</span>
                    <span className="text-black">{companyDetails.company_address || 'Hyderabad, Telangana'}</span>
                  </span>
                </div>
              </div>

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
                onClick={handleExportBlankTemplateExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
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
              {/* Official Charvik Letterhead Header */}
              <div className="border-2 border-[#0056b3] rounded-xl p-2.5 sm:p-3 bg-white text-center mb-3">
                <div className="flex justify-center items-center mb-2">
                  <img
                    src="/charvik-print-logo.png?v=20261120_print"
                    alt="CHARVIK STAFFING CONSULTANCY"
                    className="h-14 max-h-[58px] w-auto max-w-[320px] object-contain block mx-auto"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo-brand.png'; }}
                  />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-black mb-1.5 leading-tight">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Phone:</span>
                    <span className="text-black">{companyDetails.company_phone || '9505151527'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Email:</span>
                    <span className="text-black">{companyDetails.company_email || 'charvikstaffingconsultancy@gmail.com'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Web:</span>
                    <span className="text-black">{companyDetails.company_website || 'www.charvikstaffing.com'}</span>
                  </span>
                  <span className="text-[#0056b3] font-black">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[#0056b3] font-extrabold">Location:</span>
                    <span className="text-black">{companyDetails.company_address || 'Hyderabad, Telangana'}</span>
                  </span>
                </div>
              </div>

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
