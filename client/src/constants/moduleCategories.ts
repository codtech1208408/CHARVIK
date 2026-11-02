import {
  Bus,
  Navigation,
  ClipboardList,
  Building2,
  ClipboardCheck,
  Fuel,
  Snowflake,
  CircleDot,
  Package
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
  {
    id: 'vehicle_registration',
    name: 'Vehicle Registration',
    route: '/admin/vehicles',
    icon: Bus,
    activeRoutes: ['/admin/vehicles', '/admin/buses', '/admin/vehicle-registration', '/admin/vehicle-management'],
    description: 'Fleet vehicle registration and details'
  },
  {
    id: 'route_management',
    name: 'Route Management',
    route: '/admin/routes',
    icon: Navigation,
    activeRoutes: ['/admin/routes'],
    description: 'Routes, corridors, and fare stages'
  },
  {
    id: 'task_management',
    name: 'Task Management',
    route: '/admin/tasks',
    icon: ClipboardList,
    activeRoutes: ['/admin/tasks'],
    description: 'Trip duty assignments and crew allocations'
  },
  {
    id: 'organizer_management',
    name: 'Organizer Management',
    route: '/admin/organizers',
    icon: Building2,
    activeRoutes: ['/admin/organizers'],
    description: 'Partner operators and organizers'
  },
  {
    id: 'daily_vehicle_checkup',
    name: 'Daily Vehicle Checkup',
    route: '/admin/daily-vehicle-checkup',
    icon: ClipboardCheck,
    activeRoutes: ['/admin/daily-vehicle-checkup', '/admin/bus-condition', '/admin/vehicle-checkup'],
    description: 'Daily inspection and bus condition checklists'
  },
  {
    id: 'mileage_fueling',
    name: 'Mileage & Fueling',
    route: '/admin/mileage-fueling',
    icon: Fuel,
    activeRoutes: ['/admin/mileage-fueling', '/admin/daily-kilometers'],
    description: 'Kilometer tracking and fuel entries'
  },
  {
    id: 'ac_maintenance',
    name: 'AC Maintenance',
    route: '/admin/ac-maintenance',
    icon: Snowflake,
    activeRoutes: ['/admin/ac-maintenance'],
    description: 'Air conditioning servicing and filter updates'
  },
  {
    id: 'tyre_maintenance',
    name: 'Tyre Maintenance',
    route: '/admin/tyre-maintenance',
    icon: CircleDot,
    activeRoutes: ['/admin/tyre-maintenance'],
    description: 'Tyre rotation, air checkup, and renewals'
  },
  {
    id: 'product_management',
    name: 'Product Management',
    route: '/admin/products',
    icon: Package,
    activeRoutes: ['/admin/products'],
    description: 'Spare parts, inventory, and materials'
  }
];

export const ALL_CATEGORY_NAMES: string[] = ALL_MODULE_CATEGORIES.map((c) => c.name);
