import { Request, Response } from 'express';
import { QualityValidatorService } from '../services/validation/quality/quality-validator.service';
import { TranslationService } from '../services/translation/translation.service';
import { logger } from '../utils/logger';

export class QualityValidationController {
  private qualityValidator: QualityValidatorService;
  private translationService: TranslationService;

  constructor() {
    this.qualityValidator = new QualityValidatorService();
    this.translationService = new TranslationService();
  }

  /**
   * POST /api/v1/translations/:id/validate
   * Perform comprehensive quality validation on translation
   */
  async validateTranslation(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.id);

      // Get translation details
      const translation = await this.translationService.getTranslationTraceability(translationId);

      if (!translation) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Translation ${translationId} not found`
          }
        });
        return;
      }

      // Extract source and translated text
      const sourceText = translation.sections.map(s => s.sourceReferences.map(r => r.sourceText).join('\n')).join('\n\n');
      const translatedText = translation.sections.map(s => s.translatedText).join('\n\n');

      // Perform validation
      const validationResult = await this.qualityValidator.validateTranslation(
        sourceText,
        translatedText,
        translation.targetLanguage as 'zh-TW' | 'th' | 'vi',
        translation.market as 'TFDA' | 'FDA_Thailand' | 'DAV',
        translation.pilId
      );

      res.json({
        translationId,
        pilId: translation.pilId,
        targetLanguage: translation.targetLanguage,
        market: translation.market,
        validation: validationResult
      });
    } catch (error) {
      logger.error('Failed to validate translation', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to perform quality validation'
        }
      });
    }
  }

  /**
   * POST /api/v1/translations/validate-section
   * Validate specific section (for incremental validation)
   */
  async validateSection(req: Request, res: Response): Promise<void> {
    try {
      const { sectionHeader, sourceText, translatedText, targetLanguage, market } = req.body;

      if (!sectionHeader || !sourceText || !translatedText || !targetLanguage || !market) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All section validation fields are required'
          }
        });
        return;
      }

      const result = await this.qualityValidator.validateSection(
        sectionHeader,
        sourceText,
        translatedText,
        targetLanguage,
        market
      );

      res.json({
        sectionHeader,
        validation: result
      });
    } catch (error) {
      logger.error('Failed to validate section', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate section'
        }
      });
    }
  }
}