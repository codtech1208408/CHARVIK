import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ArrowLeft,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { Employee } from '../types';
import { Badge } from '../components/common/Badge';
import { StatusToggle } from '../components/common/StatusToggle';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { PrintButton } from '../components/common/PrintButton';
import { useAuth } from '../context/AuthContext';
import { ALL_MODULE_CATEGORIES, ALL_CATEGORY_NAMES } from '../constants/moduleCategories';
import { formatEmployeeId } from '../utils/employeeCode';

export const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase().includes('admin');
  const isOperatorDashboard = location.pathname.startsWith('/operator') || location.pathname.startsWith('/supporter') || !isAdmin;

  // Main Page View Mode: Biodata Directory vs Staff Login Accounts
  const [pageView, setPageView] = useState<'biodata' | 'staff-accounts'>(
    isOperatorDashboard ? 'staff-accounts' : 'biodata'
  );

  // Staff Login Credentials State
  const [staffCredentials, setStaffCredentials] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showResetStaffModal, setShowResetStaffModal] = useState(false);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Category Permissions Editing State
  const [showEditCategoriesModal, setShowEditCategoriesModal] = useState(false);
  const [selectedStaffForCategories, setSelectedStaffForCategories] = useState<any>(null);
  const [editingCategoriesList, setEditingCategoriesList] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  // New Staff Account Form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Captain' | 'Manager' | 'Support Staff'>(
    isOperatorDashboard ? 'Captain' : 'Support Staff'
  );
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffCategories, setNewStaffCategories] = useState<string[]>(ALL_CATEGORY_NAMES);

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
    employment_type: 'Permanent',
    salary: '',
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
    licence_verification_status: 'Verified',
    licence_verification_doc: ''
  });

  useEffect(() => {
    loadEmployees();
    loadStaffCredentials();
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

      // In Admin Panel: Show Admin Manager AND any user-created Operator accounts
      // In Operator Dashboard: Show Captain and Manager employee accounts
      const filtered = isOperatorDashboard
        ? (list || []).filter((s: any) => s.role === 'Captain' || s.role === 'Manager')
        : (list || []).filter((s: any) => s.role === 'Super Admin' || s.role === 'Admin' || s.role === 'Support Staff' || s.role === 'Operator');

      const mapped = filtered.map((s: any) => ({
        ...s,
        name: s.name === 'Fleet Captain' ? 'Employee' : s.name === 'Support Staff Member' ? 'Operator' : s.name,
        categories: (s.role === 'Super Admin' || s.role === 'Admin')
          ? ALL_CATEGORY_NAMES
          : (Array.isArray(s.categories) ? s.categories : [])
      }));
      setStaffCredentials(mapped);
    } catch (err: any) {
      error(err.message || 'Failed to load staff accounts');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      error('Full Name is required');
      return;
    }
    const identifier = (newStaffUsername || newStaffMobile || '').trim();
    if (!identifier) {
      error('Username / Email is required');
      return;
    }
    if (!newStaffPassword || newStaffPassword.length < 4) {
      error('Password must be at least 4 characters');
      return;
    }
    if (newStaffCategories.length === 0) {
      error('Please select at least one dashboard category for this account');
      return;
    }

    setCreatingStaff(true);
    try {
      await api.createStaffCredential({
        name: newStaffName.trim(),
        email_or_username: identifier,
        phone_number: newStaffMobile.trim() || (/^\d{10}$/.test(identifier) ? identifier : undefined),
        password: newStaffPassword,
        role: newStaffRole,
        categories: newStaffCategories
      });
      const accountTypeName =
        newStaffRole === 'Captain'
          ? 'Captain (Employee)'
          : newStaffRole === 'Manager'
          ? 'Manager (Employee)'
          : 'Operator';
      success(`${accountTypeName} account created successfully! Login using ${identifier}`);
      setShowCreateStaffModal(false);
      setNewStaffName('');
      setNewStaffMobile('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffCategories(ALL_CATEGORY_NAMES);
      loadStaffCredentials();
    } catch (err: any) {
      error(err.message || 'Failed to create account');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleOpenEditCategories = (staff: any) => {
    setSelectedStaffForCategories(staff);
    const assigned = Array.isArray(staff.categories) && staff.categories.length > 0
      ? staff.categories
      : ALL_CATEGORY_NAMES;
    setEditingCategoriesList([...assigned]);
    setShowEditCategoriesModal(true);
  };

  const handleSaveCategories = async () => {
    if (!selectedStaffForCategories) return;
    try {
      setSavingCategories(true);
      await api.updateStaffCategories(selectedStaffForCategories.id, editingCategoriesList);
      success(`Updated dashboard categories for ${selectedStaffForCategories.name}`);
      setShowEditCategoriesModal(false);
      setSelectedStaffForCategories(null);
      loadStaffCredentials();
    } catch (err: any) {
      error(err.message || 'Failed to update categories');
    } finally {
      setSavingCategories(false);
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
        employment_type: e.employment_type || 'Permanent',
        salary: e.salary !== undefined && e.salary !== null ? String(e.salary) : '',
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
        licence_verification_status: d.licence_verification_status || 'Verified',
        licence_verification_doc: d.licence_verification_doc || ''
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

  const filteredEmployees = (employees || []).filter((e) => {
    if (!e) return false;
    const s = searchTerm.trim().toLowerCase();
    if (!s) return true;
    return (
      (e.full_name || '').toLowerCase().includes(s) ||
      (e.employee_code || '').toLowerCase().includes(s) ||
      (e.phone_number || '').includes(s)
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

        <button
          onClick={() => setPageView('staff-accounts')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            pageView === 'staff-accounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{isOperatorDashboard ? 'Employee Registration' : 'Operator Accounts'}</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
            {staffCredentials.length}
          </span>
        </button>
      </div>

      {pageView === 'biodata' ? (
        <>
      {/* Header with Luxury Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Employee & Transport Staff
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {employees.length} Crew Members
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Centralized directory for Drivers, Helpers, and Captains with verified identity and duty records.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Banner Photo & Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet3.jpg"
                alt="Crew Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Staff Operations</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isOperatorDashboard && (
              <button
                onClick={() => {
                  setPageView('staff-accounts');
                  setNewStaffRole('Captain');
                  setNewStaffCategories([...ALL_CATEGORY_NAMES]);
                  setShowCreateStaffModal(true);
                }}
                className="inline-flex items-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-800" />
                <span>Create New Employee</span>
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate('/admin/drivers/new')}
                  className="inline-flex items-center px-3.5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-black rounded-xl transition-all shadow-md gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-blue-800" />
                  <span>New Driver</span>
                </button>
                <button
                  onClick={() => navigate('/admin/support-staff/new')}
                  className="inline-flex items-center px-3.5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold rounded-xl transition-all shadow-xs gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>New Helper</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
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

        {/* Search Input & Print */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, employee id, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
            />
          </div>
          <PrintButton
            title={`Staff Biodata Directory (${roleFilter === 'All' ? 'All Roles' : roleFilter})`}
            subtitle={`Total: ${filteredEmployees.length} Employees`}
            targetId="employees-directory-table-wrap"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div id="employees-directory-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-xs border-b border-blue-900/30">
              <tr>
                <th className="py-2.5 px-3 w-14 text-center">S.NO</th>
                <th className="py-2.5 px-3 min-w-[125px]">EMPLOYEE ID</th>
                <th className="py-2.5 px-3 min-w-[160px]">Employee Name</th>
                <th className="py-2.5 px-3 min-w-[90px]">Role</th>
                <th className="py-2.5 px-3 min-w-[100px]">Worker Type & Salary</th>
                <th className="py-2.5 px-3 min-w-[110px]">Phone Number</th>
                <th className="py-2.5 px-3 min-w-[100px]">Joining Date</th>
                <th className="py-2.5 px-3 min-w-[110px]">Licence Validity</th>
                <th className="py-2.5 px-3 min-w-[90px]">Status</th>
                <th className="py-2.5 px-3 text-center min-w-[95px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading employee records...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e, index) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 tracking-wide">{formatEmployeeId(e.employee_code, e.role)}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                          {e.full_name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900 text-[13px]">{e.full_name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-100 text-slate-800">
                        {e.role}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold w-fit ${
                          e.employment_type === 'Temporary'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : e.employment_type === 'Salary Based'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {e.employment_type === 'Temporary' ? 'Temporary' : e.employment_type === 'Salary Based' ? 'Salary Based' : 'Permanent'}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {e.salary ? `₹${Number(e.salary).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-medium">{e.phone_number}</td>
                    <td className="py-2 px-3 text-slate-500">{e.joining_date || '-'}</td>
                    <td className="py-2 px-3">
                      {e.licence_validity_date ? (
                        <span className="font-semibold text-slate-800 font-mono">
                          {e.licence_validity_date}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge status={e.employment_status} />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenProfile(e)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Open Full Biodata Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Employee Biodata"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* Admin only: Delete / Archive Employee */}
                        {isAdmin && (
                          <button
                            onClick={() => handleArchive(e)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                <span>{isOperatorDashboard ? 'Employee Registration' : 'Operator Accounts & Access Control'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOperatorDashboard
                  ? 'Register new employees (Captain & Manager) and assign visible dashboard categories with live admin synchronization.'
                  : 'Provision Operator logins and assign permitted dashboard categories. Operators create Captain and Manager accounts in their Operator Dashboard.'}
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
                onClick={() => {
                  setNewStaffRole(isOperatorDashboard ? 'Captain' : 'Support Staff');
                  setNewStaffCategories([...ALL_CATEGORY_NAMES]);
                  setShowCreateStaffModal(true);
                }}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm gap-2 cursor-pointer ml-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isOperatorDashboard ? 'Create New Employee' : 'Create Operator Account'}</span>
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
                <h4 className="text-xs font-bold text-blue-900">Admin Synchronization</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  All categories and data changes created by Admin are immediately visible to Operators and Employees in real-time.
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-900">{isOperatorDashboard ? 'Captain & Manager Logins' : 'Operator Hierarchy'}</h4>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  {isOperatorDashboard
                    ? 'Employees log in via Username/Email + Password. Only categories chosen during creation appear on their dashboard.'
                    : 'Admin creates Operator accounts. Once logged into the Operator Dashboard, Operators register Captain and Manager employee accounts.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Operator Dashboard</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Operators can register employees, manage trips, vehicle maintenance, and access permitted admin modules.
                </p>
              </div>
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div id="staff-accounts-table-wrap" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{isOperatorDashboard ? 'Active Employee Accounts' : 'Active Operator & Staff Accounts'}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Total: {staffCredentials.length}</span>
                <PrintButton
                  title="Staff Login Accounts & Access Directory"
                  subtitle={`Total Accounts: ${staffCredentials.length}`}
                  targetId="staff-accounts-table-wrap"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-2 px-3 w-12 text-center">S.NO</th>
                    <th className="py-2 px-3">Staff Member</th>
                    <th className="py-2 px-3">Login Identifier</th>
                    <th className="py-2 px-3">Permitted Categories</th>
                    <th className="py-2 px-3">Access Status</th>
                    <th className="py-2 px-3 text-center">Manage Access & Permissions</th>
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
                    staffCredentials.map((s, index) => {
                      const displayName = s.name === 'Fleet Captain' ? 'Employee' : s.name === 'Support Staff Member' ? 'Operator' : s.name;
                      const roleDisplay = s.role === 'Support Staff' ? 'Operator' : s.role;
                      const assignedCats = Array.isArray(s.categories) ? s.categories : [];
                      return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-500 text-center">{index + 1}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {displayName?.slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 block">{displayName}</span>
                                {(s.role === 'Super Admin' || s.role === 'Admin') && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                                    Super Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">{s.email || s.username || s.email_or_username}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <div className="font-mono text-slate-800 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg w-fit text-[11px]">
                            {s.username || s.email_or_username || s.phone_number || '—'}
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          {s.role === 'Super Admin' || s.role === 'Admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>All Modules (Full Access)</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategories(s)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Click to view or edit dashboard category permissions"
                            >
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>{assignedCats.length} / {ALL_MODULE_CATEGORIES.length} Categories</span>
                            </button>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <Badge status={s.status === 'Active' ? 'Active' : 'Inactive'} />
                        </td>

                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Manage Categories / Permissions */}
                            {s.role === 'Super Admin' || s.role === 'Admin' ? (
                              <span
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                                title="Super Admin has master access across all categories"
                              >
                                Full Access
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenEditCategories(s)}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                                title="Edit Dashboard Categories"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Categories</span>
                              </button>
                            )}

                            {/* Toggle Enable/Disable Access Button */}
                            {s.role !== 'Super Admin' && (
                              <button
                                onClick={() => handleToggleStatus(s)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
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
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                              title="Reset Login Password"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Password</span>
                            </button>

                            {/* Delete/Revoke Button */}
                            {isAdmin && s.role !== 'Super Admin' && (
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
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Account / Create New Employee Modal */}
      <Modal
        isOpen={showCreateStaffModal}
        onClose={() => setShowCreateStaffModal(false)}
        title={isOperatorDashboard ? 'Create New Employee' : 'Create Operator Account'}
        subtitle={
          isOperatorDashboard
            ? 'Provision employee credentials (Captain or Manager) and assign visible categories for their dashboard'
            : 'Provision Operator credentials and assign accessible categories for their dashboard'
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {/* 1. First Role Option (Captain, Manager for Operator; Only Operator for Admin) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Select Role <span className="text-rose-500">*</span>
            </label>
            {isOperatorDashboard ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStaffRole('Captain')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newStaffRole === 'Captain'
                      ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs">Captain</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Fleet Captain account with trip duty & dashboard category access.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStaffRole('Manager')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newStaffRole === 'Manager'
                      ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs">Manager</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Operations Manager account with oversight over assigned categories.
                  </p>
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setNewStaffRole('Support Staff')}
                  className="w-full p-3 rounded-xl border border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-200 shadow-xs text-left cursor-default transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-900">Operator</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                      Admin Provisioned
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                    Support Staff Operator account. Once logged into the Operator Dashboard, Operators register Captain and Manager accounts.
                  </p>
                </button>
              </div>
            )}
          </div>

          {/* 2. Full Name Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Naidu"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* 3. Username / Email Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username / Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={isOperatorDashboard ? 'e.g. captain_ops or captain@charvik.com' : 'e.g. operator_ops or supporter@charvik.com'}
              value={newStaffUsername}
              onChange={(e) => setNewStaffUsername(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Optional Mobile for SMS or Direct Login */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number <span className="text-slate-400 font-normal">(Optional 10-digit phone)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={newStaffMobile}
              onChange={(e) => setNewStaffMobile(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* 4. Password Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={4}
              placeholder="Minimum 4 characters"
              value={newStaffPassword}
              onChange={(e) => setNewStaffPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
            />
          </div>

          {/* 5. Category Option (Single & Multiple Selection) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Dashboard Categories (Admin Modules){' '}
                  <span className="text-blue-600 font-extrabold">
                    ({newStaffCategories.length} of {ALL_MODULE_CATEGORIES.length} selected)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Select which categories will be visible to this employee in their dashboard.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewStaffCategories([...ALL_CATEGORY_NAMES])}
                  className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setNewStaffCategories([])}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              {ALL_MODULE_CATEGORIES.map((cat) => {
                const isChecked = newStaffCategories.includes(cat.name);
                const CatIcon = cat.icon;
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewStaffCategories([...newStaffCategories, cat.name]);
                        } else {
                          setNewStaffCategories(newStaffCategories.filter((c) => c !== cat.name));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <CatIcon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate flex-1">{cat.name}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              All data created or edited in these categories is synced live with the Admin panel.
            </p>
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
              {creatingStaff ? 'Creating...' : isOperatorDashboard ? 'Create Employee Account' : 'Create Operator Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Permissions Modal */}
      <Modal
        isOpen={showEditCategoriesModal}
        onClose={() => setShowEditCategoriesModal(false)}
        title="Manage Dashboard Category Permissions"
        subtitle={selectedStaffForCategories ? `Select which categories are visible to ${selectedStaffForCategories.name} (${selectedStaffForCategories.role})` : ''}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Selected:{' '}
              <strong className="text-blue-700 font-bold">
                {editingCategoriesList.length} of {ALL_MODULE_CATEGORIES.length} Categories
              </strong>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingCategoriesList([...ALL_CATEGORY_NAMES])}
                className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setEditingCategoriesList([])}
                className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            {ALL_MODULE_CATEGORIES.map((cat) => {
              const isChecked = editingCategoriesList.includes(cat.name);
              const CatIcon = cat.icon;
              return (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditingCategoriesList([...editingCategoriesList, cat.name]);
                      } else {
                        setEditingCategoriesList(editingCategoriesList.filter((c) => c !== cat.name));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <CatIcon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate flex-1">{cat.name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditCategoriesModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCategories}
              disabled={savingCategories}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {savingCategories ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
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
          title={`Biodata Profile: ${viewingProfile.employee.full_name} (${formatEmployeeId(viewingProfile.employee.employee_code, viewingProfile.employee.role)})`}
          subtitle={`${viewingProfile.employee.role} • Status: ${viewingProfile.employee.employment_status}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Print Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
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
                    {formatEmployeeId(viewingProfile.employee.employee_code, viewingProfile.employee.role)} • {viewingProfile.employee.role}
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
                  onClick={() => {
                    setViewTab('sheet');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex border-b border-slate-200 gap-2 pb-1 text-xs no-print">
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
              <div className="border-2 border-black overflow-hidden font-sans text-xs bg-white printable-sheet">
                {/* Official Charvik Letterhead Header */}
                <div className="bg-white border-b-2 border-black">
                  <img
                    src="/charvik-letterhead-header.png"
                    alt="CHARVIK STAFFING CONSULTANCY"
                    className="w-full h-auto block"
                  />
                  <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700 font-bold">
                    <div>
                      {viewingProfile.employee.role === 'Driver'
                        ? 'DRIVER FLEET STAFFING VERIFICATION RECORD'
                        : 'CREW & STAFF FLEET VERIFICATION RECORD'}
                    </div>
                    <div className="text-right text-[10px]">
                      <span>Employee ID: <strong className="font-mono text-blue-700">{formatEmployeeId(viewingProfile.employee.employee_code, viewingProfile.employee.role)}</strong></span>
                      <span className="mx-1.5 text-slate-400">|</span>
                      <span>Role: <strong>{viewingProfile.employee.role}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Yellow Header */}
                <div className="bg-[#FFFF00] text-black font-black text-center py-2 text-sm uppercase tracking-wider border-b-2 border-black">
                  {viewingProfile.employee.role === 'Driver' ? 'Biodata Driver' : 'Biodata helper & Captains'}
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody className="divide-y divide-black">
                    {/* Gender */}
                    <tr className="hover:bg-slate-50">
                      <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                      <td className="w-1/2 p-2.5">{viewingProfile.employee.gender || 'Male'}</td>
                    </tr>

                    {/* Name (As per Aadhaar) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                      <td className="p-2.5 font-bold text-slate-900">{viewingProfile.employee.full_name || '-'}</td>
                    </tr>

                    {/* DOB */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.date_of_birth || '-'}</td>
                    </tr>

                    {/* E MAIL */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                      <td className="p-2.5">{viewingProfile.employee.email || '-'}</td>
                    </tr>

                    {/* Phone Number * */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{viewingProfile.employee.phone_number || '-'}</td>
                    </tr>

                    {/* Alternative Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.alternative_phone_number || '-'}</td>
                    </tr>

                    {/* Aadhaar Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                      <td className="p-2.5 font-mono">{viewingProfile.employee.aadhaar_number || '-'}</td>
                    </tr>

                    {/* PAN Card Number */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                      <td className="p-2.5 font-mono uppercase">{viewingProfile.employee.pan_number || '-'}</td>
                    </tr>

                    {/* If Driver or Captain or Licence provided */}
                    {(viewingProfile.employee.role === 'Driver' || viewingProfile.driverDetail?.licence_number || viewingProfile.employee.licence_number) && (
                      <>
                        <tr className="bg-slate-100 font-black text-slate-800">
                          <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                            Driving Licence Details
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Licence Verification Status</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {viewingProfile.driverDetail?.licence_verification_status || 'Pending Verification'}
                            </span>
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
                        Bank Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                      <td className="p-2.5 font-bold">{viewingProfile.employee.bank_name || '-'}</td>
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

                    {/* Employment Details */}
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Employment & Salary Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Worker Type</td>
                      <td className="p-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          viewingProfile.employee.employment_type === 'Temporary'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : viewingProfile.employee.employment_type === 'Salary Based'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {viewingProfile.employee.employment_type === 'Temporary' ? 'Temporary Worker' : viewingProfile.employee.employment_type === 'Salary Based' ? 'Salary Based' : 'Permanent Worker'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">
                        {viewingProfile.employee.role === 'Captain'
                          ? viewingProfile.employee.employment_type === 'Temporary'
                            ? 'Temporary Monthly Salary'
                            : viewingProfile.employee.employment_type === 'Salary Based'
                            ? 'Salary Based Monthly Salary'
                            : 'Permanent Monthly Salary'
                          : viewingProfile.employee.employment_type === 'Temporary'
                            ? 'Temporary Worker (Per Day Salary)'
                            : viewingProfile.employee.employment_type === 'Salary Based'
                            ? 'Salary Based Worker (Monthly Salary)'
                            : 'Permanent Worker (Per Day Salary)'}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {viewingProfile.employee.salary ? `₹${Number(viewingProfile.employee.salary).toLocaleString('en-IN')}` : '₹0'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Assigned Bus</td>
                      <td className="p-2.5">{viewingProfile.employee.bus_number || 'None'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Joining Date</td>
                      <td className="p-2.5">{viewingProfile.employee.joining_date || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Employment Status</td>
                      <td className="p-2.5">{viewingProfile.employee.employment_status || 'Active'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Official Declaration */}
                <div className="border-t-2 border-black bg-slate-50/60 p-3 text-[11px] text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900">Declaration: </span>
                  <span>
                    I hereby declare that all the information and particulars provided in this biodata sheet are true, complete, and accurate to the best of my knowledge and belief.
                  </span>
                </div>

                {/* Signature Section */}
                <div className="border-t-2 border-black grid grid-cols-2 divide-x-2 divide-black bg-white">
                  {/* Left: Employee Signature */}
                  <div className="p-4 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Employee Signature</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Signature of {viewingProfile.employee.full_name}</p>
                    </div>
                    <div className="mt-10 pt-2 border-t border-dashed border-slate-500 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Sign: ___________________</span>
                      <span>Date: ____________</span>
                    </div>
                  </div>

                  {/* Right: Authorized Signatory */}
                  <div className="p-4 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authorized Signatory & Seal</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Charvik Staffing Consultancy</p>
                    </div>
                    <div className="mt-10 pt-2 border-t border-dashed border-slate-500 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Sign & Seal: _____________</span>
                      <span>Date: ____________</span>
                    </div>
                  </div>
                </div>

                {/* Official Charvik Letterhead Footer */}
                <div className="w-full border-t-2 border-black bg-white">
                  <img
                    src="/charvik-letterhead-footer.png"
                    alt="Charvik Footer"
                    className="w-full h-auto block"
                  />
                </div>
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
                        {viewingProfile.employee.aadhaar_back_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Aadhaar Card Back',
                                url: viewingProfile.employee.aadhaar_back_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Aadhaar Back</span>
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
                    <div className="space-y-3 leading-relaxed">
                      <div className="grid grid-cols-2 gap-3">
                        <div><strong>Licence Number:</strong> {viewingProfile.driverDetail.licence_number}</div>
                        <div><strong>Issuing State:</strong> {viewingProfile.driverDetail.issuing_state}</div>
                        <div><strong>Issued RTO:</strong> {viewingProfile.driverDetail.issuing_rto_office}</div>
                        <div><strong>Issue Date:</strong> {viewingProfile.driverDetail.licence_issue_date || '-'}</div>
                        <div><strong>Validity Date (TRANS):</strong> <span className="font-bold text-blue-700">{viewingProfile.driverDetail.licence_validity_date}</span></div>
                        <div><strong>Total Driving Experience:</strong> {viewingProfile.driverDetail.licence_experience_years} Years</div>
                        <div><strong>Verification Status:</strong> <Badge status={viewingProfile.driverDetail.licence_verification_status} /></div>
                        <div className="col-span-2"><strong>Background Check:</strong> {viewingProfile.driverDetail.criminal_background_details || 'Clean'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {viewingProfile.driverDetail.licence_front_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Driving Licence Front',
                                url: viewingProfile.driverDetail.licence_front_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View DL Front</span>
                          </button>
                        )}
                        {viewingProfile.driverDetail.licence_back_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Driving Licence Back',
                                url: viewingProfile.driverDetail.licence_back_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View DL Back</span>
                          </button>
                        )}
                        {viewingProfile.driverDetail.licence_verification_doc && (
                          <button
                            onClick={() =>
                              setViewingDocModal({
                                title: 'Licence Verification Proof Photo',
                                url: viewingProfile.driverDetail.licence_verification_doc
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-700 font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Verification Photo</span>
                          </button>
                        )}
                      </div>
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
                      <div>
                        <strong>Worker Type:</strong>{' '}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          viewingProfile.employee.employment_type === 'Temporary'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : viewingProfile.employee.employment_type === 'Salary Based'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {viewingProfile.employee.employment_type === 'Temporary' ? 'Temporary Worker' : viewingProfile.employee.employment_type === 'Salary Based' ? 'Salary Based' : 'Permanent Worker'}
                        </span>
                      </div>
                      <div>
                        <strong>Salary / Wage:</strong>{' '}
                        <span className="font-bold text-slate-900">
                          {viewingProfile.employee.salary ? `₹${Number(viewingProfile.employee.salary).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                      <div><strong>Employee ID:</strong> {formatEmployeeId(viewingProfile.employee.employee_code, viewingProfile.employee.role)}</div>
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

          {/* TAB 3: Driving Licence */}
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Licence Verification Status</label>
                    <select
                      value={editFormData.licence_verification_status}
                      onChange={(e) => setEditFormData({ ...editFormData, licence_verification_status: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-medium"
                    >
                      <option value="Verified (Official Sarathi Portal)">Verified (Official Sarathi Portal)</option>
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Not Verified">Not Verified</option>
                    </select>
                  </div>
                </div>

                {/* DL Front, DL Back, and Licence Verification Photo Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence (Front Side)</label>
                    <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.licence_front_doc ? 'Front Uploaded ✓' : 'Upload DL Front'}</span>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence (Back Side)</label>
                    <label className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.licence_back_doc ? 'Back Uploaded ✓' : 'Upload DL Back'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEditFile('licence_back_doc', f);
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#142B4A] mb-1">Photo to Verify Licence</label>
                    <label className="w-full px-3 py-2 rounded-lg bg-blue-50 border border-blue-300 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer flex items-center gap-1.5 justify-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editFormData.licence_verification_doc ? 'Photo Uploaded ✓' : 'Upload Verification Photo'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEditFile('licence_verification_doc', f);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Worker Type (Employment Category) *
                    </label>
                    <select
                      value={editFormData.employment_type || 'Permanent'}
                      onChange={(e) => setEditFormData({ ...editFormData, employment_type: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-blue-900 outline-none"
                    >
                      <option value="Permanent">Permanent Worker</option>
                      <option value="Temporary">Temporary Worker</option>
                      <option value="Salary Based">Salary Based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {editingEmployee?.role === 'Captain'
                        ? editFormData.employment_type === 'Temporary'
                          ? 'Temporary Monthly Salary (₹) *'
                          : editFormData.employment_type === 'Salary Based'
                          ? 'Salary Based Monthly Salary (₹) *'
                          : 'Permanent Monthly Salary (₹) *'
                        : editFormData.employment_type === 'Temporary'
                          ? 'Temporary Worker (Per Day Salary) (₹) *'
                          : editFormData.employment_type === 'Salary Based'
                          ? 'Salary Based Worker (Monthly Salary) (₹) *'
                          : 'Permanent Worker (Per Day Salary) (₹) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editFormData.salary !== undefined ? editFormData.salary : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                        placeholder={
                          editingEmployee?.role === 'Captain' || editFormData.employment_type === 'Salary Based'
                            ? 'Enter monthly salary amount (₹)'
                            : 'Enter per day salary amount (₹)'
                        }
                        className="w-full text-xs pl-7 pr-3 p-2.5 rounded-xl border border-blue-300 bg-white font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {/* Status Selection (Active / Inactive pills) */}
                <StatusToggle
                  label="Employment Status"
                  value={editFormData.employment_status || 'Active'}
                  onChange={(val) => setEditFormData({ ...editFormData, employment_status: val })}
                />

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
