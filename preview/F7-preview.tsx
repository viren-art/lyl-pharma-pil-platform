export default function F7Preview() {
  const [selectedVariation, setSelectedVariation] = React.useState(null);
  const [selectedSection, setSelectedSection] = React.useState(0);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [decision, setDecision] = React.useState(null);
  const [comments, setComments] = React.useState('');
  const [viewMode, setViewMode] = React.useState('list');

  const variations = [
    {
      id: 1,
      announcementId: 'TFDA-2024-0156',
      pilName: 'Paracetamol 500mg Tablets',
      market: 'TFDA',
      status: 'pending_review',
      overallConfidence: 88,
      affectedSectionsCount: 3,
      createdAt: '2024-01-15T10:30:00Z',
      affectedSections: [
        {
          sectionType: 'contraindications',
          sectionName: 'Contraindications',
          currentText: 'Hypersensitivity to active ingredient. Severe hepatic impairment. Pregnancy (first trimester).',
          requiredText: 'Hypersensitivity to active ingredient. Severe hepatic impairment. Pregnancy (all trimesters). Severe renal impairment (CrCl <30 mL/min).',
          confidence: 92,
          requiresUpdate: true,
          changes: [
            { type: 'modification', text: 'Pregnancy (all trimesters)', original: 'Pregnancy (first trimester)' },
            { type: 'addition', text: 'Severe renal impairment (CrCl <30 mL/min)' }
          ]
        },
        {
          sectionType: 'dosage',
          sectionName: 'Dosage and Administration',
          currentText: 'Adults: 500mg twice daily with food. Children (6-12 years): 250mg twice daily.',
          requiredText: 'Adults: 500mg once daily (reduced from twice daily). Children (6-12 years): 250mg twice daily.',
          confidence: 85,
          requiresUpdate: true,
          changes: [
            { type: 'modification', text: '500mg once daily (reduced from twice daily)', original: '500mg twice daily with food' }
          ]
        },
        {
          sectionType: 'adverse_events',
          sectionName: 'Adverse Reactions',
          currentText: 'Common (≥1%): Nausea, headache, dizziness. Uncommon (0.1-1%): Rash, elevated liver enzymes.',
          requiredText: 'Common (≥1%): Nausea, headache, dizziness. Uncommon (0.1-1%): Rash, elevated liver enzymes. Rare (<0.1%): Stevens-Johnson syndrome.',
          confidence: 90,
          requiresUpdate: true,
          changes: [
            { type: 'addition', text: 'Rare (<0.1%): Stevens-Johnson syndrome' }
          ]
        }
      ]
    },
    {
      id: 2,
      announcementId: 'FDA-TH-2024-0089',
      pilName: 'Ibuprofen 400mg Capsules',
      market: 'FDA_Thailand',
      status: 'draft_generated',
      overallConfidence: 76,
      affectedSectionsCount: 2,
      createdAt: '2024-01-14T14:20:00Z',
      affectedSections: [
        {
          sectionType: 'warnings',
          sectionName: 'Warnings and Precautions',
          currentText: 'Monitor liver function in patients with hepatic disease. Use caution in elderly patients.',
          requiredText: 'Monitor liver function in patients with hepatic disease. Use caution in elderly patients. Monitor renal function in patients with CrCl <60 mL/min.',
          confidence: 78,
          requiresUpdate: true,
          changes: [
            { type: 'addition', text: 'Monitor renal function in patients with CrCl <60 mL/min' }
          ]
        },
        {
          sectionType: 'interactions',
          sectionName: 'Drug Interactions',
          currentText: 'May interact with warfarin, increasing bleeding risk. Avoid concurrent use with alcohol.',
          requiredText: 'May interact with warfarin, increasing bleeding risk. Avoid concurrent use with alcohol. New: May reduce effectiveness of ACE inhibitors.',
          confidence: 74,
          requiresUpdate: true,
          changes: [
            { type: 'addition', text: 'May reduce effectiveness of ACE inhibitors' }
          ]
        }
      ]
    },
    {
      id: 3,
      announcementId: 'DAV-2024-0234',
      pilName: 'Amoxicillin 250mg Suspension',
      market: 'DAV',
      status: 'approved',
      overallConfidence: 94,
      affectedSectionsCount: 1,
      createdAt: '2024-01-13T09:15:00Z',
      affectedSections: [
        {
          sectionType: 'dosage',
          sectionName: 'Dosage and Administration',
          currentText: 'Children: 20-40 mg/kg/day in divided doses.',
          requiredText: 'Children: 25-50 mg/kg/day in divided doses (updated dosing range).',
          confidence: 94,
          requiresUpdate: true,
          changes: [
            { type: 'modification', text: '25-50 mg/kg/day', original: '20-40 mg/kg/day' }
          ]
        }
      ]
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-amber-500/20 text-amber-400',
      draft_generated: 'bg-cyan-500/20 text-cyan-400',
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-rose-500/20 text-rose-400'
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_review: 'Pending Review',
      draft_generated: 'Draft Generated',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'bg-emerald-500/20 text-emerald-400';
    if (confidence >= 70) return 'bg-amber-500/20 text-amber-400';
    return 'bg-rose-500/20 text-rose-400';
  };

  const getMarketColor = (market) => {
    const colors = {
      TFDA: 'bg-violet-500/20 text-violet-400',
      FDA_Thailand: 'bg-cyan-500/20 text-cyan-400',
      DAV: 'bg-rose-500/20 text-rose-400'
    };
    return colors[market] || 'bg-zinc-500/20 text-zinc-400';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleApprove = () => {
    setViewMode('list');
    setSelectedVariation(null);
    setShowApprovalModal(false);
    setDecision(null);
    setComments('');
  };

  const handleReject = () => {
    setViewMode('list');
    setSelectedVariation(null);
    setShowApprovalModal(false);
    setDecision(null);
    setComments('');
  };

  const renderHighlightedText = (text, changes) => {
    if (!changes || changes.length === 0) return text;

    const parts = [];
    let remainingText = text;

    changes.forEach((change, idx) => {
      if (change.type === 'addition') {
        const addIdx = remainingText.indexOf(change.text);
        if (addIdx !== -1) {
          parts.push(remainingText.substring(0, addIdx));
          parts.push(
            <span key={`add-${idx}`} className="bg-emerald-500/30 text-emerald-300 px-1 rounded">
              {change.text}
            </span>
          );
          remainingText = remainingText.substring(addIdx + change.text.length);
        }
      } else if (change.type === 'modification') {
        const modIdx = remainingText.indexOf(change.text);
        if (modIdx !== -1) {
          parts.push(remainingText.substring(0, modIdx));
          parts.push(
            <span key={`mod-${idx}`} className="bg-amber-500/30 text-amber-300 px-1 rounded">
              {change.text}
            </span>
          );
          remainingText = remainingText.substring(modIdx + change.text.length);
        }
      }
    });

    parts.push(remainingText);
    return parts;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Variation Impact Analysis</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Review regulatory variations and approve draft PILs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400">
                {variations.filter(v => v.status === 'pending_review').length} Pending Review
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {variations.map((variation) => (
              <div
                key={variation.id}
                className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedVariation(variation);
                  setSelectedSection(0);
                  setViewMode('detail');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{variation.pilName}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMarketColor(variation.market)}`}>
                        {variation.market}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(variation.status)}`}>
                        {getStatusLabel(variation.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>📋 {variation.announcementId}</span>
                      <span>📅 {formatDate(variation.createdAt)}</span>
                      <span>📊 {variation.affectedSectionsCount} sections affected</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-400 mb-1">Overall Confidence</div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-lg font-bold ${getConfidenceColor(variation.overallConfidence)}`}>
                      {variation.overallConfidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <span>←</span>
              <span>Back to Variations</span>
            </button>

            {/* Variation Header */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedVariation.pilName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMarketColor(selectedVariation.market)}`}>
                      {selectedVariation.market}
                    </span>
                    <span className="text-sm text-zinc-400">
                      Announcement: {selectedVariation.announcementId}
                    </span>
                    <span className="text-sm text-zinc-400">
                      Overall Confidence: {selectedVariation.overallConfidence}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedVariation.status === 'pending_review' && (
                    <>
                      <button className="px-4 py-2 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors">
                        Generate Draft PIL
                      </button>
                      <button
                        onClick={() => setShowApprovalModal(true)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        Review & Approve
                      </button>
                    </>
                  )}
                  {selectedVariation.status === 'draft_generated' && (
                    <button className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-colors">
                      📥 Download Draft
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="bg-zinc-800/50 rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="flex border-b border-white/[0.06] overflow-x-auto">
                {selectedVariation.affectedSections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSection(index)}
                    className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                      selectedSection === index
                        ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {section.sectionName}
                    <span className="ml-2 text-xs">({section.confidence}%)</span>
                  </button>
                ))}
              </div>

              {/* Diff Viewer */}
              <div className="p-6 space-y-6">
                {/* Confidence Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">Confidence Score:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(selectedVariation.affectedSections[selectedSection].confidence)}`}>
                    {selectedVariation.affectedSections[selectedSection].confidence}%
                  </span>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Current Text */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                      Current PIL
                    </h3>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedVariation.affectedSections[selectedSection].currentText}
                      </p>
                    </div>
                  </div>

                  {/* Required Text with Highlights */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">
                      Required Changes
                    </h3>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-violet-500/30">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {renderHighlightedText(
                          selectedVariation.affectedSections[selectedSection].requiredText,
                          selectedVariation.affectedSections[selectedSection].changes
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Summary */}
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/[0.06]">
                  <h4 className="text-sm font-semibold text-zinc-400 mb-3">Change Summary</h4>
                  <div className="space-y-2">
                    {selectedVariation.affectedSections[selectedSection].changes.map((change, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                          change.type === 'addition'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : change.type === 'modification'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {change.type === 'addition' ? '+ Added' : change.type === 'modification' ? '~ Modified' : '- Removed'}
                        </span>
                        <span className="text-zinc-400 flex-1">
                          {change.text}
                          {change.original && (
                            <span className="text-zinc-500 ml-2">(was: {change.original})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/[0.06] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Review Variation Analysis</h3>

            {/* Decision Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setDecision('approve')}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  decision === 'approve'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                ✅ Approve Analysis
              </button>
              <button
                onClick={() => setDecision('reject')}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  decision === 'reject'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                ❌ Reject Analysis
              </button>
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                Comments {decision === 'reject' && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  decision === 'reject'
                    ? 'Please explain why this variation analysis is being rejected...'
                    : 'Optional comments about this variation analysis...'
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setDecision(null);
                  setComments('');
                }}
                className="px-6 py-3 bg-zinc-700 text-white rounded-xl font-semibold hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={decision === 'approve' ? handleApprove : handleReject}
                disabled={!decision || (decision === 'reject' && !comments.trim())}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  decision && (decision === 'approve' || comments.trim())
                    ? decision === 'approve'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}