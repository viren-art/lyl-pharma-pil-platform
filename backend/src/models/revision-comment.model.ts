import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RevisionRound } from './revision-round.model';
import { ArtworkRevision } from './artwork-revision.model';
import { User } from './user.model';

export enum CommentType {
  GENERAL = 'general',
  CHANGE_REQUEST = 'change_request',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  QUESTION = 'question',
}

@Entity('revision_comments')
@Index(['revisionRoundId', 'createdAt'])
@Index(['artworkRevisionId', 'createdAt'])
export class RevisionComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'revision_round_id' })
  revisionRoundId: number;

  @ManyToOne(() => RevisionRound, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'revision_round_id' })
  revisionRound: RevisionRound;

  @Column({ name: 'artwork_revision_id', nullable: true })
  artworkRevisionId: number | null;

  @ManyToOne(() => ArtworkRevision, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artwork_revision_id' })
  artworkRevision: ArtworkRevision | null;

  @Column({
    type: 'enum',
    enum: CommentType,
    default: CommentType.GENERAL,
  })
  type: CommentType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'section_reference', nullable: true })
  sectionReference: string | null; // e.g., "Page 2, Dosage section"

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  author: User;

  @Column({ name: 'is_internal', default: false })
  isInternal: boolean; // Internal comments not visible to suppliers

  @Column({ name: 'parent_comment_id', nullable: true })
  parentCommentId: number | null; // For threaded comments

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}