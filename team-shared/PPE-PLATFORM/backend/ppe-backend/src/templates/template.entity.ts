import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum TemplateCategory {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  DOCUMENT = 'document',
  EXPORT = 'export',
  CUSTOM = 'custom',
}

export enum TemplateEngine {
  HANDLEBARS = 'handlebars',
  MUSTACHE = 'mustache',
  EJJS = 'ejs',
  PUG = 'pug',
  CUSTOM = 'custom',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum TemplateFormat {
  HTML = 'html',
  TEXT = 'text',
  JSON = 'json',
  XML = 'xml',
  MARKDOWN = 'markdown',
}

@Entity('templates')
@Index(['category', 'status'])
@Index(['name'])
@Index(['engine'])
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  version: string;

  @Column({ type: 'enum', enum: TemplateCategory, default: TemplateCategory.CUSTOM })
  category: TemplateCategory;

  @Column({ type: 'enum', enum: TemplateEngine, default: TemplateEngine.HANDLEBARS })
  engine: TemplateEngine;

  @Column({ type: 'enum', enum: TemplateFormat, default: TemplateFormat.HTML })
  format: TemplateFormat;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'partial_content', type: 'text', nullable: true })
  partialContent: string;

  @Column({ name: 'layout_content', type: 'text', nullable: true })
  layoutContent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'variables_schema', type: 'jsonb', nullable: true })
  variablesSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  helpers: Record<string, any>;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @Column({ name: 'is_partial', default: false })
  isPartial: boolean;

  @Column({ name: 'parent_template_id', nullable: true })
  parentTemplateId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  tags: string[];

  @Column({ nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateTemplate() {
    // 验证模板内容
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('模板内容不能为空');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      category: this.category,
      engine: this.engine,
      format: this.format,
      content: this.content,
      partialContent: this.partialContent,
      layoutContent: this.layoutContent,
      description: this.description,
      variablesSchema: this.variablesSchema,
      helpers: this.helpers,
      status: this.status,
      isPartial: this.isPartial,
      parentTemplateId: this.parentTemplateId,
      createdBy: this.createdBy,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
