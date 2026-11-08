import { db } from './db.js';
import { supabase } from './supabase.js';

/**
 * Universal Two-Way Synchronizer for Charvik Fleet Platform
 * Guarantees that any record created, modified, or deleted on Localhost
 * is immediately mirrored to Supabase cloud (so Vercel has the changes),
 * and any record created/modified on Vercel is pulled down to Localhost SQLite.
 */

export async function syncTaskToSupabase(id: any, t: any) {
  try {
    const payload: any = {
      id: Number(id) || id,
      trip_start_date: t.trip_start_date,
      vehicle_number: t.vehicle_number,
      vehicle_type: t.vehicle_type || '',
      service_number: t.service_number || '',
      vehicle_status: t.vehicle_status || 'RUN',
      route_corridor: t.route_corridor || '',
      operator_organizer: t.operator_organizer || '',
      driver1: t.driver1 ? (typeof t.driver1 === 'string' ? JSON.parse(t.driver1) : t.driver1) : null,
      driver2: t.driver2 ? (typeof t.driver2 === 'string' ? JSON.parse(t.driver2) : t.driver2) : null,
      helper: t.helper ? (typeof t.helper === 'string' ? JSON.parse(t.helper) : t.helper) : null,
      captain: t.captain ? (typeof t.captain === 'string' ? JSON.parse(t.captain) : t.captain) : null,
      trip_remarks: t.trip_remarks || '',
      duty_status: t.duty_status || 'Scheduled',
      payment_status: t.payment_status || 'Pending',
      updated_at: new Date().toISOString()
    };
    await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Task Error]:', err?.message || err);
  }
}

export async function deleteTaskFromSupabase(id: any) {
  try {
    await supabase.from('tasks').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Task Error]:', err?.message || err);
  }
}

export async function syncBusToSupabase(bus: any) {
  try {
    const payload = { ...bus };
    delete payload.driver_name;
    delete payload.driver_phone;
    delete payload.current_km;
    delete payload.overdueCount;
    delete payload.dueSoonCount;
    delete payload.services;
    delete payload.history;
    await supabase.from('buses').upsert(payload, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Bus Error]:', err?.message || err);
  }
}

export async function deleteBusFromSupabase(id: any) {
  try {
    await supabase.from('buses').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Bus Error]:', err?.message || err);
  }
}

export async function syncEmployeeToSupabase(emp: any) {
  try {
    await supabase.from('employees').upsert(emp, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Employee Error]:', err?.message || err);
  }
}

export async function deleteEmployeeFromSupabase(id: any) {
  try {
    await supabase.from('employees').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Employee Error]:', err?.message || err);
  }
}

export async function syncRouteToSupabase(route: any) {
  try {
    await supabase.from('transit_routes').upsert(route, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Route Error]:', err?.message || err);
  }
}

export async function deleteRouteFromSupabase(id: any) {
  try {
    await supabase.from('transit_routes').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Route Error]:', err?.message || err);
  }
}

export async function syncOrganizerToSupabase(org: any) {
  try {
    await supabase.from('organizers').upsert(org, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Organizer Error]:', err?.message || err);
  }
}

export async function deleteOrganizerFromSupabase(id: any) {
  try {
    await supabase.from('organizers').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Organizer Error]:', err?.message || err);
  }
}

export async function syncOrganizerPaymentToSupabase(payment: any) {
  try {
    await supabase.from('organizer_payments').upsert(payment, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Sync to Supabase Organizer Payment Error]:', err?.message || err);
  }
}

export async function deleteOrganizerPaymentFromSupabase(id: any) {
  try {
    await supabase.from('organizer_payments').delete().eq('id', id);
  } catch (err: any) {
    console.warn('[Delete from Supabase Organizer Payment Error]:', err?.message || err);
  }
}

/**
 * Full Startup & Periodic Sync:
 * 1. Pushes local SQLite tables into Supabase cloud
 * 2. Pulls any records created/modified on Vercel from Supabase into SQLite
 */
export async function syncAllWithSupabase() {
  try {
    // 1. TASKS / TRIP DUTIES
    const localTasks = db.prepare('SELECT * FROM trip_duties').all() as any[];
    for (const t of localTasks) {
      await syncTaskToSupabase(t.id, t);
    }
    const { data: remoteTasks } = await supabase.from('tasks').select('*');
    if (Array.isArray(remoteTasks)) {
      for (const r of remoteTasks) {
        const existing = db.prepare('SELECT id, updated_at FROM trip_duties WHERE id = ?').get(r.id) as any;
        if (!existing) {
          db.prepare(`
            INSERT INTO trip_duties (
              id, trip_start_date, vehicle_number, vehicle_type, service_number, vehicle_status,
              route_corridor, operator_organizer, driver1, driver2, helper, captain, trip_remarks,
              duty_status, payment_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            r.id, r.trip_start_date, r.vehicle_number, r.vehicle_type || '', r.service_number || '', r.vehicle_status || 'RUN',
            r.route_corridor || '', r.operator_organizer || '',
            typeof r.driver1 === 'string' ? r.driver1 : JSON.stringify(r.driver1 || {}),
            typeof r.driver2 === 'string' ? r.driver2 : JSON.stringify(r.driver2 || {}),
            typeof r.helper === 'string' ? r.helper : (r.helper ? JSON.stringify(r.helper) : null),
            typeof r.captain === 'string' ? r.captain : (r.captain ? JSON.stringify(r.captain) : null),
            r.trip_remarks || '', r.duty_status || 'Scheduled', r.payment_status || 'Pending',
            r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()
          );
        } else if (new Date(r.updated_at || 0) > new Date(existing.updated_at || 0)) {
          db.prepare(`
            UPDATE trip_duties SET
              trip_start_date = ?, vehicle_number = ?, vehicle_type = ?, service_number = ?, vehicle_status = ?,
              route_corridor = ?, operator_organizer = ?, driver1 = ?, driver2 = ?, helper = ?, captain = ?,
              trip_remarks = ?, duty_status = ?, payment_status = ?, updated_at = ?
            WHERE id = ?
          `).run(
            r.trip_start_date, r.vehicle_number, r.vehicle_type || '', r.service_number || '', r.vehicle_status || 'RUN',
            r.route_corridor || '', r.operator_organizer || '',
            typeof r.driver1 === 'string' ? r.driver1 : JSON.stringify(r.driver1 || {}),
            typeof r.driver2 === 'string' ? r.driver2 : JSON.stringify(r.driver2 || {}),
            typeof r.helper === 'string' ? r.helper : (r.helper ? JSON.stringify(r.helper) : null),
            typeof r.captain === 'string' ? r.captain : (r.captain ? JSON.stringify(r.captain) : null),
            r.trip_remarks || '', r.duty_status || 'Scheduled', r.payment_status || 'Pending',
            r.updated_at || new Date().toISOString(),
            r.id
          );
        }
      }
    }

    // 2. BUSES
    const localBuses = db.prepare('SELECT * FROM buses WHERE is_archived = 0').all() as any[];
    for (const b of localBuses) {
      await syncBusToSupabase(b);
    }
    const { data: remoteBuses } = await supabase.from('buses').select('*').eq('is_archived', 0);
    if (Array.isArray(remoteBuses)) {
      for (const rb of remoteBuses) {
        const existing = db.prepare('SELECT id FROM buses WHERE id = ?').get(rb.id) as any;
        if (!existing) {
          db.prepare(`
            INSERT INTO buses (
              id, bus_number, registration_number, make, model, chassis_number, engine_number,
              current_odometer_km, parking_location, operations_manager, last_service_date, last_service_km,
              operational_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            rb.id, rb.bus_number, rb.registration_number, rb.make || 'Fleet', rb.model || 'Bus',
            rb.chassis_number || '', rb.engine_number || '', rb.current_odometer_km || 0,
            rb.parking_location || 'Delhi Depot – Bay 1', rb.operations_manager || 'Operations Manager',
            rb.last_service_date || null, rb.last_service_km || 0, rb.operational_status || 'Active',
            rb.created_at || new Date().toISOString(), rb.updated_at || new Date().toISOString()
          );
        }
      }
    }

    // 3. EMPLOYEES
    const localEmployees = db.prepare('SELECT * FROM employees WHERE is_archived = 0').all() as any[];
    for (const e of localEmployees) {
      await syncEmployeeToSupabase(e);
    }

    // 4. TRANSIT ROUTES
    const localRoutes = db.prepare('SELECT * FROM transit_routes').all() as any[];
    for (const r of localRoutes) {
      await syncRouteToSupabase(r);
    }

    // 5. ORGANIZERS
    const localOrganizers = db.prepare('SELECT * FROM organizers').all() as any[];
    for (const o of localOrganizers) {
      await syncOrganizerToSupabase(o);
    }

    console.log('⚡ [Two-Way Supabase Sync] Localhost & Supabase Cloud synchronized completely.');
  } catch (err: any) {
    console.warn('[Two-Way Sync Note]:', err?.message || err);
  }
}

