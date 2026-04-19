import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AlertType {
  DATA_CHANGE = 'data_change',
  QUALITY_ISSUE = 'quality_issue',
  REGULATION_UPDATE = 'regulation_update',
  TASK_FAILURE = 'task_failure',
  THRESHOLD = 'threshold',
  CUSTOM = 'custom',
}

export enum AlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  DISABLED = 'disabled',
}

export enum TriggerCondition {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  CONTAINS = 'contains',
  CHANGES = 'changes',
  NOT_EXISTS = 'not_exists',
  CUSTOM = 'custom',
}

@Entity('alert_rules')
@Index(['alert_type', 'status'])
@Index(['level'])
@Index(['created_by'])
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: AlertType, default: AlertType.CUSTOM })
  alertType: AlertType;

  @Column({ type: 'enum', enum: AlertLevel, default: AlertLevel.MEDIUM })
  level: AlertLevel;

  @Column({ name: 'data_source', length: 100 })
  dataSource: string;

  @Column({ name: 'target_field', length: 255, nullable: true })
  targetField: string;

  @Column({ type: 'enum', enum: TriggerCondition, default: TriggerCondition.CHANGES })
  triggerCondition: TriggerCondition;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  thresholdValue: number;

  @Column({ name: 'threshold_unit', length: 50, nullable: true })
  thresholdUnit: string;

  @Column({ name: 'filter_conditions', type: 'jsonb', nullable: true })
  filterConditions: Record<string, any>;

  @Column({ name: 'notification_channels', type: 'jsonb', nullable: true })
  notificationChannels: string[];

  @Column({ name: 'notification_template', type: 'text', nullable: true })
  notificationTemplate: string;

  @Column({ name: 'cooldown_period', default: 300 })
  cooldownPeriod: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status: AlertStatus;

  @Column({ name: 'trigger_count', default: 0 })
  triggerCount: number;

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      alertType: this.alertType,
      level: this.level,
      dataSource: this.dataSource,
      targetField: this.targetField,
      triggerCondition: this.triggerCondition,
      thresholdValue: this.thresholdValue,
      thresholdUnit: this.thresholdUnit,
      filterConditions: this.filterConditions,
      notificationChannels: this.notificationChannels,
      notificationTemplate: this.notificationTemplate,
      cooldownPeriod: this.cooldownPeriod,
      enabled: this.enabled,
      status: this.status,
      triggerCount: this.triggerCount,
      lastTriggeredAt: this.lastTriggeredAt,
      createdBy: this.createdBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
