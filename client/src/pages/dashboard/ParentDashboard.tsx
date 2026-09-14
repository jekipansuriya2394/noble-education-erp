import React, { useState } from 'react';
import { Users, CalendarCheck, Receipt, Award, CheckCircle2, ChevronRight, Phone } from 'lucide-react';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const linkedChildren = [
    {
      id: 'child_1',
      name: 'Aarav Patel',
      admissionNo: 'NOBLE/2025/1001',
      school: 'Royal Eduworld School',
      class: 'Grade 10 - Div A',
      attendancePct: 95.4,
      feeStatus: 'PAID',
      recentGrade: 'A1',
    },
  ];

  const [selectedChild] = useState(linkedChildren[0]);

  return (
    <div className="space-y-6">
      {/* Parent Greeting Header */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red-light">
            Guardian & Parent Portal
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Welcome, Shri {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Parent of <span className="text-white font-semibold">{selectedChild.name}</span> ({selectedChild.class})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-xs font-semibold text-slate-200">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Class Teacher: +91 98254 56789</span>
          </div>
        </div>
      </div>

      {/* Child Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Attendance Rate" value={`${selectedChild.attendancePct}%`} subtitle="Satisfies 85% requirement" icon={CalendarCheck} />
        <StatsCard title="Tuition Fee Status" value="Settled" subtitle="Term 1 Receipt Paid" icon={Receipt} />
        <StatsCard title="Class Standing" value="Rank 2" subtitle="Top 5% in Grade 10" icon={Award} />
        <StatsCard title="Conduct & Behavior" value="Exemplary" subtitle="Active in Science Olympiad" icon={CheckCircle2} />
      </div>

      {/* Child Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">Academic Footprint & Remarks</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#131d31]">
              <p className="text-xs font-bold text-slate-200">Term 1 Assessment Overview</p>
              <p className="text-xs text-slate-400 mt-1">
                Aarav continues to demonstrate extraordinary aptitude in higher mathematics and physics. Shows disciplined classroom participation.
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>By Prof. Rajesh Panchal (PGT Math)</span>
                <span>Updated 2 days ago</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#131d31]">
              <p className="text-xs font-bold text-slate-200">JEE Coaching Track Progress</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed 14 mock question sets. Strong conceptual clarity in calculus and mechanics.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide mb-4">Fee Receipts & Statements</h3>
            <div className="p-4 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Receipt #REC-2025-00109</p>
                <p className="text-xs text-slate-400 mt-0.5">Term 1 Installment • Paid via UPI</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400">₹34,000</span>
                <Badge variant="success" className="block mt-1">Settled</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => navigate('/fees')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <span>View Full Fee Ledger & Download Receipts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
