/**
 * 法规更新提醒系统 - 检测规则引擎
 */

import { RegulationAlert, RegulationAlertRule, AlertSeverity } from './alerts-config'

/**
 * 法规更新检测规则
 */
export const regulationAlertRules: RegulationAlertRule[] = [
  {
    id: 'new_regulation',
    name: '新法规发布',
    description: '新发布的法规（生效日期在未来或刚过去30天内）',
    condition: (regulation, lastSync) => {
      const effectiveDate = new Date(regulation.effective_date)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // 新法规：生效日期在过去30天内或未来
      return (effectiveDate >= thirtyDaysAgo && effectiveDate <= now) ||
             (effectiveDate > now && effectiveDate < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000))
    },
    severity: 'HIGH',
    message: (regulation) => `新法规已发布：${regulation.title}，生效日期 ${regulation.effective_date}`,
    alertType: 'NEW'
  },
  
  {
    id: 'expiring_soon',
    name: '法规即将到期',
    description: '法规即将在30天内到期',
    condition: (regulation) => {
      const effectiveDate = new Date(regulation.effective_date)
      const now = new Date()
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      // 已过期或即将到期
      return effectiveDate < now && effectiveDate > new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    },
    severity: 'MEDIUM',
    message: (regulation) => `法规即将到期：${regulation.title}，生效日期 ${regulation.effective_date}`,
    alertType: 'EXPIRED'
  },
  
  {
    id: 'recently_updated',
    name: '法规近期更新',
    description: '法规在最近7天内被更新',
    condition: (regulation, lastSync) => {
      if (!regulation.scraped_at) return false
      const scrapedDate = new Date(regulation.scraped_at)
      const sevenDaysAgo = new Date(lastSync.getTime() - 7 * 24 * 60 * 60 * 1000)
      return scrapedDate > sevenDaysAgo
    },
    severity: 'LOW',
    message: (regulation) => `法规近期更新：${regulation.title}`,
    alertType: 'UPDATED'
  },
  
  {
    id: 'high_priority_market',
    name: '重要市场新法规',
    description: '来自重要市场（US, EU, CN）的新法规',
    condition: (regulation) => {
      const priorityMarkets = ['US', 'EU', 'CN']
      const effectiveDate = new Date(regulation.effective_date)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      return priorityMarkets.includes(regulation.jurisdiction) &&
             effectiveDate >= thirtyDaysAgo && effectiveDate <= now
    },
    severity: 'HIGH',
    message: (regulation) => `重要市场新法规：${regulation.jurisdiction} - ${regulation.title}`,
    alertType: 'NEW'
  },
  
  {
    id: 'quality_system_update',
    name: '质量体系法规更新',
    description: '质量体系相关法规的更新',
    condition: (regulation) => {
      const qualityCategories = ['Quality System', 'QMS', 'Quality', 'CAPA', 'Design Control']
      return qualityCategories.some(category => 
        regulation.category?.includes(category) || 
        regulation.keywords?.some((k: string) => k.toLowerCase().includes('quality'))
      )
    },
    severity: 'HIGH',
    message: (regulation) => `质量体系法规更新：${regulation.title}`,
    alertType: 'UPDATED'
  },
  
  {
    id: 'clinical_update',
    name: '临床相关法规更新',
    description: '临床研究和临床评价相关法规的更新',
    condition: (regulation) => {
      const clinicalKeywords = ['clinical', 'clinical study', 'evaluation', 'investigation']
      return regulation.keywords?.some((k: string) => 
        clinicalKeywords.some(keyword => k.toLowerCase().includes(keyword))
      )
    },
    severity: 'MEDIUM',
    message: (regulation) => `临床法规更新：${regulation.title}`,
    alertType: 'UPDATED'
  }
]

/**
 * 检测法规更新
 */
export function detectRegulationUpdates(
  regulations: unknown[],
  lastSync: Date
): RegulationAlert[] {
  const alerts: RegulationAlert[] = []
  
  for (const regulation of regulations) {
    for (const rule of regulationAlertRules) {
      if (rule.condition(regulation, lastSync)) {
        const alert: RegulationAlert = {
          id: `${regulation.title}-${rule.id}-${regulation.jurisdiction}`,
          regulation_id: regulation.title,
          title: regulation.title,
          jurisdiction: regulation.jurisdiction,
          alert_type: rule.alertType,
          message: typeof rule.message === 'function' 
            ? rule.message(regulation) 
            : rule.message,
          detected_at: new Date().toISOString(),
          severity: rule.severity,
          metadata: {
            regulation_type: regulation.type,
            category: regulation.category,
            keywords: regulation.keywords
          }
        }
        
        // 避免重复添加
        const exists = alerts.find(a => a.id === alert.id)
        if (!exists) {
          alerts.push(alert)
        }
      }
    }
  }
  
  // 按严重程度排序
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
  }
  
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * 过滤高优先级提醒
 */
export function getHighPriorityAlerts(alerts: RegulationAlert[]): RegulationAlert[] {
  return alerts.filter(alert => alert.severity === 'HIGH' || alert.severity === 'CRITICAL')
}

/**
 * 按市场分组提醒
 */
export function groupAlertsByMarket(alerts: RegulationAlert[]): Record<string, RegulationAlert[]> {
  const grouped: Record<string, RegulationAlert[]> = {}
  
  for (const alert of alerts) {
    if (!grouped[alert.jurisdiction]) {
      grouped[alert.jurisdiction] = []
    }
    grouped[alert.jurisdiction].push(alert)
  }
  
  return grouped
}

/**
 * 生成提醒摘要
 */
export function generateAlertSummary(alerts: RegulationAlert[]): string {
  const total = alerts.length
  const highPriority = alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length
  const byType: Record<string, number> = {}
  const byMarket: Record<string, number> = {}
  
  for (const alert of alerts) {
    byType[alert.alert_type] = (byType[alert.alert_type] || 0) + 1
    byMarket[alert.jurisdiction] = (byMarket[alert.jurisdiction] || 0) + 1
  }
  
  let summary = `📊 法规更新提醒摘要\n`
  summary += `━━━━━━━━━━━━━━━━━━━━\n`
  summary += `总提醒数: ${total}\n`
  summary += `高优先级: ${highPriority}\n\n`
  summary += `按类型:\n`
  
  for (const [type, count] of Object.entries(byType)) {
    summary += `  ${type}: ${count}\n`
  }
  
  summary += `\n按市场:\n`
  for (const [market, count] of Object.entries(byMarket)) {
    summary += `  ${market}: ${count}\n`
  }
  
  return summary
}
