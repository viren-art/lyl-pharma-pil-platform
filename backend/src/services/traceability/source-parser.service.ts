import { logger } from '../../utils/logger';
import pdf from 'pdf-parse';

interface ParsedParagraph {
  pageNumber: number;
  paragraphNumber: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

interface ParsedDocument {
  totalPages: number;
  paragraphs: ParsedParagraph[];
  fullText: string;
}

export class SourceParserService {
  async parseSourceDocument(documentBuffer: Buffer): Promise<ParsedDocument> {
    try {
      const data = await pdf(documentBuffer);

      const paragraphs: ParsedParagraph[] = [];
      let globalIndex = 0;
      let paragraphCounter = 0;

      // Split by pages
      const pages = data.text.split('\f'); // Form feed character separates pages

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageText = pages[pageIndex];
        const pageNumber = pageIndex + 1;

        // Split page into paragraphs (double newline or section headers)
        const pageParagraphs = this.splitIntoParagraphs(pageText);

        for (const paragraphText of pageParagraphs) {
          if (paragraphText.trim().length === 0) {
            continue;
          }

          paragraphCounter++;
          const startIndex = globalIndex;
          const endIndex = globalIndex + paragraphText.length;

          paragraphs.push({
            pageNumber,
            paragraphNumber: paragraphCounter,
            text: paragraphText.trim(),
            startIndex,
            endIndex,
          });

          globalIndex = endIndex + 1; // +1 for newline
        }
      }

      logger.info({
        message: 'Source document parsed',
        totalPages: data.numpages,
        totalParagraphs: paragraphs.length,
      });

      return {
        totalPages: data.numpages,
        paragraphs,
        fullText: data.text,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to parse source document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  findSourceReferences(
    parsedDocument: ParsedDocument,
    targetText: string,
    maxReferences: number = 3
  ): Array<{
    pageNumber: number;
    paragraphNumber: number;
    sourceText: string;
    startIndex: number;
    endIndex: number;
    similarity: number;
  }> {
    const references: Array<{
      pageNumber: number;
      paragraphNumber: number;
      sourceText: string;
      startIndex: number;
      endIndex: number;
      similarity: number;
    }> = [];

    // Calculate similarity scores for all paragraphs
    for (const paragraph of parsedDocument.paragraphs) {
      const similarity = this.calculateSimilarity(targetText, paragraph.text);

      if (similarity > 0.3) {
        // Threshold for relevance
        references.push({
          pageNumber: paragraph.pageNumber,
          paragraphNumber: paragraph.paragraphNumber,
          sourceText: paragraph.text,
          startIndex: paragraph.startIndex,
          endIndex: paragraph.endIndex,
          similarity,
        });
      }
    }

    // Sort by similarity and return top matches
    return references.sort((a, b) => b.similarity - a.similarity).slice(0, maxReferences);
  }

  private splitIntoParagraphs(text: string): string[] {
    // Split by double newlines or common PIL section headers
    const sectionHeaders = [
      'What is',
      'Before you take',
      'How to take',
      'Possible side effects',
      'How to store',
      'Contents of the pack',
      'Contraindications',
      'Dosage',
      'Warnings',
      'Precautions',
    ];

    let paragraphs: string[] = [];
    let currentParagraph = '';

    const lines = text.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if line is a section header
      const isHeader = sectionHeaders.some((header) =>
        trimmedLine.toLowerCase().startsWith(header.toLowerCase())
      );

      if (isHeader && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = trimmedLine;
      } else if (trimmedLine.length === 0 && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      } else {
        currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + trimmedLine;
      }
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity using Jaccard index
    const words1 = new Set(
      text1
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
    const words2 = new Set(
      text2
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}