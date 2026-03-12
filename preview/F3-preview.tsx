export default function F3Preview() {
  const [activeTab, setActiveTab] = React.useState('lifecycle');
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [integrityStatus, setIntegrityStatus] = React.useState('verified');
  const [exportFormat, setExportFormat] = React.useState('json');

  const pilLifecycle = {
    pilId: 1247,
    productName: 'Amoxicillin 500mg Capsules',
    market: 'TFDA',
    integrityVerified: true,
    timeline: [
      {
        id: 1,
        timestamp: '2024-01-15T09:23:00Z',
        action: 'create',
        actor: 'Dr. Somchai Pattana',
        actorRole: 'Regulatory Specialist',
        details: 'Created PIL #1247 for Amoxicillin 500mg',
        metadata: { productName: 'Amoxicillin 500mg Capsules', market: 'TFDA' },
        eventHash: 'a3f5e8d9c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5',
        ipAddress: '203.154.89.142',
      },
      {
        id: 2,
        timestamp: '2024-01-15T09:45:00Z',
        action: 'translate',
        actor: 'AI Translation Engine',
        actorRole: 'System',
        details: 'Translated PIL to Traditional Chinese using GPT-4',
        metadata: {
          targetLanguage: 'zh-TW',
          confidenceScore: 94.2,
          llmModel: 'gpt-4-pharmaceutical-v2.1',
          processingTimeMs: 87340,
        },
        eventHash: 'b4e6f9d0c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6',
        ipAddress: '10.0.1.45',
      },
      {
        id: 3,
        timestamp: '2024-01-15T14:20:00Z',
        action: 'approve',
        actor: 'Dr. Siriwan Chaiyaporn',
        actorRole: 'Regulatory Reviewer',
        details: 'Approved translation quality gate',
        metadata: {
          gateType: 'translation',
          decision: 'approved',
          comments: 'Pharmaceutical terminology validated. Confidence score meets threshold.',
        },
        eventHash: 'c5f7g0e1d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7',
        ipAddress: '203.154.89.156',
      },
      {
        id: 4,
        timestamp: '2024-01-16T10:15:00Z',
        action: 'format',
        actor: 'Formatting Engine',
        actorRole: 'System',
        details: 'Formatted PIL to TFDA regulatory standards',
        metadata: {
          market: 'TFDA',
          formatVersion: '2024.1',
          validationPassed: true,
        },
        eventHash: 'd6g8h1f2e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8',
        ipAddress: '10.0.1.45',
      },
      {
        id: 5,
        timestamp: '2024-01-17T11:30:00Z',
        action: 'approve',
        actor: 'Pharm. Nattapong Srisuk',
        actorRole: 'Final Approver',
        details: 'Approved for regulatory submission',
        metadata: {
          gateType: 'final_submission',
          decision: 'approved',
          comments: 'All quality gates passed. Ready for TFDA submission.',
        },
        eventHash: 'e7h9i2g3f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9',
        ipAddress: '203.154.89.178',
      },
      {
        id: 6,
        timestamp: '2024-01-17T15:45:00Z',
        action: 'submit',
        actor: 'Dr. Somchai Pattana',
        actorRole: 'Regulatory Specialist',
        details: 'Submitted PIL package to TFDA',
        metadata: {
          market: 'TFDA',
          packagePath: 's3://lotus-pil-submissions/TFDA/2024/01/PIL-1247-submission.zip',
          submissionId: 'TFDA-2024-001247',
        },
        eventHash: 'f8i0j3h4g7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0',
        ipAddress: '203.154.89.142',
      },
    ],
    translationEvents: [
      {
        timestamp: '2024-01-15T09:45:00Z',
        targetLanguage: 'zh-TW',
        confidenceScore: 94.2,
        llmModel: 'gpt-4-pharmaceutical-v2.1',
        reviewer: 'Dr. Siriwan Chaiyaporn',
      },
    ],
    approvalEvents: [
      {
        timestamp: '2024-01-15T14:20:00Z',
        gateType: 'translation',
        approver: 'Dr. Siriwan Chaiyaporn',
        decision: 'approved',
        comments: 'Pharmaceutical terminology validated. Confidence score meets threshold.',
      },
      {
        timestamp: '2024-01-17T11:30:00Z',
        gateType: 'final_submission',
        approver: 'Pharm. Nattapong Srisuk',
        decision: 'approved',
        comments: 'All quality gates passed. Ready for TFDA submission.',
      },
    ],
    submissionEvent: {
      timestamp: '2024-01-17T15:45:00Z',
      submittedBy: 'Dr. Somchai Pattana',
      packagePath: 's3://lotus-pil-submissions/TFDA/2024/01/PIL-1247-submission.zip',
      submissionId: 'TFDA-2024-001247',
    },
  };

  const auditStats = {
    totalEvents: 6,
    integrityVerified: true,
    lastVerified: '2024-01-17T16:00:00Z',
    retentionPeriod: '10 years',
    encryptionStatus: 'AES-256 at rest, TLS 1.3 in transit',
    backupStatus: 'Multi-AZ with cross-region replication',
    rpo: '≤24 hours',
    rto: '≤8 hours',
  };

  const handleExport = () => {
    setShowExportModal(false);
    // Simulate export
    setTimeout(() => {
      alert(`Audit trail exported as ${exportFormat.toUpperCase()} to S3`);
    }, 500);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '📝',
      translate: '🌐',
      approve: '✅',
      format: '📋',
      submit: '📤',
      reject: '❌',
    };
    return icons[action] || '📌';
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      translate: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      approve: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      format: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      submit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      reject: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return colors[action] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Trail Repository</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Complete PIL lifecycle with cryptographic verification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">
                  Integrity Verified
                </span>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
              >
                📥 Export Trail
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* PIL Info Card */}
        <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">
                  {pilLifecycle.productName}
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  PIL #{pilLifecycle.pilId}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {pilLifecycle.market}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Regulatory submission tracking with immutable audit trail
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{auditStats.totalEvents}</div>
              <div className="text-xs text-zinc-400">Audit Events</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['lifecycle', 'translations', 'approvals', 'compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Lifecycle Timeline */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-4">
            {pilLifecycle.timeline.map((event, index) => (
              <div
                key={event.id}
                className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${getActionColor(
                        event.action
                      )}`}
                    >
                      {getActionIcon(event.action)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">
                          {event.details}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                          <span>{event.actor}</span>
                          <span>•</span>
                          <span className="text-zinc-500">{event.actorRole}</span>
                          <span>•</span>
                          <span>{formatTimestamp(event.timestamp)}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(
                          event.action
                        )}`}
                      >
                        {event.action.toUpperCase()}
                      </span>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/5">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-zinc-500">{key}:</span>{' '}
                              <span className="text-zinc-300 font-medium">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Event Hash:</span>
                        <code className="px-2 py-1 rounded bg-black/30 text-emerald-400 font-mono">
                          {event.eventHash.substring(0, 16)}...
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">IP:</span>
                        <span className="text-zinc-400">{event.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Translation Events */}
        {activeTab === 'translations' && (
          <div className="space-y-4">
            {pilLifecycle.translationEvents.map((event, index) => (
              <div
                key={index}
                className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      AI Translation to {event.targetLanguage}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {event.confidenceScore}%
                    </div>
                    <div className="text-xs text-zinc-500">Confidence</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">LLM Model</div>
                    <div className="text-sm font-medium text-white">
                      {event.llmModel}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Reviewed By</div>
                    <div className="text-sm font-medium text-white">{event.reviewer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Events */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {pilLifecycle.approvalEvents.map((event, index) => (
              <div
                key={index}
                className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                    ✅
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">
                          {event.gateType.replace('_', ' ').toUpperCase()} Gate
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Approved by {event.approver}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    {event.comments && (
                      <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/5">
                        <p className="text-sm text-zinc-300">{event.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compliance Stats */}
        {activeTab === 'compliance' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                  🔒
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Encryption</h3>
                  <p className="text-xs text-zinc-500">Data Protection</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">{auditStats.encryptionStatus}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xl">
                  ⏱️
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Retention</h3>
                  <p className="text-xs text-zinc-500">Regulatory Compliance</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">{auditStats.retentionPeriod}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl">
                  💾
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Backup</h3>
                  <p className="text-xs text-zinc-500">Disaster Recovery</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">{auditStats.backupStatus}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Recovery</h3>
                  <p className="text-xs text-zinc-500">RPO / RTO</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">
                RPO: {auditStats.rpo} • RTO: {auditStats.rto}
              </p>
            </div>

            <div className="col-span-2 bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Cryptographic Integrity
                  </h3>
                  <p className="text-xs text-zinc-500">Chain Verification</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-300">
                  All {auditStats.totalEvents} events verified with SHA-256 hash chain
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Last verified: {formatTimestamp(auditStats.lastVerified)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Export Audit Trail</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      exportFormat === 'json'
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      exportFormat === 'pdf'
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400">
                  ⚠️ Export will include all audit events with cryptographic verification
                  hashes
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
                >
                  Export to S3
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}