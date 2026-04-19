import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CollectionTask } from './collection-task.entity';

@Entity('task_metrics')
@Index(['task_id', 'metric_type', 'timestamp'])
export class TaskMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => CollectionTask)
  @JoinColumn({ name: 'task_id' })
  task: CollectionTask;

  @Column({ name: 'metric_type', length: 100 })
  metricType: string;

  @Column({ name: 'metric_value', type: 'decimal', precision: 10, scale: 2 })
  metricValue: number;

  @Column({ name: 'unit', length: 50, nullable: true })
  unit: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'timestamp', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      metricType: this.metricType,
      metricValue: parseFloat(this.metricValue as unknown as string),
      unit: this.unit,
      metadata: this.metadata,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
    };
  }
}
