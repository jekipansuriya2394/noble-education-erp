import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const AppShell: React.FC = () => {
  const location = useLocation();

  // Create friendly breadcrumb from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathSegments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
    .join(' / ');

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        {/* Breadcrumbs Banner */}
        <div className="px-8 py-3 bg-[#0c121f] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Noble ERP</span>
            <span>/</span>
            <span className="font-semibold text-white">{breadcrumb || 'Dashboard'}</span>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Academic Year: <span className="text-brand-red-light font-bold">2025-2026</span>
          </div>
        </div>

        {/* Page View Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
