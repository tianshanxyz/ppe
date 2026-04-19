import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationStatus, NotificationPriority } from './notification.entity';
import { TemplateType, TemplateStatus } from './notification-template.entity';

export class SendNotificationDto {
  @ApiProperty({ description: '用户 ID', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '接收者邮箱', required: false })
  @IsEmail()
  @IsOptional()
  recipient?: string;

  @ApiProperty({ description: '通知类型', enum: NotificationType, default: NotificationType.IN_APP })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.IN_APP;

  @ApiProperty({ description: '主题', example: '系统通知' })
  @IsString()
  @IsNotEmpty({ message: '主题不能为空' })
  subject: string;

  @ApiProperty({ description: '内容', example: '这是一条通知消息' })
  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiProperty({ description: 'HTML 内容', required: false })
  @IsString()
  @IsOptional()
  htmlContent?: string;

  @ApiProperty({ description: '优先级', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @ApiProperty({ description: '模板 ID', required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: '模板数据', required: false })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiProperty({ description: '附件列表', required: false })
  @IsArray()
  @IsOptional()
  attachments?: Record<string, any>[];

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendBulkNotificationsDto {
  @ApiProperty({ description: '通知列表', type: [SendNotificationDto] })
  @IsArray()
  @IsNotEmpty({ message: '通知列表不能为空' })
  notifications: SendNotificationDto[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称', example: '质量告警通知' })
  @IsString()
  @IsNotEmpty({ message: '模板名称不能为空' })
  name: string;

  @ApiProperty({ description: '模板类型', enum: TemplateType, default: TemplateType.EMAIL })
  @IsEnum(TemplateType)
  @IsOptional()
  type?: TemplateType = TemplateType.EMAIL;

  @ApiProperty({ description: '主题', example: '质量告警通知' })
  @IsString()
  @IsNotEmpty({ message: '主题不能为空' })
  subject: string;

  @ApiProperty({ description: '内容', example: '您好，{{productName}} 的质量评分为 {{score}}' })
  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiProperty({ description: 'HTML 内容', required: false })
  @IsString()
  @IsOptional()
  htmlContent?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '变量列表', type: [String], required: false, example: ['productName', 'score'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

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

  @ApiProperty({ description: '模板类型', enum: TemplateType, required: false })
  @IsEnum(TemplateType)
  @IsOptional()
  type?: TemplateType;

  @ApiProperty({ description: '主题', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: '内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'HTML 内容', required: false })
  @IsString()
  @IsOptional()
  htmlContent?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '变量列表', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiProperty({ description: '状态', enum: TemplateStatus, required: false })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

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

  @ApiProperty({ description: '模板类型', enum: TemplateType, required: false })
  @IsEnum(TemplateType)
  @IsOptional()
  type?: TemplateType;

  @ApiProperty({ description: '状态', enum: TemplateStatus, required: false })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  limit?: number = 10;
}

export class NotificationQueryDto {
  @ApiProperty({ description: '用户 ID', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '通知类型', enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ description: '状态', enum: NotificationStatus, required: false })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({ description: '优先级', enum: NotificationPriority, required: false })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;
}

export class RenderTemplateDto {
  @ApiProperty({ description: '模板数据', example: { productName: '口罩', score: 85 } })
  @IsObject()
  @IsNotEmpty({ message: '模板数据不能为空' })
  data: Record<string, any>;
}
