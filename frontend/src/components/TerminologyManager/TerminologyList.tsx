import React, { useState } from 'react';

interface Term {
  id: number;
  sourceTerm: string;
  targetTerm: string;
  sourceLanguage: string;
  targetLanguage: string;
  marketApplicability: string;
  usageCount: number;
  approvedAt: Date | null;
}

interface TerminologyListProps {
  terms: Term[];
  canOverride: boolean;
  onOverride: (termId: number, newTargetTerm: string, justification: string) => void;
}

export const TerminologyList: React.FC<TerminologyListProps> = ({
  terms,
  canOverride,
  onOverride
}) => {
  const [overrideTermId, setOverrideTermId] = useState<number | null>(null);
  const [newTargetTerm, setNewTargetTerm] = useState('');
  const [justification, setJustification] = useState('');

  const handleOverrideSubmit = (termId: number) => {
    if (newTargetTerm.trim() && justification.trim()) {
      onOverride(termId, newTargetTerm, justification);
      setOverrideTermId(null);
      setNewTargetTerm('');
      setJustification('');
    }
  };

  if (terms.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
        <p className="text-zinc-400">No terms found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {terms.map((term) => (
        <div
          key={term.id}
          className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] hover:border-white/10 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold">{term.sourceTerm}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-lg font-semibold text-violet-400">
                  {term.targetTerm}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>
                  {term.sourceLanguage} → {term.targetLanguage}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  {term.marketApplicability}
                </span>
                <span>Used {term.usageCount} times</span>
                {term.approvedAt && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium">
                    ✓ Approved
                  </span>
                )}
              </div>
            </div>

            {canOverride && term.approvedAt && (
              <button
                onClick={() => setOverrideTermId(term.id)}
                className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors"
              >
                Override
              </button>
            )}
          </div>

          {overrideTermId === term.id && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <input
                type="text"
                value={newTargetTerm}
                onChange={(e) => setNewTargetTerm(e.target.value)}
                placeholder="New target term"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Justification for override (required for audit trail)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleOverrideSubmit(term.id)}
                  disabled={!newTargetTerm.trim() || !justification.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Submit Override
                </button>
                <button
                  onClick={() => {
                    setOverrideTermId(null);
                    setNewTargetTerm('');
                    setJustification('');
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};