/**
 * 法规变更影响分析系统 - 报告生成器
 *
 * A-008: 法规变更影响分析
 */

import {
  ImpactReport,
  ImpactAnalysis,
  RegulationChange,
  ImpactSeverity,
  SEVERITY_LABELS,
  CHANGE_TYPE_LABELS,
} from './types'

/**
 * 报告生成器
 */
export class ReportGenerator {
  /**
   * 生成影响报告
   */
  generateReport(
    title: string,
    description: string,
    analyses: ImpactAnalysis[],
    validDays: number = 30
  ): ImpactReport {
    const changes = analyses.map((a) => a.change)

    // 统计影响数量
    const stats = this.calculateStatistics(analyses)

    // 生成报告ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const generatedAt = new Date().toISOString()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    return {
      id: reportId,
      title,
      description,
      changes_analyzed: changes,
      total_affected_products: stats.totalProducts,
      total_affected_companies: stats.totalCompanies,
      critical_count: stats.criticalCount,
      high_count: stats.highCount,
      medium_count: stats.mediumCount,
      low_count: stats.lowCount,
      analysis_results: analyses,
      generated_at: generatedAt,
      valid_until: validUntil.toISOString(),
    }
  }

  /**
   * 生成Markdown格式报告
   */
  generateMarkdownReport(report: ImpactReport): string {
    let markdown = `# ${report.title}\n\n`
    markdown += `**生成时间**: ${this.formatDate(report.generated_at)}\n\n`
    markdown += `**有效期至**: ${this.formatDate(report.valid_until)}\n\n`

    if (report.description) {
      markdown += `## 报告说明\n\n${report.description}\n\n`
    }

    // 执行摘要
    markdown += `## 执行摘要\n\n`
    markdown += `- **分析法规数**: ${report.changes_analyzed.length}\n`
    markdown += `- **受影响产品**: ${report.total_affected_products}\n`
    markdown += `- **受影响企业**: ${report.total_affected_companies}\n\n`

    // 严重程度分布
    markdown += `### 严重程度分布\n\n`
    markdown += `| 级别 | 数量 | 占比 |\n`
    markdown += `|------|------|------|\n`

    const total = report.critical_count + report.high_count + report.medium_count + report.low_count
    markdown += `| 严重 | ${report.critical_count} | ${this.calculatePercentage(report.critical_count, total)} |\n`
    markdown += `| 高 | ${report.high_count} | ${this.calculatePercentage(report.high_count, total)} |\n`
    markdown += `| 中 | ${report.medium_count} | ${this.calculatePercentage(report.medium_count, total)} |\n`
    markdown += `| 低 | ${report.low_count} | ${this.calculatePercentage(report.low_count, total)} |\n\n`

    // 详细分析
    markdown += `## 详细分析\n\n`

    for (let i = 0; i < report.analysis_results.length; i++) {
      const analysis = report.analysis_results[i]
      markdown += this.generateAnalysisSection(analysis, i + 1)
    }

    // 建议汇总
    markdown += `## 建议汇总\n\n`
    const allRecommendations = this.aggregateRecommendations(report.analysis_results)
    for (let i = 0; i < allRecommendations.length; i++) {
      markdown += `${i + 1}. ${allRecommendations[i]}\n`
    }

    return markdown
  }

  /**
   * 生成HTML格式报告
   */
  generateHtmlReport(report: ImpactReport): string {
    const stats = this.calculateStatisticsFromReport(report)

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
    h2 { color: #2a2a2a; margin-top: 30px; }
    h3 { color: #3a3a3a; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2em; font-weight: bold; color: #2563eb; }
    .stat-label { color: #666; font-size: 0.9em; }
    .severity-critical { color: #dc2626; }
    .severity-high { color: #ea580c; }
    .severity-medium { color: #ca8a04; }
    .severity-low { color: #16a34a; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; font-weight: 600; }
    .recommendations { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  
  <div class="summary">
    <p><strong>生成时间:</strong> ${this.formatDate(report.generated_at)}</p>
    <p><strong>有效期至:</strong> ${this.formatDate(report.valid_until)}</p>
    ${report.description ? `<p><strong>报告说明:</strong> ${report.description}</p>` : ''}
  </div>

  <h2>执行摘要</h2>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${report.changes_analyzed.length}</div>
      <div class="stat-label">分析法规数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.total_affected_products}</div>
      <div class="stat-label">受影响产品</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.total_affected_companies}</div>
      <div class="stat-label">受影响企业</div>
    </div>
  </div>

  <h2>严重程度分布</h2>
  <table>
    <thead>
      <tr>
        <th>级别</th>
        <th>数量</th>
        <th>占比</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="severity-critical">严重</td>
        <td>${report.critical_count}</td>
        <td>${this.calculatePercentage(report.critical_count, stats.total)}</td>
      </tr>
      <tr>
        <td class="severity-high">高</td>
        <td>${report.high_count}</td>
        <td>${this.calculatePercentage(report.high_count, stats.total)}</td>
      </tr>
      <tr>
        <td class="severity-medium">中</td>
        <td>${report.medium_count}</td>
        <td>${this.calculatePercentage(report.medium_count, stats.total)}</td>
      </tr>
      <tr>
        <td class="severity-low">低</td>
        <td>${report.low_count}</td>
        <td>${this.calculatePercentage(report.low_count, stats.total)}</td>
      </tr>
    </tbody>
  </table>

  <h2>详细分析</h2>
  ${report.analysis_results.map((analysis, index) => this.generateAnalysisHtml(analysis, index + 1)).join('')}

  <h2>建议汇总</h2>
  <div class="recommendations">
    <ol>
      ${this.aggregateRecommendations(report.analysis_results).map(r => `<li>${r}</li>`).join('')}
    </ol>
  </div>

  <div class="footer">
    <p>本报告由法规变更影响分析系统自动生成</p>
    <p>报告ID: ${report.id}</p>
  </div>
</body>
</html>`
  }

  /**
   * 生成JSON格式报告
   */
  generateJsonReport(report: ImpactReport): string {
    return JSON.stringify(report, null, 2)
  }

  /**
   * 计算统计数据
   */
  private calculateStatistics(analyses: ImpactAnalysis[]): {
    totalProducts: number
    totalCompanies: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
  } {
    const totalProducts = analyses.reduce(
      (sum, a) => sum + a.affected_products.length,
      0
    )
    const totalCompanies = analyses.reduce(
      (sum, a) => sum + a.affected_companies.length,
      0
    )

    const criticalCount = analyses.filter(
      (a) => a.severity === ImpactSeverity.CRITICAL
    ).length
    const highCount = analyses.filter(
      (a) => a.severity === ImpactSeverity.HIGH
    ).length
    const mediumCount = analyses.filter(
      (a) => a.severity === ImpactSeverity.MEDIUM
    ).length
    const lowCount = analyses.filter(
      (a) => a.severity === ImpactSeverity.LOW
    ).length

    return {
      totalProducts,
      totalCompanies,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    }
  }

  /**
   * 从报告计算统计数据
   */
  private calculateStatisticsFromReport(report: ImpactReport): { total: number } {
    return {
      total:
        report.critical_count +
        report.high_count +
        report.medium_count +
        report.low_count,
    }
  }

  /**
   * 生成分析章节（Markdown）
   */
  private generateAnalysisSection(analysis: ImpactAnalysis, index: number): string {
    let section = `### ${index}. ${analysis.change.regulation_title}\n\n`

    section += `**变更类型**: ${CHANGE_TYPE_LABELS[analysis.change.change_type]}\n\n`
    section += `**严重程度**: ${SEVERITY_LABELS[analysis.severity]}\n\n`
    section += `**影响范围**: ${analysis.affected_products.length} 个产品, ${analysis.affected_companies.length} 家企业\n\n`

    if (analysis.change.change_summary) {
      section += `**变更摘要**: ${analysis.change.change_summary}\n\n`
    }

    if (analysis.affected_products.length > 0) {
      section += `**受影响产品**:\n\n`
      for (const product of analysis.affected_products) {
        section += `- ${product.product_name} (${product.manufacturer_name})\n`
        section += `  - 严重程度: ${SEVERITY_LABELS[product.impact_severity]}\n`
        section += `  - 影响: ${product.impact_description}\n`
        if (product.deadline) {
          section += `  - 截止日期: ${product.deadline}\n`
        }
        section += `\n`
      }
    }

    if (analysis.recommendations.length > 0) {
      section += `**建议**:\n\n`
      for (const rec of analysis.recommendations) {
        section += `- ${rec}\n`
      }
      section += `\n`
    }

    return section
  }

  /**
   * 生成分析HTML
   */
  private generateAnalysisHtml(analysis: ImpactAnalysis, index: number): string {
    const severityClass = `severity-${analysis.severity.toLowerCase()}`

    return `
  <div class="analysis-section">
    <h3>${index}. ${analysis.change.regulation_title}</h3>
    <p><strong>变更类型:</strong> ${CHANGE_TYPE_LABELS[analysis.change.change_type]}</p>
    <p><strong>严重程度:</strong> <span class="${severityClass}">${SEVERITY_LABELS[analysis.severity]}</span></p>
    <p><strong>影响范围:</strong> ${analysis.affected_products.length} 个产品, ${analysis.affected_companies.length} 家企业</p>
    
    ${analysis.change.change_summary ? `<p><strong>变更摘要:</strong> ${analysis.change.change_summary}</p>` : ''}
    
    ${analysis.affected_products.length > 0 ? `
    <h4>受影响产品</h4>
    <ul>
      ${analysis.affected_products.map(p => `
        <li>
          <strong>${p.product_name}</strong> (${p.manufacturer_name})<br>
          严重程度: ${SEVERITY_LABELS[p.impact_severity]}<br>
          影响: ${p.impact_description}
          ${p.deadline ? `<br>截止日期: ${p.deadline}` : ''}
        </li>
      `).join('')}
    </ul>
    ` : ''}
  </div>`
  }

  /**
   * 汇总建议
   */
  private aggregateRecommendations(analyses: ImpactAnalysis[]): string[] {
    const recommendations = new Set<string>()

    for (const analysis of analyses) {
      for (const rec of analysis.recommendations) {
        recommendations.add(rec)
      }
    }

    return Array.from(recommendations)
  }

  /**
   * 格式化日期
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * 计算百分比
   */
  private calculatePercentage(value: number, total: number): string {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }
}

// 导出单例
export const reportGenerator = new ReportGenerator()
