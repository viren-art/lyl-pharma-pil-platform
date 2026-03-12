import { Request, Response } from 'express';
import { AIValidationService } from '../services/validation/ai-documentation/ai-validation.service';
import { logger } from '../utils/logger';

export class ValidationController {
  private validationService: AIValidationService;

  constructor() {
    this.validationService = new AIValidationService();
  }

  /**
   * POST /api/v1/validation/reports
   * Generate AI validation report
   */
  generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        modelId,
        modelVersion,
        includeTrainingData = true,
        includeTestResults = true,
        includeHumanOverrides = true,
        includeComplianceAttestations = true,
        format = 'pdf',
      } = req.body;

      const report = await this.validationService.generateValidationReport({
        modelId,
        modelVersion,
        includeTrainingData,
        includeTestResults,
        includeHumanOverrides,
        includeComplianceAttestations,
        format,
      });

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to generate validation report', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_REPORT_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  /**
   * GET /api/v1/validation/models/:modelId/compliance
   * Get compliance report for model
   */
  getComplianceReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const modelId = parseInt(req.params.modelId);

      if (isNaN(modelId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODEL_ID',
            message: 'Model ID must be a number',
          },
        });
        return;
      }

      const report = await this.validationService.getComplianceReport(modelId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to get compliance report', { error, modelId: req.params.modelId });
      res.status(500).json({
        success: false,
        error: {
          code: 'COMPLIANCE_REPORT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  /**
   * GET /api/v1/validation/models/active
   * Get active model version
   */
  getActiveModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const model = await this.validationService.getActiveModel();

      if (!model) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_MODEL',
            message: 'No active model found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: model,
      });
    } catch (error) {
      logger.error('Failed to get active model', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ACTIVE_MODEL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  /**
   * GET /api/v1/validation/models
   * List all model versions
   */
  listModels = async (req: Request, res: Response): Promise<void> => {
    try {
      const models = await this.validationService.listModelVersions();

      res.status(200).json({
        success: true,
        data: models,
      });
    } catch (error) {
      logger.error('Failed to list models', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'LIST_MODELS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  /**
   * POST /api/v1/validation/models/:modelId/update-statistics
   * Update human-in-the-loop statistics
   */
  updateStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const modelId = parseInt(req.params.modelId);

      if (isNaN(modelId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MODEL_ID',
            message: 'Model ID must be a number',
          },
        });
        return;
      }

      await this.validationService.updateHumanInTheLoopStatistics(modelId);

      res.status(200).json({
        success: true,
        message: 'Statistics updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update statistics', { error, modelId: req.params.modelId });
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_STATISTICS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };
}