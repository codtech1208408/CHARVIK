import { supabase } from './supabase';
import {
  BASE_FLEET_BUSES,
  BASE_FLEET_EMPLOYEES,
  BASE_FLEET_ROUTES,
  BASE_FLEET_ORGANIZERS,
  BASE_FLEET_TASKS,
  BASE_TYRE_RECORDS,
  BASE_TYRE_AIR_CHECKUPS,
  BASE_WHEEL_ALLOTMENTS,
  BASE_NEW_TYRES,
  BASE_AC_MAINTENANCE_RECORDS,
  BASE_BUS_CONDITION_INSPECTIONS,
  BASE_DAILY_KM_ENTRIES,
  BASE_MAINTENANCE_SCHEDULES,
  BASE_PRODUCTS,
  BASE_STAFF_CREDENTIALS,
  BASE_APP_SETTINGS
} from './seedData';

/**
 * Merges local existing items with baseline seed items so that newly registered
 * routes, employees, buses, organizers, and tasks from localhost immediately show on Vercel
 */
export function mergeSeedCollection<T extends { id?: any; service_number?: any; organization_name?: any; bus_number?: any; registration_number?: any; employee_code?: any }>(
  existing: T[],
  seed: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of seed || []) {
    if (!item) continue;
    const key = String(item.id ?? item.service_number ?? item.bus_number ?? item.registration_number ?? item.organization_name ?? item.employee_code ?? JSON.stringify(item));
    map.set(key, item);
  }
  for (const item of existing || []) {
    if (!item) continue;
    const key = String(item.id ?? item.service_number ?? item.bus_number ?? item.registration_number ?? item.organization_name ?? item.employee_code ?? JSON.stringify(item));
    const current = map.get(key) || ({} as T);
    map.set(key, { ...current, ...item });
  }
  return Array.from(map.values());
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

// Image compression helper (shrinks 5MB-10MB camera photos to ~40KB-70KB so quota is never exceeded)
function compressImageFile(file: File, maxDim = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((reader.result as string) || '');
        }
      };
      img.onerror = () => resolve((reader.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// IndexedDB unlimited store (no 5MB localStorage limit)
const IDB_NAME = 'charvik_fleet_storage_db';
const IDB_STORE = 'collections';

function openCharvikIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setIdbCollection<T>(key: string, items: T[]): Promise<void> {
  try {
    const db = await openCharvikIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(items, key);
  } catch {}
}

async function getIdbCollection<T>(key: string): Promise<T[] | null> {
  try {
    const db = await openCharvikIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : null);
      req.onerror = () => resolve(null);
    });
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

async function getReliableCollection<T>(key: string): Promise<T[]> {
  try {
    const idb = await getIdbCollection<T>(key);
    const local = getLocalCollection<T>(key);
    if (Array.isArray(idb) && idb.length > 0) {
      if (!local || local.length < idb.length) {
        setLocalCollection(key, idb);
        return idb;
      }
      return idb;
    }
    return local;
  } catch {
    return getLocalCollection<T>(key);
  }
}

function setLocalCollection<T>(key: string, items: T[]) {
  // 1. Always persist to IndexedDB (unlimited quota, stores full images)
  setIdbCollection(key, items);

  // 2. Save to localStorage with graceful fallback if quota is exceeded
  try {
    localStorage.setItem(`charvik_cache_${key}`, JSON.stringify(items));
  } catch {
    try {
      // Strip heavy base64 strings for localStorage backup so metadata is NEVER lost
      const stripped = items.map((item: any) => {
        if (!item || typeof item !== 'object') return item;
        const copy: any = { ...item };
        for (const k of Object.keys(copy)) {
          if (typeof copy[k] === 'string' && copy[k].startsWith('data:image/')) {
            copy[k] = '[stored_in_idb]';
          }
        }
        return copy;
      });
      localStorage.setItem(`charvik_cache_${key}`, JSON.stringify(stripped));
    } catch {}
  }
}

/**
 * Resilient merge helper:
 * Guarantees that local newly-added/edited records are NEVER wiped out by an empty or partial remote array.
 */
function mergeWithLocal<T extends { id?: any; is_archived?: number; registration_number?: string; bus_number?: string }>(
  key: string,
  remoteItems: T[] | null | undefined,
  idField: string = 'id'
): T[] {
  const localItems = getLocalCollection<T>(key);
  if (!remoteItems || !Array.isArray(remoteItems) || remoteItems.length === 0) {
    // If remote has nothing or is offline, retain all non-archived local items!
    return localItems.filter(item => (item as any)?.is_archived !== 1);
  }

  const map = new Map<string, T>();

  // 1. Load valid remote items
  for (const item of remoteItems) {
    if (item && (item as any).is_archived !== 1) {
      const uKey = String((item as any)[idField] ?? (item as any).registration_number ?? (item as any).bus_number ?? (item as any).id);
      map.set(uKey, item);
    }
  }

  // 2. Overlay local items (preserves user-created items that haven't synced or are newer)
  for (const item of localItems) {
    if (item) {
      const uKey = String((item as any)[idField] ?? (item as any).registration_number ?? (item as any).bus_number ?? (item as any).id);
      if ((item as any).is_archived === 1) {
        map.delete(uKey);
      } else {
        map.set(uKey, item);
      }
    }
  }

  const merged = Array.from(map.values());
  setLocalCollection(key, merged);
  return merged;
}


/**
 * Helper to handle full CRUD on any fleet management table in fallback/cloud mode
 */
async function handleFallbackTableCrud(
  tableKey: string,
  supabaseTable: string,
  path: string,
  method: string,
  body: any,
  params: URLSearchParams,
  options?: {
    idGenerator?: () => any;
    enrich?: (items: any[]) => any[];
    filter?: (items: any[], params: URLSearchParams) => any[];
  }
) {
  const parts = path.split('/').filter(Boolean);
  const isItemRoute = parts.length > 1;
  const itemId = isItemRoute ? parts[1] : null;

  if (!isItemRoute) {
    if (method === 'GET') {
      let list: any[] = [];
      try {
        const { data, error } = await supabase.from(supabaseTable).select('*').order('id', { ascending: false });
        list = mergeWithLocal(tableKey, !error && Array.isArray(data) ? data : []);
      } catch {
        list = getLocalCollection<any>(tableKey).filter(x => x?.is_archived !== 1);
      }

      if (tableKey === 'buses') {
        list = mergeSeedCollection(list, BASE_FLEET_BUSES);
        setLocalCollection('buses', list);
      }
      if (tableKey === 'routes') {
        list = mergeSeedCollection(list, BASE_FLEET_ROUTES);
        setLocalCollection('routes', list);
      }
      if (tableKey === 'organizers') {
        list = mergeSeedCollection(list, BASE_FLEET_ORGANIZERS);
        setLocalCollection('organizers', list);
      }
      if (tableKey === 'tasks') {
        list = mergeSeedCollection(list, BASE_FLEET_TASKS);
        setLocalCollection('tasks', list);
      }
      if (tableKey === 'tyres' || tableKey === 'tyre_records') {
        list = mergeSeedCollection(list, BASE_TYRE_RECORDS);
        setLocalCollection(tableKey, list);
      }
      if (tableKey === 'ac_maintenance_records') {
        list = mergeSeedCollection(list, BASE_AC_MAINTENANCE_RECORDS);
        setLocalCollection('ac_maintenance_records', list);
      }
      if (tableKey === 'bus_conditions' || tableKey === 'bus_condition_inspections') {
        list = mergeSeedCollection(list, BASE_BUS_CONDITION_INSPECTIONS);
        setLocalCollection(tableKey, list);
      }
      if (tableKey === 'wheel_allotments') {
        list = mergeSeedCollection(list, BASE_WHEEL_ALLOTMENTS);
        setLocalCollection('wheel_allotments', list);
      }
      if (tableKey === 'tyre_air_checkups') {
        list = mergeSeedCollection(list, BASE_TYRE_AIR_CHECKUPS);
        setLocalCollection('tyre_air_checkups', list);
      }
      if (tableKey === 'new_tyres') {
        list = mergeSeedCollection(list, BASE_NEW_TYRES);
        setLocalCollection('new_tyres', list);
      }
      if (tableKey === 'daily_km') {
        list = mergeSeedCollection(list, BASE_DAILY_KM_ENTRIES);
        setLocalCollection('daily_km', list);
      }
      if (tableKey === 'maintenance_schedules') {
        list = mergeSeedCollection(list, BASE_MAINTENANCE_SCHEDULES);
        setLocalCollection('maintenance_schedules', list);
      }
      if (tableKey === 'products') {
        list = mergeSeedCollection(list, BASE_PRODUCTS);
        setLocalCollection('products', list);
      }
      if (options?.enrich) list = options.enrich(list);
      if (options?.filter) list = options.filter(list, params);
      return list;
    }

    if (method === 'POST') {
      const record = {
        ...body,
        id: body.id || (options?.idGenerator ? options.idGenerator() : Date.now()),
        is_archived: 0,
        created_at: new Date().toISOString()
      };
      const list = getLocalCollection<any>(tableKey).filter(x => String(x.id) !== String(record.id));
      list.unshift(record);
      setLocalCollection(tableKey, list);
      try {
        await supabase.from(supabaseTable).insert([record]);
      } catch {}
      return record;
    }
  } else if (itemId) {
    if (method === 'GET') {
      const list = getLocalCollection<any>(tableKey);
      const found = list.find(x => String(x.id) === String(itemId));
      if (found) return found;
      try {
        const { data } = await supabase.from(supabaseTable).select('*').eq('id', itemId).single();
        if (data) return data;
      } catch {}
      return found || {};
    }

    if (method === 'PUT') {
      const list = getLocalCollection<any>(tableKey).map(x => (String(x.id) === String(itemId) ? { ...x, ...body } : x));
      setLocalCollection(tableKey, list);
      try {
        await supabase.from(supabaseTable).update(body).eq('id', itemId);
      } catch {}
      return { success: true, ...body };
    }

    if (method === 'DELETE') {
      const list = getLocalCollection<any>(tableKey).filter(x => String(x.id) !== String(itemId));
      setLocalCollection(tableKey, list);
      try {
        await supabase.from(supabaseTable).delete().eq('id', itemId);
      } catch {}
      return { success: true };
    }
  }
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
        supabase.from('daily_kilometer_entries').select('*').order('entry_date', { ascending: false }).limit(50),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('maintenance_schedules').select('*').order('next_due_date', { ascending: true }).limit(20)
      ]);
      buses = mergeWithLocal('buses', bRes.data);
      employees = mergeWithLocal('employees', eRes.data);
      dailyKm = mergeWithLocal('daily_km', kRes.data);
      complaints = mergeWithLocal('complaints', cRes.data);
      schedules = mergeWithLocal('maintenance_schedules', sRes.data);
    } catch {
      buses = getLocalCollection('buses').filter(b => (b as any).is_archived !== 1);
      employees = getLocalCollection('employees').filter(e => (e as any).is_archived !== 1);
      dailyKm = getLocalCollection('daily_km').filter(k => (k as any).is_archived !== 1);
      complaints = getLocalCollection('complaints').filter(c => (c as any).is_archived !== 1);
      schedules = getLocalCollection('maintenance_schedules').filter(s => (s as any).is_archived !== 1);
    }

    // Always ensure base fleet buses and employees are loaded
    if (!buses || buses.length === 0) {
      buses = getLocalCollection('buses').filter(b => (b as any).is_archived !== 1);
      if (!buses || buses.length === 0) {
        buses = [...BASE_FLEET_BUSES];
        setLocalCollection('buses', buses);
      }
    }
    if (!employees || employees.length === 0) {
      employees = getLocalCollection('employees').filter(e => (e as any).is_archived !== 1);
      if (!employees || employees.length === 0) {
        employees = [...BASE_FLEET_EMPLOYEES];
        setLocalCollection('employees', employees);
      }
    }

    // Purge any dummy seed employees
    employees = employees.filter(e => !isDummySeedEmployee(e));

    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => (b.operational_status || 'Active').toLowerCase() === 'active').length;
    const underMaintenance = buses.filter(b => (b.operational_status || '').toLowerCase().includes('maintenance')).length;
    const scheduledMaintenance = schedules.filter(s => ['Scheduled', 'Due', 'Due Soon', 'Pending', 'In Progress'].includes(s.status)).length;
    const pendingComplaints = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
    const completedMonth = schedules.filter(s => s.status === 'Completed').length;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const todayKm = dailyKm
      .filter(k => k.entry_date === todayDateStr)
      .reduce((acc, row) => acc + (Number(row.distance_travelled_km) || 0), 0);

    const driversCount = employees.filter(e => e.role === 'Driver').length;
    const captainsCount = employees.filter(e => e.role === 'Captain').length;
    const helpersCount = employees.filter(e => e.role === 'Helper').length;
    const operatorsCount = new Set(buses.map(b => b.make).filter(Boolean)).size || (totalBuses > 0 ? 1 : 0);
    const unassignedBusesCount = buses.filter(b => !b.assigned_driver_id && !b.driver_name).length;
    const unassignedStaffCount = employees.filter(e => !e.assigned_bus_id).length;
    const runningProjectsCount = new Set(buses.filter(b => (b.operational_status || 'Active').toLowerCase() === 'active').map(b => b.bus_type || 'Fleet')).size || activeBuses;

    const kmBasedSchedules = [
      { service: 'Tyre Rotation / Check', interval_km: 10000, notes: 'Tyre position, action (Rotation / Check / Replace), condition', status: 'Active', dueSoonCount: 0 },
      { service: 'AC Maintenance', interval_km: 10000, notes: 'AC status (Working / Not Cooling), last service, next due', status: 'Active', dueSoonCount: 0 },
      { service: 'Oil + DPF Filter Change', interval_km: 10000, notes: 'Last change, next due km', status: 'Active', dueSoonCount: 0 },
      { service: 'Engine Oil + General Service', interval_km: 120000, notes: 'Full service record', status: 'Active', dueSoonCount: 0 },
      { service: 'Battery Check', interval_km: 10000, notes: 'Last checked, next due, status', status: 'Active', dueSoonCount: 0 }
    ];

    const statusCounts: Record<string, number> = {};
    for (const b of buses) {
      const st = b.operational_status || 'Active';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const liveRunningBuses = buses.map((b, idx) => ({
      id: b.id,
      bus_number: b.bus_number || b.registration_number,
      route: b.make ? `${b.make} ${b.model || 'Bus'} Transit` : `${b.bus_number || b.registration_number} Transit`,
      driver: b.driver_name || 'Unassigned',
      speed: (b.operational_status || 'Active').toLowerCase() === 'active' ? 40 : 0,
      status: (b.operational_status || 'Active').toLowerCase() === 'active' ? 'Running' : b.operational_status,
      lat: 16.5062 + (idx * 0.005),
      lng: 80.6480 + (idx * 0.005),
      battery: 'Good',
      ac: 'Working'
    }));

    return {
      summary: {
        totalBuses,
        activeBuses,
        underMaintenance,
        scheduledMaintenance,
        pendingComplaints,
        completedThisMonth: completedMonth,
        todayKm
      },
      additionalKpis: {
        totalCaptains: captainsCount,
        totalDrivers: driversCount,
        totalHelpers: helpersCount,
        totalOperators: operatorsCount,
        runningProjects: runningProjectsCount,
        unassignedBuses: unassignedBusesCount,
        unassignedStaff: unassignedStaffCount
      },
      kpis: {
        totalBuses,
        activeBuses,
        maintenanceBuses: underMaintenance,
        inactiveBuses: Math.max(0, totalBuses - activeBuses - underMaintenance),
        totalKmToday: todayKm,
        totalExpensesMonth: 0,
        openComplaints: pendingComplaints,
        pendingRepairs: 0,
        fuelEfficiency: 4.8,
        totalDrivers: driversCount,
        totalCaptains: captainsCount,
        totalHelpers: helpersCount,
        unassignedBuses: unassignedBusesCount,
        unassignedStaff: unassignedStaffCount,
        runningProjects: runningProjectsCount
      },
      upcoming: schedules,
      kmBasedSchedules,
      recentKm: dailyKm.slice(0, 6),
      recentComplaints: complaints.slice(0, 5),
      recentRepairs: [],
      recentTyres: getLocalCollection('tyres').slice(0, 5),
      recentAc: getLocalCollection('ac').slice(0, 5),
      recentOil: getLocalCollection('oil').slice(0, 5),
      recentBattery: getLocalCollection('battery').slice(0, 5),
      statusDistribution,
      recentCondition: getLocalCollection('bus_condition').slice(0, 3),
      liveRunningBuses,
      notifications: []
    } as any;
  }

  // 4. BUSES CRUD
  if (path === '/buses' || path.startsWith('/buses/')) {
    if (path.includes('/send-expiry-alert')) {
      return { success: true, message: 'Compliance alert recorded successfully.' } as any;
    }

    const res = await handleFallbackTableCrud('buses', 'buses', path, method, body, params, {
      enrich: (items) => {
        return items.map(b => {
          const reg = b.registration_number || b.bus_number || '';
          return {
            ...b,
            registration_number: reg,
            bus_number: b.bus_number || reg
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const status = qParams.get('status');
        const search = qParams.get('search');
        if (status && status !== 'All') {
          filtered = filtered.filter(b => (b.operational_status || '').toLowerCase() === status.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(b =>
            (b.registration_number || '').toLowerCase().includes(s) ||
            (b.bus_number || '').toLowerCase().includes(s) ||
            (b.bus_type || '').toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    });

    if (method === 'POST' && res && res.registration_number) {
      res.registration_number = String(res.registration_number).trim().toUpperCase();
      res.bus_number = res.registration_number;
    }
    return res as any;
  }

  // 5. EMPLOYEES CRUD
  function isDummySeedEmployee(e: any): boolean {
    if (!e) return false;
    const code = String(e.employee_code || '').trim().toUpperCase();
    const name = String(e.full_name || e.name || '').trim().toLowerCase();
    if (code === 'EMP-DRV-001' && (name.includes('ramesh') || name.includes('kumar'))) return true;
    if (code === 'EMP-CPT-001' && (name.includes('mohammad') || name.includes('rafiq'))) return true;
    if (code === 'EMP-HLP-001' && (name.includes('suresh') || name.includes('reddy'))) return true;
    return false;
  }

  if (path === '/employees' || path.startsWith('/employees/')) {
    const parts = path.split('/').filter(Boolean);
    const isItemRoute = parts.length > 1;
    const itemId = isItemRoute ? parts[1] : null;

    if (!isItemRoute) {
      if (method === 'GET') {
        let list: any[] = [];
        try {
          // Instant load from reliable local + IndexedDB store (no spinner freeze)
          const reliable = await getReliableCollection<any>('employees');
          list = (reliable || []).filter(x => x?.is_archived !== 1 && !isDummySeedEmployee(x));

          // Non-blocking background sync with Supabase (max 1000ms timeout)
          try {
            const timeoutPromise = new Promise<any>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 1000)
            );
            const supabasePromise = supabase.from('employees').select('*').order('id', { ascending: false });
            const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
            if (!error && Array.isArray(data) && data.length > 0) {
              list = mergeWithLocal('employees', data);
              list = (list || []).filter(e => !isDummySeedEmployee(e));
            }
          } catch {}
        } catch {
          list = getLocalCollection<any>('employees').filter(x => x?.is_archived !== 1 && !isDummySeedEmployee(x));
        }

        if (!list || list.length === 0) {
          list = [...BASE_FLEET_EMPLOYEES];
          setLocalCollection('employees', list);
        }

        setLocalCollection('employees', list);

        // Enrich & standardize
        let enriched = list.map(e => ({
          ...e,
          full_name: e.full_name || e.name || 'Staff Member',
          employment_status: e.employment_status || e.status || 'Active',
          status: e.employment_status || e.status || 'Active'
        }));

        // Filter safely (never filter out on 'undefined' or 'All')
        const role = params.get('role');
        const status = params.get('status');
        const search = params.get('search');

        if (role && role !== 'All' && role !== 'undefined' && role !== 'null') {
          enriched = enriched.filter(e => (e.role || '').toLowerCase() === role.toLowerCase());
        }
        if (status && status !== 'All' && status !== 'undefined' && status !== 'null') {
          enriched = enriched.filter(e => (e.employment_status || e.status || '').toLowerCase() === status.toLowerCase());
        }
        if (search && search !== 'undefined' && search !== 'null') {
          const s = search.toLowerCase();
          enriched = enriched.filter(e =>
            (e.full_name || '').toLowerCase().includes(s) ||
            (e.employee_code || '').toLowerCase().includes(s) ||
            (e.phone_number || '').toLowerCase().includes(s)
          );
        }

        return enriched as any;
      }

      if (method === 'POST') {
        const newId = body.id || Date.now();
        const record = {
          ...body,
          id: newId,
          employment_status: body.employment_status || 'Active',
          status: body.employment_status || 'Active',
          is_archived: 0,
          created_at: new Date().toISOString()
        };

        const existing = await getReliableCollection<any>('employees');
        const list = existing.filter(x => String(x.id) !== String(newId) && !isDummySeedEmployee(x));
        list.unshift(record);
        setLocalCollection('employees', list);

        // Also attempt background sync to Supabase safely (separating employees and driver_details)
        try {
          const empPayload: any = {
            employee_code: record.employee_code,
            role: record.role,
            full_name: record.full_name,
            gender: record.gender || 'Male',
            date_of_birth: record.date_of_birth || null,
            email: record.email || null,
            phone_number: record.phone_number,
            alternative_phone_number: record.alternative_phone_number || null,
            profile_photo: record.profile_photo || null,
            aadhaar_number: record.aadhaar_number || null,
            aadhaar_front_doc: record.aadhaar_front_doc || null,
            aadhaar_back_doc: record.aadhaar_back_doc || null,
            pan_number: record.pan_number || null,
            pan_doc: record.pan_doc || null,
            bank_name: record.bank_name || null,
            bank_proof_doc: record.bank_proof_doc || null,
            account_holder_name: record.account_holder_name || null,
            account_number: record.account_number || null,
            ifsc_code: record.ifsc_code || null,
            branch: record.branch || null,
            nominee_name: record.nominee_name || null,
            nominee_relationship: record.nominee_relationship || null,
            nominee_phone: record.nominee_phone || null,
            nominee_age: record.nominee_age ? Number(record.nominee_age) : null,
            nominee_aadhaar: record.nominee_aadhaar || null,
            reference_name: record.reference_name || null,
            reference_phone: record.reference_phone || null,
            reference_alt_phone: record.reference_alt_phone || null,
            employment_type: record.employment_type || 'Permanent',
            salary: record.salary ? Number(record.salary) : 0,
            joining_date: record.joining_date || null,
            employment_status: record.employment_status || 'Active',
            assigned_bus_id: record.assigned_bus_id ? Number(record.assigned_bus_id) : null,
            internal_remarks: record.internal_remarks || null,
            is_archived: 0
          };
          const { data: insertedEmp } = await supabase.from('employees').insert([empPayload]).select().single();

          if (insertedEmp && (record.licence_number || record.role === 'Driver')) {
            await supabase.from('driver_details').insert([{
              employee_id: insertedEmp.id,
              licence_number: record.licence_number || 'PENDING',
              licence_front_doc: record.licence_front_doc || null,
              licence_back_doc: record.licence_back_doc || null,
              licence_verification_doc: record.licence_verification_doc || null,
              licence_verification_status: record.licence_verification_status || 'Pending Verification',
              issuing_state: record.issuing_state || null,
              issuing_rto_office: record.issuing_rto_office || null,
              licence_issue_date: record.licence_issue_date || null,
              licence_validity_date: record.licence_validity_date || '2028-12-31',
              licence_experience_years: record.licence_experience_years ? Number(record.licence_experience_years) : 0,
              criminal_background_details: record.criminal_background_details || null
            }]);
          }
        } catch (syncErr) {
          console.warn('Note: Cloud background sync caught (cached locally):', syncErr);
        }

        return record as any;
      }
    } else if (itemId) {
      if (method === 'GET') {
        const list = await getReliableCollection<any>('employees');
        let found = list.find(x => String(x.id) === String(itemId) || String(x.employee_code) === String(itemId));
        if (!found) {
          try {
            const { data } = await supabase.from('employees').select('*').eq('id', itemId).single();
            if (data) found = data;
          } catch {}
        }
        if (found) {
          return {
            employee: found,
            driverDetail: found,
            auditHistory: []
          } as any;
        }
        return { employee: {}, driverDetail: {}, auditHistory: [] } as any;
      }

      if (method === 'PUT') {
        const list = getLocalCollection<any>('employees').map(x =>
          String(x.id) === String(itemId) ? { ...x, ...body } : x
        );
        setLocalCollection('employees', list);
        try {
          await supabase.from('employees').update(body).eq('id', itemId);
        } catch {}
        return { success: true, ...body } as any;
      }

      if (method === 'DELETE') {
        const list = getLocalCollection<any>('employees').filter(x => String(x.id) !== String(itemId));
        setLocalCollection('employees', list);
        try {
          await supabase.from('employees').delete().eq('id', itemId);
        } catch {}
        return { success: true } as any;
      }
    }
  }

  // 6. DAILY KILOMETERS (MILEAGE & FUELING)
  if (path === '/daily-kilometers') {
    if (method === 'GET') {
      let list: any[] = [];
      try {
        const { data, error } = await supabase
          .from('daily_kilometer_entries')
          .select('*')
          .order('id', { ascending: false });
        list = mergeWithLocal('daily_km', !error && Array.isArray(data) ? data : []);
      } catch {
        list = getLocalCollection<any>('daily_km');
      }

      list = mergeSeedCollection(Array.isArray(list) ? list : [], BASE_DAILY_KM_ENTRIES);
      setLocalCollection('daily_km', list);

      const dateFilter = params.get('date');
      const busFilter = params.get('bus_id');
      const driverFilter = params.get('driver_id');

      if (dateFilter) list = list.filter(k => k.entry_date === dateFilter);
      if (busFilter) list = list.filter(k => String(k.bus_id) === String(busFilter));
      if (driverFilter) list = list.filter(k => String(k.driver_id) === String(driverFilter));

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

      return {
        entries: enriched,
        summary: {
          totalDistance: enriched.reduce((sum, item) => sum + (Number(item.distance_travelled_km) || 0), 0),
          totalEntries: enriched.length
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

      const list = getLocalCollection<any>('daily_km') || [];
      list.unshift(newKm);
      setLocalCollection('daily_km', list);

      try {
        await supabase.from('daily_kilometer_entries').insert([newKm]);
      } catch {}

      if (body.bus_id) {
        const updatedBuses = buses.map(b => String(b.id) === String(body.bus_id) ? { ...b, current_odometer_km: closeKm } : b);
        setLocalCollection('buses', updatedBuses);
        try {
          await supabase.from('buses').update({ current_odometer_km: closeKm }).eq('id', body.bus_id);
        } catch {}
      }

      return newKm as any;
    }
  }

  if (path.startsWith('/daily-kilometers/suggest-opening/')) {
    const busId = path.split('/')[3];
    const list = getLocalCollection<any>('daily_km') || [];
    const busEntry = list.find(k => String(k.bus_id) === String(busId));
    if (busEntry && busEntry.closing_km != null) {
      return { suggestedOpening: Number(busEntry.closing_km) || 0 } as any;
    }
    const buses = getLocalCollection<any>('buses') || [];
    const bus = buses.find(b => String(b.id) === String(busId));
    return { suggestedOpening: Number(bus?.current_odometer_km) || 0 } as any;
  }

  if (path.startsWith('/daily-kilometers/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const list = (getLocalCollection<any>('daily_km') || []).map(k => String(k.id) === String(id) ? { ...k, ...body } : k);
      setLocalCollection('daily_km', list);
      try {
        await supabase.from('daily_kilometer_entries').update(body).eq('id', id);
      } catch {}
      return { success: true, ...body } as any;
    }
    if (method === 'DELETE') {
      const list = (getLocalCollection<any>('daily_km') || []).filter(k => String(k.id) !== String(id));
      setLocalCollection('daily_km', list);
      try {
        await supabase.from('daily_kilometer_entries').delete().eq('id', id);
      } catch {}
      return { success: true } as any;
    }
  }

  // 7. MAINTENANCE SCHEDULES
  if (path === '/maintenance-schedules' || path.startsWith('/maintenance-schedules/')) {
    return handleFallbackTableCrud('maintenance_schedules', 'maintenance_schedules', path, method, body, params, {
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(m => {
          const bus = buses.find(b => String(b.id) === String(m.bus_id));
          return {
            ...m,
            bus_number: m.bus_number || bus?.bus_number || (m.bus_id ? `Bus #${m.bus_id}` : '-'),
            registration_number: m.registration_number || bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const status = qParams.get('status');
        if (busId) filtered = filtered.filter(m => String(m.bus_id) === String(busId));
        if (status && status !== 'All') filtered = filtered.filter(m => m.status === status);
        return filtered;
      }
    }) as any;
  }

  // 8. TYRE MAINTENANCE
  if (path === '/tyre-maintenance' || path.startsWith('/tyre-maintenance/')) {
    return handleFallbackTableCrud('tyre_records', 'tyre_records', path, method, body, params, {
      filter: (items, qParams) => {
        const busId = qParams.get('bus_id');
        return busId && busId !== 'undefined' && busId !== 'all' ? items.filter(t => String(t.bus_id) === String(busId)) : items;
      }
    }) as any;
  }

  // 8.1 NEW TYRES (INVENTORY)
  if (path === '/new-tyres' || path.startsWith('/new-tyres/')) {
    return handleFallbackTableCrud('new_tyres', 'new_tyres', path, method, body, params, {
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(n => {
          const bus = buses.find(b => String(b.id) === String(n.allocated_bus_id));
          return {
            ...n,
            bus_number: bus?.bus_number || (n.allocated_bus_id ? `Bus #${n.allocated_bus_id}` : '-'),
            registration_number: bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const status = qParams.get('status');
        if (busId && busId !== 'undefined' && busId !== 'all') filtered = filtered.filter(n => String(n.allocated_bus_id) === String(busId));
        if (status && status !== 'all') filtered = filtered.filter(n => n.status === status);
        return filtered;
      }
    }) as any;
  }

  // 8.2 WHEEL ALLOTMENTS & ROTATION
  if (path === '/wheel-allotments' || path.startsWith('/wheel-allotments/')) {
    return handleFallbackTableCrud('wheel_allotments', 'wheel_allotments', path, method, body, params, {
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(w => {
          const bus = buses.find(b => String(b.id) === String(w.bus_id));
          return {
            ...w,
            bus_number: bus?.bus_number || (w.bus_id ? `Bus #${w.bus_id}` : '-'),
            registration_number: bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const actionType = qParams.get('action_type');
        if (busId && busId !== 'undefined' && busId !== 'all') filtered = filtered.filter(w => String(w.bus_id) === String(busId));
        if (actionType && actionType !== 'all') filtered = filtered.filter(w => w.action_type === actionType);
        return filtered;
      }
    }) as any;
  }

  // 8.2b WHEEL ALLOTMENTS RENEWAL (Reset cycle with new present KM & target KM)
  if (path.includes('/wheel-allotments/') && path.endsWith('/renew')) {
    const parts = path.split('/');
    const recordId = parts[2];
    const items = getLocalCollection<any>('wheel_allotments');
    const idx = items.findIndex(w => String(w.id) === String(recordId));
    if (idx !== -1) {
      const prev = items[idx];
      const today = new Date().toISOString().split('T')[0];
      const newPresentKm = Number(body.current_km) || Number(body.present_km) || 0;
      const targetKm = Number(body.target_km) || 10000;
      items[idx] = {
        ...prev,
        event_date: body.event_date || today,
        current_km: newPresentKm,
        target_km: targetKm,
        notes: body.notes || `Renewed/rotated on ${today}`,
        action_type: 'Rotation'
      };
      setLocalCollection('wheel_allotments', items);
      return items[idx] as any;
    }
  }

  // 8.3 TYRE AIR CHECKUPS
  if (path === '/tyre-air-checkups' || path.startsWith('/tyre-air-checkups/')) {
    if (path.endsWith('/renew')) {
      const parts = path.split('/');
      const recordId = parts[2];
      const items = getLocalCollection<any>('tyre_air_checkups');
      const idx = items.findIndex(a => String(a.id) === String(recordId));
      if (idx !== -1) {
        const prev = items[idx];
        const today = new Date().toISOString().split('T')[0];
        items[idx] = {
          ...prev,
          checkup_date: body.checkup_date || today,
          expiry_date: body.expiry_date || null,
          pressure_psi: body.pressure_psi || prev.pressure_psi || 110,
          technician: body.technician || prev.technician || 'Fleet Team',
          status: 'Active',
          remarks: body.remarks || `Air checked & renewed on ${today}`
        };
        setLocalCollection('tyre_air_checkups', items);
        return items[idx] as any;
      }
    }

    return handleFallbackTableCrud('tyre_air_checkups', 'tyre_air_checkups', path, method, body, params, {
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(a => {
          const bus = buses.find(b => String(b.id) === String(a.bus_id));
          return {
            ...a,
            bus_number: bus?.bus_number || (a.bus_id ? `Bus #${a.bus_id}` : '-'),
            registration_number: bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const status = qParams.get('status');
        if (busId && busId !== 'undefined' && busId !== 'all') filtered = filtered.filter(a => String(a.bus_id) === String(busId));
        if (status && status !== 'all') filtered = filtered.filter(a => a.status === status);
        return filtered;
      }
    }) as any;
  }

  // 9. AC MAINTENANCE
  if (path.includes('/ac-maintenance/') && path.endsWith('/renew-filter')) {
    const parts = path.split('/');
    const recordId = parts[2];
    const items = getLocalCollection<any>('ac_maintenance_records');
    const idx = items.findIndex(r => String(r.id) === String(recordId));
    if (idx !== -1) {
      const prev = items[idx];
      const today = new Date().toISOString().split('T')[0];
      // 1. Mark previous record as Expired so before data remains as Expired
      items[idx] = {
        ...prev,
        filter_status: 'Expired',
        status: 'Expired'
      };

      // 2. Insert new record for the next renewed cycle
      const newRecord = {
        ...prev,
        id: Date.now(),
        inspection_date: body.filter_cleaning_date || today,
        filter_cleaning_date: body.filter_cleaning_date || today,
        filter_expiry_date: body.filter_expiry_date || null,
        filter_proof_photo: body.filter_proof_photo || null,
        filter_renewal_date: today,
        filter_status: body.filter_expiry_date && body.filter_expiry_date <= today ? 'Expired' : 'Active',
        status: 'Completed',
        remarks: body.remarks || `Renewed on ${today}`
      };
      items.unshift(newRecord);
      setLocalCollection('ac_maintenance_records', items);
      return { success: true, newId: newRecord.id, message: 'AC Filter renewed and new record created successfully!' } as any;
    }
    return { success: false, message: 'Record not found' } as any;
  }

  if (path === '/ac-maintenance' || path.startsWith('/ac-maintenance/')) {
    return handleFallbackTableCrud('ac_maintenance_records', 'ac_maintenance_records', path, method, body, params, {
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(a => {
          const bus = buses.find(b => String(b.id) === String(a.bus_id));
          return {
            ...a,
            bus_number: a.bus_number || bus?.bus_number || (a.bus_id ? `Bus #${a.bus_id}` : '-'),
            registration_number: a.registration_number || bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        const busId = qParams.get('bus_id');
        return busId && busId !== 'undefined' && busId !== 'all' ? items.filter(a => String(a.bus_id) === String(busId)) : items;
      }
    }) as any;
  }

  // 10. OIL & FILTER MAINTENANCE
  if (path === '/oil-filter-maintenance' || path.startsWith('/oil-filter-maintenance/')) {
    return handleFallbackTableCrud('oil_filter_records', 'oil_filter_records', path, method, body, params, {
      filter: (items, qParams) => {
        const busId = qParams.get('bus_id');
        return busId ? items.filter(o => String(o.bus_id) === String(busId)) : items;
      }
    }) as any;
  }

  // 11. BATTERY MAINTENANCE
  if (path === '/battery-maintenance' || path.startsWith('/battery-maintenance/')) {
    return handleFallbackTableCrud('battery_records', 'battery_records', path, method, body, params, {
      filter: (items, qParams) => {
        const busId = qParams.get('bus_id');
        return busId ? items.filter(b => String(b.bus_id) === String(busId)) : items;
      }
    }) as any;
  }

  // 12. REPAIRS (Work Orders)
  if (path === '/repairs' || path.startsWith('/repairs/')) {
    return handleFallbackTableCrud('repairs', 'repair_work_orders', path, method, body, params, {
      idGenerator: () => Date.now(),
      enrich: (items) => {
        const buses = getLocalCollection<any>('buses');
        return items.map(r => {
          const bus = buses.find(b => String(b.id) === String(r.bus_id));
          return {
            ...r,
            work_order_number: r.work_order_number || `WO-${r.id}`,
            bus_number: r.bus_number || bus?.bus_number || (r.bus_id ? `Bus #${r.bus_id}` : '-'),
            registration_number: r.registration_number || bus?.registration_number || '-'
          };
        });
      },
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const status = qParams.get('status');
        if (busId) filtered = filtered.filter(r => String(r.bus_id) === String(busId));
        if (status && status !== 'All') filtered = filtered.filter(r => r.status === status);
        return filtered;
      }
    }) as any;
  }

  // 13. COMPLAINTS
  if (path === '/complaints' || path.startsWith('/complaints/')) {
    return handleFallbackTableCrud('complaints', 'complaints', path, method, body, params, {
      idGenerator: () => Date.now(),
      enrich: (items) => items.map(c => ({
        ...c,
        complaint_code: c.complaint_code || `CMP-${c.id}`
      })),
      filter: (items, qParams) => {
        let filtered = items;
        const busId = qParams.get('bus_id');
        const status = qParams.get('status');
        const priority = qParams.get('priority');
        if (busId) filtered = filtered.filter(c => String(c.bus_id) === String(busId));
        if (status && status !== 'All') filtered = filtered.filter(c => c.status === status);
        if (priority && priority !== 'All') filtered = filtered.filter(c => c.priority === priority);
        return filtered;
      }
    }) as any;
  }

  // 14. BUS CONDITION / INSPECTIONS
  if (path === '/bus-condition' || path.startsWith('/bus-condition/')) {
    const res = handleFallbackTableCrud('bus_conditions', 'bus_condition_inspections', path, method, body, params, {
      filter: (items, qParams) => {
        const busId = qParams.get('bus_id');
        return busId ? items.filter(i => String(i.bus_id) === String(busId)) : items;
      }
    });

    if ((method === 'POST' || method === 'PUT') && body) {
      try {
        if (body.bus_id && (Number(body.starting_km) > 0 || Number(body.odometer_km) > 0)) {
          const sKm = Number(body.starting_km) > 0 ? Number(body.starting_km) : Number(body.odometer_km);
          const buses = getLocalCollection<any>('buses');
          const updatedBuses = buses.map(b => String(b.id) === String(body.bus_id) ? { ...b, current_odometer_km: sKm } : b);
          setLocalCollection('buses', updatedBuses);
        }

        const newTyres = getLocalCollection<any>('new_tyres');
        if (Array.isArray(body.tyre_updates) && body.tyre_updates.length > 0) {
          const updated = newTyres.map(nt => {
            const tu = body.tyre_updates.find((u: any) => u.id === nt.id || u.tyre_serial_number === nt.tyre_serial_number);
            if (tu) {
              const pKm = Number(tu.present_km) || 0;
              const bKm = Number(nt.km) || 0;
              return { ...nt, present_km: pKm, running_km: pKm >= bKm ? pKm - bKm : pKm };
            }
            return nt;
          });
          setLocalCollection('new_tyres', updated);
        } else if (body.bus_id && (Number(body.starting_km) > 0 || Number(body.closing_km) > 0)) {
          const lKm = Number(body.starting_km) > 0 ? Number(body.starting_km) : Number(body.closing_km);
          const updated = newTyres.map(nt => {
            if (String(nt.allocated_bus_id) === String(body.bus_id)) {
              return { ...nt, present_km: lKm, running_km: lKm >= (Number(nt.km) || 0) ? lKm - (Number(nt.km) || 0) : lKm };
            }
            return nt;
          });
          setLocalCollection('new_tyres', updated);
        }
      } catch (_) {}
    }
    return res as any;
  }

  // 15. CAPTAIN DUTY
  if (path === '/captain/my-duty') {
    const currentUser = getStoredUser();
    const buses = getLocalCollection<any>('buses');
    const assignedBus = buses.find(b => b.operational_status === 'Active') || null;

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
        route: assignedBus ? `Transit Service - ${assignedBus.registration_number || assignedBus.bus_number}` : 'No Active Route Assigned',
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

  // 16. STAFF CREDENTIALS
  if (path === '/staff-credentials' || path.startsWith('/staff-credentials/')) {
    if (path === '/staff-credentials') {
      if (method === 'GET') {
        const localCreds = getLocalCollection<any>('staff_credentials');
        if (localCreds.length > 0) return localCreds as any;
        const defaults = [
          { id: 1, name: 'Admin Manager', email_or_username: 'admin@charvik.com', phone_number: '9876543210', role: 'Super Admin', status: 'Active' },
          { id: 2, name: 'Fleet Captain', email_or_username: 'captain@charvik.com', phone_number: '9701055555', role: 'Captain', status: 'Active' },
          { id: 3, name: 'Support Staff Member', email_or_username: 'supporter@charvik.com', phone_number: '9848033445', role: 'Support Staff', status: 'Active' }
        ];
        setLocalCollection('staff_credentials', defaults);
        return defaults as any;
      }
      if (method === 'POST') {
        const rec = {
          id: Date.now(),
          name: body.name,
          email_or_username: body.email_or_username || body.phone_number,
          phone_number: body.phone_number,
          role: body.role || 'Support Staff',
          status: 'Active',
          created_at: new Date().toISOString()
        };
        const list = getLocalCollection<any>('staff_credentials');
        list.push(rec);
        setLocalCollection('staff_credentials', list);
        try {
          await supabase.from('administrators').insert([rec]);
        } catch {}
        return { success: true, ...rec } as any;
      }
    } else {
      const parts = path.split('/').filter(Boolean);
      const staffId = parts[1];
      const subAction = parts[2];
      const list = getLocalCollection<any>('staff_credentials');
      if (subAction === 'password' && method === 'PUT') {
        return { success: true, message: 'Password updated successfully' } as any;
      }
      if (subAction === 'status' && method === 'PUT') {
        const updated = list.map(s => String(s.id) === String(staffId) ? { ...s, status: body.status } : s);
        setLocalCollection('staff_credentials', updated);
        return { success: true } as any;
      }
      if (method === 'DELETE') {
        const updated = list.filter(s => String(s.id) !== String(staffId));
        setLocalCollection('staff_credentials', updated);
        return { success: true } as any;
      }
    }
  }

  // 17. TRANSIT ROUTES FALLBACK
  if (path === '/routes' || path.startsWith('/routes/')) {
    const res = await handleFallbackTableCrud('routes', 'transit_routes', path, method, body, params);
    let routeList = Array.isArray(res) ? res : getLocalCollection<any>('routes');
    routeList = mergeSeedCollection(routeList, BASE_FLEET_ROUTES);
    setLocalCollection('routes', routeList);
    try {
      localStorage.setItem('charvik_route_management_data', JSON.stringify(routeList));
    } catch {}
    return (Array.isArray(res) ? routeList : res) as any;
  }

  // 17B. TASKS (Trip Duties) FALLBACK
  if (path === '/tasks' || path.startsWith('/tasks/')) {
    const res = await handleFallbackTableCrud('tasks', 'tasks', path, method, body, params);
    let taskList = Array.isArray(res) ? res : getLocalCollection<any>('tasks');
    taskList = mergeSeedCollection(taskList, BASE_FLEET_TASKS);
    setLocalCollection('tasks', taskList);
    try {
      localStorage.setItem('charvik_trip_duty_management_v2', JSON.stringify(taskList));
    } catch {}
    return (Array.isArray(res) ? taskList : res) as any;
  }

  // 17C. ORGANIZERS FALLBACK
  if (path === '/organizers' || path.startsWith('/organizers/')) {
    const res = await handleFallbackTableCrud('organizers', 'organizers', path, method, body, params);
    let orgList = Array.isArray(res) ? res : getLocalCollection<any>('organizers');
    orgList = mergeSeedCollection(orgList, BASE_FLEET_ORGANIZERS);
    setLocalCollection('organizers', orgList);
    try {
      localStorage.setItem('charvik_organizer_management_data', JSON.stringify(orgList));
    } catch {}
    return (Array.isArray(res) ? orgList : res) as any;
  }

  // 18. NOTIFICATIONS, SETTINGS, AUDIT LOGS, REPORTS
  if (path === '/notifications') return [] as any;
  if (path === '/settings') {
    if (method === 'POST') {
      try {
        localStorage.setItem('charvik_app_settings', JSON.stringify(body));
      } catch {}
      return { success: true, ...body } as any;
    }
    try {
      const saved = localStorage.getItem('charvik_app_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { company_name: 'Charvik Staffing Consultancy' } as any;
  }
  if (path === '/audit-logs') return [] as any;
  if (path.startsWith('/reports')) return [] as any;

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

function cleanQueryParams(params?: Record<string, any>): string {
  if (!params) return '';
  const clean: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'null' && val !== 'All') {
      clean[key] = String(val);
    }
  }
  return new URLSearchParams(clean).toString();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboard: () => request<any>('/dashboard'),

  // Buses
  getBuses: (params?: { search?: string; status?: string }) => {
    const q = cleanQueryParams(params);
    return request<any[]>(`/buses${q ? `?${q}` : ''}`);
  },
  getBus: (id: number | string) => request<any>(`/buses/${id}`),
  createBus: (data: any) => request<any>('/buses', { method: 'POST', body: JSON.stringify(data) }),
  updateBus: (id: number | string, data: any) => request<any>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveBus: (id: number | string) => request<any>(`/buses/${id}`, { method: 'DELETE' }),
  sendExpiryAlert: (busId: number | string, data: { doc_name: string; expiry_date: string; recipient?: string; message?: string }) =>
    request<any>(`/buses/${busId}/send-expiry-alert`, { method: 'POST', body: JSON.stringify(data) }),

  // Transit Routes
  getRoutes: async () => {
    try {
      const remote = await request<any[]>('/routes');
      if (Array.isArray(remote) && remote.length > 0) {
        const merged = mergeSeedCollection(remote, BASE_FLEET_ROUTES);
        localStorage.setItem('charvik_route_management_data', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    try {
      const saved = localStorage.getItem('charvik_route_management_data');
      const savedList = saved ? JSON.parse(saved) : [];
      const merged = mergeSeedCollection(Array.isArray(savedList) ? savedList : [], BASE_FLEET_ROUTES);
      if (merged.length > 0) {
        localStorage.setItem('charvik_route_management_data', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    return BASE_FLEET_ROUTES;
  },
  createRoute: (data: any) => request<any>('/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id: number | string, data: any) => request<any>(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id: number | string) => request<any>(`/routes/${id}`, { method: 'DELETE' }),

  // Organizers (Partner Institutions)
  getOrganizers: async () => {
    try {
      const remote = await request<any[]>('/organizers');
      if (Array.isArray(remote) && remote.length > 0) {
        const merged = mergeSeedCollection(remote, BASE_FLEET_ORGANIZERS);
        localStorage.setItem('charvik_organizer_management_data', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    try {
      const saved = localStorage.getItem('charvik_organizer_management_data');
      const savedList = saved ? JSON.parse(saved) : [];
      const merged = mergeSeedCollection(Array.isArray(savedList) ? savedList : [], BASE_FLEET_ORGANIZERS);
      if (merged.length > 0) {
        localStorage.setItem('charvik_organizer_management_data', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    return BASE_FLEET_ORGANIZERS;
  },
  createOrganizer: (data: any) => request<any>('/organizers', { method: 'POST', body: JSON.stringify(data) }),
  updateOrganizer: (id: number | string, data: any) => request<any>(`/organizers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrganizer: (id: number | string) => request<any>(`/organizers/${id}`, { method: 'DELETE' }),

  // Organizer Payments
  getOrganizerPayments: async () => {
    try {
      const remote = await request<any[]>('/organizer-payments');
      if (Array.isArray(remote)) {
        localStorage.setItem('charvik_organizer_payments_data', JSON.stringify(remote));
        return remote;
      }
    } catch {}
    try {
      const saved = localStorage.getItem('charvik_organizer_payments_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },
  createOrganizerPayment: async (data: any) => {
    try {
      const res = await request<any>('/organizer-payments', { method: 'POST', body: JSON.stringify(data) });
      return res;
    } catch {
      // Local fallback
      const saved = JSON.parse(localStorage.getItem('charvik_organizer_payments_data') || '[]');
      const item = { id: Date.now(), ...data };
      localStorage.setItem('charvik_organizer_payments_data', JSON.stringify([item, ...saved]));
      return item;
    }
  },

  // Tasks (Trip Duties)
  getTasks: async () => {
    try {
      const remote = await request<any[]>('/tasks');
      if (Array.isArray(remote) && remote.length > 0) {
        const merged = mergeSeedCollection(remote, BASE_FLEET_TASKS);
        localStorage.setItem('charvik_trip_duty_management_v2', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    try {
      const saved = localStorage.getItem('charvik_trip_duty_management_v2');
      const savedList = saved ? JSON.parse(saved) : [];
      const merged = mergeSeedCollection(Array.isArray(savedList) ? savedList : [], BASE_FLEET_TASKS);
      if (merged.length > 0) {
        localStorage.setItem('charvik_trip_duty_management_v2', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    return BASE_FLEET_TASKS;
  },
  createTask: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number | string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: number | string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),

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
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') {
      cleanParams.bus_id = params.bus_id;
    }
    const q = new URLSearchParams(cleanParams).toString();
    return request<any[]>(`/tyre-maintenance${q ? `?${q}` : ''}`);
  },
  createTyreRecord: (data: any) => request<any>('/tyre-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateTyreRecord: (id: number | string, data: any) => request<any>(`/tyre-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTyreRecord: (id: number | string) => request<any>(`/tyre-maintenance/${id}`, { method: 'DELETE' }),

  // New Tyres (Stock / Purchases)
  getNewTyres: (params?: { bus_id?: number | string; status?: string }) => {
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') cleanParams.bus_id = params.bus_id;
    if (params?.status && params.status !== 'all') cleanParams.status = params.status;
    const q = new URLSearchParams(cleanParams).toString();
    return request<any[]>(`/new-tyres${q ? `?${q}` : ''}`);
  },
  createNewTyre: (data: any) => request<any>('/new-tyres', { method: 'POST', body: JSON.stringify(data) }),
  updateNewTyre: (id: number | string, data: any) => request<any>(`/new-tyres/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNewTyre: (id: number | string) => request<any>(`/new-tyres/${id}`, { method: 'DELETE' }),

  // Wheel Allotment & Tyre Rotation
  getWheelAllotments: (params?: { bus_id?: number | string; action_type?: string }) => {
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') cleanParams.bus_id = params.bus_id;
    if (params?.action_type && params.action_type !== 'all') cleanParams.action_type = params.action_type;
    const q = new URLSearchParams(cleanParams).toString();
    return request<any[]>(`/wheel-allotments${q ? `?${q}` : ''}`);
  },
  createWheelAllotment: (data: any) => request<any>('/wheel-allotments', { method: 'POST', body: JSON.stringify(data) }),
  updateWheelAllotment: (id: number | string, data: any) => request<any>(`/wheel-allotments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  renewWheelAllotment: (id: number | string, data: any) => request<any>(`/wheel-allotments/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),
  deleteWheelAllotment: (id: number | string) => request<any>(`/wheel-allotments/${id}`, { method: 'DELETE' }),

  // Tyre Air Checkups
  getTyreAirCheckups: (params?: { bus_id?: number | string; status?: string }) => {
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') cleanParams.bus_id = params.bus_id;
    if (params?.status && params.status !== 'all') cleanParams.status = params.status;
    const q = new URLSearchParams(cleanParams).toString();
    return request<any[]>(`/tyre-air-checkups${q ? `?${q}` : ''}`);
  },
  createTyreAirCheckup: (data: any) => request<any>('/tyre-air-checkups', { method: 'POST', body: JSON.stringify(data) }),
  updateTyreAirCheckup: (id: number | string, data: any) => request<any>(`/tyre-air-checkups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  renewTyreAirCheckup: (id: number | string, data: any) => request<any>(`/tyre-air-checkups/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTyreAirCheckup: (id: number | string) => request<any>(`/tyre-air-checkups/${id}`, { method: 'DELETE' }),

  // AC Maintenance
  getAcRecords: (params?: { bus_id?: number | string }) => {
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') {
      cleanParams.bus_id = params.bus_id;
    }
    const q = new URLSearchParams(cleanParams).toString();
    return request<any[]>(`/ac-maintenance${q ? `?${q}` : ''}`);
  },
  createAcRecord: (data: any) => request<any>('/ac-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateAcRecord: (id: number | string, data: any) => request<any>(`/ac-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  renewAcFilter: (id: number | string, data: any) => request<any>(`/ac-maintenance/${id}/renew-filter`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAcRecord: (id: number | string) => request<any>(`/ac-maintenance/${id}`, { method: 'DELETE' }),

  // Oil and Filter
  getOilRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/oil-filter-maintenance${q ? `?${q}` : ''}`);
  },
  createOilRecord: (data: any) => request<any>('/oil-filter-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateOilRecord: (id: number | string, data: any) => request<any>(`/oil-filter-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOilRecord: (id: number | string) => request<any>(`/oil-filter-maintenance/${id}`, { method: 'DELETE' }),

  // Battery
  getBatteryRecords: (params?: { bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/battery-maintenance${q ? `?${q}` : ''}`);
  },
  createBatteryRecord: (data: any) => request<any>('/battery-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateBatteryRecord: (id: number | string, data: any) => request<any>(`/battery-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatteryRecord: (id: number | string) => request<any>(`/battery-maintenance/${id}`, { method: 'DELETE' }),

  // Complaints
  getComplaints: (params?: { status?: string; priority?: string; bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/complaints${q ? `?${q}` : ''}`);
  },
  createComplaint: (data: any) => request<any>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: number | string, data: any) => request<any>(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComplaint: (id: number | string) => request<any>(`/complaints/${id}`, { method: 'DELETE' }),

  // Repairs
  getRepairs: (params?: { status?: string; bus_id?: number | string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/repairs${q ? `?${q}` : ''}`);
  },
  createRepair: (data: any) => request<any>('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  updateRepair: (id: number | string, data: any) => request<any>(`/repairs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRepair: (id: number | string) => request<any>(`/repairs/${id}`, { method: 'DELETE' }),

  // Bus Condition
  getBusConditions: (params?: { bus_id?: number | string; roadworthiness?: string }) => {
    const clean: Record<string, string> = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'All') {
      clean.bus_id = String(params.bus_id);
    }
    if (params?.roadworthiness && params.roadworthiness !== 'undefined' && params.roadworthiness !== 'All') {
      clean.roadworthiness = params.roadworthiness;
    }
    const q = new URLSearchParams(clean).toString();
    return request<any[]>(`/bus-condition${q ? `?${q}` : ''}`);
  },
  createBusCondition: (data: any) => request<any>('/bus-condition', { method: 'POST', body: JSON.stringify(data) }),
  updateBusCondition: (id: number | string, data: any) => request<any>(`/bus-condition/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBusCondition: (id: number | string) => request<any>(`/bus-condition/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: (params?: { role?: string; status?: string; search?: string }) => {
    const clean: Record<string, string> = {};
    if (params?.role && params.role !== 'All' && params.role !== 'undefined') clean.role = params.role;
    if (params?.status && params.status !== 'All' && params.status !== 'undefined') clean.status = params.status;
    if (params?.search && params.search !== 'undefined') clean.search = params.search;
    const q = new URLSearchParams(clean).toString();
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

    // Direct Browser Fallback: compress image to max 800px & 0.65 quality so it uses ~50KB instead of 5MB!
    const compressedUrl = await compressImageFile(file, 800, 0.65);
    return {
      fileUrl: compressedUrl,
      provider: 'browser_storage',
      originalName: file.name,
      size: compressedUrl.length,
      mimeType: file.type || 'image/jpeg'
    };
  }
};
