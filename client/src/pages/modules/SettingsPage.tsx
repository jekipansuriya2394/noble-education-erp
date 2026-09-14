import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, GraduationCap, Calendar, Shield, Database, 
  CheckCircle2, Globe, Phone, Mail, Award, Lock, RefreshCw, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { apiRequest } from '../../api/client';
import Badge from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { schools, branches } = useTenant();
  const [activeTab, setActiveTab] = useState<'org' | 'branches' | 'schools' | 'years' | 'rbac' | 'system'>('org');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [orgRes, yearRes] = await Promise.all([
        apiRequest('/org'),
        apiRequest('/org/academic-years'),
      ]);
      if (orgRes.success) setOrgData(orgRes.organization);
      if (yearRes.success) setAcademicYears(yearRes.academicYears || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { role: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full root access to all organizations, branches, schools, financial statements, and audit logs', count: 1 },
    { role: 'BRANCH_ADMIN', name: 'Branch Admin', desc: 'Administrative control over all schools & units within a geographic Vadodara branch', count: 1 },
    { role: 'SCHOOL_ADMIN', name: 'Principal / School Admin', desc: 'Direct authority over a specific school: staff, admissions, timetable, fees, and grading', count: 1 },
    { role: 'ACADEMIC_COORDINATOR', name: 'Academic Coordinator', desc: 'Curriculum oversight, syllabus progress tracking, timetable conflict approvals', count: 1 },
    { role: 'TEACHER', name: 'Teacher / Faculty', desc: 'Attendance marking, assignment issuance, LMS material upload, report card remarks', count: 1 },
    { role: 'ACCOUNTANT', name: 'Accountant', desc: 'Fee collection, receipt issuance, double-entry vouchers, petty cash, GST & bank reconciliations', count: 1 },
    { role: 'HR', name: 'HR & Payroll Manager', desc: 'Employee onboarding, biometric sync, leaves approval, monthly statutory payroll (PF/ESI/PT/TDS)', count: 1 },
    { role: 'RECEPTION', name: 'Front Desk / Admissions Officer', desc: 'Walk-in inquiries, phone inquiries, campus tour booking, CRM pipeline progression', count: 1 },
    { role: 'STUDENT', name: 'Student', desc: 'Timetable viewing, assignment submissions, digital library check, fee receipt downloads', count: 1 },
    { role: 'PARENT', name: 'Parent / Guardian', desc: 'Child attendance alert tracking, fee dues payment gateway, teacher message board, report card access', count: 1 },
    { role: 'TRANSPORT', name: 'Transport Coordinator', desc: 'Bus route tracking, GPS manifest, stop schedules, driver details', count: 1 },
    { role: 'LIBRARIAN', name: 'Librarian', desc: 'Book cataloging, barcode scanning, book issue/return tracking, overdue fine calculation', count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building className="w-6 h-6 text-red-500" />
            System & Enterprise Settings
          </h1>
          <p className="text-slate-400 text-sm">
            Configure Noble Education organization entities, multi-branch campuses, academic sessions, and security policies
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('org')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'org'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          Organization
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'branches'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('schools')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'schools'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Schools & Institutes ({schools.length})
        </button>
        <button
          onClick={() => setActiveTab('years')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'years'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Years
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'rbac'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'system'
              ? 'border-red-600 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          System & Health
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'org' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-red-500" />
                Organization Master Record
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Entity Legal Name</label>
                  <p className="text-slate-200 font-medium mt-1">{orgData?.name || 'Noble Education Group'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Brand Code</label>
                  <p className="text-slate-200 font-medium mt-1 font-mono">{orgData?.code || 'NOBLE-EDU'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Official Website</label>
                  <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <a href={`https://${orgData?.website || 'nobleedu.in'}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      {orgData?.website || 'nobleedu.in'}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Official Email</label>
                  <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {orgData?.email || 'admin@nobleedu.in'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Head Office Phone</label>
                  <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {orgData?.phone || '+91 265 233 4455'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Location / Jurisdiction</label>
                  <p className="text-slate-200 font-medium mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {orgData?.city || 'Vadodara'}, {orgData?.state || 'Gujarat'}, India
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Affiliations & Accreditation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                  <div className="font-semibold text-slate-200 text-sm">GSEB (Gujarat Board)</div>
                  <p className="text-xs text-slate-400 mt-1">Secondary & Higher Secondary Education</p>
                  <Badge variant="success" className="mt-3">Verified Active</Badge>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                  <div className="font-semibold text-slate-200 text-sm">CBSE Affiliation</div>
                  <p className="text-xs text-slate-400 mt-1">Central Board of Secondary Education</p>
                  <Badge variant="success" className="mt-3">Verified Active</Badge>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                  <div className="font-semibold text-slate-200 text-sm">AICTE / GTU Aligned</div>
                  <p className="text-xs text-slate-400 mt-1">Engineering Foundation & Coaching</p>
                  <Badge variant="success" className="mt-3">Verified Active</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-200 mb-3">Multi-Tenant Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Total Branches</span>
                  <span className="text-sm font-bold text-slate-100">{branches.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Schools & Institutes</span>
                  <span className="text-sm font-bold text-slate-100">{schools.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-sm text-slate-400">Operating City</span>
                  <span className="text-sm font-semibold text-red-400">Vadodara, Gujarat</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Current Academic Term</span>
                  <span className="text-sm font-mono text-emerald-400">2025-2026</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-200 mb-2">Default Currency & Timezone</h3>
              <p className="text-xs text-slate-400 mb-4">Configured for statutory GST and Indian Standard Time calculations</p>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Currency</span>
                  <span className="font-mono font-medium">INR (?)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timezone</span>
                  <span className="font-mono font-medium">Asia/Kolkata (IST +5:30)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fiscal Year</span>
                  <span className="font-mono font-medium">April 01 - March 31</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-950/40 text-red-400 border border-red-900/30 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <Badge variant="danger">{b.code}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{b.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{b.city}, Gujarat, India</p>
              
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Branch Code:</span>
                  <span className="font-mono text-slate-200">{b.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-medium">Operational</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((s) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-950/40 text-red-400 border border-red-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <Badge variant="outline">{s.type}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Code:</span>
                  <span className="font-mono text-slate-200">{s.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Institution Type:</span>
                  <span className="text-slate-200 font-medium">{s.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'years' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">Academic Sessions & Term Schedules</h3>
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Academic Session</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {academicYears.length > 0 ? (
                academicYears.map((yr) => (
                  <tr key={yr.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-semibold text-slate-100">{yr.name}</td>
                    <td className="px-6 py-4">{new Date(yr.startDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">{new Date(yr.endDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      {yr.isCurrent ? (
                        <Badge variant="success">Current Active Session</Badge>
                      ) : (
                        <Badge variant="secondary">Scheduled</Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No academic years configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-bold text-slate-100">Role-Based Access Control (RBAC) Matrix</h3>
                <p className="text-xs text-slate-400">12 dedicated portal roles with fine-grained granular permissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r.role} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-red-500" />
                      {r.name}
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">{r.role}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Service Health & Database Architecture
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-slate-200 font-medium">Node.js Express TypeScript API Server</div>
                      <div className="text-xs text-slate-500">Port 5000 • Process Active</div>
                    </div>
                  </div>
                  <Badge variant="success">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-slate-200 font-medium">Prisma ORM Multi-Tenant Layer</div>
                      <div className="text-xs text-slate-500">PostgreSQL Schema Compatible • SQLite Engine Active</div>
                    </div>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-slate-200 font-medium">JWT Token Rotation & Lockout Guard</div>
                      <div className="text-xs text-slate-500">5-attempt failed password lockout (15m window)</div>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-slate-200 font-medium">Automated Immutable Audit Logging</div>
                      <div className="text-xs text-slate-500">Captures IP, User Agent, Endpoint & Mutation payloads</div>
                    </div>
                  </div>
                  <Badge variant="success">Capturing</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-100 mb-3">Application Metadata</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Application</span>
                  <span className="text-slate-200 font-medium">Noble Education ERP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Release Version</span>
                  <span className="font-mono text-slate-200">v1.0.0-PROD</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Frontend Stack</span>
                  <span className="text-slate-200">React 18 + Vite + Tailwind</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Backend Stack</span>
                  <span className="text-slate-200">Express + TypeScript + Prisma</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Brand Domain</span>
                  <span className="text-red-400 font-mono">nobleedu.in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
