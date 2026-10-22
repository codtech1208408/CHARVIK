const API_BASE = 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('charvik_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboard: () => request<any>('/dashboard'),

  // Buses
  getBuses: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/buses${q ? `?${q}` : ''}`);
  },
  getBus: (id: number | string) => request<any>(`/buses/${id}`),
  createBus: (data: any) => request<any>('/buses', { method: 'POST', body: JSON.stringify(data) }),
  updateBus: (id: number | string, data: any) => request<any>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveBus: (id: number | string) => request<any>(`/buses/${id}`, { method: 'DELETE' }),

  // Daily Kilometers
  getDailyKm: (params?: { date?: string; bus_id?: number | string; driver_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any>(`/daily-kilometers${q ? `?${q}` : ''}`);
  },
  suggestOpeningKm: (busId: number | string) => request<{ suggestedOpening: number }>(`/daily-kilometers/suggest-opening/${busId}`),
  createDailyKm: (data: any) => request<any>('/daily-kilometers', { method: 'POST', body: JSON.stringify(data) }),
  correctDailyKm: (id: number | string, data: any) => request<any>(`/daily-kilometers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDailyKm: (id: number | string) => request<any>(`/daily-kilometers/${id}`, { method: 'DELETE' }),

  // Maintenance Schedules
  getMaintenanceSchedules: (params?: { status?: string; bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/maintenance-schedules${q ? `?${q}` : ''}`);
  },
  createMaintenanceSchedule: (data: any) => request<any>('/maintenance-schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenanceSchedule: (id: number | string, data: any) => request<any>(`/maintenance-schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaintenanceSchedule: (id: number | string) => request<any>(`/maintenance-schedules/${id}`, { method: 'DELETE' }),

  // Tyre Maintenance
  getTyreRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/tyre-maintenance${q ? `?${q}` : ''}`);
  },
  createTyreRecord: (data: any) => request<any>('/tyre-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateTyreRecord: (id: number | string, data: any) => request<any>(`/tyre-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // AC Maintenance
  getAcRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/ac-maintenance${q ? `?${q}` : ''}`);
  },
  createAcRecord: (data: any) => request<any>('/ac-maintenance', { method: 'POST', body: JSON.stringify(data) }),

  // Oil and Filter
  getOilRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/oil-filter-maintenance${q ? `?${q}` : ''}`);
  },
  createOilRecord: (data: any) => request<any>('/oil-filter-maintenance', { method: 'POST', body: JSON.stringify(data) }),

  // Battery
  getBatteryRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/battery-maintenance${q ? `?${q}` : ''}`);
  },
  createBatteryRecord: (data: any) => request<any>('/battery-maintenance', { method: 'POST', body: JSON.stringify(data) }),

  // Complaints
  getComplaints: (params?: { status?: string; priority?: string; bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/complaints${q ? `?${q}` : ''}`);
  },
  createComplaint: (data: any) => request<any>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: number | string, data: any) => request<any>(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Repairs
  getRepairs: (params?: { status?: string; bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/repairs${q ? `?${q}` : ''}`);
  },
  createRepair: (data: any) => request<any>('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  updateRepair: (id: number | string, data: any) => request<any>(`/repairs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Bus Condition
  getBusConditions: (params?: { bus_id?: number | string; roadworthiness?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/bus-condition${q ? `?${q}` : ''}`);
  },
  createBusCondition: (data: any) => request<any>('/bus-condition', { method: 'POST', body: JSON.stringify(data) }),

  // Employees
  getEmployees: (params?: { role?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/employees${q ? `?${q}` : ''}`);
  },
  getEmployee: (id: number | string) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number | string, data: any) => request<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveEmployee: (id: number | string) => request<any>(`/employees/${id}`, { method: 'DELETE' }),

  // Reports
  getReport: (type: string, params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any>(`/reports/${type}${q ? `?${q}` : ''}`);
  },

  // Notifications
  getNotifications: () => request<any>('/notifications'),

  // Settings & Audits
  getSettings: () => request<Record<string, string>>('/settings'),
  saveSettings: (data: Record<string, string>) => request<any>('/settings', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => request<any[]>('/audit-logs'),

  // Staff Credentials (issued by Admin)
  getStaffCredentials: () => request<any[]>('/staff-credentials'),
  createStaffCredential: (data: { name: string; email_or_username: string; phone_number?: string; password: string; role: string }) =>
    request<any>('/staff-credentials', { method: 'POST', body: JSON.stringify(data) }),
  resetStaffPassword: (id: number | string, newPassword: string) =>
    request<any>(`/staff-credentials/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  toggleStaffCredentialStatus: (id: number | string, status: 'Active' | 'Inactive') =>
    request<any>(`/staff-credentials/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteStaffCredential: (id: number | string) =>
    request<any>(`/staff-credentials/${id}`, { method: 'DELETE' }),

  // Captain Duty
  getCaptainDuty: () => request<any>('/captain/my-duty'),

  // File Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('charvik_token');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  }
};
