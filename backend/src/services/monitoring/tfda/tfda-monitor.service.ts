import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseMonitorService, AnnouncementFeedItem, MonitorConfig } from '../base-monitor.service';
import { logger } from '../../../utils/logger';

export class TFDAMonitorService extends BaseMonitorService {
  constructor() {
    super({
      authority: 'TFDA',
      pollingIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
      webhookEnabled: true,
      feedUrl: process.env.TFDA_FEED_URL || 'https://www.fda.gov.tw/TC/newsContent.aspx',
      apiKey: process.env.TFDA_API_KEY,
    });
  }

  /**
   * Poll TFDA announcements from RSS/HTML feed
   */
  protected async pollAnnouncements(): Promise<void> {
    try {
      logger.info('Polling TFDA announcements', { feedUrl: this.config.feedUrl });

      const response = await axios.get(this.config.feedUrl!, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Lotus-PIL-Platform/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
        },
      });

      // Parse HTML using cheerio (TFDA doesn't provide structured API)
      const $ = cheerio.load(response.data);
      const announcements: AnnouncementFeedItem[] = [];

      // TFDA announcement structure (example selector - adjust based on actual HTML)
      $('.news-item').each((index, element) => {
        try {
          const $item = $(element);
          const announcementId = $item.attr('data-id') || `TFDA-${Date.now()}-${index}`;
          const title = $item.find('.news-title').text().trim();
          const dateStr = $item.find('.news-date').text().trim();
          const link = $item.find('a').attr('href');
          const summary = $item.find('.news-summary').text().trim();

          // Parse TFDA date format (e.g., "112年12月15日" - ROC calendar)
          const publishedAt = this.parseTFDADate(dateStr);

          // Extract affected products from title/summary
          const affectedProducts = this.extractAffectedProducts(title + ' ' + summary);

          announcements.push({
            announcementId,
            publishedAt,
            title,
            summary,
            sourceUrl: link ? `https://www.fda.gov.tw${link}` : this.config.feedUrl!,
            affectedProducts,
            rawContent: $item.html() || '',
          });
        } catch (error) {
          logger.error('Failed to parse TFDA announcement item', { error, index });
        }
      });

      logger.info(`Found ${announcements.length} TFDA announcements`);

      // Process each announcement
      for (const announcement of announcements) {
        await this.processAnnouncement(announcement);
      }
    } catch (error) {
      logger.error('Failed to poll TFDA announcements', { error });
    }
  }

  /**
   * Parse TFDA announcement from webhook payload
   */
  protected parseAnnouncement(rawData: any): AnnouncementFeedItem {
    // TFDA webhook payload structure (adjust based on actual format)
    return {
      announcementId: rawData.id || rawData.announcementId,
      publishedAt: new Date(rawData.publishDate || rawData.publishedAt),
      title: rawData.title,
      summary: rawData.content || rawData.summary,
      sourceUrl: rawData.url || rawData.link,
      affectedProducts: rawData.affectedProducts || this.extractAffectedProducts(rawData.content),
      rawContent: JSON.stringify(rawData),
    };
  }

  /**
   * Parse TFDA date format (ROC calendar: 民國年)
   * Example: "112年12月15日" → 2023-12-15
   */
  private parseTFDADate(dateStr: string): Date {
    try {
      const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
      if (match) {
        const rocYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        const gregorianYear = rocYear + 1911; // ROC year 112 = 2023
        return new Date(gregorianYear, month - 1, day);
      }
    } catch (error) {
      logger.error('Failed to parse TFDA date', { dateStr, error });
    }
    return new Date();
  }

  /**
   * Extract affected products from announcement text
   * Looks for registration numbers, product names, therapeutic categories
   */
  private extractAffectedProducts(text: string): string[] {
    const products: string[] = [];

    // TFDA registration number pattern: 衛署藥製字第XXXXXX號
    const regNumberPattern = /衛署藥[製輸]字第\d{6}號/g;
    const regNumbers = text.match(regNumberPattern);
    if (regNumbers) {
      products.push(...regNumbers);
    }

    // Product name pattern (Traditional Chinese pharmaceutical names)
    const productNamePattern = /【([^】]+)】/g;
    let match;
    while ((match = productNamePattern.exec(text)) !== null) {
      products.push(match[1]);
    }

    return [...new Set(products)]; // Remove duplicates
  }

  /**
   * Fetch full announcement details from TFDA website
   */
  async fetchAnnouncementDetails(announcementId: string): Promise<any> {
    try {
      const announcement = await this.repository.findOne({
        where: { authority: 'TFDA', announcementId },
      });

      if (!announcement) {
        throw new Error(`Announcement ${announcementId} not found`);
      }

      // Fetch full content from source URL
      const response = await axios.get(announcement.sourceUrl, {
        timeout: 30000,
        headers: { 'User-Agent': 'Lotus-PIL-Platform/1.0' },
      });

      const $ = cheerio.load(response.data);
      const fullContent = $('.announcement-content').html() || '';

      // Update announcement with full content
      announcement.metadata = {
        ...announcement.metadata,
        rawContent: fullContent,
        parsedSections: this.parseAnnouncementSections($),
      };

      await this.repository.save(announcement);

      return announcement;
    } catch (error) {
      logger.error('Failed to fetch TFDA announcement details', {
        error,
        announcementId,
      });
      throw error;
    }
  }

  /**
   * Parse announcement sections (background, requirements, effective date, etc.)
   */
  private parseAnnouncementSections($: cheerio.CheerioAPI): Record<string, string> {
    return {
      background: $('.section-background').text().trim(),
      requirements: $('.section-requirements').text().trim(),
      effectiveDate: $('.section-effective-date').text().trim(),
      affectedProducts: $('.section-affected-products').text().trim(),
      references: $('.section-references').text().trim(),
    };
  }
}