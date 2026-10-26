import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Bus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  User,
  Wrench,
  Gauge,
  Send,
  MessageSquare,
  Copy,
  ExternalLink,
  Bell,
  AlertCircle,
  XCircle,
  Check,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../services/api';
import type { Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export interface DocExpiryItem {
  docKey: 'tax_valid_upto' | 'fitness_expiry' | 'insurance_expiry' | 'puc_expiry' | 'permit_expiry' | 'aitp_valid_upto';
  docLabel: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'expired' | 'today' | 'one_day' | 'due_soon' | 'valid';
}

export const COMPLIANCE_DOCS: { key: DocExpiryItem['docKey']; label: string }[] = [
  { key: 'fitness_expiry', label: 'Fitness Valid Upto' },
  { key: 'tax_valid_upto', label: 'Tax Valid Upto' },
  { key: 'insurance_expiry', label: 'Insurance Valid Upto' },
  { key: 'puc_expiry', label: 'PUCC Valid Upto' },
  { key: 'permit_expiry', label: 'Permit Valid Upto' },
  { key: 'aitp_valid_upto', label: 'AITP Valid Upto' }
];

export const checkDocExpiry = (expiryDate?: string) => {
  if (!expiryDate) return { daysRemaining: null, status: 'valid' as const, label: 'Not Set' };
  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { daysRemaining: days, status: 'expired' as const, label: `Expired ${Math.abs(days)}d ago` };
  } else if (days === 0) {
    return { daysRemaining: 0, status: 'today' as const, label: 'Expires Today!' };
  } else if (days === 1) {
    return { daysRemaining: 1, status: 'one_day' as const, label: 'Expires Tomorrow (1 Day Remaining)!' };
  } else if (days <= 7) {
    return { daysRemaining: days, status: 'due_soon' as const, label: `Due in ${days} days` };
  }
  return { daysRemaining: days, status: 'valid' as const, label: `Valid (${days} days left)` };
};

export const renderExpiryWarning = (dateValue?: string) => {
  if (!dateValue) return null;
  const { status, daysRemaining } = checkDocExpiry(dateValue);
  if (status === 'one_day') {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>⚠️ Urgent Notice: Expiring in 1 day (Tomorrow)! Renewal required.</span>
      </div>
    );
  }
  if (status === 'today') {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-300 rounded-lg px-2.5 py-1.5 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
        <span>🚨 Alert: Expires Today! Urgent renewal required.</span>
      </div>
    );
  }
  if (status === 'expired') {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 rounded-lg px-2.5 py-1.5">
        <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
        <span>❌ Notice: Expired ({Math.abs(daysRemaining || 0)} days ago)! Overdue.</span>
      </div>
    );
  }
  if (status === 'due_soon') {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50/60 rounded-lg px-2 py-1">
        <Clock className="w-3 h-3 shrink-0 text-amber-600" />
        <span>Due in {daysRemaining} days</span>
      </div>
    );
  }
  return null;
};

export const BusMaster: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  const [buses, setBuses] = useState<BusType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Document 1-Day Expiry Alert States
  const [dismissAlertBanner, setDismissAlertBanner] = useState(false);
  const [onlyExpiringFilter, setOnlyExpiringFilter] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAlertForMessage, setSelectedAlertForMessage] = useState<(DocExpiryItem & { bus: BusType }) | null>(null);
  const [recipientType, setRecipientType] = useState<'driver' | 'admin' | 'custom'>('driver');
  const [customPhone, setCustomPhone] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusType | null>(null);
  const [viewingBusDetails, setViewingBusDetails] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'km' | 'maint' | 'tyres' | 'ac' | 'oil' | 'battery' | 'complaints' | 'repairs' | 'inspections'>('km');
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [busToArchive, setBusToArchive] = useState<BusType | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    registration_number: '',
    bus_type: '',
    operational_status: '',
    registration_date: '',
    tax_valid_upto: '',
    insurance_expiry: '',
    fitness_expiry: '',
    permit_expiry: '',
    puc_expiry: '',
    aitp_valid_upto: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busData, empData] = await Promise.all([
        api.getBuses({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        api.getEmployees()
      ]);
      if (Array.isArray(busData)) {
        setBuses(busData);
      }
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      registration_number: '',
      bus_type: '',
      operational_status: '',
      registration_date: '',
      tax_valid_upto: '',
      insurance_expiry: '',
      fitness_expiry: '',
      permit_expiry: '',
      puc_expiry: '',
      aitp_valid_upto: '',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (bus: BusType) => {
    setEditingBus(bus);
    setFormData({
      registration_number: bus.registration_number,
      bus_type: bus.bus_type || '',
      operational_status: bus.operational_status || '',
      registration_date: bus.registration_date || '',
      tax_valid_upto: bus.tax_valid_upto || '',
      insurance_expiry: bus.insurance_expiry || '',
      fitness_expiry: bus.fitness_expiry || '',
      permit_expiry: bus.permit_expiry || '',
      puc_expiry: bus.puc_expiry || '',
      aitp_valid_upto: bus.aitp_valid_upto || '',
      notes: bus.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number.trim()) {
      error('Please enter Registration Number');
      return;
    }
    if (!formData.bus_type) {
      error('Please select Bus Type');
      return;
    }
    if (!formData.operational_status) {
      error('Please select Status');
      return;
    }
    const cleanReg = formData.registration_number.trim().toUpperCase();
    const payload = {
      ...formData,
      registration_number: cleanReg,
      bus_number: cleanReg
    };
    try {
      if (editingBus) {
        const res = await api.updateBus(editingBus.id, payload);
        const updated = { ...editingBus, ...payload, ...(res || {}) };
        setBuses((prev) => prev.map((b) => (String(b.id) === String(editingBus.id) ? updated : b)));
        success(`Bus ${cleanReg} updated successfully!`);
      } else {
        const created = await api.createBus(payload);
        const newBusItem: BusType = {
          ...payload,
          id: created?.id || Date.now(),
          is_archived: 0,
          created_at: new Date().toISOString(),
          ...(created || {})
        };
        setBuses((prev) => [newBusItem, ...prev.filter((b) => (b.registration_number || b.bus_number) !== cleanReg && String(b.id) !== String(newBusItem.id))]);
        success(`Bus ${cleanReg} added to fleet!`);
      }
      setIsAddEditOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save bus record');
    }
  };

  const handleViewProfile = async (bus: BusType) => {
    try {
      const details = await api.getBus(bus.id);
      setViewingBusDetails(details);
      setIsViewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load bus profile');
    }
  };

  const handleArchive = async () => {
    if (!busToArchive) return;
    try {
      await api.archiveBus(busToArchive.id);
      setBuses((prev) => prev.filter((b) => String(b.id) !== String(busToArchive.id)));
      success(`Bus ${busToArchive.registration_number || busToArchive.bus_number} archived safely.`);
      setIsArchiveConfirmOpen(false);
      setBusToArchive(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to archive bus');
    }
  };

  const getBusAlerts = (bus: BusType) => {
    const alerts: (DocExpiryItem & { bus: BusType })[] = [];
    COMPLIANCE_DOCS.forEach(({ key, label }) => {
      const val = (bus as any)[key];
      if (val) {
        const { daysRemaining, status } = checkDocExpiry(val);
        if (daysRemaining !== null && status !== 'valid') {
          alerts.push({
            docKey: key,
            docLabel: label,
            expiryDate: val,
            daysRemaining,
            status,
            bus
          });
        }
      }
    });
    return alerts;
  };

  const allFleetAlerts = buses.flatMap(getBusAlerts);
  const urgentOneDayAlerts = allFleetAlerts.filter(
    (a) => a.status === 'one_day' || a.status === 'today' || a.status === 'expired'
  );

  const filteredBuses = buses.filter((b) => {
    const s = searchTerm.toLowerCase().trim();
    const reg = String(b.registration_number || '').toLowerCase();
    const num = String(b.bus_number || '').toLowerCase();
    const type = String(b.bus_type || '').toLowerCase();
    const matchesSearch = !s || reg.includes(s) || num.includes(s) || type.includes(s);

    if (!matchesSearch) return false;

    if (onlyExpiringFilter) {
      const alerts = getBusAlerts(b);
      return alerts.some((a) => a.status === 'one_day' || a.status === 'today' || a.status === 'expired');
    }

    return true;
  });

  const handleOpenAlertModal = (alertItem: DocExpiryItem & { bus: BusType }) => {
    setSelectedAlertForMessage(alertItem);
    setRecipientType('driver');
    setCustomPhone(alertItem.bus.driver_phone || '');
    setCopiedMessage(false);
    setIsAlertModalOpen(true);
  };

  const generateDraftMessage = (alertItem: DocExpiryItem & { bus: BusType }) => {
    const urgency =
      alertItem.status === 'expired'
        ? `EXPIRED ON ${alertItem.expiryDate} (${Math.abs(alertItem.daysRemaining)} DAYS AGO)`
        : alertItem.status === 'today'
        ? `EXPIRES TODAY (${alertItem.expiryDate})`
        : alertItem.status === 'one_day'
        ? `EXPIRES TOMORROW (${alertItem.expiryDate}) - 1 DAY REMAINING!`
        : `EXPIRES IN ${alertItem.daysRemaining} DAYS (${alertItem.expiryDate})`;

    return `🚨 URGENT FLEET COMPLIANCE NOTICE
Company: Charvik Staffing Consultancy
Vehicle: ${alertItem.bus.registration_number}
Document: ${alertItem.docLabel}
Status: ${urgency}
${alertItem.bus.driver_name ? `Assigned Driver: ${alertItem.bus.driver_name} (${alertItem.bus.driver_phone || 'N/A'})` : ''}

CRITICAL ACTION REQUIRED:
This document must be renewed immediately. Operating without valid ${alertItem.docLabel} is a legal violation subject to heavy transport penalties, challans, or vehicle impoundment. Please complete the renewal process without delay.`;
  };

  const handleCopyAlertMessage = () => {
    if (!selectedAlertForMessage) return;
    const msg = generateDraftMessage(selectedAlertForMessage);
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    success('Alert message copied to clipboard!');
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleSendWhatsAppAlert = () => {
    if (!selectedAlertForMessage) return;
    const msg = generateDraftMessage(selectedAlertForMessage);
    const targetPhone =
      recipientType === 'driver'
        ? selectedAlertForMessage.bus.driver_phone || ''
        : recipientType === 'custom'
        ? customPhone
        : '919876543210';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone ? `91${cleanPhone}` : '';
    const url = finalPhone
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleDispatchSystemAlert = async () => {
    if (!selectedAlertForMessage) return;
    try {
      setSendingAlert(true);
      const msg = generateDraftMessage(selectedAlertForMessage);
      const targetPhone =
        recipientType === 'driver'
          ? selectedAlertForMessage.bus.driver_phone || 'Assigned Driver'
          : recipientType === 'custom'
          ? customPhone || 'Custom Recipient'
          : 'Super Admin Manager';
      await api.sendExpiryAlert(selectedAlertForMessage.bus.id, {
        doc_name: selectedAlertForMessage.docLabel,
        expiry_date: selectedAlertForMessage.expiryDate,
        recipient: targetPhone,
        message: msg
      });
      success(`1-Day document expiry alert recorded and dispatched to ${targetPhone}!`);
      setIsAlertModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch alert');
    } finally {
      setSendingAlert(false);
    }
  };

  const drivers = employees.filter((e) => e.role === 'Driver');
  const helpers = employees.filter((e) => e.role === 'Helper');

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#142B4A]">Vehicle Management</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {buses.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage vehicle numbers for task assignment dropdown. Active vehicles appear in task management.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{buses.length}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Vehicles</p>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-center">
          <p className="text-3xl font-black text-emerald-600 tracking-tight">
            {buses.filter((b) => b.operational_status === 'Active').length}
          </p>
          <p className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wider">Active</p>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-center">
          <p className="text-3xl font-black text-rose-600 tracking-tight">
            {buses.filter((b) => b.operational_status === 'Inactive').length}
          </p>
          <p className="text-xs font-bold text-rose-700 mt-1 uppercase tracking-wider">Inactive</p>
        </div>
      </div>

      {/* 1-Day Document Expiry Urgent Alert Banner */}
      {urgentOneDayAlerts.length > 0 && !dismissAlertBanner && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wide">
                    ⚠️ Immediate 1-Day Document Expiry Alert
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                    {urgentOneDayAlerts.length} Attention Needed
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  Compliance documents for the following vehicle(s) are <strong>expiring in 1 day (tomorrow)</strong> or require immediate renewal to avoid transport penalties and vehicle grounding.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setOnlyExpiringFilter(!onlyExpiringFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  onlyExpiringFilter
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
              >
                {onlyExpiringFilter ? 'Show All Buses' : `Filter Expiring Buses (${urgentOneDayAlerts.length})`}
              </button>
              <button
                type="button"
                onClick={() => setDismissAlertBanner(true)}
                className="p-1.5 text-rose-500 hover:text-rose-800 rounded-lg hover:bg-rose-100/60 transition-colors cursor-pointer"
                title="Dismiss Banner"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {urgentOneDayAlerts.slice(0, 6).map((al, idx) => (
              <div
                key={`${al.bus.id}-${al.docKey}-${idx}`}
                className="p-3 bg-white/95 border border-rose-200/90 rounded-xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-[#142B4A] text-xs font-mono">{al.bus.registration_number}</span>
                    <span className="text-slate-500 text-xs">({al.bus.bus_type || 'Fleet Bus'})</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        al.status === 'expired'
                          ? 'bg-rose-100 text-rose-800'
                          : al.status === 'today'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {al.status === 'expired'
                        ? 'EXPIRED'
                        : al.status === 'today'
                        ? 'EXPIRES TODAY'
                        : 'EXPIRES TOMORROW (1 DAY)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium truncate mt-0.5">
                    <strong className="text-slate-900">{al.docLabel}:</strong> {al.expiryDate}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAlertModal(al)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Alert</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vehicle number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
          {urgentOneDayAlerts.length > 0 && (
            <button
              onClick={() => setOnlyExpiringFilter(!onlyExpiringFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                onlyExpiringFilter
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>1-Day Alerts ({urgentOneDayAlerts.length})</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-xs text-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white shadow-xs text-blue-600 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View (S.NO)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading vehicles...
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No vehicles found matching your criteria.
            </div>
          ) : (
            filteredBuses.map((b) => {
              const isActive = b.operational_status === 'Active';
              const busAlerts = getBusAlerts(b);
              const topAlert = busAlerts[0];
              const isUrgent = topAlert && (topAlert.status === 'one_day' || topAlert.status === 'today');

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl border p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    isActive
                      ? isUrgent
                        ? 'border-amber-300 ring-1 ring-amber-300'
                        : 'border-emerald-200/90 hover:border-emerald-400'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div>
                    {/* Card Top: Icon & Big Registration Number */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        <Bus className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-mono font-black text-slate-900 text-sm tracking-wider uppercase truncate">
                          {b.registration_number}
                        </h3>
                        {b.bus_type && (
                          <span className="text-[10px] text-slate-500 font-semibold block truncate">
                            {b.bus_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Document Validity Matrix */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 py-2 border-t border-b border-slate-100 text-[11px]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          REGISTRATION
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {b.registration_date || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          FITNESS
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.fitness_expiry && checkDocExpiry(b.fitness_expiry).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.fitness_expiry || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          TAX
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.tax_valid_upto && checkDocExpiry(b.tax_valid_upto).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.tax_valid_upto || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          INSURANCE
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.insurance_expiry && checkDocExpiry(b.insurance_expiry).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.insurance_expiry || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          PUCC
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.puc_expiry && checkDocExpiry(b.puc_expiry).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.puc_expiry || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          PERMIT
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.permit_expiry && checkDocExpiry(b.permit_expiry).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.permit_expiry || '—'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          AITP
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            b.aitp_valid_upto && checkDocExpiry(b.aitp_valid_upto).status === 'one_day'
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {b.aitp_valid_upto || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Status & Actions */}
                  <div className="flex items-center justify-between pt-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      ></span>
                      <span>{b.operational_status || 'Inactive'}</span>
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewProfile(b)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Vehicle Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setBusToArchive(b);
                            setIsArchiveConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete / Archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">S.NO</th>
                  <th className="py-3 px-4">Registration No.</th>
                  <th className="py-3 px-4">Bus Type</th>
                  <th className="py-3 px-4">Compliance & 1-Day Alerts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading fleet records...
                    </td>
                  </tr>
                ) : filteredBuses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No buses found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBuses.map((b, index) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#142B4A] text-sm">{b.registration_number}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{b.bus_type || '—'}</td>
                      <td className="py-3 px-4">
                        {(() => {
                          const busAlerts = getBusAlerts(b);
                          const topAlert = busAlerts[0];
                          if (!topAlert) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>6/6 Docs Valid</span>
                              </span>
                            );
                          }

                          const isOneDay = topAlert.status === 'one_day' || topAlert.status === 'today';
                          const isExpired = topAlert.status === 'expired';

                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isExpired
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : isOneDay
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>
                                  {topAlert.docLabel}:{' '}
                                  {isExpired
                                    ? 'Expired'
                                    : isOneDay
                                    ? topAlert.status === 'today'
                                      ? 'Expires Today!'
                                      : 'Expires Tomorrow (1d)!'
                                    : `${topAlert.daysRemaining}d left`}
                                </span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenAlertModal(topAlert)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>Send Alert Message</span>
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={b.operational_status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleViewProfile(b)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Full Bus Operational Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Bus Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setBusToArchive(b);
                                setIsArchiveConfirmOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Archive Bus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Bus Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingBus ? `Edit Vehicle (${editingBus.registration_number})` : 'Add Vehicle'}
        subtitle="Manage fleet vehicle registration, bus type, status, and compliance documents"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveBus} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registration No. *</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                placeholder="e.g. AP 16 TC 2080"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none uppercase font-semibold font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus Type *</label>
              <select
                value={formData.bus_type}
                onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                required
              >
                <option value="">-- Select Bus Type --</option>
                <option value="Full Sleeper">Full Sleeper</option>
                <option value="Seating/Sleeper">Seating/Sleeper</option>
                <option value="Seater">Seater</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status *</label>
              <select
                value={formData.operational_status}
                onChange={(e: any) => setFormData({ ...formData, operational_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                required
              >
                <option value="">-- Select Status --</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Compliance & Document Expiry Dates */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Document & Compliance Validity
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={formData.registration_date || ''}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Valid Upto</label>
                  <input
                    type="date"
                    value={formData.tax_valid_upto || ''}
                    onChange={(e) => setFormData({ ...formData, tax_valid_upto: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.tax_valid_upto)}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PUCC Valid Upto</label>
                  <input
                    type="date"
                    value={formData.puc_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, puc_expiry: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.puc_expiry)}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">AITP Valid Upto</label>
                  <input
                    type="date"
                    value={formData.aitp_valid_upto || ''}
                    onChange={(e) => setFormData({ ...formData, aitp_valid_upto: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.aitp_valid_upto)}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fitness Valid Upto</label>
                  <input
                    type="date"
                    value={formData.fitness_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, fitness_expiry: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.fitness_expiry)}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Insurance Valid Upto</label>
                  <input
                    type="date"
                    value={formData.insurance_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.insurance_expiry)}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Permit Valid Upto</label>
                  <input
                    type="date"
                    value={formData.permit_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, permit_expiry: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  {renderExpiryWarning(formData.permit_expiry)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Notes</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              placeholder="Operational or compliance notes..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              {editingBus ? 'Update Bus Record' : 'Save Bus to Fleet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Bus Full Operational Profile Modal */}
      {viewingBusDetails && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Bus Profile: ${viewingBusDetails.bus.registration_number}`}
          subtitle={`Bus Type: ${viewingBusDetails.bus.bus_type || 'Fleet Bus'} • Status: ${viewingBusDetails.bus.operational_status}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Top specs summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <Badge status={viewingBusDetails.bus.operational_status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bus Type</span>
                <span className="font-bold text-slate-800">{viewingBusDetails.bus.bus_type || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Insurance Valid Till</span>
                <span className="font-bold text-blue-700">{viewingBusDetails.bus.insurance_expiry || 'N/A'}</span>
              </div>
            </div>

            {/* Document Validity & Compliance Overview */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Document Validity & Compliance Status</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Registration Date</span>
                  <span className="font-mono font-bold text-slate-800">{viewingBusDetails.bus.registration_date || 'N/A'}</span>
                </div>
                {COMPLIANCE_DOCS.map((doc) => {
                  const val = (viewingBusDetails.bus as any)[doc.key];
                  const { daysRemaining, status, label } = checkDocExpiry(val);
                  const isExpiringSoon = status === 'one_day' || status === 'today' || status === 'expired';
                  return (
                    <div
                      key={doc.key}
                      className={`p-2.5 rounded-lg border transition-all ${
                        status === 'expired'
                          ? 'bg-rose-50/80 border-rose-200'
                          : status === 'today'
                          ? 'bg-red-50/90 border-red-300 ring-1 ring-red-400'
                          : status === 'one_day'
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                          : status === 'due_soon'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-semibold truncate">{doc.label}</span>
                        {val && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              status === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : status === 'today'
                                ? 'bg-red-100 text-red-700 font-extrabold animate-pulse'
                                : status === 'one_day'
                                ? 'bg-amber-200 text-amber-900 font-extrabold animate-pulse'
                                : status === 'due_soon'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {status === 'one_day' ? '1-DAY ALERT' : status === 'today' ? 'TODAY' : status === 'expired' ? 'EXPIRED' : label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <p className="font-mono font-bold text-slate-900 text-xs">{val || 'Not Set'}</p>
                      </div>
                      {val && isExpiringSoon && (
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenAlertModal({
                              docKey: doc.key,
                              docLabel: doc.label,
                              expiryDate: val,
                              daysRemaining: daysRemaining!,
                              status,
                              bus: viewingBusDetails.bus
                            });
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Send 1-Day Alert</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs pb-1">
              {[
                { id: 'km', label: 'Kilometers' },
                { id: 'maint', label: 'Maintenance' },
                { id: 'tyres', label: 'Tyres' },
                { id: 'ac', label: 'AC Service' },
                { id: 'oil', label: 'Oil & Filter' },
                { id: 'battery', label: 'Battery' },
                { id: 'complaints', label: 'Complaints' },
                { id: 'repairs', label: 'Repairs' },
                { id: 'inspections', label: 'Condition' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveViewTab(t.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                    activeViewTab === t.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="max-h-72 overflow-y-auto">
              {activeViewTab === 'km' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kilometer Entry History</p>
                  {viewingBusDetails.kmHistory?.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="py-1 px-2 text-center w-12">S.NO</th>
                          <th className="py-1">Date</th>
                          <th className="py-1">Opening</th>
                          <th className="py-1">Closing</th>
                          <th className="py-1">Distance</th>
                          <th className="py-1">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {viewingBusDetails.kmHistory.map((k: any, idx: number) => (
                          <tr key={k.id}>
                            <td className="py-1 px-2 font-bold text-slate-500 text-center">{idx + 1}</td>
                            <td className="py-1 font-medium">{k.entry_date}</td>
                            <td className="py-1 text-slate-500">{k.opening_km}</td>
                            <td className="py-1 font-semibold text-slate-900">{k.closing_km}</td>
                            <td className="py-1 font-bold text-blue-600">{k.distance_travelled_km} km</td>
                            <td className="py-1 text-slate-500">{k.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No kilometer entries logged yet.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'maint' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Services</p>
                  {viewingBusDetails.maintenanceHistory?.length > 0 ? (
                    viewingBusDetails.maintenanceHistory.map((m: any) => (
                      <div key={m.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{m.maintenance_type}</p>
                          <p className="text-slate-500 text-[11px]">Due: {m.next_due_date || `${m.next_due_km} km`} • Assigned: {m.assigned_to || 'Workshop'}</p>
                        </div>
                        <Badge status={m.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No maintenance scheduled.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'tyres' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Installed Tyres</p>
                  {viewingBusDetails.tyreHistory?.length > 0 ? (
                    viewingBusDetails.tyreHistory.map((t: any) => (
                      <div key={t.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{t.tyre_position}: {t.brand} ({t.tyre_serial_number})</p>
                          <p className="text-slate-500 text-[11px]">Tread: {t.tread_depth_mm}mm • Pressure: {t.tyre_pressure_psi} psi</p>
                        </div>
                        <Badge status={t.condition} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No tyres registered for this bus.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'complaints' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Complaints</p>
                  {viewingBusDetails.complaints?.length > 0 ? (
                    viewingBusDetails.complaints.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{c.complaint_ref} ({c.category})</p>
                          <p className="text-slate-600 text-[11px]">{c.description}</p>
                        </div>
                        <Badge status={c.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No complaints on file.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'repairs' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repair Work Orders</p>
                  {viewingBusDetails.repairs?.length > 0 ? (
                    viewingBusDetails.repairs.map((r: any) => (
                      <div key={r.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{r.work_order_number} ({r.repair_category})</p>
                          <p className="text-slate-600 text-[11px]">{r.problem_description} • Cost: ₹{r.total_cost?.toLocaleString()}</p>
                        </div>
                        <Badge status={r.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No repairs on record.</p>
                  )}
                </div>
              )}

              {activeViewTab === 'inspections' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition Inspections</p>
                  {viewingBusDetails.inspections?.length > 0 ? (
                    viewingBusDetails.inspections.map((i: any) => (
                      <div key={i.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{i.inspection_ref} - {i.inspection_date}</p>
                          <p className="text-slate-600 text-[11px]">Inspector: {i.inspector_name}</p>
                        </div>
                        <Badge status={i.roadworthiness_status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No condition inspections on record.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Confirmation Dialog */}
      <Modal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        title="Confirm Bus Archival"
        subtitle="Historical maintenance and odometer logs will be preserved safely"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to archive bus <strong className="text-slate-900">{busToArchive?.bus_number} ({busToArchive?.registration_number})</strong>?
            Archived buses are removed from active operations but kept for reporting and audit history.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsArchiveConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
            >
              Confirm Archival
            </button>
          </div>
        </div>
      </Modal>

      {/* 1-Day Document Expiry Alert Modal */}
      {selectedAlertForMessage && (
        <Modal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          title="Send Document Expiry Alert Message"
          subtitle={`Vehicle ${selectedAlertForMessage.bus.bus_number} (${selectedAlertForMessage.bus.registration_number}) • ${selectedAlertForMessage.docLabel}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Status Notice Banner */}
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              selectedAlertForMessage.status === 'one_day'
                ? 'bg-amber-500/10 border-amber-300 text-amber-900'
                : selectedAlertForMessage.status === 'today'
                ? 'bg-red-500/10 border-red-300 text-red-900'
                : selectedAlertForMessage.status === 'expired'
                ? 'bg-rose-500/10 border-rose-300 text-rose-900'
                : 'bg-blue-500/10 border-blue-300 text-blue-900'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                selectedAlertForMessage.status === 'one_day' ? 'text-amber-600' : 'text-red-600'
              }`} />
              <div className="text-xs">
                <p className="font-bold text-sm">
                  {selectedAlertForMessage.status === 'one_day'
                    ? '1-Day Expiry Notice: Document Expires Tomorrow!'
                    : selectedAlertForMessage.status === 'today'
                    ? 'Urgent Notice: Document Expires Today!'
                    : selectedAlertForMessage.status === 'expired'
                    ? `Critical: Document Expired ${Math.abs(selectedAlertForMessage.daysRemaining)} Days Ago!`
                    : `Notice: Document expires in ${selectedAlertForMessage.daysRemaining} days.`}
                </p>
                <p className="mt-0.5 opacity-90">
                  Document <strong>{selectedAlertForMessage.docLabel}</strong> expires on <strong>{selectedAlertForMessage.expiryDate}</strong>.
                  Inform the driver or transport operations immediately before vehicle operations are halted.
                </p>
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Recipient:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('driver')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientType === 'driver'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Assigned Driver</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                    {selectedAlertForMessage.bus.driver_name || 'No driver assigned'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedAlertForMessage.bus.driver_phone || 'No phone set'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('admin')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientType === 'admin'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fleet Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                    Super Admin Manager
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    +91 98765 43210
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('custom')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    recipientType === 'custom'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Custom Mobile</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                    Type phone number
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    WhatsApp / SMS
                  </p>
                </button>
              </div>

              {recipientType === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Pre-composed Compliance Message:</label>
                <button
                  type="button"
                  onClick={handleCopyAlertMessage}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-800">
                {generateDraftMessage(selectedAlertForMessage)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppAlert}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchSystemAlert}
                  disabled={sendingAlert}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingAlert ? 'Dispatching...' : 'Dispatch System Alert'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
