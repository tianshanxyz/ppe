import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FileType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  CSV = 'csv',
  HTML = 'html',
  JSON = 'json',
  XML = 'xml',
  TEXT = 'text',
}

export enum FileStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum FileStorage {
  LOCAL = 'local',
  S3 = 's3',
  OSS = 'oss',
  COS = 'cos',
}

@Entity('generated_files')
@Index(['file_type', 'status'])
@Index(['created_by', 'created_at'])
@Index(['expires_at'])
export class GeneratedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  originalName: string;

  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ length: 255 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 500 })
  filePath: string;

  @Column({ name: 'file_url', length: 1000, nullable: true })
  fileUrl: string;

  @Column({ type: 'enum', enum: FileStorage, default: FileStorage.LOCAL })
  storage: FileStorage;

  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.PENDING })
  status: FileStatus;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ name: 'template_data', type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  @Column({ name: 'generation_options', type: 'jsonb', nullable: true })
  generationOptions: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ name: 'last_downloaded_at', type: 'timestamptz', nullable: true })
  lastDownloadedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

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
      originalName: this.originalName,
      fileType: this.fileType,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      filePath: this.filePath,
      fileUrl: this.fileUrl,
      storage: this.storage,
      status: this.status,
      templateId: this.templateId,
      templateData: this.templateData,
      generationOptions: this.generationOptions,
      errorMessage: this.errorMessage,
      downloadCount: this.downloadCount,
      lastDownloadedAt: this.lastDownloadedAt,
      expiresAt: this.expiresAt,
      createdBy: this.createdBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
