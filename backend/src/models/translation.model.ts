import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PIL } from './pil.model';
import { User } from './user.model';

@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pil_id' })
  pilId: number;

  @ManyToOne(() => PIL, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pil_id' })
  pil: PIL;

  @Column({ name: 'source_language', length: 5, default: 'en' })
  sourceLanguage: string;

  @Column({ name: 'target_language', length: 5 })
  targetLanguage: string;

  @Column({ name: 'llm_model', length: 100 })
  llmModel: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number;

  @Column({ name: 'source_document', type: 'text' })
  sourceDocument: string;

  @Column({ name: 'output_document', type: 'text' })
  outputDocument: string;

  @Column({ name: 'traceability_log', type: 'jsonb' })
  traceabilityLog: any;

  @Column({ name: 'translated_by', length: 10 })
  translatedBy: 'AI' | 'human';

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}