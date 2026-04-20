'use client'

/**
 * 企业风险雷达组件
 * 
 * 任务Q-001: 企业详情页重构 - 风险雷达
 * 展示制造商的多维度风险评估
 */

import { useMemo } from 'react'
import { AlertTriangle, Shield, CheckCircle, Info } from 'lucide-react'
import { ManufacturerCreditScore } from '@/lib/database/enhanced-types'

interface CompanyRiskRadarProps {
  creditScore: ManufacturerCreditScore
  className?: string
}

export function CompanyRiskRadar({ creditScore, className = '' }: CompanyRiskRadarProps) {
  const dimensions = useMemo(() => {
    return [
      {
        name: '合规历史',
        score: creditScore.dimensions.compliance_history.score,
        weight: 40,
        icon: Shield,
        color: getScoreColor(creditScore.dimensions.compliance_history.score),
        details: [
          `总认证数: ${creditScore.dimensions.compliance_history.total_certifications}`,
          `活跃认证: ${creditScore.dimensions.compliance_history.active_certifications}`,
          `平均认证时长: ${creditScore.dimensions.compliance_history.avg_certification_duration_days}天`,
        ],
      },
      {
        name: '风险事件',
        score: creditScore.dimensions.risk_events.score,
        weight: 30,
        icon: AlertTriangle,
        color: getScoreColor(creditScore.dimensions.risk_events.score),
        details: [
          `召回次数: ${creditScore.dimensions.risk_events.recalls_count}`,
          `警告信: ${creditScore.dimensions.risk_events.warning_letters_count}`,
          `进口警报: ${creditScore.dimensions.risk_events.import_alerts_count}`,
        ],
      },
      {
        name: '活跃度',
        score: creditScore.dimensions.activity.score,
        weight: 20,
        icon: CheckCircle,
        color: getScoreColor(creditScore.dimensions.activity.score),
        details: [
          `近一年认证: ${creditScore.dimensions.activity.certifications_last_year}`,
          `新市场数: ${creditScore.dimensions.activity.new_markets_last_year}`,
        ],
      },
      {
        name: '多样性',
        score: creditScore.dimensions.diversity.score,
        weight: 10,
        icon: Info,
        color: getScoreColor(creditScore.dimensions.diversity.score),
        details: [
          `覆盖市场: ${creditScore.dimensions.diversity.market_count}`,
          `产品类别: ${creditScore.dimensions.diversity.product_category_count}`,
          `认证类型: ${creditScore.dimensions.diversity.certification_type_count}`,
        ],
      },
    ]
  }, [creditScore])

  const overallScore = creditScore.overall_score
  const riskLevel = creditScore.risk_level
  const riskLevelText = {
    low: { text: '低风险', color: 'text-green-600', bgColor: 'bg-green-100' },
    medium: { text: '中风险', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    high: { text: '高风险', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    critical: { text: '极高风险', color: 'text-red-600', bgColor: 'bg-red-100' },
  }[riskLevel]

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* 头部：总体评分 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">风险雷达</h3>
          <p className="text-sm text-gray-500">基于多维度数据的综合评估</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskLevelText.bgColor} ${riskLevelText.color}`}>
            {riskLevelText.text}
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {overallScore}
            <span className="text-lg text-gray-400">/100</span>
          </div>
        </div>
      </div>

      {/* 风险因素提示 */}
      {creditScore.risk_factors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">风险提示</h4>
              <ul className="mt-1 text-sm text-red-700">
                {creditScore.risk_factors.map((factor, index) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 四维度评分 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map((dimension) => {
          const Icon = dimension.icon
          return (
            <div
              key={dimension.name}
              className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${dimension.color.bg}`}>
                    <Icon className={`w-5 h-5 ${dimension.color.text}`} />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{dimension.name}</h4>
                    <span className="text-xs text-gray-500">权重 {dimension.weight}%</span>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${dimension.color.text}`}>
                  {dimension.score}
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${dimension.color.bar}`}
                  style={{ width: `${dimension.score}%` }}
                />
              </div>

              {/* 详情 */}
              <div className="space-y-1">
                {dimension.details.map((detail, index) => (
                  <p key={index} className="text-xs text-gray-500">{detail}</p>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 计算时间 */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-right">
        评分计算时间: {new Date(creditScore.last_calculated).toLocaleString('zh-CN')}
      </div>
    </div>
  )
}

// 根据分数获取颜色配置
function getScoreColor(score: number) {
  if (score >= 80) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-100',
      bar: 'bg-green-500',
    }
  } else if (score >= 60) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      bar: 'bg-yellow-500',
    }
  } else if (score >= 40) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-100',
      bar: 'bg-orange-500',
    }
  } else {
    return {
      text: 'text-red-600',
      bg: 'bg-red-100',
      bar: 'bg-red-500',
    }
  }
}
