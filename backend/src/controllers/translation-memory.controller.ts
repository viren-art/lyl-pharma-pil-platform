import { Request, Response } from 'express';
import { TranslationMemoryManager } from '../services/translation-memory/translation-memory-manager.service';
import { logger } from '../utils/logger';

export class TranslationMemoryController {
  private tmManager: TranslationMemoryManager;

  constructor() {
    this.tmManager = new TranslationMemoryManager();
  }

  /**
   * GET /api/v1/translation-memory/suggestions
   * Get terminology suggestions for a source term
   */
  async getTermSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { sourceTerm, sourceLanguage, targetLanguage, market } = req.query;

      if (!sourceTerm || !sourceLanguage || !targetLanguage) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'sourceTerm, sourceLanguage, and targetLanguage are required'
          }
        });
        return;
      }

      const suggestions = await this.tmManager.getTermSuggestions(
        sourceTerm as string,
        sourceLanguage as string,
        targetLanguage as string,
        market as string | undefined
      );

      res.json({
        sourceTerm,
        targetLanguage,
        suggestions
      });
    } catch (error) {
      logger.error('Failed to get term suggestions', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve term suggestions'
        }
      });
    }
  }

  /**
   * POST /api/v1/translation-memory/terms
   * Submit new term for approval
   */
  async submitTerm(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { sourceTerm, targetTerm, sourceLanguage, targetLanguage, marketApplicability, justification } = req.body;

      if (!sourceTerm || !targetTerm || !sourceLanguage || !targetLanguage || !marketApplicability) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All term fields are required'
          }
        });
        return;
      }

      const result = await this.tmManager.submitTermUpdate(
        {
          sourceTerm,
          targetTerm,
          sourceLanguage,
          targetLanguage,
          marketApplicability,
          justification
        },
        userId
      );

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Failed to submit term', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to submit term'
        }
      });
    }
  }

  /**
   * POST /api/v1/translation-memory/terms/:id/review
   * Approve or reject term (Regulatory Reviewer only
   * Approve or reject term (Regulatory Reviewer only)
   */
  async reviewTerm(req: Request, res: Response): Promise<void> {
    try {
      const reviewerId = (req as any).user?.id;
      const termId = parseInt(req.params.id);
      const { approved, reviewerComments } = req.body;

      if (typeof approved !== 'boolean') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'approved field is required (boolean)'
          }
        });
        return;
      }

      const result = await this.tmManager.reviewTermUpdate(
        { termId, approved, reviewerComments },
        reviewerId
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Failed to review term', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to review term'
        }
      });
    }
  }

  /**
   * POST /api/v1/translation-memory/terms/:id/override
   * Override approved term with justification
   */
  async overrideTerm(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const termId = parseInt(req.params.id);
      const { newTargetTerm, justification } = req.body;

      if (!newTargetTerm || !justification) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'newTargetTerm and justification are required'
          }
        });
        return;
      }

      const result = await this.tmManager.overrideTerm(
        termId,
        newTargetTerm,
        justification,
        userId
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Failed to override term', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to override term'
        }
      });
    }
  }

  /**
   * GET /api/v1/translation-memory/pending
   * Get pending term approvals
   */
  async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { targetLanguage, market } = req.query;

      const pending = await this.tmManager.getPendingApprovals(
        targetLanguage as string | undefined,
        market as string | undefined
      );

      res.json({
        count: pending.length,
        terms: pending
      });
    } catch (error) {
      logger.error('Failed to get pending approvals', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve pending approvals'
        }
      });
    }
  }

  /**
   * GET /api/v1/translation-memory/search
   * Search terminology database
   */
  async searchTerms(req: Request, res: Response): Promise<void> {
    try {
      const { query, targetLanguage, market, approvedOnly } = req.query;

      if (!query) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'query parameter is required'
          }
        });
        return;
      }

      const results = await this.tmManager.searchTerms(
        query as string,
        targetLanguage as string | undefined,
        market as string | undefined,
        approvedOnly === 'true'
      );

      res.json({
        query,
        count: results.length,
        results
      });
    } catch (error) {
      logger.error('Failed to search terms', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search terms'
        }
      });
    }
  }

  /**
   * GET /api/v1/translation-memory/consistency-report
   * Get terminology consistency report
   */
  async getConsistencyReport(req: Request, res: Response): Promise<void> {
    try {
      const { targetLanguage, market } = req.query;

      if (!targetLanguage) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'targetLanguage is required'
          }
        });
        return;
      }

      const report = await this.tmManager.getConsistencyReport(
        targetLanguage as string,
        market as string | undefined
      );

      res.json(report);
    } catch (error) {
      logger.error('Failed to generate consistency report', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate consistency report'
        }
      });
    }
  }
}