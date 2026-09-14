import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Mail, Phone, Building, 
  GraduationCap, Briefcase, CheckCircle, ShieldCheck
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const TeachersPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: '',
    email: '',
    mobile: '',
    gender: 'MALE',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: '45000',
    qualification: 'M.Sc., B.Ed.',
    specialization: 'Physics / Mathematics',
    isClassTeacher: false,
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const url = activeSchool ? `/teachers?schoolId=${activeSchool.id}` : '/teachers';
      const res = await apiRequest(url);
      if (res.success) {
        setTeachers(res.teachers || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [activeSchool]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary),
        schoolId: activeSchool?.id,
      };
      const res = await apiRequest('/teachers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setShowAddModal(false);
        fetchTeachers();
      }
    } catch (err) {
      console.error('Failed to create teacher:', err);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.firstName?.toLowerCase().includes(q) ||
      t.lastName?.toLowerCase().includes(q) ||
      t.employeeCode?.toLowerCase().includes(q) ||
      t.mobile?.includes(q) ||
      t.teacherProfile?.specialization?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      header: 'Faculty Member',
      accessor: (t: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
            {t.firstName?.[0]}{t.lastName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              {t.firstName} {t.lastName}
              {t.teacherProfile?.isClassTeacher && (
                <Badge variant="success" className="text-[10px] py-0 px-1.5">Class Teacher</Badge>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono">{t.employeeCode}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: (t: any) => (
        <div className="text-xs space-y-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.mobile}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Specialization & Subject',
      accessor: (t: any) => (
        <div>
          <div className="text-sm font-medium text-slate-200">
            {t.teacherProfile?.specialization || 'General Faculty'}
          </div>
          <div className="text-xs text-slate-400">{t.qualification || 'B.Ed.'}</div>
        </div>
      ),
    },
    {
      header: 'Institution / Branch',
      accessor: (t: any) => (
        <div className="text-xs text-slate-300">
          <div className="font-medium text-slate-200">{t.school?.name || 'Noble Education'}</div>
          <div className="text-slate-500">{t.branch?.name || 'Vadodara Campus'}</div>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      accessor: (t: any) => (
        <div className="text-xs text-slate-400">
          {new Date(t.joiningDate).toLocaleDateString('en-IN')}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (t: any) => (
        <Badge variant={t.status === 'ACTIVE' ? 'success' : 'secondary'}>
          {t.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" />
            Faculty & Teaching Staff
          </h1>
          <p className="text-slate-400 text-sm">
            Manage academic instructors, coaching mentors, subject specialization, and teaching assignments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-medium shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search faculty by name, code, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-end">
          <span>Total Faculty: <strong className="text-slate-200">{filteredTeachers.length}</strong></span>
          <span>•</span>
          <span>Campus: <strong className="text-red-400">{activeSchool?.name || 'All Campuses'}</strong></span>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTeachers}
          loading={loading}
          emptyMessage="No faculty records found matching search filters."
        />
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Onboard Faculty Member"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="e.g. Ramesh"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="e.g. Patel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Employee Code *</label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="e.g. EMP-105"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="teacher@nobleedu.in"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="e.g. Physics / Mathematics"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Qualification</label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                placeholder="e.g. M.Sc., B.Ed."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Basic Monthly Salary (?)</label>
              <input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="classTeacher"
              checked={formData.isClassTeacher}
              onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
              className="rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-red-600"
            />
            <label htmlFor="classTeacher" className="text-xs text-slate-300">
              Assign as designated Class Teacher
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              Save Faculty Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
