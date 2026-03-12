import { ThaiEncodingValidator } from '../../../../src/services/validation/encoding/thai-encoding-validator';

describe('ThaiEncodingValidator', () => {
  let validator: ThaiEncodingValidator;

  beforeEach(() => {
    validator = new ThaiEncodingValidator();
  });

  describe('validateThaiScript', () => {
    it('should validate correct Thai text', () => {
      const thaiText = 'ข้อห้ามใช้: ห้ามใช้ในผู้ป่วยที่แพ้ยานี้';
      const result = validator.validateThaiScript(thaiText);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should detect invalid Thai encoding', () => {
      const invalidText = 'ข้อห้ามใช้�invalid�';
      const result = validator.validateThaiScript(invalidText);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('replacement characters');
    });

    it('should validate tone mark placement', () => {
      const validToneMark = 'ก่า'; // consonant + tone mark + vowel
      const result = validator.validateThaiScript(validToneMark);

      expect(result.valid).toBe(true);
    });

    it('should detect insufficient Thai characters', () => {
      const mixedText = 'This is mostly English with little Thai: ยา';
      const result = validator.validateThaiScript(mixedText);

      expect(result.errors.some(e => e.includes('Insufficient Thai characters'))).toBe(true);
    });

    it('should normalize Thai text correctly', () => {
      const textWithDuplicateTones = 'ก่่า'; // duplicate tone marks
      const normalized = validator.normalizeThaiText(textWithDuplicateTones);

      expect(normalized).toBe('ก่า');
    });
  });
});