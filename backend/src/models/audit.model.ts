import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.model';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  @Index()
  entityType: string; // 'pil', 'translation', 'approval_gate', 'revision_round', etc.

  @Column({ type: 'integer', nullable: false })
  entityId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  action: string; // 'create', 'update', 'approve', 'submit', 'translate', 'format', etc.

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'jsonb', nullable: true })
  beforeState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  afterState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // LLM model version, confidence scores, etc.

  @Column({ type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 64, nullable: false })
  eventHash: string; // SHA-256 hash for tamper detection

  @Column({ type: 'varchar', length: 64, nullable: true })
  previousEventHash: string | null; // Chain to previous event for blockchain-like verification

  @Column({ type: 'varchar', length: 100, nullable: true })
  traceId: string | null; // Distributed tracing ID (AWS X-Ray)

  @Column({ type: 'varchar', length: 50, nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}