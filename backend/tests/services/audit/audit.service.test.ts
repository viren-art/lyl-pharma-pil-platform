import { AuditService } from '../../../src/services/audit/audit.service';
import { AppDataSource } from '../../../src/config/database';
import { AuditLog } from '../../../src/models/audit.model';

describe('AuditService', () => {
  let auditService: AuditService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    auditService = new AuditService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('logEvent', () => {
    it('should log audit event with cryptographic hash', async () => {
      const entry = {
        entityType: 'pil',
        entityId: 1,
        action: 'create',
        userId: 1,
        afterState: { productName: 'Test Product', market: 'TFDA' },
        metadata: { source: 'test' },
      };

      const log = await auditService.logEvent(entry);

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.eventHash).toBeDefined();
      expect(log.eventHash).toHaveLength(64); // SHA-256 hash
      expect(log.entityType).toBe('pil');
      expect(log.entityId).toBe(1);
      expect(log.action).toBe('create');
    });

    it('should chain events with previousEventHash', async () => {
      const entry1 = {
        entityType: 'pil',
        entityId: 2,
        action: 'create',
        userId: 1,
      };

      const entry2 = {
        entityType: 'pil',
        entityId: 2,
        action: 'update',
        userId: 1,
      };

      const log1 = await auditService.logEvent(entry1);
      const log2 = await auditService.logEvent(entry2);

      expect(log2.previousEventHash).toBe(log1.eventHash);
    });

    it('should encrypt sensitive data in beforeState and afterState', async () => {
      const entry = {
        entityType: 'translation',
        entityId: 1,
        action: 'translate',
        userId: 1,
        afterState: {
          translatedText: 'Sensitive pharmaceutical data',
          confidenceScore: 92,
        },
      };

      const log = await auditService.logEvent(entry);

      // afterState should be encrypted (not plain JSON)
      expect(log.afterState).toBeDefined();
      expect(typeof log.afterState).toBe('object');
      expect(log.afterState).toHaveProperty('ciphertext');
      expect(log.afterState).toHaveProperty('iv');
      expect(log.afterState).toHaveProperty('authTag');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filtering', async () => {
      // Create test logs
      await auditService.logEvent({
        entityType: 'pil',
        entityId: 3,
        action: 'create',
        userId: 1,
      });

      await auditService.logEvent({
        entityType: 'pil',
        entityId: 3,
        action: 'update',
        userId: 1,
      });

      const result = await auditService.getAuditLogs({
        entityType: 'pil',
        entityId: 3,
      });

      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.integrityValid).toBe(true);
    });

    it('should decrypt logs when retrieving', async () => {
      const entry = {
        entityType: 'translation',
        entityId: 2,
        action: 'translate',
        userId: 1,
        afterState: { translatedText: 'Test translation' },
      };

      await auditService.logEvent(entry);

      const result = await auditService.getAuditLogs({
        entityType: 'translation',
        entityId: 2,
      });

      const log = result.logs[0];
      expect(log.afterState).toBeDefined();
      expect(log.afterState.translatedText).toBe('Test translation');
    });
  });

  describe('verifyAuditChainIntegrity', () => {
    it('should verify integrity of valid audit chain', async () => {
      // Create chain of events
      await auditService.logEvent({
        entityType: 'pil',
        entityId: 4,
        action: 'create',
        userId: 1,
      });

      await auditService.logEvent({
        entityType: 'pil',
        entityId: 4,
        action: 'update',
        userId: 1,
      });

      const { logs } = await auditService.getAuditLogs({
        entityType: 'pil',
        entityId: 4,
      });

      const isValid = await auditService.verifyAuditChainIntegrity(logs);
      expect(isValid).toBe(true);
    });

    it('should detect tampered audit logs', async () => {
      const { logs } = await auditService.getAuditLogs({
        entityType: 'pil',
        entityId: 4,
      });

      // Tamper with a log
      if (logs.length > 0) {
        logs[0].eventHash = 'tampered_hash';
      }

      const isValid = await auditService.verifyAuditChainIntegrity(logs);
      expect(isValid).toBe(false);
    });
  });

  describe('getPILLifecycleReport', () => {
    it('should reconstruct complete PIL lifecycle', async () => {
      const pilId = 5;

      // Simulate PIL lifecycle
      await auditService.logEvent({
        entityType: 'pil',
        entityId: pilId,
        action: 'create',
        userId: 1,
        afterState: { productName: 'Lifecycle Test', market: 'TFDA' },
      });

      await auditService.logEvent({
        entityType: 'translation',
        entityId: 1,
        action: 'translate',
        userId: 1,
        metadata: {
          pilId,
          targetLanguage: 'zh-TW',
          confidenceScore: 92,
          llmModel: 'gpt-4',
        },
      });

      await auditService.logEvent({
        entityType: 'approval_gate',
        entityId: 1,
        action: 'approve',
        userId: 2,
        metadata: {
          pilId,
          gateType
          gateType: 'translation',
        },
      });

      await auditService.logEvent({
        entityType: 'pil',
        entityId: pilId,
        action: 'submit',
        userId: 1,
        metadata: {
          market: 'TFDA',
          packagePath: 's3://bucket/submission.zip',
        },
      });

      const report = await auditService.getPILLifecycleReport(pilId);

      expect(report).toBeDefined();
      expect(report.pilId).toBe(pilId);
      expect(report.timeline.length).toBeGreaterThanOrEqual(2);
      expect(report.translationEvents.length).toBeGreaterThanOrEqual(1);
      expect(report.approvalEvents.length).toBeGreaterThanOrEqual(1);
      expect(report.submissionEvent).toBeDefined();
      expect(report.integrityVerified).toBe(true);
    });
  });

  describe('exportAuditTrail', () => {
    it('should export audit trail to S3 in JSON format', async () => {
      const pilId = 6;

      await auditService.logEvent({
        entityType: 'pil',
        entityId: pilId,
        action: 'create',
        userId: 1,
      });

      const exportPath = await auditService.exportAuditTrail(
        { entityType: 'pil', entityId: pilId },
        'json'
      );

      expect(exportPath).toBeDefined();
      expect(exportPath).toContain('s3://');
      expect(exportPath).toContain('audit-exports');
      expect(exportPath).toContain('.json');
    });
  });
});