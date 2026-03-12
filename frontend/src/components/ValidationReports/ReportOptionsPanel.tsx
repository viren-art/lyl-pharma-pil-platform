import React from 'react';

interface ReportOptions {
  includeTrainingData: boolean;
  includeTestResults: boolean;
  includeHumanOverrides: boolean;
  includeComplianceAttestations: boolean;
  format: 'pdf' | 'json';
}

interface ReportOptionsPanelProps {
  options: ReportOptions;
  onOptionsChange: (options: ReportOptions) => void;
  onGenerate: () => void;
  generating: boolean;
}

export const ReportOptionsPanel: React.FC<ReportOptionsPanelProps> = ({
  options,
  onOptionsChange,
  onGenerate,
  generating,
}) => {
  const handleToggle = (key: keyof ReportOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  const handleFormatChange = (format: 'pdf' | 'json') => {
    onOptionsChange({
      ...options,
      format,
    });
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Report Options</h2>

      {/* Include Options */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTrainingData}
            onChange={() => handleToggle('includeTrainingData')}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/50"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Include Training Data Provenance</p>
            <p className="text-xs text-zinc-400">
              Document sources, checksums, and training timeline
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTestResults}
            onChange={() => handleToggle('includeTestResults')}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/50"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Include Validation Test Results</p>
            <p className="text-xs text-zinc-400">
              Accuracy metrics, BLEU scores, and calibration data
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeHumanOverrides}
            onChange={() => handleToggle('includeHumanOverrides')}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/50"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Include Human Override Statistics</p>
            <p className="text-xs text-zinc-400">
              Override rates, reasons, and review times
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeComplianceAttestations}
            onChange={() => handleToggle('includeComplianceAttestations')}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/50"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Include Compliance Attestations</p>
            <p className="text-xs text-zinc-400">
              TFDA, FDA Thailand, and DAV regulatory approvals
            </p>
          </div>
        </label>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-zinc-300 mb-3">Export Format</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleFormatChange('pdf')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              options.format === 'pdf'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            📄 PDF Report
          </button>
          <button
            onClick={() => handleFormatChange('json')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              options.format === 'json'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            📋 JSON Data
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
          generating
            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]'
        }`}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Report...
          </span>
        ) : (
          '🚀 Generate Validation Report'
        )}
      </button>

      <p className="text-xs text-zinc-500 text-center mt-3">
        Report will be available for download within 24 hours
      </p>
    </div>
  );
};