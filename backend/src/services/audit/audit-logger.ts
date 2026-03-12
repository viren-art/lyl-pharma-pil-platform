import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AuditLog } from '../../models/audit-log.model';

interface AuditLogEntry {
  entityType: string;
  entityId: number;
  action: string;
  userId: number;
  beforeState?: any;
  afterState?: any;
  metadata?: any;
  ipAddress?: string;
}

export class AuditLogger {
  private repository: Repository<AuditLog>;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLog);
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const auditLog = this.repository.create({
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      userId: entry.userId,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      createdAt: new Date(),
    });

    await this.repository.save(auditLog);
  }
}