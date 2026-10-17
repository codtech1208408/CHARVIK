import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

export function runSeed() {
  initDatabase();

  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM administrators WHERE email_or_username = ?').get('admin@charvik.com');
  if (existingAdmin) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding initial data for Charvik Staffing Consultancy...');

  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO administrators (name, email_or_username, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?)
  `).run('Admin Manager', 'admin@charvik.com', passwordHash, 'Super Admin', 'Active');

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

  // Seed Employees (Drivers, Helpers, Captains)
  const insertEmp = db.prepare(`
    INSERT INTO employees (
      employee_code, role, full_name, gender, date_of_birth, email, phone_number, alternative_phone_number,
      aadhaar_number, aadhaar_front_doc, aadhaar_back_doc, pan_number, pan_doc,
      bank_name, bank_proof_doc, account_holder_name, account_number, ifsc_code, branch,
      reference_name, reference_phone, reference_alt_phone,
      joining_date, employment_status, assigned_bus_id, internal_remarks, profile_photo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDriverDetail = db.prepare(`
    INSERT INTO driver_details (
      employee_id, licence_number, licence_front_doc, licence_back_doc, issuing_state,
      issuing_rto_office, licence_issue_date, licence_validity_date, licence_experience_years,
      criminal_background_details, licence_verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const driversData = [
    { code: 'EMP-DRV-001', name: 'Ramesh Kumar', phone: '9848012345', dob: '1985-05-12', joining: '2021-03-15', lic: 'AP1620100012345', valid: '2028-04-10', exp: 12, rto: 'Vijayawada (AP-16)' },
    { code: 'EMP-DRV-002', name: 'Suresh Varma', phone: '9848023456', dob: '1988-08-20', joining: '2021-06-01', lic: 'TS0920120045678', valid: '2027-11-25', exp: 10, rto: 'Hyderabad Central (TS-09)' },
    { code: 'EMP-DRV-003', name: 'Mahesh Babu', phone: '9848034567', dob: '1982-11-04', joining: '2020-01-10', lic: 'KA0120080078901', valid: '2029-01-15', exp: 15, rto: 'Bengaluru Central (KA-01)' },
    { code: 'EMP-DRV-004', name: 'Raju Naidu', phone: '9848045678', dob: '1990-02-18', joining: '2022-08-20', lic: 'TN0720150023456', valid: '2026-11-02', exp: 8, rto: 'Chennai South (TN-07)' },
    { code: 'EMP-DRV-005', name: 'Shankar Rao', phone: '9848056789', dob: '1984-07-29', joining: '2019-11-05', lic: 'AP3920090098765', valid: '2027-06-30', exp: 14, rto: 'Tirupati (AP-39)' },
    { code: 'EMP-DRV-006', name: 'Venkatesh Reddy', phone: '9848067890', dob: '1987-03-14', joining: '2022-01-12', lic: 'AP1620110054321', valid: '2028-09-18', exp: 11, rto: 'Vijayawada (AP-16)' },
    { code: 'EMP-DRV-007', name: 'Kalyan Krishna', phone: '9848078901', dob: '1992-09-08', joining: '2023-04-18', lic: 'TS0720160087654', valid: '2026-12-20', exp: 7, rto: 'Secunderabad (TS-07)' },
    { code: 'EMP-DRV-008', name: 'Prasad Chari', phone: '9848089012', dob: '1986-12-22', joining: '2021-09-01', lic: 'AP0520100034567', valid: '2029-05-14', exp: 13, rto: 'Kakinada (AP-05)' },
  ];

  const driverIds: number[] = [];

  for (const d of driversData) {
    const res = insertEmp.run(
      d.code,
      'Driver',
      d.name,
      'Male',
      d.dob,
      `${d.name.toLowerCase().replace(' ', '.')}@charvikstaffing.com`,
      d.phone,
      '9848999999',
      'XXXX-XXXX-4589',
      '/uploads/docs/aadhaar_sample.pdf',
      '/uploads/docs/aadhaar_sample.pdf',
      'ABCDE1234F',
      '/uploads/docs/pan_sample.pdf',
      'State Bank of India',
      '/uploads/docs/passbook_sample.pdf',
      d.name,
      '309876543210',
      'SBIN0001234',
      'Main Branch',
      'Satyanarayana',
      '9848099991',
      '9848099992',
      d.joining,
      'Active',
      null,
      'Experienced commercial heavy vehicle driver with clean track record.',
      ''
    );
    const empId = Number(res.lastInsertRowid);
    driverIds.push(empId);

    insertDriverDetail.run(
      empId,
      d.lic,
      '/uploads/docs/dl_front.pdf',
      '/uploads/docs/dl_back.pdf',
      'Andhra Pradesh',
      d.rto,
      '2012-05-10',
      d.valid,
      d.exp,
      'Clean background verified by local RTO and police records.',
      'Verified'
    );
  }

  // Helpers & Captains
  const supportStaff = [
    { code: 'EMP-HLP-001', role: 'Helper', name: 'Koteswara Rao', phone: '9701011111' },
    { code: 'EMP-HLP-002', role: 'Helper', name: 'Subba Rao', phone: '9701022222' },
    { code: 'EMP-HLP-003', role: 'Helper', name: 'Anji Reddy', phone: '9701033333' },
    { code: 'EMP-HLP-004', role: 'Helper', name: 'Nagesh G', phone: '9701044444' },
    { code: 'EMP-CPT-001', role: 'Captain', name: 'Srikanth Verma', phone: '9701055555' },
    { code: 'EMP-CPT-002', role: 'Captain', name: 'Balaram Murthy', phone: '9701066666' },
  ];

  const helperIds: number[] = [];
  for (const s of supportStaff) {
    const res = insertEmp.run(
      s.code,
      s.role,
      s.name,
      'Male',
      '1995-04-15',
      `${s.name.toLowerCase().replace(' ', '.')}@charvikstaffing.com`,
      s.phone,
      '9701099999',
      'XXXX-XXXX-7821',
      '/uploads/docs/aadhaar_sample.pdf',
      '/uploads/docs/aadhaar_sample.pdf',
      'PQRST5678K',
      '/uploads/docs/pan_sample.pdf',
      'Andhra Bank / Union Bank',
      '/uploads/docs/passbook_sample.pdf',
      s.name,
      '123456789012',
      'UBIN0543210',
      'MG Road Branch',
      'Venkata Ratnam',
      '9701088888',
      '9701077777',
      '2022-03-01',
      'Active',
      null,
      'Diligent support staff with passenger safety awareness.',
      ''
    );
    helperIds.push(Number(res.lastInsertRowid));
  }

  // Seed Buses (32 Total: 28 Active, 2 Under Maintenance, 1 Inactive, 1 Out of Service)
  const insertBus = db.prepare(`
    INSERT INTO buses (
      bus_number, registration_number, make, model, bus_type, manufacturing_year,
      purchase_date, chassis_number, engine_number, fuel_type, seating_capacity,
      insurance_expiry, fitness_expiry, permit_expiry, puc_expiry,
      current_odometer_km, operational_status, assigned_driver_id, assigned_helper_id, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const primaryBuses = [
    { no: 'BUS-01', reg: 'AP 16 TC 2080', make: 'Ashok Leyland', model: 'Viking 222', type: 'Staff Bus', km: 98250, status: 'Active', drv: driverIds[0], hlp: helperIds[0], ins: '2027-04-15', fit: '2027-03-20', puc: '2027-02-10' },
    { no: 'BUS-02', reg: 'TS 09 UB 6734', make: 'Tata Motors', model: 'Starbus Ultra', type: 'Staff Bus', km: 76432, status: 'Under Maintenance', drv: driverIds[1], hlp: helperIds[1], ins: '2026-12-10', fit: '2026-11-15', puc: '2026-12-05' },
    { no: 'BUS-03', reg: 'KA 01 AB 4567', make: 'Eicher', model: 'Skyline Pro 3009', type: 'School Bus', km: 52310, status: 'Active', drv: driverIds[2], hlp: helperIds[2], ins: '2027-08-20', fit: '2027-07-15', puc: '2027-05-18' },
    { no: 'BUS-04', reg: 'TN 07 CD 7890', make: 'BharatBenz', model: '1017 Bus Chassis', type: 'Staff Bus', km: 40120, status: 'Active', drv: driverIds[3], hlp: helperIds[3], ins: '2027-05-12', fit: '2027-04-30', puc: '2027-01-22' },
    { no: 'BUS-05', reg: 'AP 39 EF 1122', make: 'Volvo', model: '9400 B11R', type: 'Contract Bus', km: 128765, status: 'Active', drv: driverIds[4], hlp: helperIds[4], ins: '2027-02-14', fit: '2027-01-10', puc: '2027-03-15' },
    { no: 'BUS-06', reg: 'AP 16 TC 2081', make: 'Ashok Leyland', model: 'Oyster Wide', type: 'School Bus', km: 64200, status: 'Active', drv: driverIds[5], hlp: helperIds[0], ins: '2027-06-18', fit: '2027-05-25', puc: '2027-04-10' },
    { no: 'BUS-07', reg: 'TS 09 UB 6735', make: 'Tata Motors', model: 'Cityride Prime', type: 'Staff Bus', km: 89100, status: 'Under Maintenance', drv: driverIds[6], hlp: helperIds[1], ins: '2026-11-20', fit: '2026-11-30', puc: '2026-12-15' },
    { no: 'BUS-08', reg: 'KA 01 AB 4568', make: 'Eicher', model: 'Starline 20.15', type: 'Contract Bus', km: 112450, status: 'Active', drv: driverIds[7], hlp: helperIds[2], ins: '2027-09-05', fit: '2027-08-12', puc: '2027-06-14' },
    { no: 'BUS-09', reg: 'TN 07 CD 7891', make: 'BharatBenz', model: 'Glider Coach', type: 'Staff Bus', km: 34500, status: 'Active', drv: null, hlp: null, ins: '2027-10-10', fit: '2027-09-15', puc: '2027-08-10' },
    { no: 'BUS-10', reg: 'AP 39 EF 1123', make: 'Ashok Leyland', model: 'Lynx Smart', type: 'School Bus', km: 45200, status: 'Active', drv: null, hlp: null, ins: '2027-07-22', fit: '2027-06-30', puc: '2027-04-20' },
    { no: 'BUS-11', reg: 'AP 16 TC 2082', make: 'Tata Motors', model: 'Starbus EV', type: 'Staff Bus', km: 18400, status: 'Active', drv: null, hlp: null, ins: '2027-11-15', fit: '2027-10-20', puc: '2027-09-12' },
    { no: 'BUS-12', reg: 'TS 09 UB 6736', make: 'Ashok Leyland', model: 'Viking 222', type: 'Staff Bus', km: 81200, status: 'Active', drv: null, hlp: null, ins: '2027-03-10', fit: '2027-02-15', puc: '2027-01-30' },
    { no: 'BUS-13', reg: 'KA 01 AB 4569', make: 'Eicher', model: 'Skyline Pro', type: 'School Bus', km: 58900, status: 'Active', drv: null, hlp: null, ins: '2027-05-18', fit: '2027-04-22', puc: '2027-03-10' },
    { no: 'BUS-14', reg: 'TN 07 CD 7892', make: 'Tata Motors', model: 'Starbus Ultra', type: 'Staff Bus', km: 69400, status: 'Active', drv: null, hlp: null, ins: '2027-06-25', fit: '2027-05-30', puc: '2027-04-18' },
    { no: 'BUS-15', reg: 'AP 39 EF 1124', make: 'BharatBenz', model: '1017', type: 'Contract Bus', km: 92300, status: 'Active', drv: null, hlp: null, ins: '2027-08-14', fit: '2027-07-20', puc: '2027-06-05' },
    { no: 'BUS-16', reg: 'AP 16 TC 2083', make: 'Ashok Leyland', model: 'Viking', type: 'Staff Bus', km: 104500, status: 'Active', drv: null, hlp: null, ins: '2027-04-05', fit: '2027-03-12', puc: '2027-02-18' },
    { no: 'BUS-17', reg: 'TS 09 UB 6737', make: 'Tata Motors', model: 'Cityride', type: 'School Bus', km: 41200, status: 'Active', drv: null, hlp: null, ins: '2027-07-10', fit: '2027-06-15', puc: '2027-05-02' },
    { no: 'BUS-18', reg: 'KA 01 AB 4570', make: 'Eicher', model: 'Starline', type: 'Staff Bus', km: 73400, status: 'Active', drv: null, hlp: null, ins: '2027-09-12', fit: '2027-08-20', puc: '2027-07-15' },
    { no: 'BUS-19', reg: 'TN 07 CD 7893', make: 'Ashok Leyland', model: 'Oyster', type: 'School Bus', km: 53100, status: 'Active', drv: null, hlp: null, ins: '2027-02-28', fit: '2027-01-31', puc: '2027-03-22' },
    { no: 'BUS-20', reg: 'AP 39 EF 1125', make: 'Tata Motors', model: 'Starbus Ultra', type: 'Staff Bus', km: 86500, status: 'Active', drv: null, hlp: null, ins: '2027-05-30', fit: '2027-04-28', puc: '2027-03-14' },
    { no: 'BUS-21', reg: 'AP 16 TC 2084', make: 'BharatBenz', model: '1017', type: 'Contract Bus', km: 62800, status: 'Active', drv: null, hlp: null, ins: '2027-10-05', fit: '2027-09-12', puc: '2027-08-19' },
    { no: 'BUS-22', reg: 'TS 09 UB 6738', make: 'Ashok Leyland', model: 'Viking', type: 'Staff Bus', km: 95400, status: 'Active', drv: null, hlp: null, ins: '2027-06-14', fit: '2027-05-18', puc: '2027-04-25' },
    { no: 'BUS-23', reg: 'KA 01 AB 4571', make: 'Tata Motors', model: 'Starbus EV', type: 'Staff Bus', km: 12900, status: 'Active', drv: null, hlp: null, ins: '2027-12-01', fit: '2027-11-10', puc: '2027-10-15' },
    { no: 'BUS-24', reg: 'TN 07 CD 7894', make: 'Eicher', model: 'Skyline Pro', type: 'School Bus', km: 47600, status: 'Active', drv: null, hlp: null, ins: '2027-03-25', fit: '2027-02-28', puc: '2027-01-20' },
    { no: 'BUS-25', reg: 'AP 39 EF 1126', make: 'Ashok Leyland', model: 'Lynx', type: 'Staff Bus', km: 83200, status: 'Active', drv: null, hlp: null, ins: '2027-08-19', fit: '2027-07-24', puc: '2027-06-18' },
    { no: 'BUS-26', reg: 'AP 16 TC 2085', make: 'Tata Motors', model: 'Starbus', type: 'Contract Bus', km: 101200, status: 'Active', drv: null, hlp: null, ins: '2027-01-15', fit: '2027-01-05', puc: '2027-02-12' },
    { no: 'BUS-27', reg: 'TS 09 UB 6739', make: 'BharatBenz', model: '1017', type: 'Staff Bus', km: 38900, status: 'Active', drv: null, hlp: null, ins: '2027-09-28', fit: '2027-08-30', puc: '2027-07-25' },
    { no: 'BUS-28', reg: 'KA 01 AB 4572', make: 'Ashok Leyland', model: 'Viking', type: 'School Bus', km: 67400, status: 'Active', drv: null, hlp: null, ins: '2027-04-12', fit: '2027-03-18', puc: '2027-02-24' },
    { no: 'BUS-29', reg: 'TN 07 CD 7895', make: 'Eicher', model: 'Skyline Pro', type: 'Staff Bus', km: 74800, status: 'Active', drv: null, hlp: null, ins: '2027-07-08', fit: '2027-06-12', puc: '2027-05-16' },
    { no: 'BUS-30', reg: 'AP 39 EF 1127', make: 'Tata Motors', model: 'Cityride', type: 'Contract Bus', km: 59300, status: 'Active', drv: null, hlp: null, ins: '2027-11-20', fit: '2027-10-25', puc: '2027-09-30' },
    { no: 'BUS-31', reg: 'AP 16 TC 2086', make: 'Ashok Leyland', model: 'Stallion', type: 'Other', km: 145000, status: 'Inactive', drv: null, hlp: null, ins: '2026-10-01', fit: '2026-09-15', puc: '2026-09-01' },
    { no: 'BUS-32', reg: 'TS 09 UB 6740', make: 'Tata Motors', model: 'Starbus 2018', type: 'Other', km: 182300, status: 'Out of Service', drv: null, hlp: null, ins: '2026-08-15', fit: '2026-07-20', puc: '2026-06-30' },
  ];

  const busIds: number[] = [];
  for (const b of primaryBuses) {
    const res = insertBus.run(
      b.no,
      b.reg,
      b.make,
      b.model,
      b.type,
      2021,
      '2021-04-10',
      `MB1CHASSIS${Math.floor(100000 + Math.random() * 900000)}`,
      `ENG${Math.floor(100000 + Math.random() * 900000)}`,
      b.type === 'Staff Bus' && b.km < 25000 ? 'Electric' : 'Diesel',
      45,
      b.ins,
      b.fit,
      '2027-09-30',
      b.puc,
      b.km,
      b.status,
      b.drv,
      b.hlp,
      'Fleet bus operated under Charvik Transport Contract.'
    );
    busIds.push(Number(res.lastInsertRowid));
  }

  // Assign bus to drivers
  for (let i = 0; i < Math.min(driverIds.length, primaryBuses.length); i++) {
    if (primaryBuses[i].drv) {
      db.prepare('UPDATE employees SET assigned_bus_id = ? WHERE id = ?').run(busIds[i], primaryBuses[i].drv);
    }
  }

  // Seed Daily Kilometer Entries (matching reference image)
  const insertDailyKm = db.prepare(`
    INSERT INTO daily_kilometer_entries (
      entry_date, bus_id, driver_id, opening_km, closing_km, distance_travelled_km, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const dailyEntries = [
    { busId: busIds[0], driverId: driverIds[0], open: 98120, close: 98250, date: '2026-10-11', remarks: 'Regular morning & evening corporate shift route' },
    { busId: busIds[1], driverId: driverIds[1], open: 76300, close: 76432, date: '2026-10-11', remarks: 'Airport transfer route' },
    { busId: busIds[2], driverId: driverIds[2], open: 52180, close: 52310, date: '2026-10-11', remarks: 'School pickup & drop shift' },
    { busId: busIds[3], driverId: driverIds[3], open: 40010, close: 40120, date: '2026-10-11', remarks: 'Tech park express route' },
    { busId: busIds[4], driverId: driverIds[4], open: 128600, close: 128765, date: '2026-10-11', remarks: 'Intercity corporate charter' },
  ];

  for (const d of dailyEntries) {
    insertDailyKm.run(d.date, d.busId, d.driverId, d.open, d.close, d.close - d.open, d.remarks);
  }

  // Seed Maintenance Schedules (matching reference image 1 & 2)
  const insertSched = db.prepare(`
    INSERT INTO maintenance_schedules (
      bus_id, maintenance_type, last_service_date, last_service_km, interval_km,
      next_due_date, next_due_km, priority, assigned_to, estimated_cost, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schedules = [
    { busId: busIds[0], type: 'Engine Oil + General Service', lastDate: '2026-06-15', lastKm: 85000, interval: 120000, dueDate: '2026-10-15', dueKm: 120000, prio: 'Critical', tech: 'Sri Rama Auto Works', cost: 14500, status: 'Due Soon', notes: 'Engine oil, filter & general inspection' },
    { busId: busIds[1], type: 'Tyre Maintenance', lastDate: '2026-07-20', lastKm: 68000, interval: 10000, dueDate: '2026-10-18', dueKm: 10000, prio: 'High', tech: 'MRF Tyre Care', cost: 3500, status: 'Pending', notes: 'Tyre rotation and wheel balancing' },
    { busId: busIds[2], type: 'AC Maintenance', lastDate: '2026-08-10', lastKm: 45000, interval: 10000, dueDate: '2026-10-20', dueKm: 10000, prio: 'Medium', tech: 'Subzero AC Solutions', cost: 4200, status: 'Pending', notes: 'Gas pressure check and blower filter cleaning' },
    { busId: busIds[3], type: 'Oil + DPF Filter Change', lastDate: '2026-07-15', lastKm: 32000, interval: 40000, dueDate: '2026-10-25', dueKm: 40000, prio: 'High', tech: 'BharatBenz Authorized', cost: 18000, status: 'Due Soon', notes: 'DPF cleaning and synthetic lube refill' },
    { busId: busIds[4], type: 'Battery Check', lastDate: '2026-09-01', lastKm: 120000, interval: 10000, dueDate: '2026-10-28', dueKm: 10000, prio: 'Low', tech: 'Amaron Power Zone', cost: 800, status: 'Pending', notes: 'Specific gravity and terminal clean' },
    { busId: busIds[5], type: 'Brake Inspection', lastDate: '2026-08-25', lastKm: 58000, interval: 15000, dueDate: '2026-11-05', dueKm: 70000, prio: 'High', tech: 'In-house Workshop', cost: 2500, status: 'Scheduled', notes: 'Brake liner inspection and bleeding' },
    { busId: busIds[6], type: 'General Service', lastDate: '2026-05-10', lastKm: 75000, interval: 20000, dueDate: '2026-10-05', dueKm: 88000, prio: 'Critical', tech: 'Tata Service Center', cost: 12000, status: 'Overdue', notes: 'Mandatory quarterly fitness service' },
    { busId: busIds[7], type: 'AC Maintenance', lastDate: '2026-09-15', lastKm: 105000, interval: 10000, dueDate: '2026-11-12', dueKm: 115000, prio: 'Medium', tech: 'In-house AC Tech', cost: 3000, status: 'Scheduled', notes: 'Condenser wash and belt tension check' },
  ];

  for (const s of schedules) {
    insertSched.run(s.busId, s.type, s.lastDate, s.lastKm, s.interval, s.dueDate, s.dueKm, s.prio, s.tech, s.cost, s.status, s.notes);
  }

  // Seed Tyre Maintenance Records
  const insertTyre = db.prepare(`
    INSERT INTO tyre_records (
      bus_id, tyre_serial_number, brand, size, tyre_position, installation_date, installation_km,
      last_inspection_date, tread_depth_mm, tyre_pressure_psi, condition, rotation_date,
      supplier, cost, remarks, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tyreData = [
    { busId: busIds[0], sn: 'MRF-2023-9081', brand: 'MRF Steel Muscle', size: '295/80 R22.5', pos: 'Front Left', cond: 'Good', depth: 9.5, psi: 110, date: '2026-09-08' },
    { busId: busIds[1], sn: 'APO-2022-4412', brand: 'Apollo EnduTrax', size: '295/80 R22.5', pos: 'Front Right', cond: 'Needs Replacement', depth: 3.2, psi: 95, date: '2026-10-05' },
    { busId: busIds[2], sn: 'JKT-2023-1123', brand: 'JK Tyre Jetsteel', size: '235/75 R17.5', pos: 'Rear Right', cond: 'Good', depth: 8.8, psi: 105, date: '2026-08-15' },
    { busId: busIds[3], sn: 'BRI-2024-5567', brand: 'Bridgestone R156', size: '295/80 R22.5', pos: 'Rear Left', cond: 'Worn', depth: 4.5, psi: 100, date: '2026-07-20' },
    { busId: busIds[4], sn: 'MIC-2023-7788', brand: 'Michelin X Multi', size: '295/80 R22.5', pos: 'Spare', cond: 'Good', depth: 11.0, psi: 115, date: '2026-09-10' },
  ];

  for (const t of tyreData) {
    insertTyre.run(t.busId, t.sn, t.brand, t.size, t.pos, '2025-06-10', 30000, t.date, t.depth, t.psi, t.cond, '2026-06-15', 'Tirumala Tyres Pvt Ltd', 18500, 'Regular inspection and pressure adjustment', 1);
  }

  // Seed AC Maintenance Records
  const insertAc = db.prepare(`
    INSERT INTO ac_maintenance_records (
      bus_id, inspection_date, current_km, ac_working_status, cooling_performance,
      refrigerant_check, filter_cleaning_replacement, compressor_condition, leak_inspection,
      electrical_check, issue_description, work_performed, service_provider, next_service_date,
      next_service_km, service_cost, technician, status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAc.run(busIds[0], '2026-09-05', 95000, 'Working', 'Excellent (Cabin temp 21°C)', 'R134a normal at 45 psi', 'Cleaned both return air filters', 'Good, belt tight', 'No leaks detected', 'Clutch engagement smooth', 'Routine checkup', 'Cleaned filters and refilled 200g refrigerant', 'Cool Breeze Transport AC', '2026-12-05', 105000, 3200, 'Naveen Kumar', 'Completed', 'System operating at optimal efficiency');
  insertAc.run(busIds[1], '2026-10-08', 76000, 'Needs Repair', 'Poor (Cabin temp 29°C)', 'Gas low (20 psi)', 'Clogged with dust', 'Noisy pulley bearing', 'Slight leak at high pressure hose fitting', 'Fuse OK', 'AC Not Cooling properly reported by driver', 'Diagnosis complete, ordered replacement hose', 'Subzero AC Solutions', '2026-10-18', 77000, 4800, 'Srinivas R', 'In Progress', 'Awaiting new hose assembly');
  insertAc.run(busIds[2], '2026-08-12', 49000, 'Working', 'Normal (Cabin temp 23°C)', 'Normal', 'Cleaned', 'Good', 'No leaks', 'Normal', 'Scheduled monthly check', 'Full blower cleaning', 'In-house AC Tech', '2026-11-12', 59000, 1500, 'Mohan Lal', 'Completed', 'Approved for school transport');

  // Seed Oil and Filter Records
  const insertOil = db.prepare(`
    INSERT INTO oil_filter_records (
      bus_id, replacement_date, odometer_km, oil_type, oil_brand, oil_quantity_liters,
      oil_cost, oil_filter_replaced, oil_filter_details, air_filter_replaced, air_filter_details,
      fuel_filter_replaced, fuel_filter_details, other_filter_details, labour_cost, total_cost,
      service_provider, next_due_date, next_due_km, performed_by, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOil.run(busIds[0], '2026-08-20', 80000, '15W-40 CI-4 Plus', 'Castrol Vecton', 18, 7200, 1, 'Fleetguard LF16015', 1, 'Fleetguard AF25437', 1, 'Fleetguard FF5488', 'Bypass filter cleaned', 1500, 13500, 'Charvik In-house Workshop', '2027-02-20', 120000, 'Chief Mechanic Anand', 'Next due at 120,000 km');
  insertOil.run(busIds[1], '2026-07-15', 60000, '15W-40 CI-4', 'Mobil Delvac', 16, 6400, 1, 'Purolator Oil Filter', 0, 'Cleaned air filter', 1, 'Bosch Fuel Cartridge', '', 1200, 10800, 'Tata Authorized Service', '2026-11-15', 100000, 'Technician K. Babu', 'Synthetic blend used');

  // Seed Battery Records
  const insertBattery = db.prepare(`
    INSERT INTO battery_records (
      bus_id, inspection_date, current_km, battery_brand, serial_number, battery_type,
      battery_voltage, measured_voltage, battery_health, terminal_condition, charging_system_status,
      installation_date, warranty_expiry_date, replacement_date, battery_cost, technician,
      next_check_date, status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBattery.run(busIds[0], '2026-08-10', 94000, 'Amaron Hi-Way', 'AMR-150D31R-9982', 'Lead Acid Heavy Commercial', 24.0, 25.4, 'Good', 'Clean with petroleum jelly coat', 'Alternator charging at 28.2V', '2024-03-10', '2027-03-10', null, 14500, 'S. Naresh', '2026-11-10', 'Active', 'Voltage and gravity holding well');
  insertBattery.run(busIds[1], '2026-10-05', 76000, 'Exide Express', 'EXD-XP1500-4321', 'Maintenance Free', 24.0, 23.1, 'Needs Monitoring', 'Minor white sulfation on negative terminal', 'Alternator charging at 27.8V', '2023-08-15', '2026-11-15', null, 15200, 'K. Venkat', '2026-10-25', 'Active', 'Warranty expiring soon in Nov 2026');
  insertBattery.run(busIds[2], '2026-10-01', 51000, 'Tata Green', 'TG-HD120-7761', 'Lead Acid', 24.0, 25.2, 'Good', 'Clean', 'Charging normal', '2024-09-01', '2027-09-01', null, 13800, 'S. Naresh', '2026-12-01', 'Active', 'Battery in healthy condition');

  // Seed Complaints (matching reference images: "AC Not Cooling", "Engine Noise", "Tyre Pressure Low", "Window Jam", "Battery Issue")
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (
      complaint_ref, reported_date, bus_id, reported_by, contact_number, category,
      description, priority, assigned_staff, assigned_vendor, status, expected_resolution_date,
      resolution_description, resolved_date, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertComplaint.run('CMP-2026-001', '2026-10-11 08:30:00', busIds[0], 'Ramesh Kumar (Driver)', '9848012345', 'AC', 'AC not cooling rear passenger cabin adequately during afternoon trip', 'High', 'Srinivas R', 'Subzero AC Solutions', 'Open', '2026-10-13', '', null, 'Driver reported passengers feeling hot in last 3 rows');
  insertComplaint.run('CMP-2026-002', '2026-10-10 14:15:00', busIds[1], 'Suresh Varma (Driver)', '9848023456', 'Engine', 'Unusual rattling noise near turbocharger when accelerating beyond 1500 RPM', 'Critical', 'Chief Mechanic Anand', 'Tata Authorized Service', 'In Progress', '2026-10-14', 'Inspected turbo piping and loose heat shield', null, 'Bus pulled into workshop for inspection');
  insertComplaint.run('CMP-2026-003', '2026-10-09 09:00:00', busIds[2], 'Mahesh Babu (Driver)', '9848034567', 'Tyre', 'Rear right tyre dropping pressure gradually over 24 hours', 'Medium', 'MRF Service Team', 'Tirumala Tyres', 'Resolved', '2026-10-10', 'Identified valve pin leak and repaired tyre valve', '2026-10-09 17:00:00', 'Resolved and test driven');
  insertComplaint.run('CMP-2026-004', '2026-10-08 17:45:00', busIds[3], 'Raju Naidu (Driver)', '9848045678', 'Body Damage', 'Middle passenger sliding window jammed and latch broken', 'Low', 'Workshop Carpenter', 'In-house', 'In Progress', '2026-10-12', 'Window track cleaned, replacement latch ordered', null, 'Temporary safety lock applied');
  insertComplaint.run('CMP-2026-005', '2026-10-06 11:20:00', busIds[4], 'Shankar Rao (Driver)', '9848056789', 'Battery', 'Slow engine cranking in early morning cold starts', 'Medium', 'S. Naresh (Electrician)', 'Amaron Service', 'Resolved', '2026-10-07', 'Tightened negative ground cable and topped up distilled water', '2026-10-07 10:30:00', 'Tested starting 5 times smoothly');

  // Seed Repair Work Orders
  const insertRepair = db.prepare(`
    INSERT INTO repair_work_orders (
      work_order_number, bus_id, linked_complaint_id, repair_category, problem_description,
      reported_date, work_start_date, work_completion_date, odometer_km, diagnosis,
      work_performed, parts_replaced, labour_cost, parts_cost, other_charges, total_cost,
      workshop_vendor, assigned_technician, bus_availability_status, warranty_details,
      status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRepair.run('WO-2026-001', busIds[0], 1, 'AC Repair', 'Gas leakage and cooling deficit', '2026-10-11', '2026-10-12', null, 98250, 'Cracked high pressure O-ring', 'O-ring replacement & gas charging', 'AC O-Ring Seal, R134a 1.2kg', 1200, 2800, 200, 4200, 'Subzero AC Solutions', 'Technician Srinivas', 'Under Maintenance', '6 Months on seals', 'In Progress', 'Expected completion by tomorrow evening');
  insertRepair.run('WO-2026-002', busIds[1], 2, 'Engine Repair', 'Turbo noise and clutch pedal hardness', '2026-10-10', '2026-10-10', null, 76432, 'Worn clutch release bearing and turbo heat shield clamp broken', 'Replaced clamp, inspecting clutch assembly', 'Turbo Clamp, Release Bearing', 3500, 8500, 500, 12500, 'Tata Motors Workshop', 'Master Tech Raghu', 'Under Maintenance', '1 Year warranty', 'In Progress', 'Bus in bay 3');
  insertRepair.run('WO-2026-003', busIds[2], 3, 'Tyre Change', 'Valve replacement & balancing', '2026-10-09', '2026-09-09', '2026-10-09', 52310, 'Leaking brass valve pin', 'Fitted new TR-78 valve and nitrogen filled', 'Brass Valve Pin TR-78', 300, 450, 0, 750, 'MRF Tyre Care', 'K. Raju', 'Active', 'N/A', 'Completed', 'Returned to service');
  insertRepair.run('WO-2026-004', busIds[3], null, 'Brake Repair', 'Periodic brake pad replacement and drum skimming', '2026-10-03', '2026-10-03', '2026-10-04', 39800, 'Front brake pads worn to 2mm', 'Installed OEM brake shoe set and skimmed front drums', 'Brake Lining Set Front OEM', 2200, 6800, 300, 9300, 'BharatBenz Service', 'Technician David', 'Active', '6 Months warranty', 'Completed', 'Brake efficiency test passed at 82%');
  insertRepair.run('WO-2026-005', busIds[4], null, 'General Service', 'Full 1,20,000 km comprehensive service', '2026-10-01', '2026-10-01', '2026-10-02', 128500, 'Scheduled major milestone', 'All oils, belts, coolants, and filters replaced', 'Engine Oil, Gear Oil, Coolant, All Filters', 4500, 22000, 1000, 27500, 'Volvo Service Center', 'Sr Engineer Varma', 'Active', '1 Year manufacturer service warranty', 'Completed', 'Certified fit for luxury intercity route');

  // Seed Bus Condition Inspection
  const insertCondition = db.prepare(`
    INSERT INTO bus_condition_inspections (
      inspection_ref, bus_id, inspection_date, inspection_time, odometer_km, inspector_name,
      exterior_body, tyre_condition, brake_condition, engine_condition, battery_condition,
      ac_condition, lights_condition, mirrors_condition, windshield_condition, wiper_condition,
      doors_emergency_exits, seat_condition, safety_equipment, fluid_levels, visible_leaks,
      roadworthiness_status, defects_found, corrective_action_required, inspector_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCondition.run(
    'INS-2026-101',
    busIds[0],
    '2026-10-10',
    '16:30',
    98200,
    'K. Satyanarayana (Senior Inspector)',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Needs Attention',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Fit for Service',
    'AC cooling slow in rear vents; all safety and running gear certified good',
    'Schedule AC inspection with Subzero AC service',
    'Overall clean and roadworthy bus. Fire extinguisher charged and valid.'
  );

  insertCondition.run(
    'INS-2026-102',
    busIds[1],
    '2026-10-10',
    '17:15',
    76400,
    'K. Satyanarayana (Senior Inspector)',
    'Needs Attention',
    'Needs Attention',
    'Needs Attention',
    'Needs Attention',
    'Good',
    'Defective',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Good',
    'Needs Attention',
    'Good',
    'Needs Attention',
    'Not Fit for Service',
    'Turbocharger sound, clutch pedal stiff, AC inoperative, right front tyre tread 3.2mm',
    'Hold bus in depot. Complete WO-2026-002 repairs before release',
    'Bus grounded until repair work order is completed and certified by mechanic.'
  );

  // Seed Audit Log
  const insertAudit = db.prepare('INSERT INTO audit_logs (action, module, record_id, details, user_name) VALUES (?, ?, ?, ?, ?)');
  insertAudit.run('SYSTEM_INIT', 'Core', '1', 'Initial database seed completed with 32 buses, 8 drivers, 6 support staff and initial operations.', 'System');
  insertAudit.run('ODOMETER_LOG', 'Daily KM', '1', 'Recorded daily distance 130 km for AP 16 TC 2080', 'Ramesh Kumar');

  console.log('Seeding completed successfully!');
}
