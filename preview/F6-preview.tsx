export default function F6Preview() {
  const [activeTab, setActiveTab] = React.useState('announcements');
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState(null);
  const [filterAuthority, setFilterAuthority] = React.useState('all');
  const [showMatchDetails, setShowMatchDetails] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState('idle');

  const announcements = [
    {
      id: 1,
      authority: 'TFDA',
      announcementId: 'TFDA-2024-0115',
      title: '藥品仿單變更通知 - 降血壓藥物安全性更新',
      publishedAt: '2024-01-15T10:30:00Z',
      processedAt: '2024-01-15T10:32:15Z',
      matchedPILs: 3,
      hasAffectedPILs: true,
      nlpConfidence: 92,
      affectedProducts: ['衛署藥製字第123456號', '衛署藥製字第789012號'],
      processingTime: 135,
      status: 'matched',
    },
    {
      id: 2,
      authority: 'FDA_Thailand',
      announcementId: 'FDA-TH-2024-0042',
      title: 'ประกาศเรื่องการเปลี่ยนแปลงเอกสารกำกับยา - ยาแก้ปวด',
      publishedAt: '2024-01-14T14:20:00Z',
      processedAt: '2024-01-14T14:24:30Z',
      matchedPILs: 2,
      hasAffectedPILs: true,
      nlpConfidence: 88,
      affectedProducts: ['ทะเบียนยาเลขที่ 12345', 'ทะเบียนยาเลขที่ 67890'],
      processingTime: 270,
      status: 'matched',
    },
    {
      id: 3,
      authority: 'DAV',
      announcementId: 'DAV-2024-0008',
      title: 'Thông báo thay đổi tờ hướng dẫn sử dụng thuốc kháng sinh',
      publishedAt: '2024-01-13T09:15:00Z',
      processedAt: '2024-01-13T09:18:45Z',
      matchedPILs: 1,
      hasAffectedPILs: true,
      nlpConfidence: 85,
      affectedProducts: ['VD-12345-24'],
      processingTime: 225,
      status: 'matched',
    },
    {
      id: 4,
      authority: 'TFDA',
      announcementId: 'TFDA-2024-0112',
      title: '一般性行政公告 - 藥品查驗登記程序更新',
      publishedAt: '2024-01-12T16:00:00Z',
      processedAt: '2024-01-12T16:01:30Z',
      matchedPILs: 0,
      hasAffectedPILs: false,
      nlpConfidence: 45,
      affectedProducts: [],
      processingTime: 90,
      status: 'no_match',
    },
    {
      id: 5,
      authority: 'TFDA',
      announcementId: 'TFDA-2024-0118',
      title: '藥品仿單變更 - 糖尿病用藥劑量調整',
      publishedAt: '2024-01-18T11:45:00Z',
      processedAt: null,
      matchedPILs: 0,
      hasAffectedPILs: false,
      nlpConfidence: 0,
      affectedProducts: ['衛署藥製字第345678號'],
      processingTime: 0,
      status: 'processing',
    },
  ];

  const pilMatches = {
    1: [
      {
        pilId: 101,
        productName: 'Amlodipine 5mg Tablets',
        matchConfidence: 95,
        matchReasons: {
          registrationNumberMatch: true,
          productNameMatch: true,
          ingredientMatch: false,
          therapeuticCategoryMatch: true,
        },
      },
      {
        pilId: 102,
        productName: 'Losartan 50mg Tablets',
        matchConfidence: 88,
        matchReasons: {
          registrationNumberMatch: true,
          productNameMatch: false,
          ingredientMatch: true,
          therapeuticCategoryMatch: true,
        },
      },
      {
        pilId: 103,
        productName: 'Valsartan 80mg Tablets',
        matchConfidence: 72,
        matchReasons: {
          registrationNumberMatch: false,
          productNameMatch: false,
          ingredientMatch: true,
          therapeuticCategoryMatch: true,
        },
      },
    ],
    2: [
      {
        pilId: 201,
        productName: 'Ibuprofen 400mg Tablets',
        matchConfidence: 92,
        matchReasons: {
          registrationNumberMatch: true,
          productNameMatch: true,
          ingredientMatch: true,
          therapeuticCategoryMatch: false,
        },
      },
      {
        pilId: 202,
        productName: 'Paracetamol 500mg Tablets',
        matchConfidence: 85,
        matchReasons: {
          registrationNumberMatch: true,
          productNameMatch: true,
          ingredientMatch: false,
          therapeuticCategoryMatch: false,
        },
      },
    ],
    3: [
      {
        pilId: 301,
        productName: 'Amoxicillin 500mg Capsules',
        matchConfidence: 90,
        matchReasons: {
          registrationNumberMatch: true,
          productNameMatch: true,
          ingredientMatch: true,
          therapeuticCategoryMatch: true,
        },
      },
    ],
  };

  const stats = {
    totalAnnouncements: 156,
    processedToday: 5,
    matchedPILs: 47,
    avgProcessingTime: 185,
    avgNLPConfidence: 87,
    falsePositiveRate: 8.2,
  };

  const filteredAnnouncements = filterAuthority === 'all'
    ? announcements
    : announcements.filter(a => a.authority === filterAuthority);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Processing...';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorityColor = (authority) => {
    const colors = {
      TFDA: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      FDA_Thailand: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      DAV: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    return colors[authority] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  const getStatusColor = (status) => {
    const colors = {
      matched: 'bg-emerald-500/20 text-emerald-300',
      no_match: 'bg-zinc-500/20 text-zinc-400',
      processing: 'bg-amber-500/20 text-amber-300',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-emerald-400';
    if (confidence >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const simulateProcessing = () => {
    setProcessingStatus('processing');
    setTimeout(() => {
      setProcessingStatus('complete');
      setTimeout(() => setProcessingStatus('idle'), 2000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Regulatory Announcement Monitor</h1>
              <p className="text-sm text-zinc-400 mt-1">TFDA • FDA Thailand • DAV</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Last Sync</div>
                <div className="text-sm font-semibold text-emerald-400">2 min ago</div>
              </div>
              <button
                onClick={simulateProcessing}
                disabled={processingStatus === 'processing'}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 px-4 py-2.5 font-semibold text-sm transition-colors"
              >
                {processingStatus === 'processing' ? '⏳ Syncing...' : processingStatus === 'complete' ? '✅ Synced' : '🔄 Sync Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">Total Announcements</div>
            <div className="text-2xl font-bold text-white">{stats.totalAnnouncements}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">Processed Today</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.processedToday}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">Matched PILs</div>
            <div className="text-2xl font-bold text-violet-400">{stats.matchedPILs}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">Avg Processing</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.avgProcessingTime}s</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">NLP Confidence</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.avgNLPConfidence}%</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-1">False Positive</div>
            <div className="text-2xl font-bold text-amber-400">{stats.falsePositiveRate}%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'announcements'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📢 Announcements
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'matches'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🎯 PIL Matches
          </button>
          <button
            onClick={() => setActiveTab('no-match')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'no-match'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ⚪ No Matches
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <button
            onClick={() => setFilterAuthority('all')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              filterAuthority === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            All Authorities
          </button>
          <button
            onClick={() => setFilterAuthority('TFDA')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              filterAuthority === 'TFDA'
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            🇹🇼 TFDA
          </button>
          <button
            onClick={() => setFilterAuthority('FDA_Thailand')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              filterAuthority === 'FDA_Thailand'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            🇹🇭 FDA Thailand
          </button>
          <button
            onClick={() => setFilterAuthority('DAV')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              filterAuthority === 'DAV'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            🇻🇳 DAV
          </button>
        </div>

        {/* Announcements List */}
        {activeTab === 'announcements' && (
          <div className="space-y-3">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white/5 rounded-2xl p-5 border border-white/[0.06] hover:border-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getAuthorityColor(announcement.authority)}`}>
                        {announcement.authority}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(announcement.status)}`}>
                        {announcement.status === 'matched' && '✅ Matched'}
                        {announcement.status === 'no_match' && '⚪ No Match'}
                        {announcement.status === 'processing' && '⏳ Processing'}
                      </span>
                      <span className="text-xs text-zinc-500">{announcement.announcementId}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{announcement.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>📅 {formatTimestamp(announcement.publishedAt)}</span>
                      {announcement.processedAt && (
                        <span>⚡ Processed in {announcement.processingTime}s</span>
                      )}
                      {announcement.matchedPILs > 0 && (
                        <span className="text-violet-400 font-semibold">🎯 {announcement.matchedPILs} PILs matched</span>
                      )}
                    </div>
                    {announcement.affectedProducts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {announcement.affectedProducts.map((product, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-lg bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-300 border border-white/5">
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {announcement.nlpConfidence > 0 && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">NLP Confidence</div>
                        <div className={`text-2xl font-bold ${getConfidenceColor(announcement.nlpConfidence)}`}>
                          {announcement.nlpConfidence}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PIL Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {filteredAnnouncements
              .filter(a => a.hasAffectedPILs)
              .map((announcement) => (
                <div key={announcement.id} className="bg-white/5 rounded-2xl p-5 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{announcement.announcementId}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getAuthorityColor(announcement.authority)}`}>
                      {announcement.authority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pilMatches[announcement.id]?.map((match) => (
                      <div key={match.pilId} className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-white">{match.productName}</div>
                            <div className="text-xs text-zinc-500 mt-1">PIL ID: {match.pilId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-zinc-500 mb-1">Match Confidence</div>
                            <div className={`text-xl font-bold ${getConfidenceColor(match.matchConfidence)}`}>
                              {match.matchConfidence}%
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.matchReasons.registrationNumberMatch && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Registration #
                            </span>
                          )}
                          {match.matchReasons.productNameMatch && (
                            <span className="inline-flex items-center rounded-lg bg-violet-500/20 text-violet-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Product Name
                            </span>
                          )}
                          {match.matchReasons.ingredientMatch && (
                            <span className="inline-flex items-center rounded-lg bg-cyan-500/20 text-cyan-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Ingredient
                            </span>
                          )}
                          {match.matchReasons.therapeuticCategoryMatch && (
                            <span className="inline-flex items-center rounded-lg bg-amber-500/20 text-amber-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Category
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* No Match Tab */}
        {activeTab === 'no-match' && (
          <div className="space-y-3">
            {filteredAnnouncements
              .filter(a => !a.hasAffectedPILs && a.status !== 'processing')
              .map((announcement) => (
                <div key={announcement.id} className="bg-white/5 rounded-2xl p-5 border border-white/[0.06]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getAuthorityColor(announcement.authority)}`}>
                          {announcement.authority}
                        </span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-zinc-500/20 text-zinc-400">
                          ⚪ No PIL Match
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2">{announcement.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span>📅 {formatTimestamp(announcement.publishedAt)}</span>
                        <span>⚡ Processed in {announcement.processingTime}s</span>
                      </div>
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                        <div className="text-xs text-zinc-500 mb-1">Reason</div>
                        <div className="text-sm text-zinc-300">
                          General administrative announcement with no specific product references. NLP confidence: {announcement.nlpConfidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Selected Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedAnnouncement.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getAuthorityColor(selectedAnnouncement.authority)}`}>
                      {selectedAnnouncement.authority}
                    </span>
                    <span className="text-sm text-zinc-400">{selectedAnnouncement.announcementId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)} className="text-zinc-400 hover:text-white text-2xl">×</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs text-zinc-500 mb-2">Published</div>
                <div className="text-sm text-white">{formatTimestamp(selectedAnnouncement.publishedAt)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-2">Processing Details</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Processing Time</div>
                    <div className="text-lg font-bold text-cyan-400">{selectedAnnouncement.processingTime}s</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">NLP Confidence</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(selectedAnnouncement.nlpConfidence)}`}>
                      {selectedAnnouncement.nlpConfidence}%
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Matched PILs</div>
                    <div className="text-lg font-bold text-violet-400">{selectedAnnouncement.matchedPILs}</div>
                  </div>
                </div>
              </div>
              {selectedAnnouncement.affectedProducts.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Affected Products</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncement.affectedProducts.map((product, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 border border-white/5">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pilMatches[selectedAnnouncement.id] && (
                <div>
                  <div className="text-xs text-zinc-500 mb-3">PIL Matches</div>
                  <div className="space-y-2">
                    {pilMatches[selectedAnnouncement.id].map((match) => (
                      <div key={match.pilId} className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-white">{match.productName}</div>
                            <div className="text-xs text-zinc-500 mt-1">PIL ID: {match.pilId}</div>
                          </div>
                          <div className={`text-xl font-bold ${getConfidenceColor(match.matchConfidence)}`}>
                            {match.matchConfidence}%
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.matchReasons.registrationNumberMatch && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Registration #
                            </span>
                          )}
                          {match.matchReasons.productNameMatch && (
                            <span className="inline-flex items-center rounded-lg bg-violet-500/20 text-violet-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Product Name
                            </span>
                          )}
                          {match.matchReasons.ingredientMatch && (
                            <span className="inline-flex items-center rounded-lg bg-cyan-500/20 text-cyan-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Ingredient
                            </span>
                          )}
                          {match.matchReasons.therapeuticCategoryMatch && (
                            <span className="inline-flex items-center rounded-lg bg-amber-500/20 text-amber-300 px-2.5 py-1 text-xs font-medium">
                              ✅ Category
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
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