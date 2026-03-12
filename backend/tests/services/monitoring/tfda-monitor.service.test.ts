import { TFDAMonitorService } from '../../../src/services/monitoring/tfda/tfda-monitor.service';
import { AppDataSource } from '../../../src/config/database';
import { RegulatoryAnnouncement } from '../../../src/models/announcement.model';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TFDAMonitorService', () => {
  let service: TFDAMonitorService;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(() => {
    service = new TFDAMonitorService();
  });

  afterEach(() => {
    service.stopPolling();
  });

  describe('pollAnnouncements', () => {
    it('should detect TFDA announcements within 48 hours (TC-012)', async () => {
      // Mock TFDA HTML response
      const mockHTML = `
        <div class="news-item" data-id="TFDA-2024-001">
          <div class="news-title">藥品仿單變更通知</div>
          <div class="news-date">112年12月15日</div>
          <div class="news-summary">衛署藥製字第123456號 產品需更新仿單</div>
          <a href="/announcement/123">詳細內容</a>
        </div>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHTML });

      await service.startPolling();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for initial poll

      const repository = AppDataSource.getRepository(RegulatoryAnnouncement);
      const announcements = await repository.find({
        where: { authority: 'TFDA' },
      });

      expect(announcements.length).toBeGreaterThan(0);
      expect(announcements[0].authority).toBe('TFDA');
      expect(announcements[0].affectedProducts).toContain('衛署藥製字第123456號');
    });

    it('should parse TFDA ROC date format correctly', async () => {
      const mockHTML = `
        <div class="news-item" data-id="TFDA-2024-002
        <div class="news-item" data-id="TFDA-2024-002">
          <div class="news-title">藥品安全性通知</div>
          <div class="news-date">113年1月20日</div>
          <div class="news-summary">測試公告</div>
          <a href="/announcement/124">詳細內容</a>
        </div>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHTML });

      await service.startPolling();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const repository = AppDataSource.getRepository(RegulatoryAnnouncement);
      const announcement = await repository.findOne({
        where: { announcementId: 'TFDA-2024-002' },
      });

      expect(announcement).toBeDefined();
      expect(announcement!.publishedAt.getFullYear()).toBe(2024); // ROC 113 = 2024
      expect(announcement!.publishedAt.getMonth()).toBe(0); // January
      expect(announcement!.publishedAt.getDate()).toBe(20);
    });
  });

  describe('handleWebhook', () => {
    it('should process TFDA webhook payload', async () => {
      const webhookPayload = {
        id: 'TFDA-WEBHOOK-001',
        publishDate: '2024-01-15T10:00:00Z',
        title: '藥品仿單變更通知',
        content: '衛署藥製字第789012號 需更新仿單內容',
        url: 'https://www.fda.gov.tw/announcement/789012',
      };

      const announcement = await service.handleWebhook(webhookPayload);

      expect(announcement).toBeDefined();
      expect(announcement!.authority).toBe('TFDA');
      expect(announcement!.announcementId).toBe('TFDA-WEBHOOK-001');
      expect(announcement!.metadata?.webhookSource).toBe('direct');
    });
  });
});