/**
 * 法规变更影响分析系统 - 变更检测器
 *
 * A-008: 法规变更影响分析
 */

import {
  RegulationChange,
  RegulationChangeType,
  MonitoringConfig,
  DEFAULT_MONITORING_CONFIG,
} from './types'

/**
 * 法规数据（模拟从数据库获取）
 */
interface RegulationData {
  id: string
  title: string
  jurisdiction: string
  type: string
  category: string
  effective_date: string
  last_updated: string
  content: string
  keywords: string[]
}

/**
 * 法规变更检测器
 */
export class RegulationChangeDetector {
  private config: MonitoringConfig

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config }
  }

  /**
   * 检测法规变更
   */
  async detectChanges(
    previousRegulations: RegulationData[],
    currentRegulations: RegulationData[]
  ): Promise<RegulationChange[]> {
    const changes: RegulationChange[] = []

    // 1. 检测新增法规
    const newRegulations = this.findNewRegulations(previousRegulations, currentRegulations)
    for (const reg of newRegulations) {
      changes.push(this.createChangeRecord(reg, RegulationChangeType.NEW))
    }

    // 2. 检测修订的法规
    const amendedRegulations = this.findAmendedRegulations(
      previousRegulations,
      currentRegulations
    )
    for (const { current, previous } of amendedRegulations) {
      changes.push(
        this.createChangeRecord(current, RegulationChangeType.AMENDED, previous)
      )
    }

    // 3. 检测废止的法规
    const repealedRegulations = this.findRepealedRegulations(
      previousRegulations,
      currentRegulations
    )
    for (const reg of repealedRegulations) {
      changes.push(this.createChangeRecord(reg, RegulationChangeType.REPEALED))
    }

    // 4. 按时间排序
    return changes.sort(
      (a, b) =>
        new Date(b.announced_date).getTime() - new Date(a.announced_date).getTime()
    )
  }

  /**
   * 查找新增法规
   */
  private findNewRegulations(
    previous: RegulationData[],
    current: RegulationData[]
  ): RegulationData[] {
    const previousIds = new Set(previous.map((r) => r.id))
    return current.filter((r) => !previousIds.has(r.id))
  }

  /**
   * 查找修订的法规
   */
  private findAmendedRegulations(
    previous: RegulationData[],
    current: RegulationData[]
  ): Array<{ current: RegulationData; previous: RegulationData }> {
    const previousMap = new Map(previous.map((r) => [r.id, r]))
    const amended: Array<{ current: RegulationData; previous: RegulationData }> = []

    for (const curr of current) {
      const prev = previousMap.get(curr.id)
      if (prev) {
        // 检查关键字段是否有变更
        if (
          curr.title !== prev.title ||
          curr.content !== prev.content ||
          curr.effective_date !== prev.effective_date ||
          curr.last_updated !== prev.last_updated
        ) {
          amended.push({ current: curr, previous: prev })
        }
      }
    }

    return amended
  }

  /**
   * 查找废止的法规
   */
  private findRepealedRegulations(
    previous: RegulationData[],
    current: RegulationData[]
  ): RegulationData[] {
    const currentIds = new Set(current.map((r) => r.id))
    return previous.filter((r) => !currentIds.has(r.id))
  }

  /**
   * 创建变更记录
   */
  private createChangeRecord(
    regulation: RegulationData,
    changeType: RegulationChangeType,
    previousVersion?: RegulationData
  ): RegulationChange {
    const changedFields = previousVersion
      ? this.identifyChangedFields(previousVersion, regulation)
      : []

    const changeSummary = this.generateChangeSummary(
      changeType,
      regulation,
      changedFields
    )

    return {
      id: `change_${regulation.id}_${Date.now()}`,
      regulation_id: regulation.id,
      regulation_title: regulation.title,
      jurisdiction: regulation.jurisdiction,
      change_type: changeType,
      change_summary: changeSummary,
      changed_fields: changedFields,
      previous_version: previousVersion?.last_updated,
      current_version: regulation.last_updated,
      effective_date: regulation.effective_date,
      announced_date: new Date().toISOString(),
      keywords: regulation.keywords,
      confidence: this.calculateConfidence(changeType, changedFields),
      created_at: new Date().toISOString(),
    }
  }

  /**
   * 识别变更字段
   */
  private identifyChangedFields(
    previous: RegulationData,
    current: RegulationData
  ): string[] {
    const changedFields: string[] = []

    if (previous.title !== current.title) changedFields.push('title')
    if (previous.content !== current.content) changedFields.push('content')
    if (previous.effective_date !== current.effective_date)
      changedFields.push('effective_date')
    if (previous.category !== current.category) changedFields.push('category')
    if (previous.type !== current.type) changedFields.push('type')
    if (
      JSON.stringify(previous.keywords) !== JSON.stringify(current.keywords)
    ) {
      changedFields.push('keywords')
    }

    return changedFields
  }

  /**
   * 生成变更摘要
   */
  private generateChangeSummary(
    changeType: RegulationChangeType,
    regulation: RegulationData,
    changedFields: string[]
  ): string {
    switch (changeType) {
      case RegulationChangeType.NEW:
        return `新增法规：${regulation.title}，将于 ${regulation.effective_date} 生效`

      case RegulationChangeType.AMENDED:
        const fieldNames = changedFields.map((f) => this.translateFieldName(f))
        return `法规修订：${regulation.title}，变更内容：${fieldNames.join('、')}`

      case RegulationChangeType.REPEALED:
        return `法规废止：${regulation.title}`

      case RegulationChangeType.INTERPRETATION:
        return `官方解释：${regulation.title}`

      case RegulationChangeType.GUIDANCE:
        return `指导文件：${regulation.title}`

      default:
        return `法规变更：${regulation.title}`
    }
  }

  /**
   * 翻译字段名
   */
  private translateFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      title: '标题',
      content: '内容',
      effective_date: '生效日期',
      category: '类别',
      type: '类型',
      keywords: '关键词',
    }
    return fieldMap[field] || field
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    changeType: RegulationChangeType,
    changedFields: string[]
  ): number {
    let baseConfidence = 0.9

    // 根据变更类型调整
    switch (changeType) {
      case RegulationChangeType.NEW:
        baseConfidence = 0.95
        break
      case RegulationChangeType.AMENDED:
        baseConfidence = 0.9
        break
      case RegulationChangeType.REPEALED:
        baseConfidence = 0.85
        break
      default:
        baseConfidence = 0.8
    }

    // 根据变更字段数量微调
    if (changedFields.length > 3) {
      baseConfidence -= 0.05
    }

    return Math.max(0.7, Math.min(1, baseConfidence))
  }

  /**
   * 模拟从外部源获取最新法规数据
   * 实际实现中应该调用外部API或爬虫
   */
  async fetchLatestRegulations(): Promise<RegulationData[]> {
    // 这里应该实现实际的法规数据获取逻辑
    // 例如：调用政府API、爬取官网、订阅RSS等
    return []
  }

  /**
   * 检查特定法规是否有更新
   */
  async checkRegulationUpdate(
    regulationId: string,
    lastKnownVersion: string
  ): Promise<RegulationChange | null> {
    // 实现单个法规的更新检查
    return null
  }

  /**
   * 获取配置
   */
  getConfig(): MonitoringConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 导出单例
export const changeDetector = new RegulationChangeDetector()
