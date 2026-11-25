import {
  LayoutGrid,
  Users,
  Wrench,
  Bus,
  Star,
  Bell,
  HeartHandshake,
  Landmark,
  Navigation,
  ClipboardList,
  Building2,
  UserPlus,
  IndianRupee,
  TrendingUp,
  FileText,
  ShieldCheck,
  Gauge,
  ClipboardCheck,
  Fuel,
  Disc,
  Package,
  Coins,
  HandCoins,
  CalendarPlus
} from 'lucide-react';

export interface NavSubItem {
  label: string;
  route: string;
  icon: any;
  iconColor?: string;
  activeRoutes?: string[];
}

export interface NavItemLeaf {
  id?: string;
  label: string;
  name?: string;
  route: string;
  icon: any;
  iconColor?: string;
  activeGradient?: string;
  imageSrc?: string;
  hasLiveBadge?: boolean;
  activeRoutes?: string[];
  subItems?: NavSubItem[];
  description?: string;
}

export interface ModuleCategoryItem {
  id: string;
  name: string;
  label: string;
  route: string;
  icon: any;
  iconColor?: string;
  activeGradient?: string;
  activeRoutes: string[];
  description: string;
  subItems?: NavSubItem[];
}

// =========================================================================
// SUBTABS SPECIFICATIONS (Exact matches for Admin Panel modules)
// =========================================================================

export const adminVehicleManagementSubItems: NavSubItem[] = [
  { label: 'Route Management', route: '/admin/routes', icon: Navigation, iconColor: 'text-blue-500', activeRoutes: ['/admin/routes'] },
  { label: 'Trip Management', route: '/admin/tasks', icon: ClipboardList, iconColor: 'text-indigo-500', activeRoutes: ['/admin/tasks', '/admin/trips'] },
  { label: 'Operator Management', route: '/admin/organizers', icon: Building2, iconColor: 'text-amber-500', activeRoutes: ['/admin/organizers', '/admin/operators'] },
  { label: 'Employee Registration', route: '/admin/employee-registration', icon: UserPlus, iconColor: 'text-emerald-500', activeRoutes: ['/admin/employee-registration', '/admin/employees', '/admin/drivers', '/admin/support-staff'] },
  { label: 'Employee Payments', route: '/admin/employee-payments', icon: IndianRupee, iconColor: 'text-emerald-600', activeRoutes: ['/admin/employee-payments'] },
  { label: 'Earnings', route: '/admin/earnings', icon: TrendingUp, iconColor: 'text-purple-500', activeRoutes: ['/admin/earnings'] },
  { label: 'Record Management', route: '/admin/records', icon: FileText, iconColor: 'text-cyan-500', activeRoutes: ['/admin/records', '/admin/record-management', '/admin/record'] },
  { label: 'Captain Audit Record', route: '/admin/captain-audit', icon: ShieldCheck, iconColor: 'text-blue-600', activeRoutes: ['/admin/captain-audit', '/captain/audit-record'] },
  { label: 'Bus Rating', route: '/admin/bus-rating', icon: Star, iconColor: 'text-yellow-400', activeRoutes: ['/admin/bus-rating'] },
  { label: 'Official Letter Pad', route: '/admin/letter-pad?company=charvik', icon: FileText, iconColor: 'text-amber-500', activeRoutes: ['/admin/letter-pad', '/admin/official-letter-pad', '/admin/letterhead'] },
];

export const adminVehicleMaintenanceSubItems: NavSubItem[] = [
  { label: 'Fleet Maintenance Overview', route: '/admin/vehicle-maintenance', icon: Gauge, iconColor: 'text-amber-500', activeRoutes: ['/admin/vehicle-maintenance'] },
  { label: 'Daily Vehicle Maintenance', route: '/admin/vehicle-maintenance-card', icon: Wrench, iconColor: 'text-blue-500', activeRoutes: ['/admin/vehicle-maintenance-card', '/admin/job-card', '/admin/daily-maintenance'] },
  { label: 'Vehicle Registration', route: '/admin/vehicles', icon: Bus, iconColor: 'text-purple-600', activeRoutes: ['/admin/vehicles', '/admin/buses', '/admin/vehicle-registration', '/admin/vehicle-management'] },
  { label: 'Income & Expense', route: '/admin/income-expense', icon: IndianRupee, iconColor: 'text-emerald-500', activeRoutes: ['/admin/income-expense', '/admin/vehicle-income-expense', '/admin/income-and-expense'] },
  { label: 'Daily Vehicle Checkup', route: '/admin/daily-vehicle-checkup', icon: ClipboardCheck, iconColor: 'text-violet-600', activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/vehicle-checkup', '/admin/bus-condition'] },
  { label: 'Mileage & Fueling', route: '/admin/mileage-fueling', icon: Fuel, iconColor: 'text-amber-500', activeRoutes: ['/admin/mileage-fueling', '/admin/daily-kilometers'] },
  { label: 'New Tyres', route: '/admin/new-tyres', icon: Disc, iconColor: 'text-orange-500', activeRoutes: ['/admin/new-tyres', '/admin/tyres/new'] },
  { label: 'Product Management', route: '/admin/products', icon: Package, iconColor: 'text-pink-600', activeRoutes: ['/admin/products', '/admin/product-management'] },
];

export const adminVyshnaviTravelsSubItems: NavSubItem[] = [
  { label: 'Travels Statement & Billing', route: '/admin/vyshnavi-travels', icon: FileText, iconColor: 'text-teal-500', activeRoutes: ['/admin/vyshnavi-travels', '/admin/vyshnavi'] },
  { label: 'Service Records', route: '/admin/vyshnavi-travels?tab=records', icon: ClipboardList, iconColor: 'text-blue-500', activeRoutes: ['/admin/vyshnavi-travels?tab=records'] },
  { label: 'Income & Expense', route: '/admin/income-expense', icon: IndianRupee, iconColor: 'text-emerald-500', activeRoutes: ['/admin/income-expense'] },
  { label: 'Official Letter Pad', route: '/admin/letter-pad?company=vyshnavi', icon: FileText, iconColor: 'text-amber-500', activeRoutes: ['/admin/letter-pad?company=vyshnavi'] },
];

export const adminChandrikaFinanceSubItems: NavSubItem[] = [
  { label: 'Finance Overview', route: '/admin/chandrika-finance', icon: Landmark, iconColor: 'text-amber-500', activeRoutes: ['/admin/chandrika-finance'] },
  { label: 'Investment', route: '/admin/chandrika-finance?tab=investment', icon: Coins, iconColor: 'text-emerald-500', activeRoutes: ['/admin/chandrika-finance?tab=investment'] },
  { label: 'Customers', route: '/admin/chandrika-finance?tab=customers', icon: Users, iconColor: 'text-blue-500', activeRoutes: ['/admin/chandrika-finance?tab=customers'] },
  { label: 'Loan / Amount Given', route: '/admin/chandrika-finance?tab=loan', icon: HandCoins, iconColor: 'text-orange-500', activeRoutes: ['/admin/chandrika-finance?tab=loan'] },
  { label: 'Collections (Daily / Monthly)', route: '/admin/chandrika-finance?tab=collections', icon: CalendarPlus, iconColor: 'text-purple-500', activeRoutes: ['/admin/chandrika-finance?tab=collections'] },
  { label: 'Balance / Outstanding', route: '/admin/chandrika-finance?tab=balance', icon: TrendingUp, iconColor: 'text-rose-500', activeRoutes: ['/admin/chandrika-finance?tab=balance'] },
  { label: 'Official Letter Pad', route: '/admin/letter-pad?company=chandrika', icon: FileText, iconColor: 'text-amber-500', activeRoutes: ['/admin/letter-pad?company=chandrika'] },
];

// =========================================================================
// CENTRAL ADMIN PANEL NAVIGATION TABS (Single Source of Truth)
// =========================================================================

export const BASE_ADMIN_NAV_ITEMS: NavItemLeaf[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    name: 'Dashboard',
    route: '/admin/dashboard',
    icon: LayoutGrid,
    iconColor: 'text-sky-400',
    activeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    hasLiveBadge: true,
    activeRoutes: ['/admin/dashboard'],
    description: 'System overview, fleet metrics, active operations & live status'
  },
  {
    id: 'employee_management',
    label: 'Employee Management',
    name: 'Employee Management',
    route: '/admin/routes',
    icon: Users,
    iconColor: 'text-cyan-400',
    activeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    activeRoutes: [
      '/admin/routes',
      '/admin/tasks',
      '/admin/trips',
      '/admin/organizers',
      '/admin/operators',
      '/admin/employee-registration',
      '/admin/employees',
      '/admin/drivers',
      '/admin/support-staff',
      '/admin/employee-payments',
      '/admin/earnings',
      '/admin/records',
      '/admin/record-management',
      '/admin/record',
      '/admin/captain-audit',
      '/admin/captain-audit-record',
      '/admin/bus-rating'
    ],
    subItems: adminVehicleManagementSubItems,
    description: 'Routes, trip duties, organizers, employee directory, payroll & audits'
  },
  {
    id: 'vehicle_maintenance',
    label: 'Vehicle Maintenance',
    name: 'Vehicle Maintenance',
    route: '/admin/vehicle-maintenance',
    icon: Wrench,
    iconColor: 'text-blue-400',
    activeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    activeRoutes: [
      '/admin/vehicle-maintenance',
      '/admin/vehicle-maintenance-card',
      '/admin/job-card',
      '/admin/vehicles',
      '/admin/buses',
      '/admin/vehicle-registration',
      '/admin/vehicle-management',
      '/admin/income-expense',
      '/admin/vehicle-income-expense',
      '/admin/income-and-expense',
      '/admin/daily-vehicle-checkup',
      '/admin/vehicle-checkup',
      '/admin/bus-condition',
      '/admin/daily-maintenance',
      '/admin/mileage-fueling',
      '/admin/daily-kilometers',
      '/admin/new-tyres',
      '/admin/tyres/new',
      '/admin/products',
      '/admin/product-management'
    ],
    subItems: adminVehicleMaintenanceSubItems,
    description: 'Fleet job cards, inspections, mileage, tyres, parts & vehicle finances'
  },
  {
    id: 'vyshnavi_travels',
    label: 'Vyshnavi Travels',
    name: 'Vyshnavi Travels',
    route: '/admin/vyshnavi-travels',
    icon: Bus,
    iconColor: 'text-teal-400',
    activeGradient: 'bg-gradient-to-r from-teal-500 to-emerald-600',
    activeRoutes: ['/admin/vyshnavi-travels', '/admin/vyshnavi'],
    subItems: adminVyshnaviTravelsSubItems,
    description: 'Travel billing statements, dropping & pickup duties, ledger records'
  },
  {
    id: 'service_partners',
    label: 'Service Partners',
    name: 'Service Partners',
    route: '/admin/service-partners',
    icon: Users,
    iconColor: 'text-orange-400',
    activeGradient: 'bg-gradient-to-r from-orange-500 to-amber-600',
    activeRoutes: ['/admin/service-partners'],
    description: 'Authorized service centers, emergency highway garages & network'
  },
  {
    id: 'website_inquiries',
    label: 'Website Inquiries',
    name: 'Website Inquiries',
    route: '/admin/inquiries',
    icon: Bell,
    iconColor: 'text-indigo-400',
    activeGradient: 'bg-gradient-to-r from-violet-600 to-purple-600',
    activeRoutes: ['/admin/inquiries'],
    description: 'Customer contact messages, corporate inquiries and booking leads'
  },
  {
    id: 'donations',
    label: 'Donations',
    name: 'Donations',
    route: '/admin/donations',
    icon: HeartHandshake,
    iconColor: 'text-rose-400',
    activeGradient: 'bg-gradient-to-r from-pink-500 to-rose-600',
    activeRoutes: ['/admin/donations', '/admin/donation'],
    description: 'Benefactor contributions, staff welfare aid and donation proofs'
  },
  {
    id: 'chandrika_finance',
    label: 'Chandrika Finance',
    name: 'Chandrika Finance',
    route: '/admin/chandrika-finance',
    icon: Landmark,
    iconColor: 'text-amber-400',
    activeGradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
    activeRoutes: ['/admin/chandrika-finance', '/admin/finance'],
    subItems: adminChandrikaFinanceSubItems,
    description: 'Finance ledger, loans, collections, customer records & balances'
  }
];

// =========================================================================
// DYNAMIC EXTENSIBILITY: Custom Tabs Added At Runtime / Future
// =========================================================================

export const getCustomAdminTabs = (): NavItemLeaf[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('charvik_custom_admin_tabs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: item.id || (item.route || item.label || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          label: item.label || item.name,
          name: item.name || item.label,
          route: item.route || `/admin/${(item.label || '').toLowerCase().replace(/\s+/g, '-')}`,
          icon: LayoutGrid,
          iconColor: item.iconColor || 'text-sky-400',
          activeGradient: item.activeGradient || 'bg-gradient-to-r from-blue-600 to-indigo-600',
          activeRoutes: item.activeRoutes || [item.route],
          description: item.description || `${item.label || item.name} module`
        }));
      }
    }
  } catch { }
  return [];
};

/**
 * Returns all current Admin Navigation Tabs: built-in tabs plus any newly created custom tabs.
 */
export const getAdminNavItems = (): NavItemLeaf[] => {
  const custom = getCustomAdminTabs();
  if (custom.length === 0) return BASE_ADMIN_NAV_ITEMS;
  const existingRoutes = new Set(BASE_ADMIN_NAV_ITEMS.map((item) => item.route));
  const newCustom = custom.filter((item) => !existingRoutes.has(item.route));
  return [...BASE_ADMIN_NAV_ITEMS, ...newCustom];
};

/**
 * Programmatically register a new tab into the Admin Panel so it shows both in Sidebar
 * and dynamically in Operator Registration.
 */
export const registerAdminTab = (tab: {
  label: string;
  route: string;
  iconName?: string;
  description?: string;
}) => {
  if (typeof window === 'undefined') return;
  try {
    const custom = getCustomAdminTabs();
    if (!custom.some(c => c.route === tab.route || c.label === tab.label)) {
      custom.push({
        id: tab.route.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        label: tab.label,
        name: tab.label,
        route: tab.route,
        icon: LayoutGrid,
        iconColor: 'text-sky-400',
        activeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        activeRoutes: [tab.route],
        description: tab.description || `${tab.label} module`
      });
      localStorage.setItem('charvik_custom_admin_tabs', JSON.stringify(custom));
      window.dispatchEvent(new CustomEvent('charvik_tabs_updated'));
    }
  } catch { }
};

/**
 * Returns Module Category items representing the Admin Panel tabs.
 */
export const getAdminModuleCategories = (): ModuleCategoryItem[] => {
  const navItems = getAdminNavItems();
  return navItems.map((item) => ({
    id: item.id || item.route.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
    name: item.label,
    label: item.label,
    route: item.route,
    icon: item.icon,
    iconColor: item.iconColor,
    activeGradient: item.activeGradient,
    activeRoutes: item.activeRoutes || [item.route],
    description: item.description || `${item.label} module`,
    subItems: item.subItems
  }));
};

/**
 * Static baseline categories derived from the current Admin Panel tabs.
 */
export const ALL_MODULE_CATEGORIES: ModuleCategoryItem[] = BASE_ADMIN_NAV_ITEMS.map((item) => ({
  id: item.id || item.route.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
  name: item.label,
  label: item.label,
  route: item.route,
  icon: item.icon,
  iconColor: item.iconColor,
  activeGradient: item.activeGradient,
  activeRoutes: item.activeRoutes || [item.route],
  description: item.description || `${item.label} module`,
  subItems: item.subItems
}));

export const ALL_CATEGORY_NAMES: string[] = ALL_MODULE_CATEGORIES.map((c) => c.name);

/**
 * Maps legacy/submodule category names (e.g. "Trip Management", "AC Maintenance", "Daily Kilometers")
 * to the corresponding active Admin Panel tab.
 */
export const mapCategoryToCurrentTab = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();

  // If already matches an active Admin module
  const directMatch = ALL_MODULE_CATEGORIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch.name;

  // Legacy mappings from old subcategories to current Admin Panel tabs
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('route') ||
    lower.includes('task') ||
    lower.includes('trip') ||
    lower.includes('organizer') ||
    lower.includes('operator management') ||
    lower.includes('employee registration') ||
    lower.includes('employee payment') ||
    lower.includes('earning') ||
    lower.includes('record') ||
    lower.includes('captain audit')
  ) {
    return 'Employee Management';
  }

  if (
    lower.includes('vehicle maintenance') ||
    lower.includes('fleet maintenance') ||
    lower.includes('vehicle registration') ||
    lower.includes('checkup') ||
    lower.includes('mileage') ||
    lower.includes('fuel') ||
    lower.includes('tyre') ||
    lower.includes('product') ||
    lower.includes('ac maintenance') ||
    lower.includes('oil') ||
    lower.includes('battery') ||
    lower.includes('complaint') ||
    lower.includes('repair') ||
    lower.includes('schedule')
  ) {
    return 'Vehicle Maintenance';
  }

  if (lower.includes('vyshnavi')) {
    return 'Vyshnavi Travels';
  }

  if (lower.includes('service partner')) {
    return 'Service Partners';
  }

  if (lower.includes('rating') || lower.includes('bus rating')) {
    return 'Bus Rating';
  }

  if (lower.includes('inquir') || lower.includes('website')) {
    return 'Website Inquiries';
  }

  if (lower.includes('donation')) {
    return 'Donations';
  }

  if (lower.includes('finance') || lower.includes('chandrika')) {
    return 'Chandrika Finance';
  }

  return trimmed;
};
