import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { DataMonitor, MonitorType, MonitorStatus, DataFrequency, MetricStatus } from './data-monitor.entity';
import { MonitoringMetric } from './monitoring-metric.entity';
import { CreateMonitorDto, UpdateMonitorDto, MonitorQueryDto, MetricQueryDto, RecordMetricDto } from './dto/monitor.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(DataMonitor)
    private readonly monitorRepository: Repository<DataMonitor>,
    @InjectRepository(MonitoringMetric)
    private readonly metricRepository: Repository<MonitoringMetric>,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * 创建监控
   */
  async create(createMonitorDto: CreateMonitorDto): Promise<DataMonitor> {
    const monitor = this.monitorRepository.create(createMonitorDto);
    return this.monitorRepository.save(monitor);
  }

  /**
   * 获取所有监控
   */
  async findAll(query: MonitorQueryDto): Promise<{ monitors: DataMonitor[]; total: number }> {
    const { name, monitorType, status, dataSource, page = 1, limit = 10 } = query;

    const where: any = {};

    if (name) {
      where.name = name;
    }

    if (monitorType) {
      where.monitorType = monitorType;
    }

    if (status) {
      where.status = status;
    }

    if (dataSource) {
      where.dataSource = dataSource;
    }

    const queryBuilder = this.monitorRepository
      .createQueryBuilder('monitor')
      .where(where)
      .orderBy('monitor.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [monitors, total] = await queryBuilder.getManyAndCount();

    return { monitors, total };
  }

  /**
   * 根据 ID 获取监控
   */
  async findOne(id: string): Promise<DataMonitor> {
    const monitor = await this.monitorRepository.findOne({ where: { id } });

    if (!monitor) {
      throw new NotFoundException('监控不存在');
    }

    return monitor;
  }

  /**
   * 更新监控
   */
  async update(id: string, updateMonitorDto: UpdateMonitorDto): Promise<DataMonitor> {
    const monitor = await this.findOne(id);
    Object.assign(monitor, updateMonitorDto);
    return this.monitorRepository.save(monitor);
  }

  /**
   * 删除监控
   */
  async remove(id: string): Promise<void> {
    const monitor = await this.findOne(id);
    await this.monitorRepository.remove(monitor);
  }

  /**
   * 启用/停用监控
   */
  async toggleStatus(id: string): Promise<DataMonitor> {
    const monitor = await this.findOne(id);
    monitor.status = monitor.status === MonitorStatus.ACTIVE 
      ? MonitorStatus.PAUSED 
      : MonitorStatus.ACTIVE;
    return this.monitorRepository.save(monitor);
  }

  /**
   * 记录监控指标
   */
  async recordMetric(recordMetricDto: RecordMetricDto): Promise<MonitoringMetric> {
    const { monitorId, metricName, metricValue, status, expectedValue, dataPointCount, metadata } = recordMetricDto;

    const monitor = await this.findOne(monitorId);

    // 计算偏差
    let deviationPercent: number | null = null;
    if (expectedValue && expectedValue !== 0) {
      deviationPercent = ((metricValue - expectedValue) / expectedValue) * 100;
    }

    const metric = this.metricRepository.create({
      monitorId,
      monitorName: monitor.name,
      metricName,
      metricValue,
      status,
      expectedValue,
      warningThreshold: monitor.warningThreshold,
      criticalThreshold: monitor.criticalThreshold,
      deviationPercent: deviationPercent ? parseFloat(deviationPercent.toFixed(2)) : null,
      dataPointCount,
      timeRangeStart: new Date(),
      timeRangeEnd: new Date(),
      metadata,
    });

    const savedMetric = await this.metricRepository.save(metric);

    // 更新监控最后值
    monitor.lastValue = metricValue;
    monitor.lastStatus = status;
    monitor.lastCheckAt = new Date();
    monitor.checkCount += 1;

    if (status === MetricStatus.WARNING || status === MetricStatus.CRITICAL) {
      monitor.alertCount += 1;

      // 触发告警
      if (monitor.notificationEnabled && monitor.alertRuleId) {
        try {
          await this.alertsService.triggerAlert(
            monitor.alertRuleId,
            `监控告警：${monitor.name}`,
            `指标 ${metricName} 当前值为 ${metricValue}, 状态：${status}`,
            {
              monitorId: monitor.id,
              monitorName: monitor.name,
              metricName,
              metricValue,
              status,
              warningThreshold: monitor.warningThreshold,
              criticalThreshold: monitor.criticalThreshold,
            },
            metricValue,
          );
        } catch (error) {
          this.logger.error(`触发告警失败：${monitor.alertRuleId}`, error);
        }
      }
    }

    await this.monitorRepository.save(monitor);

    this.logger.log(`监控指标已记录：${monitorId}, 指标：${metricName}, 值：${metricValue}, 状态：${status}`);

    return savedMetric;
  }

  /**
   * 获取监控指标
   */
  async getMetrics(query: MetricQueryDto): Promise<{ metrics: MonitoringMetric[]; total: number }> {
    const { monitorId, metricName, status, startTime, endTime, page = 1, limit = 50 } = query;

    const where: any = {};

    if (monitorId) {
      where.monitorId = monitorId;
    }

    if (metricName) {
      where.metricName = metricName;
    }

    if (status) {
      where.status = status;
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime && endTime) {
        where.createdAt = Between(startTime, endTime);
      } else if (startTime) {
        where.createdAt = MoreThan(startTime);
      } else if (endTime) {
        where.createdAt = LessThan(endTime);
      }
    }

    const queryBuilder = this.metricRepository
      .createQueryBuilder('metric')
      .where(where)
      .orderBy('metric.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [metrics, total] = await queryBuilder.getManyAndCount();

    return { metrics, total };
  }

  /**
   * 获取监控统计
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.monitorRepository.createQueryBuilder('monitor');

    const totalQuery = await queryBuilder.getCount();

    const byTypeQuery = await queryBuilder
      .select('monitor.monitorType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('monitor.monitorType')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    const byStatusQuery = await queryBuilder
      .select('monitor.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('monitor.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const activeCount = await queryBuilder
      .where('monitor.status = :status', { status: MonitorStatus.ACTIVE })
      .getCount();

    // 指标统计
    const metricQueryBuilder = this.metricRepository.createQueryBuilder('metric');
    const totalMetrics = await metricQueryBuilder.getCount();

    const byMetricStatusQuery = await metricQueryBuilder
      .select('metric.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('metric.status')
      .getRawMany();

    const byMetricStatus = byMetricStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const warningCount = await metricQueryBuilder
      .where('metric.status = :status', { status: MetricStatus.WARNING })
      .getCount();

    const criticalCount = await metricQueryBuilder
      .where('metric.status = :status', { status: MetricStatus.CRITICAL })
      .getCount();

    const normalCount = await metricQueryBuilder
      .where('metric.status = :status', { status: MetricStatus.NORMAL })
      .getCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMetrics = await metricQueryBuilder
      .where('metric.createdAt >= :today', { today })
      .getCount();

    return {
      totalMonitors: totalQuery,
      byType,
      byStatus,
      activeCount,
      metrics: {
        totalMetrics,
        byStatus: byMetricStatus,
        warningCount,
        criticalCount,
        normalCount,
        todayMetrics,
      },
    };
  }

  /**
   * 获取监控趋势（最近 N 个数据点）
   */
  async getTrend(monitorId: string, limit = 100): Promise<MonitoringMetric[]> {
    return this.metricRepository.find({
      where: { monitorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取活跃监控
   */
  async getActiveMonitors(): Promise<DataMonitor[]> {
    return this.monitorRepository.find({
      where: { status: MonitorStatus.ACTIVE },
      order: { checkFrequency: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 执行监控检查（由定时任务调用）
   */
  async performCheck(monitorId: string): Promise<void> {
    const monitor = await this.findOne(monitorId);

    if (monitor.status !== MonitorStatus.ACTIVE) {
      this.logger.debug(`监控未激活，跳过：${monitor.id}`);
      return;
    }

    try {
      // TODO: 根据监控类型执行实际检查
      // 这里需要根据具体的数据源和指标类型实现检查逻辑
      
      let metricValue: number;
      let status: MetricStatus;

      // 模拟检查逻辑
      switch (monitor.monitorType) {
        case MonitorType.DATA_QUALITY:
          // 检查数据质量
          metricValue = await this.checkDataQuality(monitor);
          status = this.evaluateStatus(metricValue, monitor.warningThreshold, monitor.criticalThreshold);
          break;

        case MonitorType.DATA_VOLUME:
          // 检查数据量
          metricValue = await this.checkDataVolume(monitor);
          status = this.evaluateStatus(metricValue, monitor.warningThreshold, monitor.criticalThreshold);
          break;

        case MonitorType.TASK_STATUS:
          // 检查任务状态
          metricValue = await this.checkTaskStatus(monitor);
          status = metricValue > 0 ? MetricStatus.NORMAL : MetricStatus.CRITICAL;
          break;

        default:
          // 自定义检查
          metricValue = await this.checkCustom(monitor);
          status = MetricStatus.NORMAL;
      }

      // 记录指标
      await this.recordMetric({
        monitorId: monitor.id,
        metricName: monitor.metricName || 'default',
        metricValue,
        status,
        dataPointCount: 1,
      });

      this.logger.log(`监控检查完成：${monitor.id}, 值：${metricValue}, 状态：${status}`);
    } catch (error) {
      this.logger.error(`监控检查失败：${monitor.id}`, error);
      
      // 记录错误指标
      await this.recordMetric({
        monitorId: monitor.id,
        metricName: monitor.metricName || 'default',
        metricValue: 0,
        status: MetricStatus.ERROR,
        metadata: { error: error.message },
      });
    }
  }

  /**
   * 检查数据质量
   */
  private async checkDataQuality(monitor: DataMonitor): Promise<number> {
    // TODO: 实现实际的数据质量检查逻辑
    // 例如：查询数据库计算质量评分
    return Math.random() * 100; // 模拟值
  }

  /**
   * 检查数据量
   */
  private async checkDataVolume(monitor: DataMonitor): Promise<number> {
    // TODO: 实现实际的数据量检查逻辑
    // 例如：COUNT(*) FROM table
    return Math.floor(Math.random() * 10000); // 模拟值
  }

  /**
   * 检查任务状态
   */
  private async checkTaskStatus(monitor: DataMonitor): Promise<number> {
    // TODO: 实现实际的任务状态检查逻辑
    // 例如：检查最近任务是否成功
    return 1; // 1 表示正常，0 表示失败
  }

  /**
   * 自定义检查
   */
  private async checkCustom(monitor: DataMonitor): Promise<number> {
    // TODO: 实现自定义检查逻辑
    return Math.random() * 100; // 模拟值
  }

  /**
   * 评估状态
   */
  private evaluateStatus(value: number, warningThreshold: number, criticalThreshold: number): MetricStatus {
    if (criticalThreshold !== null && criticalThreshold !== undefined) {
      if (value <= criticalThreshold) {
        return MetricStatus.CRITICAL;
      }
    }

    if (warningThreshold !== null && warningThreshold !== undefined) {
      if (value <= warningThreshold) {
        return MetricStatus.WARNING;
      }
    }

    return MetricStatus.NORMAL;
  }

  /**
   * 清理旧指标数据
   */
  async cleanupOldMetrics(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.metricRepository
      .createQueryBuilder('metric')
      .delete()
      .where('metric.createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`清理了 ${result.affected || 0} 条旧指标数据`);
    return result.affected || 0;
  }
}
