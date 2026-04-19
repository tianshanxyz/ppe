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

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

@Entity('task_execution_logs')
@Index(['task_id', 'created_at'])
@Index(['level', 'created_at'])
export class TaskExecutionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => CollectionTask)
  @JoinColumn({ name: 'task_id' })
  task: CollectionTask;

  @Column({ type: 'enum', enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'execution_time', nullable: true })
  executionTime: number;

  @Column({ name: 'processed_count', default: 0 })
  processedCount: number;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'failed_count', default: 0 })
  failedCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      level: this.level,
      message: this.message,
      errorStack: this.errorStack,
      metadata: this.metadata,
      executionTime: this.executionTime,
      processedCount: this.processedCount,
      successCount: this.successCount,
      failedCount: this.failedCount,
      createdAt: this.createdAt,
    };
  }
}
