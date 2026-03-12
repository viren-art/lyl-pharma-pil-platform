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

export class VietnameseTerminologyValidator {
  private repository: Repository<TranslationMemory>;
  private davApprovedTerms: Set<string>;

  constructor() {
    this.repository = AppDataSource.getRepository(TranslationMemory);
    this.davApprovedTerms = new Set();
    this.initializeApprovedTerms();
  }

  /**
   * Initialize DAV approved pharmaceutical terms
   */
  private initializeApprovedTerms(): void {
    // Critical pharmaceutical terms that must use DAV-approved translations
    const approvedTerms = [
      'Chống chỉ định', // contraindications
      'Phản ứng có hại', // adverse reactions
      'Tác dụng không mong muốn', // adverse events
      'Liều lượng', // dosage
      'Cách dùng', // administration
      'Chỉ định', // indication
      'Thận trọng', // precautions
      'Cảnh báo', // warnings
      'Tương tác thuốc', // drug interactions
      'Phụ nữ có thai', // pregnancy
      'Phụ nữ cho con bú', // lactation
      'Sử dụng ở trẻ em', // pediatric use
      'Sử dụng ở người cao tuổi', // geriatric use
      'Quá liều', // overdose
      'Dược lý học', // pharmacology
      'Dược động học', // pharmacokinetics
      'Dược lực học', // pharmacodynamics
      'Nghiên cứu lâm sàng', // clinical studies
      'Bảo quản', // storage
      'Hạn sử dụng', // expiration
      'Uống', // oral
      'Bôi ngoài da', // topical
      'Tiêm tĩnh mạch', // intravenous
      'Tiêm bắp', // intramuscular
      'Tiêm dưới da' // subcutaneous
    ];

    approvedTerms.forEach(term => this.davApprovedTerms.add(term));
  }

  /**
   * Validate pharmaceutical terminology against DAV glossary
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
          targetLanguage: 'vi',
          marketApplicability: 'DAV'
        }
      });

      const approvedTermsMap = new Map<string, string>();
      dbTerms.forEach(term => {
        approvedTermsMap.set(term.targetTerm, term.sourceTerm);
      });

      // Check for critical section-specific terminology
      if (sectionName === 'CONTRAINDICATIONS') {
        if (!translatedText.includes('Chống chỉ định')) {
          warnings.push('Missing DAV-approved term "Chống chỉ định" for contraindications section');
        }
      }

      if (sectionName === 'ADVERSE REACTIONS') {
        if (!translatedText.includes('Phản ứng có hại') && !translatedText.includes('Tác dụng không mong muốn')) {
          warnings.push('Missing DAV-approved terms for adverse reactions');
        }
      }

      if (sectionName === 'DOSAGE AND ADMINISTRATION') {
        if (!translatedText.includes('Liều lượng') && !translatedText.includes('Cách dùng')) {
          warnings.push('Missing DAV-approved terms for dosage/administration');
        }
      }

      // Check for common unapproved variations
      const unapprovedVariations = [
        { incorrect: 'Tác dụng phụ', correct: 'Phản ứng có hại', context: 'adverse reactions' },
        { incorrect: 'Liều dùng', correct: 'Liều lượng', context: 'dosage' },
        { incorrect: 'Cách sử dụng', correct: 'Cách dùng', context: 'administration' },
        { incorrect: 'Lưu ý', correct: 'Thận trọng', context: 'precautions' },
        { incorrect: 'Bảo quản thuốc', correct: 'Bảo quản', context: 'storage' }
      ];

      unapprovedVariations.forEach(variation => {
        if (translatedText.includes(variation.incorrect)) {
          unapprovedTerms.push({
            term: variation.incorrect,
            context: variation.context,
            suggestedReplacement: variation.correct
          });
          warnings.push(
            `Unapproved term "${variation.incorrect}" found. Use DAV-approved term "${variation.correct}"`
          );
        }
      });

      const valid = warnings.length === 0 && unapprovedTerms.length === 0;

      logger.info('Vietnamese terminology validation complete', {
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
      logger.error('Vietnamese terminology validation failed', { sectionName, error });
      return {
        valid: false,
        warnings: ['Terminology validation failed due to system error'],
        unapprovedTerms: []
      };
    }
  }

  /**
   * Get DAV-approved replacement for a term
   */
  async getApprovedReplacement(unapprovedTerm: string): Promise<string | null> {
    const term = await this.repository.findOne({
      where: {
        targetLanguage: 'vi',
        marketApplicability: 'DAV'
      }
    });

    return term?.targetTerm || null;
  }
}