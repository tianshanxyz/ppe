import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MonitorType {
  DATA_QUALITY = 'data_quality',
  DATA_VOLUME = 'data_volume',
  TASK_STATUS = 'task_status',
  API_PERFORMANCE = 'api_performance',
  SYSTEM_HEALTH = 'system_health',
  CUSTOM = 'custom',
}

export enum MonitorStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export enum DataFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_HOUR = 'every_hour',
  EVERY_DAY = 'every_day',
}

@Entity('data_monitors')
@Index(['monitor_type', 'status'])
@Index(['data_source'])
@Index(['created_by'])
export class DataMonitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MonitorType, default: MonitorType.CUSTOM })
  monitorType: MonitorType;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.ACTIVE })
  status: MonitorStatus;

  @Column({ name: 'data_source', length: 255 })
  dataSource: string;

  @Column({ name: 'target_table', length: 255, nullable: true })
  targetTable: string;

  @Column({ name: 'target_field', length: 255, nullable: true })
  targetField: string;

  @Column({ name: 'check_frequency', type: 'enum', enum: DataFrequency, default: DataFrequency.EVERY_5_MINUTES })
  checkFrequency: DataFrequency;

  @Column({ name: 'metric_name', length: 255, nullable: true })
  metricName: string;

  @Column({ name: 'warning_threshold', type: 'decimal', precision: 15, scale: 2, nullable: true })
  warningThreshold: number;

  @Column({ name: 'critical_threshold', type: 'decimal', precision: 15, scale: 2, nullable: true })
  criticalThreshold: number;

  @Column({ name: 'alert_rule_id', nullable: true })
  alertRuleId: string;

  @Column({ name: 'notification_enabled', default: true })
  notificationEnabled: boolean;

  @Column({ name: 'last_check_at', type: 'timestamptz', nullable: true })
  lastCheckAt: Date;

  @Column({ name: 'last_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  lastValue: number;

  @Column({ name: 'last_status', length: 50, nullable: true })
  lastStatus: string;

  @Column({ name: 'check_count', default: 0 })
  checkCount: number;

  @Column({ name: 'alert_count', default: 0 })
  alertCount: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      monitorType: this.monitorType,
      status: this.status,
      dataSource: this.dataSource,
      targetTable: this.targetTable,
      targetField: this.targetField,
      checkFrequency: this.checkFrequency,
      metricName: this.metricName,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      alertRuleId: this.alertRuleId,
      notificationEnabled: this.notificationEnabled,
      lastCheckAt: this.lastCheckAt,
      lastValue: this.lastValue,
      lastStatus: this.lastStatus,
      checkCount: this.checkCount,
      alertCount: this.alertCount,
      createdBy: this.createdBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
