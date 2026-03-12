import { TranslationService } from '../../../src/services/translation/translation.service';

describe('TranslationService', () => {
  let translationService: TranslationService;

  beforeEach(() => {
    translationService = new TranslationService();
  });

  describe('translatePIL', () => {
    it('should create translation record with traceability log', async () => {
      const request = {
        pilId: 1,
        targetLanguage: 'zh-TW' as const,
        sourceDocumentPath: 's3://test-bucket/source.pdf',
        userId: 1,
      };

      const result = await translationService.translatePIL(request);

      expect(result.translationId).toBeDefined();
      expect(result.pilId).toBe(1);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.outputPath).toContain('s3://');
      expect(result.traceabilityLogPath).toContain('s3://');
    });

    it('should flag low confidence sections for human review', async () => {
      const request = {
        pilId: 1,
        targetLanguage: 'zh-TW' as const,
        sourceDocumentPath: 's3://test-bucket/source.pdf',
        userId: 1,
      };

      const result = await translationService.translatePIL(request);

      if (result.lowConfidenceSections.length > 0) {
        expect(result.status).toBe('pending_review');
      } else {
        expect(result.status).toBe('approved');
      }
    });

    it('should handle invalid PIL ID', async () => {
      const request = {
        pilId: 99999,
        targetLanguage: 'zh-TW' as const,
        sourceDocumentPath: 's3://test-bucket/source.pdf',
        userId: 1,
      };

      await expect(translationService.translatePIL(request)).rejects.toThrow(
        'PIL not found'
      );
    });
  });

  describe('getTranslationTraceability', () => {
    it('should return complete traceability log', async () => {
      const traceability = await translationService.getTranslationTraceability(1);

      expect(traceability).toHaveProperty('translationMetadata');
      expect(traceability).toHaveProperty('sections');
      expect(traceability).toHaveProperty('qualityMetrics');
    });

    it('should handle invalid translation ID', async () => {
      await expect(
        translationService.getTranslationTraceability(99999)
      ).rejects.toThrow('Translation not found');
    });
  });
});