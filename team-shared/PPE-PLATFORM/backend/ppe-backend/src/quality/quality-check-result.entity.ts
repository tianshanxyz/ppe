import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QualityRule } from './quality-rule.entity';

export enum CheckStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  SKIPPED = 'skipped',
}

@Entity('quality_check_results')
@Index(['resource_id', 'resource_type'])
@Index(['rule_id', 'created_at'])
@Index(['status', 'created_at'])
export class QualityCheckResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_type', length: 100 })
  resourceType: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ name: 'rule_id' })
  ruleId: string;

  @ManyToOne(() => QualityRule)
  @JoinColumn({ name: 'rule_id' })
  rule: QualityRule;

  @Column({ type: 'enum', enum: CheckStatus, default: CheckStatus.PASSED })
  status: CheckStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'field_value', type: 'text', nullable: true })
  fieldValue: string;

  @Column({ name: 'expected_value', type: 'text', nullable: true })
  expectedValue: string;

  @Column({ name: 'severity_weight', type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  severityWeight: number;

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      ruleId: this.ruleId,
      status: this.status,
      message: this.message,
      fieldValue: this.fieldValue,
      expectedValue: this.expectedValue,
      severityWeight: parseFloat(this.severityWeight as unknown as string),
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
