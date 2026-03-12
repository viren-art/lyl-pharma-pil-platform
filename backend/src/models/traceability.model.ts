import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Translation } from './translation.model';

@Entity('traceability_links')
@Index(['translationId', 'targetSection'])
@Index(['sourceDocumentHash'])
export class TraceabilityLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'translation_id' })
  translationId: number;

  @ManyToOne(() => Translation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'translation_id' })
  translation: Translation;

  @Column({ name: 'target_section', type: 'varchar', length: 100 })
  targetSection: string;

  @Column({ name: 'target_text', type: 'text' })
  targetText: string;

  @Column({ name: 'target_start_index', type: 'int' })
  targetStartIndex: number;

  @Column({ name: 'target_end_index', type: 'int' })
  targetEndIndex: number;

  @Column({ name: 'source_document_path', type: 'text' })
  sourceDocumentPath: string;

  @Column({ name: 'source_document_hash', type: 'varchar', length: 64 })
  sourceDocumentHash: string;

  @Column({ name: 'source_page_number', type: 'int' })
  sourcePageNumber: number;

  @Column({ name: 'source_paragraph_number', type: 'int' })
  sourceParagraphNumber: number;

  @Column({ name: 'source_text', type: 'text' })
  sourceText: string;

  @Column({ name: 'source_start_index', type: 'int' })
  sourceStartIndex: number;

  @Column({ name: 'source_end_index', type: 'int' })
  sourceEndIndex: number;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number;

  @Column({ name: 'link_hash', type: 'varchar', length: 64 })
  linkHash: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}