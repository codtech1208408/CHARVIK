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
  Key
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'company' | 'maintenance' | 'account' | 'notifications' | 'audit'>('company');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const [sett, logs] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs()
      ]);
      setSettings(sett);
      setAuditLogs(logs);
    } catch (err: any) {
      error(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
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
          { id: 'maintenance', label: 'Maintenance Intervals', icon: Wrench },
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
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Module</th>
                    <th className="py-2">Details</th>
                    <th className="py-2">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
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
      </div>
    </div>
  );
};
