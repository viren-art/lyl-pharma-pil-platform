import { DAVFormatTemplate } from '../../../../src/services/formatting/dav/dav-format-template';

describe('DAVFormatTemplate', () => {
  describe('validateSections', () => {
    it('should validate required sections are present', () => {
      const sections = new Map<string, string>([
        ['Tên thuốc', 'Test Drug'],
        ['Chỉ định', 'Test indication'],
        ['Liều lượng và cách dùng', 'Test dosage'],
        ['Chống chỉ định', 'Test contraindications'],
        ['Cảnh báo', 'Test warnings'],
        ['Tác dụng không mong muốn', 'Test adverse reactions'],
      ]);

      const result = DAVFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required sections', () => {
      const sections = new Map<string, string>([
        ['Tên thuốc', 'Test Drug'],
      ]);

      const result = DAVFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about missing diacritics in critical terms', () => {
      const sections = new Map<string, string>([
        ['Tên thuốc', 'Test Drug'],
        ['Chỉ định', 'Test indication'],
        ['Liều lượng và cách dùng', 'lieu luong va cach dung'], // Missing diacritics
        ['Chống chỉ định', 'Test contraindications'],
        ['Cảnh báo', 'Test warnings'],
        ['Tác dụng không mong muốn', 'Test adverse reactions'],
      ]);

      const result = DAVFormatTemplate.validateSections(sections);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('orderSections', () => {
    it('should order sections according to DAV requirements', () => {
      const sections = new Map<string, string>([
        ['Tác dụng không mong muốn', 'Adverse reactions'],
        ['Tên thuốc', 'Drug name'],
        ['Chỉ định', 'Indications'],
      ]);

      const ordered = DAVFormatTemplate.orderSections(sections);

      expect(ordered[0].header).toBe('Tên thuốc');
      expect(ordered[1].header).toBe('Chỉ định');
      expect(ordered[2].header).toBe('Tác dụng không mong muốn');
    });
  });
});