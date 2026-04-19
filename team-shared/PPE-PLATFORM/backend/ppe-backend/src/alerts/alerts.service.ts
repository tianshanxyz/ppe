import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, MoreThan, LessThan, Between } from 'typeorm';
import { AlertRule, AlertLevel, AlertType, AlertStatus, TriggerCondition } from './alert-rule.entity';
import { AlertRecord } from './alert-record.entity';
import { CreateAlertRuleDto, UpdateAlertRuleDto, AlertRuleQueryDto, ProcessAlertDto } from './dto/alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(AlertRecord)
    private readonly alertRecordRepository: Repository<AlertRecord>,
  ) {}

  /**
   * 创建告警规则
   */
  async create(createAlertRuleDto: CreateAlertRuleDto): Promise<AlertRule> {
    const existingRule = await this.alertRuleRepository.findOne({
      where: { name: createAlertRuleDto.name },
    });

    if (existingRule) {
      throw new ConflictException('规则名称已存在');
    }

    const rule = this.alertRuleRepository.create(createAlertRuleDto);
    return this.alertRuleRepository.save(rule);
  }

  /**
   * 获取所有告警规则
   */
  async findAll(query: AlertRuleQueryDto): Promise<{ rules: AlertRule[]; total: number }> {
    const {
      name,
      alertType,
      level,
      dataSource,
      status,
      enabled,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: any = {};

    if (name) {
      where.name = ILike(`%${name}%`);
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (level) {
      where.level = level;
    }

    if (dataSource) {
      where.dataSource = ILike(`%${dataSource}%`);
    }

    if (status) {
      where.status = status;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    const queryBuilder = this.alertRuleRepository
      .createQueryBuilder('rule')
      .where(where)
      .orderBy(`rule.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [rules, total] = await queryBuilder.getManyAndCount();

    return { rules, total };
  }

  /**
   * 根据 ID 获取告警规则
   */
  async findOne(id: string): Promise<AlertRule> {
    const rule = await this.alertRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }

    return rule;
  }

  /**
   * 更新告警规则
   */
  async update(id: string, updateAlertRuleDto: UpdateAlertRuleDto): Promise<AlertRule> {
    const rule = await this.findOne(id);
    
    if (updateAlertRuleDto.name && updateAlertRuleDto.name !== rule.name) {
      const existingRule = await this.alertRuleRepository.findOne({
        where: { name: updateAlertRuleDto.name },
      });

      if (existingRule && existingRule.id !== id) {
        throw new ConflictException('规则名称已存在');
      }
    }

    Object.assign(rule, updateAlertRuleDto);
    return this.alertRuleRepository.save(rule);
  }

  /**
   * 删除告警规则
   */
  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.alertRuleRepository.remove(rule);
  }

  /**
   * 启用/禁用告警规则
   */
  async toggleStatus(id: string): Promise<AlertRule> {
    const rule = await this.findOne(id);
    rule.enabled = !rule.enabled;
    rule.status = rule.enabled ? AlertStatus.ACTIVE : AlertStatus.DISABLED;
    return this.alertRuleRepository.save(rule);
  }

  /**
   * 触发告警
   */
  async triggerAlert(
    ruleId: string,
    title: string,
    message: string,
    triggerData?: Record<string, any>,
    triggerValue?: number,
    affectedRecords?: string[],
  ): Promise<AlertRecord> {
    const rule = await this.findOne(ruleId);

    if (!rule.enabled || rule.status === AlertStatus.DISABLED) {
      throw new ConflictException('告警规则已禁用');
    }

    const record = this.alertRecordRepository.create({
      ruleId,
      title,
      message,
      level: rule.level,
      alertType: rule.alertType,
      triggerData,
      triggerValue,
      thresholdValue: rule.thresholdValue,
      affectedRecords,
      status: 'pending',
    });

    const savedRecord = await this.alertRecordRepository.save(record);

    rule.triggerCount += 1;
    rule.lastTriggeredAt = new Date();
    await this.alertRuleRepository.save(rule);

    return savedRecord;
  }

  /**
   * 获取告警记录
   */
  async getAlertRecords(query: any): Promise<{ records: AlertRecord[]; total: number }> {
    const {
      ruleId,
      level,
      alertType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (ruleId) {
      where.ruleId = ruleId;
    }

    if (level) {
      where.level = level;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.moreThan = startDate;
      }
      if (endDate) {
        where.createdAt.lessThan = endDate;
      }
    }

    const queryBuilder = this.alertRecordRepository
      .createQueryBuilder('record')
      .where(where)
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [records, total] = await queryBuilder.getManyAndCount();

    return { records, total };
  }

  /**
   * 处理告警
   */
  async processAlert(id: string, processAlertDto: ProcessAlertDto, processedBy?: string): Promise<AlertRecord> {
    const record = await this.alertRecordRepository.findOne({ where: { id } });

    if (!record) {
      throw new NotFoundException('告警记录不存在');
    }

    record.status = processAlertDto.status;
    record.resolution = processAlertDto.resolution;
    record.processedBy = processedBy;
    record.processedAt = new Date();

    return this.alertRecordRepository.save(record);
  }

  /**
   * 批量处理告警
   */
  async batchProcessAlerts(ids: string[], status: string, resolution: string, processedBy?: string): Promise<number> {
    const result = await this.alertRecordRepository
      .createQueryBuilder()
      .update()
      .set({
        status,
        resolution,
        processedBy,
        processedAt: new Date(),
      })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * 获取未处理告警数量
   */
  async getPendingCount(ruleId?: string): Promise<number> {
    const where: any = { status: 'pending' };

    if (ruleId) {
      where.ruleId = ruleId;
    }

    return this.alertRecordRepository.count({ where });
  }

  /**
   * 获取告警统计信息
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.alertRecordRepository.createQueryBuilder('record');

    const totalQuery = await queryBuilder.getCount();

    const byLevelQuery = await queryBuilder
      .select('record.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.level')
      .getRawMany();

    const byLevel = byLevelQuery.reduce((acc, item) => {
      acc[item.level] = parseInt(item.count);
      return acc;
    }, {});

    const byTypeQuery = await queryBuilder
      .select('record.alertType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.alertType')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    const byStatusQuery = await queryBuilder
      .select('record.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const pendingCount = await queryBuilder.where('record.status = :status', { status: 'pending' }).getCount();
    const resolvedCount = await queryBuilder.where('record.status = :status', { status: 'resolved' }).getCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await queryBuilder
      .where('record.createdAt >= :today', { today })
      .getCount();

    return {
      totalRecords: totalQuery,
      byLevel,
      byType,
      byStatus,
      pendingCount,
      resolvedCount,
      todayCount,
    };
  }

  /**
   * 获取活跃告警规则
   */
  async getActiveRules(): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({
      where: {
        enabled: true,
        status: AlertStatus.ACTIVE,
      },
      order: { level: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 检查是否应该触发告警（冷却时间检查）
   */
  async shouldTrigger(ruleId: string): Promise<boolean> {
    const rule = await this.findOne(ruleId);

    if (!rule.enabled || rule.status !== AlertStatus.ACTIVE) {
      return false;
    }

    if (!rule.lastTriggeredAt) {
      return true;
    }

    const now = new Date();
    const lastTriggered = new Date(rule.lastTriggeredAt);
    const cooldownMs = rule.cooldownPeriod * 1000;

    return now.getTime() - lastTriggered.getTime() > cooldownMs;
  }

  /**
   * 评估规则（供外部调用）
   */
  async evaluateRule(ruleId: string, currentValue: any): Promise<{ shouldAlert: boolean; reason?: string }> {
    const rule = await this.findOne(ruleId);

    if (!rule.enabled || rule.status !== AlertStatus.ACTIVE) {
      return { shouldAlert: false, reason: '规则已禁用' };
    }

    const shouldTrigger = await this.shouldTrigger(ruleId);
    if (!shouldTrigger) {
      return { shouldAlert: false, reason: '冷却期内' };
    }

    const condition = rule.triggerCondition;
    const threshold = rule.thresholdValue;

    let matched = false;

    switch (condition) {
      case TriggerCondition.GREATER_THAN:
        matched = currentValue > threshold;
        break;
      case TriggerCondition.LESS_THAN:
        matched = currentValue < threshold;
        break;
      case TriggerCondition.EQUALS:
        matched = currentValue === threshold;
        break;
      case TriggerCondition.CONTAINS:
        matched = String(currentValue).includes(String(threshold));
        break;
      case TriggerCondition.CHANGES:
        matched = true;
        break;
      case TriggerCondition.NOT_EXISTS:
        matched = currentValue === null || currentValue === undefined;
        break;
      default:
        matched = false;
    }

    return {
      shouldAlert: matched,
      reason: matched ? '条件匹配' : '条件不匹配',
    };
  }
}
