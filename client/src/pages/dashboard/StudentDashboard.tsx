import React from 'react';
import { CalendarCheck, BookOpen, Clock, FileText, Award, AlertCircle } from 'lucide-react';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const studentName = `${user?.firstName || 'Aarav'} ${user?.lastName || 'Patel'}`;

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red-light">
            Student Academic Desk
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Namaste, {studentName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grade 10 Science • Div A • Admission No: <span className="font-mono text-slate-300">NOBLE/2025/1001</span> • Royal Eduworld School
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success">Academic Status: Active</Badge>
          <Badge variant="info">JEE Aspirant</Badge>
        </div>
      </div>

      {/* Primary Student Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Attendance Rate" value="95.4%" subtitle="Above 85% requirement" icon={CalendarCheck} />
        <StatsCard title="Term Fee Balance" value="₹0" subtitle="Term 1 Fully Settled" icon={Award} />
        <StatsCard title="Pending Homework" value="1 Due" subtitle="Physics Problem Set 4" icon={FileText} />
        <StatsCard title="Upcoming Exam" value="Sep 25" subtitle="Mid-Term Mathematics" icon={Clock} />
      </div>

      {/* Daily Timetable & Study Material Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Today's Class Schedule</h3>
            <span className="text-xs text-slate-400">Monday, Room 101</span>
          </div>

          <div className="space-y-2.5">
            {[
              { period: '08:00 - 08:45', sub: 'Mathematics', teacher: 'Prof. Rajesh Panchal', status: 'Completed' },
              { period: '08:45 - 09:30', sub: 'Physics (Optics)', teacher: 'Dr. Meera Desai', status: 'In Progress' },
              { period: '09:45 - 10:30', sub: 'Chemistry Lab', teacher: 'Prof. V. Kothari', status: 'Upcoming' },
              { period: '10:30 - 11:15', sub: 'English Literature', teacher: 'Mrs. S. Bannerjee', status: 'Upcoming' },
            ].map((slot) => (
              <div
                key={slot.period}
                className="p-3.5 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{slot.sub}</p>
                  <p className="text-slate-400 mt-0.5">{slot.teacher}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-slate-300">{slot.period}</p>
                  <span className="text-[10px] text-slate-400">{slot.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Performance & Digital Materials */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Assessment Scores</h3>
              <button
                onClick={() => navigate('/exams')}
                className="text-xs text-brand-red-light hover:underline font-semibold"
              >
                All Results →
              </button>
            </div>

            <div className="space-y-3">
              {[
                { exam: 'Unit Test 1 - Mathematics', marks: '96 / 100', grade: 'A1' },
                { exam: 'Unit Test 1 - Physics', marks: '88 / 100', grade: 'A2' },
                { exam: 'JEE Mock Test Alpha', marks: '245 / 300', grade: 'Top 5%' },
              ].map((res) => (
                <div
                  key={res.exam}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-200">{res.exam}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{res.marks}</span>
                    <Badge variant="success">{res.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Need help with JEE / NEET preparation?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Doubt clearing sessions available daily from 04:00 PM at Alkapuri Hub.</p>
            </div>
            <button
              onClick={() => navigate('/campus')}
              className="px-3 py-1.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Notice Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
