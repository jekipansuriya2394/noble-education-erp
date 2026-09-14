import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
}) => {
  return (
    <div className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-slate-100 transition-colors">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:border-brand-red group-hover:text-brand-red-light transition-all">
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {change && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {isPositive ? '+' : ''}{change}
          </span>
          <span className="text-slate-500">vs last month</span>
        </div>
      )}

      {/* Subtle bottom brand accent indicator on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-brand-red transition-all" />
    </div>
  );
};

export default StatsCard;
