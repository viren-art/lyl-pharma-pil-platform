import { Request, Response } from 'express';
import { CollaborationService } from '../services/supplier/collaboration/collaboration.service';
import { PerformanceService } from '../services/supplier/performance/performance.service';
import { CommentType } from '../models/revision-comment.model';
import { logger } from '../utils/logger';

export class SupplierCollaborationController {
  private collaborationService: CollaborationService;
  private performanceService: PerformanceService;

  constructor() {
    this.collaborationService = new CollaborationService();
    this.performanceService = new PerformanceService();
  }

  /**
   * POST /api/v1/supplier/revisions/:revisionRoundId/upload
   * Upload artwork revision
   */
  uploadArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
      const revisionRoundId = parseInt(req.params.revisionRoundId);
      const userId = (req as any).user?.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'Artwork file is required' } });
        return;
      }

      const { notes } = req.body;

      const artworkRevision = await this.collaborationService.uploadArtwork({
        revisionRoundId,
        file,
        uploadedBy: userId,
        notes,
      });

      res.status(201).json({
        id: artworkRevision.id,
        revisionRoundId: artworkRevision.revisionRoundId,
        versionNumber: artworkRevision.versionNumber,
        artworkPath: artworkRevision.artworkPath,
        visualDiffPath: artworkRevision.visualDiffPath,
        status: artworkRevision.status,
        createdAt: artworkRevision.createdAt,
      });
    } catch (error) {
      logger.error('Failed to upload artwork', { error });
      res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/supplier/revisions/:revisionRoundId/comments
   * Add comment to revision round
   */
  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const revisionRoundId = parseInt(req.params.revisionRoundId);
      const userId = (req as any).user?.id;
      const { artworkRevisionId, type, content, sectionReference, isInternal, parentCommentId } =
        req.body;

      const comment = await this.collaborationService.addComment({
        revisionRoundId,
        artworkRevisionId,
        type: type as CommentType,
        content,
        sectionReference,
        createdBy: userId,
        isInternal,
        parentCommentId,
      });

      res.status(201).json({
        id: comment.id,
        revisionRoundId: comment.revisionRoundId,
        artworkRevisionId: comment.artworkRevisionId,
        type: comment.type,
        content: comment.content,
        sectionReference: comment.sectionReference,
        isInternal: comment.isInternal,
        parentCommentId: comment.parentCommentId,
        createdAt: comment.createdAt,
      });
    } catch (error) {
      logger.error('Failed to add comment', { error });
      res.status(500).json({
        error: {
          code: 'COMMENT_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/supplier/revisions/:revisionRoundId
   * Get revision round details
   */
  getRevisionDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const revisionRoundId = parseInt(req.params.revisionRoundId);
      const userId = (req as any).user?.id;

      const details = await this.collaborationService.getRevisionRoundDetails(revisionRoundId, userId);

      res.status(200).json(details);
    } catch (error) {
      logger.error('Failed to get revision details', { error });
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/supplier/:supplierId/revisions
   * Get supplier's assigned revisions
   */
  getSupplierRevisions = async (req: Request, res: Response): Promise<void> => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      const { status } = req.query;

      const revisions = await this.collaborationService.getSupplierRevisions(
        supplierId,
        status as any
      );

      res.status(200).json({ revisions });
    } catch (error) {
      logger.error('Failed to get supplier revisions', { error });
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/supplier/revisions/:artworkRevisionId/approve
   * Approve artwork revision
   */
  approveArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
      const artworkRevisionId = parseInt(req.params.artworkRevisionId);
      const userId = (req as any).user?.id;
      const { comments } = req.body;

      const artworkRevision = await this.collaborationService.approveArtwork(
        artworkRevisionId,
        userId,
        comments
      );

      res.status(200).json({
        id: artworkRevision.id,
        status: artworkRevision.status,
        reviewedBy: artworkRevision.reviewedBy,
        reviewedAt: artworkRevision.reviewedAt,
      });
    } catch (error) {
      logger.error('Failed to approve artwork', { error });
      res.status(500).json({
        error: {
          code: 'APPROVAL_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * POST /api/v1/supplier/revisions/:artworkRevisionId/reject
   * Reject artwork revision
   */
  rejectArtwork = async (req: Request, res: Response): Promise<void> => {
    try {
      const artworkRevisionId = parseInt(req.params.artworkRevisionId);
      const userId = (req as any).user?.id;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          error: { code: 'REASON_REQUIRED', message: 'Rejection reason is required' },
        });
        return;
      }

      const artworkRevision = await this.collaborationService.rejectArtwork(
        artworkRevisionId,
        userId,
        reason
      );

      res.status(200).json({
        id: artworkRevision.id,
        status: artworkRevision.status,
        reviewedBy: artworkRevision.reviewedBy,
        reviewedAt: artworkRevision.reviewedAt,
      });
    } catch (error) {
      logger.error('Failed to reject artwork', { error });
      res.status(500).json({
        error: {
          code: 'REJECTION_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/supplier/:supplierId/performance
   * Get supplier performance metrics
   */
  getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      const { periodStart, periodEnd } = req.query;

      const start = periodStart ? new Date(periodStart as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = periodEnd ? new Date(periodEnd as string) : new Date();

      const metrics = await this.performanceService.getPerformanceMetrics(supplierId, start, end);

      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Failed to get performance metrics', { error });
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      });
    }
  };

  /**
   * GET /api/v1/supplier/rankings
   * Get supplier rankings
   */
  getSupplierRankings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;

      const start = periodStart ? new Date(periodStart as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = periodEnd ? new Date(periodEnd as string) : new Date();

      const rankings = await this.performanceService.getSupplierRankings(start, end);

      res.status(200).json({ rankings });
    } catch (error) {
      logger.error('Failed to get supplier rankings', { error });
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      });
    }
  };
}