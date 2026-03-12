import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { RevisionRound, RevisionStatus } from '../../../models/revision-round.model';
import { ArtworkRevision, ArtworkStatus } from '../../../models/artwork-revision.model';
import { RevisionComment, CommentType } from '../../../models/revision-comment.model';
import { PIL } from '../../../models/pil.model';
import { User } from '../../../models/user.model';
import { Supplier } from '../../../models/supplier.model';
import { AuditLogger } from '../../audit/audit-logger.enhanced';
import { NotificationService } from '../../notification/notification.service';
import { S3Service } from '../../storage/s3.service';
import { VisualDiffService } from './visual-diff.service';
import { logger } from '../../../utils/logger';

interface UploadArtworkRequest {
  revisionRoundId: number;
  file: Express.Multer.File;
  uploadedBy: number;
  notes?: string;
}

interface AddCommentRequest {
  revisionRoundId: number;
  artworkRevisionId?: number;
  type: CommentType;
  content: string;
  sectionReference?: string;
  createdBy: number;
  isInternal?: boolean;
  parentCommentId?: number;
}

interface RevisionRoundDetails {
  revisionRound: RevisionRound;
  artworkVersions: ArtworkRevision[];
  comments: RevisionComment[];
  canUpload: boolean;
  canComment: boolean;
}

export class CollaborationService {
  private revisionRoundRepository: Repository<RevisionRound>;
  private artworkRevisionRepository: Repository<ArtworkRevision>;
  private commentRepository: Repository<RevisionComment>;
  private pilRepository: Repository<PIL>;
  private userRepository: Repository<User>;
  private supplierRepository: Repository<Supplier>;
  private auditLogger: AuditLogger;
  private notificationService: NotificationService;
  private s3Service: S3Service;
  private visualDiffService: VisualDiffService;

  constructor() {
    this.revisionRoundRepository = AppDataSource.getRepository(RevisionRound);
    this.artworkRevisionRepository = AppDataSource.getRepository(ArtworkRevision);
    this.commentRepository = AppDataSource.getRepository(RevisionComment);
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.userRepository = AppDataSource.getRepository(User);
    this.supplierRepository = AppDataSource.getRepository(Supplier);
    this.auditLogger = new AuditLogger();
    this.notificationService = new NotificationService();
    this.s3Service = new S3Service();
    this.visualDiffService = new VisualDiffService();
  }

  /**
   * Upload artwork revision for supplier collaboration
   */
  async uploadArtwork(request: UploadArtworkRequest): Promise<ArtworkRevision> {
    try {
      // Validate revision round exists and is in correct status
      const revisionRound = await this.revisionRoundRepository.findOne({
        where: { id: request.revisionRoundId },
        relations: ['pil', 'supplier'],
      });

      if (!revisionRound) {
        throw new Error('Revision round not found');
      }

      if (
        revisionRound.status !== RevisionStatus.PENDING_SUPPLIER &&
        revisionRound.status !== RevisionStatus.SUPPLIER_REVIEW
      ) {
        throw new Error(`Cannot upload artwork in status: ${revisionRound.status}`);
      }

      // Validate user is authorized (supplier or internal team)
      const user = await this.userRepository.findOne({
        where: { id: request.uploadedBy },
        relations: ['tenant'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get next version number
      const existingVersions = await this.artworkRevisionRepository.find({
        where: { revisionRoundId: request.revisionRoundId },
        order: { versionNumber: 'DESC' },
      });

      const nextVersion = existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;

      // Upload file to S3
      const artworkPath = await this.s3Service.uploadArtwork(
        request.file,
        revisionRound.pilId,
        revisionRound.roundNumber,
        nextVersion
      );

      // Calculate file hash
      const fileHash = await this.s3Service.calculateFileHash(request.file.buffer);

      // Create artwork revision record
      const artworkRevision = this.artworkRevisionRepository.create({
        revisionRoundId: request.revisionRoundId,
        versionNumber: nextVersion,
        artworkPath,
        status: ArtworkStatus.UPLOADED,
        fileSizeBytes: request.file.size,
        fileHash,
        uploadedBy: request.uploadedBy,
        notes: request.notes,
      });

      const savedRevision = await this.artworkRevisionRepository.save(artworkRevision);

      // Generate visual diff if previous version exists
      if (existingVersions.length > 0) {
        const previousVersion = existingVersions[0];
        try {
          const diffPath = await this.visualDiffService.generateDiff(
            previousVersion.artworkPath,
            artworkPath,
            revisionRound.pilId,
            revisionRound.roundNumber,
            nextVersion
          );

          savedRevision.visualDiffPath = diffPath;
          await this.artworkRevisionRepository.save(savedRevision);
        } catch (error) {
          logger.error('Failed to generate visual diff', { error, revisionId: savedRevision.id });
          // Continue without diff - non-critical
        }
      }

      // Update revision round status
      revisionRound.status = RevisionStatus.INTERNAL_REVIEW;
      await this.revisionRoundRepository.save(revisionRound);

      // Log audit event
      await this.auditLogger.log({
        entityType: 'artwork_revision',
        entityId: savedRevision.id,
        action: 'upload',
        userId: request.uploadedBy,
        afterState: savedRevision,
        metadata: {
          revisionRoundId: request.revisionRoundId,
          versionNumber: nextVersion,
          fileSize: request.file.size,
          fileName: request.file.originalname,
        },
      });

      // Notify internal team
      await this.notificationService.notifyArtworkUploaded({
        pilId: revisionRound.pilId,
        revisionRoundId: request.revisionRoundId,
        versionNumber: nextVersion,
        uploadedBy: user.fullName,
      });

      logger.info('Artwork uploaded successfully', {
        revisionId: savedRevision.id,
        versionNumber: nextVersion,
        userId: request.uploadedBy,
      });

      return savedRevision;
    } catch (error) {
      logger.error('Failed to upload artwork', { error, request });
      throw error;
    }
  }

  /**
   * Add comment to revision round with threading support
   */
  async addComment(request: AddCommentRequest): Promise<RevisionComment> {
    try {
      // Validate revision round exists
      const revisionRound = await this.revisionRoundRepository.findOne({
        where: { id: request.revisionRoundId },
        relations: ['pil', 'supplier'],
      });

      if (!revisionRound) {
        throw new Error('Revision round not found');
      }

      // Validate user
      const user = await this.userRepository.findOne({
        where: { id: request.createdBy },
        relations: ['tenant'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate artwork revision if specified
      if (request.artworkRevisionId) {
        const artworkRevision = await this.artworkRevisionRepository.findOne({
          where: { id: request.artworkRevisionId, revisionRoundId: request.revisionRoundId },
        });

        if (!artworkRevision) {
          throw new Error('Artwork revision not found');
        }
      }

      // Create comment
      const comment = this.commentRepository.create({
        revisionRoundId: request.revisionRoundId,
        artworkRevisionId: request.artworkRevisionId,
        type: request.type,
        content: request.content,
        sectionReference: request.sectionReference,
        createdBy: request.createdBy,
        isInternal: request.isInternal || false,
        parentCommentId: request.parentCommentId,
      });

      const savedComment = await this.commentRepository.save(comment);

      // Log audit event
      await this.auditLogger.log({
        entityType: 'revision_comment',
        entityId: savedComment.id,
        action: 'create',
        userId: request.createdBy,
        afterState: savedComment,
        metadata: {
          revisionRoundId: request.revisionRoundId,
          commentType: request.type,
          isInternal: request.isInternal,
        },
      });

      // Notify relevant parties (skip if internal comment)
      if (!request.isInternal) {
        await this.notificationService.notifyNewComment({
          pilId: revisionRound.pilId,
          revisionRoundId: request.revisionRoundId,
          commentType: request.type,
          authorName: user.fullName,
          supplierId: revisionRound.supplierId,
        });
      }

      logger.info('Comment added successfully', {
        commentId: savedComment.id,
        revisionRoundId: request.revisionRoundId,
        userId: request.createdBy,
      });

      return savedComment;
    } catch (error) {
      logger.error('Failed to add comment', { error, request });
      throw error;
    }
  }

  /**
   * Get revision round details with all versions and comments
   */
  async getRevisionRoundDetails(
    revisionRoundId: number,
    userId: number
  ): Promise<RevisionRoundDetails> {
    try {
      // Get revision round
      const revisionRound = await this.revisionRoundRepository.findOne({
        where: { id: revisionRoundId },
        relations: ['pil', 'supplier'],
      });

      if (!revisionRound) {
        throw new Error('Revision round not found');
      }

      // Get user to check permissions
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['tenant'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get all artwork versions
      const artworkVersions = await this.artworkRevisionRepository.find({
        where: { revisionRoundId },
        relations: ['uploader', 'reviewer'],
        order: { versionNumber: 'DESC' },
      });

      // Get comments (filter internal comments for suppliers)
      const isSupplier = user.tenant?.tenantType === 'supplier';
      const commentQuery = this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.author', 'author')
        .leftJoinAndSelect('comment.artworkRevision', 'artworkRevision')
        .where('comment.revisionRoundId = :revisionRoundId', { revisionRoundId })
        .orderBy('comment.createdAt', 'ASC');

      if (isSupplier) {
        commentQuery.andWhere('comment.isInternal = :isInternal', { isInternal: false });
      }

      const comments = await commentQuery.getMany();

      // Determine permissions
      const canUpload =
        revisionRound.status === RevisionStatus.PENDING_SUPPLIER ||
        revisionRound.status === RevisionStatus.SUPPLIER_REVIEW;

      const canComment = true; // All authenticated users can comment

      return {
        revisionRound,
        artworkVersions,
        comments,
        canUpload,
        canComment,
      };
    } catch (error) {
      logger.error('Failed to get revision round details', { error, revisionRoundId, userId });
      throw error;
    }
  }

  /**
   * Get supplier's assigned revision rounds
   */
  async getSupplierRevisions(supplierId: number, status?: RevisionStatus): Promise<RevisionRound[]> {
    try {
      const query = this.revisionRoundRepository
        .createQueryBuilder('revision')
        .leftJoinAndSelect('revision.pil', 'pil')
        .leftJoinAndSelect('revision.supplier', 'supplier')
        .where('revision.supplierId = :supplierId', { supplierId })
        .orderBy('revision.startedAt', 'DESC');

      if (status) {
        query.andWhere('revision.status = :status', { status });
      }

      const revisions = await query.getMany();

      return revisions;
    } catch (error) {
      logger.error('Failed to get supplier revisions', { error, supplierId });
      throw error;
    }
  }

  /**
   * Approve artwork revision
   */
  async approveArtwork(
    artworkRevisionId: number,
    reviewedBy: number,
    comments?: string
  ): Promise<ArtworkRevision> {
    try {
      const artworkRevision = await this.artworkRevisionRepository.findOne({
        where: { id: artworkRevisionId },
        relations: ['revisionRound'],
      });

      if (!artworkRevision) {
        throw new Error('Artwork revision not found');
      }

      const beforeState = { ...artworkRevision };

      artworkRevision.status = ArtworkStatus.APPROVED;
      artworkRevision.reviewedBy = reviewedBy;
      artworkRevision.reviewedAt = new Date();

      const updatedRevision = await this.artworkRevisionRepository.save(artworkRevision);

      // Update revision round status
      const revisionRound = artworkRevision.revisionRound;
      revisionRound.status = RevisionStatus.APPROVED;
      revisionRound.completedAt = new Date();
      await this.revisionRoundRepository.save(revisionRound);

      // Add approval comment if provided
      if (comments) {
        await this.addComment({
          revisionRoundId: revisionRound.id,
          artworkRevisionId,
          type: CommentType.APPROVAL,
          content: comments,
          createdBy: reviewedBy,
        });
      }

      // Log audit event
      await this.auditLogger.log({
        entityType: 'artwork_revision',
        entityId: artworkRevisionId,
        action: 'approve',
        userId: reviewedBy,
        beforeState,
        afterState: updatedRevision,
      });

      logger.info('Artwork approved', { artworkRevisionId, reviewedBy });

      return updatedRevision;
    } catch (error) {
      logger.error('Failed to approve artwork', { error, artworkRevisionId });
      throw error;
    }
  }

  /**
   * Reject artwork revision
   */
  async rejectArtwork(
    artworkRevisionId: number,
    reviewedBy: number,
    reason: string
  ): Promise<ArtworkRevision> {
    try {
      const artworkRevision = await this.artworkRevisionRepository.findOne({
        where: { id: artworkRevisionId },
        relations: ['revisionRound'],
      });

      if (!artworkRevision) {
        throw new Error('Artwork revision not found');
      }

      const beforeState = { ...artworkRevision };

      artworkRevision.status = ArtworkStatus.REJECTED;
      artworkRevision.reviewedBy = reviewedBy;
      artworkRevision.reviewedAt = new Date();

      const updatedRevision = await this.artworkRevisionRepository.save(artworkRevision);

      // Update revision round status back to pending supplier
      const revisionRound = artworkRevision.revisionRound;
      revisionRound.status = RevisionStatus.PENDING_SUPPLIER;
      await this.revisionRoundRepository.save(revisionRound);

      // Add rejection comment
      await this.addComment({
        revisionRoundId: revisionRound.id,
        artworkRevisionId,
        type: CommentType.REJECTION,
        content: reason,
        createdBy: reviewedBy,
      });

      // Log audit event
      await this.auditLogger.log({
        entityType: 'artwork_revision',
        entityId: artworkRevisionId,
        action: 'reject',
        userId: reviewedBy,
        beforeState,
        afterState: updatedRevision,
        metadata: { reason },
      });

      logger.info('Artwork rejected', { artworkRevisionId, reviewedBy });

      return updatedRevision;
    } catch (error) {
      logger.error('Failed to reject artwork', { error, artworkRevisionId });
      throw error;
    }
  }
}