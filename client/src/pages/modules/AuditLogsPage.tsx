import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, User } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { apiRequest } from '../../api/client';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    const res = await apiRequest('/audit/logs', {
      params: {
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
      },
    });

    if (res.success && res.logs) {
      setLogs(res.logs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [moduleFilter, actionFilter]);

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (l) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(l.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (l) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          CREATE: 'success',
          UPDATE: 'info',
          DELETE: 'danger',
          LOGIN: 'neutral',
          APPROVE: 'success',
          REJECT: 'danger',
        };
        return <Badge variant={variants[l.action] || 'neutral'}>{l.action}</Badge>;
      },
    },
    {
      key: 'module',
      header: 'System Module',
      render: (l) => <span className="text-xs font-bold text-slate-200">{l.module}</span>,
    },
    {
      key: 'user',
      header: 'Actor',
      render: (l) => (
        <span className="text-xs text-slate-300">
          {l.user ? `${l.user.firstName} ${l.user.lastName} (@${l.user.username})` : 'System Daemon'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Mutation Details',
      render: (l) => (
        <span className="text-xs font-mono text-slate-400 truncate max-w-xs block" title={l.details}>
          {l.details || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Audit & Event Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log recording authentication attempts, financial transactions, and academic data modifications
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1">Modules:</span>
        {['ALL', 'AUTH', 'STUDENTS', 'FEES', 'PAYROLL', 'ATTENDANCE', 'TIMETABLE'].map((m) => (
          <button
            key={m}
            onClick={() => setModuleFilter(m)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              moduleFilter === m
                ? 'bg-brand-red text-white'
                : 'bg-[#0f172a] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Logs DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit events by user, action, module..."
        searchKey="module"
      />
    </div>
  );
};

export default AuditLogsPage;
