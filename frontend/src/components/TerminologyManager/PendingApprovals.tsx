import React, { useState, useEffect } from 'react';

interface PendingTerm {
  id: number;
  sourceTerm: string;
  targetTerm: string;
  targetLanguage: string;
  marketApplicability: string;
  createdAt: Date;
}

interface PendingApprovalsProps {
  targetLanguage: string;
  market: string;
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  targetLanguage,
  market
}) => {
  const [pending, setPending] = useState<PendingTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchPending();
  }, [targetLanguage, market]);

  const fetchPending = async () => {
    try {
      const response = await fetch(
        `/api/v1/translation-memory/pending?targetLanguage=${targetLanguage}&market=${market}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setPending(data.terms);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (termId: number, approved: boolean) => {
    try {
      const response = await fetch(`/api/v1/translation-memory/terms/${termId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          approved,
          reviewerComments: reviewComments[termId] || ''
        })
      });

      if (response.ok) {
        fetchPending();
        setReviewComments((prev) => {
          const updated = { ...prev };
          delete updated[termId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to review term:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
        <p className="text-zinc-400">Loading pending approvals...</p>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
        <p className="text-zinc-400">No pending term approvals</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Pending Term Approvals</h2>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium">
          {pending.length} pending
        </span>
      </div>

      {pending.map((term) => (
        <div
          key={term.id}
          className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold">{term.sourceTerm}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-lg font-semibold text-violet-400">
                  {term.targetTerm}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>{term.targetLanguage}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  {term.marketApplicability}
                </span>
                <span>Submitted {new Date(term.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={reviewComments[term.id] || ''}
              onChange={(e) =>
                setReviewComments((prev) => ({ ...prev, [term.id]: e.target.value }))
              }
              placeholder="Reviewer comments (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleReview(term.id, true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReview(term.id, false)}
                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};