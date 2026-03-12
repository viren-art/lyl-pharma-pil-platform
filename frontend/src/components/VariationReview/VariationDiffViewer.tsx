import React from 'react';

interface SectionDiff {
  sectionType: string;
  sectionName: string;
  currentText: string;
  requiredText: string;
  diffHighlights: DiffHighlight[];
  confidence: number;
  requiresUpdate: boolean;
}

interface DiffHighlight {
  type: 'addition' | 'deletion' | 'modification';
  startIndex: number;
  endIndex: number;
  originalText?: string;
  newText?: string;
}

interface VariationDiffViewerProps {
  section: SectionDiff;
}

export const VariationDiffViewer: React.FC<VariationDiffViewerProps> = ({ section }) => {
  const renderHighlightedText = (text: string, highlights: DiffHighlight[]) => {
    if (highlights.length === 0) {
      return <span>{text}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, highlight.startIndex)}
          </span>
        );
      }

      // Add
      // Add highlighted text
      if (highlight.type === 'addition') {
        parts.push(
          <span
            key={`highlight-${idx}`}
            className="bg-emerald-500/30 text-emerald-300 px-1 rounded"
          >
            {highlight.newText}
          </span>
        );
      } else if (highlight.type === 'deletion') {
        parts.push(
          <span
            key={`highlight-${idx}`}
            className="bg-rose-500/30 text-rose-300 line-through px-1 rounded"
          >
            {highlight.originalText}
          </span>
        );
      }

      lastIndex = highlight.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6">
      {/* Confidence Badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400">Confidence Score:</span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            section.confidence >= 85
              ? 'bg-emerald-500/20 text-emerald-400'
              : section.confidence >= 70
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {section.confidence}%
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
              {section.currentText}
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
              {renderHighlightedText(section.requiredText, section.diffHighlights)}
            </p>
          </div>
        </div>
      </div>

      {/* Change Summary */}
      {section.diffHighlights.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/[0.06]">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">Change Summary</h4>
          <div className="space-y-2">
            {section.diffHighlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                    highlight.type === 'addition'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {highlight.type === 'addition' ? '+ Added' : '- Removed'}
                </span>
                <span className="text-zinc-400 flex-1">
                  {highlight.type === 'addition' ? highlight.newText : highlight.originalText}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};