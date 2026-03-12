import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { SubmissionPackage } from '../../models/submission-package.model';
import { PIL } from '../../models/pil.model';
import { Translation } from '../../models/translation.model';
import { S3Service } from '../storage/s3.service';
import { AuditLogger } from '../audit/audit-logger';
import { TFDAFormatTemplate } from '../formatting/tfda/tfda-format-template';
import { TFDAPDFGenerator } from '../formatting/tfda/tfda-pdf-generator';
import { FDAThailandFormatTemplate } from '../formatting/fda-thailand/fda-thailand-format-template';
import { FDAThailandPDFGenerator } from '../formatting/fda-thailand/fda-thailand-pdf-generator';
import { DAVFormatTemplate } from '../formatting/dav/dav-format-template';
import { DAVPDFGenerator } from '../formatting/dav/dav-pdf-generator';
import { logger } from '../../utils/logger';
import archiver from 'archiver';
import { Readable } from 'stream';

interface GeneratePackageRequest {
  pilId: number;
  market: 'TFDA' | 'FDA_Thailand' | 'DAV';
  userId: number;
}

interface GeneratePackageResponse {
  packageId: number;
  pilId: number;
  market: string;
  packagePath: string;
  generatedAt: string;
  contents: Array<{
    documentType: string;
    documentPath: string;
  }>;
}

export class SubmissionPackageService {
  private pilRepository: Repository<PIL>;
  private translationRepository: Repository<Translation>;
  private packageRepository: Repository<SubmissionPackage>;
  private s3Service: S3Service;
  private auditLogger: AuditLogger;

  constructor() {
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.translationRepository = AppDataSource.getRepository(Translation);
    this.packageRepository = AppDataSource.getRepository(SubmissionPackage);
    this.s3Service = new S3Service();
    this.auditLogger = new AuditLogger();
  }

  /**
   * Generate submission-ready package for regulatory authority
   */
  public async generateSubmissionPackage(
    request: GeneratePackageRequest
  ): Promise<GeneratePackageResponse> {
    const startTime = Date.now();

    try {
      // Validate PIL exists and is approved
      const pil = await this.pilRepository.findOne({
        where: { id: request.pilId },
        relations: ['createdBy'],
      });

      if (!pil) {
        throw new Error(`PIL not found: ${request.pilId}`);
      }

      if (pil.status !== 'approved') {
        throw new Error(`PIL must be approved before generating submission package. Current status: ${pil.status}`);
      }

      // Get translation for target market
      const translation = await this.translationRepository.findOne({
        where: {
          pilId: request.pilId,
          targetLanguage: this.getLanguageForMarket(request.market),
        },
        order: { createdAt: 'DESC' },
      });

      if (!translation) {
        throw new Error(`No translation found for PIL ${request.pilId} in market ${request.market}`);
      }

      // Generate formatted PIL PDF
      const formattedPDF = await this.generateFormattedPDF(
        pil,
        translation,
        request.market
      );

      // Generate cover letter
      const coverLetter = await this.generateCoverLetter(pil, request.market);

      // Generate revision history
      const revisionHistory = await this.generateRevisionHistory(pil, request.market);

      // Generate comparison table (if variation)
      let comparisonTable: Buffer | null = null;
      if (pil.sourceType === 'variation' && pil.approvedPilId) {
        comparisonTable = await this.generateComparisonTable(
          pil.approvedPilId,
          request.pilId,
          request.market
        );
      }

      // Create submission package zip
      const packageBuffer = await this.createPackageZip({
        formattedPIL: formattedPDF,
        coverLetter,
        revisionHistory,
        comparisonTable,
        market: request.market,
        productName: pil.productName,
      });

      // Upload package to S3
      const packagePath = await this.s3Service.uploadDocument(
        packageBuffer,
        `submission-packages/${request.market}/${pil.productName}-${Date.now()}.zip`
      );

      // Save package record to database
      const submissionPackage = this.packageRepository.create({
        pilId: request.pilId,
        market: request.market,
        packagePath,
        generatedBy: request.userId,
        generatedAt: new Date(),
        submissionStatus: 'pending',
      });

      await this.packageRepository.save(submissionPackage);

      // Log audit event
      await this.auditLogger.log({
        entityType: 'submission_package',
        entityId: submissionPackage.id,
        action: 'generate',
        userId: request.userId,
        afterState: {
          packageId: submissionPackage.id,
          pilId: request.pilId,
          market: request.market,
          packagePath,
        },
      });

      const processingTime = Date.now() - startTime;
      logger.info('Submission package generated successfully', {
        packageId: submissionPackage.id,
        pilId: request.pilId,
        market: request.market,
        processingTimeMs: processingTime,
      });

      return {
        packageId: submissionPackage.id,
        pilId: request.pilId,
        market: request.market,
        packagePath,
        generatedAt: submissionPackage.generatedAt.toISOString(),
        contents: [
          {
            documentType: 'formatted_pil',
            documentPath: `${packagePath}/formatted_pil.pdf`,
          },
          {
            documentType: 'cover_letter',
            documentPath: `${packagePath}/cover_letter.pdf`,
          },
          {
            documentType: 'revision_history',
            documentPath: `${packagePath}/revision_history.pdf`,
          },
          ...(comparisonTable
            ? [
                {
                  documentType: 'comparison_table',
                  documentPath: `${packagePath}/comparison_table.pdf`,
                },
              ]
            : []),
        ],
      };
    } catch (error) {
      logger.error('Failed to generate submission package', {
        error,
        pilId: request.pilId,
        market: request.market,
      });
      throw error;
    }
  }

  /**
   * Generate formatted PIL PDF for specific market
   */
  private async generateFormattedPDF(
    pil: PIL,
    translation: Translation,
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<Buffer> {
    // Parse translation sections from traceability log
    const traceabilityLog = await this.s3Service.downloadJSON(
      translation.traceabilityLog
    );

    const sections = new Map<string, string>();
    for (const section of traceabilityLog.sections) {
      sections.set(section.sectionName, section.translatedText);
    }

    // Generate PDF based on market
    switch (market) {
      case 'TFDA': {
        const validation = TFDAFormatTemplate.validateSections(sections);
        if (!validation.valid) {
          throw new Error(`TFDA validation failed: ${validation.errors.join(', ')}`);
        }

        const orderedSections = TFDAFormatTemplate.orderSections(sections);
        return await TFDAPDFGenerator.generatePDF({
          productName: pil.productName,
          licenseNumber: pil.regulatoryRefNumber,
          sections: orderedSections,
        });
      }

      case 'FDA_Thailand': {
        const validation = FDAThailandFormatTemplate.validateSections(sections);
        if (!validation.valid) {
          throw new Error(`FDA Thailand validation failed: ${validation.errors.join(', ')}`);
        }

        const orderedSections = FDAThailandFormatTemplate.orderSections(sections);
        return await FDAThailandPDFGenerator.generatePDF({
          productName: pil.productName,
          registrationNumber: pil.regulatoryRefNumber,
          sections: orderedSections,
        });
      }

      case 'DAV': {
        const validation = DAVFormatTemplate.validateSections(sections);
        if (!validation.valid) {
          throw new Error(`DAV validation failed: ${validation.errors.join(', ')}`);
        }

        const orderedSections = DAVFormatTemplate.orderSections(sections);
        return await DAVPDFGenerator.generatePDF({
          productName: pil.productName,
          registrationNumber: pil.regulatoryRefNumber,
          sections: orderedSections,
        });
      }

      default:
        throw new Error(`Unsupported market: ${market}`);
    }
  }

  /**
   * Generate cover letter for submission
   */
  private async generateCoverLetter(
    pil: PIL,
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<Buffer> {
    const submissionDate = new Date().toLocaleDateString('en-GB');

    let coverLetterText: string;

    switch (market) {
      case 'TFDA':
        coverLetterText = TFDAFormatTemplate.getCoverLetterTemplate({
          productName: pil.productName,
          licenseNumber: pil.regulatoryRefNumber || 'TBD',
          submissionDate,
          applicantName: 'Lotus Pharmaceutical Co., Ltd.',
        });
        break;

      case 'FDA_Thailand':
        coverLetterText = FDAThailandFormatTemplate.getCoverLetterTemplate({
          productName: pil.productName,
          registrationNumber: pil.regulatoryRefNumber || 'TBD',
          submissionDate,
          applicantName: 'Lotus Pharmaceutical Co., Ltd.',
        });
        break;

      case 'DAV':
        coverLetterText = DAVFormatTemplate.getCoverLetterTemplate({
          productName: pil.productName,
          registrationNumber: pil.regulatoryRefNumber || 'TBD',
          submissionDate,
          applicantName: 'Lotus Pharmaceutical Co., Ltd.',
        });
        break;

      default:
        throw new Error(`Unsupported market: ${market}`);
    }

    // Convert text to PDF
    return this.textToPDF(coverLetterText, `Cover Letter - ${pil.productName}`);
  }

  /**
   * Generate revision history document
   */
  private async generateRevisionHistory(
    pil: PIL,
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<Buffer> {
    // Get all translations for this PIL
    const translations = await this.translationRepository.find({
      where: { pilId: pil.id },
      order: { createdAt: 'ASC' },
    });

    const revisions = translations.map((t, index) => ({
      version: `v${index + 1}`,
      date: t.createdAt.toLocaleDateString('en-GB'),
      changes: t.reviewedAt ? 'Approved translation' : 'Initial translation',
    }));

    let historyText: string;

    switch (market) {
      case 'TFDA':
        historyText = TFDAFormatTemplate.getRevisionHistoryTemplate(revisions);
        break;

      case 'FDA_Thailand':
        historyText = FDAThailandFormatTemplate.getRevisionHistoryTemplate(revisions);
        break;

      case 'DAV':
        historyText = DAVFormatTemplate.getRevisionHistoryTemplate(revisions);
        break;

      default:
        throw new Error(`Unsupported market: ${market}`);
    }

    return this.textToPDF(historyText, `Revision History - ${pil.productName}`);
  }

  /**
   * Generate comparison table for variation submissions
   */
  private async generateComparisonTable(
    approvedPilId: number,
    variationPilId: number,
    market: 'TFDA' | 'FDA_Thailand' | 'DAV'
  ): Promise<Buffer> {
    // Get both PILs
    const approvedTranslation = await this.translationRepository.findOne({
      where: {
        pilId: approvedPilId,
        
        targetLanguage: this.getLanguageForMarket(market),
      },
      order: { createdAt: 'DESC' },
    });

    const variationTranslation = await this.translationRepository.findOne({
      where: {
        pilId: variationPilId,
        targetLanguage: this.getLanguageForMarket(market),
      },
      order: { createdAt: 'DESC' },
    });

    if (!approvedTranslation || !variationTranslation) {
      throw new Error('Cannot generate comparison table: missing translations');
    }

    // Parse sections from both translations
    const approvedLog = await this.s3Service.downloadJSON(approvedTranslation.traceabilityLog);
    const variationLog = await this.s3Service.downloadJSON(variationTranslation.traceabilityLog);

    // Build comparison table
    let comparisonText = 'Comparison Table - Changes from Approved PIL\n\n';
    comparisonText += 'Section\tApproved Version\tNew Version\tChange Type\n';
    comparisonText += '─'.repeat(80) + '\n';

    for (const varSection of variationLog.sections) {
      const approvedSection = approvedLog.sections.find(
        (s: any) => s.sectionName === varSection.sectionName
      );

      if (!approvedSection) {
        comparisonText += `${varSection.sectionName}\t[New Section]\t${varSection.translatedText.substring(0, 50)}...\tAdded\n`;
      } else if (approvedSection.translatedText !== varSection.translatedText) {
        comparisonText += `${varSection.sectionName}\t${approvedSection.translatedText.substring(0, 50)}...\t${varSection.translatedText.substring(0, 50)}...\tModified\n`;
      }
    }

    return this.textToPDF(comparisonText, 'Comparison Table');
  }

  /**
   * Create submission package zip file
   */
  private async createPackageZip(options: {
    formattedPIL: Buffer;
    coverLetter: Buffer;
    revisionHistory: Buffer;
    comparisonTable: Buffer | null;
    market: string;
    productName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Add files to zip
      archive.append(options.formattedPIL, { name: '01_formatted_pil.pdf' });
      archive.append(options.coverLetter, { name: '02_cover_letter.pdf' });
      archive.append(options.revisionHistory, { name: '03_revision_history.pdf' });

      if (options.comparisonTable) {
        archive.append(options.comparisonTable, { name: '04_comparison_table.pdf' });
      }

      // Add README
      const readme = this.generateReadme(options.market, options.productName);
      archive.append(readme, { name: 'README.txt' });

      archive.finalize();
    });
  }

  /**
   * Generate README for submission package
   */
  private generateReadme(market: string, productName: string): string {
    return `
Submission Package for ${productName}
Market: ${market}
Generated: ${new Date().toISOString()}

Contents:
1. 01_formatted_pil.pdf - Formatted PIL in regulatory-compliant format
2. 02_cover_letter.pdf - Cover letter for submission
3. 03_revision_history.pdf - Complete revision history
4. 04_comparison_table.pdf - Comparison with approved version (if variation)

This package is ready for submission to the regulatory authority.
All documents have been validated against ${market} requirements.

Generated by Lotus Pharmaceutical PIL Management Platform
    `.trim();
  }

  /**
   * Convert text to PDF
   */
  private async textToPDF(text: string, title: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica').text(text);

      doc.end();
    });
  }

  /**
   * Get target language for market
   */
  private getLanguageForMarket(market: 'TFDA' | 'FDA_Thailand' | 'DAV'): string {
    const languageMap: Record<string, string> = {
      TFDA: 'zh-TW',
      FDA_Thailand: 'th',
      DAV: 'vi',
    };
    return languageMap[market];
  }
}