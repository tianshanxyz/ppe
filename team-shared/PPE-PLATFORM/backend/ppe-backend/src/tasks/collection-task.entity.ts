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

export enum TaskType {
  PPE_COLLECTION = 'ppe_collection',
  REGULATION_COLLECTION = 'regulation_collection',
  COMPANY_COLLECTION = 'company_collection',
  DATA_SYNC = 'data_sync',
  DATA_EXPORT = 'data_export',
  CUSTOM = 'custom',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('collection_tasks')
@Index(['status', 'priority'])
@Index(['created_by', 'created_at'])
export class CollectionTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: TaskType, default: TaskType.CUSTOM })
  type: TaskType;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.NORMAL })
  priority: TaskPriority;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'source_url', length: 500 })
  sourceUrl: string;

  @Column({ name: 'target_resource', length: 100 })
  targetResource: string;

  @Column({ name: 'config', type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ name: 'result', type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'timeout', nullable: true })
  timeout: number;

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress: number;

  @Column({ name: 'total_items', default: 0 })
  totalItems: number;

  @Column({ name: 'processed_items', default: 0 })
  processedItems: number;

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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      priority: this.priority,
      description: this.description,
      sourceUrl: this.sourceUrl,
      targetResource: this.targetResource,
      config: this.config,
      result: this.result,
      errorMessage: this.errorMessage,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      scheduledAt: this.scheduledAt,
      timeout: this.timeout,
      progress: this.progress,
      totalItems: this.totalItems,
      processedItems: this.processedItems,
      createdById: this.createdById,
      updatedById: this.updatedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
    };
  }
}
