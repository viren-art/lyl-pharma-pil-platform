import { logger } from '../../../utils/logger';

export interface DAVSection {
  header: string;
  content: string;
  required: boolean;
  order: number;
}

export interface DAVFormatConfig {
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

export class DAVFormatTemplate {
  private static readonly DAV_CONFIG: DAVFormatConfig = {
    pageSize: 'A4',
    margins: {
      top: 20,
      bottom: 20,
      left: 25,
      right: 25,
    },
    font: {
      family: 'Times New Roman', // Vietnamese with diacritics
      size: 12,
      lineHeight: 1.5,
    },
    sectionOrdering: [
      'Tên thuốc', // Drug Name
      'Chỉ định', // Indications
      'Liều lượng và cách dùng', // Dosage and Administration
      'Chống chỉ định', // Contraindications
      'Cảnh báo', // Warnings
      'Thận trọng', // Precautions
      'Tác dụng không mong muốn', // Adverse Reactions
      'Tương tác thuốc', // Drug Interactions
      'Sử dụng cho phụ nữ có thai và cho con bú', // Pregnancy and Lactation
      'Sử dụng cho trẻ em', // Pediatric Use
      'Sử dụng cho người cao tuổi', // Geriatric Use
      'Quá liều', // Overdose
      'Dược lực học', // Pharmacology
      'Dược động học', // Pharmacokinetics
      'Bảo quản', // Storage
      'Quy cách đóng gói', // Packaging
      'Nhà sản xuất', // Manufacturer
      'Số đăng ký', // Registration Number
    ],
    headerFormat: {
      fontSize: 14,
      bold: true,
      spacing: 5,
    },
  };

  /**
   * Get DAV format configuration
   */
  public static getConfig(): DAVFormatConfig {
    return { ...this.DAV_CONFIG };
  }

  /**
   * Validate PIL sections against DAV requirements
   */
  public static validateSections(sections: Map<string, string>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required sections for DAV submission
    const requiredSections = [
      'Tên thuốc',
      'Chỉ định',
      'Liều lượng và cách dùng',
      'Chống chỉ định',
      'Cảnh báo',
      'Tác dụng không mong muốn',
    ];

    // Check for missing required sections
    for (const required of requiredSections) {
      if (!sections.has(required) || !sections.get(required)?.trim()) {
        errors.push(`Missing required section: ${required}`);
      }
    }

    // Check for recommended sections
    const recommendedSections = [
      'Tương tác thuốc',
      'Sử dụng cho phụ nữ có thai và cho con bú',
      'Dược lực học',
    ];

    for (const recommended of recommendedSections) {
      if (!sections.has(recommended) || !sections.get(recommended)?.trim()) {
        warnings.push(`Missing recommended section: ${recommended}`);
      }
    }

    // Validate Vietnamese diacritics
    for (const [header, content] of sections.entries()) {
      const diacriticsResult = this.validateVietnameseDiacritics(content);
      if (!diacriticsResult.valid) {
        errors.push(`Section "${header}": ${diacriticsResult.errors.join(', ')}`);
      }
      if (diacriticsResult.warnings.length > 0) {
        warnings.push(`Section "${header}": ${diacriticsResult.warnings.join(', ')}`);
      }
    }

    const valid = errors.length === 0;

    logger.info('DAV section validation completed', {
      valid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return { valid, errors, warnings };
  }

  /**
   * Order sections according to DAV requirements
   */
  public static orderSections(sections: Map<string, string>): DAVSection[] {
    const orderedSections: DAVSection[] = [];

    // Add sections in DAV-specified order
    this.DAV_CONFIG.sectionOrdering.forEach((header, index) => {
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
      if (!this.DAV_CONFIG.sectionOrdering.includes(header)) {
        orderedSections.push({
          header,
          content,
          required: false,
          order: orderedSections.length + 1,
        });
        logger.warn('Non-standard section found in DAV PIL', { header });
      }
    }

    return orderedSections;
  }

  /**
   * Check if section is required by DAV
   */
  private static isRequiredSection(header: string): boolean {
    const requiredSections = [
      'Tên thuốc',
      'Chỉ định',
      'Liều lượng và cách dùng',
      'Chống chỉ định',
      'Cảnh báo',
      'Tác dụng không mong muốn',
    ];
    return requiredSections.includes(header);
  }

  /**
   * Validate Vietnamese diacritics
   */
  private static validateVietnameseDiacritics(text: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for valid UTF-8 encoding
    try {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      if (decoded !== text) {
        errors.push('Invalid UTF-8 encoding');
      }
    } catch {
      errors.push('Text encoding error');
    }

    // Vietnamese diacritics Unicode ranges
    const vietnameseDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
    const diacriticMatches = text.match(vietnameseDiacritics);
    const diacriticCount = diacriticMatches ? diacriticMatches.length : 0;

    // Check for sufficient Vietnamese characters
    const totalChars = Array.from(text).length;
    const vietnamesePercentage = (diacriticCount / totalChars) * 100;

    if (vietnamesePercentage < 5) {
      warnings.push(`Low Vietnamese diacritic usage (${vietnamesePercentage.toFixed(1)}%)`);
    }

    // Check for common pharmaceutical terms with correct diacritics
    const criticalTerms = [
      { incorrect: 'lieu luong', correct: 'liều lượng' },
      { incorrect: 'tac dung', correct: 'tác dụng' },
      { incorrect: 'chi dinh', correct: 'chỉ định' },
      { incorrect: 'canh bao', correct: 'cảnh báo' },
    ];

    for (const term of criticalTerms) {
      if (text.toLowerCase().includes(term.incorrect)) {
        warnings.push(`Found "${term.incorrect}", should be "${term.correct}"`);
      }
    }

    // Check for NFC normalization (precomposed form)
    const isNFC = text === text.normalize('NFC');
    if (!isNFC) {
      warnings.push('Text should use NFC (precomposed) normalization');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get DAV cover letter template
   */
  public static getCoverLetterTemplate(data: {
    productName: string;
    registrationNumber: string;
    submissionDate: string;
    applicantName: string;
  }): string {
    return `
Kính gửi: Cục Quản lý Dược Việt Nam

Tiêu đề: Hồ sơ thay đổi tờ hướng dẫn sử dụng thuốc

Kính gửi: Cơ quan cấp phép

Chúng tôi, ${data.applicantName}, xin gửi hồ sơ thay đổi tờ hướng dẫn sử dụng thuốc cho sản phẩm "${data.productName}" (Số đăng ký: ${data.registrationNumber})

Tài liệu đính kèm:
1. Đơn đề nghị thay đổi tờ hướng dẫn sử dụng thuốc
2. Tờ hướng dẫn sử dụng thuốc mới (tiếng Việt)
3. Bảng so sánh thay đổi
4. Tờ hướng dẫn sử dụng thuốc gốc (tiếng Anh)

Nếu có bất kỳ thắc mắc nào, xin vui lòng liên hệ với chúng tôi.

Trân trọng,

Người nộp hồ sơ: ${data.applicantName}
Ngày nộp: ${data.submissionDate}
    `.trim();
  }

  /**
   * Get DAV revision history template
   */
  public static getRevisionHistoryTemplate(revisions: Array<{
    version: string;
    date: string;
    changes: string;
  }>): string {
    let history = 'Lịch sử sửa đổi tờ hướng dẫn sử dụng thuốc\n\n';
    history += 'Phiên bản\tNgày sửa đổi\tNội dung thay đổi\n';
    history += '─'.repeat(60) + '\n';

    for (const revision of revisions) {
      history += `${revision.version}\t${revision.date}\t${revision.changes}\n`;
    }

    return history;
  }
}