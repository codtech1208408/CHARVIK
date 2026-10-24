export interface Bus {
  id: number;
  bus_number: string;
  registration_number: string;
  make: string;
  model: string;
  bus_type: string;
  manufacturing_year: number;
  purchase_date?: string;
  chassis_number: string;
  engine_number: string;
  fuel_type: string;
  seating_capacity: number;
  insurance_expiry: string;
  fitness_expiry: string;
  permit_expiry: string;
  puc_expiry: string;
  current_odometer_km: number;
  operational_status: 'Active' | 'Inactive' | 'Under Maintenance' | 'Out of Service';
  assigned_driver_id?: number | null;
  assigned_helper_id?: number | null;
  driver_name?: string;
  driver_phone?: string;
  helper_name?: string;
  notes?: string;
  is_archived?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  role: 'Driver' | 'Helper' | 'Captain';
  full_name: string;
  gender: string;
  date_of_birth?: string;
  email?: string;
  phone_number: string;
  alternative_phone_number?: string;
  profile_photo?: string;
  aadhaar_number?: string;
  aadhaar_front_doc?: string;
  aadhaar_back_doc?: string;
  pan_number?: string;
  pan_doc?: string;
  bank_name?: string;
  bank_proof_doc?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch?: string;
  nominee_name?: string;
  nominee_relationship?: string;
  nominee_phone?: string;
  nominee_age?: number | string;
  nominee_aadhaar?: string;
  reference_name?: string;
  reference_phone?: string;
  reference_alt_phone?: string;
  joining_date?: string;
  employment_status: 'Active' | 'Inactive' | 'On Leave' | 'Suspended' | 'Resigned' | 'Terminated';
  assigned_bus_id?: number | null;
  bus_number?: string;
  registration_number?: string;
  internal_remarks?: string;
  licence_number?: string;
  licence_validity_date?: string;
  licence_verification_status?: string;
  is_archived?: number;
}

export interface DriverDetail {
  id?: number;
  employee_id: number;
  licence_number: string;
  licence_front_doc?: string;
  licence_back_doc?: string;
  issuing_state?: string;
  issuing_rto_office?: string;
  licence_issue_date?: string;
  licence_validity_date: string;
  licence_experience_years?: number;
  criminal_background_details?: string;
  licence_verification_status: 'Not Verified' | 'Pending Verification' | 'Verified' | 'Rejected' | 'Expired';
}

export interface DailyKmEntry {
  id: number;
  entry_date: string;
  bus_id: number;
  driver_id?: number;
  bus_number?: string;
  registration_number?: string;
  driver_name?: string;
  opening_km: number;
  closing_km: number;
  distance_travelled_km: number;
  remarks?: string;
  is_corrected?: number;
  correction_reason?: string;
  corrected_by?: string;
  created_at?: string;
}

export interface MaintenanceSchedule {
  id: number;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  current_odometer_km?: number;
  maintenance_type: string;
  last_service_date?: string;
  last_service_km?: number;
  interval_km?: number;
  next_due_date?: string;
  next_due_km?: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_to?: string;
  estimated_cost: number;
  status: 'Scheduled' | 'Due' | 'Due Soon' | 'Pending' | 'Overdue' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface TyreRecord {
  id: number;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  current_odometer_km?: number;
  tyre_serial_number: string;
  brand: string;
  size: string;
  tyre_position: string;
  installation_date?: string;
  installation_km?: number;
  last_inspection_date?: string;
  tread_depth_mm?: number;
  tyre_pressure_psi?: number;
  condition: 'Good' | 'Worn' | 'Damaged' | 'Needs Replacement' | 'Replaced';
  rotation_date?: string;
  replacement_date?: string;
  removal_km?: number;
  supplier?: string;
  cost: number;
  remarks?: string;
  is_active?: number;
}

export interface AcRecord {
  id: number;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  inspection_date: string;
  current_km?: number;
  ac_working_status: 'Working' | 'Needs Inspection' | 'Needs Repair' | 'Under Maintenance' | 'Completed';
  cooling_performance?: string;
  refrigerant_check?: string;
  filter_cleaning_replacement?: string;
  compressor_condition?: string;
  leak_inspection?: string;
  electrical_check?: string;
  issue_description?: string;
  work_performed?: string;
  service_provider?: string;
  next_service_date?: string;
  next_service_km?: number;
  service_cost: number;
  technician?: string;
  status: string;
  remarks?: string;
}

export interface OilFilterRecord {
  id: number;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  replacement_date: string;
  odometer_km?: number;
  oil_type?: string;
  oil_brand?: string;
  oil_quantity_liters?: number;
  oil_cost: number;
  oil_filter_replaced?: number;
  oil_filter_details?: string;
  air_filter_replaced?: number;
  air_filter_details?: string;
  fuel_filter_replaced?: number;
  fuel_filter_details?: string;
  other_filter_details?: string;
  labour_cost: number;
  total_cost: number;
  service_provider?: string;
  next_due_date?: string;
  next_due_km?: number;
  performed_by?: string;
  remarks?: string;
}

export interface BatteryRecord {
  id: number;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  inspection_date: string;
  current_km?: number;
  battery_brand?: string;
  serial_number?: string;
  battery_type?: string;
  battery_voltage?: number;
  measured_voltage?: number;
  battery_health: 'Good' | 'Needs Monitoring' | 'Weak' | 'Replace Soon' | 'Failed';
  terminal_condition?: string;
  charging_system_status?: string;
  installation_date?: string;
  warranty_expiry_date?: string;
  replacement_date?: string;
  battery_cost: number;
  technician?: string;
  next_check_date?: string;
  status: string;
  remarks?: string;
}

export interface Complaint {
  id: number;
  complaint_ref: string;
  reported_date: string;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  reported_by: string;
  contact_number?: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_staff?: string;
  assigned_vendor?: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'On Hold' | 'Resolved' | 'Closed';
  expected_resolution_date?: string;
  resolution_description?: string;
  resolved_date?: string;
  linked_repair_id?: number;
  attachments?: string;
  remarks?: string;
}

export interface RepairWorkOrder {
  id: number;
  work_order_number: string;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  linked_complaint_id?: number;
  complaint_ref?: string;
  repair_category?: string;
  problem_description: string;
  reported_date?: string;
  work_start_date?: string;
  work_completion_date?: string;
  odometer_km?: number;
  diagnosis?: string;
  work_performed?: string;
  parts_replaced?: string;
  labour_cost: number;
  parts_cost: number;
  other_charges: number;
  total_cost: number;
  workshop_vendor?: string;
  assigned_technician?: string;
  bus_availability_status: string;
  warranty_details?: string;
  invoice_doc?: string;
  next_followup_date?: string;
  status: 'Requested' | 'Approved' | 'In Progress' | 'Waiting for Parts' | 'Waiting for Approval' | 'Completed' | 'Cancelled';
  remarks?: string;
  return_to_service?: boolean;
}

export interface BusConditionInspection {
  id: number;
  inspection_ref: string;
  bus_id: number;
  bus_number?: string;
  registration_number?: string;
  inspection_date: string;
  inspection_time?: string;
  odometer_km?: number;
  inspector_name: string;
  exterior_body: string;
  tyre_condition: string;
  brake_condition: string;
  engine_condition: string;
  battery_condition: string;
  ac_condition: string;
  lights_condition: string;
  mirrors_condition: string;
  windshield_condition: string;
  wiper_condition: string;
  doors_emergency_exits: string;
  seat_condition: string;
  safety_equipment: string;
  fluid_levels: string;
  visible_leaks: string;
  roadworthiness_status: 'Fit for Service' | 'Fit with Restrictions' | 'Not Fit for Service';
  defects_found?: string;
  corrective_action_required?: string;
  linked_complaint_id?: number;
  photo_attachments?: string;
  inspector_remarks?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}
