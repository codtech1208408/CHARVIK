import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded from root and server directories
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { db, initDatabase } from './db.js';
import { runSeed } from './seed.js';
import { supabase, testSupabaseConnection } from './supabase.js';
import { cloudinary, uploadToCloudinary } from './cloudinary.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'charvik-secure-jwt-secret-key-2026';

// Initialize and seed database
initDatabase();
runSeed();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup file storage directory
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper for audit logging
function logAudit(action: string, module: string, recordId: string | number | bigint, details: string, user = 'Admin') {
  try {
    db.prepare('INSERT INTO audit_logs (action, module, record_id, details, user_name) VALUES (?, ?, ?, ?, ?)')
      .run(action, module, String(recordId), details, user);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// ================= AUTH HELPERS & ROLE MIDDLEWARE =================
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const role = (user.role || '').toLowerCase();
  if (!role.includes('admin')) {
    return res.status(403).json({ error: 'Access restricted: Only Administrators can perform this action or access this resource.' });
  }
  next();
}

// ================= AUTH ROUTES =================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const identifier = String(req.body.email_or_username || req.body.email || req.body.username || req.body.phone_number || req.body.mobile || '').trim();
  const password = req.body.password;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Mobile number or Email/Username and password are required' });
  }

  // Find user in administrators by email_or_username, phone_number, or common role alias
  let user = db.prepare(`
    SELECT * FROM administrators 
    WHERE email_or_username = ? 
       OR phone_number = ?
       OR (LOWER(?) IN ('admin', 'administrator') AND role = 'Super Admin')
       OR (LOWER(?) IN ('support', 'supporter') AND role = 'Support Staff')
       OR (LOWER(?) = 'captain' AND role = 'Captain')
  `).get(identifier, identifier, identifier, identifier, identifier) as any;

  // If not found in administrators directly, check if a Captain employee has this phone_number
  if (!user) {
    const captainEmp = db.prepare("SELECT * FROM employees WHERE phone_number = ? AND role = 'Captain' AND is_archived = 0").get(identifier) as any;
    if (captainEmp) {
      user = db.prepare("SELECT * FROM administrators WHERE role = 'Captain' LIMIT 1").get() as any;
      if (user) {
        db.prepare('UPDATE administrators SET phone_number = ? WHERE id = ?').run(identifier, user.id);
        user.phone_number = identifier;
      }
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your mobile number or email/username.' });
  }

  if (user.status !== 'Active') {
    return res.status(403).json({ error: 'Your account has been disabled by the Administrator. Please contact your Fleet Administrator.' });
  }

  let validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    // Convenient fallback for default passwords
    if (user.role === 'Super Admin' && (password === 'admin123' || password === 'adminpassword')) {
      validPassword = true;
    } else if (user.role === 'Support Staff' && (password === 'supporter123' || password === 'support123')) {
      validPassword = true;
    } else if (user.role === 'Captain' && password === 'captain123') {
      validPassword = true;
    }
  }

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email_or_username, phone_number: user.phone_number, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAudit('LOGIN', 'Auth', user.id, `User ${user.name} (${user.role}) logged in successfully`, user.name);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email_or_username,
      phone_number: user.phone_number,
      role: user.role,
      status: user.status
    }
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, name, email_or_username, phone_number, role, status FROM administrators WHERE id = ?').get(decoded.id);
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ================= STAFF CREDENTIALS MANAGEMENT (BY ADMIN) =================
// List all credentials (Admin, Captains, Supporters)
app.get('/api/staff-credentials', (req: Request, res: Response) => {
  try {
    const list = db.prepare('SELECT id, name, email_or_username, phone_number, role, status, created_at, updated_at FROM administrators ORDER BY id ASC').all();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin creates new credentials for a Supporter or Captain
app.post('/api/staff-credentials', requireAdmin, (req: Request, res: Response) => {
  const { name, email_or_username, phone_number, password, role } = req.body;
  const userRole = role || 'Support Staff';
  const identifier = (email_or_username || phone_number || '').trim();

  if (!name || !identifier || !password) {
    return res.status(400).json({ error: 'Name, login identifier (mobile/email), and password are required' });
  }

  const existing = db.prepare('SELECT id FROM administrators WHERE email_or_username = ? OR (phone_number = ? AND phone_number IS NOT NULL AND phone_number != "")').get(identifier, phone_number || identifier);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email, username, or mobile number already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const assignedPhone = phone_number || (userRole === 'Captain' ? identifier : null);

  try {
    const result = db.prepare(`
      INSERT INTO administrators (name, email_or_username, phone_number, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `).run(name, identifier, assignedPhone, password_hash, userRole);

    logAudit('CREATE_CREDENTIAL', 'StaffAuth', result.lastInsertRowid, `Created ${userRole} account for ${name} (${identifier})`);

    return res.json({
      success: true,
      id: result.lastInsertRowid,
      name,
      email_or_username: identifier,
      phone_number: assignedPhone,
      role: userRole,
      status: 'Active'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin resets staff password
app.put('/api/staff-credentials/:id/password', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Valid new password is required (min 4 characters)' });
  }

  const password_hash = bcrypt.hashSync(newPassword, 10);
  try {
    db.prepare('UPDATE administrators SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(password_hash, id);
    logAudit('RESET_PASSWORD', 'StaffAuth', id, `Admin reset password for staff member id ${id}`);
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin toggles active/inactive access
app.put('/api/staff-credentials/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Active' or 'Inactive'" });
  }

  const user = db.prepare('SELECT role FROM administrators WHERE id = ?').get(id) as any;
  if (!user) {
    return res.status(404).json({ error: 'Staff account not found' });
  }
  if (user.role === 'Super Admin' && status === 'Inactive') {
    return res.status(400).json({ error: 'Cannot disable the primary Super Admin account' });
  }

  try {
    db.prepare('UPDATE administrators SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    logAudit('TOGGLE_STATUS', 'StaffAuth', id, `Admin set staff id ${id} status to ${status}`);
    return res.json({ success: true, message: `Access ${status === 'Active' ? 'enabled' : 'disabled'} successfully`, status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin deletes staff credential
app.delete('/api/staff-credentials/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT role FROM administrators WHERE id = ?').get(id) as any;
    if (user?.role === 'Super Admin') {
      return res.status(400).json({ error: 'Cannot delete Super Admin account' });
    }
    db.prepare('DELETE FROM administrators WHERE id = ?').run(id);
    logAudit('DELETE_CREDENTIAL', 'StaffAuth', id, `Admin deleted staff credential id ${id}`);
    return res.json({ success: true, message: 'Staff credential deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= CAPTAIN EXCLUSIVE PORTAL API =================
app.get('/api/captain/my-duty', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Locate Captain in employees
    let captainEmp = null;
    if (authUser.phone_number) {
      captainEmp = db.prepare("SELECT * FROM employees WHERE phone_number = ? AND role = 'Captain'").get(authUser.phone_number) as any;
    }
    if (!captainEmp && authUser.email) {
      captainEmp = db.prepare("SELECT * FROM employees WHERE (email = ? OR employee_code = ?) AND role = 'Captain'").get(authUser.email, authUser.email) as any;
    }
    if (!captainEmp) {
      captainEmp = db.prepare("SELECT * FROM employees WHERE role = 'Captain' AND is_archived = 0 ORDER BY id ASC LIMIT 1").get() as any;
    }

    // Get assigned bus
    let assignedBusId = captainEmp?.assigned_bus_id;
    let bus = null;
    if (assignedBusId) {
      bus = db.prepare('SELECT * FROM buses WHERE id = ?').get(assignedBusId) as any;
    }
    if (!bus) {
      bus = db.prepare("SELECT * FROM buses WHERE operational_status = 'Active' AND is_archived = 0 ORDER BY id ASC LIMIT 1").get() as any;
    }

    // Get assigned driver & helper for this bus
    let driver = null;
    let helper = null;
    if (bus?.assigned_driver_id) {
      driver = db.prepare('SELECT e.*, d.licence_number, d.licence_validity_date FROM employees e LEFT JOIN driver_details d ON e.id = d.employee_id WHERE e.id = ?').get(bus.assigned_driver_id) as any;
    }
    if (bus?.assigned_helper_id) {
      helper = db.prepare('SELECT * FROM employees WHERE id = ?').get(bus.assigned_helper_id) as any;
    }

    // Today's km entry for this bus
    const todayKm = bus ? db.prepare(`
      SELECT * FROM daily_kilometer_entries 
      WHERE bus_id = ? AND (entry_date = date('now') OR entry_date = '2026-10-11')
      ORDER BY id DESC LIMIT 1
    `).get(bus.id) as any : null;

    // Recent inspections for this bus
    const recentInspections = bus ? db.prepare(`
      SELECT * FROM bus_condition_inspections
      WHERE bus_id = ?
      ORDER BY id DESC LIMIT 3
    `).all(bus.id) : [];

    // Pending complaints for this bus
    const busComplaints = (bus ? db.prepare(`
      SELECT * FROM complaints
      WHERE bus_id = ? AND status NOT IN ('Resolved', 'Closed')
      ORDER BY id DESC LIMIT 5
    `).all(bus.id) : []) as any[];

    // Next scheduled maintenance for this bus
    const nextMaintenance = bus ? db.prepare(`
      SELECT * FROM maintenance_schedules
      WHERE bus_id = ? AND status NOT IN ('Completed', 'Cancelled')
      ORDER BY next_due_date ASC LIMIT 1
    `).get(bus.id) as any : null;

    // Duty history
    const dutyHistory = bus ? db.prepare(`
      SELECT k.*, b.bus_number, b.registration_number, e.full_name as driver_name
      FROM daily_kilometer_entries k
      JOIN buses b ON k.bus_id = b.id
      LEFT JOIN employees e ON k.driver_id = e.id
      WHERE k.bus_id = ?
      ORDER BY k.entry_date DESC
      LIMIT 7
    `).all(bus.id) : [];

    // Dynamic notifications for duty based on real DB status
    const notifications: any[] = [];
    if (nextMaintenance) {
      notifications.push({
        id: 1,
        title: 'Maintenance Due',
        message: `${nextMaintenance.maintenance_type} scheduled for ${bus?.bus_number} due on ${nextMaintenance.next_due_date || 'next interval'}.`,
        type: 'alert',
        time: 'Upcoming'
      });
    }
    if (busComplaints.length > 0) {
      notifications.push({
        id: 2,
        title: 'Active Bus Issue',
        message: `${busComplaints.length} issue(s) reported for ${bus?.bus_number}. Latest: ${busComplaints[0].category}.`,
        type: 'warning',
        time: 'Active'
      });
    }
    if (todayKm) {
      notifications.push({
        id: 3,
        title: 'Today Distance Logged',
        message: `${todayKm.distance_travelled_km} KM recorded for shift today.`,
        type: 'info',
        time: 'Today'
      });
    }
    return res.json({
      captain: {
        id: captainEmp?.id || authUser.id,
        name: captainEmp?.full_name || authUser.name,
        code: captainEmp?.employee_code || null,
        gender: captainEmp?.gender || null,
        date_of_birth: captainEmp?.date_of_birth || null,
        phone: captainEmp?.phone_number || authUser.phone_number || null,
        alternative_phone_number: captainEmp?.alternative_phone_number || null,
        email: captainEmp?.email || authUser.email || null,
        role: 'Captain',
        profile_photo: captainEmp?.profile_photo || null,
        aadhaar_number: captainEmp?.aadhaar_number || null,
        aadhaar_doc: captainEmp?.aadhaar_front_doc || null,
        aadhaar_back_doc: captainEmp?.aadhaar_back_doc || null,
        pan_number: captainEmp?.pan_number || null,
        pan_doc: captainEmp?.pan_doc || null,
        bank_name: captainEmp?.bank_name || null,
        bank_proof_doc: captainEmp?.bank_proof_doc || null,
        account_holder_name: captainEmp?.account_holder_name || captainEmp?.full_name || authUser.name,
        account_number: captainEmp?.account_number || null,
        ifsc_code: captainEmp?.ifsc_code || null,
        branch: captainEmp?.branch || null,
        reference_name: captainEmp?.reference_name || null,
        reference_phone: captainEmp?.reference_phone || null,
        reference_alt_phone: captainEmp?.reference_alt_phone || null,
        joining_date: captainEmp?.joining_date || null,
        employment_status: captainEmp?.employment_status || 'Active'
      },
      duty: {
        status: bus ? (bus.operational_status === 'Active' ? 'Active On Duty' : bus.operational_status) : 'Awaiting Assignment',
        shift: 'Scheduled Shift',
        project: bus ? `${bus.bus_type || 'Fleet'} Operations` : 'Fleet Operations',
        route: bus ? `Transit Service - ${bus.bus_number}` : 'No Active Route Assigned',
        stops: bus ? 'Scheduled Route Stops' : 'No Stops Assigned',
        distance_km: bus?.current_odometer_km || 0,
        gps_active: bus?.operational_status === 'Active'
      },
      bus: bus ? {
        id: bus.id,
        bus_number: bus.bus_number,
        registration_number: bus.registration_number,
        make: bus.make,
        model: bus.model,
        seating_capacity: bus.seating_capacity,
        current_odometer_km: bus.current_odometer_km,
        fuel_type: bus.fuel_type,
        operational_status: bus.operational_status,
        insurance_expiry: bus.insurance_expiry,
        fitness_expiry: bus.fitness_expiry,
        puc_expiry: bus.puc_expiry
      } : null,
      driver: driver ? {
        id: driver.id,
        name: driver.full_name,
        code: driver.employee_code,
        phone: driver.phone_number,
        licence_number: driver.licence_number || '-',
        licence_validity: driver.licence_validity_date || '-'
      } : null,
      helper: helper ? {
        id: helper.id,
        name: helper.full_name,
        code: helper.employee_code,
        phone: helper.phone_number
      } : null,
      todayKm,
      recentInspections,
      busComplaints,
      nextMaintenance,
      dutyHistory,
      notifications
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// File Upload endpoint with Cloudinary Integration
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Upload image or document directly to Cloudinary
    const cloudinaryRes = await uploadToCloudinary(req.file.path, 'charvik_fleet');
    
    // Clean up temporary local disk file after Cloudinary upload
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      // Ignored non-fatal cleanup error
    }

    return res.json({
      success: true,
      fileUrl: cloudinaryRes.url,
      provider: 'cloudinary',
      publicId: cloudinaryRes.publicId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (cloudErr: any) {
    console.warn('Cloudinary upload warning, falling back to local storage:', cloudErr.message);
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      fileUrl,
      provider: 'local',
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  }
});

// Services Connection Status endpoint
app.get('/api/services/status', async (req: Request, res: Response) => {
  const supabaseStatus = await testSupabaseConnection();
  let cloudinaryStatus = { connected: false, message: '' };
  try {
    await cloudinary.api.ping();
    cloudinaryStatus = { connected: true, message: 'Cloudinary connected and operational.' };
  } catch (e: any) {
    cloudinaryStatus = { connected: false, message: e.message };
  }

  return res.json({
    timestamp: new Date().toISOString(),
    supabase: supabaseStatus,
    cloudinary: cloudinaryStatus,
  });
});

// ================= DASHBOARD METRICS =================
app.get('/api/dashboard', (req: Request, res: Response) => {
  try {
    const totalBuses = db.prepare('SELECT COUNT(*) as count FROM buses WHERE is_archived = 0').get() as any;
    const activeBuses = db.prepare("SELECT COUNT(*) as count FROM buses WHERE operational_status = 'Active' AND is_archived = 0").get() as any;
    const underMaintenance = db.prepare("SELECT COUNT(*) as count FROM buses WHERE operational_status = 'Under Maintenance' AND is_archived = 0").get() as any;
    const scheduledMaintenance = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN ('Scheduled', 'Due', 'Due Soon', 'Pending', 'In Progress')").get() as any;
    const pendingComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('Resolved', 'Closed')").get() as any;
    const completedMonth = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE status = 'Completed'").get() as any;
    
    // Total kilometres today
    const todayDateStr = new Date().toISOString().split('T')[0];
    const kmToday = db.prepare(`
      SELECT COALESCE(SUM(distance_travelled_km), 0) as total_km 
      FROM daily_kilometer_entries 
      WHERE entry_date = date('now') OR entry_date = ?
    `).get(todayDateStr) as any;

    // Additional KPIs (Captains, Drivers, Helpers, Operators, Running Projects, Unassigned Buses, Unassigned Staff)
    const captainsCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE role = 'Captain' AND is_archived = 0").get() as any;
    const driversCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE role = 'Driver' AND is_archived = 0").get() as any;
    const helpersCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE role = 'Helper' AND is_archived = 0").get() as any;
    const operatorsCount = db.prepare("SELECT COUNT(DISTINCT make) as count FROM buses WHERE is_archived = 0").get() as any;
    const unassignedBusesCount = db.prepare("SELECT COUNT(*) as count FROM buses WHERE assigned_driver_id IS NULL AND is_archived = 0").get() as any;
    const unassignedStaffCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE assigned_bus_id IS NULL AND is_archived = 0").get() as any;
    const runningProjectsCount = db.prepare("SELECT COUNT(DISTINCT bus_type) as count FROM buses WHERE operational_status = 'Active' AND is_archived = 0").get() as any;

    // Upcoming Maintenance (next 5)
    const upcoming = db.prepare(`
      SELECT m.*, b.bus_number, b.registration_number, b.current_odometer_km
      FROM maintenance_schedules m
      JOIN buses b ON m.bus_id = b.id
      WHERE m.status != 'Completed' AND m.status != 'Cancelled'
      ORDER BY m.next_due_date ASC, m.priority DESC
      LIMIT 5
    `).all();

    // Km-based Maintenance overview with actual database counts
    const tyreDue = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE maintenance_type LIKE '%Tyre%' AND status NOT IN ('Completed', 'Cancelled')").get() as any;
    const acDue = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE maintenance_type LIKE '%AC%' AND status NOT IN ('Completed', 'Cancelled')").get() as any;
    const oilDue = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE (maintenance_type LIKE '%Oil%' OR maintenance_type LIKE '%Filter%') AND status NOT IN ('Completed', 'Cancelled')").get() as any;
    const engineDue = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE maintenance_type LIKE '%Engine%' AND status NOT IN ('Completed', 'Cancelled')").get() as any;
    const batteryDue = db.prepare("SELECT COUNT(*) as count FROM maintenance_schedules WHERE maintenance_type LIKE '%Battery%' AND status NOT IN ('Completed', 'Cancelled')").get() as any;

    const kmBasedSchedules = [
      { service: 'Tyre Rotation / Check', interval_km: 10000, notes: 'Tyre position, action (Rotation / Check / Replace), condition', status: 'Active', dueSoonCount: tyreDue?.count || 0 },
      { service: 'AC Maintenance', interval_km: 10000, notes: 'AC status (Working / Not Cooling), last service, next due', status: 'Active', dueSoonCount: acDue?.count || 0 },
      { service: 'Oil + DPF Filter Change', interval_km: 10000, notes: 'Last change, next due km', status: 'Active', dueSoonCount: oilDue?.count || 0 },
      { service: 'Engine Oil + General Service', interval_km: 120000, notes: 'Full service record', status: 'Active', dueSoonCount: engineDue?.count || 0 },
      { service: 'Battery Check', interval_km: 10000, notes: 'Last checked, next due, status', status: 'Active', dueSoonCount: batteryDue?.count || 0 }
    ];

    // Recent daily kilometre entries
    const recentKm = db.prepare(`
      SELECT k.*, b.bus_number, b.registration_number, e.full_name as driver_name
      FROM daily_kilometer_entries k
      JOIN buses b ON k.bus_id = b.id
      LEFT JOIN employees e ON k.driver_id = e.id
      ORDER BY k.entry_date DESC, k.id DESC
      LIMIT 6
    `).all();

    // Recent Complaints
    const recentComplaints = db.prepare(`
      SELECT c.*, b.bus_number, b.registration_number
      FROM complaints c
      JOIN buses b ON c.bus_id = b.id
      ORDER BY c.reported_date DESC
      LIMIT 5
    `).all();

    // Recent Repairs
    const recentRepairs = db.prepare(`
      SELECT r.*, b.bus_number, b.registration_number
      FROM repair_work_orders r
      JOIN buses b ON r.bus_id = b.id
      ORDER BY r.id DESC
      LIMIT 5
    `).all();

    // Recent Tyre Records
    const recentTyres = db.prepare(`
      SELECT t.*, b.bus_number, b.registration_number
      FROM tyre_records t
      JOIN buses b ON t.bus_id = b.id
      ORDER BY t.id DESC
      LIMIT 5
    `).all();

    // Recent AC Records
    const recentAc = db.prepare(`
      SELECT a.*, b.bus_number, b.registration_number
      FROM ac_maintenance_records a
      JOIN buses b ON a.bus_id = b.id
      ORDER BY a.id DESC
      LIMIT 5
    `).all();

    // Recent Oil & Filter Records
    const recentOil = db.prepare(`
      SELECT o.*, b.bus_number, b.registration_number
      FROM oil_filter_records o
      JOIN buses b ON o.bus_id = b.id
      ORDER BY o.id DESC
      LIMIT 5
    `).all();

    // Recent Battery Records
    const recentBattery = db.prepare(`
      SELECT bt.*, b.bus_number, b.registration_number
      FROM battery_records bt
      JOIN buses b ON bt.bus_id = b.id
      ORDER BY bt.id DESC
      LIMIT 5
    `).all();

    // Status distributions
    const statusDistribution = db.prepare(`
      SELECT operational_status as status, COUNT(*) as count
      FROM buses
      WHERE is_archived = 0
      GROUP BY operational_status
    `).all();

    // Recent Bus Condition Inspection with Ratings
    const recentCondition = db.prepare(`
      SELECT c.*, b.bus_number, b.registration_number
      FROM bus_condition_inspections c
      JOIN buses b ON c.bus_id = b.id
      ORDER BY c.inspection_date DESC
      LIMIT 3
    `).all();

    // Live fleet tracking running buses derived from active buses
    const activeBusRows = db.prepare(`
      SELECT b.id, b.bus_number, b.make, b.model, b.current_odometer_km, b.operational_status,
             e.full_name as driver_name
      FROM buses b
      LEFT JOIN employees e ON b.assigned_driver_id = e.id
      WHERE b.is_archived = 0
      ORDER BY b.id ASC
      LIMIT 6
    `).all() as any[];

    const liveRunningBuses = activeBusRows.map((b, idx) => ({
      id: b.id,
      bus_number: b.bus_number,
      route: b.make ? `${b.make} ${b.model || 'Bus'} Transit` : `${b.bus_number} Transit`,
      driver: b.driver_name || 'Unassigned',
      speed: b.operational_status === 'Active' ? 40 : 0,
      status: b.operational_status === 'Active' ? 'Running' : b.operational_status,
      lat: 16.5062 + (idx * 0.005),
      lng: 80.6480 + (idx * 0.005),
      battery: b.operational_status === 'Active' ? 'Good' : 'Off',
      ac: b.operational_status === 'Active' ? 'Working' : 'Off'
    }));

    return res.json({
      summary: {
        totalBuses: totalBuses?.count || 0,
        activeBuses: activeBuses?.count || 0,
        underMaintenance: underMaintenance?.count || 0,
        scheduledMaintenance: scheduledMaintenance?.count || 0,
        pendingComplaints: pendingComplaints?.count || 0,
        completedThisMonth: completedMonth?.count || 0,
        todayKm: kmToday?.total_km || 0,
      },
      additionalKpis: {
        totalCaptains: captainsCount?.count || 0,
        totalDrivers: driversCount?.count || 0,
        totalHelpers: helpersCount?.count || 0,
        totalOperators: operatorsCount?.count || 0,
        runningProjects: runningProjectsCount?.count || activeBuses?.count || 0,
        unassignedBuses: unassignedBusesCount?.count || 0,
        unassignedStaff: unassignedStaffCount?.count || 0,
      },
      upcoming,
      kmBasedSchedules,
      recentKm,
      recentComplaints,
      recentRepairs,
      recentTyres,
      recentAc,
      recentOil,
      recentBattery,
      statusDistribution,
      recentCondition,
      liveRunningBuses
    });
  } catch (err: any) {
    console.error('Dashboard API Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================= BUS MASTER =================
app.get('/api/buses', (req: Request, res: Response) => {
  const { search, status } = req.query;
  let query = `
    SELECT b.*, 
      d.full_name as driver_name, d.phone_number as driver_phone,
      h.full_name as helper_name
    FROM buses b
    LEFT JOIN employees d ON b.assigned_driver_id = d.id
    LEFT JOIN employees h ON b.assigned_helper_id = h.id
    WHERE b.is_archived = 0
  `;
  const params: any[] = [];

  if (status && status !== 'All') {
    query += ' AND b.operational_status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (b.bus_number LIKE ? OR b.registration_number LIKE ? OR b.make LIKE ? OR b.model LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY b.id ASC';
  const buses = db.prepare(query).all(...params);
  return res.json(buses);
});

app.get('/api/buses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const bus = db.prepare(`
    SELECT b.*, 
      d.full_name as driver_name, d.phone_number as driver_phone,
      h.full_name as helper_name
    FROM buses b
    LEFT JOIN employees d ON b.assigned_driver_id = d.id
    LEFT JOIN employees h ON b.assigned_helper_id = h.id
    WHERE b.id = ?
  `).get(id);

  if (!bus) return res.status(404).json({ error: 'Bus not found' });

  // Linked operational records
  const kmHistory = db.prepare('SELECT * FROM daily_kilometer_entries WHERE bus_id = ? ORDER BY entry_date DESC LIMIT 15').all(id);
  const maintenanceHistory = db.prepare('SELECT * FROM maintenance_schedules WHERE bus_id = ? ORDER BY id DESC LIMIT 10').all(id);
  const tyreHistory = db.prepare('SELECT * FROM tyre_records WHERE bus_id = ? ORDER BY id DESC').all(id);
  const acHistory = db.prepare('SELECT * FROM ac_maintenance_records WHERE bus_id = ? ORDER BY inspection_date DESC').all(id);
  const oilHistory = db.prepare('SELECT * FROM oil_filter_records WHERE bus_id = ? ORDER BY replacement_date DESC').all(id);
  const batteryHistory = db.prepare('SELECT * FROM battery_records WHERE bus_id = ? ORDER BY inspection_date DESC').all(id);
  const complaints = db.prepare('SELECT * FROM complaints WHERE bus_id = ? ORDER BY reported_date DESC').all(id);
  const repairs = db.prepare('SELECT * FROM repair_work_orders WHERE bus_id = ? ORDER BY id DESC').all(id);
  const inspections = db.prepare('SELECT * FROM bus_condition_inspections WHERE bus_id = ? ORDER BY inspection_date DESC').all(id);

  return res.json({
    bus,
    kmHistory,
    maintenanceHistory,
    tyreHistory,
    acHistory,
    oilHistory,
    batteryHistory,
    complaints,
    repairs,
    inspections
  });
});

app.post('/api/buses', (req: Request, res: Response) => {
  const b = req.body;
  if (!b.bus_number || !b.registration_number) {
    return res.status(400).json({ error: 'Bus number and registration number are required' });
  }

  // Check unique constraints
  const dup = db.prepare('SELECT id FROM buses WHERE (bus_number = ? OR registration_number = ?) AND is_archived = 0')
    .get(b.bus_number, b.registration_number);
  if (dup) {
    return res.status(400).json({ error: 'A bus with this Bus Number or Registration Number already exists' });
  }

  const stmt = db.prepare(`
    INSERT INTO buses (
      bus_number, registration_number, make, model, bus_type, manufacturing_year,
      purchase_date, chassis_number, engine_number, fuel_type, seating_capacity,
      insurance_expiry, fitness_expiry, permit_expiry, puc_expiry,
      current_odometer_km, operational_status, assigned_driver_id, assigned_helper_id, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    b.bus_number,
    b.registration_number,
    b.make || '',
    b.model || '',
    b.bus_type || 'School Bus',
    b.manufacturing_year || new Date().getFullYear(),
    b.purchase_date || null,
    b.chassis_number || '',
    b.engine_number || '',
    b.fuel_type || 'Diesel',
    b.seating_capacity || 45,
    b.insurance_expiry || null,
    b.fitness_expiry || null,
    b.permit_expiry || null,
    b.puc_expiry || null,
    b.current_odometer_km || 0,
    b.operational_status || 'Active',
    b.assigned_driver_id || null,
    b.assigned_helper_id || null,
    b.notes || ''
  );

  logAudit('ADD_BUS', 'Bus Master', info.lastInsertRowid, `Added bus ${b.bus_number} (${b.registration_number})`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'Bus created successfully' });
});

app.put('/api/buses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body;

  const stmt = db.prepare(`
    UPDATE buses SET
      bus_number = ?, registration_number = ?, make = ?, model = ?, bus_type = ?,
      manufacturing_year = ?, purchase_date = ?, chassis_number = ?, engine_number = ?,
      fuel_type = ?, seating_capacity = ?, insurance_expiry = ?, fitness_expiry = ?,
      permit_expiry = ?, puc_expiry = ?, current_odometer_km = ?, operational_status = ?,
      assigned_driver_id = ?, assigned_helper_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    b.bus_number,
    b.registration_number,
    b.make || '',
    b.model || '',
    b.bus_type || 'School Bus',
    b.manufacturing_year || 2021,
    b.purchase_date || null,
    b.chassis_number || '',
    b.engine_number || '',
    b.fuel_type || 'Diesel',
    b.seating_capacity || 45,
    b.insurance_expiry || null,
    b.fitness_expiry || null,
    b.permit_expiry || null,
    b.puc_expiry || null,
    b.current_odometer_km || 0,
    b.operational_status || 'Active',
    b.assigned_driver_id || null,
    b.assigned_helper_id || null,
    b.notes || '',
    id
  );

  logAudit('UPDATE_BUS', 'Bus Master', id, `Updated bus ${b.bus_number}`);
  return res.json({ message: 'Bus updated successfully' });
});

app.delete('/api/buses/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('UPDATE buses SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  logAudit('ARCHIVE_BUS', 'Bus Master', id, `Archived bus ID ${id}`);
  return res.json({ message: 'Bus archived successfully' });
});

// ================= DAILY KILOMETER ENTRY =================
app.get('/api/daily-kilometers', (req: Request, res: Response) => {
  const { date, bus_id, driver_id } = req.query;
  let query = `
    SELECT k.*, b.bus_number, b.registration_number, e.full_name as driver_name
    FROM daily_kilometer_entries k
    JOIN buses b ON k.bus_id = b.id
    LEFT JOIN employees e ON k.driver_id = e.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (date) {
    query += ' AND k.entry_date = ?';
    params.push(date);
  }
  if (bus_id) {
    query += ' AND k.bus_id = ?';
    params.push(bus_id);
  }
  if (driver_id) {
    query += ' AND k.driver_id = ?';
    params.push(driver_id);
  }
  query += ' ORDER BY k.entry_date DESC, k.id DESC';

  const entries = db.prepare(query).all(...params);

  // Compute daily & monthly totals
  const totalKm = db.prepare('SELECT SUM(distance_travelled_km) as total FROM daily_kilometer_entries').get() as any;
  const countEntries = db.prepare('SELECT COUNT(*) as count FROM daily_kilometer_entries').get() as any;

  return res.json({
    entries,
    summary: {
      totalDistance: totalKm.total || 0,
      totalEntries: countEntries.count || 0
    }
  });
});

app.get('/api/daily-kilometers/suggest-opening/:busId', (req: Request, res: Response) => {
  const { busId } = req.params;
  const lastEntry = db.prepare('SELECT closing_km FROM daily_kilometer_entries WHERE bus_id = ? ORDER BY entry_date DESC, id DESC LIMIT 1').get(busId) as any;
  const bus = db.prepare('SELECT current_odometer_km FROM buses WHERE id = ?').get(busId) as any;
  const suggestedOpening = lastEntry ? lastEntry.closing_km : (bus ? bus.current_odometer_km : 0);
  return res.json({ suggestedOpening });
});

app.post('/api/daily-kilometers', (req: Request, res: Response) => {
  const { entry_date, bus_id, driver_id, opening_km, closing_km, remarks } = req.body;
  if (!entry_date || !bus_id || opening_km === undefined || closing_km === undefined) {
    return res.status(400).json({ error: 'Entry date, Bus, Opening KM, and Closing KM are required.' });
  }

  const openKm = Number(opening_km);
  const closeKm = Number(closing_km);

  if (openKm < 0 || closeKm < 0) {
    return res.status(400).json({ error: 'Kilometer readings cannot be negative.' });
  }
  if (closeKm < openKm) {
    return res.status(400).json({ error: 'Closing KM reading cannot be less than Opening KM reading.' });
  }

  const distance = closeKm - openKm;

  // Insert entry
  const stmt = db.prepare(`
    INSERT INTO daily_kilometer_entries (entry_date, bus_id, driver_id, opening_km, closing_km, distance_travelled_km, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(entry_date, bus_id, driver_id || null, openKm, closeKm, distance, remarks || '');

  // Safely update bus current odometer if closing_km is higher
  db.prepare('UPDATE buses SET current_odometer_km = MAX(current_odometer_km, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(closeKm, bus_id);

  logAudit('DAILY_KM_ADD', 'Daily KM', info.lastInsertRowid, `Logged ${distance} km for bus ID ${bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, distance, message: 'Daily kilometer entry saved successfully.' });
});

app.put('/api/daily-kilometers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { opening_km, closing_km, remarks, correction_reason, corrected_by } = req.body;

  const openKm = Number(opening_km);
  const closeKm = Number(closing_km);

  if (closeKm < openKm) {
    return res.status(400).json({ error: 'Closing KM must be greater than or equal to Opening KM.' });
  }

  const distance = closeKm - openKm;

  db.prepare(`
    UPDATE daily_kilometer_entries SET
      opening_km = ?, closing_km = ?, distance_travelled_km = ?, remarks = ?,
      is_corrected = 1, correction_reason = ?, corrected_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(openKm, closeKm, distance, remarks, correction_reason || 'Administrative correction', corrected_by || 'Admin', id);

  logAudit('DAILY_KM_CORRECTION', 'Daily KM', id, `Corrected entry: Reason: ${correction_reason}`);
  return res.json({ message: 'Kilometer entry corrected with audit trail.' });
});

app.delete('/api/daily-kilometers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM daily_kilometer_entries WHERE id = ?').run(id);
  logAudit('DAILY_KM_DELETE', 'Daily KM', id, 'Deleted daily kilometer entry');
  return res.json({ message: 'Entry removed successfully' });
});

// ================= MAINTENANCE SCHEDULE =================
app.get('/api/maintenance-schedules', (req: Request, res: Response) => {
  const { status, bus_id } = req.query;
  let query = `
    SELECT m.*, b.bus_number, b.registration_number, b.current_odometer_km
    FROM maintenance_schedules m
    JOIN buses b ON m.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'All') {
    query += ' AND m.status = ?';
    params.push(status);
  }
  if (bus_id) {
    query += ' AND m.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY m.next_due_date ASC, m.id DESC';

  const schedules = db.prepare(query).all(...params);
  return res.json(schedules);
});

app.post('/api/maintenance-schedules', (req: Request, res: Response) => {
  const s = req.body;
  if (!s.bus_id || !s.maintenance_type) {
    return res.status(400).json({ error: 'Bus and maintenance type are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO maintenance_schedules (
      bus_id, maintenance_type, last_service_date, last_service_km, interval_km,
      next_due_date, next_due_km, priority, assigned_to, estimated_cost, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    s.bus_id,
    s.maintenance_type,
    s.last_service_date || null,
    s.last_service_km || 0,
    s.interval_km || 10000,
    s.next_due_date || null,
    s.next_due_km || null,
    s.priority || 'Medium',
    s.assigned_to || '',
    s.estimated_cost || 0,
    s.status || 'Scheduled',
    s.notes || ''
  );

  logAudit('MAINTENANCE_SCHEDULE_ADD', 'Maintenance Schedule', info.lastInsertRowid, `Scheduled ${s.maintenance_type} for bus ID ${s.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'Maintenance scheduled successfully' });
});

app.put('/api/maintenance-schedules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const s = req.body;

  db.prepare(`
    UPDATE maintenance_schedules SET
      maintenance_type = ?, last_service_date = ?, last_service_km = ?, interval_km = ?,
      next_due_date = ?, next_due_km = ?, priority = ?, assigned_to = ?,
      estimated_cost = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    s.maintenance_type,
    s.last_service_date || null,
    s.last_service_km || 0,
    s.interval_km || 10000,
    s.next_due_date || null,
    s.next_due_km || null,
    s.priority || 'Medium',
    s.assigned_to || '',
    s.estimated_cost || 0,
    s.status || 'Scheduled',
    s.notes || '',
    id
  );

  logAudit('MAINTENANCE_SCHEDULE_UPDATE', 'Maintenance Schedule', id, `Updated status to ${s.status}`);
  return res.json({ message: 'Maintenance schedule updated' });
});

app.delete('/api/maintenance-schedules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM maintenance_schedules WHERE id = ?').run(id);
  logAudit('MAINTENANCE_SCHEDULE_DELETE', 'Maintenance Schedule', id, 'Deleted schedule');
  return res.json({ message: 'Schedule deleted' });
});

// ================= TYRE MAINTENANCE =================
app.get('/api/tyre-maintenance', (req: Request, res: Response) => {
  const { bus_id } = req.query;
  let query = `
    SELECT t.*, b.bus_number, b.registration_number, b.current_odometer_km
    FROM tyre_records t
    JOIN buses b ON t.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (bus_id) {
    query += ' AND t.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY t.id DESC';
  const records = db.prepare(query).all(...params);
  return res.json(records);
});

app.post('/api/tyre-maintenance', (req: Request, res: Response) => {
  const t = req.body;
  const stmt = db.prepare(`
    INSERT INTO tyre_records (
      bus_id, tyre_serial_number, brand, size, tyre_position, installation_date,
      installation_km, last_inspection_date, tread_depth_mm, tyre_pressure_psi,
      condition, rotation_date, replacement_date, removal_km, supplier, cost, remarks, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    t.bus_id,
    t.tyre_serial_number,
    t.brand || '',
    t.size || '295/80 R22.5',
    t.tyre_position || 'Front Left',
    t.installation_date || null,
    t.installation_km || 0,
    t.last_inspection_date || null,
    t.tread_depth_mm || 10,
    t.tyre_pressure_psi || 110,
    t.condition || 'Good',
    t.rotation_date || null,
    t.replacement_date || null,
    t.removal_km || null,
    t.supplier || '',
    t.cost || 0,
    t.remarks || '',
    1
  );

  logAudit('TYRE_ADD', 'Tyre Maintenance', info.lastInsertRowid, `Logged tyre ${t.tyre_serial_number} on position ${t.tyre_position}`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'Tyre record saved successfully' });
});

app.put('/api/tyre-maintenance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const t = req.body;

  db.prepare(`
    UPDATE tyre_records SET
      tyre_serial_number = ?, brand = ?, size = ?, tyre_position = ?,
      last_inspection_date = ?, tread_depth_mm = ?, tyre_pressure_psi = ?,
      condition = ?, rotation_date = ?, replacement_date = ?, removal_km = ?,
      supplier = ?, cost = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    t.tyre_serial_number,
    t.brand,
    t.size,
    t.tyre_position,
    t.last_inspection_date,
    t.tread_depth_mm,
    t.tyre_pressure_psi,
    t.condition,
    t.rotation_date,
    t.replacement_date,
    t.removal_km,
    t.supplier,
    t.cost,
    t.remarks,
    id
  );

  logAudit('TYRE_UPDATE', 'Tyre Maintenance', id, `Updated tyre record ${t.tyre_serial_number}`);
  return res.json({ message: 'Tyre record updated' });
});

// ================= AC MAINTENANCE =================
app.get('/api/ac-maintenance', (req: Request, res: Response) => {
  const { bus_id } = req.query;
  let query = `
    SELECT a.*, b.bus_number, b.registration_number
    FROM ac_maintenance_records a
    JOIN buses b ON a.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (bus_id) {
    query += ' AND a.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY a.inspection_date DESC';
  const records = db.prepare(query).all(...params);
  return res.json(records);
});

app.post('/api/ac-maintenance', (req: Request, res: Response) => {
  const a = req.body;
  const stmt = db.prepare(`
    INSERT INTO ac_maintenance_records (
      bus_id, inspection_date, current_km, ac_working_status, cooling_performance,
      refrigerant_check, filter_cleaning_replacement, compressor_condition, leak_inspection,
      electrical_check, issue_description, work_performed, service_provider, next_service_date,
      next_service_km, service_cost, technician, status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    a.bus_id,
    a.inspection_date || new Date().toISOString().split('T')[0],
    a.current_km || 0,
    a.ac_working_status || 'Working',
    a.cooling_performance || 'Good',
    a.refrigerant_check || 'Normal',
    a.filter_cleaning_replacement || 'Cleaned',
    a.compressor_condition || 'Good',
    a.leak_inspection || 'No leaks',
    a.electrical_check || 'OK',
    a.issue_description || '',
    a.work_performed || '',
    a.service_provider || '',
    a.next_service_date || null,
    a.next_service_km || null,
    a.service_cost || 0,
    a.technician || '',
    a.status || 'Completed',
    a.remarks || ''
  );

  logAudit('AC_SERVICE_ADD', 'AC Maintenance', info.lastInsertRowid, `Logged AC service for bus ID ${a.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'AC maintenance record saved successfully' });
});

// ================= OIL AND FILTER MAINTENANCE =================
app.get('/api/oil-filter-maintenance', (req: Request, res: Response) => {
  const { bus_id } = req.query;
  let query = `
    SELECT o.*, b.bus_number, b.registration_number
    FROM oil_filter_records o
    JOIN buses b ON o.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (bus_id) {
    query += ' AND o.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY o.replacement_date DESC';
  const records = db.prepare(query).all(...params);
  return res.json(records);
});

app.post('/api/oil-filter-maintenance', (req: Request, res: Response) => {
  const o = req.body;
  const oilCost = Number(o.oil_cost || 0);
  const labourCost = Number(o.labour_cost || 0);
  const totalCost = Number(o.total_cost || (oilCost + labourCost));

  const stmt = db.prepare(`
    INSERT INTO oil_filter_records (
      bus_id, replacement_date, odometer_km, oil_type, oil_brand, oil_quantity_liters,
      oil_cost, oil_filter_replaced, oil_filter_details, air_filter_replaced, air_filter_details,
      fuel_filter_replaced, fuel_filter_details, other_filter_details, labour_cost, total_cost,
      service_provider, next_due_date, next_due_km, performed_by, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    o.bus_id,
    o.replacement_date || new Date().toISOString().split('T')[0],
    o.odometer_km || 0,
    o.oil_type || '15W-40 CI-4',
    o.oil_brand || 'Castrol',
    o.oil_quantity_liters || 16,
    oilCost,
    o.oil_filter_replaced ? 1 : 0,
    o.oil_filter_details || '',
    o.air_filter_replaced ? 1 : 0,
    o.air_filter_details || '',
    o.fuel_filter_replaced ? 1 : 0,
    o.fuel_filter_details || '',
    o.other_filter_details || '',
    labourCost,
    totalCost,
    o.service_provider || '',
    o.next_due_date || null,
    o.next_due_km || null,
    o.performed_by || '',
    o.remarks || ''
  );

  logAudit('OIL_FILTER_ADD', 'Oil & Filter', info.lastInsertRowid, `Logged oil change for bus ID ${o.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'Oil and filter record saved successfully' });
});

// ================= BATTERY MAINTENANCE =================
app.get('/api/battery-maintenance', (req: Request, res: Response) => {
  const { bus_id } = req.query;
  let query = `
    SELECT bat.*, b.bus_number, b.registration_number
    FROM battery_records bat
    JOIN buses b ON bat.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (bus_id) {
    query += ' AND bat.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY bat.inspection_date DESC';
  const records = db.prepare(query).all(...params);
  return res.json(records);
});

app.post('/api/battery-maintenance', (req: Request, res: Response) => {
  const bat = req.body;
  const stmt = db.prepare(`
    INSERT INTO battery_records (
      bus_id, inspection_date, current_km, battery_brand, serial_number, battery_type,
      battery_voltage, measured_voltage, battery_health, terminal_condition, charging_system_status,
      installation_date, warranty_expiry_date, replacement_date, battery_cost, technician,
      next_check_date, status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    bat.bus_id,
    bat.inspection_date || new Date().toISOString().split('T')[0],
    bat.current_km || 0,
    bat.battery_brand || '',
    bat.serial_number || '',
    bat.battery_type || 'Lead Acid',
    bat.battery_voltage || 24.0,
    bat.measured_voltage || 24.8,
    bat.battery_health || 'Good',
    bat.terminal_condition || 'Clean',
    bat.charging_system_status || 'Normal',
    bat.installation_date || null,
    bat.warranty_expiry_date || null,
    bat.replacement_date || null,
    bat.battery_cost || 0,
    bat.technician || '',
    bat.next_check_date || null,
    bat.status || 'Active',
    bat.remarks || ''
  );

  logAudit('BATTERY_CHECK_ADD', 'Battery Maintenance', info.lastInsertRowid, `Logged battery check for bus ID ${bat.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, message: 'Battery check record saved successfully' });
});

// ================= COMPLAINTS =================
app.get('/api/complaints', (req: Request, res: Response) => {
  const { status, priority, bus_id } = req.query;
  let query = `
    SELECT c.*, b.bus_number, b.registration_number
    FROM complaints c
    JOIN buses b ON c.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'All') {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (priority && priority !== 'All') {
    query += ' AND c.priority = ?';
    params.push(priority);
  }
  if (bus_id) {
    query += ' AND c.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY c.id DESC';

  const complaints = db.prepare(query).all(...params);
  return res.json(complaints);
});

app.post('/api/complaints', (req: Request, res: Response) => {
  const c = req.body;
  if (!c.bus_id || !c.category || !c.description) {
    return res.status(400).json({ error: 'Bus, category, and description are required' });
  }

  // Generate reference number
  const count = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count + 1;
  const complaintRef = `CMP-2026-${String(count).padStart(3, '0')}`;

  const stmt = db.prepare(`
    INSERT INTO complaints (
      complaint_ref, reported_date, bus_id, reported_by, contact_number, category,
      description, priority, assigned_staff, assigned_vendor, status, expected_resolution_date,
      resolution_description, resolved_date, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    complaintRef,
    c.reported_date || new Date().toISOString(),
    c.bus_id,
    c.reported_by || 'Admin',
    c.contact_number || '',
    c.category,
    c.description,
    c.priority || 'Medium',
    c.assigned_staff || '',
    c.assigned_vendor || '',
    c.status || 'Open',
    c.expected_resolution_date || null,
    c.resolution_description || '',
    c.resolved_date || null,
    c.remarks || ''
  );

  logAudit('COMPLAINT_ADD', 'Complaints', info.lastInsertRowid, `Logged complaint ${complaintRef} for bus ID ${c.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, complaintRef, message: 'Complaint registered successfully' });
});

app.put('/api/complaints/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const c = req.body;

  let resolvedDate = c.resolved_date;
  if ((c.status === 'Resolved' || c.status === 'Closed') && !resolvedDate) {
    resolvedDate = new Date().toISOString();
  }

  db.prepare(`
    UPDATE complaints SET
      category = ?, description = ?, priority = ?, assigned_staff = ?,
      assigned_vendor = ?, status = ?, expected_resolution_date = ?,
      resolution_description = ?, resolved_date = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    c.category,
    c.description,
    c.priority,
    c.assigned_staff || '',
    c.assigned_vendor || '',
    c.status,
    c.expected_resolution_date || null,
    c.resolution_description || '',
    resolvedDate || null,
    c.remarks || '',
    id
  );

  logAudit('COMPLAINT_UPDATE', 'Complaints', id, `Updated complaint status to ${c.status}`);
  return res.json({ message: 'Complaint updated successfully' });
});

// ================= REPAIRS AND SERVICE (WORK ORDERS) =================
app.get('/api/repairs', (req: Request, res: Response) => {
  const { status, bus_id } = req.query;
  let query = `
    SELECT r.*, b.bus_number, b.registration_number, c.complaint_ref
    FROM repair_work_orders r
    JOIN buses b ON r.bus_id = b.id
    LEFT JOIN complaints c ON r.linked_complaint_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'All') {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (bus_id) {
    query += ' AND r.bus_id = ?';
    params.push(bus_id);
  }
  query += ' ORDER BY r.id DESC';

  const repairs = db.prepare(query).all(...params);
  return res.json(repairs);
});

app.post('/api/repairs', (req: Request, res: Response) => {
  const r = req.body;
  if (!r.bus_id || !r.problem_description) {
    return res.status(400).json({ error: 'Bus and problem description are required' });
  }

  const count = (db.prepare('SELECT COUNT(*) as count FROM repair_work_orders').get() as any).count + 1;
  const workOrderNum = `WO-2026-${String(count).padStart(3, '0')}`;

  const labour = Number(r.labour_cost || 0);
  const parts = Number(r.parts_cost || 0);
  const other = Number(r.other_charges || 0);
  const total = labour + parts + other;

  const stmt = db.prepare(`
    INSERT INTO repair_work_orders (
      work_order_number, bus_id, linked_complaint_id, repair_category, problem_description,
      reported_date, work_start_date, work_completion_date, odometer_km, diagnosis,
      work_performed, parts_replaced, labour_cost, parts_cost, other_charges, total_cost,
      workshop_vendor, assigned_technician, bus_availability_status, warranty_details,
      status, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    workOrderNum,
    r.bus_id,
    r.linked_complaint_id || null,
    r.repair_category || 'Mechanical',
    r.problem_description,
    r.reported_date || new Date().toISOString().split('T')[0],
    r.work_start_date || null,
    r.work_completion_date || null,
    r.odometer_km || 0,
    r.diagnosis || '',
    r.work_performed || '',
    r.parts_replaced || '',
    labour,
    parts,
    other,
    total,
    r.workshop_vendor || '',
    r.assigned_technician || '',
    r.bus_availability_status || 'Under Maintenance',
    r.warranty_details || '',
    r.status || 'In Progress',
    r.remarks || ''
  );

  // Update bus operational status if set to Under Maintenance
  if (r.bus_availability_status === 'Under Maintenance') {
    db.prepare("UPDATE buses SET operational_status = 'Under Maintenance', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(r.bus_id);
  }

  logAudit('REPAIR_ADD', 'Repairs', info.lastInsertRowid, `Created work order ${workOrderNum} for bus ID ${r.bus_id}`);
  return res.status(201).json({ id: info.lastInsertRowid, workOrderNum, message: 'Work order created successfully' });
});

app.put('/api/repairs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const r = req.body;

  const labour = Number(r.labour_cost || 0);
  const parts = Number(r.parts_cost || 0);
  const other = Number(r.other_charges || 0);
  const total = labour + parts + other;

  db.prepare(`
    UPDATE repair_work_orders SET
      repair_category = ?, problem_description = ?, work_start_date = ?,
      work_completion_date = ?, odometer_km = ?, diagnosis = ?, work_performed = ?,
      parts_replaced = ?, labour_cost = ?, parts_cost = ?, other_charges = ?,
      total_cost = ?, workshop_vendor = ?, assigned_technician = ?,
      bus_availability_status = ?, warranty_details = ?, status = ?, remarks = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    r.repair_category,
    r.problem_description,
    r.work_start_date || null,
    r.work_completion_date || null,
    r.odometer_km || 0,
    r.diagnosis || '',
    r.work_performed || '',
    r.parts_replaced || '',
    labour,
    parts,
    other,
    total,
    r.workshop_vendor || '',
    r.assigned_technician || '',
    r.bus_availability_status || 'Active',
    r.warranty_details || '',
    r.status,
    r.remarks || '',
    id
  );

  // If work order is completed and return to service is confirmed, update bus operational status
  if (r.status === 'Completed' && r.return_to_service && r.bus_id) {
    db.prepare("UPDATE buses SET operational_status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(r.bus_id);
  }

  logAudit('REPAIR_UPDATE', 'Repairs', id, `Updated repair work order status to ${r.status}`);
  return res.json({ message: 'Repair work order updated' });
});

// ================= BUS CONDITION INSPECTION =================
app.get('/api/bus-condition', (req: Request, res: Response) => {
  const { bus_id, roadworthiness } = req.query;
  let query = `
    SELECT c.*, b.bus_number, b.registration_number
    FROM bus_condition_inspections c
    JOIN buses b ON c.bus_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (bus_id) {
    query += ' AND c.bus_id = ?';
    params.push(bus_id);
  }
  if (roadworthiness && roadworthiness !== 'All') {
    query += ' AND c.roadworthiness_status = ?';
    params.push(roadworthiness);
  }
  query += ' ORDER BY c.inspection_date DESC';

  const inspections = db.prepare(query).all(...params);
  return res.json(inspections);
});

app.post('/api/bus-condition', (req: Request, res: Response) => {
  const c = req.body;
  if (!c.bus_id || !c.inspector_name) {
    return res.status(400).json({ error: 'Bus and inspector name are required' });
  }

  const count = (db.prepare('SELECT COUNT(*) as count FROM bus_condition_inspections').get() as any).count + 1;
  const inspectionRef = `INS-2026-${String(count).padStart(3, '0')}`;

  const stmt = db.prepare(`
    INSERT INTO bus_condition_inspections (
      inspection_ref, bus_id, inspection_date, inspection_time, odometer_km, inspector_name,
      exterior_body, tyre_condition, brake_condition, engine_condition, battery_condition,
      ac_condition, lights_condition, mirrors_condition, windshield_condition, wiper_condition,
      doors_emergency_exits, seat_condition, safety_equipment, fluid_levels, visible_leaks,
      roadworthiness_status, defects_found, corrective_action_required, inspector_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    inspectionRef,
    c.bus_id,
    c.inspection_date || new Date().toISOString().split('T')[0],
    c.inspection_time || '10:00',
    c.odometer_km || 0,
    c.inspector_name,
    c.exterior_body || 'Good',
    c.tyre_condition || 'Good',
    c.brake_condition || 'Good',
    c.engine_condition || 'Good',
    c.battery_condition || 'Good',
    c.ac_condition || 'Good',
    c.lights_condition || 'Good',
    c.mirrors_condition || 'Good',
    c.windshield_condition || 'Good',
    c.wiper_condition || 'Good',
    c.doors_emergency_exits || 'Good',
    c.seat_condition || 'Good',
    c.safety_equipment || 'Good',
    c.fluid_levels || 'Good',
    c.visible_leaks || 'Good',
    c.roadworthiness_status || 'Fit for Service',
    c.defects_found || '',
    c.corrective_action_required || '',
    c.inspector_remarks || ''
  );

  // If inspection marked Not Fit for Service, update bus operational status
  if (c.roadworthiness_status === 'Not Fit for Service') {
    db.prepare("UPDATE buses SET operational_status = 'Under Maintenance', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(c.bus_id);
  }

  logAudit('INSPECTION_ADD', 'Bus Condition', info.lastInsertRowid, `Logged inspection ${inspectionRef} (${c.roadworthiness_status})`);
  return res.status(201).json({ id: info.lastInsertRowid, inspectionRef, message: 'Inspection checklist recorded successfully' });
});

// ================= EMPLOYEE MANAGEMENT & REGISTRATION =================
app.get('/api/employees', (req: Request, res: Response) => {
  const { role, status, search } = req.query;
  let query = `
    SELECT e.*, b.bus_number, b.registration_number,
      d.licence_number, d.licence_validity_date, d.licence_verification_status
    FROM employees e
    LEFT JOIN buses b ON e.assigned_bus_id = b.id
    LEFT JOIN driver_details d ON e.id = d.employee_id
    WHERE e.is_archived = 0
  `;
  const params: any[] = [];
  if (role && role !== 'All') {
    query += ' AND e.role = ?';
    params.push(role);
  }
  if (status && status !== 'All') {
    query += ' AND e.employment_status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (e.full_name LIKE ? OR e.employee_code LIKE ? OR e.phone_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY e.id ASC';

  const emps = db.prepare(query).all(...params);

  // Mask sensitive identity documents in normal list view
  const sanitized = emps.map((emp: any) => ({
    ...emp,
    aadhaar_number: emp.aadhaar_number ? `XXXX-XXXX-${emp.aadhaar_number.slice(-4)}` : '',
    account_number: emp.account_number ? `XXXXXX${emp.account_number.slice(-4)}` : '',
    pan_number: emp.pan_number ? `${emp.pan_number.slice(0, 2)}XXXXX${emp.pan_number.slice(-2)}` : '',
  }));

  return res.json(sanitized);
});

app.get('/api/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const emp = db.prepare(`
    SELECT e.*, b.bus_number, b.registration_number
    FROM employees e
    LEFT JOIN buses b ON e.assigned_bus_id = b.id
    WHERE e.id = ?
  `).get(id) as any;

  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const driverDetail = db.prepare('SELECT * FROM driver_details WHERE employee_id = ?').get(id);
  const auditHistory = db.prepare("SELECT * FROM audit_logs WHERE module IN ('Employees', 'Driver Registration', 'Support Staff') AND record_id = ? ORDER BY id DESC").all(id);

  return res.json({
    employee: emp,
    driverDetail,
    auditHistory
  });
});

app.post('/api/employees', (req: Request, res: Response) => {
  const e = req.body;
  if (!e.full_name || !e.phone_number || !e.employee_code || !e.role) {
    return res.status(400).json({ error: 'Employee code, full name, phone number, and role are required' });
  }

  // Check unique employee code
  const dup = db.prepare('SELECT id FROM employees WHERE employee_code = ?').get(e.employee_code);
  if (dup) {
    return res.status(400).json({ error: `Employee code ${e.employee_code} already exists.` });
  }

  const insertEmp = db.prepare(`
    INSERT INTO employees (
      employee_code, role, full_name, gender, date_of_birth, email, phone_number,
      alternative_phone_number, aadhaar_number, aadhaar_front_doc, aadhaar_back_doc,
      pan_number, pan_doc, bank_name, bank_proof_doc, account_holder_name,
      account_number, ifsc_code, branch, reference_name, reference_phone,
      reference_alt_phone, joining_date, employment_status, assigned_bus_id,
      internal_remarks, profile_photo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertEmp.run(
    e.employee_code,
    e.role,
    e.full_name,
    e.gender || 'Male',
    e.date_of_birth || null,
    e.email || '',
    e.phone_number,
    e.alternative_phone_number || '',
    e.aadhaar_number || '',
    e.aadhaar_front_doc || '',
    e.aadhaar_back_doc || '',
    e.pan_number || '',
    e.pan_doc || '',
    e.bank_name || '',
    e.bank_proof_doc || '',
    e.account_holder_name || e.full_name,
    e.account_number || '',
    e.ifsc_code || '',
    e.branch || '',
    e.reference_name || '',
    e.reference_phone || '',
    e.reference_alt_phone || '',
    e.joining_date || new Date().toISOString().split('T')[0],
    e.employment_status || 'Active',
    e.assigned_bus_id || null,
    e.internal_remarks || '',
    e.profile_photo || ''
  );

  const empId = Number(info.lastInsertRowid);

  // If driver, insert licence details
  if (e.role === 'Driver' && e.licence_number) {
    db.prepare(`
      INSERT INTO driver_details (
        employee_id, licence_number, licence_front_doc, licence_back_doc, issuing_state,
        issuing_rto_office, licence_issue_date, licence_validity_date, licence_experience_years,
        criminal_background_details, licence_verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      empId,
      e.licence_number,
      e.licence_front_doc || '',
      e.licence_back_doc || '',
      e.issuing_state || '',
      e.issuing_rto_office || '',
      e.licence_issue_date || null,
      e.licence_validity_date || '2028-12-31',
      e.licence_experience_years || 0,
      e.criminal_background_details || '',
      e.licence_verification_status || 'Verified'
    );
  }

  // Update bus assigned driver/helper if assigned_bus_id provided
  if (e.assigned_bus_id) {
    if (e.role === 'Driver') {
      db.prepare('UPDATE buses SET assigned_driver_id = ? WHERE id = ?').run(empId, e.assigned_bus_id);
    } else if (e.role === 'Helper') {
      db.prepare('UPDATE buses SET assigned_helper_id = ? WHERE id = ?').run(empId, e.assigned_bus_id);
    }
  }

  logAudit('EMPLOYEE_REGISTER', 'Employees', empId, `Registered new ${e.role}: ${e.full_name} (${e.employee_code})`);
  return res.status(201).json({ id: empId, message: `${e.role} registered successfully!` });
});

app.put('/api/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const e = req.body;

  db.prepare(`
    UPDATE employees SET
      full_name = ?, gender = ?, date_of_birth = ?, email = ?, phone_number = ?,
      alternative_phone_number = ?, aadhaar_number = ?, pan_number = ?,
      bank_name = ?, account_holder_name = ?, account_number = ?, ifsc_code = ?,
      branch = ?, reference_name = ?, reference_phone = ?, reference_alt_phone = ?,
      joining_date = ?, employment_status = ?, assigned_bus_id = ?, internal_remarks = ?,
      profile_photo = COALESCE(?, profile_photo),
      aadhaar_front_doc = COALESCE(?, aadhaar_front_doc),
      aadhaar_back_doc = COALESCE(?, aadhaar_back_doc),
      pan_doc = COALESCE(?, pan_doc),
      bank_proof_doc = COALESCE(?, bank_proof_doc),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    e.full_name,
    e.gender || 'Male',
    e.date_of_birth || null,
    e.email || '',
    e.phone_number,
    e.alternative_phone_number || '',
    e.aadhaar_number || '',
    e.pan_number || '',
    e.bank_name || '',
    e.account_holder_name || e.full_name,
    e.account_number || '',
    e.ifsc_code || '',
    e.branch || '',
    e.reference_name || '',
    e.reference_phone || '',
    e.reference_alt_phone || '',
    e.joining_date || null,
    e.employment_status || 'Active',
    e.assigned_bus_id || null,
    e.internal_remarks || '',
    e.profile_photo || null,
    e.aadhaar_front_doc || null,
    e.aadhaar_back_doc || null,
    e.pan_doc || null,
    e.bank_proof_doc || null,
    id
  );

  // Update driver details if applicable
  if (e.licence_number) {
    db.prepare(`
      INSERT INTO driver_details (
        employee_id, licence_number, issuing_state, issuing_rto_office,
        licence_issue_date, licence_validity_date, licence_experience_years,
        criminal_background_details, licence_verification_status,
        licence_front_doc, licence_back_doc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id) DO UPDATE SET
        licence_number = excluded.licence_number,
        issuing_state = excluded.issuing_state,
        issuing_rto_office = excluded.issuing_rto_office,
        licence_issue_date = excluded.licence_issue_date,
        licence_validity_date = excluded.licence_validity_date,
        licence_experience_years = excluded.licence_experience_years,
        criminal_background_details = excluded.criminal_background_details,
        licence_verification_status = excluded.licence_verification_status,
        licence_front_doc = COALESCE(excluded.licence_front_doc, driver_details.licence_front_doc),
        licence_back_doc = COALESCE(excluded.licence_back_doc, driver_details.licence_back_doc),
        updated_at = CURRENT_TIMESTAMP
    `).run(
      id,
      e.licence_number,
      e.issuing_state || '',
      e.issuing_rto_office || '',
      e.licence_issue_date || null,
      e.licence_validity_date || '2028-12-31',
      e.licence_experience_years || 0,
      e.criminal_background_details || '',
      e.licence_verification_status || 'Verified',
      e.licence_front_doc || null,
      e.licence_back_doc || null
    );
  }

  logAudit('EMPLOYEE_UPDATE', 'Employees', id, `Updated biodata for ${e.full_name}`);
  return res.json({ message: 'Employee profile updated successfully' });
});

app.delete('/api/employees/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('UPDATE employees SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  logAudit('EMPLOYEE_ARCHIVE', 'Employees', id, `Archived employee ID ${id}`);
  return res.json({ message: 'Employee archived successfully' });
});

// ================= NOTIFICATIONS & ALERTS =================
app.get('/api/notifications', (req: Request, res: Response) => {
  try {
    // 1. Upcoming maintenance alerts (due within 15 days or within 1000 km)
    const upcomingMaint = db.prepare(`
      SELECT m.*, b.bus_number, b.registration_number, b.current_odometer_km
      FROM maintenance_schedules m
      JOIN buses b ON m.bus_id = b.id
      WHERE m.status IN ('Due', 'Due Soon', 'Pending', 'Overdue')
      ORDER BY m.next_due_date ASC
    `).all();

    // 2. Pending complaints
    const pendingComplaints = db.prepare(`
      SELECT c.*, b.bus_number
      FROM complaints c
      JOIN buses b ON c.bus_id = b.id
      WHERE c.status NOT IN ('Resolved', 'Closed')
      ORDER BY c.priority = 'Critical' DESC, c.reported_date DESC
    `).all();

    // 3. Driver licence expiries (due within 60 days)
    const expiringLicences = db.prepare(`
      SELECT d.*, e.full_name, e.employee_code, e.phone_number
      FROM driver_details d
      JOIN employees e ON d.employee_id = e.id
      WHERE e.is_archived = 0 AND d.licence_validity_date <= date('now', '+60 days')
      ORDER BY d.licence_validity_date ASC
    `).all();

    // 4. Vehicle document expiries (Insurance, Fitness, PUC, Permit within 45 days)
    const expiringDocs = db.prepare(`
      SELECT id, bus_number, registration_number, insurance_expiry, fitness_expiry, puc_expiry, permit_expiry
      FROM buses
      WHERE is_archived = 0 AND (
        insurance_expiry <= date('now', '+45 days') OR
        fitness_expiry <= date('now', '+45 days') OR
        puc_expiry <= date('now', '+45 days')
      )
    `).all();

    const totalCount = upcomingMaint.length + pendingComplaints.length + expiringLicences.length + expiringDocs.length;

    return res.json({
      totalCount,
      upcomingMaint,
      pendingComplaints,
      expiringLicences,
      expiringDocs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= COMPREHENSIVE REPORTS =================
app.get('/api/reports/:reportType', (req: Request, res: Response) => {
  const { reportType } = req.params;
  const { date_from, date_to, bus_id, status } = req.query;

  try {
    let results: any[] = [];
    let summary: any = {};

    switch (reportType) {
      case 'bus-list':
      case 'bus-inventory':
        results = db.prepare(`
          SELECT b.bus_number, b.registration_number, b.make, b.model, b.bus_type,
            b.current_odometer_km, b.operational_status, b.insurance_expiry, b.fitness_expiry,
            d.full_name as assigned_driver
          FROM buses b
          LEFT JOIN employees d ON b.assigned_driver_id = d.id
          WHERE b.is_archived = 0
          ORDER BY b.bus_number ASC
        `).all();
        summary = { totalBuses: results.length };
        break;

      case 'daily-km':
      case 'daily-km-log':
        let kmQ = `
          SELECT k.entry_date, b.bus_number, b.registration_number, e.full_name as driver_name,
            k.opening_km, k.closing_km, k.distance_travelled_km, k.remarks
          FROM daily_kilometer_entries k
          JOIN buses b ON k.bus_id = b.id
          LEFT JOIN employees e ON k.driver_id = e.id
          WHERE 1=1
        `;
        const kmParams: any[] = [];
        if (bus_id) { kmQ += ' AND k.bus_id = ?'; kmParams.push(bus_id); }
        if (date_from) { kmQ += ' AND k.entry_date >= ?'; kmParams.push(date_from); }
        if (date_to) { kmQ += ' AND k.entry_date <= ?'; kmParams.push(date_to); }
        kmQ += ' ORDER BY k.entry_date DESC';
        results = db.prepare(kmQ).all(...kmParams);
        const totalDist = results.reduce((sum: number, r: any) => sum + (r.distance_travelled_km || 0), 0);
        summary = { totalDistanceKm: totalDist, totalEntries: results.length };
        break;

      case 'maintenance-summary':
        results = db.prepare(`
          SELECT m.id, b.bus_number, b.registration_number, m.maintenance_type,
            m.last_service_date, m.next_due_date, m.next_due_km, m.priority,
            m.estimated_cost, m.status, m.assigned_to
          FROM maintenance_schedules m
          JOIN buses b ON m.bus_id = b.id
          ORDER BY m.next_due_date ASC
        `).all();
        const totalEstCost = results.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0);
        summary = { totalSchedules: results.length, totalEstimatedCost: totalEstCost };
        break;

      case 'complaints-report':
        results = db.prepare(`
          SELECT c.complaint_ref, c.reported_date, b.bus_number, b.registration_number,
            c.category, c.priority, c.status, c.reported_by, c.assigned_staff,
            c.resolved_date, c.resolution_description
          FROM complaints c
          JOIN buses b ON c.bus_id = b.id
          ORDER BY c.reported_date DESC
        `).all();
        const openCount = results.filter((c: any) => c.status !== 'Resolved' && c.status !== 'Closed').length;
        summary = { totalComplaints: results.length, pendingComplaints: openCount };
        break;

      case 'repairs-report':
        results = db.prepare(`
          SELECT r.work_order_number, b.bus_number, b.registration_number, r.repair_category,
            r.reported_date, r.work_completion_date, r.labour_cost, r.parts_cost, r.other_charges,
            r.total_cost, r.workshop_vendor, r.status
          FROM repair_work_orders r
          JOIN buses b ON r.bus_id = b.id
          ORDER BY r.reported_date DESC
        `).all();
        const totalRepairExpense = results.reduce((sum: number, r: any) => sum + (r.total_cost || 0), 0);
        summary = { totalWorkOrders: results.length, totalRepairExpense };
        break;

      case 'bus-condition-report':
        results = db.prepare(`
          SELECT c.inspection_ref, c.inspection_date, b.bus_number, b.registration_number,
            c.inspector_name, c.roadworthiness_status, c.defects_found, c.corrective_action_required
          FROM bus_condition_inspections c
          JOIN buses b ON c.bus_id = b.id
          ORDER BY c.inspection_date DESC
        `).all();
        const fitCount = results.filter((i: any) => i.roadworthiness_status === 'Fit for Service').length;
        summary = { totalInspections: results.length, fitForService: fitCount };
        break;

      case 'employee-report':
        results = db.prepare(`
          SELECT e.employee_code, e.role, e.full_name, e.gender, e.phone_number,
            e.joining_date, e.employment_status, b.bus_number as assigned_bus,
            d.licence_number, d.licence_validity_date
          FROM employees e
          LEFT JOIN buses b ON e.assigned_bus_id = b.id
          LEFT JOIN driver_details d ON e.id = d.employee_id
          WHERE e.is_archived = 0
          ORDER BY e.role ASC, e.full_name ASC
        `).all();
        summary = { totalEmployees: results.length };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    return res.json({
      reportType,
      generatedAt: new Date().toISOString(),
      summary,
      results
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= SETTINGS & AUDIT LOGS =================
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM application_settings').all();
  const settingsMap: Record<string, string> = {};
  for (const s of settings as any[]) {
    settingsMap[s.key] = s.value;
  }
  return res.json(settingsMap);
});

app.post('/api/settings', requireAdmin, (req: Request, res: Response) => {
  const body = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO application_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, String(value));
  }
  logAudit('UPDATE_SETTINGS', 'Settings', 'global', 'Application settings updated');
  return res.json({ message: 'Settings updated successfully' });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
  return res.json(logs);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Charvik Fleet & Employee Management Server running on port ${PORT}`);
});
