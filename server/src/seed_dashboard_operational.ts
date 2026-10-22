import { db } from './db.js';

console.log('Seeding operational dashboard records matching Section 3.1 & 3.4...');

// Get active buses
const buses = db.prepare('SELECT id, bus_number, current_odometer_km FROM buses WHERE is_archived = 0 LIMIT 10').all() as any[];

if (buses.length === 0) {
  console.log('No buses found to seed operational data.');
  process.exit(0);
}

// 1. Maintenance Schedules (Upcoming next 5)
const insertSchedule = db.prepare(`
  INSERT INTO maintenance_schedules (
    bus_id, maintenance_type, last_service_date, last_service_km,
    interval_km, next_due_date, next_due_km, priority, assigned_to,
    estimated_cost, status, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const scheduleData = [
  {
    bus: buses[0],
    type: 'Tyre Rotation / Check',
    lastDate: '2026-08-15',
    lastKm: 35000,
    interval: 10000,
    dueDate: '2026-10-22',
    dueKm: 45000,
    priority: 'High',
    assigned: 'Apex Tyre Care Hub',
    cost: 3500,
    status: 'Due Soon',
    notes: 'Scheduled 10,000 km rotation & tread inspection'
  },
  {
    bus: buses[1] || buses[0],
    type: 'AC Maintenance',
    lastDate: '2026-08-10',
    lastKm: 40000,
    interval: 10000,
    dueDate: '2026-10-24',
    dueKm: 50000,
    priority: 'Medium',
    assigned: 'CoolTech HVAC Solutions',
    cost: 5800,
    status: 'Due Soon',
    notes: 'Compressor check, condenser cleaning, refrigerant pressure test'
  },
  {
    bus: buses[2] || buses[0],
    type: 'Oil + DPF Filter Change',
    lastDate: '2026-08-01',
    lastKm: 52000,
    interval: 10000,
    dueDate: '2026-10-26',
    dueKm: 62000,
    priority: 'High',
    assigned: 'Fleet Central Workshop',
    cost: 11200,
    status: 'Pending',
    notes: '15W-40 Synthetic + DPF soot filter replacement'
  },
  {
    bus: buses[3] || buses[0],
    type: 'Battery Check',
    lastDate: '2026-08-20',
    lastKm: 28000,
    interval: 10000,
    dueDate: '2026-10-20',
    dueKm: 38000,
    priority: 'High',
    assigned: 'Amaron Power Pro Services',
    cost: 1800,
    status: 'Due Soon',
    notes: 'Load test, terminal greasing, cell water level top-up'
  },
  {
    bus: buses[4] || buses[0],
    type: 'Engine Oil + General Service',
    lastDate: '2025-10-15',
    lastKm: 118000,
    interval: 120000,
    dueDate: '2026-10-18',
    dueKm: 120000,
    priority: 'Critical',
    assigned: 'Authorized Tata Workshop',
    cost: 38500,
    status: 'Overdue',
    notes: '1,20,000 km major engine overhaul and transmission overhaul inspection'
  }
];

// Clean existing test maintenance_schedules if needed or just insert
db.prepare("DELETE FROM maintenance_schedules WHERE notes LIKE '%10,000%' OR notes LIKE '%1,20,000%'").run();

for (const s of scheduleData) {
  insertSchedule.run(
    s.bus.id,
    s.type,
    s.lastDate,
    s.lastKm,
    s.interval,
    s.dueDate,
    s.dueKm,
    s.priority,
    s.assigned,
    s.cost,
    s.status,
    s.notes
  );
}
console.log('Seeded 5 upcoming maintenance schedules.');

// 2. Complaints
db.prepare("DELETE FROM complaints WHERE complaint_ref LIKE 'CMP-2026-%'").run();
const insertComplaint = db.prepare(`
  INSERT INTO complaints (
    complaint_ref, reported_date, bus_id, reported_by, contact_number,
    category, description, priority, assigned_staff, assigned_vendor,
    status, expected_resolution_date, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const complaintSamples = [
  {
    ref: 'CMP-2026-081',
    date: '2026-10-18 14:30:00',
    bus: buses[0],
    by: 'Venkatesh Rao (Driver)',
    phone: '9848011221',
    category: 'AC',
    desc: 'AC cooling efficiency reduced during afternoon trips, cabin temperature stays at 26°C.',
    priority: 'High',
    staff: 'Maintenance Supervisor',
    vendor: 'CoolTech HVAC Solutions',
    status: 'In Progress',
    resDate: '2026-10-21',
    remarks: 'Scheduled for filter and gas inspection'
  },
  {
    ref: 'CMP-2026-082',
    date: '2026-10-18 16:45:00',
    bus: buses[1] || buses[0],
    by: 'K. Subba Rao (Captain)',
    phone: '9848022332',
    category: 'Tyre',
    desc: 'Front Left tyre pressure dropping 4 PSI every 3 days. Possible slow puncture or valve leak.',
    priority: 'Medium',
    staff: 'Tyre Tech Team',
    vendor: 'Apex Tyre Care Hub',
    status: 'Assigned',
    resDate: '2026-10-20',
    remarks: 'Assigned to tyre service bay'
  },
  {
    ref: 'CMP-2026-083',
    date: '2026-10-19 08:15:00',
    bus: buses[2] || buses[0],
    by: 'P. Suresh (Driver)',
    phone: '9848033443',
    category: 'Brakes',
    desc: 'Slight squeal sound when applying retarder brake on highway descent.',
    priority: 'High',
    staff: 'Senior Mechanic Ravi',
    vendor: 'Fleet Central Workshop',
    status: 'Open',
    resDate: '2026-10-21',
    remarks: 'Brake pad inspection needed'
  },
  {
    ref: 'CMP-2026-084',
    date: '2026-10-19 09:30:00',
    bus: buses[3] || buses[0],
    by: 'M. Anand (Driver)',
    phone: '9848044554',
    category: 'Electrical',
    desc: 'Rear passenger row 4 USB charging port not supplying power.',
    priority: 'Low',
    staff: 'Electrician Prasad',
    vendor: 'In-House Auto Electric',
    status: 'Open',
    resDate: '2026-10-22',
    remarks: 'Fuse check required'
  }
];

for (const c of complaintSamples) {
  insertComplaint.run(
    c.ref, c.date, c.bus.id, c.by, c.phone, c.category, c.desc,
    c.priority, c.staff, c.vendor, c.status, c.resDate, c.remarks
  );
}
console.log('Seeded 4 complaints.');

// 3. Tyre Records
db.prepare("DELETE FROM tyre_records WHERE supplier = 'Apex Fleet Rubber Ltd'").run();
const insertTyre = db.prepare(`
  INSERT INTO tyre_records (
    bus_id, tyre_serial_number, brand, size, tyre_position,
    installation_date, installation_km, last_inspection_date,
    tread_depth_mm, tyre_pressure_psi, condition, supplier, cost, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < Math.min(buses.length, 5); i++) {
  const b = buses[i];
  insertTyre.run(
    b.id,
    `MRF-RAD-982${i}`,
    'MRF Steel Muscle',
    '295/80 R22.5',
    i % 2 === 0 ? 'Front Left' : 'Rear Dual Outer',
    '2026-01-15',
    20000 + i * 5000,
    '2026-10-17',
    9.2 - i * 0.4,
    115,
    'Good',
    'Apex Fleet Rubber Ltd',
    18500,
    'Even wear pattern, normal inflation maintained'
  );
}
console.log('Seeded tyre records.');

// 4. AC Maintenance Records
db.prepare("DELETE FROM ac_maintenance_records WHERE service_provider = 'CoolTech HVAC Solutions'").run();
const insertAc = db.prepare(`
  INSERT INTO ac_maintenance_records (
    bus_id, inspection_date, current_km, ac_working_status, cooling_performance,
    refrigerant_check, filter_cleaning_replacement, compressor_condition,
    leak_inspection, electrical_check, service_provider, next_service_date,
    next_service_km, service_cost, technician, status, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < Math.min(buses.length, 5); i++) {
  const b = buses[i];
  insertAc.run(
    b.id,
    '2026-10-15',
    b.current_odometer_km || 42000,
    'Working',
    'Optimal (Cabin 21°C)',
    '134a Charged (1.8kg)',
    'Both cabin intake & roof filters blown & cleaned',
    'Bock FK40 Clutch & Belts Good',
    'No dye leakage detected',
    'Relay & fuse box voltage stable',
    'CoolTech HVAC Solutions',
    '2026-12-15',
    (b.current_odometer_km || 42000) + 10000,
    3500,
    'K. Ramu',
    'Working',
    'Full system 10k km periodic maintenance completed'
  );
}
console.log('Seeded AC maintenance records.');

// 5. Oil and Filter Records
db.prepare("DELETE FROM oil_filter_records WHERE service_provider = 'Fleet Central Workshop'").run();
const insertOil = db.prepare(`
  INSERT INTO oil_filter_records (
    bus_id, replacement_date, odometer_km, oil_type, oil_brand,
    oil_quantity_liters, oil_cost, oil_filter_replaced, oil_filter_details,
    air_filter_replaced, air_filter_details, fuel_filter_replaced,
    fuel_filter_details, labour_cost, total_cost, service_provider,
    next_due_date, next_due_km, performed_by, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < Math.min(buses.length, 5); i++) {
  const b = buses[i];
  insertOil.run(
    b.id,
    '2026-10-12',
    b.current_odometer_km || 41000,
    '15W-40 CI-4 Plus',
    'Castrol Vecton Long Drain',
    18.5,
    7200,
    1,
    'Fleetguard Spin-on Filter',
    1,
    'Donaldson Primary Element',
    1,
    'Bosch Fuel Pre-filter',
    1200,
    9800,
    'Fleet Central Workshop',
    '2026-12-12',
    (b.current_odometer_km || 41000) + 10000,
    'Mechanic Nagaraju',
    '10,000 km scheduled engine oil & triple filter replacement'
  );
}
console.log('Seeded Oil & Filter records.');

// 6. Battery Records
db.prepare("DELETE FROM battery_records WHERE technician = 'Amaron Power Service'").run();
const insertBattery = db.prepare(`
  INSERT INTO battery_records (
    bus_id, inspection_date, current_km, battery_brand, serial_number,
    battery_type, battery_voltage, measured_voltage, battery_health,
    terminal_condition, charging_system_status, warranty_expiry_date,
    battery_cost, technician, next_check_date, status, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < Math.min(buses.length, 5); i++) {
  const b = buses[i];
  insertBattery.run(
    b.id,
    '2026-10-16',
    b.current_odometer_km || 42500,
    'Amaron Hi-Way',
    `AMR-24V-998${i}`,
    'Lead-Acid Heavy Commercial',
    24.0,
    25.6,
    'Good',
    'Clean, petroleum jelly applied',
    'Alternator generating 28.2V @ 1500 RPM',
    '2027-10-15',
    14500,
    'Amaron Power Service',
    '2026-12-16',
    'Active',
    '10,000 km battery & alternator performance check passed'
  );
}
console.log('Seeded Battery records.');

// 7. Bus Condition Inspections (Matching Star Rating and Section 3.1 & 3.4)
db.prepare("DELETE FROM bus_condition_inspections WHERE inspector_name = 'Lead Inspector Srikanth'").run();
const insertCondition = db.prepare(`
  INSERT INTO bus_condition_inspections (
    inspection_ref, bus_id, inspection_date, inspection_time, odometer_km,
    inspector_name, exterior_body, tyre_condition, brake_condition,
    engine_condition, battery_condition, ac_condition, lights_condition,
    mirrors_condition, windshield_condition, wiper_condition,
    doors_emergency_exits, seat_condition, safety_equipment, fluid_levels,
    visible_leaks, roadworthiness_status, defects_found,
    corrective_action_required, inspector_remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < Math.min(buses.length, 4); i++) {
  const b = buses[i];
  insertCondition.run(
    `INS-2026-00${i + 1}`,
    b.id,
    '2026-10-19',
    '08:30 AM',
    b.current_odometer_km || 43000,
    'Lead Inspector Srikanth',
    'Good', // exterior_body
    'Good', // tyre_condition
    'Good', // brake_condition
    'Good', // engine_condition
    'Good', // battery_condition
    'Good', // ac_condition
    'Good', // lights_condition
    'Good', // mirrors_condition
    'Good', // windshield_condition
    'Good', // wiper_condition
    'Good', // doors_emergency_exits
    'Good', // seat_condition
    'Good', // safety_equipment
    'Good', // fluid_levels
    'Good', // visible_leaks
    'Fit for Service',
    'Nil',
    'None - Vehicle 100% operational',
    'Comprehensive multi-point condition audit completed. Vehicle approved for long-distance highway routes.'
  );
}
console.log('Seeded Bus Condition Inspections.');
console.log('Operational seed completed successfully!');
