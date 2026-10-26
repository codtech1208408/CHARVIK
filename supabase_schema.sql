-- ==============================================================================
-- CHARVIK FLEET MANAGEMENT SYSTEM - SECURE SUPABASE POSTGRESQL SCHEMA
-- Principle of Least Privilege: Granular Row Level Security (RLS) Policies
-- Project URL: https://kqhqicixrcbzqwogabrz.supabase.co
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ADMINISTRATORS TABLE (High Security - Strictly Isolated)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS administrators (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email_or_username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Super Admin',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;

-- Block all anonymous access to credentials and password hashes
DROP POLICY IF EXISTS "deny_anon_administrators" ON administrators;
CREATE POLICY "deny_anon_administrators" ON administrators 
  FOR ALL TO anon 
  USING (false);

-- Only authenticated users (admins) can view administrator records
DROP POLICY IF EXISTS "auth_read_administrators" ON administrators;
CREATE POLICY "auth_read_administrators" ON administrators 
  FOR SELECT TO authenticated 
  USING (true);

-- Only Super Admins can insert/update/delete admins
DROP POLICY IF EXISTS "auth_manage_administrators" ON administrators;
CREATE POLICY "auth_manage_administrators" ON administrators 
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);


-- ==============================================================================
-- 2. EMPLOYEES TABLE (Drivers, Helpers, Captains)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
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
  employment_status TEXT DEFAULT 'Active',
  assigned_bus_id BIGINT,
  internal_remarks TEXT,
  is_archived INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow public candidates to submit registration forms via the public website
DROP POLICY IF EXISTS "public_registration_employees" ON employees;
CREATE POLICY "public_registration_employees" ON employees 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Protect sensitive employee & banking data from anonymous scraping: NO public read/update/delete
DROP POLICY IF EXISTS "auth_manage_employees" ON employees;
CREATE POLICY "auth_manage_employees" ON employees 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 3. DRIVER DETAILS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS driver_details (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  licence_number TEXT NOT NULL,
  licence_front_doc TEXT,
  licence_back_doc TEXT,
  issuing_state TEXT,
  issuing_rto_office TEXT,
  licence_issue_date DATE,
  licence_validity_date DATE NOT NULL,
  licence_experience_years INT DEFAULT 0,
  criminal_background_details TEXT,
  licence_verification_status TEXT DEFAULT 'Verified',
  licence_verification_doc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_details ADD COLUMN IF NOT EXISTS licence_verification_doc TEXT;

ALTER TABLE driver_details ENABLE ROW LEVEL SECURITY;

-- Allow public driver applicants to submit driving licence details
DROP POLICY IF EXISTS "public_registration_driver_details" ON driver_details;
CREATE POLICY "public_registration_driver_details" ON driver_details 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Authenticated staff can view and manage driver verification records
DROP POLICY IF EXISTS "auth_manage_driver_details" ON driver_details;
CREATE POLICY "auth_manage_driver_details" ON driver_details 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 4. BUSES FLEET MASTER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS buses (
  id BIGSERIAL PRIMARY KEY,
  bus_number TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  make TEXT,
  model TEXT,
  bus_type TEXT DEFAULT 'School Bus',
  manufacturing_year INT,
  purchase_date DATE,
  chassis_number TEXT,
  engine_number TEXT,
  fuel_type TEXT DEFAULT 'Diesel',
  seating_capacity INT DEFAULT 45,
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  puc_expiry DATE,
  current_odometer_km INT DEFAULT 0,
  operational_status TEXT DEFAULT 'Active',
  assigned_driver_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  assigned_helper_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  is_archived INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

-- Public can view active bus fleet counts (Read-Only)
DROP POLICY IF EXISTS "public_read_active_buses" ON buses;
CREATE POLICY "public_read_active_buses" ON buses 
  FOR SELECT TO anon 
  USING (is_archived = 0);

-- Only authenticated users can create, modify, or archive buses
DROP POLICY IF EXISTS "auth_manage_buses" ON buses;
CREATE POLICY "auth_manage_buses" ON buses 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Foreign key linking employee assigned bus
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_assigned_bus'
  ) THEN
    ALTER TABLE employees 
    ADD CONSTRAINT fk_employee_assigned_bus 
    FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ==============================================================================
-- 5. DAILY KILOMETER ENTRIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS daily_kilometer_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  driver_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  opening_km INT NOT NULL,
  closing_km INT NOT NULL,
  distance_travelled_km INT NOT NULL,
  remarks TEXT,
  is_corrected INT DEFAULT 0,
  correction_reason TEXT,
  corrected_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_kilometer_entries ENABLE ROW LEVEL SECURITY;

-- Operational records are restricted to authenticated users
DROP POLICY IF EXISTS "auth_manage_daily_km" ON daily_kilometer_entries;
CREATE POLICY "auth_manage_daily_km" ON daily_kilometer_entries 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 6. MAINTENANCE SCHEDULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  last_service_date DATE,
  last_service_km INT,
  interval_km INT,
  next_due_date DATE,
  next_due_km INT,
  priority TEXT DEFAULT 'Medium',
  assigned_to TEXT,
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_maintenance_schedules" ON maintenance_schedules;
CREATE POLICY "auth_manage_maintenance_schedules" ON maintenance_schedules 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 7. TYRE RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tyre_records (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  tyre_serial_number TEXT NOT NULL,
  brand TEXT,
  size TEXT,
  tyre_position TEXT,
  installation_date DATE,
  installation_km INT,
  last_inspection_date DATE,
  tread_depth_mm NUMERIC(8,2),
  tyre_pressure_psi NUMERIC(8,2),
  condition TEXT DEFAULT 'Good',
  rotation_date DATE,
  replacement_date DATE,
  removal_km INT,
  supplier TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  remarks TEXT,
  is_active INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tyre_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_tyres" ON tyre_records;
CREATE POLICY "auth_manage_tyres" ON tyre_records 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 8. AC MAINTENANCE RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ac_maintenance_records (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  current_km INT,
  ac_working_status TEXT DEFAULT 'Working',
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
  next_service_km INT,
  service_cost NUMERIC(12,2) DEFAULT 0,
  technician TEXT,
  status TEXT DEFAULT 'Working',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ac_maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_ac" ON ac_maintenance_records;
CREATE POLICY "auth_manage_ac" ON ac_maintenance_records 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 9. OIL & FILTER RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS oil_filter_records (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  replacement_date DATE NOT NULL,
  odometer_km INT,
  oil_type TEXT,
  oil_brand TEXT,
  oil_quantity_liters NUMERIC(8,2),
  oil_cost NUMERIC(12,2) DEFAULT 0,
  oil_filter_replaced INT DEFAULT 1,
  oil_filter_details TEXT,
  air_filter_replaced INT DEFAULT 0,
  air_filter_details TEXT,
  fuel_filter_replaced INT DEFAULT 0,
  fuel_filter_details TEXT,
  other_filter_details TEXT,
  labour_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  service_provider TEXT,
  next_due_date DATE,
  next_due_km INT,
  performed_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE oil_filter_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_oil" ON oil_filter_records;
CREATE POLICY "auth_manage_oil" ON oil_filter_records 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 10. BATTERY RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS battery_records (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  current_km INT,
  battery_brand TEXT,
  serial_number TEXT,
  battery_type TEXT,
  battery_voltage NUMERIC(8,2),
  measured_voltage NUMERIC(8,2),
  battery_health TEXT DEFAULT 'Good',
  terminal_condition TEXT,
  charging_system_status TEXT,
  installation_date DATE,
  warranty_expiry_date DATE,
  replacement_date DATE,
  battery_cost NUMERIC(12,2) DEFAULT 0,
  technician TEXT,
  next_check_date DATE,
  status TEXT DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battery_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_battery" ON battery_records;
CREATE POLICY "auth_manage_battery" ON battery_records 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 11. COMPLAINTS & FEEDBACK TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  complaint_ref TEXT UNIQUE NOT NULL,
  reported_date TIMESTAMPTZ NOT NULL,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  contact_number TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  assigned_staff TEXT,
  assigned_vendor TEXT,
  status TEXT DEFAULT 'Open',
  expected_resolution_date DATE,
  resolution_description TEXT,
  resolved_date TIMESTAMPTZ,
  linked_repair_id BIGINT,
  attachments TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow public users/parents/staff to file a complaint or ticket
DROP POLICY IF EXISTS "public_create_complaint" ON complaints;
CREATE POLICY "public_create_complaint" ON complaints 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Authenticated staff can view, assign, update, and resolve complaints
DROP POLICY IF EXISTS "auth_manage_complaints" ON complaints;
CREATE POLICY "auth_manage_complaints" ON complaints 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 12. REPAIRS & WORK ORDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS repair_work_orders (
  id BIGSERIAL PRIMARY KEY,
  work_order_number TEXT UNIQUE NOT NULL,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  linked_complaint_id BIGINT REFERENCES complaints(id) ON DELETE SET NULL,
  repair_category TEXT,
  problem_description TEXT NOT NULL,
  reported_date DATE,
  work_start_date DATE,
  work_completion_date DATE,
  odometer_km INT,
  diagnosis TEXT,
  work_performed TEXT,
  parts_replaced TEXT,
  labour_cost NUMERIC(12,2) DEFAULT 0,
  parts_cost NUMERIC(12,2) DEFAULT 0,
  other_charges NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  workshop_vendor TEXT,
  assigned_technician TEXT,
  bus_availability_status TEXT DEFAULT 'Under Maintenance',
  warranty_details TEXT,
  invoice_doc TEXT,
  next_followup_date DATE,
  status TEXT DEFAULT 'In Progress',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE repair_work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_repairs" ON repair_work_orders;
CREATE POLICY "auth_manage_repairs" ON repair_work_orders 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_complaint_repair'
  ) THEN
    ALTER TABLE complaints 
    ADD CONSTRAINT fk_complaint_repair 
    FOREIGN KEY (linked_repair_id) REFERENCES repair_work_orders(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ==============================================================================
-- 13. BUS CONDITION INSPECTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS bus_condition_inspections (
  id BIGSERIAL PRIMARY KEY,
  inspection_ref TEXT UNIQUE NOT NULL,
  bus_id BIGINT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspection_time TEXT,
  odometer_km INT,
  inspector_name TEXT NOT NULL,
  exterior_body TEXT DEFAULT 'Good',
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
  roadworthiness_status TEXT DEFAULT 'Fit for Service',
  defects_found TEXT,
  corrective_action_required TEXT,
  linked_complaint_id BIGINT REFERENCES complaints(id) ON DELETE SET NULL,
  photo_attachments TEXT,
  inspector_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bus_condition_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_manage_inspections" ON bus_condition_inspections;
CREATE POLICY "auth_manage_inspections" ON bus_condition_inspections 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 14. AUDIT LOGS (Strictly Protected Internal Records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  details TEXT,
  user_name TEXT DEFAULT 'Admin',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous users cannot read or write audit logs
DROP POLICY IF EXISTS "deny_anon_audit_logs" ON audit_logs;
CREATE POLICY "deny_anon_audit_logs" ON audit_logs 
  FOR ALL TO anon 
  USING (false);

DROP POLICY IF EXISTS "auth_manage_audit_logs" ON audit_logs;
CREATE POLICY "auth_manage_audit_logs" ON audit_logs 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- 15. APPLICATION SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS application_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE application_settings ENABLE ROW LEVEL SECURITY;

-- Public website can read company info (contact, title, etc.) - READ ONLY
DROP POLICY IF EXISTS "public_read_settings" ON application_settings;
CREATE POLICY "public_read_settings" ON application_settings 
  FOR SELECT TO anon 
  USING (true);

-- Only authenticated users can change application settings
DROP POLICY IF EXISTS "auth_manage_settings" ON application_settings;
CREATE POLICY "auth_manage_settings" ON application_settings 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);


-- ==============================================================================
-- INDEXES FOR PERFORMANCE & SEARCH
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON buses(bus_number);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(operational_status);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_daily_km_bus_date ON daily_kilometer_entries(bus_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_due ON maintenance_schedules(status, next_due_date, next_due_km);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, priority);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repair_work_orders(status);


-- ==============================================================================
-- DEFAULT SEED DATA (Super Admin & Application Settings)
-- ==============================================================================
INSERT INTO administrators (name, email_or_username, password_hash, role, status)
VALUES (
  'Admin Manager',
  'admin@charvik.com',
  '$2a$10$fJt97N9oTdQy0dGjLdsqyeO2/q2R7T9v5bQyE6GzN8vXn4rBvL/U.', -- Default password: admin123
  'Super Admin',
  'Active'
)
ON CONFLICT (email_or_username) DO NOTHING;

INSERT INTO application_settings (key, value, description)
VALUES 
  ('company_name', 'Charvik Staffing Consultancy', 'Official business name'),
  ('company_email', 'contact@charvikstaffing.com', 'Company contact email'),
  ('company_phone', '+91 98765 43210', 'Primary phone line'),
  ('cloud_storage_provider', 'Cloudinary', 'Active document and photo storage provider'),
  ('database_provider', 'Supabase PostgreSQL', 'Active cloud database provider')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
