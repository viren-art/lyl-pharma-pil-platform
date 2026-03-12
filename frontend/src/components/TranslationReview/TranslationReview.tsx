import React, { useState, useEffect } from 'react';
import { TranslationSection } from './TranslationSection';
import { ConfidenceScoreCard } from './ConfidenceScoreCard';
import { TraceabilityViewer } from './TraceabilityViewer';

interface TranslationData {
  translationId: number;
  pilId: number;
  productName: string;
  targetLanguage: string;
  confidenceScore: number;
  status: 'pending_review' | 'approved';
  lowConfidenceSections: string[];
  sections: Array<{
    sectionName: string;
    sourceText: string;
    translatedText: string;
    confidenceScore: number;
    sourceReferences: Array<{
      pageNumber: number;
      paragraphNumber: number;
    }>;
  }>;
}

interface TranslationReviewProps {
  translationId: number;
}

export const TranslationReview: React.FC<TranslationReviewProps> = ({
  translationId,
}) => {
  const [translation, setTranslation] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showTraceability, setShowTraceability] = useState(false);

  useEffect(() => {
    fetchTranslation();
  }, [translationId]);

  const fetchTranslation = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockData: TranslationData = {
        translationId: 1,
        pilId: 101,
        productName: 'Innovator Drug 500mg Tablets',
        targetLanguage: 'zh-TW',
        confidenceScore: 92,
        status: 'pending_review',
        lowConfidenceSections: ['CONTRAINDICATIONS'],
        sections: [
          {
            sectionName: 'PRODUCT NAME',
            sourceText: 'Innovator Drug 500mg Tablets',
            translatedText: '創新藥物 500毫克錠劑',
            confidenceScore: 98,
            sourceReferences: [{ pageNumber: 1, paragraphNumber: 1 }],
          },
          {
            sectionName: 'CONTRAINDICATIONS',
            sourceText:
              'Hypersensitivity to the active substance or any excipients. Severe hepatic impairment.',
            translatedText: '對活性成分或任何賦形劑過敏反應。嚴重肝功能不全。',
            confidenceScore: 82,
            sourceReferences: [{ pageNumber: 2, paragraphNumber: 5 }],
          },
          {
            sectionName: 'POSOLOGY AND METHOD OF ADMINISTRATION',
            sourceText:
              'Adults: 500mg twice daily with food. Children: Not recommended for use in children under 12 years.',
            translatedText:
              '成人：每日兩次，每次500毫克，隨餐服用。兒童：不建議12歲以下兒童使用。',
            confidenceScore: 95,
            sourceReferences: [{ pageNumber: 3, paragraphNumber: 2 }],
          },
          {
            sectionName: 'UNDESIRABLE EFFECTS',
            sourceText:
              'Common (≥1/100 to <1/10): Nausea, headache, dizziness. Uncommon (≥1/1,000 to <1/100): Rash, abdominal pain.',
            translatedText:
              '常見（≥1/100至<1/10）：噁心、頭痛、頭暈。不常見（≥1/1,000至<1/100）：皮疹、腹痛。',
            confidenceScore: 91,
            sourceReferences: [{ pageNumber: 4, paragraphNumber: 8 }],
          },
        ],
      };

      setTranslation(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch translation:', error);
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 95) return 'text-emerald-500';
    if (score >= 85) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getConfidenceBadgeColor = (score: number): string => {
    if (score >= 95) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 85) return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-zinc-400">Loading translation...</div>
      </div>
    );
  }

  if (!translation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-rose-400">Translation not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {translation.productName}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Translation ID: {translation.translationId} • Target: Traditional
                Chinese (TFDA)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConfidenceScoreCard score={translation.confidenceScore} />
              <button
                onClick={() => setShowTraceability(!showTraceability)}
                className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 font-semibold hover:bg-violet-500/30 transition-colors"
              >
                {showTraceability ? 'Hide' : 'Show'} Traceability
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Banner */}
        {translation.lowConfidenceSections.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-400">
                  Human Review Required
                </h3>
                <p className="text-xs text-amber-300/80 mt-1">
                  {translation.lowConfidenceSections.length} section(s) below 85%
                  confidence threshold:{' '}
                  {translation.lowConfidenceSections.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Traceability Viewer */}
        {showTraceability && (
          <div className="mb-6">
            <TraceabilityViewer translationId={translation.translationId} />
          </div>
        )}

        {/* Translation Sections */}
        <div className="space-y-6">
          {translation.sections.map((section, index) => (
            <TranslationSection
              key={index}
              section={section}
              isLowConfidence={translation.lowConfidenceSections.includes(
                section.sectionName
              )}
              isSelected={selectedSection === section.sectionName}
              onSelect={() => setSelectedSection(section.sectionName)}
            />
          ))}
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex items-center justify-end gap-3 p-5 rounded-2xl bg-zinc-800/50 border border-white/[0.06]">
          <button className="px-6 py-3 rounded-xl bg-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-600 transition-colors">
            Request Revision
          </button>
          <button className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors">
            Approve Translation
          </button>
        </div>
      </div>
    </div>
  );
};