import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { TranslationMemory } from '../../../models/translation-memory.model';
import { logger } from '../../../utils/logger';

interface UnapprovedTerm {
  term: string;
  section: string;
  suggestedReplacement?: string;
}

interface TerminologyValidationResult {
  valid: boolean;
  unapprovedTerms: UnapprovedTerm[];
  warnings: string[];
}

export class TerminologyValidator {
  private repository: Repository<TranslationMemory>;

  constructor() {
    this.repository = AppDataSource.getRepository(TranslationMemory);
  }

  /**
   * Validate pharmaceutical terminology against approved glossary
   */
  async validate(
    translatedText: string,
    targetLanguage: 'zh-TW' | 'th' | 'vi',
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<TerminologyValidationResult> {
    const unapprovedTerms: UnapprovedTerm[] = [];
    const warnings: string[] = [];

    try {
      // Get all approved terms for this language and market
      const approvedTerms = await this.repository.find({
        where: {
          targetLanguage,
          approvedAt: { $ne: null } as any
        }
      });

      // Filter by market applicability
      const marketTerms = approvedTerms.filter(
        term =>
          term.marketApplicability === market ||
          term.marketApplicability === 'all'
      );

      // Build approved terms map
      const approvedMap = new Map<string, string>();
      marketTerms.forEach(term => {
        approvedMap.set(term.targetTerm.toLowerCase(), term.sourceTerm);
      });

      // Critical pharmaceutical terms that must be validated
      const criticalTerms = this.getCriticalPharmaceuticalTerms(targetLanguage);

      // Check for critical terms in translation
      for (const criticalTerm of criticalTerms) {
        if (translatedText.includes(criticalTerm)) {
          // Verify it's an approved translation
          if (!approvedMap.has(criticalTerm.toLowerCase())) {
            const suggestedReplacement = await this.findSuggestedReplacement(
              criticalTerm,
              targetLanguage,
              market
            );

            unapprovedTerms.push({
              term: criticalTerm,
              section: 'Critical pharmaceutical terminology',
              suggestedReplacement
            });
          }
        }
      }

      // Check for common unapproved variations
      const unapprovedVariations = this.getUnapprovedVariations(targetLanguage);
      for (const [unapproved, approved] of Object.entries(unapprovedVariations)) {
        if (translatedText.includes(unapproved)) {
          warnings.push(
            `Unapproved variation detected: "${unapproved}". Use approved term: "${approved}"`
          );
        }
      }

      const valid = unapprovedTerms.length === 0;

      logger.debug('Terminology validation completed', {
        targetLanguage,
        market,
        valid,
        unapprovedTermsCount: unapprovedTerms.length,
        warningsCount: warnings.length
      });

      return { valid, unapprovedTerms, warnings };
    } catch (error) {
      logger.error('Terminology validation failed', { error });
      throw error;
    }
  }

  /**
   * Get critical pharmaceutical terms for validation
   */
  private getCriticalPharmaceuticalTerms(
    targetLanguage: 'zh-TW' | 'th' | 'vi'
  ): string[] {
    const terms: Record<string, string[]> = {
      'zh-TW': [
        '禁忌症',
        '不良反應',
        '劑量',
        '警告',
        '注意事項',
        '藥物交互作用',
        '懷孕',
        '哺乳',
        '過量'
      ],
      th: [
        'ข้อห้ามใช้',
        'ผลข้างเคียง',
        'ขนาดยา',
        'คำเตือน',
        'ข้อควรระวัง',
        'ปฏิกิริยาระหว่างยา',
        'การตั้งครรภ์',
        'การให้นมบุตร',
        'ใช้ยาเกินขนาด'
      ],
      vi: [
        'chống chỉ định',
        'phản ứng có hại',
        'liều lượng',
        'cảnh báo',
        'thận trọng',
        'tương tác thuốc',
        'thai kỳ',
        'cho con bú',
        'quá liều'
      ]
    };

    return terms[targetLanguage] || [];
  }

  /**
   * Get common unapproved variations
   */
  private getUnapprovedVariations(
    targetLanguage: 'zh-TW' | 'th' | 'vi'
  ): Record<string, string> {
    const variations: Record<string, Record<string, string>> = {
      'zh-TW': {
        副作用: '不良反應', // Unapproved → Approved
        用量: '劑量',
        懷孕期: '懷孕',
        授乳: '哺乳'
      },
      th: {
        'ผลไม่พึงประสงค์': 'ผลข้างเคียง',
        'ปริมาณยา': 'ขนาดยา',
        'หญิงตั้งครรภ์': 'การตั้งครรภ์'
      },
      vi: {
        'tác dụng phụ': 'phản ứng có hại',
        'liều dùng': 'liều lượng',
        'phụ nữ mang thai': 'thai kỳ'
      }
    };

    return variations[targetLanguage] || {};
  }

  /**
   * Find suggested replacement for unapproved term
   */
  private async findSuggestedReplacement(
    term: string,
    targetLanguage: string,
    market: string
  ): Promise<string | undefined> {
    try {
      // Search for similar approved terms
      const similar = await this.repository
        .createQueryBuilder('tm')
        .where('tm.target_language = :targetLanguage', { targetLanguage })
        .andWhere(
          '(tm.market_applicability = :market OR tm.market_applicability = :all)',
          { market, all: 'all' }
        )
        .andWhere('tm.approved_at IS NOT NULL')
        .andWhere('LOWER(tm.target_term) LIKE LOWER(:term)', {
          term: `%${term}%`
        })
        .orderBy('tm.usage_count', 'DESC')
        .limit(1)
        .getOne();

      return similar?.targetTerm;
    } catch (error) {
      logger.error('Failed to find suggested replacement', { error, term });
      return undefined;
    }
  }
}