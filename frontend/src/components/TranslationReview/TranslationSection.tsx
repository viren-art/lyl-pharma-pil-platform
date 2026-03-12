import React from 'react';

interface TranslationSectionProps {
  section: {
    sectionName: string;
    sourceText: string;
    translatedText: string;
    confidenceScore: number;
    sourceReferences: Array<{
      pageNumber: number;
      paragraphNumber: number;
    }>;
  };
  isLowConfidence: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export const TranslationSection: React.FC<TranslationSectionProps> = ({
  section,
  isLowConfidence,
  isSelected,
  onSelect,
}) => {
  const getConfidenceBadgeColor = (score: number): string => {
    if (score >= 95) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 85) return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10'
          : isLowConfidence
          ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30'
          : 'bg-zinc-800/50 border-white/[0.06] hover:border-white/10'
      }`}
    >
      {/* Section Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-base font-bold text-white">{section.sectionName}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Source: Page {section.sourceReferences[0].pageNumber}, Paragraph{' '}
            {section.sourceReferences[0].paragraphNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLowConfidence && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30">
              ⚠️ Review Required
            </span>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(
              section.confidenceScore
            )}`}
          >
            {section.confidenceScore}% confidence
          </span>
        </div>
      </div>

      {/* Source Text */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Source (English)
        </label>
        <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
          {section.sourceText}
        </p>
      </div>

      {/* Translated Text */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Translation (Traditional Chinese)
        </label>
        <p className="mt-2 text-sm text-white leading-relaxed">
          {section.translatedText}
        </p>
      </div>

      {/* Low Confidence Warning */}
      {isLowConfidence && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-xs text-rose-300">
            This section requires mandatory human review due to confidence score below
            85% threshold. Please verify pharmaceutical terminology accuracy.
          </p>
        </div>
      )}
    </div>
  );
};