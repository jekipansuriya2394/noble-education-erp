import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import AppShell from './components/layout/AppShell';

// Auth Pages
import CommonPortalSelectPage from './pages/auth/CommonPortalSelectPage';
import PortalLoginPage from './pages/auth/PortalLoginPage';

// Dashboards
import { SuperAdminDashboard } from './pages/dashboard/SuperAdminDashboard';
import { TeacherDashboard } from './pages/dashboard/TeacherDashboard';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { ParentDashboard } from './pages/dashboard/ParentDashboard';

// Module Pages
import { AdmissionsPage } from './pages/modules/AdmissionsPage';
import { StudentsPage } from './pages/modules/StudentsPage';
import { StudentDetailPage } from './pages/modules/StudentDetailPage';
import { TeachersPage } from './pages/modules/TeachersPage';
import { AcademicsPage } from './pages/modules/AcademicsPage';
import { TimetablePage } from './pages/modules/TimetablePage';
import { AttendancePage } from './pages/modules/AttendancePage';
import { FeesPage } from './pages/modules/FeesPage';
import { AccountingPage } from './pages/modules/AccountingPage';
import { PayrollPage } from './pages/modules/PayrollPage';
import { ExamsPage } from './pages/modules/ExamsPage';
import { CampusPage } from './pages/modules/CampusPage';
import { AuditLogsPage } from './pages/modules/AuditLogsPage';
import { SettingsPage } from './pages/modules/SettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading Noble ERP Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Root index redirector
const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  if (role === 'SUPER_ADMIN') return <Navigate to="/portal/super-admin" replace />;
  if (role === 'TEACHER') return <Navigate to="/portal/teacher" replace />;
  if (role === 'STUDENT') return <Navigate to="/portal/student" replace />;
  if (role === 'PARENT') return <Navigate to="/portal/parent" replace />;
  return <Navigate to={`/portal/${role.toLowerCase().replace(/_/g, '-')}`} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public Login Routes */}
            <Route path="/login" element={<CommonPortalSelectPage />} />
            <Route path="/login/:portalType" element={<PortalLoginPage />} />

            {/* Authenticated Workspace wrapped in AppShell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Home redirect */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Portal Dashboards */}
              <Route path="/portal/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/portal/branch-admin" element={<SuperAdminDashboard />} />
              <Route path="/portal/school-admin" element={<SuperAdminDashboard />} />
              <Route path="/portal/academic-coordinator" element={<SuperAdminDashboard />} />
              <Route path="/portal/teacher" element={<TeacherDashboard />} />
              <Route path="/portal/student" element={<StudentDashboard />} />
              <Route path="/portal/parent" element={<ParentDashboard />} />
              <Route path="/portal/accountant" element={<FeesPage />} />
              <Route path="/portal/hr" element={<PayrollPage />} />
              <Route path="/portal/reception" element={<AdmissionsPage />} />
              <Route path="/portal/transport" element={<CampusPage />} />
              <Route path="/portal/librarian" element={<CampusPage />} />
              <Route path="/portal/:portalType" element={<SuperAdminDashboard />} />

              {/* Functional ERP Modules */}
              <Route path="/admissions" element={<AdmissionsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/accounting" element={<AccountingPage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/campus" element={<CampusPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
