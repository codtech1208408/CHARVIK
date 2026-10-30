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
`);

const content = `// Auto-generated master seed data from local SQLite database (charvik.db)
// This file guarantees that ALL tabs on Vercel immediately display the full operational dataset.

export const BASE_FLEET_BUSES: any[] = ${JSON.stringify(buses, null, 2)};

export const BASE_FLEET_EMPLOYEES: any[] = ${JSON.stringify(enrichedEmployees, null, 2)};

export const BASE_FLEET_ROUTES: any[] = ${JSON.stringify(routes, null, 2)};

export const BASE_FLEET_ORGANIZERS: any[] = ${JSON.stringify(organizers, null, 2)};

export const BASE_FLEET_TASKS: any[] = ${JSON.stringify(formattedTasks, null, 2)};

export const BASE_TYRE_RECORDS: any[] = ${JSON.stringify(tyreRecords, null, 2)};

export const BASE_WHEEL_ALLOTMENTS: any[] = ${JSON.stringify(wheelAllotments, null, 2)};

export const BASE_NEW_TYRES: any[] = ${JSON.stringify(newTyres, null, 2)};

export const BASE_AC_MAINTENANCE_RECORDS: any[] = ${JSON.stringify(acRecords, null, 2)};

export const BASE_BUS_CONDITION_INSPECTIONS: any[] = ${JSON.stringify(busInspections, null, 2)};

export const BASE_DAILY_KM_ENTRIES: any[] = ${JSON.stringify(defaultDailyKm, null, 2)};

export const BASE_MAINTENANCE_SCHEDULES: any[] = ${JSON.stringify(maintenanceSchedules, null, 2)};

export const BASE_PRODUCTS: any[] = ${JSON.stringify(defaultProducts, null, 2)};

export const BASE_STAFF_CREDENTIALS: any[] = ${JSON.stringify(administrators, null, 2)};

export const BASE_APP_SETTINGS: any = ${JSON.stringify(settings, null, 2)};
`;

fs.writeFileSync(path.resolve('./client/src/services/seedData.ts'), content, 'utf-8');
console.log('✅ Successfully synced ALL database records to client/src/services/seedData.ts');
