import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, PlusCircle, Building, BookCheck } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const AcademicsPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'courses' | 'rooms'>('classes');

  useEffect(() => {
    const fetchAcademicData = async () => {
      const [clsRes, crsRes, rmRes] = await Promise.all([
        apiRequest('/academics/classes', { params: { schoolId: activeSchool?.id } }),
        apiRequest('/academics/courses', { params: { schoolId: activeSchool?.id } }),
        apiRequest('/academics/rooms', { params: { schoolId: activeSchool?.id } }),
      ]);

      if (clsRes.success && clsRes.classes) setClasses(clsRes.classes);
      if (crsRes.success && crsRes.courses) setCourses(crsRes.courses);
      if (rmRes.success && rmRes.rooms) setRooms(rmRes.rooms);
    };
    fetchAcademicData();
  }, [activeSchool]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Academic Programs & Infrastructure</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage grade curricula, specialized coaching streams, subject allocations, and classrooms
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'classes' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Classes & Subjects ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'courses' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Competitive Coaching Streams ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'rooms' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Rooms & Laboratories ({rooms.length})
        </button>
      </div>

      {/* Panel 1: Classes & Subjects */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Grade Level {c.gradeNumber} • {c._count?.students || 40} Students Enrolled</p>
                </div>
                <Badge variant="info">
                  {c.divisions?.length || 2} Divisions
                </Badge>
              </div>

              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 mb-1.5">Enrolled Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {(c.subjects || []).map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-[#1e293b] border border-slate-700 text-slate-300 text-xs font-medium"
                    >
                      {s.name} {s.isPractical && '🧪'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel 2: Coaching Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((crs) => (
            <div key={crs.id} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{crs.name}</h3>
                <Badge variant="danger">{crs.type}</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Code: <span className="font-mono text-slate-300 font-semibold">{crs.code}</span> • Duration: {crs.durationMonths} Months
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Noble Coaching Hub (Alkapuri)</span>
                <span className="text-emerald-400 font-semibold">Active Enrollment</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel 3: Campus Rooms */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rooms.map((rm) => (
            <div key={rm.id} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{rm.roomNumber}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{rm.building} • Floor {rm.floor}</p>
              </div>
              <div className="text-right">
                <Badge variant={rm.type === 'LAB' ? 'warning' : 'neutral'}>{rm.type}</Badge>
                <p className="text-[10px] text-slate-500 mt-1">{rm.capacity} Seats</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicsPage;
