import React from 'react';
import { CalendarCheck, BookOpen, Clock, FileSpreadsheet, Users, CheckCircle2 } from 'lucide-react';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayClasses = [
    { period: 'Period 1 (08:00 - 08:45)', subject: 'Mathematics (Calculus)', class: 'Grade 10 - Div A', room: 'Room 101', status: 'COMPLETED' },
    { period: 'Period 3 (09:45 - 10:30)', subject: 'JEE Coordinate Geometry', class: 'JEE 2-Year Integrated', room: 'Coaching Lab A', status: 'UPCOMING' },
    { period: 'Period 5 (11:30 - 12:15)', subject: 'Higher Mathematics', class: 'Grade 11 Science - Div B', room: 'Room 204', status: 'UPCOMING' },
    { period: 'Period 7 (01:45 - 02:30)', subject: 'Remedial Doubt Clearing', class: 'Grade 10 - Div A', room: 'Room 101', status: 'UPCOMING' },
  ];

  return (
    <div className="space-y-6">
      {/* Teacher Header */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red-light">
            Faculty Teaching Command
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Welcome, Prof. {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Department of Science & Mathematics • Royal Eduworld School & Coaching Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-semibold shadow-md glow-red-sm transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Today's Attendance</span>
          </button>
          <button
            onClick={() => navigate('/exams')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Enter Marks</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Assigned Students" value={82} subtitle="Across 3 sections" icon={Users} />
        <StatsCard title="Today's Lectures" value="4 Periods" subtitle="2 School, 2 Coaching" icon={Clock} />
        <StatsCard title="Active Assignments" value={3} subtitle="15 Submissions Pending Review" icon={BookOpen} />
        <StatsCard title="Class Attendance %" value="94.2%" subtitle="Grade 10 Division A" icon={CheckCircle2} />
      </div>

      {/* Today's Lecture Schedule */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Today's Teaching Schedule (Monday)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated conflict-checked timetable allocations</p>
          </div>
          <button
            onClick={() => navigate('/timetable')}
            className="text-xs text-brand-red-light hover:underline font-semibold"
          >
            View Weekly Grid →
          </button>
        </div>

        <div className="space-y-2.5">
          {todayClasses.map((c) => (
            <div
              key={c.period}
              className="p-4 rounded-xl border border-slate-800 bg-[#131d31] hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1e293b] border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                  <Clock className="w-4 h-4 text-brand-red-light" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{c.subject}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.class} • <span className="text-slate-300 font-medium">{c.room}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">{c.period}</span>
                <Badge variant={c.status === 'COMPLETED' ? 'neutral' : 'info'}>
                  {c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
