import { Request, Response } from 'express';
import { TranslationService } from '../services/translation/translation.service';
import { logger } from '../utils/logger';

export class TranslationController {
  private translationService: TranslationService;

  constructor() {
    this.translationService = new TranslationService();
  }

  async translatePIL(req: Request, res: Response): Promise<void> {
    try {
      const { pilId, targetLanguage, sourceDocumentPath } = req.body;
      const userId = (req as any).user?.id;

      if (!pilId || !targetLanguage || !sourceDocumentPath) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: pilId, targetLanguage, sourceDocumentPath',
          },
        });
        return;
      }

      const result = await this.translationService.translatePIL({
        pilId,
        targetLanguage,
        sourceDocumentPath,
        userId,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Translation controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: {
          code: 'TRANSLATION_FAILED',
          message: error instanceof Error ? error.message : 'Translation failed',
        },
      });
    }
  }

  async getTraceability(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.id);

      if (isNaN(translationId)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid translation ID',
          },
        });
        return;
      }

      const traceability = await this.translationService.getTranslationTraceability(
        translationId
      );

      res.status(200).json(traceability);
    } catch (error) {
      logger.error('Traceability controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: {
          code: 'TRACEABILITY_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch traceability',
        },
      });
    }
  }
}