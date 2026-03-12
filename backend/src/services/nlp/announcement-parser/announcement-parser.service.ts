import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { RegulatoryAnnouncement, AnnouncementPILVariation } from '../../../models/announcement.model';
import { PIL } from '../../../models/pil.model';
import { AuditLogger } from '../../audit/audit-logger.enhanced';
import { logger } from '../../../utils/logger';

interface ProductMatch {
  pilId: number;
  productName: string;
  matchConfidence: number;
  matchReasons: {
    registrationNumberMatch?: boolean;
    productNameMatch?: boolean;
    ingredientMatch?: boolean;
    therapeuticCategoryMatch?: boolean;
  };
}

interface ParsedAnnouncement {
  announcementId: number;
  affectedProducts: string[];
  therapeuticCategories: string[];
  activeIngredients: string[];
  variationType: 'labeling' | 'safety' | 'formulation' | 'indication' | 'other';
  nlpConfidence: number;
}

export class AnnouncementParserService {
  private announcementRepository: Repository<RegulatoryAnnouncement>;
  private pilRepository: Repository<PIL>;
  private variationRepository: Repository<AnnouncementPILVariation>;
  private auditLogger: AuditLogger;

  constructor() {
    this.announcementRepository = AppDataSource.getRepository(RegulatoryAnnouncement);
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.variationRepository = AppDataSource.getRepository(AnnouncementPILVariation);
    this.auditLogger = new AuditLogger();
  }

  /**
   * Parse announcement and match to affected PILs
   */
  async parseAndMatchAnnouncement(announcementId: number): Promise<ProductMatch[]> {
    const startTime = Date.now();

    try {
      const announcement = await this.announcementRepository.findOne({
        where: { id: announcementId },
      });

      if (!announcement) {
        throw new Error(`Announcement ${announcementId} not found`);
      }

      logger.info('Parsing announcement for PIL matching', {
        announcementId,
        authority: announcement.authority,
      });

      // Parse announcement content
      const parsed = await this.parseAnnouncementContent(announcement);

      // Match to PILs
      const matches = await this.matchToPILs(announcement, parsed);

      // Store matches
      await this.storeMatches(announcementId, matches);

      // Update announcement metadata
      announcement.hasAffectedPILs = matches.length > 0;
      announcement.matchedPILCount = matches.length;
      announcement.metadata = {
        ...announcement.metadata,
        nlpConfidence: parsed.nlpConfidence,
        processingTime: Date.now() - startTime,
      };
      await this.announcementRepository.save(announcement);

      // Log audit event
      await this.auditLogger.logEvent({
        entityType: 'regulatory_announcement',
        entityId: announcementId,
        action: 'announcement_parsed',
        userId: null,
        afterState: {
          matchedPILs: matches.length,
          nlpConfidence: parsed.nlpConfidence,
          processingTime: Date.now() - startTime,
        },
      });

      logger.info('Announcement parsing completed', {
        announcementId,
        matchedPILs: matches.length,
        processingTime: Date.now() - startTime,
      });

      return matches;
    } catch (error) {
      logger.error('Failed to parse announcement', { error, announcementId });
      throw error;
    }
  }

  /**
   * Parse announcement content using NLP
   */
  private async parseAnnouncementContent(
    announcement: RegulatoryAnnouncement
  ): Promise<ParsedAnnouncement> {
    const text = [
      announcement.title,
      announcement.summary,
      announcement.metadata?.rawContent,
    ]
      .filter(Boolean)
      .join(' ');

    // Extract entities using NLP
    const affectedProducts = this.extractProductNames(text);
    const therapeuticCategories = this.extractTherapeuticCategories(text);
    const activeIngredients = this.extractActiveIngredients(text);
    const variationType = this.classifyVariationType(text);

    // Calculate NLP confidence based on entity extraction quality
    const nlpConfidence = this.calculateNLPConfidence({
      affectedProducts,
      therapeuticCategories,
      activeIngredients,
    });

    return {
      announcementId: announcement.id,
      affectedProducts,
      therapeuticCategories,
      activeIngredients,
      variationType,
      nlpConfidence,
    };
  }

  /**
   * Extract product names from text
   */
  private extractProductNames(text: string): string[] {
    const products: string[] = [];

    // Registration numbers (already extracted by monitor services)
    const regPatterns = [
      /衛署藥[製輸]字第\d{6}號/g, // TFDA
      /ทะเบียนยาเลขที่\s*[\dก-๙]+/g, // FDA Thailand
      /VD-\d{5}-\d{2}/g, // DAV
    ];

    for (const pattern of regPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        products.push(...matches);
      }
    }

    // Product names in brackets/quotes
    const namePatterns = [
      /【([^】]+)】/g, // Traditional Chinese
      /\(([ก-๙เ-์\s]+)\)/g, // Thai
      /"([A-Za-zÀ-ỹ\s]+)"/g, // Vietnamese/English
    ];

    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (name.length > 3) {
          products.push(name);
        }
      }
    }

    return [...new Set(products)];
  }

  /**
   * Extract therapeutic categories
   */
  private extractTherapeuticCategories(text: string): string[] {
    const categories: string[] = [];

    // Common therapeutic category keywords
    const categoryKeywords = [
      'antibiotic', 'analgesic', 'antihypertensive', 'antidiabetic',
      'cardiovascular', 'respiratory', 'gastrointestinal', 'neurological',
      'oncology', 'immunosuppressant', 'anticoagulant', 'antiviral',
      // Traditional Chinese
      '抗生素', '止痛藥', '降血壓藥', '降血糖藥', '心血管藥物',
      // Thai
      'ยาปฏิชีวนะ', 'ยาแก้ปวด', 'ยาลดความดันโลหิต',
      // Vietnamese
      'kháng sinh', 'giảm đau', 'hạ huyết áp',
    ];

    const lowerText = text.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        categories.push(keyword);
      }
    }

    return [...new Set(categories)];
  }

  /**
   * Extract active ingredients
   */
  private extractActiveIngredients(text: string): string[] {
    const ingredients: string[] = [];

    // Generic drug name pattern (capitalized words)
    const genericPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    let match;
    while ((match = genericPattern.exec(text)) !== null) {
      const name = match[1];
      // Filter out common non-drug words
      if (
        name.length > 4 &&
        !['Taiwan', 'Thailand', 'Vietnam', 'Ministry', 'Health', 'Administration'].includes(name)
      ) {
        ingredients.push(name);
      }
    }

    return [...new Set(ingredients)];
  }

  /**
   * Classify variation type based on announcement content
   */
  private classifyVariationType(text: string): ParsedAnnouncement['variationType'] {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('label') ||
      lowerText.includes('package insert') ||
      lowerText.includes('仿單') ||
      lowerText.includes('ฉลาก')
    ) {
      return 'labeling';
    }

    if (
      lowerText.includes('safety') ||
      lowerText.includes('adverse') ||
      lowerText.includes('warning') ||
      lowerText.includes('安全性') ||
      lowerText.includes('不良反應')
    ) {
      return 'safety';
    }

    if (
      lowerText.includes('formulation') ||
      lowerText.includes('composition') ||
      lowerText.includes('配方')
    ) {
      return 'formulation';
    }

    if (
      lowerText.includes('indication') ||
      lowerText.includes('therapeutic use') ||
      lowerText.includes('適應症')
    ) {
      return 'indication';
    }

    return 'other';
  }

  /**
   * Calculate NLP confidence score
   */
  private calculateNLPConfidence(entities: {
    affectedProducts: string[];
    therapeuticCategories: string[];
    activeIngredients: string[];
  }): number {
    let confidence = 0;

    // Product names extracted: +40 points
    if (entities.affectedProducts.length > 0) {
      confidence += Math.min(40, entities.affectedProducts.length * 10);
    }

    // Therapeutic categories: +30 points
    if (entities.therapeuticCategories.length > 0) {
      confidence += Math.min(30, entities.therapeuticCategories.length * 10);
    }

    // Active ingredients: +30 points
    if (entities.activeIngredients.length > 0) {
      confidence += Math.min(30, entities.activeIngredients.length * 10);
    }

    return Math.min(100, confidence);
  }

  /**
   * Match announcement to PILs in database
   */
  private async matchToPILs(
    announcement: RegulatoryAnnouncement,
    parsed: ParsedAnnouncement
  ): Promise<ProductMatch[]> {
    const matches: ProductMatch[] = [];

    // Get all PILs for the same market
    const pils = await this.pilRepository.find({
      where: { market: announcement.authority },
    });

    for (const pil of pils) {
      const matchResult = this.calculatePILMatch(pil, parsed);
      if (matchResult.matchConfidence >= 50) { // 50% threshold
        matches.push({
          pilId: pil.id,
          productName: pil.productName,
          matchConfidence: matchResult.matchConfidence,
          matchReasons: matchResult.matchReasons,
        });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence);

    return matches;
  }

  /**
   * Calculate match confidence between PIL and announcement
   */
  private calculatePILMatch(
    pil: PIL,
    parsed: ParsedAnnouncement
  ): { matchConfidence: number; matchReasons: ProductMatch['matchReasons'] } {
    let confidence = 0;
    const matchReasons: ProductMatch['matchReasons'] = {};

    // Registration number match (highest confidence)
    if (pil.regulatoryRefNumber) {
      const regNumberMatch = parsed.affectedProducts.some((product) =>
        product.includes(pil.regulatoryRefNumber!)
      );
      if (regNumberMatch) {
        confidence += 60;
        matchReasons.registrationNumberMatch = true;
      }
    }

    // Product name match
    const productNameMatch = parsed.affectedProducts.some((product) =>
      this.fuzzyMatch(product, pil.productName)
    );
    if (productNameMatch) {
      confidence += 30;
      matchReasons.productNameMatch = true;
    }

    // Therapeutic category match (if PIL has category metadata)
    // This would require PIL metadata structure - simplified for now
    if (parsed.therapeuticCategories.length > 0) {
      confidence += 5;
      matchReasons.therapeuticCategoryMatch = true;
    }

    // Active ingredient match (if PIL has ingredient metadata)
    if (parsed.activeIngredients.length > 0) {
      confidence += 5;
      matchReasons.ingredientMatch = true;
    }

    return { matchConfidence: Math.min(100, confidence), matchReasons };
  }

  /**
   * Fuzzy string matching for product names
   */
  private fuzzyMatch(str1: string, str2: string): boolean {
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');

    // Exact match
    if (s1 === s2) return true;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Levenshtein distance (simplified)
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= 0.7; // 70% similarity threshold
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Store PIL matches in database
   */
  private async storeMatches(
    announcementId: number,
    matches: ProductMatch[]
  ): Promise<void> {
    for (const match of matches) {
      // Check if variation already exists
      const existing = await this.variationRepository.findOne({
        where: {
          announcementId,
          pilId: match.pilId,
        },
      });

      if (!existing) {
        const variation = this.variationRepository.create({
          announcementId,
          pilId: match.pilId,
          matchConfidence: match.matchConfidence,
          matchReasons: match.matchReasons,
          detectedAt: new Date(),
        });

        await this.variationRepository.save(variation);

        // Log variation detection
        await this.auditLogger.logVariationDetection(
          match.pilId,
          announcementId,
          match.matchConfidence
        );
      }
    }
  }

  /**
   * Get announcements with no affected PILs (for TC-036)
   */
  async getAnnouncementsWithNoPILs(): Promise<RegulatoryAnnouncement[]> {
    return this.announcementRepository.find({
      where: { hasAffectedPILs: false },
      order: { publishedAt: 'DESC' },
    });
  }
}