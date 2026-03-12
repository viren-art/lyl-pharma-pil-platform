import { logger } from '../../../utils/logger';

interface ThaiEncodingValidationResult {
  valid: boolean;
  errors: string[];
  characterCount: number;
  invalidCharacters: Array<{
    character: string;
    position: number;
    reason: string;
  }>;
}

export class ThaiEncodingValidator {
  // Thai Unicode ranges
  private readonly THAI_CONSONANTS = /[\u0E01-\u0E2E]/;
  private readonly THAI_VOWELS = /[\u0E30-\u0E3A\u0E40-\u0E4E]/;
  private readonly THAI_TONE_MARKS = /[\u0E48-\u0E4B]/;
  private readonly THAI_DIGITS = /[\u0E50-\u0E59]/;
  private readonly THAI_SYMBOLS = /[\u0E2F\u0E3F\u0E4F-\u0E5B]/;

  /**
   * Validate Thai script encoding and character composition
   */
  validateThaiScript(text: string): ThaiEncodingValidationResult {
    const errors: string[] = [];
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
          errors,
          characterCount: 0,
          invalidCharacters
        };
      }

      // Count Thai characters
      let thaiCharCount = 0;
      const chars = Array.from(text);

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const codePoint = char.codePointAt(0);

        if (!codePoint) continue;

        // Check if character is in Thai Unicode range (U+0E00 to U+0E7F)
        if (codePoint >= 0x0E00 && codePoint <= 0x0E7F) {
          thaiCharCount++;

          // Validate character is a valid Thai character
          if (!this.isValidThaiCharacter(char)) {
            invalidCharacters.push({
              character: char,
              position: i,
              reason: 'Invalid Thai Unicode character'
            });
            errors.push(`Invalid Thai character at position ${i}: ${char} (U+${codePoint.toString(16).toUpperCase()})`);
          }

          // Validate tone mark placement
          if (this.THAI_TONE_MARKS.test(char)) {
            if (i === 0 || !this.canHaveToneMark(chars[i - 1])) {
              invalidCharacters.push({
                character: char,
                position: i,
                reason: 'Tone mark not following valid base character'
              });
              errors.push(`Tone mark at position ${i} not following valid base character`);
            }
          }

          // Validate vowel placement
          if (this.THAI_VOWELS.test(char)) {
            // Some vowels must follow consonants
            const leadingVowels = /[\u0E40-\u0E44]/;
            if (!leadingVowels.test(char) && (i === 0 || !this.THAI_CONSONANTS.test(chars[i - 1]))) {
              invalidCharacters.push({
                character: char,
                position: i,
                reason: 'Vowel not following consonant'
              });
              errors.push(`Vowel at position ${i} not following consonant`);
            }
          }
        }
      }

      // Check if text contains sufficient Thai characters (at least 10% for pharmaceutical text)
      const totalChars = chars.length;
      const thaiPercentage = (thaiCharCount / totalChars) * 100;

      if (thaiPercentage < 10) {
        errors.push(`Insufficient Thai characters: ${thaiPercentage.toFixed(1)}% (expected at least 10%)`);
      }

      // Check for common encoding issues
      if (text.includes('�')) {
        errors.push('Text contains replacement characters (�), indicating encoding corruption');
      }

      // Check for mixed scripts that might indicate encoding issues
      const hasLatin = /[A-Za-z]/.test(text);
      const hasChinese = /[\u4E00-\u9FFF]/.test(text);
      
      if (hasChinese && thaiCharCount > 0) {
        errors.push('Text contains mixed Thai and Chinese characters, possible encoding confusion');
      }

      const valid = errors.length === 0;

      logger.info('Thai encoding validation complete', {
        valid,
        characterCount: thaiCharCount,
        totalCharacters: totalChars,
        thaiPercentage: thaiPercentage.toFixed(1),
        errorCount: errors.length,
        invalidCharCount: invalidCharacters.length
      });

      return {
        valid,
        errors,
        characterCount: thaiCharCount,
        invalidCharacters
      };
    } catch (error) {
      logger.error('Thai encoding validation failed', { error });
      return {
        valid: false,
        errors: ['Encoding validation failed due to system error'],
        characterCount: 0,
        invalidCharacters: []
      };
    }
  }

  /**
   * Check if text is valid UTF-8
   */
  private isValidUTF8(text: string): boolean {
    try {
      // Try to encode and decode
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  }

  /**
   * Check if character is a valid Thai character
   */
  private isValidThaiCharacter(char: string): boolean {
    return (
      this.THAI_CONSONANTS.test(char) ||
      this.THAI_VOWELS.test(char) ||
      this.THAI_TONE_MARKS.test(char) ||
      this.THAI_DIGITS.test(char) ||
      this.THAI_SYMBOLS.test(char)
    );
  }

  /**
   * Check if character can have a tone mark
   */
  private canHaveToneMark(char: string): boolean {
    // Tone marks can follow consonants and some vowels
    return this.THAI_CONSONANTS.test(char) || /[\u0E30-\u0E39]/.test(char);
  }

  /**
   * Normalize Thai text (remove duplicate tone marks, fix spacing)
   */
  normalizeThaiText(text: string): string {
    let normalized = text;

    // Remove duplicate tone marks
    normalized = normalized.replace(/[\u0E48-\u0E4B]{2,}/g, (match) => match[0]);

    // Remove spaces between Thai characters (Thai doesn't use spaces between words)
    normalized = normalized.replace(/(?<=[\u0E00-\u0E7F])\s+(?=[\u0E00-\u0E7F])/g, '');

    return normalized;
  }
}