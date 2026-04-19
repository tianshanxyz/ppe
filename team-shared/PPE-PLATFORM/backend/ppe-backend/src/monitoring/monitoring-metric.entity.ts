import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MetricStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
  ERROR = 'error',
}

@Entity('monitoring_metrics')
@Index(['monitor_id', 'created_at'])
@Index(['status', 'created_at'])
@Index(['metric_name', 'created_at'])
export class MonitoringMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'monitor_id' })
  monitorId: string;

  @Column({ name: 'monitor_name', length: 255 })
  monitorName: string;

  @Column({ name: 'metric_name', length: 255 })
  metricName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  metricValue: number;

  @Column({ type: 'enum', enum: MetricStatus, default: MetricStatus.NORMAL })
  status: MetricStatus;

  @Column({ name: 'expected_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  expectedValue: number;

  @Column({ name: 'warning_threshold', type: 'decimal', precision: 15, scale: 2, nullable: true })
  warningThreshold: number;

  @Column({ name: 'critical_threshold', type: 'decimal', precision: 15, scale: 2, nullable: true })
  criticalThreshold: number;

  @Column({ name: 'deviation_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  deviationPercent: number;

  @Column({ name: 'data_point_count', nullable: true })
  dataPointCount: number;

  @Column({ name: 'time_range_start', type: 'timestamptz', nullable: true })
  timeRangeStart: Date;

  @Column({ name: 'time_range_end', type: 'timestamptz', nullable: true })
  timeRangeEnd: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      monitorId: this.monitorId,
      monitorName: this.monitorName,
      metricName: this.metricName,
      metricValue: this.metricValue,
      status: this.status,
      expectedValue: this.expectedValue,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      deviationPercent: this.deviationPercent,
      dataPointCount: this.dataPointCount,
      timeRangeStart: this.timeRangeStart,
      timeRangeEnd: this.timeRangeEnd,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
