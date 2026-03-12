import { FDAThailandMonitorService } from '../../../src/services/monitoring/fda-thailand/fda-thailand-monitor.service';
import { AppDataSource } from '../../../src/config/database';
import { RegulatoryAnnouncement } from '../../../src/models/announcement.model';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FDAThailandMonitorService', () => {
  let service: FDAThailandMonitorService;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(() => {
    service = new FDAThailandMonitorService();
  });

  afterEach(() => {
    service.stopPolling();
  });

  describe('pollAnnouncements', () => {
    it('should detect FDA Thailand announcements within 48 hours (TC-013)', async () => {
      const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <guid>FDA-TH-2024-001</guid>
              <title>ประกาศเรื่องการเปลี่ยนแปลงเอกสารกำกับยา</title>
              <description>ทะเบียนยาเลขที่ 12345 ต้องปรับปรุงเอกสาร</description>
              <link>https://www.fda.moph.go.th/announcement/12345</link>
              <pubDate>Mon, 15 Jan 2024 10:00:00 +0700</pubDate>
            </item>
          </channel>
        </rss>`;

      mockedAxios.get.mockResolvedValue({ data: mockRSS });

      await service.startPolling();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const repository = AppDataSource.getRepository(RegulatoryAnnouncement);
      const announcements = await repository.find({
        where: { authority: 'FDA_Thailand' },
      });

      expect(announcements.length).toBeGreaterThan(0);
      expect(announcements[0].authority).toBe('FDA_Thailand');
      expect(announcements[0].affectedProducts.length).toBeGreaterThan(0);
    });

    it('should extract Thai registration numbers correctly', async () => {
      const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <guid>FDA-TH-2024-002</guid>
              <title>การแก้ไขเอกสารกำกับยา</title>
              <description>ทะเบียนยาเลขที่ 67890 และ ทะเบียนยาเลขที่ 11111</description>
              <link>https://www.fda.moph.go.th/announcement/67890</link>
              <pubDate>Tue, 16 Jan 2024 14:30:00 +0700</pubDate>
            </item>
          </channel>
        </rss>`;

      mockedAxios.get.mockResolvedValue({ data: mockRSS });

      await service.startPolling();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const repository = AppDataSource.getRepository(RegulatoryAnnouncement);
      const announcement = await repository.findOne({
        where: { announcementId: 'FDA-TH-2024-002' },
      });

      expect(announcement).toBeDefined();
      expect(announcement!.affectedProducts).toContain('ทะเบียนยาเลขที่ 67890');
      expect(announcement!.affectedProducts).toContain('ทะเบียนยาเลขที่ 11111');
    });
  });
});