import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskMonitoringService } from './task-monitoring.service';
import { LogLevel } from './task-execution-log.entity';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskMonitoringController {
  constructor(private readonly monitoringService: TaskMonitoringService) {}

  // ==================== 日志管理 ====================

  @Get(':id/logs')
  @ApiOperation({ summary: '获取任务日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTaskLogs(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('level') level?: LogLevel,
  ) {
    return this.monitoringService.getTaskLogs(id, page, limit, level);
  }

  @Get(':id/logs/errors')
  @ApiOperation({ summary: '获取任务错误日志' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTaskErrorLogs(@Param('id') id: string, @Query('limit') limit: number = 50) {
    return this.monitoringService.getTaskErrorLogs(id, limit);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: '记录任务日志' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async logTask(
    @Param('id') id: string,
    @Body()
    logDto: {
      level: LogLevel;
      message: string;
      metadata?: Record<string, any>;
      executionTime?: number;
    },
  ) {
    return this.monitoringService.log({
      taskId: id,
      level: logDto.level,
      message: logDto.message,
      metadata: logDto.metadata,
      executionTime: logDto.executionTime,
    });
  }

  // ==================== 指标管理 ====================

  @Get(':id/metrics')
  @ApiOperation({ summary: '获取任务指标' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTaskMetrics(
    @Param('id') id: string,
    @Query('metricType') metricType?: string,
    @Query('startTime') startTime?: Date,
    @Query('endTime') endTime?: Date,
  ) {
    return this.monitoringService.getTaskMetrics(id, metricType, startTime, endTime);
  }

  @Post(':id/metrics')
  @ApiOperation({ summary: '记录任务指标' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordMetric(
    @Param('id') id: string,
    @Body()
    metricDto: {
      metricType: string;
      metricValue: number;
      unit?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.monitoringService.recordMetric({
      taskId: id,
      ...metricDto,
    });
  }

  @Post(':id/metrics/progress')
  @ApiOperation({ summary: '记录任务进度' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordProgress(
    @Param('id') id: string,
    @Body() progressDto: { progress: number; totalItems?: number },
  ) {
    return this.monitoringService.recordProgress(id, progressDto.progress, progressDto.totalItems);
  }

  @Post(':id/metrics/speed')
  @ApiOperation({ summary: '记录处理速度' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordSpeed(
    @Param('id') id: string,
    @Body() speedDto: { itemsPerSecond: number },
  ) {
    return this.monitoringService.recordSpeed(id, speedDto.itemsPerSecond);
  }

  @Post(':id/metrics/memory')
  @ApiOperation({ summary: '记录内存使用' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordMemory(
    @Param('id') id: string,
    @Body() memoryDto: { memoryMB: number },
  ) {
    return this.monitoringService.recordMemoryUsage(id, memoryDto.memoryMB);
  }

  @Post(':id/metrics/quality')
  @ApiOperation({ summary: '记录数据质量' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordQuality(
    @Param('id') id: string,
    @Body()
    qualityDto: {
      totalRecords: number;
      validRecords: number;
      invalidRecords: number;
    },
  ) {
    return this.monitoringService.recordDataQuality(
      id,
      qualityDto.totalRecords,
      qualityDto.validRecords,
      qualityDto.invalidRecords,
    );
  }

  // ==================== 统计分析 ====================

  @Get(':id/statistics')
  @ApiOperation({ summary: '获取任务统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTaskStatistics(@Param('id') id: string) {
    return this.monitoringService.getTaskStatistics(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: '获取任务健康状态' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTaskHealth(@Param('id') id: string) {
    return this.monitoringService.getTaskHealth(id);
  }

  // ==================== 系统管理 ====================

  @Post('logs/cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '清理旧日志' })
  @ApiResponse({ status: 204, description: '清理成功' })
  async cleanupLogs(@Query('daysToKeep') daysToKeep: number = 30) {
    await this.monitoringService.cleanupOldLogs(daysToKeep);
  }
}
