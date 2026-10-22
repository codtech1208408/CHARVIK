import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'charvik.db');
export const db = new Database(dbPath);

// Enable WAL mode & foreign keys for concurrency and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Administrators
    CREATE TABLE IF NOT EXISTS administrators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email_or_username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Super Admin',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employees (shared between Drivers, Helpers, Captains)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL, -- 'Driver', 'Helper', 'Captain'
      full_name TEXT NOT NULL,
      gender TEXT DEFAULT 'Male',
      date_of_birth DATE,
      email TEXT,
      phone_number TEXT NOT NULL,
      alternative_phone_number TEXT,
      profile_photo TEXT,
      
      -- Sensitive Identity Documents
      aadhaar_number TEXT,
      aadhaar_front_doc TEXT,
      aadhaar_back_doc TEXT,
      pan_number TEXT,
      pan_doc TEXT,

      -- Bank Details
      bank_name TEXT,
      bank_proof_doc TEXT,
      account_holder_name TEXT,
      account_number TEXT,
      ifsc_code TEXT,
      branch TEXT,

      -- Reference Details
      reference_name TEXT,
      reference_phone TEXT,
      reference_alt_phone TEXT,

      -- Employment Details
      joining_date DATE,
      employment_status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'On Leave', 'Suspended', 'Resigned', 'Terminated'
      assigned_bus_id INTEGER,
      internal_remarks TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Driver Specific Licence Details
    CREATE TABLE IF NOT EXISTS driver_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      licence_number TEXT NOT NULL,
      licence_front_doc TEXT,
      licence_back_doc TEXT,
      issuing_state TEXT,
      issuing_rto_office TEXT,
      licence_issue_date DATE,
      licence_validity_date DATE NOT NULL,
      licence_experience_years INTEGER DEFAULT 0,
      criminal_background_details TEXT,
      licence_verification_status TEXT DEFAULT 'Verified', -- 'Not Verified', 'Pending Verification', 'Verified', 'Rejected', 'Expired'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Buses (Fleet Master)
    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_number TEXT UNIQUE NOT NULL,
      registration_number TEXT UNIQUE NOT NULL,
      make TEXT,
      model TEXT,
      bus_type TEXT DEFAULT 'School Bus', -- 'School Bus', 'Staff Bus', 'Contract Bus', 'Other'
      manufacturing_year INTEGER,
      purchase_date DATE,
      chassis_number TEXT,
      engine_number TEXT,
      fuel_type TEXT DEFAULT 'Diesel',
      seating_capacity INTEGER DEFAULT 45,
      insurance_expiry DATE,
      fitness_expiry DATE,
      permit_expiry DATE,
      puc_expiry DATE,
      current_odometer_km INTEGER DEFAULT 0,
      operational_status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'Under Maintenance', 'Out of Service'
      assigned_driver_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      assigned_helper_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      notes TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Daily Kilometer Entries
    CREATE TABLE IF NOT EXISTS daily_kilometer_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date DATE NOT NULL,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      driver_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      opening_km INTEGER NOT NULL,
      closing_km INTEGER NOT NULL,
      distance_travelled_km INTEGER NOT NULL,
      remarks TEXT,
      is_corrected INTEGER DEFAULT 0,
      correction_reason TEXT,
      corrected_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Maintenance Schedules (Preventive)
    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      maintenance_type TEXT NOT NULL, -- 'General Service', 'Tyre Maintenance', 'AC Maintenance', 'Oil Replacement', 'Filter Replacement', 'Battery Check', 'Brake Inspection', 'Engine Inspection', 'Other'
      last_service_date DATE,
      last_service_km INTEGER,
      interval_km INTEGER,
      next_due_date DATE,
      next_due_km INTEGER,
      priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
      assigned_to TEXT,
      estimated_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Due', 'Overdue', 'In Progress', 'Completed', 'Cancelled'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tyre Records
    CREATE TABLE IF NOT EXISTS tyre_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      tyre_serial_number TEXT NOT NULL,
      brand TEXT,
      size TEXT,
      tyre_position TEXT, -- 'Front Left', 'Front Right', 'Rear Left', 'Rear Right', 'Inner Left', 'Inner Right', 'Spare', 'Other'
      installation_date DATE,
      installation_km INTEGER,
      last_inspection_date DATE,
      tread_depth_mm REAL,
      tyre_pressure_psi REAL,
      condition TEXT DEFAULT 'Good', -- 'Good', 'Worn', 'Damaged', 'Needs Replacement', 'Replaced'
      rotation_date DATE,
      replacement_date DATE,
      removal_km INTEGER,
      supplier TEXT,
      cost REAL DEFAULT 0,
      remarks TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AC Maintenance Records
    CREATE TABLE IF NOT EXISTS ac_maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      inspection_date DATE NOT NULL,
      current_km INTEGER,
      ac_working_status TEXT DEFAULT 'Working', -- 'Working', 'Needs Inspection', 'Needs Repair', 'Under Maintenance', 'Completed'
      cooling_performance TEXT,
      refrigerant_check TEXT,
      filter_cleaning_replacement TEXT,
      compressor_condition TEXT,
      leak_inspection TEXT,
      electrical_check TEXT,
      issue_description TEXT,
      work_performed TEXT,
      service_provider TEXT,
      next_service_date DATE,
      next_service_km INTEGER,
      service_cost REAL DEFAULT 0,
      technician TEXT,
      status TEXT DEFAULT 'Working',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Oil and Filter Records
    CREATE TABLE IF NOT EXISTS oil_filter_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      replacement_date DATE NOT NULL,
      odometer_km INTEGER,
      oil_type TEXT,
      oil_brand TEXT,
      oil_quantity_liters REAL,
      oil_cost REAL DEFAULT 0,
      oil_filter_replaced INTEGER DEFAULT 1,
      oil_filter_details TEXT,
      air_filter_replaced INTEGER DEFAULT 0,
      air_filter_details TEXT,
      fuel_filter_replaced INTEGER DEFAULT 0,
      fuel_filter_details TEXT,
      other_filter_details TEXT,
      labour_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      service_provider TEXT,
      next_due_date DATE,
      next_due_km INTEGER,
      performed_by TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Battery Records
    CREATE TABLE IF NOT EXISTS battery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      inspection_date DATE NOT NULL,
      current_km INTEGER,
      battery_brand TEXT,
      serial_number TEXT,
      battery_type TEXT,
      battery_voltage REAL,
      measured_voltage REAL,
      battery_health TEXT DEFAULT 'Good', -- 'Good', 'Needs Monitoring', 'Weak', 'Replace Soon', 'Failed'
      terminal_condition TEXT,
      charging_system_status TEXT,
      installation_date DATE,
      warranty_expiry_date DATE,
      replacement_date DATE,
      battery_cost REAL DEFAULT 0,
      technician TEXT,
      next_check_date DATE,
      status TEXT DEFAULT 'Active',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Complaints
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_ref TEXT UNIQUE NOT NULL,
      reported_date DATETIME NOT NULL,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      reported_by TEXT NOT NULL,
      contact_number TEXT,
      category TEXT NOT NULL, -- 'Engine', 'Tyre', 'AC', 'Battery', 'Oil or Filter', 'Brakes', 'Electrical', 'Body Damage', 'Safety', 'Other'
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
      assigned_staff TEXT,
      assigned_vendor TEXT,
      status TEXT DEFAULT 'Open', -- 'Open', 'Assigned', 'In Progress', 'On Hold', 'Resolved', 'Closed'
      expected_resolution_date DATE,
      resolution_description TEXT,
      resolved_date DATETIME,
      linked_repair_id INTEGER,
      attachments TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Repairs and Service (Work Orders)
    CREATE TABLE IF NOT EXISTS repair_work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_number TEXT UNIQUE NOT NULL,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      linked_complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
      repair_category TEXT,
      problem_description TEXT NOT NULL,
      reported_date DATE,
      work_start_date DATE,
      work_completion_date DATE,
      odometer_km INTEGER,
      diagnosis TEXT,
      work_performed TEXT,
      parts_replaced TEXT,
      labour_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      other_charges REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      workshop_vendor TEXT,
      assigned_technician TEXT,
      bus_availability_status TEXT DEFAULT 'Under Maintenance',
      warranty_details TEXT,
      invoice_doc TEXT,
      next_followup_date DATE,
      status TEXT DEFAULT 'In Progress', -- 'Requested', 'Approved', 'In Progress', 'Waiting for Parts', 'Waiting for Approval', 'Completed', 'Cancelled'
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bus Condition Inspections
    CREATE TABLE IF NOT EXISTS bus_condition_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_ref TEXT UNIQUE NOT NULL,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      inspection_date DATE NOT NULL,
      inspection_time TEXT,
      odometer_km INTEGER,
      inspector_name TEXT NOT NULL,
      exterior_body TEXT DEFAULT 'Good', -- 'Good', 'Needs Attention', 'Defective', 'Not Applicable'
      tyre_condition TEXT DEFAULT 'Good',
      brake_condition TEXT DEFAULT 'Good',
      engine_condition TEXT DEFAULT 'Good',
      battery_condition TEXT DEFAULT 'Good',
      ac_condition TEXT DEFAULT 'Good',
      lights_condition TEXT DEFAULT 'Good',
      mirrors_condition TEXT DEFAULT 'Good',
      windshield_condition TEXT DEFAULT 'Good',
      wiper_condition TEXT DEFAULT 'Good',
      doors_emergency_exits TEXT DEFAULT 'Good',
      seat_condition TEXT DEFAULT 'Good',
      safety_equipment TEXT DEFAULT 'Good',
      fluid_levels TEXT DEFAULT 'Good',
      visible_leaks TEXT DEFAULT 'Good',
      roadworthiness_status TEXT DEFAULT 'Fit for Service', -- 'Fit for Service', 'Fit with Restrictions', 'Not Fit for Service'
      defects_found TEXT,
      corrective_action_required TEXT,
      linked_complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
      photo_attachments TEXT,
      inspector_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      user_name TEXT DEFAULT 'Admin',
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Application Settings
    CREATE TABLE IF NOT EXISTS application_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high-performance filtering & search
    CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON buses(bus_number);
    CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(operational_status);
    CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
    CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
    CREATE INDEX IF NOT EXISTS idx_daily_km_bus_date ON daily_kilometer_entries(bus_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_maintenance_due ON maintenance_schedules(status, next_due_date, next_due_km);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, priority);
    CREATE INDEX IF NOT EXISTS idx_repairs_status ON repair_work_orders(status);
  `);

  try {
    db.exec('ALTER TABLE administrators ADD COLUMN phone_number TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE buses ADD COLUMN assigned_captain_id INTEGER;');
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec("UPDATE administrators SET phone_number = '9701055555' WHERE role = 'Captain' AND (phone_number IS NULL OR phone_number = '');");
    db.exec("UPDATE buses SET assigned_captain_id = (SELECT id FROM employees WHERE role = 'Captain' LIMIT 1) WHERE id = 1;");
    db.exec("UPDATE employees SET assigned_bus_id = 1 WHERE role = 'Captain' AND id = (SELECT id FROM employees WHERE role = 'Captain' LIMIT 1);");
  } catch (e) {}
}
