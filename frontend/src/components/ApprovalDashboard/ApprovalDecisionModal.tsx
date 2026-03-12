import React, { useState } from 'react';

interface PendingApproval {
  gateId: number;
  pilId: number;
  productName: string;
  gateType: string;
  market: string;
  assignedAt: string;
  priority: 'urgent' | 'normal' | 'low';
}

interface ApprovalDecisionModalProps {
  approval: PendingApproval;
  onClose: () => void;
  onSubmit: (decision: 'approved' | 'rejected', comments?: string) => void;
}

export const ApprovalDecisionModal: React.FC<ApprovalDecisionModalProps> = ({
  approval,
  onClose,
  onSubmit,
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = () => {
    if (!decision) return;
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (decision) {
      onSubmit(decision, comments);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Approval Decision</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* PIL Details */}
          <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white mb-4">PIL Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 mb-1">Product Name</div>
                <div className="text-white font-medium">{approval.productName}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">PIL ID</div>
                <div className="text-white font-medium">#{approval.pilId}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Gate Type</div>
                <div className="text-white font-medium capitalize">
                  {approval.gateType.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Market</div>
                <div className="text-white font-medium">{approval.market}</div>
              </div>
            </div>
          </div>

          {/* Decision Selection */}
          {!showConfirmation && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Your Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDecision('approved')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      decision === 'approved'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-zinc-800/50 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">✅</div>
                    <div className="font-semibold text-white">Approve</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      PIL meets all requirements
                    </div>
                  </button>

                  <button
                    onClick={() => setDecision('rejected')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      decision === 'rejected'
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-white/10 bg-zinc-800/50 hover:border-rose-500/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">❌</div>
                    <div className="font-semibold text-white">Reject</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Requires revision
                    </div>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Comments {decision === 'rejected' && <span className="text-rose-400">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    decision === 'rejected'
                      ? 'Please provide detailed feedback on required changes...'
                      : 'Optional: Add any additional notes...'
                  }
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!decision || (decision === 'rejected' && !comments.trim())}
                  className="flex-1 px-6 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl font-semibold transition-colors"
                >
                  Submit Decision
                </button>
              </div>
            </>
          )}

          {/* Confirmation */}
          {showConfirmation && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-amber-400 mb-1">Confirm Your Decision</h4>
                    <p className="text-sm text-amber-300/80">
                      {decision === 'approved'
                        ? 'This PIL will proceed to the next approval stage or submission.'
                        : 'This PIL will be sent back for revision with your feedback.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/[0.06]">
                <div className="text-sm text-zinc-400 mb-2">Decision Summary</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Status:</span>
                    <span
                      className={`font-semibold ${
                        decision === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {decision === 'approved' ? 'APPROVED' : 'REJECTED'}
                    </span>
                  </div>
                  {comments && (
                    <div>
                      <div className="text-zinc-500 mb-1">Comments:</div>
                      <div className="text-white text-sm bg-zinc-900/50 rounded-lg p-3">
                        {comments}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                    decision === 'approved'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};