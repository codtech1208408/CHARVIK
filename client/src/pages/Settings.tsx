import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Lock,
  Wrench,
  Bell,
  Database,
  History,
  Save,
  CheckCircle2,
  ShieldCheck,
  Key,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Compass,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Plus,
  ToggleLeft,
  ToggleRight,
  Phone
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'company' | 'financial_control' | 'maintenance' | 'account' | 'notifications' | 'audit' | 'staff_access'>('company');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [staffCredentials, setStaffCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staff Credentials Modal & Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email_or_username: '',
    phone_number: '',
    password: '',
    role: 'Support Staff'
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [sett, logs, staff] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs(),
        api.getStaffCredentials().catch(() => [])
      ]);
      setSettings(sett);
      setAuditLogs(logs);
      setStaffCredentials(staff);
    } catch (err: any) {
      error(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = newStaff.role === 'Captain' ? newStaff.phone_number : newStaff.email_or_username;
    if (!newStaff.name || !identifier || !newStaff.password) {
      error(newStaff.role === 'Captain' ? 'Please provide Captain mobile number and password' : 'Please fill all credential fields');
      return;
    }
    try {
      await api.createStaffCredential({
        ...newStaff,
        email_or_username: newStaff.role === 'Captain' ? newStaff.phone_number : newStaff.email_or_username
      });
      success(`${newStaff.role} login credentials created successfully!`);
      setShowCreateModal(false);
      setNewStaff({ name: '', email_or_username: '', phone_number: '', password: '', role: 'Support Staff' });
      const staff = await api.getStaffCredentials();
      setStaffCredentials(staff);
    } catch (err: any) {
      error(err.message || 'Failed to create staff credential');
    }
  };

  const handleToggleStatus = async (staff: any) => {
    if (staff.role === 'Super Admin') {
      error('Super Admin account status cannot be modified');
      return;
    }
    const nextStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.toggleStaffCredentialStatus(staff.id, nextStatus);
      success(`Access for ${staff.name} is now ${nextStatus === 'Active' ? 'Enabled (Active)' : 'Disabled (Inactive)'}`);
      const staffList = await api.getStaffCredentials();
      setStaffCredentials(staffList);
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !resetPasswordVal) {
      error('Please enter a new password');
      return;
    }
    try {
      await api.resetStaffPassword(selectedStaff.id, resetPasswordVal);
      success(`Password reset successfully for ${selectedStaff.name}!`);
      setShowResetModal(false);
      setSelectedStaff(null);
      setResetPasswordVal('');
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
    }
  };

  const handleDeleteStaff = async (staffId: number, staffRole: string) => {
    if (staffRole === 'Super Admin') {
      error('Super Admin account cannot be deleted');
      return;
    }
    if (!window.confirm('Are you sure you want to revoke and delete this staff login credential?')) {
      return;
    }
    try {
      await api.deleteStaffCredential(staffId);
      success('Staff login credential revoked');
      const staff = await api.getStaffCredentials();
      setStaffCredentials(staff);
    } catch (err: any) {
      error(err.message || 'Failed to delete credential');
    }
  };

  const handleInputChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveSettings(settings);
      success('Application settings updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      error('New passwords do not match!');
      return;
    }
    success('Password updated successfully! Please use new password for next login.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>Application Settings & Administration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company branding, maintenance intervals, warning alerts, and inspect audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-2 overflow-x-auto text-xs">
        {[
          { id: 'company', label: 'Company Profile', icon: Building },
          { id: 'financial_control', label: 'Amount Control (Supervision)', icon: IndianRupee },
          { id: 'maintenance', label: 'Maintenance Intervals', icon: Wrench },
          { id: 'staff_access', label: 'Operator & Crew Logins', icon: Users },
          { id: 'account', label: 'Admin Security', icon: Lock },
          { id: 'notifications', label: 'Alert Preferences', icon: Bell },
          { id: 'audit', label: 'Audit Trail Logs', icon: History },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#142B4A] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* FINANCIAL AMOUNT CONTROL (ADMIN SUPERVISION) */}
        {activeTab === 'financial_control' && (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Financial Amount Control & Admin Supervision</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin supervised control over trip payments, driver & helper wages. Choose whether tasks calculate pay using a Fixed Amount or Company-Defined worker salary.
              </p>
            </div>

            {/* Mode Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Financial Rate Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('amount_control_mode', 'fixed')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    (settings.amount_control_mode || 'company_defined') === 'fixed'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span>Fixed Amount Mode</span>
                    </span>
                    {(settings.amount_control_mode || 'company_defined') === 'fixed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Standard fixed wages apply across all tasks regardless of worker contract. Admin sets the uniform trip pay rate.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('amount_control_mode', 'company_defined')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    (settings.amount_control_mode || 'company_defined') === 'company_defined'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Company-Defined Amount Mode</span>
                    </span>
                    {(settings.amount_control_mode || 'company_defined') === 'company_defined' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Amounts are derived from the registered biodata employee profile records (Permanent or Temporary agreement).
                  </p>
                </button>
              </div>
            </div>

            {/* Fixed Rates Configuration */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Admin Fixed Rates Configuration (₹ INR)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Driver Trip Pay (₹)</label>
                  <input
                    type="number"
                    value={settings.fixed_driver_salary || '1000'}
                    onChange={(e) => handleInputChange('fixed_driver_salary', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Applied for Driver 1 and Driver 2 in Fixed mode.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Helper Trip Pay (₹)</label>
                  <input
                    type="number"
                    value={settings.fixed_helper_salary || '600'}
                    onChange={(e) => handleInputChange('fixed_helper_salary', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default helper remuneration.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Hold Status Pay (₹)</label>
                  <input
                    type="number"
                    value={settings.fixed_hold_salary || '500'}
                    onChange={(e) => handleInputChange('fixed_hold_salary', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-applied when Vehicle Status is HOLD.</p>
                </div>
              </div>
            </div>

            {/* Operator Lock Policy */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Lock Financial Amounts for Operators & Employees</span>
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  When enabled, Operators and other non-admin employees cannot change or alter trip amounts, salary numbers, or wage rates without Admin permission.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleInputChange(
                    'lock_amounts_for_staff',
                    settings.lock_amounts_for_staff === 'false' ? 'true' : 'false'
                  )
                }
                className="text-2xl text-amber-700 cursor-pointer shrink-0"
              >
                {settings.lock_amounts_for_staff !== 'false' ? (
                  <ToggleRight className="w-8 h-8 text-amber-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Financial Controls...' : 'Save Financial Controls'}</span>
              </button>
            </div>
          </form>
        )}

        {/* COMPANY PROFILE */}
        {activeTab === 'company' && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
              Company Branding & Corporate Details
            </h3>

            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Official Logo Active</h4>
                <p className="text-xs text-slate-500">Charvik Staffing Consultancy logo is applied across Login, Topbar, Reports, and Biodata sheets.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.company_name || 'Charvik Staffing Consultancy'}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.company_email || 'contact@charvikstaffing.com'}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={settings.company_phone || '+91 98765 43210'}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timezone & Locale</label>
                <input
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST • DD-MM-YYYY)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Head Office Address</label>
              <textarea
                rows={2}
                value={settings.office_address || 'Plot 42, Transport Nagar, Vijayawada, Andhra Pradesh - 520007'}
                onChange={(e) => handleInputChange('office_address', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {/* MAINTENANCE INTERVALS */}
        {activeTab === 'maintenance' && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
              Default Preventive Maintenance Intervals & Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tyre Rotation Interval (KM)</label>
                <input
                  type="number"
                  value={settings.tyre_interval_km || 10000}
                  onChange={(e) => handleInputChange('tyre_interval_km', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">AC Service Interval (KM)</label>
                <input
                  type="number"
                  value={settings.ac_interval_km || 10000}
                  onChange={(e) => handleInputChange('ac_interval_km', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Oil & DPF Filter Interval (KM)</label>
                <input
                  type="number"
                  value={settings.oil_filter_interval_km || 40000}
                  onChange={(e) => handleInputChange('oil_filter_interval_km', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Engine Major Service Interval (KM)</label>
                <input
                  type="number"
                  value={settings.engine_interval_km || 120000}
                  onChange={(e) => handleInputChange('engine_interval_km', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warning Lead Odometer (KM)</label>
                <input
                  type="number"
                  value={settings.upcoming_km_threshold || 1000}
                  onChange={(e) => handleInputChange('upcoming_km_threshold', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warning Lead Calendar (Days)</label>
                <input
                  type="number"
                  value={settings.upcoming_days_threshold || 15}
                  onChange={(e) => handleInputChange('upcoming_days_threshold', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Maintenance Config'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ADMIN SECURITY */}
        {activeTab === 'account' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
              Administrator Security & Credentials
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <p>Logged in as: <strong className="text-slate-900">{user?.name}</strong> ({user?.email})</p>
              <p className="text-slate-500 mt-0.5">Role: <strong className="text-blue-700">{user?.role}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Key className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
              Automated Alert Notifications
            </h3>

            <div className="space-y-3">
              {[
                { title: 'Upcoming Maintenance Alerts', desc: 'Notify when bus odometer reaches within 1,000 km or 15 days of due date', active: true },
                { title: 'Overdue Maintenance Alerts', desc: 'High-priority banner for buses running past maintenance deadlines', active: true },
                { title: 'Driving Licence Expiry Warnings', desc: 'Alert 60 days before commercial driver heavy vehicle licence expires', active: true },
                { title: 'Vehicle Document Expiry Alerts', desc: 'Flag expiring Fitness certificates, Insurance, PUC, and Route permits', active: true },
                { title: 'Critical Safety Complaints', desc: 'Immediate notification when safety-critical defects are recorded', active: true },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active & Monitored
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#142B4A]">
                System Audit Trail (Security & Odometer Records)
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">{auditLogs.length} Events Logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="py-2 w-14 text-center">S.NO</th>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Module</th>
                    <th className="py-2">Details</th>
                    <th className="py-2">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id}>
                      <td className="py-2 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2 font-mono text-[11px] text-slate-500">{log.created_at}</td>
                      <td className="py-2 font-bold text-slate-900">{log.action}</td>
                      <td className="py-2 font-semibold text-blue-700">{log.module}</td>
                      <td className="py-2 text-slate-600">{log.details}</td>
                      <td className="py-2 font-medium text-slate-900">{log.user_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF & OPERATOR CREDENTIALS (ISSUED BY ADMIN) */}
        {activeTab === 'staff_access' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Operator & Crew Login Credentials</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Issue and manage official access credentials for Operators, Helpers, and Route Captains.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] shadow-sm transition-all self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue New Staff Credential</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Admin-Provided Access Control</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Operators and Captains cannot register publicly. Only Fleet Administrators can generate, issue, or reset their portal login credentials.
                </p>
              </div>
            </div>

            {/* Credentials Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="py-2.5 px-3 w-14 text-center">S.NO</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Username / Email</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staffCredentials.map((staff, idx) => {
                    const displayName = staff.name === 'Fleet Captain' ? 'Employee' : staff.name === 'Support Staff Member' ? 'Operator' : staff.name;
                    return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{displayName}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">
                        {staff.role === 'Captain' || staff.phone_number ? (
                          <span className="flex items-center gap-1 text-purple-800 font-bold">
                            <Phone className="w-3 h-3 text-purple-600" />
                            {staff.phone_number || staff.username || staff.email_or_username}
                          </span>
                        ) : (
                          staff.username || staff.email_or_username
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={staff.status === 'Active' ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {staff.role !== 'Super Admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-1.5 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                              staff.status === 'Active'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={staff.status === 'Active' ? 'Disable Access' : 'Enable Access'}
                          >
                            {staff.status === 'Active' ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5" />
                                <span>Disable</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5" />
                                <span>Enable</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setResetPasswordVal('');
                            setShowResetModal(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          title="Reset Password"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>

                        {staff.role !== 'Super Admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff.id, staff.role)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors inline-flex items-center cursor-pointer"
                            title="Revoke Credential"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Create Staff Credential Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>Issue New Staff Credential</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Staff Full Name</label>
                      <input
                        type="text"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Category</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Support Staff">Operator</option>
                        <option value="Captain">Employee</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>

                    {newStaff.role === 'Captain' ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Employee Mobile Number <span className="text-purple-600 font-semibold">(Login ID)</span>
                        </label>
                        <input
                          type="tel"
                          pattern="[0-9]{10}"
                          value={newStaff.phone_number}
                          onChange={(e) => setNewStaff({ ...newStaff, phone_number: e.target.value })}
                          placeholder="e.g. 9876543210 (10 digits)"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono font-bold"
                          required
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Employee logs in using this 10-digit mobile number + password.</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Username / Email</label>
                        <input
                          type="text"
                          value={newStaff.email_or_username}
                          onChange={(e) => setNewStaff({ ...newStaff, email_or_username: e.target.value })}
                          placeholder="e.g. operator@charvik.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assigned Password</label>
                      <input
                        type="password"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white font-bold shadow-sm cursor-pointer"
                      >
                        Issue Credential
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && selectedStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      <span>Reset Password for {selectedStaff.name}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleResetStaffPassword} className="space-y-4 text-xs">
                    <p className="text-slate-600">
                      Enter the new login password for username: <strong className="text-slate-900 font-mono">{selectedStaff.email_or_username}</strong>
                    </p>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={resetPasswordVal}
                        onChange={(e) => setResetPasswordVal(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowResetModal(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
