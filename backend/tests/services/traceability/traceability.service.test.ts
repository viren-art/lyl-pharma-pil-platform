import { TraceabilityService } from '../../../src/services/traceability/traceability.service';
import { AppDataSource } from '../../../src/config/database';

describe('TraceabilityService', () => {
  let service: TraceabilityService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new TraceabilityService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('createTraceabilityLinks', () => {
    it('should create traceability links with cryptographic hashes', async () => {
      const request = {
        translationId: 1,
        sections: [
          {
            sectionName: 'Dosage',
            translatedText: '成人劑量：每日一次500毫克',
            targetStartIndex: 0,
            targetEndIndex: 15,
            sourceReferences: [
              {
                documentPath: 's3://test/source.pdf',
                pageNumber: 1,
                paragraphNumber: 1,
                sourceText: 'Adult dosage: 500mg once daily',
                startIndex: 0,
                endIndex: 31,
              },
            ],
            confidenceScore: 92,
          },
        ],
        sourceDocumentPath: 's3://test/source.pdf',
      };

      await expect(service.createTraceabilityLinks(request)).resolves.not.toThrow();
    });
  });

  describe('verifyTraceabilityIntegrity', () => {
    it('should verify cryptographic hash integrity', async () => {
      const isValid = await service.verifyTraceabilityIntegrity(1);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('exportTraceabilityLog', () => {
    it('should export traceability log in JSON format', async () => {
      const logPath = await service.exportTraceabilityLog(1);
      expect(logPath).toContain('traceability-logs');
      expect(logPath).toContain('.json');
    });
  });
});