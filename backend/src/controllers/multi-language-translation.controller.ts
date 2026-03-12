import { Request, Response } from 'express';
import { ThaiTranslationService } from '../services/translation/thai/thai-translation.service';
import { VietnameseTranslationService } from '../services/translation/vietnamese/vietnamese-translation.service';
import { TranslationService } from '../services/translation/translation.service';
import { logger } from '../utils/logger';

export class MultiLanguageTranslationController {
  private thaiService: ThaiTranslationService;
  private vietnameseService: VietnameseTranslationService;
  private translationService: TranslationService;

  constructor() {
    this.thaiService = new ThaiTranslationService();
    this.vietnameseService = new VietnameseTranslationService();
    this.translationService = new TranslationService();
  }

  /**
   * POST /api/v1/pils/:id/translate/thai
   * Translate PIL to Thai with FDA Thailand validation
   */
  async translateToThai(req: Request, res: Response): Promise<void> {
    try {
      const pilId = parseInt(req.params.id);
      const { sourceDocumentPath } = req.body;
      const userId = (req as any).user?.id;

      logger.info('Thai translation request received', { pilId, userId });

      // Get source text from PIL
      const sourceText = await this.translationService.extractTextFromPDF(
        await this.translationService['s3Service'].downloadDocument(sourceDocumentPath)
      );

      // Perform Thai translation with validation
      const result = await this.thaiService.translateToThai(sourceText, pilId);

      // Save translation to database
      const translation = await this.translationService.translatePIL({
        pilId,
        targetLanguage: 'th',
        sourceDocumentPath
      });

      res.status(200).json({
        translationId: translation.id,
        pilId,
        targetLanguage: 'th',
        market: 'FDA_Thailand',
        confidenceScore: result.overallConfidence,
        encodingValid: result.encodingValid,
        terminologyValid: result.terminologyValid,
        sections: result.sections.map(s => ({
          sectionName: s.sectionName,
          confidenceScore: s.confidenceScore,
          encodingValid: s.encodingValid,
          terminologyValid: s.terminologyValid,
          warnings: s.warnings
        })),
        processingTimeMs: result.processingTimeMs,
        outputPath: translation.outputPath,
        traceabilityLogPath: translation.traceabilityLogPath,
        status: result.overallConfidence >= 85 ? 'approved' : 'pending_review'
      });
    } catch (error) {
      logger.error('Thai translation failed', { error });
      res.status(500).json({
        error: {
          code: 'THAI_TRANSLATION_FAILED',
          message: 'Failed to translate PIL to Thai',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * POST /api/v1/pils/:id/translate/vietnamese
   * Translate PIL to Vietnamese with DAV validation
   */
  async translateToVietnamese(req: Request, res: Response): Promise<void> {
    try {
      const pilId = parseInt(req.params.id);
      const { sourceDocumentPath } = req.body;
      const userId = (req as any).user?.id;

      logger.info('Vietnamese translation request received', { pilId, userId });

      // Get source text from PIL
      const sourceText = await this.translationService.extractTextFromPDF(
        await this.translationService['s3Service'].downloadDocument(sourceDocumentPath)
      );

      // Perform Vietnamese translation with validation
      const result = await this.vietnameseService.translateToVietnamese(sourceText, pilId);

      // Save translation to database
      const translation = await this.translationService.translatePIL({
        pilId,
        targetLanguage: 'vi',
        sourceDocumentPath
      });

      res.status(200).json({
        translationId: translation.id,
        pilId,
        targetLanguage: 'vi',
        market: 'DAV',
        confidenceScore: result.overallConfidence,
        encodingValid: result.encodingValid,
        diacriticsValid: result.diacriticsValid,
        terminologyValid: result.terminologyValid,
        sections: result.sections.map(s => ({
          sectionName: s.sectionName,
          confidenceScore: s.confidenceScore,
          encodingValid: s.encodingValid,
          diacriticsValid: s.diacriticsValid,
          terminologyValid: s.terminologyValid,
          warnings: s.warnings
        })),
        processingTimeMs: result.processingTimeMs,
        outputPath: translation.outputPath,
        traceabilityLogPath: translation.traceabilityLogPath,
        status: result.overallConfidence >= 85 ? 'approved' : 'pending_review'
      });
    } catch (error) {
      logger.error('Vietnamese translation failed', { error });
      res.status(500).json({
        error: {
          code: 'VIETNAMESE_TRANSLATION_FAILED',
          message: 'Failed to translate PIL to Vietnamese',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * GET /api/v1/translations/:id/validation
   * Get detailed validation results for multi-language translation
   */
  async getValidationResults(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.id);

      logger.info('Validation results request received', { translationId });

      const translation = await this.translationService.getTranslationTraceability(translationId);

      res.status(200).json({
        translationId,
        validation: {
          encoding: translation.encodingValid || true,
          terminology: translation.terminologyValid || true,
          confidence: translation.confidenceScore,
          warnings: translation.warnings || []
        }
      });
    } catch (error) {
      logger.error('Failed to get validation results', { error });
      res.status(500).json({
        error: {
          code: 'VALIDATION_RESULTS_FAILED',
          message: 'Failed to retrieve validation results',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}