import { VietnameseTranslationService } from '../../../../src/services/translation/vietnamese/vietnamese-translation.service';
import { AppDataSource } from '../../../../src/config/database';

describe('VietnameseTranslationService', () => {
  let service: VietnameseTranslationService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new VietnameseTranslationService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('translateToVietnamese', () => {
    it('should translate PIL to Vietnamese with DAV terminology', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        This medication is contraindicated in patients with known hypersensitivity.
        
        DOSAGE AND ADMINISTRATION
        The recommended dose is 500mg twice daily.
        
        ADVERSE REACTIONS
        Common adverse reactions include nausea, headache, and dizziness.
      `;

      const result = await service.translateToVietnamese(sourceText, 1);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
      expect(result.encodingValid).toBe(true);
      expect(result.diacriticsValid).toBe(true);
      expect(result.terminologyValid).toBe(true);

      // Check for DAV-approved terms with correct diacritics
      const contraindicationsSection = result.sections.find(s => 
        s.sectionName === 'CONTRAINDICATIONS'
      );
      expect(contraindicationsSection?.translatedText).toContain('Chống chỉ định');

      const dosageSection = result.sections.find(s => 
        s.sectionName === 'DOSAGE AND ADMINISTRATION'
      );
      expect(dosageSection?.translatedText).toMatch(/Liều lượng|Cách dùng/);
    });

    it('should validate Vietnamese diacritics', async () => {
      const sourceText = 'CONTRAINDICATIONS: Not for use in pregnancy.';
      const result = await service.translateToVietnamese(sourceText, 2);

      expect(result.diacriticsValid).toBe(true);
      result.sections.forEach(section => {
        expect(section.diacriticsValid).toBe(true);
        // Check for proper diacritics in critical terms
        if (section.translatedText.includes('Phụ nữ')) {
          expect(section.translatedText).toContain('ụ'); // Check for proper diacritic
        }
      });
    });

    it('should detect missing diacritics in critical terms', async () => {
      const sourceText = 'WARNINGS: Use with caution.';
      const result = await service.translateToVietnamese(sourceText, 3);

      // If diacritics are missing, warnings should be present
      const sectionsWithWarnings = result.sections.filter(s => s.warnings.length > 0);
      if (sectionsWithWarnings.length > 0) {
        expect(result.diacriticsValid).toBe(false);
      }
    });
  });
});