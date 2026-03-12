export default function F9Preview() {
  const [activeTab, setActiveTab] = React.useState('active');
  const [selectedRevision, setSelectedRevision] = React.useState(null);
  const [commentText, setCommentText] = React.useState('');
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);

  const revisions = [
    {
      id: 1,
      pilName: 'Paracetamol 500mg Tablets',
      pilCode: 'PIL-2024-001',
      roundNumber: 3,
      status: 'pending_supplier',
      dueDate: '2024-02-15',
      versions: 2,
      unreadComments: 3,
      lastActivity: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      pilName: 'Amoxicillin 250mg Capsules',
      pilCode: 'PIL-2024-008',
      roundNumber: 1,
      status: 'internal_review',
      dueDate: '2024-02-20',
      versions: 1,
      unreadComments: 0,
      lastActivity: '1 day ago',
      priority: 'medium'
    },
    {
      id: 3,
      pilName: 'Ibuprofen 400mg Tablets',
      pilCode: 'PIL-2024-012',
      roundNumber: 2,
      status: 'supplier_review',
      dueDate: '2024-02-18',
      versions: 3,
      unreadComments: 5,
      lastActivity: '30 minutes ago',
      priority: 'high'
    }
  ];

  const artworkVersions = [
    {
      id: 1,
      version: 3,
      uploadedBy: 'สมชาย วงศ์ประเสริฐ',
      uploadedAt: '2024-02-10 14:30',
      status: 'under_review',
      fileSize: '2.4 MB',
      hasDiff: true,
      notes: 'Updated dosage instructions and warning section per feedback'
    },
    {
      id: 2,
      version: 2,
      uploadedBy: 'สุภาพ ชัยวัฒน์',
      uploadedAt: '2024-02-08 10:15',
      status: 'rejected',
      fileSize: '2.3 MB',
      hasDiff: true,
      notes: 'Initial revision with updated branding'
    },
    {
      id: 3,
      version: 1,
      uploadedBy: 'สมชาย วงศ์ประเสริฐ',
      uploadedAt: '2024-02-05 16:45',
      status: 'rejected',
      fileSize: '2.2 MB',
      hasDiff: false,
      notes: 'First draft submission'
    }
  ];

  const comments = [
    {
      id: 1,
      author: 'ดร.วิชัย สุขสันต์',
      role: 'Regulatory Reviewer',
      content: 'The dosage section needs to be more prominent. Please increase font size to 12pt minimum.',
      type: 'change_request',
      timestamp: '2024-02-10 15:45',
      section: 'Page 2, Dosage section',
      isInternal: false,
      replies: 2
    },
    {
      id: 2,
      author: 'สมชาย วงศ์ประเสริฐ',
      role: 'Supplier Designer',
      content: 'Acknowledged. Will update in next version.',
      type: 'general',
      timestamp: '2024-02-10 16:00',
      section: null,
      isInternal: false,
      parentId: 1
    },
    {
      id: 3,
      author: 'นางสาวปิยะนุช แสงทอง',
      role: 'Quality Assurance',
      content: 'Warning symbols must comply with ISO 7010 standard. Current symbols are non-standard.',
      type: 'change_request',
      timestamp: '2024-02-10 16:30',
      section: 'Page 1, Warning section',
      isInternal: false,
      replies: 0
    },
    {
      id: 4,
      author: 'ดร.วิชัย สุขสันต์',
      role: 'Regulatory Reviewer',
      content: 'Internal note: Check with legal team on disclaimer wording',
      type: 'general',
      timestamp: '2024-02-10 17:00',
      section: null,
      isInternal: true,
      replies: 0
    }
  ];

  const performanceMetrics = {
    avgTurnaround: '18.5 hours',
    firstTimeApproval: '72%',
    onTimeDelivery: '94%',
    qualityScore: 87,
    totalRevisions: 24,
    avgRounds: 2.3
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_supplier: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      internal_review: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      supplier_review: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      rejected: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      under_review: 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
    };

    const labels = {
      pending_supplier: 'Pending Upload',
      internal_review: 'Internal Review',
      supplier_review: 'Supplier Review',
      approved: 'Approved',
      rejected: 'Rejected',
      under_review: 'Under Review'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    setUploadSuccess(true);
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadSuccess(false);
      setSelectedFile(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Supplier Collaboration Portal</h1>
                <p className="text-sm text-zinc-400">Artwork Review & Feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-white">บริษัท ดีไซน์ พลัส จำกัด</div>
                <div className="text-xs text-zinc-400">Supplier ID: SUP-2024-042</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                SP
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Performance Dashboard */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">Avg Turnaround</div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.avgTurnaround}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">First-Time Approval</div>
            <div className="text-2xl font-bold text-emerald-400">{performanceMetrics.firstTimeApproval}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">On-Time Delivery</div>
            <div className="text-2xl font-bold text-cyan-400">{performanceMetrics.onTimeDelivery}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">Quality Score</div>
            <div className="text-2xl font-bold text-violet-400">{performanceMetrics.qualityScore}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">Total Revisions</div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.totalRevisions}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
            <div className="text-xs text-zinc-400 mb-1">Avg Rounds</div>
            <div className="text-2xl font-bold text-amber-400">{performanceMetrics.avgRounds}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Revision List */}
          <div className="col-span-1 space-y-4">
            <div className="bg-zinc-800/50 rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white mb-4">Active Revisions</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 rounded-xl py-2 px-3 text-sm font-semibold transition-all ${
                      activeTab === 'active'
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Active (3)
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 rounded-xl py-2 px-3 text-sm font-semibold transition-all ${
                      activeTab === 'completed'
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={`p-4 cursor-pointer transition-all hover:bg-white/5 ${
                      selectedRevision?.id === rev.id ? 'bg-violet-500/10 border-l-4 border-violet-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white mb-1">{rev.pilName}</div>
                        <div className="text-xs text-zinc-400">{rev.pilCode}</div>
                      </div>
                      {rev.priority === 'high' && (
                        <span className="text-rose-400 text-xs">⚠️</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(rev.status)}
                      <span className="text-xs text-zinc-500">Round {rev.roundNumber}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Due: {rev.dueDate}</span>
                      {rev.unreadComments > 0 && (
                        <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                          {rev.unreadComments} new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span>📄 {rev.versions} versions</span>
                      <span>•</span>
                      <span>{rev.lastActivity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Artwork Versions */}
          <div className="col-span-1 space-y-4">
            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Artwork Versions</h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 text-sm font-semibold transition-all"
                >
                  + Upload New
                </button>
              </div>

              <div className="space-y-3">
                {artworkVersions.map((version) => (
                  <div key={version.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-white mb-1">Version {version.version}</div>
                        <div className="text-xs text-zinc-400">{version.uploadedBy}</div>
                      </div>
                      {getStatusBadge(version.status)}
                    </div>

                    <div className="text-xs text-zinc-500 mb-3">{version.uploadedAt}</div>

                    {version.notes && (
                      <div className="bg-zinc-900/50 rounded-lg p-3 mb-3">
                        <div className="text-xs text-zinc-400">{version.notes}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-white px-3 py-2 text-xs font-semibold transition-all">
                        📄 View PDF
                      </button>
                      {version.hasDiff && (
                        <button className="flex-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 px-3 py-2 text-xs font-semibold transition-all">
                          🔍 View Diff
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-zinc-500 mt-2">{version.fileSize}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Comments */}
          <div className="col-span-1 space-y-4">
            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
              <h2 className="text-lg font-bold text-white mb-4">Comments & Feedback</h2>

              <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
                {comments.filter(c => !c.isInternal).map((comment) => (
                  <div key={comment.id} className={`${comment.parentId ? 'ml-6' : ''}`}>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{comment.author}</div>
                          <div className="text-xs text-zinc-400">{comment.role}</div>
                        </div>
                        {comment.type === 'change_request' && (
                          <span className="bg-amber-500/20 text-amber-400 rounded-full px-2 py-1 text-xs font-medium">
                            Change Request
                          </span>
                        )}
                      </div>

                      {comment.section && (
                        <div className="text-xs text-violet-400 mb-2">📍 {comment.section}</div>
                      )}

                      <div className="text-sm text-zinc-300 mb-2">{comment.content}</div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-zinc-500">{comment.timestamp}</div>
                        {comment.replies > 0 && (
                          <div className="text-xs text-zinc-400">💬 {comment.replies} replies</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment or response..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <select className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>General Comment</option>
                    <option>Change Request</option>
                    <option>Question</option>
                  </select>
                  <button className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 text-sm font-semibold transition-all">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-800 rounded-2xl border border-white/10 p-6 max-w-lg w-full">
            {!uploadSuccess ? (
              <>
                <h3 className="text-xl font-bold text-white mb-4">Upload New Artwork Version</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Select PDF File
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    {selectedFile && (
                      <div className="mt-2 text-sm text-emerald-400">
                        ✓ {selectedFile.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Version Notes
                    </label>
                    <textarea
                      placeholder="Describe changes made in this version..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-sm text-amber-400">
                      ⚠️ Please ensure all regulatory requirements are met before uploading
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 text-white px-4 py-3 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-4 py-3 font-semibold transition-all"
                  >
                    Upload Version 4
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload Successful!</h3>
                <p className="text-sm text-zinc-400">Version 4 has been uploaded and is now under review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}