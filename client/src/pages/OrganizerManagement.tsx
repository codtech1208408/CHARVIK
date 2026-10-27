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
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
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
          return parsed.map((o: any, idx: number) => ({
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

  // Sync with API on mount
  useEffect(() => {
    api.getOrganizers().then((remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setOrganizers(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
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
      api.updateOrganizer(editingOrg.id, updatedItem).catch(() => {});
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
      api.createOrganizer(newItem).catch(() => {});
      success(`Organization "${newItem.organization_name}" added successfully.`);
    }

    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    const target = organizers.find((o) => o.id === id);
    const targetName = target ? target.organization_name : 'this organization';
    if (!window.confirm(`Are you sure you want to delete "${targetName}"?`)) return;
    setOrganizers(organizers.filter((o) => o.id !== id));
    api.deleteOrganizer(id).catch(() => {});
    success(`Organization "${targetName}" removed.`);
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

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Organization</span>
        </button>
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
    </div>
  );
};
