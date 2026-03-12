import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { SupplierPerformance } from '../../../models/supplier-performance.model';
import { Supplier } from '../../../models/supplier.model';
import { RevisionRound, RevisionStatus } from '../../../models/revision-round.model';
import { ArtworkRevision } from '../../../models/artwork-revision.model';
import { RevisionComment } from '../../../models/revision-comment.model';
import { logger } from '../../../utils/logger';

interface PerformanceMetrics {
  supplierId: number;
  supplierName: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevisions: number;
  avgRevisionRounds: number;
  avgTurnaroundHours: number;
  firstTimeApprovalRate: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  totalCommentsReceived: number;
  avgCommentsPerRevision: number;
  recentRevisions: Array<{
    pilId: number;
    productName: string;
    roundNumber: number;
    turnaroundHours: number;
    commentsCount: number;
    status: string;
  }>;
}

interface SupplierRanking {
  rank: number;
  supplierId: number;
  supplierName: string;
  qualityScore: number;
  avgTurnaroundHours: number;
  totalRevisions: number;
}

export class PerformanceService {
  private performanceRepository: Repository<SupplierPerformance>;
  private supplierRepository: Repository<Supplier>;
  private revisionRoundRepository: Repository<RevisionRound>;
  private artworkRevisionRepository: Repository<ArtworkRevision>;
  private commentRepository: Repository<RevisionComment>;

  constructor() {
    this.performanceRepository = AppDataSource.getRepository(SupplierPerformance);
    this.supplierRepository = AppDataSource.getRepository(Supplier);
    this.revisionRoundRepository = AppDataSource.getRepository(RevisionRound);
    this.artworkRevisionRepository = AppDataSource.getRepository(ArtworkRevision);
    this.commentRepository = AppDataSource.getRepository(RevisionComment);
  }

  /**
   * Calculate and store supplier performance metrics for a period
   */
  async calculatePerformance(
    supplierId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<SupplierPerformance> {
    try {
      logger.info('Calculating supplier performance', { supplierId, periodStart, periodEnd });

      // Get all revision rounds for supplier in period
      const revisionRounds = await this.revisionRoundRepository.find({
        where: {
          supplierId,
          startedAt: Between(periodStart, periodEnd),
        },
        relations: ['pil'],
      });

      if (revisionRounds.length === 0) {
        logger.warn('No revisions found for supplier in period', { supplierId, periodStart, periodEnd });
        return null;
      }

      // Calculate metrics
      const totalRevisions = revisionRounds.length;

      // Average revision rounds (target: 3-4)
      const avgRevisionRounds =
        revisionRounds.reduce((sum, r) => sum + r.roundNumber, 0) / totalRevisions;

      // Average turnaround time
      const turnaroundTimes = revisionRounds
        .filter((r) => r.completedAt)
        .map((r) => {
          const start = new Date(r.startedAt).getTime();
          const end = new Date(r.completedAt).getTime();
          return (end - start) / (1000 * 60 * 60); // hours
        });

      const avgTurnaroundHours =
        turnaroundTimes.length > 0
          ? turnaroundTimes.reduce((sum, t) => sum + t, 0) / turnaroundTimes.length
          : 0;

      // First-time approval rate (approved in round 1)
      const firstTimeApprovals = revisionRounds.filter(
        (r) => r.roundNumber === 1 && r.status === RevisionStatus.APPROVED
      ).length;
      const firstTimeApprovalRate = (firstTimeApprovals / totalRevisions) * 100;

      // On-time delivery rate (completed within expected timeframe)
      const expectedTurnaroundHours = 48; // 2 days
      const onTimeDeliveries = turnaroundTimes.filter((t) => t <= expectedTurnaroundHours).length;
      const onTimeDeliveryRate =
        turnaroundTimes.length > 0 ? (onTimeDeliveries / turnaroundTimes.length) * 100 : 0;

      // Get all comments for these revisions
      const revisionRoundIds = revisionRounds.map((r) => r.id);
      const comments = await this.commentRepository.find({
        where: { revisionRoundId: revisionRoundIds as any },
      });

      const totalCommentsReceived = comments.length;
      const avgCommentsPerRevision = totalCommentsReceived / totalRevisions;

      // Calculate quality score (0-100)
      // Weighted formula:
      // - First-time approval rate: 40%
      // - On-time delivery rate: 30%
      // - Low comment count (inverse): 20%
      // - Low revision rounds (inverse): 10%
      const commentScore = Math.max(0, 100 - avgCommentsPerRevision * 10); // Fewer comments = higher score
      const revisionScore = Math.max(0, 100 - (avgRevisionRounds - 1) * 25); // Closer to 1 round = higher score

      const qualityScore =
        firstTimeApprovalRate * 0.4 +
        onTimeDeliveryRate * 0.3 +
        commentScore * 0.2 +
        revisionScore * 0.1;

      // Create or update performance record
      let performance = await this.performanceRepository.findOne({
        where: {
          supplierId,
          periodStart,
          periodEnd,
        },
      });

      if (performance) {
        // Update existing
        performance.totalRevisions = totalRevisions;
        performance.avgRevisionRounds = avgRevisionRounds;
        performance.avgTurnaroundHours = avgTurnaroundHours;
        performance.firstTimeApprovalRate = firstTimeApprovalRate;
        performance.onTimeDeliveryRate = onTimeDeliveryRate;
        performance.qualityScore = qualityScore;
        performance.totalCommentsReceived = totalCommentsReceived;
        performance.avgCommentsPerRevision = avgCommentsPerRevision;
      } else {
        // Create new
        performance = this.performanceRepository.create({
          supplierId,
          periodStart,
          periodEnd,
          totalRevisions,
          avgRevisionRounds,
          avgTurnaroundHours,
          firstTimeApprovalRate,
          onTimeDeliveryRate,
          qualityScore,
          totalCommentsReceived,
          avgCommentsPerRevision,
        });
      }

      const savedPerformance = await this.performanceRepository.save(performance);

      logger.info('Supplier performance calculated', {
        supplierId,
        qualityScore,
        avgRevisionRounds,
        avgTurnaroundHours,
      });

      return savedPerformance;
    } catch (error) {
      logger.error('Failed to calculate supplier performance', { error, supplierId });
      throw error;
    }
  }

  /**
   * Get detailed performance metrics for supplier
   */
  async getPerformanceMetrics(
    supplierId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PerformanceMetrics> {
    try {
      // Get supplier
      const supplier = await this.supplierRepository.findOne({
        where: { id: supplierId },
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Get or calculate performance
      let performance = await this.performanceRepository.findOne({
        where: {
          supplierId,
          periodStart,
          periodEnd,
        },
      });

      if (!performance) {
        performance = await this.calculatePerformance(supplierId, periodStart, periodEnd);
      }

      // Get recent revisions for detail
      const recentRevisions = await this.revisionRoundRepository
        .createQueryBuilder('revision')
        .leftJoinAndSelect('revision.pil', 'pil')
        .where('revision.supplierId = :supplierId', { supplierId })
        .andWhere('revision.startedAt BETWEEN :periodStart AND :periodEnd', {
          periodStart,
          periodEnd,
        })
        .orderBy('revision.startedAt', 'DESC')
        .limit(10)
        .getMany();

      // Get comment counts for recent revisions
      const recentRevisionsWithDetails = await Promise.all(
        recentRevisions.map(async (revision) => {
          const comments = await this.commentRepository.count({
            where: { revisionRoundId: revision.id },
          });

          const turnaroundHours = revision.completedAt
            ? (new Date(revision.completedAt).getTime() - new Date(revision.startedAt).getTime()) /
              (1000 * 60 * 60)
            : null;

          return {
            pilId: revision.pilId,
            productName: revision.pil.productName,
            roundNumber: revision.roundNumber,
            turnaroundHours,
            commentsCount: comments,
            status: revision.status,
          };
        })
      );

      return {
        supplierId,
        supplierName: supplier.name,
        periodStart,
        periodEnd,
        totalRevisions: performance?.totalRevisions || 0,
        avgRevisionRounds: performance?.avgRevisionRounds || 0,
        avgTurnaroundHours: performance?.avgTurnaroundHours || 0,
        firstTimeApprovalRate: performance?.firstTimeApprovalRate || 0,
        onTimeDeliveryRate: performance?.onTimeDeliveryRate || 0,
        qualityScore: performance?.qualityScore || 0,
        totalCommentsReceived: performance?.totalCommentsReceived || 0,
        avgCommentsPerRevision: performance?.avgCommentsPerRevision || 0,
        recentRevisions: recentRevisionsWithDetails,
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', { error, supplierId });
      throw error;
    }
  }

  /**
   * Get supplier rankings for a period
   */
  async getSupplierRankings(periodStart: Date, periodEnd: Date): Promise<SupplierRanking[]> {
    try {
      // Get all suppliers
      const suppliers = await this.supplierRepository.find();

      // Calculate performance for each supplier
      const rankings = await Promise.all(
        suppliers.map(async (supplier) => {
          let performance = await this.performanceRepository.findOne({
            where: {
              supplierId: supplier.id,
              periodStart,
              periodEnd,
            },
          });

          if (!performance) {
            performance = await this.calculatePerformance(supplier.id, periodStart, periodEnd);
          }

          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            qualityScore: performance?.qualityScore || 0,
            avgTurnaroundHours: performance?.avgTurnaroundHours || 0,
            totalRevisions: performance?.totalRevisions || 0,
          };
        })
      );

      // Sort by quality score descending
      rankings.sort((a, b) => b.qualityScore - a.qualityScore);

      // Add rank
      return rankings.map((ranking, index) => ({
        rank: index + 1,
        ...ranking,
      }));
    } catch (error) {
      logger.error('Failed to get supplier rankings', { error, periodStart, periodEnd });
      throw error;
    }
  }

  /**
   * Get performance trend for supplier over multiple periods
   */
  async getPerformanceTrend(supplierId: number, months: number = 6): Promise<SupplierPerformance[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const performances = await this.performanceRepository.find({
        where: {
          supplierId,
          periodStart: Between(startDate, endDate) as any,
        },
        order: {
          periodStart: 'ASC',
        },
      });

      return performances;
    } catch (error) {
      logger.error('Failed to get performance trend', { error, supplierId, months });
      throw error;
    }
  }
}