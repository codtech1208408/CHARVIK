import { db } from './db.js';
import { supabase, testSupabaseConnection } from './supabase.js';

const TABLES_IN_ORDER = [
  'administrators',
  'application_settings',
  'buses',
  'employees',
  'driver_details',
  'daily_kilometer_entries',
  'maintenance_schedules',
  'tyre_records',
  'ac_maintenance_records',
  'oil_filter_records',
  'battery_records',
  'repair_work_orders',
  'complaints',
  'bus_condition_inspections',
  'audit_logs',
];

export async function migrateAllData() {
  console.log('🚀 Starting Data Migration: SQLite -> Supabase...\n');

  // Verify connection first
  const status = await testSupabaseConnection();
  if (!status.connected) {
    console.error('❌ Supabase connection failed:', status.message);
    process.exit(1);
  }

  if (status.tablesInitialized === false) {
    console.error('⚠️  Supabase tables have not been created yet in PostgreSQL.');
    console.error('👉 Please execute "supabase_schema.sql" in your Supabase SQL Editor first, then rerun this script.');
    process.exit(1);
  }

  for (const table of TABLES_IN_ORDER) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (!rows || rows.length === 0) {
        console.log(`ℹ️  [${table}] No rows found in SQLite. Skipped.`);
        continue;
      }

      console.log(`⏳ [${table}] Migrating ${rows.length} records...`);

      // Supabase bulk upsert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: table === 'application_settings' ? 'key' : 'id' });
        if (error) {
          console.error(`❌ [${table}] Error inserting chunk ${i / chunkSize + 1}:`, error.message);
        }
      }
      console.log(`✅ [${table}] Successfully migrated ${rows.length} rows.`);
    } catch (err: any) {
      console.error(`❌ [${table}] Failed to read or migrate:`, err.message);
    }
  }

  console.log('\n🎉 Migration process completed.');
}

// Run directly if called as a script
if (process.argv[1]?.includes('migrate_to_supabase')) {
  migrateAllData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during migration:', err);
      process.exit(1);
    });
}
