import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

export function runSeed() {
  initDatabase();

  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM administrators WHERE email_or_username = ?').get('admin@charvik.com');
  if (existingAdmin) {
    return;
  }

  console.log('Initializing essential system credentials & settings...');

  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Admin Manager', 'admin@charvik.com', '9876543210', passwordHash, 'Super Admin', 'Active');

  // Seed default Captain & Supporter accounts
  const captainHash = bcrypt.hashSync('captain123', 10);
  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Fleet Captain', 'captain@charvik.com', '9701055555', captainHash, 'Captain', 'Active');

  const supporterHash = bcrypt.hashSync('supporter123', 10);
  db.prepare(`
    INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Support Staff Member', 'supporter@charvik.com', '9848033445', supporterHash, 'Support Staff', 'Active');

  // Seed Application Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO application_settings (key, value, description) VALUES (?, ?, ?)');
  insertSetting.run('company_name', 'Charvik Staffing Consultancy', 'Official business name');
  insertSetting.run('company_email', 'contact@charvikstaffing.com', 'Company contact email');
  insertSetting.run('company_phone', '+91 98765 43210', 'Primary phone');
  insertSetting.run('office_address', 'Plot 42, Transport Nagar, Vijayawada, Andhra Pradesh - 520007', 'Head office address');
  insertSetting.run('upcoming_km_threshold', '1000', 'Kilometres before due to alert');
  insertSetting.run('upcoming_days_threshold', '15', 'Days before due date to alert');
  insertSetting.run('tyre_interval_km', '10000', 'Default tyre check interval');
  insertSetting.run('ac_interval_km', '10000', 'Default AC service interval');
  insertSetting.run('oil_filter_interval_km', '40000', 'Default oil & DPF filter interval');
  insertSetting.run('engine_interval_km', '120000', 'Default engine service interval');
  insertSetting.run('battery_interval_km', '10000', 'Default battery check interval');

  console.log('✅ Essential accounts and settings initialized. Zero dummy data inserted.');
}
