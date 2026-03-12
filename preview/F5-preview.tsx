export default function F5Preview() {
  const [selectedMarket, setSelectedMarket] = React.useState('TFDA');
  const [selectedDocument, setSelectedDocument] = React.useState('formatted_pil');
  const [showValidation, setShowValidation] = React.useState(false);
  const [packageGenerated, setPackageGenerated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('format');

  const pilData = {
    id: 1247,
    productName: 'Amoxicillin 500mg Capsules',
    status: 'approved',
    market: 'TFDA',
    regulatoryRefNumber: 'TFDA-衛署藥製字第058392號',
    translationConfidence: 92,
    lastUpdated: '2024-01-15T10:30:00Z',
  };

  const formatValidation = {
    TFDA: {
      valid: true,
      errors: [],
      warnings: ['Missing recommended section: 藥物交互作用'],
      sections: [
        { name: '藥品名稱', status: 'valid', required: true },
        { name: '適應症', status: 'valid', required: true },
        { name: '用法用量', status: 'valid', required: true },
        { name: '禁忌症', status: 'valid', required: true },
        { name: '警語及注意事項', status: 'valid', required: true },
        { name: '不良反應', status: 'valid', required: true },
        { name: '藥理作用', status: 'valid', required: false },
        { name: '儲存條件', status: 'valid', required: false },
      ],
      fontCheck: { family: '標楷體', size: 12, status: 'valid' },
      marginCheck: { top: 25.4, bottom: 25.4, left: 31.75, right: 31.75, status: 'valid' },
      encodingCheck: { type: 'UTF-8', traditionalChinese: true, status: 'valid' },
    },
    FDA_Thailand: {
      valid: true,
      errors: [],
      warnings: [],
      sections: [
        { name: 'ชื่อยา', status: 'valid', required: true },
        { name: 'ข้อบ่งใช้', status: 'valid', required: true },
        { name: 'ขนาดยาและวิธีใช้', status: 'valid', required: true },
        { name: 'ข้อห้ามใช้', status: 'valid', required: true },
        { name: 'คำเตือน', status: 'valid', required: true },
        { name: 'ผลข้างเคียง', status: 'valid', required: true },
        { name: 'เภสัชวิทยา', status: 'valid', required: false },
      ],
      fontCheck: { family: 'TH Sarabun New', size: 14, status: 'valid' },
      marginCheck: { top: 20, bottom: 20, left: 25, right: 25, status: 'valid' },
      encodingCheck: { type: 'UTF-8', thaiScript: true, status: 'valid' },
    },
    DAV: {
      valid: true,
      errors: [],
      warnings: ['Low Vietnamese diacritic usage in section: Liều lượng và cách dùng'],
      sections: [
        { name: 'Tên thuốc', status: 'valid', required: true },
        { name: 'Chỉ định', status: 'valid', required: true },
        { name: 'Liều lượng và cách dùng', status: 'warning', required: true },
        { name: 'Chống chỉ định', status: 'valid', required: true },
        { name: 'Cảnh báo', status: 'valid', required: true },
        { name: 'Tác dụng không mong muốn', status: 'valid', required: true },
        { name: 'Dược lực học', status: 'valid', required: false },
      ],
      fontCheck: { family: 'Times New Roman', size: 12, status: 'valid' },
      marginCheck: { top: 20, bottom: 20, left: 25, right: 25, status: 'valid' },
      encodingCheck: { type: 'UTF-8', vietnameseDiacritics: true, status: 'valid' },
    },
  };

  const submissionPackage = {
    packageId: 8392,
    generatedAt: '2024-01-15T14:22:00Z',
    packagePath: 's3://lotus-submissions/TFDA/Amoxicillin-1705329720.zip',
    sizeInMB: 3.2,
    contents: [
      { type: 'formatted_pil', name: '01_formatted_pil.pdf', size: '2.1 MB', status: 'ready' },
      { type: 'cover_letter', name: '02_cover_letter.pdf', size: '0.3 MB', status: 'ready' },
      { type: 'revision_history', name: '03_revision_history.pdf', size: '0.5 MB', status: 'ready' },
      { type: 'comparison_table', name: '04_comparison_table.pdf', size: '0.3 MB', status: 'ready' },
    ],
  };

  const currentValidation = formatValidation[selectedMarket];

  const getStatusColor = (status) => {
    if (status === 'valid') return 'text-emerald-400';
    if (status === 'warning') return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStatusBg = (status) => {
    if (status === 'valid') return 'bg-emerald-500/10 border-emerald-500/20';
    if (status === 'warning') return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const handleGeneratePackage = () => {
    setPackageGenerated(true);
    setActiveTab('package');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Regulatory Format Engine</h1>
              <p className="text-sm text-slate-400 mt-1">Multi-market PIL formatting & submission package assembly</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">PIL ID</div>
                <div className="text-sm font-semibold text-violet-400">#{pilData.id}</div>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-400">Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Product Info Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-slate-500 mb-1">Product Name</div>
              <div className="text-sm font-semibold text-white">{pilData.productName}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Regulatory Ref</div>
              <div className="text-sm font-mono text-violet-400">{pilData.regulatoryRefNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Translation Confidence</div>
              <div className="text-sm font-semibold text-emerald-400">{pilData.translationConfidence}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Last Updated</div>
              <div className="text-sm text-slate-300">{new Date(pilData.lastUpdated).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Market Selection */}
        <div className="flex gap-3 mb-6">
          {['TFDA', 'FDA_Thailand', 'DAV'].map((market) => (
            <button
              key={market}
              onClick={() => setSelectedMarket(market)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                selectedMarket === market
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {market === 'TFDA' && '🇹🇼 TFDA (Taiwan)'}
              {market === 'FDA_Thailand' && '🇹🇭 FDA Thailand'}
              {market === 'DAV' && '🇻🇳 DAV (Vietnam)'}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: 'format', label: 'Format Validation', icon: '📋' },
            { id: 'preview', label: 'Document Preview', icon: '👁️' },
            { id: 'package', label: 'Submission Package', icon: '📦' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Format Validation Tab */}
        {activeTab === 'format' && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className={`rounded-2xl p-6 border ${getStatusBg(currentValidation.valid ? 'valid' : 'warning')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {currentValidation.valid ? '✅ Format Validation Passed' : '⚠️ Format Validation Warnings'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {currentValidation.errors.length} errors, {currentValidation.warnings.length} warnings
                  </p>
                </div>
                <button
                  onClick={() => setShowValidation(!showValidation)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all"
                >
                  {showValidation ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showValidation && (
                <div className="mt-4 space-y-3">
                  {currentValidation.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <span className="text-amber-400">⚠️</span>
                      <span className="text-sm text-amber-200">{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section Validation */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-4">Section Validation</h3>
              <div className="space-y-2">
                {currentValidation.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${getStatusColor(section.status)}`}>
                        {section.status === 'valid' ? '✓' : '⚠'}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{section.name}</div>
                        <div className="text-xs text-slate-500">
                          {section.required ? 'Required' : 'Optional'}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(section.status)}`}>
                      {section.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="text-xs text-slate-500 mb-2">Font Specification</div>
                <div className="text-sm font-semibold mb-1">{currentValidation.fontCheck.family}</div>
                <div className="text-xs text-slate-400">{currentValidation.fontCheck.size}pt</div>
                <div className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(currentValidation.fontCheck.status)}`}>
                  {currentValidation.fontCheck.status}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="text-xs text-slate-500 mb-2">Page Margins (mm)</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Top: {currentValidation.marginCheck.top}</div>
                  <div>Bottom: {currentValidation.marginCheck.bottom}</div>
                  <div>Left: {currentValidation.marginCheck.left}</div>
                  <div>Right: {currentValidation.marginCheck.right}</div>
                </div>
                <div className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(currentValidation.marginCheck.status)}`}>
                  {currentValidation.marginCheck.status}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="text-xs text-slate-500 mb-2">Character Encoding</div>
                <div className="text-sm font-semibold mb-1">{currentValidation.encodingCheck.type}</div>
                <div className="text-xs text-slate-400">
                  {selectedMarket === 'TFDA' && 'Traditional Chinese ✓'}
                  {selectedMarket === 'FDA_Thailand' && 'Thai Script ✓'}
                  {selectedMarket === 'DAV' && 'Vietnamese Diacritics ✓'}
                </div>
                <div className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(currentValidation.encodingCheck.status)}`}>
                  {currentValidation.encodingCheck.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Document Preview</h3>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="formatted_pil">Formatted PIL</option>
                  <option value="cover_letter">Cover Letter</option>
                  <option value="revision_history">Revision History</option>
                </select>
              </div>

              {/* Mock PDF Preview */}
              <div className="bg-slate-800 rounded-xl p-8 border border-white/10 min-h-[600px]">
                <div className="bg-white rounded-lg shadow-2xl p-12 max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{pilData.productName}</h2>
                    <p className="text-sm text-slate-600">
                      {selectedMarket === 'TFDA' && '藥品仿單'}
                      {selectedMarket === 'FDA_Thailand' && 'เอกสารกำกับยา'}
                      {selectedMarket === 'DAV' && 'Tờ hướng dẫn sử dụng thuốc'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{pilData.regulatoryRefNumber}</p>
                  </div>

                  <div className="space-y-6 text-slate-800">
                    {currentValidation.sections.slice(0, 3).map((section, idx) => (
                      <div key={idx}>
                        <h3 className="text-lg font-bold mb-2 border-b border-slate-300 pb-1">{section.name}</h3>
                        <p className="text-sm leading-relaxed text-slate-700">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-300 text-center text-xs text-slate-500">
                    Page 1 of 8
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Package Tab */}
        {activeTab === 'package' && (
          <div className="space-y-6">
            {!packageGenerated ? (
              <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-bold mb-2">Generate Submission Package</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Create a submission-ready package with all required documents for {selectedMarket} regulatory portal upload.
                  </p>
                  <button
                    onClick={handleGeneratePackage}
                    className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold shadow-lg shadow-violet-500/30 transition-all"
                  >
                    Generate Package
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Package Info */}
                <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">✅</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-emerald-400 mb-1">Package Generated Successfully</h3>
                      <p className="text-sm text-slate-400">
                        Package ID: #{submissionPackage.packageId} • Generated: {new Date(submissionPackage.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Package Size</div>
                      <div className="text-2xl font-bold text-emerald-400">{submissionPackage.sizeInMB} MB</div>
                    </div>
                  </div>
                </div>

                {/* Package Contents */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold mb-4">Package Contents</h3>
                  <div className="space-y-3">
                    {submissionPackage.contents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">📄</div>
                          <div>
                            <div className="text-sm font-semibold">{doc.name}</div>
                            <div className="text-xs text-slate-500">{doc.size}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                            {doc.status}
                          </div>
                          <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all">
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex gap-4">
                  <button className="flex-1 py-4 px-6 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold shadow-lg shadow-violet-500/30 transition-all">
                    📥 Download Package (.zip)
                  </button>
                  <button className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition-all">
                    📋 Copy S3 Path
                  </button>
                  <button className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition-all">
                    🔗 Share Link
                  </button>
                </div>

                {/* Submission Checklist */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold mb-4">Pre-Submission Checklist</h3>
                  <div className="space-y-3">
                    {[
                      'All required sections validated',
                      'Format specifications met',
                      'Character encoding verified',
                      'Human approval gates completed',
                      'Translation confidence ≥85%',
                      'Package size within limits',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-emerald-400 text-lg">✓</span>
                        <span className="text-sm text-emerald-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}