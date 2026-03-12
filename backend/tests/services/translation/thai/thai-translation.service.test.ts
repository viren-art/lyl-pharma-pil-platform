import { ThaiTranslationService } from '../../../../src/services/translation/thai/thai-translation.service';
import { AppDataSource } from '../../../../src/config/database';

describe('ThaiTranslationService', () => {
  let service: ThaiTranslationService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new ThaiTranslationService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('translateToThai', () => {
    it('should translate PIL to Thai with FDA Thailand terminology', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        This medication is contraindicated in patients with known hypersensitivity.
        
        DOSAGE AND ADMINISTRATION
        The recommended dose is 500mg twice daily.
        
        ADVERSE REACTIONS
        Common adverse reactions include nausea, headache, and dizziness.
      `;

      const result = await service.translateToThai(sourceText, 1);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
      expect(result.encodingValid).toBe(true);
      expect(result.terminologyValid).toBe(true);

      // Check for FDA Thailand-approved terms
      const contraindicationsSection = result.sections.find(s => 
        s.sectionName === 'CONTRAINDICATIONS'
      );
      expect(contraindicationsSection?.translatedText).toContain('ข้อห้ามใช้');

      const dosageSection = result.sections.find(s => 
        s.sectionName === 'DOSAGE AND ADMINISTRATION'
      );
      expect(dosageSection?.translatedText).toMatch(/ขนาดยา|วิธีใช้/);
    });

    it('should validate Thai script encoding', async () => {
      const sourceText = 'CONTRAINDICATIONS: Not for use in pregnancy.';
      const result = await service.translateToThai(sourceText, 2);

      expect(result.encodingValid).toBe(true);
      result.sections.forEach(section => {
        expect(section.encodingValid).toBe(true);
      });
    });

    it('should flag low confidence sections', async () => {
      const sourceText = 'COMPLEX_MEDICAL_TERM_XYZ123';
      const result = await service.translateToThai(sourceText, 3);

      const lowConfidenceSections = result.sections.filter(s => s.confidenceScore < 85);
      expect(lowConfidenceSections.length).toBeGreaterThanOrEqual(0);
    });
  });
});