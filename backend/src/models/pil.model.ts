import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.model';

@Entity('pils')
export class PIL {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ length: 20 })
  market: 'TFDA' | 'FDA_Thailand' | 'DAV';

  @Column({ length: 20, default: 'draft' })
  status: 'draft' | 'review' | 'approved' | 'submitted';

  @Column({ name: 'source_type', length: 20 })
  sourceType: 'innovator' | 'variation';

  @Column({ name: 'innovator_pil_id', nullable: true })
  innovatorPILId: number | null;

  @ManyToOne(() => PIL, { nullable: true })
  @JoinColumn({ name: 'innovator_pil_id' })
  innovatorPIL: PIL | null;

  @Column({ name: 'approved_pil_id', nullable: true })
  approvedPILId: number | null;

  @ManyToOne(() => PIL, { nullable: true })
  @JoinColumn({ name: 'approved_pil_id' })
  approvedPIL: PIL | null;

  @Column({ name: 'regulatory_ref_number', length: 50, nullable: true })
  regulatoryRefNumber: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}