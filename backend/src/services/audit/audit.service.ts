import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AuditLog } from '../../models/audit.model';
import { EncryptionService } from '../encryption/encryption.service';
import { S3Service } from '../storage/s3.service';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

interface AuditLogEntry {
  entityType: string;
  entityId: number;
  action: string;
  userId?: number;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  traceId?: string;
  sessionId?: string;
}

interface AuditReportFilter {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

interface AuditReportResponse {
  logs: AuditLog[];
  total: number;
  integrityValid: boolean;
  exportPath?: string;
}

interface PILLifecycleReport {
  pilId: number;
  productName: string;
  market: string;
  timeline: Array<{
    timestamp: Date;
    action: string;
    actor: string;
    details: string;
    metadata?: Record<string, any>;
  }>;
  translationEvents: Array<{
    timestamp: Date;
    targetLanguage: string;
    confidenceScore: number;
    llmModel: string;
    reviewer: string;
  }>;
  approvalEvents: Array<{
    timestamp: Date;
    gateType: string;
    approver: string;
    decision: string;
    comments?: string;
  }>;
  submissionEvent?: {
    timestamp: Date;
    submittedBy: string;
    packagePath: string;
  };
  integrityVerified: boolean;
}

export class AuditService {
  private repository: Repository<AuditLog>;
  private encryptionService: EncryptionService;
  private s3Service: S3Service;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLog);
    this.encryptionService = new EncryptionService();
    this.s3Service = new S3Service();
  }

  /**
   * Log an audit event with cryptographic verification
   */
  async logEvent(entry: AuditLogEntry): Promise<AuditLog> {
    try {
      // Get the last event hash for chaining
      const lastEvent = await this.repository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      // Calculate event hash for tamper detection
      const eventData = {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId,
        beforeState: entry.beforeState,
        afterState: entry.afterState,
        metadata: entry.metadata,
        timestamp: new Date().toISOString(),
        previousHash: lastEvent?.eventHash || null,
      };

      const eventHash = this.calculateEventHash(eventData);

      // Encrypt sensitive data in beforeState and afterState
      const encryptedBeforeState = entry.beforeState
        ? await this.encryptionService.encryptJSON(entry.beforeState)
        : null;
      const encryptedAfterState = entry.afterState
        ? await this.encryptionService.encryptJSON(entry.afterState)
        : null;

      const auditLog = this.repository.create({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId || null,
        beforeState: encryptedBeforeState,
        afterState: encryptedAfterState,
        metadata: entry.metadata || null,
        ipAddress: entry.ipAddress || null,
        eventHash,
        previousEventHash: lastEvent?.eventHash || null,
        traceId: entry.traceId || null,
        sessionId: entry.sessionId || null,
      });

      const savedLog = await this.repository.save(auditLog);

      logger.info('Audit event logged', {
        auditLogId: savedLog.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId,
        eventHash,
      });

      return savedLog;
    } catch (error) {
      logger.error('Failed to log audit event', { error, entry });
      throw error;
    }
  }

  /**
   * Retrieve audit logs with filtering
   */
  async getAuditLogs(filter: AuditReportFilter): Promise<AuditReportResponse> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('audit');

      if (filter.entityType) {
        queryBuilder.andWhere('audit.entityType = :entityType', {
          entityType: filter.entityType,
        });
      }

      if (filter.entityId) {
        queryBuilder.andWhere('audit.entityId = :entityId', {
          entityId: filter.entityId,
        });
      }

      if (filter.userId) {
        queryBuilder.andWhere('audit.userId = :userId', { userId: filter.userId });
      }

      if (filter.action) {
        queryBuilder.andWhere('audit.action = :action', { action: filter.action });
      }

      if (filter.fromDate) {
        queryBuilder.andWhere('audit.createdAt >= :fromDate', {
          fromDate: filter.fromDate,
        });
      }

      if (filter.toDate) {
        queryBuilder.andWhere('audit.createdAt <= :toDate', { toDate: filter.toDate });
      }

      queryBuilder.orderBy('audit.createdAt', 'DESC');

      const total = await queryBuilder.getCount();

      if (filter.limit) {
        queryBuilder.limit(filter.limit);
      }

      if (filter.offset) {
        queryBuilder.offset(filter.offset);
      }

      const logs = await queryBuilder.getMany();

      // Decrypt sensitive data
      const decryptedLogs = await Promise.all(
        logs.map(async (log) => ({
          ...log,
          beforeState: log.beforeState
            ? await this.encryptionService.decryptJSON(log.beforeState)
            : null,
          afterState: log.afterState
            ? await this.encryptionService.decryptJSON(log.afterState)
            : null,
        }))
      );

      // Verify integrity of the audit chain
      const integrityValid = await this.verifyAuditChainIntegrity(decryptedLogs);

      return {
        logs: decryptedLogs,
        total,
        integrityValid,
      };
    } catch (error) {
      logger.error('Failed to retrieve audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Reconstruct complete PIL lifecycle from audit trail
   */
  async getPILLifecycleReport(pilId: number): Promise<PILLifecycleReport> {
    try {
      // Fetch all audit logs related to the PIL
      const logs = await this.repository.find({
        where: { entityType: 'pil', entityId: pilId },
        order: { createdAt: 'ASC' },
        relations: ['user'],
      });

      // Decrypt logs
      const decryptedLogs = await Promise.all(
        logs.map(async (log) => ({
          ...log,
          beforeState: log.beforeState
            ? await this.encryptionService.decryptJSON(log.beforeState)
            : null,
          afterState: log.afterState
            ? await this.encryptionService.decryptJSON(log.afterState)
            : null,
        }))
      );

      // Fetch translation events
      const translationLogs = await this.repository.find({
        where: { entityType: 'translation', metadata: { pilId } as any },
        order: { createdAt: 'ASC' },
        relations: ['user'],
      });

      const decryptedTranslationLogs = await Promise.all(
        translationLogs.map(async (log) => ({
          ...log,
          metadata: log.metadata,
        }))
      );

      // Fetch approval events
      const approvalLogs = await this.repository.find({
        where: { entityType: 'approval_gate', metadata: { pilId } as any },
        order: { createdAt: 'ASC' },
        relations: ['user'],
      });

      const decryptedApprovalLogs = await Promise.all(
        approvalLogs.map(async (log) => ({
          ...log,
          metadata: log.metadata,
        }))
      );

      // Build timeline
      const timeline = decryptedLogs.map((log) => ({
        timestamp: log.createdAt,
        action: log.action,
        actor: log.user?.fullName || 'System',
        details: this.formatActionDetails(log),
        metadata: log.metadata,
      }));

      // Build translation events
      const translationEvents = decryptedTranslationLogs
        .filter((log) => log.action === 'translate')
        .map((log) => ({
          timestamp: log.createdAt,
          targetLanguage: log.metadata?.targetLanguage || 'Unknown',
          confidenceScore: log.metadata?.confidenceScore || 0,
          llmModel: log.metadata?.llmModel || 'Unknown',
          reviewer: log.user?.fullName || 'System',
        }));

      // Build approval events
      const approvalEvents = decryptedApprovalLogs
        .filter((log) => log.action === 'approve' || log.action === 'reject')
        .map((log) => ({
          timestamp: log.createdAt,
          gateType: log.metadata?.gateType || 'Unknown',
          approver: log.user?.fullName || 'Unknown',
          decision: log.action,
          comments: log.metadata?.comments,
        }));

      // Find submission event
      const submissionLog = decryptedLogs.find((log) => log.action === 'submit');
      const submissionEvent = submissionLog
        ? {
            timestamp: submissionLog.createdAt,
            submittedBy: submissionLog.user?.fullName || 'Unknown',
            packagePath: submissionLog.metadata?.packagePath || '',
          }
        : undefined;

      // Verify integrity
      const integrityVerified = await this.verifyAuditChainIntegrity(decryptedLogs);

      // Get PIL details from first log
      const pilDetails = decryptedLogs[0]?.afterState || {};

      return {
        pilId,
        productName: pilDetails.productName || 'Unknown',
        market: pilDetails.market || 'Unknown',
        timeline,
        translationEvents,
        approvalEvents,
        submissionEvent,
        integrityVerified,
      };
    } catch (error) {
      logger.error('Failed to generate PIL lifecycle report', { error, pilId });
      throw error;
    }
  }

  /**
   * Export audit trail to S3 for long-term retention
   */
  async exportAuditTrail(
    filter: AuditReportFilter,
    format: 'json' | 'pdf' = 'json'
  ): Promise<string> {
    try {
      const { logs, total, integrityValid } = await this.getAuditLogs(filter);

      const exportData = {
        exportedAt: new Date().toISOString(),
        filter,
        total,
        integrityValid,
        logs: logs.map((log) => ({
          id: log.id,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          userId: log.userId,
          userName: log.user?.fullName,
          beforeState: log.beforeState,
          afterState: log.afterState,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          eventHash: log.eventHash,
          previousEventHash: log.previousEventHash,
          traceId: log.traceId,
          sessionId: log.sessionId,
          createdAt: log.createdAt,
        })),
      };

      const timestamp = Date.now();
      const key = `audit-exports/${filter.entityType || 'all'}/${timestamp}.${format}`;

      let exportPath: string;

      if (format === 'json') {
        exportPath = await this.s3Service.uploadJSON(key, exportData);
      } else {
        // Generate PDF report (simplified - would use a PDF library in production)
        const pdfContent = this.generatePDFReport(exportData);
        exportPath = await this.s3Service.uploadDocument(key, Buffer.from(pdfContent));
      }

      logger.info('Audit trail exported', {
        exportPath,
        format,
        total,
        integrityValid,
      });

      return exportPath;
    } catch (error) {
      logger.error('Failed to export audit trail', { error, filter });
      throw error;
    }
  }

  /**
   * Verify integrity of audit chain using cryptographic hashes
   */
  async verifyAuditChainIntegrity(logs: AuditLog[]): Promise<boolean> {
    try {
      if (logs.length === 0) return true;

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // Recalculate event hash
        const eventData = {
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          userId: log.userId,
          beforeState: log.beforeState,
          afterState: log.afterState,
          metadata: log.metadata,
          timestamp: log.createdAt.toISOString(),
          previousHash: log.previousEventHash,
        };

        const calculatedHash = this.calculateEventHash(eventData);

        // Verify hash matches
        if (calculatedHash !== log.eventHash) {
          logger.error('Audit chain integrity violation detected', {
            logId: log.id,
            expectedHash: log.eventHash,
            calculatedHash,
          });
          return false;
        }

        // Verify chain linkage
        if (i > 0) {
          const previousLog = logs[i - 1];
          if (log.previousEventHash !== previousLog.eventHash) {
            logger.error('Audit chain linkage broken', {
              logId: log.id,
              previousLogId: previousLog.id,
              expectedPreviousHash: previousLog.eventHash,
              actualPreviousHash: log.previousEventHash,
            });
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to verify audit chain integrity', { error });
      return false;
    }
  }

  /**
   * Archive old audit logs to Glacier for 10-year retention
   */
  async archiveOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const logsToArchive = await this.repository.find({
        where: {
          createdAt: { $lte: cutoffDate } as any,
        },
        order: { createdAt: 'ASC' },
      });

      if (logsToArchive.length === 0) {
        logger.info('No logs to archive');
        return 0;
      }

      // Export to S3 with Glacier storage class
      const archiveData = {
        archivedAt: new Date().toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        total: logsToArchive.length,
        logs: logsToArchive,
      };

      const key = `audit-archives/${cutoffDate.getFullYear()}/${cutoffDate.getMonth() + 1}/archive-${Date.now()}.json`;
      await this.s3Service.uploadJSON(key, archiveData);

      logger.info('Audit logs archived to Glacier', {
        count: logsToArchive.length,
        cutoffDate,
        archivePath: key,
      });

      return logsToArchive.length;
    } catch (error) {
      logger.error('Failed to archive old logs', { error });
      throw error;
    }
  }

  /**
   * Calculate SHA-256 hash for event data
   */
  private calculateEventHash(eventData: any): string {
    const dataString = JSON.stringify(eventData, Object.keys(eventData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Format action details for timeline display
   */
  private formatActionDetails(log: AuditLog): string {
    switch (log.action) {
      case 'create':
        return `Created ${log.entityType} #${log.entityId}`;
      case 'update':
        return `Updated ${log.entityType} #${log.entityId}`;
      case 'approve':
        return `Approved ${log.entityType} #${log.entityId}`;
      case 'reject':
        return `Rejected ${log.entityType} #${log.entityId}`;
      case 'submit':
        return `Submitted ${log.entityType} #${log.entityId} to regulatory authority`;
      case 'translate':
        return `Translated ${log.entityType} #${log.entityId} to ${log.metadata?.targetLanguage}`;
      case 'format':
        return `Formatted ${log.entityType} #${log.entityId} for ${log.metadata?.market}`;
      default:
        return `${log.action} on ${log.entityType} #${log.entityId}`;
    }
  }

  /**
   * Generate PDF report (simplified version)
   */
  private generatePDFReport(data: any): string {
    // In production, use a PDF library like pdfkit or puppeteer
    return JSON.stringify(data, null, 2);
  }
}