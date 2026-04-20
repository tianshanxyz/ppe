/**
 * 合规风险监控系统
 * 
 * 任务A-002: 合规风险预警功能
 * 监控产品认证过期、召回、法规变更等风险
 */

import { createClient } from '@/lib/supabase/server'
import { EnhancedPPEProduct, EnhancedPPEManufacturer } from '@/lib/database/enhanced-types'

// ============================================
// 风险类型定义
// ============================================

export type RiskType = 
  | 'certification_expiry'      // 认证即将过期
  | 'certification_expired'     // 认证已过期
  | 'product_recall'            // 产品召回
  | 'warning_letter'            // 警告信
  | 'regulation_change'         // 法规变更
  | 'new_competitor'            // 新竞争对手
  | 'market_withdrawal'         // 市场撤回
  | 'import_alert'              // 进口警报

export interface RiskAlert {
  id: string
  type: RiskType
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  entityType: 'product' | 'manufacturer' | 'regulation'
  entityId: string
  entityName: string
  details: Record<string, any>
  detectedAt: string
  expiresAt?: string
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  relatedAlerts?: string[]
}

export interface RiskMonitorConfig {
  certificationExpiryDays: number      // 提前多少天预警认证过期
  checkIntervalHours: number           // 检查间隔
  enabledRiskTypes: RiskType[]
  notificationChannels: ('email' | 'webhook' | 'in_app')[]
}

// ============================================
// 风险监控器
// ============================================

export class ComplianceRiskMonitor {
  private config: RiskMonitorConfig

  constructor(config: Partial<RiskMonitorConfig> = {}) {
    this.config = {
      certificationExpiryDays: 90,
      checkIntervalHours: 24,
      enabledRiskTypes: [
        'certification_expiry',
        'certification_expired',
        'product_recall',
        'warning_letter',
        'regulation_change',
      ],
      notificationChannels: ['in_app'],
      ...config,
    }
  }

  // ============================================
  // 认证过期风险检查
  // ============================================

  /**
   * 检查即将过期的认证
   */
  async checkExpiringCertifications(): Promise<RiskAlert[]> {
    const supabase = await createClient()
    const alerts: RiskAlert[] = []
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + this.config.certificationExpiryDays)

    // 查询即将过期的产品
    const { data: products, error } = await supabase
      .from('ppe_products_enhanced')
      .select('*')
      .lte('expiry_date', expiryDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .eq('registration_status', 'active')

    if (error || !products) {
      console.error('查询即将过期产品失败:', error)
      return alerts
    }

    for (const product of products) {
      const daysUntilExpiry = Math.ceil(
        (new Date(product.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      const severity = daysUntilExpiry <= 30 ? 'critical' : 
                      daysUntilExpiry <= 60 ? 'high' : 'medium'

      alerts.push({
        id: `expiry-${product.id}`,
        type: 'certification_expiry',
        severity,
        title: `认证即将过期: ${product.product_name}`,
        description: `该产品认证将在 ${daysUntilExpiry} 天后过期（${new Date(product.expiry_date).toLocaleDateString('zh-CN')}）`,
        entityType: 'product',
        entityId: product.id,
        entityName: product.product_name,
        details: {
          expiryDate: product.expiry_date,
          daysUntilExpiry,
          certificationNumber: product.certifications?.fda_510k?.k_number || 
                              product.certifications?.ce?.certificate_number,
        },
        detectedAt: new Date().toISOString(),
        expiresAt: product.expiry_date,
        status: 'active',
      })
    }

    return alerts
  }

  /**
   * 检查已过期的认证
   */
  async checkExpiredCertifications(): Promise<RiskAlert[]> {
    const supabase = await createClient()
    const alerts: RiskAlert[] = []

    const { data: products, error } = await supabase
      .from('ppe_products_enhanced')
      .select('*')
      .lt('expiry_date', new Date().toISOString())
      .eq('registration_status', 'active')

    if (error || !products) {
      console.error('查询已过期产品失败:', error)
      return alerts
    }

    for (const product of products) {
      const daysExpired = Math.floor(
        (Date.now() - new Date(product.expiry_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      alerts.push({
        id: `expired-${product.id}`,
        type: 'certification_expired',
        severity: 'critical',
        title: `认证已过期: ${product.product_name}`,
        description: `该产品认证已过期 ${daysExpired} 天，请立即续期`,
        entityType: 'product',
        entityId: product.id,
        entityName: product.product_name,
        details: {
          expiryDate: product.expiry_date,
          daysExpired,
          certificationNumber: product.certifications?.fda_510k?.k_number || 
                              product.certifications?.ce?.certificate_number,
        },
        detectedAt: new Date().toISOString(),
        status: 'active',
      })
    }

    return alerts
  }

  // ============================================
  // 制造商风险检查
  // ============================================

  /**
   * 检查制造商风险事件
   */
  async checkManufacturerRisks(): Promise<RiskAlert[]> {
    const supabase = await createClient()
    const alerts: RiskAlert[] = []

    // 查询有召回记录的制造商
    const { data: manufacturers, error } = await supabase
      .from('ppe_manufacturers_enhanced')
      .select('*')
      .filter('compliance_stats->recalls_history->total_recalls', 'gt', 0)

    if (error || !manufacturers) {
      console.error('查询制造商风险失败:', error)
      return alerts
    }

    for (const mfg of manufacturers) {
      const stats = mfg.compliance_stats as any
      
      if (stats.recalls_history?.total_recalls > 0) {
        alerts.push({
          id: `recall-${mfg.id}`,
          type: 'product_recall',
          severity: 'high',
          title: `召回警告: ${mfg.company_name}`,
          description: `该制造商有 ${stats.recalls_history.total_recalls} 次召回记录`,
          entityType: 'manufacturer',
          entityId: mfg.id,
          entityName: mfg.company_name,
          details: {
            totalRecalls: stats.recalls_history.total_recalls,
            lastRecallDate: stats.recalls_history.last_recall_date,
          },
          detectedAt: new Date().toISOString(),
          status: 'active',
        })
      }

      if (stats.warning_letters?.total > 0) {
        alerts.push({
          id: `warning-${mfg.id}`,
          type: 'warning_letter',
          severity: stats.warning_letters.open_count > 0 ? 'critical' : 'medium',
          title: `警告信: ${mfg.company_name}`,
          description: `该制造商有 ${stats.warning_letters.total} 封警告信${
            stats.warning_letters.open_count > 0 ? `，其中 ${stats.warning_letters.open_count} 封未关闭` : ''
          }`,
          entityType: 'manufacturer',
          entityId: mfg.id,
          entityName: mfg.company_name,
          details: {
            totalWarnings: stats.warning_letters.total,
            openCount: stats.warning_letters.open_count,
          },
          detectedAt: new Date().toISOString(),
          status: 'active',
        })
      }
    }

    return alerts
  }

  // ============================================
  // 法规变更检查
  // ============================================

  /**
   * 检查法规变更
   */
  async checkRegulationChanges(): Promise<RiskAlert[]> {
    const supabase = await createClient()
    const alerts: RiskAlert[] = []

    // 查询最近更新的法规
    const lastCheckDate = new Date()
    lastCheckDate.setDate(lastCheckDate.getDate() - 7) // 最近7天

    const { data: regulations, error } = await supabase
      .from('ppe_regulations')
      .select('*')
      .gte('updated_at', lastCheckDate.toISOString())

    if (error || !regulations) {
      console.error('查询法规变更失败:', error)
      return alerts
    }

    for (const reg of regulations) {
      alerts.push({
        id: `regulation-${reg.id}`,
        type: 'regulation_change',
        severity: 'medium',
        title: `法规更新: ${reg.title}`,
        description: `该法规最近有更新，可能影响相关产品合规`,
        entityType: 'regulation',
        entityId: reg.id,
        entityName: reg.title,
        details: {
          regulationNumber: reg.regulation_number,
          effectiveDate: reg.effective_date,
          jurisdiction: reg.jurisdiction,
        },
        detectedAt: new Date().toISOString(),
        status: 'active',
      })
    }

    return alerts
  }

  // ============================================
  // 综合风险扫描
  // ============================================

  /**
   * 执行完整风险扫描
   */
  async runFullScan(): Promise<RiskAlert[]> {
    const allAlerts: RiskAlert[] = []

    if (this.config.enabledRiskTypes.includes('certification_expiry')) {
      const expiringAlerts = await this.checkExpiringCertifications()
      allAlerts.push(...expiringAlerts)
    }

    if (this.config.enabledRiskTypes.includes('certification_expired')) {
      const expiredAlerts = await this.checkExpiredCertifications()
      allAlerts.push(...expiredAlerts)
    }

    if (this.config.enabledRiskTypes.includes('product_recall') || 
        this.config.enabledRiskTypes.includes('warning_letter')) {
      const manufacturerAlerts = await this.checkManufacturerRisks()
      allAlerts.push(...manufacturerAlerts)
    }

    if (this.config.enabledRiskTypes.includes('regulation_change')) {
      const regulationAlerts = await this.checkRegulationChanges()
      allAlerts.push(...regulationAlerts)
    }

    // 按严重程度排序
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return allAlerts
  }
}

// ============================================
// 用户预警配置管理
// ============================================

export interface UserAlertConfig {
  id: string
  userId: string
  alertName: string
  alertType: RiskType
  entityType: 'product' | 'manufacturer' | 'regulation' | 'all'
  entityId?: string
  conditions: {
    severity?: ('critical' | 'high' | 'medium' | 'low')[]
    daysBeforeExpiry?: number
    markets?: string[]
    categories?: string[]
  }
  notificationChannels: ('email' | 'webhook' | 'in_app')[]
  email?: string
  webhookUrl?: string
  isActive: boolean
  createdAt: string
  lastTriggeredAt?: string
  triggerCount: number
}

/**
 * 创建用户预警配置
 */
export async function createUserAlertConfig(
  config: Omit<UserAlertConfig, 'id' | 'createdAt' | 'triggerCount'>
): Promise<UserAlertConfig | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_alerts')
    .insert({
      ...config,
      trigger_count: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('创建预警配置失败:', error)
    return null
  }

  return data as UserAlertConfig
}

/**
 * 获取用户预警配置
 */
export async function getUserAlertConfigs(userId: string): Promise<UserAlertConfig[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取预警配置失败:', error)
    return []
  }

  return data as UserAlertConfig[]
}

/**
 * 更新预警配置
 */
export async function updateUserAlertConfig(
  alertId: string,
  updates: Partial<UserAlertConfig>
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_alerts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) {
    console.error('更新预警配置失败:', error)
    return false
  }

  return true
}

/**
 * 删除预警配置
 */
export async function deleteUserAlertConfig(alertId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_alerts')
    .delete()
    .eq('id', alertId)

  if (error) {
    console.error('删除预警配置失败:', error)
    return false
  }

  return true
}

// ============================================
// 预警通知服务
// ============================================

export class AlertNotificationService {
  /**
   * 发送应用内通知
   */
  async sendInAppNotification(userId: string, alert: RiskAlert): Promise<void> {
    const supabase = await createClient()

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'risk_alert',
      title: alert.title,
      content: alert.description,
      data: alert,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(email: string, alert: RiskAlert): Promise<void> {
    // TODO: 集成邮件服务（SendGrid/Resend）
    console.log(`[Email] 发送预警邮件到 ${email}: ${alert.title}`)
  }

  /**
   * 发送Webhook通知
   */
  async sendWebhookNotification(webhookUrl: string, alert: RiskAlert): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'risk_alert',
          timestamp: new Date().toISOString(),
          alert,
        }),
      })
    } catch (error) {
      console.error('Webhook通知失败:', error)
    }
  }
}

// ============================================
// 导出
// ============================================

export {
  RiskType,
  RiskAlert,
  RiskMonitorConfig,
  UserAlertConfig,
}
