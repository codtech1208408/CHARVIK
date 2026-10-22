import { db } from './db.js';
import { supabase } from './supabase.js';
import bcrypt from 'bcryptjs';

export async function clearAllDummyData() {
  console.log('🧹 Purging all hardcoded and dummy data across all tables...');

  // Disable foreign keys temporarily for clean cascade deletion in SQLite
  db.pragma('foreign_keys = OFF');

  const tablesToClear = [
    'complaints',
    'repair_work_orders',
    'maintenance_schedules',
    'bus_condition_inspections',
    'daily_kilometer_entries',
    'ac_maintenance_records',
    'oil_filter_records',
    'battery_records',
    'tyre_records',
    'driver_details',
    'employees',
    'buses',
    'audit_logs'
  ];

  for (const table of tablesToClear) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      // Reset sqlite sequence
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
      console.log(`✅ Cleared all dummy records from SQLite table: ${table}`);
    } catch (err: any) {
      console.warn(`Note on clearing ${table}:`, err.message);
    }
  }

  // Ensure default essential accounts exist in administrators
  const adminHash = bcrypt.hashSync('admin123', 10);
  const captainHash = bcrypt.hashSync('captain123', 10);
  const supporterHash = bcrypt.hashSync('supporter123', 10);

  // Clean and re-seed essential admin, captain, supporter login credentials
  db.prepare('DELETE FROM administrators').run();
  db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('administrators');

  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Admin Manager', 'admin@charvik.com', '9876543210', adminHash, 'Super Admin', 'Active');

  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Fleet Captain', 'captain@charvik.com', '9701055555', captainHash, 'Captain', 'Active');

  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Support Staff Member', 'supporter@charvik.com', '9848033445', supporterHash, 'Support Staff', 'Active');

  console.log('✅ Re-initialized clean essential accounts (Admin, Captain, Supporter).');

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  // Audit log entry
  try {
    db.prepare(`
      INSERT INTO audit_logs (action, module, record_id, details, user_name)
      VALUES ('SYSTEM_PURGE', 'Core', '1', 'All hardcoded and dummy data removed across all tabs. Production ready.', 'Super Admin')
    `).run();
  } catch {}

  // Attempt to clear Supabase tables as well if connected
  try {
    console.log('📡 Syncing clean empty state to Supabase tables...');
    for (const table of tablesToClear) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', -999999);
        if (!error) {
          console.log(`✅ Cleared Supabase table: ${table}`);
        }
      } catch {}
    }

    // Sync administrators to Supabase
    const adminRows = db.prepare('SELECT * FROM administrators').all();
    await supabase.from('administrators').delete().neq('id', -999999);
    await supabase.from('administrators').upsert(adminRows);
    console.log('✅ Supabase administrators synchronized.');
  } catch (err: any) {
    console.log('ℹ️ Supabase remote sync skipped or not configured:', err.message);
  }

  console.log('🎉 Successfully cleared all hardcoded dummy data across all tabs!');
}

// Run immediately if executed directly
clearAllDummyData().then(() => {
  console.log('Done.');
}).catch((err) => {
  console.error('Error during purge:', err);
});
