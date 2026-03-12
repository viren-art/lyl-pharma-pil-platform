import { Request, Response } from 'express';
import { TraceabilityService } from '../services/traceability/traceability.service';
import { logger } from '../utils/logger';

export class TraceabilityController {
  private traceabilityService: TraceabilityService;

  constructor() {
    this.traceabilityService = new TraceabilityService();
  }

  async getTraceability(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.translationId);

      if (isNaN(translationId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TRANSLATION_ID',
            message: 'Translation ID must be a valid number',
          },
        });
        return;
      }

      const traceability = await this.traceabilityService.getTraceability(translationId);

      res.status(200).json(traceability);
    } catch (error) {
      logger.error({
        message: 'Failed to retrieve traceability',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: {
          code: 'TRACEABILITY_RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve traceability',
        },
      });
    }
  }

  async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.translationId);

      if (isNaN(translationId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TRANSLATION_ID',
            message: 'Translation ID must be a valid number',
          },
        });
        return;
      }

      const isValid = await this.traceabilityService.verifyTraceabilityIntegrity(translationId);

      res.status(200).json({
        translationId,
        integrityValid: isValid,
        verifiedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        message: 'Failed to verify traceability integrity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: {
          code: 'INTEGRITY_VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to verify integrity',
        },
      });
    }
  }

  async exportLog(req: Request, res: Response): Promise<void> {
    try {
      const translationId = parseInt(req.params.translationId);

      if (isNaN(translationId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TRANSLATION_ID',
            message: 'Translation ID must be a valid number',
          },
        });
        return;
      }

      const logPath = await this.traceabilityService.exportTraceabilityLog(translationId);

      res.status(200).json({
        translationId,
        logPath,
        exportedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        message: 'Failed to export traceability log',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: {
          code: 'LOG_EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to export log',
        },
      });
    }
  }
}