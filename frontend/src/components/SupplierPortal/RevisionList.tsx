import React from 'react';

interface Revision {
  id: number;
  pilId: number;
  productName: string;
  roundNumber: number;
  status: string;
  startedAt: string;
  dueDate: string;
  latestVersion?: number;
}

interface RevisionListProps {
  revisions: Revision[];
  onRevisionClick: (revision: Revision) => void;
}

export const RevisionList: React.FC<RevisionListProps> = ({ revisions, onRevisionClick }) => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending_supplier: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      supplier_review: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      internal_review: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending_supplier: 'Action Required',
      supplier_review: 'In Review',
      internal_review: 'Internal Review',
      approved: 'Approved',
    };
    return labels[status] || status;
  };

  const getDaysRemaining = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  if (revisions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-500 text-lg">No revisions found</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {revisions.map((revision) => {
        const daysRemaining = getDaysRemaining(revision.dueDate);
        const isOverdue = daysRemaining < 0;
        const isUrgent = daysRemaining <= 1 && daysRemaining >= 0;

        return (
          <div
            key={revision.id}
            onClick={() => onRevisionClick(revision)}
            className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] hover:border-violet-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                  {revision.productName}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-zinc-400">
                    Round {revision.roundNumber}
                  </span>
                  {revision.latestVersion && (
                    <span className="text-sm text-zinc-400">
                      • Version {revision.latestVersion}
                    </span>
                  )}
                </div>
              </div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(revision.status)}`}>
                {getStatusLabel(revision.status)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Started:</span>
                  <span className="text-zinc-300 ml-2">
                    {new Date(revision.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Due:</span>
                  <span className={`ml-2 font-semibold ${
                    isOverdue ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-zinc-300'
                  }`}>
                    {new Date(revision.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {revision.status === 'pending_supplier' && (
                <div className={`text-sm font-semibold ${
                  isOverdue ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                   isUrgent ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` :
                   `${daysRemaining} days remaining`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};