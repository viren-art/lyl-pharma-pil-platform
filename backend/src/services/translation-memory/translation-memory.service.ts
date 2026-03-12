import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { TranslationMemory } from '../../models/translation-memory.model';
import { logger } from '../../utils/logger';

export class TranslationMemoryService {
  private repository: Repository<TranslationMemory>;

  constructor() {
    this.repository = AppDataSource.getRepository(TranslationMemory);
  }

  async getTerminologyForLanguage(
    targetLanguage: string
  ): Promise<Map<string, string>> {
    try {
      // Fetch TFDA-approved terminology from database
      const terms = await this.repository.find({
        where: { 
          targetLanguage,
          approvedBy: { $ne: null } as any, // Only approved terms
        },
      });

      const terminologyMap = new Map<string, string>();
      
      for (const term of terms) {
        terminologyMap.set(term.sourceTerm, term.targetTerm);
      }

      // Add default pharmaceutical terminology if not in database
      this.addDefaultTerminology(terminologyMap, targetLanguage);

      logger.info('TFDA terminology loaded', {
        targetLanguage,
        approvedTermsCount: terms.length,
        totalTermsCount: terminologyMap.size,
      });

      return terminologyMap;
    } catch (error) {
      logger.error('Failed to load TFDA terminology', {
        targetLanguage,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback to default terminology only
      const fallbackMap = new Map<string, string>();
      this.addDefaultTerminology(fallbackMap, targetLanguage);
      return fallbackMap;
    }
  }

  private addDefaultTerminology(
    map: Map<string, string>,
    targetLanguage: string
  ): void {
    if (targetLanguage === 'zh-TW') {
      // TFDA-approved Traditional Chinese pharmaceutical terminology
      const tfdaApprovedTerms: Record<string, string> = {
        'contraindications': '禁忌症',
        'adverse reactions': '不良反應',
        'dosage': '劑量',
        'posology': '用法用量',
        'undesirable effects': '不良反應',
        'pharmaceutical form': '劑型',
        'active substance': '活性成分',
        'excipients': '賦形劑',
        'therapeutic indications': '治療適應症',
        'pregnancy': '懷孕',
        'lactation': '哺乳',
        'hepatic impairment': '肝功能不全',
        'renal impairment': '腎功能不全',
        'hypersensitivity': '過敏反應',
        'overdose': '過量',
        'shelf life': '保存期限',
        'storage conditions': '儲存條件',
        'tablets': '錠劑',
        'capsules': '膠囊',
        'oral administration': '口服給藥',
        'intravenous': '靜脈注射',
        'intramuscular': '肌肉注射',
        'subcutaneous': '皮下注射',
        'nausea': '噁心',
        'vomiting': '嘔吐',
        'diarrhea': '腹瀉',
        'headache': '頭痛',
        'dizziness': '頭暈',
        'rash': '皮疹',
        'pruritus': '搔癢',
        'anaphylaxis': '過敏性休克',
        'severe allergic reaction': '嚴重過敏反應',
        'elderly': '老年人',
        'pediatric': '兒童',
        'adults': '成人',
        'twice daily': '每日兩次',
        'once daily': '每日一次',
        'with food': '隨餐服用',
        'on empty stomach': '空腹服用',
      };

      for (const [source, target] of Object.entries(tfdaApprovedTerms)) {
        if (!map.has(source)) {
          map.set(source, target);
        }
      }
    } else if (targetLanguage === 'th') {
      // FDA Thailand-approved Thai pharmaceutical terminology
      const fdaThailandApprovedTerms: Record<string, string> = {
        'contraindications': 'ข้อห้ามใช้',
        'adverse reactions': 'ผลข้างเคียง',
        'dosage': 'ขนาดยา',
        'posology': 'วิธีใช้ยา',
        'undesirable effects': 'ผลข้างเคียง',
        'pharmaceutical form': 'รูปแบบยา',
        'active substance': 'สารออกฤทธิ์',
        'excipients': 'สารช่วย',
        'therapeutic indications': 'ข้อบ่งใช้',
        'pregnancy': 'การตั้งครรภ์',
        'lactation': 'การให้นมบุตร',
        'hepatic impairment': 'ภาวะตับผิดปกติ',
        'renal impairment': 'ภาวะไตผิดปกติ',
        'hypersensitivity': 'ภูมิแพ้',
        'overdose': 'ใช้ยาเกินขนาด',
        'shelf life': 'อายุการเก็บรักษา',
        'storage conditions': 'เงื่อนไขการเก็บรักษา',
      };

      for (const [source, target] of Object.entries(fdaThailandApprovedTerms)) {
        if (!map.has(source)) {
          map.set(source, target);
        }
      }
    } else if (targetLanguage === 'vi') {
      // DAV-approved Vietnamese pharmaceutical terminology
      const davApprovedTerms: Record<string, string> = {
        'contraindications': 'Chống chỉ định',
        'adverse reactions': 'Phản ứng có hại',
        'dosage': 'Liều lượng',
        'posology': 'Cách dùng',
        'undesirable effects': 'Tác dụng không mong muốn',
        'pharmaceutical form': 'Dạng bào chế',
        'active substance': 'Hoạt chất',
        'excipients': 'Tá dược',
        'therapeutic indications': 'Chỉ định điều trị',
        'pregnancy': 'Thai kỳ',
        'lactation': 'Cho con bú',
        'hepatic impairment': 'Suy gan',
        'renal impairment': 'Suy thận',
        'hypersensitivity': 'Quá mẫn',
        'overdose': 'Quá liều',
        'shelf life': 'Hạn sử dụng',
        'storage conditions': 'Điều kiện bảo quản',
      };

      for (const [source, target] of Object.entries(davApprovedTerms)) {
        if (!map.has(source)) {
          map.set(source, target);
        }
      }
    }
  }

  async recordTermUsage(sourceTerm: string, targetLanguage: string): Promise<void> {
    try {
      await this.repository.increment(
        { sourceTerm, targetLanguage },
        'usageCount',
        1
      );
    } catch (error) {
      logger.error('Failed to record term usage', {
        sourceTerm,
        targetLanguage,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async validateTerminologyCompliance(
    translatedText: string,
    targetLanguage: string
  ): Promise<{ compliant: boolean; unapprovedTerms: string[] }> {
    const terminology = await this.getTerminologyForLanguage(targetLanguage);
    const approvedTargetTerms = new Set(Array.from(terminology.values()));
    
    // Extract potential pharmaceutical terms from translated text
    // This is a simplified check - production would use NLP
    const unapprovedTerms: string[] = [];
    
    // Check for common pharmaceutical terms that should be in approved list
    const criticalTermPatterns = [
      /禁忌/,
      /不良反應/,
      /劑量/,
      /用法/,
      /過敏/,
      /肝功能/,
      /腎功能/,
    ];

    for (const pattern of criticalTermPatterns) {
      const matches = translatedText.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (!approvedTargetTerms.has(match)) {
            unapprovedTerms.push(match);
          }
        }
      }
    }

    return {
      compliant: unapprovedTerms.length === 0,
      unapprovedTerms,
    };
  }
}