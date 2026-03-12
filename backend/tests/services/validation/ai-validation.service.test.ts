import { AIValidationService } from '../../../src/services/validation/ai-documentation/ai-validation.service';
import { AppDataSource } from '../../../src/config/database';
import { LLMModel, ModelStatus } from '../../../src/models/llm-model.model';
import { Translation } from '../../../src/models/translation.model';

describe('AIValidationService', () => {
  let service: AIValidationService;
  let llmModelRepository: any;
  let translationRepository: any;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new AIValidationService();
    llmModelRepository = AppDataSource.getRepository(LLMModel);
    translationRepository = AppDataSource.getRepository(Translation);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('generateValidationReport', () => {
    it('should generate PDF validation report with all sections', async () => {
      // Create test model
      const model = llmModelRepository.create({
        modelVersion: 'gpt-4-pharma-test-v1.0',
        baseModel: 'gpt-4-turbo',
        description: 'Test model for validation',
        status: ModelStatus.ACTIVE,
        trainingDataProvenance: {
          sources: [
            {
              type: 'innovator_pils',
              documentCount: 1000,
              dateRange: { from: '2023-01-01', to: '2023-12-31' },
              s3Path: 's3://test-bucket/training-data',
              checksum: 'abc123',
            },
          ],
          totalDocuments: 1000,
          totalTokens: 5000000,
          trainingStartDate: '2024-01-01',
          trainingEndDate: '2024-01-10',
          trainingDurationHours: 240,
        },
        confidenceScoringMethodology: {
          algorithm: 'ensemble_voting',
          thresholds: { autoApprove: 85, humanReview: 70, reject: 50 },
          factors: [
            { name: 'semantic_similarity', weight: 0.4, description: 'Cosine similarity' },
          ],
          calibrationDataset: { size: 500, accuracy: 0.92, s3Path: 's3://test/calibration' },
        },
        validationTestResults: {
          testDate: '2024-01-15',
          testDatasetSize: 200,
          metrics: {
            overallAccuracy: 0.89,
            precisionBySection: { Dosage: 0.92 },
            recallBySection: { Dosage: 0.88 },
            f1ScoreBySection: { Dosage: 0.90 },
            averageConfidenceScore: 87.5,
            confidenceCalibrationError: 0.05,
          },
          languagePerformance: [
            { language: 'zh-TW', accuracy: 0.88, bleuScore: 0.75, humanEvaluationScore: 4.2 },
          ],
          pharmaceuticalTerminologyAccuracy: 0.94,
          regulatoryComplianceRate: 0.96,
          testReportS3Path: 's3://test/validation-report',
        },
      });
      await llmModelRepository.save(model);

      const report = await service.generateValidationReport({
        modelId: model.id,
        includeTrainingData: true,
        includeTestResults: true,
        includeHumanOverrides: true,
        includeComplianceAttestations: true,
        format: 'pdf',
      });

      expect(report.reportId).toContain('VAL-');
      expect(report.modelVersion).toBe('gpt-4-pharma-test-v1.0');
      expect(report.format).toBe('pdf');
      expect(report.reportPath).toContain('s3://');
    });

    it('should generate JSON validation report', async () => {
      const model = await llmModelRepository.findOne({
        where: { status: ModelStatus.ACTIVE },
      });

      const report = await service.generateValidationReport({
        modelId: model.id,
        format: 'json',
      });

      expect(report.format).toBe('json');
      expect(report.reportPath).toContain('.json');
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate confidence score distribution correctly', async () => {
      const model = await llmModelRepository.findOne({
        where: { status: ModelStatus.ACTIVE },
      });

      // Create test translations
      const translations = [
        { confidenceScore: 45, llmModel: model.modelVersion },
        { confidenceScore: 65, llmModel: model.modelVersion },
        { confidenceScore: 78, llmModel: model.modelVersion },
        { confidenceScore: 88, llmModel: model.modelVersion },
        { confidenceScore: 96, llmModel: model.modelVersion },
      ];

      for (const t of translations) {
        await translationRepository.save(translationRepository.create(t));
      }

      const metrics = await (service as any).calculatePerformanceMetrics(model.id);

      expect(metrics.totalTranslations).toBeGreaterThan(0);
      expect(metrics.confidenceScoreDistribution).toHaveLength(5);
      expect(metrics.averageConfidenceScore).toBeGreaterThan(0);
    });
  });

  describe('getComplianceReport', () => {
    it('should return compliance status for all regulatory authorities', async () => {
      const model = llmModelRepository.create({
        modelVersion: 'gpt-4-pharma-compliance-test',
        baseModel: 'gpt-4-turbo',
        description: 'Compliance test model',
        status: ModelStatus.ACTIVE,
        complianceAttestations: [
          {
            authority: 'TFDA',
            attestedBy: 'Dr. Test',
            attestedAt: '2024-01-15',
            attestationDocument: 's3://test/tfda-attestation.pdf',
            expiryDate: '2025-01-15',
          },
        ],
        trainingDataProvenance: {
          sources: [],
          totalDocuments: 1000,
          totalTokens: 5000000,
          trainingStartDate: '2024-01-01',
          trainingEndDate: '2024-01-10',
          trainingDurationHours: 240,
        },
      });
      await llmModelRepository.save(model);

      const report = await service.getComplianceReport(model.id);

      expect(report.modelVersion).toBe('gpt-4-pharma-compliance-test');
      expect(report.regulatoryAuthorities).toHaveLength(1);
      expect(report.regulatoryAuthorities[0].authority).toBe('TFDA');
      expect(report.trainingDataProvenance.fullyDocumented).toBe(true);
    });
  });
});