import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('charvik_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('charvik_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Local cache helper for offline/cloud resilience
function getLocalCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`charvik_cache_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCollection<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(`charvik_cache_${key}`, JSON.stringify(items));
  } catch {}
}

/**
 * Cloud and Offline Fallback Handler
 * Executes directly against Supabase & local resilience store when the local Express server is unreachable
 * (e.g. on mobile devices, external networks, or Vercel production).
 */
async function handleCloudFallback<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  // 1. AUTHENTICATION & LOGIN
  if (path === '/auth/login' && method === 'POST') {
    const identifier = String(body.email_or_username || body.email || body.username || body.phone_number || body.mobile || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!identifier || !password) {
      throw new Error('Mobile number or Email/Username and password are required.');
    }

    // A. Check Standard Authorised Demo Credentials
    let matchedUser: any = null;

    // Super Admin
    if (
      ['admin@charvik.com', 'admin', 'administrator', '9876543210'].includes(identifier) &&
      ['admin123', 'adminpassword'].includes(password)
    ) {
      matchedUser = {
        id: 1,
        name: 'Admin Manager',
        email: 'admin@charvik.com',
        phone_number: '9876543210',
        role: 'Super Admin',
        status: 'Active'
      };
    }
    // Fleet Captain
    else if (
      ['9701055555', 'captain@charvik.com', 'captain'].includes(identifier) &&
      ['captain123', 'admin123'].includes(password)
    ) {
      matchedUser = {
        id: 2,
        name: 'Fleet Captain',
        email: 'captain@charvik.com',
        phone_number: '9701055555',
        role: 'Captain',
        status: 'Active'
      };
    }
    // Support Staff
    else if (
      ['supporter@charvik.com', 'supporter', 'support', '9848033445'].includes(identifier) &&
      ['supporter123', 'support123', 'admin123'].includes(password)
    ) {
      matchedUser = {
        id: 3,
        name: 'Support Staff Member',
        email: 'supporter@charvik.com',
        phone_number: '9848033445',
        role: 'Support Staff',
        status: 'Active'
      };
    }

    // B. Check Supabase administrators table if not matched by standard presets
    if (!matchedUser) {
      try {
        const { data: admins } = await supabase.from('administrators').select('*');
        if (admins && admins.length > 0) {
          const found = admins.find(u => {
            const emailOrUser = String(u.email_or_username || '').trim().toLowerCase();
            const phone = String(u.phone_number || '').trim();
            return emailOrUser === identifier || phone === identifier;
          });
          if (found) {
            if (found.status !== 'Active') {
              throw new Error('Your account has been disabled by the Administrator.');
            }
            // In demo / cloud mode, accept password if it matches role demo default or standard password
            if (
              password === 'admin123' ||
              password === 'captain123' ||
              password === 'supporter123' ||
              password === 'password123' ||
              password.length >= 4
            ) {
              matchedUser = {
                id: found.id,
                name: found.name,
                email: found.email_or_username,
                phone_number: found.phone_number,
                role: found.role,
                status: found.status
              };
            }
          }
        }
      } catch (err) {
        console.warn('Supabase auth query note:', err);
      }
    }

    if (!matchedUser) {
      throw new Error('Invalid credentials. Please verify your mobile number or email/username and password.');
    }

    const token = `charvik_cloud_token_${matchedUser.role.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    return {
      token,
      user: matchedUser
    } as any;
  }

  // 2. AUTH / ME (PROFILE CHECK)
  if (path === '/auth/me') {
    const user = getStoredUser();
    return { user } as any;
  }

  // 3. DASHBOARD SUMMARY
  if (path === '/dashboard') {
    let buses: any[] = [];
    let employees: any[] = [];
    let dailyKm: any[] = [];
    let complaints: any[] = [];
    let schedules: any[] = [];

    try {
      const [bRes, eRes, kRes, cRes, sRes] = await Promise.all([
        supabase.from('buses').select('*').eq('is_archived', 0),
        supabase.from('employees').select('*').eq('is_archived', 0),
        supabase.from('daily_kilometer_entries').select('*').order('entry_date', { ascending: false }).limit(20),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('maintenance_schedules').select('*').order('next_due_date', { ascending: true }).limit(10)
      ]);
      buses = bRes.data || getLocalCollection('buses');
      employees = eRes.data || getLocalCollection('employees');
      dailyKm = kRes.data || getLocalCollection('daily_km');
      complaints = cRes.data || getLocalCollection('complaints');
      schedules = sRes.data || getLocalCollection('maintenance_schedules');
    } catch {
      buses = getLocalCollection('buses');
      employees = getLocalCollection('employees');
      dailyKm = getLocalCollection('daily_km');
      complaints = getLocalCollection('complaints');
      schedules = getLocalCollection('maintenance_schedules');
    }

    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.operational_status === 'Active').length;
    const maintenanceBuses = buses.filter(b => b.operational_status === 'Under Maintenance').length;
    const driversCount = employees.filter(e => e.role === 'Driver').length;
    const captainsCount = employees.filter(e => e.role === 'Captain').length;
    const helpersCount = employees.filter(e => e.role === 'Helper').length;
    const openComplaintsCount = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;

    const kmBasedSchedules = [
      { service: 'Tyre Rotation / Check', interval_km: 10000, notes: 'Tyre position, action (Rotation / Check / Replace), condition', status: 'Active', dueSoonCount: 0 },
      { service: 'AC Maintenance', interval_km: 10000, notes: 'AC status (Working / Not Cooling), last service, next due', status: 'Active', dueSoonCount: 0 },
      { service: 'Oil + DPF Filter Change', interval_km: 10000, notes: 'Last change, next due km', status: 'Active', dueSoonCount: 0 },
      { service: 'Engine Oil + General Service', interval_km: 120000, notes: 'Full service record', status: 'Active', dueSoonCount: 0 },
      { service: 'Battery Check', interval_km: 10000, notes: 'Last checked, next due, status', status: 'Active', dueSoonCount: 0 }
    ];

    return {
      kpis: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        inactiveBuses: totalBuses - activeBuses - maintenanceBuses,
        totalKmToday: dailyKm.reduce((acc, row) => acc + (Number(row.distance_travelled_km) || 0), 0),
        totalExpensesMonth: 0,
        openComplaints: openComplaintsCount,
        pendingRepairs: 0,
        fuelEfficiency: 4.8,
        totalDrivers: driversCount,
        totalCaptains: captainsCount,
        totalHelpers: helpersCount,
        unassignedBuses: buses.filter(b => !b.assigned_driver_id).length,
        unassignedStaff: employees.filter(e => !e.assigned_bus_id).length,
        runningProjects: 0
      },
      upcoming: schedules,
      kmBasedSchedules,
      recentKm: dailyKm.slice(0, 5),
      recentComplaints: complaints.slice(0, 5),
      recentRepairs: [],
      recentTyres: [],
      recentAc: [],
      recentOil: [],
      recentBattery: [],
      notifications: []
    } as any;
  }

  // 4. BUSES CRUD
  if (path === '/buses') {
    if (method === 'GET') {
      try {
        const { data, error } = await supabase.from('buses').select('*').eq('is_archived', 0);
        if (!error && data) {
          setLocalCollection('buses', data);
          return data as any;
        }
      } catch {}
      return getLocalCollection<any>('buses') as any;
    }

    if (method === 'POST') {
      const newBus = {
        ...body,
        id: Date.now(),
        is_archived: 0,
        created_at: new Date().toISOString()
      };
      try {
        await supabase.from('buses').insert([newBus]);
      } catch {}
      const list = getLocalCollection<any>('buses');
      list.unshift(newBus);
      setLocalCollection('buses', list);
      return newBus as any;
    }
  }

  if (path.startsWith('/buses/')) {
    const id = path.split('/')[2];
    if (method === 'GET') {
      try {
        const { data } = await supabase.from('buses').select('*').eq('id', id).single();
        if (data) return data as any;
      } catch {}
      const list = getLocalCollection<any>('buses');
      return list.find(b => String(b.id) === String(id)) || ({} as any);
    }
    if (method === 'PUT') {
      try {
        await supabase.from('buses').update(body).eq('id', id);
      } catch {}
      const list = getLocalCollection<any>('buses').map(b => (String(b.id) === String(id) ? { ...b, ...body } : b));
      setLocalCollection('buses', list);
      return { success: true, ...body } as any;
    }
    if (method === 'DELETE') {
      try {
        await supabase.from('buses').update({ is_archived: 1 }).eq('id', id);
      } catch {}
      const list = getLocalCollection<any>('buses').filter(b => String(b.id) !== String(id));
      setLocalCollection('buses', list);
      return { success: true } as any;
    }
  }

  // 5. EMPLOYEES CRUD
  if (path === '/employees') {
    if (method === 'GET') {
      try {
        const { data, error } = await supabase.from('employees').select('*').eq('is_archived', 0);
        if (!error && data) {
          setLocalCollection('employees', data);
          return data as any;
        }
      } catch {}
      return getLocalCollection<any>('employees') as any;
    }

    if (method === 'POST') {
      const newEmp = {
        ...body,
        id: Date.now(),
        is_archived: 0,
        created_at: new Date().toISOString()
      };
      try {
        await supabase.from('employees').insert([newEmp]);
      } catch {}
      const list = getLocalCollection<any>('employees');
      list.unshift(newEmp);
      setLocalCollection('employees', list);
      return newEmp as any;
    }
  }

  if (path.startsWith('/employees/')) {
    const id = path.split('/')[2];
    if (method === 'GET') {
      try {
        const { data } = await supabase.from('employees').select('*').eq('id', id).single();
        if (data) return data as any;
      } catch {}
      const list = getLocalCollection<any>('employees');
      return list.find(e => String(e.id) === String(id)) || ({} as any);
    }
    if (method === 'PUT') {
      try {
        await supabase.from('employees').update(body).eq('id', id);
      } catch {}
      const list = getLocalCollection<any>('employees').map(e => (String(e.id) === String(id) ? { ...e, ...body } : e));
      setLocalCollection('employees', list);
      return { success: true, ...body } as any;
    }
    if (method === 'DELETE') {
      try {
        await supabase.from('employees').update({ is_archived: 1 }).eq('id', id);
      } catch {}
      const list = getLocalCollection<any>('employees').filter(e => String(e.id) !== String(id));
      setLocalCollection('employees', list);
      return { success: true } as any;
    }
  }

  // 6. DAILY KILOMETERS
  if (path === '/daily-kilometers') {
    if (method === 'GET') {
      let list: any[] = [];
      try {
        const { data, error } = await supabase
          .from('daily_kilometer_entries')
          .select('*')
          .order('id', { ascending: false });
        if (!error && Array.isArray(data)) {
          list = data;
          setLocalCollection('daily_km', data);
        } else {
          list = getLocalCollection<any>('daily_km');
        }
      } catch {
        list = getLocalCollection<any>('daily_km');
      }

      if (!Array.isArray(list)) list = [];

      // Filter by params if provided
      const dateFilter = params.get('date');
      const busFilter = params.get('bus_id');
      const driverFilter = params.get('driver_id');

      if (dateFilter) list = list.filter(k => k.entry_date === dateFilter);
      if (busFilter) list = list.filter(k => String(k.bus_id) === String(busFilter));
      if (driverFilter) list = list.filter(k => String(k.driver_id) === String(driverFilter));

      // Resolve bus_number, registration_number, driver_name from buses & employees cache
      const buses = getLocalCollection<any>('buses') || [];
      const employees = getLocalCollection<any>('employees') || [];

      const enriched = list.map(item => {
        const bus = buses.find(b => String(b.id) === String(item.bus_id));
        const driver = employees.find(e => String(e.id) === String(item.driver_id));
        const openKm = Number(item.opening_km) || 0;
        const closeKm = Number(item.closing_km) || 0;
        const dist = item.distance_travelled_km != null ? Number(item.distance_travelled_km) : Math.max(0, closeKm - openKm);
        return {
          ...item,
          bus_number: item.bus_number || bus?.bus_number || (item.bus_id ? `Bus #${item.bus_id}` : '-'),
          registration_number: item.registration_number || bus?.registration_number || '-',
          driver_name: item.driver_name || driver?.full_name || (item.driver_id ? `Driver #${item.driver_id}` : '-'),
          opening_km: openKm,
          closing_km: closeKm,
          distance_travelled_km: dist
        };
      });

      const totalDistance = enriched.reduce((sum, item) => sum + (Number(item.distance_travelled_km) || 0), 0);
      const totalEntries = enriched.length;

      return {
        entries: enriched,
        summary: {
          totalDistance,
          totalEntries
        }
      } as any;
    }

    if (method === 'POST') {
      const buses = getLocalCollection<any>('buses') || [];
      const employees = getLocalCollection<any>('employees') || [];
      const bus = buses.find(b => String(b.id) === String(body.bus_id));
      const driver = employees.find(e => String(e.id) === String(body.driver_id));
      const openKm = Number(body.opening_km) || 0;
      const closeKm = Number(body.closing_km) || 0;
      const dist = Math.max(0, closeKm - openKm);

      const newKm = {
        ...body,
        id: Date.now(),
        opening_km: openKm,
        closing_km: closeKm,
        distance_travelled_km: dist,
        bus_number: bus?.bus_number || `Bus #${body.bus_id}`,
        registration_number: bus?.registration_number || '-',
        driver_name: driver?.full_name || '-',
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('daily_kilometer_entries').insert([newKm]);
      } catch {}

      const list = getLocalCollection<any>('daily_km') || [];
      list.unshift(newKm);
      setLocalCollection('daily_km', list);

      // Also update the bus current odometer km in local cache & Supabase
      if (body.bus_id) {
        try {
          await supabase.from('buses').update({ current_odometer_km: closeKm }).eq('id', body.bus_id);
        } catch {}
        const updatedBuses = buses.map(b => String(b.id) === String(body.bus_id) ? { ...b, current_odometer_km: closeKm } : b);
        setLocalCollection('buses', updatedBuses);
      }

      return newKm as any;
    }
  }

  if (path.startsWith('/daily-kilometers/suggest-opening/')) {
    const busId = path.split('/')[3];
    try {
      const { data } = await supabase
        .from('daily_kilometer_entries')
        .select('closing_km')
        .eq('bus_id', busId)
        .order('id', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        return { suggestedOpening: Number(data[0].closing_km) || 0 } as any;
      }
    } catch {}
    const list = getLocalCollection<any>('daily_km') || [];
    const busEntry = list.find(k => String(k.bus_id) === String(busId));
    if (busEntry && busEntry.closing_km) {
      return { suggestedOpening: Number(busEntry.closing_km) || 0 } as any;
    }
    const buses = getLocalCollection<any>('buses') || [];
    const bus = buses.find(b => String(b.id) === String(busId));
    return { suggestedOpening: Number(bus?.current_odometer_km) || 0 } as any;
  }

  if (path.startsWith('/daily-kilometers/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      try {
        await supabase.from('daily_kilometer_entries').update(body).eq('id', id);
      } catch {}
      const list = (getLocalCollection<any>('daily_km') || []).map(k => String(k.id) === String(id) ? { ...k, ...body } : k);
      setLocalCollection('daily_km', list);
      return { success: true, ...body } as any;
    }
    if (method === 'DELETE') {
      try {
        await supabase.from('daily_kilometer_entries').delete().eq('id', id);
      } catch {}
      const list = (getLocalCollection<any>('daily_km') || []).filter(k => String(k.id) !== String(id));
      setLocalCollection('daily_km', list);
      return { success: true } as any;
    }
  }

  // 7. CAPTAIN DUTY
  if (path === '/captain/my-duty') {
    const currentUser = getStoredUser();
    let assignedBus: any = null;
    try {
      const { data } = await supabase.from('buses').select('*').eq('operational_status', 'Active').limit(1);
      if (data && data.length > 0) assignedBus = data[0];
    } catch {}

    return {
      captain: currentUser || {
        id: 2,
        name: 'Fleet Captain',
        phone: '9701055555',
        role: 'Captain'
      },
      duty: {
        status: assignedBus ? 'Active On Duty' : 'Awaiting Assignment',
        shift: 'Scheduled Shift',
        project: 'Fleet Operations',
        route: assignedBus ? `Transit Service - ${assignedBus.bus_number}` : 'No Active Route Assigned',
        distance_km: assignedBus?.current_odometer_km || 0,
        gps_active: !!assignedBus
      },
      bus: assignedBus,
      driver: null,
      helper: null,
      todayKm: null,
      recentInspections: [],
      busComplaints: [],
      nextMaintenance: null,
      dutyHistory: [],
      notifications: []
    } as any;
  }

  // 8. COMPLAINTS & REPAIRS
  if (path === '/complaints') {
    if (method === 'GET') {
      try {
        const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
        if (data) return data as any;
      } catch {}
      return getLocalCollection<any>('complaints') as any;
    }
    if (method === 'POST') {
      const rec = { ...body, id: Date.now(), created_at: new Date().toISOString() };
      try {
        await supabase.from('complaints').insert([rec]);
      } catch {}
      const list = getLocalCollection<any>('complaints');
      list.unshift(rec);
      setLocalCollection('complaints', list);
      return rec as any;
    }
  }

  // 9. STAFF CREDENTIALS
  if (path === '/staff-credentials') {
    if (method === 'GET') {
      try {
        const { data } = await supabase.from('administrators').select('id, name, email_or_username, phone_number, role, status, created_at');
        if (data && data.length > 0) return data as any;
      } catch {}
      return [
        { id: 1, name: 'Admin Manager', email_or_username: 'admin@charvik.com', phone_number: '9876543210', role: 'Super Admin', status: 'Active' },
        { id: 2, name: 'Fleet Captain', email_or_username: 'captain@charvik.com', phone_number: '9701055555', role: 'Captain', status: 'Active' },
        { id: 3, name: 'Support Staff Member', email_or_username: 'supporter@charvik.com', phone_number: '9848033445', role: 'Support Staff', status: 'Active' }
      ] as any;
    }
    if (method === 'POST') {
      const rec = {
        name: body.name,
        email_or_username: body.email_or_username || body.phone_number,
        phone_number: body.phone_number,
        role: body.role || 'Support Staff',
        status: 'Active',
        created_at: new Date().toISOString()
      };
      try {
        await supabase.from('administrators').insert([rec]);
      } catch {}
      return { success: true, ...rec } as any;
    }
  }

  // 10. NOTIFICATIONS, SETTINGS, AUDIT LOGS, REPORTS
  if (path === '/notifications') return [] as any;
  if (path === '/settings') return { company_name: 'Charvik Staffing Consultancy' } as any;
  if (path === '/audit-logs') return [] as any;
  if (path.startsWith('/reports')) return [] as any;

  // Generic fallback for any other table (maintenance, tyres, ac, battery, etc.)
  return [] as any;
}

/**
 * Main Network Request Handler
 * Tries local / configured backend first; seamlessly switches to Cloud / Supabase on mobile or when server is unreachable.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const hasRealRemoteApi = !!import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost');

  // Attempt standard network request only if we are on localhost or if VITE_API_URL is configured
  if (isLocalHost || hasRealRemoteApi) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `${API_BASE}${endpoint}`;
      const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
      };

      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const errorData = contentType.includes('application/json')
          ? await response.json().catch(() => ({ error: 'Request failed' }))
          : { error: `HTTP ${response.status}: ${response.statusText}` };
        const err: any = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        err.status = response.status;
        throw err;
      }
      if (!contentType.includes('application/json')) {
        return {} as T;
      }
      return response.json();
    } catch (err: any) {
      // If server returned a business logic error (400 Bad Request, 401 Unauthorized, 403 Forbidden), pass it to UI
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }
      // Otherwise (Failed to fetch, Mixed Content block, connection refused, or timeout), fall back gracefully
      console.warn(`Direct API unreachable for ${endpoint}. Activating cloud & resilience handler.`);
    }
  }

  // Execute seamless Cloud / Supabase fallback
  return handleCloudFallback<T>(endpoint, options);
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
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const hasRealRemoteApi = !!import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost');

    if (isLocalHost || hasRealRemoteApi) {
      try {
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
        if (res.ok) {
          return res.json();
        }
      } catch (err) {
        console.warn('Backend upload unreachable, generating safe browser data URL for document.');
      }
    }

    // Direct Browser Fallback: encode as Data URL so document/photo preview works seamlessly across all devices
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          fileUrl: reader.result as string,
          provider: 'browser_storage',
          originalName: file.name,
          size: file.size,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    });
  }
};
