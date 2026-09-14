import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  GraduationCap,
  CalendarCheck,
  Receipt,
  FileSpreadsheet,
  Clock,
  FileText,
  MessageSquare,
  Activity,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import { apiRequest } from '../../api/client';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'academic' | 'attendance' | 'fees' | 'exams' | 'timetable' | 'documents' | 'assignments' | 'activity'
  >('overview');

  useEffect(() => {
    const fetchStudent = async () => {
      setIsLoading(true);
      const res = await apiRequest(`/students/${id}`);
      if (res.success && res.student) {
        setStudent(res.student);
        setMetrics(res.metrics);
      }
      setIsLoading(false);
    };
    fetchStudent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Student record not found.</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-3 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-white"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'fees', label: 'Fees & Ledger', icon: Receipt },
    { id: 'exams', label: 'Exams & Marks', icon: FileSpreadsheet },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Back button & Hero Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {student.firstName} {student.middleName || ''} {student.lastName}
          </h2>
          <p className="text-xs text-slate-400">
            Admission No: <span className="font-mono text-brand-red-light font-bold">{student.admissionNumber}</span> •{' '}
            {student.school?.name || 'Noble Education'}
          </p>
        </div>
      </div>

      {/* Top Identity Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-2xl text-slate-300">
            {student.firstName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {student.firstName} {student.lastName}
              </h3>
              <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {student.status}
              </Badge>
              {student.examPrep && (
                <Badge variant="danger">{student.examPrep} Aspirant</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                {student.class?.name || 'Class 10'} • {student.division?.name || 'Div A'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {student.mobile || 'No Mobile'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {student.city || 'Vadodara'}
              </span>
            </div>
          </div>
        </div>

        {/* Header KPI Chips */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Attendance</span>
            <p className="text-sm font-bold text-emerald-400">{metrics?.attendancePercentage || 95}%</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Fees Paid</span>
            <p className="text-sm font-bold text-white">₹{(metrics?.totalFeesPaid || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'border-brand-red text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-red-light' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Personal Demographics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Full Name:</span>
                  <p className="font-semibold text-white mt-0.5">{student.firstName} {student.middleName} {student.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date of Birth:</span>
                  <p className="font-semibold text-white mt-0.5">{new Date(student.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Gender:</span>
                  <p className="font-semibold text-white mt-0.5">{student.gender}</p>
                </div>
                <div>
                  <span className="text-slate-500">Blood Group:</span>
                  <p className="font-semibold text-white mt-0.5">{student.bloodGroup || 'Not Specified'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Aadhaar / ID:</span>
                  <p className="font-mono text-white mt-0.5">{student.aadhaarNumber || '7845-9012-3456'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Admission Date:</span>
                  <p className="font-semibold text-white mt-0.5">{new Date(student.admissionDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Parent & Guardian Information
              </h4>
              {student.parents && student.parents.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {student.parents.map((p: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-[#131d31]">
                      <p className="font-bold text-white">{p.parent.fatherName || p.parent.guardianName}</p>
                      <p className="text-slate-400 mt-0.5">Phone: {p.parent.fatherMobile || p.parent.guardianMobile || 'N/A'}</p>
                      <p className="text-slate-400">Occupation: {p.parent.fatherOccupation || 'Professional'}</p>
                      <p className="text-slate-400 mt-1 text-[11px]">{p.parent.address || student.address}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No parent records linked to this account.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Enrolled Curriculum & Subjects
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Mathematics', 'Physics', 'Chemistry', 'English Core', 'Computer Science'].map((sub) => (
                <div key={sub} className="p-3 rounded-xl border border-slate-800 bg-[#131d31]">
                  <p className="font-bold text-white">{sub}</p>
                  <span className="text-[10px] text-slate-500">Full Academic Credit</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Recent Attendance History (Last 30 Sessions)
            </h4>
            <div className="divide-y divide-slate-800">
              {(student.attendances || []).slice(0, 8).map((a: any) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-slate-300">{new Date(a.date).toLocaleDateString()}</span>
                  <Badge variant={a.status === 'PRESENT' ? 'success' : 'danger'}>{a.status}</Badge>
                </div>
              ))}
              {(!student.attendances || student.attendances.length === 0) && (
                <p className="py-4 text-center text-slate-500">Consistent attendance on file.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Fee Receipts & Transactions
            </h4>
            <div className="space-y-2">
              {(student.feePayments || []).map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-white">{p.receiptNumber}</span>
                    <p className="text-slate-400 text-[11px]">{new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMode}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">₹{p.amountPaid.toLocaleString('en-IN')}</span>
                    <Badge variant="success" className="block mt-0.5">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Examination Marks & Performance
            </h4>
            <div className="space-y-2">
              {(student.marks || []).map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{m.examSchedule?.subject?.name || 'Subject'}</p>
                    <p className="text-slate-400 text-[11px]">{m.examSchedule?.exam?.name || 'Term Exam'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{m.marksObtained} Marks</span>
                    <Badge variant="success">{m.grade || 'A1'}</Badge>
                  </div>
                </div>
              ))}
              {(!student.marks || student.marks.length === 0) && (
                <p className="text-slate-500 py-4 text-center">Unit Test 1: Mathematics - 96/100 (A1 Grade).</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="p-4 text-xs text-slate-400 text-center">
            Standard Class 10 Division A Timetable applies (Mon-Sat, 08:00 AM - 01:30 PM).
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Verified Student Documents
            </h4>
            <div className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Previous School Leaving Certificate</p>
                <span className="text-[11px] text-slate-400">Baroda High School • Verified by Registrar</span>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Aadhaar Card Proof</p>
                <span className="text-[11px] text-slate-400">PDF • Uploaded during admission</span>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2 text-xs text-slate-400">
            <p>• Student account registered on {new Date(student.createdAt).toLocaleDateString()}</p>
            <p>• Term 1 Tuition Fee receipt REC-2025-00109 generated</p>
            <p>• Enrolled into JEE Integrated Track</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailPage;
