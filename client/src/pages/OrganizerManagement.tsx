import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Edit,
  Trash2,
  FileText,
  MapPin,
  CheckCircle2,
  IndianRupee,
  Upload,
  Eye,
  X,
  Printer,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { PrintButton } from '../components/common/PrintButton';
import { printSheet } from '../utils/printSheet';
import { BASE_FLEET_ORGANIZERS } from '../services/seedData';
import { api } from '../services/api';

export interface OrganizerItem {
  id: number;
  organization_name: string;
  gst_number: string;
  contact_person: string;
  phone_number: string;
  email: string;
  office_address: string;
}

const STORAGE_KEY = 'charvik_organizer_management_data';

export const OrganizerManagement: React.FC = () => {
  const { success, error } = useToast();

  const [organizers, setOrganizers] = useState<OrganizerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, any>();
          BASE_FLEET_ORGANIZERS.forEach((o, idx) => map.set(String(o.id || idx + 1), o));
          parsed.forEach((o, idx) => {
            const key = String(o.id || idx + 1);
            map.set(key, { ...map.get(key), ...o });
          });
          return Array.from(map.values()).map((o: any, idx: number) => ({
            id: o.id || idx + 1,
            organization_name: o.organization_name || '',
            gst_number: o.gst_number || '',
            contact_person: o.contact_person || '',
            phone_number: o.phone_number || '',
            email: o.email || '',
            office_address: o.office_address || o.billing_address || ''
          }));
        }
      }
      return BASE_FLEET_ORGANIZERS;
    } catch {
      return BASE_FLEET_ORGANIZERS;
    }
  });

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizerItem | null>(null);

  // Organizer Record Payment Modal State
  const [organizerPayments, setOrganizerPayments] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('charvik_organizer_payments_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetOrg, setTargetOrg] = useState<OrganizerItem | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    period_month: 'Oct',
    period_year: '2026',
    amount: '',
    received_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash' as 'Cash' | 'Bank' | 'UPI',
    payment_proof: '',
    notes: ''
  });
  const [previewProofModal, setPreviewProofModal] = useState<string | null>(null);

  // Sync with API on mount
  useEffect(() => {
    api.getOrganizers().then((remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setOrganizers(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      }
    }).catch(() => {});

    api.getOrganizerPayments().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setOrganizerPayments(data);
        localStorage.setItem('charvik_organizer_payments_data', JSON.stringify(data));
      }
    }).catch(() => {});
  }, []);

  const [formData, setFormData] = useState<Partial<OrganizerItem>>({
    organization_name: '',
    gst_number: '',
    contact_person: '',
    phone_number: '',
    email: '',
    office_address: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(organizers));
    } catch {}
  }, [organizers]);

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setFormData({
      organization_name: '',
      gst_number: '',
      contact_person: '',
      phone_number: '',
      email: '',
      office_address: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (org: OrganizerItem) => {
    setEditingOrg(org);
    setFormData({
      organization_name: org.organization_name,
      gst_number: org.gst_number || '',
      contact_person: org.contact_person,
      phone_number: org.phone_number,
      email: org.email || '',
      office_address: org.office_address || ''
    });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organization_name?.trim()) {
      error('Please enter the organization name.');
      return;
    }

    if (!formData.contact_person?.trim()) {
      error('Please enter the contact person name.');
      return;
    }

    if (!formData.phone_number?.trim()) {
      error('Please enter the contact phone number.');
      return;
    }

    const trimmedGst = (formData.gst_number || '').trim().toUpperCase();

    if (editingOrg) {
      const updatedItem: OrganizerItem = {
        ...editingOrg,
        organization_name: formData.organization_name!.trim(),
        gst_number: trimmedGst,
        contact_person: formData.contact_person!.trim(),
        phone_number: formData.phone_number!.trim(),
        email: (formData.email || '').trim(),
        office_address: (formData.office_address || '').trim()
      };
      const updated = organizers.map((o) => (o.id === editingOrg.id ? updatedItem : o));
      setOrganizers(updated);
      api.updateOrganizer(editingOrg.id, updatedItem).catch((err: any) => {
        error(err.message || 'Failed to update organization in database');
      });
      success(`Organization "${formData.organization_name.trim()}" updated successfully.`);
    } else {
      const newItem: OrganizerItem = {
        id: Date.now(),
        organization_name: formData.organization_name!.trim(),
        gst_number: trimmedGst,
        contact_person: formData.contact_person!.trim(),
        phone_number: formData.phone_number!.trim(),
        email: (formData.email || '').trim(),
        office_address: (formData.office_address || '').trim()
      };
      setOrganizers([newItem, ...organizers]);
      api.createOrganizer(newItem).then((saved) => {
        if (saved && saved.id) {
          setOrganizers((curr) => curr.map((o) => (o.id === newItem.id ? { ...o, id: saved.id } : o)));
        }
      }).catch((err: any) => {
        error(err.message || 'Failed to create organization in database');
      });
      success(`Organization "${newItem.organization_name}" added successfully.`);
    }

    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    const target = organizers.find((o) => o.id === id);
    const targetName = target ? target.organization_name : 'this organization';
    if (!window.confirm(`Are you sure you want to delete "${targetName}"?`)) return;
    setOrganizers(organizers.filter((o) => o.id !== id));
    api.deleteOrganizer(id).catch((err: any) => {
      error(err.message || 'Failed to delete organization from database');
    });
    success(`Organization "${targetName}" removed.`);
  };

  const handleOpenRecordPayment = (org: OrganizerItem) => {
    setTargetOrg(org);
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setPaymentForm({
      period_month: months[now.getMonth()],
      period_year: String(now.getFullYear()),
      amount: '',
      received_date: now.toISOString().split('T')[0],
      payment_mode: 'Cash',
      payment_proof: '',
      notes: ''
    });
    setIsRecordModalOpen(true);
  };

  const handleDeleteOrganizerPayment = (payId: number | string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    const updated = organizerPayments.filter((p) => p.id !== payId);
    setOrganizerPayments(updated);
    try {
      localStorage.setItem('charvik_organizer_payments_data', JSON.stringify(updated));
    } catch {}
    success('Payment record removed.');
  };

  const handleSaveOrganizerPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetOrg) {
      error('Please select an organization.');
      return;
    }
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      error('Please enter a valid received amount.');
      return;
    }

    try {
      const receiptNo = 'ORG-REC-' + Date.now().toString().slice(-6);
      const newPayment = {
        id: Date.now(),
        receipt_no: receiptNo,
        organizer_name: targetOrg.organization_name,
        period: `${paymentForm.period_month} ${paymentForm.period_year}`,
        amount: amt,
        received_date: paymentForm.received_date,
        payment_mode: paymentForm.payment_mode,
        payment_proof: paymentForm.payment_proof || undefined,
        notes: paymentForm.notes || undefined,
        created_at: new Date().toISOString()
      };

      const created = await api.createOrganizerPayment(newPayment).catch(() => newPayment);
      const updated = [created, ...organizerPayments];
      setOrganizerPayments(updated);
      try {
        localStorage.setItem('charvik_organizer_payments_data', JSON.stringify(updated));
      } catch {}

      success(`Recorded payment of ₹${amt.toLocaleString('en-IN')} for ${targetOrg.organization_name}!`);
      setPaymentForm((prev) => ({
        ...prev,
        amount: '',
        notes: '',
        payment_proof: ''
      }));

      if (shouldPrint) {
        printSheet({
          title: 'CHARVIK FLEET MANAGEMENT - ORGANIZER RECEIPT',
          subtitle: `Receipt No: ${receiptNo} | Organization: ${targetOrg.organization_name}`,
          orientation: 'portrait',
          htmlContent: `
            <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
              <div style="text-align: center; border-bottom: 2px solid #142B4A; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #142B4A; font-size: 22px;">CHARVIK FLEET MANAGEMENT</h2>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Organization Revenue / Payment Receipt</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Receipt Number:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-family: monospace; text-align: right;">${receiptNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Receipt Date:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentForm.received_date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Organization Name:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${targetOrg.organization_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Contact Person:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${targetOrg.contact_person} (${targetOrg.phone_number})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Payment Mode:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentForm.payment_mode}</td>
                </tr>
                ${paymentForm.notes ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Notes / Ref:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentForm.notes}</td>
                </tr>` : ''}
                <tr style="border-top: 2px dashed #cbd5e1; border-bottom: 2px dashed #cbd5e1;">
                  <td style="padding: 14px 0; font-size: 15px; font-weight: bold; color: #142B4A;">Total Received:</td>
                  <td style="padding: 14px 0; font-size: 18px; font-weight: 900; color: #047857; text-align: right;">₹${amt.toLocaleString('en-IN')}</td>
                </tr>
              </table>
              ${paymentForm.payment_proof ? `
              <div style="text-align: center; margin-top: 15px;">
                <p style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Payment Verification Proof Attached:</p>
                <img src="${paymentForm.payment_proof}" style="max-height: 180px; max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" />
              </div>` : ''}
            </div>
          `
        });
      }
    } catch {
      error('Failed to record organizer payment.');
    }
  };

  const filteredOrganizers = organizers.filter((o) => {
    const query = search.toLowerCase();
    return (
      o.organization_name.toLowerCase().includes(query) ||
      (o.gst_number && o.gst_number.toLowerCase().includes(query)) ||
      o.contact_person.toLowerCase().includes(query) ||
      o.phone_number.includes(query) ||
      (o.email && o.email.toLowerCase().includes(query)) ||
      (o.office_address && o.office_address.toLowerCase().includes(query))
    );
  });

  const gstCount = organizers.filter((o) => Boolean(o.gst_number && o.gst_number.trim())).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Organization Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partner organizations, GST numbers, contact persons, and communication directories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrintButton
            title="Registered Organizations & Operator Directory"
            subtitle={`Total: ${filteredOrganizers.length} Organizations`}
            targetId="organizers-table-wrap"
          />
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Organization</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Organizations</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {organizers.length} Organizations
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered partner institutions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">GST Registered</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{gstCount} Records</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">With verified GSTIN records</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Contact Directory</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{organizers.length} Points</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct phone & email reach</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization name, GST number, contact person, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div id="organizers-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">GST Number</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrganizers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-700">No organizations found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No organizations configured yet. Use the &quot;+ Add New Organization&quot; button above to create one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrganizers.map((o, index) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{o.organization_name}</span>
                      </p>
                      {o.office_address && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[240px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{o.office_address}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {o.gst_number ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {o.gst_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{o.contact_person}</p>
                    </td>

                    <td className="py-3 px-4">
                      <a
                        href={`tel:${o.phone_number}`}
                        className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{o.phone_number}</span>
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      {o.email ? (
                        <a
                          href={`mailto:${o.email}`}
                          className="font-medium text-slate-700 hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{o.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRecordPayment(o)}
                          className="p-1.5 rounded-lg bg-[#EAFBF3] text-[#00875A] border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                          title={`Record Payment from ${o.organization_name}`}
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Organization"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingOrg ? 'Edit Organization' : 'Add New Organization'}
        subtitle="Manage partner organization details, GST number, and contact points"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={formData.organization_name || ''}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              placeholder="e.g. Oakridge International School or Infosys Hyderabad"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              GST Number
            </label>
            <input
              type="text"
              value={formData.gst_number || ''}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
              placeholder="e.g. 36AAAAA0000A1Z5"
              maxLength={15}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Manager / Officer Name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Official mobile / phone"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="transport@company.com"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Office Address
            </label>
            <textarea
              rows={2}
              value={formData.office_address || ''}
              onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
              placeholder="Campus or office address"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors shadow-sm cursor-pointer"
            >
              {editingOrg ? 'Update Organization' : 'Save Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Monthly Income Record Payment Modal (Exact Match to User Reference Screenshot) */}
      {isRecordModalOpen && targetOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EAFBF3] text-[#00A86B] flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-[#00A86B]">₹</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Monthly Income: {targetOrg.organization_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Track monthly payments received from this organizer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* SECTION 1: LOG NEW PAYMENT */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  LOG NEW PAYMENT
                </h4>

                <form
                  onSubmit={handleSaveOrganizerPayment}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Period (Month & Year) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Period (Month &amp; Year) *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={paymentForm.period_month}
                          onChange={(e) => setPaymentForm({ ...paymentForm, period_month: e.target.value })}
                          className="w-1/2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-[#00B074]"
                        >
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          value={paymentForm.period_year}
                          onChange={(e) => setPaymentForm({ ...paymentForm, period_year: e.target.value })}
                          placeholder="2026"
                          className="w-1/2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none text-center font-mono focus:border-[#00B074]"
                        />
                      </div>
                    </div>

                    {/* Amount (₹) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder="0.00"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none font-mono focus:border-[#00B074]"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Payment Mode *
                      </label>
                      <select
                        value={paymentForm.payment_mode}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            payment_mode: e.target.value as 'Cash' | 'Bank' | 'UPI'
                          })
                        }
                        className="w-full p-2.5 rounded-xl border-2 border-[#00B074] bg-white text-xs font-bold text-slate-900 outline-none cursor-pointer shadow-2xs focus:ring-1 focus:ring-[#00B074]"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>

                    {/* Date Received */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Date Received *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentForm.received_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, received_date: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Transaction ID, remarks..."
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Photo Proof Upload for Bank / UPI */}
                  {paymentForm.payment_mode !== 'Cash' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Payment Proof (Photo Upload)
                      </label>
                      {paymentForm.payment_proof ? (
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={paymentForm.payment_proof}
                              alt="Proof preview"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer"
                              onClick={() => setPreviewProofModal(paymentForm.payment_proof)}
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Proof photo attached</p>
                              <p className="text-[10px] text-slate-500">Click image to enlarge</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewProofModal(paymentForm.payment_proof)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentForm({ ...paymentForm, payment_proof: '' })}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 cursor-pointer transition-all">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">
                            Upload Bank Slip / UPI Screenshot (Optional)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  error('File size must be under 5MB');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setPaymentForm((prev) => ({
                                    ...prev,
                                    payment_proof: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Add Record Button */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#00B074] hover:bg-[#009A65] text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 2: PAYMENT HISTORY */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  PAYMENT HISTORY
                </h4>

                {(() => {
                  const orgRecords = organizerPayments.filter(
                    (p) => p.organizer_name?.toLowerCase() === targetOrg.organization_name.toLowerCase()
                  );

                  if (orgRecords.length === 0) {
                    return (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200/90 p-10 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl text-slate-300 font-bold mb-2">₹</span>
                        <p className="text-xs text-slate-400 font-medium">
                          No income records found for this organizer.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">#</th>
                              <th className="py-3 px-4">PERIOD</th>
                              <th className="py-3 px-4">DATE</th>
                              <th className="py-3 px-4">AMOUNT</th>
                              <th className="py-3 px-4">MODE</th>
                              <th className="py-3 px-4">PROOF</th>
                              <th className="py-3 px-4">NOTES</th>
                              <th className="py-3 px-4 text-center">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {orgRecords.map((rec, idx) => (
                              <tr key={rec.id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-bold text-slate-800">{rec.period || '-'}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{rec.received_date}</td>
                                <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                                  ₹{Number(rec.amount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {rec.payment_mode || 'Cash'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {rec.payment_proof ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProofModal(rec.payment_proof)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate">
                                  {rec.notes || '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrganizerPayment(rec.id)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Payment Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Photo Fullscreen Modal */}
      {previewProofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewProofModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Payment Verification Photo</span>
              <button
                onClick={() => setPreviewProofModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3 flex items-center justify-center">
              <img
                src={previewProofModal}
                alt="Payment proof full"
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
