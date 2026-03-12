import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Translation } from '../../models/translation.model';
import { PIL } from '../../models/pil.model';
import { LLMClient } from './llm-client';
import { S3Service } from '../storage/s3.service';
import { AuditLogger } from '../audit/audit-logger';
import { logger } from '../../utils/logger';
import pdf from 'pdf-parse';

interface TranslatePILRequest {
  pilId: number;
  targetLanguage: 'zh-TW' | 'th' | 'vi';
  sourceDocumentPath: string;
  userId: number;
}

interface TranslatePILResponse {
  translationId: number;
  pilId: number;
  confidenceScore: number;
  outputPath: string;
  traceabilityLogPath: string;
  status: 'pending_review' | 'approved';
  lowConfidenceSections: string[];
}

export class TranslationService {
  private translationRepository: Repository<Translation>;
  private pilRepository: Repository<PIL>;
  private llmClient: LLMClient;
  private s3Service: S3Service;
  private auditLogger: AuditLogger;

  constructor() {
    this.translationRepository = AppDataSource.getRepository(Translation);
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.llmClient = new LLMClient();
    this.s3Service = new S3Service();
    this.auditLogger = new AuditLogger();
  }

  async translatePIL(request: TranslatePILRequest): Promise<TranslatePILResponse> {
    const startTime = Date.now();

    try {
      // Validate PIL exists
      const pil = await this.pilRepository.findOne({
        where: { id: request.pilId },
      });

      if (!pil) {
        throw new Error(`PIL not found: ${request.pilId}`);
      }

      // Download source document from S3
      const sourceDocument = await this.s3Service.downloadDocument(
        request.sourceDocumentPath
      );

      // Extract text from PDF using pdf-parse library
      const sourceText = await this.extractTextFromPDF(sourceDocument);

      // Perform LLM translation with parallel processing
      const translationResult = await this.llmClient.translatePIL(
        sourceText,
        request.targetLanguage,
        pil.productName
      );

      // Identify low-confidence sections
      const lowConfidenceSections = translationResult.sections
        .filter(section => this.llmClient.isLowConfidence(section.confidenceScore))
        .map(section => section.sectionName);

      // Generate output document
      const outputDocument = this.generateOutputDocument(translationResult);
      const outputPath = await this.s3Service.uploadDocument(
        outputDocument,
        `translations/${request.pilId}/${request.targetLanguage}/output.pdf`
      );

      // Generate traceability log
      const traceabilityLog = this.generateTraceabilityLog(
        translationResult,
        request,
        pil
      );
      const traceabilityLogPath = await this.s3Service.uploadJSON(
        traceabilityLog,
        `translations/${request.pilId}/${request.targetLanguage}/traceability.json`
      );

      // Save translation to database
      const translation = this.translationRepository.create({
        pilId: request.pilId,
        sourceLanguage: 'en',
        targetLanguage: request.targetLanguage,
        llmModel: translationResult.llmModelVersion,
        confidenceScore: translationResult.overallConfidence,
        sourceDocument: request.sourceDocumentPath,
        outputDocument: outputPath,
        traceabilityLog: traceabilityLog,
        translatedBy: 'AI',
        createdAt: new Date(),
      });

      await this.translationRepository.save(translation);

      // Log audit event
      await this.auditLogger.log({
        entityType: 'translation',
        entityId: translation.id,
        action: 'create',
        userId: request.userId,
        metadata: {
          pilId: request.pilId,
          targetLanguage: request.targetLanguage,
          confidenceScore: translationResult.overallConfidence,
          processingTimeMs: translationResult.processingTimeMs,
          lowConfidenceSections,
        },
      });

      const processingTime = Date.now() - startTime;

      logger.info('Translation completed', {
        translationId: translation.id,
        pilId: request.pilId,
        targetLanguage: request.targetLanguage,
        confidenceScore: translationResult.overallConfidence,
        processingTimeMs: processingTime,
        lowConfidenceSectionsCount: lowConfidenceSections.length,
      });

      return {
        translationId: translation.id,
        pilId: request.pilId,
        confidenceScore: translationResult.overallConfidence,
        outputPath,
        traceabilityLogPath,
        status: lowConfidenceSections.length > 0 ? 'pending_review' : 'approved',
        lowConfidenceSections,
      };
    } catch (error) {
      logger.error('Translation failed', {
        pilId: request.pilId,
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdf(pdfBuffer);
      return data.text;
    } catch (error) {
      logger.error('PDF text extraction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to extract text from PDF');
    }
  }

  private generateOutputDocument(translationResult: any): Buffer {
    // In production, generate formatted PDF with translated content
    // For now, return mock PDF buffer
    const content = JSON.stringify(translationResult, null, 2);
    return Buffer.from(content);
  }

  private generateTraceabilityLog(
    translationResult: any,
    request: TranslatePILRequest,
    pil: PIL
  ): any {
    return {
      translationMetadata: {
        pilId: request.pilId,
        productName: pil.productName,
        sourceLanguage: 'en',
        targetLanguage: request.targetLanguage,
        llmModelVersion: translationResult.llmModelVersion,
        processingTimeMs: translationResult.processingTimeMs,
        timestamp: new Date().toISOString(),
      },
      sections: translationResult.sections.map((section: any) => ({
        sectionName: section.sectionName,
        sourceText: section.sourceText,
        translatedText: section.translatedText,
        confidenceScore: section.confidenceScore,
        sourceReferences: section.sourceReferences,
        requiresHumanReview: this.llmClient.isLowConfidence(section.confidenceScore),
      })),
      overallConfidence: translationResult.overallConfidence,
      qualityMetrics: {
        sectionsTranslated: translationResult.sections.length,
        lowConfidenceSections: translationResult.sections.filter((s: any) =>
          this.llmClient.isLowConfidence(s.confidenceScore)
        ).length,
        averageConfidence: translationResult.overallConfidence,
      },
    };
  }

  async getTranslationTraceability(translationId: number): Promise<any> {
    const translation = await this.translationRepository.findOne({
      where: { id: translationId },
    });

    if (!translation) {
      throw new Error(`Translation not found: ${translationId}`);
    }

    return translation.traceabilityLog;
  }
}