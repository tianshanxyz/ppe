import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TemplateType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  SMS = 'sms',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('notification_templates')
@Index(['type', 'status'])
@Index(['name'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: TemplateType, default: TemplateType.EMAIL })
  type: TemplateType;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'html_content', type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'variables', type: 'jsonb', nullable: true })
  variables: string[];

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

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
      type: this.type,
      subject: this.subject,
      content: this.content,
      htmlContent: this.htmlContent,
      description: this.description,
      variables: this.variables,
      status: this.status,
      createdBy: this.createdBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
