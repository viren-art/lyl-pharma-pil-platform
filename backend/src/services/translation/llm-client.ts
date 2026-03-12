import OpenAI from 'openai';
import { logger } from '../../utils/logger';
import { TranslationMemoryService } from '../translation-memory/translation-memory.service';
import pLimit from 'p-limit';

interface TranslationSection {
  sectionName: string;
  sourceText: string;
  translatedText: string;
  confidenceScore: number;
  sourceReferences: Array<{
    pageNumber: number;
    paragraphNumber: number;
  }>;
}

interface TranslationResult {
  sections: TranslationSection[];
  overallConfidence: number;
  llmModelVersion: string;
  processingTimeMs: number;
}

export class LLMClient {
  private openai: OpenAI;
  private translationMemory: TranslationMemoryService;
  private readonly CONFIDENCE_THRESHOLD = 85;
  private readonly MODEL_VERSION = 'gpt-4-1106-preview';
  private readonly MAX_CONCURRENT_REQUESTS = 5; // Parallel LLM calls
  private readonly BATCH_SIZE = 3; // Sections per batch for context sharing
  private readonly TRANSLATION_TIMEOUT_MS = 90000; // 90 second SLA
  private readonly PER_SECTION_TIMEOUT_MS = 15000; // 15 seconds per section

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: this.PER_SECTION_TIMEOUT_MS,
    });
    this.translationMemory = new TranslationMemoryService();
  }

  async translatePIL(
    sourceText: string,
    targetLanguage: string,
    productName: string
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      // Enforce 90-second timeout at PIL level
      const translationPromise = this.performTranslation(
        sourceText,
        targetLanguage,
        productName
      );

      const result = await Promise.race([
        translationPromise,
        this.createTimeoutPromise(this.TRANSLATION_TIMEOUT_MS),
      ]);

      const processingTimeMs = Date.now() - startTime;

      logger.info('PIL translation completed', {
        productName,
        targetLanguage,
        overallConfidence: result.overallConfidence,
        processingTimeMs,
        sectionsCount: result.sections.length,
        parallelProcessing: true,
        withinSLA: processingTimeMs <= this.TRANSLATION_TIMEOUT_MS,
      });

      return {
        ...result,
        processingTimeMs,
      };
    } catch (error) {
      logger.error('PIL translation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productName,
        targetLanguage,
      });
      throw error;
    }
  }

  private async performTranslation(
    sourceText: string,
    targetLanguage: string,
    productName: string
  ): Promise<TranslationResult> {
    // Split PIL into sections for granular confidence scoring
    const sections = this.splitIntoSections(sourceText);
    
    // Get pharmaceutical terminology from translation memory (TFDA-approved)
    const terminology = await this.translationMemory.getTerminologyForLanguage(
      targetLanguage
    );

    // Parallel processing with concurrency limit to meet 90s SLA
    const limit = pLimit(this.MAX_CONCURRENT_REQUESTS);
    const translationPromises = sections.map((section) =>
      limit(() =>
        this.translateSection(section, targetLanguage, terminology, productName)
      )
    );

    const translatedSections = await Promise.all(translationPromises);

    const overallConfidence = this.calculateOverallConfidence(translatedSections);

    return {
      sections: translatedSections,
      overallConfidence,
      llmModelVersion: this.MODEL_VERSION,
      processingTimeMs: 0, // Will be set by caller
    };
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Translation timeout: exceeded ${timeoutMs}ms SLA`));
      }, timeoutMs);
    });
  }

  private splitIntoSections(sourceText: string): Array<{
    name: string;
    content: string;
    pageNumber: number;
    paragraphNumber: number;
  }> {
    // Common PIL section headers
    const sectionHeaders = [
      'PRODUCT NAME',
      'COMPOSITION',
      'PHARMACEUTICAL FORM',
      'CLINICAL PARTICULARS',
      'THERAPEUTIC INDICATIONS',
      'POSOLOGY AND METHOD OF ADMINISTRATION',
      'CONTRAINDICATIONS',
      'SPECIAL WARNINGS AND PRECAUTIONS FOR USE',
      'INTERACTION WITH OTHER MEDICINAL PRODUCTS',
      'PREGNANCY AND LACTATION',
      'EFFECTS ON ABILITY TO DRIVE',
      'UNDESIRABLE EFFECTS',
      'OVERDOSE',
      'PHARMACOLOGICAL PROPERTIES',
      'PHARMACEUTICAL PARTICULARS',
      'SHELF LIFE',
      'STORAGE CONDITIONS',
      'NATURE AND CONTENTS OF CONTAINER',
    ];

    const sections: Array<{
      name: string;
      content: string;
      pageNumber: number;
      paragraphNumber: number;
    }> = [];

    let currentSection = { name: 'HEADER', content: '', pageNumber: 1, paragraphNumber: 1 };
    const lines = sourceText.split('\n');
    let paragraphCounter = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a section header
      const matchedHeader = sectionHeaders.find(header => 
        trimmedLine.toUpperCase().includes(header)
      );

      if (matchedHeader) {
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          name: matchedHeader,
          content: '',
          pageNumber: Math.floor(paragraphCounter / 40) + 1, // Approximate page breaks
          paragraphNumber: paragraphCounter,
        };
        paragraphCounter++;
      } else {
        currentSection.content += line + '\n';
        if (trimmedLine.length > 0) {
          paragraphCounter++;
        }
      }
    }

    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  private async translateSection(
    section: { name: string; content: string; pageNumber: number; paragraphNumber: number },
    targetLanguage: string,
    terminology: Map<string, string>,
    productName: string
  ): Promise<TranslationSection> {
    const languageMap: Record<string, string> = {
      'zh-TW': 'Traditional Chinese',
      'th': 'Thai',
      'vi': 'Vietnamese',
    };

    const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

    // Build pharmaceutical terminology glossary for prompt with TFDA enforcement
    const glossaryEntries = Array.from(terminology.entries())
      .map(([source, target]) => `- ${source} → ${target}`)
      .join('\n');

    const systemPrompt = `You are a pharmaceutical translation expert specializing in Patient Information Leaflets (PILs) for regulatory submissions.

CRITICAL REQUIREMENTS:
1. Use ONLY approved pharmaceutical terminology from the TFDA-validated glossary below
2. Maintain exact dosage numbers, contraindication lists, and adverse reaction terminology
3. Preserve regulatory formatting and section structure
4. Output MUST include a confidence score (0-100) for translation accuracy
5. DO NOT use terminology outside the approved glossary - if a term is missing, use the English term and set confidence to 70

TFDA-APPROVED TERMINOLOGY GLOSSARY (MANDATORY):
${glossaryEntries}

For sections containing critical safety information (contraindications, dosage, adverse reactions), confidence scores below 85 are unacceptable and require human review.

CONFIDENCE SCORING GUIDELINES:
- 95-100: Perfect terminology match, no ambiguity
- 85-94: Good terminology match, minor context variations
- 70-84: Missing approved terms or moderate ambiguity (requires human review)
- Below 70: Significant terminology gaps or high ambiguity (requires human review)

Output format must be valid JSON:
{
  "translatedText": "translated content here",
  "confidenceScore": 95,
  "criticalTermsUsed": ["term1", "term2"],
  "unapprovedTermsDetected": ["term3"]
}`;

    const userPrompt = `Translate the following PIL section from English to ${targetLanguageName}.

Product: ${productName}
Section: ${section.name}

Source text:
${section.content}

Provide translation with confidence score. Use ONLY TFDA-approved terminology from the glossary.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.MODEL_VERSION,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for consistency
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(response);

      // Validate confidence score bounds (0-100)
      let confidenceScore = parsed.confidenceScore;
      if (typeof confidenceScore !== 'number' || confidenceScore < 0 || confidenceScore > 100) {
        logger.warn('Invalid confidence score from LLM, clamping to valid range', {
          sectionName: section.name,
          rawScore: confidenceScore,
        });
        confidenceScore = Math.max(0, Math.min(100, confidenceScore || 0));
      }

      // Flag unapproved terminology usage
      if (parsed.unapprovedTermsDetected && parsed.unapprovedTermsDetected.length > 0) {
        logger.warn('Unapproved TFDA terminology detected in translation', {
          sectionName: section.name,
          unapprovedTerms: parsed.unapprovedTermsDetected,
        });
        // Reduce confidence score for unapproved terminology
        confidenceScore = Math.min(confidenceScore, 75);
      }

      return {
        sectionName: section.name,
        sourceText: section.content,
        translatedText: parsed.translatedText,
        confidenceScore,
        sourceReferences: [
          {
            pageNumber: section.pageNumber,
            paragraphNumber: section.paragraphNumber,
          },
        ],
      };
    } catch (error) {
      logger.error('Section translation failed', {
        sectionName: section.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return low-confidence placeholder for failed translations
      return {
        sectionName: section.name,
        sourceText: section.content,
        translatedText: '[TRANSLATION FAILED - REQUIRES HUMAN REVIEW]',
        confidenceScore: 0,
        sourceReferences: [
          {
            pageNumber: section.pageNumber,
            paragraphNumber: section.paragraphNumber,
          },
        ],
      };
    }
  }

  private calculateOverallConfidence(sections: TranslationSection[]): number {
    if (sections.length === 0) return 0;

    // Weight critical sections more heavily
    const criticalSections = [
      'CONTRAINDICATIONS',
      'POSOLOGY AND METHOD OF ADMINISTRATION',
      'UNDESIRABLE EFFECTS',
      'OVERDOSE',
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    for (const section of sections) {
      const weight = criticalSections.includes(section.sectionName) ? 2.0 : 1.0;
      weightedSum += section.confidenceScore * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  isLowConfidence(confidenceScore: number): boolean {
    return confidenceScore < this.CONFIDENCE_THRESHOLD;
  }
}