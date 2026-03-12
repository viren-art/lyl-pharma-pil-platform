import React from 'react';

interface ComplianceReport {
  modelVersion: string;
  regulatoryAuthorities: Array<{
    authority: string;
    compliant: boolean;
    attestationDate: string;
    attestedBy: string;
    expiryDate: string;
  }>;
  trainingDataProvenance: {
    fullyDocumented: boolean;
    sources: string[];
    totalDocuments: number;
  };
  validationTestsPassed: boolean;
  humanInTheLoopImplemented: boolean;
  confidenceScoringDocumented: boolean;
}

interface ComplianceStatusCardProps {
  complianceReport: ComplianceReport;
}

export const ComplianceStatusCard: React.FC<ComplianceStatusCardProps> = ({
  complianceReport,
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90;
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Compliance Status</h2>

      {/* Regulatory Authorities */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Regulatory Attestations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {complianceReport.regulatoryAuthorities.map((authority) => (
            <div
              key={authority.authority}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">{authority.authority}</h4>
                {authority.compliant ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Compliant
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ✗ Non-Compliant
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-zinc-500">Attested By</p>
                  <p className="text-zinc-300">{authority.attestedBy}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Attestation Date</p>
                  <p className="text-zinc-300">{formatDate(authority.attestationDate)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Expiry Date</p>
                  <p
                    className={
                      isExpiringSoon(authority.expiryDate) ? 'text-amber-400' : 'text-zinc-300'
                    }
                  >
                    {formatDate(authority.expiryDate)}
                    {isExpiringSoon(authority.expiryDate) && ' ⚠️'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Checklist */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Compliance Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                complianceReport.trainingDataProvenance.fullyDocumented
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {complianceReport.trainingDataProvenance.fullyDocumented ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Training Data Provenance</p>
              <p className="text-xs text-zinc-400">
                {complianceReport.trainingDataProvenance.totalDocuments.toLocaleString()} documents
                from {complianceReport.trainingDataProvenance.sources.length} sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                complianceReport.validationTestsPassed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {complianceReport.validationTestsPassed ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Validation Tests</p>
              <p className="text-xs text-zinc-400">
                {complianceReport.validationTestsPassed ? 'All tests passed' : 'Tests pending'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                complianceReport.humanInTheLoopImplemented
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {complianceReport.humanInTheLoopImplemented ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Human-in-the-Loop</p>
              <p className="text-xs text-zinc-400">
                {complianceReport.humanInTheLoopImplemented
                  ? 'Implemented and documented'
                  : 'Not implemented'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                complianceReport.confidenceScoringDocumented
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {complianceReport.confidenceScoringDocumented ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Confidence Scoring</p>
              <p className="text-xs text-zinc-400">
                {complianceReport.confidenceScoringDocumented
                  ? 'Methodology documented'
                  : 'Documentation pending'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};