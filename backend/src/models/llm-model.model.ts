import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.model';

export enum ModelStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  TESTING = 'testing',
  ARCHIVED = 'archived',
}

export enum TrainingDataSource {
  INNOVATOR_PILS = 'innovator_pils',
  TFDA_APPROVED = 'tfda_approved',
  FDA_THAILAND_APPROVED = 'fda_thailand_approved',
  DAV_APPROVED = 'dav_approved',
  PHARMACEUTICAL_CORPUS = 'pharmaceutical_corpus',
  REGULATORY_GUIDELINES = 'regulatory_guidelines',
}

@Entity('llm_models')
export class LLMModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  modelVersion: string; // e.g., "gpt-4-pharma-v2.1"

  @Column({ type: 'varchar', length: 50 })
  baseModel: string; // e.g., "gpt-4-turbo"

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.TESTING,
  })
  status: ModelStatus;

  @Column({ type: 'jsonb' })
  trainingDataProvenance: {
    sources: Array<{
      type: TrainingDataSource;
      documentCount: number;
      dateRange: { from: string; to: string };
      s3Path: string;
      checksum: string;
    }>;
    totalDocuments: number;
    totalTokens: number;
    trainingStartDate: string;
    trainingEndDate: string;
    trainingDurationHours: number;
  };

  @Column({ type: 'jsonb' })
  confidenceScoringMethodology: {
    algorithm: string; // e.g., "ensemble_voting"
    thresholds: {
      autoApprove: number; // e.g., 85
      humanReview: number; // e.g., 70
      reject: number; // e.g., 50
    };
    factors: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
    calibrationDataset: {
      size: number;
      accuracy: number;
      s3Path: string;
    };
  };

  @Column({ type: 'jsonb' })
  validationTestResults: {
    testDate: string;
    testDatasetSize: number;
    metrics: {
      overallAccuracy: number;
      precisionBySection: Record<string, number>;
      recallBySection: Record<string, number>;
      f1ScoreBySection: Record<string, number>;
      averageConfidenceScore: number;
      confidenceCalibrationError: number;
    };
    languagePerformance: Array<{
      language: string;
      accuracy: number;
      bleuScore: number;
      humanEvaluationScore: number;
    }>;
    pharmaceuticalTerminologyAccuracy: number;
    regulatoryComplianceRate: number;
    testReportS3Path: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  humanInTheLoopStatistics: {
    totalTranslations: number;
    autoApproved: number;
    humanReviewed: number;
    humanOverrides: number;
    overrideReasons: Record<string, number>;
    averageReviewTimeMinutes: number;
  };

  @Column({ type: 'text', nullable: true })
  apiEndpoint: string; // OpenAI API endpoint or custom endpoint

  @Column({ type: 'jsonb', nullable: true })
  apiConfiguration: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  fineTuningJobId: string; // OpenAI fine-tuning job ID

  @Column({ type: 'text', nullable: true })
  fineTuningDatasetS3Path: string;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deprecatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validated_by' })
  validatedBy: User;

  @Column({ type: 'int', nullable: true })
  validated_by: number;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt: Date;

  @Column({ type: 'text', nullable: true })
  validationNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  complianceAttestations: Array<{
    authority: 'TFDA' | 'FDA_Thailand' | 'DAV';
    attestedBy: string;
    attestedAt: string;
    attestationDocument: string; // S3 path
    expiryDate: string;
  }>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}