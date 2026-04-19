import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertType, AlertLevel, AlertStatus, TriggerCondition } from './alert-rule.entity';

export class CreateAlertRuleDto {
  @ApiProperty({ description: '规则名称', example: 'PPE 数据质量告警' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  name: string;

  @ApiProperty({ description: '规则描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '告警类型', enum: AlertType, default: AlertType.CUSTOM })
  @IsEnum(AlertType, { message: '无效的告警类型' })
  @IsOptional()
  alertType?: AlertType;

  @ApiProperty({ description: '告警级别', enum: AlertLevel, default: AlertLevel.MEDIUM })
  @IsEnum(AlertLevel, { message: '无效的告警级别' })
  @IsOptional()
  level?: AlertLevel;

  @ApiProperty({ description: '数据源', example: 'ppe' })
  @IsString()
  @IsNotEmpty({ message: '数据源不能为空' })
  dataSource: string;

  @ApiProperty({ description: '目标字段', required: false, example: 'quality_score' })
  @IsString()
  @IsOptional()
  targetField?: string;

  @ApiProperty({ description: '触发条件', enum: TriggerCondition, default: TriggerCondition.CHANGES })
  @IsEnum(TriggerCondition, { message: '无效的触发条件' })
  @IsOptional()
  triggerCondition?: TriggerCondition;

  @ApiProperty({ description: '阈值', required: false })
  @IsNumber()
  @IsOptional()
  thresholdValue?: number;

  @ApiProperty({ description: '阈值单位', required: false, example: '%' })
  @IsString()
  @IsOptional()
  thresholdUnit?: string;

  @ApiProperty({ description: '过滤条件', required: false })
  @IsObject()
  @IsOptional()
  filterConditions?: Record<string, any>;

  @ApiProperty({ description: '通知渠道', type: [String], required: false, example: ['email', '站内信'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationChannels?: string[];

  @ApiProperty({ description: '通知模板', required: false })
  @IsString()
  @IsOptional()
  notificationTemplate?: string;

  @ApiProperty({ description: '冷却时间（秒）', default: 300, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cooldownPeriod?: number = 300;

  @ApiProperty({ description: '是否启用', default: true, required: false })
  @IsOptional()
  enabled?: boolean = true;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAlertRuleDto {
  @ApiProperty({ description: '规则名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '规则描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '告警类型', enum: AlertType, required: false })
  @IsEnum(AlertType)
  @IsOptional()
  alertType?: AlertType;

  @ApiProperty({ description: '告警级别', enum: AlertLevel, required: false })
  @IsEnum(AlertLevel)
  @IsOptional()
  level?: AlertLevel;

  @ApiProperty({ description: '数据源', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ description: '目标字段', required: false })
  @IsString()
  @IsOptional()
  targetField?: string;

  @ApiProperty({ description: '触发条件', enum: TriggerCondition, required: false })
  @IsEnum(TriggerCondition)
  @IsOptional()
  triggerCondition?: TriggerCondition;

  @ApiProperty({ description: '阈值', required: false })
  @IsNumber()
  @IsOptional()
  thresholdValue?: number;

  @ApiProperty({ description: '阈值单位', required: false })
  @IsString()
  @IsOptional()
  thresholdUnit?: string;

  @ApiProperty({ description: '过滤条件', required: false })
  @IsObject()
  @IsOptional()
  filterConditions?: Record<string, any>;

  @ApiProperty({ description: '通知渠道', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationChannels?: string[];

  @ApiProperty({ description: '通知模板', required: false })
  @IsString()
  @IsOptional()
  notificationTemplate?: string;

  @ApiProperty({ description: '冷却时间（秒）', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cooldownPeriod?: number;

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ description: '状态', enum: AlertStatus, required: false })
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AlertRuleQueryDto {
  @ApiProperty({ description: '规则名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '告警类型', enum: AlertType, required: false })
  @IsEnum(AlertType)
  @IsOptional()
  alertType?: AlertType;

  @ApiProperty({ description: '告警级别', enum: AlertLevel, required: false })
  @IsEnum(AlertLevel)
  @IsOptional()
  level?: AlertLevel;

  @ApiProperty({ description: '数据源', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ description: '状态', enum: AlertStatus, required: false })
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: '排序字段', default: 'createdAt', required: false })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方式', default: 'DESC', required: false })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AlertRecordQueryDto {
  @ApiProperty({ description: '规则 ID', required: false })
  @IsString()
  @IsOptional()
  ruleId?: string;

  @ApiProperty({ description: '告警级别', enum: AlertLevel, required: false })
  @IsEnum(AlertLevel)
  @IsOptional()
  level?: AlertLevel;

  @ApiProperty({ description: '告警类型', enum: AlertType, required: false })
  @IsEnum(AlertType)
  @IsOptional()
  alertType?: AlertType;

  @ApiProperty({ description: '状态', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  limit?: number = 20;
}

export class ProcessAlertDto {
  @ApiProperty({ description: '处理结果', example: '已解决' })
  @IsString()
  @IsNotEmpty({ message: '处理结果不能为空' })
  resolution: string;

  @ApiProperty({ description: '状态', enum: ['pending', 'processing', 'resolved', 'ignored'], default: 'resolved' })
  @IsEnum(['pending', 'processing', 'resolved', 'ignored'])
  @IsOptional()
  status?: string = 'resolved';
}
