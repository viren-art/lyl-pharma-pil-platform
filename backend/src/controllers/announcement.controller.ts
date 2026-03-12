import { Request, Response } from 'express';
import { TFDAMonitorService } from '../services/monitoring/tfda/tfda-monitor.service';
import { FDAThailandMonitorService } from '../services/monitoring/fda-thailand/fda-thailand-monitor.service';
import { DAVMonitorService } from '../services/monitoring/dav/dav-monitor.service';
import { AnnouncementParserService } from '../services/nlp/announcement-parser/announcement-parser.service';
import { logger } from '../utils/logger';

export class AnnouncementController {
  private tfdaMonitor: TFDAMonitorService;
  private fdaThailandMonitor: FDAThailandMonitorService;
  private davMonitor: DAVMonitorService;
  private parserService: AnnouncementParserService;

  constructor() {
    this.tfdaMonitor = new TFDAMonitorService();
    this.fdaThailandMonitor = new FDAThailandMonitorService();
    this.davMonitor = new DAVMonitorService();
    this.parserService = new AnnouncementParserService();
  }

  /**
   * GET /api/v1/announcements
   * List announcements with filtering
   */
  async listAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const {
        authority,
        fromDate,
        toDate,
        limit = 50,
        offset = 0,
      } = req.query;

      let service;
      switch (authority) {
        case 'TFDA':
          service = this.tfdaMonitor;
          break;
        case 'FDA_Thailand':
          service = this.fdaThailandMonitor;
          break;
        case 'DAV':
          service = this.davMonitor;
          break;
        default:
          res.status(400).json({
            error: {
              code: 'INVALID_AUTHORITY',
              message: 'Authority must be TFDA, FDA_Thailand, or DAV',
            },
          });
          return;
      }

      const result = await service.getRecentAnnouncements(
        Number(limit),
        Number(offset)
      );

      res.json({
        announcements: result.announcements,
        total: result.total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      logger.error('Failed to list announcements', { error });
      res.status(500).json({
        error: {
          code: 'ANNOUNCEMENT_LIST_FAILED',
          message: 'Failed to retrieve announcements',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/v1/announcements/webhook
   * Handle webhook from regulatory authority
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { authority } = req.body;

      let service;
      switch (authority) {
        case 'TFDA':
          service = this.tfdaMonitor;
          break;
        case 'FDA_Thailand':
          service = this.fdaThailandMonitor;
          break;
        case 'DAV':
          service = this.davMonitor;
          break;
        default:
          res.status(400).json({
            error: {
              code: 'INVALID_AUTHORITY',
              message: 'Authority must be TFDA, FDA_Thailand, or DAV',
            },
          });
          return;
      }

      const announcement = await service.handleWebhook(req.body);

      if (announcement) {
        // Trigger async PIL matching
        this.parserService
          .parseAndMatchAnnouncement(announcement.id)
          .catch((error) => {
            logger.error('Failed to parse announcement', {
              error,
              announcementId: announcement.id,
            });
          });

        res.json({
          received: true,
          processedAt: new Date().toISOString(),
          announcementId: announcement.id,
        });
      } else {
        res.status(400).json({
          error: {
            code: 'WEBHOOK_PROCESSING_FAILED',
            message: 'Failed to process webhook payload',
          },
        });
      }
    } catch (error) {
      logger.error('Failed to handle webhook', { error });
      res.status(500).json({
        error: {
          code: 'WEBHOOK_FAILED',
          message: 'Failed to handle webhook',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/v1/announcements/:id/parse
   * Manually trigger announcement parsing and PIL matching
   */
  async parseAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const announcementId = parseInt(req.params.id);

      const matches = await this.parserService.parseAndMatchAnnouncement(
        announcementId
      );

      res.json({
        announcementId,
        matchedPILs: matches.length,
        matches: matches.map((m) => ({
          pilId: m.pilId,
          productName: m.productName,
          matchConfidence: m.matchConfidence,
          matchReasons: m.matchReasons,
        })),
      });
    } catch (error) {
      logger.error('Failed to parse announcement', { error });
      res.status(500).json({
        error: {
          code: 'ANNOUNCEMENT_PARSE_FAILED',
          message: 'Failed to parse announcement',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/v1/announcements/no-pils
   * Get announcements with no affected PILs (TC-036)
   */
  async getAnnouncementsWithNoPILs(req: Request, res: Response): Promise<void> {
    try {
      const announcements = await this.parserService.getAnnouncementsWithNoPILs();

      res.json({
        announcements: announcements.map((a) => ({
          id: a.id,
          authority: a.authority,
          announcementId: a.announcementId,
          publishedAt: a.publishedAt,
          title: a.title,
          summary: a.summary,
          sourceUrl: a.sourceUrl,
        })),
        total: announcements.length,
      });
    } catch (error) {
      logger.error('Failed to get announcements with no PILs', { error });
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve announcements',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}