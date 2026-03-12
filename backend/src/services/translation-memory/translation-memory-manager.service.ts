import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { TranslationMemory } from '../../models/translation-memory.model';
import { User } from '../../models/user.model';
import { AuditLogger } from '../audit/audit-logger';
import { logger } from '../../utils/logger';
import { RedisCache } from '../../utils/redis-cache';

interface TermSuggestion {
  sourceTerm: string;
  targetTerm: string;
  confidence: number;
  usageCount: number;
  lastUsed: Date;
  marketApplicability: string;
}

interface TermUpdateRequest {
  sourceTerm: string;
  targetTerm: string;
  sourceLanguage: string;
  targetLanguage: string;
  marketApplicability: 'TFDA' | 'FDA_Thailand' | 'DAV' | 'all';
  justification?: string;
}

interface TermApprovalRequest {
  termId: number;
  approved: boolean;
  reviewerComments?: string;
}

export class TranslationMemoryManager {
  private repository: Repository<TranslationMemory>;
  private userRepository: Repository<User>;
  private auditLogger: AuditLogger;
  private cache: RedisCache;
  private readonly CACHE_TTL = 90 * 24 * 60 * 60; // 90 days in seconds

  constructor() {
    this.repository = AppDataSource.getRepository(TranslationMemory);
    this.userRepository = AppDataSource.getRepository(User);
    this.auditLogger = new AuditLogger();
    this.cache = new RedisCache();
  }

  /**
   * Get terminology suggestions for a source term with caching
   */
  async getTermSuggestions(
    sourceTerm: string,
    sourceLanguage: string,
    targetLanguage: string,
    market?: string
  ): Promise<TermSuggestion[]> {
    const cacheKey = `term:${sourceLanguage}:${targetLanguage}:${market || 'all'}:${sourceTerm.toLowerCase()}`;

    try {
      // Check cache first
      const cached = await this.cache.get<TermSuggestion[]>(cacheKey);
      if (cached) {
        logger.debug('Translation memory cache hit', { sourceTerm, targetLanguage });
        return cached;
      }

      // Query database
      const queryBuilder = this.repository
        .createQueryBuilder('tm')
        .where('LOWER(tm.source_term) = LOWER(:sourceTerm)', { sourceTerm })
        .andWhere('tm.source_language = :sourceLanguage', { sourceLanguage })
        .andWhere('tm.target_language = :targetLanguage', { targetLanguage })
        .andWhere('tm.approved_at IS NOT NULL'); // Only approved terms

      if (market) {
        queryBuilder.andWhere(
          '(tm.market_applicability = :market OR tm.market_applicability = :all)',
          { market, all: 'all' }
        );
      }

      const terms = await queryBuilder
        .orderBy('tm.usage_count', 'DESC')
        .addOrderBy('tm.approved_at', 'DESC')
        .getMany();

      const suggestions: TermSuggestion[] = terms.map(term => ({
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm,
        confidence: this.calculateTermConfidence(term),
        usageCount: term.usageCount,
        lastUsed: term.updatedAt,
        marketApplicability: term.marketApplicability || 'all'
      }));

      // Cache results
      await this.cache.set(cacheKey, suggestions, this.CACHE_TTL);

      logger.info('Translation memory suggestions retrieved', {
        sourceTerm,
        targetLanguage,
        suggestionsCount: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error('Failed to get term suggestions', { error, sourceTerm });
      throw error;
    }
  }

  /**
   * Submit new term for approval workflow
   */
  async submitTermUpdate(
    request: TermUpdateRequest,
    userId: number
  ): Promise<{ termId: number; status: 'pending_approval' }> {
    try {
      // Check if term already exists
      const existing = await this.repository.findOne({
        where: {
          sourceTerm: request.sourceTerm,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          marketApplicability: request.marketApplicability
        }
      });

      if (existing && existing.approvedAt) {
        throw new Error('Term already exists and is approved. Use override workflow instead.');
      }

      // Create new term entry (pending approval)
      const term = this.repository.create({
        sourceTerm: request.sourceTerm,
        targetTerm: request.targetTerm,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        marketApplicability: request.marketApplicability,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
        // approvedBy and approvedAt remain null until approved
      });

      const saved = await this.repository.save(term);

      // Log audit trail
      await this.auditLogger.log({
        entityType: 'translation_memory',
        entityId: saved.id,
        action: 'term_submitted',
        userId,
        afterState: {
          sourceTerm: request.sourceTerm,
          targetTerm: request.targetTerm,
          targetLanguage: request.targetLanguage,
          marketApplicability: request.marketApplicability,
          justification: request.justification
        },
        metadata: {
          status: 'pending_approval',
          justification: request.justification
        }
      });

      logger.info('Term submitted for approval', {
        termId: saved.id,
        sourceTerm: request.sourceTerm,
        targetLanguage: request.targetLanguage,
        userId
      });

      return {
        termId: saved.id,
        status: 'pending_approval'
      };
    } catch (error) {
      logger.error('Failed to submit term update', { error, request });
      throw error;
    }
  }

  /**
   * Approve or reject term update (Regulatory Reviewer only)
   */
  async reviewTermUpdate(
    request: TermApprovalRequest,
    reviewerId: number
  ): Promise<{ termId: number; status: 'approved' | 'rejected' }> {
    try {
      const term = await this.repository.findOne({
        where: { id: request.termId }
      });

      if (!term) {
        throw new Error(`Term ${request.termId} not found`);
      }

      if (term.approvedAt) {
        throw new Error('Term already approved');
      }

      const beforeState = { ...term };

      if (request.approved) {
        // Approve term
        term.approvedBy = reviewerId;
        term.approvedAt = new Date();
        term.updatedAt = new Date();

        await this.repository.save(term);

        // Invalidate cache for this term
        await this.invalidateTermCache(term);

        logger.info('Term approved', {
          termId: term.id,
          sourceTerm: term.sourceTerm,
          reviewerId
        });

        // Log audit trail
        await this.auditLogger.log({
          entityType: 'translation_memory',
          entityId: term.id,
          action: 'term_approved',
          userId: reviewerId,
          beforeState,
          afterState: term,
          metadata: {
            reviewerComments: request.reviewerComments
          }
        });

        return { termId: term.id, status: 'approved' };
      } else {
        // Reject term - delete from database
        await this.repository.remove(term);

        logger.info('Term rejected', {
          termId: term.id,
          sourceTerm: term.sourceTerm,
          reviewerId
        });

        // Log audit trail
        await this.auditLogger.log({
          entityType: 'translation_memory',
          entityId: term.id,
          action: 'term_rejected',
          userId: reviewerId,
          beforeState,
          afterState: null,
          metadata: {
            reviewerComments: request.reviewerComments
          }
        });

        return { termId: term.id, status: 'rejected' };
      }
    } catch (error) {
      logger.error('Failed to review term update', { error, request });
      throw error;
    }
  }

  /**
   * Override approved term with justification (captured in audit trail)
   */
  async overrideTerm(
    termId: number,
    newTargetTerm: string,
    justification: string,
    userId: number
  ): Promise<{ termId: number; previousTerm: string; newTerm: string }> {
    try {
      const term = await this.repository.findOne({
        where: { id: termId }
      });

      if (!term) {
        throw new Error(`Term ${termId} not found`);
      }

      if (!term.approvedAt) {
        throw new Error('Cannot override unapproved term');
      }

      const previousTerm = term.targetTerm;
      const beforeState = { ...term };

      // Update term
      term.targetTerm = newTargetTerm;
      term.updatedAt = new Date();

      await this.repository.save(term);

      // Invalidate cache
      await this.invalidateTermCache(term);

      // Log audit trail with justification
      await this.auditLogger.log({
        entityType: 'translation_memory',
        entityId: term.id,
        action: 'term_overridden',
        userId,
        beforeState,
        afterState: term,
        metadata: {
          justification,
          previousTerm,
          newTerm: newTargetTerm,
          overrideReason: 'regulatory_specialist_override'
        }
      });

      logger.warn('Term overridden by regulatory specialist', {
        termId,
        sourceTerm: term.sourceTerm,
        previousTerm,
        newTerm: newTargetTerm,
        userId,
        justification
      });

      return {
        termId: term.id,
        previousTerm,
        newTerm: newTargetTerm
      };
    } catch (error) {
      logger.error('Failed to override term', { error, termId });
      throw error;
    }
  }

  /**
   * Increment usage count when term is used in translation
   */
  async recordTermUsage(termId: number): Promise<void> {
    try {
      await this.repository.increment({ id: termId }, 'usageCount', 1);
      await this.repository.update({ id: termId }, { updatedAt: new Date() });

      logger.debug('Term usage recorded', { termId });
    } catch (error) {
      logger.error('Failed to record term usage', { error, termId });
      // Don't throw - usage tracking is non-critical
    }
  }

  /**
   * Get all pending term approvals for Regulatory Reviewers
   */
  async getPendingApprovals(
    targetLanguage?: string,
    market?: string
  ): Promise<Array<TranslationMemory & { submittedBy?: string }>> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('tm')
        .where('tm.approved_at IS NULL');

      if (targetLanguage) {
        queryBuilder.andWhere('tm.target_language = :targetLanguage', { targetLanguage });
      }

      if (market) {
        queryBuilder.andWhere('tm.market_applicability = :market', { market });
      }

      const pending = await queryBuilder
        .orderBy('tm.created_at', 'ASC')
        .getMany();

      logger.info('Retrieved pending term approvals', {
        count: pending.length,
        targetLanguage,
        market
      });

      return pending;
    } catch (error) {
      logger.error('Failed to get pending approvals', { error });
      throw error;
    }
  }

  /**
   * Search terminology database
   */
  async searchTerms(
    searchQuery: string,
    targetLanguage?: string,
    market?: string,
    approvedOnly: boolean = true
  ): Promise<TranslationMemory[]> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('tm')
        .where(
          '(LOWER(tm.source_term) LIKE LOWER(:query) OR LOWER(tm.target_term) LIKE LOWER(:query))',
          { query: `%${searchQuery}%` }
        );

      if (approvedOnly) {
        queryBuilder.andWhere('tm.approved_at IS NOT NULL');
      }

      if (targetLanguage) {
        queryBuilder.andWhere('tm.target_language = :targetLanguage', { targetLanguage });
      }

      if (market) {
        queryBuilder.andWhere(
          '(tm.market_applicability = :market OR tm.market_applicability = :all)',
          { market, all: 'all' }
        );
      }

      const results = await queryBuilder
        .orderBy('tm.usage_count', 'DESC')
        .limit(50)
        .getMany();

      logger.info('Term search completed', {
        searchQuery,
        resultsCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to search terms', { error, searchQuery });
      throw error;
    }
  }

  /**
   * Calculate confidence score for a term based on usage and recency
   */
  private calculateTermConfidence(term: TranslationMemory): number {
    const usageScore = Math.min(term.usageCount / 100, 1) * 50; // Max 50 points
    
    const daysSinceApproval = term.approvedAt
      ? (Date.now() - term.approvedAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const recencyScore = Math.max(50 - daysSinceApproval / 10, 0); // Max 50 points, decay over time

    return Math.round(usageScore + recencyScore);
  }

  /**
   * Invalidate cache for a term across all cache keys
   */
  private async invalidateTermCache(term: TranslationMemory): Promise<void> {
    const cachePattern = `term:${term.sourceLanguage}:${term.targetLanguage}:*:${term.sourceTerm.toLowerCase()}`;
    await this.cache.deletePattern(cachePattern);
    
    logger.debug('Term cache invalidated', {
      sourceTerm: term.sourceTerm,
      targetLanguage: term.targetLanguage
    });
  }

  /**
   * Get terminology consistency report across all PILs
   */
  async getConsistencyReport(
    targetLanguage: string,
    market?: string
  ): Promise<{
    totalTerms: number;
    consistentTerms: number;
    inconsistentTerms: Array<{
      sourceTerm: string;
      variations: Array<{ targetTerm: string; usageCount: number }>;
    }>;
  }> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('tm')
        .where('tm.target_language = :targetLanguage', { targetLanguage })
        .andWhere('tm.approved_at IS NOT NULL');

      if (market) {
        queryBuilder.andWhere(
          '(tm.market_applicability = :market OR tm.market_applicability = :all)',
          { market, all: 'all' }
        );
      }

      const allTerms = await queryBuilder.getMany();

      // Group by source term
      const termGroups = new Map<string, TranslationMemory[]>();
      allTerms.forEach(term => {
        const key = term.sourceTerm.toLowerCase();
        if (!termGroups.has(key)) {
          termGroups.set(key, []);
        }
        termGroups.get(key)!.push(term);
      });

      const inconsistentTerms: Array<{
        sourceTerm: string;
        variations: Array<{ targetTerm: string; usageCount: number }>;
      }> = [];

      termGroups.forEach((terms, sourceTerm) => {
        if (terms.length > 1) {
          // Multiple translations for same source term
          inconsistentTerms.push({
            sourceTerm: terms[0].sourceTerm,
            variations: terms.map(t => ({
              targetTerm: t.targetTerm,
              usageCount: t.usageCount
            }))
          });
        }
      });

      return {
        totalTerms: termGroups.size,
        consistentTerms: termGroups.size - inconsistentTerms.length,
        inconsistentTerms
      };
    } catch (error) {
      logger.error('Failed to generate consistency report', { error });
      throw error;
    }
  }
}