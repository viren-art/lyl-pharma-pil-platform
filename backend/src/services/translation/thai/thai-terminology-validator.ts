import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { TranslationMemory } from '../../../models/translation-memory.model';
import { logger } from '../../../utils/logger';

interface TerminologyValidationResult {
  valid: boolean;
  warnings: string[];
  unapprovedTerms: Array<{
    term: string;
    context: string;
    suggestedReplacement?: string;
  }>;
}

export class ThaiTerminologyValidator {
  private repository: Repository<TranslationMemory>;
  private fdaThailandApprovedTerms: Set<string>;

  constructor() {
    this.repository = AppDataSource.getRepository(TranslationMemory);
    this.fdaThailandApprovedTerms = new Set();
    this.initializeApprovedTerms();
  }

  /**
   * Initialize FDA Thailand approved pharmaceutical terms
   */
  private initializeApprovedTerms(): void {
    // Critical pharmaceutical terms that must use FDA Thailand-approved translations
    const approvedTerms = [
      'ข้อห้ามใช้', // contraindications
      'ผลข้างเคียง', // adverse reactions
      'เหตุการณ์ไม่พึงประสงค์', // adverse events
      'ขนาดยา', // dosage
      'วิธีใช้', // administration
      'ข้อบ่งใช้', // indication
      'ข้อควรระวัง', // precautions
      'คำเตือน', // warnings
      'ปฏิกิริยาระหว่างยา', // drug interactions
      'การตั้งครรภ์', // pregnancy
      'การให้นมบุตร', // lactation
      'การใช้ในเด็ก', // pediatric use
      'การใช้ในผู้สูงอายุ', // geriatric use
      'ใช้ยาเกินขนาด', // overdose
      'เภสัชวิทยา', // pharmacology
      'เภสัชจลนศาสตร์', // pharmacokinetics
      'เภสัชพลศาสตร์', // pharmacodynamics
      'การศึกษาทางคลินิก', // clinical studies
      'การเก็บรักษา', // storage
      'วันหมดอายุ', // expiration
      'รับประทาน', // oral
      'ทาภายนอก', // topical
      'ทางหลอดเลือดดำ', // intravenous
      'ทางกล้ามเนื้อ', // intramuscular
      'ใต้ผิวหนัง' // subcutaneous
    ];

    approvedTerms.forEach(term => this.fdaThailandApprovedTerms.add(term));
  }

  /**
   * Validate pharmaceutical terminology against FDA Thailand glossary
   */
  async validateTerminology(
    translatedText: string,
    sectionName: string
  ): Promise<TerminologyValidationResult> {
    const warnings: string[] = [];
    const unapprovedTerms: Array<{
      term: string;
      context: string;
      suggestedReplacement?: string;
    }> = [];

    try {
      // Get approved terms from database for this section
      const dbTerms = await this.repository.find({
        where: {
          targetLanguage: 'th',
          marketApplicability: 'FDA_Thailand'
        }
      });

      const approvedTermsMap = new Map<string, string>();
      dbTerms.forEach(term => {
        approvedTermsMap.set(term.targetTerm, term.sourceTerm);
      });

      // Check for critical section-specific terminology
      if (sectionName === 'CONTRAINDICATIONS') {
        if (!translatedText.includes('ข้อห้ามใช้')) {
          warnings.push('Missing FDA Thailand-approved term "ข้อห้ามใช้" for contraindications section');
        }
      }

      if (sectionName === 'ADVERSE REACTIONS') {
        if (!translatedText.includes('ผลข้างเคียง') && !translatedText.includes('เหตุการณ์ไม่พึงประสงค์')) {
          warnings.push('Missing FDA Thailand-approved terms for adverse reactions');
        }
      }

      if (sectionName === 'DOSAGE AND ADMINISTRATION') {
        if (!translatedText.includes('ขนาดยา') && !translatedText.includes('วิธีใช้')) {
          warnings.push('Missing FDA Thailand-approved terms for dosage/administration');
        }
      }

      // Check for common unapproved variations
      const unapprovedVariations = [
        { incorrect: 'อาการข้างเคียง', correct: 'ผลข้างเคียง', context: 'adverse reactions' },
        { incorrect: 'ปริมาณยา', correct: 'ขนาดยา', context: 'dosage' },
        { incorrect: 'วิธีการใช้', correct: 'วิธีใช้', context: 'administration' },
        { incorrect: 'คำแนะนำ', correct: 'ข้อควรระวัง', context: 'precautions' }
      ];

      unapprovedVariations.forEach(variation => {
        if (translatedText.includes(variation.incorrect)) {
          unapprovedTerms.push({
            term: variation.incorrect,
            context: variation.context,
            suggestedReplacement: variation.correct
          });
          warnings.push(
            `Unapproved term "${variation.incorrect}" found. Use FDA Thailand-approved term "${variation.correct}"`
          );
        }
      });

      const valid = warnings.length === 0 && unapprovedTerms.length === 0;

      logger.info('Thai terminology validation complete', {
        sectionName,
        valid,
        warningCount: warnings.length,
        unapprovedTermCount: unapprovedTerms.length
      });

      return {
        valid,
        warnings,
        unapprovedTerms
      };
    } catch (error) {
      logger.error('Thai terminology validation failed', { sectionName, error });
      return {
        valid: false,
        warnings: ['Terminology validation failed due to system error'],
        unapprovedTerms: []
      };
    }
  }

  /**
   * Get FDA Thailand-approved replacement for a term
   */
  async getApprovedReplacement(unapprovedTerm: string): Promise<string | null> {
    const term = await this.repository.findOne({
      where: {
        targetLanguage: 'th',
        marketApplicability: 'FDA_Thailand'
      }
    });

    return term?.targetTerm || null;
  }
}