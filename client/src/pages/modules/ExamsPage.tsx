import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, PlusCircle, Award, CheckCircle2, Calendar, BookOpen } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const ExamsPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [exams, setExams] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});

  const loadExams = async () => {
    const res = await apiRequest('/exams', { params: { schoolId: activeSchool?.id } });
    if (res.success && res.exams) {
      setExams(res.exams);
    }
  };

  useEffect(() => {
    loadExams();
  }, [activeSchool]);

  const handleOpenMarksModal = async (schedule: any) => {
    setSelectedSchedule(schedule);
    const res = await apiRequest('/students', { params: { classId: schedule.classId } });
    if (res.success && res.data) {
      setStudents(res.data);
      const initialMarks: Record<string, number> = {};
      res.data.forEach((s: any) => {
        initialMarks[s.id] = 85;
      });
      setMarksInput(initialMarks);
      setIsMarksModalOpen(true);
    }
  };

  const handleSaveMarks = async () => {
    const marksPayload = Object.entries(marksInput).map(([studentId, marksObtained]) => ({
      studentId,
      marksObtained,
    }));

    const res = await apiRequest('/exams/marks', {
      method: 'POST',
      body: JSON.stringify({
        examScheduleId: selectedSchedule.id,
        marks: marksPayload,
      }),
    });

    if (res.success) {
      alert('Examination marks saved successfully!');
      setIsMarksModalOpen(false);
      loadExams();
    } else {
      alert(res.error || 'Failed to record marks');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Examinations & Academic Grading</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit tests, term examinations, JEE/NEET mock evaluations, and report card publishing
          </p>
        </div>
      </div>

      {/* Active Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{exam.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type: <span className="text-slate-300 font-semibold">{exam.examType}</span> • Starts: {new Date(exam.startDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="warning">{exam.status}</Badge>
            </div>

            {/* Schedules list */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase font-bold text-slate-400">Subject Schedules</p>
              {(exam.schedules || []).map((sch: any) => (
                <div
                  key={sch.id}
                  className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{sch.subject?.name || 'Mathematics'}</p>
                    <p className="text-[11px] text-slate-400">
                      Class: {sch.class?.name || 'Grade 10'} • Max Marks: {sch.maxMarks}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenMarksModal(sch)}
                    className="px-3 py-1.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Enter Marks
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Marks Entry Modal */}
      <Modal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        title={`Enter Marks - ${selectedSchedule?.subject?.name || 'Subject'}`}
        subtitle={`Max Marks: ${selectedSchedule?.maxMarks || 100} • Passing: ${selectedSchedule?.passingMarks || 35}`}
      >
        <div className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {students.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-800 bg-[#131d31] flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{s.firstName} {s.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{s.admissionNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    max={selectedSchedule?.maxMarks || 100}
                    min={0}
                    value={marksInput[s.id] ?? ''}
                    onChange={(e) =>
                      setMarksInput({ ...marksInput, [s.id]: parseFloat(e.target.value) || 0 })
                    }
                    className="w-20 bg-[#1e293b] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                  />
                  <span className="text-slate-500">/ {selectedSchedule?.maxMarks || 100}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsMarksModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMarks}
              className="px-4 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white shadow-md glow-red-sm"
            >
              Save Marks & Compute Grades
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamsPage;
