/**
 * 制造商信用评分解释器
 *
 * 生成可解释的评分报告和改进建议
 * A-001: 制造商信用评分算法
 */

import {
  ManufacturerCreditScore,
  ScoreExplanation,
  DimensionExplanation,
  Recommendation,
  ComplianceHistoryDetail,
  RiskEventsDetail,
  ActivityDetail,
  DiversityDetail,
} from './types'

// ============================================
// 评分解释器
// ============================================

export class ScoreExplainer {
  /**
   * 生成评分解释
   */
  explain(score: ManufacturerCreditScore): ScoreExplanation {
    return {
      summary: this.generateSummary(score),
      overall_assessment: this.generateOverallAssessment(score),

      dimension_explanations: {
        compliance_history: this.explainComplianceHistory(score.dimensions.compliance_history, score.weights.compliance_history),
        risk_events: this.explainRiskEvents(score.dimensions.risk_events, score.weights.risk_events),
        activity: this.explainActivity(score.dimensions.activity, score.weights.activity),
        diversity: this.explainDiversity(score.dimensions.diversity, score.weights.diversity),
      },

      key_strengths: this.identifyKeyStrengths(score),
      key_concerns: this.identifyKeyConcerns(score),
      recommendations: this.generateRecommendations(score),

      comparison_summary: this.generateComparisonSummary(score),
      trend_summary: this.generateTrendSummary(score),
    }
  }

  /**
   * 生成总体摘要
   */
  private generateSummary(score: ManufacturerCreditScore): string {
    const { overall_score, risk_level } = score

    let riskDescription = ''
    switch (risk_level) {
      case 'low':
        riskDescription = '低风险'
        break
      case 'medium':
        riskDescription = '中等风险'
        break
      case 'high':
        riskDescription = '高风险'
        break
      case 'critical':
        riskDescription = '极高风险'
        break
    }

    return `该制造商信用评分为 ${overall_score} 分（满分100），属于${riskDescription}等级。` +
           `在同类制造商中排名前 ${100 - score.industry_comparison.percentile}%。` +
           `最近评分趋势呈${score.trend_direction === 'improving' ? '上升' : score.trend_direction === 'declining' ? '下降' : '稳定'}态势。`
  }

  /**
   * 生成总体评估
   */
  private generateOverallAssessment(score: ManufacturerCreditScore): string {
    const assessments: string[] = []

    // 基于总分评估
    if (score.overall_score >= 80) {
      assessments.push('该制造商展现出优秀的合规记录和稳定的业务表现，是值得信赖的合作伙伴。')
    } else if (score.overall_score >= 60) {
      assessments.push('该制造商整体表现良好，但在某些方面仍有改进空间。')
    } else if (score.overall_score >= 40) {
      assessments.push('该制造商存在一定的合规风险，建议加强尽职调查。')
    } else {
      assessments.push('该制造商存在严重的合规问题，建议谨慎合作。')
    }

    // 基于各维度评估
    const dims = score.dimensions
    if (dims.compliance_history.score >= 80) {
      assessments.push('其长期合规历史表明具有良好的质量管理能力。')
    }
    if (dims.risk_events.score < 60) {
      assessments.push('近期发生的合规事件需要特别关注。')
    }
    if (dims.activity.score >= 80) {
      assessments.push('持续的新认证活动显示出积极的市场拓展态势。')
    }
    if (dims.diversity.score >= 70) {
      assessments.push('多元化的市场布局降低了单一市场风险。')
    }

    return assessments.join('')
  }

  /**
   * 解释合规历史维度
   */
  private explainComplianceHistory(detail: ComplianceHistoryDetail, weight: number): DimensionExplanation {
    const maxScore = 100
    const weightedContribution = Math.round(detail.score * weight)

    const keyMetrics = [
      {
        label: '总认证数',
        value: detail.total_certifications.toString(),
        impact: detail.total_certifications >= 5 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '活跃认证',
        value: `${detail.active_certifications}/${detail.total_certifications}`,
        impact: detail.active_certifications / Math.max(detail.total_certifications, 1) > 0.8 ? 'positive' as const : 'negative' as const,
      },
      {
        label: '平均认证时长',
        value: `${Math.round(detail.avg_certification_duration_days / 365)}年`,
        impact: detail.avg_certification_duration_days > 365 * 2 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '认证趋势',
        value: detail.certification_trend === 'increasing' ? '上升' : detail.certification_trend === 'decreasing' ? '下降' : '稳定',
        impact: detail.certification_trend === 'increasing' ? 'positive' as const : detail.certification_trend === 'decreasing' ? 'negative' as const : 'neutral' as const,
      },
    ]

    let explanation = ''
    if (detail.score >= 80) {
      explanation = `表现优秀。拥有${detail.total_certifications}个认证，其中${detail.active_certifications}个处于活跃状态，` +
                    `平均认证持续时间超过${Math.round(detail.avg_certification_duration_days / 365)}年。`
    } else if (detail.score >= 60) {
      explanation = `表现良好。合规历史较为稳定，但仍有提升空间。`
    } else {
      explanation = `需要改进。存在${detail.revoked_certifications}个被撤销的认证，建议关注合规管理。`
    }

    return {
      score: detail.score,
      max_score: maxScore,
      weight,
      weighted_contribution: weightedContribution,
      explanation,
      key_metrics: keyMetrics,
      details: `合规历史分占总分的${Math.round(weight * 100)}%，主要考察认证数量、活跃度和持续时间。`,
    }
  }

  /**
   * 解释风险事件维度
   */
  private explainRiskEvents(detail: RiskEventsDetail, weight: number): DimensionExplanation {
    const maxScore = 100
    const weightedContribution = Math.round(detail.score * weight)

    const keyMetrics = [
      {
        label: '召回次数',
        value: detail.recalls_count.toString(),
        impact: detail.recalls_count === 0 ? 'positive' as const : detail.recalls_count > 2 ? 'negative' as const : 'neutral' as const,
      },
      {
        label: '警告信',
        value: detail.warning_letters_count.toString(),
        impact: detail.warning_letters_count === 0 ? 'positive' as const : 'negative' as const,
      },
      {
        label: '进口警报',
        value: detail.import_alerts_count.toString(),
        impact: detail.import_alerts_count === 0 ? 'positive' as const : 'negative' as const,
      },
      {
        label: '事件趋势',
        value: detail.incidents_trend === 'improving' ? '改善' : detail.incidents_trend === 'worsening' ? '恶化' : '稳定',
        impact: detail.incidents_trend === 'improving' ? 'positive' as const : detail.incidents_trend === 'worsening' ? 'negative' as const : 'neutral' as const,
      },
    ]

    let explanation = ''
    if (detail.score >= 80) {
      explanation = '表现优秀。无重大合规事件记录，风险管理良好。'
    } else if (detail.score >= 60) {
      explanation = `表现一般。发生过${detail.recalls_count}次召回和${detail.warning_letters_count}次警告信，需要关注。`
    } else {
      explanation = `风险较高。存在${detail.recalls_count}次召回记录和${detail.warning_letters_count}次警告信，建议谨慎评估。`
    }

    return {
      score: detail.score,
      max_score: maxScore,
      weight,
      weighted_contribution: weightedContribution,
      explanation,
      key_metrics: keyMetrics,
      details: `风险事件分占总分的${Math.round(weight * 100)}%，主要考察召回、警告信等负面事件。`,
    }
  }

  /**
   * 解释活跃度维度
   */
  private explainActivity(detail: ActivityDetail, weight: number): DimensionExplanation {
    const maxScore = 100
    const weightedContribution = Math.round(detail.score * weight)

    const keyMetrics = [
      {
        label: '去年新认证',
        value: detail.certifications_last_year.toString(),
        impact: detail.certifications_last_year >= 3 ? 'positive' as const : detail.certifications_last_year === 0 ? 'negative' as const : 'neutral' as const,
      },
      {
        label: '近 6 个月',
        value: detail.certifications_last_6_months.toString(),
        impact: detail.certifications_last_6_months >= 2 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '新市场',
        value: detail.new_markets_last_year.toString(),
        impact: detail.new_markets_last_year > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '活跃频率',
        value: detail.activity_frequency === 'high' ? '高' : detail.activity_frequency === 'medium' ? '中' : '低',
        impact: detail.activity_frequency === 'high' ? 'positive' as const : detail.activity_frequency === 'low' ? 'negative' as const : 'neutral' as const,
      },
    ]

    let explanation = ''
    if (detail.score >= 80) {
      explanation = `表现优秀。去年获得${detail.certifications_last_year}个新认证，市场拓展活跃。`
    } else if (detail.score >= 60) {
      explanation = `表现良好。保持适度的认证活动，建议继续增加新产品。`
    } else {
      explanation = `活跃度较低。过去一年仅有${detail.certifications_last_year}个新认证，可能处于业务收缩期。`
    }

    return {
      score: detail.score,
      max_score: maxScore,
      weight,
      weighted_contribution: weightedContribution,
      explanation,
      key_metrics: keyMetrics,
      details: `活跃度分占总分的${Math.round(weight * 100)}%，主要考察近期认证活动和市场拓展。`,
    }
  }

  /**
   * 解释多样性维度
   */
  private explainDiversity(detail: DiversityDetail, weight: number): DimensionExplanation {
    const maxScore = 100
    const weightedContribution = Math.round(detail.score * weight)

    const keyMetrics = [
      {
        label: '覆盖市场',
        value: detail.market_count.toString(),
        impact: detail.market_count >= 3 ? 'positive' as const : detail.market_count === 1 ? 'negative' as const : 'neutral' as const,
      },
      {
        label: '产品类别',
        value: detail.product_category_count.toString(),
        impact: detail.product_category_count >= 2 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '认证类型',
        value: detail.certification_type_count.toString(),
        impact: detail.certification_type_count >= 2 ? 'positive' as const : 'neutral' as const,
      },
      {
        label: '监管框架',
        value: detail.regulatory_frameworks.join(', ') || '无',
        impact: detail.regulatory_frameworks.length >= 2 ? 'positive' as const : 'neutral' as const,
      },
    ]

    let explanation = ''
    if (detail.score >= 80) {
      explanation = `表现优秀。覆盖${detail.market_count}个国际市场，产品类别多元化。`
    } else if (detail.score >= 60) {
      explanation = `表现良好。在${detail.market_count}个市场开展业务，建议继续拓展。`
    } else {
      explanation = `市场覆盖有限。目前仅在${detail.market_count}个市场开展业务，建议考虑市场多元化。`
    }

    return {
      score: detail.score,
      max_score: maxScore,
      weight,
      weighted_contribution: weightedContribution,
      explanation,
      key_metrics: keyMetrics,
      details: `多样性分占总分的${Math.round(weight * 100)}%，主要考察市场覆盖广度和产品多样性。`,
    }
  }

  /**
   * 识别关键优势
   */
  private identifyKeyStrengths(score: ManufacturerCreditScore): string[] {
    const strengths: string[] = []
    const dims = score.dimensions

    if (dims.compliance_history.score >= 80) {
      strengths.push(`拥有${dims.compliance_history.total_certifications}个认证，合规历史优秀`)
    }
    if (dims.risk_events.score >= 90) {
      strengths.push('无召回记录和警告信，风险管理优秀')
    }
    if (dims.activity.score >= 80) {
      strengths.push(`去年获得${dims.activity.certifications_last_year}个新认证，业务活跃`)
    }
    if (dims.diversity.score >= 70) {
      strengths.push(`覆盖${dims.diversity.market_count}个国际市场，市场多元化`)
    }
    if (dims.compliance_history.avg_certification_duration_days > 365 * 3) {
      strengths.push(`平均认证持续时间超过3年，稳定性强`)
    }

    return strengths.length > 0 ? strengths : ['整体表现平稳']
  }

  /**
   * 识别关键风险
   */
  private identifyKeyConcerns(score: ManufacturerCreditScore): string[] {
    const concerns: string[] = []
    const dims = score.dimensions

    if (dims.risk_events.recalls_count > 0) {
      concerns.push(`有${dims.risk_events.recalls_count}次产品召回记录`)
    }
    if (dims.risk_events.warning_letters_count > 0) {
      concerns.push(`收到${dims.risk_events.warning_letters_count}封警告信`)
    }
    if (dims.compliance_history.revoked_certifications > 0) {
      concerns.push(`${dims.compliance_history.revoked_certifications}个认证被撤销`)
    }
    if (dims.activity.certifications_last_year === 0) {
      concerns.push('过去一年无新认证，业务活动停滞')
    }
    if (dims.diversity.market_count === 1) {
      concerns.push('仅覆盖单一市场，存在集中度风险')
    }

    return concerns.length > 0 ? concerns : ['未发现重大风险']
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(score: ManufacturerCreditScore): Recommendation[] {
    const recommendations: Recommendation[] = []
    const dims = score.dimensions

    // 基于风险事件的建议
    if (dims.risk_events.recalls_count > 0 || dims.risk_events.warning_letters_count > 0) {
      recommendations.push({
        priority: 'high',
        category: 'risk_management',
        title: '加强质量管理体系',
        description: '针对历史召回和警告信，建议全面审查质量管理体系，实施纠正和预防措施（CAPA）。',
        expected_impact: '预计可提升风险事件分15-25分',
        difficulty: 'hard',
      })
    }

    // 基于活跃度的建议
    if (dims.activity.certifications_last_year < 2) {
      recommendations.push({
        priority: 'medium',
        category: 'market_expansion',
        title: '增加新产品认证',
        description: '建议每年至少申请2-3个新产品认证，保持业务活跃度。',
        expected_impact: '预计可提升活跃度分20-30分',
        difficulty: 'medium',
      })
    }

    // 基于多样性的建议
    if (dims.diversity.market_count < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'market_expansion',
        title: '拓展国际市场',
        description: `当前仅覆盖${dims.diversity.market_count}个市场，建议考虑进入欧盟或日本等市场。`,
        expected_impact: '预计可提升多样性分15-20分',
        difficulty: 'hard',
      })
    }

    // 基于合规历史的建议
    if (dims.compliance_history.expired_certifications > 0) {
      recommendations.push({
        priority: 'high',
        category: 'compliance',
        title: '及时续期认证',
        description: `有${dims.compliance_history.expired_certifications}个认证已过期，建议尽快完成续期。`,
        expected_impact: '预计可提升合规历史分10-15分',
        difficulty: 'easy',
      })
    }

    // 通用建议
    if (recommendations.length < 3) {
      recommendations.push({
        priority: 'low',
        category: 'documentation',
        title: '完善数据记录',
        description: '建议完善产品和认证相关的文档记录，提高数据完整度。',
        expected_impact: '提升数据可信度',
        difficulty: 'easy',
      })
    }

    return recommendations
  }

  /**
   * 生成对比摘要
   */
  private generateComparisonSummary(score: ManufacturerCreditScore): string {
    const { percentile, average_score } = score.industry_comparison
    const diff = score.overall_score - average_score

    if (percentile >= 80) {
      return `该制造商表现优于${percentile}%的同行，属于行业前20%的优秀企业。`
    } else if (percentile >= 60) {
      return `该制造商表现优于${percentile}%的同行，高于行业平均水平${diff}分。`
    } else if (percentile >= 40) {
      return `该制造商表现处于行业中等水平，与平均水平相差${Math.abs(diff)}分。`
    } else {
      return `该制造商表现低于行业平均水平，有较大的改进空间。`
    }
  }

  /**
   * 生成趋势摘要
   */
  private generateTrendSummary(score: ManufacturerCreditScore): string {
    const { trend_direction, trend_percentage } = score

    if (trend_direction === 'improving') {
      return `评分呈上升趋势，较上期提升${trend_percentage}%，表现持续改善。`
    } else if (trend_direction === 'declining') {
      return `评分呈下降趋势，较上期下降${Math.abs(trend_percentage)}%，需要关注。`
    } else {
      return '评分保持稳定，近期无显著变化。'
    }
  }
}

// 导出单例
export const scoreExplainer = new ScoreExplainer()
