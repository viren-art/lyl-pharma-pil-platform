import { AnnouncementParserService } from '../../../src/services/nlp/announcement-parser/announcement-parser.service';
import { AppDataSource } from '../../../src/config/database';
import { RegulatoryAnnouncement } from '../../../src/models/announcement.model';
import { PIL } from '../../../src/models/pil.model';

describe('AnnouncementParserService', () => {
  let service: AnnouncementParserService;
  let announcementRepository: any;
  let pilRepository: any;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new AnnouncementParserService();
    announcementRepository = AppDataSource.getRepository(RegulatoryAnnouncement);
    pilRepository = AppDataSource.getRepository(PIL);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('parseAndMatchAnnouncement', () => {
    it('should complete variation detection within 5 minutes (TC-026)', async () => {
      // Create test announcement
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TEST-001',
        publishedAt: new Date(),
        title: '藥品仿單變更通知',
        summary: '衛署藥製字第123456號 產品需更新仿單',
        sourceUrl: 'https://test.com/announcement/1',
        affectedProducts: ['衛署藥製字第123456號'],
      });
      await announcementRepository.save(announcement);

      // Create matching PIL
      const pil = pilRepository.create({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'approved',
        sourceType: 'innovator',
        regulatoryRefNumber: '衛署藥製字第123456號',
        createdBy: 1,
      });
      await pilRepository.save(pil);

      const startTime = Date.now();
      const matches = await service.parseAndMatchAnnouncement(announcement.id);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(5 * 60 * 1000); // 5 minutes
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].pilId).toBe(pil.id);
      expect(matches[0].matchConfidence).toBeGreaterThanOrEqual(50);
    });

    it('should match announcements to affected PILs with <15% false positive rate', async () => {
      // Create 10 test announcements with known matches
      const testCases = [];
      for (let i = 0; i < 10; i++) {
        const announcement = announcementRepository.create({
          authority: 'TFDA',
          announcementId: `TEST-FP-${i}`,
          publishedAt: new Date(),
          title: `測試公告 ${i}`,
          summary: `衛署藥製字第${100000 + i}號 需更新`,
          sourceUrl: `https://test.com/${i}`,
          affectedProducts: [`衛署藥製字第${100000 + i}號`],
        });
        await announcementRepository.save(announcement);

        const pil = pilRepository.create({
          productName: `Test Product ${i}`,
          market: 'TFDA',
          status: 'approved',
          sourceType: 'innovator',
          regulatoryRefNumber: `衛署藥製字第${100000 + i}號`,
          createdBy: 1,
        });
        await pilRepository.save(pil);

        testCases.push({ announcement, pil });
      }

      // Add 5 non-matching PILs
      for (let i = 0; i < 5; i++) {
        const pil = pilRepository.create({
          productName: `Unrelated Product ${i}`,
          market: 'TFDA',
          status: 'approved',
          sourceType: 'innovator',
          regulatoryRefNumber: `衛署藥製字第${200000 + i}號`,
          createdBy: 1,
        });
        await pilRepository.save(pil);
      }

      let falsePositives = 0;
      let totalMatches = 0;

      for (const testCase of testCases) {
        const matches = await service.parseAndMatchAnnouncement(testCase.announcement.id);
        totalMatches += matches.length;

        // Count false positives (matches that don't include the correct PIL)
        const correctMatch = matches.find((m) => m.pilId === testCase.pil.id);
        if (!correctMatch && matches.length > 0) {
          falsePositives += matches.length;
        }
      }

      const falsePositiveRate = (falsePositives / totalMatches) * 100;
      expect(falsePositiveRate).toBeLessThan(15);
    });

    it('should log announcements with no affected PILs (TC-036)', async () => {
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TEST-NO-MATCH',
        publishedAt: new Date(),
        title: '一般性公告',
        summary: '不涉及特定產品的公告',
        sourceUrl: 'https://test.com/general',
        affectedProducts: [],
      });
      await announcementRepository.save(announcement);

      const matches = await service.parseAndMatchAnnouncement(announcement.id);

      expect(matches.length).toBe(0);

      const updated = await announcementRepository.findOne({
        where: { id: announcement.id },
      });
      expect(updated!.hasAffectedPILs).toBe(false);
      expect(updated!.matchedPILCount).toBe(0);

      const noPILAnnouncements = await service.getAnnouncementsWithNoPILs();
      expect(noPILAnnouncements.some((a) => a.id === announcement.id)).toBe(true);
    });
  });

  describe('NLP entity extraction', () => {
    it('should extract product names with high confidence', async () => {
      const announcement = announcementRepository.create({
        authority: 'TFDA',
        announcementId: 'TEST-NLP-001',
        publishedAt: new Date(),
        title: '【Aspirin】和【Ibuprofen】仿單變更',
        summary: '衛署藥製字第111111號 和 衛署藥製字第222222號',
        sourceUrl: 'https://test.com/nlp',
        affectedProducts: [],
      });
      await announcementRepository.save(announcement);

      const matches = await service.parseAndMatchAnnouncement(announcement.id);

      const updated = await announcementRepository.findOne({
        where: { id: announcement.id },
      });
      expect(updated!.metadata?.nlpConfidence).toBeGreaterThanOrEqual(50);
    });
  });
});