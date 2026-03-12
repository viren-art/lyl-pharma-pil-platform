import PDFDocument from 'pdfkit';
import { DAVFormatTemplate, DAVSection } from './dav-format-template';
import { logger } from '../../../utils/logger';

export interface DAVPDFOptions {
  productName: string;
  registrationNumber?: string;
  manufacturer?: string;
  sections: DAVSection[];
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export class DAVPDFGenerator {
  /**
   * Generate DAV-compliant PDF from PIL sections
   */
  public static async generatePDF(options: DAVPDFOptions): Promise<Buffer> {
    const startTime = Date.now();

    try {
      const config = DAVFormatTemplate.getConfig();

      // Create PDF document with DAV specifications
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: config.margins.top,
          bottom: config.margins.bottom,
          left: config.margins.left,
          right: config.margins.right,
        },
        info: {
          Title: `${options.productName} - Tờ hướng dẫn sử dụng thuốc`,
          Author: options.metadata?.author || 'Lotus Pharmaceutical',
          Subject: options.metadata?.subject || 'DAV PIL Submission',
          Keywords: options.metadata?.keywords?.join(', ') || 'PIL, DAV, Pharmaceutical',
          CreationDate: new Date(),
        },
      });

      // Use Times New Roman for Vietnamese diacritics
      doc.font('Times-Roman');

      // Add header with product name
      doc.fontSize(16)
        .font('Times-Bold')
        .text(options.productName, { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(12)
        .font('Times-Roman')
        .text('Tờ hướng dẫn sử dụng thuốc', { align: 'center' })
        .moveDown(1);

      // Add registration number if provided
      if (options.registrationNumber) {
        doc.fontSize(10)
          .text(`Số đăng ký: ${options.registrationNumber}`, { align: 'center' })
          .moveDown(1.5);
      }

      // Add sections in DAV order
      for (const section of options.sections) {
        // Check if we need a new page
        if (doc.y > doc.page.height - config.margins.bottom - 100) {
          doc.addPage();
        }

        // Section header
        doc.fontSize(config.headerFormat.fontSize)
          .font('Times-Bold')
          .text(section.header, {
            underline: true,
          })
          .moveDown(0.3);

        // Section content
        doc.fontSize(config.font.size)
          .font('Times-Roman')
          .text(section.content, {
            align: 'justify',
            lineGap: config.font.lineHeight,
          })
          .moveDown(1);
      }

      // Add footer with page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(9)
          .text(
            `Trang ${i + 1} / ${pageCount}`,
            config.margins.left,
            doc.page.height - config.margins.bottom + 10,
            { align: 'center' }
          );
      }

      // Finalize PDF
      const buffer = await this.streamToBuffer(doc);
      doc.end();

      const processingTime = Date.now() - startTime;
      logger.info('DAV PDF generated successfully', {
        productName: options.productName,
        pageCount,
        sectionCount: options.sections.length,
        processingTimeMs: processingTime,
      });

      return buffer;
    } catch (error) {
      logger.error('Failed to generate DAV PDF', { error, options });
      throw new Error(`DAV PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF stream to buffer
   */
  private static streamToBuffer(doc: PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Validate generated PDF meets DAV requirements
   */
  public static async validatePDF(pdfBuffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check PDF size (DAV typically requires < 12MB)
    const sizeInMB = pdfBuffer.length / (1024 * 1024);
    if (sizeInMB > 12) {
      errors.push(`PDF size (${sizeInMB.toFixed(2)}MB) exceeds DAV limit of 12MB`);
    }

    // Check PDF is valid
    const pdfHeader = pdfBuffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith('%PDF-')) {
      errors.push('Invalid PDF format');
    }

    const valid = errors.length === 0;

    logger.info('DAV PDF validation completed', {
      valid,
      sizeInMB: sizeInMB.toFixed(2),
      errorCount: errors.length,
    });

    return { valid, errors };
  }
}