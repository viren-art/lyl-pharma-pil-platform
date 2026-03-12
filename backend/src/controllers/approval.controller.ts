import { Request, Response } from 'express';
import { ApprovalWorkflowService } from '../services/workflow/approval/approval-workflow.service';
import { logger } from '../utils/logger';

export class ApprovalController {
  private approvalService: ApprovalWorkflowService;

  constructor() {
    this.approvalService = new ApprovalWorkflowService();
  }

  /**
   * POST /api/v1/approvals
   * Submit approval decision
   */
  submitApproval = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gateId, decision, comments, rejectionReason } = req.body;
      const userId = (req as any).user?.id;

      if (!gateId || !decision) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'gateId and decision are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!['approved', 'rejected'].includes(decision)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'decision must be "approved" or "rejected"',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await this.approvalService.submitApproval({
        gateId,
        decision,
        comments,
        rejectionReason,
        userId,
      });

      // Get next gate if exists
      const status = await this.approvalService.getApprovalStatus(result.pilId);
      const nextGate = status.pendingGates[0];

      res.status(200).json({
        gateId: result.id,
        status: result.status,
        approvedAt: result.approvedAt,
        nextGate: nextGate
          ? {
              gateId: nextGate.gateId,
              requiredRole: nextGate.requiredRole,
              assignedTo: nextGate.assignedTo,
            }
          : null,
      });
    } catch (error: any) {
      logger.error('Failed to submit approval', { error, body: req.body });

      if (error.message.includes('not authorized')) {
        res.status(403).json({
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit approval',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * GET /api/v1/pils/:pilId/approval-status
   * Get approval workflow status
   */
  getApprovalStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const pilId = parseInt(req.params.pilId);

      if (!pilId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid PIL ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const status = await this.approvalService.getApprovalStatus(pilId);

      res.status(200).json(status);
    } catch (error: any) {
      logger.error('Failed to get approval status', { error, pilId: req.params.pilId });

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get approval status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * POST /api/v1/pils/:pilId/workflow
   * Create multi-level approval workflow
   */
  createWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const pilId = parseInt(req.params.pilId);
      const { workflowType } = req.body;

      if (!pilId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid PIL ID',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!['new_submission', 'variation', 'urgent'].includes(workflowType)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'workflowType must be "new_submission", "variation", or "urgent"',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const gates = await this.approvalService.createMultiLevelWorkflow(pilId, workflowType);

      res.status(201).json({
        pilId,
        workflowType,
        gates: gates.map((gate) => ({
          gateId: gate.id,
          gateType: gate.gateType,
          requiredRole: gate.requiredRole,
          sequenceOrder: gate.sequenceOrder,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to create workflow', { error, pilId: req.params.pilId });

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create workflow',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * GET /api/v1/approvals/pending
   * Get pending approvals for current user
   */
  getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // This would be implemented in the service layer
      // For now, return mock data
      res.status(200).json({
        pending: [],
        total: 0,
      });
    } catch (error) {
      logger.error('Failed to get pending approvals', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get pending approvals',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}