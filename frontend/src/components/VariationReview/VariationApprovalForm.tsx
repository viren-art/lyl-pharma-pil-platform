import React, { useState } from 'react';

interface VariationApprovalFormProps {
  variationId: number;
  onApprove: (comments?: string) => void;
  onReject: (comments: string) => void;
  onClose: () => void;
}

export const VariationApprovalForm: React.FC<VariationApprovalFormProps> = ({
  variationId,
  onApprove,
  onReject,
  onClose,
}) => {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;

    if (decision === 'reject' && !comments.trim()) {
      alert('Rejection comments are required');
      return;
    }

    setSubmitting(true);

    try {
      if (decision === 'approve') {
        await onApprove(comments || undefined);
      } else {
        await onReject(comments);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting decision:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/[0.06] shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Review Variation Analysis</h3>

        {/* Decision Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setDecision('approve')}
            className={`py-4 rounded-xl font-semibold transition-all ${
              decision === 'approve'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            ✅ Approve Analysis
          </button>
          <button
            onClick={() => setDecision('reject')}
            className={`py-4 rounded-xl font-semibold transition-all ${
              decision === 'reject'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            ❌ Reject Analysis
          </button>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-400 mb-2">
            Comments {decision === 'reject' && <span className="text-rose-400">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              decision === 'reject'
                ? 'Please explain why this variation analysis is being rejected...'
                : 'Optional comments about this variation analysis...'
            }
            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-700 text-white rounded-xl font-semibold hover:bg-zinc-600 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || submitting}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              decision && !submitting
                ? decision === 'approve'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Decision'}
          </button>
        </div>
      </div>
    </div>
  );
};