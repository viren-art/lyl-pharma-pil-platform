import { EncryptionService } from '../services/encryption/encryption.service';
import { logger } from '../utils/logger';

/**
 * Scheduled job to rotate encryption keys every 90 days
 * Run via cron: 0 3 1 */3 * (3 AM on 1st day of every 3rd month)
 */
async function rotateEncryptionKeys() {
  const encryptionService = new EncryptionService();

  try {
    logger.info('Starting encryption key rotation');

    const newKeyId = await encryptionService.rotateKey();

    logger.info('Encryption key rotation completed', {
      newKeyId,
      timestamp: new Date().toISOString(),
    });

    process.exit(0);
  } catch (error) {
    logger.error('Encryption key rotation failed', { error });
    process.exit(1);
  }
}

rotateEncryptionKeys();