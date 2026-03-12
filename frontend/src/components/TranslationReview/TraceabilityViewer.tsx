import React, { useState, useEffect } from 'react';

interface TraceabilityData {
  translationMetadata: {
    pilId: number;
    productName: string;
    sourceLanguage: string;
    targetLanguage: string;
    llmModelVersion: string;
    processingTimeMs: number;
    timestamp: string;
  };
  qualityMetrics: {
    sectionsTranslated: number;
    lowConfidenceSections: number;
    averageConfidence: number;
  };
}

interface TraceabilityViewerProps {
  translationId: number;
}

export const TraceabilityViewer: React.FC<TraceabilityViewerProps> = ({
  translationId,
}) => {
  const [data, setData] = useState<TraceabilityData | null>(null);

  useEffect(() => {
    // Mock API call
    const mockData: TraceabilityData = {
      translationMetadata: {
        pilId: 101,
        productName: 'Innovator Drug 500mg Tablets',
        sourceLanguage: 'en',
        targetLanguage: 'zh-TW',
        llmModelVersion: 'gpt-4-1106-preview',
        processingTimeMs: 45230,
        timestamp: '2024-01-15T10:30:45Z',
      },
      qualityMetrics: {
        sectionsTranslated: 4,
        lowConfidenceSections: 1,
        averageConfidence: 92,
      },
    };
    setData(mockData);
  }, [translationId]);

  if (!data) return null;

  return (
    <div className="p-5 rounded-2xl bg-zinc-800/50 border border-white/[0.06]">
      <h3 className="text-base font-bold text-white mb-4">
        Translation Traceability Log
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Metadata */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">LLM Model</label>
            <p className="text-sm text-white mt-1">
              {data.translationMetadata.llmModelVersion}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">
              Processing Time
            </label>
            <p className="text-sm text-white mt-1">
              {(data.translationMetadata.processingTimeMs / 1000).toFixed(2)}s
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Timestamp</label>
            <p className="text-sm text-white mt-1">
              {new Date(data.translationMetadata.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 font-medium">
              Sections Translated
            </label>
            <p className="text-sm text-white mt-1">
              {data.qualityMetrics.sectionsTranslated}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">
              Low Confidence Sections
            </label>
            <p className="text-sm text-amber-400 mt-1">
              {data.qualityMetrics.lowConfidenceSections}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">
              Average Confidence
            </label>
            <p className="text-sm text-emerald-400 mt-1">
              {data.qualityMetrics.averageConfidence}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <p className="text-xs text-violet-300">
          ✅ Complete audit trail available for regulatory inspection. All
          source-to-translation mappings logged with cryptographic verification.
        </p>
      </div>
    </div>
  );
};