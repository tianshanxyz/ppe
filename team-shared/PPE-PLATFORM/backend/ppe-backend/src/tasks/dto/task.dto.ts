import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType, TaskStatus, TaskPriority } from './collection-task.entity';

export class CreateTaskDto {
  @ApiProperty({ description: '任务名称', example: 'PPE 数据采集' })
  @IsString()
  @IsNotEmpty({ message: '任务名称不能为空' })
  name: string;

  @ApiProperty({ description: '任务类型', enum: TaskType, example: TaskType.PPE_COLLECTION })
  @IsEnum(TaskType, { message: '无效的任务类型' })
  @IsNotEmpty({ message: '任务类型不能为空' })
  type: TaskType;

  @ApiProperty({ description: '任务描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '数据源 URL', example: 'https://api.example.com/data' })
  @IsUrl({}, { message: '无效的 URL 格式' })
  @IsNotEmpty({ message: '数据源 URL 不能为空' })
  sourceUrl: string;

  @ApiProperty({ description: '目标资源类型', example: 'ppe' })
  @IsString()
  @IsNotEmpty({ message: '目标资源类型不能为空' })
  targetResource: string;

  @ApiProperty({ description: '任务优先级', enum: TaskPriority, default: TaskPriority.NORMAL })
  @IsEnum(TaskPriority, { message: '无效的优先级' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ description: '任务配置', required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ description: '超时时间（秒）', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  timeout?: number;

  @ApiProperty({ description: '计划执行时间', required: false })
  @IsOptional()
  scheduledAt?: Date;
}

export class UpdateTaskDto {
  @ApiProperty({ description: '任务名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '任务描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '任务优先级', enum: TaskPriority, required: false })
  @IsEnum(TaskPriority, { message: '无效的优先级' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ description: '任务配置', required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ description: '超时时间（秒）', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  timeout?: number;

  @ApiProperty({ description: '计划执行时间', required: false })
  @IsOptional()
  scheduledAt?: Date;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '任务状态不能为空' })
  status: TaskStatus;

  @ApiProperty({ description: '错误信息', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ description: '执行结果', required: false })
  @IsObject()
  @IsOptional()
  result?: Record<string, any>;

  @ApiProperty({ description: '进度百分比', minimum: 0, maximum: 100, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiProperty({ description: '已处理项数', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  processedItems?: number;

  @ApiProperty({ description: '总项数', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalItems?: number;
}

export class TaskQueryDto {
  @ApiProperty({ description: '任务名称（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '任务类型', enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ description: '任务状态', enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ description: '优先级', enum: TaskPriority, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ description: '创建者 ID', required: false })
  @IsString()
  @IsOptional()
  createdById?: string;

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

  @ApiProperty({ description: '排序字段', default: 'createdAt', required: false })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC', required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class TaskResponseDto {
  @ApiProperty({ description: '任务 ID' })
  id: string;

  @ApiProperty({ description: '任务名称' })
  name: string;

  @ApiProperty({ description: '任务类型', enum: TaskType })
  type: TaskType;

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: '优先级', enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty({ description: '任务描述' })
  description: string;

  @ApiProperty({ description: '数据源 URL' })
  sourceUrl: string;

  @ApiProperty({ description: '目标资源类型' })
  targetResource: string;

  @ApiProperty({ description: '任务配置' })
  config: Record<string, any>;

  @ApiProperty({ description: '执行结果' })
  result: Record<string, any>;

  @ApiProperty({ description: '错误信息' })
  errorMessage: string;

  @ApiProperty({ description: '重试次数' })
  retryCount: number;

  @ApiProperty({ description: '最大重试次数' })
  maxRetries: number;

  @ApiProperty({ description: '开始时间' })
  startedAt: Date;

  @ApiProperty({ description: '完成时间' })
  completedAt: Date;

  @ApiProperty({ description: '计划执行时间' })
  scheduledAt: Date;

  @ApiProperty({ description: '超时时间' })
  timeout: number;

  @ApiProperty({ description: '进度百分比' })
  progress: number;

  @ApiProperty({ description: '总项数' })
  totalItems: number;

  @ApiProperty({ description: '已处理项数' })
  processedItems: number;

  @ApiProperty({ description: '创建者 ID' })
  createdById: string;

  @ApiProperty({ description: '更新者 ID' })
  updatedById: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;
}

export class TaskListResponseDto {
  @ApiProperty({ description: '任务列表', type: [TaskResponseDto] })
  tasks: TaskResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
