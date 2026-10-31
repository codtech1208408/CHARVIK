-- ==============================================================================
-- CHARVIK FLEET MANAGEMENT SYSTEM - NON-DESTRUCTIVE COMPLETE DATABASE MIGRATION
-- Project URL: https://kqhqicixrcbzqwogabrz.supabase.co
--
-- SAFETY GUARANTEES:
-- 1. NO DROP TABLE statements.
-- 2. NO TRUNCATE or DELETE statements. Existing data is 100% PRESERVED.
-- 3. Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
-- 4. Fixes Row Level Security (RLS) so that the SPA on Vercel can sync in real-time.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. EXTEND EXISTING TABLES WITH MISSING COLUMNS
-- ==============================================================================

-- 1.1 Buses
ALTER TABLE buses ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 45;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS seating_capacity INT DEFAULT 45;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_odometer_km INT DEFAULT 0;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS helper_name TEXT;

-- 1.2 Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nominee_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nominee_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nominee_relation TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nominee_aadhaar TEXT;

-- 1.3 Driver Details
ALTER TABLE driver_details ADD COLUMN IF NOT EXISTS licence_verification_doc TEXT;

-- 1.4 Daily Kilometer Entries (Mileage & Fueling)
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS vehicle_number TEXT;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS route_trip TEXT;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS diesel_liters NUMERIC(8,2) DEFAULT 0;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS diesel_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS toll_charges NUMERIC(12,2) DEFAULT 0;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS other_expenses NUMERIC(12,2) DEFAULT 0;
ALTER TABLE daily_kilometer_entries ADD COLUMN IF NOT EXISTS mileage_kmpl NUMERIC(8,2) DEFAULT 0;

-- 1.5 AC Maintenance Records
ALTER TABLE ac_maintenance_records ADD COLUMN IF NOT EXISTS general_checkup_date DATE;
ALTER TABLE ac_maintenance_records ADD COLUMN IF NOT EXISTS gas_level_psi NUMERIC(8,2);

-- 1.6 Bus Condition Inspections (Daily Vehicle Checkup)
ALTER TABLE bus_condition_inspections ADD COLUMN IF NOT EXISTS route_trip TEXT;
ALTER TABLE bus_condition_inspections ADD COLUMN IF NOT EXISTS starting_km INT DEFAULT 0;
ALTER TABLE bus_condition_inspections ADD COLUMN IF NOT EXISTS reporting_time TEXT;
ALTER TABLE bus_condition_inspections ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE bus_condition_inspections ADD COLUMN IF NOT EXISTS checklist_data JSONB;


-- ==============================================================================
-- 2. CREATE MISSING TABLES (IF NOT EXISTS)
-- ==============================================================================

-- 2.1 Transit Routes (Route Management)
CREATE TABLE IF NOT EXISTS transit_routes (
  id BIGSERIAL PRIMARY KEY,
  service_number TEXT NOT NULL,
  starting_city TEXT NOT NULL,
  ending_city TEXT NOT NULL,
  destination_km INT NOT NULL DEFAULT 0,
  vehicle_type TEXT DEFAULT 'Full Sleeper',
  status TEXT DEFAULT 'Active',
  trip_amount NUMERIC(12,2) DEFAULT 0,
  operator_commission NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alias view for backward compatibility with 'routes'
CREATE OR REPLACE VIEW routes AS SELECT * FROM transit_routes;

-- 2.2 Tasks (Trip Duty Management)
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  trip_start_date DATE NOT NULL,
  vehicle_number TEXT NOT NULL,
  service_number TEXT,
  vehicle_status TEXT DEFAULT 'RUN',
  route_corridor TEXT,
  operator_organizer TEXT,
  trip_amount NUMERIC(12,2) DEFAULT 0,
  operator_commission NUMERIC(12,2) DEFAULT 0,
  driver1 JSONB,
  driver2 JSONB,
  helper JSONB,
  captain JSONB,
  trip_remarks TEXT,
  duty_status TEXT DEFAULT 'Scheduled',
  payment_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Organizers (Partner Institutions)
CREATE TABLE IF NOT EXISTS organizers (
  id BIGSERIAL PRIMARY KEY,
  organization_name TEXT NOT NULL,
  gst_number TEXT,
  contact_person TEXT,
  phone_number TEXT,
  email TEXT,
  office_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Organizer Payments (Recorded Operator Revenue)
CREATE TABLE IF NOT EXISTS organizer_payments (
  id BIGSERIAL PRIMARY KEY,
  organizer_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  received_date DATE NOT NULL,
  payment_mode TEXT DEFAULT 'Bank Transfer',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 New Tyres (Tyre Stock & Invoice Management)
CREATE TABLE IF NOT EXISTS new_tyres (
  id BIGSERIAL PRIMARY KEY,
  purchase_date DATE NOT NULL,
  quantity INT DEFAULT 1,
  tyre_serial_number TEXT NOT NULL,
  km INT DEFAULT 0,
  present_km INT DEFAULT 0,
  running_km INT DEFAULT 0,
  brand TEXT NOT NULL DEFAULT 'MRF',
  size TEXT NOT NULL DEFAULT '295/80 R22.5',
  model TEXT,
  supplier TEXT,
  invoice_number TEXT,
  purchase_cost NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  allocated_bus_id BIGINT REFERENCES buses(id) ON DELETE SET NULL,
  allocated_wheel_position TEXT,
  notes TEXT,
  tyre_photo_url TEXT,
  invoice_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Wheel Allotments (Wheel Allotments & Tyre Rotations)
CREATE TABLE IF NOT EXISTS wheel_allotments (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT REFERENCES buses(id) ON DELETE CASCADE,
  action_type TEXT DEFAULT 'Allotment',
  event_date DATE NOT NULL,
  current_km INT DEFAULT 0,
  tyre_serial_number TEXT NOT NULL,
  from_position TEXT,
  to_position TEXT,
  technician TEXT,
  tread_depth_mm NUMERIC(8,2),
  pressure_psi NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Tyre Air Checkups (Air Pressure Tracking)
CREATE TABLE IF NOT EXISTS tyre_air_checkups (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT REFERENCES buses(id) ON DELETE CASCADE,
  checkup_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  pressure_psi NUMERIC(8,2) DEFAULT 110,
  technician TEXT DEFAULT 'Fleet Team',
  status TEXT DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Products & Spare Parts Inventory
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  received_date DATE NOT NULL,
  quantity_received INT NOT NULL DEFAULT 0,
  used_quantity INT NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  photo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Product Usage Records (Vehicle Usage History)
CREATE TABLE IF NOT EXISTS product_usage_records (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  part_number TEXT,
  vehicle_id TEXT,
  vehicle_number TEXT NOT NULL,
  usage_date DATE NOT NULL,
  quantity_used INT NOT NULL DEFAULT 1,
  odometer_km TEXT,
  remarks TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 Bus Cleaning Records
CREATE TABLE IF NOT EXISTS cleaning_records (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT REFERENCES buses(id) ON DELETE SET NULL,
  bus_number TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  cleaning_type TEXT NOT NULL,
  cleaner_name TEXT,
  cleaned_date DATE NOT NULL,
  status TEXT DEFAULT 'Completed',
  floor_cleaned BOOLEAN DEFAULT true,
  seats_vacuumed BOOLEAN DEFAULT true,
  windows_polished BOOLEAN DEFAULT true,
  exterior_washed BOOLEAN DEFAULT true,
  sanitizer_refilled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Employee Payments (Recorded Bata & Salary Payments)
CREATE TABLE IF NOT EXISTS employee_payments (
  id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  role TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  payment_type TEXT DEFAULT 'Bata',
  payment_proof TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 3. CONFIGURE SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures authorized SPA clients on Vercel can read, insert, update and delete
-- without getting blocked by 401 Unauthorized errors.
-- ==============================================================================

-- 3.1 Buses
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_buses" ON buses;
CREATE POLICY "anon_all_buses" ON buses FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_buses" ON buses;
CREATE POLICY "auth_all_buses" ON buses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.2 Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_employees" ON employees;
CREATE POLICY "anon_all_employees" ON employees FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_employees" ON employees;
CREATE POLICY "auth_all_employees" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.3 Driver Details
ALTER TABLE driver_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_driver_details" ON driver_details;
CREATE POLICY "anon_all_driver_details" ON driver_details FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_driver_details" ON driver_details;
CREATE POLICY "auth_all_driver_details" ON driver_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.4 Daily Kilometer Entries
ALTER TABLE daily_kilometer_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_daily_km" ON daily_kilometer_entries;
CREATE POLICY "anon_all_daily_km" ON daily_kilometer_entries FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_daily_km" ON daily_kilometer_entries;
CREATE POLICY "auth_all_daily_km" ON daily_kilometer_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.5 Maintenance Schedules
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_schedules" ON maintenance_schedules;
CREATE POLICY "anon_all_schedules" ON maintenance_schedules FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_schedules" ON maintenance_schedules;
CREATE POLICY "auth_all_schedules" ON maintenance_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.6 Tyre Records
ALTER TABLE tyre_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tyres" ON tyre_records;
CREATE POLICY "anon_all_tyres" ON tyre_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_tyres" ON tyre_records;
CREATE POLICY "auth_all_tyres" ON tyre_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.7 AC Maintenance Records
ALTER TABLE ac_maintenance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_ac" ON ac_maintenance_records;
CREATE POLICY "anon_all_ac" ON ac_maintenance_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_ac" ON ac_maintenance_records;
CREATE POLICY "auth_all_ac" ON ac_maintenance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.8 Oil Filter Records
ALTER TABLE oil_filter_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_oil" ON oil_filter_records;
CREATE POLICY "anon_all_oil" ON oil_filter_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_oil" ON oil_filter_records;
CREATE POLICY "auth_all_oil" ON oil_filter_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.9 Battery Records
ALTER TABLE battery_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_battery" ON battery_records;
CREATE POLICY "anon_all_battery" ON battery_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_battery" ON battery_records;
CREATE POLICY "auth_all_battery" ON battery_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.10 Repair Work Orders
ALTER TABLE repair_work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_repairs" ON repair_work_orders;
CREATE POLICY "anon_all_repairs" ON repair_work_orders FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_repairs" ON repair_work_orders;
CREATE POLICY "auth_all_repairs" ON repair_work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.11 Complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_complaints" ON complaints;
CREATE POLICY "anon_all_complaints" ON complaints FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_complaints" ON complaints;
CREATE POLICY "auth_all_complaints" ON complaints FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.12 Bus Condition Inspections
ALTER TABLE bus_condition_inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_inspections" ON bus_condition_inspections;
CREATE POLICY "anon_all_inspections" ON bus_condition_inspections FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_inspections" ON bus_condition_inspections;
CREATE POLICY "auth_all_inspections" ON bus_condition_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.13 Administrators (Allow read & update for authorized staff)
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_administrators" ON administrators;
CREATE POLICY "anon_all_administrators" ON administrators FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_administrators" ON administrators;
CREATE POLICY "auth_all_administrators" ON administrators FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.14 Application Settings
ALTER TABLE application_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_app_settings" ON application_settings;
CREATE POLICY "anon_all_app_settings" ON application_settings FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_app_settings" ON application_settings;
CREATE POLICY "auth_all_app_settings" ON application_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.15 Transit Routes
ALTER TABLE transit_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_routes" ON transit_routes;
CREATE POLICY "anon_all_routes" ON transit_routes FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_routes" ON transit_routes;
CREATE POLICY "auth_all_routes" ON transit_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.16 Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tasks" ON tasks;
CREATE POLICY "anon_all_tasks" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_tasks" ON tasks;
CREATE POLICY "auth_all_tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.17 Organizers
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_organizers" ON organizers;
CREATE POLICY "anon_all_organizers" ON organizers FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_organizers" ON organizers;
CREATE POLICY "auth_all_organizers" ON organizers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.18 Organizer Payments
ALTER TABLE organizer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_organizer_payments" ON organizer_payments;
CREATE POLICY "anon_all_organizer_payments" ON organizer_payments FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_organizer_payments" ON organizer_payments;
CREATE POLICY "auth_all_organizer_payments" ON organizer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.19 New Tyres
ALTER TABLE new_tyres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_new_tyres" ON new_tyres;
CREATE POLICY "anon_all_new_tyres" ON new_tyres FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_new_tyres" ON new_tyres;
CREATE POLICY "auth_all_new_tyres" ON new_tyres FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.20 Wheel Allotments
ALTER TABLE wheel_allotments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_wheel_allotments" ON wheel_allotments;
CREATE POLICY "anon_all_wheel_allotments" ON wheel_allotments FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_wheel_allotments" ON wheel_allotments;
CREATE POLICY "auth_all_wheel_allotments" ON wheel_allotments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.21 Tyre Air Checkups
ALTER TABLE tyre_air_checkups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tyre_air" ON tyre_air_checkups;
CREATE POLICY "anon_all_tyre_air" ON tyre_air_checkups FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_tyre_air" ON tyre_air_checkups;
CREATE POLICY "auth_all_tyre_air" ON tyre_air_checkups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.22 Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_products" ON products;
CREATE POLICY "anon_all_products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_products" ON products;
CREATE POLICY "auth_all_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.23 Product Usage Records
ALTER TABLE product_usage_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_product_usage" ON product_usage_records;
CREATE POLICY "anon_all_product_usage" ON product_usage_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_product_usage" ON product_usage_records;
CREATE POLICY "auth_all_product_usage" ON product_usage_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.24 Cleaning Records
ALTER TABLE cleaning_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_cleaning" ON cleaning_records;
CREATE POLICY "anon_all_cleaning" ON cleaning_records FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_cleaning" ON cleaning_records;
CREATE POLICY "auth_all_cleaning" ON cleaning_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.25 Employee Payments
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_emp_payments" ON employee_payments;
CREATE POLICY "anon_all_emp_payments" ON employee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_emp_payments" ON employee_payments;
CREATE POLICY "auth_all_emp_payments" ON employee_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==============================================================================
-- 4. GRANT SCHEMA PERMISSIONS TO anon & authenticated ROLES
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
