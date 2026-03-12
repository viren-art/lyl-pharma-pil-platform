import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AuditLog } from '../../models/audit-log.model';
import { AuditService } from './audit.service';

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

/**
 * Enhanced audit logger with automatic event capture
 * This replaces the basic audit-logger.ts from F1
 */
export class AuditLogger {
  private repository: Repository<AuditLog>;
  private auditService: AuditService;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLog);
    this.auditService = new AuditService();
  }

  /**
   * Log an audit event (delegates to AuditService for cryptographic verification)
   */
  async log(entry: AuditLogEntry): Promise<AuditLog> {
    return this.auditService.logEvent(entry);
  }

  /**
   * Log PIL creation event
   */
  async logPILCreation(
    pilId: number,
    pilData: Record<string, any>,
    userId: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      entityType: 'pil',
      entityId: pilId,
      action: 'create',
      userId,
      afterState: pilData,
      ipAddress,
    });
  }

  /**
   * Log translation event with LLM metadata
   */
  async logTranslation(
    translationId: number,
    pilId: number,
    translationData: Record<string, any>,
    llmMetadata: {
      model: string;
      confidenceScore: number;
      targetLanguage: string;
      processingTimeMs: number;
    },
    userId: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      entityType: 'translation',
      entityId: translationId,
      action: 'translate',
      userId,
      afterState: translationData,
      metadata: {
        pilId,
        llmModel: llmMetadata.model,
        confidenceScore: llmMetadata.confidenceScore,
        targetLanguage: llmMetadata.targetLanguage,
        processingTimeMs: llmMetadata.processingTimeMs,
      },
      ipAddress,
    });
  }

  /**
   * Log approval gate event
   */
  async logApproval(
    gateId: number,
    pilId: number,
    decision: 'approved' | 'rejected',
    gateType: string,
    userId: number,
    comments?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      entityType: 'approval_gate',
      entityId: gateId,
      action: decision === 'approved' ? 'approve' : 'reject',
      userId,
      metadata: {
        pilId,
        gateType,
        comments,
      },
      ipAddress,
    });
  }

  /**
   * Log regulatory submission event
   */
  async logSubmission(
    pilId: number,
    submissionData: {
      market: string;
      packagePath: string;
      submissionStatus: string;
    },
    userId: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      entityType: 'pil',
      entityId: pilId,
      action: 'submit',
      userId,
      metadata: submissionData,
      ipAddress,
    });
  }

  /**
   * Log variation detection event
   */
  async logVariationDetection(
    pilId: number,
    announcementId: number,
    variationData: {
      affectedSections: string[];
      confidence: number;
    },
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      entityType: 'pil',
      entityId: pilId,
      action: 'variation_detected',
      metadata: {
        announcementId,
        affectedSections: variationData.affectedSections,
        confidence: variationData.confidence,
      },
      ipAddress,
    });
  }
}