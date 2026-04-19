import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TemplateCategory,
  TemplateEngine,
  TemplateFormat,
  TemplateStatus,
} from './template.entity';

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称', example: '质量报告模板' })
  @IsString()
  @IsNotEmpty({ message: '模板名称不能为空' })
  name: string;

  @ApiProperty({ description: '版本号', required: false, example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: '分类', enum: TemplateCategory, default: TemplateCategory.CUSTOM })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory = TemplateCategory.CUSTOM;

  @ApiProperty({ description: '模板引擎', enum: TemplateEngine, default: TemplateEngine.HANDLEBARS })
  @IsEnum(TemplateEngine)
  @IsOptional()
  engine?: TemplateEngine = TemplateEngine.HANDLEBARS;

  @ApiProperty({ description: '输出格式', enum: TemplateFormat, default: TemplateFormat.HTML })
  @IsEnum(TemplateFormat)
  @IsOptional()
  format?: TemplateFormat = TemplateFormat.HTML;

  @ApiProperty({ description: '模板内容', example: '<html><body><h1>{{title}}</h1></body></html>' })
  @IsString()
  @IsNotEmpty({ message: '模板内容不能为空' })
  content: string;

  @ApiProperty({ description: '局部模板内容', required: false })
  @IsString()
  @IsOptional()
  partialContent?: string;

  @ApiProperty({ description: '布局模板内容', required: false })
  @IsString()
  @IsOptional()
  layoutContent?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '变量 Schema', required: false })
  @IsObject()
  @IsOptional()
  variablesSchema?: Record<string, any>;

  @ApiProperty({ description: '自定义助手', required: false })
  @IsObject()
  @IsOptional()
  helpers?: Record<string, any>;

  @ApiProperty({ description: '是否为局部模板', default: false })
  @IsBoolean()
  @IsOptional()
  isPartial?: boolean = false;

  @ApiProperty({ description: '父模板 ID', required: false })
  @IsString()
  @IsOptional()
  parentTemplateId?: string;

  @ApiProperty({ description: '标签列表', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTemplateDto {
  @ApiProperty({ description: '模板名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '版本号', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: '分类', enum: TemplateCategory, required: false })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @ApiProperty({ description: '模板引擎', enum: TemplateEngine, required: false })
  @IsEnum(TemplateEngine)
  @IsOptional()
  engine?: TemplateEngine;

  @ApiProperty({ description: '输出格式', enum: TemplateFormat, required: false })
  @IsEnum(TemplateFormat)
  @IsOptional()
  format?: TemplateFormat;

  @ApiProperty({ description: '模板内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '局部模板内容', required: false })
  @IsString()
  @IsOptional()
  partialContent?: string;

  @ApiProperty({ description: '布局模板内容', required: false })
  @IsString()
  @IsOptional()
  layoutContent?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '变量 Schema', required: false })
  @IsObject()
  @IsOptional()
  variablesSchema?: Record<string, any>;

  @ApiProperty({ description: '自定义助手', required: false })
  @IsObject()
  @IsOptional()
  helpers?: Record<string, any>;

  @ApiProperty({ description: '状态', enum: TemplateStatus, required: false })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @ApiProperty({ description: '是否为局部模板', required: false })
  @IsBoolean()
  @IsOptional()
  isPartial?: boolean;

  @ApiProperty({ description: '父模板 ID', required: false })
  @IsString()
  @IsOptional()
  parentTemplateId?: string;

  @ApiProperty({ description: '标签列表', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TemplateQueryDto {
  @ApiProperty({ description: '模板名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '分类', enum: TemplateCategory, required: false })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @ApiProperty({ description: '引擎', enum: TemplateEngine, required: false })
  @IsEnum(TemplateEngine)
  @IsOptional()
  engine?: TemplateEngine;

  @ApiProperty({ description: '格式', enum: TemplateFormat, required: false })
  @IsEnum(TemplateFormat)
  @IsOptional()
  format?: TemplateFormat;

  @ApiProperty({ description: '状态', enum: TemplateStatus, required: false })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @ApiProperty({ description: '标签', required: false })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  limit?: number = 10;
}

export class RenderTemplateDto {
  @ApiProperty({ description: '模板数据', example: { title: '报告', data: [] } })
  @IsObject()
  @IsNotEmpty({ message: '模板数据不能为空' })
  data: Record<string, any>;

  @ApiProperty({ description: '局部模板数据', required: false })
  @IsObject()
  @IsOptional()
  partials?: Record<string, any>;

  @ApiProperty({ description: '布局数据', required: false })
  @IsObject()
  @IsOptional()
  layout?: Record<string, any>;

  @ApiProperty({ description: '自定义助手', required: false })
  @IsObject()
  @IsOptional()
  helpers?: Record<string, any>;
}

export class ValidateTemplateDto {
  @ApiProperty({ description: '模板内容', example: '<html>{{title}}</html>' })
  @IsString()
  @IsNotEmpty({ message: '模板内容不能为空' })
  content: string;

  @ApiProperty({ description: '模板引擎', enum: TemplateEngine, default: TemplateEngine.HANDLEBARS })
  @IsEnum(TemplateEngine)
  @IsOptional()
  engine?: TemplateEngine = TemplateEngine.HANDLEBARS;

  @ApiProperty({ description: '测试数据', required: false })
  @IsObject()
  @IsOptional()
  testData?: Record<string, any>;
}

export class BatchRenderDto {
  @ApiProperty({ description: '模板 ID 列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: '模板 ID 列表不能为空' })
  templateIds: string[];

  @ApiProperty({ description: '模板数据' })
  @IsObject()
  @IsNotEmpty({ message: '模板数据不能为空' })
  data: Record<string, any>;
}
