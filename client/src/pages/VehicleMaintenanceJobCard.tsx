import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  Gauge,
  Building2,
  FileText,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  Printer,
  Bus,
  CheckCircle2,
  IndianRupee,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  PenTool,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';
import type { Bus as BusType } from '../types';
import type {
  VehicleMaintenanceJobCardRecord,
  VehicleComplaintItem,
  ConsumablePartItem
} from '../services/seedData';

export const VehicleMaintenanceJobCard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [cards, setCards] = useState<VehicleMaintenanceJobCardRecord[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [operatorFilter, setOperatorFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<VehicleMaintenanceJobCardRecord | null>(null);
  const [printingCard, setPrintingCard] = useState<VehicleMaintenanceJobCardRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form State
  const [jobCardNo, setJobCardNo] = useState('');
  const [dateOfRequest, setDateOfRequest] = useState(new Date().toISOString().split('T')[0]);
  const [kmReading, setKmReading] = useState<string | number>('');
  const [fleetOwner, setFleetOwner] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [complaints, setComplaints] = useState<VehicleComplaintItem[]>([
    { id: 'c1', complaint: '', remarks: '' }
  ]);
  const [parts, setParts] = useState<ConsumablePartItem[]>([
    { id: 'p1', part_name: '', part_number_details: '', quantity: '1', amount: '' }
  ]);
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicNumber, setMechanicNumber] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [workLocation, setWorkLocation] = useState('');

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [cardsData, busesData, organizersData] = await Promise.all([
        api.getJobCards(),
        api.getBuses(),
        api.getOrganizers()
      ]);
      setCards(cardsData || []);
      setBuses(busesData || []);
      setOperators(organizersData || []);
    } catch (err) {
      console.error('Failed to load job cards data', err);
      toastError('Failed to load vehicle maintenance job cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      api.getJobCards().then((res) => setCards(res || []));
    };
    window.addEventListener('charvik_job_cards_updated', handleUpdate);
    return () => {
      window.removeEventListener('charvik_job_cards_updated', handleUpdate);
    };
  }, []);

  // Searchable bus options
  const busSearchOptions: SearchOption[] = useMemo(() => {
    const seen = new Set<string>();
    const options: SearchOption[] = [];

    buses.forEach((b: any) => {
      const reg = (b.registration_number || b.bus_number || '').split('(')[0].trim();
      if (reg && !seen.has(reg)) {
        seen.add(reg);
        options.push({
          value: reg,
          label: reg,
          badge: b.depot_location || undefined
        });
      }
    });

    cards.forEach((c) => {
      const reg = (c.vehicle_number || '').split('(')[0].trim();
      if (reg && !seen.has(reg)) {
        seen.add(reg);
        options.push({
          value: reg,
          label: reg
        });
      }
    });

    return options;
  }, [buses, cards]);

  // Operator / Fleet Owner List
  const operatorNames = useMemo(() => {
    const set = new Set<string>();
    operators.forEach((o: any) => {
      const name = o.organization_name || o.name;
      if (name) set.add(name.trim());
    });
    // Add default fallbacks if empty
    if (set.size === 0) {
      set.add('Sri Krishna Travels');
      set.add('Vyshnavi Travels');
      set.add('Orange Travels');
      set.add('Kaveri Travels');
    }
    return Array.from(set);
  }, [operators]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCard(null);
    const nextNum = `CSC/VM/2026/${String(cards.length + 1).padStart(3, '0')}`;
    setJobCardNo(nextNum);
    setDateOfRequest(new Date().toISOString().split('T')[0]);
    setKmReading('');
    setFleetOwner(operatorNames[0] || '');
    setVehicleNumber(busSearchOptions[0]?.value || '');
    setComplaints([
      { id: 'c1', complaint: '', remarks: '' },
      { id: 'c2', complaint: '', remarks: '' }
    ]);
    setParts([
      { id: 'p1', part_name: '', part_number_details: '', quantity: '1', amount: '' }
    ]);
    setMechanicName('');
    setMechanicNumber('');
    setWorkshopName('');
    setWorkLocation('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (card: VehicleMaintenanceJobCardRecord) => {
    setEditingCard(card);
    setJobCardNo(card.job_card_no);
    setDateOfRequest(card.date_of_request || new Date().toISOString().split('T')[0]);
    setKmReading(card.km_reading || '');
    setFleetOwner(card.fleet_owner || '');
    setVehicleNumber(card.vehicle_number || '');
    setComplaints(
      card.complaints && card.complaints.length > 0
        ? card.complaints.map((c, i) => ({ id: c.id || `c${i}`, complaint: c.complaint, remarks: c.remarks }))
        : [{ id: 'c1', complaint: '', remarks: '' }]
    );
    setParts(
      card.parts && card.parts.length > 0
        ? card.parts.map((p, i) => ({
            id: p.id || `p${i}`,
            part_name: p.part_name,
            part_number_details: p.part_number_details,
            quantity: p.quantity,
            amount: p.amount
          }))
        : [{ id: 'p1', part_name: '', part_number_details: '', quantity: '1', amount: '' }]
    );
    setMechanicName(card.mechanic_name || '');
    setMechanicNumber(card.mechanic_number || '');
    setWorkshopName(card.workshop_name || '');
    setWorkLocation(card.work_location || '');
    setIsModalOpen(true);
  };

  // Complaint rows helper
  const handleAddComplaint = () => {
    setComplaints((prev) => [
      ...prev,
      { id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, complaint: '', remarks: '' }
    ]);
  };

  const handleUpdateComplaint = (index: number, field: keyof VehicleComplaintItem, val: string) => {
    setComplaints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveComplaint = (index: number) => {
    if (complaints.length === 1) {
      setComplaints([{ id: 'c1', complaint: '', remarks: '' }]);
      return;
    }
    setComplaints((prev) => prev.filter((_, i) => i !== index));
  };

  // Parts rows helper
  const handleAddPart = () => {
    setParts((prev) => [
      ...prev,
      {
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        part_name: '',
        part_number_details: '',
        quantity: '1',
        amount: ''
      }
    ]);
  };

  const handleUpdatePart = (index: number, field: keyof ConsumablePartItem, val: any) => {
    setParts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemovePart = (index: number) => {
    if (parts.length === 1) {
      setParts([{ id: 'p1', part_name: '', part_number_details: '', quantity: '1', amount: '' }]);
      return;
    }
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Total parts amount
  const totalPartsAmount = useMemo(() => {
    return parts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [parts]);

  // Save Card
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber) {
      toastError('Please select or enter vehicle number');
      return;
    }
    if (!fleetOwner) {
      toastError('Please select Fleet Owner / Operator');
      return;
    }

    const cleanedComplaints = complaints.filter((c) => c.complaint.trim() || c.remarks.trim());
    const cleanedParts = parts.filter((p) => p.part_name.trim() || Number(p.amount) > 0);

    const payload: Partial<VehicleMaintenanceJobCardRecord> = {
      job_card_no: jobCardNo || `CSC/VM/2026/${String(cards.length + 1).padStart(3, '0')}`,
      date_of_request: dateOfRequest,
      km_reading: Number(kmReading) || 0,
      fleet_owner: fleetOwner,
      vehicle_number: vehicleNumber,
      complaints: cleanedComplaints.length > 0 ? cleanedComplaints : [{ complaint: 'General Checkup', remarks: 'Routine' }],
      parts: cleanedParts,
      total_parts_amount: totalPartsAmount,
      mechanic_name: mechanicName,
      mechanic_number: mechanicNumber,
      workshop_name: workshopName,
      work_location: workLocation,
      status: 'Completed'
    };

    try {
      if (editingCard) {
        await api.updateJobCard(editingCard.id, payload);
        success('Vehicle Maintenance Job Card updated successfully!');
      } else {
        await api.createJobCard(payload);
        success('Vehicle Maintenance Job Card created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save job card failed', err);
      toastError('Failed to save Vehicle Maintenance Job Card');
    }
  };

  // Delete Card
  const handleDeleteCard = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this Vehicle Maintenance Job Card?')) return;
    try {
      await api.deleteJobCard(id);
      success('Job Card deleted successfully');
      fetchData();
    } catch (err) {
      toastError('Failed to delete job card');
    }
  };

  // Open Print Modal
  const handleOpenPrint = (card: VehicleMaintenanceJobCardRecord) => {
    setPrintingCard(card);
    setIsPrintModalOpen(true);
  };

  // Trigger Native Print for Job Card
  const handleTriggerPrint = () => {
    const el = document.getElementById('printable-vehicle-job-card');
    if (!el) {
      window.print();
      return;
    }

    let iframe = document.getElementById('jobcard-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'jobcard-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Maintenance Job Card - ${printingCard?.job_card_no || 'CSC'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #111;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * { box-sizing: border-box; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1.5px solid #0E52A5; padding: 6px 8px; font-size: 12px; }
            .header-banner {
              background: #0E52A5 !important;
              color: white !important;
              text-align: center;
              padding: 10px;
              border-radius: 8px 8px 0 0;
            }
            .header-banner h1 {
              margin: 0;
              font-size: 20px;
              letter-spacing: 1px;
              font-weight: 900;
              color: #ffffff !important;
            }
            .header-banner h2 {
              margin: 4px 0 0 0;
              font-size: 22px;
              color: #FACC15 !important;
              font-weight: 900;
              letter-spacing: 2px;
            }
            .section-ribbon {
              background: #0E52A5 !important;
              color: white !important;
              padding: 6px 12px;
              font-size: 13px;
              font-weight: bold;
              border-radius: 4px 4px 0 0;
              margin-top: 10px;
            }
            .box-border {
              border: 1.5px solid #0E52A5;
              padding: 8px 12px;
              border-radius: 0 0 4px 4px;
            }
            .sig-box {
              border: 1.5px solid #0E52A5;
              border-radius: 6px;
              height: 70px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              padding-bottom: 6px;
              font-size: 11px;
              font-weight: bold;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${el.innerHTML}
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
    }, 300);
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchVehicle = vehicleFilter === 'All' || c.vehicle_number === vehicleFilter;
      const matchOperator = operatorFilter === 'All' || c.fleet_owner === operatorFilter;
      const matchQuery =
        !searchQuery.trim() ||
        c.job_card_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.fleet_owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mechanic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.workshop_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchVehicle && matchOperator && matchQuery;
    });
  }, [cards, vehicleFilter, operatorFilter, searchQuery]);

  // Overall totals
  const overallPartsCost = useMemo(() => {
    return cards.reduce((acc, c) => acc + (Number(c.total_parts_amount) || 0), 0);
  }, [cards]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#072B56] via-[#0E52A5] to-[#144272] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Wrench className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold tracking-wider uppercase mb-2 border border-yellow-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Workshop &amp; Fleet Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              Vehicle Maintenance Job Card
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-2xl">
              Official vehicle workshop job cards, complaints tracking, parts and consumables ledger, mechanic and garage records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-sm shadow-lg shadow-yellow-400/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 text-slate-900" />
              <span>Create Job Card</span>
            </button>
          </div>
        </div>

        {/* 4 Stats KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Total Job Cards</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{cards.length}</div>
            <span className="text-[10px] text-yellow-300 font-semibold">Workshop registered</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Total Parts Cost</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
              ₹{overallPartsCost.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-200 font-semibold">Consumables &amp; Spares</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Fleet Operators</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{operatorNames.length}</div>
            <span className="text-[10px] text-yellow-300 font-semibold">Active Fleet Owners</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Latest Card</span>
            <div className="text-xl sm:text-2xl font-black text-yellow-300 mt-1 font-mono truncate">
              {cards[0]?.job_card_no || 'None'}
            </div>
            <span className="text-[10px] text-slate-200 font-semibold">Recent Maintenance</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Job Card No, Vehicle No, Fleet Owner, Mechanic, Workshop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Vehicles</option>
            {busSearchOptions.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Operator Filter */}
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Fleet Owners</option>
            {operatorNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {(searchQuery || vehicleFilter !== 'All' || operatorFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVehicleFilter('All');
                setOperatorFilter('All');
              }}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Job Cards Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900">Job Cards Registry</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {filteredCards.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold">Loading Job Cards...</div>
        ) : filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Vehicle Maintenance Job Cards Found</h3>
            <p className="text-xs text-slate-500 mt-1">Click "Create Job Card" above to register a workshop visit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="p-3.5 pl-5">Job Card No</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Vehicle No</th>
                  <th className="p-3.5">Fleet Owner</th>
                  <th className="p-3.5">Odometer KM</th>
                  <th className="p-3.5">Work / Complaints</th>
                  <th className="p-3.5">Parts Cost</th>
                  <th className="p-3.5">Mechanic &amp; Garage</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="p-3.5 pl-5 font-mono font-bold text-rose-600">{card.job_card_no}</td>
                    <td className="p-3.5 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {card.date_of_request}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold border border-blue-200/60">
                        <Bus className="w-3.5 h-3.5 text-blue-600" />
                        {card.vehicle_number}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{card.fleet_owner || '—'}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {card.km_reading ? `${Number(card.km_reading).toLocaleString('en-IN')} KM` : '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="max-w-[200px]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {card.complaints?.length || 0} issues reported
                        </span>
                        {card.complaints?.[0]?.complaint && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {card.complaints[0].complaint}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      ₹{(Number(card.total_parts_amount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <div className="text-[11px]">
                        <div className="font-bold text-slate-900">{card.mechanic_name || '—'}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[150px]">
                          {card.workshop_name || card.work_location || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(card)}
                          title="Print Job Card"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(card)}
                          title="Edit Job Card"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          title="Delete Job Card"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL - STYLED COLORFULLY EXACTLY LIKE THE USER'S JOB CARD IMAGE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveCard} className="space-y-4 -mt-2">
          {/* COLORFUL JOB CARD HEADER BANNER */}
          <div className="bg-gradient-to-r from-[#072B56] via-[#0E52A5] to-[#072B56] text-center py-4 px-6 rounded-2xl shadow-md border-b-4 border-yellow-400">
            <h2 className="text-white text-lg sm:text-xl font-black tracking-widest uppercase">
              VEHICLE MAINTENANCE
            </h2>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="h-0.5 w-12 bg-yellow-400 rounded-full" />
              <h3 className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-wider drop-shadow-xs">
                JOB CARD
              </h3>
              <span className="h-0.5 w-12 bg-yellow-400 rounded-full" />
            </div>
          </div>

          {/* SECTION 1: TOP DETAILS GRID (Job Card No, Date, KM, Fleet Owner, Vehicle No) */}
          <div className="border-2 border-[#0E52A5] rounded-2xl p-4 bg-white shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <label className="w-32 text-xs font-black text-[#0E52A5] uppercase shrink-0">
                    Job Card No <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={jobCardNo}
                    onChange={(e) => setJobCardNo(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-black text-rose-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 text-xs font-black text-[#0E52A5] uppercase shrink-0">
                    Date of Request <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfRequest}
                    onChange={(e) => setDateOfRequest(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 text-xs font-black text-[#0E52A5] uppercase shrink-0">
                    KM Reading:
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 312000"
                    value={kmReading}
                    onChange={(e) => setKmReading(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-black text-[#0E52A5] uppercase shrink-0">
                    Fleet Owner <span className="text-rose-600">*</span>:
                  </label>
                  <select
                    required
                    value={fleetOwner}
                    onChange={(e) => setFleetOwner(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Select Operator (Fleet Owner) --</option>
                    {operatorNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-black text-[#0E52A5] uppercase shrink-0">
                    Vehicle No <span className="text-rose-600">*</span>:
                  </label>
                  <div className="flex-1">
                    <SearchableSelect
                      options={busSearchOptions}
                      value={vehicleNumber}
                      onChange={(val) => setVehicleNumber(val)}
                      placeholder="Select Vehicle Number..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORK DETAILS (VEHICLE COMPLAINTS) */}
          <div className="border-2 border-[#0E52A5] rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header ribbon */}
            <div className="bg-[#0E52A5] text-white px-4 py-2 flex items-center justify-between">
              <h4 className="text-sm font-black tracking-wide uppercase flex items-center gap-2">
                <span>Work Details</span>
                <span className="text-[11px] font-normal text-blue-200">(Vehicle Complaints)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddComplaint}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More</span>
              </button>
            </div>

            {/* Complaints Table */}
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-50/80 border-b-2 border-[#0E52A5] text-[11px] font-black uppercase text-[#0E52A5]">
                    <th className="p-2 w-12 text-center">S.No</th>
                    <th className="p-2">Vehicle Complaints</th>
                    <th className="p-2">Remarks</th>
                    <th className="p-2 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {complaints.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. Brake noise, AC gas cooling issue, clutch slipping..."
                          value={c.complaint}
                          onChange={(e) => handleUpdateComplaint(idx, 'complaint', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Action taken / Remarks..."
                          value={c.remarks}
                          onChange={(e) => handleUpdateComplaint(idx, 'remarks', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveComplaint(idx)}
                          title="Delete Complaint"
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: PARTS / CONSUMABLES USED */}
          <div className="border-2 border-[#0E52A5] rounded-2xl overflow-hidden bg-white shadow-2xs">
            {/* Header ribbon */}
            <div className="bg-[#0E52A5] text-white px-4 py-2 flex items-center justify-between">
              <h4 className="text-sm font-black tracking-wide uppercase flex items-center gap-2">
                <span>Parts / Consumables Used</span>
              </h4>
              <button
                type="button"
                onClick={handleAddPart}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More</span>
              </button>
            </div>

            {/* Parts Table */}
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-50/80 border-b-2 border-[#0E52A5] text-[11px] font-black uppercase text-[#0E52A5]">
                    <th className="p-2 w-12 text-center">S.No</th>
                    <th className="p-2">Part Name</th>
                    <th className="p-2">Part No. / Details</th>
                    <th className="p-2 w-20 text-center">Qty</th>
                    <th className="p-2 w-32 text-right">Amount (₹)</th>
                    <th className="p-2 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parts.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. Brake Liners Front, Engine Oil 15L..."
                          value={p.part_name}
                          onChange={(e) => handleUpdatePart(idx, 'part_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Part No / Brand / Specs..."
                          value={p.part_number_details}
                          onChange={(e) => handleUpdatePart(idx, 'part_number_details', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={p.quantity}
                          onChange={(e) => handleUpdatePart(idx, 'quantity', e.target.value)}
                          className="w-full text-center px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="Amount ₹"
                          value={p.amount}
                          onChange={(e) => handleUpdatePart(idx, 'amount', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          title="Delete Part"
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/70 border-t-2 border-[#0E52A5] font-black text-xs">
                    <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider text-slate-800">
                      Total Consumables &amp; Spares Amount:
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-emerald-800">
                      ₹{totalPartsAmount.toLocaleString('en-IN')}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 4: MECHANIC DETAILS & WORKSHOP DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mechanic Details */}
            <div className="border-2 border-[#0E52A5] rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-[#0E52A5] text-white px-4 py-1.5 text-xs font-black uppercase">
                Mechanic Details
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-bold text-slate-700 shrink-0">Mechanic Name:</label>
                  <input
                    type="text"
                    placeholder="Enter mechanic name"
                    value={mechanicName}
                    onChange={(e) => setMechanicName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-bold text-slate-700 shrink-0">Mechanic Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. 9848012345"
                    value={mechanicNumber}
                    onChange={(e) => setMechanicNumber(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Workshop Details */}
            <div className="border-2 border-[#0E52A5] rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-[#0E52A5] text-white px-4 py-1.5 text-xs font-black uppercase">
                Workshop Details
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-bold text-slate-700 shrink-0">Workshop Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Sai Auto Works"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-28 text-xs font-bold text-slate-700 shrink-0">Work Location:</label>
                  <input
                    type="text"
                    placeholder="e.g. Shamshabad / Depot Garage"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: SIGNATURES PREVIEW */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="border border-slate-300 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-20">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sign / Stamp</span>
              <span className="text-[11px] font-black text-slate-700">Driver Signature</span>
            </div>
            <div className="border border-slate-300 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-20">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sign / Stamp</span>
              <span className="text-[11px] font-black text-slate-700">Workshop Manager (Signature)</span>
            </div>
            <div className="border border-slate-300 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-20">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Authorised Seal</span>
              <span className="text-[11px] font-black text-slate-700 leading-tight">
                Authorised Signatory<br />(Charvik Staffing Consultancy)
              </span>
            </div>
          </div>

          {/* MODAL ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0E52A5] hover:bg-[#072B56] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Job Card</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT MODAL (EXACT PRINTABLE VIEW OF THE USER'S IMAGE) */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Print Vehicle Maintenance Job Card"
        maxWidth="max-w-3xl"
      >
        {printingCard && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>

            {/* Printable Container */}
            <div
              id="printable-vehicle-job-card"
              className="bg-white p-6 rounded-xl border border-slate-300 text-slate-900 shadow-md font-sans"
              style={{ maxWidth: '720px', margin: '0 auto' }}
            >
              {/* HEADER BANNER */}
              <div
                style={{
                  background: '#0E52A5',
                  color: 'white',
                  textAlign: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px 10px 0 0'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '1.5px', color: '#ffffff' }}>
                  VEHICLE MAINTENANCE
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#FACC15', letterSpacing: '2px', marginTop: '2px' }}>
                  JOB CARD
                </div>
              </div>

              {/* DETAILS BOX */}
              <div
                style={{
                  border: '2px solid #0E52A5',
                  padding: '10px 14px',
                  borderRadius: '0 0 6px 6px',
                  marginBottom: '12px'
                }}
              >
                <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', padding: '3px 0', width: '22%', fontWeight: 'bold' }}>Job Card No</td>
                      <td style={{ border: 'none', padding: '3px 0', width: '28%', fontWeight: '900', color: '#DC2626', fontFamily: 'monospace' }}>
                        : {printingCard.job_card_no}
                      </td>
                      <td style={{ border: 'none', padding: '3px 0', width: '22%', fontWeight: 'bold' }}>Fleet Owner</td>
                      <td style={{ border: 'none', padding: '3px 0', width: '28%', fontWeight: 'bold' }}>
                        : {printingCard.fleet_owner || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: 'bold' }}>Date of Request</td>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: 'bold' }}>
                        : {printingCard.date_of_request}
                      </td>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: 'bold' }}>Vehicle No.</td>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: '900', color: '#0E52A5', fontFamily: 'monospace' }}>
                        : {printingCard.vehicle_number}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: 'bold' }}>KM Reading</td>
                      <td style={{ border: 'none', padding: '3px 0', fontWeight: 'bold' }}>
                        : {printingCard.km_reading ? `${Number(printingCard.km_reading).toLocaleString('en-IN')} KM` : '—'}
                      </td>
                      <td style={{ border: 'none', padding: '3px 0' }}></td>
                      <td style={{ border: 'none', padding: '3px 0' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* WORK DETAILS */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    background: '#0E52A5',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  Work Details
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0E52A5', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#EBF3FA', color: '#0E52A5' }}>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', width: '45px', textAlign: 'center' }}>S.No</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'left' }}>Vehicle Complaints</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', width: '35%', textAlign: 'left' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printingCard.complaints || []).map((c, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px' }}>{c.complaint || '—'}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px' }}>{c.remarks || '—'}</td>
                      </tr>
                    ))}
                    {(!printingCard.complaints || printingCard.complaints.length === 0) && (
                      <tr>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'center' }}>1</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px' }}>General routine vehicle service &amp; checkup</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px' }}>Satisfactory</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PARTS / CONSUMABLES USED */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    background: '#0E52A5',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  Parts / Consumables Used
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0E52A5', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#EBF3FA', color: '#0E52A5' }}>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', width: '45px', textAlign: 'center' }}>S.No</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'left' }}>Part Name</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'left' }}>Part No. / Details</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', width: '50px', textAlign: 'center' }}>Qty</th>
                      <th style={{ border: '1px solid #0E52A5', padding: '6px', width: '100px', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printingCard.parts || []).map((p, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', fontWeight: 'bold' }}>{p.part_name || '—'}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px' }}>{p.part_number_details || '—'}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'center' }}>{p.quantity || 1}</td>
                        <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#EBF3FA', fontWeight: 'bold' }}>
                      <td colSpan={4} style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'right', textTransform: 'uppercase' }}>
                        Total Consumables &amp; Spares:
                      </td>
                      <td style={{ border: '1px solid #0E52A5', padding: '6px', textAlign: 'right', fontWeight: '900', color: '#0E52A5', fontFamily: 'monospace' }}>
                        ₹{(Number(printingCard.total_parts_amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* MECHANIC & WORKSHOP ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ border: '1.5px solid #0E52A5', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ background: '#0E52A5', color: 'white', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Mechanic Details
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px' }}>
                    <div><strong>Mechanic Name :</strong> {printingCard.mechanic_name || '—'}</div>
                    <div style={{ marginTop: '4px' }}><strong>Mechanic Number :</strong> {printingCard.mechanic_number || '—'}</div>
                  </div>
                </div>

                <div style={{ border: '1.5px solid #0E52A5', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ background: '#0E52A5', color: 'white', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Workshop Details
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px' }}>
                    <div><strong>Workshop Name :</strong> {printingCard.workshop_name || '—'}</div>
                    <div style={{ marginTop: '4px' }}><strong>Work Location :</strong> {printingCard.work_location || '—'}</div>
                  </div>
                </div>
              </div>

              {/* SIGNATURES ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px', marginTop: '16px' }}>
                <div
                  style={{
                    border: '1.5px solid #0E52A5',
                    borderRadius: '6px',
                    height: '65px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  Driver Signature
                </div>
                <div
                  style={{
                    border: '1.5px solid #0E52A5',
                    borderRadius: '6px',
                    height: '65px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                >
                  Workshop Manager<br />(Signature)
                </div>
                <div
                  style={{
                    border: '1.5px solid #0E52A5',
                    borderRadius: '6px',
                    height: '65px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: '6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}
                >
                  Authorised Signatory<br />(Charvik Staffing Consultancy)
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

