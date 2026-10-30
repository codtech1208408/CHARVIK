import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  ShieldCheck,
  RotateCw,
  RefreshCw,
  Activity,
  Layers,
  Clock,
  User,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { auditLogger, type AuditLogEntry } from '../services/auditLogger';
import { useToast } from '../components/common/Toast';

export const AuditLog: React.FC = () => {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    // Initial fetch
    setLogs(auditLogger.getLogs());

    // Listen to real-time events triggered anywhere in the admin panel
    const handleUpdate = () => {
      setLogs(auditLogger.getLogs());
    };

    window.addEventListener('charvik_audit_log_added', handleUpdate);
    return () => {
      window.removeEventListener('charvik_audit_log_added', handleUpdate);
    };
  }, []);

  // Compute available modules and users for dropdowns
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.user) set.add(l.user);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedActionType !== 'all' && log.action_type !== selectedActionType) return false;
      if (selectedModule !== 'all' && log.module !== selectedModule) return false;
      if (selectedUser !== 'all' && log.user !== selectedUser) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = (log.description || '').toLowerCase().includes(q);
        const matchMod = (log.module || '').toLowerCase().includes(q);
        const matchUser = (log.user || '').toLowerCase().includes(q);
        const matchTime = (log.formatted_time || '').toLowerCase().includes(q);
        const matchType = (log.action_type || '').toLowerCase().includes(q);
        if (!matchDesc && !matchMod && !matchUser && !matchTime && !matchType) return false;
      }

      return true;
    });
  }, [logs, search, selectedActionType, selectedModule, selectedUser]);

  // Summary Metrics
  const totalLogs = logs.length;
  const tabSwitchCount = logs.filter((l) => l.action_type === 'Tab Switch' || l.action_type === 'Navigation').length;
  const renewalCount = logs.filter((l) => l.action_type === 'Renewal').length;
  const updateCount = logs.filter((l) => l.action_type === 'Update' || l.action_type === 'Create').length;

  const handleClearLogs = () => {
    if (!window.confirm('Are you sure you want to clear all audit records from history?')) return;
    auditLogger.clearLogs();
    setLogs([]);
    success('Audit logs cleared successfully');
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      error('No audit records to export');
      return;
    }

    const headers = ['S.No', 'Timestamp', 'User', 'Module', 'Action Type', 'Description'];
    const rows = filteredLogs.map((l, idx) => [
      idx + 1,
      `"${l.formatted_time || l.timestamp}"`,
      `"${l.user || 'Admin'}"`,
      `"${l.module || '-'}"`,
      `"${l.action_type || '-'}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `charvik_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Audit logs downloaded as CSV');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#142B4A] text-white flex items-center justify-center shadow-sm">
            <History className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#142B4A]">Audit Log & Activity Trail</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Recording</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated audit trail recording every tab switch, maintenance renewal, checkup update, and admin action with exact date and time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL LOGGED EVENTS</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1 tracking-tight">
              {totalLogs.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Recorded audit entries</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TAB SWITCHES & NAV</p>
            <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1 tracking-tight">
              {tabSwitchCount.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Screen & tab switches</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">MAINTENANCE RENEWALS</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600 mt-1 tracking-tight">
              {renewalCount.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">AC, Tyre & Air renewals</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">DATA UPDATES</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tracking-tight">
              {updateCount.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Creates & field edits</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit actions, user, module, date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Type Filter */}
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-700"
          >
            <option value="all">All Action Types</option>
            <option value="Tab Switch">Tab Switch</option>
            <option value="Navigation">Navigation</option>
            <option value="Renewal">Renewal</option>
            <option value="Update">Update</option>
            <option value="Create">Create</option>
            <option value="Delete">Delete</option>
          </select>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-700"
          >
            <option value="all">All Modules</option>
            {availableModules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-700"
          >
            <option value="all">All Users</option>
            {availableUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {(selectedActionType !== 'all' || selectedModule !== 'all' || selectedUser !== 'all' || search) && (
            <button
              onClick={() => {
                setSelectedActionType('all');
                setSelectedModule('all');
                setSelectedUser('all');
                setSearch('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
              <tr>
                <th className="py-3 px-3.5 text-center w-12 border-r border-slate-300">S.NO</th>
                <th className="py-3 px-3.5 border-r border-slate-300 w-48">DATE & TIME</th>
                <th className="py-3 px-3.5 border-r border-slate-300 w-28">USER</th>
                <th className="py-3 px-3.5 border-r border-slate-300 w-40">MODULE</th>
                <th className="py-3 px-3.5 border-r border-slate-300 w-32 text-center">ACTION TYPE</th>
                <th className="py-3 px-3.5">RECORD / ACTION DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredLogs.map((log: AuditLogEntry, idx: number) => {
                const isTabSwitch = log.action_type === 'Tab Switch';
                const isNavigation = log.action_type === 'Navigation';
                const isRenewal = log.action_type === 'Renewal';
                const isUpdate = log.action_type === 'Update';
                const isCreate = log.action_type === 'Create';
                const isDelete = log.action_type === 'Delete';

                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-500 text-center border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.formatted_time}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{log.user || 'Admin'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50/60 border border-blue-200/70 text-blue-900 font-bold text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center border-r border-slate-200 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isRenewal
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : isTabSwitch || isNavigation
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : isCreate
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isUpdate
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isDelete
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-800">
                      {log.description}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    No audit records match the selected search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
