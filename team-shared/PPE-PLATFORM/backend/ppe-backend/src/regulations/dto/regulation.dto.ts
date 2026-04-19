import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegulationType, RegulationLevel, RegulationStatus } from './regulation.entity';

export class CreateRegulationDto {
  @ApiProperty({ description: '法规标题', example: '医疗器械监督管理条例' })
  @IsString()
  @IsNotEmpty({ message: '法规标题不能为空' })
  title: string;

  @ApiProperty({ description: '副标题', required: false })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: '文号', required: false, example: '国务院令第 739 号' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({ description: '法规类型', enum: RegulationType, default: RegulationType.OTHER })
  @IsEnum(RegulationType, { message: '无效的法规类型' })
  @IsOptional()
  regulationType?: RegulationType;

  @ApiProperty({ description: '法规级别', enum: RegulationLevel, default: RegulationLevel.NATIONAL })
  @IsEnum(RegulationLevel, { message: '无效的法规级别' })
  @IsOptional()
  level?: RegulationLevel;

  @ApiProperty({ description: '发布机构', required: false, example: '国务院' })
  @IsString()
  @IsOptional()
  issuingAgency?: string;

  @ApiProperty({ description: '法规内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '摘要', required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ description: '发布日期', required: false })
  @IsDate()
  @IsOptional()
  releaseDate?: Date;

  @ApiProperty({ description: '实施日期', required: false })
  @IsDate()
  @IsOptional()
  implementationDate?: Date;

  @ApiProperty({ description: '失效日期', required: false })
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({ description: '状态', enum: RegulationStatus, default: RegulationStatus.EFFECTIVE })
  @IsEnum(RegulationStatus, { message: '无效的状态' })
  @IsOptional()
  status?: RegulationStatus;

  @ApiProperty({ description: '适用领域', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableFields?: string[];

  @ApiProperty({ description: '相关法规', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedRegulations?: string[];

  @ApiProperty({ description: '关键词', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({ description: '附件列表', required: false })
  @IsObject()
  @IsOptional()
  attachments?: Record<string, any>[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateRegulationDto {
  @ApiProperty({ description: '法规标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '副标题', required: false })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: '文号', required: false })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({ description: '法规类型', enum: RegulationType, required: false })
  @IsEnum(RegulationType)
  @IsOptional()
  regulationType?: RegulationType;

  @ApiProperty({ description: '法规级别', enum: RegulationLevel, required: false })
  @IsEnum(RegulationLevel)
  @IsOptional()
  level?: RegulationLevel;

  @ApiProperty({ description: '发布机构', required: false })
  @IsString()
  @IsOptional()
  issuingAgency?: string;

  @ApiProperty({ description: '法规内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '摘要', required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ description: '发布日期', required: false })
  @IsDate()
  @IsOptional()
  releaseDate?: Date;

  @ApiProperty({ description: '实施日期', required: false })
  @IsDate()
  @IsOptional()
  implementationDate?: Date;

  @ApiProperty({ description: '失效日期', required: false })
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({ description: '状态', enum: RegulationStatus, required: false })
  @IsEnum(RegulationStatus)
  @IsOptional()
  status?: RegulationStatus;

  @ApiProperty({ description: '适用领域', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableFields?: string[];

  @ApiProperty({ description: '相关法规', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedRegulations?: string[];

  @ApiProperty({ description: '关键词', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({ description: '附件列表', required: false })
  @IsObject()
  @IsOptional()
  attachments?: Record<string, any>[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RegulationQueryDto {
  @ApiProperty({ description: '标题（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '法规类型', enum: RegulationType, required: false })
  @IsEnum(RegulationType)
  @IsOptional()
  regulationType?: RegulationType;

  @ApiProperty({ description: '法规级别', enum: RegulationLevel, required: false })
  @IsEnum(RegulationLevel)
  @IsOptional()
  level?: RegulationLevel;

  @ApiProperty({ description: '发布机构', required: false })
  @IsString()
  @IsOptional()
  issuingAgency?: string;

  @ApiProperty({ description: '状态', enum: RegulationStatus, required: false })
  @IsEnum(RegulationStatus)
  @IsOptional()
  status?: RegulationStatus;

  @ApiProperty({ description: '适用领域', required: false })
  @IsString()
  @IsOptional()
  applicableField?: string;

  @ApiProperty({ description: '发布日期从', required: false })
  @IsDate()
  @IsOptional()
  releaseDateFrom?: Date;

  @ApiProperty({ description: '发布日期到', required: false })
  @IsDate()
  @IsOptional()
  releaseDateTo?: Date;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: '排序字段', default: 'releaseDate', required: false })
  @IsOptional()
  sortBy?: string = 'releaseDate';

  @ApiProperty({ description: '排序方式', default: 'DESC', required: false })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class RegulationResponseDto {
  @ApiProperty({ description: '法规 ID' })
  id: string;

  @ApiProperty({ description: '法规标题' })
  title: string;

  @ApiProperty({ description: '副标题' })
  subtitle: string;

  @ApiProperty({ description: '文号' })
  documentNumber: string;

  @ApiProperty({ description: '法规类型', enum: RegulationType })
  regulationType: RegulationType;

  @ApiProperty({ description: '法规级别', enum: RegulationLevel })
  level: RegulationLevel;

  @ApiProperty({ description: '发布机构' })
  issuingAgency: string;

  @ApiProperty({ description: '法规内容' })
  content: string;

  @ApiProperty({ description: '摘要' })
  summary: string;

  @ApiProperty({ description: '发布日期' })
  releaseDate: Date;

  @ApiProperty({ description: '实施日期' })
  implementationDate: Date;

  @ApiProperty({ description: '失效日期' })
  expiryDate: Date;

  @ApiProperty({ description: '状态', enum: RegulationStatus })
  status: RegulationStatus;

  @ApiProperty({ description: '适用领域', type: [String] })
  applicableFields: string[];

  @ApiProperty({ description: '相关法规', type: [String] })
  relatedRegulations: string[];

  @ApiProperty({ description: '关键词', type: [String] })
  keywords: string[];

  @ApiProperty({ description: '附件列表' })
  attachments: Record<string, any>[];

  @ApiProperty({ description: '元数据' })
  metadata: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class RegulationStatisticsDto {
  @ApiProperty({ description: '总法规数' })
  totalRegulations: number;

  @ApiProperty({ description: '按类型统计' })
  byType: Record<string, number>;

  @ApiProperty({ description: '按级别统计' })
  byLevel: Record<string, number>;

  @ApiProperty({ description: '按状态统计' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: '按发布机构统计' })
  byAgency: Record<string, number>;

  @ApiProperty({ description: '有效法规数' })
  effectiveCount: number;

  @ApiProperty({ description: '已废止法规数' })
  repealedCount: number;
}
