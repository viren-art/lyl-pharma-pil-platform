import React from 'react';

interface ApprovalStatusCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'amber' | 'emerald' | 'violet' | 'rose';
}

export const ApprovalStatusCard: React.FC<ApprovalStatusCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-zinc-400">{title}</div>
        <div className={`text-2xl p-2 rounded-lg border ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
};