// Export latest database state from localhost:5000 directly into client seed
async function exportSeed() {
  const [busesRes, empsRes, routesRes, orgsRes, tasksRes, tyresRes, credsRes, dailyKmRes, settingsRes] = await Promise.all([
    fetch('http://localhost:5000/api/buses').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/employees').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/routes').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/organizers').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/tasks').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/tyre-maintenance').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/staff-credentials').then(r => r.json()).catch(() => []),
    fetch('http://localhost:5000/api/daily-kilometers').then(r => r.json()).catch(() => ({ entries: [] })),
    fetch('http://localhost:5000/api/settings').then(r => r.json()).catch(() => ({}))
  ]);

  const buses = Array.isArray(busesRes) ? busesRes : [];
  const employees = Array.isArray(empsRes) ? empsRes : [];
  const routes = Array.isArray(routesRes) ? routesRes : [];
  const organizers = Array.isArray(orgsRes) ? orgsRes : [];
  const tasks = Array.isArray(tasksRes) ? tasksRes : [];
  const tyres = Array.isArray(tyresRes) ? tyresRes : [];
  const staffCredentials = Array.isArray(credsRes) ? credsRes : [];
  const dailyKmEntries = Array.isArray(dailyKmRes?.entries) ? dailyKmRes.entries : (Array.isArray(dailyKmRes) ? dailyKmRes : []);
  const settings = settingsRes || {};

  console.log(`Exporting:
  - ${buses.length} buses
  - ${employees.length} employees
  - ${routes.length} routes
  - ${organizers.length} organizers
  - ${tasks.length} tasks
  - ${tyres.length} tyres
  - ${staffCredentials.length} staff credentials
  - ${dailyKmEntries.length} daily km entries`);

  const content = `// Auto-generated seed data from localhost fleet database
// Ensures that Vercel and fresh browsers immediately show the exact registered fleet, crew, transit routes, organizers, tasks, and maintenance records.

export const BASE_FLEET_BUSES: any[] = ${JSON.stringify(buses, null, 2)};

export const BASE_FLEET_EMPLOYEES: any[] = ${JSON.stringify(employees, null, 2)};

export const BASE_FLEET_ROUTES: any[] = ${JSON.stringify(routes, null, 2)};

export const BASE_FLEET_ORGANIZERS: any[] = ${JSON.stringify(organizers, null, 2)};

export const BASE_FLEET_TASKS: any[] = ${JSON.stringify(tasks, null, 2)};

export const BASE_TYRE_RECORDS: any[] = ${JSON.stringify(tyres, null, 2)};

export const BASE_STAFF_CREDENTIALS: any[] = ${JSON.stringify(staffCredentials, null, 2)};

export const BASE_DAILY_KM_ENTRIES: any[] = ${JSON.stringify(dailyKmEntries, null, 2)};

export const BASE_APP_SETTINGS: any = ${JSON.stringify(settings, null, 2)};
`;

  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(path.resolve('./client/src/services/seedData.ts'), content, 'utf-8');
  console.log('Successfully written all database records to client/src/services/seedData.ts');
}

exportSeed().catch(console.error);
