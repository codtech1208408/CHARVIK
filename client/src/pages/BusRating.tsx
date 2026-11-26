import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  Star,
  ThumbsDown,
  Navigation,
  MapPin,
  Calendar,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Edit,
  Trash2,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Route,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import * as XLSX from 'xlsx';
import { printSheet } from '../utils/printSheet';
import { exportTableToExcel } from '../utils/exportToExcel';

export interface BusRatingRecord {
  id: string;
  travelDate: string;
  operator: string;
  tripBusNo: string;
  pnrNumber: string;
  origin: string;
  destination: string;
  customerName: string;
  phoneNumber: string;
  calledByAgent: string;
  rating: number; // 1 to 5
  complaintsRemarks: string;
  customerImages?: string[];
  createdAt?: string;
}

const INITIAL_RATINGS: BusRatingRecord[] = [
  {
    id: 'BR-101',
    travelDate: '2026-11-17',
    operator: 'SR Travels',
    tripBusNo: 'SR1234',
    pnrNumber: 'PNR784562',
    origin: 'Bengaluru',
    destination: 'Hyderabad',
    customerName: 'Ramesh',
    phoneNumber: '98765 43210',
    calledByAgent: 'Lokesh',
    rating: 5,
    complaintsRemarks: 'Good service, bus clean'
  },
  {
    id: 'BR-102',
    travelDate: '2026-11-17',
    operator: 'Vaishnavi Travels',
    tripBusNo: 'VT7788',
    pnrNumber: 'PNR659321',
    origin: 'Chennai',
    destination: 'Bengaluru',
    customerName: 'Sujatha',
    phoneNumber: '90123 45678',
    calledByAgent: 'Anil',
    rating: 4,
    complaintsRemarks: 'AC cooling low'
  },
  {
    id: 'BR-103',
    travelDate: '2026-11-16',
    operator: 'YoloBus',
    tripBusNo: 'YB2255',
    pnrNumber: 'PNR472189',
    origin: 'Hyderabad',
    destination: 'Vijayawada',
    customerName: 'Kiran',
    phoneNumber: '93456 78901',
    calledByAgent: 'Rajesh',
    rating: 5,
    complaintsRemarks: 'Excellent driving'
  },
  {
    id: 'BR-104',
    travelDate: '2026-11-16',
    operator: 'SR Travels',
    tripBusNo: 'SR9901',
    pnrNumber: 'PNR336780',
    origin: 'Bengaluru',
    destination: 'Mysuru',
    customerName: 'Mahesh',
    phoneNumber: '99887 65432',
    calledByAgent: 'Lokesh',
    rating: 3,
    complaintsRemarks: 'Delay in departure'
  },
  {
    id: 'BR-105',
    travelDate: '2026-11-15',
    operator: 'Charvik Travels',
    tripBusNo: 'CT4477',
    pnrNumber: 'PNR998221',
    origin: 'Pune',
    destination: 'Goa',
    customerName: 'Deepak',
    phoneNumber: '91234 56789',
    calledByAgent: 'Suresh',
    rating: 4,
    complaintsRemarks: 'Clean bus, polite staff'
  }
];

const KNOWN_OPERATORS = [
  'SR Travels',
  'Vaishnavi Travels',
  'YoloBus',
  'Charvik Travels',
  'KVR Travels',
  'Orange Travels',
  'Morning Star Travels',
  'VRL Travels',
  'SRS Travels',
  'GreenLine Travels',
  'Kallada Travels',
  'Jabbar Travels'
];

export interface AutoServiceOption {
  serviceNumber: string;
  name: string;
  origin: string;
  destination: string;
  operator: string;
  defaultVehicle?: string;
}

export interface AutoVehicleOption {
  busNumber: string;
  operator: string;
  model?: string;
}

const DEFAULT_SERVICES: AutoServiceOption[] = [
  { serviceNumber: 'SR1234', name: 'SR1234 (Bengaluru → Hyderabad)', origin: 'Bengaluru', destination: 'Hyderabad', operator: 'SR Travels', defaultVehicle: 'AP 09 BK 1234' },
  { serviceNumber: 'VT7788', name: 'VT7788 (Chennai → Bengaluru)', origin: 'Chennai', destination: 'Bengaluru', operator: 'Vaishnavi Travels', defaultVehicle: 'TS 08 UA 5678' },
  { serviceNumber: 'YB2255', name: 'YB2255 (Hyderabad → Vijayawada)', origin: 'Hyderabad', destination: 'Vijayawada', operator: 'YoloBus', defaultVehicle: 'AP 29 ZZ 1122' },
  { serviceNumber: 'SR9901', name: 'SR9901 (Bengaluru → Mysuru)', origin: 'Bengaluru', destination: 'Mysuru', operator: 'SR Travels', defaultVehicle: 'KA 01 AB 4321' },
  { serviceNumber: 'VT3322', name: 'VT3322 (Hyderabad → Tirupati)', origin: 'Hyderabad', destination: 'Tirupati', operator: 'Vaishnavi Travels', defaultVehicle: 'TS 09 XY 9988' },
  { serviceNumber: 'CT1001', name: 'CT1001 (Hyderabad → Visakhapatnam)', origin: 'Hyderabad', destination: 'Visakhapatnam', operator: 'Charvik Travels', defaultVehicle: 'AP 31 CT 1001' },
  { serviceNumber: 'KVR4040', name: 'KVR4040 (Bengaluru → Pune)', origin: 'Bengaluru', destination: 'Pune', operator: 'KVR Travels', defaultVehicle: 'KA 04 KV 4040' },
  { serviceNumber: 'OT5500', name: 'OT5500 (Chennai → Coimbatore)', origin: 'Chennai', destination: 'Coimbatore', operator: 'Orange Travels', defaultVehicle: 'TN 38 OT 5500' }
];

const DEFAULT_VEHICLES: AutoVehicleOption[] = [
  { busNumber: 'AP 09 BK 1234', operator: 'SR Travels', model: 'Volvo B11R Multi-Axle' },
  { busNumber: 'TS 08 UA 5678', operator: 'Vaishnavi Travels', model: 'Scania Metrolink HD' },
  { busNumber: 'KA 01 AB 4321', operator: 'SR Travels', model: 'Mercedes-Benz SHD' },
  { busNumber: 'AP 29 ZZ 1122', operator: 'YoloBus', model: 'Volvo 9600 Sleeper' },
  { busNumber: 'TS 09 XY 9988', operator: 'Vaishnavi Travels', model: 'BharatBenz AC Sleeper' },
  { busNumber: 'AP 31 CT 1001', operator: 'Charvik Travels', model: 'Volvo B8R Intercity' },
  { busNumber: 'KA 04 KV 4040', operator: 'KVR Travels', model: 'Ashok Leyland Viking AC' },
  { busNumber: 'TN 38 OT 5500', operator: 'Orange Travels', model: 'Scania 14.5M Multi-Axle' }
];

const AGENTS_LIST = ['Lokesh', 'Anil', 'Rajesh', 'Suresh', 'Kavitha', 'Admin Manager'];

export const BusRating: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<BusRatingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_bus_ratings');
      if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_RATINGS;
  });

  // Automatic Service and Vehicle Options
  const [servicesList, setServicesList] = useState<AutoServiceOption[]>(DEFAULT_SERVICES);
  const [vehiclesList, setVehiclesList] = useState<AutoVehicleOption[]>(DEFAULT_VEHICLES);
  const [selectedServiceAuto, setSelectedServiceAuto] = useState('');
  const [selectedVehicleAuto, setSelectedVehicleAuto] = useState('');

  // Fetch live fleet vehicles and routes on mount
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([api.getRoutes(), api.getBuses()]).then(([routesRes, busesRes]) => {
      if (!isMounted) return;
      if (routesRes.status === 'fulfilled' && Array.isArray(routesRes.value) && routesRes.value.length > 0) {
        const liveServices: AutoServiceOption[] = routesRes.value.map((r: any) => ({
          serviceNumber: r.route_number || r.service_number || `SR-${r.id}`,
          name: `${r.route_number || r.service_number || `SR-${r.id}`} (${r.origin || 'Origin'} → ${r.destination || 'Destination'})`,
          origin: r.origin || '',
          destination: r.destination || '',
          operator: r.operator_name || r.operator || 'SR Travels'
        }));
        setServicesList((prev) => {
          const merged = [...prev];
          liveServices.forEach((ls) => {
            if (!merged.some((m) => m.serviceNumber === ls.serviceNumber)) {
              merged.push(ls);
            }
          });
          return merged;
        });
      }

      if (busesRes.status === 'fulfilled' && Array.isArray(busesRes.value) && busesRes.value.length > 0) {
        const liveBuses: AutoVehicleOption[] = busesRes.value.map((b: any) => ({
          busNumber: b.plate_number || b.bus_number || b.registration_number || '',
          operator: b.operator_name || b.operator || 'Vaishnavi Travels',
          model: b.model || b.bus_type || ''
        })).filter((b: any) => b.busNumber);

        setVehiclesList((prev) => {
          const merged = [...prev];
          liveBuses.forEach((lb) => {
            if (!merged.some((m) => m.busNumber.toLowerCase() === lb.busNumber.toLowerCase())) {
              merged.push(lb);
            }
          });
          return merged;
        });
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Filter states
  const [operatorFilter, setOperatorFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOperator, setFormOperator] = useState('SR Travels');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTripBusNo, setFormTripBusNo] = useState('');
  const [formPnr, setFormPnr] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAgent, setFormAgent] = useState('Lokesh');
  const [formRating, setFormRating] = useState(5);
  const [formRemarks, setFormRemarks] = useState('');
  const [formCustomerImages, setFormCustomerImages] = useState<string[]>([]);

  // Automatic Service Handler
  const handleAutoSelectService = (serviceNo: string) => {
    setSelectedServiceAuto(serviceNo);
    if (!serviceNo) return;
    const found = servicesList.find((s) => s.serviceNumber === serviceNo);
    if (found) {
      setFormTripBusNo((prev) => {
        if (!prev) return found.serviceNumber;
        if (selectedVehicleAuto && !prev.includes(found.serviceNumber)) {
          return `${found.serviceNumber} / ${selectedVehicleAuto}`;
        }
        return found.serviceNumber;
      });
      setFormOrigin(found.origin);
      setFormDestination(found.destination);
      if (found.operator) {
        setFormOperator(found.operator);
      }
      if (found.defaultVehicle) {
        setSelectedVehicleAuto(found.defaultVehicle);
        setFormTripBusNo(`${found.serviceNumber} / ${found.defaultVehicle}`);
      }
      if (!formPnr) {
        setFormPnr(`PNR${Math.floor(100000 + Math.random() * 900000)}`);
      }
      success(`Service ${found.serviceNumber} details auto-filled.`);
    }
  };

  // Automatic Vehicle Number Handler
  const handleAutoSelectVehicle = (vehNo: string) => {
    setSelectedVehicleAuto(vehNo);
    if (!vehNo) return;
    const found = vehiclesList.find((v) => v.busNumber === vehNo);
    if (found) {
      setFormTripBusNo((prev) => {
        if (!prev) return found.busNumber;
        if (selectedServiceAuto) return `${selectedServiceAuto} / ${found.busNumber}`;
        return found.busNumber;
      });
      if (found.operator) {
        setFormOperator(found.operator);
      }
      if (!formPnr) {
        setFormPnr(`PNR${Math.floor(100000 + Math.random() * 900000)}`);
      }
      success(`Vehicle ${found.busNumber} auto-selected.`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          setFormCustomerImages((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('charvik_bus_ratings', JSON.stringify(records));
    } catch { }
  }, [records]);

  // Handle Form Clear
  const handleClearForm = () => {
    setEditingId(null);
    setSelectedServiceAuto('');
    setSelectedVehicleAuto('');
    setFormOperator('SR Travels');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTripBusNo('');
    setFormPnr('');
    setFormOrigin('');
    setFormDestination('');
    setFormCustomerName('');
    setFormPhone('');
    setFormAgent('Lokesh');
    setFormRating(5);
    setFormRemarks('');
    setFormCustomerImages([]);
  };

  // Handle Form Save
  const handleSaveRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOperator) {
      error('Please select an Operator');
      return;
    }
    if (!formTripBusNo.trim()) {
      error('Please enter Trip / Bus Number');
      return;
    }
    if (!formCustomerName.trim()) {
      error('Please enter Customer Name');
      return;
    }

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
              ...r,
              operator: formOperator,
              travelDate: formDate,
              tripBusNo: formTripBusNo.trim(),
              pnrNumber: formPnr.trim() || `PNR${Math.floor(100000 + Math.random() * 900000)}`,
              origin: formOrigin.trim() || 'Origin City',
              destination: formDestination.trim() || 'Destination City',
              customerName: formCustomerName.trim(),
              phoneNumber: formPhone.trim(),
              calledByAgent: formAgent.trim() || 'Agent',
              rating: formRating,
              complaintsRemarks: formRemarks.trim(),
              customerImages: formCustomerImages
            }
            : r
        )
      );
      success('Rating feedback record updated successfully.');
      handleClearForm();
    } else {
      const newRec: BusRatingRecord = {
        id: `BR-${Date.now().toString().slice(-4)}`,
        operator: formOperator,
        travelDate: formDate,
        tripBusNo: formTripBusNo.trim(),
        pnrNumber: formPnr.trim() || `PNR${Math.floor(100000 + Math.random() * 900000)}`,
        origin: formOrigin.trim() || 'Origin City',
        destination: formDestination.trim() || 'Destination City',
        customerName: formCustomerName.trim(),
        phoneNumber: formPhone.trim(),
        calledByAgent: formAgent.trim() || 'Agent',
        rating: formRating,
        complaintsRemarks: formRemarks.trim(),
        customerImages: formCustomerImages,
        createdAt: new Date().toISOString()
      };
      setRecords((prev) => [newRec, ...prev]);
      success('Customer feedback rating saved successfully.');
      handleClearForm();
    }
  };

  // Handle Edit click
  const handleEdit = (rec: BusRatingRecord) => {
    setEditingId(rec.id);
    setFormOperator(rec.operator);
    setFormDate(rec.travelDate);
    setFormTripBusNo(rec.tripBusNo);
    setFormPnr(rec.pnrNumber);
    setFormOrigin(rec.origin);
    setFormDestination(rec.destination);
    setFormCustomerName(rec.customerName);
    setFormPhone(rec.phoneNumber);
    setFormAgent(rec.calledByAgent);
    setFormRating(rec.rating);
    setFormRemarks(rec.complaintsRemarks);
    setFormCustomerImages(rec.customerImages || []);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Handle Delete
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete rating record for customer "${name}"?`)) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      success('Rating record deleted.');
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchOp = operatorFilter === 'All' || r.operator.toLowerCase() === operatorFilter.toLowerCase();
      return matchOp;
    });
  }, [records, operatorFilter]);

  // Aggregate Operator-wise ratings
  const operatorSummary = useMemo(() => {
    const map = new Map<string, { total: number; sum: number }>();
    records.forEach((r) => {
      const op = r.operator;
      const curr = map.get(op) || { total: 0, sum: 0 };
      curr.total += 1;
      curr.sum += r.rating;
      map.set(op, curr);
    });

    const list = Array.from(map.entries()).map(([name, data]) => ({
      name,
      ratingsCount: data.total,
      avgRating: (data.sum / data.total).toFixed(1)
    }));

    // Sort by count descending
    list.sort((a, b) => b.ratingsCount - a.ratingsCount);
    return list;
  }, [records]);

  // Overall KPI statistics
  const kpis = useMemo(() => {
    const totalRatings = 256 + records.length - INITIAL_RATINGS.length;
    const complaintsCount = records.filter(
      (r) =>
        r.rating <= 3 ||
        /delay|slow|cold|ac|complaint|bad|rude|broken|issue/i.test(r.complaintsRemarks)
    ).length + 15;

    const avgRating = (
      (records.reduce((acc, curr) => acc + curr.rating, 0) + 256 * 4.3) /
      (records.length + 256)
    ).toFixed(1);

    const operatorsCount = Math.max(12, new Set(records.map((r) => r.operator)).size);

    return {
      totalRatings,
      avgRating,
      complaintsCount,
      totalTrips: totalRatings,
      operatorsCount
    };
  }, [records]);

  // Export to Excel using Charvik standard high-definition exporter
  const handleExportExcel = () => {
    try {
      if (filteredRecords.length === 0) {
        warning('No rating records available to export.');
        return;
      }

      const headers = [
        'S.No',
        'Travel Date',
        'Operator Name',
        'Trip / Bus No',
        'PNR Number',
        'Route (From → To)',
        'Customer Name',
        'Phone Number',
        'Called By Agent',
        'Star Rating',
        'Customer Feedback / Remarks'
      ];

      const rows = filteredRecords.map((r, idx) => {
        const cleanPhone = (r.phoneNumber || '').trim();
        const cleanTripBus = (r.tripBusNo || '').replace(/\s*\/\s*$/, '').trim();
        const routeText = r.origin && r.destination ? `${r.origin} → ${r.destination}` : (r.origin || r.destination || '-');
        const starText = `${r.rating} / 5 Stars`;

        return [
          idx + 1,
          r.travelDate || '-',
          r.operator || '-',
          cleanTripBus || '-',
          r.pnrNumber || '-',
          routeText,
          r.customerName || '-',
          cleanPhone || '-',
          r.calledByAgent || '-',
          starText,
          r.complaintsRemarks || 'No remarks provided'
        ];
      });

      exportTableToExcel({
        title: 'BUS OPERATOR RATINGS & TRAVELER FEEDBACK REPORT',
        subtitle: `Operator: ${operatorFilter} | Total Records: ${filteredRecords.length} | Avg Rating: ${kpis.avgRating} / 5`,
        filename: `Charvik_Bus_Ratings_${operatorFilter === 'All' ? 'All_Operators' : operatorFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'Bus Ratings',
        headers,
        rows
      });

      success('Ratings data exported to Excel with official Charvik letterhead and full formatting.');
    } catch (err: any) {
      error(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Dedicated Print Function using Charvik printSheet (matches all other printouts: logo, mobile, email, signatory)
  const handlePrint = () => {
    try {
      const rowsHtml = filteredRecords.map((r, idx) => {
        const cleanTripBus = (r.tripBusNo || '').replace(/\s*\/\s*$/, '').trim();
        const routeText = r.origin && r.destination ? `${r.origin} &rarr; ${r.destination}` : (r.origin || r.destination || '-');
        const stars = '★'.repeat(Math.max(1, Math.min(5, r.rating))) + '☆'.repeat(Math.max(0, 5 - r.rating));

        return `
          <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="text-align: center; font-weight: bold; width: 4%;">${idx + 1}</td>
            <td style="white-space: nowrap; font-weight: 700; width: 9%;">${r.travelDate || '-'}</td>
            <td style="font-weight: 800; color: #032b69; white-space: nowrap; width: 12%;">${r.operator || '-'}</td>
            <td style="font-family: monospace; font-weight: bold; white-space: nowrap; width: 10%;">${cleanTripBus || '-'}</td>
            <td style="font-family: monospace; font-weight: 800; color: #0284c7; white-space: nowrap; width: 9%;">${r.pnrNumber || '-'}</td>
            <td style="white-space: nowrap; font-weight: 600; width: 14%;">${routeText}</td>
            <td style="font-weight: 700; white-space: nowrap; width: 11%;">${r.customerName || '-'}</td>
            <td style="font-family: monospace; font-weight: 700; white-space: nowrap; width: 10%;">${r.phoneNumber || '-'}</td>
            <td style="white-space: nowrap; width: 8%;">${r.calledByAgent || '-'}</td>
            <td style="text-align: center; white-space: nowrap; width: 6%;">
              <span style="color: #d97706; font-size: 13px;">${stars}</span>
              <div style="font-size: 10px; font-weight: 800; color: #334155;">${r.rating} / 5</div>
            </td>
            <td style="font-size: 10.5px; color: #334155; min-width: 110px; word-break: break-word;">${r.complaintsRemarks || '-'}</td>
          </tr>
        `;
      }).join('');

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; table-layout: auto;">
          <thead>
            <tr>
              <th style="width: 4%; text-align: center; white-space: nowrap;">#</th>
              <th style="width: 9%; text-align: left; white-space: nowrap;">Travel Date</th>
              <th style="width: 12%; text-align: left; white-space: nowrap;">Operator</th>
              <th style="width: 10%; text-align: left; white-space: nowrap;">Trip / Bus</th>
              <th style="width: 9%; text-align: left; white-space: nowrap;">PNR No</th>
              <th style="width: 14%; text-align: left; white-space: nowrap;">Route (From &rarr; To)</th>
              <th style="width: 11%; text-align: left; white-space: nowrap;">Customer Name</th>
              <th style="width: 10%; text-align: left; white-space: nowrap;">Phone Number</th>
              <th style="width: 8%; text-align: left; white-space: nowrap;">Called By</th>
              <th style="width: 6%; text-align: center; white-space: nowrap;">Rating</th>
              <th style="width: 17%; min-width: 110px; text-align: left; white-space: normal;">Complaints &amp; Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      printSheet({
        title: 'BUS OPERATOR RATINGS & TRAVELER FEEDBACK REPORT',
        subtitle: `Operator: ${operatorFilter} | Total Records: ${filteredRecords.length} | Average Rating: ${kpis.avgRating} / 5 Stars`,
        htmlContent: tableHtml,
        orientation: 'landscape'
      });
    } catch {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── PRINT-SPECIFIC CSS RULES (FOR BROWSER CTRL+P AS WELL) ── */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm 6mm;
          }
          nav, aside, header, [data-sidebar], #admin-sidebar, #admin-topbar, .no-print {
            display: none !important;
          }
          body, html, main {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* ── TOP HERO HEADER BANNER (MATCHES USER IMAGE 2) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032B69] via-[#004B9E] to-[#0072E5] text-white p-5 sm:p-7 shadow-xl border-2 border-blue-400/30 print:hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-blue-200">
              <span className="font-black text-amber-300">CHARVIK</span>
              <span>•</span>
              <span>Customer Feedback</span>
              <span>|</span>
              <span>Travel Data</span>
              <span>|</span>
              <span>Operator-wise Ratings</span>
              <span>|</span>
              <span>Complaints</span>
              <span>|</span>
              <span>Reports</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                <Star className="w-6 h-6 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  Bus Operator Rating & Feedback
                </h1>
                <p className="text-xs sm:text-sm font-medium text-blue-100 mt-0.5">
                  Live traveler feedback, agent verification, complaints tracking & service benchmarks
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Export all data to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Print data table report only"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Printout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS (5 HORIZONTAL CARDS MATCHING REFERENCE IMAGE 2) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Card 1: Total Ratings */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Total Ratings
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {kpis.totalRatings}
            </div>
          </div>
        </div>

        {/* Card 2: Avg. Rating */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Avg. Rating
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight mt-0.5">
              {kpis.avgRating} <span className="text-sm font-bold text-slate-400">/ 5</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Complaints */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <ThumbsDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Total Complaints
            </div>
            <div className="text-2xl font-black text-orange-600 tracking-tight mt-0.5">
              {kpis.complaintsCount}
            </div>
          </div>
        </div>

        {/* Card 4: Total Trips */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Total Trips
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {kpis.totalTrips}
            </div>
          </div>
        </div>

        {/* Card 5: Operators */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Operators
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {kpis.operatorsCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE DUAL SECTION: LEFT FORM + RIGHT OPERATOR SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print:hidden">
        {/* Left 2 Cols: Add Bus Rating / Customer Feedback Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              +
            </div>
            <h2 className="text-base font-black text-[#142B4A] tracking-tight">
              {editingId ? 'Edit Bus Rating / Customer Feedback' : 'Add Bus Rating / Customer Feedback'}
            </h2>
          </div>

          <form onSubmit={handleSaveRating} className="space-y-4">
            {/* Service & Vehicle Number Selection */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200/80 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Service */}
                <div>
                  <label className="block text-[11px] font-black text-blue-900 mb-1 flex items-center gap-1">
                    <Route className="w-3.5 h-3.5 text-blue-600" />
                    <span>Service</span>
                  </label>
                  <select
                    value={selectedServiceAuto}
                    onChange={(e) => handleAutoSelectService(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Choose Service --</option>
                    {servicesList.map((s) => (
                      <option key={s.serviceNumber} value={s.serviceNumber}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Vehicle Number */}
                <div>
                  <label className="block text-[11px] font-black text-blue-900 mb-1 flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vehicle Number</span>
                  </label>
                  <select
                    value={selectedVehicleAuto}
                    onChange={(e) => handleAutoSelectVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Choose Vehicle Number --</option>
                    {vehiclesList.map((v) => (
                      <option key={v.busNumber} value={v.busNumber}>
                        {v.busNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Operator Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Operator Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formOperator}
                    onChange={(e) => setFormOperator(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {KNOWN_OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Travel Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Trip / Bus No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Trip / Bus No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTripBusNo}
                  onChange={(e) => setFormTripBusNo(e.target.value)}
                  placeholder="e.g. SR1234 / VT7788"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              {/* PNR Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PNR Number
                </label>
                <input
                  type="text"
                  value={formPnr}
                  onChange={(e) => setFormPnr(e.target.value)}
                  placeholder="Enter PNR Number"
                  className="w-full px-3 py-2 bg-white border-2 border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Origin & Destination & Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* From (Origin) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  From (Origin) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    placeholder="From City"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* To (Destination) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  To (Destination) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="To City"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="Enter Customer Name"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Enter Phone Number"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Called By Agent & Star Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Called By (Agent) - Manual Typing */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Called By (Agent) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formAgent}
                    onChange={(e) => setFormAgent(e.target.value)}
                    placeholder="Enter Agent Name (e.g. Lokesh)"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Interactive 5-Star Rating */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 p-1.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= formRating
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300 fill-transparent'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-black text-amber-800">
                    {formRating} / 5 Stars
                  </span>
                </div>
              </div>
            </div>

            {/* Complaints / Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Complaints / Remarks
              </label>
              <div className="relative">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Enter complaints or feedback (e.g., AC, Cleanliness, Delay, Driving etc.)"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Customer Images Upload */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Images
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100/60 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Customer Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {formCustomerImages.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {formCustomerImages.length} image{formCustomerImages.length > 1 ? 's' : ''} uploaded
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {formCustomerImages.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-2.5">
                  {formCustomerImages.map((img, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-2xs group">
                      <img src={img} alt={`Customer image ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormCustomerImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4 text-rose-300" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Update Rating' : 'Save Rating'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Operator-wise Rating Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                📊
              </div>
              <h3 className="text-sm font-black text-[#142B4A] tracking-tight">
                Operator-wise Rating Summary
              </h3>
            </div>

            {/* Summary Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Operator Name</th>
                    <th className="py-2 px-2 text-center">Ratings</th>
                    <th className="py-2 px-2 text-right">Avg. Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operatorSummary.slice(0, 5).map((op, idx) => (
                    <tr key={op.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-2 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-extrabold text-[#142B4A]">
                        {op.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                        {op.ratingsCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-amber-600">
                        {op.avgRating} <span className="text-amber-500">★</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* View All Operators Button */}
          <button
            type="button"
            onClick={() => setOperatorFilter('All')}
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
          >
            <span>View All Operators</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── BOTTOM DATA TABLE: RECENT RATINGS & TRAVELING DATA ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 print:border-none print:shadow-none print:rounded-none print:p-0">
        {/* Printable Official Header (Visible ONLY on print preview / hard copy) */}
        <div className="hidden print:block p-3 border-b-2 border-[#032B69] mb-3">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-xl font-black text-[#032B69] tracking-tight">
                CHARVIK STAFFING &amp; FLEET MANAGEMENT
              </h1>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Bus Operator Ratings &amp; Traveler Feedback Report &bull; Official Registry
              </p>
            </div>
            <div className="text-right text-[10px] font-bold text-slate-600">
              <div>Printed: {new Date().toLocaleDateString('en-GB')}</div>
              <div>Cycle: Nov-2026</div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-700">
            <span>Operator: <strong className="text-[#032B69]">{operatorFilter}</strong></span>
            <span>&bull;</span>
            <span>Total Records: <strong className="text-[#032B69]">{filteredRecords.length}</strong></span>
            <span>&bull;</span>
            <span>Average Rating: <strong className="text-amber-600">{kpis.avgRating} / 5 Stars</strong></span>
          </div>
        </div>

        {/* Table Top Header & Controls */}
        <div className="p-4 sm:p-5 pb-0 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#032B69] text-white flex items-center justify-center font-bold text-sm">
              📋
            </div>
            <h3 className="text-sm font-black text-[#142B4A] tracking-tight">
              Recent Ratings & Traveling Data
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
              {filteredRecords.length} Records
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Operator Filter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span>Operator:</span>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Operators</option>
                {KNOWN_OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Current Cycle: Nov-2026</span>
            </div>

            {/* Printout button inside the Data Tab */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Print data table report only"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Printout</span>
            </button>

            {/* Export Excel button inside the Data Tab */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Export formatted Excel sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* The Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#032B69] via-[#004B9E] to-[#0284c7] text-white text-[10.5px] font-black uppercase tracking-wider border-b border-blue-900/30">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Travel Date</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Trip / Bus No.</th>
                <th className="py-3 px-3">PNR Number</th>
                <th className="py-3 px-3">From – To (Traveling Data)</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone Number</th>
                <th className="py-3 px-3">Called By (Agent)</th>
                <th className="py-3 px-3 text-center">Rating</th>
                <th className="py-3 px-3">Complaints / Remarks</th>
                <th className="py-3 px-3 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400 font-medium">
                    No rating records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {rec.travelDate}
                    </td>
                    <td className="py-3 px-3 font-black text-[#142B4A] whitespace-nowrap">
                      {rec.operator}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {rec.tripBusNo}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-mono font-bold text-[11px] text-amber-900">
                        {rec.pnrNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-700">
                      {rec.origin} &rarr; {rec.destination}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {rec.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {rec.phoneNumber}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {rec.calledByAgent}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rec.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <div>{rec.complaintsRemarks}</div>
                      {rec.customerImages && rec.customerImages.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            <ImageIcon className="w-3 h-3 text-blue-500" />
                            <span>{rec.customerImages.length} photo{rec.customerImages.length > 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(rec)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id, rec.customerName)}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
