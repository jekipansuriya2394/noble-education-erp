import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { apiRequest } from '../../api/client';

export const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDivision, setSelectedDivision] = useState('div_10_A');
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadAttendance = async () => {
    const res = await apiRequest('/attendance/class', {
      params: { divisionId: selectedDivision, date: selectedDate },
    });
    if (res.success) {
      setAttendanceData(res);
      setRoster(res.roster || []);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDivision, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleMarkAll = (status: string) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    const records = roster.map((r) => ({
      studentId: r.studentId,
      status: r.status === 'NOT_MARKED' ? 'PRESENT' : r.status,
      remarks: r.remarks,
    }));

    const res = await apiRequest('/attendance/class', {
      method: 'POST',
      body: JSON.stringify({
        divisionId: selectedDivision,
        date: selectedDate,
        records,
      }),
    });

    setIsSaving(false);
    if (res.success) {
      alert('Attendance saved and student notifications queued!');
      loadAttendance();
    } else {
      alert(res.error || 'Failed to save attendance');
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const totalCount = roster.length;
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Class Attendance Register</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record daily or subject-wise student attendance with automatic absenteeism alerts
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save & Publish Attendance'}</span>
        </button>
      </div>

      {/* Control & KPI Bar */}
      <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#1e293b] border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5"
            />
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 font-semibold"
          >
            <option value="div_10_A">Grade 10 - Division A</option>
            <option value="div_10_B">Grade 10 - Division B</option>
            <option value="div_9_A">Grade 9 - Division A</option>
            <option value="div_11_sci_A">Grade 11 Science - Division A</option>
          </select>
        </div>

        {/* Quick bulk actions & metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-medium hover:bg-emerald-900/60"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1 rounded bg-rose-950/70 border border-rose-800/60 text-rose-400 text-xs font-medium hover:bg-rose-900/60"
            >
              All Absent
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Present: <strong className="text-emerald-400">{presentCount}</strong>
            </span>
            <span className="text-slate-400">
              Absent: <strong className="text-rose-400">{absentCount}</strong>
            </span>
            <span className="text-slate-400">
              Rate: <strong className="text-brand-red-light">{presentPct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#131d31] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3 font-semibold w-16">Roll</th>
              <th className="px-5 py-3 font-semibold">Student Name</th>
              <th className="px-5 py-3 font-semibold">Admission No</th>
              <th className="px-5 py-3 font-semibold text-center w-64">Attendance Status</th>
              <th className="px-5 py-3 font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {roster.map((s) => (
              <tr key={s.studentId} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 font-mono text-slate-400">{s.rollNumber || '—'}</td>
                <td className="px-5 py-3 font-semibold text-white">{s.name}</td>
                <td className="px-5 py-3 font-mono text-slate-400">{s.admissionNumber}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(s.studentId, 'PRESENT')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        s.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => handleStatusChange(s.studentId, 'ABSENT')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        s.status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => handleStatusChange(s.studentId, 'LATE')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        s.status === 'LATE'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      L
                    </button>
                    <button
                      onClick={() => handleStatusChange(s.studentId, 'HALF_DAY')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        s.status === 'HALF_DAY'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      HD
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={s.remarks || ''}
                    placeholder="Optional remark..."
                    onChange={(e) => {
                      const val = e.target.value;
                      setRoster((prev) =>
                        prev.map((r) => (r.studentId === s.studentId ? { ...r, remarks: val } : r))
                      );
                    }}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
