import React from 'react';

interface ConfidenceScoreCardProps {
  score: number;
}

export const ConfidenceScoreCard: React.FC<ConfidenceScoreCardProps> = ({
  score,
}) => {
  const getScoreColor = (): string => {
    if (score >= 95) return 'text-emerald-400';
    if (score >= 85) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreLabel = (): string => {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    return 'Needs Review';
  };

  const getProgressColor = (): string => {
    if (score >= 95) return 'bg-emerald-500';
    if (score >= 85) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="px-5 py-3 rounded-xl bg-zinc-800/50 border border-white/[0.06]">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-zinc-400 font-medium">Overall Confidence</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${getScoreColor()}`}>
              {score}%
            </span>
            <span className="text-xs text-zinc-500">{getScoreLabel()}</span>
          </div>
        </div>
        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};