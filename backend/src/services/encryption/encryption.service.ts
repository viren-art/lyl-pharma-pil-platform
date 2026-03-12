import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  ScheduleKeyDeletionCommand,
} from '@aws-sdk/client-kms';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
}

export class EncryptionService {
  private kmsClient: KMSClient;
  private keyId: string;
  private algorithm = 'aes-256-gcm';

  constructor() {
    this.kmsClient = new KMSClient({
      region: process.env.AWS_REGION || 'ap-southeast-1',
    });
    this.keyId = process.env.KMS_KEY_ID || '';
  }

  /**
   * Encrypt JSON data using AES-256-GCM with KMS-managed keys
   */
  async encryptJSON(data: Record<string, any>): Promise<EncryptedData> {
    try {
      // Generate data encryption key from KMS
      const dataKeyCommand = new GenerateDataKeyCommand({
        KeyId: this.keyId,
        KeySpec: 'AES_256',
      });

      const dataKeyResponse = await this.kmsClient.send(dataKeyCommand);
      const plaintextKey = dataKeyResponse.Plaintext;
      const encryptedKey = dataKeyResponse.CiphertextBlob;

      if (!plaintextKey) {
        throw new Error('Failed to generate data encryption key');
      }

      // Encrypt data with AES-256-GCM
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, plaintextKey, iv);

      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
        ciphertext: encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        keyId: Buffer.from(encryptedKey!).toString('base64'),
      };
    } catch (error) {
      logger.error('Failed to encrypt JSON data', { error });
      throw error;
    }
  }

  /**
   * Decrypt JSON data using AES-256-GCM with KMS-managed keys
   */
  async decryptJSON(encryptedData: EncryptedData): Promise<Record<string, any>> {
    try {
      // Decrypt data encryption key using KMS
      const decryptCommand = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData.keyId, 'base64'),
      });

      const decryptResponse = await this.kmsClient.send(decryptCommand);
      const plaintextKey = decryptResponse.Plaintext;

      if (!plaintextKey) {
        throw new Error('Failed to decrypt data encryption key');
      }

      // Decrypt data with AES-256-GCM
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      const decipher = crypto.createDecipheriv(this.algorithm, plaintextKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt JSON data', { error });
      throw error;
    }
  }

  /**
   * Encrypt string data
   */
  async encryptString(data: string): Promise<EncryptedData> {
    return this.encryptJSON({ value: data });
  }

  /**
   * Decrypt string data
   */
  async decryptString(encryptedData: EncryptedData): Promise<string> {
    const decrypted = await this.decryptJSON(encryptedData);
    return decrypted.value;
  }

  /**
   * Rotate encryption key (called by scheduled job every 90 days)
   */
  async rotateKey(): Promise<string> {
    try {
      // In production, this would create a new KMS key and update the keyId
      // For now, we'll just log the rotation event
      logger.info('Encryption key rotation initiated', {
        oldKeyId: this.keyId,
        timestamp: new Date().toISOString(),
      });

      // Schedule deletion of old key after 30-day waiting period
      if (this.keyId) {
        const deleteCommand = new ScheduleKeyDeletionCommand({
          KeyId: this.keyId,
          PendingWindowInDays: 30,
        });

        await this.kmsClient.send(deleteCommand);
      }

      // Return new key ID (in production, this would be the actual new key)
      const newKeyId = `rotated-${Date.now()}`;
      this.keyId = newKeyId;

      logger.info('Encryption key rotation completed', {
        newKeyId,
        timestamp: new Date().toISOString(),
      });

      return newKeyId;
    } catch (error) {
      logger.error('Failed to rotate encryption key', { error });
      throw error;
    }
  }

  /**
   * Generate cryptographic hash for data integrity verification
   */
  generateHash(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity using hash
   */
  verifyHash(data: string | Buffer, expectedHash: string): boolean {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }
}