import {
  Bus,
  Navigation,
  ClipboardList,
  Building2,
  ClipboardCheck,
  Fuel,
  Snowflake,
  CircleDot,
  Package,
  ShieldCheck,
  FileText,
  Wrench,
  CalendarCheck
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
    id: 'vehicle_maintenance',
    name: 'Vehicle Maintenance',
    route: '/admin/vehicle-maintenance',
    icon: Wrench,
    activeRoutes: ['/admin/vehicle-maintenance'],
    description: 'Fleet maintenance overview, service status & intervals'
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
    id: 'daily_maintenance',
    name: 'Daily Maintenance',
    route: '/admin/daily-maintenance',
    icon: CalendarCheck,
    activeRoutes: ['/admin/daily-maintenance'],
    description: 'Daily repairs, complaints, showroom bills & invoice records'
  },
  {
    id: 'new_tyres',
    name: 'New Tyres',
    route: '/admin/new-tyres',
    icon: CircleDot,
    activeRoutes: ['/admin/new-tyres', '/admin/tyres/new'],
    description: 'New tyre inventory, specifications, purchases & allotments'
  },
  {
    id: 'product_management',
    name: 'Product Management',
    route: '/admin/products',
    icon: Package,
    activeRoutes: ['/admin/products', '/admin/product-management'],
    description: 'Spare parts inventory, stock tracking & vehicle usage'
  },
  {
    id: 'captain_audit_record',
    name: 'Captain Audit Record',
    route: '/admin/captain-audit',
    icon: ShieldCheck,
    activeRoutes: ['/admin/captain-audit', '/captain/audit-record'],
    description: 'Captain onboard vehicle & amenities inspection audits'
  },
  {
    id: 'record_management',
    name: 'Record',
    route: '/admin/records',
    icon: FileText,
    activeRoutes: ['/admin/records', '/admin/record-management', '/admin/record'],
    description: 'Billing, service sheets & salary records'
  }
];

export const ALL_CATEGORY_NAMES: string[] = ALL_MODULE_CATEGORIES.map((c) => c.name);
