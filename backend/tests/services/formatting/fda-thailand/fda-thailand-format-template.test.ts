import { FDAThailandFormatTemplate } from '../../../../src/services/formatting/fda-thailand/fda-thailand-format-template';

describe('FDAThailandFormatTemplate', () => {
  describe('validateSections', () => {
    it('should validate required sections are present', () => {
      const sections = new Map<string, string>([
        ['ชื่อยา', 'Test Drug'],
        ['ข้อบ่งใช้', 'Test indication'],
        ['ขนาดยาและวิธีใช้', 'Test dosage'],
        ['ข้อห้ามใช้', 'Test contraindications'],
        ['คำเตือน', 'Test warnings'],
        ['ผลข้างเคียง', 'Test adverse reactions'],
      ]);

      const result = FDAThailandFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required sections', () => {
      const sections = new Map<string, string>([
        ['ชื่อยา', 'Test Drug'],
      ]);

      const result = FDAThailandFormatTemplate.validateSections(sections);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('orderSections', () => {
    it('should order sections according to FDA Thailand requirements', () => {
      const sections = new Map<string, string>([
        ['ผลข้างเคียง', 'Adverse reactions'],
        ['ชื่อยา', 'Drug name'],
        ['ข้อบ่งใช้', 'Indications'],
      ]);

      const ordered = FDAThailandFormatTemplate.orderSections(sections);

      expect(ordered[0].header).toBe('ชื่อยา');
      expect(ordered[1].header).toBe('ข้อบ่งใช้');
      expect(ordered[2].header).toBe('ผลข้างเคียง');
    });
  });
});