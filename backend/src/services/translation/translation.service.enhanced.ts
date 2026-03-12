import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Translation } from '../../models/translation.model';
import { PIL } from '../../models/pil.model';
import { LLMClient } from './llm-client';
import { S3Service } from '../storage/s3.service';
import { AuditLogger } from '../audit/audit-logger';
import { TraceabilityService } from '../traceability/traceability.service';
import { SourceParserService } from '../traceability/source-parser.service';
import { logger } from '../../utils/logger';

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
  nextApprovalGate?: {
    gateId: number;
    requiredRole: string;
    assignedTo: string;
  };
}

export class EnhancedTranslationService {
  private translationRepository: Repository<Translation>;
  private pilRepository: Repository<PIL>;
  private llmClient: LLMClient;
  private s3Service: S3Service;
  private auditLogger: AuditLogger;
  private traceabilityService: TraceabilityService;
  private sourceParser: SourceParserService;

  constructor() {
    this.translationRepository = AppDataSource.getRepository(Translation);
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.llmClient = new LLMClient();
    this.s3Service = new S3Service();
    this.auditLogger = new AuditLogger();
    this.traceabilityService = new TraceabilityService();
    this.sourceParser = new SourceParserService();
  }

  async translatePIL(request: TranslatePILRequest): Promise<TranslatePILResponse> {
    const startTime = Date.now();

    try {
      // Validate PIL exists
      const pil = await this.pilRepository.findOne({
        where: { id: request.pilId },
      });

      if (!pil) {
        throw new Error(`PIL ${request.pilId} not found`);
      }

      // Download and parse source document
      const sourceDocument = await this.s3Service.downloadDocument(request.sourceDocumentPath);
      const parsedSource = await this.sourceParser.parseSourceDocument(sourceDocument);

      // Extract text from PDF
      const sourceText = parsedSource.fullText;

      // Perform LLM translation
      const translationResult = await this.llmClient.translatePIL(
        sourceText,
        request.targetLanguage
      );

      // Identify low-confidence sections
      const lowConfidenceSections = translationResult.sections
        .filter((s) => s.confidence < 85)
        .map((s) => s.section);

      // Generate output document
      const outputDocument = this.generateOutputDocument(translationResult);
      const outputPath = await this.s3Service.uploadDocument(
        `translations/${request.pilId}/${Date.now()}.pdf`,
        outputDocument
      );

      // Save translation to database
      const translation = this.translationRepository.create({
        pilId: request.pilId,
        sourceLanguage: 'en',
        targetLanguage: request.targetLanguage,
        llmModel: 'gpt-4',
        confidenceScore: translationResult.overallConfidence,
        sourceDocument: request.sourceDocumentPath,
        outputDocument: outputPath,
        traceabilityLog: '', // Will be updated after traceability creation
        translatedBy: 'AI',
        createdAt: new Date(),
      });

      const savedTranslation = await this.translationRepository.save(translation);

      // Create traceability links with source references
      const traceabilitySections = translationResult.sections.map((section) => {
        const sourceRefs = this.sourceParser.findSourceReferences(
          parsedSource,
          section.translatedText,
          3
        );

        return {
          sectionName: section.section,
          translatedText: section.translatedText,
          targetStartIndex: 0, // Would be calculated from full document
          targetEndIndex: section.translatedText.length,
          sourceReferences: sourceRefs.map((ref) => ({
            documentPath: request.sourceDocumentPath,
            pageNumber: ref.pageNumber,
            paragraphNumber: ref.paragraphNumber,
            sourceText: ref.sourceText,
            startIndex: ref.startIndex,
            endIndex: ref.endIndex,
          })),
          confidenceScore: section.confidence,
        };
      });

      await this.traceabilityService.createTraceabilityLinks({
        translationId: savedTranslation.id,
        sections: traceabilitySections,
        sourceDocumentPath: request.sourceDocumentPath,
      });

      // Export traceability log
      const traceabilityLogPath = await this.traceabilityService.exportTraceabilityLog(
        savedTranslation.id
      );

      // Update translation with traceability log path
      savedTranslation.traceabilityLog = traceabilityLogPath;
      await this.translationRepository.save(savedTranslation);

      // Log audit event
      await this.auditLogger.log({
        entityType: 'translation',
        entityId: savedTranslation.id,
        action: 'create',
        userId: request.userId,
        afterState: {
          translationId: savedTranslation.id,
          pilId: request.pilId,
          targetLanguage: request.targetLanguage,
          confidenceScore: translationResult.overallConfidence,
          lowConfidenceSections,
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          llmModel: 'gpt-4',
        },
      });

      const processingTime = Date.now() - startTime;
      logger.info({
        message: 'PIL translation completed with traceability',
        translationId: savedTranslation.id,
        pilId: request.pilId,
        processingTimeMs: processingTime,
        confidenceScore: translationResult.overallConfidence,
      });

      return {
        translationId: savedTranslation.id,
        pilId: request.pilId,
        confidenceScore: translationResult.overallConfidence,
        outputPath,
        traceabilityLogPath,
        status: lowConfidenceSections.length > 0 ? 'pending_review' : 'approved',
        nextApprovalGate:
          lowConfidenceSections.length > 0
            ? {
                gateId: 1,
                requiredRole: 'Regulatory_Reviewer',
                assignedTo: 'regulatory@lotus.com',
              }
            : undefined,
      };
    } catch (error) {
      logger.error({
        message: 'PIL translation failed',
        pilId: request.pilId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private generateOutputDocument(translationResult: any): Buffer {
    // Simplified PDF generation - in production would use proper PDF library
    const content = translationResult.sections
      .map((s: any) => `${s.section}\n\n${s.translatedText}\n\n`)
      .join('');
    return Buffer.from(content, 'utf-8');
  }
}