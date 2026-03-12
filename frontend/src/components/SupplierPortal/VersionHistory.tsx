import React from 'react';

interface ArtworkVersion {
  id: number;
  versionNumber: number;
  artworkPath: string;
  visualDiffPath?: string;
  status: string;
  uploadedBy: string;
  createdAt: string;
  notes?: string;
}

interface VersionHistoryProps {
  versions: ArtworkVersion[];
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions }) => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      uploaded: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      under_review: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      uploaded: 'Uploaded',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  };

  if (versions.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] text-center">
        <div className="text-zinc-400 text-lg">No versions uploaded yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version, index) => (
        <div
          key={version.id}
          className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-white">
                  Version {version.versionNumber}
                </h3>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(version.status)}`}>
                  {getStatusLabel(version.status)}
                </div>
                {index === 0 && (
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    Latest
                  </div>
                )}
              </div>
              <div className="text-sm text-zinc-400">
                Uploaded by {version.uploadedBy} •{' '}
                {new Date(version.createdAt).toLocaleString()}
              </div>
              {version.notes && (
                <div className="mt-3 text-sm text-zinc-300 bg-zinc-900/50 rounded-xl p-3">
                  {version.notes}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm">
              📄 View PDF
            </button>
            {version.visualDiffPath && (
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-xl transition-colors text-sm">
                🔍 View Changes
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};