import { logger } from '../../../utils/logger';
import { EncodingValidator } from './encoding-validator';
import { NumericConsistencyValidator } from './numeric-consistency-validator';
import { TerminologyValidator } from './terminology-validator';

interface QualityValidationResult {
  valid: boolean;
  overallScore: number;
  encodingValidation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  numericValidation: {
    valid: boolean;
    inconsistencies: Array<{
      section: string;
      sourceValue: string;
      translatedValue: string;
      type: 'dosage' | 'numeric' | 'unit';
    }>;
  };
  terminologyValidation: {
    valid: boolean;
    unapprovedTerms: Array<{
      term: string;
      section: string;
      suggestedReplacement?: string;
    }>;
    warnings: string[];
  };
  criticalIssues: string[];
  recommendations: string[];
}

interface ValidationSection {
  header: string;
  sourceText: string;
  translatedText: string;
}

export class QualityValidatorService {
  private encodingValidator: EncodingValidator;
  private numericValidator: NumericConsistencyValidator;
  private terminologyValidator: TerminologyValidator;

  constructor() {
    this.encodingValidator = new EncodingValidator();
    this.numericValidator = new NumericConsistencyValidator();
    this.terminologyValidator = new TerminologyValidator();
  }

  /**
   * Perform comprehensive quality validation on translated PIL
   */
  async validateTranslation(
    sourceText: string,
    translatedText: string,
    targetLanguage: 'zh-TW' | 'th' | 'vi',
    market: 'TFDA' | 'FDA_Thailand' | 'DAV',
    pilId: number
  ): Promise<QualityValidationResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting quality validation', {
        pilId,
        targetLanguage,
        market,
        sourceLength: sourceText.length,
        translatedLength: translatedText.length
      });

      // Split into sections for granular validation
      const sections = this.splitIntoSections(sourceText, translatedText);

      // 1. Encoding validation
      const encodingResult = await this.encodingValidator.validate(
        translatedText,
        targetLanguage
      );

      // 2. Numeric consistency validation
      const numericResult = await this.numericValidator.validate(
        sections,
        targetLanguage
      );

      // 3. Terminology validation
      const terminologyResult = await this.terminologyValidator.validate(
        translatedText,
        targetLanguage,
        market
      );

      // Calculate overall quality score
      const overallScore = this.calculateQualityScore(
        encodingResult,
        numericResult,
        terminologyResult
      );

      // Identify critical issues
      const criticalIssues = this.identifyCriticalIssues(
        encodingResult,
        numericResult,
        terminologyResult
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        encodingResult,
        numericResult,
        terminologyResult
      );

      const valid =
        encodingResult.valid &&
        numericResult.valid &&
        terminologyResult.valid &&
        criticalIssues.length === 0;

      const processingTime = Date.now() - startTime;

      logger.info('Quality validation completed', {
        pilId,
        valid,
        overallScore,
        processingTimeMs: processingTime,
        criticalIssuesCount: criticalIssues.length
      });

      return {
        valid,
        overallScore,
        encodingValidation: encodingResult,
        numericValidation: numericResult,
        terminologyValidation: terminologyResult,
        criticalIssues,
        recommendations
      };
    } catch (error) {
      logger.error('Quality validation failed', { error, pilId });
      throw error;
    }
  }

  /**
   * Split source and translated text into aligned sections
   */
  private splitIntoSections(
    sourceText: string,
    translatedText: string
  ): ValidationSection[] {
    const sectionHeaders = [
      'Product Name',
      'Active Ingredients',
      'Indication',
      'Dosage',
      'Administration',
      'Contraindications',
      'Warnings',
      'Precautions',
      'Adverse Reactions',
      'Drug Interactions',
      'Pregnancy',
      'Lactation',
      'Pediatric Use',
      'Geriatric Use',
      'Overdose',
      'Pharmacology',
      'Storage'
    ];

    const sections: ValidationSection[] = [];
    const sourceLines = sourceText.split('\n');
    const translatedLines = translatedText.split('\n');

    let currentSourceSection = '';
    let currentTranslatedSection = '';
    let currentHeader = '';

    for (let i = 0; i < Math.max(sourceLines.length, translatedLines.length); i++) {
      const sourceLine = sourceLines[i] || '';
      const translatedLine = translatedLines[i] || '';

      // Check if line is a section header
      const isHeader = sectionHeaders.some(header =>
        sourceLine.trim().toLowerCase().includes(header.toLowerCase())
      );

      if (isHeader && currentHeader) {
        // Save previous section
        sections.push({
          header: currentHeader,
          sourceText: currentSourceSection.trim(),
          translatedText: currentTranslatedSection.trim()
        });
        currentSourceSection = '';
        currentTranslatedSection = '';
      }

      if (isHeader) {
        currentHeader = sourceLine.trim();
      } else {
        currentSourceSection += sourceLine + '\n';
        currentTranslatedSection += translatedLine + '\n';
      }
    }

    // Add final section
    if (currentHeader) {
      sections.push({
        header: currentHeader,
        sourceText: currentSourceSection.trim(),
        translatedText: currentTranslatedSection.trim()
      });
    }

    return sections;
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private calculateQualityScore(
    encodingResult: any,
    numericResult: any,
    terminologyResult: any
  ): number {
    let score = 100;

    // Encoding errors: -5 points each
    score -= encodingResult.errors.length * 5;

    // Encoding warnings: -2 points each
    score -= encodingResult.warnings.length * 2;

    // Numeric inconsistencies: -10 points each (critical)
    score -= numericResult.inconsistencies.length * 10;

    // Unapproved terminology: -8 points each
    score -= terminologyResult.unapprovedTerms.length * 8;

    // Terminology warnings: -3 points each
    score -= terminologyResult.warnings.length * 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify critical issues that block submission
   */
  private identifyCriticalIssues(
    encodingResult: any,
    numericResult: any,
    terminologyResult: any
  ): string[] {
    const critical: string[] = [];

    // Critical encoding errors
    if (encodingResult.errors.length > 0) {
      critical.push(
        `Character encoding errors detected (${encodingResult.errors.length}). Must be resolved before submission.`
      );
    }

    // Dosage inconsistencies are critical
    const dosageInconsistencies = numericResult.inconsistencies.filter(
      (i: any) => i.type === 'dosage'
    );
    if (dosageInconsistencies.length > 0) {
      critical.push(
        `Dosage inconsistencies detected (${dosageInconsistencies.length}). All dosages must match source document exactly.`
      );
    }

    // Unapproved critical pharmaceutical terms
    const criticalSections = ['contraindications', 'dosage', 'adverse reactions'];
    const criticalTerms = terminologyResult.unapprovedTerms.filter((t: any) =>
      criticalSections.some(s => t.section.toLowerCase().includes(s))
    );
    if (criticalTerms.length > 0) {
      critical.push(
        `Unapproved pharmaceutical terminology in critical sections (${criticalTerms.length}). Regulatory review required.`
      );
    }

    return critical;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    encodingResult: any,
    numericResult: any,
    terminologyResult: any
  ): string[] {
    const recommendations: string[] = [];

    if (encodingResult.warnings.length > 0) {
      recommendations.push(
        'Review character encoding warnings to ensure proper display in regulatory submission.'
      );
    }

    if (numericResult.inconsistencies.length > 0) {
      recommendations.push(
        'Verify all numeric values against source document. Use translation memory for consistent unit translations.'
      );
    }

    if (terminologyResult.unapprovedTerms.length > 0) {
      recommendations.push(
        'Submit unapproved pharmaceutical terms for regulatory review and approval before final submission.'
      );
    }

    if (terminologyResult.warnings.length > 0) {
      recommendations.push(
        'Review terminology warnings for consistency with approved pharmaceutical glossary.'
      );
    }

    return recommendations;
  }

  /**
   * Validate specific section (for incremental validation during editing)
   */
  async validateSection(
    sectionHeader: string,
    sourceText: string,
    translatedText: string,
    targetLanguage: 'zh-TW' | 'th' | 'vi',
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<{
    valid: boolean;
    encodingValid: boolean;
    numericValid: boolean;
    terminologyValid: boolean;
    issues: string[];
  }> {
    try {
      const encodingResult = await this.encodingValidator.validate(
        translatedText,
        targetLanguage
      );

      const numericResult = await this.numericValidator.validate(
        [{ header: sectionHeader, sourceText, translatedText }],
        targetLanguage
      );

      const terminologyResult = await this.terminologyValidator.validate(
        translatedText,
        targetLanguage,
        market
      );

      const issues: string[] = [
        ...encodingResult.errors,
        ...numericResult.inconsistencies.map(
          i => `${i.type}: ${i.sourceValue} → ${i.translatedValue}`
        ),
        ...terminologyResult.unapprovedTerms.map(t => `Unapproved term: ${t.term}`)
      ];

      return {
        valid:
          encodingResult.valid &&
          numericResult.valid &&
          terminologyResult.valid,
        encodingValid: encodingResult.valid,
        numericValid: numericResult.valid,
        terminologyValid: terminologyResult.valid,
        issues
      };
    } catch (error) {
      logger.error('Section validation failed', { error, sectionHeader });
      throw error;
    }
  }
}