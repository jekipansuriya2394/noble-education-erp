import React, { useState, useEffect } from 'react';
import { Library, Bus, Megaphone, PlusCircle, BookCheck, MapPin, AlertCircle } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const CampusPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [activeTab, setActiveTab] = useState<'library' | 'transport' | 'announcements'>('library');
  const [books, setBooks] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<any>({ vehicles: [], routes: [] });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);

  // Announcement form
  const [announceForm, setAnnounceForm] = useState({
    title: '',
    content: '',
    targetScope: 'ORGANIZATION',
    priority: 'IMPORTANT',
  });

  const loadCampus = async () => {
    const [bkRes, trRes, anRes] = await Promise.all([
      apiRequest('/campus/books', { params: { schoolId: activeSchool?.id } }),
      apiRequest('/campus/transport', { params: { schoolId: activeSchool?.id } }),
      apiRequest('/campus/announcements'),
    ]);

    if (bkRes.success) setBooks(bkRes.books || []);
    if (trRes.success) setTransportData(trRes);
    if (anRes.success) setAnnouncements(anRes.announcements || []);
  };

  useEffect(() => {
    loadCampus();
  }, [activeSchool]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/campus/announcements', {
      method: 'POST',
      body: JSON.stringify(announceForm),
    });

    if (res.success) {
      alert('Announcement broadcasted campus-wide!');
      setIsAnnounceModalOpen(false);
      loadCampus();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Campus Services & Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Library book lending, school bus transport routes across Vadodara, and campus notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'announcements' && (
            <button
              onClick={() => setIsAnnounceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-bold shadow-md glow-red-sm transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'library' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>Library Catalog ({books.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transport')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'transport' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Bus Fleet & Routes ({transportData.routes?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'announcements' ? 'border-brand-red text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements & Circulars ({announcements.length})</span>
        </button>
      </div>

      {/* Tab 1: Library */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Concepts of Physics (Vol 1 & 2)', author: 'Dr. H.C. Verma', category: 'PHYSICS', available: 8, total: 10, isbn: '978-8177091878' },
            { title: 'Higher Algebra for JEE', author: 'Hall & Knight', category: 'MATHEMATICS', available: 4, total: 5, isbn: '978-9351441861' },
            { title: 'Organic Chemistry Principles', author: 'Morrison & Boyd', category: 'CHEMISTRY', available: 5, total: 6, isbn: '978-8131704813' },
            { title: 'Objective Biology for NEET', author: 'Trueman', category: 'BIOLOGY', available: 6, total: 8, isbn: '978-8187223610' },
            { title: 'NCERT Class 10 Exemplar Problems', author: 'NCERT Editorial', category: 'NCERT', available: 12, total: 15, isbn: '978-9350071984' },
            { title: 'Gujarat State Board Chemistry', author: 'GSEB Textbook Board', category: 'GSEB', available: 18, total: 20, isbn: '978-9382103429' },
          ].map((b) => (
            <div key={b.title} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="neutral">{b.category}</Badge>
                  <span className="text-[10px] text-slate-500 font-mono">ISBN: {b.isbn}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{b.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">By {b.author}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Stock: <strong className="text-emerald-400">{b.available}</strong> / {b.total}
                </span>
                <button
                  onClick={() => alert(`Issuing book "${b.title}" to student.`)}
                  className="px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg"
                >
                  Issue Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Transport */}
      {activeTab === 'transport' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Route 1: Alkapuri Hub to Manjalpur', stops: 'Akota Bridge → RC Dutt Road → Tarsali → Eva Mall', driver: 'Rameshbhai Baria', bus: 'GJ-06-AX-4819', capacity: 40 },
            { name: 'Route 2: Karelibaug Campus to Harni', stops: 'Bright Day → Sangam Crossroad → Amit Nagar → Airport Circle', driver: 'Maheshbhai Solanki', bus: 'GJ-06-BX-1290', capacity: 35 },
            { name: 'Route 3: Vasna Bhayli Coaching Shuttle', stops: 'Gokul Dham → Nilamber Circle → Sun Pharma Road → Alkapuri', driver: 'Sureshbhai Rathod', bus: 'GJ-06-CX-9842', capacity: 45 },
          ].map((r) => (
            <div key={r.name} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{r.name}</h4>
                <Badge variant="info">{r.bus}</Badge>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-red-light shrink-0" />
                  <span>Stops: {r.stops}</span>
                </p>
                <p>Driver: <strong className="text-slate-300">{r.driver}</strong> • Capacity: {r.capacity} Seats</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {[
            { title: 'National Science Olympiad Registration Open', content: 'Students from Grades 8 through 12 Science are eligible. Register before Sep 30 with faculty.', priority: 'IMPORTANT', date: 'Today' },
            { title: 'JEE Main & Advanced Doubt Clearing Clinic', content: 'Special Saturday workshop at Alkapuri Main Campus from 03:00 PM to 06:00 PM.', priority: 'NORMAL', date: 'Yesterday' },
            { title: 'Term 1 Fee Payment Advisory', content: 'Parents are requested to settle second installment dues before October 15 to avoid late fees.', priority: 'URGENT', date: '3 days ago' },
          ].map((a) => (
            <div key={a.title} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{a.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={a.priority === 'URGENT' ? 'danger' : 'warning'}>{a.priority}</Badge>
                  <span className="text-[11px] text-slate-500">{a.date}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        title="Broadcast Campus Announcement"
        subtitle="Publish institutional notices across student, parent, and teacher portals"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Circular Title *</label>
            <input
              type="text"
              required
              value={announceForm.title}
              onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Priority Level</label>
              <select
                value={announceForm.priority}
                onChange={(e) => setAnnounceForm({ ...announceForm, priority: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="NORMAL">Normal Notice</option>
                <option value="IMPORTANT">Important Notice</option>
                <option value="URGENT">Urgent Circular</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Target Audience</label>
              <select
                value={announceForm.targetScope}
                onChange={(e) => setAnnounceForm({ ...announceForm, targetScope: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="ORGANIZATION">Entire Noble Education Network</option>
                <option value="SCHOOL">Selected School Only</option>
                <option value="CLASS">Specific Grade Level</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Notice Body *</label>
            <textarea
              rows={4}
              required
              value={announceForm.content}
              onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAnnounceModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white shadow-md glow-red-sm"
            >
              Publish Circular
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampusPage;
