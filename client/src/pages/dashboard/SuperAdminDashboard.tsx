import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  Receipt,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  Building,
  UserCheck,
  PlusCircle,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { apiRequest } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await apiRequest('/analytics/super-admin');
      if (res.success) {
        setMetrics(res);
      }
      setIsLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = metrics?.kpis || {};
  const charts = metrics?.charts || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Executive Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red-light">
            Central Institutional Governance
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Super Administrator Command Deck
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Noble Education • Governing 5 Schools & Coaching Institutes across Vadodara
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => navigate('/admissions')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>New Admission</span>
          </button>
          <button
            onClick={() => navigate('/fees')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-red hover:bg-brand-red-dark border border-brand-red/60 rounded-xl text-xs font-semibold text-white shadow-md glow-red-sm transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Students"
          value={kpis.activeStudents || 0}
          subtitle={`Across ${charts.schoolComparison?.length || 5} institutes`}
          change="12%"
          isPositive={true}
          icon={GraduationCap}
        />
        <StatsCard
          title="Fees Collected"
          value={`₹${(kpis.feesCollected || 0).toLocaleString('en-IN')}`}
          subtitle={`Outstanding: ₹${(kpis.outstandingFees || 0).toLocaleString('en-IN')}`}
          change="8.4%"
          isPositive={true}
          icon={Receipt}
        />
        <StatsCard
          title="Today's Attendance"
          value={`${kpis.todayAttendancePct || 92}%`}
          subtitle="All classes & coaching batches"
          change="2.1%"
          isPositive={true}
          icon={CalendarCheck}
        />
        <StatsCard
          title="Faculty & Staff"
          value={kpis.totalEmployees || 0}
          subtitle={`${kpis.totalTeachers || 0} Active Teachers`}
          icon={Users}
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">New Admission Leads</p>
            <h4 className="text-lg font-bold text-white mt-0.5">{kpis.newInquiries || 0} Inquiries</h4>
          </div>
          <Badge variant="info">Active Pipeline</Badge>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Operating Expenses</p>
            <h4 className="text-lg font-bold text-white mt-0.5">₹{(kpis.totalExpenses || 0).toLocaleString('en-IN')}</h4>
          </div>
          <Badge variant="warning">YTD Recorded</Badge>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Net Operational Margin</p>
            <h4 className="text-lg font-bold text-emerald-400 mt-0.5">₹{(kpis.netRevenue || 0).toLocaleString('en-IN')}</h4>
          </div>
          <Badge variant="success">Positive</Badge>
        </div>
      </div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Financial Trend Chart */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Monthly Fee Collections vs. Operational Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Financial trajectory across academic year</p>
            </div>
            <Badge variant="info">Vadodara Region</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.financialTrends || []}>
                <defs>
                  <linearGradient id="collectionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991b1b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#475569" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="collections" stroke="#ef4444" fillOpacity={1} fill="url(#collectionsGrad)" name="Collections" />
                <Area type="monotone" dataKey="expenses" stroke="#94a3b8" fillOpacity={1} fill="url(#expensesGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cross-School Distribution Bar Chart */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Campus Student & Staff Enrollment
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Headcount distribution across Noble schools</p>
            </div>
            <Badge variant="neutral">5 Institutes</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.schoolComparison || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="students" fill="#991b1b" name="Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="staff" fill="#3b82f6" name="Faculty / Staff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
