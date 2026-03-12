import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { TFDAFormatTemplate, TFDASection } from './tfda-format-template';
import { logger } from '../../../utils/logger';

export interface TFDAPDFOptions {
  productName: string;
  licenseNumber?: string;
  manufacturer?: string;
  sections: TFDASection[];
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export class TFDAPDFGenerator {
  /**
   * Generate TFDA-compliant PDF from PIL sections
   */
  public static async generatePDF(options: TFDAPDFOptions): Promise<Buffer> {
    const startTime = Date.now();

    try {
      const config = TFDAFormatTemplate.getConfig();

      // Create PDF document with TFDA specifications
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: config.margins.top,
          bottom: config.margins.bottom,
          left: config.margins.left,
          right: config.margins.right,
        },
        info: {
          Title: `${options.productName} - 藥品仿單`,
          Author: options.metadata?.author || 'Lotus Pharmaceutical',
          Subject: options.metadata?.subject || 'TFDA PIL Submission',
          Keywords: options.metadata?.keywords?.join(', ') || 'PIL, TFDA, Pharmaceutical',
          CreationDate: new Date(),
        },
      });

      // Register Traditional Chinese font (標楷體)
      // Note: In production, use actual font file path
      // doc.registerFont('Kai', '/path/to/kaiu.ttf');
      doc.font('Helvetica'); // Fallback for development

      // Add header with product name
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(options.productName, { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(12)
        .font('Helvetica')
        .text('藥品仿單', { align: 'center' })
        .moveDown(1);

      // Add license number if provided
      if (options.licenseNumber) {
        doc.fontSize(10)
          .text(`許可證字號：${options.licenseNumber}`, { align: 'center' })
          .moveDown(1.5);
      }

      // Add sections in TFDA order
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
        doc.fontSize(9)
          .text(
            `第 ${i + 1} 頁，共 ${pageCount} 頁`,
            config.margins.left,
            doc.page.height - config.margins.bottom + 10,
            { align: 'center' }
          );
      }

      // Finalize PDF
      const buffer = await this.streamToBuffer(doc);
      doc.end();

      const processingTime = Date.now() - startTime;
      logger.info('TFDA PDF generated successfully', {
        productName: options.productName,
        pageCount,
        sectionCount: options.sections.length,
        processingTimeMs: processingTime,
      });

      return buffer;
    } catch (error) {
      logger.error('Failed to generate TFDA PDF', { error, options });
      throw new Error(`TFDA PDF generation failed: ${error.message}`);
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
   * Validate generated PDF meets TFDA requirements
   */
  public static async validatePDF(pdfBuffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check PDF size (TFDA typically requires < 10MB)
    const sizeInMB = pdfBuffer.length / (1024 * 1024);
    if (sizeInMB > 10) {
      errors.push(`PDF size (${sizeInMB.toFixed(2)}MB) exceeds TFDA limit of 10MB`);
    }

    // Check PDF is valid
    const pdfHeader = pdfBuffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith('%PDF-')) {
      errors.push('Invalid PDF format');
    }

    const valid = errors.length === 0;

    logger.info('TFDA PDF validation completed', {
      valid,
      sizeInMB: sizeInMB.toFixed(2),
      errorCount: errors.length,
    });

    return { valid, errors };
  }
}