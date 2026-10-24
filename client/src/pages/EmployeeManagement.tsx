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
  CheckCircle2,
  Key,
  Lock,
  Phone,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  Upload,
  ExternalLink,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import type { Employee } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  // Main Page View Mode: Biodata Directory vs Staff Login Accounts
  const [pageView, setPageView] = useState<'biodata' | 'staff-accounts'>('biodata');

  // Staff Login Credentials State
  const [staffCredentials, setStaffCredentials] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showResetStaffModal, setShowResetStaffModal] = useState(false);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);

  // New Staff Account Form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Support Staff' | 'Captain'>('Captain');
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  // Modals & Views
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'sheet' | 'sections'>('sheet');
  const [activeTab, setActiveTab] = useState<'personal' | 'identity' | 'licence' | 'bank' | 'nominee' | 'references' | 'employment'>('personal');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<'personal' | 'identity' | 'licence' | 'bank' | 'nominee' | 'references' | 'employment'>('personal');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingDocModal, setViewingDocModal] = useState<{ title: string; url: string } | null>(null);
  const [buses, setBuses] = useState<any[]>([]);

  // Edit Form State (complete Biodata fields matching image.png)
  const [editFormData, setEditFormData] = useState({
    profile_photo: '',
    full_name: '',
    gender: 'Male',
    date_of_birth: '',
    email: '',
    phone_number: '',
    alternative_phone_number: '',
    aadhaar_number: '',
    aadhaar_front_doc: '',
    aadhaar_back_doc: '',
    pan_number: '',
    pan_doc: '',
    bank_name: '',
    bank_proof_doc: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',
    nominee_name: '',
    nominee_relationship: '',
    nominee_phone: '',
    nominee_age: '',
    nominee_aadhaar: '',
    reference_name: '',
    reference_phone: '',
    reference_alt_phone: '',
    joining_date: '',
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: '',
    licence_number: '',
    licence_front_doc: '',
    licence_back_doc: '',
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
    api.getBuses().then(setBuses).catch(() => {});
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    if (pageView === 'staff-accounts') {
      loadStaffCredentials();
    }
  }, [pageView]);

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

  const loadStaffCredentials = async () => {
    try {
      setLoadingStaff(true);
      const list = await api.getStaffCredentials();
      setStaffCredentials(list);
    } catch (err: any) {
      error(err.message || 'Failed to load staff accounts');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) {
      error('Staff name is required');
      return;
    }
    const identifier = newStaffRole === 'Captain' ? newStaffMobile : newStaffUsername;
    if (!identifier) {
      error(newStaffRole === 'Captain' ? 'Mobile number is required for Captain login' : 'Username/email is required for Support login');
      return;
    }
    if (!newStaffPassword || newStaffPassword.length < 4) {
      error('Password must be at least 4 characters');
      return;
    }

    setCreatingStaff(true);
    try {
      await api.createStaffCredential({
        name: newStaffName,
        email_or_username: identifier,
        phone_number: newStaffMobile || undefined,
        password: newStaffPassword,
        role: newStaffRole
      });
      success(`${newStaffRole} account created successfully! Login using ${identifier}`);
      setShowCreateStaffModal(false);
      setNewStaffName('');
      setNewStaffMobile('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      loadStaffCredentials();
    } catch (err: any) {
      error(err.message || 'Failed to create account');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForReset || !resetPasswordVal) return;
    try {
      await api.resetStaffPassword(selectedStaffForReset.id, resetPasswordVal);
      success(`Password reset successfully for ${selectedStaffForReset.name}`);
      setShowResetStaffModal(false);
      setSelectedStaffForReset(null);
      setResetPasswordVal('');
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (staff: any) => {
    const nextStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.toggleStaffCredentialStatus(staff.id, nextStatus);
      success(`Access for ${staff.name} is now ${nextStatus === 'Active' ? 'Enabled (Active)' : 'Disabled (Inactive)'}`);
      loadStaffCredentials();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteStaff = async (staff: any) => {
    if (staff.role === 'Super Admin') {
      error('Super Admin account cannot be deleted');
      return;
    }
    if (!window.confirm(`Revoke and delete login account for ${staff.name}?`)) return;
    try {
      await api.deleteStaffCredential(staff.id);
      success('Staff account revoked');
      loadStaffCredentials();
    } catch (err: any) {
      error(err.message || 'Failed to delete account');
    }
  };

  const handleOpenProfile = async (emp: Employee) => {
    try {
      const details = await api.getEmployee(emp.id);
      setViewingProfile(details);
      setViewTab('sheet');
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
        profile_photo: e.profile_photo || '',
        full_name: e.full_name,
        gender: e.gender || 'Male',
        date_of_birth: e.date_of_birth || '',
        email: e.email || '',
        phone_number: e.phone_number,
        alternative_phone_number: e.alternative_phone_number || '',
        aadhaar_number: e.aadhaar_number || '',
        aadhaar_front_doc: e.aadhaar_front_doc || '',
        aadhaar_back_doc: e.aadhaar_back_doc || '',
        pan_number: e.pan_number || '',
        pan_doc: e.pan_doc || '',
        bank_name: e.bank_name || '',
        bank_proof_doc: e.bank_proof_doc || '',
        account_holder_name: e.account_holder_name || '',
        account_number: e.account_number || '',
        ifsc_code: e.ifsc_code || '',
        branch: e.branch || '',
        nominee_name: e.nominee_name || '',
        nominee_relationship: e.nominee_relationship || '',
        nominee_phone: e.nominee_phone || '',
        nominee_age: e.nominee_age ? String(e.nominee_age) : '',
        nominee_aadhaar: e.nominee_aadhaar || '',
        reference_name: e.reference_name || '',
        reference_phone: e.reference_phone || '',
        reference_alt_phone: e.reference_alt_phone || '',
        joining_date: e.joining_date || '',
        employment_status: e.employment_status || 'Active',
        assigned_bus_id: e.assigned_bus_id ? String(e.assigned_bus_id) : '',
        internal_remarks: e.internal_remarks || '',
        licence_number: d.licence_number || '',
        licence_front_doc: d.licence_front_doc || '',
        licence_back_doc: d.licence_back_doc || '',
        issuing_state: d.issuing_state || '',
        issuing_rto_office: d.issuing_rto_office || '',
        licence_issue_date: d.licence_issue_date || '',
        licence_validity_date: d.licence_validity_date || '',
        licence_experience_years: d.licence_experience_years || 0,
        criminal_background_details: d.criminal_background_details || '',
        licence_verification_status: d.licence_verification_status || 'Verified'
      });
      setEditTab('personal');
      setIsEditOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load employee for editing');
    }
  };

  const handleUploadEditFile = async (field: string, file: File) => {
    try {
      const res = await api.uploadFile(file);
      setEditFormData((prev) => ({ ...prev, [field]: res.fileUrl }));
      success('File uploaded successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload document');
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
      {/* Top View Mode Switcher (Staff Directory vs Staff Accounts) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setPageView('biodata')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            pageView === 'biodata'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Biodata Directory</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
            {employees.length}
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setPageView('staff-accounts')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              pageView === 'staff-accounts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Staff Login Accounts & Access Control</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {staffCredentials.length}
            </span>
          </button>
        )}
      </div>

      {pageView === 'biodata' ? (
        <>
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
                        {/* Admin only: Delete / Archive Employee */}
                        {isAdmin && (
                          <button
                            onClick={() => handleArchive(e)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archive Employee Record"
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
      </>
      ) : (
        /* Staff Login Accounts & Access Control Tab */
        <div className="space-y-6">
          {/* Header & Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Staff Login Credentials & Role-Based Access Control</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin controls for Support user logins and Captain mobile-number logins. Create accounts, reset passwords, and enable/disable access.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPageView('biodata')}
                className="inline-flex items-center px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm gap-1.5 cursor-pointer border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Back to Directory</span>
              </button>
              <button
                onClick={() => setShowCreateStaffModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </button>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-900">Admin Account</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Full system control across Fleet, Staff, Settings, Accounts, and Master deletions.
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-900">Captain Logins (Mobile)</h4>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Captains log in with their registered 10-digit mobile number + password on mobile dashboard.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Support Staff</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Access KM entry, maintenance, and complaints without permission to delete records or alter settings.
                </p>
              </div>
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Active Staff User Accounts</h3>
              <span className="text-xs text-slate-400">Total: {staffCredentials.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Login Identifier</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-center">Manage Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStaff ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
                        <p>Loading staff credentials...</p>
                      </td>
                    </tr>
                  ) : staffCredentials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No staff accounts created yet.
                      </td>
                    </tr>
                  ) : (
                    staffCredentials.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {s.name?.slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{s.name}</span>
                              <span className="text-[11px] text-slate-400">{s.email || s.username}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            s.role === 'Super Admin'
                              ? 'bg-rose-100 text-rose-700'
                              : s.role === 'Captain'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {s.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {s.role === 'Captain' ? (
                            <div className="flex items-center gap-1.5 font-mono text-purple-900 font-bold bg-purple-50 px-2.5 py-1 rounded-lg w-fit border border-purple-200/60">
                              <Phone className="w-3.5 h-3.5 text-purple-600" />
                              <span>{s.phone_number || s.username}</span>
                              <span className="text-[10px] text-purple-500 font-normal ml-1">(Mobile Login)</span>
                            </div>
                          ) : (
                            <div className="font-mono text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                              {s.username}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {s.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3" />
                              <span>Active (Enabled)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                              <X className="w-3 h-3" />
                              <span>Disabled (No Access)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Toggle Enable/Disable Access Button */}
                            {s.role !== 'Super Admin' && (
                              <button
                                onClick={() => handleToggleStatus(s)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                  s.status === 'Active'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={s.status === 'Active' ? 'Disable Account Access' : 'Enable Account Access'}
                              >
                                {s.status === 'Active' ? (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Disable</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Enable</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Reset Password Button */}
                            <button
                              onClick={() => {
                                setSelectedStaffForReset(s);
                                setResetPasswordVal('');
                                setShowResetStaffModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                              title="Reset Login Password"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Reset Password</span>
                            </button>

                            {/* Delete/Revoke Button */}
                            {s.role !== 'Super Admin' && (
                              <button
                                onClick={() => handleDeleteStaff(s)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Revoke Account"
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
        </div>
      )}

      {/* Create Staff Account Modal */}
      <Modal
        isOpen={showCreateStaffModal}
        onClose={() => setShowCreateStaffModal(false)}
        title="Create Staff Login Account"
        subtitle="Provision a role-based account with password login for Support or Captain"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStaffRole('Captain')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  newStaffRole === 'Captain'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-900 ring-2 ring-purple-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs">Captain</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Logs in via Mobile Number + Password. Mobile dashboard view.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNewStaffRole('Support Staff')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  newStaffRole === 'Support Staff'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs">Support Staff</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Logs in via Username/Email + Password. Maintenance & KM entry.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Naidu"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
            />
          </div>

          {newStaffRole === 'Captain' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Captain Mobile Number <span className="text-purple-600 font-semibold">(Used for Login)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  pattern="[0-9]{10}"
                  value={newStaffMobile}
                  onChange={(e) => setNewStaffMobile(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-purple-500 font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Captain will use this 10-digit mobile number to log in.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username / Email</label>
              <input
                type="text"
                required
                placeholder="e.g. support.ramesh@charvik.com or ramesh_ops"
                value={newStaffUsername}
                onChange={(e) => setNewStaffUsername(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={newStaffPassword}
              onChange={(e) => setNewStaffPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingStaff}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {creatingStaff ? 'Creating...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetStaffModal}
        onClose={() => setShowResetStaffModal(false)}
        title="Reset Staff Password"
        subtitle={selectedStaffForReset ? `Assign a new secure password for ${selectedStaffForReset.name} (${selectedStaffForReset.role})` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-700">Account:</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedStaffForReset?.name}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Login ID: {selectedStaffForReset?.phone_number || selectedStaffForReset?.username}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Enter at least 6 characters"
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowResetStaffModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Save New Password
            </button>
          </div>
        </form>
      </Modal>

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
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {viewingProfile.employee.profile_photo ? (
                  <img
                    src={viewingProfile.employee.profile_photo}
                    alt={viewingProfile.employee.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg">
                    {viewingProfile.employee.full_name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{viewingProfile.employee.full_name}</h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    {viewingProfile.employee.employee_code} • {viewingProfile.employee.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenEdit(viewingProfile.employee);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Biodata</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex border-b border-slate-200 gap-2 pb-1 text-xs">
              <button
                onClick={() => setViewTab('sheet')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  viewTab === 'sheet' ? 'bg-[#142B4A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Official Biodata Sheet Format
              </button>
              <button
                onClick={() => setViewTab('sections')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  viewTab === 'sections' ? 'bg-[#142B4A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tabular Section Breakdown
              </button>
            </div>

            {/* MODE 1: Official Yellow-Header Table matching image.png */}
            {viewTab === 'sheet' && (
              <div className="border-2 border-black overflow-hidden font-sans text-xs bg-white">
                {/* Yellow Header */}
                <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
                  {viewingProfile.employee.role === 'Driver' ? 'Biodata Driver' : 'Biodata helper & Captains'}
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody className="divide-y divide-black">
                    {/* 1. Profile Photo */}
                    <tr className="hover:bg-slate-50">
                      <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Profile Photo</td>
                      <td className="w-1/2 p-2.5">
                        {viewingProfile.employee.profile_photo ? (
                          <div className="flex items-center space-x-3">
                            <img
                              src={viewingProfile.employee.profile_photo}
                              alt="Profile"
                              className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                            />
                            <button
                              onClick={() =>
                                setViewingDocModal({
                                  title: `${viewingProfile.employee.full_name} - Profile Photo`,
                                  url: viewingProfile.employee.profile_photo
                                })
                              }
                              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Full</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Photo Uploaded</span>
                        )}
                      </td>
                    </tr>

                    {/* 2. Gender */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                      <td className="p-2.5">{viewingProfile.employee.gender || 'Male'}</td>
                    </tr>

                    {/* 3. Name (As per Aadhaar) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                      <td className="p-2.5 font-bold text-slate-900">{viewingProfile.employee.full_name || '-'}</td>
                    </tr>

                    {/* 4. DOB */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.date_of_birth || '-'}</td>
                    </tr>

                    {/* 5. E MAIL */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                      <td className="p-2.5">{viewingProfile.employee.email || '-'}</td>
                    </tr>

                    {/* 6. Phone Number * */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{viewingProfile.employee.phone_number || '-'}</td>
                    </tr>

                    {/* 7. Alternative Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.alternative_phone_number || '-'}</td>
                    </tr>

                    {/* 8. Aadhaar Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.aadhaar_number || '-'}</td>
                    </tr>

                    {/* 9. Upload Photo File (Aadhaar front back ) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (Aadhaar front back )</td>
                      <td className="p-2.5">
                        {viewingProfile.employee.aadhaar_front_doc || viewingProfile.employee.aadhaar_back_doc ? (
                          <div className="flex items-center gap-2">
                            {viewingProfile.employee.aadhaar_front_doc && (
                              <button
                                onClick={() =>
                                  setViewingDocModal({
                                    title: 'Aadhaar Card (Front)',
                                    url: viewingProfile.employee.aadhaar_front_doc
                                  })
                                }
                                className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Aadhaar Front</span>
                              </button>
                            )}
                            {viewingProfile.employee.aadhaar_back_doc && (
                              <button
                                onClick={() =>
                                  setViewingDocModal({
                                    title: 'Aadhaar Card (Back)',
                                    url: viewingProfile.employee.aadhaar_back_doc
                                  })
                                }
                                className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Aadhaar Back</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>

                    {/* 10. PAN Card Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                      <td className="p-2.5 font-mono uppercase">{viewingProfile.employee.pan_number || '-'}</td>
                    </tr>

                    {/* 11. Upload Photo File (PAN Card) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (PAN Card)</td>
                      <td className="p-2.5">
                        {viewingProfile.employee.pan_doc ? (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'PAN Card Document',
                                url: viewingProfile.employee.pan_doc
                              })
                            }
                            className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View PAN Card</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>

                    {/* 12. If Driver: Driving Licence Details */}
                    {viewingProfile.employee.role === 'Driver' && (
                      <>
                        <tr className="bg-slate-100 font-black text-slate-800">
                          <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                            Driving Licence Details
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File (DL front back)</td>
                          <td className="p-2.5">
                            {viewingProfile.driverDetail?.licence_front_doc || viewingProfile.driverDetail?.licence_back_doc ? (
                              <div className="flex items-center gap-2">
                                {viewingProfile.driverDetail?.licence_front_doc && (
                                  <button
                                    onClick={() =>
                                      setViewingDocModal({
                                        title: 'Driving Licence (Front)',
                                        url: viewingProfile.driverDetail.licence_front_doc
                                      })
                                    }
                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>DL Front</span>
                                  </button>
                                )}
                                {viewingProfile.driverDetail?.licence_back_doc && (
                                  <button
                                    onClick={() =>
                                      setViewingDocModal({
                                        title: 'Driving Licence (Back)',
                                        url: viewingProfile.driverDetail.licence_back_doc
                                      })
                                    }
                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>DL Back</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not Uploaded</span>
                            )}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Driving Licence Number</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700 uppercase">
                            {viewingProfile.driverDetail?.licence_number || viewingProfile.employee.licence_number || '-'}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued By State</td>
                          <td className="p-2.5">{viewingProfile.driverDetail?.issuing_state || '-'}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued RTO Office</td>
                          <td className="p-2.5">{viewingProfile.driverDetail?.issuing_rto_office || '-'}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issue Date (TRANS)</td>
                          <td className="p-2.5 font-mono">{viewingProfile.driverDetail?.licence_issue_date || '-'}</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Validity Date (TRANS)2-Day Buffer</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">
                            {viewingProfile.driverDetail?.licence_validity_date || viewingProfile.employee.licence_validity_date || '-'}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Total Experience as Per Licence</td>
                          <td className="p-2.5">
                            {viewingProfile.driverDetail?.licence_experience_years != null
                              ? `${viewingProfile.driverDetail.licence_experience_years} Years`
                              : '-'}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Any Criminal Background As Per Licence</td>
                          <td className="p-2.5">{viewingProfile.driverDetail?.criminal_background_details || 'Clean Record / None'}</td>
                        </tr>
                      </>
                    )}

                    {/* Bank Details */}
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        {viewingProfile.employee.role === 'Driver' ? 'Bank Name' : 'Bank Name ( passbook cheque )'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                      <td className="p-2.5 font-bold">{viewingProfile.employee.bank_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">
                        {viewingProfile.employee.role === 'Driver'
                          ? 'Upload Photo File (passbook check )'
                          : 'Upload Photo File'}
                      </td>
                      <td className="p-2.5">
                        {viewingProfile.employee.bank_proof_doc ? (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Bank Passbook / Cheque Proof',
                                url: viewingProfile.employee.bank_proof_doc
                              })
                            }
                            className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Passbook/Cheque File</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Holder Name</td>
                      <td className="p-2.5">{viewingProfile.employee.account_holder_name || viewingProfile.employee.full_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.account_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">IFSC Code</td>
                      <td className="p-2.5 font-mono uppercase">{viewingProfile.employee.ifsc_code || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Branch</td>
                      <td className="p-2.5">{viewingProfile.employee.branch || '-'}</td>
                    </tr>

                    {/* Nominee Details (Beneficiary) */}
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Nominee Details (Beneficiary)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Nominee Name</td>
                      <td className="p-2.5">{viewingProfile.employee.nominee_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Relationship</td>
                      <td className="p-2.5">{viewingProfile.employee.nominee_relationship || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.nominee_phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Age</td>
                      <td className="p-2.5">{viewingProfile.employee.nominee_age ? `${viewingProfile.employee.nominee_age} Years` : '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Aadhaar Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.nominee_aadhaar || '-'}</td>
                    </tr>

                    {/* Reference Details */}
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Reference Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Name</td>
                      <td className="p-2.5">{viewingProfile.employee.reference_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.reference_phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.reference_alt_phone || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* MODE 2: Tabular Section Breakdown */}
            {viewTab === 'sections' && (
              <div className="space-y-3">
                <div className="flex border-b border-slate-200 space-x-2 text-xs pb-1 overflow-x-auto">
                  {[
                    { id: 'personal', label: 'Personal Information' },
                    { id: 'identity', label: 'Identity Documents' },
                    ...(viewingProfile.employee.role === 'Driver' ? [{ id: 'licence', label: 'Driving Licence' }] : []),
                    { id: 'bank', label: 'Bank Details' },
                    { id: 'nominee', label: 'Nominee' },
                    { id: 'references', label: 'References' },
                    { id: 'employment', label: 'Employment & Bus' }
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
                      <div className="flex flex-wrap gap-2 pt-2">
                        {viewingProfile.employee.aadhaar_front_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Aadhaar Card Front',
                                url: viewingProfile.employee.aadhaar_front_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Aadhaar Front</span>
                          </button>
                        )}
                        {viewingProfile.employee.pan_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'PAN Card Document',
                                url: viewingProfile.employee.pan_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PAN Card</span>
                          </button>
                        )}
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

                  {activeTab === 'nominee' && (
                    <div className="grid grid-cols-2 gap-3 leading-relaxed">
                      <div><strong>Nominee Name:</strong> {viewingProfile.employee.nominee_name || 'None provided'}</div>
                      <div><strong>Relationship:</strong> {viewingProfile.employee.nominee_relationship || '-'}</div>
                      <div><strong>Phone Number:</strong> {viewingProfile.employee.nominee_phone || '-'}</div>
                      <div><strong>Age:</strong> {viewingProfile.employee.nominee_age ? `${viewingProfile.employee.nominee_age} Years` : '-'}</div>
                      <div className="col-span-2"><strong>Aadhaar Number:</strong> {viewingProfile.employee.nominee_aadhaar || '-'}</div>
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
            )}
          </div>
        </Modal>
      )}

      {/* Edit Biodata Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${editingEmployee?.role} Biodata: ${editingEmployee?.full_name}`}
        subtitle="Update verified personal details, identity photos, licence, banking, and references"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Edit Tab Buttons */}
          <div className="flex border-b border-slate-200 gap-1 pb-1 text-xs overflow-x-auto">
            {[
              { id: 'personal', label: '1. Personal & Photo' },
              { id: 'identity', label: '2. Identity & Documents' },
              ...(editingEmployee?.role === 'Driver' ? [{ id: 'licence', label: '3. Driving Licence' }] : []),
              { id: 'bank', label: 'Bank Details' },
              { id: 'nominee', label: 'Nominee' },
              { id: 'references', label: 'References' },
              { id: 'employment', label: 'Employment' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditTab(t.id as any)}
                className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                  editTab === t.id ? 'bg-[#142B4A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Personal & Profile Photo */}
          {editTab === 'personal' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="relative">
                  {editFormData.profile_photo ? (
                    <img
                      src={editFormData.profile_photo}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] mt-1 font-semibold">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="block text-xs font-bold text-slate-800">Profile Photo</span>
                  <p className="text-[11px] text-slate-500">
                    Upload official passport-style profile photo (PNG, JPG, max 5MB).
                  </p>
                  <label className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadEditFile('profile_photo', file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Name (As per Aadhaar) *</label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DOB</label>
                  <input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E MAIL</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={editFormData.phone_number}
                    onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Number</label>
                  <input
                    type="tel"
                    value={editFormData.alternative_phone_number}
                    onChange={(e) => setEditFormData({ ...editFormData, alternative_phone_number: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Identity Documents */}
          {editTab === 'identity' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Aadhaar Card</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      value={editFormData.aadhaar_number}
                      onChange={(e) => setEditFormData({ ...editFormData, aadhaar_number: e.target.value })}
                      placeholder="12-digit Aadhaar Number"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Upload Photo File (Aadhaar front back )</label>
                    <div className="flex gap-2">
                      <label className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 flex-1 justify-center">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>{editFormData.aadhaar_front_doc ? 'Front Uploaded ✓' : 'Upload Front'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadEditFile('aadhaar_front_doc', f);
                          }}
                        />
                      </label>
                      <label className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 flex-1 justify-center">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>{editFormData.aadhaar_back_doc ? 'Back Uploaded ✓' : 'Upload Back'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadEditFile('aadhaar_back_doc', f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">PAN Card</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={editFormData.pan_number}
                      onChange={(e) => setEditFormData({ ...editFormData, pan_number: e.target.value.toUpperCase() })}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Upload Photo File (PAN Card)</label>
                    <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.pan_doc ? 'PAN Card Uploaded ✓' : 'Upload PAN Card'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEditFile('pan_doc', f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Driving Licence (Drivers only) */}
          {editTab === 'licence' && editingEmployee?.role === 'Driver' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Driving Licence Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence Number *</label>
                    <input
                      type="text"
                      value={editFormData.licence_number}
                      onChange={(e) => setEditFormData({ ...editFormData, licence_number: e.target.value.toUpperCase() })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono font-bold text-blue-700 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Upload Photo File (DL front back)</label>
                    <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.licence_front_doc ? 'DL File Uploaded ✓' : 'Upload DL Document'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEditFile('licence_front_doc', f);
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issued By State</label>
                    <input
                      type="text"
                      value={editFormData.issuing_state}
                      onChange={(e) => setEditFormData({ ...editFormData, issuing_state: e.target.value })}
                      placeholder="e.g. Telangana / AP"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issued RTO Office</label>
                    <input
                      type="text"
                      value={editFormData.issuing_rto_office}
                      onChange={(e) => setEditFormData({ ...editFormData, issuing_rto_office: e.target.value })}
                      placeholder="e.g. TS09 Hyderabad"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date (TRANS)</label>
                    <input
                      type="date"
                      value={editFormData.licence_issue_date}
                      onChange={(e) => setEditFormData({ ...editFormData, licence_issue_date: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Validity Date (TRANS)2-Day Buffer *</label>
                    <input
                      type="date"
                      value={editFormData.licence_validity_date}
                      onChange={(e) => setEditFormData({ ...editFormData, licence_validity_date: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Experience as Per Licence (Years)</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.licence_experience_years}
                      onChange={(e) => setEditFormData({ ...editFormData, licence_experience_years: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Any Criminal Background As Per Licence</label>
                    <input
                      type="text"
                      value={editFormData.criminal_background_details}
                      onChange={(e) => setEditFormData({ ...editFormData, criminal_background_details: e.target.value })}
                      placeholder="Clean / None recorded"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Bank Details */}
          {editTab === 'bank' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                  {editingEmployee?.role === 'Driver' ? 'Bank Name' : 'Bank Name ( passbook cheque )'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editFormData.bank_name}
                      onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {editingEmployee?.role === 'Driver' ? 'Upload Photo File (passbook check )' : 'Upload Photo File'}
                    </label>
                    <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.bank_proof_doc ? 'Passbook/Cheque Uploaded ✓' : 'Upload Passbook File'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEditFile('bank_proof_doc', f);
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={editFormData.account_holder_name}
                      onChange={(e) => setEditFormData({ ...editFormData, account_holder_name: e.target.value })}
                      placeholder="Name on bank passbook"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editFormData.account_number}
                      onChange={(e) => setEditFormData({ ...editFormData, account_number: e.target.value })}
                      placeholder="Bank account number"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editFormData.ifsc_code}
                      onChange={(e) => setEditFormData({ ...editFormData, ifsc_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      value={editFormData.branch}
                      onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                      placeholder="Branch location"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Nominee Details */}
          {editTab === 'nominee' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Nominee Details (Beneficiary)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nominee Full Name</label>
                    <input
                      type="text"
                      value={editFormData.nominee_name}
                      onChange={(e) => setEditFormData({ ...editFormData, nominee_name: e.target.value })}
                      placeholder="Nominee full name"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={editFormData.nominee_relationship}
                      onChange={(e) => setEditFormData({ ...editFormData, nominee_relationship: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option value="">Select Option</option>
                      <option value="Spouse">Spouse (Wife / Husband)</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.nominee_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, nominee_phone: e.target.value })}
                      placeholder="Nominee contact number"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={editFormData.nominee_age}
                      onChange={(e) => setEditFormData({ ...editFormData, nominee_age: e.target.value })}
                      placeholder="Nominee age"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      value={editFormData.nominee_aadhaar}
                      onChange={(e) => setEditFormData({ ...editFormData, nominee_aadhaar: e.target.value })}
                      placeholder="12-digit Aadhaar number"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Reference Details */}
          {editTab === 'references' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Reference Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editFormData.reference_name}
                      onChange={(e) => setEditFormData({ ...editFormData, reference_name: e.target.value })}
                      placeholder="Reference person name"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.reference_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, reference_phone: e.target.value })}
                      placeholder="Primary contact"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Number</label>
                    <input
                      type="tel"
                      value={editFormData.reference_alt_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, reference_alt_phone: e.target.value })}
                      placeholder="Secondary contact"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Employment & Bus Allocation */}
          {editTab === 'employment' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Employment & Bus Allocation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
                    <select
                      value={editFormData.employment_status}
                      onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Fleet Bus</label>
                    <select
                      value={editFormData.assigned_bus_id}
                      onChange={(e) => setEditFormData({ ...editFormData, assigned_bus_id: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option value="">-- No Bus Assigned --</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bus_number} ({b.registration_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={editFormData.joining_date}
                      onChange={(e) => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Internal Remarks</label>
                  <textarea
                    rows={2}
                    value={editFormData.internal_remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, internal_remarks: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Editing verified master biodata record
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Save Biodata Updates</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Document Inspector Modal */}
      {viewingDocModal && (
        <Modal
          isOpen={!!viewingDocModal}
          onClose={() => setViewingDocModal(null)}
          title={viewingDocModal.title}
          subtitle="Charvik Fleet Staff Verification Document"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 p-2 text-center">
            {viewingDocModal.url && (viewingDocModal.url.endsWith('.pdf') || viewingDocModal.url.includes('/docs/')) ? (
              <div className="p-8 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-400 mb-2" />
                <p className="font-bold text-slate-800 text-sm">{viewingDocModal.title}</p>
                <p className="text-xs text-slate-500 mt-1">PDF Document on record</p>
                <a
                  href={viewingDocModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Document in New Tab</span>
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={viewingDocModal.url}
                  alt={viewingDocModal.title}
                  className="max-h-[65vh] w-auto rounded-xl object-contain border border-slate-200 shadow-sm"
                />
                <a
                  href={viewingDocModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Full Resolution</span>
                </a>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingDocModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
