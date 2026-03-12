import { logger } from '../../../utils/logger';

interface EncodingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class EncodingValidator {
  /**
   * Validate character encoding for target language
   */
  async validate(
    text: string,
    targetLanguage: 'zh-TW' | 'th' | 'vi'
  ): Promise<EncodingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check UTF-8 validity
      if (!this.isValidUTF8(text)) {
        errors.push('Invalid UTF-8 encoding detected');
      }

      // Language-specific validation
      switch (targetLanguage) {
        case 'zh-TW':
          this.validateTraditionalChinese(text, errors, warnings);
          break;
        case 'th':
          this.validateThai(text, errors, warnings);
          break;
        case 'vi':
          this.validateVietnamese(text, errors, warnings);
          break;
      }

      // Check for replacement characters
      if (text.includes('\uFFFD')) {
        errors.push('Replacement characters (�) detected - indicates encoding corruption');
      }

      // Check for null bytes
      if (text.includes('\u0000')) {
        errors.push('Null bytes detected in text');
      }

      const valid = errors.length === 0;

      logger.debug('Encoding validation completed', {
        targetLanguage,
        valid,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      return { valid, errors, warnings };
    } catch (error) {
      logger.error('Encoding validation failed', { error, targetLanguage });
      throw error;
    }
  }

  /**
   * Validate Traditional Chinese encoding
   */
  private validateTraditionalChinese(
    text: string,
    errors: string[],
    warnings: string[]
  ): void {
    const chars = Array.from(text);
    let chineseCharCount = 0;

    chars.forEach((char, index) => {
      const codePoint = char.codePointAt(0);
      if (!codePoint) return;

      // Traditional Chinese ranges
      if (
        (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified Ideographs
        (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Extension A
        (codePoint >= 0x20000 && codePoint <= 0x2a6df) // CJK Extension B
      ) {
        chineseCharCount++;
      }

      // Check for Simplified Chinese characters (should not appear in Traditional Chinese)
      if (this.isSimplifiedChinese(char)) {
        warnings.push(
          `Simplified Chinese character detected at position ${index}: ${char}`
        );
      }
    });

    // Pharmaceutical text should be at least 30% Chinese characters
    const totalChars = chars.length;
    const chinesePercentage = (chineseCharCount / totalChars) * 100;

    if (chinesePercentage < 30) {
      warnings.push(
        `Low Traditional Chinese character percentage: ${chinesePercentage.toFixed(1)}%`
      );
    }
  }

  /**
   * Validate Thai encoding
   */
  private validateThai(text: string, errors: string[], warnings: string[]): void {
    const chars = Array.from(text);
    let thaiCharCount = 0;

    chars.forEach((char, index) => {
      const codePoint = char.codePointAt(0);
      if (!codePoint) return;

      // Thai Unicode range: U+0E00 to U+0E7F
      if (codePoint >= 0x0e00 && codePoint <= 0x0e7f) {
        thaiCharCount++;

        // Validate tone mark placement
        if (codePoint >= 0x0e48 && codePoint <= 0x0e4b) {
          // Tone marks must follow valid base characters
          if (index === 0) {
            errors.push(`Tone mark at start of text: ${char}`);
          } else {
            const prevChar = chars[index - 1];
            const prevCodePoint = prevChar.codePointAt(0);
            if (
              !prevCodePoint ||
              prevCodePoint < 0x0e01 ||
              prevCodePoint > 0x0e2e
            ) {
              errors.push(
                `Invalid tone mark placement at position ${index}: ${char}`
              );
            }
          }
        }
      }
    });

    // Pharmaceutical text should be at least 40% Thai characters
    const totalChars = chars.length;
    const thaiPercentage = (thaiCharCount / totalChars) * 100;

    if (thaiPercentage < 40) {
      warnings.push(`Low Thai character percentage: ${thaiPercentage.toFixed(1)}%`);
    }
  }

  /**
   * Validate Vietnamese encoding and diacritics
   */
  private validateVietnamese(
    text: string,
    errors: string[],
    warnings: string[]
  ): void {
    const chars = Array.from(text);
    let vietnameseCharCount = 0;
    let diacriticCount = 0;

    chars.forEach((char, index) => {
      const codePoint = char.codePointAt(0);
      if (!codePoint) return;

      // Vietnamese uses Latin characters with diacritics
      if (
        (codePoint >= 0x0041 && codePoint <= 0x005a) || // A-Z
        (codePoint >= 0x0061 && codePoint <= 0x007a) || // a-z
        (codePoint >= 0x00c0 && codePoint <= 0x00ff) || // Latin-1 Supplement
        (codePoint >= 0x0100 && codePoint <= 0x017f) // Latin Extended-A
      ) {
        vietnameseCharCount++;

        // Check for Vietnamese diacritics
        if (this.hasVietnameseDiacritic(char)) {
          diacriticCount++;
        }
      }

      // Check for combining diacritical marks (should be precomposed)
      if (codePoint >= 0x0300 && codePoint <= 0x036f) {
        warnings.push(
          `Combining diacritical mark detected at position ${index}. Use precomposed characters (NFC normalization).`
        );
      }
    });

    // Check NFC normalization
    const normalized = text.normalize('NFC');
    if (text !== normalized) {
      warnings.push(
        'Text is not in NFC (precomposed) form. Vietnamese should use precomposed characters.'
      );
    }

    // Vietnamese pharmaceutical text should have reasonable diacritic usage
    const diacriticPercentage = (diacriticCount / vietnameseCharCount) * 100;
    if (diacriticPercentage < 10) {
      warnings.push(
        `Low Vietnamese diacritic usage: ${diacriticPercentage.toFixed(1)}%. Verify translation accuracy.`
      );
    }
  }

  /**
   * Check if text is valid UTF-8
   */
  private isValidUTF8(text: string): boolean {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const encoded = encoder.encode(text);
      decoder.decode(encoded);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if character is Simplified Chinese (common simplified forms)
   */
  private isSimplifiedChinese(char: string): boolean {
    const simplifiedChars = [
      '国',
      '药',
      '医',
      '疗',
      '应',
      '过',
      '剂',
      '量',
      '时',
      '间'
    ];
    return simplifiedChars.includes(char);
  }

  /**
   * Check if character has Vietnamese diacritic
   */
  private hasVietnameseDiacritic(char: string): boolean {
    const vietnameseDiacritics = [
      'à',
      'á',
      'ả',
      'ã',
      'ạ',
      'ă',
      'ằ',
      'ắ',
      'ẳ',
      'ẵ',
      'ặ',
      'â',
      'ầ',
      'ấ',
      'ẩ',
      'ẫ',
      'ậ',
      'đ',
      'è',
      'é',
      'ẻ',
      'ẽ',
      'ẹ',
      'ê',
      'ề',
      'ế',
      'ể',
      'ễ',
      'ệ',
      'ì',
      'í',
      'ỉ',
      'ĩ',
      'ị',
      'ò',
      'ó',
      'ỏ',
      'õ',
      'ọ',
      'ô',
      'ồ',
      'ố',
      'ổ',
      'ỗ',
      'ộ',
      'ơ',
      'ờ',
      'ớ',
      'ở',
      'ỡ',
      'ợ',
      'ù',
      'ú',
      'ủ',
      'ũ',
      'ụ',
      'ư',
      'ừ',
      'ứ',
      'ử',
      'ữ',
      'ự',
      'ỳ',
      'ý',
      'ỷ',
      'ỹ',
      'ỵ'
    ];
    return vietnameseDiacritics.includes(char.toLowerCase());
  }
}