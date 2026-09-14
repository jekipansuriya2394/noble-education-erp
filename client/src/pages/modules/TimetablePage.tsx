import React, { useState, useEffect } from 'react';
import { Clock, PlusCircle, AlertTriangle, CheckCircle2, Building, User } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const TimetablePage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [timetable, setTimetable] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form State
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 'MONDAY',
    periodNumber: 1,
    startTime: '08:00',
    endTime: '08:45',
    subjectId: 'sub_MATH-10',
    teacherId: '',
    roomId: '',
    classId: 'class_10_royal',
    divisionId: 'div_10_A',
  });

  const loadTimetable = async () => {
    const res = await apiRequest('/timetable', {
      params: {
        classId: 'class_10_royal',
        divisionId: 'div_10_A',
      },
    });
    if (res.success) {
      setTimetable(res.timetable);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [activeSchool]);

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    const res = await apiRequest('/timetable/slots', {
      method: 'POST',
      body: JSON.stringify(slotForm),
    });

    if (res.success) {
      alert('Timetable period assigned successfully!');
      setIsModalOpen(false);
      loadTimetable();
    } else {
      setConflictWarning(res.error || 'Conflict detected');
    }
  };

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interactive Timetable & Schedule Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grade 10 Science (Division A) • Automatic Teacher & Room conflict detection
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setConflictWarning(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Lecture Slot</span>
          </button>
        </div>
      </div>

      {/* Timetable Weekly Grid */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-3 bg-[#131d31] border border-slate-800 text-xs font-bold text-slate-400 uppercase w-28">
                Day / Period
              </th>
              {periods.map((p) => (
                <th key={p} className="p-3 bg-[#131d31] border border-slate-800 text-xs font-bold text-slate-300">
                  Period {p}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {p === 1 ? '08:00 - 08:45' : p === 2 ? '08:45 - 09:30' : p === 3 ? '09:45 - 10:30' : p === 4 ? '10:30 - 11:15' : p === 5 ? '11:45 - 12:30' : p === 6 ? '12:30 - 01:15' : '01:15 - 02:00'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="p-3 bg-[#101726] border border-slate-800 text-xs font-bold text-slate-300 text-left">
                  {day.slice(0, 3)}
                </td>
                {periods.map((periodNum) => {
                  const isSlot = (day === 'MONDAY' && periodNum === 1) || (day === 'WEDNESDAY' && periodNum === 3) || (day === 'FRIDAY' && periodNum === 2);
                  const isPhysics = (day === 'TUESDAY' && periodNum === 2) || (day === 'THURSDAY' && periodNum === 4);

                  return (
                    <td key={periodNum} className="p-2 border border-slate-800/80 min-w-[130px] h-20 text-left align-top">
                      {isSlot ? (
                        <div className="p-2 rounded-lg bg-brand-red/15 border border-brand-red/40 text-[11px] h-full flex flex-col justify-between">
                          <p className="font-bold text-white leading-tight">Mathematics</p>
                          <p className="text-[10px] text-slate-400">Prof. Rajesh P.</p>
                          <span className="text-[9px] text-brand-red-light font-mono">Room 101</span>
                        </div>
                      ) : isPhysics ? (
                        <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/50 text-[11px] h-full flex flex-col justify-between">
                          <p className="font-bold text-white leading-tight">Physics Lab</p>
                          <p className="text-[10px] text-slate-400">Dr. Meera Desai</p>
                          <span className="text-[9px] text-blue-400 font-mono">Physics Lab A</span>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg border border-dashed border-slate-800/60 p-2 flex items-center justify-center text-[10px] text-slate-600 hover:border-slate-700 cursor-pointer">
                          Free Period
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Lecture Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Timetable Lecture Period"
        subtitle="Verifies teacher and room availability to prevent double-booking"
      >
        <form onSubmit={handleSaveSlot} className="space-y-3.5">
          {conflictWarning && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{conflictWarning}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Day of Week</label>
              <select
                value={slotForm.dayOfWeek}
                onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Period Number</label>
              <select
                value={slotForm.periodNumber}
                onChange={(e) => setSlotForm({ ...slotForm, periodNumber: parseInt(e.target.value, 10) })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Start Time</label>
              <input
                type="text"
                value={slotForm.startTime}
                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">End Time</label>
              <input
                type="text"
                value={slotForm.endTime}
                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-xl text-[11px] text-slate-300">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Automated Guardrail:
            </p>
            <p className="mt-0.5 text-slate-400">
              The engine automatically rejects slots if the faculty is assigned to another lecture or if the room is occupied.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white shadow-md glow-red-sm"
            >
              Assign Period
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetablePage;
