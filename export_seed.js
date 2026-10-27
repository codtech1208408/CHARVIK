// Export latest database state from localhost:5000 directly into client seed
async function exportSeed() {
  const [busesRes, empsRes, routesRes, orgsRes, tasksRes] = await Promise.all([
    fetch('http://localhost:5000/api/buses'),
    fetch('http://localhost:5000/api/employees'),
    fetch('http://localhost:5000/api/routes'),
    fetch('http://localhost:5000/api/organizers'),
    fetch('http://localhost:5000/api/tasks')
  ]);

  const buses = await busesRes.json();
  const employees = await empsRes.json();
  const routes = await routesRes.json();
  const organizers = await orgsRes.json();
  const tasks = await tasksRes.json();

  console.log(`Fetched ${buses.length} buses, ${employees.length} employees, ${routes.length} routes, ${organizers.length} organizers, ${tasks.length} tasks.`);

  const content = `// Auto-generated seed data from localhost fleet database
// Ensures that Vercel and fresh browsers immediately show the exact registered fleet, crew, transit routes, organizers, and tasks.

export const BASE_FLEET_BUSES: any[] = ${JSON.stringify(buses, null, 2)};

export const BASE_FLEET_EMPLOYEES: any[] = ${JSON.stringify(employees, null, 2)};

export const BASE_FLEET_ROUTES: any[] = ${JSON.stringify(routes, null, 2)};

export const BASE_FLEET_ORGANIZERS: any[] = ${JSON.stringify(organizers, null, 2)};

export const BASE_FLEET_TASKS: any[] = ${JSON.stringify(tasks, null, 2)};
`;

  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(path.resolve('./client/src/services/seedData.ts'), content, 'utf-8');
  console.log('Successfully written to client/src/services/seedData.ts');
}

exportSeed().catch(console.error);
