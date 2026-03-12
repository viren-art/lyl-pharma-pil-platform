import React from 'react';

interface PendingApproval {
  gateId: number;
  pilId: number;
  productName: string;
  gateType: string;
  market: string;
  assignedAt: string;
  priority: 'urgent' | 'normal' | 'low';
}

interface ApprovalQueueProps {
  approvals: PendingApproval[];
  onApprovalClick: (approval: PendingApproval) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approvals, onApprovalClick }) => {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'normal':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getGateTypeLabel = (gateType: string): string => {
    const labels: Record<string, string> = {
      translation: 'Translation Review',
      regulatory: 'Regulatory Review',
      artwork: 'Artwork Review',
      final_submission: 'Final Submission',
    };
    return labels[gateType] || gateType;
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
        <p className="text-zinc-400">No pending approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Pending Approvals</h2>

      <div className="space-y-3">
        {approvals.map((approval) => (
          <div
            key={approval.gateId}
            onClick={() => onApprovalClick(approval)}
            className="bg-zinc-800/50 rounded-xl p-5 border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
                    {approval.productName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                      approval.priority
                    )}`}
                  >
                    {approval.priority.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">📋
</span>
                    PIL #{approval.pilId}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">🏷️</span>
                    {getGateTypeLabel(approval.gateType)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">🌏</span>
                    {approval.market}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">⏰</span>
                    {getTimeAgo(approval.assignedAt)}
                  </span>
                </div>
              </div>

              <button className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-semibold transition-colors">
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};