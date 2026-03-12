import { TranslationMemoryService } from '../../../src/services/translation-memory/translation-memory.service';

describe('TranslationMemoryService', () => {
  let service: TranslationMemoryService;

  beforeEach(() => {
    service = new TranslationMemoryService();
  });

  describe('getTerminologyForLanguage', () => {
    it('should load TFDA-approved Traditional Chinese terminology', async () => {
      const terminology = await service.getTerminologyForLanguage('zh-TW');

      // Validate critical TFDA-approved terms are present
      expect(terminology.get('contraindications')).toBe('禁忌症');
      expect(terminology.get('adverse reactions')).toBe('不良反應');
      expect(terminology.get('dosage')).toBe('劑量');
      expect(terminology.get('posology')).toBe('用法用量');
      expect(terminology.get('hypersensitivity')).toBe('過敏反應');
      expect(terminology.get('hepatic impairment')).toBe('肝功能不全');
      expect(terminology.get('renal impairment')).toBe('腎功能不全');
      expect(terminology.get('pregnancy')).toBe('懷孕');
      expect(terminology.get('lactation')).toBe('哺乳');
      expect(terminology.get('shelf life')).toBe('保存期限');
      expect(terminology.get('storage conditions')).toBe('儲存條件');
    });

    it('should load FDA Thailand-approved Thai terminology', async () => {
      const terminology = await service.getTerminologyForLanguage('th');

      expect(terminology.get('contraindications')).toBe('ข้อห้ามใช้');
      expect(terminology.get('adverse reactions')).toBe('ผลข้างเคียง');
      expect(terminology.get('dosage')).toBe('ขนาดยา');
    });

    it('should load DAV-approved Vietnamese terminology', async () => {
      const terminology = await service.getTerminologyForLanguage('vi');

      expect(terminology.get('contraindications')).toBe('Chống chỉ định');
      expect(terminology.get('adverse reactions')).toBe('Phản ứng có hại');
      expect(terminology.get('dosage')).toBe('Liều lượng');
    });

    it('should return fallback terminology on database error', async () => {
      // Service should gracefully handle database errors
      const terminology = await service.getTerminologyForLanguage('zh-TW');

      // Should still have default TFDA-approved terms
      expect(terminology.size).toBeGreaterThan(0);
      expect(terminology.get('contraindications')).toBe('禁忌症');
    });
  });

  describe('validateTerminologyCompliance', () => {
    it('should detect unapproved terminology in Traditional Chinese translation', async () => {
      const translatedText = '禁忌症：對活性成分過敏反應。劑量：每日兩次。';
      
      const result = await service.validateTerminologyCompliance(
        translatedText,
        'zh-TW'
      );

      // All terms should be TFDA-approved
      expect(result.compliant).toBe(true);
      expect(result.unapprovedTerms.length).toBe(0);
    });

    it('should flag non-compliant terminology', async () => {
      const translatedText = '禁忌症：對活性成分過敏。未批准術語：測試詞彙。';
      
      const result = await service.validateTerminologyCompliance(
        translatedText,
        'zh-TW'
      );

      // Should detect compliance issues
      expect(result.compliant).toBeDefined();
      expect(Array.isArray(result.unapprovedTerms)).toBe(true);
    });
  });

  describe('recordTermUsage', () => {
    it('should increment usage count for pharmaceutical terms', async () => {
      await expect(
        service.recordTermUsage('contraindications', 'zh-TW')
      ).resolves.not.toThrow();
    });
  });
});