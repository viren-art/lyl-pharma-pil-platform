import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.model';

@Entity('translation_memory')
export class TranslationMemory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'source_term', type: 'text' })
  sourceTerm: string;

  @Column({ name: 'target_term', type: 'text' })
  targetTerm: string;

  @Column({ name: 'source_language', length: 5, default: 'en' })
  sourceLanguage: string;

  @Column({ name: 'target_language', length: 5 })
  targetLanguage: string;

  @Column({ name: 'market_applicability', length: 20, nullable: true })
  marketApplicability: 'TFDA' | 'FDA_Thailand' | 'DAV' | 'all' | null;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}