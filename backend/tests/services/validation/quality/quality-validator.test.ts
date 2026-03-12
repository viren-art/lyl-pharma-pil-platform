import { QualityValidatorService } from '../../../../src/services/validation/quality/quality-validator.service';

describe('QualityValidatorService', () => {
  let validator: QualityValidatorService;

  beforeEach(() => {
    validator = new QualityValidatorService();
  });

  describe('validateTranslation', () => {
    it('should detect dosage inconsistencies', async () => {
      const sourceText = 'Dosage: 500mg twice daily';
      const translatedText = '劑量：250毫克每日兩次'; // Wrong dosage: 250mg instead of 500mg

      const result = await validator.validateTranslation(
        sourceText,
        translatedText,
        'zh-TW',
        'TFDA',
        1
      );

      expect(result.valid).toBe(false);
      expect(result.numericValidation.inconsistencies.length).toBeGreaterThan(0);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should validate encoding for Traditional Chinese', async () => {
      const sourceText = 'Contraindications: None';
      const translatedText = '禁忌症：无'; // Simplified Chinese character

      const result = await validator.validateTranslation(
        sourceText,
        translatedText,
        'zh-TW',
        'TFDA',
        1
      );

      expect(result.encodingValidation.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate overall quality score', async () => {
      const sourceText = 'Dosage: 100mg daily';
      const translatedText = '劑量：100毫克每日';

      const result = await validator.validateTranslation(
        sourceText,
        translatedText,
        'zh-TW',
        'TFDA',
        1
      );

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});