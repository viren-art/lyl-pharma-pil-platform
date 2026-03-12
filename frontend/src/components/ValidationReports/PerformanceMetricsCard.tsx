import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  total
interface PerformanceMetrics {
  totalTranslations: number;
  confidenceScoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  humanOverrideRate: number;
  averageConfidenceScore: number;
  sectionAccuracy: Record<string, number>;
  languagePerformance: Record<string, number>;
}

interface PerformanceMetricsCardProps {
  modelVersion: string;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  modelVersion,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [modelVersion]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockMetrics: PerformanceMetrics = {
        totalTranslations: 1247,
        confidenceScoreDistribution: [
          { range: '0-50', count: 12, percentage: 0.96 },
          { range: '50-70', count: 45, percentage: 3.61 },
          { range: '70-85', count: 187, percentage: 15.0 },
          { range: '85-95', count: 623, percentage: 49.96 },
          { range: '95-100', count: 380, percentage: 30.47 },
        ],
        humanOverrideRate: 18.52,
        averageConfidenceScore: 87.3,
        sectionAccuracy: {
          'Product Name': 98.5,
          'Active Ingredients': 96.2,
          'Dosage': 94.8,
          'Contraindications': 92.1,
          'Adverse Reactions': 89.7,
          'Storage Instructions': 97.3,
        },
        languagePerformance: {
          'zh-TW': 88.5,
          th: 86.2,
          vi: 87.1,
        },
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
        <div className="text-zinc-400">Loading performance metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Performance Metrics</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Translations</p>
          <p className="text-2xl font-bold text-white">{metrics.totalTranslations.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Avg Confidence Score</p>
          <p className="text-2xl font-bold text-emerald-400">{metrics.averageConfidenceScore}%</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Human Override Rate</p>
          <p className="text-2xl font-bold text-amber-400">{metrics.humanOverrideRate}%</p>
        </div>
      </div>

      {/* Confidence Score Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Confidence Score Distribution</h3>
        <div className="space-y-2">
          {metrics.confidenceScoreDistribution.map((dist) => (
            <div key={dist.range} className="flex items-center gap-3">
              <div className="w-20 text-xs text-zinc-400">{dist.range}%</div>
              <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-400 flex items-center justify-end pr-2"
                  style={{ width: `${dist.percentage}%` }}
                >
                  {dist.percentage > 5 && (
                    <span className="text-xs font-medium text-white">{dist.percentage.toFixed(1)}%</span>
                  )}
                </div>
              </div>
              <div className="w-16 text-xs text-zinc-400 text-right">{dist.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Accuracy */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Section Accuracy</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(metrics.sectionAccuracy).map(([section, accuracy]) => (
            <div key={section} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-zinc-400 mb-1">{section}</p>
              <p className="text-lg font-bold text-white">{accuracy}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Language Performance */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Language Performance</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(metrics.languagePerformance).map(([lang, score]) => (
            <div key={lang} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400 mb-1">
                {lang === 'zh-TW' ? 'Traditional Chinese' : lang === 'th' ? 'Thai' : 'Vietnamese'}
              </p>
              <p className="text-xl font-bold text-white">{score}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};