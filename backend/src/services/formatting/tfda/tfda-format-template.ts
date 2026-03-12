import { logger } from '../../../utils/logger';

export interface TFDASection {
  header: string;
  content: string;
  required: boolean;
  order: number;
}

export interface TFDAFormatConfig {
  pageSize: 'A4';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  font: {
    family: string;
    size: number;
    lineHeight: number;
  };
  sectionOrdering: string[];
  headerFormat: {
    fontSize: number;
    bold: boolean;
    spacing: number;
  };
}

export class TFDAFormatTemplate {
  private static readonly TFDA_CONFIG: TFDAFormatConfig = {
    pageSize: 'A4',
    margins: {
      top: 25.4, // 1 inch in mm
      bottom: 25.4,
      left: 31.75, // 1.25 inches
      right: 31.75,
    },
    font: {
      family: '標楷體', // Kai font for Traditional Chinese
      size: 12,
      lineHeight: 1.5,
    },
    sectionOrdering: [
      '藥品名稱', // Drug Name
      '適應症', // Indications
      '用法用量', // Dosage and Administration
      '禁忌症', // Contraindications (TFDA requires before warnings)
      '警語及注意事項', // Warnings and Precautions
      '不良反應', // Adverse Reactions
      '藥物交互作用', // Drug Interactions
      '特殊族群使用', // Use in Special Populations
      '懷孕及哺乳', // Pregnancy and Lactation
      '過量', // Overdose
      '藥理作用', // Pharmacology
      '藥動學', // Pharmacokinetics
      '儲存條件', // Storage Conditions
      '包裝', // Packaging
      '製造廠', // Manufacturer
      '許可證字號', // License Number
    ],
    headerFormat: {
      fontSize: 14,
      bold: true,
      spacing: 6, // mm spacing after header
    },
  };

  /**
   * Get TFDA format configuration
   */
  public static getConfig(): TFDAFormatConfig {
    return { ...this.TFDA_CONFIG };
  }

  /**
   * Validate PIL sections against TFDA requirements
   */
  public static validateSections(sections: Map<string, string>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required sections for TFDA submission
    const requiredSections = [
      '藥品名稱',
      '適應症',
      '用法用量',
      '禁忌症',
      '警語及注意事項',
      '不良反應',
    ];

    // Check for missing required sections
    for (const required of requiredSections) {
      if (!sections.has(required) || !sections.get(required)?.trim()) {
        errors.push(`Missing required section: ${required}`);
      }
    }

    // Check for recommended sections
    const recommendedSections = [
      '藥物交互作用',
      '特殊族群使用',
      '藥理作用',
    ];

    for (const recommended of recommendedSections) {
      if (!sections.has(recommended) || !sections.get(recommended)?.trim()) {
        warnings.push(`Missing recommended section: ${recommended}`);
      }
    }

    // Validate Traditional Chinese encoding
    for (const [header, content] of sections.entries()) {
      if (!this.isValidTraditionalChinese(content)) {
        errors.push(`Section "${header}" contains invalid Traditional Chinese characters`);
      }
    }

    const valid = errors.length === 0;

    logger.info('TFDA section validation completed', {
      valid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return { valid, errors, warnings };
  }

  /**
   * Order sections according to TFDA requirements
   */
  public static orderSections(sections: Map<string, string>): TFDASection[] {
    const orderedSections: TFDASection[] = [];

    // Add sections in TFDA-specified order
    this.TFDA_CONFIG.sectionOrdering.forEach((header, index) => {
      const content = sections.get(header);
      if (content) {
        orderedSections.push({
          header,
          content,
          required: this.isRequiredSection(header),
          order: index + 1,
        });
      }
    });

    // Add any remaining sections not in standard ordering
    for (const [header, content] of sections.entries()) {
      if (!this.TFDA_CONFIG.sectionOrdering.includes(header)) {
        orderedSections.push({
          header,
          content,
          required: false,
          order: orderedSections.length + 1,
        });
        logger.warn('Non-standard section found in TFDA PIL', { header });
      }
    }

    return orderedSections;
  }

  /**
   * Check if section is required by TFDA
   */
  private static isRequiredSection(header: string): boolean {
    const requiredSections = [
      '藥品名稱',
      '適應症',
      '用法用量',
      '禁忌症',
      '警語及注意事項',
      '不良反應',
    ];
    return requiredSections.includes(header);
  }

  /**
   * Validate Traditional Chinese character encoding
   */
  private static isValidTraditionalChinese(text: string): boolean {
    // Check for valid UTF-8 encoding
    try {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      if (decoded !== text) return false;
    } catch {
      return false;
    }

    // Check for Traditional Chinese character ranges
    const chars = Array.from(text);
    let chineseCharCount = 0;

    for (const char of chars) {
      const codePoint = char.codePointAt(0);
      if (!codePoint) continue;

      // CJK Unified Ideographs (Traditional Chinese range)
      if (
        (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
        (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
        (codePoint >= 0x20000 && codePoint <= 0x2a6df)
      ) {
        chineseCharCount++;
      }
    }

    // Text should contain at least 10% Chinese characters for pharmaceutical content
    const totalChars = chars.length;
    const chinesePercentage = (chineseCharCount / totalChars) * 100;

    return chinesePercentage >= 10;
  }

  /**
   * Get TFDA cover letter template
   */
  public static getCoverLetterTemplate(data: {
    productName: string;
    licenseNumber: string;
    submissionDate: string;
    applicantName: string;
  }): string {
    return `
衛生福利部食品藥物管理署 鈞鑒：

主旨：檢送「${data.productName}」藥品仿單變更申請資料，敬請審查。

說明：
一、本公司謹依藥事法相關規定，檢送「${data.productName}」（許可證字號：${data.licenseNumber}）藥品仿單變更申請資料。

二、檢附文件如下：
    （一）藥品仿單變更申請表
    （二）變更後藥品仿單（中文版）
    （三）變更對照表
    （四）原廠仿單（英文版）

三、本案如有疑義，請不吝指教。

此致

申請人：${data.applicantName}
申請日期：${data.submissionDate}
    `.trim();
  }

  /**
   * Get TFDA revision history template
   */
  public static getRevisionHistoryTemplate(revisions: Array<{
    version: string;
    date: string;
    changes: string;
  }>): string {
    let history = '仿單修訂歷史\n\n';
    history += '版本\t修訂日期\t修訂內容\n';
    history += '─'.repeat(60) + '\n';

    for (const revision of revisions) {
      history += `${revision.version}\t${revision.date}\t${revision.changes}\n`;
    }

    return history;
  }
}