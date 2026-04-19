import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QualityRule } from './quality-rule.entity';
import { QualityCheckResult, CheckStatus } from './quality-check-result.entity';
import { QualityScore } from './quality-score.entity';
import { CreateQualityRuleDto, UpdateQualityRuleDto, CheckDataDto } from './dto/quality-rule.dto';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityRule)
    private readonly ruleRepository: Repository<QualityRule>,
    @InjectRepository(QualityCheckResult)
    private readonly resultRepository: Repository<QualityCheckResult>,
    @InjectRepository(QualityScore)
    private readonly scoreRepository: Repository<QualityScore>,
  ) {}

  // ==================== 规则管理 ====================

  /**
   * 创建质量规则
   */
  async createRule(createRuleDto: CreateQualityRuleDto, userId: string): Promise<QualityRule> {
    const rule = this.ruleRepository.create({
      ...createRuleDto,
      createdById: userId,
    });

    return this.ruleRepository.save(rule);
  }

  /**
   * 获取所有规则
   */
  async findAllRules(query: any): Promise<{ rules: QualityRule[]; total: number }> {
    const {
      name,
      ruleType,
      scope,
      resourceType,
      severity,
      isActive = true,
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.ruleRepository
      .createQueryBuilder('rule')
      .where('1=1');

    if (name) {
      queryBuilder.andWhere('rule.name ILIKE :name', { name: `%${name}%` });
    }

    if (ruleType) {
      queryBuilder.andWhere('rule.ruleType = :ruleType', { ruleType });
    }

    if (scope) {
      queryBuilder.andWhere('rule.scope = :scope', { scope });
    }

    if (resourceType) {
      queryBuilder.andWhere('rule.resourceType = :resourceType', { resourceType });
    }

    if (severity) {
      queryBuilder.andWhere('rule.severity = :severity', { severity });
    }

    if (isActive !== null && isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('rule.executionOrder', 'ASC')
      .addOrderBy('rule.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rules, total] = await queryBuilder.getManyAndCount();

    return { rules, total };
  }

  /**
   * 根据 ID 获取规则
   */
  async findRuleById(id: string): Promise<QualityRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('规则不存在');
    }

    return rule;
  }

  /**
   * 更新规则
   */
  async updateRule(id: string, updateDto: UpdateQualityRuleDto, userId: string): Promise<QualityRule> {
    const rule = await this.findRuleById(id);

    Object.assign(rule, updateDto);
    rule.updatedById = userId;

    return this.ruleRepository.save(rule);
  }

  /**
   * 删除规则
   */
  async deleteRule(id: string): Promise<void> {
    const rule = await this.findRuleById(id);
    await this.ruleRepository.remove(rule);
  }

  /**
   * 获取指定资源类型的活跃规则
   */
  async getActiveRules(resourceType: string, scope?: string): Promise<QualityRule[]> {
    const queryBuilder = this.ruleRepository
      .createQueryBuilder('rule')
      .where('rule.isActive = :isActive', { isActive: true })
      .andWhere('(rule.resourceType = :resourceType OR rule.scope = :globalScope)', {
        resourceType,
        globalScope: 'global',
      })
      .orderBy('rule.executionOrder', 'ASC');

    if (scope) {
      queryBuilder.andWhere('rule.scope = :scope OR rule.scope = :globalScope', {
        scope,
        globalScope: 'global',
      });
    }

    return queryBuilder.getMany();
  }

  // ==================== 质量检查 ====================

  /**
   * 执行质量检查
   */
  async performQualityCheck(checkData: CheckDataDto): Promise<{
    results: QualityCheckResult[];
    score: QualityScore;
  }> {
    const { resourceType, resourceId, data } = checkData;

    // 获取适用的规则
    const rules = await this.getActiveRules(resourceType);

    const results: QualityCheckResult[] = [];
    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    // 逐条规则检查
    for (const rule of rules) {
      const result = await this.checkRule(rule, data);
      results.push(result);

      // 统计
      if (result.status === CheckStatus.PASSED) {
        passedChecks++;
      } else if (result.status === CheckStatus.FAILED) {
        failedChecks++;
        if (rule.severity === 'critical') criticalIssues++;
        else if (rule.severity === 'high') highIssues++;
        else if (rule.severity === 'medium') mediumIssues++;
        else if (rule.severity === 'low') lowIssues++;
      } else if (result.status === CheckStatus.WARNING) {
        warningChecks++;
      }
    }

    const totalChecks = results.length;
    const overallScore = totalChecks > 0 
      ? (passedChecks / totalChecks) * 100 
      : 100;

    // 保存检查结果
    await this.resultRepository.save(results);

    // 计算评分
    const score = await this.calculateAndSaveScore({
      resourceType,
      resourceId,
      overallScore,
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      results,
    });

    return { results, score };
  }

  /**
   * 检查单条规则
   */
  private async checkRule(rule: QualityRule, data: any): Promise<QualityCheckResult> {
    const fieldValue = this.getFieldValue(data, rule.fieldPath);
    let status = CheckStatus.PASSED;
    let message = '检查通过';
    let expectedValue = rule.expression;

    try {
      let passed = false;

      switch (rule.ruleType) {
        case 'required':
          passed = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
          break;
        case 'pattern':
          const regex = new RegExp(rule.expression);
          passed = regex.test(fieldValue);
          break;
        case 'range':
          const [min, max] = rule.expression.split(',').map(Number);
          passed = fieldValue >= min && fieldValue <= max;
          break;
        case 'length':
          const [minLen, maxLen] = rule.expression.split(',').map(Number);
          const length = fieldValue ? String(fieldValue).length : 0;
          passed = length >= minLen && length <= maxLen;
          break;
        case 'unique':
          // 唯一性检查需要数据库查询，这里简化处理
          passed = true;
          break;
        case 'reference':
          // 引用检查需要数据库查询，这里简化处理
          passed = true;
          break;
        case 'custom':
          // 自定义规则，使用 Function 或 eval（生产环境应该更安全）
          try {
            const checkFn = new Function('value', `return ${rule.expression}`);
            passed = checkFn(fieldValue);
          } catch (e) {
            passed = false;
            message = `规则执行错误：${e.message}`;
          }
          break;
        default:
          passed = true;
      }

      if (!passed) {
        status = rule.severity === 'low' ? CheckStatus.WARNING : CheckStatus.FAILED;
        message = rule.errorMessage;
      }
    } catch (error) {
      status = CheckStatus.FAILED;
      message = `检查执行失败：${error.message}`;
    }

    return this.resultRepository.create({
      resourceType: rule.resourceType,
      resourceId: data.id,
      ruleId: rule.id,
      status,
      message,
      fieldValue: fieldValue ? String(fieldValue) : null,
      expectedValue,
      severityWeight: this.getSeverityWeight(rule.severity),
    });
  }

  /**
   * 获取嵌套字段值
   */
  private getFieldValue(data: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, field) => {
      return obj ? obj[field] : undefined;
    }, data);
  }

  /**
   * 获取严重程度权重
   */
  private getSeverityWeight(severity: string): number {
    const weights = {
      critical: 4.0,
      high: 3.0,
      medium: 2.0,
      low: 1.0,
    };
    return weights[severity] || 1.0;
  }

  /**
   * 计算并保存评分
   */
  private async calculateAndSaveScore(scoreData: any): Promise<QualityScore> {
    const {
      resourceType,
      resourceId,
      overallScore,
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      results,
    } = scoreData;

    // 生成详细分解
    const breakdown = {
      byRuleType: {},
      bySeverity: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
      },
      passRate: overallScore,
    };

    // 生成改进建议
    const recommendations = this.generateRecommendations(results);

    const score = this.scoreRepository.create({
      resourceType,
      resourceId,
      overallScore,
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      breakdown,
      recommendations,
    });

    return this.scoreRepository.save(score);
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(results: QualityCheckResult[]): string[] {
    const recommendations: string[] = [];
    const failedRules = results.filter(r => r.status === CheckStatus.FAILED);

    if (failedRules.length > 0) {
      recommendations.push(`发现 ${failedRules.length} 项检查未通过，请及时修复`);
    }

    const criticalFailures = failedRules.filter(r => r.severityWeight >= 4.0);
    if (criticalFailures.length > 0) {
      recommendations.push(`存在 ${criticalFailures.length} 项严重问题，请优先处理`);
    }

    return recommendations;
  }

  // ==================== 评分查询 ====================

  /**
   * 获取资源评分
   */
  async getScore(resourceType: string, resourceId: string): Promise<QualityScore | null> {
    return this.scoreRepository.findOne({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取检查结果
   */
  async getCheckResults(
    resourceType: string,
    resourceId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ results: QualityCheckResult[]; total: number }> {
    const [results, total] = await this.resultRepository.findAndCount({
      where: { resourceType, resourceId },
      relations: ['rule'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { results, total };
  }

  /**
   * 获取失败的检查
   */
  async getFailedChecks(
    resourceType?: string,
    limit: number = 100,
  ): Promise<QualityCheckResult[]> {
    const where: any = { status: CheckStatus.FAILED };
    
    if (resourceType) {
      where.resourceType = resourceType;
    }

    return this.resultRepository.find({
      where,
      relations: ['rule'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取质量统计
   */
  async getQualityStatistics(resourceType?: string): Promise<any> {
    const queryBuilder = this.scoreRepository
      .createQueryBuilder('score')
      .select('AVG(score.overallScore)', 'avgScore')
      .addSelect('COUNT(*)', 'totalScores')
      .addSelect('SUM(score.passedChecks)', 'totalPassed')
      .addSelect('SUM(score.failedChecks)', 'totalFailed')
      .addSelect('SUM(score.warningChecks)', 'totalWarnings');

    if (resourceType) {
      queryBuilder.where('score.resourceType = :resourceType', { resourceType });
    }

    const stats = await queryBuilder.getRawOne();

    return {
      avgScore: parseFloat(stats.avgscore || 0),
      totalScores: parseInt(stats.totalscores || 0),
      totalPassed: parseInt(stats.totalpassed || 0),
      totalFailed: parseInt(stats.totalfailed || 0),
      totalWarnings: parseInt(stats.totalwarnings || 0),
      passRate: stats.totalscores > 0 
        ? (parseInt(stats.totalpassed || 0) / parseInt(stats.totalscores || 0)) * 100 
        : 0,
    };
  }
}
