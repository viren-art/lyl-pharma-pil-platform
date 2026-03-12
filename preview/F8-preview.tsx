export default function F8Preview() {
  const [activeTab, setActiveTab] = React.useState('queue');
  const [selectedApproval, setSelectedApproval] = React.useState(null);
  const [showDecisionModal, setShowDecisionModal] = React.useState(false);
  const [decision, setDecision] = React.useState(null);
  const [comments, setComments] = React.useState('');
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingApprovals, setPendingApprovals] = React.useState([
    {
      gateId: 1,
      pilId: 101,
      productName: 'Paracetamol 500mg',
      gateType: 'regulatory',
      market: 'TFDA',
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: 'urgent',
    },
    {
      gateId: 2,
      pilId: 102,
      productName: 'Ibuprofen 400mg',
      gateType: 'translation',
      market: 'FDA_Thailand',
      assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      priority: 'normal',
    },
    {
      gateId: 3,
      pilId: 103,
      productName: 'Amoxicillin 250mg',
      gateType: 'final_submission',
      market: 'DAV',
      assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priority: 'normal',
    },
    {
      gateId: 4,
      pilId: 104,
      productName: 'Metformin 850mg',
      gateType: 'artwork',
      market: 'TFDA',
      assignedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      priority: 'low',
    },
  ]);

  const [stats, setStats] = React.useState({
    pending: 4,
    approvedToday: 7,
    avgResponseTime: '2.5h',
  });

  const [workflowHistory, setWorkflowHistory] = React.useState([
    {
      id: 1,
      pilId: 99,
      productName: 'Aspirin 100mg',
      decision: 'approved',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      gateType: 'regulatory',
    },
    {
      id: 2,
      pilId: 98,
      productName: 'Omeprazole 20mg',
      decision: 'approved',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      gateType: 'translation',
    },
    {
      id: 3,
      pilId: 97,
      productName: 'Atorvastatin 10mg',
      decision: 'rejected',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      gateType: 'final_submission',
    },
  ]);

  const getPriorityColor = (priority) => {
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

  const getGateTypeLabel = (gateType) => {
    const labels = {
      translation: 'Translation Review',
      regulatory: 'Regulatory Review',
      artwork: 'Artwork Review',
      final_submission: 'Final Submission',
    };
    return labels[gateType] || gateType;
  };

  const getTimeAgo = (timestamp) => {
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

  const handleApprovalClick = (approval) => {
    setSelectedApproval(approval);
    setShowDecisionModal(true);
    setDecision(null);
    setComments('');
    setShowConfirmation(false);
  };

  const handleSubmit = () => {
    if (!decision) return;
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setPendingApprovals((prev) => prev.filter((a) => a.gateId !== selectedApproval.gateId));
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - 1,
      approvedToday: decision === 'approved' ? prev.approvedToday + 1 : prev.approvedToday,
    }));
    setWorkflowHistory((prev) => [
      {
        id: Date.now(),
        pilId: selectedApproval.pilId,
        productName: selectedApproval.productName,
        decision,
        timestamp: new Date().toISOString(),
        gateType: selectedApproval.gateType,
      },
      ...prev,
    ]);
    setShowDecisionModal(false);
    setSelectedApproval(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Approval Workflow</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Review and approve PIL submissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-400">
                Logged in as <span className="text-white font-medium">Dr. Sarah Chen</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center font-semibold">
                SC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'queue'
                ? 'text-violet-400 border-b-2 border-violet-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Approval Queue
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-violet-400 border-b-2 border-violet-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-zinc-400">Pending Approvals</div>
                  <div className="text-2xl p-2 rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20">
                    ⏳
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.pending}</div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-zinc-400">Approved Today</div>
                  <div className="text-2xl p-2 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    ✅
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.approvedToday}</div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-zinc-400">Avg Response Time</div>
                  <div className="text-2xl p-2 rounded-lg border bg-violet-500/10 text-violet-400 border-violet-500/20">
                    ⚡
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.avgResponseTime}</div>
              </div>
            </div>

            {/* Approval Queue */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Pending Approvals</h2>

              {pendingApprovals.length === 0 ? (
                <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-zinc-400">No pending approvals at the moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.gateId}
                      onClick={() => handleApprovalClick(approval)}
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
                              <span className="text-zinc-500">📋</span>
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
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Recent Decisions</h2>

            <div className="space-y-3">
              {workflowHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-800/50 rounded-xl p-5 border border-white/[0.06]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {item.productName}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            item.decision === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {item.decision === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-500">📋</span>
                          PIL #{item.pilId}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-500">🏷️</span>
                          {getGateTypeLabel(item.gateType)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-500">⏰</span>
                          {getTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-white/[0.06] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Approval Decision</h2>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors text-2xl"
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
                    <div className="text-white font-medium">{selectedApproval.productName}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">PIL ID</div>
                    <div className="text-white font-medium">#{selectedApproval.pilId}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Gate Type</div>
                    <div className="text-white font-medium capitalize">
                      {selectedApproval.gateType.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Market</div>
                    <div className="text-white font-medium">{selectedApproval.market}</div>
                  </div>
                </div>
              </div>

              {!showConfirmation && (
                <>
                  {/* Decision Selection */}
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
                        <div className="text-xs text-zinc-400 mt-1">Requires revision</div>
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
                      onClick={() => setShowDecisionModal(false)}
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

              {showConfirmation && (
                <div className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div>
                        <h4 className="font-semibold text-amber-400 mb-1">
                          Confirm Your Decision
                        </h4>
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
      )}
    </div>
  );
}