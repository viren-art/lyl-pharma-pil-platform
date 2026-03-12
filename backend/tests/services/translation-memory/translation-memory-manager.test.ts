import { TranslationMemoryManager } from '../../../src/services/translation-memory/translation-memory-manager.service';
import { AppDataSource } from '../../../src/config/database';

describe('TranslationMemoryManager', () => {
  let tmManager: TranslationMemoryManager;

  beforeAll(async () => {
    await AppDataSource.initialize();
    tmManager = new TranslationMemoryManager();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('getTermSuggestions', () => {
    it('should return cached suggestions on second call', async () => {
      const suggestions1 = await tmManager.getTermSuggestions(
        'contraindications',
        'en',
        'zh-TW',
        'TFDA'
      );

      const suggestions2 = await tmManager.getTermSuggestions(
        'contraindications',
        'en',
        'zh-TW',
        'TFDA'
      );

      expect(suggestions1).toEqual(suggestions2);
    });

    it('should filter by market applicability', async () => {
      const suggestions = await tmManager.getTermSuggestions(
        'dosage',
        'en',
        'zh-TW',
        'TFDA'
      );

      suggestions.forEach(s => {
        expect(['TFDA', 'all']).toContain(s.marketApplicability);
      });
    });
  });

  describe('submitTermUpdate', () => {
    it('should create pending term for approval', async () => {
      const result = await tmManager.submitTermUpdate(
        {
          sourceTerm: 'test term',
          targetTerm: '測試術語',
          sourceLanguage: 'en',
          targetLanguage: 'zh-TW',
          marketApplicability: 'TFDA',
          justification: 'Test submission'
        },
        1
      );

      expect(result.status).toBe('pending_approval');
      expect(result.termId).toBeGreaterThan(0);
    });
  });

  describe('getConsistencyReport', () => {
    it('should identify inconsistent translations', async () => {
      const report = await tmManager.getConsistencyReport('zh-TW', 'TFDA');

      expect(report).toHaveProperty('totalTerms');
      expect(report).toHaveProperty('consistentTerms');
      expect(report).toHaveProperty('inconsistentTerms');
      expect(Array.isArray(report.inconsistentTerms)).toBe(true);
    });
  });
});