import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { PIL } from './pil.model';
import { Supplier } from './supplier.model';

export enum RevisionStatus {
  PENDING_SUPPLIER = 'pending_supplier',
  SUPPLIER_REVIEW = 'supplier_review',
  INTERNAL_REVIEW = 'internal_review',
  APPROVED = 'approved',
}

@Entity('revision_rounds')
@Unique(['pilId', 'roundNumber'])
@Index(['pilId', 'status'])
export class RevisionRound {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pil_id' })
  pilId: number;

  @ManyToOne(() => PIL, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pil_id' })
  pil: PIL;

  @Column({ name: 'round_number', type: 'int' })
  roundNumber: number;

  @Column({ name: 'artwork_version', type: 'varchar', length: 50 })
  artworkVersion: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId?: number;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @Column({
    type: 'varchar',
    length: 20,
    default: RevisionStatus.PENDING_SUPPLIER,
  })
  status: RevisionStatus;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}