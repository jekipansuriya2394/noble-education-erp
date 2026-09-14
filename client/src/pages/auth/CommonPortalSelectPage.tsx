import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building,
  GraduationCap,
  Users,
  Calculator,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Bus,
  Library,
  ChevronRight,
} from 'lucide-react';

export const CommonPortalSelectPage: React.FC = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Super Administrator',
      path: '/login/super-admin',
      desc: 'Central command for executive governance, global revenue & system audit.',
      icon: ShieldAlert,
      tag: 'Executive',
      color: 'border-red-800/40 text-rose-400',
    },
    {
      title: 'Branch Administrator',
      path: '/login/branch-admin',
      desc: 'Branch-level operational management for Vadodara campuses.',
      icon: Building,
      tag: 'Branch Hub',
      color: 'border-blue-800/40 text-blue-400',
    },
    {
      title: 'School Administrator',
      path: '/login/school-admin',
      desc: 'Institutional principal desk for admissions, timetables & staff.',
      icon: GraduationCap,
      tag: 'School Desk',
      color: 'border-emerald-800/40 text-emerald-400',
    },
    {
      title: 'Academic Coordinator',
      path: '/login/academic-coordinator',
      desc: 'Curriculum oversight, timetable conflict engine & exam scheduling.',
      icon: BookOpen,
      tag: 'Academics',
      color: 'border-purple-800/40 text-purple-400',
    },
    {
      title: 'Faculty / Teacher',
      path: '/login/teacher',
      desc: 'Class attendance marking, continuous assessment marks & assignments.',
      icon: Users,
      tag: 'Faculty',
      color: 'border-amber-800/40 text-amber-400',
    },
    {
      title: 'Accountant / Bursar',
      path: '/login/accountant',
      desc: 'Tuition fees, receipts, payment modes (UPI/Cash), expense ledger & P&L.',
      icon: Calculator,
      tag: 'Finance',
      color: 'border-cyan-800/40 text-cyan-400',
    },
    {
      title: 'HR & Personnel',
      path: '/login/hr',
      desc: 'Staff onboarding, leave request approvals & statutory payroll generation.',
      icon: UserCheck,
      tag: 'Human Resources',
      color: 'border-indigo-800/40 text-indigo-400',
    },
    {
      title: 'Front Desk / Reception',
      path: '/login/reception',
      desc: 'Admission CRM pipeline, visitor logs, follow-up calls & inquiries.',
      icon: UserCheck,
      tag: 'Front Desk',
      color: 'border-teal-800/40 text-teal-400',
    },
    {
      title: 'Student Portal',
      path: '/login/student',
      desc: 'Student dashboard: personal timetable, attendance %, marks & assignments.',
      icon: GraduationCap,
      tag: 'Student',
      color: 'border-sky-800/40 text-sky-400',
    },
    {
      title: 'Parent Portal',
      path: '/login/parent',
      desc: 'Track linked children attendance, report cards & online fee dues.',
      icon: Users,
      tag: 'Guardian',
      color: 'border-orange-800/40 text-orange-400',
    },
    {
      title: 'Transport Manager',
      path: '/login/transport',
      desc: 'Bus fleet tracking, route stops across Vadodara & student rosters.',
      icon: Bus,
      tag: 'Logistics',
      color: 'border-yellow-800/40 text-yellow-400',
    },
    {
      title: 'Librarian',
      path: '/login/librarian',
      desc: 'Book cataloging, ISBN barcode search, book issues & overdue fines.',
      icon: Library,
      tag: 'Campus Library',
      color: 'border-pink-800/40 text-pink-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-red mx-auto flex items-center justify-center font-extrabold text-white text-3xl shadow-2xl glow-red">
            N
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Noble Education ERP
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Vadodara, Gujarat, India • <span className="text-brand-red-light font-semibold">nobleedu.in</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Select your dedicated institutional role portal to continue:
          </p>
        </div>

        {/* 12 Portal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                onClick={() => navigate(portal.path)}
                className="bg-[#0f172a] border border-slate-800 hover:border-brand-red/60 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-center group-hover:border-brand-red transition-colors">
                      <Icon className="w-5 h-5 text-slate-300 group-hover:text-brand-red-light" />
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-slate-900/60 ${portal.color}`}>
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-brand-red-light transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  <span>Enter Portal</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-red-light group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-slate-500">
          <p>© 2026 Noble Education. Operating Royal Eduworld School, Newheaven Vidyalaya, Raghukul Vidyalaya & Coaching Hubs.</p>
        </div>
      </div>
    </div>
  );
};

export default CommonPortalSelectPage;
