import { TFDAFormatTemplate } from '../../../../src/services/formatting/tfda/tfda-format-template';

describe('TFDAFormatTemplate', () => {
  describe('validateSections', () => {
    it('should validate required sections are present', () => {
      const sections = new Map<string, string>([
        ['藥品名稱', 'Test Drug'],
        ['適應症', 'Test indication'],
        ['用法用量', 'Test dosage'],
        ['禁忌症', 'Test contraindications'],
        ['警語及注意事項', 'Test warnings'],
        ['不良反應', 'Test adverse reactions'],
      ]);

      const result = TFDAFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required sections', () => {
      const sections = new Map<string, string>([
        ['藥品名稱', 'Test Drug'],
        ['適應症', 'Test indication'],
      ]);

      const result = TFDAFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required section');
    });

    it('should warn about missing recommended sections', () => {
      const sections = new Map<string, string>([
        ['藥品名稱', 'Test Drug'],
        ['適應症', 'Test indication'],
        ['用法用量', 'Test dosage'],
        ['禁忌症', 'Test contraindications'],
        ['警語及注意事項', 'Test warnings'],
        ['不良反應', 'Test adverse reactions'],
      ]);

      const result = TFDAFormatTemplate.validateSections(sections);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('orderSections', () => {
    it('should order sections according to TFDA requirements', () => {
      const sections = new Map<string, string>([
        ['不良反應', 'Adverse reactions'],
        ['藥品名稱', 'Drug name'],
        ['禁忌症', 'Contraindications'],
        ['適應症', 'Indications'],
      ]);

      const ordered = TFDAFormatTemplate.orderSections(sections);

      expect(ordered[0].header).toBe('藥品名稱');
      expect(ordered[1].header).toBe('適應症');
      expect(ordered[2].header).toBe('禁忌症');
      expect(ordered[3].header).toBe('不良反應');
    });

    it('should mark required sections correctly', () => {
      const sections = new Map<string, string>([
        ['藥品名稱', 'Drug name'],
        ['適應症', 'Indications'],
        ['儲存條件', 'Storage'],
      ]);

      const ordered = TFDAFormatTemplate.orderSections(sections);

      const drugName = ordered.find((s) => s.header === '藥品名稱');
      const storage = ordered.find((s) => s.header === '儲存條件');

      expect(drugName?.required).toBe(true);
      expect(storage?.required).toBe(false);
    });
  });

  describe('getCoverLetterTemplate', () => {
    it('should generate TFDA cover letter with correct data', () => {
      const coverLetter = TFDAFormatTemplate.getCoverLetterTemplate({
        productName: 'Test Product',
        licenseNumber: 'TFDA-12345',
        submissionDate: '2024-01-15',
        applicantName: 'Lotus Pharmaceutical',
      });

      expect(coverLetter).toContain('Test Product');
      expect(coverLetter).toContain('TFDA-12345');
      expect(coverLetter).toContain('2024-01-15');
      expect(coverLetter).toContain('Lotus Pharmaceutical');
      expect(coverLetter).toContain('衛生福利部食品藥物管理署');
    });
  });
});