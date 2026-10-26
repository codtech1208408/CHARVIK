-- ==============================================================================
-- CHARVIK FLEET MANAGEMENT SYSTEM - ENABLE ANONYMOUS CRUD FOR SPA / DEMO MODE
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This allows the frontend SPA on Vercel to save and read directly from Supabase
-- ==============================================================================

-- 1. Buses Table
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_buses" ON buses;
CREATE POLICY "anon_all_buses" ON buses FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Employees Table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_employees" ON employees;
CREATE POLICY "anon_all_employees" ON employees FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. Daily Kilometer Entries (Mileage & Fueling)
ALTER TABLE daily_kilometer_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_daily_km" ON daily_kilometer_entries;
CREATE POLICY "anon_all_daily_km" ON daily_kilometer_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. Maintenance Schedules
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_schedules" ON maintenance_schedules;
CREATE POLICY "anon_all_schedules" ON maintenance_schedules FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. Tyre Records
ALTER TABLE tyre_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tyres" ON tyre_records;
CREATE POLICY "anon_all_tyres" ON tyre_records FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. AC Maintenance Records
ALTER TABLE ac_maintenance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_ac" ON ac_maintenance_records;
CREATE POLICY "anon_all_ac" ON ac_maintenance_records FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. Oil Filter Records
ALTER TABLE oil_filter_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_oil" ON oil_filter_records;
CREATE POLICY "anon_all_oil" ON oil_filter_records FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. Battery Records
ALTER TABLE battery_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_battery" ON battery_records;
CREATE POLICY "anon_all_battery" ON battery_records FOR ALL TO anon USING (true) WITH CHECK (true);

-- 9. Repair Work Orders
ALTER TABLE repair_work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_repairs" ON repair_work_orders;
CREATE POLICY "anon_all_repairs" ON repair_work_orders FOR ALL TO anon USING (true) WITH CHECK (true);

-- 10. Complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_complaints" ON complaints;
CREATE POLICY "anon_all_complaints" ON complaints FOR ALL TO anon USING (true) WITH CHECK (true);

-- 11. Bus Condition Inspections
ALTER TABLE bus_condition_inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_inspections" ON bus_condition_inspections;
CREATE POLICY "anon_all_inspections" ON bus_condition_inspections FOR ALL TO anon USING (true) WITH CHECK (true);

-- 12. Administrators / Staff Credentials
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_administrators" ON administrators;
CREATE POLICY "anon_all_administrators" ON administrators FOR ALL TO anon USING (true) WITH CHECK (true);
