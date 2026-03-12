export default function F1Preview() {
  const [activeTab, setActiveTab] = React.useState('translate');
  const [selectedPIL, setSelectedPIL] = React.useState(null);
  const [targetLanguage, setTargetLanguage] = React.useState('zh-TW');
  const [translationStatus, setTranslationStatus] = React.useState('idle');
  const [translationResult, setTranslationResult] = React.useState(null);
  const [showTraceability, setShowTraceability] = React.useState(false);
  const [processingProgress, setProcessingProgress] = React.useState(0);

  const mockPILs = [
    { id: 1, productName: 'Paracetamol 500mg', manufacturer: 'PharmaCorp', uploadDate: '2024-01-15', status: 'approved' },
    { id: 2, productName: 'Amoxicillin 250mg', manufacturer: 'MediLab', uploadDate: '2024-01-18', status: 'approved' },
    { id: 3, productName: 'Ibuprofen 400mg', manufacturer: 'HealthGen', uploadDate: '2024-01-20', status: 'approved' },
  ];

  const mockSections = [
    { name: 'PRODUCT NAME', confidence: 98, status: 'approved', sourceText: 'Paracetamol 500mg Tablets', translatedText: '撲熱息痛 500毫克片劑' },
    { name: 'COMPOSITION', confidence: 95, status: 'approved', sourceText: 'Each tablet contains 500mg paracetamol', translatedText: '每片含有500毫克撲熱息痛' },
    { name: 'THERAPEUTIC INDICATIONS', confidence: 92, status: 'approved', sourceText: 'Relief of mild to moderate pain and fever', translatedText: '緩解輕度至中度疼痛和發燒' },
    { name: 'POSOLOGY AND METHOD OF ADMINISTRATION', confidence: 88, status: 'approved', sourceText: 'Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets per day.', translatedText: '成人：每4-6小時服用1-2片。每日最多8片。' },
    { name: 'CONTRAINDICATIONS', confidence: 78, status: 'pending_review', sourceText: 'Hypersensitivity to paracetamol or any excipients. Severe hepatic impairment.', translatedText: '對撲熱息痛或任何賦形劑過敏。嚴重肝功能不全。' },
    { name: 'UNDESIRABLE EFFECTS', confidence: 82, status: 'pending_review', sourceText: 'Rare: allergic reactions, blood disorders, hepatotoxicity at high doses', translatedText: '罕見：過敏反應、血液疾病、高劑量時肝毒性' },
    { name: 'OVERDOSE', confidence: 75, status: 'pending_review', sourceText: 'Symptoms include nausea, vomiting, abdominal pain. Seek immediate medical attention.', translatedText: '症狀包括噁心、嘔吐、腹痛。立即就醫。' },
    { name: 'STORAGE CONDITIONS', confidence: 96, status: 'approved', sourceText: 'Store below 25°C in a dry place', translatedText: '儲存於25°C以下乾燥處' },
  ];

  const handleStartTranslation = () => {
    setTranslationStatus('processing');
    setProcessingProgress(0);
    
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setTranslationStatus('completed');
            setTranslationResult({
              translationId: 1001,
              overallConfidence: 87,
              processingTimeMs: 45230,
              sectionsTranslated: 8,
              lowConfidenceSections: 3,
              sections: mockSections,
            });
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
  };

  const getConfidenceColor = (score) => {
    if (score >= 95) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 85) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                🌐
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PIL Translation Engine</h1>
                <p className="text-xs text-zinc-400">LLM-Powered Pharmaceutical Translation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                GPT-4 Turbo
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                TFDA Compliant
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('translate')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'translate'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            📄 New Translation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            📊 Translation History
          </button>
        </div>

        {activeTab === 'translate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>⚙️</span> Translation Configuration
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Select PIL Document
                    </label>
                    <select
                      value={selectedPIL?.id || ''}
                      onChange={(e) => setSelectedPIL(mockPILs.find(p => p.id === parseInt(e.target.value)))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
                    >
                      <option value="">Choose a PIL...</option>
                      {mockPILs.map(pil => (
                        <option key={pil.id} value={pil.id}>{pil.productName}</option>
                      ))}
                    </select>
                  </div>

                  {selectedPIL && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-zinc-500 text-xs">Manufacturer</p>
                          <p className="text-white font-medium">{selectedPIL.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Upload Date</p>
                          <p className="text-white font-medium">{selectedPIL.uploadDate}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Target Language
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
                        { code: 'th', label: 'ไทย', flag: '🇹🇭' },
                        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
                      ].map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setTargetLanguage(lang.code)}
                          className={`p-3 rounded-xl border transition-all ${
                            targetLanguage === lang.code
                              ? 'bg-violet-500/20 border-violet-500 text-white'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-2xl mb-1">{lang.flag}</div>
                          <div className="text-xs font-medium">{lang.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-start gap-3">
                      <span className="text-cyan-400 text-xl">ℹ️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-300 mb-1">Translation Settings</p>
                        <ul className="text-xs text-cyan-400/80 space-y-1">
                          <li>• Parallel processing: 5 concurrent sections</li>
                          <li>• Confidence threshold: 85% (TFDA requirement)</li>
                          <li>• SLA target: 90 seconds per PIL</li>
                          <li>• Model: GPT-4 Turbo (gpt-4-1106-preview)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartTranslation}
                    disabled={!selectedPIL || translationStatus === 'processing'}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all"
                  >
                    {translationStatus === 'processing' ? '⏳ Translating...' : '🚀 Start Translation'}
                  </button>
                </div>
              </div>

              {/* Processing Status */}
              {translationStatus === 'processing' && (
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h3 className="text-lg font-bold text-white mb-4">⚡ Processing Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-400">Overall Progress</span>
                        <span className="text-white font-bold">{Math.round(processingProgress)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-zinc-500 mb-1">Sections Processed</p>
                        <p className="text-white font-bold text-lg">{Math.floor(processingProgress / 12.5)}/8</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-zinc-500 mb-1">Elapsed Time</p>
                        <p className="text-white font-bold text-lg">{Math.floor(processingProgress * 450)}ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              {translationStatus === 'idle' && (
                <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] shadow-lg shadow-black/20 text-center">
                  <div className="text-6xl mb-4">🌐</div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Translate</h3>
                  <p className="text-sm text-zinc-400">
                    Select a PIL document and target language to begin
                  </p>
                </div>
              )}

              {translationStatus === 'completed' && translationResult && (
                <>
                  <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">✅ Translation Complete</h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getConfidenceColor(translationResult.overallConfidence)}`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        {translationResult.overallConfidence}% Confidence
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-zinc-500 text-xs mb-1">Processing Time</p>
                        <p className="text-white font-bold">{(translationResult.processingTimeMs / 1000).toFixed(1)}s</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-zinc-500 text-xs mb-1">Sections</p>
                        <p className="text-white font-bold">{translationResult.sectionsTranslated}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-zinc-500 text-xs mb-1">Review Needed</p>
                        <p className="text-amber-400 font-bold">{translationResult.lowConfidenceSections}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowTraceability(!showTraceability)}
                        className="flex-1 py-3 px-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-semibold text-sm hover:bg-violet-500/20 transition-all"
                      >
                        📋 View Traceability
                      </button>
                      <button className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/20 transition-all">
                        💾 Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Section Details */}
                  <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                    <h3 className="text-lg font-bold text-white mb-4">📑 Section Analysis</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {translationResult.sections.map((section, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">{section.name}</h4>
                            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getConfidenceColor(section.confidence)}`}>
                              {section.confidence}%
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-zinc-500 mb-1">Source</p>
                              <p className="text-zinc-300 line-clamp-2">{section.sourceText}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 mb-1">Translation</p>
                              <p className="text-zinc-300 line-clamp-2">{section.translatedText}</p>
                            </div>
                          </div>
                          {section.status === 'pending_review' && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                              <span>⚠️</span>
                              <span>Requires human review</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-white mb-4">📊 Translation History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Language</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Confidence</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Time</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1001, product: 'Paracetamol 500mg', lang: '🇹🇼 zh-TW', confidence: 87, time: '45.2s', status: 'pending_review', date: '2024-01-22' },
                    { id: 1000, product: 'Amoxicillin 250mg', lang: '🇹🇭 th', confidence: 92, time: '38.7s', status: 'approved', date: '2024-01-21' },
                    { id: 999, product: 'Ibuprofen 400mg', lang: '🇻🇳 vi', confidence: 95, time: '42.1s', status: 'approved', date: '2024-01-20' },
                    { id: 998, product: 'Aspirin 100mg', lang: '🇹🇼 zh-TW', confidence: 89, time: '51.3s', status: 'approved', date: '2024-01-19' },
                  ].map(item => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-4 text-sm text-zinc-400">#{item.id}</td>
                      <td className="py-3 px-4 text-sm text-white font-medium">{item.product}</td>
                      <td className="py-3 px-4 text-sm text-zinc-300">{item.lang}</td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                          {item.confidence}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-400">{item.time}</td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {item.status === 'approved' ? '✅ Approved' : '⏳ Review'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-400">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Traceability Modal */}
      {showTraceability && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">📋 Translation Traceability Log</h3>
              <button
                onClick={() => setShowTraceability(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Metadata</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-zinc-500">Translation ID:</span> <span className="text-white font-mono">1001</span></div>
                    <div><span className="text-zinc-500">LLM Model:</span> <span className="text-white">gpt-4-1106-preview</span></div>
                    <div><span className="text-zinc-500">Source Language:</span> <span className="text-white">English</span></div>
                    <div><span className="text-zinc-500">Target Language:</span> <span className="text-white">Traditional Chinese (zh-TW)</span></div>
                    <div><span className="text-zinc-500">Processing Time:</span> <span className="text-white">45,230ms</span></div>
                    <div><span className="text-zinc-500">Timestamp:</span> <span className="text-white">2024-01-22T14:32:15Z</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Quality Metrics</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-emerald-400 text-xs mb-1">Sections Translated</p>
                      <p className="text-white font-bold text-xl">8</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-400 text-xs mb-1">Low Confidence</p>
                      <p className="text-white font-bold text-xl">3</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-cyan-400 text-xs mb-1">Avg Confidence</p>
                      <p className="text-white font-bold text-xl">87%</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">TFDA Compliance</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✅</span>
                      <span>Approved terminology glossary applied</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✅</span>
                      <span>Critical sections flagged for review</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✅</span>
                      <span>Source references preserved</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <span>⚠️</span>
                      <span>3 sections require human validation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}