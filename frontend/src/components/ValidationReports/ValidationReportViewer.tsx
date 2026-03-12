import React, { useState, useEffect } from 'react';
import { ModelVersionSelector } from './ModelVersionSelector';
import { ReportOptionsPanel } from './ReportOptionsPanel';
import { ComplianceStatusCard } from './ComplianceStatusCard';
import { PerformanceMetricsCard } from './PerformanceMetricsCard';

interface LLMModel {
  id: number;
  modelVersion: string;
  baseModel: string;
  status: string;
  description: string;
  activatedAt: string | null;
  validatedBy: {
    fullName: string;
  } | null;
  validatedAt: string | null;
}

interface ValidationReport {
  reportId: string;
  modelVersion: string;
  generatedAt: string;
  reportPath: string;
  format: string;
}

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

export const ValidationReportViewer: React.FC = () => {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeTrainingData: true,
    includeTestResults: true,
    includeHumanOverrides: true,
    includeComplianceAttestations: true,
    format: 'pdf' as 'pdf' | 'json',
  });

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchComplianceReport(selectedModel.id);
    }
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockModels: LLMModel[] = [
        {
          id: 1,
          modelVersion: 'gpt-4-pharma-v2.1',
          baseModel: 'gpt-4-turbo',
          status: 'active',
          description: 'Production model with pharmaceutical fine-tuning',
          activatedAt: '2024-01-15T08:00:00Z',
          validatedBy: { fullName: 'Dr. Sarah Chen' },
          validatedAt: '2024-01-14T16:30:00Z',
        },
        {
          id: 2,
          modelVersion: 'gpt-4-pharma-v2.0',
          baseModel: 'gpt-4-turbo',
          status: 'deprecated',
          description: 'Previous production model',
          activatedAt: '2023-11-01T08:00:00Z',
          validatedBy: { fullName: 'Dr. Sarah Chen' },
          validatedAt: '2023-10-30T14:00:00Z',
        },
      ];
      setModels(mockModels);
      setSelectedModel(mockModels[0]);
    } catch (error) {
      console.error('Failed to fetch models', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceReport = async (modelId: number) => {
    try {
      // Mock API call
      const mockReport: ComplianceReport = {
        modelVersion: 'gpt-4-pharma-v2.1',
        regulatoryAuthorities: [
          {
            authority: 'TFDA',
            compliant: true,
            attestationDate: '2024-01-14T10:00:00Z',
            attestedBy: 'Dr. Sarah Chen',
            expiryDate: '2025-01-14T10:00:00Z',
          },
          {
            authority: 'FDA Thailand',
            compliant: true,
            attestationDate: '2024-01-14T11:00:00Z',
            attestedBy: 'Dr. Sarah Chen',
            expiryDate: '2025-01-14T11:00:00Z',
          },
          {
            authority: 'DAV',
            compliant: true,
            attestationDate: '2024-01-14T12:00:00Z',
            attestedBy: 'Dr. Sarah Chen',
            expiryDate: '2025-01-14T12:00:00Z',
          },
        ],
        trainingDataProvenance: {
          fullyDocumented: true,
          sources: ['innovator_pils', 'tfda_approved', 'pharmaceutical_corpus'],
          totalDocuments: 15420,
        },
        validationTestsPassed: true,
        humanInTheLoopImplemented: true,
        confidenceScoringDocumented: true,
      };
      setComplianceReport(mockReport);
    } catch (error) {
      console.error('Failed to fetch compliance report', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedModel) return;

    try {
      setGenerating(true);
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockReport: ValidationReport = {
        reportId: `VAL-${selectedModel.modelVersion}-${Date.now()}`,
        modelVersion: selectedModel.modelVersion,
        generatedAt: new Date().toISOString(),
        reportPath: `s3://lotus-pil-validation-reports/${selectedModel.modelVersion}/validation-report-${Date.now()}.${reportOptions.format}`,
        format: reportOptions.format,
      };

      // Trigger download
      alert(`Report generated successfully!\nReport ID: ${mockReport.reportId}\nPath: ${mockReport.reportPath}`);
    } catch (error) {
      console.error('Failed to generate report', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-zinc-400">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">AI Validation Documentation</h1>
          <p className="text-sm text-zinc-400">
            Generate comprehensive validation reports for regulatory inspection (TFDA, FDA Thailand, DAV)
          </p>
        </div>

        {/* Model Selection */}
        <ModelVersionSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* Compliance Status */}
        {complianceReport && (
          <ComplianceStatusCard complianceReport={complianceReport} />
        )}

        {/* Performance Metrics */}
        {selectedModel && (
          <PerformanceMetricsCard modelVersion={selectedModel.modelVersion} />
        )}

        {/* Report Options */}
        <ReportOptionsPanel
          options={reportOptions}
          onOptionsChange={setReportOptions}
          onGenerate={handleGenerateReport}
          generating={generating}
        />
      </div>
    </div>
  );
};