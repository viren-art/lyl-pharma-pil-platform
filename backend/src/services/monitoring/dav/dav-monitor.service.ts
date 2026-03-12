import axios from 'axios';
import { BaseMonitorService, AnnouncementFeedItem, MonitorConfig } from '../base-monitor.service';
import { logger } from '../../../utils/logger';

export class DAVMonitorService extends BaseMonitorService {
  constructor() {
    super({
      authority: 'DAV',
      pollingIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
      webhookEnabled: false, // DAV typically uses manual announcements
      feedUrl: process.env.DAV_FEED_URL || 'https://dav.gov.vn/thong-bao',
      apiKey: process.env.DAV_API_KEY,
    });
  }

  /**
   * Poll DAV announcements from website/API
   */
  protected async pollAnnouncements(): Promise<void> {
    try {
      logger.info('Polling DAV announcements', { feedUrl: this.config.feedUrl });

      // DAV may provide JSON API or require HTML scraping
      const response = await axios.get(this.config.feedUrl!, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Lotus-PIL-Platform/1.0',
          'Accept': 'application/json,text/html',
        },
      });

      let announcements: AnnouncementFeedItem[] = [];

      // Try parsing as JSON first
      if (response.headers['content-type']?.includes('application/json')) {
        announcements = this.parseJSONFeed(response.data);
      } else {
        // Fallback to HTML parsing (simplified - would use cheerio in production)
        announcements = this.parseHTMLFeed(response.data);
      }

      logger.info(`Found ${announcements.length} DAV announcements`);

      // Process each announcement
      for (const announcement of announcements) {
        await this.processAnnouncement(announcement);
      }
    } catch (error) {
      logger.error('Failed to poll DAV announcements', { error });
    }
  }

  /**
   * Parse DAV announcement from webhook/API payload
   */
  protected parseAnnouncement(rawData: any): AnnouncementFeedItem {
    return {
      announcementId: rawData.id || rawData.soVanBan || `DAV-${Date.now()}`,
      publishedAt: new Date(rawData.ngayBanHanh || rawData.publishedAt || Date.now()),
      title: rawData.tieuDe || rawData.title,
      summary: rawData.tomTat || rawData.summary,
      sourceUrl: rawData.url || rawData.link || this.config.feedUrl!,
      affectedProducts: rawData.affectedProducts || this.extractAffectedProducts(rawData.tomTat || ''),
      rawContent: JSON.stringify(rawData),
    };
  }

  /**
   * Parse JSON feed from DAV API
   */
  private parseJSONFeed(data: any): AnnouncementFeedItem[] {
    const items = Array.isArray(data) ? data : data.items || data.announcements || [];

    return items.map((item: any) => ({
      announcementId: item.id || item.soVanBan || `DAV-${Date.now()}`,
      publishedAt: new Date(item.ngayBanHanh || item.publishedAt || Date.now()),
      title: item.tieuDe || item.title,
      summary: item.tomTat || item.summary,
      sourceUrl: item.url || item.link || this.config.feedUrl!,
      affectedProducts: this.extractAffectedProducts(item.tomTat || item.summary || ''),
      rawContent: JSON.stringify(item),
    }));
  }

  /**
   * Parse HTML feed (simplified version)
   */
  private parseHTMLFeed(html: string): AnnouncementFeedItem[] {
    // In production, would use cheerio for proper HTML parsing
    // This is a simplified regex-based approach
    const announcements: AnnouncementFeedItem[] = [];

    // Extract announcement blocks (adjust regex based on actual HTML structure)
    const blockPattern = /<div class="announcement-item"[^>]*>(.*?)<\/div>/gs;
    const matches = html.matchAll(blockPattern);

    for (const match of matches) {
      const block = match[1];
      
      const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
      const dateMatch = block.match(/(\d{2}\/\d{2}\/\d{4})/);
      const linkMatch = block.match(/href="([^"]+)"/);

      if (titleMatch) {
        announcements.push({
          announcementId: `DAV-${Date.now()}-${announcements.length}`,
          publishedAt: dateMatch ? this.parseVietnameseDate(dateMatch[1]) : new Date(),
          title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
          summary: '',
          sourceUrl: linkMatch ? `https://dav.gov.vn${linkMatch[1]}` : this.config.feedUrl!,
          affectedProducts: [],
          rawContent: block,
        });
      }
    }

    return announcements;
  }

  /**
   * Parse Vietnamese date format (DD/MM/YYYY)
   */
  private parseVietnameseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Extract affected products from Vietnamese text
   * Looks for registration numbers, product names in Vietnamese
   */
  private extractAffectedProducts(text: string): string[] {
    const products: string[] = [];

    // DAV registration number pattern: VD-XXXXX-XX
    const regNumberPattern = /VD-\d{5}-\d{2}/g;
    const regNumbers = text.match(regNumberPattern);
    if (regNumbers) {
      products.push(...regNumbers);
    }

    // Product name pattern (Vietnamese pharmaceutical names)
    const productNamePattern = /thuốc\s+([A-Za-zÀ-ỹ\s]+)/gi;
    let match;
    while ((match = productNamePattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3) {
        products.push(name);
      }
    }

    // Generic drug names (often in English)
    const genericNamePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    while ((match = genericNamePattern.exec(text)) !== null) {
      const name = match[1];
      if (name.length > 4 && !['Vietnam', 'Ministry', 'Health'].includes(name)) {
        products.push(name);
      }
    }

    return [...new Set(products)]; // Remove duplicates
  }

  /**
   * Fetch full announcement details from DAV website
   */
  async fetchAnnouncementDetails(announcementId: string): Promise<any> {
    try {
      const announcement = await this.repository.findOne({
        where: { authority: 'DAV', announcementId },
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
      logger.error('Failed to fetch DAV announcement details', {
        error,
        announcementId,
      });
      throw error;
    }
  }
}