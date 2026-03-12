import { Request, Response } from 'express';
import { DiffEngineService } from '../services/variation/diff-engine/diff-engine.service';
import { DraftGeneratorService } from '../services/variation/draft-generator/draft-generator.service';
import { logger } from '../utils/logger';

export class VariationController {
  private diffEngine: DiffEngineService;
  private draftGenerator: DraftGeneratorService;

  constructor() {
    this.diffEngine = new DiffEngineService();
    this.draftGenerator = new DraftGeneratorService();
  }

  /**
   * POST /api/v1/variations/detect
   * Generate variation diff for announcement and PIL
   */
  detectVariation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { announcementId, pilId } = req.body;

      if (!announcementId || !pilId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'announcementId and pilId are required',
          },
        });
        return;
      }

      const variation = await this.diffEngine.generateVariationDiff(
        announcementId,
        pilId
      );

      res.status(201).json({
        variationId: variation.id,
        affectedSections: variation.affectedSections.map((s) => ({
          section: s.sectionName,
          currentText: s.currentText,
          requiredChange: s.requiredText,
          confidence: s.confidence,
        })),
        overallConfidence: variation.overallConfidence,
        status: variation.status,
      });
    } catch (error) {
      logger.error('Failed to detect variation', { error, body: req.body });
      res.status(500).json({
        error: {
          code: 'VARIATION_DETECTION_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/variations/:id/generate-draft
   * Generate draft PIL with tracked changes
   */
  generateDraft = async (req: Request, res: Response): Promise<void> => {
    try {
      const variationId = parseInt(req.params.id);

      const variation = await this.draftGenerator.generateDraftPIL(variationId);

      res.status(200).json({
        variationId: variation.id,
        draftPILPath: variation.draftPILPath,
        diffReportPath: variation.diffReportPath,
        status: variation.status,
      });
    } catch (error) {
      logger.error('Failed to generate draft PIL', { error, variationId: req.params.id });
      res.status(500).json({
        error: {
          code: 'DRAFT_GENERATION_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/variations/:id
   * Get variation details
   */
  getVariation = async (req: Request, res: Response): Promise<void> => {
    try {
      const variationId = parseInt(req.params.id);

      const variation = await this.diffEngine.getVariation(variationId);

      if (!variation) {
        res.status(404).json({
          error: {
            code: 'VARIATION_NOT_FOUND',
            message: `Variation ${variationId} not found`,
          },
        });
        return;
      }

      res.status(200).json(variation);
    } catch (error) {
      logger.error('Failed to get variation', { error, variationId: req.params.id });
      res.status(500).json({
        error: {
          code: 'GET_VARIATION_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/variations/:id/approve
   * Approve variation analysis
   */
  approveVariation = async (req: Request, res: Response): Promise<void> => {
    try {
      const variationId = parseInt(req.params.id);
      const { comments } = req.body;
      const userId = (req as any).user.id;

      const variation = await this.draftGenerator.approveVariation(
        variationId,
        userId,
        comments
      );

      res.status(200).json({
        variationId: variation.id,
        status: variation.status,
        reviewedBy: variation.reviewedBy,
        reviewedAt: variation.reviewedAt,
      });
    } catch (error) {
      logger.error('Failed to approve variation', { error, variationId: req.params.id });
      res.status(500).json({
        error: {
          code: 'APPROVAL_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/variations/:id/reject
   * Reject variation analysis
   */
  rejectVariation = async (req: Request, res: Response): Promise<void> => {
    try {
      const variationId = parseInt(req.params.id);
      const { comments } = req.body;
      const userId = (req as any).user.id;

      if (!comments) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rejection comments are required',
          },
        });
        return;
      }

      const variation = await this.draftGenerator.rejectVariation(
        variationId,
        userId,
        comments
      );

      res.status(200).json({
        variationId: variation.id,
        status: variation.status,
        reviewedBy: variation.reviewedBy,
        reviewedAt: variation.reviewedAt,
      });
    } catch (error) {
      logger.error('Failed to reject variation', { error, variationId: req.params.id });
      res.status(500).json({
        error: {
          code: 'REJECTION_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/pils/:pilId/variations
   * Get variations for PIL
   */
  getVariationsForPIL = async (req: Request, res: Response): Promise<void> => {
    try {
      const pilId = parseInt(req.params.pilId);

      const variations = await this.diffEngine.getVariationsForPIL(pilId);

      res.status(200).json({
        pilId,
        variations: variations.map((v) => ({
          id: v.id,
          announcementId: v.announcementId,
          status: v.status,
          overallConfidence: v.overallConfidence,
          affectedSectionsCount: v.affectedSections.length,
          createdAt: v.createdAt,
        })),
      });
    } catch (error) {
      logger.error('Failed to get variations for PIL', { error, pilId: req.params.pilId });
      res.status(500).json({
        error: {
          code: 'GET_VARIATIONS_FAILED',
          message: error.message,
        },
      });
    }
  };
}