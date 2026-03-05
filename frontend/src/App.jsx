import React from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home'));
const Features = React.lazy(() => import('./pages/Features'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Help = React.lazy(() => import('./pages/Help'));
const Login = React.lazy(() => import('./pages/Login'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const SuperAdminLogin = React.lazy(() => import('./pages/SuperAdminLogin'));
const Signup = React.lazy(() => import('./pages/Signup'));
const About = React.lazy(() => import('./pages/About'));
const Download = React.lazy(() => import('./pages/Download'));
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));
const DashboardHome = React.lazy(() => import('./pages/DashboardHome'));
const Companies = React.lazy(() => import('./pages/super-admin/Companies'));
const CreateCompany = React.lazy(() => import('./pages/super-admin/CreateCompany'));
const Plans = React.lazy(() => import('./pages/super-admin/Plans'));
const ManageClients = React.lazy(() => import('./pages/super-admin/ManageClients'));
const SyncControl = React.lazy(() => import('./pages/super-admin/SyncControl'));
const InvoiceThemes = React.lazy(() => import('./pages/super-admin/InvoiceThemes'));
const Customers = React.lazy(() => import('./pages/modules/Customers'));
const CustomerProfile = React.lazy(() => import('./components/customers/CustomerProfile'));
const Finance = React.lazy(() => import('./pages/modules/Finance'));
const Invoicing = React.lazy(() => import('./pages/modules/Invoicing'));
const Inventory = React.lazy(() => import('./pages/modules/Inventory'));
const Employees = React.lazy(() => import('./pages/modules/Employees'));
const CalendarModule = React.lazy(() => import('./pages/modules/CalendarModule'));
const Settings = React.lazy(() => import('./pages/modules/Settings'));
const Analytics = React.lazy(() => import('./pages/modules/Analytics'));
const InvoiceBuilder = React.lazy(() => import('./pages/modules/InvoiceBuilder'));
const Payroll = React.lazy(() => import('./pages/modules/Payroll'));
const Leaves = React.lazy(() => import('./pages/modules/Leaves'));
const Broadcasts = React.lazy(() => import('./pages/modules/Broadcasts'));
const BackupAndReports = React.lazy(() => import('./pages/modules/BackupAndReports'));
const CompanyTemplates = React.lazy(() => import('./pages/modules/CompanyTemplates'));


// Employee Pages
const EmployeeLayout = React.lazy(() => import('./pages/employee/EmployeeLayout'));
const EmployeeHome = React.lazy(() => import('./pages/employee/EmployeeHome'));
const EmployeeSalary = React.lazy(() => import('./pages/employee/EmployeeSalary'));
const EmployeeLeave = React.lazy(() => import('./pages/employee/EmployeeLeave'));
const EmployeeCalendar = React.lazy(() => import('./pages/employee/EmployeeCalendar'));
const EmployeeBroadcasts = React.lazy(() => import('./pages/employee/EmployeeBroadcasts'));

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const { hash, pathname } = useLocation();

  React.useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Toaster position="top-right" />
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading App...</div>}>
        <Routes>
          {/* Public Routes with Header/Footer */}
          <Route element={<><Header /><main className="flex-grow"><Outlet /></main><Footer /></>}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<Download />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <DashboardLayout />
            </ErrorBoundary>
          }>
            <Route index element={<DashboardHome />} />
            {/* Dashboard Sub-routes */}
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="finance" element={<Finance />} />
            <Route path="invoicing" element={<Invoicing />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="employees" element={<Employees />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="calendar" element={<CalendarModule />} />
            <Route path="settings" element={<Settings />} />
            <Route path="backup-reports" element={<BackupAndReports />} />



            {/* Super Admin Routes */}
            <Route path="companies" element={<Companies />} />
            <Route path="companies/new" element={<React.Suspense fallback={<div>Loading...</div>}><CreateCompany /></React.Suspense>} />
            <Route path="plans" element={<Plans />} />
            <Route path="templates" element={<InvoiceThemes />} />
            <Route path="sync" element={<SyncControl />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="invoices/new" element={<InvoiceBuilder />} />
            <Route path="clients" element={<React.Suspense fallback={<div>Loading...</div>}><ManageClients /></React.Suspense>} />
            <Route path="logs" element={<div className="p-10 text-center text-slate-500">Security Logs (Coming Soon)</div>} />

            {/* Admin Broadcasts */}
            <Route path="broadcasts" element={<Broadcasts />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee-dashboard" element={
            <ErrorBoundary>
              <EmployeeLayout />
            </ErrorBoundary>
          }>
            <Route index element={<EmployeeHome />} />
            <Route path="salary" element={<EmployeeSalary />} />
            <Route path="leaves" element={<EmployeeLeave />} />
            <Route path="calendar" element={<EmployeeCalendar />} />
            <Route path="broadcasts" element={<EmployeeBroadcasts />} />
          </Route>
        </Routes>
      </React.Suspense>
    </div>
  );
}
