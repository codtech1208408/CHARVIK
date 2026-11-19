import {
  Bus,
  Navigation,
  ClipboardList,
  Building2,
  ClipboardCheck,
  Fuel,
  Snowflake,
  CircleDot,
  Disc,
  Package,
  ShieldCheck,
  FileText,
  Wrench,
  Gauge,
  Users,
  UserPlus,
  IndianRupee,
  TrendingUp,
  Star,
  Globe,
  HeartHandshake,
  Landmark,
  CalendarDays,
  Droplets,
  BatteryCharging,
  AlertTriangle,
  Hammer,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';

export interface ModuleCategoryItem {
  id: string;
  name: string;
  route: string;
  icon: any;
  activeRoutes: string[];
  description: string;
}

export const ALL_MODULE_CATEGORIES: ModuleCategoryItem[] = [
  // --- FLEET OPERATIONS & TRANSIT ---
  {
    id: 'vehicle_registration',
    name: 'Vehicle Registration',
    route: '/admin/vehicles',
    icon: Bus,
    activeRoutes: ['/admin/vehicles', '/admin/buses', '/admin/vehicle-registration', '/admin/vehicle-management', '/captain/buses', '/operator/buses'],
    description: 'Fleet vehicle registration, bus profiles and master details'
  },
  {
    id: 'route_management',
    name: 'Route Management',
    route: '/admin/routes',
    icon: Navigation,
    activeRoutes: ['/admin/routes'],
    description: 'Transit routes, corridors, stop stages and fare distances'
  },
  {
    id: 'task_management',
    name: 'Trip Management',
    route: '/admin/tasks',
    icon: ClipboardList,
    activeRoutes: ['/admin/tasks', '/admin/trips', '/admin/trip-management', '/operator/tasks'],
    description: 'Trip duty assignments, schedule management and crew allocations'
  },
  {
    id: 'organizer_management',
    name: 'Operator Management',
    route: '/admin/organizers',
    icon: Building2,
    activeRoutes: ['/admin/organizers', '/admin/operators', '/admin/operator-management'],
    description: 'Partner operators, fleet vendors and tour organizers'
  },

  // --- VEHICLE MAINTENANCE & WORKSHOP ---
  {
    id: 'vehicle_maintenance',
    name: 'Daily Vehicle Maintenance',
    route: '/admin/vehicle-maintenance-card',
    icon: Wrench,
    activeRoutes: ['/admin/vehicle-maintenance-card', '/admin/job-card', '/admin/daily-maintenance'],
    description: 'Maintenance job cards, workshop repairs, and work orders'
  },
  {
    id: 'fleet_maintenance_overview',
    name: 'Fleet Maintenance Overview',
    route: '/admin/vehicle-maintenance',
    icon: Gauge,
    activeRoutes: ['/admin/vehicle-maintenance'],
    description: 'Fleet health overview, overhaul intervals, overdue services and alerts'
  },
  {
    id: 'daily_vehicle_checkup',
    name: 'Daily Vehicle Checkup',
    route: '/admin/daily-vehicle-checkup',
    icon: ClipboardCheck,
    activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/bus-condition', '/admin/vehicle-checkup', '/captain/bus-condition', '/operator/bus-condition'],
    description: 'Pre-trip inspections, daily safety checkups and bus condition checklists'
  },
  {
    id: 'mileage_fueling',
    name: 'Mileage & Fueling',
    route: '/admin/mileage-fueling',
    icon: Fuel,
    activeRoutes: ['/admin/mileage-fueling', '/admin/daily-kilometers', '/captain/daily-kilometers', '/operator/daily-kilometers'],
    description: 'Odometer tracking, diesel fueling logs, mileage efficiency and fuel costs'
  },
  {
    id: 'tyre_maintenance',
    name: 'Tyre Maintenance',
    route: '/admin/tyre-maintenance',
    icon: CircleDot,
    activeRoutes: ['/admin/tyre-maintenance', '/captain/tyre-maintenance'],
    description: 'Tyre rotations, PSI pressure checks, tread depth and axle positions'
  },
  {
    id: 'new_tyres',
    name: 'New Tyres',
    route: '/admin/new-tyres',
    icon: Disc,
    activeRoutes: ['/admin/new-tyres', '/admin/tyres/new'],
    description: 'New tyre inventory, specifications, purchases and stock allotments'
  },
  {
    id: 'product_management',
    name: 'Product Management',
    route: '/admin/products',
    icon: Package,
    activeRoutes: ['/admin/products', '/admin/product-management'],
    description: 'Spare parts inventory, consumables stock tracking and vehicle usage'
  },
  {
    id: 'maintenance_schedule',
    name: 'Maintenance Schedule',
    route: '/admin/maintenance-schedule',
    icon: CalendarDays,
    activeRoutes: ['/admin/maintenance-schedule', '/captain/maintenance-schedule', '/operator/maintenance-schedule'],
    description: 'Preventive maintenance timetables, calendar schedules and reminders'
  },
  {
    id: 'ac_maintenance',
    name: 'AC Maintenance',
    route: '/admin/ac-maintenance',
    icon: Snowflake,
    activeRoutes: ['/admin/ac-maintenance'],
    description: 'Bus air conditioning servicing, gas top-up, filter cleaning and cooling audits'
  },
  {
    id: 'oil_filter_maintenance',
    name: 'Oil & Filter Maintenance',
    route: '/admin/oil-filter-maintenance',
    icon: Droplets,
    activeRoutes: ['/admin/oil-filter-maintenance'],
    description: 'Engine oil change logs, oil filters, air filters and coolant top-up'
  },
  {
    id: 'battery_maintenance',
    name: 'Battery Maintenance',
    route: '/admin/battery-maintenance',
    icon: BatteryCharging,
    activeRoutes: ['/admin/battery-maintenance', '/captain/battery-maintenance'],
    description: 'Battery health, terminal greasing, electrolyte levels and replacement logs'
  },
  {
    id: 'complaints',
    name: 'Complaints & Defects',
    route: '/admin/complaints',
    icon: AlertTriangle,
    activeRoutes: ['/admin/complaints', '/captain/complaints', '/operator/complaints'],
    description: 'Driver defect reports, breakdown tickets and resolution logs'
  },
  {
    id: 'repairs',
    name: 'Repairs & Work Orders',
    route: '/admin/repairs',
    icon: Hammer,
    activeRoutes: ['/admin/repairs', '/operator/repairs'],
    description: 'Workshop repair records, spare parts replacement and mechanical fixes'
  },

  // --- STAFF, AUDIT & RECORDS ---
  {
    id: 'captain_audit_record',
    name: 'Captain Audit Record',
    route: '/admin/captain-audit',
    icon: ShieldCheck,
    activeRoutes: ['/admin/captain-audit', '/captain/audit-record', '/captain/captain-audit', '/operator/captain-audit', '/operator/audit-record'],
    description: 'Captain onboard vehicle, amenities and passenger service audits'
  },
  {
    id: 'record_management',
    name: 'Record Management',
    route: '/admin/records',
    icon: FileText,
    activeRoutes: ['/admin/records', '/admin/record-management', '/admin/record'],
    description: 'Billing summaries, service records, crew payments and salary logs'
  },
  {
    id: 'employee_registration',
    name: 'Employee Registration',
    route: '/admin/employee-registration',
    icon: UserPlus,
    activeRoutes: ['/admin/employee-registration', '/admin/employees', '/admin/drivers', '/admin/support-staff', '/operator/employee-registration', '/operator/employees'],
    description: 'Driver, captain, helper, cleaner and office staff onboarding'
  },
  {
    id: 'employee_payments',
    name: 'Employee Payments',
    route: '/admin/employee-payments',
    icon: IndianRupee,
    activeRoutes: ['/admin/employee-payments'],
    description: 'Staff payroll disbursement, daily beta allowances and salary slips'
  },
  {
    id: 'earnings',
    name: 'Earnings',
    route: '/admin/earnings',
    icon: TrendingUp,
    activeRoutes: ['/admin/earnings'],
    description: 'Revenue analysis, trip collection metrics and profit analytics'
  },

  // --- FINANCE, SPECIAL PARTNERS & PUBLIC PORTAL ---
  {
    id: 'vyshnavi_travels',
    name: 'Vyshnavi Travels',
    route: '/admin/vyshnavi-travels',
    icon: FileText,
    activeRoutes: ['/admin/vyshnavi-travels', '/admin/vyshnavi'],
    description: 'Vyshnavi Travels dedicated billing, staff allocations and statements'
  },
  {
    id: 'service_partners',
    name: 'Service Partners',
    route: '/admin/service-partners',
    icon: Building2,
    activeRoutes: ['/admin/service-partners'],
    description: 'Authorized service centers, emergency garages and highway mechanics'
  },
  {
    id: 'bus_rating',
    name: 'Bus Rating',
    route: '/admin/bus-rating',
    icon: Star,
    activeRoutes: ['/admin/bus-rating'],
    description: 'Passenger feedback, cleanliness ratings and coach performance reviews'
  },
  {
    id: 'website_inquiries',
    name: 'Website Inquiries',
    route: '/admin/inquiries',
    icon: Globe,
    activeRoutes: ['/admin/inquiries'],
    description: 'Customer contact messages, corporate inquiries and booking leads'
  },
  {
    id: 'donations',
    name: 'Donations & Welfare',
    route: '/admin/donations',
    icon: HeartHandshake,
    activeRoutes: ['/admin/donations', '/admin/donation'],
    description: 'Benefactor contributions, staff welfare aid and donation proofs'
  },
  {
    id: 'chandrika_finance',
    name: 'Chandrika Finance',
    route: '/admin/chandrika-finance',
    icon: Landmark,
    activeRoutes: ['/admin/chandrika-finance', '/admin/finance'],
    description: 'Loan accounts, EMI schedules, borrower records and collection statements'
  },
  {
    id: 'income_expense',
    name: 'Income & Expense',
    route: '/admin/income-expense',
    icon: IndianRupee,
    activeRoutes: ['/admin/income-expense', '/admin/income-and-expense'],
    description: 'Operational expenses, daily receipts, diesel costs and cash ledger'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    route: '/admin/reports',
    icon: BarChart3,
    activeRoutes: ['/admin/reports'],
    description: 'Consolidated MIS reports, compliance logs and Excel data exports'
  },
  {
    id: 'settings',
    name: 'Settings & Administration',
    route: '/admin/settings',
    icon: Settings,
    activeRoutes: ['/admin/settings'],
    description: 'System preferences, company branding, security and database controls'
  }
];

export const ALL_CATEGORY_NAMES: string[] = ALL_MODULE_CATEGORIES.map((c) => c.name);
