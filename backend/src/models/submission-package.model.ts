import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PIL } from './pil.model';
import { User } from './user.model';

@Entity('submission_packages')
export class SubmissionPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pil_id' })
  pilId: number;

  @ManyToOne(() => PIL, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pil_id' })
  pil: PIL;

  @Column({
    type: 'varchar',
    length: 20,
    check: "market IN ('TFDA', 'FDA_Thailand', 'DAV')",
  })
  market: 'TFDA' | 'FDA_Thailand' | 'DAV';

  @Column({ name: 'package_path', type: 'text' })
  packagePath: string;

  @Column({ name: 'generated_by' })
  generatedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generated_by' })
  generatedByUser: User;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({
    name: 'submission_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    check: "submission_status IN ('pending', 'submitted', 'approved', 'rejected')",
  })
  submissionStatus: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
}