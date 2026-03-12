import React, { useState, useEffect } from 'react';
import { SourceReferenceCard } from './SourceReferenceCard';
import { IntegrityBadge } from './IntegrityBadge';

interface SourceReference {
  documentPath: string;
  pageNumber: number;
  paragraphNumber: number;
  sourceText: string;
  linkHash: string;
}

interface TraceabilitySection {
  sectionName: string;
  translatedText: string;
  sourceReferences: SourceReference[];
  confidenceScore: number;
}

interface TraceabilityData {
  translationId: number;
  sections: TraceabilitySection[];
}

interface TraceabilityViewerProps {
  translationId: number;
  onClose: () => void;
}

export const TraceabilityViewer: React.FC<TraceabilityViewerProps> = ({
  translationId,
  onClose,
}) => {
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [integrityValid, setIntegrityValid] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTraceability();
    verifyIntegrity();
  }, [translationId]);

  const fetchTraceability = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      const mockData: TraceabilityData = {
        translationId,
        sections: [
          {
            sectionName: 'Dosage and Administration',
            translatedText:
              '成人劑量：每日一次，每次500毫克，飯後服用。兒童劑量：根據體重計算，每公斤10毫克，每日兩次。',
            sourceReferences: [
              {
                documentPath: 's3://pils/innovator-123.pdf',
                pageNumber: 3,
                paragraphNumber: 5,
                sourceText:
                  'Adult dosage: 500mg once daily, taken after meals. Pediatric dosage: 10mg/kg body weight, twice daily.',
                linkHash: 'a1b2c3d4e5f6...',
              },
              {
                documentPath: 's3://pils/innovator-123.pdf',
                pageNumber: 3,
                paragraphNumber: 6,
                sourceText:
                  'Dosage adjustments may be required for patients with renal impairment.',
                linkHash: 'f6e5d4c3b2a1...',
              },
            ],
            confidenceScore: 92,
          },
          {
            sectionName: 'Contraindications',
            translatedText:
              '禁忌症：對本品任何成分過敏者禁用。嚴重肝功能不全患者禁用。孕婦及哺乳期婦女禁用。',
            sourceReferences: [
              {
                documentPath: 's3://pils/innovator-123.pdf',
                pageNumber: 4,
                paragraphNumber: 2,
                sourceText:
                  'Contraindicated in patients with known hypersensitivity to any component. Not for use in severe hepatic impairment. Contraindicated in pregnancy and lactation.',
                linkHash: 'b2c3d4e5f6a1...',
              },
            ],
            confidenceScore: 95,
          },
          {
            sectionName: 'Adverse Reactions',
            translatedText:
              '常見不良反應：頭痛（10%）、噁心（8%）、腹瀉（5%）。罕見但嚴重：過敏性休克（<0.1%）。',
            sourceReferences: [
              {
                documentPath: 's3://pils/innovator-123.pdf',
                pageNumber: 5,
                paragraphNumber: 3,
                sourceText:
                  'Common adverse reactions: headache (10%), nausea (8%), diarrhea (5%). Rare but serious: anaphylactic shock (<0.1%).',
                linkHash: 'c3d4e5f6a1b2...',
              },
            ],
            confidenceScore: 88,
          },
        ],
      };

      setTimeout(() => {
        setData(mockData);
        setLoading(false);
        if (mockData.sections.length > 0) {
          setSelectedSection(mockData.sections[0].sectionName);
        }
      }, 800);
    } catch (error) {
      console.error('Failed to fetch traceability:', error);
      setLoading(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      // Mock API call
      setTimeout(() => {
        setIntegrityValid(true);
      }, 1000);
    } catch (error) {
      console.error('Failed to verify integrity:', error);
      setIntegrityValid(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // Mock export
      setTimeout(() => {
        alert('Traceability log exported successfully');
        setExporting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to export log:', error);
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-zinc-800 rounded-2xl p-8 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            <span className="text-white text-lg">Loading traceability data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const selectedSectionData = data.sections.find((s) => s.sectionName === selectedSection);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-zinc-800/50 border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-violet-500/20 p-3 rounded-xl">
              <svg
                className="w-6 h-6 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Source Document Traceability</h2>
              <p className="text-sm text-zinc-400">Translation ID: {translationId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <IntegrityBadge isValid={integrityValid} />
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : '📥 Export Log'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg
                className="w-6 h-6 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Section List */}
          <div className="w-80 border-r border-white/10 overflow-y-auto bg-zinc-900/50">
            <div className="p-4 space-y-2">
              {data.sections.map((section) => (
                <button
                  key={section.sectionName}
                  onClick={() => setSelectedSection(section.sectionName)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedSection === section.sectionName
                      ? 'bg-violet-500/20 border-2 border-violet-500/50'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">{section.sectionName}</span>
                    <span
                      className={`text-xs font-bold ${
                        section.confidenceScore >= 90
                          ? 'text-emerald-400'
                          : section.confidenceScore >= 85
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {section.confidenceScore}%
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {section.sourceReferences.length} source reference
                    {section.sourceReferences.length !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail View */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedSectionData && (
              <div className="space-y-6">
                {/* Translated Text */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-3">Translated Text</h3>
                  <p className="text-zinc-300 leading-relaxed">{selectedSectionData.translatedText}</p>
                  <div className="mt-4 flex items-center space-x-2">
                    <span className="text-xs text-zinc-500">Confidence Score:</span>
                    <span
                      className={`text-sm font-bold ${
                        selectedSectionData.confidenceScore >= 90
                          ? 'text-emerald-400'
                          : selectedSectionData.confidenceScore >= 85
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {selectedSectionData.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Source References */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    Source References ({selectedSectionData.sourceReferences.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedSectionData.sourceReferences.map((ref, index) => (
                      <SourceReferenceCard key={ref.linkHash} reference={ref} index={index} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};