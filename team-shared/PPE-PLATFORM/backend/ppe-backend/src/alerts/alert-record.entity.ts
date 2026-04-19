import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AlertLevel, AlertType } from './alert-rule.entity';

@Entity('alert_records')
@Index(['rule_id', 'status'])
@Index(['level', 'status'])
@Index(['created_at'])
export class AlertRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id' })
  ruleId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: AlertLevel })
  level: AlertLevel;

  @Column({ type: 'enum', enum: AlertType })
  alertType: AlertType;

  @Column({ name: 'trigger_data', type: 'jsonb', nullable: true })
  triggerData: Record<string, any>;

  @Column({ name: 'trigger_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  triggerValue: number;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  thresholdValue: number;

  @Column({ name: 'affected_records', type: 'jsonb', nullable: true })
  affectedRecords: string[];

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      title: this.title,
      message: this.message,
      level: this.level,
      alertType: this.alertType,
      triggerData: this.triggerData,
      triggerValue: this.triggerValue,
      thresholdValue: this.thresholdValue,
      affectedRecords: this.affectedRecords,
      status: this.status,
      processedAt: this.processedAt,
      processedBy: this.processedBy,
      resolution: this.resolution,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
