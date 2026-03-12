import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { BaseMonitorService, AnnouncementFeedItem, MonitorConfig } from '../base-monitor.service';
import { logger } from '../../../utils/logger';

const parseXML = promisify(parseString);

export class FDAThailandMonitorService extends BaseMonitorService {
  constructor() {
    super({
      authority: 'FDA_Thailand',
      pollingIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
      webhookEnabled: false, // FDA Thailand typically uses RSS
      feedUrl: process.env.FDA_THAILAND_RSS_URL || 'https://www.fda.moph.go.th/sites/drug/rss.xml',
      apiKey: process.env.FDA_THAILAND_API_KEY,
    });
  }

  /**
   * Poll FDA Thailand announcements from RSS feed
   */
  protected async pollAnnouncements(): Promise<void> {
    try {
      logger.info('Polling FDA Thailand announcements', { feedUrl: this.config.feedUrl });

      const response = await axios.get(this.config.feedUrl!, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Lotus-PIL-Platform/1.0',
          'Accept': 'application/rss+xml,application/xml,text/xml',
        },
      });

      // Parse RSS XML
      const parsed: any = await parseXML(response.data);
      const items = parsed.rss?.channel?.[0]?.item || [];

      logger.info(`Found ${items.length} FDA Thailand RSS items`);

      const announcements: AnnouncementFeedItem[] = [];

      for (const item of items) {
        try {
          const announcementId = this.extractAnnouncementId(item);
          const title = item.title?.[0] || '';
          const description = item.description?.[0] || '';
          const link = item.link?.[0] || this.config.feedUrl!;
          const pubDate = new Date(item.pubDate?.[0] || Date.now());

          // Extract affected products from Thai text
          const affectedProducts = this.extractAffectedProducts(title + ' ' + description);

          announcements.push({
            announcementId,
            publishedAt: pubDate,
            title,
            summary: description,
            sourceUrl: link,
            affectedProducts,
            rawContent: JSON.stringify(item),
          });
        } catch (error) {
          logger.error('Failed to parse FDA Thailand RSS item', { error, item });
        }
      }

      // Process each announcement
      for (const announcement of announcements) {
        await this.processAnnouncement(announcement);
      }
    } catch (error) {
      logger.error('Failed to poll FDA Thailand announcements', { error });
    }
  }

  /**
   * Parse FDA Thailand announcement from webhook/API payload
   */
  protected parseAnnouncement(rawData: any): AnnouncementFeedItem {
    return {
      announcementId: rawData.id || rawData.guid || `FDA-TH-${Date.now()}`,
      publishedAt: new Date(rawData.pubDate || rawData.publishedAt || Date.now()),
      title: rawData.title,
      summary: rawData.description || rawData.summary,
      sourceUrl: rawData.link || rawData.url,
      affectedProducts: rawData.affectedProducts || this.extractAffectedProducts(rawData.description),
      rawContent: JSON.stringify(rawData),
    };
  }

  /**
   * Extract announcement ID from RSS item
   */
  private extractAnnouncementId(item: any): string {
    // Try GUID first
    if (item.guid?.[0]?._) {
      return item.guid[0]._;
    }
    if (item.guid?.[0]) {
      return item.guid[0];
    }

    // Extract from link
    const link = item.link?.[0] || '';
    const match = link.match(/id=(\d+)/);
    if (match) {
      return `FDA-TH-${match[1]}`;
    }

    // Fallback to hash of title + date
    const title = item.title?.[0] || '';
    const date = item.pubDate?.[0] || '';
    return `FDA-TH-${Buffer.from(title + date).toString('base64').substring(0, 16)}`;
  }

  /**
   * Extract affected products from Thai text
   * Looks for registration numbers, product names in Thai script
   */
  private extractAffectedProducts(text: string): string[] {
    const products: string[] = [];

    // FDA Thailand registration number pattern: ทะเบียนยาเลขที่ XXXXX
    const regNumberPattern = /ทะเบียนยาเลขที่\s*[\dก-๙]+/g;
    const regNumbers = text.match(regNumberPattern);
    if (regNumbers) {
      products.push(...regNumbers);
    }

    // Product name pattern (Thai pharmaceutical names in brackets)
    const productNamePattern = /\(([ก-๙เ-์\s]+)\)/g;
    let match;
    while ((match = productNamePattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3) { // Filter out short matches
        products.push(name);
      }
    }

    // Generic drug names (often in English within Thai text)
    const genericNamePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    while ((match = genericNamePattern.exec(text)) !== null) {
      const name = match[1];
      if (name.length > 4 && !['Thailand', 'Ministry', 'Health'].includes(name)) {
        products.push(name);
      }
    }

    return [...new Set(products)]; // Remove duplicates
  }

  /**
   * Fetch full announcement details from FDA Thailand website
   */
  async fetchAnnouncementDetails(announcementId: string): Promise<any> {
    try {
      const announcement = await this.repository.findOne({
        where: { authority: 'FDA_Thailand', announcementId },
      });

      if (!announcement) {
        throw new Error(`Announcement ${announcementId} not found`);
      }

      // Fetch full content from source URL
      const response = await axios.get(announcement.sourceUrl, {
        timeout: 30000,
        headers: { 'User-Agent': 'Lotus-PIL-Platform/1.0' },
      });

      // Update announcement with full content
      announcement.metadata = {
        ...announcement.metadata,
        rawContent: response.data,
      };

      await this.repository.save(announcement);

      return announcement;
    } catch (error) {
      logger.error('Failed to fetch FDA Thailand announcement details', {
        error,
        announcementId,
      });
      throw error;
    }
  }
}