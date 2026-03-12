import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { PIL } from './pil.model';

export type RegulatoryAuthority = 'TFDA' | 'FDA_Thailand' | 'DAV';

export interface AffectedProduct {
  registrationNumber?: string;
  productName?: string;
  therapeuticCategory?: string;
  activeIngredients?: string[];
  matchConfidence?: number;
}

export interface AnnouncementMetadata {
  rawContent?: string;
  parsedSections?: Record<string, string>;
  nlpConfidence?: number;
  processingErrors?: string[];
  webhookSource?: string;
  pollingSource?: string;
}

@Entity('regulatory_announcements')
@Index(['authority', 'publishedAt'])
@Index(['announcementId', 'authority'], { unique: true })
export class RegulatoryAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['TFDA', 'FDA_Thailand', 'DAV'],
  })
  authority: RegulatoryAuthority;

  @Column({ type: 'varchar', length: 100 })
  announcementId: string;

  @Column({ type: 'timestamptz' })
  publishedAt: Date;

  @Column({ type: 'text', array: true, default: '{}' })
  affectedProducts: string[];

  @Column({ type: 'jsonb', nullable: true })
  affectedProductDetails: AffectedProduct[];

  @Column({ type: 'text' })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: AnnouncementMetadata;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;

  @Column({ type: 'boolean', default: false })
  hasAffectedPILs: boolean;

  @Column({ type: 'int', default: 0 })
  matchedPILCount: number;

  @ManyToMany(() => PIL, (pil) => pil.relatedAnnouncements)
  @JoinTable({
    name: 'announcement_pil_variations',
    joinColumn: { name: 'announcement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pil_id', referencedColumnName: 'id' },
  })
  affectedPILs: PIL[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('announcement_pil_variations')
@Index(['announcementId', 'pilId'], { unique: true })
export class AnnouncementPILVariation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'announcement_id' })
  announcementId: number;

  @Column({ name: 'pil_id' })
  pilId: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  matchConfidence: number;

  @Column({ type: 'jsonb', nullable: true })
  matchReasons: {
    registrationNumberMatch?: boolean;
    productNameMatch?: boolean;
    ingredientMatch?: boolean;
    therapeuticCategoryMatch?: boolean;
  };

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  detectedAt: Date;

  @Column({ type: 'boolean', default: false })
  variationCreated: boolean;

  @Column({ type: 'int', nullable: true })
  variationPILId: number;
}