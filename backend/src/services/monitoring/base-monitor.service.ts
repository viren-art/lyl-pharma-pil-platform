import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { RegulatoryAnnouncement, RegulatoryAuthority } from '../../models/announcement.model';
import { AuditLogger } from '../audit/audit-logger.enhanced';
import { logger } from '../../utils/logger';

export interface AnnouncementFeedItem {
  announcementId: string;
  publishedAt: Date;
  title?: string;
  summary?: string;
  sourceUrl: string;
  affectedProducts?: string[];
  rawContent?: string;
}

export interface MonitorConfig {
  authority: RegulatoryAuthority;
  pollingIntervalMs: number;
  webhookEnabled: boolean;
  feedUrl?: string;
  apiKey?: string;
}

export abstract class BaseMonitorService {
  protected repository: Repository<RegulatoryAnnouncement>;
  protected auditLogger: AuditLogger;
  protected config: MonitorConfig;
  protected isPolling: boolean = false;
  protected pollingTimer?: NodeJS.Timeout;

  constructor(config: MonitorConfig) {
    this.repository = AppDataSource.getRepository(RegulatoryAnnouncement);
    this.auditLogger = new AuditLogger();
    this.config = config;
  }

  /**
   * Start polling for announcements (fallback when webhooks unavailable)
   */
  async startPolling(): Promise<void> {
    if (this.isPolling) {
      logger.warn(`${this.config.authority} monitor already polling`);
      return;
    }

    this.isPolling = true;
    logger.info(`Starting ${this.config.authority} announcement polling`, {
      intervalMs: this.config.pollingIntervalMs,
    });

    // Initial poll
    await this.pollAnnouncements();

    // Schedule recurring polls
    this.pollingTimer = setInterval(
      () => this.pollAnnouncements(),
      this.config.pollingIntervalMs
    );
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
    this.isPolling = false;
    logger.info(`Stopped ${this.config.authority} announcement polling`);
  }

  /**
   * Poll announcements from feed (implemented by subclasses)
   */
  protected abstract pollAnnouncements(): Promise<void>;

  /**
   * Parse announcement from feed (implemented by subclasses)
   */
  protected abstract parseAnnouncement(rawData: any): AnnouncementFeedItem;

  /**
   * Process and store announcement
   */
  protected async processAnnouncement(
    feedItem: AnnouncementFeedItem
  ): Promise<RegulatoryAnnouncement | null> {
    try {
      // Check if announcement already exists
      const existing = await this.repository.findOne({
        where: {
          authority: this.config.authority,
          announcementId: feedItem.announcementId,
        },
      });

      if (existing) {
        logger.debug(`Announcement ${feedItem.announcementId} already processed`);
        return existing;
      }

      // Create new announcement record
      const announcement = this.repository.create({
        authority: this.config.authority,
        announcementId: feedItem.announcementId,
        publishedAt: feedItem.publishedAt,
        title: feedItem.title,
        summary: feedItem.summary,
        sourceUrl: feedItem.sourceUrl,
        affectedProducts: feedItem.affectedProducts || [],
        metadata: {
          rawContent: feedItem.rawContent,
          pollingSource: this.config.feedUrl,
        },
        processedAt: new Date(),
      });

      const saved = await this.repository.save(announcement);

      // Log audit event
      await this.auditLogger.logEvent({
        entityType: 'regulatory_announcement',
        entityId: saved.id,
        action: 'announcement_detected',
        userId: null, // System action
        afterState: {
          authority: saved.authority,
          announcementId: saved.announcementId,
          publishedAt: saved.publishedAt,
          affectedProducts: saved.affectedProducts,
        },
        metadata: {
          source: 'polling',
          feedUrl: this.config.feedUrl,
        },
      });

      logger.info(`Processed new ${this.config.authority} announcement`, {
        announcementId: saved.announcementId,
        publishedAt: saved.publishedAt,
        affectedProductsCount: saved.affectedProducts.length,
      });

      return saved;
    } catch (error) {
      logger.error(`Failed to process ${this.config.authority} announcement`, {
        error,
        announcementId: feedItem.announcementId,
      });
      return null;
    }
  }

  /**
   * Handle webhook payload (common logic)
   */
  async handleWebhook(payload: any): Promise<RegulatoryAnnouncement | null> {
    try {
      const feedItem = this.parseAnnouncement(payload);
      const announcement = await this.processAnnouncement(feedItem);

      if (announcement) {
        // Update metadata to indicate webhook source
        announcement.metadata = {
          ...announcement.metadata,
          webhookSource: 'direct',
        };
        await this.repository.save(announcement);
      }

      return announcement;
    } catch (error) {
      logger.error(`Failed to handle ${this.config.authority} webhook`, {
        error,
        payload,
      });
      return null;
    }
  }

  /**
   * Get recent announcements
   */
  async getRecentAnnouncements(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ announcements: RegulatoryAnnouncement[]; total: number }> {
    const [announcements, total] = await this.repository.findAndCount({
      where: { authority: this.config.authority },
      order: { publishedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { announcements, total };
  }
}