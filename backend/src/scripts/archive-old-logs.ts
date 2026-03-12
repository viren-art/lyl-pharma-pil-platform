import { AuditService } from '../services/audit/audit.service';
import { logger } from '../utils/logger';

/**
 * Scheduled job to archive audit logs older than 90 days to Glacier
 * Run daily via cron: 0 2 * * * (2 AM daily)
 */
async function archiveOldLogs() {
  const auditService = new AuditService();

  try {
    logger.info('Starting audit log archival process');

    const archivedCount = await auditService.archiveOldLogs(90);

    logger.info('Audit log archival completed', {
      archivedCount,
      timestamp: new Date().toISOString(),
    });

    process.exit(0);
  } catch (error) {
    logger.error('Audit log archival failed', { error });
    process.exit(1);
  }
}

archiveOldLogs();