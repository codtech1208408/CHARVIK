import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Bus,
  Edit,
  Trash2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

interface OrganizerItem {
  id: number;
  organization_name: string;
  category: 'School / Institution' | 'Corporate / IT Park' | 'Event Organizer' | 'Tour & Travels' | 'Government / PSU';
  contact_person: string;
  phone_number: string;
  email: string;
  billing_address: string;
  contract_start: string;
  contract_end: string;
  allocated_buses_count: number;
  monthly_billing_amount: number;
  status: 'Active' | 'Pending Renewal' | 'Terminated';
}

const STORAGE_KEY = 'charvik_organizer_management_data';

export const OrganizerManagement: React.FC = () => {
  const { success, error } = useToast();

  const [organizers, setOrganizers] = useState<OrganizerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizerItem | null>(null);

  const [formData, setFormData] = useState<Partial<OrganizerItem>>({
    organization_name: '',
    category: 'Corporate / IT Park',
    contact_person: '',
    phone_number: '',
    email: '',
    billing_address: '',
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: '2027-03-31',
    allocated_buses_count: 2,
    monthly_billing_amount: 150000,
    status: 'Active'
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
      category: 'Corporate / IT Park',
      contact_person: '',
      phone_number: '',
      email: '',
      billing_address: 'HITEC City, Hyderabad',
      contract_start: new Date().toISOString().split('T')[0],
      contract_end: '2027-03-31',
      allocated_buses_count: 3,
      monthly_billing_amount: 220000,
      status: 'Active'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (org: OrganizerItem) => {
    setEditingOrg(org);
    setFormData({ ...org });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organization_name || !formData.contact_person || !formData.phone_number) {
      error('Please provide organization name, contact person, and phone number.');
      return;
    }

    if (editingOrg) {
      const updated = organizers.map((o) =>
        o.id === editingOrg.id ? ({ ...o, ...formData } as OrganizerItem) : o
      );
      setOrganizers(updated);
      success('Organizer details updated.');
    } else {
      const newItem: OrganizerItem = {
        id: Date.now(),
        organization_name: formData.organization_name!,
        category: (formData.category as any) || 'Corporate / IT Park',
        contact_person: formData.contact_person!,
        phone_number: formData.phone_number!,
        email: formData.email || '',
        billing_address: formData.billing_address || 'Hyderabad',
        contract_start: formData.contract_start || new Date().toISOString().split('T')[0],
        contract_end: formData.contract_end || '2027-03-31',
        allocated_buses_count: Number(formData.allocated_buses_count) || 1,
        monthly_billing_amount: Number(formData.monthly_billing_amount) || 0,
        status: (formData.status as any) || 'Active'
      };
      setOrganizers([newItem, ...organizers]);
      success('New contracted organizer added successfully.');
    }
    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to remove this contracted organizer?')) return;
    setOrganizers(organizers.filter((o) => o.id !== id));
    success('Organizer removed.');
  };

  const filteredOrganizers = organizers.filter((o) => {
    const matchesSearch =
      o.organization_name.toLowerCase().includes(search.toLowerCase()) ||
      o.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      o.phone_number.includes(search);
    const matchesCat = categoryFilter === 'All' || o.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalMonthlyBilling = organizers
    .filter((o) => o.status === 'Active')
    .reduce((acc, o) => acc + (Number(o.monthly_billing_amount) || 0), 0);

  const totalAssignedBuses = organizers
    .filter((o) => o.status === 'Active')
    .reduce((acc, o) => acc + (Number(o.allocated_buses_count) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Organizer & Client Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage institutional partners, schools, corporate fleet contracts, and allocated bus quotas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Organizer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Contracted Partners</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {organizers.filter((o) => o.status === 'Active').length} Active
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Schools & corporate accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Allocated Fleet Quota</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{totalAssignedBuses} Buses</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Under institutional contract</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Contracted Monthly Billing</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{totalMonthlyBilling.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Recurring contract revenue</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization name, contact person, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Categories</option>
            <option value="School / Institution">School / Institution</option>
            <option value="Corporate / IT Park">Corporate / IT Park</option>
            <option value="Event Organizer">Event Organizer</option>
            <option value="Tour & Travels">Tour & Travels</option>
            <option value="Government / PSU">Government / PSU</option>
          </select>
        </div>

        <div className="w-full md:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Renewal">Pending Renewal</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Allocated Buses</th>
                <th className="py-3 px-4">Monthly Value</th>
                <th className="py-3 px-4">Contract Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrganizers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No contracted organizers registered yet. Click &quot;Add New Organizer&quot; to begin.
                  </td>
                </tr>
              ) : (
                filteredOrganizers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{o.organization_name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{o.billing_address}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{o.category}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{o.contact_person}</p>
                      <p className="text-[11px] text-slate-500">{o.phone_number}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-xs">
                        <Bus className="w-3 h-3" />
                        {o.allocated_buses_count} Buses
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      ₹{o.monthly_billing_amount.toLocaleString()}/mo
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="text-[11px]">
                        <span className="text-slate-400">Till:</span> {o.contract_end}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'Pending Renewal'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
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
        title={editingOrg ? 'Edit Contracted Organizer' : 'Add New Contracted Organizer'}
        subtitle="Manage client institutional contracts and bus service quotas"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Client Name *</label>
            <input
              type="text"
              required
              value={formData.organization_name || ''}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              placeholder="e.g. Oakridge International School or Infosys Hyderabad"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category || 'Corporate / IT Park'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="School / Institution">School / Institution</option>
                <option value="Corporate / IT Park">Corporate / IT Park</option>
                <option value="Event Organizer">Event Organizer</option>
                <option value="Tour & Travels">Tour & Travels</option>
                <option value="Government / PSU">Government / PSU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Manager / Officer Name"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Official mobile / phone"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="transport@company.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Allocated Buses Quota</label>
              <input
                type="number"
                min="1"
                value={formData.allocated_buses_count ?? ''}
                onChange={(e) => setFormData({ ...formData, allocated_buses_count: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Billing (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.monthly_billing_amount ?? ''}
                onChange={(e) => setFormData({ ...formData, monthly_billing_amount: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract End Date</label>
              <input
                type="date"
                value={formData.contract_end || ''}
                onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Active">Active</option>
                <option value="Pending Renewal">Pending Renewal</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Billing / Office Address</label>
            <textarea
              rows={2}
              value={formData.billing_address || ''}
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              placeholder="Full address of the corporate or educational institution campus"
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
            >
              {editingOrg ? 'Update Organizer' : 'Save Organizer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
