import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/public/PublicLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Services } from './pages/public/Services';
import { Contact } from './pages/public/Contact';

// Admin Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SupportDashboard } from './pages/SupportDashboard';
import { CaptainDashboard } from './pages/CaptainDashboard';
import { BusMaster } from './pages/BusMaster';
import { DailyKilometers } from './pages/DailyKilometers';
import { MaintenanceSchedule } from './pages/MaintenanceSchedule';
import { TyreMaintenance } from './pages/TyreMaintenance';
import { AcMaintenance } from './pages/AcMaintenance';
import { OilFilterMaintenance } from './pages/OilFilterMaintenance';
import { BatteryMaintenance } from './pages/BatteryMaintenance';
import { Complaints } from './pages/Complaints';
import { Repairs } from './pages/Repairs';
import { BusCondition } from './pages/BusCondition';
import { DriverRegistration } from './pages/DriverRegistration';
import { SupportStaffRegistration } from './pages/SupportStaffRegistration';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { EmployeeRegistration } from './pages/EmployeeRegistration';
import { ProductManagement } from './pages/ProductManagement';
import { CleaningManagement } from './pages/CleaningManagement';
import { RouteManagement } from './pages/RouteManagement';
import { OrganizerManagement } from './pages/OrganizerManagement';
import { TaskManagement } from './pages/TaskManagement';
import { Earnings } from './pages/Earnings';
import { WebsiteInquiries } from './pages/WebsiteInquiries';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Public Login Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login defaultRole="Admin" />} />
            <Route path="/captain/login" element={<Login defaultRole="Captain" />} />
            <Route path="/supporter/login" element={<Login defaultRole="Supporter" />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="vehicles" element={<BusMaster />} />
              <Route path="buses" element={<BusMaster />} />
              <Route path="vehicle-registration" element={<Navigate to="/admin/vehicles" replace />} />
              <Route path="vehicle-maintenance" element={<Navigate to="/admin/mileage-fueling" replace />} />
              <Route path="mileage-fueling" element={<DailyKilometers />} />
              <Route path="daily-kilometers" element={<DailyKilometers />} />
              <Route path="tyre-maintenance" element={<TyreMaintenance />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="cleaning" element={<CleaningManagement />} />
              <Route path="routes" element={<RouteManagement />} />
              <Route path="organizers" element={<OrganizerManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="employee-registration" element={<EmployeeRegistration />} />
              <Route path="employees" element={<EmployeeRegistration />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="inquiries" element={<WebsiteInquiries />} />

              {/* Specific Submodules & Secondary Views */}
              <Route path="maintenance-schedule" element={<MaintenanceSchedule />} />
              <Route path="ac-maintenance" element={<AcMaintenance />} />
              <Route path="oil-filter-maintenance" element={<OilFilterMaintenance />} />
              <Route path="battery-maintenance" element={<BatteryMaintenance />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="bus-condition" element={<BusCondition />} />
              <Route path="drivers/new" element={<DriverRegistration />} />
              <Route path="support-staff/new" element={<SupportStaffRegistration />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Protected Captain Routes */}
            <Route path="/captain" element={<AdminLayout />}>
              <Route index element={<Navigate to="/captain/dashboard" replace />} />
              <Route path="dashboard" element={<CaptainDashboard />} />
              <Route path="buses" element={<BusMaster />} />
              <Route path="daily-kilometers" element={<DailyKilometers />} />
              <Route path="bus-condition" element={<BusCondition />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="maintenance-schedule" element={<MaintenanceSchedule />} />
              <Route path="tyre-maintenance" element={<TyreMaintenance />} />
              <Route path="battery-maintenance" element={<BatteryMaintenance />} />
            </Route>

            {/* Protected Supporter Routes */}
            <Route path="/supporter" element={<AdminLayout />}>
              <Route index element={<Navigate to="/supporter/dashboard" replace />} />
              <Route path="dashboard" element={<SupportDashboard />} />
              <Route path="bus-condition" element={<BusCondition />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="daily-kilometers" element={<DailyKilometers />} />
              <Route path="maintenance-schedule" element={<MaintenanceSchedule />} />
              <Route path="buses" element={<BusMaster />} />
            </Route>

            {/* Fallback to Public Website Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

