import { logger } from '../../../utils/logger';

interface NumericInconsistency {
  section: string;
  sourceValue: string;
  translatedValue: string;
  type: 'dosage' | 'numeric' | 'unit';
}

interface NumericValidationResult {
  valid: boolean;
  inconsistencies: NumericInconsistency[];
}

interface ValidationSection {
  header: string;
  sourceText: string;
  translatedText: string;
}

export class NumericConsistencyValidator {
  // Common pharmaceutical units and their translations
  private readonly unitMappings: Record<
    string,
    Record<'zh-TW' | 'th' | 'vi', string>
  > = {
    mg: {
      'zh-TW': '毫克',
      th: 'มิลลิกรัม',
      vi: 'mg'
    },
    g: {
      'zh-TW': '克',
      th: 'กรัม',
      vi: 'g'
    },
    ml: {
      'zh-TW': '毫升',
      th: 'มิลลิลิตร',
      vi: 'ml'
    },
    tablet: {
      'zh-TW': '錠',
      th: 'เม็ด',
      vi: 'viên'
    },
    capsule: {
      'zh-TW': '膠囊',
      th: 'แคปซูล',
      vi: 'viên nang'
    },
    'times daily': {
      'zh-TW': '次/日',
      th: 'ครั้งต่อวัน',
      vi: 'lần/ngày'
    },
    'per day': {
      'zh-TW': '每日',
      th: 'ต่อวัน',
      vi: 'mỗi ngày'
    }
  };

  /**
   * Validate numeric consistency between source and translation
   */
  async validate(
    sections: ValidationSection[],
    targetLanguage: 'zh-TW' | 'th' | 'vi'
  ): Promise<NumericValidationResult> {
    const inconsistencies: NumericInconsistency[] = [];

    try {
      for (const section of sections) {
        // Extract numeric values from source
        const sourceNumbers = this.extractNumbers(section.sourceText);
        const translatedNumbers = this.extractNumbers(section.translatedText);

        // Validate dosage values (critical)
        if (this.isDosageSection(section.header)) {
          this.validateDosageConsistency(
            section,
            sourceNumbers,
            translatedNumbers,
            inconsistencies
          );
        }

        // Validate general numeric consistency
        this.validateNumericConsistency(
          section,
          sourceNumbers,
          translatedNumbers,
          inconsistencies
        );

        // Validate unit translations
        this.validateUnitTranslations(
          section,
          targetLanguage,
          inconsistencies
        );
      }

      const valid = inconsistencies.length === 0;

      logger.debug('Numeric consistency validation completed', {
        targetLanguage,
        valid,
        inconsistenciesCount: inconsistencies.length
      });

      return { valid, inconsistencies };
    } catch (error) {
      logger.error('Numeric consistency validation failed', { error });
      throw error;
    }
  }

  /**
   * Extract all numeric values from text
   */
  private extractNumbers(text: string): Array<{ value: number; context: string }> {
    const numbers: Array<{ value: number; context: string }> = [];
    
    // Match numbers with optional decimal points
    const numberRegex = /(\d+\.?\d*)/g;
    let match;

    while ((match = numberRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const startIndex = Math.max(0, match.index - 20);
      const endIndex = Math.min(text.length, match.index + match[1].length + 20);
      const context = text.substring(startIndex, endIndex);

      numbers.push({ value, context });
    }

    return numbers;
  }

  /**
   * Check if section is dosage-related (critical for validation)
   */
  private isDosageSection(header: string): boolean {
    const dosageKeywords = [
      'dosage',
      'dose',
      'administration',
      'posology',
      'how to use'
    ];
    return dosageKeywords.some(keyword =>
      header.toLowerCase().includes(keyword)
    );
  }

  /**
   * Validate dosage consistency (critical validation)
   */
  private validateDosageConsistency(
    section: ValidationSection,
    sourceNumbers: Array<{ value: number; context: string }>,
    translatedNumbers: Array<{ value: number; context: string }>,
    inconsistencies: NumericInconsistency[]
  ): void {
    // Dosage sections must have exact numeric match
    if (sourceNumbers.length !== translatedNumbers.length) {
      inconsistencies.push({
        section: section.header,
        sourceValue: `${sourceNumbers.length} numeric values`,
        translatedValue: `${translatedNumbers.length} numeric values`,
        type: 'dosage'
      });
      return;
    }

    // Sort by value for comparison
    const sortedSource = [...sourceNumbers].sort((a, b) => a.value - b.value);
    const sortedTranslated = [...translatedNumbers].sort(
      (a, b) => a.value - b.value
    );

    for (let i = 0; i < sortedSource.length; i++) {
      if (sortedSource[i].value !== sortedTranslated[i].value) {
        inconsistencies.push({
          section: section.header,
          sourceValue: `${sortedSource[i].value} (${sortedSource[i].context})`,
          translatedValue: `${sortedTranslated[i].value} (${sortedTranslated[i].context})`,
          type: 'dosage'
        });
      }
    }
  }

  /**
   * Validate general numeric consistency
   */
  private validateNumericConsistency(
    section: ValidationSection,
    sourceNumbers: Array<{ value: number; context: string }>,
    translatedNumbers: Array<{ value: number; context: string }>,
    inconsistencies: NumericInconsistency[]
  ): void {
    // Allow some tolerance for non-dosage sections (e.g., percentages, statistics)
    const tolerance = 0.01;

    const sourceValues = sourceNumbers.map(n => n.value);
    const translatedValues = translatedNumbers.map(n => n.value);

    // Check if all source values appear in translation
    for (const sourceNum of sourceNumbers) {
      const matchFound = translatedValues.some(
        tv => Math.abs(tv - sourceNum.value) <= tolerance
      );

      if (!matchFound && !this.isNonCriticalNumber(sourceNum.context)) {
        inconsistencies.push({
          section: section.header,
          sourceValue: `${sourceNum.value} (${sourceNum.context})`,
          translatedValue: 'Not found in translation',
          type: 'numeric'
        });
      }
    }
  }

  /**
   * Validate pharmaceutical unit translations
   */
  private validateUnitTranslations(
    section: ValidationSection,
    targetLanguage: 'zh-TW' | 'th' | 'vi',
    inconsistencies: NumericInconsistency[]
  ): void {
    for (const [englishUnit, translations] of Object.entries(this.unitMappings)) {
      const expectedTranslation = translations[targetLanguage];

      // Check if English unit appears in source
      const sourceHasUnit = section.sourceText
        .toLowerCase()
        .includes(englishUnit.toLowerCase());

      if (sourceHasUnit) {
        // Verify translation contains expected unit
        const translationHasUnit = section.translatedText.includes(
          expectedTranslation
        );

        if (!translationHasUnit) {
          inconsistencies.push({
            section: section.header,
            sourceValue: englishUnit,
            translatedValue: `Expected: ${expectedTranslation}`,
            type: 'unit'
          });
        }
      }
    }
  }

  /**
   * Check if number is non-critical (e.g., page numbers, reference numbers)
   */
  private isNonCriticalNumber(context: string): boolean {
    const nonCriticalPatterns = [
      /page \d+/i,
      /reference \d+/i,
      /section \d+/i,
      /\(\d+\)/
    ];

    return nonCriticalPatterns.some(pattern => pattern.test(context));
  }
}