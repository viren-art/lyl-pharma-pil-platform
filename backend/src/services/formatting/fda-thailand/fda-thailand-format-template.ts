import { logger } from '../../../utils/logger';

export interface FDAThailandSection {
  header: string;
  content: string;
  required: boolean;
  order: number;
}

export interface FDAThailandFormatConfig {
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

export class FDAThailandFormatTemplate {
  private static readonly FDA_THAILAND_CONFIG: FDAThailandFormatConfig = {
    pageSize: 'A4',
    margins: {
      top: 20,
      bottom: 20,
      left: 25,
      right: 25,
    },
    font: {
      family: 'TH Sarabun New', // Thai script font
      size: 14,
      lineHeight: 1.6,
    },
    sectionOrdering: [
      'ชื่อยา', // Drug Name
      'ข้อบ่งใช้', // Indications
      'ขนาดยาและวิธีใช้', // Dosage and Administration
      'ข้อห้ามใช้', // Contraindications
      'คำเตือน', // Warnings
      'ข้อควรระวัง', // Precautions
      'ผลข้างเคียง', // Adverse Reactions
      'ปฏิกิริยาระหว่างยา', // Drug Interactions
      'การใช้ในสตรีตั้งครรภ์และให้นมบุตร', // Pregnancy and Lactation
      'การใช้ในเด็ก', // Pediatric Use
      'การใช้ในผู้สูงอายุ', // Geriatric Use
      'การใช้ยาเกินขนาด', // Overdose
      'เภสัชวิทยา', // Pharmacology
      'เภสัชจลนศาสตร์', // Pharmacokinetics
      'การเก็บรักษา', // Storage
      'บรรจุภัณฑ์', // Packaging
      'ผู้ผลิต', // Manufacturer
      'เลขทะเบียน', // Registration Number
    ],
    headerFormat: {
      fontSize: 16,
      bold: true,
      spacing: 5,
    },
  };

  /**
   * Get FDA Thailand format configuration
   */
  public static getConfig(): FDAThailandFormatConfig {
    return { ...this.FDA_THAILAND_CONFIG };
  }

  /**
   * Validate PIL sections against FDA Thailand requirements
   */
  public static validateSections(sections: Map<string, string>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required sections for FDA Thailand submission
    const requiredSections = [
      'ชื่อยา',
      'ข้อบ่งใช้',
      'ขนาดยาและวิธีใช้',
      'ข้อห้ามใช้',
      'คำเตือน',
      'ผลข้างเคียง',
    ];

    // Check for missing required sections
    for (const required of requiredSections) {
      if (!sections.has(required) || !sections.get(required)?.trim()) {
        errors.push(`Missing required section: ${required}`);
      }
    }

    // Check for recommended sections
    const recommendedSections = [
      'ปฏิกิริยาระหว่างยา',
      'การใช้ในสตรีตั้งครรภ์และให้นมบุตร',
      'เภสัชวิทยา',
    ];

    for (const recommended of recommendedSections) {
      if (!sections.has(recommended) || !sections.get(recommended)?.trim()) {
        warnings.push(`Missing recommended section: ${recommended}`);
      }
    }

    // Validate Thai script encoding
    for (const [header, content] of sections.entries()) {
      const encodingResult = this.validateThaiEncoding(content);
      if (!encodingResult.valid) {
        errors.push(`Section "${header}": ${encodingResult.errors.join(', ')}`);
      }
    }

    const valid = errors.length === 0;

    logger.info('FDA Thailand section validation completed', {
      valid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return { valid, errors, warnings };
  }

  /**
   * Order sections according to FDA Thailand requirements
   */
  public static orderSections(sections: Map<string, string>): FDAThailandSection[] {
    const orderedSections: FDAThailandSection[] = [];

    // Add sections in FDA Thailand-specified order
    this.FDA_THAILAND_CONFIG.sectionOrdering.forEach((header, index) => {
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
      if (!this.FDA_THAILAND_CONFIG.sectionOrdering.includes(header)) {
        orderedSections.push({
          header,
          content,
          required: false,
          order: orderedSections.length + 1,
        });
        logger.warn('Non-standard section found in FDA Thailand PIL', { header });
      }
    }

    return orderedSections;
  }

  /**
   * Check if section is required by FDA Thailand
   */
  private static isRequiredSection(header: string): boolean {
    const requiredSections = [
      'ชื่อยา',
      'ข้อบ่งใช้',
      'ขนาดยาและวิธีใช้',
      'ข้อห้ามใช้',
      'คำเตือน',
      'ผลข้างเคียง',
    ];
    return requiredSections.includes(header);
  }

  /**
   * Validate Thai script encoding
   */
  private static validateThaiEncoding(text: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

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

    // Thai Unicode ranges: 0x0E00-0x0E7F
    const chars = Array.from(text);
    let thaiCharCount = 0;

    for (const char of chars) {
      const codePoint = char.codePointAt(0);
      if (!codePoint) continue;

      if (codePoint >= 0x0e00 && codePoint <= 0x0e7f) {
        thaiCharCount++;
      }
    }

    // Text should contain at least 10% Thai characters for pharmaceutical content
    const totalChars = chars.length;
    const thaiPercentage = (thaiCharCount / totalChars) * 100;

    if (thaiPercentage < 10) {
      errors.push(`Insufficient Thai characters (${thaiPercentage.toFixed(1)}%)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get FDA Thailand cover letter template
   */
  public static getCoverLetterTemplate(data: {
    productName: string;
    registrationNumber: string;
    submissionDate: string;
    applicantName: string;
  }): string {
    return `
เรียน สำนักงานคณะกรรมการอาหารและยา

เรื่อง: ขอยื่นเอกสารการเปลี่ยนแปลงเอกสารกำกับยา

เรียน: ผู้อนุญาต

ข้าพเจ้า ${data.applicantName} ขอยื่นเอกสารการเปลี่ยนแปลงเอกสารกำกับยาสำหรับผลิตภัณฑ์ "${data.productName}" (เลขทะเบียน: ${data.registrationNumber})

เอกสารประกอบการพิจารณา:
1. แบบคำขอเปลี่ยนแปลงเอกสารกำกับยา
2. เอกสารกำกับยาฉบับใหม่ (ภาษาไทย)
3. ตารางเปรียบเทียบการเปลี่ยนแปลง
4. เอกสารกำกับยาต้นฉบับ (ภาษาอังกฤษ)

หากมีข้อสงสัยประการใด กรุณาติดต่อข้าพเจ้า

ขอแสดงความนับถือ

ผู้ยื่นคำขอ: ${data.applicantName}
วันที่ยื่น: ${data.submissionDate}
    `.trim();
  }

  /**
   * Get FDA Thailand revision history template
   */
  public static getRevisionHistoryTemplate(revisions: Array<{
    version: string;
    date: string;
    changes: string;
  }>): string {
    let history = 'ประวัติการแก้ไขเอกสารกำกับยา\n\n';
    history += 'เวอร์ชัน\tวันที่แก้ไข\tรายละเอียดการแก้ไข\n';
    history += '─'.repeat(60) + '\n';

    for (const revision of revisions) {
      history += `${revision.version}\t${revision.date}\t${revision.changes}\n`;
    }

    return history;
  }
}