import { LLMClient } from '../llm-client';
import { TranslationMemoryService } from '../../translation-memory/translation-memory.service';
import { VietnameseEncodingValidator } from '../../validation/encoding/vietnamese-encoding-validator';
import { VietnameseTerminologyValidator } from './vietnamese-terminology-validator';
import { logger } from '../../../utils/logger';

interface VietnameseTranslationSection {
  sectionName: string;
  translatedText: string;
  confidenceScore: number;
  encodingValid: boolean;
  diacriticsValid: boolean;
  terminologyValid: boolean;
  warnings: string[];
}

interface VietnameseTranslationResult {
  sections: VietnameseTranslationSection[];
  overallConfidence: number;
  encodingValid: boolean;
  diacriticsValid: boolean;
  terminologyValid: boolean;
  processingTimeMs: number;
}

export class VietnameseTranslationService {
  private llmClient: LLMClient;
  private translationMemory: TranslationMemoryService;
  private encodingValidator: VietnameseEncodingValidator;
  private terminologyValidator: VietnameseTerminologyValidator;

  constructor() {
    this.llmClient = new LLMClient();
    this.translationMemory = new TranslationMemoryService();
    this.encodingValidator = new VietnameseEncodingValidator();
    this.terminologyValidator = new VietnameseTerminologyValidator();
  }

  /**
   * Translate PIL to Vietnamese with DAV-specific validation
   */
  async translateToVietnamese(
    sourceText: string,
    pilId: number
  ): Promise<VietnameseTranslationResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting Vietnamese translation', { pilId });

      // Get DAV pharmaceutical terminology
      const terminology = await this.translationMemory.getTerminologyForLanguage('vi');
      
      // Add DAV-specific terms
      const davTerms = await this.getDAVTerminology();
      davTerms.forEach((value, key) => terminology.set(key, value));

      // Split into sections for granular validation
      const sections = this.splitIntoSections(sourceText);
      const translatedSections: VietnameseTranslationSection[] = [];

      for (const section of sections) {
        logger.info('Translating section to Vietnamese', { 
          pilId, 
          section: section.header 
        });

        // Perform LLM translation with Vietnamese-specific prompt
        const translationResult = await this.llmClient.translatePIL(
          section.content,
          'vi',
          terminology
        );

        const translatedText = translationResult.sections[0]?.translatedText || '';
        const confidenceScore = translationResult.sections[0]?.confidenceScore || 0;

        // Validate Vietnamese diacritics and encoding
        const encodingValidation = this.encodingValidator.validateVietnameseDiacritics(translatedText);

        // Validate DAV pharmaceutical terminology
        const terminologyValidation = await this.terminologyValidator.validateTerminology(
          translatedText,
          section.header
        );

        const warnings: string[] = [];
        if (!encodingValidation.valid) {
          warnings.push(...encodingValidation.errors);
        }
        if (!encodingValidation.diacriticsValid) {
          warnings.push(...encodingValidation.diacriticWarnings);
        }
        if (!terminologyValidation.valid) {
          warnings.push(...terminologyValidation.warnings);
        }

        translatedSections.push({
          sectionName: section.header,
          translatedText,
          confidenceScore,
          encodingValid: encodingValidation.valid,
          diacriticsValid: encodingValidation.diacriticsValid,
          terminologyValid: terminologyValidation.valid,
          warnings
        });

        logger.info('Vietnamese section translation complete', {
          pilId,
          section: section.header,
          confidenceScore,
          encodingValid: encodingValidation.valid,
          diacriticsValid: encodingValidation.diacriticsValid,
          terminologyValid: terminologyValidation.valid,
          warningCount: warnings.length
        });
      }

      // Calculate overall metrics
      const overallConfidence = this.calculateOverallConfidence(translatedSections);
      const encodingValid = translatedSections.every(s => s.encodingValid);
      const diacriticsValid = translatedSections.every(s => s.diacriticsValid);
      const terminologyValid = translatedSections.every(s => s.terminologyValid);
      const processingTimeMs = Date.now() - startTime;

      logger.info('Vietnamese translation complete', {
        pilId,
        overallConfidence,
        encodingValid,
        diacriticsValid,
        terminologyValid,
        processingTimeMs,
        sectionCount: translatedSections.length
      });

      return {
        sections: translatedSections,
        overallConfidence,
        encodingValid,
        diacriticsValid,
        terminologyValid,
        processingTimeMs
      };
    } catch (error) {
      logger.error('Vietnamese translation failed', { pilId, error });
      throw error;
    }
  }

  /**
   * Get DAV-approved pharmaceutical terminology
   */
  private async getDAVTerminology(): Promise<Map<string, string>> {
    const terms = new Map<string, string>();

    // DAV-specific pharmaceutical terms
    terms.set('contraindications', 'Chống chỉ định');
    terms.set('adverse reactions', 'Phản ứng có hại');
    terms.set('adverse events', 'Tác dụng không mong muốn');
    terms.set('dosage', 'Liều lượng');
    terms.set('dose', 'Liều');
    terms.set('administration', 'Cách dùng');
    terms.set('indication', 'Chỉ định');
    terms.set('precautions', 'Thận trọng');
    terms.set('warnings', 'Cảnh báo');
    terms.set('drug interactions', 'Tương tác thuốc');
    terms.set('pregnancy', 'Phụ nữ có thai');
    terms.set('lactation', 'Phụ nữ cho con bú');
    terms.set('pediatric use', 'Sử dụng ở trẻ em');
    terms.set('geriatric use', 'Sử dụng ở người cao tuổi');
    terms.set('overdose', 'Quá liều');
    terms.set('pharmacology', 'Dược lý học');
    terms.set('pharmacokinetics', 'Dược động học');
    terms.set('pharmacodynamics', 'Dược lực học');
    terms.set('clinical studies', 'Nghiên cứu lâm sàng');
    terms.set('storage', 'Bảo quản');
    terms.set('expiration', 'Hạn sử dụng');
    terms.set('tablet', 'Viên nén');
    terms.set('capsule', 'Viên nang');
    terms.set('injection', 'Tiêm');
    terms.set('oral', 'Uống');
    terms.set('topical', 'Bôi ngoài da');
    terms.set('intravenous', 'Tiêm tĩnh mạch');
    terms.set('intramuscular', 'Tiêm bắp');
    terms.set('subcutaneous', 'Tiêm dưới da');

    return terms;
  }

  /**
   * Split source text into sections
   */
  private splitIntoSections(sourceText: string): Array<{ header: string; content: string }> {
    const sectionHeaders = [
      'DESCRIPTION',
      'INDICATIONS AND USAGE',
      'DOSAGE AND ADMINISTRATION',
      'CONTRAINDICATIONS',
      'WARNINGS AND PRECAUTIONS',
      'ADVERSE REACTIONS',
      'DRUG INTERACTIONS',
      'USE IN SPECIFIC POPULATIONS',
      'OVERDOSAGE',
      'CLINICAL PHARMACOLOGY',
      'HOW SUPPLIED/STORAGE AND HANDLING'
    ];

    const sections: Array<{ header: string; content: string }> = [];
    const lines = sourceText.split('\n');
    let currentSection = { header: 'GENERAL', content: '' };

    for (const line of lines) {
      const trimmedLine = line.trim();
      const matchedHeader = sectionHeaders.find(header => 
        trimmedLine.toUpperCase().includes(header)
      );

      if (matchedHeader) {
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = { header: matchedHeader, content: '' };
      } else {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(sections: VietnameseTranslationSection[]): number {
    if (sections.length === 0) return 0;

    const totalConfidence = sections.reduce((sum, section) => {
      // Penalize confidence if encoding, diacritics, or terminology validation failed
      let adjustedConfidence = section.confidenceScore;
      if (!section.encodingValid) adjustedConfidence *= 0.8;
      if (!section.diacriticsValid) adjustedConfidence *= 0.85;
      if (!section.terminologyValid) adjustedConfidence *= 0.9;
      return sum + adjustedConfidence;
    }, 0);

    return totalConfidence / sections.length;
  }
}