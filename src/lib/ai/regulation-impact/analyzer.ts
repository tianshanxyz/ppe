/**
 * 法规变更影响分析系统 - 影响分析引擎
 *
 * A-008: 法规变更影响分析
 */

import {
  RegulationChange,
  RegulationChangeType,
  ImpactAnalysis,
  ImpactSeverity,
  ImpactScope,
  AffectedProduct,
  AffectedCompany,
  ImpactAnalysisRequest,
} from './types'

/**
 * 产品数据（模拟从数据库获取）
 */
interface ProductData {
  id: string
  name: string
  category: string
  manufacturer_id: string
  manufacturer_name: string
  certifications: string[]
  markets: string[]
  applicable_regulations: string[]
}

/**
 * 企业数据（模拟从数据库获取）
 */
interface CompanyData {
  id: string
  name: string
  jurisdictions: string[]
  product_categories: string[]
  certifications: string[]
}

/**
 * 影响分析引擎
 */
export class ImpactAnalyzer {
  /**
   * 执行影响分析
   */
  async analyze(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    const { change, analysis_depth } = request

    // 1. 确定影响范围
    const scope = this.determineScope(change)

    // 2. 评估严重程度
    const severity = this.assessSeverity(change, scope)

    // 3. 识别受影响的产品
    const affectedProducts = await this.identifyAffectedProducts(change, analysis_depth)

    // 4. 识别受影响的企业
    const affectedCompanies = await this.identifyAffectedCompanies(
      change,
      affectedProducts,
      analysis_depth
    )

    // 5. 提取受影响类别和市场
    const affectedCategories = this.extractCategories(affectedProducts)
    const affectedMarkets = this.extractMarkets(affectedCompanies)

    // 6. 生成摘要和建议
    const summary = this.generateSummary(change, severity, affectedProducts, affectedCompanies)
    const recommendations = this.generateRecommendations(change, severity, affectedProducts)

    return {
      change,
      scope,
      severity,
      affected_products: affectedProducts,
      affected_companies: affectedCompanies,
      affected_categories: affectedCategories,
      affected_markets: affectedMarkets,
      summary,
      recommendations,
      analysis_timestamp: new Date().toISOString(),
    }
  }

  /**
   * 确定影响范围
   */
  private determineScope(change: RegulationChange): ImpactScope {
    // 根据变更类型和关键词判断影响范围
    const keywords = change.keywords.map((k) => k.toLowerCase())

    // 全局性关键词
    const globalKeywords = ['all', 'global', 'international', 'worldwide', '全部', '全球']
    if (keywords.some((k) => globalKeywords.includes(k))) {
      return ImpactScope.GLOBAL
    }

    // 市场级别关键词
    const marketKeywords = ['market', 'jurisdiction', 'country', '市场', '国家']
    if (keywords.some((k) => marketKeywords.includes(k))) {
      return ImpactScope.MARKET
    }

    // 类别级别关键词
    const categoryKeywords = ['category', 'class', 'type', '类别', '类型']
    if (keywords.some((k) => categoryKeywords.includes(k))) {
      return ImpactScope.CATEGORY
    }

    // 根据变更类型判断
    switch (change.change_type) {
      case RegulationChangeType.REPEALED:
        return ImpactScope.MARKET
      case RegulationChangeType.NEW:
        return ImpactScope.CATEGORY
      default:
        return ImpactScope.PRODUCT
    }
  }

  /**
   * 评估严重程度
   */
  private assessSeverity(change: RegulationChange, scope: ImpactScope): ImpactSeverity {
    let severityScore = 0

    // 根据变更类型评分
    switch (change.change_type) {
      case RegulationChangeType.REPEALED:
        severityScore += 40
        break
      case RegulationChangeType.NEW:
        severityScore += 30
        break
      case RegulationChangeType.AMENDED:
        severityScore += 25
        break
      default:
        severityScore += 10
    }

    // 根据影响范围评分
    switch (scope) {
      case ImpactScope.GLOBAL:
        severityScore += 30
        break
      case ImpactScope.MARKET:
        severityScore += 20
        break
      case ImpactScope.CATEGORY:
        severityScore += 15
        break
      case ImpactScope.COMPANY:
        severityScore += 10
        break
      default:
        severityScore += 5
    }

    // 根据关键词评分
    const criticalKeywords = ['ban', 'prohibit', 'mandatory', 'immediate', '禁止', '强制', '立即']
    if (change.keywords.some((k) => criticalKeywords.includes(k.toLowerCase()))) {
      severityScore += 20
    }

    // 根据置信度调整
    severityScore *= change.confidence

    // 映射到严重程度
    if (severityScore >= 70) return ImpactSeverity.CRITICAL
    if (severityScore >= 50) return ImpactSeverity.HIGH
    if (severityScore >= 30) return ImpactSeverity.MEDIUM
    return ImpactSeverity.LOW
  }

  /**
   * 识别受影响的产品
   */
  private async identifyAffectedProducts(
    change: RegulationChange,
    depth: string
  ): Promise<AffectedProduct[]> {
    // 这里应该从数据库查询受影响的产品
    // 模拟实现
    const affectedProducts: AffectedProduct[] = []

    // 根据法规关键词匹配产品
    const productKeywords = this.extractProductKeywords(change)

    // 模拟查询结果
    if (depth === 'comprehensive') {
      // 全面分析 - 返回更多结果
      affectedProducts.push({
        product_id: 'prod_001',
        product_name: 'N95 Respirator',
        manufacturer_id: 'comp_001',
        manufacturer_name: '3M Company',
        impact_severity: ImpactSeverity.HIGH,
        impact_description: '产品需要重新认证以符合新法规要求',
        required_actions: ['更新技术文档', '重新提交认证申请', '进行产品测试'],
        deadline: this.calculateDeadline(change.effective_date, 180),
        estimated_cost: 50000,
      })
    } else if (depth === 'detailed') {
      // 详细分析
      affectedProducts.push({
        product_id: 'prod_002',
        product_name: 'Surgical Mask',
        manufacturer_id: 'comp_002',
        manufacturer_name: 'Honeywell',
        impact_severity: ImpactSeverity.MEDIUM,
        impact_description: '标签要求变更',
        required_actions: ['更新产品标签', '通知分销商'],
        deadline: this.calculateDeadline(change.effective_date, 90),
        estimated_cost: 10000,
      })
    }

    return affectedProducts
  }

  /**
   * 识别受影响的企业
   */
  private async identifyAffectedCompanies(
    change: RegulationChange,
    affectedProducts: AffectedProduct[],
    depth: string
  ): Promise<AffectedCompany[]> {
    const companyMap = new Map<string, AffectedCompany>()

    // 从产品影响汇总企业影响
    for (const product of affectedProducts) {
      const existing = companyMap.get(product.manufacturer_id)

      if (existing) {
        existing.affected_products_count += 1
        existing.estimated_compliance_cost += product.estimated_cost || 0
        if (!existing.affected_markets.includes(change.jurisdiction)) {
          existing.affected_markets.push(change.jurisdiction)
        }
        // 更新严重程度为更高的级别
        if (this.severityRank(product.impact_severity) > this.severityRank(existing.impact_severity)) {
          existing.impact_severity = product.impact_severity
        }
      } else {
        companyMap.set(product.manufacturer_id, {
          company_id: product.manufacturer_id,
          company_name: product.manufacturer_name,
          impact_severity: product.impact_severity,
          impact_description: `有 ${1} 个产品受到影响`,
          affected_products_count: 1,
          affected_markets: [change.jurisdiction],
          required_actions: [...product.required_actions],
          estimated_compliance_cost: product.estimated_cost || 0,
          estimated_timeline_days: this.calculateTimeline(product.deadline),
        })
      }
    }

    // 如果是全面分析，添加更多企业
    if (depth === 'comprehensive') {
      companyMap.set('comp_003', {
        company_id: 'comp_003',
        company_name: 'Ansell Healthcare',
        impact_severity: ImpactSeverity.LOW,
        impact_description: '需要关注法规变化，可能影响未来产品规划',
        affected_products_count: 0,
        affected_markets: [change.jurisdiction],
        required_actions: ['监控法规发展', '评估影响'],
        estimated_compliance_cost: 0,
        estimated_timeline_days: 365,
      })
    }

    return Array.from(companyMap.values())
  }

  /**
   * 提取产品关键词
   */
  private extractProductKeywords(change: RegulationChange): string[] {
    const productCategories = [
      'respirator',
      'mask',
      'glove',
      'gown',
      'shield',
      'helmet',
      'shoe',
      'earplug',
      'harness',
    ]

    return change.keywords.filter((k) =>
      productCategories.some((cat) => k.toLowerCase().includes(cat))
    )
  }

  /**
   * 提取类别
   */
  private extractCategories(products: AffectedProduct[]): string[] {
    const categories = new Set<string>()
    // 这里应该根据产品ID查询实际类别
    categories.add('Respiratory Protection')
    categories.add('Hand Protection')
    return Array.from(categories)
  }

  /**
   * 提取市场
   */
  private extractMarkets(companies: AffectedCompany[]): string[] {
    const markets = new Set<string>()
    for (const company of companies) {
      for (const market of company.affected_markets) {
        markets.add(market)
      }
    }
    return Array.from(markets)
  }

  /**
   * 生成摘要
   */
  private generateSummary(
    change: RegulationChange,
    severity: ImpactSeverity,
    products: AffectedProduct[],
    companies: AffectedCompany[]
  ): string {
    const severityLabel = this.getSeverityLabel(severity)
    const productCount = products.length
    const companyCount = companies.length

    let summary = `法规变更影响分析：${change.regulation_title}\n`
    summary += `严重程度：${severityLabel}\n`
    summary += `影响范围：${productCount} 个产品，${companyCount} 家企业\n`

    if (productCount > 0) {
      const criticalCount = products.filter((p) => p.impact_severity === ImpactSeverity.CRITICAL).length
      const highCount = products.filter((p) => p.impact_severity === ImpactSeverity.HIGH).length

      if (criticalCount > 0) {
        summary += `其中 ${criticalCount} 个产品受到严重影响，需要立即采取行动。\n`
      }
      if (highCount > 0) {
        summary += `${highCount} 个产品受到高度影响，建议尽快处理。\n`
      }
    }

    summary += `生效日期：${change.effective_date}`

    return summary
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    change: RegulationChange,
    severity: ImpactSeverity,
    products: AffectedProduct[]
  ): string[] {
    const recommendations: string[] = []

    // 根据严重程度生成建议
    if (severity === ImpactSeverity.CRITICAL || severity === ImpactSeverity.HIGH) {
      recommendations.push('立即成立法规响应小组，评估全面影响')
      recommendations.push('联系法律顾问，确认合规要求')
      recommendations.push('通知受影响的客户和合作伙伴')
    }

    // 根据变更类型生成建议
    switch (change.change_type) {
      case RegulationChangeType.NEW:
        recommendations.push('研究新法规要求，制定合规计划')
        recommendations.push('评估现有产品是否符合新要求')
        break
      case RegulationChangeType.AMENDED:
        recommendations.push('对比新旧版本，识别具体变更点')
        recommendations.push('更新内部流程和文档')
        break
      case RegulationChangeType.REPEALED:
        recommendations.push('确认替代法规或过渡安排')
        recommendations.push('评估是否需要调整产品策略')
        break
    }

    // 根据产品影响生成建议
    if (products.length > 0) {
      const totalCost = products.reduce((sum, p) => sum + (p.estimated_cost || 0), 0)
      recommendations.push(`预估合规成本：$${totalCost.toLocaleString()}，请做好预算规划`)

      const earliestDeadline = products
        .filter((p) => p.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

      if (earliestDeadline) {
        recommendations.push(`最早的合规截止日期：${earliestDeadline.deadline}，请合理安排时间`)
      }
    }

    recommendations.push('持续监控相关法规的进一步更新')

    return recommendations
  }

  /**
   * 计算截止日期
   */
  private calculateDeadline(effectiveDate: string, daysToAdd: number): string {
    const date = new Date(effectiveDate)
    date.setDate(date.getDate() + daysToAdd)
    return date.toISOString().split('T')[0]
  }

  /**
   * 计算时间线（天数）
   */
  private calculateTimeline(deadline?: string): number {
    if (!deadline) return 365
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, days)
  }

  /**
   * 严重程度排名
   */
  private severityRank(severity: ImpactSeverity): number {
    const ranks: Record<ImpactSeverity, number> = {
      [ImpactSeverity.CRITICAL]: 4,
      [ImpactSeverity.HIGH]: 3,
      [ImpactSeverity.MEDIUM]: 2,
      [ImpactSeverity.LOW]: 1,
    }
    return ranks[severity] || 0
  }

  /**
   * 获取严重程度标签
   */
  private getSeverityLabel(severity: ImpactSeverity): string {
    const labels: Record<ImpactSeverity, string> = {
      [ImpactSeverity.CRITICAL]: '严重',
      [ImpactSeverity.HIGH]: '高',
      [ImpactSeverity.MEDIUM]: '中',
      [ImpactSeverity.LOW]: '低',
    }
    return labels[severity] || '未知'
  }
}

// 导出单例
export const impactAnalyzer = new ImpactAnalyzer()
