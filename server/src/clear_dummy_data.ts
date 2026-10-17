import { db } from './db';

// Clear out dummy operational records
const tablesToClear = [
  'complaints',
  'repair_work_orders',
  'maintenance_schedules',
  'bus_condition_inspections',
  'daily_kilometer_entries',
  'ac_maintenance_records',
  'oil_filter_records',
  'battery_records',
  'tyre_records'
];

for (const table of tablesToClear) {
  db.prepare(`DELETE FROM ${table}`).run();
  console.log(`Cleared dummy records from ${table}`);
}

// Reset bus operational status to 'Active' for all buses
db.prepare(`UPDATE buses SET operational_status = 'Active' WHERE operational_status = 'Under Maintenance'`).run();

// Clean up audit logs
db.prepare(`DELETE FROM audit_logs`).run();
db.prepare(`
  INSERT INTO audit_logs (action, module, record_id, details, user_name)
  VALUES ('SYSTEM_INIT', 'Core', '1', 'System cleared of dummy mock data. Production ready.', 'Super Admin')
`).run();

console.log('Successfully cleared all hardcoded and dummy operational records!');
