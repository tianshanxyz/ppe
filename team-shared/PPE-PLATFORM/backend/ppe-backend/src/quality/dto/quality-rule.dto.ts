import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RuleType, RuleSeverity, RuleScope } from './quality-rule.entity';
import { CheckStatus } from '../quality-check-result.entity';

export class CreateQualityRuleDto {
  @ApiProperty({ description: '规则名称', example: 'PPE 名称必填' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  name: string;

  @ApiProperty({ description: '规则描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '规则类型', enum: RuleType })
  @IsEnum(RuleType, { message: '无效的规则类型' })
  @IsNotEmpty({ message: '规则类型不能为空' })
  ruleType: RuleType;

  @ApiProperty({ description: '规则作用域', enum: RuleScope, default: RuleScope.GLOBAL })
  @IsEnum(RuleScope, { message: '无效的作用域' })
  @IsOptional()
  scope?: RuleScope;

  @ApiProperty({ description: '资源类型', example: 'ppe' })
  @IsString()
  @IsNotEmpty({ message: '资源类型不能为空' })
  resourceType: string;

  @ApiProperty({ description: '字段路径', example: 'name' })
  @IsString()
  @IsNotEmpty({ message: '字段路径不能为空' })
  fieldPath: string;

  @ApiProperty({ description: '规则表达式', example: '^.+$' })
  @IsString()
  @IsNotEmpty({ message: '规则表达式不能为空' })
  expression: string;

  @ApiProperty({ description: '错误消息', example: '名称不能为空' })
  @IsString()
  @IsNotEmpty({ message: '错误消息不能为空' })
  errorMessage: string;

  @ApiProperty({ description: '严重程度', enum: RuleSeverity, default: RuleSeverity.MEDIUM })
  @IsEnum(RuleSeverity, { message: '无效的严重程度' })
  @IsOptional()
  severity?: RuleSeverity;

  @ApiProperty({ description: '执行顺序', default: 100, required: false })
  @IsNumber()
  @Min(1)
  @Max(999)
  @IsOptional()
  executionOrder?: number = 100;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateQualityRuleDto {
  @ApiProperty({ description: '规则名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '规则描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '规则表达式', required: false })
  @IsString()
  @IsOptional()
  expression?: string;

  @ApiProperty({ description: '错误消息', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ description: '严重程度', enum: RuleSeverity, required: false })
  @IsEnum(RuleSeverity, { message: '无效的严重程度' })
  @IsOptional()
  severity?: RuleSeverity;

  @ApiProperty({ description: '执行顺序', required: false })
  @IsNumber()
  @Min(1)
  @Max(999)
  @IsOptional()
  executionOrder?: number;

  @ApiProperty({ description: '元数据', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: '是否激活', required: false })
  @IsOptional()
  isActive?: boolean;
}

export class QualityRuleQueryDto {
  @ApiProperty({ description: '规则名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '规则类型', enum: RuleType, required: false })
  @IsEnum(RuleType)
  @IsOptional()
  ruleType?: RuleType;

  @ApiProperty({ description: '作用域', enum: RuleScope, required: false })
  @IsEnum(RuleScope)
  @IsOptional()
  scope?: RuleScope;

  @ApiProperty({ description: '资源类型', required: false })
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiProperty({ description: '严重程度', enum: RuleSeverity, required: false })
  @IsEnum(RuleSeverity)
  @IsOptional()
  severity?: RuleSeverity;

  @ApiProperty({ description: '是否激活', required: false })
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class QualityRuleResponseDto {
  @ApiProperty({ description: '规则 ID' })
  id: string;

  @ApiProperty({ description: '规则名称' })
  name: string;

  @ApiProperty({ description: '规则描述' })
  description: string;

  @ApiProperty({ description: '规则类型', enum: RuleType })
  ruleType: RuleType;

  @ApiProperty({ description: '作用域', enum: RuleScope })
  scope: RuleScope;

  @ApiProperty({ description: '资源类型' })
  resourceType: string;

  @ApiProperty({ description: '字段路径' })
  fieldPath: string;

  @ApiProperty({ description: '规则表达式' })
  expression: string;

  @ApiProperty({ description: '错误消息' })
  errorMessage: string;

  @ApiProperty({ description: '严重程度', enum: RuleSeverity })
  severity: RuleSeverity;

  @ApiProperty({ description: '执行顺序' })
  executionOrder: number;

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '元数据' })
  metadata: Record<string, any>;

  @ApiProperty({ description: '创建者 ID' })
  createdById: string;

  @ApiProperty({ description: '更新者 ID' })
  updatedById: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class CheckDataDto {
  @ApiProperty({ description: '资源类型' })
  resourceType: string;

  @ApiProperty({ description: '资源 ID' })
  resourceId: string;

  @ApiProperty({ description: '数据对象' })
  data: Record<string, any>;
}

export class QualityCheckResultDto {
  @ApiProperty({ description: '检查结果 ID' })
  id: string;

  @ApiProperty({ description: '资源类型' })
  resourceType: string;

  @ApiProperty({ description: '资源 ID' })
  resourceId: string;

  @ApiProperty({ description: '规则 ID' })
  ruleId: string;

  @ApiProperty({ description: '检查状态', enum: CheckStatus })
  status: CheckStatus;

  @ApiProperty({ description: '消息' })
  message: string;

  @ApiProperty({ description: '字段值' })
  fieldValue: string;

  @ApiProperty({ description: '期望值' })
  expectedValue: string;

  @ApiProperty({ description: '严重程度权重' })
  severityWeight: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class QualityScoreDto {
  @ApiProperty({ description: '评分 ID' })
  id: string;

  @ApiProperty({ description: '资源类型' })
  resourceType: string;

  @ApiProperty({ description: '资源 ID' })
  resourceId: string;

  @ApiProperty({ description: '总体评分' })
  overallScore: number;

  @ApiProperty({ description: '总检查数' })
  totalChecks: number;

  @ApiProperty({ description: '通过数' })
  passedChecks: number;

  @ApiProperty({ description: '失败数' })
  failedChecks: number;

  @ApiProperty({ description: '警告数' })
  warningChecks: number;

  @ApiProperty({ description: '严重问题数' })
  criticalIssues: number;

  @ApiProperty({ description: '高优先级问题数' })
  highIssues: number;

  @ApiProperty({ description: '中优先级问题数' })
  mediumIssues: number;

  @ApiProperty({ description: '低优先级问题数' })
  lowIssues: number;

  @ApiProperty({ description: '详细分解' })
  breakdown: Record<string, any>;

  @ApiProperty({ description: '改进建议', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
