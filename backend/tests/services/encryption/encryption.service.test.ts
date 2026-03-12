import { EncryptionService } from '../../../src/services/encryption/encryption.service';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    encryptionService = new EncryptionService();
  });

  describe('encryptJSON and decryptJSON', () => {
    it('should encrypt and decrypt JSON data', async () => {
      const originalData = {
        productName: 'Test Product',
        dosage: '500mg',
        contraindications: ['Pregnancy', 'Liver disease'],
      };

      const encrypted = await encryptionService.encryptJSON(originalData);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.keyId).toBeDefined();

      const decrypted = await encryptionService.decryptJSON(encrypted);

      expect(decrypted).toEqual(originalData);
    });

    it('should fail decryption with tampered ciphertext', async () => {
      const originalData = { test: 'data' };
      const encrypted = await encryptionService.encryptJSON(originalData);

      // Tamper with ciphertext
      encrypted.ciphertext = 'tampered_data';

      await expect(encryptionService.decryptJSON(encrypted)).rejects.toThrow();
    });
  });

  describe('generateHash and verifyHash', () => {
    it('should generate consistent SHA-256 hash', () => {
      const data = 'test data for hashing';
      const hash1 = encryptionService.generateHash(data);
      const hash2 = encryptionService.generateHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should verify hash correctly', () => {
      const data = 'test data';
      const hash = encryptionService.generateHash(data);

      const isValid = encryptionService.verifyHash(data, hash);
      expect(isValid).toBe(true);

      const isInvalid = encryptionService.verifyHash('tampered data', hash);
      expect(isInvalid).toBe(false);
    });
  });
});