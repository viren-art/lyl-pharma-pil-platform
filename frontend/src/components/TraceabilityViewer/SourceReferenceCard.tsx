import React, { useState } from 'react';

interface SourceReference {
  documentPath: string;
  pageNumber: number;
  paragraphNumber: number;
  sourceText: string;
  linkHash: string;
}

interface SourceReferenceCardProps {
  reference: SourceReference;
  index: number;
}

export const SourceReferenceCard: React.FC<SourceReferenceCardProps> = ({ reference, index }) => {
  const [expanded, setExpanded] = useState(false);

  const getDocumentName = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/20 px-3 py-1 rounded-lg">
            <span className="text-cyan-400 font-bold text-sm">#{index + 1}</span>
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">{getDocumentName(reference.documentPath)}</div>
            <div className="text-xs text-zinc-400">
              Page {reference.pageNumber}, Paragraph {reference.paragraphNumber}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-4 border-t border-white/10 space-y-4">
          <div>
            <div className="text-xs text-zinc-500 mb-2">Source Text</div>
            <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900/50 p-3 rounded-lg">
              {reference.sourceText}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              Link Hash: <span className="text-zinc-400 font-mono">{reference.linkHash.substring(0, 16)}...</span>
            </div>
            <button className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-semibold transition-colors">
              View in Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};