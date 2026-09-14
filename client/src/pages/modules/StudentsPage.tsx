import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, PlusCircle, Search, Eye, Filter, UserCheck } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Student } from '../../types';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSchool } = useTenant();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Student Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'MALE',
    dob: '2010-05-15',
    bloodGroup: 'B+',
    mobile: '+91 98250 99887',
    email: '',
    address: 'Vadodara, Gujarat',
    classId: 'class_10_royal',
    divisionId: 'div_10_A',
    stream: 'SCIENCE',
    examPrep: 'JEE',
    fatherName: 'Prakash Patel',
    fatherMobile: '+91 98250 11223',
    fatherOccupation: 'Business',
    motherName: 'Rekhaben Patel',
  });

  const loadStudents = async () => {
    setIsLoading(true);
    const res = await apiRequest('/students', {
      params: { schoolId: activeSchool?.id },
    });
    if (res.success && res.data) {
      setStudents(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [activeSchool]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        schoolId: activeSchool?.id,
        parentDetails: {
          fatherName: formData.fatherName,
          fatherMobile: formData.fatherMobile,
          fatherOccupation: formData.fatherOccupation,
          motherName: formData.motherName,
        },
      }),
    });

    if (res.success) {
      alert(`Student admitted successfully! Admission No: ${res.student.admissionNumber}\nDefault Login: ${res.loginCredentials.username} / Noble@2026`);
      setIsModalOpen(false);
      loadStudents();
    } else {
      alert(res.error || 'Failed to admit student');
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission No',
      sortable: true,
      render: (s) => <span className="font-mono text-xs text-brand-red-light font-bold">{s.admissionNumber}</span>,
    },
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-white">{s.firstName} {s.lastName}</p>
          <p className="text-[11px] text-slate-400">{s.mobile || 'No Mobile'}</p>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Division',
      render: (s) => (
        <span className="text-xs text-slate-300">
          {s.class?.name || 'Class 10'} • {s.division?.name || 'Div A'}
        </span>
      ),
    },
    {
      key: 'school',
      header: 'School / Institute',
      render: (s) => <span className="text-xs text-slate-400">{s.school?.name || activeSchool?.name}</span>,
    },
    {
      key: 'examPrep',
      header: 'Course / Track',
      render: (s) => (
        <Badge variant={s.examPrep === 'JEE' ? 'danger' : s.examPrep === 'NEET' ? 'info' : 'neutral'}>
          {s.examPrep || 'General'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>{s.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Information Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage academic profiles, attendance records, fee statements, and parent linking
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Admit New Student</span>
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search by name, admission no, or phone..."
        searchKey="firstName"
        actions={(student) => (
          <button
            onClick={() => navigate(`/students/${student.id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#1e293b] hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Profile</span>
          </button>
        )}
      />

      {/* Admit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Student Admission Registration"
        subtitle="Registers student account, academic enrollment, and parent contact details"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Mobile Phone</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Course / Coaching Stream</label>
              <select
                value={formData.examPrep}
                onChange={(e) => setFormData({ ...formData, examPrep: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="JEE">JEE Main & Advanced Integrated</option>
                <option value="NEET">NEET Medical Achievers</option>
                <option value="GUJCET">GUJCET Engineering & Pharmacy</option>
                <option value="DDCET">DDCET Diploma to Degree</option>
                <option value="NONE">General Schooling (GSEB/CBSE)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Residential Address (Vadodara)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Parent / Guardian Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Father's Name</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300">Father's Mobile</label>
                <input
                  type="text"
                  value={formData.fatherMobile}
                  onChange={(e) => setFormData({ ...formData, fatherMobile: e.target.value })}
                  className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white shadow-md glow-red-sm"
            >
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
