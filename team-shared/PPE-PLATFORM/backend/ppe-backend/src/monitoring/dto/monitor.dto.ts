import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorType, MonitorStatus, DataFrequency, MetricStatus } from './data-monitor.entity';

export class CreateMonitorDto {
  @ApiProperty({ description: '监控名称', example: 'PPE 数据质量监控' })
  @IsString()
  @IsNotEmpty({ message: '监控名称不能为空' })
  name: string;

  @ApiProperty({ description: '监控描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '监控类型', enum: MonitorType, default: MonitorType.CUSTOM })
  @IsEnum(MonitorType)
  @IsOptional()
  monitorType?: MonitorType = MonitorType.CUSTOM;

  @ApiProperty({ description: '数据源', example: 'ppe' })
  @IsString()
  @IsNotEmpty({ message: '数据源不能为空' })
  dataSource: string;

  @ApiProperty({ description: '目标表', required: false, example: 'ppe_data' })
  @IsString()
  @IsOptional()
  targetTable?: string;

  @ApiProperty({ description: '目标字段', required: false, example: 'quality_score' })
  @IsString()
  @IsOptional()
  targetField?: string;

  @ApiProperty({ description: '检查频率', enum: DataFrequency, default: DataFrequency.EVERY_5_MINUTES })
  @IsEnum(DataFrequency)
  @IsOptional()
  checkFrequency?: DataFrequency = DataFrequency.EVERY_5_MINUTES;

  @ApiProperty({ description: '指标名称', required: false, example: 'average_quality' })
  @IsString()
  @IsOptional()
  metricName?: string;

  @ApiProperty({ description: '警告阈值', required: false })
  @IsNumber()
  @IsOptional()
  warningThreshold?: number;

  @ApiProperty({ description: '严重阈值', required: false })
  @IsNumber()
  @IsOptional()
  criticalThreshold?: number;

  @ApiProperty({ description: '关联告警规则 ID', required: false })
  @IsString()
  @IsOptional()
  alertRuleId?: string;

  @ApiProperty({ description: '启用通知', default: true })
  @IsBoolean()
  @IsOptional()
  notificationEnabled?: boolean = true;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateMonitorDto {
  @ApiProperty({ description: '监控名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '监控描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '监控类型', enum: MonitorType, required: false })
  @IsEnum(MonitorType)
  @IsOptional()
  monitorType?: MonitorType;

  @ApiProperty({ description: '状态', enum: MonitorStatus, required: false })
  @IsEnum(MonitorStatus)
  @IsOptional()
  status?: MonitorStatus;

  @ApiProperty({ description: '数据源', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ description: '目标表', required: false })
  @IsString()
  @IsOptional()
  targetTable?: string;

  @ApiProperty({ description: '目标字段', required: false })
  @IsString()
  @IsOptional()
  targetField?: string;

  @ApiProperty({ description: '检查频率', enum: DataFrequency, required: false })
  @IsEnum(DataFrequency)
  @IsOptional()
  checkFrequency?: DataFrequency;

  @ApiProperty({ description: '指标名称', required: false })
  @IsString()
  @IsOptional()
  metricName?: string;

  @ApiProperty({ description: '警告阈值', required: false })
  @IsNumber()
  @IsOptional()
  warningThreshold?: number;

  @ApiProperty({ description: '严重阈值', required: false })
  @IsNumber()
  @IsOptional()
  criticalThreshold?: number;

  @ApiProperty({ description: '关联告警规则 ID', required: false })
  @IsString()
  @IsOptional()
  alertRuleId?: string;

  @ApiProperty({ description: '启用通知', required: false })
  @IsBoolean()
  @IsOptional()
  notificationEnabled?: boolean;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MonitorQueryDto {
  @ApiProperty({ description: '监控名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '监控类型', enum: MonitorType, required: false })
  @IsEnum(MonitorType)
  @IsOptional()
  monitorType?: MonitorType;

  @ApiProperty({ description: '状态', enum: MonitorStatus, required: false })
  @IsEnum(MonitorStatus)
  @IsOptional()
  status?: MonitorStatus;

  @ApiProperty({ description: '数据源', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  limit?: number = 10;
}

export class MetricQueryDto {
  @ApiProperty({ description: '监控 ID', required: false })
  @IsString()
  @IsOptional()
  monitorId?: string;

  @ApiProperty({ description: '指标名称', required: false })
  @IsString()
  @IsOptional()
  metricName?: string;

  @ApiProperty({ description: '状态', enum: MetricStatus, required: false })
  @IsEnum(MetricStatus)
  @IsOptional()
  status?: MetricStatus;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  startTime?: Date;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  endTime?: Date;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 50, required: false })
  @IsOptional()
  limit?: number = 50;
}

export class RecordMetricDto {
  @ApiProperty({ description: '监控 ID' })
  @IsString()
  @IsNotEmpty({ message: '监控 ID 不能为空' })
  monitorId: string;

  @ApiProperty({ description: '指标名称' })
  @IsString()
  @IsNotEmpty({ message: '指标名称不能为空' })
  metricName: string;

  @ApiProperty({ description: '指标值' })
  @IsNumber()
  @IsNotEmpty({ message: '指标值不能为空' })
  metricValue: number;

  @ApiProperty({ description: '状态', enum: MetricStatus, default: MetricStatus.NORMAL })
  @IsEnum(MetricStatus)
  @IsOptional()
  status?: MetricStatus = MetricStatus.NORMAL;

  @ApiProperty({ description: '期望值', required: false })
  @IsNumber()
  @IsOptional()
  expectedValue?: number;

  @ApiProperty({ description: '数据点数量', required: false })
  @IsNumber()
  @IsOptional()
  dataPointCount?: number;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
