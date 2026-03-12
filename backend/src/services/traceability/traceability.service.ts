import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { TraceabilityLink } from '../../models/traceability.model';
import { Translation } from '../../models/translation.model';
import { S3Service } from '../storage/s3.service';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

interface SourceReference {
  documentPath: string;
  pageNumber: number;
  paragraphNumber: number;
  sourceText: string;
  startIndex: number;
  endIndex: number;
}

interface TraceabilitySection {
  sectionName: string;
  translatedText: string;
  targetStartIndex: number;
  targetEndIndex: number;
  sourceReferences: SourceReference[];
  confidenceScore: number;
}

interface CreateTraceabilityRequest {
  translationId: number;
  sections: TraceabilitySection[];
  sourceDocumentPath: string;
}

interface TraceabilityResponse {
  translationId: number;
  sections: Array<{
    sectionName: string;
    translatedText: string;
    sourceReferences: Array<{
      documentPath: string;
      pageNumber: number;
      paragraphNumber: number;
      sourceText: string;
      linkHash: string;
    }>;
    confidenceScore: number;
  }>;
}

export class TraceabilityService {
  private repository: Repository<TraceabilityLink>;
  private translationRepository: Repository<Translation>;
  private s3Service: S3Service;

  constructor() {
    this.repository = AppDataSource.getRepository(TraceabilityLink);
    this.translationRepository = AppDataSource.getRepository(Translation);
    this.s3Service = new S3Service();
  }

  async createTraceabilityLinks(request: CreateTraceabilityRequest): Promise<void> {
    try {
      // Validate translation exists
      const translation = await this.translationRepository.findOne({
        where: { id: request.translationId },
      });

      if (!translation) {
        throw new Error(`Translation ${request.translationId} not found`);
      }

      // Calculate source document hash for integrity verification
      const sourceDocument = await this.s3Service.downloadDocument(request.sourceDocumentPath);
      const sourceDocumentHash = this.calculateHash(sourceDocument);

      const links: TraceabilityLink[] = [];

      for (const section of request.sections) {
        for (const sourceRef of section.sourceReferences) {
          // Generate cryptographic hash for this specific link
          const linkHash = this.generateLinkHash({
            translationId: request.translationId,
            targetSection: section.sectionName,
            targetText: section.translatedText,
            sourceText: sourceRef.sourceText,
            sourceDocumentHash,
          });

          const link = this.repository.create({
            translationId: request.translationId,
            targetSection: section.sectionName,
            targetText: section.translatedText,
            targetStartIndex: section.targetStartIndex,
            targetEndIndex: section.targetEndIndex,
            sourceDocumentPath: request.sourceDocumentPath,
            sourceDocumentHash,
            sourcePageNumber: sourceRef.pageNumber,
            sourceParagraphNumber: sourceRef.paragraphNumber,
            sourceText: sourceRef.sourceText,
            sourceStartIndex: sourceRef.startIndex,
            sourceEndIndex: sourceRef.endIndex,
            confidenceScore: section.confidenceScore,
            linkHash,
            metadata: {
              createdBy: 'system',
              llmModel: 'gpt-4',
              timestamp: new Date().toISOString(),
            },
          });

          links.push(link);
        }
      }

      // Batch insert all traceability links
      await this.repository.save(links);

      // Generate and upload immutable traceability log to S3
      await this.uploadTraceabilityLog(request.translationId, links);

      logger.info({
        message: 'Traceability links created',
        translationId: request.translationId,
        linksCount: links.length,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to create traceability links',
        translationId: request.translationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getTraceability(translationId: number): Promise<TraceabilityResponse> {
    try {
      const links = await this.repository.find({
        where: { translationId },
        order: { targetSection: 'ASC', targetStartIndex: 'ASC' },
      });

      if (links.length === 0) {
        throw new Error(`No traceability links found for translation ${translationId}`);
      }

      // Group links by section
      const sectionMap = new Map<string, typeof links>();
      for (const link of links) {
        if (!sectionMap.has(link.targetSection)) {
          sectionMap.set(link.targetSection, []);
        }
        sectionMap.get(link.targetSection)!.push(link);
      }

      const sections = Array.from(sectionMap.entries()).map(([sectionName, sectionLinks]) => ({
        sectionName,
        translatedText: sectionLinks[0].targetText,
        sourceReferences: sectionLinks.map((link) => ({
          documentPath: link.sourceDocumentPath,
          pageNumber: link.sourcePageNumber,
          paragraphNumber: link.sourceParagraphNumber,
          sourceText: link.sourceText,
          linkHash: link.linkHash,
        })),
        confidenceScore: sectionLinks[0].confidenceScore,
      }));

      return {
        translationId,
        sections,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to retrieve traceability',
        translationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async verifyTraceabilityIntegrity(translationId: number): Promise<boolean> {
    try {
      const links = await this.repository.find({
        where: { translationId },
      });

      if (links.length === 0) {
        return false;
      }

      // Verify source document hash consistency
      const sourceDocumentHash = links[0].sourceDocumentHash;
      const allHashesMatch = links.every((link) => link.sourceDocumentHash === sourceDocumentHash);

      if (!allHashesMatch) {
        logger.warn({
          message: 'Source document hash mismatch detected',
          translationId,
        });
        return false;
      }

      // Verify individual link hashes
      for (const link of links) {
        const expectedHash = this.generateLinkHash({
          translationId: link.translationId,
          targetSection: link.targetSection,
          targetText: link.targetText,
          sourceText: link.sourceText,
          sourceDocumentHash: link.sourceDocumentHash,
        });

        if (expectedHash !== link.linkHash) {
          logger.warn({
            message: 'Link hash verification failed',
            translationId,
            linkId: link.id,
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to verify traceability integrity',
        translationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async exportTraceabilityLog(translationId: number): Promise<string> {
    try {
      const links = await this.repository.find({
        where: { translationId },
        order: { targetSection: 'ASC', targetStartIndex: 'ASC' },
      });

      const logData = {
        translationId,
        exportedAt: new Date().toISOString(),
        totalLinks: links.length,
        sourceDocumentHash: links[0]?.sourceDocumentHash,
        links: links.map((link) => ({
          id: link.id,
          targetSection: link.targetSection,
          targetText: link.targetText,
          targetRange: {
            start: link.targetStartIndex,
            end: link.targetEndIndex,
          },
          sourceReference: {
            documentPath: link.sourceDocumentPath,
            pageNumber: link.sourcePageNumber,
            paragraphNumber: link.sourceParagraphNumber,
            text: link.sourceText,
            range: {
              start: link.sourceStartIndex,
              end: link.sourceEndIndex,
            },
          },
          confidenceScore: link.confidenceScore,
          linkHash: link.linkHash,
          createdAt: link.createdAt,
        })),
      };

      const key = `traceability-logs/${translationId}/export-${Date.now()}.json`;
      const path = await this.s3Service.uploadJSON(key, logData);

      logger.info({
        message: 'Traceability log exported',
        translationId,
        path,
      });

      return path;
    } catch (error) {
      logger.error({
        message: 'Failed to export traceability log',
        translationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async uploadTraceabilityLog(
    translationId: number,
    links: TraceabilityLink[]
  ): Promise<void> {
    const logData = {
      translationId,
      createdAt: new Date().toISOString(),
      totalLinks: links.length,
      sourceDocumentHash: links[0]?.sourceDocumentHash,
      links: links.map((link) => ({
        targetSection: link.targetSection,
        targetText: link.targetText,
        sourcePageNumber: link.sourcePageNumber,
        sourceParagraphNumber: link.sourceParagraphNumber,
        sourceText: link.sourceText,
        confidenceScore: link.confidenceScore,
        linkHash: link.linkHash,
      })),
    };

    const key = `traceability-logs/${translationId}/log-${Date.now()}.json`;
    await this.s3Service.uploadJSON(key, logData);
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateLinkHash(data: {
    translationId: number;
    targetSection: string;
    targetText: string;
    sourceText: string;
    sourceDocumentHash: string;
  }): string {
    const content = JSON.stringify({
      translationId: data.translationId,
      targetSection: data.targetSection,
      targetText: data.targetText,
      sourceText: data.sourceText,
      sourceDocumentHash: data.sourceDocumentHash,
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}