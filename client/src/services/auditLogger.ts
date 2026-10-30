// Audit Logger Service for Charvik Fleet Admin Panel
// Automatically tracks and persists all admin actions, tab switches, and maintenance updates.

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  formatted_time: string; // Formatted readable time
  user: string;
  module: string;
  action_type: 'Navigation' | 'Tab Switch' | 'Renewal' | 'Create' | 'Update' | 'Delete' | 'Inspection';
  description: string;
  details?: any;
}

const STORAGE_KEY = 'charvik_admin_audit_logs';

// Initial seed entries so the log is immediately informative
const defaultSeedLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    formatted_time: new Date(Date.now() - 1000 * 60 * 12).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    user: 'Admin',
    module: 'AC Maintenance',
    action_type: 'Renewal',
    description: 'Renewed AC Filter for Bus AP16TV1234. Expiry set to 5 days.'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    formatted_time: new Date(Date.now() - 1000 * 60 * 25).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    user: 'Admin',
    module: 'Tyre Maintenance',
    action_type: 'Tab Switch',
    description: 'Switched to Wheel Allotment & Tyre Rotation tab'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    formatted_time: new Date(Date.now() - 1000 * 60 * 45).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    user: 'Admin',
    module: 'Daily Checkup',
    action_type: 'Update',
    description: 'Updated Starting KM to 45,200 KM for AP16TV1234'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    formatted_time: new Date(Date.now() - 1000 * 60 * 90).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    user: 'Admin',
    module: 'Tyre Maintenance',
    action_type: 'Update',
    description: 'Logged Tyre Air Checkup for fleet bus AP16TV1234 (110 PSI)'
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    formatted_time: new Date(Date.now() - 1000 * 60 * 180).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    user: 'Admin',
    module: 'Dashboard',
    action_type: 'Navigation',
    description: 'Admin logged in and viewed Fleet Operations Live Dashboard'
  }
];

export const auditLogger = {
  getLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse audit logs from storage', e);
    }
    // Default seed
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeedLogs));
    } catch {}
    return defaultSeedLogs;
  },

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'formatted_time'>): AuditLogEntry {
    const now = new Date();
    const formatted_time = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formatted_time,
      user: entry.user || 'Admin',
      module: entry.module || 'System',
      action_type: entry.action_type || 'Update',
      description: entry.description,
      details: entry.details
    };

    const currentLogs = this.getLogs();
    // Keep up to 500 recent entries
    const updated = [newEntry, ...currentLogs].slice(0, 500);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save audit log', e);
    }

    // Trigger window event so listeners immediately re-render
    try {
      window.dispatchEvent(new CustomEvent('charvik_audit_log_added', { detail: newEntry }));
    } catch {}

    return newEntry;
  },

  clearLogs(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('charvik_audit_log_added', { detail: null }));
    } catch (e) {
      console.warn('Failed to clear audit logs', e);
    }
  }
};
