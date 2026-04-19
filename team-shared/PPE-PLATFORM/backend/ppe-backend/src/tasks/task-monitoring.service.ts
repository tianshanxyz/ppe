import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TaskExecutionLog, LogLevel } from './task-execution-log.entity';
import { TaskMetric } from './task-metric.entity';

export interface LogTaskOptions {
  taskId: string;
  level?: LogLevel;
  message: string;
  errorStack?: string;
  metadata?: Record<string, any>;
  executionTime?: number;
  processedCount?: number;
  successCount?: number;
  failedCount?: number;
}

export interface MetricOptions {
  taskId: string;
  metricType: string;
  metricValue: number;
  unit?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class TaskMonitoringService {
  constructor(
    @InjectRepository(TaskExecutionLog)
    private readonly logRepository: Repository<TaskExecutionLog>,
    @InjectRepository(TaskMetric)
    private readonly metricRepository: Repository<TaskMetric>,
  ) {}

  // ==================== 日志记录 ====================

  /**
   * 记录任务日志
   */
  async log(options: LogTaskOptions): Promise<TaskExecutionLog> {
    const log = this.logRepository.create({
      taskId: options.taskId,
      level: options.level || LogLevel.INFO,
      message: options.message,
      errorStack: options.errorStack,
      metadata: options.metadata,
      executionTime: options.executionTime,
      processedCount: options.processedCount || 0,
      successCount: options.successCount || 0,
      failedCount: options.failedCount || 0,
    });

    return this.logRepository.save(log);
  }

  /**
   * 记录调试日志
   */
  async debug(taskId: string, message: string, metadata?: Record<string, any>): Promise<TaskExecutionLog> {
    return this.log({ taskId, level: LogLevel.DEBUG, message, metadata });
  }

  /**
   * 记录信息日志
   */
  async info(taskId: string, message: string, metadata?: Record<string, any>): Promise<TaskExecutionLog> {
    return this.log({ taskId, level: LogLevel.INFO, message, metadata });
  }

  /**
   * 记录警告日志
   */
  async warn(taskId: string, message: string, metadata?: Record<string, any>): Promise<TaskExecutionLog> {
    return this.log({ taskId, level: LogLevel.WARN, message, metadata });
  }

  /**
   * 记录错误日志
   */
  async error(
    taskId: string,
    message: string,
    errorStack?: string,
    metadata?: Record<string, any>,
  ): Promise<TaskExecutionLog> {
    return this.log({ taskId, level: LogLevel.ERROR, message, errorStack, metadata });
  }

  /**
   * 获取任务日志
   */
  async getTaskLogs(
    taskId: string,
    page: number = 1,
    limit: number = 50,
    level?: LogLevel,
  ): Promise<{ logs: TaskExecutionLog[]; total: number }> {
    const queryBuilder = this.logRepository
      .createQueryBuilder('log')
      .where('log.taskId = :taskId', { taskId })
      .orderBy('log.createdAt', 'DESC');

    if (level) {
      queryBuilder.andWhere('log.level = :level', { level });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }

  /**
   * 获取任务错误日志
   */
  async getTaskErrorLogs(taskId: string, limit: number = 50): Promise<TaskExecutionLog[]> {
    return this.logRepository.find({
      where: {
        taskId,
        level: LogLevel.ERROR,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ==================== 指标记录 ====================

  /**
   * 记录任务指标
   */
  async recordMetric(options: MetricOptions): Promise<TaskMetric> {
    const metric = this.metricRepository.create({
      taskId: options.taskId,
      metricType: options.metricType,
      metricValue: options.metricValue,
      unit: options.unit,
      metadata: options.metadata,
      timestamp: options.timestamp || new Date(),
    });

    return this.metricRepository.save(metric);
  }

  /**
   * 记录任务进度
   */
  async recordProgress(taskId: string, progress: number, totalItems?: number): Promise<TaskMetric> {
    return this.recordMetric({
      taskId,
      metricType: 'progress',
      metricValue: progress,
      unit: 'percent',
      metadata: totalItems ? { totalItems } : undefined,
    });
  }

  /**
   * 记录处理速度
   */
  async recordSpeed(taskId: string, itemsPerSecond: number): Promise<TaskMetric> {
    return this.recordMetric({
      taskId,
      metricType: 'processing_speed',
      metricValue: itemsPerSecond,
      unit: 'items/s',
    });
  }

  /**
   * 记录内存使用
   */
  async recordMemoryUsage(taskId: string, memoryMB: number): Promise<TaskMetric> {
    return this.recordMetric({
      taskId,
      metricType: 'memory_usage',
      metricValue: memoryMB,
      unit: 'MB',
    });
  }

  /**
   * 记录 API 调用次数
   */
  async recordApiCall(taskId: string, endpoint: string, success: boolean): Promise<TaskMetric> {
    return this.recordMetric({
      taskId,
      metricType: 'api_call',
      metricValue: success ? 1 : 0,
      metadata: { endpoint, success },
    });
  }

  /**
   * 记录数据质量指标
   */
  async recordDataQuality(
    taskId: string,
    totalRecords: number,
    validRecords: number,
    invalidRecords: number,
  ): Promise<TaskMetric> {
    const qualityScore = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    
    return this.recordMetric({
      taskId,
      metricType: 'data_quality',
      metricValue: qualityScore,
      unit: 'percent',
      metadata: { totalRecords, validRecords, invalidRecords },
    });
  }

  /**
   * 获取任务指标
   */
  async getTaskMetrics(
    taskId: string,
    metricType?: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<TaskMetric[]> {
    const where: any = { taskId };

    if (metricType) {
      where.metricType = metricType;
    }

    if (startTime && endTime) {
      where.timestamp = Between(startTime, endTime);
    }

    return this.metricRepository.find({
      where,
      order: { timestamp: 'ASC' },
    });
  }

  // ==================== 统计分析 ====================

  /**
   * 获取任务统计信息
   */
  async getTaskStatistics(taskId: string): Promise<any> {
    const logs = await this.logRepository
      .createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('log.taskId = :taskId', { taskId })
      .groupBy('log.level')
      .getRawMany();

    const metrics = await this.metricRepository
      .createQueryBuilder('metric')
      .select('metric.metricType', 'type')
      .addSelect('AVG(metric.metricValue)', 'avg')
      .addSelect('MIN(metric.metricValue)', 'min')
      .addSelect('MAX(metric.metricValue)', 'max')
      .where('metric.taskId = :taskId', { taskId })
      .groupBy('metric.metricType')
      .getRawMany();

    const errorCount = await this.logRepository.count({
      where: { taskId, level: LogLevel.ERROR },
    });

    const lastLog = await this.logRepository.findOne({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });

    return {
      logStatistics: logs.reduce((acc, item) => {
        acc[item.level] = parseInt(item.count);
        return acc;
      }, {}),
      metricStatistics: metrics.reduce((acc, item) => {
        acc[item.type] = {
          avg: parseFloat(item.avg),
          min: parseFloat(item.min),
          max: parseFloat(item.max),
        };
        return acc;
      }, {}),
      errorCount,
      lastLogAt: lastLog?.createdAt,
    };
  }

  /**
   * 清理旧日志（保留最近 N 天）
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    await this.metricRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();
  }

  /**
   * 获取实时任务健康状态
   */
  async getTaskHealth(taskId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  }> {
    const stats = await this.getTaskStatistics(taskId);
    const issues: string[] = [];
    let score = 100;

    // 检查错误率
    const totalLogs = Object.values(stats.logStatistics || {}).reduce((a, b) => a + b, 0);
    const errorRate = totalLogs > 0 ? (stats.errorCount / totalLogs) * 100 : 0;

    if (errorRate > 20) {
      score -= 40;
      issues.push(`高错误率：${errorRate.toFixed(2)}%`);
    } else if (errorRate > 10) {
      score -= 20;
      issues.push(`中等错误率：${errorRate.toFixed(2)}%`);
    }

    // 检查是否有错误日志
    if (stats.errorCount > 10) {
      score -= 20;
      issues.push(`错误日志过多：${stats.errorCount} 条`);
    }

    // 检查指标异常
    if (stats.metricStatistics) {
      const progressStats = stats.metricStatistics.progress;
      if (progressStats && progressStats.avg < 50) {
        score -= 10;
        issues.push('任务进度缓慢');
      }
    }

    // 确定健康状态
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
    };
  }
}
