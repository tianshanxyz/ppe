import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum RuleType {
  REQUIRED = 'required',
  PATTERN = 'pattern',
  RANGE = 'range',
  LENGTH = 'length',
  UNIQUE = 'unique',
  REFERENCE = 'reference',
  CUSTOM = 'custom',
}

export enum RuleSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RuleScope {
  PPE = 'ppe',
  REGULATION = 'regulation',
  COMPANY = 'company',
  GLOBAL = 'global',
}

@Entity('quality_rules')
@Index(['scope', 'resource_type'])
@Index(['is_active', 'created_at'])
export class QualityRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RuleType, default: RuleType.CUSTOM })
  ruleType: RuleType;

  @Column({ type: 'enum', enum: RuleScope, default: RuleScope.GLOBAL })
  scope: RuleScope;

  @Column({ name: 'resource_type', length: 100 })
  resourceType: string;

  @Column({ name: 'field_path', length: 255 })
  fieldPath: string;

  @Column({ type: 'text' })
  expression: string;

  @Column({ name: 'error_message', length: 500 })
  errorMessage: string;

  @Column({ type: 'enum', enum: RuleSeverity, default: RuleSeverity.MEDIUM })
  severity: RuleSeverity;

  @Column({ name: 'execution_order', default: 100 })
  executionOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ruleType: this.ruleType,
      scope: this.scope,
      resourceType: this.resourceType,
      fieldPath: this.fieldPath,
      expression: this.expression,
      errorMessage: this.errorMessage,
      severity: this.severity,
      executionOrder: this.executionOrder,
      isActive: this.isActive,
      metadata: this.metadata,
      createdById: this.createdById,
      updatedById: this.updatedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
