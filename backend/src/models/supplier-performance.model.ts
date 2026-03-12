import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Supplier } from './supplier.model';

@Entity('supplier_performance')
@Index(['supplierId', 'periodStart', 'periodEnd'])
export class SupplierPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @Column({ name: 'total_revisions' })
  totalRevisions: number;

  @Column({ name: 'avg_revision_rounds', type: 'decimal', precision: 5, scale: 2 })
  avgRevisionRounds: number;

  @Column({ name: 'avg_turnaround_hours', type: 'decimal', precision: 10, scale: 2 })
  avgTurnaroundHours: number;

  @Column({ name: 'first_time_approval_rate', type: 'decimal', precision: 5, scale: 2 })
  firstTimeApprovalRate: number; // Percentage

  @Column({ name: 'on_time_delivery_rate', type: 'decimal', precision: 5, scale: 2 })
  onTimeDeliveryRate: number; // Percentage

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2 })
  qualityScore: number; // 0-100

  @Column({ name: 'total_comments_received' })
  totalCommentsReceived: number;

  @Column({ name: 'avg_comments_per_revision', type: 'decimal', precision: 5, scale: 2 })
  avgCommentsPerRevision: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional metrics

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}