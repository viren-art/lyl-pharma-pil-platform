export default function F10Preview() {
  const [activeTab, setActiveTab] = React.useState('suggestions');
  const [selectedTerm, setSelectedTerm] = React.useState(null);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [validationResults, setValidationResults] = React.useState(null);
  const [showValidation, setShowValidation] = React.useState(false);

  const termSuggestions = [
    {
      id: 1,
      sourceTerm: 'adverse reaction',
      targetTerm: 'อาการไม่พึงประสงค์',
      confidence: 95,
      usageCount: 247,
      lastUsed: '2024-01-15',
      market: 'FDA_Thailand',
      language: 'th'
    },
    {
      id: 2,
      sourceTerm: 'contraindication',
      targetTerm: 'ข้อห้ามใช้',
      confidence: 92,
      usageCount: 189,
      lastUsed: '2024-01-14',
      market: 'FDA_Thailand',
      language: 'th'
    },
    {
      id: 3,
      sourceTerm: 'dosage',
      targetTerm: 'ขนาดยา',
      confidence: 98,
      usageCount: 412,
      lastUsed: '2024-01-16',
      market: 'all',
      language: 'th'
    },
    {
      id: 4,
      sourceTerm: 'active ingredient',
      targetTerm: 'ส่วนประกอบสำคัญ',
      confidence: 88,
      usageCount: 156,
      lastUsed: '2024-01-13',
      market: 'FDA_Thailand',
      language: 'th'
    }
  ];

  const pendingApprovals = [
    {
      id: 5,
      sourceTerm: 'pharmacokinetics',
      targetTerm: 'เภสัชจลนศาสตร์',
      submittedBy: 'สมชาย วงศ์ใหญ่',
      submittedAt: '2024-01-16 14:30',
      market: 'FDA_Thailand',
      language: 'th',
      justification: 'Standard medical terminology used in Thai pharmaceutical documentation'
    },
    {
      id: 6,
      sourceTerm: 'bioavailability',
      targetTerm: 'ชีวประสิทธิภาพ',
      submittedBy: 'สุภาพ ดีมาก',
      submittedAt: '2024-01-16 10:15',
      market: 'FDA_Thailand',
      language: 'th',
      justification: 'Commonly accepted translation in regulatory documents'
    },
    {
      id: 7,
      sourceTerm: 'excipient',
      targetTerm: 'สารช่วย',
      submittedBy: 'วิชัย สมบูรณ์',
      submittedAt: '2024-01-15 16:45',
      market: 'all',
      language: 'th',
      justification: 'Simplified term for better patient understanding'
    }
  ];

  const mockValidation = {
    valid: false,
    overallScore: 78,
    encodingValidation: {
      valid: true,
      errors: [],
      warnings: ['Non-standard quotation marks detected in section 3']
    },
    numericValidation: {
      valid: false,
      inconsistencies: [
        {
          section: 'Dosage',
          sourceValue: '500mg',
          translatedValue: '500 มก.',
          type: 'unit'
        },
        {
          section: 'Administration',
          sourceValue: '2 tablets',
          translatedValue: '3 เม็ด',
          type: 'numeric'
        }
      ]
    },
    terminologyValidation: {
      valid: false,
      unapprovedTerms: [
        {
          term: 'ผลข้างเคียง',
          section: 'Adverse Reactions',
          suggestedReplacement: 'อาการไม่พึงประสงค์'
        },
        {
          term: 'ปริมาณยา',
          section: 'Dosage',
          suggestedReplacement: 'ขนาดยา'
        }
      ],
      warnings: ['Inconsistent terminology usage across sections']
    },
    criticalIssues: [
      'Numeric mismatch in dosage section (2 vs 3)',
      'Unapproved terminology used in critical safety section'
    ],
    recommendations: [
      'Replace "ผลข้างเคียง" with approved term "อาการไม่พึงประสงค์"',
      'Verify numeric translation in Administration section',
      'Standardize unit abbreviations throughout document'
    ]
  };

  const handleApprove = (termId, approved) => {
    setShowApprovalModal(false);
    setSelectedTerm(null);
  };

  const runValidation = () => {
    setShowValidation(true);
    setValidationResults(mockValidation);
  };

  const filteredSuggestions = searchQuery
    ? termSuggestions.filter(t => 
        t.sourceTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.targetTerm.includes(searchQuery)
      )
    : termSuggestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Translation Memory & Quality Validation</h1>
                <p className="text-xs text-zinc-400">Terminology management and quality assurance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-medium text-emerald-400">412 Approved Terms</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs font-medium text-amber-400">3 Pending Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'suggestions'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Term Suggestions
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all relative ${
              activeTab === 'pending'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending Approvals
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
              3
            </span>
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'validation'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quality Validation
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'consistency'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Consistency Report
          </button>
        </div>

        {/* Term Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search terms in English or Thai..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 pl-11 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
                </div>
                <select className="rounded-xl bg-white/5 border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                  <option>All Markets</option>
                  <option>FDA Thailand</option>
                  <option>TFDA Taiwan</option>
                  <option>DAV Vietnam</option>
                </select>
                <select className="rounded-xl bg-white/5 border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                  <option>Thai (th)</option>
                  <option>Chinese (zh-TW)</option>
                  <option>Vietnamese (vi)</option>
                </select>
              </div>
            </div>

            {/* Term List */}
            <div className="grid gap-4">
              {filteredSuggestions.map((term) => (
                <div
                  key={term.id}
                  className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-zinc-400 mb-1">Source Term (EN)</div>
                          <div className="text-lg font-semibold text-white">{term.sourceTerm}</div>
                        </div>
                        <div className="text-2xl text-zinc-600">→</div>
                        <div className="flex-1">
                          <div className="text-sm text-zinc-400 mb-1">Target Term (TH)</div>
                          <div className="text-lg font-semibold text-white">{term.targetTerm}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                              style={{ width: `${term.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-emerald-400">{term.confidence}%</span>
                        </div>
                        <div className="text-sm text-zinc-400">
                          📊 Used {term.usageCount} times
                        </div>
                        <div className="text-sm text-zinc-400">
                          🕐 Last used {term.lastUsed}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                          <span className="text-xs font-medium text-violet-400">
                            {term.market === 'all' ? 'All Markets' : term.market}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-sm transition-all">
                      Use Term
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingApprovals.map((term) => (
              <div
                key={term.id}
                className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <span className="text-xs font-medium text-amber-400">⏳ Pending Review</span>
                      </div>
                      <div className="text-sm text-zinc-400">
                        Submitted by <span className="text-white font-medium">{term.submittedBy}</span>
                      </div>
                      <div className="text-sm text-zinc-500">{term.submittedAt}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-zinc-400 mb-2">Source Term (EN)</div>
                        <div className="text-xl font-semibold text-white">{term.sourceTerm}</div>
                      </div>
                      <div>
                        <div className="text-sm text-zinc-400 mb-2">Proposed Translation (TH)</div>
                        <div className="text-xl font-semibold text-white">{term.targetTerm}</div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-sm text-zinc-400 mb-2">Justification</div>
                      <div className="text-sm text-zinc-200">{term.justification}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                        <span className="text-xs font-medium text-violet-400">{term.market}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <span className="text-xs font-medium text-cyan-400">{term.language}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setSelectedTerm(term);
                        setShowApprovalModal(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTerm(term);
                        setShowApprovalModal(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-500/25"
                    >
                      ✕ Reject
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all border border-white/10">
                      💬 Comment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quality Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            {/* Validation Controls */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Document Quality Validation</h3>
                  <p className="text-sm text-zinc-400">Comprehensive validation of translated PIL documents</p>
                </div>
                <button
                  onClick={runValidation}
                  className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold transition-all shadow-lg shadow-violet-500/25"
                >
                  🔍 Run Validation
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-zinc-400 mb-1">Source Language</div>
                  <div className="text-sm font-semibold text-white">English (EN)</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-zinc-400 mb-1">Target Language</div>
                  <div className="text-sm font-semibold text-white">Thai (TH)</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-zinc-400 mb-1">Market</div>
                  <div className="text-sm font-semibold text-white">FDA Thailand</div>
                </div>
              </div>
            </div>

            {/* Validation Results */}
            {showValidation && validationResults && (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Overall Quality Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-amber-400">{validationResults.overallScore}%</div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                        validationResults.valid
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-rose-500/10 border border-rose-500/20'
                      }`}>
                        <span className={`text-xs font-medium ${
                          validationResults.valid ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {validationResults.valid ? '✓ Passed' : '⚠ Issues Found'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                      style={{ width: `${validationResults.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Critical Issues */}
                {validationResults.criticalIssues.length > 0 && (
                  <div className="bg-rose-500/10 rounded-2xl p-6 border border-rose-500/20 shadow-lg shadow-black/20">
                    <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
                      ⚠️ Critical Issues ({validationResults.criticalIssues.length})
                    </h3>
                    <div className="space-y-2">
                      {validationResults.criticalIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-rose-200">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encoding Validation */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Encoding Validation</h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                      validationResults.encodingValidation.valid
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      <span className={`text-xs font-medium ${
                        validationResults.encodingValidation.valid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {validationResults.encodingValidation.valid ? '✓ Valid' : '✕ Invalid'}
                      </span>
                    </div>
                  </div>
                  {validationResults.encodingValidation.warnings.length > 0 && (
                    <div className="space-y-2">
                      {validationResults.encodingValidation.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-amber-300 bg-amber-500/10 rounded-lg p-3">
                          <span>⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Numeric Validation */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Numeric Consistency</h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                      validationResults.numericValidation.valid
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      <span className={`text-xs font-medium ${
                        validationResults.numericValidation.valid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {validationResults.numericValidation.inconsistencies.length} Inconsistencies
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {validationResults.numericValidation.inconsistencies.map((inc, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-zinc-400">{inc.section}</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                            <span className="text-xs font-medium text-rose-400">{inc.type}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-white font-medium">{inc.sourceValue}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-rose-400 font-medium">{inc.translatedValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terminology Validation */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Terminology Validation</h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                      validationResults.terminologyValidation.valid
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      <span className={`text-xs font-medium ${
                        validationResults.terminologyValidation.valid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {validationResults.terminologyValidation.unapprovedTerms.length} Unapproved Terms
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {validationResults.terminologyValidation.unapprovedTerms.map((term, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-zinc-400 mb-1">{term.section}</div>
                            <div className="text-sm font-medium text-rose-400 mb-2">{term.term}</div>
                            {term.suggestedReplacement && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-400">Suggested:</span>
                                <span className="text-emerald-400 font-medium">{term.suggestedReplacement}</span>
                              </div>
                            )}
                          </div>
                          <button className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-xs transition-all">
                            Replace
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-cyan-500/10 rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-black/20">
                  <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    💡 Recommendations
                  </h3>
                  <div className="space-y-2">
                    {validationResults.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-cyan-200">
                        <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Consistency Report Tab */}
        {activeTab === 'consistency' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <div className="text-sm text-zinc-400 mb-2">Total Terms</div>
                <div className="text-3xl font-bold text-white">412</div>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 shadow-lg shadow-black/20">
                <div className="text-sm text-emerald-400 mb-2">Consistent Terms</div>
                <div className="text-3xl font-bold text-emerald-400">389</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-6 border border-rose-500/20 shadow-lg shadow-black/20">
                <div className="text-sm text-rose-400 mb-2">Inconsistent Terms</div>
                <div className="text-3xl font-bold text-rose-400">23</div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4">Inconsistent Terminology</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-sm font-semibold text-white mb-3">adverse reaction</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">อาการไม่พึงประสงค์</span>
                      <span className="text-emerald-400 font-medium">247 uses ✓ Approved</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">ผลข้างเคียง</span>
                      <span className="text-rose-400 font-medium">12 uses ⚠ Unapproved</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-sm font-semibold text-white mb-3">dosage</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">ขนาดยา</span>
                      <span className="text-emerald-400 font-medium">412 uses ✓ Approved</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">ปริมาณยา</span>
                      <span className="text-rose-400 font-medium">8 uses ⚠ Unapproved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedTerm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Review Term Submission</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-2">Source Term</div>
                  <div className="text-lg font-semibold text-white">{selectedTerm.sourceTerm}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-2">Target Term</div>
                  <div className="text-lg font-semibold text-white">{selectedTerm.targetTerm}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-400 mb-2">Reviewer Comments</div>
                <textarea
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[100px]"
                  placeholder="Enter your review comments..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedTerm.id, false)}
                className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-all shadow-lg shadow-rose-500/25"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedTerm.id, true)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/25"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}