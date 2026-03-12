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
import { RevisionRound } from './revision-round.model';
import { User } from './user.model';

export enum ArtworkStatus {
  PENDING_UPLOAD = 'pending_upload',
  UPLOADED = 'uploaded',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('artwork_revisions')
@Index(['revisionRoundId', 'versionNumber'])
export class ArtworkRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'revision_round_id' })
  revisionRoundId: number;

  @ManyToOne(() => RevisionRound, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'revision_round_id' })
  revisionRound: RevisionRound;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ name: 'artwork_path' })
  artworkPath: string; // S3 path to PDF

  @Column({ name: 'visual_diff_path', nullable: true })
  visualDiffPath: string | null; // S3 path to diff PDF

  @Column({
    type: 'enum',
    enum: ArtworkStatus,
    default: ArtworkStatus.UPLOADED,
  })
  status: ArtworkStatus;

  @Column({ name: 'file_size_bytes' })
  fileSizeBytes: number;

  @Column({ name: 'file_hash' })
  fileHash: string; // SHA-256 hash for integrity

  @Column({ name: 'uploaded_by' })
  uploadedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}