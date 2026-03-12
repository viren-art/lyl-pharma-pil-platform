export default function F2Preview() {
  const [selectedSection, setSelectedSection] = React.useState('dosage');
  const [showTraceability, setShowTraceability] = React.useState(true);
  const [expandedRef, setExpandedRef] = React.useState(null);
  const [integrityStatus, setIntegrityStatus] = React.useState('verified');
  const [exporting, setExporting] = React.useState(false);

  const traceabilityData = {
    translationId: 1247,
    sections: [
      {
        id: 'dosage',
        name: 'Dosage and Administration',
        translatedText: '成人劑量：每日一次，每次500毫克，飯後服用。兒童劑量：根據體重計算，每公斤10毫克，每日兩次。腎功能不全患者需調整劑量。',
        confidenceScore: 92,
        sourceReferences: [
          {
            id: 'ref1',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 3,
            paragraphNumber: 5,
            sourceText: 'Adult dosage: 500mg once daily, taken after meals. Pediatric dosage: 10mg/kg body weight, twice daily. Dosage adjustments required for renal impairment.',
            linkHash: 'a1b2c3d4e5f67890abcdef1234567890',
          },
          {
            id: 'ref2',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 3,
            paragraphNumber: 6,
            sourceText: 'Maximum daily dose should not exceed 4000mg. For patients with hepatic impairment, reduce dose by 50%.',
            linkHash: 'f6e5d4c3b2a1098765432109876543210',
          },
        ],
      },
      {
        id: 'contraindications',
        name: 'Contraindications',
        translatedText: '禁忌症：對本品任何成分過敏者禁用。嚴重肝功能不全患者禁用。孕婦及哺乳期婦女禁用。12歲以下兒童禁用高劑量製劑。',
        confidenceScore: 95,
        sourceReferences: [
          {
            id: 'ref3',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 4,
            paragraphNumber: 2,
            sourceText: 'Contraindicated in patients with known hypersensitivity to any component. Not for use in severe hepatic impairment. Contraindicated in pregnancy and lactation. High-dose formulations contraindicated in children under 12 years.',
            linkHash: 'b2c3d4e5f6a1234567890abcdef123456',
          },
        ],
      },
      {
        id: 'adverse',
        name: 'Adverse Reactions',
        translatedText: '常見不良反應：頭痛（10%）、噁心（8%）、腹瀉（5%）、皮疹（3%）。罕見但嚴重：過敏性休克（<0.1%）、肝毒性（<0.5%）、血小板減少（<0.2%）。',
        confidenceScore: 88,
        sourceReferences: [
          {
            id: 'ref4',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 5,
            paragraphNumber: 3,
            sourceText: 'Common adverse reactions: headache (10%), nausea (8%), diarrhea (5%), rash (3%). Rare but serious: anaphylactic shock (<0.1%), hepatotoxicity (<0.5%), thrombocytopenia (<0.2%).',
            linkHash: 'c3d4e5f6a1b2345678901234567890abc',
          },
          {
            id: 'ref5',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 5,
            paragraphNumber: 4,
            sourceText: 'If severe allergic reactions occur, discontinue immediately and seek medical attention.',
            linkHash: 'd4e5f6a1b2c3456789012345678901bcd',
          },
        ],
      },
      {
        id: 'warnings',
        name: 'Warnings and Precautions',
        translatedText: '警告：長期使用可能導致肝損傷。酗酒者風險增加。與其他含對乙酰氨基酚藥物併用時需謹慎，避免超過最大劑量。',
        confidenceScore: 90,
        sourceReferences: [
          {
            id: 'ref6',
            documentPath: 's3://pils/innovator-paracetamol-2024.pdf',
            pageNumber: 6,
            paragraphNumber: 1,
            sourceText: 'Warning: Prolonged use may cause liver damage. Risk increased in chronic alcohol users. Use caution when combining with other acetaminophen-containing products to avoid exceeding maximum dose.',
            linkHash: 'e5f6a1b2c3d4567890123456789012cde',
          },
        ],
      },
    ],
  };

  const getConfidenceColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 85) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getConfidenceBg = (score) => {
    if (score >= 90) return 'bg-emerald-500/20';
    if (score >= 85) return 'bg-amber-500/20';
    return 'bg-rose-500/20';
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert('✅ Traceability log exported to s3://pils/traceability-logs/1247/export-2024-01-15.json');
    }, 1500);
  };

  const selectedSectionData = traceabilityData.sections.find(s => s.id === selectedSection);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-violet-500/20 p-3 rounded-xl">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Source Document Traceability</h1>
                <p className="text-sm text-zinc-400">Translation ID: {traceabilityData.translationId} • Paracetamol 500mg PIL</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {integrityStatus === 'verified' && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-emerald-400">Integrity Verified</span>
                </div>
              )}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                {exporting ? '⏳ Exporting...' : '📥 Export Log'}
              </button>
              <button
                onClick={() => setShowTraceability(false)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-zinc-500 mb-1">Total Sections</div>
              <div className="text-2xl font-bold text-white">{traceabilityData.sections.length}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-zinc-500 mb-1">Source References</div>
              <div className="text-2xl font-bold text-white">
                {traceabilityData.sections.reduce((sum, s) => sum + s.sourceReferences.length, 0)}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-zinc-500 mb-1">Avg Confidence</div>
              <div className="text-2xl font-bold text-emerald-400">
                {Math.round(traceabilityData.sections.reduce((sum, s) => sum + s.confidenceScore, 0) / traceabilityData.sections.length)}%
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-zinc-500 mb-1">Source Document</div>
              <div className="text-sm font-semibold text-white truncate">innovator-paracetamol-2024.pdf</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Section List */}
          <div className="col-span-4 space-y-3">
            <div className="bg-zinc-800/30 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-3">PIL Sections</h3>
              <div className="space-y-2">
                {traceabilityData.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedSection === section.id
                        ? 'bg-violet-500/20 border-2 border-violet-500/50 shadow-lg shadow-violet-500/10'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm">{section.name}</span>
                      <span className={`text-xs font-bold ${getConfidenceColor(section.confidenceScore)}`}>
                        {section.confidenceScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-zinc-400">
                        {section.sourceReferences.length} reference{section.sourceReferences.length !== 1 ? 's' : ''}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceBg(section.confidenceScore)} ${getConfidenceColor(section.confidenceScore)}`}>
                        {section.confidenceScore >= 90 ? 'High' : section.confidenceScore >= 85 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detail View */}
          <div className="col-span-8 space-y-6">
            {selectedSectionData && (
              <>
                {/* Translated Text */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Translated Text</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-zinc-500">Confidence:</span>
                      <span className={`text-sm font-bold ${getConfidenceColor(selectedSectionData.confidenceScore)}`}>
                        {selectedSectionData.confidenceScore}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-5 border border-white/5">
                    <p className="text-zinc-200 leading-relaxed text-base">{selectedSectionData.translatedText}</p>
                  </div>
                </div>

                {/* Source References */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Source References ({selectedSectionData.sourceReferences.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedSectionData.sourceReferences.map((ref, index) => (
                      <div key={ref.id} className="bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden">
                        <button
                          onClick={() => setExpandedRef(expandedRef === ref.id ? null : ref.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-cyan-500/20 px-3 py-1.5 rounded-lg">
                              <span className="text-cyan-400 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div className="text-left">
                              <div className="text-white font-semibold text-sm">
                                {ref.documentPath.split('/').pop()}
                              </div>
                              <div className="text-xs text-zinc-400">
                                Page {ref.pageNumber}, Paragraph {ref.paragraphNumber}
                              </div>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-zinc-400 transition-transform ${expandedRef === ref.id ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedRef === ref.id && (
                          <div className="p-4 border-t border-white/10 space-y-4">
                            <div>
                              <div className="text-xs text-zinc-500 mb-2 font-semibold">Source Text (English)</div>
                              <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-800/50 p-4 rounded-lg border border-white/5">
                                {ref.sourceText}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-zinc-500">
                                Link Hash: <span className="text-zinc-400 font-mono">{ref.linkHash.substring(0, 20)}...</span>
                              </div>
                              <button className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl text-xs font-semibold transition-colors border border-violet-500/30">
                                📄 View in Document
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Document Hash</div>
                                <div className="text-xs text-zinc-300 font-mono">SHA-256 verified ✓</div>
                              </div>
                              <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Created</div>
                                <div className="text-xs text-zinc-300">2024-01-15 14:23:45 UTC</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cryptographic Verification */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-6 border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-500/20 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold mb-2">Cryptographic Integrity Verified</h4>
                      <p className="text-sm text-zinc-300 mb-3">
                        All traceability links have been verified using SHA-256 cryptographic hashing. Source document integrity confirmed.
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-zinc-400">
                        <div className="flex items-center space-x-1">
                          <span>✓</span>
                          <span>Source hash verified</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>✓</span>
                          <span>Link hashes verified</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>✓</span>
                          <span>Audit trail complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}