export default function F11Preview() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedModel, setSelectedModel] = React.useState(null);
  const [reportOptions, setReportOptions] = React.useState({
    includeTrainingData: true,
    includeTestResults: true,
    includeHumanOverrides: true,
    includeComplianceAttestations: true,
    format: 'pdf',
  });
  const [generating, setGenerating] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const models = [
    {
      id: 1,
      modelVersion: 'gpt-4-pharma-v2.1',
      baseModel: 'gpt-4-turbo',
      status: 'active',
      description: 'Production model with pharmaceutical fine-tuning for TFDA, FDA Thailand, DAV submissions',
      activatedAt: '2024-01-15T08:00:00Z',
      validatedBy: 'Dr. Sarah Chen',
      validatedAt: '2024-01-14T16:30:00Z',
    },
    {
      id: 2,
      modelVersion: 'gpt-4-pharma-v2.0',
      baseModel: 'gpt-4-turbo',
      status: 'deprecated',
      description: 'Previous production model - replaced by v2.1',
      activatedAt: '2023-11-01T08:00:00Z',
      validatedBy: 'Dr. Sarah Chen',
      validatedAt: '2023-10-30T14:00:00Z',
    },
    {
      id: 3,
      modelVersion: 'gpt-4-pharma-v2.2-beta',
      baseModel: 'gpt-4-turbo',
      status: 'testing',
      description: 'Beta model with improved Vietnamese translation accuracy',
      activatedAt: null,
      validatedBy: null,
      validatedAt: null,
    },
  ];

  const complianceReport = {
    regulatoryAuthorities: [
      {
        authority: 'TFDA',
        compliant: true,
        attestationDate: '2024-01-14T10:00:00Z',
        attestedBy: 'Dr. Sarah Chen',
        expiryDate: '2025-01-14T10:00:00Z',
      },
      {
        authority: 'FDA Thailand',
        compliant: true,
        attestationDate: '2024-01-14T11:00:00Z',
        attestedBy: 'Dr. Sarah Chen',
        expiryDate: '2025-01-14T11:00:00Z',
      },
      {
        authority: 'DAV',
        compliant: true,
        attestationDate: '2024-01-14T12:00:00Z',
        attestedBy: 'Dr. Sarah Chen',
        expiryDate: '2025-01-14T12:00:00Z',
      },
    ],
    trainingDataProvenance: {
      fullyDocumented: true,
      sources: ['innovator_pils', 'tfda_approved', 'fda_thailand_approved', 'pharmaceutical_corpus'],
      totalDocuments: 15420,
    },
    validationTestsPassed: true,
    humanInTheLoopImplemented: true,
    confidenceScoringDocumented: true,
  };

  const performanceMetrics = {
    totalTranslations: 1247,
    confidenceScoreDistribution: [
      { range: '0-50', count: 12, percentage: 0.96 },
      { range: '50-70', count: 45, percentage: 3.61 },
      { range: '70-85', count: 187, percentage: 15.0 },
      { range: '85-95', count: 623, percentage: 49.96 },
      { range: '95-100', count: 380, percentage: 30.47 },
    ],
    humanOverrideRate: 18.52,
    averageConfidenceScore: 87.3,
    sectionAccuracy: {
      'Product Name': 98.5,
      'Active Ingredients': 96.2,
      'Dosage': 94.8,
      'Contraindications': 92.1,
      'Adverse Reactions': 89.7,
      'Storage Instructions': 97.3,
    },
    languagePerformance: {
      'Traditional Chinese': 88.5,
      'Thai': 86.2,
      'Vietnamese': 87.1,
    },
  };

  React.useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'deprecated':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'testing':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90;
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const handleToggle = (key) => {
    setReportOptions({ ...reportOptions, [key]: !reportOptions[key] });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">AI Validation Documentation</h1>
              <p className="text-sm text-zinc-400">
                Generate comprehensive validation reports for regulatory inspection (TFDA, FDA Thailand, DAV)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Report History
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Model Selection */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Select Model Version</h2>
              <div className="space-y-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedModel?.id === model.id
                        ? 'bg-violet-500/10 border-violet-500/50 shadow-lg shadow-violet-500/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-white">{model.modelVersion}</h3>
                        <p className="text-sm text-zinc-400 mt-1">{model.description}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          model.status
                        )}`}
                      >
                        {model.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-xs text-zinc-500">Base Model</p>
                        <p className="text-sm text-zinc-300 mt-1">{model.baseModel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Activated</p>
                        <p className="text-sm text-zinc-300 mt-1">{formatDate(model.activatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Validated By</p>
                        <p className="text-sm text-zinc-300 mt-1">{model.validatedBy || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Validated At</p>
                        <p className="text-sm text-zinc-300 mt-1">{formatDate(model.validatedAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance Status */}
            {selectedModel && (
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Compliance Status</h2>

                {/* Regulatory Authorities */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Regulatory Attestations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {complianceReport.regulatoryAuthorities.map((authority) => (
                      <div
                        key={authority.authority}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white">{authority.authority}</h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Compliant
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="text-zinc-500">Attested By</p>
                            <p className="text-zinc-300">{authority.attestedBy}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Attestation Date</p>
                            <p className="text-zinc-300">{formatDate(authority.attestationDate)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Expiry Date</p>
                            <p
                              className={
                                isExpiringSoon(authority.expiryDate) ? 'text-amber-400' : 'text-zinc-300'
                              }
                            >
                              {formatDate(authority.expiryDate)}
                              {isExpiringSoon(authority.expiryDate) && ' ⚠️'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Checklist */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Compliance Checklist</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Training Data Provenance</p>
                        <p className="text-xs text-zinc-400">
                          {complianceReport.trainingDataProvenance.totalDocuments.toLocaleString()} documents
                          from {complianceReport.trainingDataProvenance.sources.length} sources
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Validation Tests</p>
                        <p className="text-xs text-zinc-400">All tests passed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Human-in-the-Loop</p>
                        <p className="text-xs text-zinc-400">Implemented and documented</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Confidence Scoring</p>
                        <p className="text-xs text-zinc-400">Methodology documented</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {selectedModel && (
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Performance Metrics</h2>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Total Translations</p>
                    <p className="text-2xl font-bold text-white">
                      {performanceMetrics.totalTranslations.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Avg Confidence Score</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {performanceMetrics.averageConfidenceScore}%
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Human Override Rate</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {performanceMetrics.humanOverrideRate}%
                    </p>
                  </div>
                </div>

                {/* Confidence Score Distribution */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Confidence Score Distribution</h3>
                  <div className="space-y-2">
                    {performanceMetrics.confidenceScoreDistribution.map((dist) => (
                      <div key={dist.range} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-zinc-400">{dist.range}%</div>
                        <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 flex items-center justify-end pr-2"
                            style={{ width: `${dist.percentage}%` }}
                          >
                            {dist.percentage > 5 && (
                              <span className="text-xs font-medium text-white">
                                {dist.percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-16 text-xs text-zinc-400 text-right">{dist.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Accuracy */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Section Accuracy</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(performanceMetrics.sectionAccuracy).map(([section, accuracy]) => (
                      <div key={section} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <p className="text-xs text-zinc-400 mb-1">{section}</p>
                        <p className="text-lg font-bold text-white">{accuracy}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Performance */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Language Performance</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(performanceMetrics.languagePerformance).map(([lang, score]) => (
                      <div
                        key={lang}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
                      >
                        <p className="text-xs text-zinc-400 mb-1">{lang}</p>
                        <p className="text-xl font-bold text-white">{score}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Report Options */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Report Options</h2>

              {/* Include Options */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOptions.includeTrainingData}
                    onChange={() => handleToggle('includeTrainingData')}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Include Training Data Provenance</p>
                    <p className="text-xs text-zinc-400">
                      Document sources, checksums, and training timeline
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOptions.includeTestResults}
                    onChange={() => handleToggle('includeTestResults')}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Include Validation Test Results</p>
                    <p className="text-xs text-zinc-400">
                      Accuracy metrics, BLEU scores, and calibration data
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOptions.includeHumanOverrides}
                    onChange={() => handleToggle('includeHumanOverrides')}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Include Human Override Statistics</p>
                    <p className="text-xs text-zinc-400">Override rates, reasons, and review times</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOptions.includeComplianceAttestations}
                    onChange={() => handleToggle('includeComplianceAttestations')}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Include Compliance Attestations</p>
                    <p className="text-xs text-zinc-400">
                      TFDA, FDA Thailand, and DAV regulatory approvals
                    </p>
                  </div>
                </label>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-zinc-300 mb-3">Export Format</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportOptions({ ...reportOptions, format: 'pdf' })}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      reportOptions.format === 'pdf'
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    📄 PDF Report
                  </button>
                  <button
                    onClick={() => setReportOptions({ ...reportOptions, format: 'json' })}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      reportOptions.format === 'json'
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    📋 JSON Data
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                  generating
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]'
                }`}
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Report...
                  </span>
                ) : (
                  '🚀 Generate Validation Report'
                )}
              </button>

              <p className="text-xs text-zinc-500 text-center mt-3">
                Report will be available for download within 24 hours
              </p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-3 animate-slide-up">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold">Report Generated Successfully!</p>
                  <p className="text-sm text-emerald-100">
                    Report ID: VAL-{selectedModel?.modelVersion}-{Date.now()}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Report Generation History</h2>
            <div className="space-y-3">
              {[
                {
                  id: 'VAL-gpt-4-pharma-v2.1-1705320000',
                  modelVersion: 'gpt-4-pharma-v2.1',
                  generatedAt: '2024-01-15T10:00:00Z',
                  format: 'pdf',
                  generatedBy: 'Dr. Sarah Chen',
                },
                {
                  id: 'VAL-gpt-4-pharma-v2.0-1699200000',
                  modelVersion: 'gpt-4-pharma-v2.0',
                  generatedAt: '2023-11-05T14:30:00Z',
                  format: 'pdf',
                  generatedBy: 'Dr. Sarah Chen',
                },
              ].map((report) => (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">{report.id}</h3>
                      <p className="text-xs text-zinc-400">Model: {report.modelVersion}</p>
                      <p className="text-xs text-zinc-400">Generated by: {report.generatedBy}</p>
                      <p className="text-xs text-zinc-400">Date: {formatDate(report.generatedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {report.format.toUpperCase()}
                      </span>
                      <button className="px-3 py-1 rounded-lg bg-white/5 text-zinc-300 text-xs font-medium hover:bg-white/10 transition-all">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}