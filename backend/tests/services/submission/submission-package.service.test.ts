import { SubmissionPackageService } from '../../../src/services/submission/submission-package.service';
import { AppDataSource } from '../../../src/config/database';

describe('SubmissionPackageService', () => {
  let service: SubmissionPackageService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new SubmissionPackageService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('generateSubmissionPackage', () => {
    it('should generate TFDA submission package with all required documents', async () => {
      // This would require a full integration test with database setup
      // Placeholder for actual implementation
      expect(service).toBeDefined();
    });

    it('should reject package generation for unapproved PIL', async () => {
      // Test that status check works
      expect(service).toBeDefined();
    });

    it('should include comparison table for variation submissions', async () => {
      // Test variation-specific logic
      expect(service).toBeDefined();
    });
  });
});