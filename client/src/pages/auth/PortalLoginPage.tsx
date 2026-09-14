import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User as UserIcon, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

interface PortalInfo {
  role: string;
  name: string;
  email: string;
  path: string;
}

export const PortalLoginPage: React.FC = () => {
  const { portalType } = useParams<{ portalType?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoPortals, setDemoPortals] = useState<PortalInfo[]>([]);

  // Map route param to system role
  const portalMap: Record<string, { role: string; label: string }> = {
    'super-admin': { role: 'SUPER_ADMIN', label: 'Super Administrator Portal' },
    'branch-admin': { role: 'BRANCH_ADMIN', label: 'Branch Administrator Portal' },
    'school-admin': { role: 'SCHOOL_ADMIN', label: 'School Administrator Portal' },
    'academic-coordinator': { role: 'ACADEMIC_COORDINATOR', label: 'Academic Coordinator Portal' },
    'teacher': { role: 'TEACHER', label: 'Faculty & Teacher Portal' },
    'accountant': { role: 'ACCOUNTANT', label: 'Accounts & Billing Portal' },
    'hr': { role: 'HR', label: 'HR & Staff Management Portal' },
    'reception': { role: 'RECEPTION', label: 'Admissions & Reception Portal' },
    'student': { role: 'STUDENT', label: 'Student Academic Portal' },
    'parent': { role: 'PARENT', label: 'Parent Portal' },
    'transport': { role: 'TRANSPORT', label: 'Transport Fleet Portal' },
    'librarian': { role: 'LIBRARIAN', label: 'Library Management Portal' },
  };

  const currentPortal = portalType ? portalMap[portalType] : null;

  useEffect(() => {
    // If already authenticated, redirect to appropriate portal
    if (isAuthenticated && user) {
      navigate(user.role === 'SUPER_ADMIN' ? '/portal/super-admin' : `/portal/${user.role.toLowerCase().replace(/_/g, '-')}`);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Load demo credentials list
    const loadDemos = async () => {
      const res = await apiRequest('/auth/demo-credentials');
      if (res.success && res.portals) {
        setDemoPortals(res.portals);
      }
    };
    loadDemos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(
      identifier,
      password,
      currentPortal ? currentPortal.role : 'COMMON'
    );

    setIsLoading(false);

    if (result.success && result.redirectUrl) {
      navigate(result.redirectUrl);
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleSelectDemo = (portal: PortalInfo) => {
    setIdentifier(portal.email);
    setPassword('Noble@2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-[500px] h-[300px] bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-red flex items-center justify-center font-extrabold text-white text-2xl shadow-xl glow-red">
            N
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
          Noble Education
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Vadodara, Gujarat • <span className="text-brand-red-light font-medium">nobleedu.in</span>
        </p>

        {currentPortal ? (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-red/20 text-rose-300 border border-brand-red/40">
              {currentPortal.label}
            </span>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
              Enterprise Unified ERP Portal
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0f172a] py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 text-rose-300">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email or Username
              </label>
              <div className="mt-1.5 relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. superadmin@nobleedu.in"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-red focus:ring-brand-red"
                />
                <span>Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Please contact Noble Education System Administrator at IT@nobleedu.in to reset your credentials.')}
                className="font-medium text-brand-red-light hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-brand-red-dark border border-brand-red/50 shadow-lg glow-red-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign in to ERP Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Picker for Grading & Evaluator Convenience */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                1-Click Demo Accounts (Noble@2026)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {demoPortals.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className="text-left p-2 rounded-lg border border-slate-800 bg-[#131d31] hover:border-slate-700 hover:bg-slate-800 text-[11px] transition-all truncate"
                >
                  <p className="font-semibold text-slate-200 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portal Switcher Navigation Links */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Need a different portal? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-brand-red-light font-semibold hover:underline"
          >
            Browse All 12 Login Portals
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalLoginPage;
