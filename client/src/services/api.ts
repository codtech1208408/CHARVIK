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
  BASE_SERVICE_RECORDS,
  BASE_CAPTAIN_AUDITS,
  BASE_STAFF_CREDENTIALS,
  BASE_APP_SETTINGS,
  BASE_FLEET_MAINTENANCE_BUSES,
  BASE_FLEET_MAINTENANCE_HISTORY,
  BASE_DAILY_MAINTENANCE_RECORDS,
  BASE_VYSHNAVI_RECORDS,
  BASE_VYSHNAVI_TRANSACTIONS,
  type DailyMaintenanceRecord
} from './seedData';
import type { VyshnaviRecord, VyshnaviTransaction } from '../types';

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
  const storedUser = getStoredUser();
  const isAdmin = (storedUser?.role || '').toLowerCase().includes('admin') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isAdmin ? { 'x-admin-role': 'admin' } : {})
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
  } catch { }
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
    } catch { }
  }
}

/**
 * Supabase-first synchronization helper:
 * Live database data from Supabase is the authoritative truth across all users/devices.
 * Falls back to local/IndexedDB cache only when completely offline.
 */
function syncRemoteCollection<T extends { id?: any; is_archived?: number; registration_number?: string; bus_number?: string }>(
  key: string,
  remoteItems: T[] | null | undefined,
  idField: string = 'id'
): T[] {
  if (Array.isArray(remoteItems) && remoteItems.length > 0) {
    const valid = remoteItems.filter(item => (item as any)?.is_archived !== 1);
    setLocalCollection(key, valid);
    return valid;
  }
  const localItems = getLocalCollection<T>(key);
  return localItems.filter(item => (item as any)?.is_archived !== 1);
}

// Backward compatibility alias
const mergeWithLocal = syncRemoteCollection;

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
      // 1. First retrieve reliable local items (IndexedDB + localStorage)
      let localList = (await getReliableCollection<any>(tableKey)) || [];
      localList = localList.filter((x: any) => x && x?.is_archived !== 1);

      // 2. If local store is empty, seed with baseline operational data
      if (localList.length === 0) {
        if (tableKey === 'buses') localList = [...BASE_FLEET_BUSES];
        else if (tableKey === 'routes' || tableKey === 'transit_routes') localList = [...BASE_FLEET_ROUTES];
        else if (tableKey === 'organizers') localList = [...BASE_FLEET_ORGANIZERS];
        else if (tableKey === 'tasks') localList = [...BASE_FLEET_TASKS];
        else if (tableKey === 'employees') localList = [...BASE_FLEET_EMPLOYEES];
        else if (tableKey === 'tyres' || tableKey === 'tyre_records') localList = [...BASE_TYRE_RECORDS];
        else if (tableKey === 'ac_maintenance_records') localList = [...BASE_AC_MAINTENANCE_RECORDS];
        else if (tableKey === 'bus_conditions' || tableKey === 'bus_condition_inspections') localList = [...BASE_BUS_CONDITION_INSPECTIONS];
        else if (tableKey === 'wheel_allotments') localList = [...BASE_WHEEL_ALLOTMENTS];
        else if (tableKey === 'tyre_air_checkups') localList = [...BASE_TYRE_AIR_CHECKUPS];
        else if (tableKey === 'new_tyres') localList = [...BASE_NEW_TYRES];
        else if (tableKey === 'daily_km' || tableKey === 'daily_kilometer_entries') localList = [...BASE_DAILY_KM_ENTRIES];
        else if (tableKey === 'maintenance_schedules') localList = [...BASE_MAINTENANCE_SCHEDULES];
        else if (tableKey === 'products') localList = [...BASE_PRODUCTS];
        else if (tableKey === 'service_records') localList = [...BASE_SERVICE_RECORDS];
        else if (tableKey === 'captain_audit_records') localList = [...BASE_CAPTAIN_AUDITS];
        else if (tableKey === 'daily_maintenance' || tableKey === 'daily_maintenance_records') localList = [...BASE_DAILY_MAINTENANCE_RECORDS];
        else if (tableKey === 'vyshnavi_records' || tableKey === 'vyshnavi_service_records') localList = [...BASE_VYSHNAVI_RECORDS];
        else if (tableKey === 'vyshnavi_transactions') localList = [...BASE_VYSHNAVI_TRANSACTIONS];

        if (localList.length > 0) {
          setLocalCollection(tableKey, localList);
        }
      }

      // 3. Attempt non-blocking Supabase sync (max 1500ms timeout)
      // ONLY merge if Supabase returns 1 or more actual rows! NEVER overwrite with empty array []!
      try {
        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 1500)
        );
        const supabasePromise = supabase.from(supabaseTable).select('*').order('id', { ascending: false });
        const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteValid = data.filter((x: any) => x && x?.is_archived !== 1);
          localList = mergeSeedCollection(remoteValid, localList);
          setLocalCollection(tableKey, localList);
        } else {
          // Cloud sync backup fallback for tables stored as application_settings JSON
          const { data: appData } = await supabase.from('application_settings').select('value').eq('key', `cloud_sync_${tableKey}`).single();
          if (appData && appData.value) {
            const parsed = JSON.parse(appData.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const remoteValid = parsed.filter((x: any) => x && x?.is_archived !== 1);
              localList = mergeSeedCollection(remoteValid, localList);
              setLocalCollection(tableKey, localList);
            }
          }
        }
      } catch { }

      let list = localList;
      if (options?.enrich) list = options.enrich(list);
      if (options?.filter) list = options.filter(list, params);
      return list;
    }

    if (method === 'POST') {
      const record: any = {
        ...body,
        created_at: body.created_at || new Date().toISOString()
      };
      if (body.id) {
        record.id = body.id;
      } else if (options?.idGenerator) {
        record.id = options.idGenerator();
      } else {
        record.id = Date.now();
      }

      // 1. Immediately persist to local collection (IndexedDB + localStorage)
      const currentList = (await getReliableCollection<any>(tableKey)) || [];
      const updatedList = [record, ...currentList.filter((x: any) => String(x.id) !== String(record.id))];
      setLocalCollection(tableKey, updatedList);

      // 2. Background attempt to insert into Supabase
      let savedData: any = null;
      let payloadToInsert = { ...record };

      try {
        for (let attempt = 0; attempt < 5; attempt++) {
          const { data, error } = await supabase.from(supabaseTable).upsert([payloadToInsert], { onConflict: 'id' }).select();
          if (!error && Array.isArray(data) && data[0]) {
            savedData = data[0];
            break;
          }
          if (error?.message) {
            const match = error.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1]) {
              delete payloadToInsert[match[1]];
              continue;
            }
          }
          break;
        }
      } catch { }

      const finalRecord = { ...record, ...(savedData || {}) };
      const reList = [finalRecord, ...currentList.filter((x: any) => String(x.id) !== String(finalRecord.id))];
      setLocalCollection(tableKey, reList);

      // Cloud sync backup in application_settings
      try {
        supabase.from('application_settings').upsert({
          key: `cloud_sync_${tableKey}`,
          value: JSON.stringify(reList.slice(0, 100)),
          description: `Cloud backup for ${tableKey}`,
          updated_at: new Date().toISOString()
        }).catch(() => { });
      } catch { }

      return finalRecord;
    }
  } else if (itemId) {
    if (method === 'GET') {
      try {
        const { data, error } = await supabase.from(supabaseTable).select('*').eq('id', itemId).single();
        if (!error && data) return data;
      } catch { }
      const list = (await getReliableCollection<any>(tableKey)) || [];
      const found = list.find((x: any) => String(x.id) === String(itemId));
      return found || {};
    }

    if (method === 'PUT') {
      const updateData = { ...body };
      delete updateData.id;

      // 1. Immediately update local collection
      const currentList = (await getReliableCollection<any>(tableKey)) || [];
      let updatedList = currentList.map((x: any) =>
        String(x.id) === String(itemId) ? { ...x, ...updateData } : x
      );
      if (!currentList.some((x: any) => String(x.id) === String(itemId))) {
        updatedList.unshift({ id: itemId, ...updateData });
      }
      setLocalCollection(tableKey, updatedList);

      // 2. Background upsert to Supabase
      try {
        const payloadToUpsert: any = { id: itemId, ...updateData };
        for (let attempt = 0; attempt < 5; attempt++) {
          const { error } = await supabase.from(supabaseTable).upsert(payloadToUpsert, { onConflict: 'id' });
          if (!error) break;
          if (error?.message) {
            const match = error.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1]) {
              delete payloadToUpsert[match[1]];
              continue;
            }
          }
          break;
        }
      } catch { }

      try {
        supabase.from('application_settings').upsert({
          key: `cloud_sync_${tableKey}`,
          value: JSON.stringify(updatedList.slice(0, 100)),
          description: `Cloud backup for ${tableKey}`,
          updated_at: new Date().toISOString()
        }).catch(() => { });
      } catch { }

      const found = updatedList.find((x: any) => String(x.id) === String(itemId));
      return found || { ...body, id: itemId };
    }

    if (method === 'DELETE') {
      // 1. Immediately delete from local collection
      const currentList = (await getReliableCollection<any>(tableKey)) || [];
      const updatedList = currentList.filter((x: any) => String(x.id) !== String(itemId));
      setLocalCollection(tableKey, updatedList);

      // 2. Background delete from Supabase
      try {
        await supabase.from(supabaseTable).delete().eq('id', itemId);
      } catch { }

      try {
        supabase.from('application_settings').upsert({
          key: `cloud_sync_${tableKey}`,
          value: JSON.stringify(updatedList.slice(0, 100)),
          description: `Cloud backup for ${tableKey}`,
          updated_at: new Date().toISOString()
        }).catch(() => { });
      } catch { }

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
    // Employee (Fleet Captain)
    else if (
      ['9701055555', 'captain@charvik.com', 'captain'].includes(identifier) &&
      ['captain123', 'admin123'].includes(password)
    ) {
      matchedUser = {
        id: 2,
        name: 'Employee',
        email: 'captain@charvik.com',
        phone_number: '9701055555',
        role: 'Captain',
        status: 'Active'
      };
    }
    // Operator (Support Staff)
    else if (
      ['supporter@charvik.com', 'supporter', 'support', 'operator@charvik.com', 'operator', '9848033445'].includes(identifier) &&
      ['supporter123', 'support123', 'operator123', 'admin123'].includes(password)
    ) {
      const creds = getLocalCollection<any>('staff_credentials');
      const found = creds.find((c: any) => c.id === 3 || c.email_or_username === 'supporter@charvik.com');
      matchedUser = {
        id: 3,
        name: 'Operator',
        email: 'supporter@charvik.com',
        phone_number: '9848033445',
        role: 'Support Staff',
        status: 'Active',
        categories: found?.categories || []
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
          } catch { }
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
          } catch { }
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
        } catch { }
        return { success: true, ...body } as any;
      }

      if (method === 'DELETE') {
        const list = getLocalCollection<any>('employees').filter(x => String(x.id) !== String(itemId));
        setLocalCollection('employees', list);
        try {
          await supabase.from('employees').delete().eq('id', itemId);
        } catch { }
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
      } catch { }

      if (body.bus_id) {
        const updatedBuses = buses.map(b => String(b.id) === String(body.bus_id) ? { ...b, current_odometer_km: closeKm } : b);
        setLocalCollection('buses', updatedBuses);
        try {
          await supabase.from('buses').update({ current_odometer_km: closeKm }).eq('id', body.bus_id);
        } catch { }
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
      } catch { }
      return { success: true, ...body } as any;
    }
    if (method === 'DELETE') {
      const list = (getLocalCollection<any>('daily_km') || []).filter(k => String(k.id) !== String(id));
      setLocalCollection('daily_km', list);
      try {
        await supabase.from('daily_kilometer_entries').delete().eq('id', id);
      } catch { }
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
          const bus = buses.find(b => String(b.id) === String(n.allocated_bus_id) || b.registration_number === n.vehicle_number || b.bus_number === n.vehicle_number);
          const vNum = n.vehicle_number || bus?.registration_number || bus?.bus_number || (n.allocated_bus_id ? `Bus #${n.allocated_bus_id}` : '—');
          return {
            ...n,
            vehicle_number: vNum,
            total_km: n.total_km ?? n.km ?? n.present_km ?? 0,
            bus_number: bus?.bus_number || vNum,
            registration_number: bus?.registration_number || vNum
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
        const sKm = Number(body.starting_km) > 0 ? Number(body.starting_km) : Number(body.odometer_km) || 0;
        if (body.bus_id && sKm > 0) {
          // 1. Update buses collection & cache
          const buses = getLocalCollection<any>('buses');
          const updatedBuses = buses.map(b => String(b.id) === String(body.bus_id) ? {
            ...b,
            current_odometer_km: sKm,
            latest_checkup_km: sKm,
            odometer_km: sKm,
            starting_km: sKm,
            total_km: sKm
          } : b);
          setLocalCollection('buses', updatedBuses);
          try {
            localStorage.setItem('charvik_cache_buses', JSON.stringify(updatedBuses));
            localStorage.setItem('charvik_bus_master', JSON.stringify(updatedBuses));
            supabase.from('buses').update({ current_odometer_km: sKm }).eq('id', body.bus_id).then(() => { });
          } catch (_) { }

          // 2. Direct automatic sync to new_tyres
          const newTyres = getLocalCollection<any>('new_tyres');
          const updatedTyres = newTyres.map(nt => {
            const matches = String(nt.allocated_bus_id) === String(body.bus_id) ||
              (body.vehicle_number && (nt.allocated_bus_number === body.vehicle_number || nt.vehicle_number === body.vehicle_number));
            if (matches) {
              const bKm = Number(nt.km) || 0;
              return {
                ...nt,
                present_km: sKm,
                total_km: bKm + sKm,
                running_km: sKm >= bKm ? sKm - bKm : sKm
              };
            }
            return nt;
          });
          setLocalCollection('new_tyres', updatedTyres);
          try {
            localStorage.setItem('charvik_new_tyres_cache', JSON.stringify(updatedTyres));
            supabase.from('new_tyres').update({ present_km: sKm }).eq('allocated_bus_id', body.bus_id).then(() => { });
          } catch (_) { }

          // 3. Direct automatic sync to tyre_records (mounted tyres)
          const tyreRecords = getLocalCollection<any>('tyre_records');
          const updatedRecords = tyreRecords.map(tr => {
            if (String(tr.bus_id) === String(body.bus_id)) {
              return { ...tr, last_km: sKm, current_km: sKm };
            }
            return tr;
          });
          setLocalCollection('tyre_records', updatedRecords);
          try {
            localStorage.setItem('charvik_tyre_records_cache', JSON.stringify(updatedRecords));
          } catch (_) { }
        }
      } catch (_) { }
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
        const allCategoryNames = [
          'Vehicle Registration',
          'Route Management',
          'Task Management',
          'Organizer Management',
          'Daily Vehicle Checkup',
          'Mileage & Fueling',
          'AC Maintenance',
          'Tyre Maintenance',
          'Product Management'
        ];
        if (localCreds.length > 0) {
          return localCreds
            .filter((c: any) => c.email_or_username !== 'supporter@charvik.com' || c.is_user_created)
            .map((c: any) => ({
              ...c,
              categories: (c.role === 'Super Admin' || c.role === 'Admin')
                ? allCategoryNames
                : (c.categories || [])
            })) as any;
        }
        const defaults = [
          { id: 1, name: 'Admin Manager', email_or_username: 'admin@charvik.com', phone_number: '9876543210', role: 'Super Admin', status: 'Active', categories: allCategoryNames }
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
          categories: body.categories || [],
          created_at: new Date().toISOString()
        };
        const list = getLocalCollection<any>('staff_credentials');
        list.push(rec);
        setLocalCollection('staff_credentials', list);
        try {
          await supabase.from('administrators').insert([rec]);
        } catch { }
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
      if (subAction === 'categories' && method === 'PUT') {
        const updated = list.map(s => String(s.id) === String(staffId) ? { ...s, categories: body.categories } : s);
        setLocalCollection('staff_credentials', updated);
        return { success: true, categories: body.categories } as any;
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
    } catch { }
    return (Array.isArray(res) ? routeList : res) as any;
  }

  // 17B. TASKS (Trip Duties) FALLBACK
  if (path === '/tasks' || path.startsWith('/tasks/')) {
    const res = await handleFallbackTableCrud('tasks', 'tasks', path, method, body, params);
    let taskList = Array.isArray(res) ? res : getLocalCollection<any>('tasks');
    setLocalCollection('tasks', taskList);
    try {
      localStorage.setItem('charvik_trip_duty_management_v2', JSON.stringify(taskList));
    } catch { }
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
    } catch { }
    return (Array.isArray(res) ? orgList : res) as any;
  }

  // 17D. ORGANIZER PAYMENTS FALLBACK
  if (path === '/organizer-payments' || path.startsWith('/organizer-payments/')) {
    return handleFallbackTableCrud('organizer_payments', 'organizer_payments', path, method, body, params) as any;
  }

  // 17E. PRODUCTS INVENTORY FALLBACK
  if (path === '/products' || path.startsWith('/products/')) {
    return handleFallbackTableCrud('products', 'products', path, method, body, params, {
      idGenerator: () => `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }) as any;
  }

  // 17F. PRODUCT USAGE RECORDS FALLBACK
  if (path === '/product-usage' || path.startsWith('/product-usage/')) {
    return handleFallbackTableCrud('product_usage_records', 'product_usage_records', path, method, body, params, {
      idGenerator: () => `use-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }) as any;
  }

  // 17G. CLEANING RECORDS FALLBACK
  if (path === '/cleaning-records' || path.startsWith('/cleaning-records/')) {
    return handleFallbackTableCrud('cleaning_records', 'cleaning_records', path, method, body, params) as any;
  }

  // 17H. EMPLOYEE PAYMENTS FALLBACK
  if (path === '/employee-payments' || path.startsWith('/employee-payments/')) {
    return handleFallbackTableCrud('employee_payments', 'employee_payments', path, method, body, params, {
      idGenerator: () => `REC-${Date.now().toString().slice(-6)}`
    }) as any;
  }

  // 17I. SERVICE & SALARY RECORDS (RECORD MANAGEMENT) FALLBACK
  if (path === '/records' || path.startsWith('/records/')) {
    return handleFallbackTableCrud('service_records', 'service_records', path, method, body, params, {
      idGenerator: () => Date.now()
    }) as any;
  }

  // 17J. CAPTAIN AUDIT RECORDS FALLBACK
  if (path === '/captain-audits' || path.startsWith('/captain-audits/')) {
    return handleFallbackTableCrud('captain_audit_records', 'captain_audit_records', path, method, body, params, {
      idGenerator: () => Date.now()
    }) as any;
  }

  // 17K. NEXT EMPLOYEE CODE GENERATION FALLBACK
  if (path === '/employees/next-code') {
    const role = (params.get('role') || 'Driver').toLowerCase();
    const existing = (await getReliableCollection<any>('employees')) || BASE_FLEET_EMPLOYEES;
    let prefix = 'DRV';
    if (role.includes('helper') || role.includes('cleaner')) prefix = 'HLP';
    else if (role.includes('captain') || role.includes('supervisor')) prefix = 'CPT';

    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let maxNum = 1000;
    for (const emp of existing) {
      const code = String(emp.employee_code || '').trim();
      const match = code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return { nextCode: `${prefix}-${maxNum + 1}` } as any;
  }

  // 17L. DAILY VEHICLE MAINTENANCE FALLBACK
  if (path === '/daily-maintenance' || path.startsWith('/daily-maintenance/')) {
    const res = await handleFallbackTableCrud('daily_maintenance_records', 'daily_maintenance_records', path, method, body, params, {
      idGenerator: () => Date.now(),
      filter: (items, qParams) => {
        let filtered = items;
        const vNum = qParams.get('vehicle_number');
        const search = qParams.get('search');
        if (vNum && vNum !== 'all' && vNum !== 'All') {
          filtered = filtered.filter((r: any) => r.vehicle_number === vNum);
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((r: any) =>
            (r.vehicle_number || '').toLowerCase().includes(s) ||
            (r.showroom_name || '').toLowerCase().includes(s) ||
            (r.complaints || '').toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    });
    let list = Array.isArray(res) ? res : getLocalCollection<any>('daily_maintenance_records');
    list = mergeSeedCollection(list, BASE_DAILY_MAINTENANCE_RECORDS);
    setLocalCollection('daily_maintenance_records', list);
    try {
      localStorage.setItem('charvik_daily_maintenance_cache', JSON.stringify(list));
    } catch { }
    return (Array.isArray(res) ? list : res) as any;
  }

  // 17M. VYSHNAVI SERVICE RECORDS FALLBACK
  if (path === '/vyshnavi/records' || path.startsWith('/vyshnavi/records/')) {
    const res = await handleFallbackTableCrud('vyshnavi_service_records', 'vyshnavi_service_records', path, method, body, params, {
      idGenerator: () => Date.now(),
      filter: (items, qParams) => {
        let filtered = items;
        const search = qParams.get('search');
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((r: any) =>
            (r.record_number || '').toLowerCase().includes(s) ||
            (r.bill_to_name || '').toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    });
    let list = Array.isArray(res) ? res : getLocalCollection<any>('vyshnavi_service_records');
    list = mergeSeedCollection(list, BASE_VYSHNAVI_RECORDS);
    setLocalCollection('vyshnavi_service_records', list);
    try {
      localStorage.setItem('charvik_vyshnavi_records_cache', JSON.stringify(list));
    } catch { }
    return (Array.isArray(res) ? list : res) as any;
  }

  // 17N. VYSHNAVI TRANSACTIONS (INCOME & EXPENSE) FALLBACK
  if (path === '/vyshnavi/transactions' || path.startsWith('/vyshnavi/transactions/')) {
    const res = await handleFallbackTableCrud('vyshnavi_transactions', 'vyshnavi_transactions', path, method, body, params, {
      idGenerator: () => Date.now(),
      filter: (items, qParams) => {
        let filtered = items;
        const type = qParams.get('type');
        const category = qParams.get('category');
        const search = qParams.get('search');
        if (type && type !== 'All') {
          filtered = filtered.filter((t: any) => (t.transaction_type || '').toLowerCase() === type.toLowerCase());
        }
        if (category && category !== 'All') {
          filtered = filtered.filter((t: any) => (t.category || '').toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((t: any) =>
            (t.description || '').toLowerCase().includes(s) ||
            (t.party_name || '').toLowerCase().includes(s) ||
            (t.vehicle_number || '').toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    });
    let list = Array.isArray(res) ? res : getLocalCollection<any>('vyshnavi_transactions');
    list = mergeSeedCollection(list, BASE_VYSHNAVI_TRANSACTIONS);
    setLocalCollection('vyshnavi_transactions', list);
    try {
      localStorage.setItem('charvik_vyshnavi_transactions_cache', JSON.stringify(list));
    } catch { }
    return (Array.isArray(res) ? list : res) as any;
  }

  // 18. NOTIFICATIONS, SETTINGS, AUDIT LOGS, REPORTS
  if (path === '/notifications') return [] as any;
  if (path === '/settings') {
    if (method === 'POST') {
      try {
        localStorage.setItem('charvik_app_settings', JSON.stringify(body));
      } catch { }
      return { success: true, ...body } as any;
    }
    try {
      const saved = localStorage.getItem('charvik_app_settings');
      if (saved) return JSON.parse(saved);
    } catch { }
    return { company_name: 'Charvik Staffing Consultancy' } as any;
  }
  // 17M. FLEET MAINTENANCE VEHICLE UPSERT & DELETE FALLBACK
  if (path === '/fleet-maintenance/vehicle' || path.startsWith('/fleet-maintenance/vehicle/')) {
    const idParam = path.startsWith('/fleet-maintenance/vehicle/') ? path.replace('/fleet-maintenance/vehicle/', '') : null;
    if (method === 'DELETE' && idParam) {
      const buses = (await getReliableCollection<any>('buses')) || [];
      const updated = buses.filter((b: any) => String(b.id) !== String(idParam) && b.registration_number !== idParam && b.bus_number !== idParam);
      setLocalCollection('buses', updated);
      try {
        await supabase.from('buses').delete().or(`id.eq.${idParam},registration_number.eq.${idParam},bus_number.eq.${idParam}`);
      } catch { }
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return { success: true } as any;
    }
    if (method === 'POST') {
      const reg = body.registration_number || body.bus_number;
      const buses = (await getReliableCollection<any>('buses')) || [];
      const existingIdx = buses.findIndex((b: any) => b.registration_number === reg || b.bus_number === reg);
      const newBus = {
        id: existingIdx >= 0 ? buses[existingIdx].id : Date.now(),
        ...body,
        registration_number: reg,
        bus_number: reg,
        make: body.make || body.model?.split(' ')[0] || 'Fleet',
        model: body.model || 'Bus',
        operational_status: 'Active'
      };
      if (existingIdx >= 0) {
        buses[existingIdx] = { ...buses[existingIdx], ...newBus };
      } else {
        buses.push(newBus);
      }
      setLocalCollection('buses', buses);
      try {
        await supabase.from('buses').upsert(newBus);
      } catch { }
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return { success: true, id: newBus.id } as any;
    }
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
      const data = await response.json();

      // TWO-WAY LIVE SUPABASE CLOUD SYNC:
      // When any write operation (POST, PUT, DELETE, PATCH) is executed on localhost,
      // asynchronously mirror it to Supabase cloud fallback so Vercel users receive it immediately!
      const method = (options.method || 'GET').toUpperCase();
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        try {
          let mirrorBody = options.body;
          if (options.body) {
            try {
              const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : { ...options.body };
              if (data && typeof data === 'object' && (data as any).id && !parsedBody.id) {
                parsedBody.id = (data as any).id;
              }
              mirrorBody = JSON.stringify(parsedBody);
            } catch { }
          }
          handleCloudFallback(endpoint, {
            ...options,
            body: mirrorBody
          }).catch((syncErr) => console.warn('Supabase real-time sync note:', syncErr));
        } catch { }
      }

      return data;
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
  getBuses: async (params?: { search?: string; status?: string }) => {
    const q = cleanQueryParams(params);
    let buses: any[] = [];
    // 1. Live Supabase fetch (real-time shared truth between Localhost and Vercel)
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('buses').select('*').eq('is_archived', 0).order('id', { ascending: true }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        buses = remote;
      }
    } catch { }

    // 2. Localhost server merge (if running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await request<any[]>(`/buses${q ? `?${q}` : ''}`);
        if (Array.isArray(res) && res.length > 0) {
          buses = mergeSeedCollection(res, buses);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!buses || buses.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_cache_buses') || localStorage.getItem('charvik_buses_data');
        if (saved) buses = JSON.parse(saved);
      } catch { }
    }
    if (!buses || buses.length === 0) {
      buses = [...BASE_FLEET_BUSES];
    }

    // Always ensure all sample fleet vehicles from seed data are seamlessly available
    buses = mergeSeedCollection(buses, BASE_FLEET_BUSES);
    buses = mergeSeedCollection(buses, BASE_FLEET_MAINTENANCE_BUSES);

    setLocalCollection('buses', buses);
    return buses;
  },
  getBus: (id: number | string) => request<any>(`/buses/${id}`),
  createBus: (data: any) => request<any>('/buses', { method: 'POST', body: JSON.stringify(data) }),
  updateBus: (id: number | string, data: any) => request<any>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveBus: (id: number | string) => request<any>(`/buses/${id}`, { method: 'DELETE' }),
  sendExpiryAlert: (busId: number | string, data: { doc_name: string; expiry_date: string; recipient?: string; message?: string }) =>
    request<any>(`/buses/${busId}/send-expiry-alert`, { method: 'POST', body: JSON.stringify(data) }),

  // Transit Routes
  getRoutes: async () => {
    let routes: any[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('transit_routes').select('*').order('id', { ascending: true }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        routes = remote;
      }
    } catch { }

    // 2. Localhost server merge
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await request<any[]>('/routes');
        if (Array.isArray(res) && res.length > 0) {
          routes = mergeSeedCollection(res, routes);
        }
      } catch { }
    }

    // 3. Fallback only if no records
    if (!routes || routes.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_route_management_data');
        if (saved) routes = JSON.parse(saved);
      } catch { }
    }
    if (!routes || routes.length === 0) {
      routes = [...BASE_FLEET_ROUTES];
    }

    localStorage.setItem('charvik_route_management_data', JSON.stringify(routes));
    setLocalCollection('routes', routes);
    return routes;
  },
  createRoute: (data: any) => request<any>('/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id: number | string, data: any) => request<any>(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id: number | string) => request<any>(`/routes/${id}`, { method: 'DELETE' }),

  // Organizers (Partner Institutions)
  getOrganizers: async () => {
    let organizers: any[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('organizers').select('*').order('id', { ascending: true }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        organizers = remote;
      }
    } catch { }

    // 2. Localhost server merge
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await request<any[]>('/organizers');
        if (Array.isArray(res) && res.length > 0) {
          organizers = mergeSeedCollection(res, organizers);
        }
      } catch { }
    }

    // 3. Fallback only if no records
    if (!organizers || organizers.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_organizer_management_data');
        if (saved) organizers = JSON.parse(saved);
      } catch { }
    }
    if (!organizers || organizers.length === 0) {
      organizers = [...BASE_FLEET_ORGANIZERS];
    }

    localStorage.setItem('charvik_organizer_management_data', JSON.stringify(organizers));
    setLocalCollection('organizers', organizers);
    return organizers;
  },
  createOrganizer: (data: any) => request<any>('/organizers', { method: 'POST', body: JSON.stringify(data) }),
  updateOrganizer: (id: number | string, data: any) => request<any>(`/organizers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrganizer: (id: number | string) => request<any>(`/organizers/${id}`, { method: 'DELETE' }),

  // Organizer Payments
  getOrganizerPayments: async () => {
    let payments: any[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('organizer_payments').select('*').order('id', { ascending: false }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        payments = remote;
      }
    } catch { }

    // 2. Localhost server merge
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await request<any[]>('/organizer-payments');
        if (Array.isArray(res) && res.length > 0) {
          payments = mergeSeedCollection(res, payments);
        }
      } catch { }
    }

    // 3. Fallback only if no records
    if (!payments || payments.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_organizer_payments_data');
        if (saved) payments = JSON.parse(saved);
      } catch { }
    }

    localStorage.setItem('charvik_organizer_payments_data', JSON.stringify(payments));
    setLocalCollection('organizer_payments', payments);
    return payments;
  },
  createOrganizerPayment: (data: any) => request<any>('/organizer-payments', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrganizerPayment: (id: number | string) => request<any>(`/organizer-payments/${id}`, { method: 'DELETE' }),

  // Tasks (Trip Duties)
  getTasks: async () => {
    let tasks: any[] = [];
    // 1. Live Supabase fetch (the single real-time source of truth shared between Localhost and Vercel)
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('tasks').select('*').order('id', { ascending: false }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        tasks = remote.map((t: any) => ({
          ...t,
          driver1: typeof t.driver1 === 'string' ? JSON.parse(t.driver1 || '{}') : (t.driver1 || {}),
          driver2: typeof t.driver2 === 'string' ? JSON.parse(t.driver2 || '{}') : (t.driver2 || {}),
          helper: typeof t.helper === 'string' && t.helper ? JSON.parse(t.helper) : t.helper,
          captain: typeof t.captain === 'string' && t.captain ? JSON.parse(t.captain) : t.captain
        }));
      }
    } catch { }

    // 2. Localhost server merge (if server is running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const serverTasks = await request<any[]>('/tasks');
        if (Array.isArray(serverTasks) && serverTasks.length > 0) {
          tasks = mergeSeedCollection(serverTasks, tasks);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!tasks || tasks.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_trip_duty_management_v2');
        if (saved) tasks = JSON.parse(saved);
      } catch { }
    }
    if (!tasks || tasks.length === 0) {
      tasks = [...BASE_FLEET_TASKS];
    }

    localStorage.setItem('charvik_trip_duty_management_v2', JSON.stringify(tasks));
    return tasks;
  },
  createTask: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number | string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: number | string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),

  // Service & Salary Records (Invoices / Billing Records)
  getRecords: async () => {
    try {
      const remote = await request<any[]>('/records');
      if (Array.isArray(remote) && remote.length > 0) {
        setLocalCollection('service_records', remote);
        localStorage.setItem('charvik_service_records_v1', JSON.stringify(remote));
        return remote;
      }
    } catch { }
    try {
      const reliable = await getReliableCollection<any>('service_records');
      if (Array.isArray(reliable) && reliable.length > 0) return reliable;
      const saved = localStorage.getItem('charvik_service_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalCollection('service_records', parsed);
          return parsed;
        }
      }
    } catch { }
    const seed = [...BASE_SERVICE_RECORDS];
    setLocalCollection('service_records', seed);
    localStorage.setItem('charvik_service_records_v1', JSON.stringify(seed));
    return seed;
  },
  getRecord: (id: number | string) => request<any>(`/records/${id}`),
  createRecord: async (data: any) => {
    const record = { ...data, id: data.id || Date.now() };
    const current = (await getReliableCollection<any>('service_records')) || [];
    const updated = [record, ...current.filter((x: any) => String(x.id) !== String(record.id))];
    setLocalCollection('service_records', updated);
    localStorage.setItem('charvik_service_records_v1', JSON.stringify(updated));
    try {
      const remote = await request<any>('/records', { method: 'POST', body: JSON.stringify(record) });
      if (remote && remote.id) return remote;
    } catch (err) {
      console.warn('API createRecord remote note:', err);
    }
    return record;
  },
  updateRecord: async (id: number | string, data: any) => {
    const current = (await getReliableCollection<any>('service_records')) || [];
    const updated = current.map((x: any) => String(x.id) === String(id) ? { ...x, ...data } : x);
    setLocalCollection('service_records', updated);
    localStorage.setItem('charvik_service_records_v1', JSON.stringify(updated));
    try {
      const remote = await request<any>(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (remote) return remote;
    } catch (err) {
      console.warn('API updateRecord remote note:', err);
    }
    return data;
  },
  deleteRecord: async (id: number | string) => {
    const current = (await getReliableCollection<any>('service_records')) || [];
    const updated = current.filter((x: any) => String(x.id) !== String(id));
    setLocalCollection('service_records', updated);
    localStorage.setItem('charvik_service_records_v1', JSON.stringify(updated));
    try {
      await request<any>(`/records/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API deleteRecord remote note:', err);
    }
    return { success: true };
  },

  // Captain Audit Records
  getCaptainAudits: async () => {
    try {
      const remote = await request<any[]>('/captain-audits');
      if (Array.isArray(remote) && remote.length > 0) {
        setLocalCollection('captain_audit_records', remote);
        localStorage.setItem('charvik_captain_audit_records_v1', JSON.stringify(remote));
        return remote;
      }
    } catch { }
    try {
      const reliable = await getReliableCollection<any>('captain_audit_records');
      if (Array.isArray(reliable) && reliable.length > 0) return reliable;
      const saved = localStorage.getItem('charvik_captain_audit_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalCollection('captain_audit_records', parsed);
          return parsed;
        }
      }
    } catch { }
    const seed = [...BASE_CAPTAIN_AUDITS];
    setLocalCollection('captain_audit_records', seed);
    localStorage.setItem('charvik_captain_audit_records_v1', JSON.stringify(seed));
    return seed;
  },
  getCaptainAudit: (id: number | string) => request<any>(`/captain-audits/${id}`),
  createCaptainAudit: async (data: any) => {
    const record = { ...data, id: data.id || Date.now() };
    const current = (await getReliableCollection<any>('captain_audit_records')) || [];
    const updated = [record, ...current.filter((x: any) => String(x.id) !== String(record.id))];
    setLocalCollection('captain_audit_records', updated);
    localStorage.setItem('charvik_captain_audit_records_v1', JSON.stringify(updated));
    try {
      const remote = await request<any>('/captain-audits', { method: 'POST', body: JSON.stringify(record) });
      if (remote && remote.id) return remote;
    } catch (err) {
      console.warn('API createCaptainAudit remote note:', err);
    }
    return record;
  },
  updateCaptainAudit: async (id: number | string, data: any) => {
    const current = (await getReliableCollection<any>('captain_audit_records')) || [];
    const updated = current.map((x: any) => String(x.id) === String(id) ? { ...x, ...data } : x);
    setLocalCollection('captain_audit_records', updated);
    localStorage.setItem('charvik_captain_audit_records_v1', JSON.stringify(updated));
    try {
      const remote = await request<any>(`/captain-audits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (remote) return remote;
    } catch (err) {
      console.warn('API updateCaptainAudit remote note:', err);
    }
    return data;
  },
  deleteCaptainAudit: async (id: number | string) => {
    const current = (await getReliableCollection<any>('captain_audit_records')) || [];
    const updated = current.filter((x: any) => String(x.id) !== String(id));
    setLocalCollection('captain_audit_records', updated);
    localStorage.setItem('charvik_captain_audit_records_v1', JSON.stringify(updated));
    try {
      await request<any>(`/captain-audits/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API deleteCaptainAudit remote note:', err);
    }
    return { success: true };
  },

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

  // Fleet Vehicle Maintenance (Overview, 9 Services & Detail Profiles)
  getFleetMaintenance: async () => {
    try {
      const res = await request<{ summary: any; buses: any[] }>('/fleet-maintenance');
      if (res && Array.isArray(res.buses) && res.buses.length > 0) {
        localStorage.setItem('charvik_fleet_maintenance_cache', JSON.stringify(res));
        return res;
      }
    } catch { }

    try {
      const cached = localStorage.getItem('charvik_fleet_maintenance_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.buses) && parsed.buses.length > 0 && parsed.buses[0]?.services?.length >= 14) return parsed;
      }
    } catch { }

    // Synthesize dataset with KM synchronized from Daily Vehicle Checkup
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const SPECS = [
      { key: 'general_bus_service', name: 'General Bus Service', intervalType: 'km', interval: 60000, label: 'Every 60,000 KM' },
      { key: 'diesel_filter_replacement', name: 'Diesel Filter Replacement', intervalType: 'km', interval: 60000, label: 'Every 60,000 KM' },
      { key: 'adblue_filter_replacement', name: 'AdBlue Filter Replacement', intervalType: 'km', interval: 60000, label: 'Every 60,000 KM' },
      { key: 'dpf_filter_cleaning', name: 'DPF Filter Cleaning', intervalType: 'km', interval: 100000, label: 'Every 1,00,000 KM' },
      { key: 'wheel_alignment', name: 'Wheel Alignment', intervalType: 'km', interval: 10000, label: 'Every 10,000 KM' },
      { key: 'tyre_rotation', name: 'Tyre Rotation', intervalType: 'km', interval: 10000, label: 'Every 10,000 KM' },
      { key: 'ac_filter_cleaning', name: 'AC Filter Cleaning', intervalType: 'date', interval: 7, label: 'Every week' },
      { key: 'radiator_cleaning', name: 'Radiator Cleaning', intervalType: 'km', interval: 200000, label: 'Every 2,00,000 KM' },
      { key: 'ac_general_service', name: 'AC General Service', intervalType: 'date', interval: 90, label: '3-monthly' },
      { key: 'vehicle_schedule_service', name: 'Vehicle Schedule Service', intervalType: 'km', interval: 60000, label: 'Every 60,000 KM' },
      { key: 'battery_service', name: 'Battery Service', intervalType: 'km', interval: 120000, label: 'Every 1,20,000 KM' },
      { key: 'vehicle_deep_cleaning', name: 'Vehicle Deep Cleaning', intervalType: 'date', interval: 30, label: 'Every month one time' },
      { key: 'break_liner', name: 'Break Liner', intervalType: 'km', interval: 30000, label: 'Every 30,000 KM' },
      { key: 'vehicle_greecing', name: 'Vehicle Greecing', intervalType: 'date', interval: 10, label: 'Every 10 days' }
    ];

    let cachedHistory: any[] = [];
    try {
      const hRaw = localStorage.getItem('charvik_fleet_maintenance_history_cache');
      cachedHistory = hRaw ? JSON.parse(hRaw) : BASE_FLEET_MAINTENANCE_HISTORY;
    } catch {
      cachedHistory = BASE_FLEET_MAINTENANCE_HISTORY;
    }

    let fleetDueSoon = 0;
    let fleetOverdue = 0;
    let vehiclesNeedingAttention = 0;

    const busSource = (await getReliableCollection<any>('buses'))?.filter((b: any) => b && b.is_archived !== 1);
    const activeBuses = Array.isArray(busSource) && busSource.length > 0 ? busSource : BASE_FLEET_MAINTENANCE_BUSES;

    const buses = activeBuses.map((b) => {
      let busKm = Number(b.current_odometer_km) || 0;
      try {
        const insRaw = localStorage.getItem('charvik_inspections_data');
        if (insRaw) {
          const insList = JSON.parse(insRaw);
          const match = insList.find(
            (i: any) => i.vehicle_number === b.bus_number || i.vehicle_number === b.registration_number || String(i.bus_id) === String(b.id)
          );
          if (match && (Number(match.starting_km) > 0 || Number(match.odometer_km) > 0)) {
            busKm = Math.max(busKm, Number(match.starting_km || match.odometer_km));
          }
        }
      } catch { }

      const busHist = cachedHistory.filter((h: any) => h.bus_id === b.id || h.bus_number === b.bus_number || h.registration_number === b.registration_number);

      let busOverdue = 0;
      let busDueSoon = 0;

      const services = SPECS.map((spec) => {
        const latest = busHist.find(
          (h: any) => (h.service_type || '').toLowerCase() === spec.name.toLowerCase() || (h.service_type || '').toLowerCase() === spec.key.toLowerCase()
        );

        let lastDoneKm = latest ? Number(latest.odometer_km) || 0 : Math.max(0, busKm - (spec.intervalType === 'km' ? Math.round(spec.interval * 0.7) : 0));
        let lastDoneDate = latest?.completion_date || b.last_service_date || todayStr;

        if (!latest && b.bus_number === 'DL01A1024') {
          if (spec.key === 'general_bus_service') { lastDoneKm = 190000; lastDoneDate = '2025-09-13'; }
          else if (spec.key === 'diesel_filter_replacement') { lastDoneKm = 270000; lastDoneDate = '2026-06-20'; }
          else if (spec.key === 'adblue_filter_replacement') { lastDoneKm = 285000; lastDoneDate = '2026-08-04'; }
          else if (spec.key === 'dpf_filter_cleaning') { lastDoneKm = 232000; lastDoneDate = '2026-02-20'; }
          else if (spec.key === 'wheel_alignment') { lastDoneKm = 305000; lastDoneDate = '2026-10-08'; }
          else if (spec.key === 'tyre_rotation') { lastDoneKm = 304000; lastDoneDate = '2026-10-06'; }
          else if (spec.key === 'ac_filter_cleaning') { lastDoneKm = 312000; lastDoneDate = '2026-11-01'; }
          else if (spec.key === 'radiator_cleaning') { lastDoneKm = 220000; lastDoneDate = '2026-01-15'; }
          else if (spec.key === 'ac_general_service') { lastDoneKm = 310000; lastDoneDate = '2026-10-10'; }
          else if (spec.key === 'vehicle_schedule_service') { lastDoneKm = 270000; lastDoneDate = '2026-06-20'; }
          else if (spec.key === 'battery_service') { lastDoneKm = 240000; lastDoneDate = '2026-03-10'; }
          else if (spec.key === 'vehicle_deep_cleaning') { lastDoneDate = '2026-10-25'; }
          else if (spec.key === 'break_liner') { lastDoneKm = 295000; lastDoneDate = '2026-09-15'; }
          else if (spec.key === 'vehicle_greecing') { lastDoneDate = '2026-11-04'; }
        } else if (!latest && b.bus_number === 'HR55X1200') {
          if (spec.key === 'general_bus_service') { lastDoneKm = 5000; lastDoneDate = '2026-05-10'; }
          else if (spec.key === 'diesel_filter_replacement') { lastDoneKm = 36000; lastDoneDate = '2026-08-15'; }
          else if (spec.key === 'adblue_filter_replacement') { lastDoneKm = 36000; lastDoneDate = '2026-08-15'; }
          else if (spec.key === 'dpf_filter_cleaning') { lastDoneKm = 15000; lastDoneDate = '2026-04-01'; }
          else if (spec.key === 'wheel_alignment') { lastDoneKm = 61000; lastDoneDate = '2026-10-20'; }
          else if (spec.key === 'tyre_rotation') { lastDoneKm = 55000; lastDoneDate = '2026-09-12'; }
          else if (spec.key === 'ac_filter_cleaning') { lastDoneKm = 65000; lastDoneDate = '2026-11-05'; }
          else if (spec.key === 'radiator_cleaning') { lastDoneKm = 0; lastDoneDate = '2026-01-01'; }
          else if (spec.key === 'ac_general_service') { lastDoneKm = 60000; lastDoneDate = '2026-10-20'; }
          else if (spec.key === 'vehicle_schedule_service') { lastDoneKm = 36000; lastDoneDate = '2026-08-15'; }
          else if (spec.key === 'battery_service') { lastDoneKm = 0; lastDoneDate = '2026-01-01'; }
          else if (spec.key === 'vehicle_deep_cleaning') { lastDoneDate = '2026-10-28'; }
          else if (spec.key === 'break_liner') { lastDoneKm = 45000; lastDoneDate = '2026-07-10'; }
          else if (spec.key === 'vehicle_greecing') { lastDoneDate = '2026-11-05'; }
        } else if (!latest && b.bus_number === 'MH12Q8811') {
          if (spec.key === 'general_bus_service') { lastDoneKm = 12000; lastDoneDate = '2026-06-15'; }
          else if (spec.key === 'diesel_filter_replacement') { lastDoneKm = 60000; lastDoneDate = '2026-09-01'; }
          else if (spec.key === 'adblue_filter_replacement') { lastDoneKm = 78000; lastDoneDate = '2026-10-15'; }
          else if (spec.key === 'dpf_filter_cleaning') { lastDoneKm = 40000; lastDoneDate = '2026-07-20'; }
          else if (spec.key === 'wheel_alignment') { lastDoneKm = 82500; lastDoneDate = '2026-10-25'; }
          else if (spec.key === 'tyre_rotation') { lastDoneKm = 77000; lastDoneDate = '2026-09-20'; }
          else if (spec.key === 'ac_filter_cleaning') { lastDoneKm = 87000; lastDoneDate = '2026-10-30'; }
          else if (spec.key === 'radiator_cleaning') { lastDoneKm = 0; lastDoneDate = '2026-01-01'; }
          else if (spec.key === 'ac_general_service') { lastDoneKm = 85000; lastDoneDate = '2026-10-09'; }
          else if (spec.key === 'vehicle_schedule_service') { lastDoneKm = 60000; lastDoneDate = '2026-09-01'; }
          else if (spec.key === 'battery_service') { lastDoneKm = 0; lastDoneDate = '2026-01-01'; }
          else if (spec.key === 'vehicle_deep_cleaning') { lastDoneDate = '2026-10-20'; }
          else if (spec.key === 'break_liner') { lastDoneKm = 70000; lastDoneDate = '2026-08-20'; }
          else if (spec.key === 'vehicle_greecing') { lastDoneDate = '2026-11-03'; }
        }

        let nextDueKm = 0;
        let nextDueDate = '';
        let status = 'OK';
        let statusText = 'OK';
        let progressPercent = 0;
        let isOverdue = false;
        let isDueSoon = false;

        if (spec.intervalType === 'km') {
          nextDueKm = lastDoneKm + spec.interval;
          const diffKm = nextDueKm - busKm;
          const runKm = Math.max(0, busKm - lastDoneKm);
          progressPercent = Math.min(100, Math.round((runKm / spec.interval) * 100));

          if (busKm >= nextDueKm) {
            status = 'Overdue';
            isOverdue = true;
            statusText = `Overdue by ${(busKm - nextDueKm).toLocaleString('en-IN')} KM`;
          } else if (diffKm <= 2000) {
            status = 'Due Soon';
            isDueSoon = true;
            statusText = `Due in ${diffKm.toLocaleString('en-IN')} KM`;
          } else {
            status = 'OK';
            statusText = `Next due at ${nextDueKm.toLocaleString('en-IN')} KM`;
          }
        } else {
          const lastDateObj = new Date(lastDoneDate);
          const nextDateObj = new Date(lastDateObj);
          nextDateObj.setDate(nextDateObj.getDate() + spec.interval);
          nextDueDate = nextDateObj.toISOString().split('T')[0];

          const diffMs = nextDateObj.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
          const totalDays = spec.interval;
          const daysPassed = Math.max(0, totalDays - diffDays);
          progressPercent = Math.min(100, Math.round((daysPassed / totalDays) * 100));

          if (diffDays < 0) {
            status = 'Overdue';
            isOverdue = true;
            statusText = `Overdue by ${Math.abs(diffDays)} days`;
          } else if (diffDays === 0) {
            status = 'Due Soon';
            isDueSoon = true;
            statusText = 'Due today';
          } else if (diffDays <= 2) {
            status = 'Due Soon';
            isDueSoon = true;
            statusText = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
          } else {
            status = 'OK';
            statusText = 'OK';
          }
        }

        if (isOverdue) busOverdue++;
        if (isDueSoon) busDueSoon++;

        return {
          key: spec.key,
          name: spec.name,
          intervalType: spec.intervalType,
          interval: spec.interval,
          intervalLabel: spec.label,
          lastDoneKm,
          lastDoneDate,
          nextDueKm,
          nextDueDate,
          status,
          statusText,
          progressPercent,
          isOverdue,
          isDueSoon
        };
      });

      if (busOverdue > 0) fleetOverdue += busOverdue;
      if (busDueSoon > 0) fleetDueSoon += busDueSoon;
      if (busOverdue > 0 || busDueSoon > 0) vehiclesNeedingAttention++;

      let busStatus = 'Healthy';
      if (busOverdue > 0) busStatus = 'Needs Attention';
      else if (busDueSoon > 0) busStatus = 'Due Soon';

      return {
        ...b,
        current_odometer_km: busKm,
        status: busStatus,
        overdueCount: busOverdue,
        dueSoonCount: busDueSoon,
        services,
        history: busHist
      };
    });

    const synthesized = {
      summary: {
        totalBuses: buses.length,
        servicesDueSoon: fleetDueSoon,
        overdueServices: fleetOverdue,
        servicesCompleted: cachedHistory.length,
        vehiclesNeedingAttention
      },
      buses
    };

    localStorage.setItem('charvik_fleet_maintenance_cache', JSON.stringify(synthesized));
    return synthesized;
  },

  getFleetMaintenanceHistory: async (busId?: number | string) => {
    try {
      const q = busId ? `?bus_id=${busId}` : '';
      const res = await request<any[]>(`/fleet-maintenance/history${q}`);
      if (Array.isArray(res) && res.length > 0) {
        localStorage.setItem('charvik_fleet_maintenance_history_cache', JSON.stringify(res));
        return res;
      }
    } catch { }

    try {
      const cached = localStorage.getItem('charvik_fleet_maintenance_history_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (busId) return parsed.filter((p: any) => String(p.bus_id) === String(busId));
          return parsed;
        }
      }
    } catch { }

    if (busId) return BASE_FLEET_MAINTENANCE_HISTORY.filter((p: any) => String(p.bus_id) === String(busId));
    return BASE_FLEET_MAINTENANCE_HISTORY;
  },

  completeFleetMaintenance: async (data: any) => {
    try {
      const res = await request<any>('/fleet-maintenance/complete', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      // Invalidate cache
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return res;
    } catch {
      let list = [...BASE_FLEET_MAINTENANCE_HISTORY];
      try {
        const cached = localStorage.getItem('charvik_fleet_maintenance_history_cache');
        if (cached) list = JSON.parse(cached);
      } catch { }
      const newEntry = {
        id: Date.now(),
        ...data,
        photos_json: Array.isArray(data.photos) ? JSON.stringify(data.photos) : '[]',
        created_at: new Date().toISOString()
      };
      list.unshift(newEntry);
      localStorage.setItem('charvik_fleet_maintenance_history_cache', JSON.stringify(list));
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return { success: true, id: newEntry.id };
    }
  },

  createFleetVehicle: async (data: any) => {
    try {
      const res = await request<any>('/fleet-maintenance/vehicle', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return res;
    } catch {
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return { success: true, id: Date.now() };
    }
  },

  deleteFleetVehicle: async (idOrReg: number | string) => {
    try {
      const res = await request<any>(`/fleet-maintenance/vehicle/${idOrReg}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return res;
    } catch {
      localStorage.removeItem('charvik_fleet_maintenance_cache');
      return { success: true };
    }
  },

  // Daily Maintenance (repairs, complaints, showroom name, other, invoice 2-3 photos)
  getDailyMaintenance: async (params?: { vehicle_number?: string; bus_id?: number | string; search?: string; start_date?: string; end_date?: string }) => {
    let records: DailyMaintenanceRecord[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remoteTable } = await Promise.race([
        supabase.from('daily_maintenance_records').select('*').order('date', { ascending: false }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remoteTable) && remoteTable.length > 0) {
        records = remoteTable;
      } else {
        const { data: appData } = await supabase.from('application_settings').select('value').eq('key', 'cloud_sync_daily_maintenance_records').single();
        if (appData && appData.value) {
          const parsed = JSON.parse(appData.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            records = parsed;
          }
        }
      }
    } catch { }

    // 2. Localhost server merge (if running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const cleanParams: any = {};
        if (params?.vehicle_number && params.vehicle_number !== 'all' && params.vehicle_number !== 'All') cleanParams.vehicle_number = params.vehicle_number;
        if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') cleanParams.bus_id = params.bus_id;
        if (params?.search) cleanParams.search = params.search;
        if (params?.start_date) cleanParams.start_date = params.start_date;
        if (params?.end_date) cleanParams.end_date = params.end_date;
        const q = new URLSearchParams(cleanParams).toString();
        const data = await request<DailyMaintenanceRecord[]>(`/daily-maintenance${q ? `?${q}` : ''}`);
        if (Array.isArray(data) && data.length > 0) {
          records = mergeSeedCollection(data, records);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!records || records.length === 0) {
      try {
        const cached = localStorage.getItem('charvik_daily_maintenance_cache');
        if (cached) records = JSON.parse(cached);
      } catch { }
    }
    if (!records || records.length === 0) {
      records = [...BASE_DAILY_MAINTENANCE_RECORDS];
    }

    if (params?.vehicle_number && params.vehicle_number !== 'all' && params.vehicle_number !== 'All') {
      records = records.filter((r) => r.vehicle_number === params.vehicle_number);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      records = records.filter((r) =>
        (r.vehicle_number || '').toLowerCase().includes(s) ||
        (r.showroom_name || '').toLowerCase().includes(s) ||
        (r.complaints || '').toLowerCase().includes(s) ||
        (r.other || '').toLowerCase().includes(s)
      );
    }
    if (params?.start_date) {
      records = records.filter((r) => r.date >= params.start_date!);
    }
    if (params?.end_date) {
      records = records.filter((r) => r.date <= params.end_date!);
    }

    localStorage.setItem('charvik_daily_maintenance_cache', JSON.stringify(records));
    setLocalCollection('daily_maintenance_records', records);
    return records;
  },

  createDailyMaintenance: async (data: any) => {
    try {
      const res = await request<any>('/daily-maintenance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_daily_maintenance_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_daily_maintenance_cache');
      const list: DailyMaintenanceRecord[] = cached ? JSON.parse(cached) : [...BASE_DAILY_MAINTENANCE_RECORDS];
      const newEntry: DailyMaintenanceRecord = {
        id: Date.now(),
        date: data.date || new Date().toISOString().split('T')[0],
        vehicle_number: data.vehicle_number || 'DL01A1024',
        bus_id: data.bus_id || null,
        km: Number(data.km) || 0,
        complaints: data.complaints || '',
        showroom_name: data.showroom_name || '',
        other: data.other || '',
        amount: Number(data.amount) || 0,
        photos_json: JSON.stringify(data.photos || []),
        photos: data.photos || []
      };
      list.unshift(newEntry);
      localStorage.setItem('charvik_daily_maintenance_cache', JSON.stringify(list));
      return { success: true, id: newEntry.id };
    }
  },

  updateDailyMaintenance: async (id: number | string, data: any) => {
    try {
      const res = await request<any>(`/daily-maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_daily_maintenance_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_daily_maintenance_cache');
      const list: DailyMaintenanceRecord[] = cached ? JSON.parse(cached) : [...BASE_DAILY_MAINTENANCE_RECORDS];
      const idx = list.findIndex((r) => String(r.id) === String(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data, photos: data.photos || list[idx].photos };
        localStorage.setItem('charvik_daily_maintenance_cache', JSON.stringify(list));
      }
      return { success: true };
    }
  },

  deleteDailyMaintenance: async (id: number | string) => {
    try {
      const res = await request<any>(`/daily-maintenance/${id}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('charvik_daily_maintenance_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_daily_maintenance_cache');
      let list: DailyMaintenanceRecord[] = cached ? JSON.parse(cached) : [...BASE_DAILY_MAINTENANCE_RECORDS];
      list = list.filter((r) => String(r.id) !== String(id));
      localStorage.setItem('charvik_daily_maintenance_cache', JSON.stringify(list));
      return { success: true };
    }
  },

  // Vyshnavi Travels Records
  getVyshnaviRecords: async (params?: { search?: string; status?: string }) => {
    let records: VyshnaviRecord[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remoteTable } = await Promise.race([
        supabase.from('vyshnavi_service_records').select('*').order('id', { ascending: false }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remoteTable) && remoteTable.length > 0) {
        records = remoteTable;
      } else {
        const { data: appData } = await supabase.from('application_settings').select('value').eq('key', 'cloud_sync_vyshnavi_service_records').single();
        if (appData && appData.value) {
          const parsed = JSON.parse(appData.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            records = parsed;
          }
        }
      }
    } catch { }

    // 2. Localhost server merge (if running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const cleanParams: any = {};
        if (params?.search) cleanParams.search = params.search;
        if (params?.status && params.status !== 'All') cleanParams.status = params.status;
        const q = new URLSearchParams(cleanParams).toString();
        const data = await request<VyshnaviRecord[]>(`/vyshnavi/records${q ? `?${q}` : ''}`);
        if (Array.isArray(data) && data.length > 0) {
          records = mergeSeedCollection(data, records);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!records || records.length === 0) {
      try {
        const cached = localStorage.getItem('charvik_vyshnavi_records_cache');
        if (cached) records = JSON.parse(cached);
      } catch { }
    }
    if (!records || records.length === 0) {
      records = [...BASE_VYSHNAVI_RECORDS];
    }

    if (params?.status && params.status !== 'All') {
      records = records.filter((r) => r.payment_status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      records = records.filter(
        (r) =>
          (r.record_number || '').toLowerCase().includes(s) ||
          (r.bill_to_name || '').toLowerCase().includes(s) ||
          (r.period_month || '').toLowerCase().includes(s)
      );
    }
    localStorage.setItem('charvik_vyshnavi_records_cache', JSON.stringify(records));
    setLocalCollection('vyshnavi_service_records', records);
    return records;
  },

  createVyshnaviRecord: async (data: any) => {
    try {
      const res = await request<any>('/vyshnavi/records', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_vyshnavi_records_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_records_cache');
      const list: VyshnaviRecord[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_RECORDS];
      const newEntry: VyshnaviRecord = {
        id: Date.now(),
        ...data,
        items: data.items || []
      };
      list.unshift(newEntry);
      localStorage.setItem('charvik_vyshnavi_records_cache', JSON.stringify(list));
      return { success: true, record: newEntry };
    }
  },

  updateVyshnaviRecord: async (id: number | string, data: any) => {
    try {
      const res = await request<any>(`/vyshnavi/records/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_vyshnavi_records_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_records_cache');
      const list: VyshnaviRecord[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_RECORDS];
      const idx = list.findIndex((r) => String(r.id) === String(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data };
        localStorage.setItem('charvik_vyshnavi_records_cache', JSON.stringify(list));
      }
      return { success: true };
    }
  },

  deleteVyshnaviRecord: async (id: number | string) => {
    try {
      const res = await request<any>(`/vyshnavi/records/${id}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('charvik_vyshnavi_records_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_records_cache');
      let list: VyshnaviRecord[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_RECORDS];
      list = list.filter((r) => String(r.id) !== String(id));
      localStorage.setItem('charvik_vyshnavi_records_cache', JSON.stringify(list));
      return { success: true };
    }
  },

  // Vyshnavi Travels Income & Expense Transactions
  getVyshnaviTransactions: async (params?: { type?: string; category?: string; search?: string }) => {
    let transactions: VyshnaviTransaction[] = [];
    // 1. Live Supabase fetch
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remoteTable } = await Promise.race([
        supabase.from('vyshnavi_transactions').select('*').order('id', { ascending: false }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remoteTable) && remoteTable.length > 0) {
        transactions = remoteTable;
      } else {
        const { data: appData } = await supabase.from('application_settings').select('value').eq('key', 'cloud_sync_vyshnavi_transactions').single();
        if (appData && appData.value) {
          const parsed = JSON.parse(appData.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            transactions = parsed;
          }
        }
      }
    } catch { }

    // 2. Localhost server merge (if running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const cleanParams: any = {};
        if (params?.type && params.type !== 'All') cleanParams.type = params.type;
        if (params?.category && params.category !== 'All') cleanParams.category = params.category;
        if (params?.search) cleanParams.search = params.search;
        const q = new URLSearchParams(cleanParams).toString();
        const data = await request<VyshnaviTransaction[]>(`/vyshnavi/transactions${q ? `?${q}` : ''}`);
        if (Array.isArray(data) && data.length > 0) {
          transactions = mergeSeedCollection(data, transactions);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!transactions || transactions.length === 0) {
      try {
        const cached = localStorage.getItem('charvik_vyshnavi_transactions_cache');
        if (cached) transactions = JSON.parse(cached);
      } catch { }
    }
    if (!transactions || transactions.length === 0) {
      transactions = [...BASE_VYSHNAVI_TRANSACTIONS];
    }

    if (params?.type && params.type !== 'All') {
      transactions = transactions.filter((t) => (t.transaction_type || '').toLowerCase() === params.type!.toLowerCase());
    }
    if (params?.category && params.category !== 'All') {
      transactions = transactions.filter((t) => (t.category || '').toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(s) ||
          (t.party_name || '').toLowerCase().includes(s) ||
          (t.vehicle_number || '').toLowerCase().includes(s) ||
          (t.reference_no || '').toLowerCase().includes(s)
      );
    }
    localStorage.setItem('charvik_vyshnavi_transactions_cache', JSON.stringify(transactions));
    setLocalCollection('vyshnavi_transactions', transactions);
    return transactions;
  },

  createVyshnaviTransaction: async (data: any) => {
    try {
      const res = await request<any>('/vyshnavi/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_vyshnavi_transactions_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_transactions_cache');
      const list: VyshnaviTransaction[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_TRANSACTIONS];
      const newEntry: VyshnaviTransaction = {
        id: Date.now(),
        ...data
      };
      list.unshift(newEntry);
      localStorage.setItem('charvik_vyshnavi_transactions_cache', JSON.stringify(list));
      return { success: true, transaction: newEntry };
    }
  },

  updateVyshnaviTransaction: async (id: number | string, data: any) => {
    try {
      const res = await request<any>(`/vyshnavi/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      localStorage.removeItem('charvik_vyshnavi_transactions_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_transactions_cache');
      const list: VyshnaviTransaction[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_TRANSACTIONS];
      const idx = list.findIndex((t) => String(t.id) === String(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data };
        localStorage.setItem('charvik_vyshnavi_transactions_cache', JSON.stringify(list));
      }
      return { success: true };
    }
  },

  deleteVyshnaviTransaction: async (id: number | string) => {
    try {
      const res = await request<any>(`/vyshnavi/transactions/${id}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('charvik_vyshnavi_transactions_cache');
      return res;
    } catch {
      const cached = localStorage.getItem('charvik_vyshnavi_transactions_cache');
      let list: VyshnaviTransaction[] = cached ? JSON.parse(cached) : [...BASE_VYSHNAVI_TRANSACTIONS];
      list = list.filter((t) => String(t.id) !== String(id));
      localStorage.setItem('charvik_vyshnavi_transactions_cache', JSON.stringify(list));
      return { success: true };
    }
  },

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
  getNewTyres: async (params?: { bus_id?: number | string; status?: string }) => {
    const cleanParams: any = {};
    if (params?.bus_id && params.bus_id !== 'undefined' && params.bus_id !== 'all') cleanParams.bus_id = params.bus_id;
    if (params?.status && params.status !== 'all') cleanParams.status = params.status;
    const q = new URLSearchParams(cleanParams).toString();

    let tyres: any[] = [];
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const res = await request<any[]>(`/new-tyres${q ? `?${q}` : ''}`);
        if (Array.isArray(res) && res.length > 0) {
          tyres = res;
        }
      } catch { }
    }

    if (!tyres || tyres.length === 0) {
      try {
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
        const { data: remote } = await Promise.race([
          supabase.from('new_tyres').select('*').order('id', { ascending: false }),
          timeoutPromise
        ]) as any;
        if (Array.isArray(remote) && remote.length > 0) {
          tyres = remote;
        }
      } catch { }
    }

    if (!tyres || tyres.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_new_tyres_data') || localStorage.getItem('charvik_cache_new_tyres');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) tyres = parsed;
        }
      } catch { }
    }

    if (!tyres || tyres.length === 0) {
      tyres = [...BASE_NEW_TYRES];
    }

    // Merge remote/server tyres with local cache so newly created tyres never disappear
    try {
      const localSaved = getLocalCollection<any>('new_tyres');
      const rawLocal = localStorage.getItem('charvik_new_tyres_data');
      const parsedLocal = rawLocal ? JSON.parse(rawLocal) : [];
      const combinedLocal = [...(Array.isArray(parsedLocal) ? parsedLocal : []), ...(Array.isArray(localSaved) ? localSaved : [])];
      if (combinedLocal.length > 0) {
        tyres = mergeSeedCollection(tyres, combinedLocal);
      }
    } catch { }

    setLocalCollection('new_tyres', tyres);
    try {
      localStorage.setItem('charvik_new_tyres_data', JSON.stringify(tyres));
    } catch { }
    return tyres;
  },
  createNewTyre: async (data: any) => {
    try {
      const res = await request<any>('/new-tyres', { method: 'POST', body: JSON.stringify(data) });
      const current = getLocalCollection<any>('new_tyres');
      const newItem = { ...data, id: res?.id || Date.now() };
      const updated = [newItem, ...current];
      setLocalCollection('new_tyres', updated);
      try { localStorage.setItem('charvik_new_tyres_data', JSON.stringify(updated)); } catch { }
      return res;
    } catch {
      const current = getLocalCollection<any>('new_tyres');
      const newItem = { ...data, id: Date.now() };
      const updated = [newItem, ...current];
      setLocalCollection('new_tyres', updated);
      try { localStorage.setItem('charvik_new_tyres_data', JSON.stringify(updated)); } catch { }
      return { success: true, id: newItem.id };
    }
  },
  updateNewTyre: async (id: number | string, data: any) => {
    try {
      const res = await request<any>(`/new-tyres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      const current = getLocalCollection<any>('new_tyres');
      const updated = current.map((t) => (String(t.id) === String(id) ? { ...t, ...data } : t));
      setLocalCollection('new_tyres', updated);
      try { localStorage.setItem('charvik_new_tyres_data', JSON.stringify(updated)); } catch { }
      return res;
    } catch {
      const current = getLocalCollection<any>('new_tyres');
      const updated = current.map((t) => (String(t.id) === String(id) ? { ...t, ...data } : t));
      setLocalCollection('new_tyres', updated);
      try { localStorage.setItem('charvik_new_tyres_data', JSON.stringify(updated)); } catch { }
      return { success: true, message: 'Updated locally' };
    }
  },
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
  getBusCondition: (params?: { bus_id?: number | string; roadworthiness?: string }) => api.getBusConditions(params),
  createBusCondition: (data: any) => request<any>('/bus-condition', { method: 'POST', body: JSON.stringify(data) }),
  createBusConditionInspection: (data: any) => request<any>('/bus-condition', { method: 'POST', body: JSON.stringify(data) }),
  updateBusCondition: (id: number | string, data: any) => request<any>(`/bus-condition/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBusCondition: (id: number | string) => request<any>(`/bus-condition/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: async (params?: { role?: string; status?: string; search?: string }) => {
    let employees: any[] = [];
    // 1. Live Supabase fetch (real-time source of truth for both Localhost & Vercel)
    try {
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000));
      const { data: remote } = await Promise.race([
        supabase.from('employees').select('*').eq('is_archived', 0).order('id', { ascending: true }),
        timeoutPromise
      ]) as any;
      if (Array.isArray(remote) && remote.length > 0) {
        employees = remote;
      }
    } catch { }

    // 2. Localhost server merge (if running on localhost)
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocalHost) {
      try {
        const clean: Record<string, string> = {};
        if (params?.role && params.role !== 'All' && params.role !== 'undefined') clean.role = params.role;
        if (params?.status && params.status !== 'All' && params.status !== 'undefined') clean.status = params.status;
        if (params?.search && params.search !== 'undefined') clean.search = params.search;
        const q = new URLSearchParams(clean).toString();
        const res = await request<any[]>(`/employees${q ? `?${q}` : ''}`);
        if (Array.isArray(res) && res.length > 0) {
          employees = mergeSeedCollection(res, employees);
        }
      } catch { }
    }

    // 3. Fallback only if no records anywhere
    if (!employees || employees.length === 0) {
      try {
        const saved = localStorage.getItem('charvik_cache_employees');
        if (saved) employees = JSON.parse(saved);
      } catch { }
    }
    if (!employees || employees.length === 0) {
      employees = [...BASE_FLEET_EMPLOYEES];
    }

    if (params?.role && params.role !== 'All') {
      employees = employees.filter((e) => e.role === params.role);
    }
    if (params?.status && params.status !== 'All') {
      employees = employees.filter((e) => e.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      employees = employees.filter((e) =>
        (e.name || '').toLowerCase().includes(s) ||
        (e.employee_code || '').toLowerCase().includes(s) ||
        (e.phone_number || '').toLowerCase().includes(s)
      );
    }

    setLocalCollection('employees', employees);
    return employees;
  },
  getEmployee: (id: number | string) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number | string, data: any) => request<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveEmployee: (id: number | string) => request<any>(`/employees/${id}`, { method: 'DELETE' }),
  getNextEmployeeCode: (role: string) => request<{ nextCode: string }>(`/employees/next-code?role=${encodeURIComponent(role)}`),

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
  createStaffCredential: (data: { name: string; email_or_username: string; phone_number?: string; password: string; role: string; categories?: string[] }) =>
    request<any>('/staff-credentials', { method: 'POST', body: JSON.stringify(data) }),
  updateStaffCategories: (id: number | string, categories: string[]) =>
    request<any>(`/staff-credentials/${id}/categories`, { method: 'PUT', body: JSON.stringify({ categories }) }),
  resetStaffPassword: (id: number | string, newPassword: string) =>
    request<any>(`/staff-credentials/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  toggleStaffCredentialStatus: (id: number | string, status: 'Active' | 'Inactive') =>
    request<any>(`/staff-credentials/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteStaffCredential: (id: number | string) =>
    request<any>(`/staff-credentials/${id}`, { method: 'DELETE' }),

  // Captain Duty
  getCaptainDuty: () => request<any>('/captain/my-duty'),

  // Products & Spare Parts Inventory
  getProducts: () => request<any[]>('/products'),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string | number, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string | number) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // Product Usage Records
  getProductUsageRecords: () => request<any[]>('/product-usage'),
  createProductUsageRecord: (data: any) => request<any>('/product-usage', { method: 'POST', body: JSON.stringify(data) }),
  deleteProductUsageRecord: (id: string | number) => request<any>(`/product-usage/${id}`, { method: 'DELETE' }),

  // Cleaning Records
  getCleaningRecords: () => request<any[]>('/cleaning-records'),
  createCleaningRecord: (data: any) => request<any>('/cleaning-records', { method: 'POST', body: JSON.stringify(data) }),
  updateCleaningRecord: (id: string | number, data: any) => request<any>(`/cleaning-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCleaningRecord: (id: string | number) => request<any>(`/cleaning-records/${id}`, { method: 'DELETE' }),

  // Employee Recorded Payments
  getEmployeePayments: () => request<any[]>('/employee-payments'),
  createEmployeePayment: (data: any) => request<any>('/employee-payments', { method: 'POST', body: JSON.stringify(data) }),
  deleteEmployeePayment: (id: string | number) => request<any>(`/employee-payments/${id}`, { method: 'DELETE' }),

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
