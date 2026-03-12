import { VietnameseEncodingValidator } from '../../../../src/services/validation/encoding/vietnamese-encoding-validator';

describe('VietnameseEncodingValidator', () => {
  let validator: VietnameseEncodingValidator;

  beforeEach(() => {
    validator = new VietnameseEncodingValidator();
  });

  describe('validateVietnameseDiacritics', () => {
    it('should validate correct Vietnamese text with diacritics', () => {
      const vietnameseText = 'Chống chỉ định: Không sử dụng cho phụ nữ có thai';
      const result = validator.validateVietnameseDiacritics(vietnameseText);

      expect(result.valid).toBe(true);
      expect(result.diacriticsValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.diacriticCount).toBeGreaterThan(0);
    });

    it('should detect missing diacritics in critical terms', () => {
      const textWithoutDiacritics = 'Chong chi dinh: Khong su dung cho phu nu co thai';
      const result = validator.validateVietnameseDiacritics(textWithoutDiacritics);

      expect(result.diacriticsValid).toBe(false);
      expect(result.diacriticWarnings.length).toBeGreaterThan(0);
      expect(result.diacriticWarnings.some(w => w.includes('Chống chỉ định'))).toBe(true);
    });

    it('should validate NFC normalization', () => {
      const nfcText = 'Liều lượng'.normalize('NFC');
      const result = validator.validateVietnameseDiacritics(nfcText);

      expect(result.valid).toBe(true);
      expect(result.diacriticsValid).toBe(true);
    });

    it('should detect NFD (decomposed) form', () => {
      const nfdText = 'Liều lượng'.normalize('NFD');
      const result = validator.validateVietnameseDiacritics(nfdText);

      expect(result.diacriticWarnings.some(w => w.includes('NFC'))).toBe(true);
    });

    it('should normalize Vietnamese text to NFC', () => {
      const nfdText = 'Phản ứng'.normalize('NFD');
      const normalized = validator.normalizeVietnameseText(nfdText);

      expect(normalized).toBe('Phản ứng'.normalize('NFC'));
    });

    it('should fix common diacritic errors', () => {
      const incorrectText = 'Lieu luong va Phan ung';
      const fixed = validator.fixCommonDiacriticErrors(incorrectText);

      expect(fixed).toContain('Liều lượng');
      expect(fixed).toContain('Phản ứng');
    });

    it('should detect invalid UTF-8 encoding', () => {
      const invalidText = 'Chống chỉ định�';
      const result = validator.validateVietnameseDiacritics(invalidText);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('replacement characters'))).toBe(true);
    });
  });
});