import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RegulationType {
  LAW = 'law',
  REGULATION = 'regulation',
  RULE = 'rule',
  STANDARD = 'standard',
  GUIDELINE = 'guideline',
  NOTICE = 'notice',
  OTHER = 'other',
}

export enum RegulationLevel {
  NATIONAL = 'national',
  INDUSTRY = 'industry',
  LOCAL = 'local',
  ENTERPRISE = 'enterprise',
}

export enum RegulationStatus {
  EFFECTIVE = 'effective',
  REPEALED = 'repealed',
  AMENDED = 'amended',
  DRAFT = 'draft',
}

@Entity('regulations')
@Index(['regulation_type', 'level'])
@Index(['issuing_agency'])
@Index(['release_date'])
@Index(['status'])
export class Regulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  subtitle: string;

  @Column({ name: 'document_number', length: 200, nullable: true })
  documentNumber: string;

  @Column({ type: 'enum', enum: RegulationType, default: RegulationType.OTHER })
  regulationType: RegulationType;

  @Column({ type: 'enum', enum: RegulationLevel, default: RegulationLevel.NATIONAL })
  level: RegulationLevel;

  @Column({ name: 'issuing_agency', length: 255, nullable: true })
  issuingAgency: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: Date;

  @Column({ name: 'implementation_date', type: 'date', nullable: true })
  implementationDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'enum', enum: RegulationStatus, default: RegulationStatus.EFFECTIVE })
  status: RegulationStatus;

  @Column({ name: 'applicable_fields', type: 'jsonb', nullable: true })
  applicableFields: string[];

  @Column({ name: 'related_regulations', type: 'jsonb', nullable: true })
  relatedRegulations: string[];

  @Column({ name: 'keywords', type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ name: 'attachments', type: 'jsonb', nullable: true })
  attachments: Record<string, any>[];

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      subtitle: this.subtitle,
      documentNumber: this.documentNumber,
      regulationType: this.regulationType,
      level: this.level,
      issuingAgency: this.issuingAgency,
      content: this.content,
      summary: this.summary,
      releaseDate: this.releaseDate,
      implementationDate: this.implementationDate,
      expiryDate: this.expiryDate,
      status: this.status,
      applicableFields: this.applicableFields,
      relatedRegulations: this.relatedRegulations,
      keywords: this.keywords,
      attachments: this.attachments,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
