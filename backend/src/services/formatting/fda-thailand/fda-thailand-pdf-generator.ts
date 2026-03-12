import PDFDocument from 'pdfkit';
import { FDAThailandFormatTemplate, FDAThailandSection } from './fda-thailand-format-template';
import { logger } from '../../../utils/logger';

export interface FDAThailandPDFOptions {
  productName: string;
  registrationNumber?: string;
  manufacturer?: string;
  sections: FDAThailandSection[];
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export class FDAThailandPDFGenerator {
  /**
   * Generate FDA Thailand-compliant PDF from PIL sections
   */
  public static async generatePDF(options: FDAThailandPDFOptions): Promise<Buffer> {
    const startTime = Date.now();

    try {
      const config = FDAThailandFormatTemplate.getConfig();

      // Create PDF document with FDA Thailand specifications
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: config.margins.top,
          bottom: config.margins.bottom,
          left: config.margins.left,
          right: config.margins.right,
        },
        info: {
          Title: `${options.productName} - เอกสารกำกับยา`,
          Author: options.metadata?.author || 'Lotus Pharmaceutical',
          Subject: options.metadata?.subject || 'FDA Thailand PIL Submission',
          Keywords: options.metadata?.keywords?.join(', ') || 'PIL, FDA Thailand, Pharmaceutical',
          CreationDate: new Date(),
        },
      });

      // Register Thai font (TH Sarabun New)
      // Note: In production, use actual font file path
      // doc.registerFont('THSarabun', '/path/to/THSarabunNew.ttf');
      doc.font('Helvetica'); // Fallback for development

      // Add header with product name
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(options.productName, { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(14)
        .font('Helvetica')
        .text('เอกสารกำกับยา', { align: 'center' })
        .moveDown(1);

      // Add registration number if provided
      if (options.registrationNumber) {
        doc.fontSize(11)
          .text(`เลขทะเบียน: ${options.registrationNumber}`, { align: 'center' })
          .moveDown(1.5);
      }

      // Add sections in FDA Thailand order
      for (const section of options.sections) {
        // Check if we need a new page
        if (doc.y > doc.page.height - config.margins.bottom - 100) {
          doc.addPage();
        }

        // Section header
        doc.fontSize(config.headerFormat.fontSize)
          .font('Helvetica-Bold')
          .text(section.header, {
            underline: true,
          })
          .moveDown(0.3);

        // Section content
        doc.fontSize(config.font.size)
          .font('Helvetica')
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
        doc.fontSize(10)
          .text(
            `หน้า ${i + 1} จาก ${pageCount}`,
            config.margins.left,
            doc.page.height - config.margins.bottom + 10,
            { align: 'center' }
          );
      }

      // Finalize PDF
      const buffer = await this.streamToBuffer(doc);
      doc.end();

      const processingTime = Date.now() - startTime;
      logger.info('FDA Thailand PDF generated successfully', {
        productName: options.productName,
        pageCount,
        sectionCount: options.sections.length,
        processingTimeMs: processingTime,
      });

      return buffer;
    } catch (error) {
      logger.error('Failed to generate FDA Thailand PDF', { error, options });
      throw new Error(`FDA Thailand PDF generation failed: ${error.message}`);
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
   * Validate generated PDF meets FDA Thailand requirements
   */
  public static async validatePDF(pdfBuffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check PDF size (FDA Thailand typically requires < 15MB)
    const sizeInMB = pdfBuffer.length / (1024 * 1024);
    if (sizeInMB > 15) {
      errors.push(`PDF size (${sizeInMB.toFixed(2)}MB) exceeds FDA Thailand limit of 15MB`);
    }

    // Check PDF is valid
    const pdfHeader = pdfBuffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith('%PDF-')) {
      errors.push('Invalid PDF format');
    }

    const valid = errors.length === 0;

    logger.info('FDA Thailand PDF validation completed', {
      valid,
      sizeInMB: sizeInMB.toFixed(2),
      errorCount: errors.length,
    });

    return { valid, errors };
  }
}