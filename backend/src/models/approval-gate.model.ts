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
import { PIL } from './pil.model';
import { User } from './user.model';
import { RevisionRound } from './revision-round.model';

export enum GateType {
  TRANSLATION = 'translation',
  REGULATORY = 'regulatory',
  ARTWORK = 'artwork',
  FINAL_SUBMISSION = 'final_submission',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RequiredRole {
  TRANSLATOR = 'Translator',
  REGULATORY_REVIEWER = 'Regulatory_Reviewer',
  SUPPLIER = 'Supplier',
  APPROVER = 'Approver',
}

@Entity('approval_gates')
@Index(['pilId', 'status'])
@Index(['assignedToId', 'status'])
export class ApprovalGate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pil_id' })
  pilId: number;

  @ManyToOne(() => PIL, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pil_id' })
  pil: PIL;

  @Column({ name: 'revision_round_id', nullable: true })
  revisionRoundId?: number;

  @ManyToOne(() => RevisionRound, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'revision_round_id' })
  revisionRound?: RevisionRound;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'gate_type',
  })
  gateType: GateType;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'required_role',
  })
  requiredRole: RequiredRole;

  @Column({ name: 'assigned_to_id' })
  assignedToId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'sequence_order', type: 'int', default: 0 })
  sequenceOrder: number;

  @Column({ name: 'is_mandatory', type: 'boolean', default: true })
  isMandatory: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}