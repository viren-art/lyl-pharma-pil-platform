import { Request, Response } from 'express';
import { SubmissionPackageService } from '../services/submission/submission-package.service';
import { logger } from '../utils/logger';

export class SubmissionPackageController {
  private submissionPackageService: SubmissionPackageService;

  constructor() {
    this.submissionPackageService = new SubmissionPackageService();
  }

  /**
   * GET /api/v1/pils/:id/submission-package
   * Generate submission package for PIL
   */
  public generatePackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const pilId = parseInt(req.params.id);
      const { market } = req.query;
      const userId = (req as any).user?.id;

      if (!market || !['TFDA', 'FDA_Thailand', 'DAV'].includes(market as string)) {
        res.status(400).json({
          error: {
            code: 'INVALID_MARKET',
            message: 'Market must be one of: TFDA, FDA_Thailand, DAV',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await this.submissionPackageService.generateSubmissionPackage({
        pilId,
        market: market as 'TFDA' | 'FDA_Thailand' | 'DAV',
        userId,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Failed to generate submission package', { error, params: req.params });

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'PIL_NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (error.message.includes('must be approved')) {
        res.status(400).json({
          error: {
            code: 'APPROVAL_REQUIRED',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (error.message.includes('validation failed')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'PACKAGE_GENERATION_FAILED',
          message: 'Failed to generate submission package',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}