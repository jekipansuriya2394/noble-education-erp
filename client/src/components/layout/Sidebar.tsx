import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  Clock,
  BookOpen,
  Briefcase,
  FileSpreadsheet,
  Bus,
  Library,
  Megaphone,
  ShieldAlert,
  Settings,
  UserCheck,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'SUPER_ADMIN';

  // Master menu items with required permissions or allowed roles
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: userRole === 'SUPER_ADMIN' ? '/portal/super-admin' : `/portal/${userRole.toLowerCase().replace(/_/g, '-')}`,
    },
    {
      title: 'Admissions CRM',
      icon: UserCheck,
      path: '/admissions',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'RECEPTION'],
    },
    {
      title: 'Students',
      icon: GraduationCap,
      path: '/students',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'RECEPTION', 'ACCOUNTANT'],
    },
    {
      title: 'Faculty & Staff',
      icon: Users,
      path: '/teachers',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'HR', 'ACADEMIC_COORDINATOR'],
    },
    {
      title: 'Academics & Courses',
      icon: BookOpen,
      path: '/academics',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'TEACHER'],
    },
    {
      title: 'Timetable',
      icon: Clock,
      path: '/timetable',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
      title: 'Attendance',
      icon: CalendarCheck,
      path: '/attendance',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
      title: 'Fees & Collections',
      icon: Receipt,
      path: '/fees',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTION', 'STUDENT', 'PARENT'],
    },
    {
      title: 'Accounting & P&L',
      icon: DollarSign,
      path: '/accounting',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'],
    },
    {
      title: 'HR & Payroll',
      icon: Briefcase,
      path: '/payroll',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'HR', 'ACCOUNTANT'],
    },
    {
      title: 'Exams & Marks',
      icon: FileSpreadsheet,
      path: '/exams',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
      title: 'Campus Operations',
      icon: Bus,
      path: '/campus',
      roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT', 'LIBRARIAN'],
    },
    {
      title: 'Audit Logs',
      icon: ShieldAlert,
      path: '/audit-logs',
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole) || userRole === 'SUPER_ADMIN';
  });

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center font-bold text-white shadow-lg glow-red-sm text-lg">
          N
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1">
            Noble Education
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Vadodara • Gujarat
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management Modules
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.title}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#1e293b] text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-brand-red-light' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-red-light" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Role Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0c121f]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-brand-red-light font-bold uppercase tracking-wide truncate">
              {userRole.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
