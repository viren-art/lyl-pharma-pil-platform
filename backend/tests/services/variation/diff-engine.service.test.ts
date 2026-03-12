import { DiffEngineService } from '../../../src/services/variation/diff-engine/diff-engine.service';
import { AppDataSource } from '../../../src/config/database';
import { Variation } from '../../../src/models/variation.model';
import { RegulatoryAnnouncement } from '../../../src/models/announcement.model';
import { PIL } from '../../../src/models/pil.model';

jest.mock('../../../src/services/audit/audit-logger.enhanced');

describe('DiffEngineService', () => {
  let service: DiffEngineService;
  let variationRepository: any;
  let announcementRepository: any;
  let pilRepository: any;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(() => {
    service = new DiffEngineService();
    variationRepository = AppDataSource.getRepository(Variation);
    announcementRepository = AppDataSource.getRepository(RegulatoryAnnouncement);
    pilRepository = AppDataSource.getRepository(PIL);
  });

  describe('generateVariationDiff', () => {
    it('should generate variation diff with affected sections', async () => {
      // Create test announcement
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TFDA-2024-001',
        publishedAt: new Date(),
        affectedProducts: ['Product A'],
        sourceUrl: 'https://tfda.gov.tw/announcement/001',
        content: 'New contraindication: severe renal impairment. Dosage adjustment required.',
        metadata: { nlpConfidence: 85 },
      });
      await announcementRepository.save(announcement);

      // Create test PIL
      const pil = pilRepository.create({
        productName: 'Product A',
        market: 'TFDA',
        status: 'approved',
        sourceType: 'innovator',
      });
      await pilRepository.save(pil);

      // Generate diff
      const variation = await service.generateVariationDiff(announcement.id, pil.id);

      expect(variation).toBeDefined();
      expect(variation.announcementId).toBe(announcement.id);
      expect(variation.pilId).toBe(pil.id);
      expect(variation.status).toBe('pending_review');
      expect(variation.affectedSections.length).toBeGreaterThan(0);
      expect(variation.overallConfidence).toBeGreaterThan(0);
      expect(variation.overallConfidence).toBeLessThanOrEqual(100);
    });

    it('should identify dosage section changes', async () => {
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TFDA-2024-002',
        publishedAt: new Date(),
        affectedProducts: ['Product B'],
        sourceUrl: 'https://tfda.gov.tw/announcement/002',
        content: 'Dosage reduction required for elderly patients.',
        metadata: { nlpConfidence: 90 },
      });
      await announcementRepository.save(announcement);

      const pil = pilRepository.create({
        productName: 'Product B',
        market: 'TFDA',
        status: 'approved',
        sourceType: 'innovator',
      });
      await pilRepository.save(pil);

      const variation = await service.generateVariationDiff(announcement.id, pil.id);

      const dosageSection = variation.affectedSections.find(
        (s) => s.sectionType === 'dosage'
      );
      expect(dosageSection).toBeDefined();
      expect(dosageSection?.requiresUpdate).toBe(true);
      expect(dosageSection?.diffHighlights.length).toBeGreaterThan(0);
    });

    it('should calculate confidence scores for each section', async () => {
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TFDA-2024-003',
        publishedAt: new Date(),
        affectedProducts: ['Product C'],
        sourceUrl: 'https://tfda.gov.tw/announcement/003',
        content: 'New adverse event: Stevens-Johnson syndrome. Update warnings section.',
        metadata: { nlpConfidence: 88 },
      });
      await announcementRepository.save(announcement);

      const pil = pilRepository.create({
        productName: 'Product C',
        market: 'TFDA',
        status: 'approved',
        sourceType: 'innovator',
      });
      await pilRepository.save(pil);

      const variation = await service.generateVariationDiff(announcement.id, pil.id);

      for (const section of variation.affectedSections) {
        expect(section.confidence).toBeGreaterThanOrEqual(0);
        expect(section.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getVariationsForPIL', () => {
    it('should return all variations for a PIL', async () => {
      const pil = pilRepository.create({
        productName: 'Product D',
        market: 'TFDA',
        status: 'approved',
        sourceType: 'innovator',
      });
      await pilRepository.save(pil);

      // Create multiple variations
      for (let i = 0; i < 3; i++) {
        const announcement = announcementRepository.create({
          authority: 'TFDA',
          announcementId: `TFDA-2024-00${i + 4}`,
          publishedAt: new Date(),
          affectedProducts: ['Product D'],
          sourceUrl: `https://tfda.gov.tw/announcement/00${i + 4}`,
          content: `Variation ${i + 1}`,
          metadata: { nlpConfidence: 85 },
        });
        await announcementRepository.save(announcement);

        await service.generateVariationDiff(announcement.id, pil.id);
      }

      const variations = await service.getVariationsForPIL(pil.id);

      expect(variations.length).toBe(3);
      expect(variations[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        variations[1].createdAt.getTime()
      );
    });
  });
});