import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import AppShell from '../components/layout/AppShell';
import Login from '../modules/auth/pages/LoginPage';
import { Toaster } from 'react-hot-toast';
import RentrixAiAssistant from '../components/RentrixAiAssistant';
import { AlertTriangle, Database } from 'lucide-react';

// Lazy load pages for performance
const Dashboard = React.lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const Properties = React.lazy(() => import('../modules/properties/pages/PropertiesPage'));
const PropertyProfile = React.lazy(() => import('../modules/properties/pages/PropertyProfilePage'));
const People = React.lazy(() => import('../modules/people/pages/PeoplePage'));
const OwnerProfile = React.lazy(() => import('../modules/people/pages/OwnerProfilePage'));
const Contracts = React.lazy(() => import('../modules/contracts/pages/ContractsPage'));
const Financials = React.lazy(() => import('../modules/financials/pages/FinancialsPage'));
const Invoices = React.lazy(() => import('../modules/financials/pages/InvoicesPage'));
const Accounting = React.lazy(() => import('../modules/financials/pages/AccountingPage'));
const Budget = React.lazy(() => import('../modules/financials/pages/BudgetPage'));
const Leads = React.lazy(() => import('../modules/leads/pages/LeadsPage'));
const Communication = React.lazy(() => import('../modules/communication/pages/CommunicationHubPage'));
const Missions = React.lazy(() => import('../modules/missions/pages/MissionsPage'));
const Reports = React.lazy(() => import('../modules/reports/pages/ReportsPage'));
const Maintenance = React.lazy(() => import('../modules/maintenance/pages/MaintenancePage'));
const Settings = React.lazy(() => import('../modules/settings/pages/SettingsPage'));
const ChangePassword = React.lazy(() => import('../modules/settings/pages/ChangePasswordPage'));

const App: React.FC = () => {
  const { currentUser: user, isReady, needsMigration } = useApp();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      {needsMigration && user && (
        <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-[100] shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="animate-pulse" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">تنبيه: تحديث قاعدة البيانات مطلوب</span>
              <span className="text-[10px] opacity-90">يرجى تنفيذ ملف الهجرة (Migration Script) في Supabase لتفعيل الميزات الجديدة.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open('/supabase/migrations/20260407_refactor_schema.sql', '_blank')}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Database size={14} /> عرض الملف
            </button>
          </div>
        </div>
      )}
      <React.Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          {!user ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyProfile />} />
              <Route path="/people" element={<People />} />
              <Route path="/people/owners/:id" element={<OwnerProfile />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/change-password" element={<ChangePassword />} />
              {/* Add more routes as they are implemented */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </React.Suspense>
      {user && <RentrixAiAssistant />}
    </>
  );
};

export default App;
