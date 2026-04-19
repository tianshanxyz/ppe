import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RenderStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('template_render_logs')
@Index(['template_id', 'created_at'])
@Index(['status', 'created_at'])
export class TemplateRenderLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'template_name', length: 255 })
  templateName: string;

  @Column({ type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  renderedContent: string;

  @Column({ type: 'enum', enum: RenderStatus, default: RenderStatus.SUCCESS })
  status: RenderStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'render_time_ms', nullable: true })
  renderTimeMs: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      templateName: this.templateName,
      inputData: this.inputData,
      renderedContent: this.renderedContent,
      status: this.status,
      errorMessage: this.errorMessage,
      renderTimeMs: this.renderTimeMs,
      createdBy: this.createdBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
