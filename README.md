# Charvik Staffing Consultancy - Fleet Maintenance & Employee Management Portal

A full-stack, enterprise-grade, responsive Web Application designed for **Charvik Staffing Consultancy** to manage its bus fleet operations, daily kilometer logging, preventive and breakdown maintenance schedules, workshop repairs, driver and support staff onboarding, employee biodata with masked identity records, and operational reports.

---

## 🚀 System Architecture & Technology Stack

- **Backend:**
  - Node.js & TypeScript with Express.js REST API
  - Persistent SQLite Relational Database via `better-sqlite3` (WAL mode enabled for concurrent reads/writes)
  - JWT Authentication & BCrypt Password Hashing
  - Multer for local document/photo uploads
  - Automatic audit logging across all operational mutations
- **Frontend:**
  - React 18 with TypeScript & Vite
  - Tailwind CSS with custom Charvik navy-blue brand color tokens (`#142B4A`, `#1E3A5F`, `#2563EB`)
  - Lucide React icon suite
  - Recharts for fleet analytics and status distribution charts
  - AOS (Animate on Scroll) for smooth micro-animations
  - React Router v6 with authenticated route protection
- **Branding Assets:**
  - Official Charvik Staffing Consultancy logo integrated into login, header, and print layouts.

---

## 🔑 Default Administrator Credentials

| Role | Email / Username | Password |
|---|---|---|
| **Super Administrator** | `admin@charvik.com` | `admin123` |

> *A 1-click **"Auto-fill Demo Admin"** button is also available on the `/login` page.*

---

## 📦 Project Structure

```
CHARVIK/
├── server/
│   ├── data/
│   │   └── charvik.db            # SQLite relational database file
│   ├── uploads/                  # Uploaded licences, IDs, & invoices
│   └── src/
│       ├── db.ts                 # Database schema definitions & tables
│       ├── seed.ts               # Seed data generator (32 buses, 14 staff)
│       └── index.ts              # REST API endpoints (Auth, Fleet, Staff, Reports)
├── client/
│   ├── public/
│   │   └── logo.jpg              # Official Charvik logo
│   └── src/
│       ├── components/
│       │   ├── common/           # Badge, StatCard, Modal, Toast
│       │   └── layout/           # Sidebar, Navbar, AdminLayout
│       ├── pages/                # All 16 application modules
│       ├── services/api.ts       # Type-safe API client
│       └── types/index.ts        # TypeScript interface definitions
└── README.md
```

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js v18+ installed
- npm v9+

### 1. Start the Backend Server (Port 5000)
```powershell
cd server
npm install
npm run dev
```
*The server will initialize SQLite database tables and seed sample data automatically on first launch.*

### 2. Start the Frontend Client (Port 3000)
```powershell
cd client
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 📋 Implemented Modules & Capabilities

1. **Dashboard (`/dashboard`):**
   - 7 Live KPI summary cards (Total Fleet 32, Active 28, Under Maintenance 2, Today's KM, Pending Complaints, Active Staff).
   - Quick Daily Kilometer recording widget.
   - Maintenance interval progress trackers (Oil & Filters, Tyres, AC Servicing, Battery Inspection).
   - Recharts fleet status donut chart & live recent KM log table.
2. **Bus Master (`/buses`):**
   - Fleet inventory with full vehicle metadata (Make, Model, Seating, Fuel, PUC, Insurance, Fitness).
   - 9-tab linked history modal displaying kilometers, tyre logs, AC services, oil changes, battery tests, complaints, repairs, and inspections for each bus.
3. **Daily Kilometers (`/daily-km`):**
   - Opening and closing odometer capture with automatic distance computation.
   - Historical log table with audit correction dialog.
4. **Maintenance Schedule (`/maintenance`):**
   - Preventative maintenance tracking by both odometer interval and calendar date.
   - Mark-as-completed workflow with date and odometer updating.
5. **Tyre Maintenance (`/tyres`):**
   - Axle position mapping (Front Left/Right, Rear Duals), tread depth (mm), pressure (PSI), rotation workflows.
6. **AC Maintenance (`/ac`):**
   - Cooling efficiency assessment, refrigerant gas checks, compressor condition, filter replacements.
7. **Oil & Filter Replacement (`/oil-filter`):**
   - Engine oil brand/grade, quantity (liters), filter checkboxes (Oil, Air, Fuel, DPF), labour and parts cost breakdown.
8. **Battery Check (`/battery`):**
   - Voltage testing, terminal corrosion checks, alternator charging status, warranty expiry alerts.
9. **Complaints (`/complaints`):**
   - Auto-generated reference codes (`CMP-YYYY-XXXX`), priority tags (Critical, High, Medium, Low), vendor/staff assignments, resolution notes.
10. **Repairs & Service (`/repairs`):**
    - Work order management (`WO-YYYY-XXXX`), line-item cost tracking (labour, parts, other), return-to-service fleet status restoration.
11. **Bus Condition Inspection (`/bus-condition`):**
    - Comprehensive 15-point roadworthiness checklist with fitness certificate status.
12. **Driver Registration (`/driver-registration`):**
    - 6-step guided wizard conforming to transport compliance spreadsheets:
      1. Personal Details
      2. Aadhaar & Identity
      3. Driving Licence & Experience
      4. Bank & Remittance
      5. References & Emergency Contacts
      6. Review, Verification & Bus Assignment
13. **Support Staff Registration (`/staff-registration`):**
    - 5-step registration wizard for Helpers and Captains.
14. **Employee Management (`/employees`):**
    - Unified staff directory with role filters (Driver, Helper, Captain).
    - Masked Aadhaar (`XXXX-XXXX-1234`), PAN (`ABXXXXX4F`), and bank accounts.
    - Full printable biodata profile view.
15. **Reports Engine (`/reports`):**
    - 7 Analytical report categories (Bus Fleet Inventory, Daily KM Log, Maintenance Summary, Complaints, Repairs, Bus Condition, Employee Roster).
    - Date and bus filtering, CSV download, formatted Excel download, and print view.
16. **Settings & Audit Trail (`/settings`):**
    - Company profile details, default service intervals, notification thresholds.
    - Immutable audit log tracking user actions and timestamped database mutations.
