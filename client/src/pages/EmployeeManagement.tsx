import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Printer,
  ShieldCheck,
  CreditCard,
  Building,
  Briefcase,
  FileText,
  AlertTriangle,
  Bus,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { Employee } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'identity' | 'licence' | 'bank' | 'references' | 'employment'>('personal');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    gender: 'Male',
    date_of_birth: '',
    email: '',
    phone_number: '',
    alternative_phone_number: '',
    aadhaar_number: '',
    pan_number: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',
    reference_name: '',
    reference_phone: '',
    reference_alt_phone: '',
    joining_date: '',
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: '',
    licence_number: '',
    issuing_state: '',
    issuing_rto_office: '',
    licence_issue_date: '',
    licence_validity_date: '',
    licence_experience_years: 0,
    criminal_background_details: '',
    licence_verification_status: 'Verified'
  });

  useEffect(() => {
    loadEmployees();
  }, [roleFilter, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees({
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
      setEmployees(data);
    } catch (err: any) {
      error(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (emp: Employee) => {
    try {
      const details = await api.getEmployee(emp.id);
      setViewingProfile(details);
      setActiveTab('personal');
      setIsViewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load profile');
    }
  };

  const handleOpenEdit = async (emp: Employee) => {
    try {
      const details = await api.getEmployee(emp.id);
      const e = details.employee;
      const d = details.driverDetail || {};
      setEditingEmployee(e);
      setEditFormData({
        full_name: e.full_name,
        gender: e.gender || 'Male',
        date_of_birth: e.date_of_birth || '',
        email: e.email || '',
        phone_number: e.phone_number,
        alternative_phone_number: e.alternative_phone_number || '',
        aadhaar_number: e.aadhaar_number || '',
        pan_number: e.pan_number || '',
        bank_name: e.bank_name || '',
        account_holder_name: e.account_holder_name || '',
        account_number: e.account_number || '',
        ifsc_code: e.ifsc_code || '',
        branch: e.branch || '',
        reference_name: e.reference_name || '',
        reference_phone: e.reference_phone || '',
        reference_alt_phone: e.reference_alt_phone || '',
        joining_date: e.joining_date || '',
        employment_status: e.employment_status || 'Active',
        assigned_bus_id: e.assigned_bus_id ? String(e.assigned_bus_id) : '',
        internal_remarks: e.internal_remarks || '',
        licence_number: d.licence_number || '',
        issuing_state: d.issuing_state || '',
        issuing_rto_office: d.issuing_rto_office || '',
        licence_issue_date: d.licence_issue_date || '',
        licence_validity_date: d.licence_validity_date || '',
        licence_experience_years: d.licence_experience_years || 0,
        criminal_background_details: d.criminal_background_details || '',
        licence_verification_status: d.licence_verification_status || 'Verified'
      });
      setIsEditOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load employee for editing');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await api.updateEmployee(editingEmployee.id, editFormData);
      success(`Employee ${editFormData.full_name} updated successfully!`);
      setIsEditOpen(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      error(err.message || 'Failed to update employee');
    }
  };

  const handleArchive = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to archive employee ${emp.full_name} (${emp.employee_code})?`)) return;
    try {
      await api.archiveEmployee(emp.id);
      success(`Employee ${emp.full_name} archived.`);
      loadEmployees();
    } catch (err: any) {
      error(err.message || 'Failed to archive employee');
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const s = searchTerm.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(s) ||
      e.employee_code.toLowerCase().includes(s) ||
      e.phone_number.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Employee & Transport Staff Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized directory for Drivers, Helpers, and Captains with masked identity and full biodata profile records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/admin/drivers/new')}
            className="inline-flex items-center px-3.5 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Driver</span>
          </button>
          <button
            onClick={() => navigate('/admin/support-staff/new')}
            className="inline-flex items-center px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Helper/Captain</span>
          </button>
        </div>
      </div>

      {/* Role Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Role Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Driver', 'Helper', 'Captain'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {role === 'All' ? 'All Staff' : `${role}s`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Assigned Bus</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Licence Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading employee records...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.employee_code}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {e.full_name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900">{e.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-800">
                        {e.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{e.phone_number}</td>
                    <td className="py-3 px-4">
                      {e.bus_number ? (
                        <span className="font-semibold text-blue-700">{e.bus_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{e.joining_date || '-'}</td>
                    <td className="py-3 px-4">
                      {e.role === 'Driver' && e.licence_validity_date ? (
                        <span className="font-semibold text-slate-800 font-mono">
                          {e.licence_validity_date}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={e.employment_status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenProfile(e)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Open Full Biodata Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Edit Employee Biodata"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(e)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Archive Employee Record"
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

      {/* Full Biodata Profile Modal */}
      {viewingProfile && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Biodata Profile: ${viewingProfile.employee.full_name} (${viewingProfile.employee.employee_code})`}
          subtitle={`${viewingProfile.employee.role} • Status: ${viewingProfile.employee.employment_status}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Print Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg">
                  {viewingProfile.employee.full_name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{viewingProfile.employee.full_name}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{viewingProfile.employee.employee_code} • {viewingProfile.employee.role}</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Biodata</span>
              </button>
            </div>

            {/* Profile Tab Buttons */}
            <div className="flex border-b border-slate-200 space-x-2 text-xs pb-1 overflow-x-auto">
              {[
                { id: 'personal', label: 'Personal Information' },
                { id: 'identity', label: 'Identity Documents' },
                ...(viewingProfile.employee.role === 'Driver' ? [{ id: 'licence', label: 'Driving Licence' }] : []),
                { id: 'bank', label: 'Bank Details' },
                { id: 'references', label: 'References' },
                { id: 'employment', label: 'Employment Details' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                    activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              {activeTab === 'personal' && (
                <div className="grid grid-cols-2 gap-3 leading-relaxed">
                  <div><strong>Full Name:</strong> {viewingProfile.employee.full_name}</div>
                  <div><strong>Gender:</strong> {viewingProfile.employee.gender}</div>
                  <div><strong>Date of Birth:</strong> {viewingProfile.employee.date_of_birth || 'Not recorded'}</div>
                  <div><strong>Phone Number:</strong> {viewingProfile.employee.phone_number}</div>
                  <div><strong>Alternative Phone:</strong> {viewingProfile.employee.alternative_phone_number || '-'}</div>
                  <div><strong>Email Address:</strong> {viewingProfile.employee.email || '-'}</div>
                </div>
              )}

              {activeTab === 'identity' && (
                <div className="space-y-3 leading-relaxed">
                  <div className="grid grid-cols-2 gap-3">
                    <div><strong>Aadhaar Number:</strong> {viewingProfile.employee.aadhaar_number || 'XXXX-XXXX-XXXX'}</div>
                    <div><strong>PAN Card Number:</strong> {viewingProfile.employee.pan_number || 'N/A'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identity files (Aadhaar Front/Back, PAN) securely encrypted in private storage.</span>
                  </div>
                </div>
              )}

              {activeTab === 'licence' && viewingProfile.driverDetail && (
                <div className="grid grid-cols-2 gap-3 leading-relaxed">
                  <div><strong>Licence Number:</strong> {viewingProfile.driverDetail.licence_number}</div>
                  <div><strong>Issuing State:</strong> {viewingProfile.driverDetail.issuing_state}</div>
                  <div><strong>Issued RTO:</strong> {viewingProfile.driverDetail.issuing_rto_office}</div>
                  <div><strong>Issue Date:</strong> {viewingProfile.driverDetail.licence_issue_date || '-'}</div>
                  <div><strong>Validity Date (TRANS):</strong> <span className="font-bold text-blue-700">{viewingProfile.driverDetail.licence_validity_date}</span></div>
                  <div><strong>Total Driving Experience:</strong> {viewingProfile.driverDetail.licence_experience_years} Years</div>
                  <div><strong>Verification Status:</strong> <Badge status={viewingProfile.driverDetail.licence_verification_status} /></div>
                  <div className="col-span-2"><strong>Background Check:</strong> {viewingProfile.driverDetail.criminal_background_details || 'Clean'}</div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="grid grid-cols-2 gap-3 leading-relaxed">
                  <div><strong>Bank Name:</strong> {viewingProfile.employee.bank_name || '-'}</div>
                  <div><strong>Account Holder:</strong> {viewingProfile.employee.account_holder_name || viewingProfile.employee.full_name}</div>
                  <div><strong>Account Number:</strong> {viewingProfile.employee.account_number || 'XXXX-XXXX-XXXX'}</div>
                  <div><strong>IFSC Code:</strong> {viewingProfile.employee.ifsc_code || '-'}</div>
                  <div><strong>Branch:</strong> {viewingProfile.employee.branch || '-'}</div>
                </div>
              )}

              {activeTab === 'references' && (
                <div className="grid grid-cols-2 gap-3 leading-relaxed">
                  <div><strong>Reference Person:</strong> {viewingProfile.employee.reference_name || 'None provided'}</div>
                  <div><strong>Primary Phone:</strong> {viewingProfile.employee.reference_phone || '-'}</div>
                  <div><strong>Alternative Phone:</strong> {viewingProfile.employee.reference_alt_phone || '-'}</div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="grid grid-cols-2 gap-3 leading-relaxed">
                  <div><strong>Employee Code:</strong> {viewingProfile.employee.employee_code}</div>
                  <div><strong>Assigned Bus:</strong> {viewingProfile.employee.bus_number || 'None'}</div>
                  <div><strong>Joining Date:</strong> {viewingProfile.employee.joining_date}</div>
                  <div><strong>Employment Status:</strong> <Badge status={viewingProfile.employee.employment_status} /></div>
                  <div className="col-span-2"><strong>Internal Remarks:</strong> {viewingProfile.employee.internal_remarks || 'None'}</div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Biodata Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Employee: ${editingEmployee?.full_name}`}
        subtitle="Update verified personal, banking, or contact information"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={editFormData.date_of_birth}
                onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
              <select
                value={editFormData.employment_status}
                onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={editFormData.joining_date}
                onChange={(e) => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {editingEmployee?.role === 'Driver' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence Number</label>
                <input
                  type="text"
                  value={editFormData.licence_number}
                  onChange={(e) => setEditFormData({ ...editFormData, licence_number: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Licence Validity Date</label>
                <input
                  type="date"
                  value={editFormData.licence_validity_date}
                  onChange={(e) => setEditFormData({ ...editFormData, licence_validity_date: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-blue-700"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm"
            >
              Update Biodata
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
