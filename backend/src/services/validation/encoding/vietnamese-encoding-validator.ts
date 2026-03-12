import { logger } from '../../../utils/logger';

interface VietnameseEncodingValidationResult {
  valid: boolean;
  diacriticsValid: boolean;
  errors: string[];
  diacriticWarnings: string[];
  characterCount: number;
  diacriticCount: number;
  invalidCharacters: Array<{
    character: string;
    position: number;
    reason: string;
  }>;
}

export class VietnameseEncodingValidator {
  // Vietnamese diacritics
  private readonly VIETNAMESE_VOWELS_WITH_DIACRITICS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  private readonly VIETNAMESE_TONE_MARKS = /[\u0300\u0301\u0303\u0309\u0323]/; // grave, acute, tilde, hook above, dot below
  private readonly VIETNAMESE_VOWEL_MARKS = /[\u0306\u0302\u031B]/; // breve, circumflex, horn

  // Common Vietnamese pharmaceutical terms that must have correct diacritics
  private readonly CRITICAL_TERMS_WITH_DIACRITICS = [
    'Chống chỉ định',
    'Phản ứng',
    'Liều lượng',
    'Thận trọng',
    'Cảnh báo',
    'Tương tác',
    'Phụ nữ',
    'Bảo quản',
    'Hạn sử dụng',
    'Dược lý',
    'Nghiên cứu',
    'Lâm sàng'
  ];

  /**
   * Validate Vietnamese diacritics and character encoding
   */
  validateVietnameseDiacritics(text: string): VietnameseEncodingValidationResult {
    const errors: string[] = [];
    const diacriticWarnings: string[] = [];
    const invalidCharacters: Array<{
      character: string;
      position: number;
      reason: string;
    }> = [];

    try {
      // Check if text is properly UTF-8 encoded
      if (!this.isValidUTF8(text)) {
        errors.push('Text is not valid UTF-8 encoded');
        return {
          valid: false,
          diacriticsValid: false,
          errors,
          diacriticWarnings,
          characterCount: 0,
          diacriticCount: 0,
          invalidCharacters
        };
      }

      // Count Vietnamese characters and diacritics
      let vietnameseCharCount = 0;
      let diacriticCount = 0;
      const chars = Array.from(text);

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        // Check for Vietnamese vowels with diacritics
        if (this.VIETNAMESE_VOWELS_WITH_DIACRITICS.test(char)) {
          vietnameseCharCount++;
          diacriticCount++;
        }

        // Check for combining diacritical marks
        const codePoint = char.codePointAt(0);
        if (codePoint && (
          (codePoint >= 0x0300 && codePoint <= 0x036F) || // Combining Diacritical Marks
          (codePoint >= 0x1AB0 && codePoint <= 0x1AFF) || // Combining Diacritical Marks Extended
          (codePoint >= 0x1DC0 && codePoint <= 0x1DFF)    // Combining Diacritical Marks Supplement
        )) {
          diacriticCount++;

          // Validate combining mark placement
          if (i === 0 || !this.canHaveCombiningMark(chars[i - 1])) {
            invalidCharacters.push({
              character: char,
              position: i,
              reason: 'Combining diacritical mark not following valid base character'
            });
            errors.push(`Combining mark at position ${i} not following valid base character`);
          }
        }

        // Check for decomposed vs precomposed forms
        if (this.isDecomposedVietnamese(char, chars[i + 1])) {
          diacriticWarnings.push(`Decomposed form detected at position ${i}, should use precomposed character`);
        }
      }

      // Validate critical pharmaceutical terms have correct diacritics
      for (const term of this.CRITICAL_TERMS_WITH_DIACRITICS) {
        const termWithoutDiacritics = this.removeDiacritics(term);
        const textWithoutDiacritics = this.removeDiacritics(text);

        if (textWithoutDiacritics.includes(termWithoutDiacritics) && !text.includes(term)) {
          diacriticWarnings.push(`Critical term "${term}" found without correct diacritics`);
        }
      }

      // Check for common diacritic errors
      const commonErrors = [
        { incorrect: 'Chong chi dinh', correct: 'Chống chỉ định' },
        { incorrect: 'Phan ung', correct: 'Phản ứng' },
        { incorrect: 'Lieu luong', correct: 'Liều lượng' },
        { incorrect: 'Than trong', correct: 'Thận trọng' },
        { incorrect: 'Canh bao', correct: 'Cảnh báo' },
        { incorrect: 'Tuong tac', correct: 'Tương tác' },
        { incorrect: 'Phu nu', correct: 'Phụ nữ' },
        { incorrect: 'Bao quan', correct: 'Bảo quản' }
      ];

      commonErrors.forEach(({ incorrect, correct }) => {
        if (text.includes(incorrect)) {
          diacriticWarnings.push(`Found "${incorrect}" without diacritics, should be "${correct}"`);
        }
      });

      // Check if text contains sufficient Vietnamese characters
      const totalChars = chars.length;
      const vietnamesePercentage = (vietnameseCharCount / totalChars) * 100;

      if (vietnamesePercentage < 5 && totalChars > 100) {
        diacriticWarnings.push(`Low Vietnamese character percentage: ${vietnamesePercentage.toFixed(1)}% (expected at least 5% for pharmaceutical text)`);
      }

      // Check for replacement characters indicating encoding issues
      if (text.includes('�')) {
        errors.push('Text contains replacement characters (�), indicating encoding corruption');
      }

      // Check for NFD vs NFC normalization
      const isNFC = text === text.normalize('NFC');
      if (!isNFC) {
        diacriticWarnings.push('Text is not in NFC (precomposed) form, should normalize to NFC');
      }

      const valid = errors.length === 0;
      const diacriticsValid = diacriticWarnings.length === 0;

      logger.info('Vietnamese encoding validation complete', {
        valid,
        diacriticsValid,
        characterCount: vietnameseCharCount,
        diacriticCount,
        totalCharacters: totalChars,
        vietnamesePercentage: vietnamesePercentage.toFixed(1),
        errorCount: errors.length,
        warningCount: diacriticWarnings.length,
        invalidCharCount: invalidCharacters.length
      });

      return {
        valid,
        diacriticsValid,
        errors,
        diacriticWarnings,
        characterCount: vietnameseCharCount,
        diacriticCount,
        invalidCharacters
      };
    } catch (error) {
      logger.error('Vietnamese encoding validation failed', { error });
      return {
        valid: false,
        diacriticsValid: false,
        errors: ['Encoding validation failed due to system error'],
        diacriticWarnings: [],
        characterCount: 0,
        diacriticCount: 0,
        invalidCharacters: []
      };
    }
  }

  /**
   * Check if text is valid UTF-8
   */
  private isValidUTF8(text: string): boolean {
    try {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  }

  /**
   * Check if character can have combining diacritical marks
   */
  private canHaveCombiningMark(char: string): boolean {
    // Combining marks can follow Latin letters and Vietnamese vowels
    return /[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/.test(char);
  }

  /**
   * Check if character is in decomposed form
   */
  private isDecomposedVietnamese(char: string, nextChar?: string): boolean {
    if (!nextChar) return false;

    // Check if base character followed by combining mark
    const baseChar = /[aeiouyAEIOUY]/;
    const combiningMark = this.VIETNAMESE_TONE_MARKS.test(nextChar) || this.VIETNAMESE_VOWEL_MARKS.test(nextChar);

    return baseChar.test(char) && combiningMark;
  }

  /**
   * Remove diacritics from text for comparison
   */
  private removeDiacritics(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Normalize Vietnamese text to NFC (precomposed) form
   */
  normalizeVietnameseText(text: string): string {
    return text.normalize('NFC');
  }

  /**
   * Fix common diacritic errors
   */
  fixCommonDiacriticErrors(text: string): string {
    let fixed = text;

    const corrections = [
      { incorrect: /Chong chi dinh/gi, correct: 'Chống chỉ định' },
      { incorrect: /Phan ung/gi, correct: 'Phản ứng' },
      { incorrect: /Lieu luong/gi, correct: 'Liều lượng' },
      { incorrect: /Than trong/gi, correct: 'Thận trọng' },
      { incorrect: /Canh bao/gi, correct: 'Cảnh báo' },
      { incorrect: /Tuong tac/gi, correct: 'Tương tác' },
      { incorrect: /Phu nu/gi, correct: 'Phụ nữ' },
      { incorrect: /Bao quan/gi, correct: 'Bảo quản' }
    ];

    corrections.forEach(({ incorrect, correct }) => {
      fixed = fixed.replace(incorrect, correct);
    });

    return fixed;
  }
}