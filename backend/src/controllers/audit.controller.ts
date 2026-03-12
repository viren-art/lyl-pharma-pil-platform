import { Request, Response } from 'express';
import { AuditService } from '../services/audit/audit.service';
import { logger } from '../utils/logger';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * GET /api/v1/audit/logs
   * Retrieve audit logs with filtering
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        entityType,
        entityId,
        userId,
        action,
        fromDate,
        toDate,
        limit = 50,
        offset = 0,
      } = req.query;

      const filter = {
        entityType: entityType as string | undefined,
        entityId: entityId ? parseInt(entityId as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        action: action as string | undefined,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const result = await this.auditService.getAuditLogs(filter);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to retrieve audit logs', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'AUDIT_RETRIEVAL_FAILED',
          message: 'Failed to retrieve audit logs',
        },
      });
    }
  }

  /**
   * GET /api/v1/audit/pil/:pilId/lifecycle
   * Get complete PIL lifecycle report
   */
  async getPILLifecycle(req: Request, res: Response): Promise<void> {
    try {
      const pilId = parseInt(req.params.pilId);

      const report = await this.auditService.getPILLifecycleReport(pilId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to generate PIL lifecycle report', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'LIFECYCLE_REPORT_FAILED',
          message: 'Failed to generate PIL lifecycle report',
        },
      });
    }
  }

  /**
   * POST /api/v1/audit/export
   * Export audit trail to S3
   */
  async exportAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { filter, format = 'json' } = req.body;

      const exportPath = await this.auditService.exportAuditTrail(
        filter,
        format as 'json' | 'pdf'
      );

      res.status(200).json({
        success: true,
        data: {
          exportPath,
          format,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to export audit trail', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'AUDIT_EXPORT_FAILED',
          message: 'Failed to export audit trail',
        },
      });
    }
  }

  /**
   * POST /api/v1/audit/verify
   * Verify audit chain integrity
   */
  async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.body;

      const { logs } = await this.auditService.getAuditLogs({
        entityType,
        entityId,
      });

      const isValid = await this.auditService.verifyAuditChainIntegrity(logs);

      res.status(200).json({
        success: true,
        data: {
          integrityValid: isValid,
          logsVerified: logs.length,
          verifiedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to verify audit integrity', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTEGRITY_VERIFICATION_FAILED',
          message: 'Failed to verify audit chain integrity',
        },
      });
    }
  }
}