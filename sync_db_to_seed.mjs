import fs from 'fs';
import path from 'path';
import Database from './server/node_modules/better-sqlite3/lib/index.js';

const dbPath = path.resolve('./server/data/charvik.db');
const db = new Database(dbPath);

function getRows(table) {
  try {
    return db.prepare(`SELECT * FROM "${table}"`).all() || [];
  } catch (err) {
    console.warn(`Table ${table} not found or error:`, err.message);
    return [];
  }
}

// 1. Core Fleet & Operations
const buses = getRows('buses');
const employees = getRows('employees');
const driverDetails = getRows('driver_details');
const routes = getRows('transit_routes');
const organizers = getRows('organizers');
const tripDuties = getRows('trip_duties');

// Enrich employees with driver details
const enrichedEmployees = employees.map(emp => {
  const dd = driverDetails.find(d => String(d.employee_id) === String(emp.id));
  return {
    ...emp,
    driver_details: dd || null,
    licence_number: dd?.licence_number || emp.licence_number || '',
    licence_front_doc: dd?.licence_front_doc || emp.licence_front_doc || '',
    licence_back_doc: dd?.licence_back_doc || emp.licence_back_doc || '',
    issuing_state: dd?.issuing_state || '',
    issuing_rto_office: dd?.issuing_rto_office || '',
    licence_validity_date: dd?.licence_validity_date || '',
    licence_experience_years: dd?.licence_experience_years || 0,
    licence_verification_status: dd?.licence_verification_status || 'Verified'
  };
});

// Format trip duties
const formattedTasks = tripDuties.map(t => {
  let d1 = t.driver1;
  let d2 = t.driver2;
  let h = t.helper;
  let cap = t.captain;
  try { if (typeof d1 === 'string') d1 = JSON.parse(d1); } catch {}
  try { if (typeof d2 === 'string') d2 = JSON.parse(d2); } catch {}
  try { if (typeof h === 'string') h = JSON.parse(h); } catch {}
  try { if (typeof cap === 'string') cap = JSON.parse(cap); } catch {}
  return {
    ...t,
    driver1: d1,
    driver2: d2,
    helper: h,
    captain: cap
  };
});

// 2. Tyre Maintenance & Wheel Allotments
const tyreRecords = getRows('tyre_records');
const wheelAllotments = getRows('wheel_allotments');
const newTyres = getRows('new_tyres');
const tyreAirCheckups = getRows('tyre_air_checkups');

// 3. Vehicle Maintenance & Checkups
const acRecords = getRows('ac_maintenance_records');
const busInspections = getRows('bus_condition_inspections').map(bi => {
  let checklist = bi.checklist_data;
  try { if (typeof checklist === 'string') checklist = JSON.parse(checklist); } catch {}
  return {
    ...bi,
    checklist_data: checklist
  };
});
const dailyKm = getRows('daily_kilometer_entries');
const maintenanceSchedules = getRows('maintenance_schedules');
const settings = getRows('application_settings');
const administrators = getRows('administrators');

// 4. Service Billing & Captain Audits
const rawServiceRecords = getRows('service_records');
const serviceRecords = rawServiceRecords.map(r => {
  let items = r.items_json;
  try { if (typeof items === 'string') items = JSON.parse(items); } catch {}
  return {
    ...r,
    items: Array.isArray(items) ? items : []
  };
});

const rawCaptainAudits = getRows('captain_audit_records');
const captainAudits = rawCaptainAudits.map(a => {
  let amenities = a.amenities_json;
  let staffPics = a.staff_pictures_json;
  let cleanPics = a.cleaning_pictures_json;
  try { if (typeof amenities === 'string') amenities = JSON.parse(amenities); } catch {}
  try { if (typeof staffPics === 'string') staffPics = JSON.parse(staffPics); } catch {}
  try { if (typeof cleanPics === 'string') cleanPics = JSON.parse(cleanPics); } catch {}
  return {
    ...a,
    amenities: Array.isArray(amenities) ? amenities : [],
    staff_pictures: Array.isArray(staffPics) ? staffPics : [],
    cleaning_pictures: Array.isArray(cleanPics) ? cleanPics : []
  };
});

// Default baseline products if not in sqlite
const defaultProducts = [
  {
    id: 1,
    name: 'Castrol VECTON 15W-40 CK-4 Engine Oil (20L Bucket)',
    category: 'Lubricants',
    sku: 'LUB-CAS-15W40-20L',
    stock_quantity: 14,
    min_stock_level: 5,
    unit_price: 6850,
    supplier: 'Castrol India Commercial Depot',
    unit: 'Buckets',
    location: 'Bay 1 Lubricant Rack A',
    status: 'In Stock'
  },
  {
    id: 2,
    name: 'Fleetguard Primary Fuel Water Separator Filter FS19732',
    category: 'Filters',
    sku: 'FLT-FG-FS19732',
    stock_quantity: 28,
    min_stock_level: 8,
    unit_price: 1420,
    supplier: 'Fleetguard Cummins Spares',
    unit: 'Units',
    location: 'Bin F-04 Shelf 2',
    status: 'In Stock'
  },
  {
    id: 3,
    name: 'Heavy Duty Primary Air Filter Cartridge (Tata/Leyland BS6)',
    category: 'Filters',
    sku: 'FLT-AIR-BS6-HD',
    stock_quantity: 12,
    min_stock_level: 4,
    unit_price: 2450,
    supplier: 'Tata Commercial Spares',
    unit: 'Units',
    location: 'Bin F-09 Shelf 1',
    status: 'In Stock'
  },
  {
    id: 4,
    name: 'MRF Steel Muscle-S3C4 Radial Tyre 295/80 R22.5',
    category: 'Tyres',
    sku: 'TYR-MRF-295-80R225',
    stock_quantity: 8,
    min_stock_level: 4,
    unit_price: 24800,
    supplier: 'MRF Commercial Tyre Hub',
    unit: 'Tyres',
    location: 'Tyre Bay Staging Area',
    status: 'In Stock'
  },
  {
    id: 5,
    name: 'Heavy Commercial AC Cabin Air Filter Mesh Screen',
    category: 'AC Parts',
    sku: 'AC-CABIN-MESH-01',
    stock_quantity: 16,
    min_stock_level: 6,
    unit_price: 850,
    supplier: 'Carrier / Denso Bus AC Spares',
    unit: 'Units',
    location: 'Electrical Rack E-03',
    status: 'In Stock'
  },
  {
    id: 6,
    name: 'Amaron Hi-Way Commercial Bus Battery 12V 150Ah',
    category: 'Electrical',
    sku: 'BAT-AMR-12V150AH',
    stock_quantity: 6,
    min_stock_level: 2,
    unit_price: 13500,
    supplier: 'Amara Raja Batteries Ltd',
    unit: 'Units',
    location: 'Battery Charging Station B-1',
    status: 'In Stock'
  },
  {
    id: 7,
    name: 'Brake Lining Set Front/Rear Heavy Duty Non-Asbestos',
    category: 'Brake & Mechanical',
    sku: 'BRK-LINING-HD-04',
    stock_quantity: 18,
    min_stock_level: 5,
    unit_price: 3200,
    supplier: 'Rane Brake Linings',
    unit: 'Sets',
    location: 'Mechanical Bay M-02',
    status: 'In Stock'
  }
];

// Baseline daily km if empty
const defaultDailyKm = dailyKm.length > 0 ? dailyKm : [
  {
    id: 1,
    bus_id: 1,
    driver_id: 4,
    entry_date: '2026-10-30',
    opening_km: 45000,
    closing_km: 45570,
    distance_travelled_km: 570,
    bus_number: 'AP16TV1234',
    registration_number: 'AP16TV1234',
    driver_name: 'kittu',
    route_name: 'Hyderabad → Bangalore',
    remarks: 'Full trip completed smoothly on schedule',
    created_at: '2026-10-30 09:30:00'
  }
];

console.log(`Summary of Extracted Data:
- Buses: ${buses.length}
- Employees: ${enrichedEmployees.length}
- Routes: ${routes.length}
- Organizers: ${organizers.length}
- Tasks: ${formattedTasks.length}
- Tyre Records: ${tyreRecords.length}
- Wheel Allotments: ${wheelAllotments.length}
- AC Maintenance Records: ${acRecords.length}
- Daily Vehicle Inspections: ${busInspections.length}
- Daily KM Entries: ${defaultDailyKm.length}
- Products: ${defaultProducts.length}
- Service Records: ${serviceRecords.length}
- Captain Audits: ${captainAudits.length}
`);

const content = `// Auto-generated master seed data from local SQLite database (charvik.db)
// This file guarantees that ALL tabs on Vercel immediately display the full operational dataset.

export const BASE_FLEET_BUSES: any[] = ${JSON.stringify(buses, null, 2)};

export const BASE_FLEET_EMPLOYEES: any[] = ${JSON.stringify(enrichedEmployees, null, 2)};

export const BASE_FLEET_ROUTES: any[] = ${JSON.stringify(routes, null, 2)};

export const BASE_FLEET_ORGANIZERS: any[] = ${JSON.stringify(organizers, null, 2)};

export const BASE_FLEET_TASKS: any[] = ${JSON.stringify(formattedTasks, null, 2)};

export const BASE_TYRE_RECORDS: any[] = ${JSON.stringify(tyreRecords, null, 2)};

export const BASE_TYRE_AIR_CHECKUPS: any[] = ${JSON.stringify(tyreAirCheckups, null, 2)};

export const BASE_WHEEL_ALLOTMENTS: any[] = ${JSON.stringify(wheelAllotments, null, 2)};

export const BASE_NEW_TYRES: any[] = ${JSON.stringify(newTyres, null, 2)};

export const BASE_AC_MAINTENANCE_RECORDS: any[] = ${JSON.stringify(acRecords, null, 2)};

export const BASE_BUS_CONDITION_INSPECTIONS: any[] = ${JSON.stringify(busInspections, null, 2)};

export const BASE_DAILY_KM_ENTRIES: any[] = ${JSON.stringify(defaultDailyKm, null, 2)};

export const BASE_MAINTENANCE_SCHEDULES: any[] = ${JSON.stringify(maintenanceSchedules, null, 2)};

export const BASE_PRODUCTS: any[] = ${JSON.stringify(defaultProducts, null, 2)};

export const BASE_SERVICE_RECORDS: any[] = ${JSON.stringify(serviceRecords, null, 2)};

export const BASE_CAPTAIN_AUDITS: any[] = ${JSON.stringify(captainAudits, null, 2)};

export const BASE_STAFF_CREDENTIALS: any[] = ${JSON.stringify(administrators, null, 2)};

export const BASE_APP_SETTINGS: any = ${JSON.stringify(settings, null, 2)};

export const BASE_FLEET_MAINTENANCE_BUSES: any[] = [];
export const BASE_FLEET_MAINTENANCE_HISTORY: any[] = [];
export const BASE_DAILY_MAINTENANCE_RECORDS: any[] = [];

export interface DailyMaintenanceRecord {
  id?: number | string;
  entry_date: string;
  vehicle_number: string;
  driver_name?: string;
  driver_phone?: string;
  starting_km?: number | string;
  route_corridor?: string;
  defects_notes?: string;
  checklist?: Record<string, boolean>;
  checklist_items?: Array<{ id: number; name: string; is_ok: boolean; remarks?: string }>;
  created_at?: string;
}

export const BASE_VYSHNAVI_RECORDS: any[] = [
  {
    id: 1,
    invoice_no: 'VT/2026/10-01',
    period_month: 'October',
    period_year: '2026',
    operator_name: 'Charvik Staffing & Logistics',
    gst_number: '36GGGGG0000WG6G',
    total_amount: 46000,
    amount_in_words: 'Forty Six Thousand Rupees Only',
    received_amount: 20000,
    balance_amount: 26000,
    bank_name: 'Kotak Mahindra Bank',
    bank_account_name: 'Vyshnavi Travels',
    bank_account_no: '2848153146',
    bank_ifsc: 'KKBK0007460',
    bank_branch: 'VANAS',
    upi_id: '9000202241@ybl',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=9000202241@ybl%26pn=Vyshnavi%20Travels%26am=26000%26cu=INR',
    remarks: 'October 2026 driver & helper crew settlement'
  }
];

export const BASE_VYSHNAVI_TRANSACTIONS: any[] = [
  {
    id: 1,
    transaction_type: 'Income',
    transaction_date: '2026-11-07',
    category: 'Trip Advance / Booking',
    vehicle_number: 'AP16TV1234',
    amount: 35000,
    payment_mode: 'Bank Transfer',
    party_name: 'Sri Krishna Travels',
    description: 'Advance payment for Hyderabad - Tirupati charter trip',
    reference_no: 'TXN-998124',
    receipt_url: ''
  },
  {
    id: 2,
    transaction_type: 'Expense',
    transaction_date: '2026-11-06',
    category: 'Diesel / Fuel',
    vehicle_number: 'AP16TC4567',
    amount: 14800,
    payment_mode: 'UPI',
    party_name: 'Indian Oil Highway Station',
    description: 'Diesel top-up 160 Litres for Vijayawada route',
    reference_no: 'UPI-431289',
    receipt_url: ''
  },
  {
    id: 3,
    transaction_type: 'Income',
    transaction_date: '2026-11-05',
    category: 'Client Settlement',
    vehicle_number: 'AP16TV1234',
    amount: 20000,
    payment_mode: 'UPI',
    party_name: 'YoloBus Logistics',
    description: 'Weekly settlement against service record VT-REC-2026-001',
    reference_no: 'YBL-77123',
    receipt_url: ''
  },
  {
    id: 4,
    transaction_type: 'Expense',
    transaction_date: '2026-11-03',
    category: 'Toll & Taxes',
    vehicle_number: 'AP16TC4567',
    amount: 3200,
    payment_mode: 'Fastag',
    party_name: 'NHAI FASTag Recharge',
    description: 'Monthly highway FASTag pass balance recharge',
    reference_no: 'FTG-89410',
    receipt_url: ''
  }
];

export interface VehicleComplaintItem {
  id?: string;
  complaint: string;
  remarks: string;
}

export interface ConsumablePartItem {
  id?: string;
  part_name: string;
  part_number_details: string;
  quantity: number | string;
  amount: number | string;
}

export interface VehicleMaintenanceJobCardRecord {
  id: number | string;
  job_card_no: string;
  date_of_request: string;
  km_reading: number | string;
  fleet_owner: string;
  vehicle_number: string;
  complaints: VehicleComplaintItem[];
  parts: ConsumablePartItem[];
  total_parts_amount: number;
  mechanic_name: string;
  mechanic_number: string;
  workshop_name: string;
  work_location: string;
  status?: string;
  created_at?: string;
}

export const BASE_VEHICLE_MAINTENANCE_JOB_CARDS: VehicleMaintenanceJobCardRecord[] = [
  {
    id: 1,
    job_card_no: 'CSC/VM/2026/001',
    date_of_request: '2026-11-09',
    km_reading: 312000,
    fleet_owner: 'Sri Krishna Travels',
    vehicle_number: 'DL01A1024',
    complaints: [
      { id: 'c1', complaint: 'Front brake pad noise & high speed steering vibration', remarks: 'Replaced liners' },
      { id: 'c2', complaint: 'Air conditioning cooling reduced in cabin', remarks: 'Gas top-up required' }
    ],
    parts: [
      { id: 'p1', part_name: 'Brake Pad Liners Front', part_number_details: 'BP-1024 / Bosch', quantity: 2, amount: 4500 },
      { id: 'p2', part_name: 'AC Refrigerant R134a', part_number_details: 'R134a 1KG Can', quantity: 1, amount: 1850 }
    ],
    total_parts_amount: 6350,
    mechanic_name: 'Ramesh Kumar',
    mechanic_number: '9848011223',
    workshop_name: 'Sri Sai Auto Garage & Works',
    work_location: 'Shamshabad, Hyderabad',
    status: 'Completed',
    created_at: '2026-11-09T10:30:00.000Z'
  },
  {
    id: 2,
    job_card_no: 'CSC/VM/2026/002',
    date_of_request: '2026-11-12',
    km_reading: 184500,
    fleet_owner: 'Vyshnavi Travels',
    vehicle_number: 'AP16TC4567',
    complaints: [
      { id: 'c1', complaint: 'Engine oil filter replacement & general maintenance check', remarks: 'Done' },
      { id: 'c2', complaint: 'Clutch pedal hard engagement', remarks: 'Cable adjusted & greased' }
    ],
    parts: [
      { id: 'p1', part_name: '15W40 Engine Oil (15L)', part_number_details: 'Castrol CRB Turbomax', quantity: 1, amount: 5200 },
      { id: 'p2', part_name: 'Oil Filter Element', part_number_details: 'OF-8821 Fleetguard', quantity: 1, amount: 950 }
    ],
    total_parts_amount: 6150,
    mechanic_name: 'Mohammad Rafiq',
    mechanic_number: '9700445511',
    workshop_name: 'National Highway Diesel Garage',
    work_location: 'Medchal Checkpost, Hyderabad',
    status: 'Completed',
    created_at: '2026-11-12T14:15:00.000Z'
  }
];

`;

fs.writeFileSync(path.resolve('./client/src/services/seedData.ts'), content, 'utf-8');
console.log('✅ Successfully synced ALL database records to client/src/services/seedData.ts');
