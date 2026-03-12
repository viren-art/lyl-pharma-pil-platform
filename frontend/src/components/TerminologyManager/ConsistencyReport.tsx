import React, { useState, useEffect } from 'react';

interface ConsistencyReportData {
  totalTerms: number;
  consistentTerms: number;
  inconsistentTerms: Array<{
    sourceTerm: string;
    variations: Array<{ targetTerm: string; usageCount: number }>;
  }>;
}

interface ConsistencyReportProps {
  targetLanguage: string;
  market: string;
}

export const ConsistencyReport: React.FC<ConsistencyReportProps> = ({
  targetLanguage,
  market
}) => {
  const [report, setReport] = useState<ConsistencyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [targetLanguage, market]);

  const fetchReport = async () => {
    try {
      const response = await fetch(
        `/api/v1/translation-memory/consistency-report?targetLanguage=${targetLanguage}&market=${market}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch consistency report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
        <p className="text-zinc-400">Generating consistency report...</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const consistencyPercentage = (report.consistentTerms / report.totalTerms) * 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
          <div className="text-sm text-zinc-400 mb-1">Total Terms</div>
          <div className="text-3xl font-bold">{report.totalTerms}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
          <div className="text-sm text-zinc-400 mb-1">Consistent</div>
          <div className="text-3xl font-bold text-emerald-400">{report.consistentTerms}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
          <div className="text-sm text-zinc-400 mb-1">Inconsistent</div>
          <div className="text-3xl font-bold text-amber-400">
            {report.inconsistentTerms.length}
          </div>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Terminology Consistency Score</h3>
          <span className="text-2xl font-bold text-violet-400">
            {consistencyPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-violet-500 to-emerald-500 h-3 rounded-full transition-all"
            style={{ width: `${consistencyPercentage}%` }}
          />
        </div>
      </div>

      {/* Inconsistent Terms */}
      {report.inconsistentTerms.length > 0 && (
        <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-lg font-bold mb-4">Inconsistent Terms Requiring Review</h3>
          <div className="space-y-4">
            {report.inconsistentTerms.map((item, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 rounded-xl p-4 border border-amber-500/20"
              >
                <div className="font-semibold mb-3">{item.sourceTerm}</div>
                <div className="space-y-2">
                  {item.variations.map((variation, vIndex) => (
                    <div
                      key={vIndex}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-300">{variation.targetTerm}</span>
                      <span className="text-zinc-500">
                        Used {variation.usageCount} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};