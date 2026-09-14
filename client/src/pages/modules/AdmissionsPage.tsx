import React, { useState, useEffect } from 'react';
import { UserCheck, PlusCircle, Search, Calendar, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { AdmissionInquiry } from '../../types';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const AdmissionsPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    studentName: '',
    parentName: '',
    mobile: '',
    email: '',
    course: 'Grade 11 Science (PCM + JEE)',
    source: 'WALK_IN',
    notes: '',
  });

  const loadData = async () => {
    const [inqRes, funRes] = await Promise.all([
      apiRequest('/admissions/inquiries', {
        params: {
          schoolId: activeSchool?.id,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      }),
      apiRequest('/admissions/funnel', {
        params: { schoolId: activeSchool?.id },
      }),
    ]);

    if (inqRes.success && inqRes.inquiries) {
      setInquiries(inqRes.inquiries);
    }
    if (funRes.success) {
      setFunnel(funRes);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSchool, statusFilter]);

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admissions/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        schoolId: activeSchool?.id,
      }),
    });

    if (res.success) {
      alert(`Inquiry ${res.inquiry.inquiryNumber} registered!`);
      setIsModalOpen(false);
      setForm({
        studentName: '',
        parentName: '',
        mobile: '',
        email: '',
        course: 'Grade 11 Science (PCM + JEE)',
        source: 'WALK_IN',
        notes: '',
      });
      loadData();
    } else {
      alert(res.error || 'Failed to create inquiry');
    }
  };

  const handleAdvanceStatus = async (inquiryId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      NEW: 'CONTACTED',
      CONTACTED: 'INTERESTED',
      INTERESTED: 'VISIT_SCHEDULED',
      VISIT_SCHEDULED: 'ADMITTED',
      FOLLOW_UP: 'ADMITTED',
    };

    const nextStatus = nextStatusMap[currentStatus] || 'ADMITTED';
    const res = await apiRequest(`/admissions/inquiries/${inquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: nextStatus,
        notes: `Stage advanced to ${nextStatus}`,
      }),
    });

    if (res.success) {
      loadData();
    }
  };

  const columns: Column<AdmissionInquiry>[] = [
    {
      key: 'inquiryNumber',
      header: 'Inquiry No',
      sortable: true,
      render: (i) => <span className="font-mono text-xs text-brand-red-light font-bold">{i.inquiryNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Parent',
      sortable: true,
      render: (i) => (
        <div>
          <p className="font-semibold text-white">{i.studentName}</p>
          <p className="text-[11px] text-slate-400">Parent: {i.parentName} ({i.mobile})</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course Track',
      render: (i) => <span className="text-xs text-slate-300 font-medium">{i.course}</span>,
    },
    {
      key: 'source',
      header: 'Lead Source',
      render: (i) => <span className="text-[11px] text-slate-400 font-mono">{i.source}</span>,
    },
    {
      key: 'status',
      header: 'Pipeline Stage',
      render: (i) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
          NEW: 'info',
          CONTACTED: 'neutral',
          INTERESTED: 'warning',
          VISIT_SCHEDULED: 'warning',
          ADMITTED: 'success',
          LOST: 'danger',
        };
        return <Badge variant={variants[i.status] || 'neutral'}>{i.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Admissions CRM & Inquiries</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage inquiries, follow-up schedules, counselor assignments, and conversion funnel
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Lead Inquiry</span>
        </button>
      </div>

      {/* Funnel Metrics Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Inquiries</p>
          <h4 className="text-xl font-bold text-white mt-1">{funnel?.totalInquiries || inquiries.length}</h4>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Admitted Students</p>
          <h4 className="text-xl font-bold text-emerald-400 mt-1">{funnel?.stageBreakdown?.ADMITTED || 1}</h4>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Conversion Rate</p>
          <h4 className="text-xl font-bold text-brand-red-light mt-1">{funnel?.conversionRate || 33}%</h4>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Visits Scheduled</p>
          <h4 className="text-xl font-bold text-amber-400 mt-1">{funnel?.stageBreakdown?.VISIT_SCHEDULED || 1}</h4>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'VISIT_SCHEDULED', 'ADMITTED', 'LOST'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-brand-red text-white'
                : 'bg-[#0f172a] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={inquiries}
        searchPlaceholder="Search leads by student, parent, phone..."
        searchKey="studentName"
        actions={(inq) => (
          <div className="flex items-center gap-1.5 justify-end">
            {inq.status !== 'ADMITTED' && (
              <button
                onClick={() => handleAdvanceStatus(inq.id, inq.status)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e293b] hover:bg-slate-700 text-[11px] font-medium text-slate-200"
              >
                <span>Advance Stage</span>
                <ArrowRight className="w-3 h-3 text-brand-red-light" />
              </button>
            )}
          </div>
        )}
      />

      {/* New Inquiry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Admission Inquiry / Lead"
        subtitle="Capture prospective student information and counseling notes"
      >
        <form onSubmit={handleCreateInquiry} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Student Name *</label>
              <input
                type="text"
                required
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Parent / Guardian Name *</label>
              <input
                type="text"
                required
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Contact Mobile *</label>
              <input
                type="text"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Lead Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="WALK_IN">Walk-in Campus Visit</option>
                <option value="WEBSITE">Official Website (nobleedu.in)</option>
                <option value="REFERRAL">Student / Parent Referral</option>
                <option value="SOCIAL_MEDIA">Social Media Campaign</option>
                <option value="NEWSPAPER">Vadodara Samachar / Sandesh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Target Course</label>
            <input
              type="text"
              required
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Counselor Assessment Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              placeholder="Candidate background, previous grades, batch preference..."
            />
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
              Save Inquiry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdmissionsPage;
