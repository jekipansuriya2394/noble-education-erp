import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  LogOut,
  PlusCircle,
  Search,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface TopbarProps {
  onOpenQuickStudent?: () => void;
  onOpenQuickInquiry?: () => void;
  onOpenQuickFee?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickStudent,
  onOpenQuickInquiry,
  onOpenQuickFee,
}) => {
  const { user, logout } = useAuth();
  const { schools, activeSchool, selectSchool } = useTenant();
  const navigate = useNavigate();
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: School / Campus Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e293b] border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <Building2 className="w-4 h-4 text-brand-red-light" />
            <span className="max-w-[200px] truncate">
              {activeSchool ? activeSchool.name : 'Select School'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showSchoolDropdown && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                Institutes & Schools
              </div>
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => {
                    selectSchool(school);
                    setShowSchoolDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between ${
                    activeSchool?.id === school.id
                      ? 'bg-slate-800 text-brand-red-light font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className="truncate">{school.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal ml-2">{school.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-400 font-medium">
          <span>Vadodara, Gujarat</span>
          <span className="mx-2">•</span>
          <span className="text-brand-red-light font-semibold">nobleedu.in</span>
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-semibold shadow-md glow-red-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {showQuickActions && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  navigate('/students');
                  if (onOpenQuickStudent) onOpenQuickStudent();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Add Student Admission</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  navigate('/admissions');
                  if (onOpenQuickInquiry) onOpenQuickInquiry();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>New Inquiry / Lead</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  navigate('/fees');
                  if (onOpenQuickFee) onOpenQuickFee();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Collect Fee Payment</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/campus')}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Announcements & Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red ring-2 ring-[#0f172a]" />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* User Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-[#1e293b] hover:bg-rose-950/40 hover:border-rose-800/60 text-xs font-medium text-slate-300 hover:text-rose-300 transition-all"
          title="Sign out of ERP"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
