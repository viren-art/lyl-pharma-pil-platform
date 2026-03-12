import { LLMClient } from '../llm-client';
import { TranslationMemoryService } from '../../translation-memory/translation-memory.service';
import { ThaiEncodingValidator } from '../../validation/encoding/thai-encoding-validator';
import { ThaiTerminologyValidator } from './thai-terminology-validator';
import { logger } from '../../../utils/logger';

interface ThaiTranslationSection {
  sectionName: string;
  translatedText: string;
  confidenceScore: number;
  encodingValid: boolean;
  terminologyValid: boolean;
  warnings: string[];
}

interface ThaiTranslationResult {
  sections: ThaiTranslationSection[];
  overallConfidence: number;
  encodingValid: boolean;
  terminologyValid: boolean;
  processingTimeMs: number;
}

export class ThaiTranslationService {
  private llmClient: LLMClient;
  private translationMemory: TranslationMemoryService;
  private encodingValidator: ThaiEncodingValidator;
  private terminologyValidator: ThaiTerminologyValidator;

  constructor() {
    this.llmClient = new LLMClient();
    this.translationMemory = new TranslationMemoryService();
    this.encodingValidator = new ThaiEncodingValidator();
    this.terminologyValidator = new ThaiTerminologyValidator();
  }

  /**
   * Translate PIL to Thai with FDA Thailand-specific validation
   */
  async translateToThai(
    sourceText: string,
    pilId: number
  ): Promise<ThaiTranslationResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting Thai translation', { pilId });

      // Get FDA Thailand pharmaceutical terminology
      const terminology = await this.translationMemory.getTerminologyForLanguage('th');
      
      // Add FDA Thailand-specific terms
      const fdaThailandTerms = await this.getFDAThailandTerminology();
      fdaThailandTerms.forEach((value, key) => terminology.set(key, value));

      // Split into sections for granular validation
      const sections = this.splitIntoSections(sourceText);
      const translatedSections: ThaiTranslationSection[] = [];

      for (const section of sections) {
        logger.info('Translating section to Thai', { 
          pilId, 
          section: section.header 
        });

        // Perform LLM translation with Thai-specific prompt
        const translationResult = await this.llmClient.translatePIL(
          section.content,
          'th',
          terminology
        );

        const translatedText = translationResult.sections[0]?.translatedText || '';
        const confidenceScore = translationResult.sections[0]?.confidenceScore || 0;

        // Validate Thai script encoding
        const encodingValidation = this.encodingValidator.validateThaiScript(translatedText);

        // Validate FDA Thailand pharmaceutical terminology
        const terminologyValidation = await this.terminologyValidator.validateTerminology(
          translatedText,
          section.header
        );

        const warnings: string[] = [];
        if (!encodingValidation.valid) {
          warnings.push(...encodingValidation.errors);
        }
        if (!terminologyValidation.valid) {
          warnings.push(...terminologyValidation.warnings);
        }

        translatedSections.push({
          sectionName: section.header,
          translatedText,
          confidenceScore,
          encodingValid: encodingValidation.valid,
          terminologyValid: terminologyValidation.valid,
          warnings
        });

        logger.info('Thai section translation complete', {
          pilId,
          section: section.header,
          confidenceScore,
          encodingValid: encodingValidation.valid,
          terminologyValid: terminologyValidation.valid,
          warningCount: warnings.length
        });
      }

      // Calculate overall metrics
      const overallConfidence = this.calculateOverallConfidence(translatedSections);
      const encodingValid = translatedSections.every(s => s.encodingValid);
      const terminologyValid = translatedSections.every(s => s.terminologyValid);
      const processingTimeMs = Date.now() - startTime;

      logger.info('Thai translation complete', {
        pilId,
        overallConfidence,
        encodingValid,
        terminologyValid,
        processingTimeMs,
        sectionCount: translatedSections.length
      });

      return {
        sections: translatedSections,
        overallConfidence,
        encodingValid,
        terminologyValid,
        processingTimeMs
      };
    } catch (error) {
      logger.error('Thai translation failed', { pilId, error });
      throw error;
    }
  }

  /**
   * Get FDA Thailand-approved pharmaceutical terminology
   */
  private async getFDAThailandTerminology(): Promise<Map<string, string>> {
    const terms = new Map<string, string>();

    // FDA Thailand-specific pharmaceutical terms
    terms.set('contraindications', 'ข้อห้ามใช้');
    terms.set('adverse reactions', 'ผลข้างเคียง');
    terms.set('adverse events', 'เหตุการณ์ไม่พึงประสงค์');
    terms.set('dosage', 'ขนาดยา');
    terms.set('dose', 'ขนาด');
    terms.set('administration', 'วิธีใช้');
    terms.set('indication', 'ข้อบ่งใช้');
    terms.set('precautions', 'ข้อควรระวัง');
    terms.set('warnings', 'คำเตือน');
    terms.set('drug interactions', 'ปฏิกิริยาระหว่างยา');
    terms.set('pregnancy', 'การตั้งครรภ์');
    terms.set('lactation', 'การให้นมบุตร');
    terms.set('pediatric use', 'การใช้ในเด็ก');
    terms.set('geriatric use', 'การใช้ในผู้สูงอายุ');
    terms.set('overdose', 'ใช้ยาเกินขนาด');
    terms.set('pharmacology', 'เภสัชวิทยา');
    terms.set('pharmacokinetics', 'เภสัชจลนศาสตร์');
    terms.set('pharmacodynamics', 'เภสัชพลศาสตร์');
    terms.set('clinical studies', 'การศึกษาทางคลินิก');
    terms.set('storage', 'การเก็บรักษา');
    terms.set('expiration', 'วันหมดอายุ');
    terms.set('tablet', 'เม็ด');
    terms.set('capsule', 'แคปซูล');
    terms.set('injection', 'ยาฉีด');
    terms.set('oral', 'รับประทาน');
    terms.set('topical', 'ทาภายนอก');
    terms.set('intravenous', 'ทางหลอดเลือดดำ');
    terms.set('intramuscular', 'ทางกล้ามเนื้อ');
    terms.set('subcutaneous', 'ใต้ผิวหนัง');

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
  private calculateOverallConfidence(sections: ThaiTranslationSection[]): number {
    if (sections.length === 0) return 0;

    const totalConfidence = sections.reduce((sum, section) => {
      // Penalize confidence if encoding or terminology validation failed
      let adjustedConfidence = section.confidenceScore;
      if (!section.encodingValid) adjustedConfidence *= 0.8;
      if (!section.terminologyValid) adjustedConfidence *= 0.9;
      return sum + adjustedConfidence;
    }, 0);

    return totalConfidence / sections.length;
  }
}