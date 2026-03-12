import React from 'react';

interface PerformanceMetrics {
  qualityScore: number;
  avgTurnaroundHours: number;
  avgRevisionRounds: number;
  onTimeDeliveryRate: number;
}

interface PerformanceCardProps {
  metrics: PerformanceMetrics;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ metrics }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 85) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 70) return 'from-amber-500/20 to-amber-500/5';
    return 'from-rose-500/20 to-rose-500/5';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Quality Score */}
      <div className={`bg-gradient-to-br ${getScoreGradient(metrics.qualityScore)} rounded-2xl p-5 border border-white/[0.06]`}>
        <div className="text-sm text-zinc-400 mb-2">Quality Score</div>
        <div className={`text-3xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
          {metrics.qualityScore.toFixed(1)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">out of 100</div>
      </div>

      {/* Avg Turnaround */}
      <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
        <div className="text-sm text-zinc-400 mb-2">Avg Turnaround</div>
        <div className="text-3xl font-bold text-cyan-400">
          {metrics.avgTurnaroundHours.toFixed(1)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">hours</div>
      </div>

      {/* Avg Revision Rounds */}
      <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
        <div className="text-sm text-zinc-400 mb-2">Avg Rounds</div>
        <div className={`text-3xl font-bold ${
          metrics.avgRevisionRounds <= 3 ? 'text-emerald-400' : 
          metrics.avgRevisionRounds <= 4 ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {metrics.avgRevisionRounds.toFixed(1)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">target: 3-4</div>
      </div>

      {/* On-Time Delivery */}
      <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
        <div className="text-sm text-zinc-400 mb-2">On-Time Delivery</div>
        <div className={`text-3xl font-bold ${getScoreColor(metrics.onTimeDeliveryRate)}`}>
          {metrics.onTimeDeliveryRate.toFixed(1)}%
        </div>
        <div className="text-xs text-zinc-500 mt-1">of revisions</div>
      </div>
    </div>
  );
};